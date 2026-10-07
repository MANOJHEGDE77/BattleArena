package com.battlearena.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Data Transfer Object representing a match history record for client consumption.
 *
 * Layer: Data Transfer Object (DTO)
 * Responsibility: Transmits match outcomes, personal score, and win status cleanly over REST.
 *
 * Problem it solves:
 * Decouples database schema (GameResult entity) from frontend JSON representation,
 * formatting participant scores and computing player-specific contextual flags (e.g. isWinner).
 */
public class MatchHistoryDTO {

    private Long matchId;
    private String roomId;
    private String roomName;
    private String winnerUsername;
    private int winningScore;
    private long durationSeconds;
    private Instant finishedAt;
    private int participantsCount;
    private boolean isWinner;
    private int playerScore;
    private Map<String, Integer> scores;

    public MatchHistoryDTO() {
    }

    public MatchHistoryDTO(Long matchId, String roomId, String roomName, String winnerUsername,
                           int winningScore, long durationSeconds, Instant finishedAt,
                           int participantsCount, boolean isWinner, int playerScore,
                           Map<String, Integer> scores) {
        this.matchId = matchId;
        this.roomId = roomId;
        this.roomName = roomName;
        this.winnerUsername = winnerUsername;
        this.winningScore = winningScore;
        this.durationSeconds = durationSeconds;
        this.finishedAt = finishedAt;
        this.participantsCount = participantsCount;
        this.isWinner = isWinner;
        this.playerScore = playerScore;
        this.scores = scores;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getWinnerUsername() {
        return winnerUsername;
    }

    public void setWinnerUsername(String winnerUsername) {
        this.winnerUsername = winnerUsername;
    }

    public int getWinningScore() {
        return winningScore;
    }

    public void setWinningScore(int winningScore) {
        this.winningScore = winningScore;
    }

    public long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }

    public int getParticipantsCount() {
        return participantsCount;
    }

    public void setParticipantsCount(int participantsCount) {
        this.participantsCount = participantsCount;
    }

    public boolean isWinner() {
        return isWinner;
    }

    public void setWinner(boolean winner) {
        isWinner = winner;
    }

    public int getPlayerScore() {
        return playerScore;
    }

    public void setPlayerScore(int playerScore) {
        this.playerScore = playerScore;
    }

    public Map<String, Integer> getScores() {
        return scores;
    }

    public void setScores(Map<String, Integer> scores) {
        this.scores = scores;
    }
}
