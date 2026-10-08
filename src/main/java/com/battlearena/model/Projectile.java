package com.battlearena.model;

/**
 * Lightweight, server-authoritative projectile entity.
 *
 * Layer: Domain / Model (Game State)
 * Responsibility: Encapsulates origin, heading, velocity vector, damage payload,
 * and lifetime timestamp for deterministic linear projectile physics.
 *
 * Performance:
 * Employs closed-form linear kinematics x(t) = x0 + vx*dt and y(t) = y0 + vy*dt.
 * This avoids background physics ticker threads while maintaining exact sub-millisecond precision.
 */
public class Projectile {

    private final String id;
    private final String shooterUsername;
    private final double startX;
    private final double startY;
    private final double vx;
    private final double vy;
    private final double speed;
    private final double heading;
    private final int damage;
    private final int radius;
    private final long createdAt;
    private final long maxLifeMs;

    public Projectile(String id, String shooterUsername, double startX, double startY, double heading) {
        this(id, shooterUsername, startX, startY, heading, 520.0, 20, 5);
    }

    public Projectile(String id, String shooterUsername, double startX, double startY, double heading,
                      double speed, int damage, int radius) {
        this.id = id;
        this.shooterUsername = shooterUsername;
        this.startX = startX;
        this.startY = startY;
        this.heading = heading;
        this.speed = speed;
        this.damage = damage;
        this.radius = radius;
        this.vx = Math.cos(heading) * this.speed;
        this.vy = Math.sin(heading) * this.speed;
        this.createdAt = System.currentTimeMillis();
        this.maxLifeMs = 2200L;
    }

    public String getId() {
        return id;
    }

    public String getShooterUsername() {
        return shooterUsername;
    }

    public double getStartX() {
        return startX;
    }

    public double getStartY() {
        return startY;
    }

    public double getVx() {
        return vx;
    }

    public double getVy() {
        return vy;
    }

    public double getSpeed() {
        return speed;
    }

    public double getHeading() {
        return heading;
    }

    public int getDamage() {
        return damage;
    }

    public int getRadius() {
        return radius;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public long getMaxLifeMs() {
        return maxLifeMs;
    }

    /**
     * Computes the current X coordinate at a given epoch timestamp.
     */
    public double getCurrentX(long now) {
        double dtSeconds = Math.max(0.0, (now - createdAt) / 1000.0);
        return startX + vx * dtSeconds;
    }

    /**
     * Computes the current Y coordinate at a given epoch timestamp.
     */
    public double getCurrentY(long now) {
        double dtSeconds = Math.max(0.0, (now - createdAt) / 1000.0);
        return startY + vy * dtSeconds;
    }

    /**
     * Determines whether the projectile has exceeded its lifetime.
     */
    public boolean isExpired(long now) {
        return (now - createdAt) > maxLifeMs;
    }
}
