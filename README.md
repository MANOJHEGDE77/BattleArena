# ⚔️ Cyber Battle Arena

> **Real-Time Server-Authoritative Multiplayer 2D Canvas Monolith**  
> *Zero external frontend libraries • Zero audio files • Zero static image assets • 100% Procedural Canvas 2D & Web Audio API*

---

## 🌟 Executive Overview

**Cyber Battle Arena** is a competitive real-time 2D multiplayer top-down arena shooter built on an ultra-low-resource monolithic architecture. Combining high-performance **Java 21** and **Spring Boot 3** on the backend with pure, unadulterated **Vanilla HTML5 Canvas 2D, CSS3, and JavaScript** on the frontend, the game delivers sub-millisecond tick synchronization, server-authoritative physics, and rich cyberpunk audiovisuals without a single external client dependency, sound file, or sprite sheet.

---

## 🛠️ Core Technology Stack

| Layer | Technologies & Specifications |
| :--- | :--- |
| **Backend Core** | Java 21 LTS, Spring Boot 3.3.4, Spring Web, Spring WebSocket, Spring Security |
| **Data & Persistence** | Spring Data JPA, Hibernate, MySQL 8.0+ relational storage with connection pooling |
| **Security & Auth** | Stateless JWT (JSON Web Tokens) with HMAC-SHA256 signing, BCrypt password hashing |
| **Networking** | Server-authoritative bidirectional WebSockets (`/ws/game`), JSON packet routing |
| **Client Rendering** | HTML5 Canvas 2D, hardware-accelerated vector drawing, sub-pixel delta interpolation |
| **Audio Synthesis** | 100% Procedural Web Audio API synthesizer (oscillators, biquad filters, white noise buffers) |
| **Styling & HUD** | Modern glassmorphism, responsive grid layouts, Google Fonts (Outfit), CSS3 micro-animations |

---

## 🚀 Complete 20-Phase Feature Matrix (100% Milestone)

```
[Phase 1-5]  Core Foundation ➔ Monolith Architecture, Canvas 2D Loop, JWT Auth, Lobby System, WebSockets
[Phase 6-9]  Combat Engine   ➔ Coin Collectibles, Career History, Server-Authoritative Combat, Leaderboards
[Phase 10-13] Arena Dynamics ➔ Tactical Bunkers, Power-Up Buffs, Sudden Death Storm, Web Audio Synth Engine
[Phase 14-17] Tactical Depth ➔ In-Game Comms Chat, Spectator Drone, 4 Warrior Classes, Environmental Hazards
[Phase 18-20] Apex Release   ➔ Radial Emote Wheel, Dynamic Killcam, Match Accolades, Achievements & Settings
```

### 1. Server-Authoritative Physics & Combat
- **Lag Compensation & Bounded Raycasts:** Projectiles travel at deterministic velocities. The server validates line-of-sight against bunkers, calculates closed-form positions, and rejects client exploits.
- **Shield & Durability Modeling:** Health and energy shields absorb damage dynamically. Shield deflections produce bright cyan feedback rings and distinct procedural audio chirps.

### 2. Four Specialized Warrior Classes
Each warrior archetype is tuned with distinct attributes, speeds, and proprietary weapon loadouts:
- **🛡️ ASSAULT (Vanguard):** 100 HP, 50 Shield, 240 px/s speed. Wields the rapid *Pulse Blaster* (20 DMG, 650 vel, 350ms CD).
- **🦾 JUGGERNAUT (Titan):** 150 HP, 75 Shield, 195 px/s speed. Wields the explosive *Plasma Cannon* (35 DMG, 420 vel, 550ms CD).
- **⚡ SCOUT (Skirmisher):** 75 HP, 35 Shield, 290 px/s speed. Wields *Twin Needles* (14 DMG, 720 vel, 220ms CD).
- **🎯 SNIPER (Marksman):** 85 HP, 40 Shield, 220 px/s speed. Wields the lethal *Hyper Railgun* (45 DMG, 820 vel, 620ms CD).

### 3. Dynamic Environmental Hazards
- **⚡ Jump Boost Launch Pads:** Spring-loaded conduits launching warriors across obstacles at 340 px/s.
- **🌋 Thermal Lava Pools:** Geothermal vents dealing 15 continuous damage/sec to prevent camping.
- **💥 Volatile Fuel Barrels:** Interactive explosive canisters detonating with a 90px blast radius (35 damage) upon bullet impact.
- **⛈️ Sudden Death Safe Zone:** A contracting electromagnetic ring collapsing during endgame; exterior triggers toxic storm ticks.

### 4. Tactical Emote Wheel & In-World Callouts
- **Radial Wheel HUD:** Press `[T]` or keys `[1-8]` to trigger instant callouts:
  - `[1]` 🎯 *Enemy Sighted* • `[2]` 🛡️ *Defend Here* • `[3]` ⚡ *Charge In* • `[4]` 💥 *Danger Ahead*
  - `[5]` 🚨 *Need Backup* • `[6]` 💀 *Taunt Flex* • `[7]` 👑 *Good Game* • `[8]` ❤️ *Need Repairs*
- **Vector Speech Holograms:** In-world holographic speech bubbles floating above warriors with pulsing radar ping beacon rings.

### 5. Dynamic Killcam, Accolades & Match Recap
- **Glassmorphic Death Cam:** Highlights the killer's avatar, class, remaining HP/shield, weapon used, impact range, and respawn countdown bar.
- **Post-Match Accolades:** Automatically computes MVP, Apex Eliminator, and First Blood badges.
- **Combat Highlights Timeline:** Chronological battle replay log with instantaneous copy-to-clipboard battle report export.

### 6. Career Achievements & System Settings
- **6 Unlocked Milestones:** *First Blood*, *Apex Champion*, *Sharpshooter*, *Iron Titan*, *Cyber Hoarder*, and *Hazard Engineer*.
- **Celebratory Toast Fanfare:** Unlocks trigger gold cyberpunk notification banners and procedural arpeggiated audio fanfares.
- **Procedural Ambient Drone:** 55Hz sub-bass binaural atmospheric synthesizer generates an immersive cyberpunk soundscape.
- **Live Latency / Ping Meter:** Real-time round-trip latency (`ms`) monitored dynamically in the HUD.

---

## 📡 WebSocket Network Protocol

All real-time communications flow through the `/ws/game` endpoint over JSON packet structures:

### Client ➔ Server Packets
```json
// Locomotion Update
{ "type": "MOVE", "x": 320.5, "y": 240.0, "heading": 1.57 }

// Class Weapon Fire
{ "type": "ATTACK", "heading": 0.785 }

// Projectile Hit Claim
{ "type": "PROJECTILE_HIT", "projectileId": "PROJ-A1B2C3", "targetUsername": "Viper" }

// Tactical Callout Emote
{ "type": "EMOTE", "emoteId": "TARGET_SPOTTED" }

// In-Game Text Chat
{ "type": "CHAT", "text": "Push B bunker now!" }

// Round-Trip Ping
{ "type": "PING", "clientTime": 12485.2 }
```

### Server ➔ Client Broadcast Events
```json
// Projectile Spawn
{ "type": "PROJECTILE_SPAWNED", "id": "PROJ-A1B2C3", "shooter": "Dan", "x": 100, "y": 300, "vx": 820, "vy": 0, "speed": 820, "damage": 45, "radius": 4 }

// Damage Resolution
{ "type": "PLAYER_DAMAGED", "projectileId": "PROJ-A1B2C3", "targetUsername": "Bob", "shooterUsername": "Dan", "damage": 45, "shieldDamage": 25, "healthDamage": 20, "currentHealth": 55, "isEliminated": false }

// Elimination & Killcam Breakdown
{ "type": "PLAYER_ELIMINATED", "victim": "Bob", "killer": "Dan", "killerClass": "SNIPER", "weaponName": "Hyper Railgun", "distance": 220, "killerHealth": 85, "killerMaxHealth": 85, "killerShield": 40, "respawnDelayMs": 2500 }

// Barrel Detonation
{ "type": "BARREL_EXPLODED", "barrelId": "BARREL-1", "x": 160, "y": 430, "blastRadius": 90, "victims": [...] }

// Latency Pong
{ "type": "PONG", "clientTime": 12485.2, "timestamp": 1791468500120 }
```

---

## 🎮 Controls & Hotkeys Guide

| Keybind | Function |
| :--- | :--- |
| **W, A, S, D** / **Arrows** | Omnidirectional arena locomotion & strafing |
| **Mouse Aim + Left Click** / **Space** | Aim vector pointer; fire class weapon projectile |
| **[T]** / **[1 - 8]** | Open Tactical Emote Wheel or trigger instant callout ping |
| **Enter** | Open and submit in-game match chat message |
| **[M]** | Instant toggle audio synthesizer mute / unmute |
| **[H]** | Toggle Tactical Operations & Intel Manual modal |
| **[Esc]** | Toggle Audio / Settings modal & dismiss open windows |
| **[1 - 8]** *(Spectator Mode)* | Snap observer drone to track specific player index |
| **Space** *(Spectator Mode)* | Recenter free camera to arena center |

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- **Java 21 (JDK 21 LTS)** installed and configured on your `PATH`.
- **Apache Maven 3.9+** (or use bundled `mvn`).
- **MySQL 8.0+** running locally on port 3306 with database `battle_arena` created.

### 1. Database Configuration
Ensure MySQL has a database named `battle_arena`:
```sql
CREATE DATABASE IF NOT EXISTS battle_arena;
```
Configure your credentials in `src/main/resources/application.properties` if different from default `root` / `password`.

### 2. Build & Launch the Server
```bash
mvn clean compile
mvn spring-boot:run
```
Once started, Tomcat will serve the monolith on **`http://localhost:8080`**.

### 3. Play
Open `http://localhost:8080` in your modern web browser (Chrome, Edge, Firefox, Safari).
1. Click **Login / Register** to create a player profile.
2. Join an existing arena or click **+ Create Room**.
3. Select your **Warrior Class** (Assault, Juggernaut, Scout, or Sniper).
4. Click **Ready Up** and battle!

---

## 🧪 Comprehensive Automated Test Suites

The repository contains standalone Node.js automated verification test scripts under `scratch/`:
- `test_phase8_combat.js` - Projectiles, hit detection & health deduction
- `test_phase10_obstacles.js` - Bunker raycast cover checks
- `test_phase11_powerups.js` - Shield, speed boost & spread shot buffs
- `test_phase12_storm.js` - Safe zone contraction & sudden death damage
- `test_phase13_audio.js` - Procedural Web Audio API synthesis verification
- `test_phase14_chat.js` - Real-time match chat broadcasting
- `test_phase15_spectator.js` - Observer drone mode & spectate mechanics
- `test_phase16_classes.js` - 4 Warrior classes, stats & weapon dynamics
- `test_phase17_hazards.js` - Jump pads, lava pools & explosive barrels
- `test_phase18_emotes.js` - Radial emote wheel, speech bubbles & beacons
- `test_phase19_recap.js` - Dynamic killcam review & combat timeline highlights
- `test_phase20_master_100.js` - Full end-to-end master integration suite

---

## 📜 License & Acknowledgments

Engineered as a clean-room demonstration of modern low-overhead, high-performance web engineering.  
Zero bloated dependencies, maximum responsiveness.
