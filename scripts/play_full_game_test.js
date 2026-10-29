/**
 * End-to-End Real Browser Gameplay Test:
 * Plays a full match in headless Chrome via Chrome DevTools Protocol (CDP),
 * verifying zero runtime exceptions, smooth physics, combat, multi-kill combos,
 * match completion, career persistence, and social sharing.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const PORT = 4567;
const CHROME_DEBUG_PORT = 9223;
const DOCS_DIR = path.join(__dirname, '..', 'docs');

// 1. Static HTTP Server for docs/
function startServer() {
    return new Promise((resolve) => {
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.svg': 'image/svg+xml',
            '.json': 'application/json'
        };

        const server = http.createServer((req, res) => {
            let reqPath = req.url.split('?')[0];
            if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
            const filePath = path.join(DOCS_DIR, reqPath);

            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(filePath);
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
                res.end(data);
            });
        });

        server.listen(PORT, '127.0.0.1', () => {
            console.log(`[Test Server] Serving docs on http://127.0.0.1:${PORT}`);
            resolve(server);
        });
    });
}

// 2. Launch Headless Chrome
function launchChrome() {
    const tmpDir = path.join(os.tmpdir(), 'chrome_game_test_' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const args = [
        '--headless=new',
        `--remote-debugging-port=${CHROME_DEBUG_PORT}`,
        `--user-data-dir=${tmpDir}`,
        '--disable-gpu',
        '--disable-extensions',
        '--no-first-run',
        '--no-default-browser-check',
        '--mute-audio',
        `http://127.0.0.1:${PORT}/index.html`
    ];

    console.log('[Chrome] Launching headless browser...');
    const proc = spawn(chromePath, args);
    return { proc, tmpDir };
}

// 3. Helper to send CDP command
let msgId = 1;
function sendCdp(ws, method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = msgId++;
        const payload = JSON.stringify({ id, method, params });
        const handler = (event) => {
            const data = JSON.parse(event.data);
            if (data.id === id) {
                ws.removeEventListener('message', handler);
                if (data.error) reject(new Error(JSON.stringify(data.error)));
                else resolve(data.result);
            }
        };
        ws.addEventListener('message', handler);
        ws.send(payload);
    });
}

async function evaluate(ws, expression) {
    const res = await sendCdp(ws, 'Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
    });
    if (res.exceptionDetails) {
        throw new Error('JS Eval Exception: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    const server = await startServer();
    const { proc, tmpDir } = launchChrome();

    const consoleLogs = [];
    const jsErrors = [];

    try {
        // Wait for Chrome debugging endpoint to be ready
        let wsUrl = null;
        for (let i = 0; i < 30; i++) {
            await sleep(500);
            try {
                const res = await fetch(`http://localhost:${CHROME_DEBUG_PORT}/json/list`);
                if (res.ok) {
                    const list = await res.json();
                    const pageTarget = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl) || list.find(t => t.webSocketDebuggerUrl);
                    if (pageTarget) {
                        wsUrl = pageTarget.webSocketDebuggerUrl;
                        break;
                    }
                }
            } catch {}
        }

        if (!wsUrl) throw new Error('Failed to connect to Chrome debugging endpoint');
        console.log(`[CDP] Connected to Chrome DevTools WebSocket: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        await new Promise((resolve, reject) => {
            ws.onopen = resolve;
            ws.onerror = reject;
        });

        // Enable Runtime & Page domains
        await sendCdp(ws, 'Runtime.enable');
        await sendCdp(ws, 'Page.enable');

        ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === 'Runtime.consoleAPICalled') {
                const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
                consoleLogs.push(`[Browser Console ${msg.params.type}] ${text}`);
            }
            if (msg.method === 'Runtime.exceptionThrown') {
                jsErrors.push(msg.params.exceptionDetails);
                console.error('[Browser Exception]', msg.params.exceptionDetails);
            }
        });

        console.log('[Test] Navigating to http://127.0.0.1:' + PORT + '/index.html...');
        await sendCdp(ws, 'Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
        
        // Wait for page load event
        await new Promise((resolve) => {
            const loadHandler = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Page.loadEventFired') {
                    ws.removeEventListener('message', loadHandler);
                    resolve();
                }
            };
            ws.addEventListener('message', loadHandler);
            setTimeout(resolve, 3000); // Fallback timeout
        });

        console.log('[Test] Page loaded. Waiting for initialization...');
        await sleep(1500);

        const currentHref = await evaluate(ws, 'window.location.href');
        console.log(`[Test] Current page URL: "${currentHref}"`);

        // Check 1: Initial Page State
        const title = await evaluate(ws, 'document.title');
        console.log(`[Test] Document title: "${title}"`);
        if (!title.includes('CYBER BATTLE ARENA')) throw new Error('Unexpected document title');

        const isOnlineState = await evaluate(ws, 'statusText.textContent');
        console.log(`[Test] Status indicator text: "${isOnlineState}" (Expected: ARCADE on Vercel/offline)`);

        const playerName = await evaluate(ws, 'player.name');
        console.log(`[Test] Initial Pilot Name: "${playerName}"`);
        if (!playerName || playerName === 'Guest') throw new Error('Pilot profile not auto-initialized');

        // Check 2: Launch Quick Combat Match
        console.log('[Test] Clicking DEPLOY MATCH button (#giantPlayNowBtn)...');
        await evaluate(ws, `document.getElementById('giantPlayNowBtn').click()`);

        await sleep(1000);

        const inCombat = await evaluate(ws, `document.getElementById('viewCombat').style.display !== 'none'`);
        const pvpActive = await evaluate(ws, `pvpEmulator.isActive`);
        console.log(`[Test] Combat View Active: ${inCombat}, Emulator Active: ${pvpActive}`);
        if (!inCombat || !pvpActive) throw new Error('Failed to enter active combat match');

        // Check 3: Simulate Player Movement & Smooth Inertia
        console.log('[Test] Simulating tactical WASD movement...');
        await evaluate(ws, `
            activeKeys.add('d');
            activeKeys.add('w');
        `);
        await sleep(600);
        const movingPos = await evaluate(ws, `({ x: Math.round(player.x), y: Math.round(player.y), vx: Math.round(playerVx), vy: Math.round(playerVy) })`);
        console.log(`[Test] Player Position after moving: X=${movingPos.x}, Y=${movingPos.y}, Velocity: Vx=${movingPos.vx}, Vy=${movingPos.vy}`);
        if (movingPos.vx === 0 && movingPos.vy === 0) throw new Error('Smooth velocity damping not active');

        await evaluate(ws, `
            activeKeys.delete('d');
            activeKeys.delete('w');
        `);

        // Check 4: Signature Hero Ability Trigger
        console.log('[Test] Triggering Signature Class Ability (Overcharge Stim)...');
        await evaluate(ws, `triggerClassAbility()`);
        const stimActive = await evaluate(ws, `player.stimUntil > Date.now()`);
        console.log(`[Test] Ability Overcharge Active: ${stimActive}`);
        if (!stimActive) throw new Error('Hero ability failed to trigger');

        // Check 5: Simulate Combat Eliminations & Multi-Kill Banner
        console.log('[Test] Simulating combat engagements and bot eliminations...');
        await evaluate(ws, `
            (() => {
                const bList = pvpEmulator.bots;
                if (bList.length > 0) {
                    bList[0].shield = 0;
                    bList[0].hp = 10;
                    pvpEmulator.applyDamageToBot(bList[0], 25, player.name);
                }
            })()
        `);
        await sleep(400);

        let kills = await evaluate(ws, `player.kills`);
        let score = await evaluate(ws, `player.score`);
        console.log(`[Test] After Kill 1: Kills=${kills}, Score=${score}`);

        // Second kill within 2s to trigger DOUBLE KILL combo
        await evaluate(ws, `
            (() => {
                const bList = pvpEmulator.bots;
                if (bList.length > 1) {
                    bList[1].shield = 0;
                    bList[1].hp = 10;
                    pvpEmulator.applyDamageToBot(bList[1], 25, player.name);
                }
            })()
        `);
        await sleep(400);

        kills = await evaluate(ws, `player.kills`);
        const streakBannerVisible = await evaluate(ws, `document.getElementById('multiKillBanner').style.display !== 'none'`);
        const streakBannerText = await evaluate(ws, `document.getElementById('multiKillTitle').textContent`);
        console.log(`[Test] Multi-Kill Banner Visible: ${streakBannerVisible}, Title: "${streakBannerText}"`);
        if (!streakBannerVisible || !streakBannerText.includes('DOUBLE KILL')) {
            throw new Error('Multi-Kill combo banner failed to trigger on rapid kill');
        }

        // Check 6: Complete the Match (Score target kills to reach Victory)
        console.log('[Test] Advancing match to victory threshold...');
        await evaluate(ws, `
            player.kills = pvpEmulator.targetScore;
            player.score = pvpEmulator.targetScore * 10;
            pvpEmulator.checkGameOver();
        `);
        await sleep(800);

        const isOver = await evaluate(ws, `isGameOver`);
        const modalDisplay = await evaluate(ws, `document.getElementById('gameOverModal').style.display !== 'none'`);
        const goTitle = await evaluate(ws, `document.getElementById('gameOverTitle').textContent`);
        console.log(`[Test] Game Over: ${isOver}, Modal Display: ${modalDisplay}, Title: "${goTitle}"`);
        if (!isOver || !modalDisplay || !goTitle.includes('VICTORY')) {
            throw new Error('Victory screen failed to appear');
        }

        // Check 7: Verify Accolades & Social Share Buttons
        const accoladesHtml = await evaluate(ws, `document.getElementById('matchAccoladesRow').innerHTML`);
        const hasMvp = accoladesHtml.includes('mvp');
        const hasXp = accoladesHtml.includes('Combat XP');
        console.log(`[Test] Accolades Row: MVP=${hasMvp}, XP Badge=${hasXp}`);
        if (!hasMvp || !hasXp) throw new Error('Accolades missing MVP or XP badges');

        const shareRowVisible = await evaluate(ws, `
            document.getElementById('postToTwitterBtn') !== null &&
            document.getElementById('shareToRedditBtn') !== null &&
            document.getElementById('nativeShareBtn') !== null
        `);
        console.log(`[Test] Social Media Sharing Buttons Present: ${shareRowVisible}`);
        if (!shareRowVisible) throw new Error('Social share buttons missing from Game Over modal');

        // Check 8: Test Copy Match Report Action
        console.log('[Test] Triggering Copy Battle Report...');
        await evaluate(ws, `copyBattleReport()`);
        const lastSummary = await evaluate(ws, `lastMatchSummary !== null`);
        console.log(`[Test] lastMatchSummary populated: ${lastSummary}`);
        if (!lastSummary) throw new Error('lastMatchSummary not populated');

        // Check 9: Return to Menu & Verify Career Progression
        console.log('[Test] Returning to Menu & Checking Career View...');
        await evaluate(ws, `closeGameOverModal(); switchView('career');`);
        await sleep(600);

        const careerVisible = await evaluate(ws, `document.getElementById('viewCareer').style.display !== 'none'`);
        const totalWins = await evaluate(ws, `document.getElementById('profileStatWins').textContent`);
        const totalScore = await evaluate(ws, `document.getElementById('profileStatTotalScore').textContent`);
        console.log(`[Test] Career View Visible: ${careerVisible}, Total Wins: ${totalWins}, Total Score: ${totalScore}`);
        if (!careerVisible || !totalWins.includes('Victories')) {
            throw new Error('Career profile stats failed to record match');
        }

        // Check 10: Verify Leaderboard View
        console.log('[Test] Checking Leaderboard View...');
        await evaluate(ws, `switchView('leaderboard');`);
        await sleep(600);

        const lbRows = await evaluate(ws, `document.getElementById('leaderboardTbody').children.length`);
        console.log(`[Test] Leaderboard Rows rendered: ${lbRows}`);
        if (lbRows < 3) throw new Error('Leaderboard rows not rendered');

        // Check 11: Zero JS Uncaught Exceptions
        console.log(`[Test] Total JS Exceptions caught during full gameplay: ${jsErrors.length}`);
        if (jsErrors.length > 0) {
            throw new Error(`Encountered ${jsErrors.length} JavaScript runtime exceptions during play!`);
        }

        console.log('\n===============================================================');
        console.log('🎉 FULL GAMEPLAY REAL-BROWSER VERIFICATION: 100% SUCCESSFUL!');
        console.log('===============================================================');

        ws.close();
    } finally {
        proc.kill();
        server.close();
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
}

main().catch(err => {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
});
