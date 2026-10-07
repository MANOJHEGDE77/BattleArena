package com.battlearena.repository;

import com.battlearena.model.GameResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for persisting and querying finished match outcomes.
 *
 * Layer: Persistence / Data Access Layer
 * Responsibility: Executes SQL operations against the `game_results` table in MySQL.
 *
 * Problem it solves:
 * Provides declarative query methods to fetch match history filtered by player
 * or sorted chronologically without writing manual JDBC boilerplate.
 *
 * Who calls it: MatchService
 * What it calls: MySQL database via Hibernate / Spring Data JPA
 */
@Repository
public interface GameResultRepository extends JpaRepository<GameResult, Long> {

    /**
     * Retrieves the 20 most recent match outcomes involving a given player username.
     */
    @Query("SELECT r FROM GameResult r WHERE r.participantUsernames LIKE %:username% ORDER BY r.finishedAt DESC")
    List<GameResult> findRecentMatchesByUsername(@Param("username") String username);

    /**
     * Retrieves the top 10 most recent matches across all rooms.
     */
    List<GameResult> findTop10ByOrderByFinishedAtDesc();
}
