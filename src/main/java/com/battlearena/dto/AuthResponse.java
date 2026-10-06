package com.battlearena.dto;

/**
 * Data Transfer Object returned upon successful authentication.
 *
 * Layer: DTO / Presentation
 * Responsibility: Encapsulates JWT bearer token and player identity for the client.
 */
public class AuthResponse {

    private String token;
    private String username;
    private Long userId;
    private int highestScore;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String token, String username, Long userId, int highestScore, String message) {
        this.token = token;
        this.username = username;
        this.userId = userId;
        this.highestScore = highestScore;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public int getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(int highestScore) {
        this.highestScore = highestScore;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
