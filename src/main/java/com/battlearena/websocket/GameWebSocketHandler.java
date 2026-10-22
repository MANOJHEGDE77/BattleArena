package com.battlearena.websocket;

import com.battlearena.model.ArenaHazard;
import com.battlearena.model.ChatMessage;
import com.battlearena.model.Coin;
import com.battlearena.model.GamePlayer;
import com.battlearena.model.Obstacle;
import com.battlearena.model.PowerUp;
import com.battlearena.model.Projectile;
import com.battlearena.model.Room;
import com.battlearena.model.RoomStatus;
import com.battlearena.model.WarriorClass;
import com.battlearena.model.EmoteType;
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

    private static final long EMOTE_COOLDOWN_MS = 1200L;

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
    private final ConcurrentMap<String, Long> lastEmoteTimes = new ConcurrentHashMap<>();
    private final ScheduledExecutorService respawnScheduler = Executors.newSingleThreadScheduledExecutor();
    private long tickCounter = 0;

    public GameWebSocketHandler(JwtUtil jwtUtil, RoomService roomService, UserService userService,
                                com.battlearena.service.MatchService matchService, ObjectMapper mapper) {
        this.jwtUtil = jwtUtil;
        this.roomService = roomService;
        this.userService = userService;
        this.matchService = matchService;
        this.mapper = mapper;
        this.respawnScheduler.scheduleAtFixedRate(this::tickActiveRooms, 200, 200, TimeUnit.MILLISECONDS);
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
                lastEmoteTimes.remove(username);
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
        if (payload == null || payload.length() > 4096) {
            return; // Anti-flood payload size limit
        }

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
                    if (!Double.isFinite(x) || !Double.isFinite(y) || x < -50 || x > 850 || y < -50 || y > 650) {
                        break; // Reject invalid / out-of-bounds coordinates
                    }
                    double heading = root.has("heading") ? root.get("heading").asDouble() : 0.0;
                    if (!Double.isFinite(heading)) heading = 0.0;

                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && !room.isSpectator(username)) {
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
                    if (room != null && room.getStatus() == RoomStatus.PLAYING && !room.isSpectator(username)) {
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
                    if (room != null && room.getStatus() == RoomStatus.PLAYING && !room.isSpectator(username)) {
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
                    String trail = root.has("equippedTrail") ? root.get("equippedTrail").asText() : "CYAN_PULSE";
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING && !room.isSpectator(username)) {
                        List<Projectile> projs = room.fireProjectiles(username, heading);
                        for (Projectile proj : projs) {
                            Map<String, Object> payloadMap = new LinkedHashMap<>();
                            payloadMap.put("type", "PROJECTILE_SPAWNED");
                            payloadMap.put("id", proj.getId());
                            payloadMap.put("shooter", proj.getShooterUsername());
                            payloadMap.put("equippedTrail", trail);
                            payloadMap.put("x", proj.getStartX());
                            payloadMap.put("y", proj.getStartY());
                            payloadMap.put("vx", proj.getVx());
                            payloadMap.put("vy", proj.getVy());
                            payloadMap.put("heading", proj.getHeading());
                            payloadMap.put("speed", proj.getSpeed());
                            payloadMap.put("damage", proj.getDamage());
                            payloadMap.put("radius", proj.getRadius());
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
                    if (room != null && room.getStatus() == RoomStatus.PLAYING && !room.isSpectator(username)) {
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
            case "PROJECTILE_HAZARD_HIT": {
                String roomId = sessionToRoom.get(session.getId());
                if (roomId != null && root.has("projectileId")) {
                    String projectileId = root.get("projectileId").asText();
                    String hazardId = root.has("hazardId") ? root.get("hazardId").asText() : null;
                    Room room = roomService.getActiveRoom(roomId);
                    if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                        Room.BarrelExplosionEvent exp = room.checkProjectileBarrelCollision(projectileId, hazardId);
                        if (exp != null) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "BARREL_EXPLODED",
                                    "barrelId", exp.barrelId(),
                                    "x", exp.x(),
                                    "y", exp.y(),
                                    "blastRadius", exp.blastRadius(),
                                    "victims", exp.victims()
                            ));
                            for (Room.HazardDamageEvent v : exp.victims()) {
                                if (v.eliminated()) {
                                    eliminatePlayerByHazard(room, roomId, v.username(), "VOLATILE_BARREL");
                                }
                            }
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
            case "SELECT_CLASS": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null && root.has("warriorClass")) {
                    String className = root.get("warriorClass").asText();
                    try {
                        WarriorClass wc = WarriorClass.valueOf(className.toUpperCase());
                        Room r = roomService.getActiveRoom(roomId);
                        if (r != null && r.getStatus() != RoomStatus.PLAYING) {
                            r.setPlayerWarriorClass(username, wc);
                            broadcastToRoom(roomId, Map.of(
                                    "type", "ROOM_UPDATED",
                                    "roomId", roomId,
                                    "username", username,
                                    "warriorClass", wc.name()
                            ));
                        }
                    } catch (Exception ignored) {}
                }
                break;
            }
            case "EMOTE": {
                String username = sessionToUser.get(session.getId());
                String roomId = sessionToRoom.get(session.getId());
                if (username != null && roomId != null && root.has("emoteId")) {
                    String emoteId = root.get("emoteId").asText();
                    handleEmote(roomId, username, emoteId, root);
                }
                break;
            }
            case "PING": {
                long clientTime = root.has("clientTime") ? root.get("clientTime").asLong() : 0L;
                Map<String, Object> pong = new LinkedHashMap<>();
                pong.put("type", "PONG");
                pong.put("timestamp", System.currentTimeMillis());
                if (clientTime > 0) {
                    pong.put("clientTime", clientTime);
                }
                sendDirect(session, pong);
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

        // Cleanup existing stale session for this user if present
        for (Map.Entry<String, String> entry : sessionToUser.entrySet()) {
            if (entry.getValue().equals(username) && !entry.getKey().equals(session.getId())) {
                WebSocketSession oldSession = sessions.remove(entry.getKey());
                if (oldSession != null && oldSession.isOpen()) {
                    try {
                        oldSession.close(CloseStatus.NORMAL.withReason("Connected from another session"));
                    } catch (Exception ignored) {}
                }
            }
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
            snapshot.put("mapId", activeRoom.getMapId());
            snapshot.put("coins", activeRoom.getCoins());
            snapshot.put("powerUps", activeRoom.getPowerUps());
            snapshot.put("players", activeRoom.getGamePlayers());
            snapshot.put("obstacles", activeRoom.getObstacles());
            snapshot.put("hazards", activeRoom.getHazards());
            snapshot.put("projectiles", activeRoom.getProjectiles());
            snapshot.put("winningScore", activeRoom.getTargetWinningScore());
            snapshot.put("gameMode", activeRoom.getGameMode());
            snapshot.put("matchDurationSeconds", Room.MATCH_DURATION_SECONDS);
            snapshot.put("timeRemaining", activeRoom.getTimeRemainingSeconds());
            snapshot.put("safeZoneRadius", activeRoom.getCurrentSafeZoneRadius());
            snapshot.put("suddenDeath", activeRoom.isSuddenDeathActive());
            snapshot.put("beaconActive", activeRoom.isBeaconActive());
            snapshot.put("beaconX", activeRoom.getBeaconX());
            snapshot.put("beaconY", activeRoom.getBeaconY());
            snapshot.put("beaconRadius", activeRoom.getBeaconRadius());
            snapshot.put("beaconCapturedBy", activeRoom.getBeaconCapturedBy());
            snapshot.put("chatHistory", activeRoom.getChatHistory());
            snapshot.put("isSpectator", activeRoom.isSpectator(username));
            sendDirect(session, snapshot);
        }

        // Notify other room participants
        boolean isSpectator = activeRoom != null && activeRoom.isSpectator(username);
        com.battlearena.model.PlayerRoomState prs = (activeRoom != null) ? activeRoom.getPlayerState(username) : null;
        String wClass = (prs != null && prs.getWarriorClass() != null) ? prs.getWarriorClass().name() : "ASSAULT";
        Map<String, Object> joinPayload = new HashMap<>();
        joinPayload.put("type", "PLAYER_JOINED");
        joinPayload.put("username", username);
        joinPayload.put("spectator", isSpectator);
        joinPayload.put("warriorClass", wClass);
        broadcastToRoomExcept(roomId, joinPayload, session.getId());
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
                double dist = Math.hypot(hit.getShooter().getX() - hit.getTarget().getX(),
                                         hit.getShooter().getY() - hit.getTarget().getY());
                String weaponName = hit.getShooter().getWarriorClass() != null ? hit.getShooter().getWarriorClass().getWeaponName() : "Pulse Blaster";
                String className = hit.getShooter().getWarriorClass() != null ? hit.getShooter().getWarriorClass().name() : "ASSAULT";

                room.recordCombatEvent("ELIMINATION", hit.getShooter().getUsername(), hit.getTarget().getUsername(), weaponName, hit.getDamage(), (int)Math.round(dist));

                Map<String, Object> elimPayload = new LinkedHashMap<>();
                elimPayload.put("type", "PLAYER_ELIMINATED");
                elimPayload.put("victim", hit.getTarget().getUsername());
                elimPayload.put("killer", hit.getShooter().getUsername());
                elimPayload.put("victimDeaths", hit.getTarget().getDeaths());
                elimPayload.put("killerKills", hit.getShooter().getKills());
                elimPayload.put("killerScore", hit.getShooter().getScore());
                elimPayload.put("respawnDelayMs", 2500);
                elimPayload.put("respawnX", (respawnCoords != null ? respawnCoords[0] : 400.0));
                elimPayload.put("respawnY", (respawnCoords != null ? respawnCoords[1] : 300.0));
                elimPayload.put("killerHealth", hit.getShooter().getHealth());
                elimPayload.put("killerMaxHealth", hit.getShooter().getMaxHealth());
                elimPayload.put("killerShield", hit.getShooter().getShield());
                elimPayload.put("killerMaxShield", hit.getShooter().getMaxShield());
                elimPayload.put("killerClass", className);
                elimPayload.put("weaponName", weaponName);
                elimPayload.put("distance", Math.round(dist));
                elimPayload.put("finalDamage", hit.getDamage());
                broadcastToRoom(roomId, elimPayload);

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
        gameOverPayload.put("combatEvents", room.getCombatEvents());
        if (matchId != null) {
            gameOverPayload.put("matchId", matchId);
        }
        broadcastToRoom(roomId, gameOverPayload);
        broadcastSystemAnnouncement(room, roomId, "🏆 VICTORY: " + room.getWinnerUsername() + " won the arena match!");

        // Persist lifetime match scores & progression to MySQL (human players only)
        for (GamePlayer gp : room.getGamePlayers()) {
            if (!gp.isBot()) {
                try {
                    boolean won = gp.getUsername().equals(room.getWinnerUsername());
                    String wClass = gp.getWarriorClass() != null ? gp.getWarriorClass().name() : "ASSAULT";
                    userService.recordMatchResult(gp.getUsername(), gp.getScore(), gp.getKills(), gp.getDeaths(), won, wClass);
                } catch (Exception e) {
                    // Ignore persistence logging
                }
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

    private void handleEmote(String roomId, String username, String emoteId, JsonNode root) {
        Room room = roomService.getActiveRoom(roomId);
        if (room == null) return;

        long now = System.currentTimeMillis();
        Long lastTime = lastEmoteTimes.get(username);
        if (lastTime != null && (now - lastTime) < EMOTE_COOLDOWN_MS) {
            return; // Anti-spam rate limit
        }
        lastEmoteTimes.put(username, now);

        EmoteType emote;
        try {
            emote = EmoteType.valueOf(emoteId.toUpperCase());
        } catch (Exception ex) {
            return;
        }

        GamePlayer player = room.getGamePlayer(username);
        double px = player != null ? player.getX() : 400.0;
        double py = player != null ? player.getY() : 300.0;

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("type", "EMOTE_TRIGGERED");
        payload.put("username", username);
        payload.put("emoteId", emote.getId());
        payload.put("icon", emote.getIcon());
        payload.put("label", emote.getLabel());
        payload.put("category", emote.getCategory());
        payload.put("x", px);
        payload.put("y", py);
        payload.put("timestamp", now);
        if (root.has("targetX") && root.has("targetY")) {
            payload.put("targetX", root.get("targetX").asDouble());
            payload.put("targetY", root.get("targetY").asDouble());
        }

        broadcastToRoom(roomId, payload);

        // Also broadcast as a distinct chat message so all players can read it in their log
        broadcastToRoom(roomId, Map.of(
                "type", "CHAT_MESSAGE",
                "id", UUID.randomUUID().toString(),
                "username", username,
                "text", emote.getIcon() + " " + emote.getLabel(),
                "timestamp", now,
                "system", false,
                "isEmote", true
        ));
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

    public void broadcastGameStart(Room room, String roomId) {
        Set<WebSocketSession> set = roomSessions.get(roomId);
        if (set == null || set.isEmpty()) {
            return;
        }

        for (WebSocketSession s : set) {
            String uname = sessionToUser.get(s.getId());
            boolean isSpectator = (room != null && uname != null && room.isSpectator(uname));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "GAME_START");
            payload.put("roomId", roomId);
            if (room != null) {
                payload.put("mapId", room.getMapId());
                payload.put("coins", room.getCoins());
                payload.put("powerUps", room.getPowerUps());
                payload.put("players", room.getGamePlayers());
                payload.put("obstacles", room.getObstacles());
                payload.put("hazards", room.getHazards());
                payload.put("winningScore", room.getTargetWinningScore());
                payload.put("gameMode", room.getGameMode());
                payload.put("matchDurationSeconds", Room.MATCH_DURATION_SECONDS);
                payload.put("timeRemaining", room.getTimeRemainingSeconds());
                payload.put("safeZoneRadius", room.getCurrentSafeZoneRadius());
                payload.put("suddenDeath", room.isSuddenDeathActive());
                payload.put("beaconActive", room.isBeaconActive());
                payload.put("beaconX", room.getBeaconX());
                payload.put("beaconY", room.getBeaconY());
                payload.put("beaconRadius", room.getBeaconRadius());
            }
            payload.put("isSpectator", isSpectator);

            sendDirect(s, payload);
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
        tickCounter++;
        boolean isSecondTick = (tickCounter % 5 == 0);

        for (String roomId : roomSessions.keySet()) {
            try {
                Room room = roomService.getActiveRoom(roomId);
                if (room != null && room.getStatus() == RoomStatus.PLAYING) {
                    if (isSecondTick) {
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
                                    "eliminated", evt.eliminated()
                            ));

                            if (evt.eliminated()) {
                                eliminatePlayerByHazard(room, roomId, evt.username(), "THE_STORM");
                            }
                        }

                        // 4. Process Jump Pads (Kinetic Boost)
                        List<Room.JumpPadEvent> padEvents = room.tickJumpPads();
                        for (Room.JumpPadEvent evt : padEvents) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "JUMP_PAD_LAUNCHED",
                                    "hazardId", evt.hazardId(),
                                    "username", evt.username(),
                                    "launchX", evt.launchX(),
                                    "launchY", evt.launchY(),
                                    "boostAngle", evt.boostAngle(),
                                    "boostPower", evt.boostPower()
                            ));
                        }

                        // 5. Process Thermal Plasma Lava Pools
                        List<Room.HazardDamageEvent> lavaEvents = room.tickLavaPools();
                        for (Room.HazardDamageEvent evt : lavaEvents) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "HAZARD_DAMAGE",
                                    "hazardId", evt.hazardId(),
                                    "username", evt.username(),
                                    "damage", evt.damage(),
                                    "currentHealth", evt.currentHealth(),
                                    "currentShield", evt.currentShield(),
                                    "eliminated", evt.eliminated()
                            ));
                            if (evt.eliminated()) {
                                eliminatePlayerByHazard(room, roomId, evt.username(), "PLASMA_FIELD");
                            }
                        }

                        // 6. Respawn explosive barrels if timer elapsed
                        room.tickBarrelRespawns();

                        // 6b. Tick Overcharge Beacon Dynamic Arena Event
                        boolean wasBeaconActive = room.isBeaconActive();
                        boolean nowBeaconActive = room.checkBeaconActiveState(timeRemaining);
                        String capturingUser = null;

                        if (nowBeaconActive) {
                            double bx = room.getBeaconX();
                            double by = room.getBeaconY();
                            double br = room.getBeaconRadius();

                            for (GamePlayer gp : room.getGamePlayers()) {
                                if (gp.isAlive()) {
                                    double d2 = Math.hypot(gp.getX() - bx, gp.getY() - by);
                                    if (d2 <= br) {
                                        capturingUser = gp.getUsername();
                                        // Award capture bonus points and overshield
                                        gp.addScore(2);
                                        if (gp.getShield() < gp.getMaxShield()) {
                                            gp.addShield(6);
                                        }
                                        if (gp.getScore() >= room.getTargetWinningScore()) {
                                            onMatchFinished(room, roomId);
                                            break;
                                        }
                                        break;
                                    }
                                }
                            }
                            room.setBeaconCapturedBy(capturingUser);
                        }

                        if (wasBeaconActive != nowBeaconActive || capturingUser != null) {
                            broadcastToRoom(roomId, Map.of(
                                    "type", "BEACON_UPDATE",
                                    "active", nowBeaconActive,
                                    "x", room.getBeaconX(),
                                    "y", room.getBeaconY(),
                                    "radius", room.getBeaconRadius(),
                                    "capturedBy", capturingUser != null ? capturingUser : ""
                            ));
                        }
                    }

                    // 7. Tick autonomous Cyber AI Combat Bots (5 Hz smooth update, dt = 0.20s)
                    tickBots(room, roomId, 0.20);
                }
            } catch (Exception ignored) {
                // Ignore transient ticker error
            }
        }
    }

    private void tickBots(Room room, String roomId, double dt) {
        if (room == null || room.getStatus() != RoomStatus.PLAYING) return;

        Collection<GamePlayer> allPlayers = room.getGamePlayers();
        List<GamePlayer> bots = allPlayers.stream()
                .filter(GamePlayer::isBot)
                .filter(GamePlayer::isAlive)
                .toList();

        if (bots.isEmpty()) return;

        List<GamePlayer> humanOpponents = allPlayers.stream()
                .filter(p -> p.isAlive() && !p.isBot())
                .toList();

        Random rnd = new Random();
        String difficulty = room.getBotDifficulty();
        boolean isElite = "ELITE".equalsIgnoreCase(difficulty) || "NIGHTMARE".equalsIgnoreCase(difficulty);
        boolean isRecruit = "RECRUIT".equalsIgnoreCase(difficulty);

        double speedMult = isRecruit ? 0.35 : (isElite ? 0.62 : 0.48);
        double aimVariance = isRecruit ? 0.28 : (isElite ? 0.05 : 0.12);
        double dodgeChance = isRecruit ? 0.15 : (isElite ? 0.85 : 0.50);
        double powerupSearchRadius = isRecruit ? 130.0 : (isElite ? 340.0 : 220.0);
        int coverHpThreshold = isRecruit ? 25 : (isElite ? 60 : 45);

        for (GamePlayer bot : bots) {
            List<GamePlayer> candidates = !humanOpponents.isEmpty() ? humanOpponents :
                    allPlayers.stream().filter(p -> p.isAlive() && !p.getUsername().equals(bot.getUsername())).toList();

            // 1. Sensible Target Selection (prioritize low HP, close range, or exposed targets)
            GamePlayer target = null;
            double bestPriorityScore = -Double.MAX_VALUE;
            double minDist = Double.MAX_VALUE;

            for (GamePlayer cand : candidates) {
                double d = Math.hypot(cand.getX() - bot.getX(), cand.getY() - bot.getY());
                double priorityScore = (cand.getHealth() < 40 ? 40.0 : 0.0) - (d * 0.1);
                // Check if target is out of cover
                boolean clearLos = true;
                for (Obstacle obs : room.getObstacles()) {
                    if (obs.intersectsSegment(bot.getX(), bot.getY(), cand.getX(), cand.getY())) {
                        clearLos = false;
                        break;
                    }
                }
                if (clearLos) {
                    priorityScore += 30.0;
                }
                if (priorityScore > bestPriorityScore) {
                    bestPriorityScore = priorityScore;
                    target = cand;
                    minDist = d;
                }
            }

            double newX = bot.getX();
            double newY = bot.getY();
            double heading = bot.getHeading();

            if (target != null) {
                double dx = target.getX() - bot.getX();
                double dy = target.getY() - bot.getY();
                heading = Math.atan2(dy, dx);

                double moveSpeed = bot.getSpeed() * speedMult * dt;
                double stepX = 0;
                double stepY = 0;

                // 2. Weapon-Specific Engagement Spacing
                double idealMinDist = 200.0;
                double idealMaxDist = 300.0;
                WarriorClass wClass = bot.getWarriorClass() != null ? bot.getWarriorClass() : WarriorClass.ASSAULT;
                switch (wClass) {
                    case SNIPER -> {
                        idealMinDist = 340.0;
                        idealMaxDist = 480.0;
                    }
                    case JUGGERNAUT -> {
                        idealMinDist = 140.0;
                        idealMaxDist = 230.0;
                    }
                    case SCOUT -> {
                        idealMinDist = 130.0;
                        idealMaxDist = 220.0;
                    }
                    default -> {
                        idealMinDist = 200.0;
                        idealMaxDist = 320.0;
                    }
                }

                // 3. Cover-Seeking Behavior when health is critical
                boolean seekingCover = (bot.getHealth() <= coverHpThreshold || (bot.getShield() == 0 && bot.getHealth() < 70));
                Obstacle coverObstacle = null;
                if (seekingCover) {
                    double closestObsDist = Double.MAX_VALUE;
                    for (Obstacle obs : room.getObstacles()) {
                        double ox = obs.getX() + obs.getWidth() / 2.0;
                        double oy = obs.getY() + obs.getHeight() / 2.0;
                        double od = Math.hypot(ox - bot.getX(), oy - bot.getY());
                        if (od < closestObsDist) {
                            closestObsDist = od;
                            coverObstacle = obs;
                        }
                    }
                }

                // 4. Power-Up Scavenging when damaged
                PowerUp targetPowerUp = null;
                if (bot.getHealth() < bot.getMaxHealth() || bot.getShield() < bot.getMaxShield()) {
                    double closestPuDist = powerupSearchRadius;
                    for (PowerUp pu : room.getPowerUps()) {
                        double pud = Math.hypot(pu.getX() - bot.getX(), pu.getY() - bot.getY());
                        if (pud < closestPuDist) {
                            closestPuDist = pud;
                            targetPowerUp = pu;
                        }
                    }
                }

                // 5. Incoming Projectile Dodge Impulse
                double dodgeImpulseX = 0;
                double dodgeImpulseY = 0;
                if (rnd.nextDouble() < dodgeChance) {
                    for (Projectile proj : room.getProjectiles()) {
                        if (!proj.getShooterUsername().equals(bot.getUsername())) {
                            double pdx = proj.getCurrentX(System.currentTimeMillis()) - bot.getX();
                            double pdy = proj.getCurrentY(System.currentTimeMillis()) - bot.getY();
                            double pdist = Math.hypot(pdx, pdy);
                            if (pdist < 150.0) {
                                // Projectile is close: evade perpendicular to bullet trajectory
                                double evadeAngle = proj.getHeading() + (rnd.nextBoolean() ? Math.PI / 2.0 : -Math.PI / 2.0);
                                dodgeImpulseX = Math.cos(evadeAngle) * (moveSpeed * 0.9);
                                dodgeImpulseY = Math.sin(evadeAngle) * (moveSpeed * 0.9);
                                break;
                            }
                        }
                    }
                }

                // 6. Navigation Priority Hierarchy
                double distFromCenter = Math.hypot(bot.getX() - 400.0, bot.getY() - 300.0);
                double currentRadius = room.getCurrentSafeZoneRadius();

                if (distFromCenter > currentRadius * 0.82) {
                    // Highest priority: Return to safe zone storm perimeter
                    double centerAngle = Math.atan2(300.0 - bot.getY(), 400.0 - bot.getX());
                    stepX = Math.cos(centerAngle) * moveSpeed;
                    stepY = Math.sin(centerAngle) * moveSpeed;
                    heading = centerAngle;
                } else if (coverObstacle != null) {
                    // Seek tactical cover: move to side of obstacle opposite to opponent
                    double ox = coverObstacle.getX() + coverObstacle.getWidth() / 2.0;
                    double oy = coverObstacle.getY() + coverObstacle.getHeight() / 2.0;
                    double safeX = ox + Math.signum(ox - target.getX()) * (coverObstacle.getWidth() / 2.0 + 25.0);
                    double safeY = oy + Math.signum(oy - target.getY()) * (coverObstacle.getHeight() / 2.0 + 25.0);
                    double toCoverAngle = Math.atan2(safeY - bot.getY(), safeX - bot.getX());
                    stepX = Math.cos(toCoverAngle) * moveSpeed;
                    stepY = Math.sin(toCoverAngle) * moveSpeed;
                } else if (targetPowerUp != null) {
                    // Scavenge nearby power-up
                    double toPuAngle = Math.atan2(targetPowerUp.getY() - bot.getY(), targetPowerUp.getX() - bot.getX());
                    stepX = Math.cos(toPuAngle) * moveSpeed;
                    stepY = Math.sin(toPuAngle) * moveSpeed;
                } else if (minDist > idealMaxDist) {
                    // Approach to ideal weapon range
                    stepX = Math.cos(heading) * moveSpeed;
                    stepY = Math.sin(heading) * moveSpeed;
                } else if (minDist < idealMinDist) {
                    // Backpedal to maintain tactical spacing
                    stepX = -Math.cos(heading) * (moveSpeed * 0.7);
                    stepY = -Math.sin(heading) * (moveSpeed * 0.7);
                } else {
                    // Dynamic strafing run around the target
                    double strafeAngle = heading + (rnd.nextBoolean() ? Math.PI / 2.0 : -Math.PI / 2.0);
                    stepX = Math.cos(strafeAngle) * (moveSpeed * 0.75);
                    stepY = Math.sin(strafeAngle) * (moveSpeed * 0.75);
                }

                // Add evasion impulse
                stepX += dodgeImpulseX;
                stepY += dodgeImpulseY;

                // 7. Environmental Hazard Repulsion (Lava pools & Explosive Barrels)
                for (ArenaHazard h : room.getHazards()) {
                    if (h.isActive() && h.getType() == ArenaHazard.HazardType.LAVA_POOL) {
                        double lhDist = Math.hypot(bot.getX() - h.getX(), bot.getY() - h.getY());
                        if (lhDist < 58.0) {
                            double pushAngle = Math.atan2(bot.getY() - h.getY(), bot.getX() - h.getX());
                            stepX += Math.cos(pushAngle) * (100.0 * dt);
                            stepY += Math.sin(pushAngle) * (100.0 * dt);
                        }
                    }
                }

                // 8. Obstacle Collision Resolution & Sliding
                double candX = Math.max(30.0, Math.min(770.0, bot.getX() + stepX));
                double candY = Math.max(30.0, Math.min(570.0, bot.getY() + stepY));

                if (!room.isPositionInsideAnyObstacle(candX, candY, bot.getRadius())) {
                    newX = candX;
                    newY = candY;
                } else if (!room.isPositionInsideAnyObstacle(candX, bot.getY(), bot.getRadius())) {
                    newX = candX;
                } else if (!room.isPositionInsideAnyObstacle(bot.getX(), candY, bot.getRadius())) {
                    newY = candY;
                }

                room.updatePlayerPosition(bot.getUsername(), newX, newY, heading);

                broadcastToRoom(roomId, Map.of(
                        "type", "PLAYER_MOVED",
                        "username", bot.getUsername(),
                        "x", newX,
                        "y", newY,
                        "heading", heading,
                        "warriorClass", bot.getWarriorClass().name()
                ));

                checkCoinCollisions(room, roomId, bot.getUsername());
                checkPowerUpCollisions(room, roomId, bot.getUsername());

                // 9. Controlled Aim & Weapon Firing with Line-of-Sight Check
                double maxEngagementRange = isRecruit ? 320.0 : (isElite ? 480.0 : 420.0);
                if (minDist <= maxEngagementRange) {
                    // Check direct line of sight; do not fire if blocked by obstacle
                    boolean hasLineOfSight = true;
                    for (Obstacle obs : room.getObstacles()) {
                        if (obs.intersectsSegment(bot.getX(), bot.getY(), target.getX(), target.getY())) {
                            hasLineOfSight = false;
                            break;
                        }
                    }

                    if (hasLineOfSight) {
                        // Apply controlled aim variance and lead offset
                        double aimHeading = heading + (rnd.nextDouble() - 0.5) * aimVariance;
                        List<Projectile> projs = room.fireProjectiles(bot.getUsername(), aimHeading);
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
                            payloadMap.put("radius", proj.getRadius());
                            payloadMap.put("createdAt", proj.getCreatedAt());
                            broadcastToRoom(roomId, payloadMap);
                        }
                    }
                }
            }
        }
    }

    private void eliminatePlayerByHazard(Room room, String roomId, String victim, String killerName) {
        GamePlayer gp = room.getGamePlayer(victim);
        int victimDeaths = (gp != null) ? gp.getDeaths() : 0;
        String hazardWeapon = killerName.contains("STORM") ? "Thermal Storm" : "Volatile Barrel";
        room.recordCombatEvent("HAZARD_ELIMINATION", killerName, victim, hazardWeapon, 100, 0);

        Map<String, Object> elimPayload = new LinkedHashMap<>();
        elimPayload.put("type", "PLAYER_ELIMINATED");
        elimPayload.put("victim", victim);
        elimPayload.put("killer", killerName);
        elimPayload.put("victimDeaths", victimDeaths);
        elimPayload.put("killerKills", 0);
        elimPayload.put("killerScore", 0);
        elimPayload.put("respawnDelayMs", 2500);
        elimPayload.put("respawnX", 400.0);
        elimPayload.put("respawnY", 300.0);
        elimPayload.put("killerHealth", 100);
        elimPayload.put("killerMaxHealth", 100);
        elimPayload.put("killerShield", 0);
        elimPayload.put("killerMaxShield", 0);
        elimPayload.put("killerClass", "HAZARD");
        elimPayload.put("weaponName", hazardWeapon);
        elimPayload.put("distance", 0);
        elimPayload.put("finalDamage", 100);

        broadcastToRoom(roomId, elimPayload);
        respawnScheduler.schedule(() -> {
            try {
                Room r = roomService.getActiveRoom(roomId);
                if (r != null && r.getStatus() == RoomStatus.PLAYING) {
                    r.respawnPlayer(victim, 400.0, 300.0);
                    int respawnHp = (r.getGamePlayer(victim) != null) ? r.getGamePlayer(victim).getHealth() : 100;
                    broadcastToRoom(roomId, Map.of(
                            "type", "PLAYER_RESPAWNED",
                            "username", victim,
                            "x", 400.0,
                            "y", 300.0,
                            "health", respawnHp
                    ));
                }
            } catch (Exception ignored) {}
        }, 2500, TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void destroy() {
        respawnScheduler.shutdownNow();
    }
}
