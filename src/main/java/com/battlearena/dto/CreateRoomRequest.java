package com.battlearena.dto;

/**
 * DTO for creating a new multiplayer game room.
 */
public class CreateRoomRequest {

    private String name;
    private Integer maxPlayers;

    public CreateRoomRequest() {
    }

    public CreateRoomRequest(String name, Integer maxPlayers) {
        this.name = name;
        this.maxPlayers = maxPlayers;
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
}
