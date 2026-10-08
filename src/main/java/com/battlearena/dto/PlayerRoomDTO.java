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

    public PlayerRoomDTO() {
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost) {
        this(username, isReady, isHost, false, "ASSAULT");
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost, boolean spectator) {
        this(username, isReady, isHost, spectator, "ASSAULT");
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost, boolean spectator, String warriorClass) {
        this.username = username;
        this.isReady = isReady;
        this.isHost = isHost;
        this.spectator = spectator;
        this.warriorClass = warriorClass;
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
}
