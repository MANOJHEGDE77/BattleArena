package com.battlearena.controller;

import com.battlearena.dto.AuthRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
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
@DisplayName("Authentication REST Controller Integration Tests")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Register new user successfully returns JWT token and pilot callsign")
    void testRegisterSuccess() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("ApexPilot99");
        req.setPassword("ApexPassword123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("ApexPilot99"));
    }

    @Test
    @DisplayName("Duplicate registration fails with conflict status")
    void testRegisterDuplicateUsername() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("DuplicatePilot");
        req.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Login with valid credentials returns JWT token")
    void testLoginSuccess() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("CombatVeteran");
        req.setPassword("CombatPass123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("CombatVeteran"));
    }

    @Test
    @DisplayName("Login with wrong password returns 401 unauthorized")
    void testLoginInvalidPassword() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("SecurePilot");
        req.setPassword("CorrectPassword1!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        AuthRequest badReq = new AuthRequest();
        badReq.setUsername("SecurePilot");
        badReq.setPassword("WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/me returns profile when authenticated")
    void testGetProfileWithToken() throws Exception {
        AuthRequest req = new AuthRequest();
        req.setUsername("ProfilePilot");
        req.setPassword("Pass123456!");

        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("ProfilePilot"))
                .andExpect(jsonPath("$.totalGames").value(0))
                .andExpect(jsonPath("$.highestScore").value(0));
    }

    @Test
    @DisplayName("GET /api/auth/me returns 401 when token is missing")
    void testGetProfileUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
