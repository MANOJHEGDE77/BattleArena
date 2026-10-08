package com.battlearena.model;

/**
 * Server-authoritative circular Safe Zone for Battle Royale style shrinking arena dynamics.
 *
 * Layer: Domain / Model
 * Responsibility: Computes dynamic safe zone radius over match progression,
 * determines out-of-bounds boundary violations, and manages storm damage ticks.
 */
public class SafeZone {

    private final double centerX;
    private final double centerY;
    private final double initialRadius;
    private final double minRadius;
    private final int shrinkStartDelaySec;
    private final int shrinkDurationSec;

    public SafeZone() {
        // Standard 800x600 arena center coordinates
        this.centerX = 400.0;
        this.centerY = 300.0;
        this.initialRadius = 420.0; // Encompasses main arena, outer corners are in storm
        this.minRadius = 110.0;     // Concentrated central showdown radius
        this.shrinkStartDelaySec = 15; // Shrink activates after 15s for thrilling pacing
        this.shrinkDurationSec = 60;   // Shrinks over 60s down to minRadius
    }

    public double getCenterX() {
        return centerX;
    }

    public double getCenterY() {
        return centerY;
    }

    public double getInitialRadius() {
        return initialRadius;
    }

    public double getMinRadius() {
        return minRadius;
    }

    public int getShrinkStartDelaySec() {
        return shrinkStartDelaySec;
    }

    /**
     * Calculates the deterministic safe zone radius at a given match elapsed second.
     */
    public double calculateRadius(long elapsedSec) {
        if (elapsedSec < shrinkStartDelaySec) {
            return initialRadius;
        }
        long shrinkElapsed = elapsedSec - shrinkStartDelaySec;
        if (shrinkElapsed >= shrinkDurationSec) {
            return minRadius;
        }
        double progress = (double) shrinkElapsed / shrinkDurationSec;
        return initialRadius - (progress * (initialRadius - minRadius));
    }

    /**
     * Evaluates if specified player coordinates are outside the current safe perimeter.
     */
    public boolean isOutside(double x, double y, double currentRadius) {
        double dx = x - centerX;
        double dy = y - centerY;
        return (dx * dx + dy * dy) > (currentRadius * currentRadius);
    }
}
