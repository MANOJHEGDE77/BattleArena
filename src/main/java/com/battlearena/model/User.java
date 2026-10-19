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

    @Column(nullable = false)
    private int xp = 0;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private int kills = 0;

    @Column(nullable = false)
    private int deaths = 0;

    @Column(nullable = false)
    private int wins = 0;

    @Column(nullable = false, length = 50)
    private String equippedTitle = "Rookie Pilot";

    @Column(nullable = false, length = 50)
    private String equippedTrail = "CYAN_PULSE";

    @Column(columnDefinition = "TEXT")
    private String unlockedTitlesJson = "[\"Rookie Pilot\"]";

    @Column(columnDefinition = "TEXT")
    private String unlockedTrailsJson = "[\"CYAN_PULSE\"]";

    @Column(columnDefinition = "TEXT")
    private String weaponMasteryJson = "{\"ASSAULT\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0},\"SNIPER\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0},\"JUGGERNAUT\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0},\"SCOUT\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0}}";

    @Column(columnDefinition = "TEXT")
    private String dailyChallengesJson = "[{\"id\":\"daily_kills\",\"title\":\"Eliminator\",\"desc\":\"Eliminate 3 enemy combatants\",\"target\":3,\"progress\":0,\"rewardXp\":200,\"completed\":false},{\"id\":\"daily_beacon\",\"title\":\"Beacon Seeker\",\"desc\":\"Capture 1 Overcharge Beacon\",\"target\":1,\"progress\":0,\"rewardXp\":250,\"completed\":false},{\"id\":\"daily_win\",\"title\":\"Apex Victor\",\"desc\":\"Win a match in any combat arena\",\"target\":1,\"progress\":0,\"rewardXp\":300,\"completed\":false}]";

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

    public int getXp() {
        return xp;
    }

    public void setXp(int xp) {
        this.xp = xp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public int getKills() {
        return kills;
    }

    public void setKills(int kills) {
        this.kills = kills;
    }

    public int getDeaths() {
        return deaths;
    }

    public void setDeaths(int deaths) {
        this.deaths = deaths;
    }

    public int getWins() {
        return wins;
    }

    public void setWins(int wins) {
        this.wins = wins;
    }

    public String getEquippedTitle() {
        return equippedTitle != null ? equippedTitle : "Rookie Pilot";
    }

    public void setEquippedTitle(String equippedTitle) {
        this.equippedTitle = equippedTitle;
    }

    public String getEquippedTrail() {
        return equippedTrail != null ? equippedTrail : "CYAN_PULSE";
    }

    public void setEquippedTrail(String equippedTrail) {
        this.equippedTrail = equippedTrail;
    }

    public String getUnlockedTitlesJson() {
        return unlockedTitlesJson != null ? unlockedTitlesJson : "[\"Rookie Pilot\"]";
    }

    public void setUnlockedTitlesJson(String unlockedTitlesJson) {
        this.unlockedTitlesJson = unlockedTitlesJson;
    }

    public String getUnlockedTrailsJson() {
        return unlockedTrailsJson != null ? unlockedTrailsJson : "[\"CYAN_PULSE\"]";
    }

    public void setUnlockedTrailsJson(String unlockedTrailsJson) {
        this.unlockedTrailsJson = unlockedTrailsJson;
    }

    public String getWeaponMasteryJson() {
        return weaponMasteryJson != null ? weaponMasteryJson : "{}";
    }

    public void setWeaponMasteryJson(String weaponMasteryJson) {
        this.weaponMasteryJson = weaponMasteryJson;
    }

    public String getDailyChallengesJson() {
        return dailyChallengesJson != null ? dailyChallengesJson : "[]";
    }

    public void setDailyChallengesJson(String dailyChallengesJson) {
        this.dailyChallengesJson = dailyChallengesJson;
    }
}
