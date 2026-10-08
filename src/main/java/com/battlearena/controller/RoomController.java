package com.battlearena.controller;

import com.battlearena.dto.*;
import com.battlearena.model.Room;
import com.battlearena.service.RoomService;
import com.battlearena.websocket.GameWebSocketHandler;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller exposing REST endpoints for Multiplayer Room Management.
 *
 * Layer: Presentation / Controller Layer
 * Responsibility: Maps room lifecycle actions (create, list, join, leave, ready, start)
 * to RoomService operations.
 *
 * All mutative endpoints require an authenticated JWT principal.
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;
    private final GameWebSocketHandler webSocketHandler;

    public RoomController(RoomService roomService, GameWebSocketHandler webSocketHandler) {
        this.roomService = roomService;
        this.webSocketHandler = webSocketHandler;
    }

    /**
     * Creates a new game room. Host is automatically joined.
     * POST /api/rooms
     */
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@RequestBody(required = false) CreateRoomRequest request,
                                                  Authentication authentication) {
        if (request == null) {
            request = new CreateRoomRequest();
        }
        RoomResponse response = roomService.createRoom(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all active rooms available in the lobby.
     * GET /api/rooms
     */
    @GetMapping
    public ResponseEntity<List<RoomSummaryResponse>> listRooms() {
        return ResponseEntity.ok(roomService.listRooms());
    }

    /**
     * Retrieves the room the current user is currently participating in.
     * GET /api/rooms/my-room
     */
    @GetMapping("/my-room")
    public ResponseEntity<?> getMyRoom(Authentication authentication) {
        return roomService.getPlayerCurrentRoom(authentication.getName())
                .map(roomId -> ResponseEntity.ok(roomService.getRoom(roomId, authentication.getName())))
                .orElse(ResponseEntity.noContent().build());
    }

    /**
     * Retrieves details for a specific room.
     * GET /api/rooms/{roomId}
     */
    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String roomId, Authentication authentication) {
        return ResponseEntity.ok(roomService.getRoom(roomId, authentication.getName()));
    }

    /**
     * Joins an existing game room.
     * POST /api/rooms/{roomId}/join
     */
    @PostMapping("/{roomId}/join")
    public ResponseEntity<RoomResponse> joinRoom(@PathVariable String roomId, Authentication authentication) {
        RoomResponse response = roomService.joinRoom(roomId, authentication.getName());
        return ResponseEntity.ok(response);
    }

    /**
     * Leaves the specified room (or current room).
     * POST /api/rooms/{roomId}/leave
     */
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<Map<String, String>> leaveRoom(@PathVariable String roomId, Authentication authentication) {
        roomService.leaveCurrentRoom(authentication.getName());
        webSocketHandler.broadcastToRoom(roomId, Map.of(
                "type", "PLAYER_LEFT",
                "username", authentication.getName(),
                "roomId", roomId
        ));
        return ResponseEntity.ok(Map.of("message", "Left room " + roomId));
    }

    /**
     * Toggles player readiness state.
     * POST /api/rooms/{roomId}/ready
     */
    @PostMapping("/{roomId}/ready")
    public ResponseEntity<RoomResponse> toggleReady(@PathVariable String roomId, Authentication authentication) {
        RoomResponse response = roomService.toggleReady(roomId, authentication.getName());
        webSocketHandler.broadcastToRoom(roomId, Map.of(
                "type", "ROOM_UPDATED",
                "roomId", roomId
        ));
        return ResponseEntity.ok(response);
    }

    /**
     * Starts the game match (host only).
     * POST /api/rooms/{roomId}/start
     */
    @PostMapping("/{roomId}/start")
    public ResponseEntity<RoomResponse> startGame(@PathVariable String roomId, Authentication authentication) {
        RoomResponse response = roomService.startGame(roomId, authentication.getName());
        Room room = roomService.getActiveRoom(roomId);
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", "GAME_START");
        payload.put("roomId", roomId);
        if (room != null) {
            payload.put("coins", room.getCoins());
            payload.put("players", room.getGamePlayers());
            payload.put("winningScore", Room.getWinningScore());
        }
        webSocketHandler.broadcastToRoom(roomId, payload);
        return ResponseEntity.ok(response);
    }

    /**
     * Resets a completed room for a rematch (host only).
     * POST /api/rooms/{roomId}/rematch
     */
    @PostMapping("/{roomId}/rematch")
    public ResponseEntity<RoomResponse> rematchRoom(@PathVariable String roomId, Authentication authentication) {
        RoomResponse response = roomService.rematchRoom(roomId, authentication.getName());
        webSocketHandler.broadcastToRoom(roomId, Map.of(
                "type", "REMATCH_RESET",
                "roomId", roomId
        ));
        return ResponseEntity.ok(response);
    }
}
