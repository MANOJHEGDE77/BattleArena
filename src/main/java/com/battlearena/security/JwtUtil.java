package com.battlearena.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Transparent, self-contained RFC 7519 JSON Web Token (JWT) Utility.
 *
 * Implements HMAC-SHA256 (HS256) signature and verification directly with Java standard cryptography
 * (javax.crypto.Mac) and Jackson ObjectMapper.
 *
 * Why this is implemented cleanly without heavy third-party JWT libraries:
 * 1. Zero extra JAR dependencies - avoids transitive library bloat and version conflicts.
 * 2. Maximum educational clarity - reveals the exact mechanics of Header.Payload.Signature encoding.
 * 3. Constant-time signature verification prevents timing attacks (MessageDigest.isEqual).
 */
@Component
public class JwtUtil {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final String secret;
    private final long expirationMs;
    private final String encodedHeader;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.secret = secret;
        this.expirationMs = expirationMs;
        // Standard JWT header: {"alg":"HS256","typ":"JWT"}
        Map<String, String> headerMap = Map.of("alg", "HS256", "typ", "JWT");
        try {
            byte[] headerBytes = MAPPER.writeValueAsBytes(headerMap);
            this.encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(headerBytes);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize JWT header", e);
        }
    }

    /**
     * Generates a signed JWT token for the specified username and user ID.
     */
    public String generateToken(String username, Long userId) {
        long nowSeconds = Instant.now().getEpochSecond();
        long expSeconds = nowSeconds + (expirationMs / 1000);

        Map<String, Object> payloadMap = new HashMap<>();
        payloadMap.put("sub", username);
        payloadMap.put("userId", userId);
        payloadMap.put("iat", nowSeconds);
        payloadMap.put("exp", expSeconds);

        try {
            byte[] payloadBytes = MAPPER.writeValueAsBytes(payloadMap);
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadBytes);

            String signingInput = encodedHeader + "." + encodedPayload;
            String signature = sign(signingInput, secret);

            return signingInput + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate JWT token", e);
        }
    }

    /**
     * Validates whether a token is well-formed, correctly signed, and unexpired.
     */
    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }

        try {
            String signingInput = parts[0] + "." + parts[1];
            String expectedSignature = sign(signingInput, secret);

            // Constant-time comparison to prevent timing attacks
            byte[] expectedSigBytes = expectedSignature.getBytes(StandardCharsets.UTF_8);
            byte[] actualSigBytes = parts[2].getBytes(StandardCharsets.UTF_8);
            if (!MessageDigest.isEqual(expectedSigBytes, actualSigBytes)) {
                return false;
            }

            // Check expiration
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payloadNode = MAPPER.readTree(payloadBytes);
            if (!payloadNode.has("exp")) {
                return false;
            }

            long exp = payloadNode.get("exp").asLong();
            return Instant.now().getEpochSecond() < exp;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Extracts username ('sub' claim) from token if valid.
     */
    public String extractUsername(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payloadNode = MAPPER.readTree(payloadBytes);
            return payloadNode.has("sub") ? payloadNode.get("sub").asText() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extracts user ID ('userId' claim) from token if valid.
     */
    public Long extractUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payloadNode = MAPPER.readTree(payloadBytes);
            return payloadNode.has("userId") ? payloadNode.get("userId").asLong() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Computes HMAC-SHA256 signature encoded in Base64 URL safe without padding.
     */
    private String sign(String data, String key) throws Exception {
        Mac mac = Mac.getInstance(HMAC_ALGO);
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_ALGO);
        mac.init(secretKeySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
    }
}
