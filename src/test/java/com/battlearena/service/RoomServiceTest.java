package com.battlearena.service;

import com.battlearena.dto.CreateRoomRequest;
import com.battlearena.dto.RoomResponse;
import com.battlearena.dto.RoomSummaryResponse;
import com.battlearena.model.WarriorClass;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Room Service Multiplayer Lifecycle Tests")
class RoomServiceTest {

    private RoomService roomService;

    @BeforeEach
    void setUp() {
        roomService = new RoomService();
    }

    @Test
    @DisplayName("Create room with custom bot difficulty")
    void testCreateRoomWithBotDifficulty() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("Dojo Sector");
        request.setMaxPlayers(2);
        request.setGameMode("PVP_1V1");
        request.setBotDifficulty("NIGHTMARE");

        RoomResponse response = roomService.createRoom(request, "PilotOne");
        assertNotNull(response.getRoomId());
        assertEquals("Dojo Sector", response.getName());
        assertEquals("PilotOne", response.getHostUsername());
        assertEquals("NIGHTMARE", response.getBotDifficulty());
        assertEquals(2, response.getMaxPlayers());
        assertEquals(1, response.getCurrentPlayers());
        assertEquals("WAITING", response.getStatus());
    }

    @Test
    @DisplayName("Player joining enforces max player limits")
    void testJoinRoomCapacity() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setName("Duel Room");
        request.setMaxPlayers(2);
        RoomResponse room = roomService.createRoom(request, "HostPilot");

        // Second player joins
        RoomResponse joined = roomService.joinRoom(room.getRoomId(), "Challenger");
        assertEquals(2, joined.getCurrentPlayers());

        // Third player attempt to join combatant should fail
        assertThrows(IllegalArgumentException.class, () ->
                roomService.joinRoom(room.getRoomId(), "ThirdPlayer", false));
    }

    @Test
    @DisplayName("Spectator can join even when combatant slots are full")
    void testSpectatorJoin() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setMaxPlayers(2);
        RoomResponse room = roomService.createRoom(request, "HostPilot");
        roomService.joinRoom(room.getRoomId(), "Fighter2", false);

        // Spectator joins
        RoomResponse spectated = roomService.joinRoom(room.getRoomId(), "Watcher", true);
        assertEquals(2, spectated.getCurrentPlayers()); // combatant count remains 2
        assertEquals(3, spectated.getPlayers().size()); // 3 total members
        assertTrue(spectated.getPlayers().stream().anyMatch(p -> p.getUsername().equals("Watcher") && p.isSpectator()));
    }

    @Test
    @DisplayName("Host and participant ready lifecycle to start game")
    void testMatchReadyAndStartLifecycle() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setMaxPlayers(2);
        RoomResponse room = roomService.createRoom(request, "HostPilot");
        roomService.joinRoom(room.getRoomId(), "Fighter2");

        // Before Fighter2 is ready, game cannot start
        assertThrows(IllegalArgumentException.class, () ->
                roomService.startGame(room.getRoomId(), "HostPilot"));

        // Fighter2 readies up
        RoomResponse readyState = roomService.toggleReady(room.getRoomId(), "Fighter2");
        assertTrue(readyState.getPlayers().stream().anyMatch(p -> p.getUsername().equals("Fighter2") && p.isReady()));

        // Non-host cannot start
        assertThrows(IllegalArgumentException.class, () ->
                roomService.startGame(room.getRoomId(), "Fighter2"));

        // Host starts
        RoomResponse started = roomService.startGame(room.getRoomId(), "HostPilot");
        assertEquals("PLAYING", started.getStatus());
    }

    @Test
    @DisplayName("Bot spawning and removal by host")
    void testBotManagement() {
        CreateRoomRequest request = new CreateRoomRequest();
        request.setMaxPlayers(4);
        RoomResponse room = roomService.createRoom(request, "HostPilot");

        // Host adds bot
        RoomResponse withBot = roomService.addBot(room.getRoomId(), "HostPilot");
        assertEquals(2, withBot.getCurrentPlayers());
        assertTrue(withBot.getPlayers().stream().anyMatch(p -> p.isBot() && p.isReady()));

        // Non-host cannot add bot
        assertThrows(IllegalArgumentException.class, () ->
                roomService.addBot(room.getRoomId(), "Stranger"));

        // Remove bot
        String botName = withBot.getPlayers().stream().filter(p -> p.isBot()).findFirst().get().getUsername();
        RoomResponse afterRemoval = roomService.removeBot(room.getRoomId(), botName, "HostPilot");
        assertEquals(1, afterRemoval.getCurrentPlayers());
    }

    @Test
    @DisplayName("Room cleans up automatically when all players leave")
    void testRoomCleanupOnAbandonment() {
        CreateRoomRequest request = new CreateRoomRequest();
        RoomResponse room = roomService.createRoom(request, "LonePilot");
        assertEquals(1, roomService.listRooms().size());

        roomService.leaveCurrentRoom("LonePilot");
        assertEquals(0, roomService.listRooms().size());
    }

    @Test
    @DisplayName("Select warrior class updates player profile in room")
    void testSelectWarriorClass() {
        CreateRoomRequest request = new CreateRoomRequest();
        RoomResponse room = roomService.createRoom(request, "Pilot");

        RoomResponse updated = roomService.selectWarriorClass(room.getRoomId(), "Pilot", WarriorClass.JUGGERNAUT);
        assertTrue(updated.getPlayers().stream()
                .anyMatch(p -> p.getUsername().equals("Pilot") && "JUGGERNAUT".equals(p.getWarriorClass())));
    }
}
