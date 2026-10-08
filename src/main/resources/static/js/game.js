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
const hudState = document.getElementById('hudState');

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

// --- Phase 8 DOM Elements & State: Combat, Projectiles & Health ---
const hudHp = document.getElementById('hudHp');
const hudKd = document.getElementById('hudKd');
const killFeed = document.getElementById('killFeed');
const respawnOverlay = document.getElementById('respawnOverlay');
const respawnCountdown = document.getElementById('respawnCountdown');
const hudTimer = document.getElementById('hudTimer');
const soundToggleBtn = document.getElementById('soundToggleBtn');

// --- Phase 14 DOM Elements: In-Game Real-Time Match Chat ---
const chatOverlay = document.getElementById('chatOverlay');
const chatMessages = document.getElementById('chatMessages');
const chatInputForm = document.getElementById('chatInputForm');
const chatInput = document.getElementById('chatInput');

function appendChatMessage(msg) {
    if (!chatMessages) return;
    const div = document.createElement('div');
    if (msg.system) {
        div.className = 'chat-msg system';
        div.textContent = msg.text;
    } else {
        div.className = 'chat-msg';
        const userSpan = document.createElement('span');
        userSpan.className = 'chat-user' + (msg.username === player.name ? ' me' : '');
        userSpan.textContent = msg.username + ':';
        const textNode = document.createTextNode(' ' + msg.text);
        div.appendChild(userSpan);
        div.appendChild(textNode);
    }
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Phase 15 DOM Elements & State: Spectator Mode & Free Camera Observer ---
const spectatorBanner = document.getElementById('spectatorBanner');
const spectatorTargetText = document.getElementById('spectatorTargetText');
let isSpectator = false;
let spectateTargetUsername = null;

function updateSpectatorTargetDisplay() {
    if (!spectatorTargetText) return;
    if (spectateTargetUsername && remotePlayers.has(spectateTargetUsername)) {
        spectatorTargetText.textContent = `Tracking: ${spectateTargetUsername} ([Space] Free Cam)`;
    } else {
        spectateTargetUsername = null;
        spectatorTargetText.textContent = 'Free Cam (WASD Pan, [1-8] Track, [Space] Center)';
    }
}

// --- Phase 19 DOM Elements & State: Killcam Review & Combat Highlights ---
const killcamAvatar = document.getElementById('killcamAvatar');
const killcamKillerName = document.getElementById('killcamKillerName');
const killcamClassBadge = document.getElementById('killcamClassBadge');
const killcamKillerHp = document.getElementById('killcamKillerHp');
const killcamWeapon = document.getElementById('killcamWeapon');
const killcamDistance = document.getElementById('killcamDistance');
const killcamDamage = document.getElementById('killcamDamage');
const respawnProgressFill = document.getElementById('respawnProgressFill');
const matchAccoladesRow = document.getElementById('matchAccoladesRow');
const matchHighlightsBox = document.getElementById('matchHighlightsBox');
const highlightsList = document.getElementById('highlightsList');
const copyBattleReportBtn = document.getElementById('copyBattleReportBtn');
let lastMatchSummary = null;

function showKillcamReview(msg) {
    if (!respawnOverlay) return;
    if (killcamKillerName) killcamKillerName.textContent = msg.killer || 'Enemy Warrior';
    const kClass = msg.killerClass || 'ASSAULT';
    if (killcamClassBadge) {
        killcamClassBadge.textContent = kClass;
        killcamClassBadge.className = `killcam-class-badge class-badge ${kClass.toLowerCase()}`;
    }
    if (killcamAvatar) {
        killcamAvatar.textContent = WARRIOR_CLASSES[kClass]?.icon || (msg.killer === 'THE_STORM' ? '⚡' : (msg.killer === 'VOLATILE_BARREL' ? '💥' : '🤖'));
    }
    if (killcamKillerHp) {
        const hp = msg.killerHealth !== undefined ? msg.killerHealth : 100;
        const maxHp = msg.killerMaxHealth || 100;
        const sh = msg.killerShield || 0;
        const maxSh = msg.killerMaxShield || 50;
        killcamKillerHp.textContent = `HP: ${hp}/${maxHp} | Shield: ${sh}/${maxSh}`;
    }
    if (killcamWeapon) {
        killcamWeapon.textContent = msg.weaponName || 'Blaster Bolt';
    }
    if (killcamDistance) {
        killcamDistance.textContent = msg.distance ? `${msg.distance}m` : 'Point Blank';
    }
    if (killcamDamage) {
        killcamDamage.textContent = `-${msg.finalDamage || 20} HP`;
    }
}

// --- Phase 20 DOM Elements & State: Settings, Intel Manual & Achievements ---
const hudPing = document.getElementById('hudPing');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
const masterVolumeRange = document.getElementById('masterVolumeRange');
const masterVolDisplay = document.getElementById('masterVolDisplay');
const sfxVolumeRange = document.getElementById('sfxVolumeRange');
const sfxVolDisplay = document.getElementById('sfxVolDisplay');
const ambientDroneToggle = document.getElementById('ambientDroneToggle');
const screenShakeToggle = document.getElementById('screenShakeToggle');
const modalSoundToggleBtn = document.getElementById('modalSoundToggleBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

const openIntelBtn = document.getElementById('openIntelBtn');
const intelModal = document.getElementById('intelModal');
const closeIntelModalBtn = document.getElementById('closeIntelModalBtn');
const tabIntelControlsBtn = document.getElementById('tabIntelControlsBtn');
const tabIntelClassesBtn = document.getElementById('tabIntelClassesBtn');
const tabIntelHazardsBtn = document.getElementById('tabIntelHazardsBtn');
const intelControlsSection = document.getElementById('intelControlsSection');
const intelClassesSection = document.getElementById('intelClassesSection');
const intelHazardsSection = document.getElementById('intelHazardsSection');

const tabMatchLogsBtn = document.getElementById('tabMatchLogsBtn');
const tabAchievementsBtn = document.getElementById('tabAchievementsBtn');
const matchRecordsSection = document.getElementById('matchRecordsSection');
const achievementsSection = document.getElementById('achievementsSection');
const achievementsGrid = document.getElementById('achievementsGrid');
const unlockedAchievementsCount = document.getElementById('unlockedAchievementsCount');
const achievementToastContainer = document.getElementById('achievementToastContainer');

let screenShakeEnabled = localStorage.getItem('battle_arena_screenshake') !== 'false';
let coinsCollectedSession = 0;
let pingInterval = null;

const ACHIEVEMENTS_CONFIG = {
    FIRST_BLOOD: {
        id: 'FIRST_BLOOD',
        icon: '🩸',
        title: 'First Blood',
        desc: 'Claim your first combat elimination in the arena.'
    },
    APEX_CHAMPION: {
        id: 'APEX_CHAMPION',
        icon: '🏆',
        title: 'Apex Champion',
        desc: 'Secure 1st place victory in an arena match.'
    },
    SHARPSHOOTER: {
        id: 'SHARPSHOOTER',
        icon: '🎯',
        title: 'Sharpshooter',
        desc: 'Eliminate an opponent from over 150m distance.'
    },
    TITAN_ARMOR: {
        id: 'TITAN_ARMOR',
        icon: '🦾',
        title: 'Iron Titan',
        desc: 'Absorb heavy enemy fire and survive in combat.'
    },
    CYBER_HOARDER: {
        id: 'CYBER_HOARDER',
        icon: '🪙',
        title: 'Cyber Hoarder',
        desc: 'Collect 5 power coins within a single match.'
    },
    HAZARD_ENGINEER: {
        id: 'HAZARD_ENGINEER',
        icon: '💥',
        title: 'Hazard Engineer',
        desc: 'Trigger a jump pad boost or explosive barrel.'
    }
};

function getUnlockedAchievements() {
    try {
        const stored = localStorage.getItem('battle_arena_achievements');
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function unlockAchievement(id) {
    if (!ACHIEVEMENTS_CONFIG[id]) return;
    const unlocked = getUnlockedAchievements();
    if (unlocked[id]) return;

    unlocked[id] = {
        unlockedAt: new Date().toISOString(),
        timestamp: Date.now()
    };
    try {
        localStorage.setItem('battle_arena_achievements', JSON.stringify(unlocked));
    } catch {}

    const ach = ACHIEVEMENTS_CONFIG[id];
    showAchievementToast(ach);
    soundEngine.playAchievementUnlocked();
    renderAchievementsGrid();
}

function showAchievementToast(ach) {
    if (!achievementToastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <span class="toast-icon">${ach.icon}</span>
        <div class="toast-body">
            <div class="toast-tag">🎖️ MILESTONE UNLOCKED</div>
            <div class="toast-title">${escapeHtml(ach.title)}</div>
            <div class="toast-desc">${escapeHtml(ach.desc)}</div>
        </div>
    `;
    achievementToastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(80px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 4500);
}

function renderAchievementsGrid() {
    if (!achievementsGrid) return;
    const unlocked = getUnlockedAchievements();
    const all = Object.values(ACHIEVEMENTS_CONFIG);
    const count = all.filter(a => unlocked[a.id]).length;
    if (unlockedAchievementsCount) {
        unlockedAchievementsCount.textContent = `${count}/${all.length}`;
    }

    achievementsGrid.innerHTML = all.map(a => {
        const isUnlocked = !!unlocked[a.id];
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <span class="achievement-badge">${a.icon}</span>
                <div class="achievement-meta">
                    <div class="achievement-title">${escapeHtml(a.title)}</div>
                    <div class="achievement-desc">${escapeHtml(a.desc)}</div>
                    <span class="achievement-status-tag ${isUnlocked ? 'unlocked' : 'locked'}">
                        ${isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function startPingMonitor() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
        if (gameWs && gameWs.readyState === WebSocket.OPEN) {
            gameWs.send(JSON.stringify({
                type: 'PING',
                clientTime: performance.now()
            }));
        }
    }, 2500);
}

function stopPingMonitor() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
    if (hudPing) hudPing.textContent = '-- ms';
}

function updatePingDisplay(rtt) {
    if (!hudPing) return;
    hudPing.textContent = `${rtt} ms`;
    hudPing.className = 'hud-ping ' + (rtt < 60 ? 'good' : (rtt < 120 ? 'moderate' : 'high'));
}

// --- Phase 16 DOM Elements & State: Warrior Classes & Weapon Loadouts ---
const hudClass = document.getElementById('hudClass');
const classSelectContainer = document.getElementById('classSelectContainer');
const currentSelectedClassBadge = document.getElementById('currentSelectedClassBadge');
const classCardsGrid = document.getElementById('classCardsGrid');

const WARRIOR_CLASSES = {
    ASSAULT: {
        name: 'ASSAULT',
        badgeText: 'ASSAULT (Pulse Blaster)',
        icon: '🛡️',
        maxHp: 100,
        maxShield: 50,
        speed: 240,
        cooldownMs: 320,
        weaponName: 'Pulse Blaster',
        color: '#10b981',
        accentColor: '#34d399',
        projectileRadius: 5
    },
    JUGGERNAUT: {
        name: 'JUGGERNAUT',
        badgeText: 'JUGGERNAUT (Plasma Cannon)',
        icon: '🦾',
        maxHp: 150,
        maxShield: 75,
        speed: 195,
        cooldownMs: 480,
        weaponName: 'Plasma Cannon',
        color: '#f59e0b',
        accentColor: '#fbbf24',
        projectileRadius: 8
    },
    SCOUT: {
        name: 'SCOUT',
        badgeText: 'SCOUT (Twin Needles)',
        icon: '⚡',
        maxHp: 75,
        maxShield: 35,
        speed: 290,
        cooldownMs: 240,
        weaponName: 'Twin Needles',
        color: '#a855f7',
        accentColor: '#c084fc',
        projectileRadius: 4
    },
    SNIPER: {
        name: 'SNIPER',
        badgeText: 'SNIPER (Hyper Railgun)',
        icon: '🎯',
        maxHp: 85,
        maxShield: 40,
        speed: 220,
        cooldownMs: 620,
        weaponName: 'Hyper Railgun',
        color: '#06b6d4',
        accentColor: '#22d3ee',
        projectileRadius: 4
    }
};

let mySelectedClass = 'ASSAULT';

async function selectWarriorClass(className, notifyServer = true) {
    if (!WARRIOR_CLASSES[className]) return;
    mySelectedClass = className;
    player.warriorClass = className;
    const cInfo = WARRIOR_CLASSES[className];
    player.maxHealth = cInfo.maxHp;
    player.maxShield = cInfo.maxShield;
    player.speed = cInfo.speed;

    if (currentSelectedClassBadge) {
        currentSelectedClassBadge.textContent = cInfo.badgeText;
    }
    if (classCardsGrid) {
        classCardsGrid.querySelectorAll('.class-card').forEach(card => {
            if (card.getAttribute('data-class') === className) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }
    if (hudClass) {
        hudClass.textContent = `${cInfo.icon} ${className}`;
        hudClass.title = cInfo.weaponName;
    }

    if (notifyServer && activeRoom && activeRoom.status !== 'PLAYING') {
        try {
            await fetch(`/api/rooms/${activeRoom.roomId}/class`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ warriorClass: className })
            });
            if (gameWs && gameWs.readyState === WebSocket.OPEN) {
                gameWs.send(JSON.stringify({ type: 'SELECT_CLASS', warriorClass: className }));
            }
        } catch {}
    }
}

// --- Phase 13 & 20: Procedural Synthetic Audio Engine (Zero audio files/bandwidth) ---
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('battle_arena_sound_muted') === 'true';
        this.masterVolume = parseFloat(localStorage.getItem('battle_arena_master_vol') || '0.5');
        this.sfxVolume = parseFloat(localStorage.getItem('battle_arena_sfx_vol') || '0.75');
        this.droneActive = false;
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('battle_arena_master_vol', String(this.masterVolume));
        if (this.droneGain && this.ctx) {
            this.droneGain.gain.setValueAtTime(this.masterVolume * 0.12, this.ctx.currentTime);
        }
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        localStorage.setItem('battle_arena_sfx_vol', String(this.sfxVolume));
    }

    getEffectiveVolume() {
        return this.muted ? 0 : (this.masterVolume * this.sfxVolume);
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('battle_arena_sound_muted', String(this.muted));
        if (this.muted) {
            this.stopAmbientDrone();
        } else {
            if (localStorage.getItem('battle_arena_drone_enabled') === 'true') {
                this.startAmbientDrone();
            }
        }
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    startAmbientDrone() {
        if (this.muted || this.droneActive) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            this.droneGain = this.ctx.createGain();
            this.droneGain.gain.setValueAtTime(this.masterVolume * 0.12, now);

            this.droneOsc1 = this.ctx.createOscillator();
            this.droneOsc1.type = 'sawtooth';
            this.droneOsc1.frequency.setValueAtTime(55, now);

            this.droneOsc2 = this.ctx.createOscillator();
            this.droneOsc2.type = 'sine';
            this.droneOsc2.frequency.setValueAtTime(55.6, now);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, now);

            this.droneOsc1.connect(filter);
            this.droneOsc2.connect(filter);
            filter.connect(this.droneGain);
            this.droneGain.connect(this.ctx.destination);

            this.droneOsc1.start(now);
            this.droneOsc2.start(now);
            this.droneActive = true;
        } catch {}
    }

    stopAmbientDrone() {
        if (!this.droneActive) return;
        try {
            if (this.droneGain && this.ctx) {
                this.droneGain.gain.setValueAtTime(0, this.ctx.currentTime);
            }
            if (this.droneOsc1) { this.droneOsc1.stop(); this.droneOsc1.disconnect(); }
            if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2.disconnect(); }
        } catch {}
        this.droneActive = false;
        this.droneOsc1 = null;
        this.droneOsc2 = null;
        this.droneGain = null;
    }

    playAchievementUnlocked() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + i * 0.08;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.7, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.36);
            });
        } catch {}
    }

    playLaser(isSpread = false, warriorClass = 'ASSAULT') {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (warriorClass === 'JUGGERNAUT') {
                // Heavy plasma acoustic boom
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);
                gain.gain.setValueAtTime(this.masterVolume * 0.9, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.23);
            } else if (warriorClass === 'SCOUT') {
                // High-velocity needle chirp
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1450, now);
                osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
                gain.gain.setValueAtTime(this.masterVolume * 0.55, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.09);
            } else if (warriorClass === 'SNIPER') {
                // Intense hyper railgun shockwave crack
                osc.type = 'square';
                osc.frequency.setValueAtTime(1250, now);
                osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
                gain.gain.setValueAtTime(this.masterVolume * 0.85, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.19);
            } else {
                // Standard Assault Pulse Blaster
                osc.type = isSpread ? 'sawtooth' : 'triangle';
                const startFreq = isSpread ? 1040 : 880;
                osc.frequency.setValueAtTime(startFreq, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
                gain.gain.setValueAtTime(this.masterVolume * 0.7, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.13);
            }
        } catch {}
    }

    playHit() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

            gain.gain.setValueAtTime(this.masterVolume * 0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch {}
    }

    playShieldDeflect() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.linearRampToValueAtTime(1650, now + 0.06);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.14);

            gain.gain.setValueAtTime(this.masterVolume * 0.65, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch {}
    }

    playCoin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [1318.5, 1661.2]; // E6, G#6 bright chime
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + idx * 0.055;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(this.masterVolume * 0.5, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.12);
            });
        } catch {}
    }

    playPowerUp() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5 -> C6 fanfare
            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + idx * 0.05;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(this.masterVolume * 0.55, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.15);
            });
        } catch {}
    }

    playExplosion() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(750, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.3);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(this.masterVolume * 0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        } catch {}
    }

    playStormBuzz() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, now);
            osc.frequency.linearRampToValueAtTime(45, now + 0.14);

            gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);
        } catch {}
    }

    playJumpPad() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.18);
            gain.gain.setValueAtTime(this.masterVolume * 0.75, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.21);
        } catch {}
    }

    playBarrelExplosion() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);
            gain.gain.setValueAtTime(this.masterVolume * 0.95, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch {}
    }

    playLavaSizzle() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
            gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        } catch {}
    }

    playEmoteSound(emoteId, category) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            if (emoteId === 'CELEBRATE_GG') {
                const notes = [523.25, 659.25, 783.99, 1046.5];
                notes.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = now + i * 0.07;
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(this.masterVolume * 0.5, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.2);
                });
            } else if (emoteId === 'TARGET_SPOTTED' || emoteId === 'DANGER_ALERT') {
                [660, 880].forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = now + i * 0.08;
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(this.masterVolume * 0.65, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.14);
                });
            } else if (emoteId === 'DEFEND_POS') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(330, now + 0.15);
                gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (emoteId === 'RUSH_ATTACK') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(280, now);
                osc.frequency.exponentialRampToValueAtTime(840, now + 0.2);
                gain.gain.setValueAtTime(this.masterVolume * 0.55, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (emoteId === 'NEED_BACKUP' || emoteId === 'HEAL_REQUEST') {
                [587.33, 783.99].forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const t = now + i * 0.09;
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(this.masterVolume * 0.45, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.15);
                });
            } else {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.22);
                gain.gain.setValueAtTime(this.masterVolume * 0.55, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.27);
            }
        } catch {}
    }
}

const soundEngine = new SoundEngine();

function updateSoundButtonUi(isMuted) {
    if (!soundToggleBtn) return;
    if (isMuted) {
        soundToggleBtn.textContent = '🔇 Sound: OFF';
        soundToggleBtn.classList.add('muted');
        soundToggleBtn.title = 'Audio Synthesizer Muted (Click to Unmute)';
    } else {
        soundToggleBtn.textContent = '🔊 Sound: ON';
        soundToggleBtn.classList.remove('muted');
        soundToggleBtn.title = 'Audio Synthesizer Active (Click to Mute)';
    }
}

// Global user interaction gesture to unlock Web Audio API Context
['click', 'keydown', 'pointerdown'].forEach(evt => {
    window.addEventListener(evt, () => soundEngine.init(), { passive: true });
});

const projectiles = new Map();
const ATTACK_COOLDOWN_MS = 350;
let respawnTimerInterval = null;

// --- Phase 12 State: Match Countdown & Shrinking Safe Zone ---
let matchTimeRemaining = 120;
let safeZoneRadius = 500;
let isSuddenDeath = false;

// --- Phase 10 State: Obstacles & Tactical Cover ---
const obstacles = [];

// --- Phase 11 State: Tactical Power-ups & Combat Buffs ---
const powerUps = new Map();

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
    warriorClass: 'ASSAULT',
    name: 'Guest',
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 50,
    speedBoostUntil: 0,
    spreadShotUntil: 0,
    alive: true,
    kills: 0,
    deaths: 0,
    lastAttackTime: 0
};

// --- Input Manager ---
const activeKeys = new Set();

window.addEventListener('keydown', (e) => {
    if (document.activeElement === chatInput) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        if (chatInput) chatInput.focus();
        return;
    }
    if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleEmoteWheel();
        return;
    }
    if (isSpectator) {
        if (e.code === 'Space') {
            e.preventDefault();
            spectateTargetUsername = null;
            updateSpectatorTargetDisplay();
            return;
        }
        if (e.key >= '1' && e.key <= '8') {
            const index = parseInt(e.key, 10) - 1;
            const remoteNames = Array.from(remotePlayers.keys());
            if (index < remoteNames.length) {
                spectateTargetUsername = remoteNames[index];
                updateSpectatorTargetDisplay();
            }
            return;
        }
    } else {
        if (e.key >= '1' && e.key <= '8') {
            const emote = EMOTE_MAP[e.key];
            if (emote) {
                e.preventDefault();
                triggerEmote(emote);
                return;
            }
        }
        if (e.code === 'Space') {
            e.preventDefault();
            fireBlaster();
            return;
        }
    }
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

let lastAimX = null;
let lastAimY = null;

// Canvas pointer tracking for real-time mouse-aim swivel
canvas.addEventListener('pointermove', (e) => {
    if (isGameOver || !player.alive || isSpectator) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastAimX = (e.clientX - rect.left) * scaleX;
    lastAimY = (e.clientY - rect.top) * scaleY;
    player.heading = Math.atan2(lastAimY - player.y, lastAimX - player.x);
});

// Canvas pointer down for directional mouse-aim firing
canvas.addEventListener('pointerdown', (e) => {
    if (isGameOver || !player.alive || isSpectator) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastAimX = (e.clientX - rect.left) * scaleX;
    lastAimY = (e.clientY - rect.top) * scaleY;
    const heading = Math.atan2(lastAimY - player.y, lastAimX - player.x);
    player.heading = heading;
    fireBlaster(heading);
});

function fireBlaster(targetHeading) {
    if (isGameOver || !player.alive || isSpectator) return;
    if (!activeRoom || activeRoom.status !== 'PLAYING') return;
    if (!gameWs || gameWs.readyState !== WebSocket.OPEN) return;

    const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
    const classInfo = WARRIOR_CLASSES[currentClass] || WARRIOR_CLASSES.ASSAULT;
    const cooldown = classInfo.cooldownMs;

    const now = performance.now();
    if (now - player.lastAttackTime < cooldown) return;
    player.lastAttackTime = now;

    soundEngine.playLaser(player.spreadShotUntil > Date.now(), currentClass);

    const heading = targetHeading !== undefined ? targetHeading : player.heading;
    gameWs.send(JSON.stringify({
        type: 'ATTACK',
        heading: Math.round(heading * 100) / 100
    }));
}

// Clear keys if window loses focus to avoid "stuck key" glitch
window.addEventListener('blur', () => {
    activeKeys.clear();
});

// Update projectiles flight and client-side hit trigger
function updateProjectiles(dt) {
    const now = performance.now();
    projectiles.forEach((p, id) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Boundary or lifetime expiration
        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height || (now - p.clientCreatedAt > 2200)) {
            projectiles.delete(id);
            return;
        }

        // Obstacle cover interception: bullet blocked by obstacle box
        if (obstacles.length > 0) {
            for (const obs of obstacles) {
                if (p.x >= obs.x && p.x <= obs.x + obs.width && p.y >= obs.y && p.y <= obs.y + obs.height) {
                    addFloatingText('✦', p.x, p.y, '#38bdf8');
                    if (p.shooter === player.name && gameWs && gameWs.readyState === WebSocket.OPEN) {
                        gameWs.send(JSON.stringify({
                            type: 'PROJECTILE_OBSTACLE_HIT',
                            projectileId: id,
                            obstacleId: obs.id
                        }));
                    }
                    projectiles.delete(id);
                    return;
                }
            }
        }

        // Explosive Volatile Barrel collision check (Phase 17)
        if (arenaHazards.size > 0) {
            for (const [hId, hazard] of arenaHazards) {
                if (hazard.type === 'EXPLOSIVE_BARREL' && hazard.active !== false) {
                    const dx = p.x - hazard.x;
                    const dy = p.y - hazard.y;
                    const maxDist = (hazard.radius || 16) + (p.radius || 5);
                    if (dx * dx + dy * dy <= maxDist * maxDist) {
                        addFloatingText('💥', p.x, p.y, '#f97316');
                        if (p.shooter === player.name && gameWs && gameWs.readyState === WebSocket.OPEN) {
                            gameWs.send(JSON.stringify({
                                type: 'PROJECTILE_HAZARD_HIT',
                                projectileId: id,
                                hazardId: hId
                            }));
                        }
                        projectiles.delete(id);
                        return;
                    }
                }
            }
        }

        // Local client hit detection for shooter's own projectiles
        if (p.shooter === player.name && activeRoom && activeRoom.status === 'PLAYING') {
            remotePlayers.forEach((rp, uname) => {
                if (rp.alive !== false) {
                    const dx = p.x - rp.x;
                    const dy = p.y - rp.y;
                    const maxDist = (rp.radius || 16) + (p.radius || 5);
                    if (dx * dx + dy * dy <= maxDist * maxDist) {
                        if (gameWs && gameWs.readyState === WebSocket.OPEN) {
                            gameWs.send(JSON.stringify({
                                type: 'PROJECTILE_HIT',
                                projectileId: id,
                                targetUsername: uname
                            }));
                        }
                        projectiles.delete(id);
                    }
                }
            });
        }
    });
}

// --- Physics & Collision Engine ---
function updatePhysics(dt) {
    if (isGameOver) return;

    updateProjectiles(dt);

    if (isSpectator) {
        if (spectateTargetUsername) {
            const tracked = remotePlayers.get(spectateTargetUsername);
            if (tracked) {
                hudPos.textContent = `Observing: ${spectateTargetUsername} (${Math.round(tracked.x)}, ${Math.round(tracked.y)})`;
            } else {
                spectateTargetUsername = null;
                updateSpectatorTargetDisplay();
                hudPos.textContent = 'Spectator: Free Cam';
            }
        } else {
            hudPos.textContent = 'Spectator: Free Cam';
        }
        return;
    }

    if (!player.alive) {
        return;
    }

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

        // Update player heading angle based on mouse aim or movement direction
        if (lastAimX !== null && lastAimY !== null) {
            player.heading = Math.atan2(lastAimY - player.y, lastAimX - player.x);
        } else {
            player.heading = Math.atan2(moveY, moveX);
        }

        // Apply frame-rate independent displacement with speed boost buff support
        const nowMs = Date.now();
        const effectiveSpeed = (player.speedBoostUntil > nowMs) ? player.speed * 1.4 : player.speed;
        player.x += moveX * effectiveSpeed * dt;
        player.y += moveY * effectiveSpeed * dt;

        // Arena boundary collision detection (clamping within walls)
        const minX = player.radius + 2;
        const maxX = canvas.width - player.radius - 2;
        const minY = player.radius + 2;
        const maxY = canvas.height - player.radius - 2;

        player.x = Math.max(minX, Math.min(maxX, player.x));
        player.y = Math.max(minY, Math.min(maxY, player.y));

        // Smooth obstacle collision resolution: slide along barrier surfaces
        resolveObstacleCollisions(player);

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

            powerUps.forEach((pu) => {
                const dx = player.x - pu.x;
                const dy = player.y - pu.y;
                const maxDist = player.radius + (pu.radius || 15) + 6;
                if (dx * dx + dy * dy <= maxDist * maxDist) {
                    if (gameWs && gameWs.readyState === WebSocket.OPEN) {
                        gameWs.send(JSON.stringify({ type: 'COLLECT_POWERUP', powerUpId: pu.id }));
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
    if (!gameWs || gameWs.readyState !== WebSocket.OPEN || isSpectator) return;
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
    // 1. Clear background with deep cyber hue
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. High-tech cyber neon grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
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

    // 3. Center arena tactical radar rings
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Glowing electric arena boundary walls
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
    ctx.shadowBlur = 8;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // 5. Corner tactical bracket accents
    const cLen = 22;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(2, 2 + cLen); ctx.lineTo(2, 2); ctx.lineTo(2 + cLen, 2);
    // Top-right
    ctx.moveTo(canvas.width - 2 - cLen, 2); ctx.lineTo(canvas.width - 2, 2); ctx.lineTo(canvas.width - 2, 2 + cLen);
    // Bottom-left
    ctx.moveTo(2, canvas.height - 2 - cLen); ctx.lineTo(2, canvas.height - 2); ctx.lineTo(2 + cLen, canvas.height - 2);
    // Bottom-right
    ctx.moveTo(canvas.width - 2 - cLen, canvas.height - 2); ctx.lineTo(canvas.width - 2, canvas.height - 2); ctx.lineTo(canvas.width - 2, canvas.height - 2 - cLen);
    ctx.stroke();
    ctx.restore();
}

// Phase 12: Battle Royale Safe Zone & Storm Perimeter Visuals
function updateHudTimer() {
    if (!hudTimer) return;
    const mins = Math.floor(Math.max(0, matchTimeRemaining) / 60);
    const secs = Math.floor(Math.max(0, matchTimeRemaining) % 60);
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (isSuddenDeath) {
        hudTimer.innerHTML = `<span style="color:#ef4444; font-weight:700; text-shadow:0 0 8px rgba(239,68,68,0.8);">${formatted} ⚠️ SUDDEN DEATH</span>`;
    } else {
        hudTimer.textContent = formatted;
    }
}

function renderSafeZone() {
    if (!activeRoom || activeRoom.status !== 'PLAYING') return;

    const centerX = 400;
    const centerY = 300;
    const radius = Math.max(0, safeZoneRadius);
    const time = performance.now() * 0.003;
    const pulse = Math.sin(time) * 3;

    ctx.save();
    // 1. Draw glowing outer storm zone with radial shadow
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = isSuddenDeath ? 'rgba(239, 68, 68, 0.22)' : 'rgba(244, 63, 94, 0.13)';
    ctx.fill();

    // 2. Safe zone boundary laser ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isSuddenDeath ? '#ef4444' : '#f43f5e';
    ctx.lineWidth = isSuddenDeath ? 3 : 2;
    ctx.shadowColor = isSuddenDeath ? 'rgba(239, 68, 68, 0.9)' : 'rgba(244, 63, 94, 0.6)';
    ctx.shadowBlur = 10 + pulse;
    ctx.stroke();

    // 3. Electric ripple perimeter
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = isSuddenDeath ? 'rgba(239, 68, 68, 0.35)' : 'rgba(244, 63, 94, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

// Circle vs AABB obstacle collision resolution
function resolveObstacleCollisions(p) {
    if (!obstacles || obstacles.length === 0) return;
    for (const obs of obstacles) {
        const nx = Math.max(obs.x, Math.min(p.x, obs.x + obs.width));
        const ny = Math.max(obs.y, Math.min(p.y, obs.y + obs.height));
        const dx = p.x - nx;
        const dy = p.y - ny;
        const distSq = dx * dx + dy * dy;
        const r = p.radius || 16;
        if (distSq < r * r) {
            if (distSq > 1e-6) {
                const dist = Math.sqrt(distSq);
                const overlap = r - dist;
                p.x += (dx / dist) * overlap;
                p.y += (dy / dist) * overlap;
            } else {
                const distLeft = p.x - obs.x;
                const distRight = (obs.x + obs.width) - p.x;
                const distTop = p.y - obs.y;
                const distBottom = (obs.y + obs.height) - p.y;
                const minDist = Math.min(distLeft, distRight, distTop, distBottom);
                if (minDist === distLeft) p.x = obs.x - r;
                else if (minDist === distRight) p.x = obs.x + obs.width + r;
                else if (minDist === distTop) p.y = obs.y - r;
                else p.y = obs.y + obs.height + r;
            }
        }
    }
}

// Phase 17: Interactive Environmental Hazards & Traps Map
const arenaHazards = new Map();

// Screen Shake & Concussive Blast System
let screenShakeRemaining = 0;
let screenShakeMagnitude = 0;

function triggerScreenShake(magnitude = 6, durationSec = 0.25) {
    screenShakeMagnitude = magnitude;
    screenShakeRemaining = durationSec;
}

const shockwaves = [];

function addShockwave(x, y, maxRadius = 85, color = '#f97316') {
    shockwaves.push({ x, y, radius: 6, maxRadius, alpha: 1.0, color });
}

function renderShockwaves(dt) {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 14);
        sw.alpha -= dt * 2.5;
        if (sw.alpha <= 0) {
            shockwaves.splice(i, 1);
            continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
    }
}

// --- Phase 18 DOM Elements & State: Tactical Emote Wheel & Callout HUD ---
const emoteWheelOverlay = document.getElementById('emoteWheelOverlay');
const hudEmoteTriggerBtn = document.getElementById('hudEmoteTriggerBtn');
const activeEmotes = [];
const activePings = [];

const EMOTE_MAP = {
    '1': 'TARGET_SPOTTED',
    '2': 'DEFEND_POS',
    '3': 'RUSH_ATTACK',
    '4': 'DANGER_ALERT',
    '5': 'NEED_BACKUP',
    '6': 'TAUNT_FLEX',
    '7': 'CELEBRATE_GG',
    '8': 'HEAL_REQUEST'
};

function openEmoteWheel() {
    if (!emoteWheelOverlay) return;
    emoteWheelOverlay.style.display = 'block';
}

function closeEmoteWheel() {
    if (!emoteWheelOverlay) return;
    emoteWheelOverlay.style.display = 'none';
}

function toggleEmoteWheel() {
    if (!emoteWheelOverlay) return;
    if (emoteWheelOverlay.style.display === 'block') {
        closeEmoteWheel();
    } else {
        openEmoteWheel();
    }
}

function getEmoteCategoryColor(category) {
    switch (category) {
        case 'warning': return '#f59e0b';
        case 'tactical': return '#06b6d4';
        case 'aggressive': return '#ef4444';
        case 'urgent': return '#ec4899';
        case 'social': return '#eab308';
        default: return '#38bdf8';
    }
}

function triggerEmote(emoteId) {
    if (!gameWs || gameWs.readyState !== WebSocket.OPEN) return;
    if (!activeRoom || activeRoom.status !== 'PLAYING') return;

    gameWs.send(JSON.stringify({
        type: 'EMOTE',
        emoteId: emoteId
    }));
    closeEmoteWheel();
}

function handleEmoteTriggered(msg) {
    soundEngine.playEmoteSound(msg.emoteId, msg.category);
    activeEmotes.push({
        id: 'em_' + Math.random(),
        username: msg.username,
        emoteId: msg.emoteId,
        icon: msg.icon || '💬',
        label: msg.label || 'Callout',
        category: msg.category || 'tactical',
        x: msg.x,
        y: msg.y,
        createdAt: performance.now(),
        duration: 3500
    });

    const catColor = getEmoteCategoryColor(msg.category);
    if (msg.targetX !== undefined && msg.targetY !== undefined) {
        activePings.push({
            x: msg.targetX,
            y: msg.targetY,
            icon: msg.icon || '📍',
            color: catColor,
            createdAt: performance.now(),
            duration: 3500
        });
    }

    addFloatingText(`${msg.icon || ''} ${msg.label || ''}`, msg.x, msg.y - 36, catColor);
}

function renderEmotes(dt) {
    if (activeEmotes.length === 0) return;
    const now = performance.now();

    for (let i = activeEmotes.length - 1; i >= 0; i--) {
        const em = activeEmotes[i];
        const elapsed = now - em.createdAt;
        if (elapsed >= em.duration) {
            activeEmotes.splice(i, 1);
            continue;
        }

        let px = em.x;
        let py = em.y;
        if (em.username === player.name) {
            px = player.x;
            py = player.y;
        } else if (remotePlayers.has(em.username)) {
            const rp = remotePlayers.get(em.username);
            px = rp.x;
            py = rp.y;
        }

        const progress = elapsed / em.duration;
        let alpha = 1;
        if (elapsed < 200) {
            alpha = elapsed / 200;
        } else if (em.duration - elapsed < 800) {
            alpha = (em.duration - elapsed) / 800;
        }
        alpha = Math.max(0, Math.min(1, alpha));

        const floatY = progress * 24;
        const catColor = getEmoteCategoryColor(em.category);

        ctx.save();
        ctx.globalAlpha = alpha;

        // Holographic tether line connecting bubble to player
        ctx.beginPath();
        ctx.moveTo(px, py - 22);
        ctx.lineTo(px, py - 38 - floatY);
        ctx.strokeStyle = catColor;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Holographic Badge Pill
        const text = `${em.icon} ${em.label}`;
        ctx.font = 'bold 12px Outfit, sans-serif';
        const textMetrics = ctx.measureText(text);
        const pillWidth = textMetrics.width + 20;
        const pillHeight = 24;
        const pillX = px - pillWidth / 2;
        const pillY = py - 46 - floatY - pillHeight / 2;

        // Glass background
        ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 12);
        } else {
            ctx.rect(pillX, pillY, pillWidth, pillHeight);
        }
        ctx.fill();

        // Glowing border
        ctx.strokeStyle = catColor;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = catColor;
        ctx.shadowBlur = 8;
        ctx.stroke();

        // Interior glow
        ctx.fillStyle = catColor;
        ctx.globalAlpha = alpha * 0.14;
        ctx.fill();

        // Text
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, px, pillY + pillHeight / 2);

        ctx.restore();
    }
}

function renderPings(dt) {
    if (activePings.length === 0) return;
    const now = performance.now();

    for (let i = activePings.length - 1; i >= 0; i--) {
        const ping = activePings[i];
        const elapsed = now - ping.createdAt;
        if (elapsed >= ping.duration) {
            activePings.splice(i, 1);
            continue;
        }

        const alpha = Math.max(0, 1 - elapsed / ping.duration);
        const pulse = 18 + Math.sin(elapsed * 0.01) * 6;

        ctx.save();
        ctx.globalAlpha = alpha * 0.85;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, pulse, 0, Math.PI * 2);
        ctx.strokeStyle = ping.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = ping.color;
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.font = '16px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ping.icon, ping.x, ping.y);
        ctx.restore();
    }
}

// Render Interactive Environmental Hazards (Jump Pads, Lava Pools, Volatile Barrels)
function renderHazards() {
    if (arenaHazards.size === 0) return;

    const time = performance.now();
    arenaHazards.forEach((hazard) => {
        ctx.save();
        ctx.translate(hazard.x, hazard.y);

        if (hazard.type === 'JUMP_PAD') {
            const rad = hazard.radius || 24;
            const pulse = Math.sin(time * 0.006) * 1.5;

            // Concentric cyan pulsing energy field
            ctx.beginPath();
            ctx.arc(0, 0, rad + 4 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(6, 182, 212, 0.16)';
            ctx.fill();

            // Metallic rim
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.stroke();

            // Directional kinetic chevron indicator
            ctx.save();
            ctx.rotate(hazard.boostAngle || 0);
            ctx.beginPath();
            ctx.moveTo(-7, -8);
            ctx.lineTo(7, 0);
            ctx.lineTo(-7, 8);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.restore();

        } else if (hazard.type === 'LAVA_POOL') {
            const rad = hazard.radius || 32;
            const lPulse = Math.sin(time * 0.004) * 2.5;

            // Ambient radiant thermal corona
            ctx.beginPath();
            ctx.arc(0, 0, rad + 6 + lPulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
            ctx.fill();

            // Core molten plasma pool
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.fillStyle = '#dc2626';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 12;
            ctx.fill();

            // Turbulent molten center
            const eddyX = Math.cos(time * 0.003) * 6;
            const eddyY = Math.sin(time * 0.003) * 6;
            ctx.beginPath();
            ctx.arc(eddyX, eddyY, rad * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();

        } else if (hazard.type === 'EXPLOSIVE_BARREL') {
            if (hazard.active === false) {
                // Scorched blast crater
                ctx.beginPath();
                ctx.arc(0, 0, hazard.radius || 16, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
                ctx.fill();
                ctx.restore();
                return;
            }

            const rad = hazard.radius || 16;
            // Volatile canister body
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.fillStyle = '#dc2626';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
            ctx.fill();

            // Yellow warning ring
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Explosive hazard glyph
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', 0, 0);

            // Health bar if damaged
            if (hazard.health !== undefined && hazard.health < (hazard.maxHealth || 30)) {
                const bw = 22, bh = 3;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(-bw / 2, -rad - 6, bw, bh);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(-bw / 2, -rad - 6, bw * Math.max(0, hazard.health / (hazard.maxHealth || 30)), bh);
            }
        }

        ctx.restore();
    });
}

// Render Tactical Cover Obstacles (Pure Vector 2D, Zero External Assets)
function renderObstacles() {
    if (!obstacles || obstacles.length === 0) return;

    obstacles.forEach(obs => {
        ctx.save();

        // 1. Cyber Drop Shadow & Ambient Glow
        ctx.shadowColor = obs.type === 'BUNKER' ? 'rgba(99, 102, 241, 0.45)' : 'rgba(14, 165, 233, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 2. Base Hull Fill with rounded corners
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
        } else {
            ctx.rect(obs.x, obs.y, obs.width, obs.height);
        }
        ctx.fill();

        // 3. Subtle Inner Gradient Surface
        ctx.shadowBlur = 0;
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y + obs.height);
        if (obs.type === 'BUNKER') {
            grad.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
            grad.addColorStop(1, 'rgba(30, 27, 75, 0.9)');
        } else {
            grad.addColorStop(0, 'rgba(14, 165, 233, 0.18)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0.9)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // 4. Tech Border Outline
        ctx.strokeStyle = obs.type === 'BUNKER' ? '#6366f1' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 5. Tactical Inner Hazard Hatch / Tech Stripes
        ctx.save();
        ctx.clip(); // clip to obstacle bounding box

        ctx.strokeStyle = obs.type === 'BUNKER' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 2;
        const step = 14;
        for (let i = -obs.height; i < obs.width + obs.height; i += step) {
            ctx.beginPath();
            ctx.moveTo(obs.x + i, obs.y);
            ctx.lineTo(obs.x + i + obs.height, obs.y + obs.height);
            ctx.stroke();
        }

        ctx.restore(); // restore clip

        // 6. Corner Tech Brackets & Core Marker
        ctx.fillStyle = obs.type === 'BUNKER' ? '#818cf8' : '#38bdf8';
        ctx.fillRect(obs.x + 3, obs.y + 3, 3, 3);
        ctx.fillRect(obs.x + obs.width - 6, obs.y + obs.height - 6, 3, 3);

        if (obs.type === 'BUNKER') {
            // Central core fortress emblem
            ctx.beginPath();
            ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
            ctx.fill();
            ctx.strokeStyle = '#a5b4fc';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    });
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

// Render Tactical Combat Buffs (Pure Vector 2D, Zero External Assets)
function renderPowerUps() {
    const time = performance.now() * 0.005;
    powerUps.forEach((pu) => {
        ctx.save();
        ctx.translate(pu.x, pu.y);

        const radius = pu.radius || 15;
        const pulse = Math.sin(time * 1.5 + (pu.x * 0.04)) * 2;

        let primaryColor = '#06b6d4';
        let glowColor = 'rgba(6, 182, 212, 0.35)';
        let symbol = '🛡️';

        if (pu.type === 'SPEED_BOOST') {
            primaryColor = '#eab308';
            glowColor = 'rgba(234, 179, 8, 0.35)';
            symbol = '⚡';
        } else if (pu.type === 'SPREAD_SHOT') {
            primaryColor = '#d946ef';
            glowColor = 'rgba(217, 70, 239, 0.35)';
            symbol = '✦';
        }

        // 1. Radiant Outer Aura
        ctx.beginPath();
        ctx.arc(0, 0, radius + 4 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // 2. Rotating Hexagonal / Circular Hull
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 3. Center Cyber Glyph / Rune
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 1);

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

function renderProjectiles() {
    projectiles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.heading);

        const r = p.radius || 5;
        if (r >= 7) {
            // JUGGERNAUT Plasma Cannon Orb (Heavy fiery projectile)
            const pulse = Math.sin(performance.now() * 0.02) * 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, r + 4 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 12;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = '#fef08a';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(r * 0.4, 0);
            ctx.lineTo(-r * 2.2, -r * 0.6);
            ctx.lineTo(-r * 2.2, r * 0.6);
            ctx.closePath();
            ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.fill();
        } else if (p.speed >= 700 || p.damage >= 40) {
            // SNIPER Hyper Railgun Slug (Supersonic high-velocity beam)
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 14;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-24, -2);
            ctx.lineTo(-24, 2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(34, 211, 238, 0.8)';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(4, 0);
            ctx.lineTo(-14, -1);
            ctx.lineTo(-14, 1);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        } else if (p.speed >= 580 || r <= 4) {
            // SCOUT Twin Needles Dart (Rapid needle dart)
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#a855f7';
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 9;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(3, 0);
            ctx.lineTo(-14, -2);
            ctx.lineTo(-14, 2);
            ctx.closePath();
            ctx.fillStyle = 'rgba(192, 132, 252, 0.6)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = '#f3e8ff';
            ctx.fill();
        } else {
            // ASSAULT Pulse Blaster (Balanced pulse bolt)
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 10;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ecfdf5';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(2, 0);
            ctx.lineTo(-15, -2.5);
            ctx.lineTo(-15, 2.5);
            ctx.closePath();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
            ctx.fill();
        }

        ctx.restore();
    });
}

function renderRemotePlayers() {
    remotePlayers.forEach((rp, username) => {
        ctx.save();
        ctx.translate(rp.x, rp.y);

        if (rp.alive === false) {
            ctx.globalAlpha = 0.35;
            ctx.beginPath();
            ctx.arc(0, 0, rp.radius || 16, 0, Math.PI * 2);
            ctx.fillStyle = '#475569';
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.font = '14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('☠️', 0, 5);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '600 11px Outfit, sans-serif';
            ctx.fillText(`${username} (Dead)`, 0, -(rp.radius || 16) - 6);
            ctx.restore();
            return;
        }

        const wClass = rp.warriorClass || 'ASSAULT';
        const classInfo = WARRIOR_CLASSES[wClass] || WARRIOR_CLASSES.ASSAULT;
        const mainColor = classInfo.color;
        const pRadius = rp.radius || 16;

        // 1. Remote player outer accent ring with class styling
        ctx.beginPath();
        ctx.arc(0, 0, pRadius + 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = classInfo.accentColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 2. Class-specific vector chassis styling
        if (wClass === 'JUGGERNAUT') {
            ctx.fillStyle = '#334155';
            ctx.fillRect(pRadius * 0.4, -7, 12, 4);
            ctx.fillRect(pRadius * 0.4, 3, 12, 4);
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
                const angle = (a * Math.PI) / 3;
                const hx = Math.cos(angle) * (pRadius + 3);
                const hy = Math.sin(angle) * (pRadius + 3);
                if (a === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (wClass === 'SCOUT') {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-4, -pRadius - 6);
            ctx.lineTo(8, -pRadius + 2);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-4, pRadius + 6);
            ctx.lineTo(8, pRadius - 2);
            ctx.lineTo(-8, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(pRadius * 0.5, -3, 8, 2);
            ctx.fillRect(pRadius * 0.5, 1, 8, 2);
        } else if (wClass === 'SNIPER') {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pRadius * 0.4, -2.5, 16, 5);
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(pRadius * 0.4 + 14, -1.5, 6, 3);
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pRadius * 0.4, -3, 10, 6);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(pRadius * 0.4 + 8, -2, 4, 4);
        }

        // 3. Remote player body
        ctx.beginPath();
        ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();

        // 4. Remote player core
        ctx.beginPath();
        ctx.arc(0, 0, pRadius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 5. Directional heading indicator
        const pointerDist = pRadius + 4;
        const pointerX = Math.cos(rp.heading || 0) * pointerDist;
        const pointerY = Math.sin(rp.heading || 0) * pointerDist;

        ctx.beginPath();
        ctx.arc(pointerX, pointerY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // 6. Floating Health & Shield Bar
        const barWidth = 36;
        const barHeight = 4;
        const barX = -barWidth / 2;
        const barY = -pRadius - 16;
        const hp = rp.health !== undefined ? rp.health : classInfo.maxHp;
        const maxHp = rp.maxHealth || classInfo.maxHp;
        const hpRatio = Math.max(0, Math.min(1, hp / maxHp));

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Remote shield bar & aura
        if (rp.shield && rp.shield > 0) {
            const maxShield = rp.maxShield || classInfo.maxShield;
            const shieldRatio = Math.max(0, Math.min(1, rp.shield / maxShield));
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(barX, barY - 4, barWidth * shieldRatio, 2.5);

            const sPulse = Math.sin(performance.now() * 0.008) * 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, pRadius + 7 + sPulse, 0, Math.PI * 2);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 7. Remote player name & score tag with class badge
        ctx.fillStyle = classInfo.accentColor;
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${username} [${wClass}] (${rp.score || 0})`, 0, -pRadius - 4);

        // 8. Observer target reticle for tracked player (Phase 15)
        if (isSpectator && spectateTargetUsername === username) {
            const r = pRadius + 12;
            ctx.save();
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#c084fc';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, r, -Math.PI / 4, Math.PI / 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r, 3 * Math.PI / 4, 5 * Math.PI / 4);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    });
}

function renderPlayer() {
    if (isSpectator) {
        return; // Spectators have no physical combat avatar
    }
    ctx.save();
    ctx.translate(player.x, player.y);

    if (!player.alive) {
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#475569';
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.font = '14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☠️', 0, 5);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px Outfit, sans-serif';
        ctx.fillText(`${player.name} (Eliminated)`, 0, -player.radius - 6);
        ctx.restore();
        return;
    }

    const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
    const classInfo = WARRIOR_CLASSES[currentClass] || WARRIOR_CLASSES.ASSAULT;
    const pRadius = player.radius;

    // 1. Outer accent ring
    ctx.beginPath();
    ctx.arc(0, 0, pRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = classInfo.accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Class-specific vector chassis styling
    if (currentClass === 'JUGGERNAUT') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(pRadius * 0.4, -7, 12, 4);
        ctx.fillRect(pRadius * 0.4, 3, 12, 4);
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
            const angle = (a * Math.PI) / 3;
            const hx = Math.cos(angle) * (pRadius + 3.5);
            const hy = Math.sin(angle) * (pRadius + 3.5);
            if (a === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    } else if (currentClass === 'SCOUT') {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
        ctx.beginPath();
        ctx.moveTo(-4, -pRadius - 7);
        ctx.lineTo(9, -pRadius + 2);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4, pRadius + 7);
        ctx.lineTo(9, pRadius - 2);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(pRadius * 0.5, -3, 9, 2);
        ctx.fillRect(pRadius * 0.5, 1, 9, 2);
    } else if (currentClass === 'SNIPER') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(pRadius * 0.4, -2.5, 17, 5);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(pRadius * 0.4 + 15, -1.5, 6, 3);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(pRadius * 0.4, -3, 11, 6);
        ctx.fillStyle = '#34d399';
        ctx.fillRect(pRadius * 0.4 + 9, -2, 4, 4);
    }

    // 3. Player body
    ctx.beginPath();
    ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
    ctx.fillStyle = classInfo.color;
    ctx.fill();

    // 4. Inner core
    ctx.beginPath();
    ctx.arc(0, 0, pRadius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5. Directional heading indicator (vector pointer)
    const pointerDist = pRadius + 4;
    const pointerX = Math.cos(player.heading) * pointerDist;
    const pointerY = Math.sin(player.heading) * pointerDist;

    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 5b. Directional Tactical Laser Aiming Beam
    ctx.save();
    ctx.strokeStyle = classInfo.accentColor || 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(pointerX, pointerY);
    const laserLength = 75;
    const laserEndX = Math.cos(player.heading) * (pointerDist + laserLength);
    const laserEndY = Math.sin(player.heading) * (pointerDist + laserLength);
    ctx.lineTo(laserEndX, laserEndY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(laserEndX, laserEndY, 2, 0, Math.PI * 2);
    ctx.fillStyle = classInfo.accentColor || '#38bdf8';
    ctx.fill();
    ctx.restore();

    // 6. Floating Health Bar & Shield Bar
    const barWidth = 36;
    const barHeight = 4;
    const barX = -barWidth / 2;
    const barY = -pRadius - 16;
    const maxHp = player.maxHealth || classInfo.maxHp;
    const hpRatio = Math.max(0, Math.min(1, player.health / maxHp));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Active Energy Shield Bubble & Floating Shield Bar
    if (player.shield > 0) {
        const maxShield = player.maxShield || classInfo.maxShield;
        const shieldRatio = Math.max(0, Math.min(1, player.shield / maxShield));
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(barX, barY - 4, barWidth * shieldRatio, 2.5);

        const shieldPulse = Math.sin(performance.now() * 0.008) * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, pRadius + 7 + shieldPulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 7. Name & score tag with class badge
    ctx.fillStyle = classInfo.accentColor;
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.name} [${currentClass}] (${myScore})`, 0, -pRadius - 4);

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

    // Apply Screen Shake if active (Phase 17)
    let hasShake = false;
    if (screenShakeRemaining > 0) {
        screenShakeRemaining -= dt;
        const shakeX = (Math.random() - 0.5) * 2 * screenShakeMagnitude;
        const shakeY = (Math.random() - 0.5) * 2 * screenShakeMagnitude;
        ctx.save();
        ctx.translate(shakeX, shakeY);
        hasShake = true;
    }

    // Visual render step: arena surface -> safe zone -> hazards -> obstacles -> coins -> power-ups -> projectiles -> remote players -> local player -> shockwaves -> floating text
    renderArena();
    renderSafeZone();
    renderHazards();
    renderObstacles();
    renderCoins();
    renderPowerUps();
    renderProjectiles();
    renderRemotePlayers();
    renderPlayer();
    renderShockwaves(dt);
    renderPings(dt);
    renderEmotes(dt);
    renderFloatingTexts(dt);

    if (hasShake) {
        ctx.restore();
    }

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
const addBotBtn = document.getElementById('addBotBtn');

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
                    <div class="room-card-actions">
                        <button class="room-join-btn" data-room-id="${escapeHtml(room.roomId)}" ${!canJoin ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                            ${isPlaying ? 'In Game' : isFull ? 'Full' : 'Join'}
                        </button>
                        <button class="btn-spectate room-spectate-btn" data-room-id="${escapeHtml(room.roomId)}" title="Watch live match as observer">
                            👁️ Spectate
                        </button>
                    </div>
                </div>
            `;

            const joinBtn = card.querySelector('.room-join-btn');
            if (canJoin) {
                joinBtn.addEventListener('click', () => joinRoom(room.roomId, false));
            }

            const spectateBtn = card.querySelector('.room-spectate-btn');
            if (spectateBtn) {
                spectateBtn.addEventListener('click', () => joinRoom(room.roomId, true));
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
            if (hudState) hudState.textContent = 'WS: Connected (' + roomId + ')';
            gameWs.send(JSON.stringify({ type: 'JOIN', token, roomId }));
            startPingMonitor();
        };

        gameWs.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleWebSocketMessage(msg);
            } catch (err) {
                console.error('WS parse error:', err);
            }
        };

        gameWs.onclose = (event) => {
            stopPingMonitor();
            if (hudState) hudState.textContent = 'WS: Disconnected';
            remotePlayers.clear();
            // Resilient auto-reconnect if client remains in active room and socket closed unexpectedly
            if (activeRoom && activeRoom.roomId === roomId && !event.wasClean) {
                if (hudState) hudState.textContent = 'WS: Reconnecting...';
                setTimeout(() => {
                    if (activeRoom && activeRoom.roomId === roomId) {
                        connectGameWebSocket(roomId);
                    }
                }, 2000);
            }
        };

        gameWs.onerror = () => {
            if (hudState) hudState.textContent = 'WS: Connection Issue';
        };
    } catch (e) {
        console.error('WS connection failed:', e);
    }
}

function disconnectGameWebSocket() {
    stopPingMonitor();
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
                    const rpClass = msg.warriorClass || 'ASSAULT';
                    const rpMeta = WARRIOR_CLASSES[rpClass] || WARRIOR_CLASSES.ASSAULT;
                    rp = {
                        username: msg.username,
                        x: msg.x,
                        y: msg.y,
                        heading: msg.heading,
                        color: msg.color || rpMeta.color,
                        warriorClass: rpClass,
                        radius: 16,
                        health: rpMeta.maxHp,
                        maxHealth: rpMeta.maxHp,
                        shield: 0,
                        maxShield: rpMeta.maxShield,
                        score: 0
                    };
                    remotePlayers.set(msg.username, rp);
                } else {
                    rp.x = msg.x;
                    rp.y = msg.y;
                    rp.heading = msg.heading;
                    if (msg.warriorClass && msg.warriorClass !== rp.warriorClass) {
                        rp.warriorClass = msg.warriorClass;
                        const rpMeta = WARRIOR_CLASSES[msg.warriorClass] || WARRIOR_CLASSES.ASSAULT;
                        rp.maxHealth = rpMeta.maxHp;
                        rp.maxShield = rpMeta.maxShield;
                        rp.color = rpMeta.color;
                    }
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
        case 'PLAYER_DISCONNECTED':
            if (killFeed) {
                const item = document.createElement('div');
                item.className = 'kill-feed-item';
                item.innerHTML = `<span>⚠️</span> <span class="victim">${escapeHtml(msg.username)}</span> <span class="bonus">disconnected</span>`;
                killFeed.appendChild(item);
                setTimeout(() => { if (item.parentNode) item.remove(); }, 4000);
            }
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
            powerUps.clear();
            projectiles.clear();
            clearRespawnCountdown();
            if (msg.chatHistory && Array.isArray(msg.chatHistory)) {
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    msg.chatHistory.forEach(appendChatMessage);
                }
            } else if (msg.type === 'GAME_START' && chatMessages) {
                chatMessages.innerHTML = '';
            }
            if (msg.type === 'GAME_START') {
                myScore = 0;
                hudScore.textContent = '0';
                player.kills = 0;
                player.deaths = 0;
                const cName = player.warriorClass || mySelectedClass || 'ASSAULT';
                const cInfo = WARRIOR_CLASSES[cName] || WARRIOR_CLASSES.ASSAULT;
                player.health = cInfo.maxHp;
                player.maxHealth = cInfo.maxHp;
                player.shield = 0;
                player.maxShield = cInfo.maxShield;
                player.speed = cInfo.speed;
                player.speedBoostUntil = 0;
                player.spreadShotUntil = 0;
                player.alive = true;
                updateHudHealth();
            }
            if (msg.winningScore) {
                winningScore = msg.winningScore;
                hudTarget.textContent = winningScore;
                scoreboardGoal.textContent = winningScore;
            }
            if (msg.coins && Array.isArray(msg.coins)) {
                msg.coins.forEach(c => coins.set(c.id, c));
            }
            if (msg.powerUps && Array.isArray(msg.powerUps)) {
                msg.powerUps.forEach(pu => powerUps.set(pu.id, pu));
            }
            if (msg.obstacles && Array.isArray(msg.obstacles)) {
                obstacles.length = 0;
                obstacles.push(...msg.obstacles);
            }
            if (msg.hazards && Array.isArray(msg.hazards)) {
                arenaHazards.clear();
                msg.hazards.forEach(h => arenaHazards.set(h.id, h));
            }
            if (msg.projectiles && Array.isArray(msg.projectiles)) {
                msg.projectiles.forEach(p => {
                    projectiles.set(p.id, {
                        id: p.id,
                        shooter: p.shooterUsername || p.shooter,
                        x: p.startX || p.x,
                        y: p.startY || p.y,
                        vx: p.vx,
                        vy: p.vy,
                        heading: p.heading,
                        speed: p.speed,
                        radius: 5,
                        clientCreatedAt: performance.now()
                    });
                });
            }
            if (msg.players && Array.isArray(msg.players)) {
                msg.players.forEach(p => {
                    if (p.username === player.name) {
                        player.x = p.x;
                        player.y = p.y;
                        player.color = p.color;
                        if (p.warriorClass) {
                            player.warriorClass = p.warriorClass;
                            const cInfo = WARRIOR_CLASSES[p.warriorClass] || WARRIOR_CLASSES.ASSAULT;
                            player.maxHealth = p.maxHealth || cInfo.maxHp;
                            player.maxShield = p.maxShield || cInfo.maxShield;
                            player.speed = cInfo.speed;
                        }
                        player.health = p.health !== undefined ? p.health : (player.maxHealth || 100);
                        player.shield = p.shield !== undefined ? p.shield : 0;
                        player.speedBoostUntil = p.speedBoostUntil || 0;
                        player.spreadShotUntil = p.spreadShotUntil || 0;
                        player.alive = p.alive !== undefined ? p.alive : true;
                        player.kills = p.kills || 0;
                        player.deaths = p.deaths || 0;
                        if (p.score !== undefined) {
                            myScore = p.score;
                            hudScore.textContent = myScore;
                        }
                        updateHudHealth();
                    } else {
                        const rpClass = p.warriorClass || 'ASSAULT';
                        const rpMeta = WARRIOR_CLASSES[rpClass] || WARRIOR_CLASSES.ASSAULT;
                        remotePlayers.set(p.username, {
                            username: p.username,
                            x: p.x,
                            y: p.y,
                            heading: p.heading || 0,
                            color: p.color || rpMeta.color,
                            warriorClass: rpClass,
                            radius: p.radius || 16,
                            score: p.score || 0,
                            health: p.health !== undefined ? p.health : rpMeta.maxHp,
                            maxHealth: p.maxHealth || rpMeta.maxHp,
                            shield: p.shield !== undefined ? p.shield : 0,
                            maxShield: p.maxShield || rpMeta.maxShield,
                            speedBoostUntil: p.speedBoostUntil || 0,
                            spreadShotUntil: p.spreadShotUntil || 0,
                            alive: p.alive !== undefined ? p.alive : true,
                            kills: p.kills || 0,
                            deaths: p.deaths || 0
                        });
                    }
                });
            }
            if (msg.isSpectator !== undefined) {
                isSpectator = !!msg.isSpectator;
            }
            if (isSpectator) {
                if (spectatorBanner) spectatorBanner.style.display = 'flex';
                updateSpectatorTargetDisplay();
            } else {
                if (spectatorBanner) spectatorBanner.style.display = 'none';
            }
            if (activeRoom) {
                activeRoom.status = 'PLAYING';
                currentRoomStatus.textContent = 'MATCH IN PROGRESS';
                currentRoomStatus.className = 'room-status-badge playing';
                hudState.textContent = isSpectator ? 'Spectator Mode (Observer)' : 'Real-time Arena Match';
            }
            if (msg.timeRemaining !== undefined) {
                matchTimeRemaining = msg.timeRemaining;
                updateHudTimer();
            }
            if (msg.safeZoneRadius !== undefined) {
                safeZoneRadius = msg.safeZoneRadius;
            }
            if (msg.suddenDeath !== undefined) {
                isSuddenDeath = !!msg.suddenDeath;
            }
            updateLiveScoreboard();
            break;
        case 'CHAT_MESSAGE':
            appendChatMessage(msg);
            break;
        case 'EMOTE_TRIGGERED':
            handleEmoteTriggered(msg);
            break;
        case 'ZONE_TICK':
            if (msg.timeRemaining !== undefined) {
                matchTimeRemaining = msg.timeRemaining;
                updateHudTimer();
            }
            if (msg.safeZoneRadius !== undefined) {
                safeZoneRadius = msg.safeZoneRadius;
            }
            if (msg.suddenDeath !== undefined) {
                isSuddenDeath = !!msg.suddenDeath;
            }
            break;
        case 'PONG': {
            if (msg.clientTime) {
                const rtt = Math.round(performance.now() - msg.clientTime);
                updatePingDisplay(rtt);
            }
            break;
        }
        case 'ZONE_DAMAGE': {
            const isMe = msg.username === player.name;
            const targetX = isMe ? player.x : (remotePlayers.get(msg.username)?.x || player.x);
            const targetY = isMe ? player.y : (remotePlayers.get(msg.username)?.y || player.y);
            addFloatingText(`-${msg.damage} ⚡STORM`, targetX, targetY - 22, '#ef4444');
            soundEngine.playStormBuzz();
            if (isMe) {
                if (msg.currentShield !== undefined) player.shield = msg.currentShield;
                player.health = msg.currentHealth;
                player.alive = !msg.isEliminated;
                updateHudHealth();
            } else {
                const rp = remotePlayers.get(msg.username);
                if (rp) {
                    if (msg.currentShield !== undefined) rp.shield = msg.currentShield;
                    rp.health = msg.currentHealth;
                    rp.alive = !msg.isEliminated;
                }
            }
            break;
        }
        case 'JUMP_PAD_LAUNCHED': {
            soundEngine.playJumpPad();
            addFloatingText('⚡ BOOST!', msg.launchX, msg.launchY - 14, '#22d3ee');
            if (msg.username === player.name) {
                player.x = msg.launchX;
                player.y = msg.launchY;
                unlockAchievement('HAZARD_ENGINEER');
            } else {
                const rp = remotePlayers.get(msg.username);
                if (rp) {
                    rp.x = msg.launchX;
                    rp.y = msg.launchY;
                }
            }
            break;
        }
        case 'BARREL_EXPLODED': {
            soundEngine.playBarrelExplosion();
            unlockAchievement('HAZARD_ENGINEER');
            triggerScreenShake(9, 0.35);
            addShockwave(msg.x, msg.y, msg.blastRadius || 85, '#f97316');
            addFloatingText('💥 DETONATION!', msg.x, msg.y - 20, '#ef4444');
            const b = arenaHazards.get(msg.barrelId);
            if (b) {
                b.active = false;
            }
            if (msg.victims && Array.isArray(msg.victims)) {
                msg.victims.forEach(v => {
                    const isMe = v.username === player.name;
                    const tx = isMe ? player.x : (remotePlayers.get(v.username)?.x || player.x);
                    const ty = isMe ? player.y : (remotePlayers.get(v.username)?.y || player.y);
                    addFloatingText(`-${v.damage} 💥BLAST`, tx, ty - 26, '#f97316');
                    if (isMe) {
                        if (v.currentShield !== undefined) player.shield = v.currentShield;
                        player.health = v.currentHealth;
                        player.alive = !v.isEliminated;
                        updateHudHealth();
                    } else {
                        const rp = remotePlayers.get(v.username);
                        if (rp) {
                            if (v.currentShield !== undefined) rp.shield = v.currentShield;
                            rp.health = v.currentHealth;
                            rp.alive = !v.isEliminated;
                        }
                    }
                });
            }
            break;
        }
        case 'HAZARD_DAMAGE': {
            soundEngine.playLavaSizzle();
            const isMe = msg.username === player.name;
            const targetX = isMe ? player.x : (remotePlayers.get(msg.username)?.x || player.x);
            const targetY = isMe ? player.y : (remotePlayers.get(msg.username)?.y || player.y);
            addFloatingText(`-${msg.damage} 🔥LAVA`, targetX, targetY - 20, '#f97316');
            if (isMe) {
                if (msg.currentShield !== undefined) player.shield = msg.currentShield;
                player.health = msg.currentHealth;
                player.alive = !msg.isEliminated;
                updateHudHealth();
            } else {
                const rp = remotePlayers.get(msg.username);
                if (rp) {
                    if (msg.currentShield !== undefined) rp.shield = msg.currentShield;
                    rp.health = msg.currentHealth;
                    rp.alive = !msg.isEliminated;
                }
            }
            break;
        }
        case 'POWER_UP_SPAWNED':
            if (msg.powerUp) {
                powerUps.set(msg.powerUp.id, msg.powerUp);
            }
            break;
        case 'POWER_UP_COLLECTED': {
            powerUps.delete(msg.powerUpId);
            soundEngine.playPowerUp();
            const isMe = msg.username === player.name;
            const targetX = isMe ? player.x : (remotePlayers.get(msg.username)?.x || player.x);
            const targetY = isMe ? player.y : (remotePlayers.get(msg.username)?.y || player.y);
            const buffName = msg.powerUpType === 'SPEED_BOOST' ? '⚡ HYPER SPEED' : (msg.powerUpType === 'SPREAD_SHOT' ? '✦ TRIPLE SPREAD' : '🛡️ SHIELD BUBBLE');
            const buffColor = msg.powerUpType === 'SPEED_BOOST' ? '#eab308' : (msg.powerUpType === 'SPREAD_SHOT' ? '#d946ef' : '#06b6d4');
            addFloatingText(buffName, targetX, targetY - 20, buffColor);

            if (isMe) {
                if (msg.shield !== undefined) player.shield = msg.shield;
                if (msg.speedBoostUntil !== undefined) player.speedBoostUntil = msg.speedBoostUntil;
                if (msg.spreadShotUntil !== undefined) player.spreadShotUntil = msg.spreadShotUntil;
                updateHudHealth();
            } else {
                const rp = remotePlayers.get(msg.username);
                if (rp) {
                    if (msg.shield !== undefined) rp.shield = msg.shield;
                    if (msg.speedBoostUntil !== undefined) rp.speedBoostUntil = msg.speedBoostUntil;
                    if (msg.spreadShotUntil !== undefined) rp.spreadShotUntil = msg.spreadShotUntil;
                }
            }
            break;
        }
        case 'PROJECTILE_SPAWNED':
            if (msg.shooter !== player.name) {
                const shooterClass = remotePlayers.get(msg.shooter)?.warriorClass || 'ASSAULT';
                soundEngine.playLaser(false, shooterClass);
            }
            projectiles.set(msg.id, {
                id: msg.id,
                shooter: msg.shooter,
                x: msg.x,
                y: msg.y,
                vx: msg.vx,
                vy: msg.vy,
                heading: msg.heading,
                speed: msg.speed,
                damage: msg.damage,
                radius: msg.radius || 5,
                clientCreatedAt: performance.now()
            });
            break;
        case 'PROJECTILE_BLOCKED':
            if (msg.projectileId) {
                projectiles.delete(msg.projectileId);
            }
            if (msg.reason === 'OBSTACLE_COVER') {
                addFloatingText('BLOCKED!', player.x, player.y - 18, '#94a3b8');
            }
            break;
        case 'PLAYER_DAMAGED': {
            if (msg.projectileId) {
                projectiles.delete(msg.projectileId);
            }
            const isMe = msg.targetUsername === player.name;
            const targetX = isMe ? player.x : (remotePlayers.get(msg.targetUsername)?.x || player.x);
            const targetY = isMe ? player.y : (remotePlayers.get(msg.targetUsername)?.y || player.y);

            if (msg.shieldDamage > 0) {
                soundEngine.playShieldDeflect();
                addFloatingText(`-${msg.shieldDamage} 🛡️`, targetX, targetY - 28, '#06b6d4');
            }
            if (msg.healthDamage > 0) {
                soundEngine.playHit();
                addFloatingText(`-${msg.healthDamage}`, targetX, targetY - 14, isMe ? '#ef4444' : '#f87171');
            } else if (!msg.shieldDamage) {
                soundEngine.playHit();
                addFloatingText(`-${msg.damage}`, targetX, targetY - 14, isMe ? '#ef4444' : '#f87171');
            }

            if (isMe) {
                if (msg.currentShield !== undefined) player.shield = msg.currentShield;
                player.health = msg.currentHealth;
                player.alive = !msg.isEliminated;
                updateHudHealth();
                if (player.warriorClass === 'JUGGERNAUT' && player.alive && (msg.healthDamage + msg.shieldDamage >= 25)) {
                    unlockAchievement('TITAN_ARMOR');
                }
            } else {
                const rp = remotePlayers.get(msg.targetUsername);
                if (rp) {
                    if (msg.currentShield !== undefined) rp.shield = msg.currentShield;
                    rp.health = msg.currentHealth;
                    rp.alive = !msg.isEliminated;
                }
            }
            break;
        }
        case 'PLAYER_ELIMINATED': {
            soundEngine.playExplosion();
            addKillFeedMessage(msg.killer, msg.victim);

            if (msg.victim === player.name) {
                player.alive = false;
                player.health = 0;
                player.deaths = msg.victimDeaths;
                updateHudHealth();
                showKillcamReview(msg);
                startRespawnCountdown(msg.respawnDelayMs || 2500);
            } else {
                const victim = remotePlayers.get(msg.victim);
                if (victim) {
                    victim.alive = false;
                    victim.health = 0;
                    victim.deaths = msg.victimDeaths;
                }
            }

            if (msg.killer === player.name) {
                player.kills = msg.killerKills;
                myScore = msg.killerScore;
                hudScore.textContent = myScore;
                updateHudHealth();
                addFloatingText('+15 KILL!', player.x, player.y - 18, '#fbbf24');
                unlockAchievement('FIRST_BLOOD');
                if (msg.distance && msg.distance >= 150) {
                    unlockAchievement('SHARPSHOOTER');
                }
            } else {
                const killer = remotePlayers.get(msg.killer);
                if (killer) {
                    killer.kills = msg.killerKills;
                    killer.score = msg.killerScore;
                }
            }
            updateLiveScoreboard();
            break;
        }
        case 'PLAYER_RESPAWNED': {
            if (msg.username === player.name) {
                player.x = msg.x;
                player.y = msg.y;
                player.health = msg.health !== undefined ? msg.health : player.maxHealth;
                player.shield = 0;
                player.alive = true;
                clearRespawnCountdown();
                updateHudHealth();
                addFloatingText('RESPAWNED!', player.x, player.y, '#10b981');
            } else {
                const rp = remotePlayers.get(msg.username);
                if (rp) {
                    rp.x = msg.x;
                    rp.y = msg.y;
                    rp.health = msg.health !== undefined ? msg.health : (rp.maxHealth || 100);
                    rp.shield = 0;
                    rp.alive = true;
                    addFloatingText('RESPAWNED!', rp.x, rp.y, '#10b981');
                }
            }
            break;
        }
        case 'COIN_COLLECTED': {
            soundEngine.playCoin();
            const coin = coins.get(msg.coinId);
            const posX = coin ? coin.x : player.x;
            const posY = coin ? coin.y : player.y;
            coins.delete(msg.coinId);

            const isMe = msg.username === player.name;
            addFloatingText(`+${msg.value}`, posX, posY, isMe ? '#fbbf24' : '#10b981');

            if (isMe) {
                myScore = msg.playerScore;
                hudScore.textContent = myScore;
                coinsCollectedSession++;
                if (coinsCollectedSession >= 5) {
                    unlockAchievement('CYBER_HOARDER');
                }
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
            if (msg.winner === player.name) {
                unlockAchievement('APEX_CHAMPION');
            }
            clearRespawnCountdown();
            projectiles.clear();
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
            clearRespawnCountdown();
            isGameOver = false;
            coins.clear();
            projectiles.clear();
            myScore = 0;
            hudScore.textContent = '0';
            player.health = 100;
            player.alive = true;
            player.kills = 0;
            player.deaths = 0;
            matchTimeRemaining = 120;
            safeZoneRadius = 500;
            isSuddenDeath = false;
            updateHudTimer();
            updateHudHealth();
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
    list.push({ username: player.name, score: myScore, color: player.color, isMe: true, kills: player.kills, deaths: player.deaths });

    remotePlayers.forEach((rp, uname) => {
        list.push({ username: uname, score: rp.score || 0, color: rp.color || '#10b981', isMe: false, kills: rp.kills || 0, deaths: rp.deaths || 0 });
    });

    list.sort((a, b) => b.score - a.score);

    scoreboardList.innerHTML = list.map(item => `
        <div class="scoreboard-entry ${item.isMe ? 'is-me' : ''}">
            <div class="scoreboard-player-info">
                <span class="scoreboard-dot" style="background-color: ${item.color};"></span>
                <span>${escapeHtml(item.username)}${item.isMe ? ' (You)' : ''}</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 0.72rem; color: #94a3b8; font-family: monospace;">${item.kills}K/${item.deaths}D</span>
                <span class="scoreboard-score">${item.score}</span>
            </div>
        </div>
    `).join('');
}

function addKillFeedMessage(killer, victim) {
    if (!killFeed) return;
    const item = document.createElement('div');
    item.className = 'kill-feed-item';
    item.innerHTML = `<span class="killer">${escapeHtml(killer)}</span> ⚔️ <span class="victim">${escapeHtml(victim)}</span> <span class="bonus">(+15 pts)</span>`;
    killFeed.appendChild(item);
    setTimeout(() => {
        if (item.parentNode) {
            item.remove();
        }
    }, 4500);
}

const hudMaxHp = document.getElementById('hudMaxHp');
const hudHpFill = document.getElementById('hudHpFill');
const hudShieldFill = document.getElementById('hudShieldFill');
const hudShield = document.getElementById('hudShield');
const hudScoreFill = document.getElementById('hudScoreFill');

function updateHudHealth() {
    if (!hudHp || !hudKd) return;
    const maxHp = player.maxHealth || 100;
    hudHp.textContent = player.health;
    if (hudMaxHp) hudMaxHp.textContent = maxHp;

    const hpRatio = Math.max(0, Math.min(1, player.health / maxHp));
    const hpPct = Math.round(hpRatio * 100);
    if (hudHpFill) {
        hudHpFill.style.width = `${hpPct}%`;
        if (hpRatio <= 0.25) {
            hudHpFill.classList.add('critical');
        } else {
            hudHpFill.classList.remove('critical');
        }
    }

    if (hudShield && hudShieldFill) {
        const shieldVal = player.shield || 0;
        const maxShield = player.maxShield || 50;
        hudShield.textContent = shieldVal;
        const shieldPct = Math.min(100, Math.max(0, Math.round((shieldVal / maxShield) * 100)));
        hudShieldFill.style.width = `${shieldPct}%`;
    }

    if (hpRatio <= 0.25) {
        hudHp.className = 'low-hp';
    } else if (hpRatio <= 0.5) {
        hudHp.className = 'mid-hp';
    } else {
        hudHp.className = '';
    }
    hudKd.textContent = `${player.kills} / ${player.deaths}`;

    if (hudClass) {
        const cName = player.warriorClass || mySelectedClass || 'ASSAULT';
        const cInfo = WARRIOR_CLASSES[cName] || WARRIOR_CLASSES.ASSAULT;
        hudClass.textContent = `${cInfo.icon} ${cInfo.name}`;
        hudClass.title = cInfo.weaponName;
    }

    if (hudScoreFill && hudScore && hudTarget) {
        const currentScore = parseInt(hudScore.textContent, 10) || myScore || player.score || 0;
        const targetScore = parseInt(hudTarget.textContent, 10) || 100;
        const scorePct = Math.min(100, Math.max(0, Math.round((currentScore / targetScore) * 100)));
        hudScoreFill.style.width = `${scorePct}%`;
    }
}

function startRespawnCountdown(durationMs) {
    if (!respawnOverlay || !respawnCountdown) return;
    if (respawnTimerInterval) {
        clearInterval(respawnTimerInterval);
    }
    respawnOverlay.style.display = 'flex';
    let remaining = durationMs / 1000;
    respawnCountdown.textContent = `Tactical Respawn in ${remaining.toFixed(1)}s...`;

    if (respawnProgressFill) {
        respawnProgressFill.style.width = '0%';
    }

    const totalDuration = durationMs;
    const startTime = performance.now();

    respawnTimerInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(100, (elapsed / totalDuration) * 100);
        if (respawnProgressFill) {
            respawnProgressFill.style.width = `${progress}%`;
        }

        remaining = Math.max(0, (totalDuration - elapsed) / 1000);
        if (remaining <= 0) {
            clearInterval(respawnTimerInterval);
            respawnTimerInterval = null;
            respawnCountdown.textContent = 'Respawning now...';
        } else {
            respawnCountdown.textContent = `Tactical Respawn in ${remaining.toFixed(1)}s...`;
        }
    }, 50);
}

function clearRespawnCountdown() {
    if (respawnTimerInterval) {
        clearInterval(respawnTimerInterval);
        respawnTimerInterval = null;
    }
    if (respawnOverlay) {
        respawnOverlay.style.display = 'none';
    }
}

function showGameOverModal(msg) {
    lastMatchSummary = msg;
    const isMeWinner = msg.winner === player.name;
    gameOverTitle.textContent = isMeWinner ? '🏆 VICTORY!' : '🏁 MATCH COMPLETE';
    winnerAnnouncement.textContent = isMeWinner
        ? `Glorious Victory! You reached the target score of ${msg.winningScore || 100}!`
        : `${escapeHtml(msg.winner)} conquered the arena with score ${msg.winningScore || 100}!`;

    // 1. Calculate Accolades / Medals
    if (matchAccoladesRow) {
        const accolades = [];
        accolades.push(`
            <div class="accolade-badge mvp">
                <span>👑</span>
                <span>Champion: ${escapeHtml(msg.winner || 'Unknown')}</span>
            </div>
        `);

        let topFragger = null;
        let maxKills = 0;
        if (msg.players && Array.isArray(msg.players)) {
            for (const p of msg.players) {
                if ((p.kills || 0) > maxKills) {
                    maxKills = p.kills;
                    topFragger = p.username;
                }
            }
        }
        if (topFragger && maxKills > 0) {
            accolades.push(`
                <div class="accolade-badge top-frags">
                    <span>🎯</span>
                    <span>Apex Eliminator: ${escapeHtml(topFragger)} (${maxKills} Kills)</span>
                </div>
            `);
        }

        if (msg.combatEvents && Array.isArray(msg.combatEvents)) {
            const fb = msg.combatEvents.find(e => e.type === 'ELIMINATION');
            if (fb) {
                accolades.push(`
                    <div class="accolade-badge first-blood">
                        <span>🩸</span>
                        <span>First Blood: ${escapeHtml(fb.killer)}</span>
                    </div>
                `);
            }
        }

        matchAccoladesRow.innerHTML = accolades.join('');
    }

    // 2. Render Combat Timeline Highlights
    if (highlightsList) {
        if (msg.combatEvents && Array.isArray(msg.combatEvents) && msg.combatEvents.length > 0) {
            if (matchHighlightsBox) matchHighlightsBox.style.display = 'block';
            highlightsList.innerHTML = msg.combatEvents.map(ev => {
                const mins = Math.floor(ev.secondOffset / 60).toString().padStart(2, '0');
                const secs = (ev.secondOffset % 60).toString().padStart(2, '0');
                const timeStr = `${mins}:${secs}`;
                let icon = '⚔️';
                let desc = '';
                if (ev.type === 'ELIMINATION') {
                    icon = '🎯';
                    desc = `<strong>${escapeHtml(ev.killer)}</strong> eliminated <strong>${escapeHtml(ev.victim)}</strong> with ${escapeHtml(ev.weapon)} (${ev.distance}m)`;
                } else if (ev.type === 'HAZARD_ELIMINATION') {
                    icon = '💥';
                    desc = `<strong>${escapeHtml(ev.victim)}</strong> eliminated by <strong>${escapeHtml(ev.weapon)}</strong>`;
                } else if (ev.type === 'VICTORY') {
                    icon = '🏆';
                    desc = `<strong>${escapeHtml(ev.killer)}</strong> claimed victory!`;
                }
                return `
                    <div class="highlight-entry">
                        <span class="highlight-time">[${timeStr}]</span>
                        <span>${icon}</span>
                        <span>${desc}</span>
                    </div>
                `;
            }).join('');
        } else {
            if (matchHighlightsBox) matchHighlightsBox.style.display = 'none';
        }
    }

    // 3. Render Final Standings Table
    if (msg.players && Array.isArray(msg.players)) {
        const sorted = [...msg.players].sort((a, b) => (b.score || 0) - (a.score || 0));
        matchSummaryScores.innerHTML = sorted.map(p => `
            <div class="match-summary-row ${p.username === msg.winner ? 'is-winner' : ''}">
                <span class="name">${p.username === msg.winner ? '👑 ' : ''}${escapeHtml(p.username)}</span>
                <span class="score">${p.score || 0} pts (${p.kills || 0} K / ${p.deaths || 0} D)</span>
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

function copyBattleReport() {
    if (!lastMatchSummary) return;
    const lines = [];
    lines.push(`🏆 BATTLE ARENA COMBAT REPORT`);
    lines.push(`Winner: ${lastMatchSummary.winner} (Score: ${lastMatchSummary.winningScore})`);
    if (lastMatchSummary.players && Array.isArray(lastMatchSummary.players)) {
        lines.push(`--- STANDINGS ---`);
        const sorted = [...lastMatchSummary.players].sort((a, b) => (b.score || 0) - (a.score || 0));
        sorted.forEach((p, idx) => {
            lines.push(`#${idx + 1} ${p.username}: ${p.score || 0} pts | ${p.kills || 0} Kills | ${p.deaths || 0} Deaths`);
        });
    }
    const reportText = lines.join('\n');
    navigator.clipboard.writeText(reportText).then(() => {
        if (copyBattleReportBtn) {
            const originalText = copyBattleReportBtn.textContent;
            copyBattleReportBtn.textContent = '✅ Copied to Clipboard!';
            setTimeout(() => { copyBattleReportBtn.textContent = originalText; }, 2200);
        }
    }).catch(() => {
        alert(reportText);
    });
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
    isSpectator = false;
    spectateTargetUsername = null;
    if (spectatorBanner) spectatorBanner.style.display = 'none';
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
    let amISpectator = false;

    room.players.forEach(p => {
        if (p.username === myUsername) {
            if (p.isHost) isMyUserHost = true;
            if (p.isReady) myUserReady = true;
            if (p.spectator) amISpectator = true;
            if (p.warriorClass && p.warriorClass !== mySelectedClass) {
                selectWarriorClass(p.warriorClass, false);
            }
        }

        const chip = document.createElement('div');
        chip.className = `player-chip ${p.isHost ? 'is-host' : ''} ${p.spectator ? 'spectator' : ''} ${p.bot ? 'is-bot' : ''}`;
        const pClass = p.warriorClass || 'ASSAULT';
        const classMeta = WARRIOR_CLASSES[pClass] || WARRIOR_CLASSES.ASSAULT;
        const classBadgeHtml = p.spectator ? '' : `<span class="class-badge class-${pClass.toLowerCase()}">${classMeta.icon} ${pClass}</span>`;
        const removeBotHtml = (p.bot && isMyUserHost && !isPlaying)
            ? `<button type="button" class="btn-remove-bot" data-bot-name="${escapeHtml(p.username)}" title="Remove Bot">✕</button>`
            : '';

        chip.innerHTML = `
            <span class="player-chip-name">${p.bot ? '🤖 ' : (p.isHost ? '👑 ' : (p.spectator ? '👁️ ' : ''))}${escapeHtml(p.username)}</span>
            ${classBadgeHtml}
            <span class="player-status-tag ${p.bot ? 'bot-tag' : (p.spectator ? 'spectator-tag' : (p.isReady ? 'ready' : 'waiting'))}">
                ${p.bot ? '🤖 AI Bot' : (p.spectator ? 'Spectator' : (p.isHost ? 'Host' : p.isReady ? '✓ Ready' : '⏳ Waiting'))}
            </span>
            ${removeBotHtml}
        `;

        const rmBtn = chip.querySelector('.btn-remove-bot');
        if (rmBtn) {
            rmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeBot(p.username);
            });
        }

        playersRoster.appendChild(chip);
    });

    if (amISpectator) {
        isSpectator = true;
    }

    // Toggle Class Selection Container (visible in lobby for non-spectators)
    if (classSelectContainer) {
        classSelectContainer.style.display = (isSpectator || isPlaying) ? 'none' : 'block';
    }

    if (isSpectator) {
        readyBtn.style.display = 'none';
        startGameBtn.style.display = 'none';
        if (addBotBtn) addBotBtn.style.display = 'none';
        if (isPlaying && spectatorBanner) {
            spectatorBanner.style.display = 'flex';
            updateSpectatorTargetDisplay();
        }
    } else {
        if (spectatorBanner) spectatorBanner.style.display = 'none';
        // Control buttons visibility
        if (isMyUserHost) {
            readyBtn.style.display = 'none';
            startGameBtn.style.display = isPlaying ? 'none' : 'inline-block';
            startGameBtn.disabled = !room.canStart;
            startGameBtn.title = room.canStart ? 'Launch the match' : 'Waiting for all players to be ready';
            if (addBotBtn) {
                addBotBtn.style.display = isPlaying ? 'none' : 'inline-block';
                const combatants = room.currentPlayers || (room.players ? room.players.filter(p => !p.spectator).length : 0);
                addBotBtn.disabled = combatants >= room.maxPlayers;
                addBotBtn.title = combatants >= room.maxPlayers ? 'Room capacity reached' : 'Spawn an AI Combat Bot';
            }
        } else {
            startGameBtn.style.display = 'none';
            if (addBotBtn) addBotBtn.style.display = 'none';
            readyBtn.style.display = isPlaying ? 'none' : 'inline-block';
            readyBtn.textContent = myUserReady ? 'Unready' : 'Ready Up';
            readyBtn.className = myUserReady ? 'btn-secondary' : 'btn-warning';
        }
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

async function joinRoom(roomId, asSpectator = false) {
    if (!isAuthenticated()) {
        openModal();
        showAuthAlert('Please log in or register to join an arena', true);
        return;
    }

    try {
        const response = await fetch(`/api/rooms/${roomId}/join${asSpectator ? '?spectator=true' : ''}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ spectator: asSpectator })
        });
        const data = await response.json();
        if (response.ok) {
            isSpectator = !!asSpectator;
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

async function addBot() {
    if (!activeRoom) return;
    try {
        const res = await fetch(`/api/rooms/${activeRoom.roomId}/bot`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            renderActiveRoom(data);
        } else {
            const err = await res.json();
            alert(err.error || 'Cannot add AI bot');
        }
    } catch (err) {
        console.error('Error adding bot:', err);
    }
}

async function removeBot(botName) {
    if (!activeRoom) return;
    try {
        const res = await fetch(`/api/rooms/${activeRoom.roomId}/bot/${encodeURIComponent(botName)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            renderActiveRoom(data);
        }
    } catch (err) {
        console.error('Error removing bot:', err);
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
    if (addBotBtn) addBotBtn.addEventListener('click', addBot);

    if (classCardsGrid) {
        classCardsGrid.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', () => {
                const chosenClass = card.getAttribute('data-class');
                if (chosenClass) {
                    selectWarriorClass(chosenClass, true);
                }
            });
        });
    }
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

    // Global hotkeys: [M] Mute, [H] Guide, [Esc] Close Modals & Settings
    window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }
        if (e.key === 'm' || e.key === 'M') {
            soundEngine.init();
            const muted = soundEngine.toggleMute();
            updateSoundButtonUi(muted);
        }
        if (e.key === 'h' || e.key === 'H') {
            if (intelModal && intelModal.style.display === 'flex') {
                closeIntelModal();
            } else {
                openIntelModal();
            }
        }
        if (e.key === 'Escape') {
            closeEmoteWheel();
            if (authModal && authModal.style.display === 'flex') closeModal();
            if (createRoomModal && createRoomModal.style.display === 'flex') closeCreateRoomModal();
            if (leaderboardModal && leaderboardModal.style.display === 'flex') closeLeaderboardModal();
            if (matchHistoryModal && matchHistoryModal.style.display === 'flex') closeMatchHistoryModal();
            if (gameOverModal && gameOverModal.style.display === 'flex') closeGameOverModal();
            if (settingsModal && settingsModal.style.display === 'flex') closeSettingsModal();
            if (intelModal && intelModal.style.display === 'flex') closeIntelModal();
        }
    });
}

function setupEmoteEventListeners() {
    if (hudEmoteTriggerBtn) {
        hudEmoteTriggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEmoteWheel();
        });
    }

    if (emoteWheelOverlay) {
        emoteWheelOverlay.querySelectorAll('.emote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const emoteId = btn.getAttribute('data-emote');
                if (emoteId) {
                    triggerEmote(emoteId);
                }
            });
        });

        emoteWheelOverlay.addEventListener('click', (e) => {
            if (e.target === emoteWheelOverlay) {
                closeEmoteWheel();
            }
        });
    }
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

    if (copyBattleReportBtn) {
        copyBattleReportBtn.addEventListener('click', copyBattleReport);
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

function setupAudioEventListeners() {
    if (soundToggleBtn) {
        updateSoundButtonUi(soundEngine.isMuted());
        soundToggleBtn.addEventListener('click', () => {
            soundEngine.init();
            const muted = soundEngine.toggleMute();
            updateSoundButtonUi(muted);
        });
    }
}

function setupSettingsEventListeners() {
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', openSettingsModal);
    }
    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    }
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', closeSettingsModal);
    }
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }

    if (masterVolumeRange) {
        masterVolumeRange.value = Math.round(soundEngine.masterVolume * 100);
        if (masterVolDisplay) masterVolDisplay.textContent = masterVolumeRange.value + '%';
        masterVolumeRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (masterVolDisplay) masterVolDisplay.textContent = val + '%';
            soundEngine.setMasterVolume(val / 100);
        });
    }

    if (sfxVolumeRange) {
        sfxVolumeRange.value = Math.round(soundEngine.sfxVolume * 100);
        if (sfxVolDisplay) sfxVolDisplay.textContent = sfxVolumeRange.value + '%';
        sfxVolumeRange.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            if (sfxVolDisplay) sfxVolDisplay.textContent = val + '%';
            soundEngine.setSfxVolume(val / 100);
        });
    }

    if (ambientDroneToggle) {
        const droneEnabled = localStorage.getItem('battle_arena_drone_enabled') === 'true';
        ambientDroneToggle.checked = droneEnabled;
        if (droneEnabled && !soundEngine.isMuted()) {
            soundEngine.startAmbientDrone();
        }
        ambientDroneToggle.addEventListener('change', (e) => {
            localStorage.setItem('battle_arena_drone_enabled', String(e.target.checked));
            if (e.target.checked) {
                soundEngine.startAmbientDrone();
            } else {
                soundEngine.stopAmbientDrone();
            }
        });
    }

    if (screenShakeToggle) {
        screenShakeToggle.checked = screenShakeEnabled;
        screenShakeToggle.addEventListener('change', (e) => {
            screenShakeEnabled = e.target.checked;
            localStorage.setItem('battle_arena_screenshake', String(screenShakeEnabled));
        });
    }

    if (modalSoundToggleBtn) {
        modalSoundToggleBtn.addEventListener('click', () => {
            soundEngine.init();
            const muted = soundEngine.toggleMute();
            updateSoundButtonUi(muted);
        });
    }
}

function openSettingsModal() {
    if (!settingsModal) return;
    settingsModal.style.display = 'flex';
    updateSoundButtonUi(soundEngine.isMuted());
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.style.display = 'none';
}

function setupIntelEventListeners() {
    if (openIntelBtn) {
        openIntelBtn.addEventListener('click', openIntelModal);
    }
    if (closeIntelModalBtn) {
        closeIntelModalBtn.addEventListener('click', closeIntelModal);
    }
    if (intelModal) {
        intelModal.addEventListener('click', (e) => {
            if (e.target === intelModal) closeIntelModal();
        });
    }

    function switchIntelTab(activeTab) {
        [tabIntelControlsBtn, tabIntelClassesBtn, tabIntelHazardsBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (intelControlsSection) intelControlsSection.style.display = 'none';
        if (intelClassesSection) intelClassesSection.style.display = 'none';
        if (intelHazardsSection) intelHazardsSection.style.display = 'none';

        if (activeTab === 'controls') {
            if (tabIntelControlsBtn) tabIntelControlsBtn.classList.add('active');
            if (intelControlsSection) intelControlsSection.style.display = 'block';
        } else if (activeTab === 'classes') {
            if (tabIntelClassesBtn) tabIntelClassesBtn.classList.add('active');
            if (intelClassesSection) intelClassesSection.style.display = 'block';
        } else if (activeTab === 'hazards') {
            if (tabIntelHazardsBtn) tabIntelHazardsBtn.classList.add('active');
            if (intelHazardsSection) intelHazardsSection.style.display = 'block';
        }
    }

    if (tabIntelControlsBtn) tabIntelControlsBtn.addEventListener('click', () => switchIntelTab('controls'));
    if (tabIntelClassesBtn) tabIntelClassesBtn.addEventListener('click', () => switchIntelTab('classes'));
    if (tabIntelHazardsBtn) tabIntelHazardsBtn.addEventListener('click', () => switchIntelTab('hazards'));
}

function openIntelModal() {
    if (intelModal) intelModal.style.display = 'flex';
}

function closeIntelModal() {
    if (intelModal) intelModal.style.display = 'none';
}

function setupCareerTabsEventListeners() {
    if (tabMatchLogsBtn) {
        tabMatchLogsBtn.addEventListener('click', () => {
            tabMatchLogsBtn.classList.add('active');
            if (tabAchievementsBtn) tabAchievementsBtn.classList.remove('active');
            if (matchRecordsSection) matchRecordsSection.style.display = 'block';
            if (achievementsSection) achievementsSection.style.display = 'none';
        });
    }

    if (tabAchievementsBtn) {
        tabAchievementsBtn.addEventListener('click', () => {
            tabAchievementsBtn.classList.add('active');
            if (tabMatchLogsBtn) tabMatchLogsBtn.classList.remove('active');
            if (matchRecordsSection) matchRecordsSection.style.display = 'none';
            if (achievementsSection) achievementsSection.style.display = 'block';
            renderAchievementsGrid();
        });
    }
}

function setupChatEventListeners() {
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                chatInput.blur();
            }
        });
    }
    if (chatInputForm) {
        chatInputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!chatInput) return;
            const text = chatInput.value.trim();
            if (text && gameWs && gameWs.readyState === WebSocket.OPEN) {
                gameWs.send(JSON.stringify({ type: 'CHAT', text }));
                chatInput.value = '';
                chatInput.blur();
            }
        });
    }
}

// --- Application Bootstrap ---
window.addEventListener('DOMContentLoaded', () => {
    setupAuthEventListeners();
    setupRoomEventListeners();
    setupLeaderboardEventListeners();
    setupAudioEventListeners();
    setupSettingsEventListeners();
    setupIntelEventListeners();
    setupCareerTabsEventListeners();
    setupChatEventListeners();
    setupEmoteEventListeners();
    checkBackendHealth();
    verifyExistingSession().then(() => {
        checkMyCurrentRoom();
        fetchRoomsList();
    });
    requestAnimationFrame(gameLoop);
});
