package com.battlearena.dto;

/**
 * DTO representing an entry in the persistent global leaderboard.
 */
public class LeaderboardEntryDTO {

    private int rank;
    private String username;
    private int highestScore;
    private int totalScore;
    private int totalGames;

    public LeaderboardEntryDTO() {
    }

    public LeaderboardEntryDTO(int rank, String username, int highestScore, int totalScore, int totalGames) {
        this.rank = rank;
        this.username = username;
        this.highestScore = highestScore;
        this.totalScore = totalScore;
        this.totalGames = totalGames;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public int getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(int highestScore) {
        this.highestScore = highestScore;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getTotalGames() {
        return totalGames;
    }

    public void setTotalGames(int totalGames) {
        this.totalGames = totalGames;
    }
}
