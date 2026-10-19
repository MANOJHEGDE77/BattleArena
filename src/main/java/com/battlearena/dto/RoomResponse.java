package com.battlearena.dto;

import com.battlearena.model.ArenaHazard;
import com.battlearena.model.Obstacle;
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
    private String mapId = "CYBER_CORE";
    private List<Obstacle> obstacles;
    private List<ArenaHazard> hazards;

    public RoomResponse() {
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart) {
        this(roomId, name, hostUsername, maxPlayers, currentPlayers, status, players, canStart, "PVP_FFA", "VETERAN", "CYBER_CORE");
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart, String gameMode) {
        this(roomId, name, hostUsername, maxPlayers, currentPlayers, status, players, canStart, gameMode, "VETERAN", "CYBER_CORE");
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart, String gameMode, String botDifficulty) {
        this(roomId, name, hostUsername, maxPlayers, currentPlayers, status, players, canStart, gameMode, botDifficulty, "CYBER_CORE");
    }

    public RoomResponse(String roomId, String name, String hostUsername, int maxPlayers, int currentPlayers,
                        String status, List<PlayerRoomDTO> players, boolean canStart, String gameMode, String botDifficulty, String mapId) {
        this.roomId = roomId;
        this.name = name;
        this.hostUsername = hostUsername;
        this.maxPlayers = maxPlayers;
        this.currentPlayers = currentPlayers;
        this.status = status;
        this.players = players;
        this.canStart = canStart;
        this.gameMode = gameMode;
        this.botDifficulty = botDifficulty;
        this.mapId = (mapId != null && !mapId.trim().isEmpty()) ? mapId.trim().toUpperCase() : "CYBER_CORE";
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

    public String getMapId() {
        return mapId != null ? mapId : "CYBER_CORE";
    }

    public void setMapId(String mapId) {
        this.mapId = mapId;
    }

    public List<Obstacle> getObstacles() {
        return obstacles;
    }

    public void setObstacles(List<Obstacle> obstacles) {
        this.obstacles = obstacles;
    }

    public List<ArenaHazard> getHazards() {
        return hazards;
    }

    public void setHazards(List<ArenaHazard> hazards) {
        this.hazards = hazards;
    }
}
