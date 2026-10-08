package com.battlearena.dto;

/**
 * Lightweight DTO for listing available rooms in the lobby.
 */
public class RoomSummaryResponse {

    private String roomId;
    private String name;
    private String hostUsername;
    private int currentPlayers;
    private int maxPlayers;
    private String status;
    private String gameMode = "PVP_FFA";

    public RoomSummaryResponse() {
    }

    public RoomSummaryResponse(String roomId, String name, String hostUsername, int currentPlayers, int maxPlayers, String status) {
        this(roomId, name, hostUsername, currentPlayers, maxPlayers, status, "PVP_FFA");
    }

    public RoomSummaryResponse(String roomId, String name, String hostUsername, int currentPlayers, int maxPlayers, String status, String gameMode) {
        this.roomId = roomId;
        this.name = name;
        this.hostUsername = hostUsername;
        this.currentPlayers = currentPlayers;
        this.maxPlayers = maxPlayers;
        this.status = status;
        this.gameMode = (gameMode != null && !gameMode.isEmpty()) ? gameMode : (maxPlayers == 2 ? "PVP_1V1" : "PVP_FFA");
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHostUsername() {
        return hostUsername;
    }

    public void setHostUsername(String hostUsername) {
        this.hostUsername = hostUsername;
    }

    public int getCurrentPlayers() {
        return currentPlayers;
    }

    public void setCurrentPlayers(int currentPlayers) {
        this.currentPlayers = currentPlayers;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getGameMode() {
        return gameMode;
    }

    public void setGameMode(String gameMode) {
        this.gameMode = gameMode;
    }
}
