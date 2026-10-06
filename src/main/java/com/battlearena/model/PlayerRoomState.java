package com.battlearena.model;

import java.time.Instant;

/**
 * In-memory representation of a player's state inside a specific game room.
 *
 * Layer: Domain / Model
 * Responsibility: Tracks presence, host privileges, and readiness to start a match.
 */
public class PlayerRoomState {

    private final String username;
    private volatile boolean isReady;
    private volatile boolean isHost;
    private final Instant joinedAt;

    public PlayerRoomState(String username, boolean isHost) {
        this.username = username;
        this.isHost = isHost;
        this.isReady = isHost; // Host is considered ready by default
        this.joinedAt = Instant.now();
    }

    public String getUsername() {
        return username;
    }

    public boolean isReady() {
        return isReady;
    }

    public void setReady(boolean ready) {
        this.isReady = ready;
    }

    public boolean isHost() {
        return isHost;
    }

    public void setHost(boolean host) {
        this.isHost = host;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}
