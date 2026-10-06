package com.battlearena.dto;

/**
 * DTO projecting a player's status inside a room.
 */
public class PlayerRoomDTO {

    private String username;
    private boolean isReady;
    private boolean isHost;

    public PlayerRoomDTO() {
    }

    public PlayerRoomDTO(String username, boolean isReady, boolean isHost) {
        this.username = username;
        this.isReady = isReady;
        this.isHost = isHost;
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
        isReady = ready;
    }

    public boolean isHost() {
        return isHost;
    }

    public void setHost(boolean host) {
        isHost = host;
    }
}
