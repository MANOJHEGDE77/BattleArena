package com.battlearena.dto;

import java.time.Instant;

/**
 * Data Transfer Object for protected user profile queries with Cyber Battle Arena 2.0 progression.
 */
public class UserProfileResponse {

    private Long id;
    private String username;
    private int totalGames;
    private int totalScore;
    private int highestScore;
    private int xp;
    private int level;
    private int kills;
    private int deaths;
    private int wins;
    private String equippedTitle;
    private String equippedTrail;
    private String unlockedTitlesJson;
    private String unlockedTrailsJson;
    private String weaponMasteryJson;
    private String dailyChallengesJson;
    private Instant createdAt;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long id, String username, int totalGames, int totalScore, int highestScore, Instant createdAt) {
        this(id, username, totalGames, totalScore, highestScore, 0, 1, 0, 0, 0, "Rookie Pilot", "CYAN_PULSE",
             "[\"Rookie Pilot\"]", "[\"CYAN_PULSE\"]", "{}", "[]", createdAt);
    }

    public UserProfileResponse(Long id, String username, int totalGames, int totalScore, int highestScore,
                              int xp, int level, int kills, int deaths, int wins,
                              String equippedTitle, String equippedTrail,
                              String unlockedTitlesJson, String unlockedTrailsJson,
                              String weaponMasteryJson, String dailyChallengesJson,
                              Instant createdAt) {
        this.id = id;
        this.username = username;
        this.totalGames = totalGames;
        this.totalScore = totalScore;
        this.highestScore = highestScore;
        this.xp = xp;
        this.level = level;
        this.kills = kills;
        this.deaths = deaths;
        this.wins = wins;
        this.equippedTitle = equippedTitle;
        this.equippedTrail = equippedTrail;
        this.unlockedTitlesJson = unlockedTitlesJson;
        this.unlockedTrailsJson = unlockedTrailsJson;
        this.weaponMasteryJson = weaponMasteryJson;
        this.dailyChallengesJson = dailyChallengesJson;
        this.createdAt = createdAt;
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

    @com.fasterxml.jackson.annotation.JsonRawValue
    public String getWeaponMastery() {
        return (weaponMasteryJson != null && !weaponMasteryJson.trim().isEmpty() && !weaponMasteryJson.equals("{}"))
                ? weaponMasteryJson
                : "{\"ASSAULT\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0},\"SNIPER\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0},\"JUGGERNAUT\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0},\"SCOUT\":{\"level\":1,\"xp\":0,\"matches\":0,\"kills\":0,\"wins\":0}}";
    }

    public void setWeaponMasteryJson(String weaponMasteryJson) {
        this.weaponMasteryJson = weaponMasteryJson;
    }

    public String getDailyChallengesJson() {
        return dailyChallengesJson != null ? dailyChallengesJson : "[]";
    }

    @com.fasterxml.jackson.annotation.JsonRawValue
    public String getDailyChallenges() {
        return (dailyChallengesJson != null && !dailyChallengesJson.trim().isEmpty() && !dailyChallengesJson.equals("[]"))
                ? dailyChallengesJson
                : "[{\"id\":\"daily_kills\",\"title\":\"Eliminator\",\"desc\":\"Eliminate 3 enemy combatants\",\"target\":3,\"progress\":0,\"rewardXp\":200,\"completed\":false},{\"id\":\"daily_beacon\",\"title\":\"Beacon Seeker\",\"desc\":\"Capture 1 Overcharge Beacon\",\"target\":1,\"progress\":0,\"rewardXp\":250,\"completed\":false},{\"id\":\"daily_win\",\"title\":\"Apex Victor\",\"desc\":\"Win a match in any combat arena\",\"target\":1,\"progress\":0,\"rewardXp\":300,\"completed\":false}]";
    }

    public void setDailyChallengesJson(String dailyChallengesJson) {
        this.dailyChallengesJson = dailyChallengesJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
