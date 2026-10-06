package com.battlearena.controller;

import com.battlearena.dto.LeaderboardEntryDTO;
import com.battlearena.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller exposing REST endpoints for the Global Leaderboard.
 *
 * Layer: Presentation / Controller Layer
 * Responsibility: Serves persistent high score rankings fetched from MySQL.
 */
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final UserService userService;

    public LeaderboardController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Public endpoint retrieving the top 10 players by career highest score.
     * GET /api/leaderboard
     */
    @GetMapping
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }
}
