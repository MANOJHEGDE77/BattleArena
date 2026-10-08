package com.battlearena.dto;

/**
 * DTO projecting a player's status inside a room.
 */
public class PlayerRoomDTO {

    private String username;
    private boolean isReady;
    private boolean isHost;
    private boolean spectator;
    private String warriorClass;
    private boolean bot;

    public PlayerRoomDTO() {
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost) {
        this(username, isReady, isHost, false, "ASSAULT", false);
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost, boolean spectator) {
        this(username, isReady, isHost, spectator, "ASSAULT", false);
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost, boolean spectator, String warriorClass) {
        this(username, isReady, isHost, spectator, warriorClass, false);
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost, boolean spectator, String warriorClass, boolean bot) {
        this.username = username;
        this.isReady = isReady;
        this.isHost = isHost;
        this.spectator = spectator;
        this.warriorClass = warriorClass;
        this.bot = bot;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public boolean isHostUser() {
        return isHost;
    }

    public boolean getIsHost() {
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

    public String getWarriorClass() {
        return warriorClass;
    }

    public void setWarriorClass(String warriorClass) {
        this.warriorClass = warriorClass;
    }

    public boolean isBot() {
        return bot;
    }

    public void setBot(boolean bot) {
        this.bot = bot;
    }
}
