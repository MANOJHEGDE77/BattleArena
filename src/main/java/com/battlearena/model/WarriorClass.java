package com.battlearena.model;

/**
 * Combat warrior class specialization.
 * Defines distinct attributes, movement agility, kinetic durability,
 * firing rate, and weapon payload specifications.
 *
 * Layer: Domain / Model
 */
public enum WarriorClass {
    ASSAULT(100, 50, 240, 320L, 20, 520.0, 5, "#10b981", "Rapid Pulse Blaster", "Balanced all-rounder Vanguard"),
    JUGGERNAUT(150, 75, 195, 480L, 35, 420.0, 8, "#f59e0b", "Heavy Plasma Cannon", "Fortified bulkhead armored Titan"),
    SCOUT(75, 35, 290, 240L, 14, 620.0, 4, "#a855f7", "Twin Needle Lasers", "High-velocity agile Skirmisher"),
    SNIPER(85, 40, 220, 620L, 45, 820.0, 4, "#06b6d4", "Hyper Railgun", "Devastating precision Marksman");

    private final int maxHealth;
    private final int maxShield;
    private final int speed;
    private final long attackCooldownMs;
    private final int damage;
    private final double projectileSpeed;
    private final int projectileRadius;
    private final String color;
    private final String weaponName;
    private final String description;

    WarriorClass(int maxHealth, int maxShield, int speed, long attackCooldownMs,
                 int damage, double projectileSpeed, int projectileRadius,
                 String color, String weaponName, String description) {
        this.maxHealth = maxHealth;
        this.maxShield = maxShield;
        this.speed = speed;
        this.attackCooldownMs = attackCooldownMs;
        this.damage = damage;
        this.projectileSpeed = projectileSpeed;
        this.projectileRadius = projectileRadius;
        this.color = color;
        this.weaponName = weaponName;
        this.description = description;
    }

    public int getMaxHealth() {
        return maxHealth;
    }

    public int getMaxShield() {
        return maxShield;
    }

    public int getSpeed() {
        return speed;
    }

    public long getAttackCooldownMs() {
        return attackCooldownMs;
    }

    public int getDamage() {
        return damage;
    }

    public double getProjectileSpeed() {
        return projectileSpeed;
    }

    public int getProjectileRadius() {
        return projectileRadius;
    }

    public String getColor() {
        return color;
    }

    public String getWeaponName() {
        return weaponName;
    }

    public String getDescription() {
        return description;
    }
}
