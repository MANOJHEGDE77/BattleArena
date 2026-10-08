package com.battlearena.model;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory Game Room managing multiplayer lobby membership and match lifecycle.
 *
 * Layer: Domain / Model (In-Memory Game State)
 * Responsibility: Enforces room capacity, host succession, readiness rules,
 * and thread-safe player list modifications.
 *
 * Concurrency Design:
 * Uses synchronized critical sections for player membership mutations (join, leave, host migration)
 * to ensure atomicity under concurrent HTTP/WebSocket requests without race conditions.
 */
public class Room {

    public static final int MAX_CHAT_HISTORY = 50;
    public static final int MAX_CHAT_LENGTH = 120;
    public static final long CHAT_RATE_LIMIT_MS = 500;

    private final String roomId;
    private final String name;
    private volatile String hostUsername;
    private final int maxPlayers;
    private volatile RoomStatus status;
    private final Instant createdAt;

    private final List<ChatMessage> chatHistory = new CopyOnWriteArrayList<>();
    private final ConcurrentMap<String, Long> lastChatTimes = new ConcurrentHashMap<>();

    private final ConcurrentMap<String, PlayerRoomState> players = new ConcurrentHashMap<>();

    public Room(String roomId, String name, String hostUsername, int maxPlayers) {
        this.roomId = roomId;
        this.name = name;
        this.hostUsername = hostUsername;
        this.maxPlayers = maxPlayers;
        this.status = RoomStatus.WAITING;
        this.createdAt = Instant.now();

        // Host is automatically added as first player with host privileges
        this.players.put(hostUsername, new PlayerRoomState(hostUsername, true));
    }

    public String getRoomId() {
        return roomId;
    }

    public String getName() {
        return name;
    }

    public String getHostUsername() {
        return hostUsername;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public RoomStatus getStatus() {
        return status;
    }

    public void setStatus(RoomStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Collection<PlayerRoomState> getPlayers() {
        return Collections.unmodifiableCollection(players.values());
    }

    public int getPlayerCount() {
        return players.size();
    }

    public boolean hasPlayer(String username) {
        return players.containsKey(username);
    }

    /**
     * Atomically adds a player to the room.
     * Returns true if joined, false if room is full or not in WAITING state.
     */
    public synchronized boolean addPlayer(String username) {
        return addPlayer(username, false);
    }

    public synchronized boolean addPlayer(String username, boolean asSpectator) {
        if (players.containsKey(username)) {
            return true;
        }
        if (asSpectator) {
            if (status == RoomStatus.FINISHED) {
                return false;
            }
            players.put(username, new PlayerRoomState(username, false, true));
            return true;
        }

        if (status != RoomStatus.WAITING) {
            return false;
        }
        long combatants = players.values().stream().filter(p -> !p.isSpectator()).count();
        if (combatants >= maxPlayers) {
            return false;
        }

        players.put(username, new PlayerRoomState(username, false, false));
        return true;
    }

    public int getCombatantCount() {
        return (int) players.values().stream().filter(p -> !p.isSpectator()).count();
    }

    public int getSpectatorCount() {
        return (int) players.values().stream().filter(PlayerRoomState::isSpectator).count();
    }

    public boolean isSpectator(String username) {
        PlayerRoomState state = players.get(username);
        return state != null && state.isSpectator();
    }

    /**
     * Atomically removes a player. If the host leaves, assigns host to the next player.
     * Returns true if the room is now empty and should be cleaned up.
     */
    public synchronized boolean removePlayer(String username) {
        players.remove(username);
        gamePlayers.remove(username);

        if (players.isEmpty()) {
            return true;
        }

        if (username.equals(hostUsername)) {
            // Elect next available player as host
            String nextHost = players.keySet().iterator().next();
            this.hostUsername = nextHost;
            PlayerRoomState newHostState = players.get(nextHost);
            if (newHostState != null) {
                newHostState.setHost(true);
                newHostState.setReady(true);
            }
        }

        return false;
    }

    /**
     * Toggles a player's ready flag (host is always considered ready).
     */
    public synchronized boolean toggleReady(String username) {
        PlayerRoomState state = players.get(username);
        if (state == null) {
            return false;
        }
        if (!state.isHost()) {
            state.setReady(!state.isReady());
        }
        return state.isReady();
    }

    private static final String[] PALETTE = {
            "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6", "#14b8a6", "#f97316"
    };

    private static final double[][] SPAWN_POINTS = {
            {150.0, 150.0}, {650.0, 450.0}, {650.0, 150.0}, {150.0, 450.0},
            {400.0, 150.0}, {400.0, 450.0}, {150.0, 300.0}, {650.0, 300.0}
    };

    private final ConcurrentMap<String, GamePlayer> gamePlayers = new ConcurrentHashMap<>();

    /**
     * Validates if the game can start:
     * 1. Must be invoked by room host
     * 2. Room must be in WAITING state
     * 3. At least 1 player present
     * 4. All non-host players must be marked ready
     */
    public synchronized boolean canStart(String requestingUser) {
        if (!requestingUser.equals(hostUsername)) {
            return false;
        }
        if (status != RoomStatus.WAITING) {
            return false;
        }
        if (players.isEmpty()) {
            return false;
        }
        return players.values().stream()
                .filter(p -> !p.isSpectator())
                .allMatch(PlayerRoomState::isReady);
    }

    private final ConcurrentMap<String, Coin> coins = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Projectile> projectiles = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, PowerUp> powerUps = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private static final int TARGET_COIN_COUNT = 6;
    private static final int TARGET_POWERUP_COUNT = 2;
    private static final int WINNING_SCORE = 100;
    public static final int KILL_SCORE_BONUS = 15;
    public static final long ATTACK_COOLDOWN_MS = 350L;
    public static final int MATCH_DURATION_SECONDS = 120;
    private final SafeZone safeZone = new SafeZone();
    private volatile String winnerUsername = null;
    private volatile Instant matchStartedAt = null;

    private static final List<Obstacle> ARENA_OBSTACLES = List.of(
            // Central Tech Bunker / Core Fortress
            new Obstacle("OBS-CENTER", 360.0, 260.0, 80.0, 80.0, "BUNKER"),
            // Flank cover barriers (horizontal / vertical tactical shields)
            new Obstacle("OBS-TL", 240.0, 110.0, 30.0, 100.0, "BARRIER"),
            new Obstacle("OBS-TR", 530.0, 110.0, 30.0, 100.0, "BARRIER"),
            new Obstacle("OBS-BL", 240.0, 390.0, 30.0, 100.0, "BARRIER"),
            new Obstacle("OBS-BR", 530.0, 390.0, 30.0, 100.0, "BARRIER")
    );

    public SafeZone getSafeZone() {
        return safeZone;
    }

    public long getElapsedSeconds() {
        if (matchStartedAt == null) return 0L;
        return java.time.Duration.between(matchStartedAt, Instant.now()).getSeconds();
    }

    public long getTimeRemainingSeconds() {
        long elapsed = getElapsedSeconds();
        return Math.max(0, MATCH_DURATION_SECONDS - elapsed);
    }

    public double getCurrentSafeZoneRadius() {
        return safeZone.calculateRadius(getElapsedSeconds());
    }

    public boolean isSuddenDeathActive() {
        return getElapsedSeconds() >= safeZone.getShrinkStartDelaySec();
    }

    public record ZoneDamageEvent(
            String username,
            int damage,
            int currentHealth,
            int currentShield,
            boolean eliminated
    ) {}

    public synchronized List<ZoneDamageEvent> tickZoneDamage() {
        if (status != RoomStatus.PLAYING) return Collections.emptyList();
        double currentRadius = getCurrentSafeZoneRadius();
        List<ZoneDamageEvent> events = new ArrayList<>();
        for (GamePlayer p : gamePlayers.values()) {
            if (p.isAlive() && safeZone.isOutside(p.getX(), p.getY(), currentRadius)) {
                DamageResult dmg = p.takeDamageWithShield(5);
                events.add(new ZoneDamageEvent(p.getUsername(), 5, p.getHealth(), p.getShield(), dmg.eliminated()));
            }
        }
        return events;
    }

    public synchronized boolean checkMatchTimerExpired() {
        if (status != RoomStatus.PLAYING) return false;
        if (getTimeRemainingSeconds() <= 0) {
            GamePlayer highest = gamePlayers.values().stream()
                    .max(Comparator.comparingInt(GamePlayer::getScore))
                    .orElse(null);
            this.winnerUsername = (highest != null) ? highest.getUsername() : hostUsername;
            this.status = RoomStatus.FINISHED;
            return true;
        }
        return false;
    }

    public synchronized ChatMessage addChatMessage(String username, String rawText, boolean isSystem) {
        if (rawText == null) return null;
        String trimmed = rawText.trim();
        if (trimmed.isEmpty()) return null;

        if (!isSystem) {
            long now = System.currentTimeMillis();
            Long last = lastChatTimes.get(username);
            if (last != null && (now - last) < CHAT_RATE_LIMIT_MS) {
                return null; // Rate limited (anti-spam)
            }
            lastChatTimes.put(username, now);
        }

        // Enforce max character limit
        if (trimmed.length() > MAX_CHAT_LENGTH) {
            trimmed = trimmed.substring(0, MAX_CHAT_LENGTH);
        }
        // HTML sanitize
        String sanitized = trimmed
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");

        String id = "chat_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
        ChatMessage msg = new ChatMessage(id, isSystem ? "SYSTEM" : username, sanitized, System.currentTimeMillis(), isSystem);
        chatHistory.add(msg);
        if (chatHistory.size() > MAX_CHAT_HISTORY) {
            chatHistory.remove(0);
        }
        return msg;
    }

    public List<ChatMessage> getChatHistory() {
        return Collections.unmodifiableList(chatHistory);
    }

    public List<Obstacle> getObstacles() {
        return ARENA_OBSTACLES;
    }

    public boolean isPositionInsideAnyObstacle(double x, double y, double radius) {
        for (Obstacle obs : ARENA_OBSTACLES) {
            if (obs.intersectsCircle(x, y, radius)) {
                return true;
            }
        }
        return false;
    }

    public Obstacle checkProjectileObstacleCollision(String projectileId) {
        Projectile proj = projectiles.get(projectileId);
        if (proj == null) {
            return null;
        }
        long now = System.currentTimeMillis();
        double px = proj.getCurrentX(now);
        double py = proj.getCurrentY(now);
        for (Obstacle obs : ARENA_OBSTACLES) {
            if (obs.intersectsSegment(proj.getStartX(), proj.getStartY(), px, py) ||
                    obs.intersectsCircle(px, py, proj.getRadius())) {
                projectiles.remove(projectileId);
                return obs;
            }
        }
        return null;
    }

    /**
     * Hit resolution payload carrying authoritative combat outcome.
     */
    public static class HitResult {
        private final boolean valid;
        private final Projectile projectile;
        private final GamePlayer target;
        private final GamePlayer shooter;
        private final int damage;
        private final int shieldDamage;
        private final int healthDamage;
        private final boolean eliminated;
        private final boolean matchFinished;
        private final double[] respawnCoords;
        private final boolean blockedByCover;

        public HitResult(boolean valid, Projectile projectile, GamePlayer target, GamePlayer shooter,
                         int damage, boolean eliminated, boolean matchFinished, double[] respawnCoords) {
            this(valid, projectile, target, shooter, damage, 0, damage, eliminated, matchFinished, respawnCoords, false);
        }

        public HitResult(boolean valid, Projectile projectile, GamePlayer target, GamePlayer shooter,
                         int damage, boolean eliminated, boolean matchFinished, double[] respawnCoords,
                         boolean blockedByCover) {
            this(valid, projectile, target, shooter, damage, 0, damage, eliminated, matchFinished, respawnCoords, blockedByCover);
        }

        public HitResult(boolean valid, Projectile projectile, GamePlayer target, GamePlayer shooter,
                         int damage, int shieldDamage, int healthDamage, boolean eliminated,
                         boolean matchFinished, double[] respawnCoords, boolean blockedByCover) {
            this.valid = valid;
            this.projectile = projectile;
            this.target = target;
            this.shooter = shooter;
            this.damage = damage;
            this.shieldDamage = shieldDamage;
            this.healthDamage = healthDamage;
            this.eliminated = eliminated;
            this.matchFinished = matchFinished;
            this.respawnCoords = respawnCoords;
            this.blockedByCover = blockedByCover;
        }

        public boolean isValid() { return valid; }
        public Projectile getProjectile() { return projectile; }
        public GamePlayer getTarget() { return target; }
        public GamePlayer getShooter() { return shooter; }
        public int getDamage() { return damage; }
        public int getShieldDamage() { return shieldDamage; }
        public int getHealthDamage() { return healthDamage; }
        public boolean isEliminated() { return eliminated; }
        public boolean isMatchFinished() { return matchFinished; }
        public double[] getRespawnCoords() { return respawnCoords; }
        public boolean isBlockedByCover() { return blockedByCover; }
    }

    /**
     * Transitions room status to PLAYING, initializes real-time players, and spawns initial coins.
     */
    public synchronized void start() {
        this.status = RoomStatus.PLAYING;
        this.winnerUsername = null;
        this.matchStartedAt = Instant.now();
        this.gamePlayers.clear();
        this.coins.clear();
        this.projectiles.clear();
        this.powerUps.clear();

        int index = 0;
        for (Map.Entry<String, PlayerRoomState> entry : players.entrySet()) {
            if (!entry.getValue().isSpectator()) {
                double[] spawn = SPAWN_POINTS[index % SPAWN_POINTS.length];
                String color = PALETTE[index % PALETTE.length];
                gamePlayers.put(entry.getKey(), new GamePlayer(entry.getKey(), spawn[0], spawn[1], color));
                index++;
            }
        }

        spawnInitialCoins();
        spawnInitialPowerUps();
    }

    public synchronized List<Coin> spawnInitialCoins() {
        List<Coin> newCoins = new ArrayList<>();
        for (int i = 0; i < TARGET_COIN_COUNT; i++) {
            newCoins.add(generateRandomCoin());
        }
        return newCoins;
    }

    public synchronized Coin spawnSingleCoin() {
        if (status != RoomStatus.PLAYING) {
            return null;
        }
        if (coins.size() < TARGET_COIN_COUNT) {
            return generateRandomCoin();
        }
        return null;
    }

    private Coin generateRandomCoin() {
        String coinId = "COIN-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        double x, y;
        int attempts = 0;
        do {
            x = 60 + random.nextDouble() * (800 - 120);
            y = 60 + random.nextDouble() * (600 - 120);
            attempts++;
        } while (isPositionInsideAnyObstacle(x, y, 16.0) && attempts < 20);

        // 20% chance of high-value bonus gold coin
        int value = (random.nextInt(5) == 0) ? 25 : 10;
        Coin coin = new Coin(coinId, x, y, value);
        coins.put(coinId, coin);
        return coin;
    }

    /**
     * Server-Authoritative radial collision detection for coin pickup.
     * Validates distance: (dx^2 + dy^2) <= (r1 + r2 + tolerance)^2.
     */
    public synchronized Coin collectCoin(String username, String coinId) {
        if (status != RoomStatus.PLAYING) {
            return null;
        }

        GamePlayer player = gamePlayers.get(username);
        Coin coin = coins.get(coinId);

        if (player == null || coin == null) {
            return null;
        }

        double dx = player.getX() - coin.getX();
        double dy = player.getY() - coin.getY();
        double distanceSquared = dx * dx + dy * dy;

        // Radius sum with 8px network latency tolerance
        double maxDist = player.getRadius() + coin.getRadius() + 8.0;

        if (distanceSquared <= maxDist * maxDist) {
            Coin collected = coins.remove(coinId);
            if (collected != null) {
                player.addScore(collected.getValue());

                // Check victory condition
                if (player.getScore() >= WINNING_SCORE && winnerUsername == null) {
                    winnerUsername = username;
                    status = RoomStatus.FINISHED;
                }
                return collected;
            }
        }
        return null;
    }

    public Collection<GamePlayer> getGamePlayers() {
        return Collections.unmodifiableCollection(gamePlayers.values());
    }

    public GamePlayer getGamePlayer(String username) {
        return gamePlayers.get(username);
    }

    public Collection<Coin> getCoins() {
        return Collections.unmodifiableCollection(coins.values());
    }

    public Collection<PowerUp> getPowerUps() {
        return Collections.unmodifiableCollection(powerUps.values());
    }

    public synchronized List<PowerUp> spawnInitialPowerUps() {
        List<PowerUp> list = new ArrayList<>();
        for (int i = 0; i < TARGET_POWERUP_COUNT; i++) {
            PowerUp pu = generateRandomPowerUp();
            if (pu != null) {
                list.add(pu);
            }
        }
        return list;
    }

    public synchronized PowerUp spawnSinglePowerUp() {
        if (status != RoomStatus.PLAYING) {
            return null;
        }
        if (powerUps.size() < TARGET_POWERUP_COUNT) {
            return generateRandomPowerUp();
        }
        return null;
    }

    private PowerUp generateRandomPowerUp() {
        String id = "PU-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        PowerUpType[] types = PowerUpType.values();
        PowerUpType type = types[random.nextInt(types.length)];
        double x, y;
        int attempts = 0;
        do {
            x = 80 + random.nextDouble() * (800 - 160);
            y = 80 + random.nextDouble() * (600 - 160);
            attempts++;
        } while (isPositionInsideAnyObstacle(x, y, 20.0) && attempts < 25);

        PowerUp pu = new PowerUp(id, type, x, y);
        powerUps.put(id, pu);
        return pu;
    }

    /**
     * Server-authoritative radial collision check for picking up tactical power-ups.
     */
    public synchronized PowerUp collectPowerUp(String username, String powerUpId) {
        if (status != RoomStatus.PLAYING) {
            return null;
        }
        GamePlayer player = gamePlayers.get(username);
        PowerUp pu = powerUps.get(powerUpId);
        if (player == null || !player.isAlive() || pu == null) {
            return null;
        }

        double dx = player.getX() - pu.getX();
        double dy = player.getY() - pu.getY();
        double distanceSquared = dx * dx + dy * dy;
        double maxDist = player.getRadius() + pu.getRadius() + 10.0;

        if (distanceSquared <= maxDist * maxDist) {
            PowerUp collected = powerUps.remove(powerUpId);
            if (collected != null) {
                player.applyPowerUp(collected);
                return collected;
            }
        }
        return null;
    }

    public Collection<Projectile> getProjectiles() {
        long now = System.currentTimeMillis();
        projectiles.values().removeIf(p -> p.isExpired(now));
        return Collections.unmodifiableCollection(projectiles.values());
    }

    /**
     * Spawns authoritative projectile(s), including spread shot volleys if buffed.
     */
    public synchronized List<Projectile> fireProjectiles(String shooterUsername, double heading) {
        if (status != RoomStatus.PLAYING) {
            return Collections.emptyList();
        }
        GamePlayer player = gamePlayers.get(shooterUsername);
        if (player == null || !player.isAlive()) {
            return Collections.emptyList();
        }

        long now = System.currentTimeMillis();
        if (!player.canAttack(now, ATTACK_COOLDOWN_MS)) {
            return Collections.emptyList();
        }

        player.recordAttack(now);
        List<Projectile> fired = new ArrayList<>();
        if (player.hasSpreadShot(now)) {
            double[] angles = new double[]{ heading - 0.22, heading, heading + 0.22 };
            for (double angle : angles) {
                String projId = "PROJ-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                Projectile projectile = new Projectile(projId, shooterUsername, player.getX(), player.getY(), angle);
                projectiles.put(projId, projectile);
                fired.add(projectile);
            }
        } else {
            String projId = "PROJ-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            Projectile projectile = new Projectile(projId, shooterUsername, player.getX(), player.getY(), heading);
            projectiles.put(projId, projectile);
            fired.add(projectile);
        }
        return fired;
    }

    /**
     * Backward-compatibility helper returning single primary projectile.
     */
    public synchronized Projectile fireProjectile(String shooterUsername, double heading) {
        List<Projectile> list = fireProjectiles(shooterUsername, heading);
        return list.isEmpty() ? null : list.get(0);
    }

    /**
     * Server-Authoritative hit verification:
     * 1. Confirms projectile exists and is within flight window.
     * 2. Confirms target player is alive and distinct from shooter.
     * 3. Calculates projectile exact coordinates at verification time.
     * 4. Enforces raycast line-of-sight obstacle checks.
     * 5. Enforces radial collision tolerance, shield absorption, damage and rewards.
     */
    public synchronized HitResult validateAndApplyHit(String projectileId, String targetUsername) {
        if (status != RoomStatus.PLAYING) {
            return new HitResult(false, null, null, null, 0, false, false, null);
        }

        Projectile proj = projectiles.get(projectileId);
        if (proj == null) {
            return new HitResult(false, null, null, null, 0, false, false, null);
        }

        long now = System.currentTimeMillis();
        if (proj.isExpired(now)) {
            projectiles.remove(projectileId);
            return new HitResult(false, null, null, null, 0, false, false, null);
        }

        // Friendly fire / suicide prevention
        if (proj.getShooterUsername().equals(targetUsername)) {
            return new HitResult(false, null, null, null, 0, false, false, null);
        }

        GamePlayer target = gamePlayers.get(targetUsername);
        GamePlayer shooter = gamePlayers.get(proj.getShooterUsername());
        if (target == null || !target.isAlive() || shooter == null) {
            return new HitResult(false, null, null, null, 0, false, false, null);
        }

        // Closed-form projectile trajectory position at timestamp 'now'
        double projX = proj.getCurrentX(now);
        double projY = proj.getCurrentY(now);

        // Arena boundary collision: remove bullet if outside field
        if (projX < 0 || projX > 800 || projY < 0 || projY > 600) {
            projectiles.remove(projectileId);
            return new HitResult(false, null, null, null, 0, false, false, null);
        }

        // 1. Raycast Cover Check: ensure direct line of sight between projectile start and target isn't blocked by obstacles
        for (Obstacle obs : ARENA_OBSTACLES) {
            if (obs.intersectsSegment(proj.getStartX(), proj.getStartY(), target.getX(), target.getY())) {
                // Blocked by cover obstacle! Consume projectile with no damage dealt.
                projectiles.remove(projectileId);
                return new HitResult(false, proj, target, shooter, 0, false, false, null, true);
            }
        }

        // 2. Radial proximity check: (target radius + proj radius + latency tolerance)^2
        double dx = projX - target.getX();
        double dy = projY - target.getY();
        double maxDist = target.getRadius() + proj.getRadius() + 24.0; // 24px network latency buffer

        if (dx * dx + dy * dy <= maxDist * maxDist) {
            projectiles.remove(projectileId);
            DamageResult dmgResult = target.takeDamageWithShield(proj.getDamage());
            boolean eliminated = dmgResult.eliminated();
            double[] respawnCoords = null;

            if (eliminated) {
                shooter.addKill();
                shooter.addScore(KILL_SCORE_BONUS);
                if (shooter.getScore() >= WINNING_SCORE && winnerUsername == null) {
                    winnerUsername = shooter.getUsername();
                    status = RoomStatus.FINISHED;
                }
                int spawnIdx = Math.abs(random.nextInt()) % SPAWN_POINTS.length;
                respawnCoords = SPAWN_POINTS[spawnIdx];
            }

            return new HitResult(true, proj, target, shooter, proj.getDamage(),
                    dmgResult.shieldDamage(), dmgResult.healthDamage(),
                    eliminated, status == RoomStatus.FINISHED, respawnCoords, false);
        }

        return new HitResult(false, null, null, null, 0, false, false, null);
    }

    /**
     * Respawns an eliminated player at designated arena coordinates.
     */
    public synchronized void respawnPlayer(String username, double x, double y) {
        GamePlayer player = gamePlayers.get(username);
        if (player != null && !player.isAlive()) {
            player.respawn(x, y);
        }
    }

    public String getWinnerUsername() {
        return winnerUsername;
    }

    public static int getWinningScore() {
        return WINNING_SCORE;
    }

    public Instant getMatchStartedAt() {
        return matchStartedAt;
    }

    public synchronized void resetForRematch() {
        this.status = RoomStatus.WAITING;
        this.winnerUsername = null;
        this.matchStartedAt = null;
        this.gamePlayers.clear();
        this.coins.clear();
        this.projectiles.clear();
        for (PlayerRoomState state : players.values()) {
            if (!state.isHost()) {
                state.setReady(false);
            }
        }
    }

    public void updatePlayerPosition(String username, double x, double y, double heading) {
        GamePlayer player = gamePlayers.get(username);
        if (player != null) {
            double[] pos = new double[]{ x, y };
            for (Obstacle obs : ARENA_OBSTACLES) {
                obs.resolveCircle(pos, player.getRadius());
            }
            player.updatePosition(pos[0], pos[1], heading);
        }
    }
}
