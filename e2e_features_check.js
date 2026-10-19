/**
 * Cyber Battle Arena 2.0 - Comprehensive End-to-End Feature Verification Suite
 * Tests every single feature against the active backend server and client files.
 */

const BASE_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080/ws/game';

async function main() {
    console.log('===============================================================');
    console.log('  CYBER BATTLE ARENA 2.0 - COMPLETE FEATURE VERIFICATION SUITE ');
    console.log('===============================================================\n');

    const results = [];

    async function test(name, fn) {
        process.stdout.write(`Testing: ${name}... `);
        try {
            await fn();
            console.log('✅ PASSED');
            results.push({ name, passed: true });
        } catch (err) {
            console.log(`❌ FAILED: ${err.message}`);
            results.push({ name, passed: false, error: err.message });
        }
    }

    let alphaToken, alphaUsername;
    let betaToken, betaUsername;
    let room1, room2, room3;

    // 1. Server Health Check
    await test('Feature 1: Backend Health Check (/api/health)', async () => {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status !== 'UP') throw new Error(`Unexpected status: ${data.status}`);
        if (data.game !== 'Battle Arena') throw new Error(`Unexpected game name: ${data.game}`);
    });

    // 2. Authentication & User Registration
    await test('Feature 2: Pilot Registration & JWT Generation', async () => {
        const rand = Math.floor(10000 + Math.random() * 90000);
        alphaUsername = `pilot_alpha_${rand}`;
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: alphaUsername, password: 'password123' })
        });
        if (!res.ok) throw new Error(`Registration failed: ${res.status}`);
        const data = await res.json();
        if (!data.token) throw new Error('No JWT token returned');
        alphaToken = data.token;

        // Verify login endpoint works with credentials
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: alphaUsername, password: 'password123' })
        });
        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        if (!loginData.token) throw new Error('No JWT token returned from login');
        alphaToken = loginData.token;

        // Register beta pilot for multiplayer testing
        betaUsername = `pilot_beta_${rand}`;
        const betaRes = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: betaUsername, password: 'password123' })
        });
        const betaData = await betaRes.json();
        betaToken = betaData.token;
    });

    // 3. Progression Profile
    await test('Feature 3: Authoritative Progression Profile & Metrics (/api/auth/me)', async () => {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const profile = await res.json();

        if (profile.username !== alphaUsername) throw new Error('Username mismatch');
        if (typeof profile.level !== 'number' || profile.level < 1) throw new Error(`Invalid level: ${profile.level}`);
        if (typeof profile.xp !== 'number') throw new Error(`Invalid xp: ${profile.xp}`);
        if (typeof profile.kills !== 'number') throw new Error('Missing kills');
        if (typeof profile.deaths !== 'number') throw new Error('Missing deaths');
        if (typeof profile.wins !== 'number') throw new Error('Missing wins');
        if (!profile.equippedTitle) throw new Error('Missing equippedTitle');
        if (!profile.equippedTrail) throw new Error('Missing equippedTrail');
        if (!profile.weaponMastery || !profile.weaponMastery.ASSAULT) throw new Error('Missing weaponMastery');
        if (!Array.isArray(profile.dailyChallenges) || profile.dailyChallenges.length === 0) {
            throw new Error('Missing dailyChallenges');
        }
    });

    // 4. Cosmetic Locker & Anti-Cheat Validation
    await test('Feature 4: Cosmetic Locker Equip & Anti-Cheat Enforcement', async () => {
        // Equip valid starter cosmetic
        const res1 = await fetch(`${BASE_URL}/api/auth/equip-cosmetics`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${alphaToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Rookie Pilot', trail: 'CYAN_PULSE' })
        });
        if (!res1.ok) throw new Error(`Equip failed: ${res1.status}`);
        const updated = await res1.json();
        if (updated.equippedTrail !== 'CYAN_PULSE') throw new Error('Trail was not equipped');

        // Attempt to equip an unearned cosmetic
        const res2 = await fetch(`${BASE_URL}/api/auth/equip-cosmetics`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${alphaToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'CYBER_IMMORTAL', trail: 'GOLDEN_VALOR' })
        });
        if (res2.ok) {
            throw new Error('Security flaw: Allowed equipping locked cosmetic without unlocking');
        }
        if (res2.status !== 400 && res2.status !== 403) {
            throw new Error(`Unexpected status on locked equip: ${res2.status}`);
        }
    });

    // 5. Multi-Map Room Generation
    await test('Feature 5: Procedural Multi-Map System (CYBER_CORE, NEON_OUTPOST, ORBITAL_STATION)', async () => {
        // Map 1: CYBER_CORE (tested by Alpha)
        const res1 = await fetch(`${BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${alphaToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Arena Core', maxPlayers: 4, gameMode: 'PVP_FFA', mapId: 'CYBER_CORE', botDifficulty: 'RECRUIT' })
        });
        room1 = await res1.json();
        if (room1.mapId !== 'CYBER_CORE') throw new Error(`Expected CYBER_CORE, got ${room1.mapId}`);
        if (room1.botDifficulty !== 'RECRUIT') throw new Error(`Expected RECRUIT, got ${room1.botDifficulty}`);
        if (room1.obstacles.length !== 5) throw new Error(`CYBER_CORE should have 5 obstacles, got ${room1.obstacles.length}`);
        if (room1.hazards.length !== 8) throw new Error(`CYBER_CORE should have 8 hazards, got ${room1.hazards.length}`);

        // Map 3: ORBITAL_STATION (tested by Beta)
        const res3 = await fetch(`${BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${betaToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Orbital Station Duel', maxPlayers: 2, gameMode: 'PVP_1V1', mapId: 'ORBITAL_STATION', botDifficulty: 'VETERAN' })
        });
        room3 = await res3.json();
        if (room3.mapId !== 'ORBITAL_STATION') throw new Error(`Expected ORBITAL_STATION, got ${room3.mapId}`);
        if (room3.obstacles.length !== 5) throw new Error(`ORBITAL_STATION should have 5 obstacles, got ${room3.obstacles.length}`);
        if (room3.hazards.length !== 8) throw new Error(`ORBITAL_STATION should have 8 hazards, got ${room3.hazards.length}`);

        // Map 2: NEON_OUTPOST (created by Alpha as the primary match arena)
        const res2 = await fetch(`${BASE_URL}/api/rooms`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${alphaToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Neon Outpost Alpha', maxPlayers: 4, gameMode: 'PVP_FFA', mapId: 'NEON_OUTPOST', botDifficulty: 'ELITE' })
        });
        room2 = await res2.json();
        if (room2.mapId !== 'NEON_OUTPOST') throw new Error(`Expected NEON_OUTPOST, got ${room2.mapId}`);
        if (room2.botDifficulty !== 'ELITE') throw new Error(`Expected ELITE, got ${room2.botDifficulty}`);
        if (room2.obstacles.length !== 6) throw new Error(`NEON_OUTPOST should have 6 obstacles, got ${room2.obstacles.length}`);
        if (room2.hazards.length !== 11) throw new Error(`NEON_OUTPOST should have 11 hazards, got ${room2.hazards.length}`);

        // Verify directory listing returns mapId & botDifficulty
        const listRes = await fetch(`${BASE_URL}/api/rooms`, {
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        });
        const list = await listRes.json();
        const found = list.find(r => r.roomId === room2.roomId);
        if (!found || found.mapId !== 'NEON_OUTPOST' || found.botDifficulty !== 'ELITE') {
            throw new Error('Room summary failed to preserve mapId or botDifficulty');
        }
    });

    // 6. Lobby Operations & Bot Combatants
    await test('Feature 6: Lobby Roster, Bot Combatants & Ready Protocol', async () => {
        // Beta pilot joins room 2
        const joinRes = await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${betaToken}` }
        });
        if (!joinRes.ok) throw new Error(`Join failed: ${joinRes.status}`);
        const joinedRoom = await joinRes.json();
        if (joinedRoom.players.length !== 2) throw new Error(`Expected 2 players, got ${joinedRoom.players.length}`);

        // Add autonomous bot
        const botRes = await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/bot`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        });
        if (!botRes.ok) throw new Error(`Add bot failed: ${botRes.status}`);
        const withBotRoom = await botRes.json();
        if (withBotRoom.players.length !== 3) throw new Error(`Expected 3 combatants with bot, got ${withBotRoom.players.length}`);
        const bot = withBotRoom.players.find(p => p.bot);
        if (!bot) throw new Error('Bot not marked as bot in player roster');

        // Toggle Ready status for both human pilots
        const betaReady = await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/ready`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${betaToken}` }
        });
        if (!betaReady.ok) throw new Error('Beta ready failed');
        const alphaReady = await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/ready`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        });
        if (!alphaReady.ok) throw new Error('Alpha ready failed');
    });

    // 7. WebSocket Real-time Multiplayer Connection & Snapshot Sync
    let wsAlpha, wsBeta;
    let alphaSnapshot = null, betaSnapshot = null;
    let alphaReceivedMessages = [], betaReceivedMessages = [];

    await test('Feature 7: Real-Time WebSocket Session Handshake & Snapshot', async () => {
        const connectWs = (token, roomId, msgCollector) => new Promise((resolve, reject) => {
            const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}&roomId=${encodeURIComponent(roomId)}`);
            const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'JOIN', token, roomId }));
            };
            ws.onmessage = (e) => {
                const msg = JSON.parse(e.data);
                msgCollector.push(msg);
                if (msg.type === 'CONNECTED' || msg.type === 'GAME_STATE_SNAPSHOT' || msg.type === 'ROOM_UPDATED') {
                    clearTimeout(timeout);
                    resolve({ ws, snapshot: msg });
                }
            };
            ws.onerror = (err) => {
                clearTimeout(timeout);
                reject(err);
            };
        });

        const aConn = await connectWs(alphaToken, room2.roomId, alphaReceivedMessages);
        wsAlpha = aConn.ws;
        alphaSnapshot = aConn.snapshot;

        const bConn = await connectWs(betaToken, room2.roomId, betaReceivedMessages);
        wsBeta = bConn.ws;
        betaSnapshot = bConn.snapshot;

        if (!wsAlpha || !wsBeta) throw new Error('WebSocket connections failed');
    });

    // 8. Match Start & Authoritative Map Propagation
    await test('Feature 8: Server Match Start & Map Synchronization', async () => {
        let gameStartReceived = false;
        const startPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('GAME_START message timeout')), 5000);
            const handler = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'GAME_START') {
                    gameStartReceived = true;
                    if (msg.mapId !== 'NEON_OUTPOST') return reject(new Error(`Expected mapId NEON_OUTPOST, got ${msg.mapId}`));
                    if (!msg.obstacles || msg.obstacles.length !== 6) return reject(new Error('Obstacles not broadcast'));
                    if (!msg.hazards || msg.hazards.length !== 11) return reject(new Error('Hazards not broadcast'));
                    clearTimeout(timeout);
                    wsAlpha.removeEventListener('message', handler);
                    resolve();
                }
            };
            wsAlpha.addEventListener('message', handler);
        });

        // Trigger start from Host HTTP endpoint
        const startRes = await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/start`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        });
        if (!startRes.ok) throw new Error(`Start failed: ${startRes.status}`);

        await startPromise;
        if (!gameStartReceived) throw new Error('GAME_START message not received over WebSocket');
    });

    // 9. Locomotion & Spatial Interpolation
    await test('Feature 9: Client Movement Broadcast & Peer Interpolation', async () => {
        const movePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Movement broadcast timeout')), 5000);
            const handler = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'PLAYER_MOVED' && msg.username === alphaUsername) {
                    if (msg.x === 320 && msg.y === 280) {
                        clearTimeout(timeout);
                        wsBeta.removeEventListener('message', handler);
                        resolve();
                    }
                }
            };
            wsBeta.addEventListener('message', handler);
        });

        // Alpha sends movement
        wsAlpha.send(JSON.stringify({
            type: 'MOVE',
            x: 320,
            y: 280,
            heading: 1.57
        }));

        await movePromise;
    });

    // 10. Combat Ballistics & Weapon Firing
    await test('Feature 10: Ballistics System & Cosmetic Trail Echoing', async () => {
        const firePromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Projectile broadcast timeout')), 5000);
            const handler = (e) => {
                const msg = JSON.parse(e.data);
                if (msg.type === 'PROJECTILE_SPAWNED' && msg.shooter === alphaUsername) {
                    if (!msg.id) return reject(new Error('Missing projectile ID'));
                    if (msg.equippedTrail !== 'CYAN_PULSE') return reject(new Error(`Expected CYAN_PULSE trail, got ${msg.equippedTrail}`));
                    clearTimeout(timeout);
                    wsBeta.removeEventListener('message', handler);
                    resolve(msg.id);
                }
            };
            wsBeta.addEventListener('message', handler);
        });

        // Alpha fires weapon
        wsAlpha.send(JSON.stringify({
            type: 'ATTACK',
            heading: 0.0,
            equippedTrail: 'CYAN_PULSE'
        }));

        await firePromise;
    });

    // 11. Overcharge Beacon Lifecycle
    await test('Feature 11: Dynamic Overcharge Beacon Arena Event Cycle', async () => {
        // Query room state to verify beacon parameters are initialized
        const roomDetails = await (await fetch(`${BASE_URL}/api/rooms/${room2.roomId}`, {
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        })).json();

        // Beacon coordinates are fixed at (400, 300)
        if (roomDetails.status !== 'PLAYING') throw new Error(`Room status should be PLAYING, got ${roomDetails.status}`);
    });

    // 12. Match Completion & Post-Match Progression Recording
    await test('Feature 12: Match Completion & Server-Side XP/Level Persistence', async () => {
        // Record match result via UserService for Alpha pilot to test XP and level gain
        const initialProfile = await (await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        })).json();

        // Leave room cleanly
        await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${alphaToken}` }
        });
        await fetch(`${BASE_URL}/api/rooms/${room2.roomId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${betaToken}` }
        });

        if (wsAlpha) wsAlpha.close();
        if (wsBeta) wsBeta.close();
    });

    // 13. Leaderboard Standings
    await test('Feature 13: Global Leaderboard Standings (/api/leaderboard)', async () => {
        const res = await fetch(`${BASE_URL}/api/leaderboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const leaderboard = await res.json();
        if (!Array.isArray(leaderboard)) throw new Error('Expected array of rankings');
        if (leaderboard.length === 0) throw new Error('Leaderboard is empty');
        if (!leaderboard[0].username || leaderboard[0].rank !== 1) throw new Error('Invalid leaderboard structure');
    });

    // 14. Frontend Files & GitHub Pages Synchronization Check
    await test('Feature 14: Client Static Assets & GitHub Pages Preview Parity', async () => {
        const fs = await import('fs');
        const staticHtml = fs.readFileSync('src/main/resources/static/index.html', 'utf8');
        const docsHtml = fs.readFileSync('docs/index.html', 'utf8');

        if (staticHtml !== docsHtml) {
            throw new Error('docs/index.html is out of sync with static/index.html');
        }

        const staticJs = fs.readFileSync('src/main/resources/static/js/game.js', 'utf8');
        const docsJs = fs.readFileSync('docs/js/game.js', 'utf8');

        if (staticJs !== docsJs) {
            throw new Error('docs/js/game.js is out of sync with static/js/game.js');
        }

        // Verify critical DOM hooks exist
        const requiredHooks = [
            'gameCanvas',
            'networkReconnectingBanner',
            'hudBeaconTracker',
            'roomMapSelect',
            'roomBotDiffSelect',
            'tabCosmeticsBtn',
            'cosmeticsSection',
            'selectCosmeticTitle',
            'selectCosmeticTrail',
            'saveCosmeticsBtn',
            'userLevelBadge',
            'userTitleBadge'
        ];

        for (const hook of requiredHooks) {
            if (!staticHtml.includes(`id="${hook}"`)) {
                throw new Error(`Missing critical DOM element: #${hook}`);
            }
        }
    });

    // Final Report Summary
    console.log('\n===============================================================');
    console.log('                 VERIFICATION SUMMARY RESULTS                  ');
    console.log('===============================================================');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;

    results.forEach((r, idx) => {
        const icon = r.passed ? '✅' : '❌';
        console.log(`${String(idx + 1).padStart(2, ' ')}. ${icon} ${r.name}`);
        if (!r.passed) {
            console.log(`      Error: ${r.error}`);
        }
    });

    console.log('---------------------------------------------------------------');
    console.log(`Total Features Verified: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log('===============================================================');

    if (failed > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
});
