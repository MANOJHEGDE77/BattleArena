/**
 * Battle Arena - Phase 2: Game Loop, Vector Rendering & Collision Engine
 * Low-Resource Architecture: 0 image assets, 0 external libraries, pure Canvas 2D.
 */

// --- Canvas & DOM Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudPos = document.getElementById('hudPos');
const hudFps = document.getElementById('hudFps');
const hudPlayer = document.getElementById('hudPlayer');
const hudScore = document.getElementById('hudScore');
const hudTarget = document.getElementById('hudTarget');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');

const liveScoreboard = document.getElementById('liveScoreboard');
const scoreboardList = document.getElementById('scoreboardList');
const scoreboardGoal = document.getElementById('scoreboardGoal');

const openLeaderboardBtn = document.getElementById('openLeaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardModalBtn = document.getElementById('closeLeaderboardModalBtn');
const leaderboardTbody = document.getElementById('leaderboardTbody');

const gameOverModal = document.getElementById('gameOverModal');
const gameOverTitle = document.getElementById('gameOverTitle');
const winnerAnnouncement = document.getElementById('winnerAnnouncement');
const matchSummaryScores = document.getElementById('matchSummaryScores');
const returnToLobbyBtn = document.getElementById('returnToLobbyBtn');
const viewLeaderboardFromGameOverBtn = document.getElementById('viewLeaderboardFromGameOverBtn');

// --- Phase 7 DOM Elements: Match History & Rematch ---
const openMatchHistoryBtn = document.getElementById('openMatchHistoryBtn');
const matchHistoryModal = document.getElementById('matchHistoryModal');
const closeMatchHistoryModalBtn = document.getElementById('closeMatchHistoryModalBtn');
const matchHistoryList = document.getElementById('matchHistoryList');
const profileStatUsername = document.getElementById('profileStatUsername');
const profileStatGames = document.getElementById('profileStatGames');
const profileStatTotalScore = document.getElementById('profileStatTotalScore');
const profileStatHighScore = document.getElementById('profileStatHighScore');
const matchMetaPill = document.getElementById('matchMetaPill');
const rematchBtn = document.getElementById('rematchBtn');

// --- Phase 6 State: Collectibles & Authoritative Scoring ---
const coins = new Map();
let myScore = 0;
let winningScore = 100;
let isGameOver = false;
const floatingTexts = [];

// --- Player State (Authoritative model for Phase 2 & 3) ---
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 16,
    speed: 240, // pixels per second
    heading: 0, // radians
    color: '#6366f1',
    accentColor: '#818cf8',
    name: 'Guest'
};

// --- Input Manager ---
const activeKeys = new Set();

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        activeKeys.add(key);
        // Prevent page scrolling on arrow keys
        if (key.startsWith('arrow')) {
            e.preventDefault();
        }
    }
});

window.addEventListener('keyup', (e) => {
    activeKeys.delete(e.key.toLowerCase());
});

// Clear keys if window loses focus to avoid "stuck key" glitch
window.addEventListener('blur', () => {
    activeKeys.clear();
});

// --- Physics & Collision Engine ---
function updatePhysics(dt) {
    if (isGameOver) return;

    let moveX = 0;
    let moveY = 0;

    if (activeKeys.has('w') || activeKeys.has('arrowup')) moveY -= 1;
    if (activeKeys.has('s') || activeKeys.has('arrowdown')) moveY += 1;
    if (activeKeys.has('a') || activeKeys.has('arrowleft')) moveX -= 1;
    if (activeKeys.has('d') || activeKeys.has('arrowright')) moveX += 1;

    // Normalize diagonal movement vector so diagonal speed == straight speed
    if (moveX !== 0 || moveY !== 0) {
        const length = Math.hypot(moveX, moveY);
        moveX /= length;
        moveY /= length;

        // Update player heading angle based on movement direction
        player.heading = Math.atan2(moveY, moveX);

        // Apply frame-rate independent displacement
        player.x += moveX * player.speed * dt;
        player.y += moveY * player.speed * dt;

        // Arena boundary collision detection (clamping within walls)
        const minX = player.radius + 2;
        const maxX = canvas.width - player.radius - 2;
        const minY = player.radius + 2;
        const maxY = canvas.height - player.radius - 2;

        player.x = Math.max(minX, Math.min(maxX, player.x));
        player.y = Math.max(minY, Math.min(maxY, player.y));

        broadcastPlayerMovement();

        // Proximity detection for client-side collection notification
        if (activeRoom && activeRoom.status === 'PLAYING') {
            coins.forEach((c) => {
                const dx = player.x - c.x;
                const dy = player.y - c.y;
                const maxDist = player.radius + (c.radius || 10) + 4;
                if (dx * dx + dy * dy <= maxDist * maxDist) {
                    if (gameWs && gameWs.readyState === WebSocket.OPEN) {
                        gameWs.send(JSON.stringify({ type: 'COLLECT', coinId: c.id }));
                    }
                }
            });
        }
    }

    // Update lightweight HUD
    hudPos.textContent = `X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`;
}

let lastBroadcastTime = 0;
function broadcastPlayerMovement() {
    if (!gameWs || gameWs.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    // Throttle to ~30 updates/sec to minimize bandwidth and CPU
    if (now - lastBroadcastTime < 33) return;
    lastBroadcastTime = now;

    gameWs.send(JSON.stringify({
        type: 'MOVE',
        x: Math.round(player.x * 10) / 10,
        y: Math.round(player.y * 10) / 10,
        heading: Math.round(player.heading * 100) / 100
    }));
}

// --- Vector Rendering Engine (0 Images, Pure Canvas Geometry) ---
function renderArena() {
    // 1. Clear background
    ctx.fillStyle = '#131722';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw low-overhead grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // 3. Draw arena boundary walls
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
}

// Render Collectible Coins (Pure Vector 2D)
function renderCoins() {
    const time = performance.now() * 0.005;
    coins.forEach((coin) => {
        ctx.save();
        ctx.translate(coin.x, coin.y);

        const isBonus = coin.value >= 20;
        const radius = coin.radius || 10;
        const pulse = Math.sin(time + (coin.x * 0.05)) * 1.5;

        // 1. Glowing outer aura
        ctx.beginPath();
        ctx.arc(0, 0, radius + 3 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = isBonus ? 'rgba(236, 72, 153, 0.25)' : 'rgba(251, 191, 36, 0.2)';
        ctx.fill();

        // 2. Coin rim
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = isBonus ? '#f43f5e' : '#f59e0b';
        ctx.fill();

        // 3. Coin face
        ctx.beginPath();
        ctx.arc(0, 0, radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = isBonus ? '#fb7185' : '#fbbf24';
        ctx.fill();

        // 4. Center icon / star or value
        ctx.fillStyle = '#ffffff';
        ctx.font = isBonus ? 'bold 9px Outfit, sans-serif' : 'bold 8px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isBonus ? '★' : '10', 0, 0);

        ctx.restore();
    });
}

// Floating score feedback particles
function addFloatingText(text, x, y, color = '#fbbf24') {
    floatingTexts.push({
        text,
        x,
        y,
        alpha: 1.0,
        vy: -45,
        color
    });
}

function renderFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 1.1;

        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
    }
}

// Remote Multiplayer Entities Map
const remotePlayers = new Map();

function renderRemotePlayers() {
    remotePlayers.forEach((rp, username) => {
        ctx.save();
        ctx.translate(rp.x, rp.y);

        // 1. Remote player outer accent ring
        ctx.beginPath();
        ctx.arc(0, 0, (rp.radius || 16) + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 2. Remote player body
        ctx.beginPath();
        ctx.arc(0, 0, rp.radius || 16, 0, Math.PI * 2);
        ctx.fillStyle = rp.color || '#10b981';
        ctx.fill();

        // 3. Remote player core
        ctx.beginPath();
        ctx.arc(0, 0, (rp.radius || 16) * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 4. Directional heading indicator
        const pointerDist = (rp.radius || 16) + 4;
        const pointerX = Math.cos(rp.heading || 0) * pointerDist;
        const pointerY = Math.sin(rp.heading || 0) * pointerDist;

        ctx.beginPath();
        ctx.arc(pointerX, pointerY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 5. Remote player name & score tag
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${username} (${rp.score || 0})`, 0, -(rp.radius || 16) - 8);

        ctx.restore();
    });
}

function renderPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);

    // 1. Outer accent ring
    ctx.beginPath();
    ctx.arc(0, 0, player.radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Player body
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    // 3. Inner core
    ctx.beginPath();
    ctx.arc(0, 0, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = player.accentColor;
    ctx.fill();

    // 4. Directional heading indicator (vector pointer)
    const pointerDist = player.radius + 4;
    const pointerX = Math.cos(player.heading) * pointerDist;
    const pointerY = Math.sin(player.heading) * pointerDist;

    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. Name & score tag
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.name} (${myScore})`, 0, -player.radius - 8);

    ctx.restore();
}

// --- Delta-Time Game Loop ---
let lastTime = performance.now();
let frameCount = 0;
let lastFpsUpdate = performance.now();

function gameLoop(currentTime) {
    // Calculate delta time in seconds, clamped to 0.1s to prevent collision tunneling
    let dt = (currentTime - lastTime) / 1000;
    dt = Math.min(dt, 0.1);
    lastTime = currentTime;

    // Physics update step
    updatePhysics(dt);

    // Visual render step: arena surface -> coins -> remote players -> local player -> floating text
    renderArena();
    renderCoins();
    renderRemotePlayers();
    renderPlayer();
    renderFloatingTexts(dt);

    // FPS Counter (sampled every 250ms for low CPU overhead)
    frameCount++;
    if (currentTime - lastFpsUpdate >= 250) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
        hudFps.textContent = fps;
        frameCount = 0;
        lastFpsUpdate = currentTime;
    }

    requestAnimationFrame(gameLoop);
}

// --- Backend Health Check (reused from Phase 1) ---
async function checkBackendHealth() {
    try {
        const response = await fetch('/api/health');
        if (response.ok) {
            const data = await response.json();
            statusDot.className = 'status-dot online';
            statusText.textContent = `Backend: ${data.status} (${data.game})`;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Backend: Offline';
    }
}

// --- Phase 3: Authentication & JWT State Management ---
const JWT_STORAGE_KEY = 'battle_arena_jwt';

const authModal = document.getElementById('authModal');
const openAuthModalBtn = document.getElementById('openAuthModalBtn');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');
const authForm = document.getElementById('authForm');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authAlert = document.getElementById('authAlert');

const userProfileBadge = document.getElementById('userProfileBadge');
const authButtons = document.getElementById('authButtons');
const usernameDisplay = document.getElementById('usernameDisplay');
const highScoreBadge = document.getElementById('highScoreBadge');
const logoutBtn = document.getElementById('logoutBtn');

let currentAuthMode = 'login'; // 'login' | 'register'

function showAuthAlert(message, isError = true) {
    authAlert.textContent = message;
    authAlert.className = `auth-alert ${isError ? 'error' : 'success'}`;
    authAlert.style.display = 'block';
}

function clearAuthAlert() {
    authAlert.style.display = 'none';
    authAlert.textContent = '';
}

function setAuthMode(mode) {
    currentAuthMode = mode;
    clearAuthAlert();
    if (mode === 'login') {
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
        authSubmitBtn.textContent = 'Log In';
    } else {
        tabRegisterBtn.classList.add('active');
        tabLoginBtn.classList.remove('active');
        authSubmitBtn.textContent = 'Register Account';
    }
}

function openModal() {
    clearAuthAlert();
    authForm.reset();
    authModal.style.display = 'flex';
    authUsernameInput.focus();
}

function closeModal() {
    authModal.style.display = 'none';
    clearAuthAlert();
}

function updateAuthState(user) {
    if (user && user.username) {
        authButtons.style.display = 'none';
        userProfileBadge.style.display = 'flex';
        if (openMatchHistoryBtn) openMatchHistoryBtn.style.display = 'inline-block';
        usernameDisplay.textContent = user.username;
        highScoreBadge.textContent = `Best: ${user.highestScore || 0}`;
        player.name = user.username;
        hudPlayer.textContent = user.username;
    } else {
        userProfileBadge.style.display = 'none';
        if (openMatchHistoryBtn) openMatchHistoryBtn.style.display = 'none';
        authButtons.style.display = 'block';
        player.name = 'Guest';
        hudPlayer.textContent = 'Guest';
    }
}

async function verifyExistingSession() {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    if (!token) {
        updateAuthState(null);
        return;
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const profile = await response.json();
            updateAuthState(profile);
        } else {
            // Token invalid or expired
            localStorage.removeItem(JWT_STORAGE_KEY);
            updateAuthState(null);
        }
    } catch {
        // Network error during validation
        updateAuthState(null);
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    clearAuthAlert();

    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;

    if (!username || !password) {
        showAuthAlert('Username and password are required', true);
        return;
    }

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = currentAuthMode === 'login' ? 'Logging in...' : 'Registering...';

    const endpoint = currentAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem(JWT_STORAGE_KEY, data.token);
            updateAuthState(data);
            closeModal();
        } else {
            showAuthAlert(data.error || 'Authentication failed', true);
        }
    } catch (err) {
        showAuthAlert('Could not connect to server: ' + err.message, true);
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = currentAuthMode === 'login' ? 'Log In' : 'Register Account';
    }
}

function handleLogout() {
    localStorage.removeItem(JWT_STORAGE_KEY);
    updateAuthState(null);
    if (activeRoom) {
        leaveRoom();
    }
}

// --- Phase 4: Room & Lobby Management ---
const hudRoom = document.getElementById('hudRoom');
const lobbyBrowser = document.getElementById('lobbyBrowser');
const activeRoomView = document.getElementById('activeRoomView');
const roomsContainer = document.getElementById('roomsContainer');
const roomCountBadge = document.getElementById('roomCountBadge');
const emptyRoomsMsg = document.getElementById('emptyRoomsMsg');
const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
const openCreateRoomBtn = document.getElementById('openCreateRoomBtn');
const createRoomModal = document.getElementById('createRoomModal');
const closeCreateRoomModalBtn = document.getElementById('closeCreateRoomModalBtn');
const createRoomForm = document.getElementById('createRoomForm');
const roomNameInput = document.getElementById('roomNameInput');
const maxPlayersSelect = document.getElementById('maxPlayersSelect');
const createRoomAlert = document.getElementById('createRoomAlert');

const currentRoomId = document.getElementById('currentRoomId');
const currentRoomName = document.getElementById('currentRoomName');
const currentRoomStatus = document.getElementById('currentRoomStatus');
const playersRoster = document.getElementById('playersRoster');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const readyBtn = document.getElementById('readyBtn');
const startGameBtn = document.getElementById('startGameBtn');

let activeRoom = null;
let roomPollingInterval = null;

function getAuthHeaders() {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function isAuthenticated() {
    return !!localStorage.getItem(JWT_STORAGE_KEY);
}

function showCreateRoomAlert(message, isError = true) {
    createRoomAlert.textContent = message;
    createRoomAlert.className = `auth-alert ${isError ? 'error' : 'success'}`;
    createRoomAlert.style.display = 'block';
}

function openCreateRoomModal() {
    if (!isAuthenticated()) {
        openModal();
        showAuthAlert('Please log in or register to create an arena', true);
        return;
    }
    createRoomAlert.style.display = 'none';
    createRoomForm.reset();
    createRoomModal.style.display = 'flex';
    roomNameInput.focus();
}

function closeCreateRoomModal() {
    createRoomModal.style.display = 'none';
}

async function fetchRoomsList() {
    try {
        const response = await fetch('/api/rooms', { headers: getAuthHeaders() });
        if (!response.ok) return;

        const rooms = await response.json();
        roomCountBadge.textContent = `${rooms.length} Arena${rooms.length === 1 ? '' : 's'}`;

        roomsContainer.innerHTML = '';
        if (rooms.length === 0) {
            roomsContainer.appendChild(emptyRoomsMsg);
            return;
        }

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';

            const isPlaying = room.status === 'PLAYING';
            const isFull = room.currentPlayers >= room.maxPlayers;
            const canJoin = !isPlaying && !isFull;

            card.innerHTML = `
                <div class="room-card-header">
                    <span class="room-code-tag">${escapeHtml(room.roomId)}</span>
                    <span class="room-capacity">${room.currentPlayers}/${room.maxPlayers} Players</span>
                </div>
                <div class="room-card-title">${escapeHtml(room.name)}</div>
                <div class="room-card-footer">
                    <span class="room-host">Host: ${escapeHtml(room.hostUsername)}</span>
                    <button class="room-join-btn" data-room-id="${escapeHtml(room.roomId)}" ${!canJoin ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                        ${isPlaying ? 'In Game' : isFull ? 'Full' : 'Join'}
                    </button>
                </div>
            `;

            const joinBtn = card.querySelector('.room-join-btn');
            if (canJoin) {
                joinBtn.addEventListener('click', () => joinRoom(room.roomId));
            }

            roomsContainer.appendChild(card);
        });
    } catch (err) {
        console.error('Error fetching rooms:', err);
    }
}

async function checkMyCurrentRoom() {
    if (!isAuthenticated()) {
        switchToLobbyBrowser();
        return;
    }

    try {
        const response = await fetch('/api/rooms/my-room', { headers: getAuthHeaders() });
        if (response.status === 200) {
            const roomData = await response.json();
            renderActiveRoom(roomData);
        } else {
            switchToLobbyBrowser();
        }
    } catch {
        switchToLobbyBrowser();
    }
}

// --- WebSocket Real-Time Networking ---
let gameWs = null;

function connectGameWebSocket(roomId) {
    if (gameWs) {
        if (gameWs.currentRoomId === roomId && (gameWs.readyState === WebSocket.OPEN || gameWs.readyState === WebSocket.CONNECTING)) {
            return;
        }
        disconnectGameWebSocket();
    }

    const token = localStorage.getItem(JWT_STORAGE_KEY);
    if (!token) return;

    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProto}//${window.location.host}/ws/game?token=${encodeURIComponent(token)}&roomId=${encodeURIComponent(roomId)}`;

    try {
        gameWs = new WebSocket(wsUrl);
        gameWs.currentRoomId = roomId;

        gameWs.onopen = () => {
            hudState.textContent = 'WS: Connected (' + roomId + ')';
            gameWs.send(JSON.stringify({ type: 'JOIN', token, roomId }));
        };

        gameWs.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleWebSocketMessage(msg);
            } catch (err) {
                console.error('WS parse error:', err);
            }
        };

        gameWs.onclose = () => {
            remotePlayers.clear();
        };

        gameWs.onerror = () => {
            // Silently handle socket interruption
        };
    } catch (e) {
        console.error('WS connection failed:', e);
    }
}

function disconnectGameWebSocket() {
    if (gameWs) {
        try {
            gameWs.close();
        } catch {}
        gameWs = null;
    }
    remotePlayers.clear();
}

function handleWebSocketMessage(msg) {
    switch (msg.type) {
        case 'PLAYER_MOVED':
            if (msg.username !== player.name) {
                let rp = remotePlayers.get(msg.username);
                if (!rp) {
                    rp = {
                        x: msg.x,
                        y: msg.y,
                        heading: msg.heading,
                        color: '#10b981',
                        radius: 16,
                        score: 0
                    };
                    remotePlayers.set(msg.username, rp);
                } else {
                    rp.x = msg.x;
                    rp.y = msg.y;
                    rp.heading = msg.heading;
                }
            }
            break;
        case 'PLAYER_LEFT':
            remotePlayers.delete(msg.username);
            updateLiveScoreboard();
            if (activeRoom) {
                fetchRoomDetails(activeRoom.roomId);
            }
            break;
        case 'PLAYER_JOINED':
        case 'ROOM_UPDATED':
            if (activeRoom) {
                fetchRoomDetails(activeRoom.roomId);
            }
            break;
        case 'GAME_START':
        case 'GAME_STATE_SNAPSHOT':
            isGameOver = false;
            coins.clear();
            if (msg.type === 'GAME_START') {
                myScore = 0;
                hudScore.textContent = '0';
            }
            if (msg.winningScore) {
                winningScore = msg.winningScore;
                hudTarget.textContent = winningScore;
                scoreboardGoal.textContent = winningScore;
            }
            if (msg.coins && Array.isArray(msg.coins)) {
                msg.coins.forEach(c => coins.set(c.id, c));
            }
            if (msg.players && Array.isArray(msg.players)) {
                msg.players.forEach(p => {
                    if (p.username === player.name) {
                        player.x = p.x;
                        player.y = p.y;
                        player.color = p.color;
                        if (p.score !== undefined) {
                            myScore = p.score;
                            hudScore.textContent = myScore;
                        }
                    } else {
                        remotePlayers.set(p.username, {
                            x: p.x,
                            y: p.y,
                            heading: p.heading || 0,
                            color: p.color,
                            radius: 16,
                            score: p.score || 0
                        });
                    }
                });
            }
            if (activeRoom) {
                activeRoom.status = 'PLAYING';
                currentRoomStatus.textContent = 'MATCH IN PROGRESS';
                currentRoomStatus.className = 'room-status-badge playing';
                hudState.textContent = 'Real-time Arena Match';
            }
            updateLiveScoreboard();
            break;
        case 'COIN_COLLECTED': {
            const coin = coins.get(msg.coinId);
            const posX = coin ? coin.x : player.x;
            const posY = coin ? coin.y : player.y;
            coins.delete(msg.coinId);

            const isMe = msg.username === player.name;
            addFloatingText(`+${msg.value}`, posX, posY, isMe ? '#fbbf24' : '#10b981');

            if (isMe) {
                myScore = msg.playerScore;
                hudScore.textContent = myScore;
            } else {
                let rp = remotePlayers.get(msg.username);
                if (rp) {
                    rp.score = msg.playerScore;
                }
            }
            updateLiveScoreboard();
            break;
        }
        case 'COIN_SPAWNED':
            if (msg.coin) {
                coins.set(msg.coin.id, msg.coin);
            }
            break;
        case 'GAME_OVER': {
            isGameOver = true;
            if (activeRoom) {
                activeRoom.status = 'FINISHED';
                currentRoomStatus.textContent = 'MATCH FINISHED';
                currentRoomStatus.className = 'room-status-badge waiting';
            }
            showGameOverModal(msg);
            break;
        }
        case 'REMATCH_RESET': {
            closeGameOverModal();
            isGameOver = false;
            coins.clear();
            myScore = 0;
            hudScore.textContent = '0';
            if (activeRoom) {
                activeRoom.status = 'WAITING';
                currentRoomStatus.textContent = 'WAITING FOR PLAYERS';
                currentRoomStatus.className = 'room-status-badge waiting';
                fetchRoomDetails(activeRoom.roomId);
            }
            break;
        }
    }
}

function updateLiveScoreboard() {
    if (!activeRoom || activeRoom.status !== 'PLAYING') {
        liveScoreboard.style.display = 'none';
        return;
    }
    liveScoreboard.style.display = 'block';

    const list = [];
    list.push({ username: player.name, score: myScore, color: player.color, isMe: true });

    remotePlayers.forEach((rp, uname) => {
        list.push({ username: uname, score: rp.score || 0, color: rp.color || '#10b981', isMe: false });
    });

    list.sort((a, b) => b.score - a.score);

    scoreboardList.innerHTML = list.map(item => `
        <div class="scoreboard-entry ${item.isMe ? 'is-me' : ''}">
            <div class="scoreboard-player-info">
                <span class="scoreboard-dot" style="background-color: ${item.color};"></span>
                <span>${escapeHtml(item.username)}${item.isMe ? ' (You)' : ''}</span>
            </div>
            <span class="scoreboard-score">${item.score}</span>
        </div>
    `).join('');
}

function showGameOverModal(msg) {
    const isMeWinner = msg.winner === player.name;
    gameOverTitle.textContent = isMeWinner ? '🏆 VICTORY!' : '🏁 MATCH COMPLETE';
    winnerAnnouncement.textContent = isMeWinner
        ? `Glorious Victory! You reached the target score of ${msg.winningScore || 100}!`
        : `${escapeHtml(msg.winner)} conquered the arena with score ${msg.winningScore || 100}!`;

    if (msg.players && Array.isArray(msg.players)) {
        const sorted = [...msg.players].sort((a, b) => (b.score || 0) - (a.score || 0));
        matchSummaryScores.innerHTML = sorted.map(p => `
            <div class="match-summary-row ${p.username === msg.winner ? 'is-winner' : ''}">
                <span class="name">${p.username === msg.winner ? '👑 ' : ''}${escapeHtml(p.username)}</span>
                <span class="score">${p.score || 0} pts</span>
            </div>
        `).join('');
    }

    if (msg.matchId) {
        matchMetaPill.textContent = `Match #${msg.matchId}`;
        matchMetaPill.style.display = 'inline-block';
    } else {
        matchMetaPill.style.display = 'none';
    }

    // Host can trigger Rematch
    if (activeRoom && activeRoom.hostUsername === player.name) {
        rematchBtn.style.display = 'inline-block';
    } else {
        rematchBtn.style.display = 'none';
    }

    gameOverModal.style.display = 'flex';
    // Refresh user profile stats
    verifyExistingSession();
}

function closeGameOverModal() {
    gameOverModal.style.display = 'none';
}

async function triggerRematch() {
    if (!activeRoom) return;
    try {
        const res = await fetch(`/api/rooms/${activeRoom.roomId}/rematch`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            closeGameOverModal();
            fetchRoomDetails(activeRoom.roomId);
        }
    } catch (e) {
        console.error('Rematch request failed:', e);
    }
}

async function fetchAndShowMatchHistory() {
    matchHistoryModal.style.display = 'flex';
    matchHistoryList.innerHTML = '<div class="empty-history-msg">Loading battle records...</div>';

    // Populate user career stats
    try {
        const profileRes = await fetch('/api/auth/me', { headers: getAuthHeaders() });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            profileStatUsername.textContent = profile.username;
            profileStatGames.textContent = profile.totalGames;
            profileStatTotalScore.textContent = profile.totalScore;
            profileStatHighScore.textContent = profile.highestScore;
        }
    } catch {}

    // Fetch match logs
    try {
        const res = await fetch('/api/matches/me', { headers: getAuthHeaders() });
        if (res.ok) {
            const matches = await res.json();
            if (matches.length === 0) {
                matchHistoryList.innerHTML = '<div class="empty-history-msg">No completed matches yet. Jump into an arena to record your first battle!</div>';
                return;
            }

            matchHistoryList.innerHTML = matches.map(m => {
                const dateStr = new Date(m.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(m.finishedAt).toLocaleDateString();
                const outcomeClass = m.winner ? 'victory' : 'defeat';
                const outcomeText = m.winner ? '🏆 Victory' : 'Defeat';

                const chips = Object.entries(m.scores || {}).map(([uname, score]) => {
                    const isWin = uname === m.winnerUsername;
                    return `<span class="match-player-chip ${isWin ? 'is-winner' : ''}">${isWin ? '👑 ' : ''}${escapeHtml(uname)}: ${score}</span>`;
                }).join('');

                return `
                    <div class="match-card">
                        <div class="match-card-top">
                            <span class="match-card-title">
                                <span>${escapeHtml(m.roomName)}</span>
                                <span class="room-code-tag">${escapeHtml(m.roomId)}</span>
                            </span>
                            <span class="match-outcome-badge ${outcomeClass}">${outcomeText}</span>
                        </div>
                        <div class="match-card-details">
                            <span>Your Score: <strong class="match-personal-score">${m.playerScore} pts</strong></span>
                            <span>Duration: ${m.durationSeconds}s</span>
                            <span class="match-time-tag">${dateStr}</span>
                        </div>
                        <div class="match-roster-breakdown">
                            ${chips}
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        matchHistoryList.innerHTML = '<div class="empty-history-msg">Failed to load match history.</div>';
    }
}

function closeMatchHistoryModal() {
    matchHistoryModal.style.display = 'none';
}

async function fetchAndShowLeaderboard() {
    leaderboardModal.style.display = 'flex';
    leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">Loading rankings...</td></tr>';

    try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">No rankings available yet. Complete a match to rank up!</td></tr>';
                return;
            }

            leaderboardTbody.innerHTML = data.map(entry => {
                let badgeClass = 'rank-other';
                let rankDisplay = entry.rank;
                if (entry.rank === 1) { badgeClass = 'rank-1'; rankDisplay = '🥇'; }
                else if (entry.rank === 2) { badgeClass = 'rank-2'; rankDisplay = '🥈'; }
                else if (entry.rank === 3) { badgeClass = 'rank-3'; rankDisplay = '🥉'; }

                return `
                    <tr>
                        <td><span class="rank-badge ${badgeClass}">${rankDisplay}</span></td>
                        <td class="warrior-name">${escapeHtml(entry.username)}</td>
                        <td class="warrior-score-high">${entry.highestScore}</td>
                        <td>${entry.totalScore}</td>
                        <td>${entry.totalGames}</td>
                    </tr>
                `;
            }).join('');
        } else {
            leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 24px;">Failed to load leaderboard.</td></tr>';
        }
    } catch (e) {
        leaderboardTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 24px;">Network error: ${escapeHtml(e.message)}</td></tr>`;
    }
}

function closeLeaderboardModal() {
    leaderboardModal.style.display = 'none';
}

async function fetchRoomDetails(roomId) {
    try {
        const res = await fetch(`/api/rooms/${roomId}`, { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            renderActiveRoom(data);
        }
    } catch {}
}

function switchToLobbyBrowser() {
    activeRoom = null;
    isGameOver = false;
    coins.clear();
    myScore = 0;
    hudScore.textContent = '0';
    liveScoreboard.style.display = 'none';
    closeGameOverModal();
    disconnectGameWebSocket();
    stopRoomPolling();
    activeRoomView.style.display = 'none';
    lobbyBrowser.style.display = 'block';
    hudRoom.textContent = 'None (Lobby)';
    hudState.textContent = 'Phase 6: Collectibles & Scoring';
    fetchRoomsList();
}

function renderActiveRoom(room) {
    activeRoom = room;
    lobbyBrowser.style.display = 'none';
    activeRoomView.style.display = 'flex';

    currentRoomId.textContent = room.roomId;
    currentRoomName.textContent = room.name;
    hudRoom.textContent = `${room.name} (${room.roomId})`;

    // Connect WebSocket channel for this room
    connectGameWebSocket(room.roomId);

    // Status pill
    const isPlaying = room.status === 'PLAYING';
    currentRoomStatus.textContent = isPlaying ? 'MATCH IN PROGRESS' : 'WAITING FOR PLAYERS';
    currentRoomStatus.className = `room-status-badge ${isPlaying ? 'playing' : 'waiting'}`;

    // Render roster
    playersRoster.innerHTML = '';
    const myUsername = usernameDisplay.textContent;
    let isMyUserHost = false;
    let myUserReady = false;

    room.players.forEach(p => {
        if (p.username === myUsername) {
            if (p.isHost) isMyUserHost = true;
            if (p.isReady) myUserReady = true;
        }

        const chip = document.createElement('div');
        chip.className = `player-chip ${p.isHost ? 'is-host' : ''}`;
        chip.innerHTML = `
            <span class="player-chip-name">${p.isHost ? '👑 ' : ''}${escapeHtml(p.username)}</span>
            <span class="player-status-tag ${p.isReady ? 'ready' : 'waiting'}">
                ${p.isHost ? 'Host' : p.isReady ? '✓ Ready' : '⏳ Waiting'}
            </span>
        `;
        playersRoster.appendChild(chip);
    });

    // Control buttons visibility
    if (isMyUserHost) {
        readyBtn.style.display = 'none';
        startGameBtn.style.display = isPlaying ? 'none' : 'inline-block';
        startGameBtn.disabled = !room.canStart;
        startGameBtn.title = room.canStart ? 'Launch the match' : 'Waiting for all players to be ready';
    } else {
        startGameBtn.style.display = 'none';
        readyBtn.style.display = isPlaying ? 'none' : 'inline-block';
        readyBtn.textContent = myUserReady ? 'Unready' : 'Ready Up';
        readyBtn.className = myUserReady ? 'btn-secondary' : 'btn-warning';
    }

    startRoomPolling(room.roomId);
}

function startRoomPolling(roomId) {
    if (roomPollingInterval) return;
    roomPollingInterval = setInterval(async () => {
        if (!activeRoom || !isAuthenticated()) {
            stopRoomPolling();
            return;
        }
        try {
            const res = await fetch(`/api/rooms/${roomId}`, { headers: getAuthHeaders() });
            if (res.ok) {
                const updatedRoom = await res.json();
                renderActiveRoom(updatedRoom);
            } else if (res.status === 404) {
                switchToLobbyBrowser();
            }
        } catch {
            // Keep polling
        }
    }, 1500);
}

function stopRoomPolling() {
    if (roomPollingInterval) {
        clearInterval(roomPollingInterval);
        roomPollingInterval = null;
    }
}

async function createRoom(name, maxPlayers) {
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, maxPlayers: parseInt(maxPlayers, 10) })
        });
        const data = await response.json();
        if (response.ok) {
            closeCreateRoomModal();
            renderActiveRoom(data);
        } else {
            showCreateRoomAlert(data.error || 'Failed to create arena', true);
        }
    } catch (err) {
        showCreateRoomAlert('Network error: ' + err.message, true);
    }
}

async function joinRoom(roomId) {
    if (!isAuthenticated()) {
        openModal();
        showAuthAlert('Please log in or register to join an arena', true);
        return;
    }

    try {
        const response = await fetch(`/api/rooms/${roomId}/join`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (response.ok) {
            renderActiveRoom(data);
        } else {
            alert(data.error || 'Could not join arena');
            fetchRoomsList();
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
}

async function leaveRoom() {
    if (!activeRoom) return;
    const roomId = activeRoom.roomId;
    try {
        await fetch(`/api/rooms/${roomId}/leave`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch {
        // Continue cleanup locally
    }
    switchToLobbyBrowser();
}

async function toggleReady() {
    if (!activeRoom) return;
    try {
        const res = await fetch(`/api/rooms/${activeRoom.roomId}/ready`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            renderActiveRoom(data);
        }
    } catch (err) {
        console.error('Error toggling ready:', err);
    }
}

async function startGame() {
    if (!activeRoom) return;
    try {
        const res = await fetch(`/api/rooms/${activeRoom.roomId}/start`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            renderActiveRoom(data);
        } else {
            const err = await res.json();
            alert(err.error || 'Cannot start match');
        }
    } catch (err) {
        console.error('Error starting match:', err);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function setupRoomEventListeners() {
    openCreateRoomBtn.addEventListener('click', openCreateRoomModal);
    closeCreateRoomModalBtn.addEventListener('click', closeCreateRoomModal);
    refreshRoomsBtn.addEventListener('click', fetchRoomsList);

    createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = roomNameInput.value.trim();
        const maxPlayers = maxPlayersSelect.value;
        createRoom(name, maxPlayers);
    });

    createRoomModal.addEventListener('click', (e) => {
        if (e.target === createRoomModal) {
            closeCreateRoomModal();
        }
    });

    leaveRoomBtn.addEventListener('click', leaveRoom);
    readyBtn.addEventListener('click', toggleReady);
    startGameBtn.addEventListener('click', startGame);
}

function setupAuthEventListeners() {
    openAuthModalBtn.addEventListener('click', openModal);
    closeAuthModalBtn.addEventListener('click', closeModal);
    tabLoginBtn.addEventListener('click', () => setAuthMode('login'));
    tabRegisterBtn.addEventListener('click', () => setAuthMode('register'));
    authForm.addEventListener('submit', handleAuthSubmit);
    logoutBtn.addEventListener('click', handleLogout);

    // Close modal if user clicks outside modal card
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeModal();
        }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (authModal.style.display === 'flex') closeModal();
            if (createRoomModal.style.display === 'flex') closeCreateRoomModal();
            if (leaderboardModal.style.display === 'flex') closeLeaderboardModal();
            if (matchHistoryModal.style.display === 'flex') closeMatchHistoryModal();
            if (gameOverModal.style.display === 'flex') closeGameOverModal();
        }
    });
}

function setupLeaderboardEventListeners() {
    openLeaderboardBtn.addEventListener('click', fetchAndShowLeaderboard);
    closeLeaderboardModalBtn.addEventListener('click', closeLeaderboardModal);

    leaderboardModal.addEventListener('click', (e) => {
        if (e.target === leaderboardModal) {
            closeLeaderboardModal();
        }
    });

    if (openMatchHistoryBtn) {
        openMatchHistoryBtn.addEventListener('click', fetchAndShowMatchHistory);
    }
    if (closeMatchHistoryModalBtn) {
        closeMatchHistoryModalBtn.addEventListener('click', closeMatchHistoryModal);
    }
    if (matchHistoryModal) {
        matchHistoryModal.addEventListener('click', (e) => {
            if (e.target === matchHistoryModal) {
                closeMatchHistoryModal();
            }
        });
    }

    if (rematchBtn) {
        rematchBtn.addEventListener('click', triggerRematch);
    }

    returnToLobbyBtn.addEventListener('click', () => {
        closeGameOverModal();
        leaveRoom();
    });

    viewLeaderboardFromGameOverBtn.addEventListener('click', () => {
        closeGameOverModal();
        fetchAndShowLeaderboard();
    });
}

// --- Application Bootstrap ---
window.addEventListener('DOMContentLoaded', () => {
    setupAuthEventListeners();
    setupRoomEventListeners();
    setupLeaderboardEventListeners();
    checkBackendHealth();
    verifyExistingSession().then(() => {
        checkMyCurrentRoom();
        fetchRoomsList();
    });
    requestAnimationFrame(gameLoop);
});
