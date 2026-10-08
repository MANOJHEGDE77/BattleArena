package com.battlearena.websocket;

import com.battlearena.model.Coin;
import com.battlearena.model.GamePlayer;
import com.battlearena.model.Projectile;
import com.battlearena.model.Room;
import com.battlearena.model.RoomStatus;
import com.battlearena.security.JwtUtil;
import com.battlearena.service.RoomService;
import com.battlearena.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Real-time WebSocket Handler managing bidirectional game communication.
 *
 * Layer: Networking / WebSocket Infrastructure
 * Responsibility: Manages active client socket sessions, validates JWT credentials upon handshake,
 * routes player movement payloads, and broadcasts authoritative state updates to participants in each room.
 *
 * Concurrency:
 * - Employs ConcurrentHashMaps and thread-safe sets for multi-room session multiplexing.
 * - Synchronizes on individual WebSocketSession instances during frame writing to prevent concurrent Tomcat socket write collisions.
 */
@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private final JwtUtil jwtUtil;
    private final RoomService roomService;
    private final UserService userService;
    private final com.battlearena.service.MatchService matchService;
    private final ObjectMapper mapper;

    // Session Registry
    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> sessionToRoom = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    private final ScheduledExecutorService respawnScheduler = Executors.newSingleThreadScheduledExecutor();

    public GameWebSocketHandler(JwtUtil jwtUtil, RoomService roomService, UserService userService,
                                com.battlearena.service.MatchService matchService, ObjectMapper mapper) {
        this.jwtUtil = jwtUtil;
        this.roomService = roomService;
        this.userService = userService;
        this.matchService = matchService;
        this.mapper = mapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);

        // Check if token and roomId were supplied via query parameters: /ws/game?token=...&roomId=...
        URI uri = session.getUri();
        if (uri != null && uri.getQuery() != null) {
            Map<String, String> queryParams = parseQuery(uri.getQuery());
            String token = queryParams.get("token");
            String roomId = queryParams.get("roomId");

            if (token != null && roomId != null) {
                authenticateAndJoin(session, token, roomId);
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        JsonNode root = mapper.readTree(payload);

        if (!root.has("type")) {
            return;
        }

        String type = root.get("type").asText();

        switch (type) {
            case "JOIN": {
                String token = root.has("token") ? root.get("token").asText() : null;
                String roomId = root.has("roomId") ? root.get("roomId").asText() : null;
                if (token != null && roomId != null) {
                    authenticateAndJoin(session, token, roomId);
                } else {
                    sendDirect(session, Map.of("type", "ERROR", "message", "Token and roomId are required"));
                }
                break;
            }
            case "MOVE": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());

                if (username != null && roomId != null && root.has("x") && root.has("y")) {
                    double x = root.get("x").asDouble();
                    double y = root.get("y").asDouble();
                    double heading = root.has("heading") ? root.get("heading").asDouble() : 0.0;

                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null) {
                        room.updatePlayerPosition(username, x, y, heading);

                        // Broadcast movement update to all other room members
                        Map<String, Object> update = Map.of(
                                "type", "PLAYER_MOVED",
                                "username", username,
                                "x", x,
                                "y", y,
                                "heading", heading
                        );
                        broadcastToRoomExcept(roomId, update, session.getId());

                        // Server-authoritative coin collision detection
                        if (room.getStatus() == RoomStatus.PLAYING) {
                            checkCoinCollisions(room, roomId, username);
                        }
                    }
                }
                break;
            }
            case "COLLECT": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null && root.has("coinId")) {
                    String coinId = root.get("coinId").asText();
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                        handleCoinCollection(room, roomId, username, coinId);
                    }
                }
                break;
            }
            case "ATTACK": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null) {
                    double heading = root.has("heading") ? root.get("heading").asDouble() : 0.0;
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                        Projectile proj = room.fireProjectile(username, heading);
                        if (proj != null) {
                            Map<String, Object> payloadMap = new LinkedHashMap<>();
                            payloadMap.put("type", "PROJECTILE_SPAWNED");
                            payloadMap.put("id", proj.getId());
                            payloadMap.put("shooter", proj.getShooterUsername());
                            payloadMap.put("x", proj.getStartX());
                            payloadMap.put("y", proj.getStartY());
                            payloadMap.put("vx", proj.getVx());
                            payloadMap.put("vy", proj.getVy());
                            payloadMap.put("heading", proj.getHeading());
                            payloadMap.put("speed", proj.getSpeed());
                            payloadMap.put("damage", proj.getDamage());
                            payloadMap.put("createdAt", proj.getCreatedAt());
                            broadcastToRoom(roomId, payloadMap);
                        }
                    }
                }
                break;
            }
            case "PROJECTILE_HIT": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null && root.has("projectileId") && root.has("targetUsername")) {
                    String projectileId = root.get("projectileId").asText();
                    String targetUsername = root.get("targetUsername").asText();
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                        handleProjectileHit(room, roomId, projectileId, targetUsername);
                    }
                }
                break;
            }
            case "PING": {
                sendDirect(session, Map.of("type", "PONG", "timestamp", System.currentTimeMillis()));
                break;
            }
            default:
                break;
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        String username = sessionToUser.remove(sessionId);
        String roomId = sessionToRoom.remove(sessionId);
        sessions.remove(sessionId);

        if (roomId != null) {
            Set<WebSocketSession> set = roomSessions.get(roomId);
            if (set != null) {
                set.remove(session);
                if (set.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }

            if (username != null) {
                broadcastToRoom(roomId, Map.of(
                        "type", "PLAYER_LEFT",
                        "username", username
                ));
            }
        }
    }

    private void authenticateAndJoin(WebSocketSession session, String token, String roomId) {
        if (!jwtUtil.validateToken(token)) {
            sendDirect(session, Map.of("type", "ERROR", "message", "Invalid or expired JWT token"));
            return;
        }

        String username = jwtUtil.extractUsername(token);
        if (username == null) {
            sendDirect(session, Map.of("type", "ERROR", "message", "Unable to extract user identity"));
            return;
        }

        sessionToUser.put(session.getId(), username);
        sessionToRoom.put(session.getId(), roomId);

        Set<WebSocketSession> set = roomSessions.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        set.add(session);

        // Notify user of successful connection
        sendDirect(session, Map.of(
                "type", "CONNECTED",
                "username", username,
                "roomId", roomId
        ));

        // If game is in progress, sync game state snapshot to the connecting user
        Room activeRoom = roomService.getActiveRoom(roomId);
        if (activeRoom != null && activeRoom.getStatus() == RoomStatus.PLAYING) {
            sendDirect(session, Map.of(
                    "type", "GAME_STATE_SNAPSHOT",
                    "roomId", roomId,
                    "coins", activeRoom.getCoins(),
                    "players", activeRoom.getGamePlayers(),
                    "projectiles", activeRoom.getProjectiles(),
                    "winningScore", Room.getWinningScore()
            ));
        }

        // Notify other room participants
        broadcastToRoomExcept(roomId, Map.of(
                "type", "PLAYER_JOINED",
                "username", username
        ), session.getId());
    }

    private void checkCoinCollisions(Room room, String roomId, String username) {
        GamePlayer player = room.getGamePlayer(username);
        if (player == null) {
            return;
        }

        for (Coin coin : room.getCoins()) {
            double dx = player.getX() - coin.getX();
            double dy = player.getY() - coin.getY();
            double maxDist = player.getRadius() + coin.getRadius() + 8.0;
            if (dx * dx + dy * dy <= maxDist * maxDist) {
                handleCoinCollection(room, roomId, username, coin.getId());
                break;
            }
        }
    }

    private synchronized void handleCoinCollection(Room room, String roomId, String username, String coinId) {
        Coin collected = room.collectCoin(username, coinId);
        if (collected != null) {
            GamePlayer player = room.getGamePlayer(username);
            int currentScore = (player != null) ? player.getScore() : 0;

            // Broadcast coin pickup
            broadcastToRoom(roomId, Map.of(
                    "type", "COIN_COLLECTED",
                    "coinId", collected.getId(),
                    "username", username,
                    "value", collected.getValue(),
                    "playerScore", currentScore
            ));

            // Spawn replacement coin
            Coin newCoin = room.spawnSingleCoin();
            if (newCoin != null) {
                broadcastToRoom(roomId, Map.of(
                        "type", "COIN_SPAWNED",
                        "coin", newCoin
                ));
            }

            // Check if game reached victory condition
            if (room.getStatus() == RoomStatus.FINISHED) {
                onMatchFinished(room, roomId);
            }
        }
    }

    private synchronized void handleProjectileHit(Room room, String roomId, String projectileId, String targetUsername) {
        Room.HitResult hit = room.validateAndApplyHit(projectileId, targetUsername);
        if (hit.isValid()) {
            // Broadcast damage event to room
            broadcastToRoom(roomId, Map.of(
                    "type", "PLAYER_DAMAGED",
                    "projectileId", hit.getProjectile().getId(),
                    "targetUsername", hit.getTarget().getUsername(),
                    "shooterUsername", hit.getShooter().getUsername(),
                    "damage", hit.getDamage(),
                    "currentHealth", hit.getTarget().getHealth(),
                    "maxHealth", hit.getTarget().getMaxHealth(),
                    "isEliminated", hit.isEliminated()
            ));

            if (hit.isEliminated()) {
                double[] respawnCoords = hit.getRespawnCoords();
                broadcastToRoom(roomId, Map.of(
                        "type", "PLAYER_ELIMINATED",
                        "victim", hit.getTarget().getUsername(),
                        "killer", hit.getShooter().getUsername(),
                        "victimDeaths", hit.getTarget().getDeaths(),
                        "killerKills", hit.getShooter().getKills(),
                        "killerScore", hit.getShooter().getScore(),
                        "respawnDelayMs", 2500,
                        "respawnX", (respawnCoords != null ? respawnCoords[0] : 400.0),
                        "respawnY", (respawnCoords != null ? respawnCoords[1] : 300.0)
                ));

                // Schedule automated respawn after 2.5 seconds
                final String victim = hit.getTarget().getUsername();
                final double rx = (respawnCoords != null ? respawnCoords[0] : 400.0);
                final double ry = (respawnCoords != null ? respawnCoords[1] : 300.0);
                respawnScheduler.schedule(() -> {
                    try {
                        Room r = roomService.getActiveRoom(roomId);
                        if (r != null && r.getStatus() == RoomStatus.PLAYING) {
                            r.respawnPlayer(victim, rx, ry);
                            broadcastToRoom(roomId, Map.of(
                                    "type", "PLAYER_RESPAWNED",
                                    "username", victim,
                                    "x", rx,
                                    "y", ry,
                                    "health", 100
                            ));
                        }
                    } catch (Exception e) {
                        // Ignore scheduler errors
                    }
                }, 2500, TimeUnit.MILLISECONDS);
            }

            if (hit.isMatchFinished()) {
                onMatchFinished(room, roomId);
            }
        }
    }

    private void onMatchFinished(Room room, String roomId) {
        Long matchId = null;
        try {
            com.battlearena.model.GameResult savedMatch = matchService.recordMatch(room);
            if (savedMatch != null) {
                matchId = savedMatch.getId();
            }
        } catch (Exception e) {
            // Ignore match persistence failure
        }

        Map<String, Object> gameOverPayload = new HashMap<>();
        gameOverPayload.put("type", "GAME_OVER");
        gameOverPayload.put("winner", room.getWinnerUsername());
        gameOverPayload.put("winningScore", Room.getWinningScore());
        gameOverPayload.put("players", room.getGamePlayers());
        if (matchId != null) {
            gameOverPayload.put("matchId", matchId);
        }
        broadcastToRoom(roomId, gameOverPayload);

        // Persist lifetime match scores to MySQL
        for (GamePlayer gp : room.getGamePlayers()) {
            try {
                userService.recordMatchResult(gp.getUsername(), gp.getScore());
            } catch (Exception e) {
                // Ignore persistence logging
            }
        }
    }

    public void broadcastToRoom(String roomId, Object payload) {
        Set<WebSocketSession> set = roomSessions.get(roomId);
        if (set == null || set.isEmpty()) {
            return;
        }

        try {
            TextMessage msg = new TextMessage(mapper.writeValueAsString(payload));
            for (WebSocketSession s : set) {
                sendSafe(s, msg);
            }
        } catch (Exception e) {
            // Log serialization failure
        }
    }

    public void broadcastToRoomExcept(String roomId, Object payload, String excludedSessionId) {
        Set<WebSocketSession> set = roomSessions.get(roomId);
        if (set == null || set.isEmpty()) {
            return;
        }

        try {
            TextMessage msg = new TextMessage(mapper.writeValueAsString(payload));
            for (WebSocketSession s : set) {
                if (!s.getId().equals(excludedSessionId)) {
                    sendSafe(s, msg);
                }
            }
        } catch (Exception e) {
            // Log serialization failure
        }
    }

    private void sendDirect(WebSocketSession session, Object payload) {
        try {
            TextMessage msg = new TextMessage(mapper.writeValueAsString(payload));
            sendSafe(session, msg);
        } catch (Exception e) {
            // Ignore write failures on terminated sessions
        }
    }

    private void sendSafe(WebSocketSession session, TextMessage msg) {
        if (session != null && session.isOpen()) {
            synchronized (session) {
                try {
                    session.sendMessage(msg);
                } catch (IOException e) {
                    // Session disconnected
                }
            }
        }
    }

    private Map<String, String> parseQuery(String query) {
        Map<String, String> result = new HashMap<>();
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0 && idx < pair.length() - 1) {
                result.put(pair.substring(0, idx), pair.substring(idx + 1));
            }
        }
        return result;
    }
}
