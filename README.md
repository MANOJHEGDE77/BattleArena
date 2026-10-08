# Cyber Battle Arena

[![Play Game](https://img.shields.io/badge/🎮%20Play%20Game-Local%20Live%20Server-00f2fe?style=for-the-badge&logo=googlechrome&logoColor=white)](http://localhost:8080)
[![GitHub Pages Demo](https://img.shields.io/badge/🌐%20Web%20Client-GitHub%20Pages%20Demo-8b5cf6?style=for-the-badge&logo=github&logoColor=white)](https://manojhegde77.github.io/BattleArena/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MANOJHEGDE77/BattleArena)
[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://github.com/MANOJHEGDE77/BattleArena)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://github.com/MANOJHEGDE77/BattleArena)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/MANOJHEGDE77/BattleArena)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://github.com/MANOJHEGDE77/BattleArena)
[![WebSockets](https://img.shields.io/badge/Networking-WebSockets%20(WSS)-00f2fe?style=for-the-badge)](https://github.com/MANOJHEGDE77/BattleArena)

---

## 🎮 Play & Live Access Links

| Environment | Direct Access Link | Details |
|---|---|---|
| 🕹️ **Local Playable Game** | [**http://localhost:8080**](http://localhost:8080) | **Full Production Game:** Real-time multiplayer, WebSockets, dynamic procedural Web Audio synth, warrior classes, bot combatants, leaderboard & killcam. |
| 🌐 **GitHub Pages Web Demo** | [**https://manojhegde77.github.io/BattleArena/**](https://manojhegde77.github.io/BattleArena/) | **Client UI & Sound Preview:** Instant browser preview of the cockpit HUD, warrior class loadouts, audio synthesizer, and arena interface. |
| 🩺 **Backend Health API** | [**http://localhost:8080/api/health**](http://localhost:8080/api/health) | Backend health diagnostic and real-time game status endpoint. |
| 📁 **GitHub Repository** | [**https://github.com/MANOJHEGDE77/BattleArena**](https://github.com/MANOJHEGDE77/BattleArena) | Source repository, commit logs, issue tracker, and project documentation. |

> 💡 **Quick Launch:** To play locally right now, run `mvn spring-boot:run` in terminal and navigate to [**http://localhost:8080**](http://localhost:8080).

---

A real-time, server-authoritative multiplayer 2D arena shooter built using Java 21, Spring Boot, WebSockets, MySQL, HTML5 Canvas, and the Web Audio API.

Cyber Battle Arena is designed as a lightweight monolithic multiplayer application. The server manages authoritative game state, player movement, combat, projectiles, collisions, hazards, power-ups, and match events, while the browser client handles rendering, user input, interface components, and procedural audio.

The project intentionally avoids frontend frameworks, game engines, external sprite sheets, and audio files. Game visuals are rendered using HTML5 Canvas 2D, and audio effects are generated dynamically using the Web Audio API.

---

## Project Overview

The application provides a real-time multiplayer arena where players can:

- Create and join multiplayer rooms
- Select different warrior classes
- Move and aim in real time
- Fire class-specific weapons
- Fight other players
- Collect power-ups
- Use environmental hazards
- Communicate through in-game chat
- Use tactical emotes
- Enter spectator mode after elimination
- View killcam information
- Review match statistics
- Unlock achievements

The server is responsible for validating important gameplay actions to prevent clients from directly manipulating game state.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 |
| Framework | Spring Boot 3.3.4 |
| Web | Spring Web |
| Real-Time Communication | Spring WebSocket |
| Security | Spring Security |
| Authentication | JWT |
| Password Hashing | BCrypt |
| Persistence | Spring Data JPA |
| ORM | Hibernate |
| Database | MySQL 8+ |
| Build Tool | Maven |
| Frontend | HTML5, CSS3, JavaScript |
| Rendering | HTML5 Canvas 2D |
| Audio | Web Audio API |
| Testing | Node.js test scripts |

---

## Architecture

Cyber Battle Arena uses a monolithic server architecture.

```text
Browser Client
    |
    | HTTP / WebSocket
    |
    v
Spring Boot Application
    |
    +-- Authentication
    +-- Lobby Management
    +-- Room Management
    +-- Game Engine
    +-- Movement Validation
    +-- Combat Engine
    +-- Projectile System
    +-- Collision Detection
    +-- Power-Up System
    +-- Hazard System
    +-- Chat System
    +-- Emote System
    +-- Spectator System
    +-- Match Management
    |
    v
MySQL Database
```

The browser is responsible for presentation and input, while the server remains the authority for important gameplay decisions.

---

## Server-Authoritative Architecture

The client does not have final authority over game state.

For example, when a player fires a weapon:

```text
Client
   |
   | ATTACK
   v
Server
   |
   +-- Validate player
   +-- Validate weapon
   +-- Validate cooldown
   +-- Create projectile
   +-- Calculate projectile movement
   +-- Perform collision detection
   +-- Calculate damage
   +-- Update player state
   |
   v
Broadcast Result
   |
   v
Connected Clients
```

This prevents clients from directly deciding:

- Damage
- Health
- Shield values
- Projectile results
- Cooldowns
- Eliminations
- Match results
- Invalid movement

---

## Warrior Classes

The game provides four classes with different characteristics.

| Class | Health | Shield | Speed | Weapon | Damage | Projectile Speed | Cooldown |
|---|---:|---:|---:|---|---:|---:|---:|
| Assault | 100 | 50 | 240 | Pulse Blaster | 20 | 650 | 350 ms |
| Juggernaut | 150 | 75 | 195 | Plasma Cannon | 35 | 420 | 550 ms |
| Scout | 75 | 35 | 290 | Twin Needles | 14 | 720 | 220 ms |
| Sniper | 85 | 40 | 220 | Hyper Railgun | 45 | 820 | 620 ms |

### Assault

Balanced class designed for general combat.

### Juggernaut

High health and shield with lower movement speed and heavier attacks.

### Scout

Fast-moving class with lower durability and rapid attacks.

### Sniper

Long-range class with high damage and a slower firing rate.

---

## Combat System

The combat engine includes:

- Projectile generation
- Projectile movement
- Collision detection
- Damage calculation
- Shield absorption
- Health reduction
- Weapon cooldowns
- Line-of-sight validation
- Obstacle collision
- Player elimination
- Explosion damage

Projectile and damage calculations are performed by the server.

---

## Arena Systems

### Tactical Bunkers

Bunkers provide cover and can block projectile line-of-sight.

The server validates projectile paths against arena obstacles.

### Jump Pads

Jump pads provide additional movement options by launching players across portions of the arena.

### Lava Pools

Players inside lava zones receive continuous damage.

### Explosive Barrels

Players can trigger explosive barrels by shooting them.

The resulting explosion applies area-of-effect damage to nearby players.

### Sudden Death Zone

The playable area contracts during the end phase of the match.

Players outside the safe zone receive periodic damage.

---

## Power-Ups

The arena supports temporary gameplay modifications including:

- Shield boosts
- Movement speed boosts
- Weapon enhancements
- Spread-shot effects

Power-up activation and duration are validated by the server.

---

## Multiplayer Communication

The game uses WebSockets for real-time communication.

WebSocket endpoint:

```text
/ws/game
```

Messages are represented as JSON objects.

### Client to Server

#### Movement

```json
{
  "type": "MOVE",
  "x": 320.5,
  "y": 240.0,
  "heading": 1.57
}
```

#### Attack

```json
{
  "type": "ATTACK",
  "heading": 0.785
}
```

#### Chat

```json
{
  "type": "CHAT",
  "text": "Push B bunker now!"
}
```

#### Emote

```json
{
  "type": "EMOTE",
  "emoteId": "TARGET_SPOTTED"
}
```

#### Ping

```json
{
  "type": "PING",
  "clientTime": 12485.2
}
```

### Server to Client

#### Projectile Spawn

```json
{
  "type": "PROJECTILE_SPAWNED",
  "id": "PROJ-A1B2C3",
  "shooter": "Dan",
  "x": 100,
  "y": 300,
  "vx": 820,
  "vy": 0,
  "speed": 820,
  "damage": 45,
  "radius": 4
}
```

#### Player Damage

```json
{
  "type": "PLAYER_DAMAGED",
  "projectileId": "PROJ-A1B2C3",
  "targetUsername": "Bob",
  "shooterUsername": "Dan",
  "damage": 45,
  "shieldDamage": 25,
  "healthDamage": 20,
  "currentHealth": 55,
  "isEliminated": false
}
```

#### Player Elimination

```json
{
  "type": "PLAYER_ELIMINATED",
  "victim": "Bob",
  "killer": "Dan",
  "killerClass": "SNIPER",
  "weaponName": "Hyper Railgun",
  "distance": 220,
  "killerHealth": 85,
  "killerMaxHealth": 85,
  "killerShield": 40,
  "respawnDelayMs": 2500
}
```

#### Latency Response

```json
{
  "type": "PONG",
  "clientTime": 12485.2,
  "timestamp": 1791468500120
}
```

---

## Controls

| Input | Function |
|---|---|
| W, A, S, D | Movement |
| Arrow Keys | Movement |
| Mouse | Aim |
| Left Click | Fire |
| Space | Fire |
| T | Open tactical emote wheel |
| 1 - 8 | Tactical callouts |
| Enter | Open and submit chat |
| M | Toggle audio |
| H | Open tactical manual |
| Esc | Open settings or close modal |

### Spectator Controls

| Input | Function |
|---|---|
| 1 - 8 | Follow player |
| Space | Center camera |

---

## Tactical Communication

Players can send tactical callouts during a match.

| Key | Callout |
|---|---|
| 1 | Enemy Sighted |
| 2 | Defend Here |
| 3 | Charge In |
| 4 | Danger Ahead |
| 5 | Need Backup |
| 6 | Taunt Flex |
| 7 | Good Game |
| 8 | Need Repairs |

Callouts are displayed as in-world notifications above players.

---

## Spectator Mode

Players who are eliminated can enter spectator mode.

Spectator functionality includes:

- Player tracking
- Player switching
- Arena overview
- Camera recentering
- Follow-player camera

---

## Killcam and Match Recap

The killcam displays information about the elimination event.

Information includes:

- Killer
- Killer class
- Weapon
- Distance
- Remaining health
- Remaining shield
- Respawn countdown

The match recap maintains a chronological record of important combat events.

---

## Authentication and Security

Authentication is implemented using JWT.

The authentication flow is:

```text
Registration
    |
    v
BCrypt Password Hash
    |
    v
MySQL
    |
    v
Login
    |
    v
JWT Generation
    |
    v
Authenticated Requests
```

Passwords are never stored as plaintext.

The application uses stateless authentication and validates authenticated requests before allowing protected operations.

---

## Procedural Audio

The project does not require external audio files.

Audio is generated using the browser's Web Audio API.

Procedural audio is used for:

- Weapon sounds
- Impact effects
- Shield effects
- Explosions
- UI feedback
- Achievement notifications
- Ambient background audio

The audio system uses browser audio nodes such as oscillators, filters, gain nodes, and generated noise buffers.

---

## Canvas Rendering

The game client uses HTML5 Canvas 2D for rendering.

Visual elements are generated procedurally using:

- Lines
- Circles
- Rectangles
- Arcs
- Gradients
- Particles
- Glow effects
- Dynamic animations

No external game engine is required.

---

## Game Loop

The client uses the browser animation loop:

```javascript
requestAnimationFrame(gameLoop);
```

The client separates:

```text
Input
  |
Network
  |
Game State
  |
Interpolation
  |
Rendering
```

Remote player positions can be interpolated to provide smoother visual movement between server updates.

---

## Latency Monitoring

The application provides a real-time latency indicator.

The client sends:

```json
{
  "type": "PING",
  "clientTime": 12485.2
}
```

The server responds with:

```json
{
  "type": "PONG",
  "clientTime": 12485.2,
  "timestamp": 1791468500120
}
```

The client calculates the approximate round-trip latency and displays the result in milliseconds.

---

## Database

MySQL is used for persistent application data.

Typical persistent information includes:

```text
User
Match
MatchParticipant
PlayerStatistics
Achievement
PlayerAchievement
```

Rapidly changing gameplay state is maintained in server memory rather than continuously writing game-frame information to the database.

---

## Achievements

The application includes career achievements such as:

- First Blood
- Apex Champion
- Sharpshooter
- Iron Titan
- Cyber Hoarder
- Hazard Engineer

Achievement notifications are displayed in the client interface and can trigger procedural audio effects.

---

## Testing

Automated verification scripts are located under:

```text
scratch/
```

Current test areas include:

| Test | Purpose |
|---|---|
| test_phase8_combat.js | Projectile and damage validation |
| test_phase10_obstacles.js | Bunker collision and line-of-sight |
| test_phase11_powerups.js | Power-up behavior |
| test_phase12_storm.js | Safe-zone and storm behavior |
| test_phase13_audio.js | Procedural audio |
| test_phase14_chat.js | Chat broadcasting |
| test_phase15_spectator.js | Spectator functionality |
| test_phase16_classes.js | Warrior classes |
| test_phase17_hazards.js | Arena hazards |
| test_phase18_emotes.js | Tactical emotes |
| test_phase19_recap.js | Killcam and match recap |
| test_phase20_master_100.js | End-to-end integration |

Example:

```bash
node scratch/test_phase8_combat.js
```

---

## Requirements

Before running the application, install:

- Java 21
- Maven 3.9+
- MySQL 8+
- Node.js
- Modern web browser

Verify the installations:

```bash
java -version
mvn -version
node --version
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MANOJHEGDE77/BattleArena.git
cd BattleArena
```

### 2. Create the Database

Open MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS battle_arena;
```

### 3. Configure Database Credentials

Update:

```text
src/main/resources/application.properties
```

Example:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/battle_arena
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

Do not commit production credentials or secrets to the repository.

### 4. Build the Application

```bash
mvn clean compile
```

### 5. Start the Application

```bash
mvn spring-boot:run
```

The application will be available at:

```text
http://localhost:8080
```

### 6. Start a Match

1. Open the application.
2. Create an account.
3. Login.
4. Create or join a room.
5. Select a warrior class.
6. Ready up.
7. Start the match.

For local multiplayer testing, open the application in multiple browser windows. Alternatively, spawn autonomous AI Combat Bots to practice solo!

### 7. Run with Docker Compose (1-Click Full Stack Deployment)

```bash
docker compose up --build
```

This automatically starts a health-checked MySQL 8.0 container, builds the lightweight multi-stage Alpine container, and serves the game at:

```text
http://localhost:8080
```

### 8. Cloud PaaS Deployment (Render / Railway / Fly.io / Heroku)

- **Render**: Connect repository and deploy via the included `render.yaml` Blueprint or as a Web Service. Health check path: `/api/health`.
- **Railway**: Connect repository; Railway automatically recognizes the `Dockerfile` and deploys with liveness probing.
- **Heroku / Dokku**: Uses the included `Procfile` configured with container memory optimization flags (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`).
- **Dynamic Port**: Dynamic cloud port binding via `${PORT}` is automatically handled.

---

## Project Structure

```text
cyber-battle-arena/
|
+-- src/
|   +-- main/
|   |   +-- java/
|   |   |   +-- ...
|   |   |
|   |   +-- resources/
|   |       +-- static/
|   |       |   +-- index.html
|   |       |   +-- css/
|   |       |   +-- js/
|   |       |
|   |       +-- application.properties
|   |
|   +-- test/
|
+-- scratch/
|   +-- test_phase8_combat.js
|   +-- test_phase10_obstacles.js
|   +-- ...
|   +-- test_phase20_master_100.js
|
+-- pom.xml
+-- README.md
```

The exact structure may change as the project evolves.

---

## Engineering Concepts

This project demonstrates practical implementation of:

- Object-oriented programming
- Spring Boot application development
- REST APIs
- WebSocket communication
- Real-time state synchronization
- Server-authoritative architecture
- Collision detection
- Projectile simulation
- Vector mathematics
- Game loops
- JWT authentication
- BCrypt password hashing
- Spring Security
- JPA and Hibernate
- MySQL persistence
- Concurrent multiplayer state
- Client-side interpolation
- Latency measurement
- Procedural Canvas rendering
- Procedural Web Audio
- Automated integration testing

---

## Future Improvements

Potential future improvements include:

- Matchmaking
- Ranked matches
- Additional maps
- Additional weapons
- Player statistics dashboard
- Reconnection support
- Network prediction
- Replay storage
- Docker deployment
- Distributed game servers
- Redis-based shared state
- Kubernetes deployment

---

## License

This project is intended as an educational and engineering demonstration.

Add the appropriate license for your repository.

---

## Author

Manoj M Hegde

Computer Science and Data Science  
Vivekananda College of Engineering and Technology
