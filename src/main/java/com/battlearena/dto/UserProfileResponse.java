package com.battlearena.dto;

import java.time.Instant;

/**
 * Data Transfer Object for protected user profile queries.
 */
public class UserProfileResponse {

    private Long id;
    private String username;
    private int totalGames;
    private int totalScore;
    private int highestScore;
    private Instant createdAt;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long id, String username, int totalGames, int totalScore, int highestScore, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.totalGames = totalGames;
        this.totalScore = totalScore;
        this.highestScore = highestScore;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public int getTotalGames() {
        return totalGames;
    }

    public void setTotalGames(int totalGames) {
        this.totalGames = totalGames;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(int highestScore) {
        this.highestScore = highestScore;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
