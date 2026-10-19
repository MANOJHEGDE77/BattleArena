package com.battlearena.dto;

/**
 * DTO for creating a new multiplayer game room.
 */
public class CreateRoomRequest {

    private String name;
    private Integer maxPlayers;
    private String gameMode;
    private String botDifficulty;
    private String mapId;

    public CreateRoomRequest() {
    }

    public CreateRoomRequest(String name, Integer maxPlayers) {
        this(name, maxPlayers, "PVP_FFA", "VETERAN", "CYBER_CORE");
    }

    public CreateRoomRequest(String name, Integer maxPlayers, String gameMode) {
        this(name, maxPlayers, gameMode, "VETERAN", "CYBER_CORE");
    }

    public CreateRoomRequest(String name, Integer maxPlayers, String gameMode, String botDifficulty) {
        this(name, maxPlayers, gameMode, botDifficulty, "CYBER_CORE");
    }

    public CreateRoomRequest(String name, Integer maxPlayers, String gameMode, String botDifficulty, String mapId) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.gameMode = gameMode;
        this.botDifficulty = botDifficulty;
        this.mapId = mapId;
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

    public String getBotDifficulty() {
        return botDifficulty;
    }

    public void setBotDifficulty(String botDifficulty) {
        this.botDifficulty = botDifficulty;
    }

    public String getMapId() {
        return mapId != null && !mapId.trim().isEmpty() ? mapId.trim().toUpperCase() : "CYBER_CORE";
    }

    public void setMapId(String mapId) {
        this.mapId = mapId;
    }
}
