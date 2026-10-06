package com.battlearena.model;

import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * In-memory Game Room managing multiplayer lobby membership and match lifecycle.
 *
 * Layer: Domain / Model (In-Memory Game State)
 * Responsibility: Enforces room capacity, host succession, readiness rules,
 * and thread-safe player list modifications.
 *
 * Concurrency Design:
 * Uses synchronized critical sections for player membership mutations (join, leave, host migration)
 * to ensure atomicity under concurrent HTTP/WebSocket requests without race conditions.
 */
public class Room {

    private final String roomId;
    private final String name;
    private volatile String hostUsername;
    private final int maxPlayers;
    private volatile RoomStatus status;
    private final Instant createdAt;

    private final ConcurrentMap<String, PlayerRoomState> players = new ConcurrentHashMap<>();

    public Room(String roomId, String name, String hostUsername, int maxPlayers) {
        this.roomId = roomId;
        this.name = name;
        this.hostUsername = hostUsername;
        this.maxPlayers = maxPlayers;
        this.status = RoomStatus.WAITING;
        this.createdAt = Instant.now();

        // Host is automatically added as first player with host privileges
        this.players.put(hostUsername, new PlayerRoomState(hostUsername, true));
    }

    public String getRoomId() {
        return roomId;
    }

    public String getName() {
        return name;
    }

    public String getHostUsername() {
        return hostUsername;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Collection<PlayerRoomState> getPlayers() {
        return Collections.unmodifiableCollection(players.values());
    }

    public int getPlayerCount() {
        return players.size();
    }

    public boolean hasPlayer(String username) {
        return players.containsKey(username);
    }

    /**
     * Atomically adds a player to the room.
     * Returns true if joined, false if room is full or not in WAITING state.
     */
    public synchronized boolean addPlayer(String username) {
        if (status != RoomStatus.WAITING) {
            return false;
        }
        if (players.size() >= maxPlayers) {
            return false;
        }
        if (players.containsKey(username)) {
            return true; // Already joined
        }

        players.put(username, new PlayerRoomState(username, false));
        return true;
    }

    /**
     * Atomically removes a player. If the host leaves, assigns host to the next player.
     * Returns true if the room is now empty and should be cleaned up.
     */
    public synchronized boolean removePlayer(String username) {
        players.remove(username);

        if (players.isEmpty()) {
            return true;
        }

        if (username.equals(hostUsername)) {
            // Elect next available player as host
            String nextHost = players.keySet().iterator().next();
            this.hostUsername = nextHost;
            PlayerRoomState newHostState = players.get(nextHost);
            if (newHostState != null) {
                newHostState.setHost(true);
                newHostState.setReady(true);
            }
        }

        return false;
    }

    /**
     * Toggles a player's ready flag (host is always considered ready).
     */
    public synchronized boolean toggleReady(String username) {
        PlayerRoomState state = players.get(username);
        if (state == null) {
            return false;
        }
        if (!state.isHost()) {
            state.setReady(!state.isReady());
        }
        return state.isReady();
    }

    private static final String[] PALETTE = {
            "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"
    };

    private static final double[][] SPAWN_POINTS = {
            {150.0, 150.0}, {650.0, 450.0}, {650.0, 150.0}, {150.0, 450.0},
            {400.0, 150.0}, {400.0, 450.0}, {150.0, 300.0}, {650.0, 300.0}
    };

    private final ConcurrentMap<String, GamePlayer> gamePlayers = new ConcurrentHashMap<>();

    /**
     * Validates if the game can start:
     * 1. Must be invoked by room host
     * 2. Room must be in WAITING state
     * 3. At least 1 player present
     * 4. All non-host players must be marked ready
     */
    public synchronized boolean canStart(String requestingUser) {
        if (!requestingUser.equals(hostUsername)) {
            return false;
        }
        if (status != RoomStatus.WAITING) {
            return false;
        }
        if (players.isEmpty()) {
            return false;
        }
        return players.values().stream().allMatch(PlayerRoomState::isReady);
    }

    /**
     * Transitions room status to PLAYING and initializes real-time player entities.
     */
    public synchronized void start() {
        this.status = RoomStatus.PLAYING;
        this.gamePlayers.clear();

        int index = 0;
        for (String username : players.keySet()) {
            double[] spawn = SPAWN_POINTS[index % SPAWN_POINTS.length];
            String color = PALETTE[index % PALETTE.length];
            gamePlayers.put(username, new GamePlayer(username, spawn[0], spawn[1], color));
            index++;
        }
    }

    public Collection<GamePlayer> getGamePlayers() {
        return Collections.unmodifiableCollection(gamePlayers.values());
    }

    public GamePlayer getGamePlayer(String username) {
        return gamePlayers.get(username);
    }

    public void updatePlayerPosition(String username, double x, double y, double heading) {
        GamePlayer player = gamePlayers.get(username);
        if (player != null) {
            player.updatePosition(x, y, heading);
        }
    }
}
