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
    private volatile boolean bot;
    private final Instant joinedAt;

    public PlayerRoomState(String username, boolean isHost) {
        this(username, isHost, false, WarriorClass.ASSAULT, false);
    }

    public PlayerRoomState(String username, boolean isHost, boolean spectator) {
        this(username, isHost, spectator, WarriorClass.ASSAULT, false);
    }

    public PlayerRoomState(String username, boolean isHost, boolean spectator, WarriorClass warriorClass) {
        this(username, isHost, spectator, warriorClass, false);
    }

    public PlayerRoomState(String username, boolean isHost, boolean spectator, WarriorClass warriorClass, boolean bot) {
        this.username = username;
        this.isHost = isHost;
        this.spectator = spectator;
        this.warriorClass = (warriorClass != null) ? warriorClass : WarriorClass.ASSAULT;
        this.bot = bot;
        this.isReady = isHost || spectator || bot; // Hosts, spectators & bots are always ready
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

    public boolean isBot() {
        return bot;
    }

    public void setBot(boolean bot) {
        this.bot = bot;
    }
}
