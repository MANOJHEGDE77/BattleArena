package com.battlearena.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Warrior Class Balance & Specification Tests")
class WarriorClassTest {

    @Test
    @DisplayName("Verify all 4 combat classes exist with distinct attributes")
    void testWarriorClassesExist() {
        assertEquals(4, WarriorClass.values().length);
        assertNotNull(WarriorClass.valueOf("ASSAULT"));
        assertNotNull(WarriorClass.valueOf("JUGGERNAUT"));
        assertNotNull(WarriorClass.valueOf("SCOUT"));
        assertNotNull(WarriorClass.valueOf("SNIPER"));
    }

    @Test
    @DisplayName("Verify Juggernaut tank durability vs Scout agility balance")
    void testClassBalanceSpecifications() {
        WarriorClass juggernaut = WarriorClass.JUGGERNAUT;
        WarriorClass scout = WarriorClass.SCOUT;
        WarriorClass assault = WarriorClass.ASSAULT;
        WarriorClass sniper = WarriorClass.SNIPER;

        // Juggernaut highest health and shield
        assertTrue(juggernaut.getMaxHealth() > assault.getMaxHealth());
        assertTrue(juggernaut.getMaxShield() > assault.getMaxShield());

        // Scout highest speed
        assertTrue(scout.getSpeed() > assault.getSpeed());
        assertTrue(scout.getSpeed() > juggernaut.getSpeed());

        // Sniper highest single-shot damage and projectile speed
        assertTrue(sniper.getDamage() > assault.getDamage());
        assertTrue(sniper.getProjectileSpeed() > assault.getProjectileSpeed());
        assertTrue(sniper.getAttackCooldownMs() > assault.getAttackCooldownMs());

        // Scout fastest attack cooldown
        assertTrue(scout.getAttackCooldownMs() < assault.getAttackCooldownMs());
    }

    @Test
    @DisplayName("Verify weapons and color codes are configured")
    void testWeaponMetadata() {
        for (WarriorClass wc : WarriorClass.values()) {
            assertNotNull(wc.getWeaponName());
            assertFalse(wc.getWeaponName().isBlank());
            assertNotNull(wc.getColor());
            assertTrue(wc.getColor().startsWith("#"));
            assertNotNull(wc.getDescription());
        }
    }
}
