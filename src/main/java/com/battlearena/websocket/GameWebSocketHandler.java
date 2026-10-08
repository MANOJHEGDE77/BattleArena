package com.battlearena.websocket;

import com.battlearena.model.ChatMessage;
import com.battlearena.model.Coin;
import com.battlearena.model.GamePlayer;
import com.battlearena.model.Obstacle;
import com.battlearena.model.PowerUp;
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
import jakarta.annotation.PreDestroy;
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
        this.respawnScheduler.scheduleAtFixedRate(this::tickActiveRooms, 1, 1, TimeUnit.SECONDS);
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
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        sessions.remove(sessionId);
        String username = sessionToUser.remove(sessionId);
        String roomId = sessionToRoom.remove(sessionId);

        if (roomId != null) {
            Set<WebSocketSession> set = roomSessions.get(roomId);
            if (set != null) {
                set.remove(session);
                if (set.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }

            if (username != null) {
                Room room = roomService.getActiveRoom(roomId);
                if (room != null) {
                    if (room.getStatus() != RoomStatus.PLAYING) {
                        roomService.leaveCurrentRoom(username);
                        broadcastToRoom(roomId, Map.of(
                                "type", "PLAYER_LEFT",
                                "username", username,
                                "roomId", roomId
                        ));
                    } else {
                        broadcastToRoom(roomId, Map.of(
                                "type", "PLAYER_DISCONNECTED",
                                "username", username,
                                "roomId", roomId
                        ));
                        if (set == null || set.isEmpty()) {
                            roomService.leaveCurrentRoom(username);
                        }
                    }
                }
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

                        // Server-authoritative coin & power-up collision detection
                        if (room.getStatus() == RoomStatus.PLAYING) {
                            checkCoinCollisions(room, roomId, username);
                            checkPowerUpCollisions(room, roomId, username);
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
            case "COLLECT_POWERUP": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null && root.has("powerUpId")) {
                    String powerUpId = root.get("powerUpId").asText();
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                        handlePowerUpCollection(room, roomId, username, powerUpId);
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
                        List<Projectile> projs = room.fireProjectiles(username, heading);
                        for (Projectile proj : projs) {
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
            case "PROJECTILE_OBSTACLE_HIT": {
                String roomId = sessionToRoom.get(session.getId());
                if (roomId != null && root.has("projectileId")) {
                    String projectileId = root.get("projectileId").asText();
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                        Obstacle obs = room.checkProjectileObstacleCollision(projectileId);
                        if (obs != null) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "PROJECTILE_BLOCKED",
                                    "projectileId", projectileId,
                                    "obstacleId", obs.getId(),
                                    "reason", "OBSTACLE_IMPACT"
                            ));
                        }
                    }
                }
                break;
            }
            case "CHAT": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null && root.has("text")) {
                    String text = root.get("text").asText();
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null) {
                        ChatMessage chatMsg = room.addChatMessage(username, text, false);
                        if (chatMsg != null) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "CHAT_MESSAGE",
                                    "id", chatMsg.getId(),
                                    "username", chatMsg.getUsername(),
                                    "text", chatMsg.getText(),
                                    "timestamp", chatMsg.getTimestamp(),
                                    "system", chatMsg.isSystem()
                            ));
                        }
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
            Map<String, Object> snapshot = new LinkedHashMap<>();
            snapshot.put("type", "GAME_STATE_SNAPSHOT");
            snapshot.put("roomId", roomId);
            snapshot.put("coins", activeRoom.getCoins());
            snapshot.put("powerUps", activeRoom.getPowerUps());
            snapshot.put("players", activeRoom.getGamePlayers());
            snapshot.put("obstacles", activeRoom.getObstacles());
            snapshot.put("projectiles", activeRoom.getProjectiles());
            snapshot.put("winningScore", Room.getWinningScore());
            snapshot.put("matchDurationSeconds", Room.MATCH_DURATION_SECONDS);
            snapshot.put("timeRemaining", activeRoom.getTimeRemainingSeconds());
            snapshot.put("safeZoneRadius", activeRoom.getCurrentSafeZoneRadius());
            snapshot.put("suddenDeath", activeRoom.isSuddenDeathActive());
            snapshot.put("chatHistory", activeRoom.getChatHistory());
            sendDirect(session, snapshot);
        }

        // Notify other room participants
        broadcastToRoomExcept(roomId, Map.of(
                "type", "PLAYER_JOINED",
                "username", username
        ), session.getId());
    }

    private void checkPowerUpCollisions(Room room, String roomId, String username) {
        GamePlayer player = room.getGamePlayer(username);
        if (player == null || !player.isAlive()) {
            return;
        }

        for (PowerUp pu : room.getPowerUps()) {
            double dx = player.getX() - pu.getX();
            double dy = player.getY() - pu.getY();
            double maxDist = player.getRadius() + pu.getRadius() + 10.0;
            if (dx * dx + dy * dy <= maxDist * maxDist) {
                handlePowerUpCollection(room, roomId, username, pu.getId());
                break;
            }
        }
    }

    private synchronized void handlePowerUpCollection(Room room, String roomId, String username, String powerUpId) {
        PowerUp collected = room.collectPowerUp(username, powerUpId);
        if (collected != null) {
            GamePlayer player = room.getGamePlayer(username);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "POWER_UP_COLLECTED");
            payload.put("powerUpId", collected.getId());
            payload.put("powerUpType", collected.getType().name());
            payload.put("username", username);
            payload.put("durationMs", collected.getDurationMs());
            if (player != null) {
                payload.put("shield", player.getShield());
                payload.put("speedBoostUntil", player.getSpeedBoostUntil());
                payload.put("spreadShotUntil", player.getSpreadShotUntil());
            }
            broadcastToRoom(roomId, payload);
            broadcastSystemAnnouncement(room, roomId, "⚡ " + username + " collected " + collected.getType().name() + "!");

            // Spawn replacement power-up after 6 seconds delay
            respawnScheduler.schedule(() -> {
                try {
                    Room r = roomService.getActiveRoom(roomId);
                    if (r != null && r.getStatus() == RoomStatus.PLAYING) {
                        PowerUp newPu = r.spawnSinglePowerUp();
                        if (newPu != null) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "POWER_UP_SPAWNED",
                                    "powerUp", newPu
                            ));
                        }
                    }
                } catch (Exception ignored) {}
            }, 6000, TimeUnit.MILLISECONDS);
        }
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
            Map<String, Object> damagePayload = new LinkedHashMap<>();
            damagePayload.put("type", "PLAYER_DAMAGED");
            damagePayload.put("projectileId", hit.getProjectile().getId());
            damagePayload.put("targetUsername", hit.getTarget().getUsername());
            damagePayload.put("shooterUsername", hit.getShooter().getUsername());
            damagePayload.put("damage", hit.getDamage());
            damagePayload.put("shieldDamage", hit.getShieldDamage());
            damagePayload.put("healthDamage", hit.getHealthDamage());
            damagePayload.put("currentShield", hit.getTarget().getShield());
            damagePayload.put("currentHealth", hit.getTarget().getHealth());
            damagePayload.put("maxHealth", hit.getTarget().getMaxHealth());
            damagePayload.put("isEliminated", hit.isEliminated());
            broadcastToRoom(roomId, damagePayload);

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
                broadcastSystemAnnouncement(room, roomId, "☠️ " + hit.getShooter().getUsername() + " eliminated " + hit.getTarget().getUsername() + "!");

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
        } else if (hit.isBlockedByCover()) {
            broadcastToRoom(roomId, Map.of(
                    "type", "PROJECTILE_BLOCKED",
                    "projectileId", projectileId,
                    "targetUsername", targetUsername,
                    "reason", "OBSTACLE_COVER"
            ));
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
        broadcastSystemAnnouncement(room, roomId, "🏆 VICTORY: " + room.getWinnerUsername() + " won the arena match!");

        // Persist lifetime match scores to MySQL
        for (GamePlayer gp : room.getGamePlayers()) {
            try {
                userService.recordMatchResult(gp.getUsername(), gp.getScore());
            } catch (Exception e) {
                // Ignore persistence logging
            }
        }
    }

    public void broadcastSystemAnnouncement(Room room, String roomId, String text) {
        if (room != null && text != null) {
            ChatMessage sysMsg = room.addChatMessage("SYSTEM", text, true);
            if (sysMsg != null) {
                broadcastToRoom(roomId, Map.of(
                        "type", "CHAT_MESSAGE",
                        "id", sysMsg.getId(),
                        "username", sysMsg.getUsername(),
                        "text", sysMsg.getText(),
                        "timestamp", sysMsg.getTimestamp(),
                        "system", true
                ));
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

    private void tickActiveRooms() {
        for (String roomId : roomSessions.keySet()) {
            try {
                Room room = roomService.getActiveRoom(roomId);
                if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                    // 1. Check timer expiration
                    if (room.checkMatchTimerExpired()) {
                        onMatchFinished(room, roomId);
                        continue;
                    }

                    // 2. Broadcast ZONE_TICK with current radius and time remaining
                    long timeRemaining = room.getTimeRemainingSeconds();
                    double radius = room.getCurrentSafeZoneRadius();
                    boolean suddenDeath = room.isSuddenDeathActive();

                    broadcastToRoom(roomId, Map.of(
                            "type", "ZONE_TICK",
                            "timeRemaining", timeRemaining,
                            "safeZoneRadius", Math.round(radius * 10.0) / 10.0,
                            "suddenDeath", suddenDeath
                    ));

                    // 3. Process zone storm tick damage for combatants outside perimeter
                    List<Room.ZoneDamageEvent> dmgEvents = room.tickZoneDamage();
                    for (Room.ZoneDamageEvent evt : dmgEvents) {
                        broadcastToRoom(roomId, Map.of(
                                "type", "ZONE_DAMAGE",
                                "username", evt.username(),
                                "damage", evt.damage(),
                                "currentHealth", evt.currentHealth(),
                                "currentShield", evt.currentShield(),
                                "isEliminated", evt.eliminated()
                        ));

                        if (evt.eliminated()) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "PLAYER_ELIMINATED",
                                    "victim", evt.username(),
                                    "killer", "THE_STORM",
                                    "victimDeaths", room.getGamePlayer(evt.username()).getDeaths(),
                                    "killerKills", 0,
                                    "killerScore", 0,
                                    "respawnDelayMs", 2500,
                                    "respawnX", 400.0,
                                    "respawnY", 300.0
                            ));
                            final String victim = evt.username();
                            respawnScheduler.schedule(() -> {
                                try {
                                    Room r = roomService.getActiveRoom(roomId);
                                    if (r != null && r.getStatus() == RoomStatus.PLAYING) {
                                        r.respawnPlayer(victim, 400.0, 300.0);
                                        broadcastToRoom(roomId, Map.of(
                                                "type", "PLAYER_RESPAWNED",
                                                "username", victim,
                                                "x", 400.0,
                                                "y", 300.0,
                                                "health", 100
                                        ));
                                    }
                                } catch (Exception ignored) {}
                            }, 2500, TimeUnit.MILLISECONDS);
                        }
                    }
                }
            } catch (Exception ignored) {
                // Ignore transient ticker error
            }
        }
    }

    @PreDestroy
    public void destroy() {
        respawnScheduler.shutdownNow();
    }
}
