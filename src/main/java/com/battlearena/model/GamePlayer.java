package com.battlearena.model;

import java.time.Instant;

/**
 * Real-time gameplay state of a player inside an active match arena.
 *
 * Layer: Domain / Model (Game State)
 * Responsibility: Tracks current coordinate position, heading angle, collision bounds,
 * color styling, and in-game score for real-time synchronization.
 */
public class GamePlayer {

    private final String username;
    private volatile double x;
    private volatile double y;
    private volatile double heading;
    private final int radius;
    private final int speed;
    private final String color;
    private volatile int score;
    private volatile boolean alive;
    private volatile int health;
    private static final int MAX_HEALTH = 100;
    private volatile int kills;
    private volatile int deaths;
    private volatile long lastAttackTime;
    private volatile Instant lastUpdate;

    public GamePlayer(String username, double x, double y, String color) {
        this.username = username;
        this.x = x;
        this.y = y;
        this.heading = 0.0;
        this.radius = 16;
        this.speed = 240;
        this.color = color;
        this.score = 0;
        this.alive = true;
        this.health = MAX_HEALTH;
        this.kills = 0;
        this.deaths = 0;
        this.lastAttackTime = 0L;
        this.lastUpdate = Instant.now();
    }

    public String getUsername() {
        return username;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public double getHeading() {
        return heading;
    }

    public void setHeading(double heading) {
        this.heading = heading;
    }

    public int getRadius() {
        return radius;
    }

    public int getSpeed() {
        return speed;
    }

    public String getColor() {
        return color;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public void addScore(int points) {
        this.score += points;
    }

    public boolean isAlive() {
        return alive;
    }

    public void setAlive(boolean alive) {
        this.alive = alive;
    }

    public Instant getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Instant lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public int getHealth() {
        return health;
    }

    public void setHealth(int health) {
        this.health = Math.max(0, Math.min(MAX_HEALTH, health));
    }

    public int getMaxHealth() {
        return MAX_HEALTH;
    }

    public int getKills() {
        return kills;
    }

    public void addKill() {
        this.kills++;
    }

    public int getDeaths() {
        return deaths;
    }

    public void addDeath() {
        this.deaths++;
    }

    public long getLastAttackTime() {
        return lastAttackTime;
    }

    public boolean canAttack(long now, long cooldownMs) {
        return alive && (now - lastAttackTime >= cooldownMs);
    }

    public void recordAttack(long now) {
        this.lastAttackTime = now;
    }

    /**
     * Atomically applies damage to the player.
     * Returns true if this damage instance eliminated the player.
     */
    public synchronized boolean takeDamage(int amount) {
        if (!alive) {
            return false;
        }
        this.health = Math.max(0, this.health - amount);
        if (this.health == 0) {
            this.alive = false;
            this.deaths++;
            return true;
        }
        return false;
    }

    /**
     * Respawns player at specified coordinates with full health.
     */
    public synchronized void respawn(double newX, double newY) {
        this.x = newX;
        this.y = newY;
        this.health = MAX_HEALTH;
        this.alive = true;
        this.lastUpdate = Instant.now();
    }

    /**
     * Resets combat state for a fresh match/rematch.
     */
    public synchronized void resetCombatStats() {
        this.health = MAX_HEALTH;
        this.alive = true;
        this.kills = 0;
        this.deaths = 0;
        this.score = 0;
        this.lastAttackTime = 0L;
    }

    /**
     * Updates position coordinates and heading atomically.
     * Enforces arena boundary clamping (800x600 arena dimensions).
     */
    public synchronized void updatePosition(double newX, double newY, double newHeading) {
        final double minX = radius + 2;
        final double maxX = 800 - radius - 2;
        final double minY = radius + 2;
        final double maxY = 600 - radius - 2;

        this.x = Math.max(minX, Math.min(maxX, newX));
        this.y = Math.max(minY, Math.min(maxY, newY));
        this.heading = newHeading;
        this.lastUpdate = Instant.now();
    }
}
