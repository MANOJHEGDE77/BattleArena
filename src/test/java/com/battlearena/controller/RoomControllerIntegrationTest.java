package com.battlearena.controller;

import com.battlearena.dto.AuthRequest;
import com.battlearena.dto.CreateRoomRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Room REST Controller Integration Tests")
class RoomControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String pilotToken;
    private String challengerToken;

    @BeforeEach
    void setupUsers() throws Exception {
        long ts = System.currentTimeMillis();
        pilotToken = registerAndGetToken("RoomHost_" + ts, "Pass123456!");
        challengerToken = registerAndGetToken("RoomChallenger_" + ts, "Pass123456!");
    }

    private String registerAndGetToken(String username, String password) throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername(username);
        req.setPassword(password);

        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        return objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    @DisplayName("Create room and verify botDifficulty and initial status")
    void testCreateRoomWithBotDifficulty() throws Exception {
        CreateRoomRequest roomReq = new CreateRoomRequest();
        roomReq.setName("Sector 7 Dojo");
        roomReq.setMaxPlayers(2);
        roomReq.setGameMode("PVP_1V1");
        roomReq.setBotDifficulty("NIGHTMARE");

        MvcResult res = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + pilotToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Sector 7 Dojo"))
                .andExpect(jsonPath("$.botDifficulty").value("NIGHTMARE"))
                .andExpect(jsonPath("$.maxPlayers").value(2))
                .andExpect(jsonPath("$.currentPlayers").value(1))
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andReturn();

        String roomId = objectMapper.readTree(res.getResponse().getContentAsString()).get("roomId").asText();

        // Query room by ID
        mockMvc.perform(get("/api/rooms/" + roomId)
                        .header("Authorization", "Bearer " + pilotToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomId").value(roomId))
                .andExpect(jsonPath("$.botDifficulty").value("NIGHTMARE"));
    }

    @Test
    @DisplayName("Lobby room discovery via GET /api/rooms")
    void testListRooms() throws Exception {
        CreateRoomRequest roomReq = new CreateRoomRequest();
        roomReq.setName("Public Arena " + System.currentTimeMillis());
        roomReq.setMaxPlayers(4);

        mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + pilotToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/rooms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("Multiplayer duel lifecycle: Create -> Join -> Ready -> Start")
    void testDuelLifecycle() throws Exception {
        CreateRoomRequest roomReq = new CreateRoomRequest();
        roomReq.setName("Championship Duel");
        roomReq.setMaxPlayers(2);
        roomReq.setGameMode("PVP_1V1");

        MvcResult createRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + pilotToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String roomId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("roomId").asText();

        // Challenger joins room
        mockMvc.perform(post("/api/rooms/" + roomId + "/join")
                        .header("Authorization", "Bearer " + challengerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPlayers").value(2));

        // Challenger marks ready
        mockMvc.perform(post("/api/rooms/" + roomId + "/ready")
                        .header("Authorization", "Bearer " + challengerToken))
                .andExpect(status().isOk());

        // Host launches match
        mockMvc.perform(post("/api/rooms/" + roomId + "/start")
                        .header("Authorization", "Bearer " + pilotToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PLAYING"));
    }

    @Test
    @DisplayName("AI Training Dojo bot spawn endpoint POST /api/rooms/{id}/bot")
    void testAddBotToRoom() throws Exception {
        CreateRoomRequest roomReq = new CreateRoomRequest();
        roomReq.setName("Training Simulation");
        roomReq.setMaxPlayers(2);
        roomReq.setGameMode("PVP_1V1");

        MvcResult createRes = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + pilotToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roomReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String roomId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("roomId").asText();

        // Host spawns bot
        mockMvc.perform(post("/api/rooms/" + roomId + "/bot")
                        .header("Authorization", "Bearer " + pilotToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPlayers").value(2))
                .andExpect(jsonPath("$.canStart").value(true));

        // Start match with AI bot
        mockMvc.perform(post("/api/rooms/" + roomId + "/start")
                        .header("Authorization", "Bearer " + pilotToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PLAYING"));
    }
}
