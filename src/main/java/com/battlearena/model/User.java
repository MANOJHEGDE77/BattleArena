package com.battlearena.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity representing a persistent Player / User account in MySQL.
 *
 * Layer: Model / Domain (Data Persistence Layer)
 * Responsibility: Maps directly to the `users` table in MySQL using JPA / Hibernate.
 *
 * Who calls it: Spring Data JPA (UserRepository), UserService
 * What data flows through it: ID, credentials, gameplay career statistics (games played, high score).
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private int totalGames = 0;

    @Column(nullable = false)
    private int totalScore = 0;

    @Column(nullable = false)
    private int highestScore = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public User() {
    }

    public User(String username, String password) {
        this.username = username;
        this.password = password;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getTotalGames() {
        return totalGames;
    }

    public void setTotalGames(int totalGames) {
        this.totalGames = totalGames;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getHighestScore() {
        return highestScore;
    }

    public void setHighestScore(int highestScore) {
        this.highestScore = highestScore;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
