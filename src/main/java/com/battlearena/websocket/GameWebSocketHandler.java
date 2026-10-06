package com.battlearena.websocket;

import com.battlearena.model.GamePlayer;
import com.battlearena.model.Room;
import com.battlearena.security.JwtUtil;
import com.battlearena.service.RoomService;
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
    private final ObjectMapper mapper = new ObjectMapper();

    // Session Registry
    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, String> sessionToRoom = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

    public GameWebSocketHandler(JwtUtil jwtUtil, RoomService roomService) {
        this.jwtUtil = jwtUtil;
        this.roomService = roomService;
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

                    // Broadcast movement update to all other room members
                    Map<String, Object> update = Map.of(
                            "type", "PLAYER_MOVED",
                            "username", username,
                            "x", x,
                            "y", y,
                            "heading", heading
                    );
                    broadcastToRoomExcept(roomId, update, session.getId());
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

        // Notify other room participants
        broadcastToRoomExcept(roomId, Map.of(
                "type", "PLAYER_JOINED",
                "username", username
        ), session.getId());
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
