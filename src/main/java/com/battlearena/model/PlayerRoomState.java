package com.battlearena.model;

import java.time.Instant;

/**
 * In-memory representation of a player's state inside a specific game room.
 *
 * Layer: Domain / Model
 * Responsibility: Tracks presence, host privileges, warrior class choice, and readiness to start a match.
 */
public class PlayerRoomState {

    private final String username;
    private volatile boolean isReady;
    private volatile boolean isHost;
    private volatile boolean spectator;
    private volatile WarriorClass warriorClass;
    private final Instant joinedAt;

    public PlayerRoomState(String username, boolean isHost) {
        this(username, isHost, false, WarriorClass.ASSAULT);
    }

    public PlayerRoomState(String username, boolean isHost, boolean spectator) {
        this(username, isHost, spectator, WarriorClass.ASSAULT);
    }

    public PlayerRoomState(String username, boolean isHost, boolean spectator, WarriorClass warriorClass) {
        this.username = username;
        this.isHost = isHost;
        this.spectator = spectator;
        this.warriorClass = (warriorClass != null) ? warriorClass : WarriorClass.ASSAULT;
        this.isReady = isHost || spectator; // Hosts & spectators don't block match start
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

    public boolean isSpectator() {
        return spectator;
    }

    public void setSpectator(boolean spectator) {
        this.spectator = spectator;
    }

    public WarriorClass getWarriorClass() {
        return warriorClass;
    }

    public void setWarriorClass(WarriorClass warriorClass) {
        this.warriorClass = (warriorClass != null) ? warriorClass : WarriorClass.ASSAULT;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }
}
