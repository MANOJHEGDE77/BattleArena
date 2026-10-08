package com.battlearena.model;

import java.time.Instant;

/**
 * Real-time gameplay state of a player inside an active match arena.
 *
 * Layer: Domain / Model (Game State)
 * Responsibility: Tracks coordinate position, heading angle, collision bounds,
 * warrior class specialization, stats, and in-game score for real-time synchronization.
 */
public class GamePlayer {

    private final String username;
    private final WarriorClass warriorClass;
    private volatile double x;
    private volatile double y;
    private volatile double heading;
    private final int radius;
    private final int speed;
    private final String color;
    private volatile int score;
    private volatile boolean alive;
    private volatile int health;
    private final int maxHealth;
    private volatile int shield;
    private final int maxShield;
    private volatile long speedBoostUntil;
    private volatile long spreadShotUntil;
    private volatile int kills;
    private volatile int deaths;
    private volatile long lastAttackTime;
    private volatile Instant lastUpdate;

    public GamePlayer(String username, double x, double y, String color) {
        this(username, x, y, color, WarriorClass.ASSAULT);
    }

    public GamePlayer(String username, double x, double y, String color, WarriorClass warriorClass) {
        this.username = username;
        this.warriorClass = (warriorClass != null) ? warriorClass : WarriorClass.ASSAULT;
        this.x = x;
        this.y = y;
        this.heading = 0.0;
        this.radius = 16;
        this.speed = this.warriorClass.getSpeed();
        this.color = color;
        this.score = 0;
        this.alive = true;
        this.maxHealth = this.warriorClass.getMaxHealth();
        this.maxShield = this.warriorClass.getMaxShield();
        this.health = this.maxHealth;
        this.shield = 0;
        this.speedBoostUntil = 0L;
        this.spreadShotUntil = 0L;
        this.kills = 0;
        this.deaths = 0;
        this.lastAttackTime = 0L;
        this.lastUpdate = Instant.now();
    }

    public String getUsername() {
        return username;
    }

    public WarriorClass getWarriorClass() {
        return warriorClass;
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

    public void setPosition(double x, double y) {
        this.x = x;
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
        this.health = Math.max(0, Math.min(this.maxHealth, health));
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public int getMaxShield() {
        return maxShield;
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

    public int getShield() {
        return shield;
    }

    public boolean hasShield() {
        return shield > 0;
    }

    public long getSpeedBoostUntil() {
        return speedBoostUntil;
    }

    public long getSpreadShotUntil() {
        return spreadShotUntil;
    }

    public boolean isSpeedBoosted(long now) {
        return speedBoostUntil > now;
    }

    public boolean hasSpreadShot(long now) {
        return spreadShotUntil > now;
    }

    public int getEffectiveSpeed(long now) {
        return isSpeedBoosted(now) ? (int)(speed * 1.4) : speed;
    }

    public synchronized void applyPowerUp(PowerUp powerUp) {
        long now = System.currentTimeMillis();
        switch (powerUp.getType()) {
            case SHIELD -> this.shield = Math.min(this.maxShield, this.shield + 50);
            case SPEED_BOOST -> this.speedBoostUntil = Math.max(now, this.speedBoostUntil) + powerUp.getDurationMs();
            case SPREAD_SHOT -> this.spreadShotUntil = Math.max(now, this.spreadShotUntil) + powerUp.getDurationMs();
        }
    }

    /**
     * Atomically applies damage to the player, with shield absorption taking priority.
     * Returns a DamageResult containing shield damage, health damage, and elimination status.
     */
    public synchronized DamageResult takeDamageWithShield(int amount) {
        if (!alive) {
            return new DamageResult(0, 0, this.shield, this.health, false);
        }
        int shieldDamage = 0;
        if (this.shield > 0) {
            shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
        }
        int healthDamage = 0;
        boolean eliminated = false;
        if (amount > 0) {
            healthDamage = Math.min(this.health, amount);
            this.health = Math.max(0, this.health - amount);
            if (this.health == 0) {
                this.alive = false;
                this.deaths++;
                eliminated = true;
            }
        }
        return new DamageResult(shieldDamage, healthDamage, this.shield, this.health, eliminated);
    }

    /**
     * Atomically applies damage to the player (backwards-compatibility helper).
     * Returns true if this damage instance eliminated the player.
     */
    public synchronized boolean takeDamage(int amount) {
        DamageResult result = takeDamageWithShield(amount);
        return result.eliminated();
    }

    /**
     * Respawns player at specified coordinates with full class health and cleared buffs.
     */
    public synchronized void respawn(double newX, double newY) {
        this.x = newX;
        this.y = newY;
        this.health = this.maxHealth;
        this.shield = 0;
        this.speedBoostUntil = 0L;
        this.spreadShotUntil = 0L;
        this.alive = true;
        this.lastUpdate = Instant.now();
    }

    /**
     * Resets combat state for a fresh match/rematch.
     */
    public synchronized void resetCombatStats() {
        this.health = this.maxHealth;
        this.shield = 0;
        this.speedBoostUntil = 0L;
        this.spreadShotUntil = 0L;
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
