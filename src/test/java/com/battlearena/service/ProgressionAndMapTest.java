package com.battlearena.service;

import com.battlearena.dto.AuthRequest;
import com.battlearena.dto.AuthResponse;
import com.battlearena.dto.UserProfileResponse;
import com.battlearena.model.Obstacle;
import com.battlearena.model.Room;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ProgressionAndMapTest {

    @Autowired
    private UserService userService;

    @Test
    @DisplayName("Verify map geometries and obstacles for all 3 tactical arena maps")
    void testMapGeometries() {
        Room coreRoom = new Room("R-CORE", "Core Arena", "Host1", 4, "PVP_FFA", "VETERAN", "CYBER_CORE");
        assertEquals("CYBER_CORE", coreRoom.getMapId());
        List<Obstacle> coreObs = coreRoom.getObstacles();
        assertEquals(5, coreObs.size(), "CYBER_CORE must contain 5 obstacles");
        assertTrue(coreObs.stream().anyMatch(o -> o.getId().equals("OBS-CENTER")));

        Room neonRoom = new Room("R-NEON", "Neon Outpost", "Host2", 4, "PVP_FFA", "VETERAN", "NEON_OUTPOST");
        assertEquals("NEON_OUTPOST", neonRoom.getMapId());
        List<Obstacle> neonObs = neonRoom.getObstacles();
        assertEquals(6, neonObs.size(), "NEON_OUTPOST must contain 6 tactical obstacles");
        assertTrue(neonObs.stream().anyMatch(o -> o.getId().equals("OBS-NORTH-BUNKER")));

        Room orbitalRoom = new Room("R-ORB", "Orbital Station", "Host3", 4, "PVP_FFA", "ELITE", "ORBITAL_STATION");
        assertEquals("ORBITAL_STATION", orbitalRoom.getMapId());
        List<Obstacle> orbObs = orbitalRoom.getObstacles();
        assertEquals(5, orbObs.size(), "ORBITAL_STATION must contain 5 obstacles");
        assertTrue(orbObs.stream().anyMatch(o -> o.getId().equals("OBS-REACTOR-CORE")));
    }

    @Test
    @DisplayName("Verify Overcharge Beacon objective cycle and capture logic")
    void testOverchargeBeaconLifecycle() {
        Room room = new Room("R-BEACON", "Beacon Room", "Host", 4);
        assertFalse(room.isBeaconActive());

        // At 90s remaining (mod 30 == 0), beacon activates
        boolean activeAt90 = room.checkBeaconActiveState(90);
        assertTrue(activeAt90);
        assertTrue(room.isBeaconActive());
        assertEquals(400.0, room.getBeaconX());
        assertEquals(300.0, room.getBeaconY());

        // At 75s remaining (mod 30 == 15), beacon expires
        boolean activeAt75 = room.checkBeaconActiveState(75);
        assertFalse(activeAt75);
        assertFalse(room.isBeaconActive());
    }

    @Test
    @DisplayName("Verify user progression XP, leveling, cosmetics, and weapon mastery persistence")
    void testUserProgressionSystem() {
        AuthResponse auth = userService.register(new AuthRequest("pilot_ace", "password123"));
        assertNotNull(auth.getToken());

        UserProfileResponse initialProfile = userService.getUserProfile("pilot_ace");
        assertEquals(0, initialProfile.getXp());
        assertEquals(1, initialProfile.getLevel());
        assertEquals("Rookie Pilot", initialProfile.getEquippedTitle());

        // Simulate 2 high performance matches with victory
        userService.recordMatchResult("pilot_ace", 100, 5, 1, true, "SNIPER");
        userService.recordMatchResult("pilot_ace", 110, 4, 0, true, "SNIPER");

        UserProfileResponse progressedProfile = userService.getUserProfile("pilot_ace");
        assertTrue(progressedProfile.getXp() >= 2000, "XP should exceed 2000 after 2 victorious matches");
        assertTrue(progressedProfile.getLevel() >= 3, "User level should reach at least level 3");
        assertEquals(9, progressedProfile.getKills());
        assertEquals(1, progressedProfile.getDeaths());
        assertEquals(2, progressedProfile.getWins());

        // Verify unlocks
        assertTrue(progressedProfile.getUnlockedTitlesJson().contains("Cyber Scout"));
        assertTrue(progressedProfile.getUnlockedTitlesJson().contains("Vanguard Elite"));
        assertTrue(progressedProfile.getUnlockedTrailsJson().contains("EMERALD_SURGE"));

        // Equip unlocked cosmetic title and trail
        UserProfileResponse equippedProfile = userService.equipCosmetics("pilot_ace", "Cyber Scout", "EMERALD_SURGE");
        assertEquals("Cyber Scout", equippedProfile.getEquippedTitle());
        assertEquals("EMERALD_SURGE", equippedProfile.getEquippedTrail());

        // Weapon mastery must be recorded
        assertTrue(equippedProfile.getWeaponMasteryJson().contains("SNIPER"));
    }
}
