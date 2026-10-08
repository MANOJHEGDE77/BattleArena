package com.battlearena.model;

/**
 * Server-authoritative Axis-Aligned Bounding Box (AABB) Obstacle.
 *
 * Layer: Domain / Model
 * Responsibility: Provides geometrical barrier definitions, Circle-vs-AABB collision resolution,
 * and Raycast line segment intersection for projectile interception and tactical cover.
 *
 * Performance: Zero-allocation pure analytical arithmetic.
 */
public class Obstacle {

    private final String id;
    private final double x;
    private final double y;
    private final double width;
    private final double height;
    private final String type; // e.g. "BUNKER", "BARRIER"

    public Obstacle(String id, double x, double y, double width, double height, String type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
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

    public double getWidth() {
        return width;
    }

    public double getHeight() {
        return height;
    }

    public String getType() {
        return type;
    }

    /**
     * Checks if a circle overlaps this AABB obstacle.
     */
    public boolean intersectsCircle(double cx, double cy, double radius) {
        double nx = Math.max(x, Math.min(cx, x + width));
        double ny = Math.max(y, Math.min(cy, y + height));
        double dx = cx - nx;
        double dy = cy - ny;
        return (dx * dx + dy * dy) < (radius * radius);
    }

    /**
     * Resolves a circle's position so it remains outside the obstacle box.
     * Modifies the pos array {x, y} in place.
     */
    public void resolveCircle(double[] pos, double radius) {
        double px = pos[0];
        double py = pos[1];

        double nx = Math.max(x, Math.min(px, x + width));
        double ny = Math.max(y, Math.min(py, y + height));

        double dx = px - nx;
        double dy = py - ny;
        double distSq = dx * dx + dy * dy;

        if (distSq < radius * radius) {
            if (distSq > 1e-6) {
                double dist = Math.sqrt(distSq);
                double overlap = radius - dist;
                pos[0] += (dx / dist) * overlap;
                pos[1] += (dy / dist) * overlap;
            } else {
                // Circle center is inside the box: push out toward nearest edge
                double distLeft = px - x;
                double distRight = (x + width) - px;
                double distTop = py - y;
                double distBottom = (y + height) - py;

                double minDist = Math.min(Math.min(distLeft, distRight), Math.min(distTop, distBottom));
                if (minDist == distLeft) {
                    pos[0] = x - radius;
                } else if (minDist == distRight) {
                    pos[0] = x + width + radius;
                } else if (minDist == distTop) {
                    pos[1] = y - radius;
                } else {
                    pos[1] = y + height + radius;
                }
            }
        }
    }

    /**
     * Line Segment vs AABB intersection (Slab method).
     * Determines whether a projectile trajectory from (x0, y0) to (x1, y1)
     * hits or is blocked by this obstacle.
     */
    public boolean intersectsSegment(double x0, double y0, double x1, double y1) {
        double dx = x1 - x0;
        double dy = y1 - y0;

        double tMinX, tMaxX;
        if (Math.abs(dx) < 1e-9) {
            if (x0 < x || x0 > x + width) {
                return false;
            }
            tMinX = Double.NEGATIVE_INFINITY;
            tMaxX = Double.POSITIVE_INFINITY;
        } else {
            double tx1 = (x - x0) / dx;
            double tx2 = (x + width - x0) / dx;
            tMinX = Math.min(tx1, tx2);
            tMaxX = Math.max(tx1, tx2);
        }

        double tMinY, tMaxY;
        if (Math.abs(dy) < 1e-9) {
            if (y0 < y || y0 > y + height) {
                return false;
            }
            tMinY = Double.NEGATIVE_INFINITY;
            tMaxY = Double.POSITIVE_INFINITY;
        } else {
            double ty1 = (y - y0) / dy;
            double ty2 = (y + height - y0) / dy;
            tMinY = Math.min(ty1, ty2);
            tMaxY = Math.max(ty1, ty2);
        }

        double tEnter = Math.max(tMinX, tMinY);
        double tExit = Math.min(tMaxX, tMaxY);

        return tEnter <= tExit && tExit >= 0.0 && tEnter <= 1.0;
    }
}
