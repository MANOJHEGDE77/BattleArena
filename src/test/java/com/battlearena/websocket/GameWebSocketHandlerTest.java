package com.battlearena.websocket;

import com.battlearena.dto.CreateRoomRequest;
import com.battlearena.dto.RoomResponse;
import com.battlearena.security.JwtUtil;
import com.battlearena.service.MatchService;
import com.battlearena.service.RoomService;
import com.battlearena.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("Game WebSocket Handler Unit Tests")
class GameWebSocketHandlerTest {

    private JwtUtil jwtUtil;
    private RoomService roomService;
    private UserService userService;
    private MatchService matchService;
    private ObjectMapper mapper;
    private GameWebSocketHandler handler;

    @BeforeEach
    void setUp() {
        jwtUtil = mock(JwtUtil.class);
        roomService = new RoomService();
        userService = mock(UserService.class);
        matchService = mock(MatchService.class);
        mapper = new ObjectMapper();

        handler = new GameWebSocketHandler(jwtUtil, roomService, userService, matchService, mapper);
    }

    @Test
    @DisplayName("WebSocket connection handshake with token and roomId query params joins room")
    void testHandshakeAuthentication() throws Exception {
        // Prepare room
        CreateRoomRequest req = new CreateRoomRequest();
        req.setName("WS Arena");
        req.setMaxPlayers(2);
        RoomResponse room = roomService.createRoom(req, "PilotA");

        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("sess-001");
        when(session.isOpen()).thenReturn(true);
        when(session.getUri()).thenReturn(URI.create("ws://localhost:8080/ws/game?token=valid-jwt-token&roomId=" + room.getRoomId()));
        when(jwtUtil.validateToken("valid-jwt-token")).thenReturn(true);
        when(jwtUtil.extractUsername("valid-jwt-token")).thenReturn("PilotA");

        handler.afterConnectionEstablished(session);

        // Verify state is sent to session
        verify(session, atLeastOnce()).sendMessage(any(TextMessage.class));
    }

    @Test
    @DisplayName("Emote messaging is validated and dispatched")
    void testEmoteMessaging() throws Exception {
        CreateRoomRequest req = new CreateRoomRequest();
        req.setMaxPlayers(2);
        RoomResponse room = roomService.createRoom(req, "PilotA");

        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("sess-002");
        when(session.isOpen()).thenReturn(true);
        when(session.getUri()).thenReturn(URI.create("ws://localhost:8080/ws/game?token=valid-token&roomId=" + room.getRoomId()));
        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.extractUsername("valid-token")).thenReturn("PilotA");

        handler.afterConnectionEstablished(session);

        // Send EMOTE message
        String emotePayload = mapper.writeValueAsString(Map.of(
                "type", "EMOTE",
                "emoteId", "TARGET_SPOTTED"
        ));
        handler.handleTextMessage(session, new TextMessage(emotePayload));

        // Session received message back (room broadcast)
        verify(session, atLeast(2)).sendMessage(any(TextMessage.class));
    }

    @Test
    @DisplayName("Handling connection close cleans up session registry")
    void testConnectionClosedCleanup() throws Exception {
        CreateRoomRequest req = new CreateRoomRequest();
        req.setMaxPlayers(2);
        RoomResponse room = roomService.createRoom(req, "PilotA");

        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("sess-003");
        when(session.isOpen()).thenReturn(true);
        when(session.getUri()).thenReturn(URI.create("ws://localhost:8080/ws/game?token=valid-token&roomId=" + room.getRoomId()));
        when(jwtUtil.validateToken("valid-token")).thenReturn(true);
        when(jwtUtil.extractUsername("valid-token")).thenReturn("PilotA");

        handler.afterConnectionEstablished(session);
        handler.afterConnectionClosed(session, org.springframework.web.socket.CloseStatus.NORMAL);

        // The room should be empty and cleaned up since PilotA was the only participant
        assertNull(roomService.getActiveRoom(room.getRoomId()));
    }
}
