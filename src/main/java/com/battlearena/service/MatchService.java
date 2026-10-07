package com.battlearena.service;

import com.battlearena.dto.MatchHistoryDTO;
import com.battlearena.model.GamePlayer;
import com.battlearena.model.GameResult;
import com.battlearena.model.Room;
import com.battlearena.repository.GameResultRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing match outcome persistence and history querying.
 *
 * Layer: Service (Business Logic Layer)
 * Responsibility: Converts live room match outcomes into persistent GameResult records,
 * performs JSON encoding/decoding of match scoreboards, and prepares DTO responses.
 *
 * Who calls it: GameWebSocketHandler, MatchController
 * What it calls: GameResultRepository, ObjectMapper
 * What data flows through it: Room game state, scores map, match duration, and historical summaries.
 */
@Service
public class MatchService {

    private final GameResultRepository gameResultRepository;
    private final ObjectMapper objectMapper;

    public MatchService(GameResultRepository gameResultRepository, ObjectMapper objectMapper) {
        this.gameResultRepository = gameResultRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Persists a finished match from the Room into the MySQL game_results table.
     */
    @Transactional
    public GameResult recordMatch(Room room) {
        if (room == null) {
            return null;
        }

        String winner = room.getWinnerUsername();
        Collection<GamePlayer> players = room.getGamePlayers();

        Map<String, Integer> scoresMap = new LinkedHashMap<>();
        int winningScore = 0;

        for (GamePlayer gp : players) {
            scoresMap.put(gp.getUsername(), gp.getScore());
            if (gp.getUsername().equals(winner)) {
                winningScore = gp.getScore();
            }
        }

        String participantUsernames = String.join(",", scoresMap.keySet());

        String scoresJson = "{}";
        try {
            scoresJson = objectMapper.writeValueAsString(scoresMap);
        } catch (Exception e) {
            // Fallback empty JSON
        }

        long durationSeconds = 0;
        if (room.getMatchStartedAt() != null) {
            durationSeconds = Math.max(1, Duration.between(room.getMatchStartedAt(), Instant.now()).getSeconds());
        }

        GameResult result = new GameResult(
                room.getRoomId(),
                room.getName(),
                winner != null ? winner : "UNKNOWN",
                winningScore,
                scoresMap.size(),
                participantUsernames,
                scoresJson,
                durationSeconds,
                Instant.now()
        );

        return gameResultRepository.save(result);
    }

    /**
     * Fetches recent match history for an individual user.
     */
    @Transactional(readOnly = true)
    public List<MatchHistoryDTO> getUserMatchHistory(String username) {
        if (username == null || username.isBlank()) {
            return Collections.emptyList();
        }

        List<GameResult> entities = gameResultRepository.findRecentMatchesByUsername(username.trim());
        return entities.stream()
                .map(entity -> toDTO(entity, username.trim()))
                .collect(Collectors.toList());
    }

    /**
     * Fetches top 10 recent global matches across all arenas.
     */
    @Transactional(readOnly = true)
    public List<MatchHistoryDTO> getRecentMatches() {
        List<GameResult> entities = gameResultRepository.findTop10ByOrderByFinishedAtDesc();
        return entities.stream()
                .map(entity -> toDTO(entity, null))
                .collect(Collectors.toList());
    }

    private MatchHistoryDTO toDTO(GameResult entity, String contextualUsername) {
        Map<String, Integer> scores = new LinkedHashMap<>();
        try {
            scores = objectMapper.readValue(entity.getScoresJson(), new TypeReference<Map<String, Integer>>() {});
        } catch (Exception e) {
            // Keep empty on error
        }

        boolean isWinner = contextualUsername != null && contextualUsername.equalsIgnoreCase(entity.getWinnerUsername());
        int playerScore = (contextualUsername != null) ? scores.getOrDefault(contextualUsername, 0) : entity.getWinningScore();

        return new MatchHistoryDTO(
                entity.getId(),
                entity.getRoomId(),
                entity.getRoomName(),
                entity.getWinnerUsername(),
                entity.getWinningScore(),
                entity.getDurationSeconds(),
                entity.getFinishedAt(),
                entity.getParticipantsCount(),
                isWinner,
                playerScore,
                scores
        );
    }
}
