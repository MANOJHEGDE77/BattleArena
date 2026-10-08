package com.battlearena.model;

/**
 * Result of damage applied to a combatant, reflecting shield absorption,
 * residual health deduction, and elimination state.
 */
public record DamageResult(
        int shieldDamage,
        int healthDamage,
        int currentShield,
        int currentHealth,
        boolean eliminated
) {}
