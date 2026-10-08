package com.battlearena.dto;

import java.time.Instant;

/**
 * Standardized API Error Response DTO.
 *
 * Layer: Presentation / DTO
 * Responsibility: Enforces a uniform, predictable JSON error structure for all client-facing REST APIs.
 */
public class ErrorResponse {

    private final String timestamp;
    private final int status;
    private final String error;
    private final String message;

    public ErrorResponse(int status, String error, String message) {
        this.timestamp = Instant.now().toString();
        this.status = status;
        this.error = error;
        this.message = message;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public String getMessage() {
        return message;
    }
}
