package com.battlearena.service;

import com.battlearena.dto.*;
import com.battlearena.model.PlayerRoomState;
import com.battlearena.model.Room;
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

        Room room = new Room(roomId, roomName, hostUsername, maxPlayers);
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
                        r.getStatus().name()
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
        // Leave any existing room before joining
        leaveCurrentRoom(username);

        Room room = findRoomOrThrow(roomId);
        boolean joined = room.addPlayer(username);

        if (!joined) {
            throw new IllegalArgumentException("Cannot join room: room is either full or the match is already in progress.");
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
     * Returns the roomId the player is currently in, if any.
     */
    public Optional<String> getPlayerCurrentRoom(String username) {
        return Optional.ofNullable(playerToRoom.get(username));
    }

    private Room findRoomOrThrow(String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            throw new IllegalArgumentException("Room not found: " + roomId);
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

    private RoomResponse toRoomResponse(Room room, String requestingUser) {
        List<PlayerRoomDTO> playerList = room.getPlayers().stream()
                .sorted(Comparator.comparing(PlayerRoomState::isHost).reversed()
                        .thenComparing(PlayerRoomState::getJoinedAt))
                .map(p -> new PlayerRoomDTO(p.getUsername(), p.isReady(), p.isHost()))
                .toList();

        return new RoomResponse(
                room.getRoomId(),
                room.getName(),
                room.getHostUsername(),
                room.getMaxPlayers(),
                room.getPlayerCount(),
                room.getStatus().name(),
                playerList,
                room.canStart(requestingUser)
        );
    }
}
