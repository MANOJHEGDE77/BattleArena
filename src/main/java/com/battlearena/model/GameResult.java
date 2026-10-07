package com.battlearena.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing an immutable finished match record in MySQL.
 *
 * Layer: Model / Domain (Data Persistence Layer)
 * Responsibility: Maps to the `game_results` table in MySQL using JPA / Hibernate.
 *
 * Problem it solves:
 * Provides historical match logs beyond aggregate user counters.
 * Records the arena, winner, participants, individual scores, duration, and timestamp.
 *
 * Who calls it: Spring Data JPA (GameResultRepository), MatchService
 * What data flows through it: Match telemetry, final scores, duration, and participant list.
 */
@Entity
@Table(name = "game_results")
public class GameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String roomId;

    @Column(nullable = false, length = 64)
    private String roomName;

    @Column(nullable = false, length = 50)
    private String winnerUsername;

    @Column(nullable = false)
    private int winningScore;

    @Column(nullable = false)
    private int participantsCount;

    @Column(nullable = false, length = 1000)
    private String participantUsernames; // Comma-separated usernames for indexed querying

    @Column(columnDefinition = "TEXT", nullable = false)
    private String scoresJson; // JSON representation of player scores

    @Column(nullable = false)
    private long durationSeconds;

    @Column(nullable = false, updatable = false)
    private Instant finishedAt;

    public GameResult() {
    }

    public GameResult(String roomId, String roomName, String winnerUsername, int winningScore,
                      int participantsCount, String participantUsernames, String scoresJson,
                      long durationSeconds, Instant finishedAt) {
        this.roomId = roomId;
        this.roomName = roomName;
        this.winnerUsername = winnerUsername;
        this.winningScore = winningScore;
        this.participantsCount = participantsCount;
        this.participantUsernames = participantUsernames;
        this.scoresJson = scoresJson;
        this.durationSeconds = durationSeconds;
        this.finishedAt = (finishedAt != null) ? finishedAt : Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public int getParticipantsCount() {
        return participantsCount;
    }

    public void setParticipantsCount(int participantsCount) {
        this.participantsCount = participantsCount;
    }

    public String getParticipantUsernames() {
        return participantUsernames;
    }

    public void setParticipantUsernames(String participantUsernames) {
        this.participantUsernames = participantUsernames;
    }

    public String getScoresJson() {
        return scoresJson;
    }

    public void setScoresJson(String scoresJson) {
        this.scoresJson = scoresJson;
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
}
