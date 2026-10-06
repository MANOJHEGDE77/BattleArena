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
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');

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
    }

    // Update lightweight HUD
    hudPos.textContent = `X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`;
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

    // 5. Name tag
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, 0, -player.radius - 8);

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

    // Visual render step
    renderArena();
    renderPlayer();

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
        usernameDisplay.textContent = user.username;
        highScoreBadge.textContent = `Best: ${user.highestScore || 0}`;
        player.name = user.username;
        hudPlayer.textContent = user.username;
    } else {
        userProfileBadge.style.display = 'none';
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
        if (e.key === 'Escape' && authModal.style.display === 'flex') {
            closeModal();
        }
    });
}

// --- Application Bootstrap ---
window.addEventListener('DOMContentLoaded', () => {
    setupAuthEventListeners();
    checkBackendHealth();
    verifyExistingSession();
    requestAnimationFrame(gameLoop);
});
