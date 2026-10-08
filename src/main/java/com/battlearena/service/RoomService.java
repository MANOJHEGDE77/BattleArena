package com.battlearena.service;

import com.battlearena.dto.*;
import com.battlearena.exception.ResourceNotFoundException;
import com.battlearena.model.PlayerRoomState;
import com.battlearena.model.Room;
import com.battlearena.model.WarriorClass;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Service managing in-memory multiplayer rooms and player assignments.
 *
 * Layer: Service (Business Logic / Game State Management)
 * Responsibility: Handles room creation, active lobbies registry, player transitions,
 * room cleanup upon abandonment, and match start authorization.
 *
 * Concurrency:
 * Employs ConcurrentHashMaps for rooms and player-to-room mappings, ensuring high throughput
 * and thread-safe lookups without coarse-grained global locking.
 */
@Service
public class RoomService {

    private final ConcurrentMap<String, Room> rooms = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> playerToRoom = new ConcurrentHashMap<>();

    /**
     * Creates a new game room with the given host.
     */
    public RoomResponse createRoom(CreateRoomRequest request, String hostUsername) {
        // Leave any existing room before creating a new one
        leaveCurrentRoom(hostUsername);

        String roomId = generateUniqueRoomId();
        String roomName = (request.getName() != null && !request.getName().trim().isEmpty())
                ? request.getName().trim()
                : hostUsername + "'s Arena";

        int maxPlayers = 4;
        if (request.getMaxPlayers() != null) {
            maxPlayers = Math.max(2, Math.min(8, request.getMaxPlayers()));
        }

        String gameMode = (request.getGameMode() != null && !request.getGameMode().trim().isEmpty())
                ? request.getGameMode().trim().toUpperCase()
                : (maxPlayers == 2 ? "PVP_1V1" : "PVP_FFA");

        Room room = new Room(roomId, roomName, hostUsername, maxPlayers, gameMode);
        rooms.put(roomId, room);
        playerToRoom.put(hostUsername, roomId);

        return toRoomResponse(room, hostUsername);
    }

    /**
     * Lists summaries of all active rooms for lobby discovery.
     */
    public List<RoomSummaryResponse> listRooms() {
        return rooms.values().stream()
                .sorted(Comparator.comparing(Room::getCreatedAt).reversed())
                .map(r -> new RoomSummaryResponse(
                        r.getRoomId(),
                        r.getName(),
                        r.getHostUsername(),
                        r.getPlayerCount(),
                        r.getMaxPlayers(),
                        r.getStatus().name(),
                        r.getGameMode()
                ))
                .toList();
    }

    /**
     * Retrieves detailed information and current roster of a specific room.
     */
    public RoomResponse getRoom(String roomId, String requestingUser) {
        Room room = findRoomOrThrow(roomId);
        return toRoomResponse(room, requestingUser);
    }

    /**
     * Adds an authenticated player to an existing room.
     */
    public RoomResponse joinRoom(String roomId, String username) {
        return joinRoom(roomId, username, false);
    }

    public RoomResponse joinRoom(String roomId, String username, boolean asSpectator) {
        // Leave any existing room before joining
        leaveCurrentRoom(username);

        Room room = findRoomOrThrow(roomId);
        boolean joined = room.addPlayer(username, asSpectator);

        if (!joined) {
            throw new IllegalArgumentException(asSpectator ?
                    "Cannot spectate room: match has already finished." :
                    "Cannot join room: room is either full or the match is already in progress.");
        }

        playerToRoom.put(username, roomId);
        return toRoomResponse(room, username);
    }

    /**
     * Removes an authenticated player from their current room.
     */
    public void leaveCurrentRoom(String username) {
        String roomId = playerToRoom.remove(username);
        if (roomId != null) {
            Room room = rooms.get(roomId);
            if (room != null) {
                boolean isEmpty = room.removePlayer(username);
                if (isEmpty) {
                    rooms.remove(roomId);
                }
            }
        }
    }

    /**
     * Toggles a non-host player's ready status.
     */
    public RoomResponse toggleReady(String roomId, String username) {
        Room room = findRoomOrThrow(roomId);
        if (!room.hasPlayer(username)) {
            throw new IllegalArgumentException("Player is not a member of room " + roomId);
        }

        room.toggleReady(username);
        return toRoomResponse(room, username);
    }

    /**
     * Authorizes and transitions a room into PLAYING state.
     */
    public RoomResponse startGame(String roomId, String hostUsername) {
        Room room = findRoomOrThrow(roomId);

        if (!room.canStart(hostUsername)) {
            throw new IllegalArgumentException("Cannot start match: you must be the room host and all participants must be ready.");
        }

        room.start();
        return toRoomResponse(room, hostUsername);
    }

    /**
     * Resets a completed room for a new match (rematch). Host only.
     */
    public RoomResponse rematchRoom(String roomId, String requestingUser) {
        Room room = findRoomOrThrow(roomId);
        if (!room.getHostUsername().equals(requestingUser)) {
            throw new IllegalArgumentException("Only the arena host can initiate a rematch.");
        }
        room.resetForRematch();
        return toRoomResponse(room, requestingUser);
    }

    /**
     * Returns the roomId the player is currently in, if any.
     */
    public Optional<String> getPlayerCurrentRoom(String username) {
        return Optional.ofNullable(playerToRoom.get(username));
    }

    private Room findRoomOrThrow(String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            throw new ResourceNotFoundException("Room not found: " + roomId);
        }
        return room;
    }

    public Room getActiveRoom(String roomId) {
        return rooms.get(roomId);
    }

    private String generateUniqueRoomId() {
        String id;
        do {
            id = "ARENA-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        } while (rooms.containsKey(id));
        return id;
    }

    /**
     * Updates the warrior class specialization for a player in a room.
     */
    public RoomResponse selectWarriorClass(String roomId, String username, WarriorClass warriorClass) {
        Room room = findRoomOrThrow(roomId);
        room.setPlayerWarriorClass(username, warriorClass);
        return toRoomResponse(room, username);
    }

    private RoomResponse toRoomResponse(Room room, String requestingUser) {
        List<PlayerRoomDTO> playerList = room.getPlayers().stream()
                .sorted(Comparator.comparing(PlayerRoomState::isHost).reversed()
                        .thenComparing(PlayerRoomState::getJoinedAt))
                .map(p -> new PlayerRoomDTO(p.getUsername(), p.isReady(), p.isHost(), p.isSpectator(),
                        p.getWarriorClass() != null ? p.getWarriorClass().name() : "ASSAULT", p.isBot()))
                .toList();

        return new RoomResponse(
                room.getRoomId(),
                room.getName(),
                room.getHostUsername(),
                room.getMaxPlayers(),
                room.getCombatantCount(),
                room.getStatus().name(),
                playerList,
                room.canStart(requestingUser),
                room.getGameMode()
        );
    }

    /**
     * Spawns an autonomous AI combat bot into the room lobby (host only).
     */
    public RoomResponse addBot(String roomId, String requestingUser) {
        Room room = findRoomOrThrow(roomId);
        if (!room.getHostUsername().equals(requestingUser)) {
            throw new IllegalArgumentException("Only the room host can add AI Bots.");
        }
        if (room.getStatus() != com.battlearena.model.RoomStatus.WAITING) {
            throw new IllegalArgumentException("Cannot add bots once match is in progress.");
        }

        String[] botNames = {"BOT-APEX", "BOT-TITAN", "BOT-VALKYRIE", "BOT-PHANTOM", "BOT-CIPHER", "BOT-VORTEX", "BOT-NEXUS", "BOT-STORM"};
        WarriorClass[] classes = WarriorClass.values();
        String chosenName = null;
        for (String candidate : botNames) {
            if (!room.hasPlayer(candidate)) {
                chosenName = candidate;
                break;
            }
        }
        if (chosenName == null) {
            chosenName = "BOT-" + (room.getPlayerCount() + 1);
        }
        WarriorClass randomClass = classes[new Random().nextInt(classes.length)];
        boolean added = room.addBot(chosenName, randomClass);
        if (!added) {
            throw new IllegalArgumentException("Room capacity reached. Cannot add more bots.");
        }
        return toRoomResponse(room, requestingUser);
    }

    /**
     * Removes an AI combat bot from the room (host only).
     */
    public RoomResponse removeBot(String roomId, String botName, String requestingUser) {
        Room room = findRoomOrThrow(roomId);
        if (!room.getHostUsername().equals(requestingUser)) {
            throw new IllegalArgumentException("Only the room host can remove AI Bots.");
        }
        room.removeBot(botName);
        return toRoomResponse(room, requestingUser);
    }
}
