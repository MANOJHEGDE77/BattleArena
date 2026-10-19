package com.battlearena.service;

import com.battlearena.dto.AuthRequest;
import com.battlearena.dto.AuthResponse;
import com.battlearena.dto.UserProfileResponse;
import com.battlearena.exception.ResourceNotFoundException;
import com.battlearena.model.User;
import com.battlearena.repository.UserRepository;
import com.battlearena.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service orchestrating user authentication, credentials hashing, and MySQL persistence.
 *
 * Layer: Service (Business Logic Layer)
 * Responsibility: Enforces business validation rules (unique username, password length),
 * invokes BCrypt password encoder, interacts with UserRepository for database queries,
 * and calls JwtUtil to create authentication tokens.
 *
 * Who calls it: AuthController
 * What it calls: UserRepository, PasswordEncoder, JwtUtil
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Registers a new user account with BCrypt encrypted password.
     */
    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }

        String username = request.getUsername().trim();

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' is already taken");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(username, hashedPassword);
        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getId());
        return new AuthResponse(token, savedUser.getUsername(), savedUser.getId(), savedUser.getHighestScore(), "Registration successful");
    }

    /**
     * Authenticates an existing user and returns a signed JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Username and password are required");
        }

        String username = request.getUsername().trim();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        return new AuthResponse(token, user.getUsername(), user.getId(), user.getHighestScore(), "Login successful");
    }

    /**
     * Retrieves the profile and gameplay statistics of an authenticated user.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getTotalGames(),
                user.getTotalScore(),
                user.getHighestScore(),
                user.getXp(),
                user.getLevel(),
                user.getKills(),
                user.getDeaths(),
                user.getWins(),
                user.getEquippedTitle(),
                user.getEquippedTrail(),
                user.getUnlockedTitlesJson(),
                user.getUnlockedTrailsJson(),
                user.getWeaponMasteryJson(),
                user.getDailyChallengesJson(),
                user.getCreatedAt()
        );
    }

    /**
     * Retrieves the top 10 players globally ranked by career highest score.
     */
    @Transactional(readOnly = true)
    public java.util.List<com.battlearena.dto.LeaderboardEntryDTO> getLeaderboard() {
        java.util.List<User> topUsers = userRepository.findTop10ByOrderByHighestScoreDescTotalScoreDesc();
        java.util.concurrent.atomic.AtomicInteger rankCounter = new java.util.concurrent.atomic.AtomicInteger(1);

        return topUsers.stream()
                .map(u -> new com.battlearena.dto.LeaderboardEntryDTO(
                        rankCounter.getAndIncrement(),
                        u.getUsername(),
                        u.getHighestScore(),
                        u.getTotalScore(),
                        u.getTotalGames()
                ))
                .toList();
    }

    /**
     * Legacy signature: persists match score.
     */
    @Transactional
    public void recordMatchResult(String username, int matchScore) {
        recordMatchResult(username, matchScore, 0, 0, false, "ASSAULT");
    }

    /**
     * Persists full match results, calculates XP, levels, cosmetics, and weapon mastery.
     */
    @Transactional
    public void recordMatchResult(String username, int matchScore, int kills, int deaths, boolean won, String warriorClass) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setTotalGames(user.getTotalGames() + 1);
            user.setTotalScore(user.getTotalScore() + matchScore);
            if (matchScore > user.getHighestScore()) {
                user.setHighestScore(matchScore);
            }

            user.setKills(user.getKills() + kills);
            user.setDeaths(user.getDeaths() + deaths);
            if (won) {
                user.setWins(user.getWins() + 1);
            }

            int earnedXp = Math.max(50, (matchScore * 8) + (kills * 30) + (won ? 250 : 60));
            int newXp = user.getXp() + earnedXp;
            user.setXp(newXp);
            int newLevel = 1 + (newXp / 1000);
            user.setLevel(newLevel);

            // Progressive unlocks
            java.util.Set<String> titles = parseJsonArray(user.getUnlockedTitlesJson());
            java.util.Set<String> trails = parseJsonArray(user.getUnlockedTrailsJson());

            titles.add("Rookie Pilot");
            trails.add("CYAN_PULSE");

            if (newLevel >= 2) {
                titles.add("Cyber Scout");
                trails.add("EMERALD_SURGE");
            }
            if (newLevel >= 3) {
                titles.add("Vanguard Elite");
            }
            if (newLevel >= 5) {
                titles.add("Apex Champion");
                trails.add("CRIMSON_NEON");
            }
            if (newLevel >= 8) {
                titles.add("Cyber Overlord");
                trails.add("GOLDEN_VALOR");
            }
            if (user.getWins() >= 5) {
                titles.add("Arena Gladiator");
            }
            if (user.getWins() >= 10) {
                titles.add("Grandmaster");
            }

            user.setUnlockedTitlesJson(toJsonArray(titles));
            user.setUnlockedTrailsJson(toJsonArray(trails));

            // Weapon mastery tracking
            String masteryJson = updateWeaponMastery(user.getWeaponMasteryJson(), warriorClass, kills, won);
            user.setWeaponMasteryJson(masteryJson);

            userRepository.save(user);
        });
    }

    /**
     * Equips unlocked cosmetic titles or bullet trails.
     */
    @Transactional
    public UserProfileResponse equipCosmetics(String username, String title, String trail) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        java.util.Set<String> titles = parseJsonArray(user.getUnlockedTitlesJson());
        java.util.Set<String> trails = parseJsonArray(user.getUnlockedTrailsJson());

        if (title != null && !title.trim().isEmpty()) {
            String cleanTitle = title.trim();
            if (!titles.contains(cleanTitle)) {
                throw new IllegalArgumentException("Title '" + cleanTitle + "' is locked. Earn achievements or reach required level to unlock.");
            }
            user.setEquippedTitle(cleanTitle);
        }
        if (trail != null && !trail.trim().isEmpty()) {
            String cleanTrail = trail.trim();
            if (!trails.contains(cleanTrail)) {
                throw new IllegalArgumentException("Ballistic trail '" + cleanTrail + "' is locked. Increase career level to unlock.");
            }
            user.setEquippedTrail(cleanTrail);
        }

        User saved = userRepository.save(user);
        return getUserProfile(saved.getUsername());
    }

    private java.util.Set<String> parseJsonArray(String json) {
        java.util.Set<String> set = new java.util.LinkedHashSet<>();
        if (json == null || json.trim().isEmpty() || json.equals("[]")) {
            return set;
        }
        String clean = json.replace("[", "").replace("]", "").replace("\"", "");
        for (String item : clean.split(",")) {
            if (!item.trim().isEmpty()) {
                set.add(item.trim());
            }
        }
        return set;
    }

    private String toJsonArray(java.util.Set<String> items) {
        StringBuilder sb = new StringBuilder("[");
        int i = 0;
        for (String item : items) {
            if (i++ > 0) sb.append(",");
            sb.append("\"").append(item).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private String updateWeaponMastery(String existingJson, String warriorClass, int kills, boolean won) {
        String cls = (warriorClass != null && !warriorClass.trim().isEmpty()) ? warriorClass.trim().toUpperCase() : "ASSAULT";
        // Lightweight format: e.g. {"ASSAULT":{"m":5,"k":12,"w":2}}
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.node.ObjectNode root;
            if (existingJson != null && !existingJson.trim().isEmpty() && !existingJson.equals("{}")) {
                root = (com.fasterxml.jackson.databind.node.ObjectNode) mapper.readTree(existingJson);
            } else {
                root = mapper.createObjectNode();
            }

            com.fasterxml.jackson.databind.node.ObjectNode classNode = root.has(cls)
                    ? (com.fasterxml.jackson.databind.node.ObjectNode) root.get(cls)
                    : root.putObject(cls);

            int matches = classNode.has("matches") ? classNode.get("matches").asInt() : 0;
            int totalKills = classNode.has("kills") ? classNode.get("kills").asInt() : 0;
            int wins = classNode.has("wins") ? classNode.get("wins").asInt() : 0;

            classNode.put("matches", matches + 1);
            classNode.put("kills", totalKills + kills);
            if (won) {
                classNode.put("wins", wins + 1);
            }

            return mapper.writeValueAsString(root);
        } catch (Exception e) {
            return existingJson != null ? existingJson : "{}";
        }
    }
}
