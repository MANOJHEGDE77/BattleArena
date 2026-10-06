package com.battlearena.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;

/**
 * Server-authoritative in-game collectible Coin.
 *
 * Layer: Domain / Model (Game State)
 * Responsibility: Holds coordinate location, point value, collision radius, and creation timestamp.
 */
public class Coin {

    private final String id;
    private final double x;
    private final double y;
    private final int value;
    private final int radius;

    @JsonIgnore
    private final Instant createdAt;

    public Coin(String id, double x, double y, int value) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 8;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    public int getValue() {
        return value;
    }

    public int getRadius() {
        return radius;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
