package com.battlearena.model;

/**
 * Server-authoritative Tactical Power-up pickup on the arena floor.
 *
 * Layer: Domain / Model
 * Responsibility: Models collectible buff items, their coordinates, radial collision hitboxes,
 * and associated buff duration properties.
 */
public class PowerUp {

    private final String id;
    private final PowerUpType type;
    private final double x;
    private final double y;
    private final double radius;
    private final long durationMs;

    public PowerUp(String id, PowerUpType type, double x, double y) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = 15.0;
        switch (type) {
            case SPEED_BOOST -> this.durationMs = 7000L;
            case SPREAD_SHOT -> this.durationMs = 8000L;
            case SHIELD -> this.durationMs = 12000L;
            default -> this.durationMs = 6000L;
        }
    }

    public String getId() {
        return id;
    }

    public PowerUpType getType() {
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

    public long getDurationMs() {
        return durationMs;
    }
}
