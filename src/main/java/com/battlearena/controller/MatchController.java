package com.battlearena.controller;

import com.battlearena.dto.MatchHistoryDTO;
import com.battlearena.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing match outcomes and history endpoints.
 *
 * Layer: Presentation / Web Controller (REST API)
 * Responsibility: Handles HTTP requests for player match logs and recent arena sessions.
 *
 * Problem it solves:
 * Allows players to inspect their personal battle history, win/loss record, and recent game results.
 *
 * Who calls it: Frontend client (game.js)
 * What it calls: MatchService
 * What data flows through it: Authentication principal, username query parameter, and MatchHistoryDTO lists.
 */
@RestController
@RequestMapping("/api/matches")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    /**
     * Retrieves the match history for the currently authenticated player.
     * GET /api/matches/me
     */
    @GetMapping("/me")
    public ResponseEntity<List<MatchHistoryDTO>> getMyMatchHistory(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).build();
        }
        List<MatchHistoryDTO> history = matchService.getUserMatchHistory(authentication.getName());
        return ResponseEntity.ok(history);
    }

    /**
     * Retrieves the match history for a given username.
     * GET /api/matches/user/{username}
     */
    @GetMapping("/user/{username}")
    public ResponseEntity<List<MatchHistoryDTO>> getUserMatchHistory(@PathVariable String username) {
        List<MatchHistoryDTO> history = matchService.getUserMatchHistory(username);
        return ResponseEntity.ok(history);
    }

    /**
     * Retrieves the 10 most recent arena match outcomes globally.
     * GET /api/matches/recent
     */
    @GetMapping("/recent")
    public ResponseEntity<List<MatchHistoryDTO>> getRecentMatches() {
        List<MatchHistoryDTO> recent = matchService.getRecentMatches();
        return ResponseEntity.ok(recent);
    }
}
