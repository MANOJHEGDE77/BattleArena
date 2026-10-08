package com.battlearena.model;

/**
 * Interactive environmental hazard and tactical arena trap entity.
 * Supports kinetic jump pads, thermal plasma lava pools, and volatile explosive barrels.
 *
 * Layer: Domain / Model
 */
public class ArenaHazard {

    public enum HazardType {
        JUMP_PAD,
        LAVA_POOL,
        EXPLOSIVE_BARREL
    }

    private final String id;
    private final HazardType type;
    private final double x;
    private final double y;
    private final double radius;
    private final double boostAngle;
    private final double boostPower;
    private int health;
    private final int maxHealth;
    private boolean active;
    private long lastTriggerTime;
    private long respawnTime;

    public ArenaHazard(String id, HazardType type, double x, double y, double radius,
                       double boostAngle, double boostPower, int maxHealth) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.boostAngle = boostAngle;
        this.boostPower = boostPower;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.active = true;
        this.lastTriggerTime = 0L;
        this.respawnTime = 0L;
    }

    public static ArenaHazard createJumpPad(String id, double x, double y, double boostAngle, double boostPower) {
        return new ArenaHazard(id, HazardType.JUMP_PAD, x, y, 24.0, boostAngle, boostPower, 0);
    }

    public static ArenaHazard createLavaPool(String id, double x, double y, double radius) {
        return new ArenaHazard(id, HazardType.LAVA_POOL, x, y, radius, 0.0, 0.0, 0);
    }

    public static ArenaHazard createExplosiveBarrel(String id, double x, double y) {
        return new ArenaHazard(id, HazardType.EXPLOSIVE_BARREL, x, y, 16.0, 0.0, 0.0, 20);
    }

    public boolean intersectsCircle(double cx, double cy, double cr) {
        if (!active && type == HazardType.EXPLOSIVE_BARREL) return false;
        double dx = cx - this.x;
        double dy = cy - this.y;
        double distSq = dx * dx + dy * dy;
        double radiusSum = this.radius + cr;
        return distSq <= (radiusSum * radiusSum);
    }

    public boolean takeDamage(int damage) {
        if (type != HazardType.EXPLOSIVE_BARREL || !active) {
            return false;
        }
        this.health = Math.max(0, this.health - damage);
        if (this.health <= 0) {
            this.active = false;
            this.respawnTime = System.currentTimeMillis() + 18000L; // 18s respawn
            return true; // Exploded
        }
        return false;
    }

    public void reset() {
        this.health = maxHealth;
        this.active = true;
        this.lastTriggerTime = 0L;
        this.respawnTime = 0L;
    }

    public String getId() {
        return id;
    }

    public HazardType getType() {
        return type;
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public double getRadius() {
        return radius;
    }

    public double getBoostAngle() {
        return boostAngle;
    }

    public double getBoostPower() {
        return boostPower;
    }

    public int getHealth() {
        return health;
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public long getLastTriggerTime() {
        return lastTriggerTime;
    }

    public void setLastTriggerTime(long lastTriggerTime) {
        this.lastTriggerTime = lastTriggerTime;
    }

    public long getRespawnTime() {
        return respawnTime;
    }

    public void setRespawnTime(long respawnTime) {
        this.respawnTime = respawnTime;
    }
}
