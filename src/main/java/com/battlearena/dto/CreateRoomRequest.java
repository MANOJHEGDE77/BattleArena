package com.battlearena.dto;

/**
 * DTO for creating a new multiplayer game room.
 */
public class CreateRoomRequest {

    private String name;
    private Integer maxPlayers;
    private String gameMode;

    public CreateRoomRequest() {
    }

    public CreateRoomRequest(String name, Integer maxPlayers) {
        this(name, maxPlayers, "PVP_FFA");
    }

    public CreateRoomRequest(String name, Integer maxPlayers, String gameMode) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.gameMode = gameMode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(Integer maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public String getGameMode() {
        return gameMode;
    }

    public void setGameMode(String gameMode) {
        this.gameMode = gameMode;
    }
}
