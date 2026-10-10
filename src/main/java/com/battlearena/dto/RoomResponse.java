package com.battlearena.dto;

import java.util.List;

/**
 * Detailed DTO describing room status and player roster.
 */
public class RoomResponse {

    private String roomId;
    private String name;
    private String hostUsername;
    private int maxPlayers;
    private int currentPlayers;
    private String status;
    private List<PlayerRoomDTO> players;
    private boolean canStart;
    private String gameMode = "PVP_FFA";
    private String botDifficulty = "VETERAN";

    public RoomResponse() {
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart) {
        this(roomId, name, hostUsername, maxPlayers, currentPlayers, status, players, canStart, "PVP_FFA", "VETERAN");
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart, String gameMode) {
        this(roomId, name, hostUsername, maxPlayers, currentPlayers, status, players, canStart, gameMode, "VETERAN");
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart, String gameMode, String botDifficulty) {
        this.roomId = roomId;
        this.name = name;
        this.hostUsername = hostUsername;
        this.maxPlayers = maxPlayers;
        this.currentPlayers = currentPlayers;
        this.status = status;
        this.players = players;
        this.canStart = canStart;
        this.gameMode = (gameMode != null && !gameMode.isEmpty()) ? gameMode : (maxPlayers == 2 ? "PVP_1V1" : "PVP_FFA");
        this.botDifficulty = (botDifficulty != null && !botDifficulty.isEmpty()) ? botDifficulty : "VETERAN";
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

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public int getCurrentPlayers() {
        return currentPlayers;
    }

    public void setCurrentPlayers(int currentPlayers) {
        this.currentPlayers = currentPlayers;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<PlayerRoomDTO> getPlayers() {
        return players;
    }

    public void setPlayers(List<PlayerRoomDTO> players) {
        this.players = players;
    }

    public boolean isCanStart() {
        return canStart;
    }

    public void setCanStart(boolean canStart) {
        this.canStart = canStart;
    }

    public String getGameMode() {
        return gameMode;
    }

    public void setGameMode(String gameMode) {
        this.gameMode = gameMode;
    }

    public String getBotDifficulty() {
        return botDifficulty;
    }

    public void setBotDifficulty(String botDifficulty) {
        this.botDifficulty = botDifficulty;
    }
}
