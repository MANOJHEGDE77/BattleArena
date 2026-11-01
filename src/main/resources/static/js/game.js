
function updateHomeIntelDock(profile) {
    if (!profile) return;
    try {
        const lvl = profile.level || 1;
        const xp = profile.xp || 0;
        const xpInLevel = xp % 1000;
        const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100));
        const kills = profile.kills || 0;
        const deaths = profile.deaths || 0;
        const kdRatio = (kills / Math.max(1, deaths)).toFixed(2);
        const games = profile.totalGames || 0;
        const wins = profile.wins || 0;
        const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

        const homeLevel = document.getElementById('homeIntelLevel');
        const homeXpFill = document.getElementById('homeIntelXpFill');
        const homeXpText = document.getElementById('homeIntelXpText');
        const homeKd = document.getElementById('homeIntelKd');
        const homeKdSub = document.getElementById('homeIntelKdSub');
        const homeWinRate = document.getElementById('homeIntelWinRate');
        const homeRecordSub = document.getElementById('homeIntelRecordSub');
        const homeHighScore = document.getElementById('homeIntelHighScore');
        const homeScoreSub = document.getElementById('homeIntelScoreSub');
        const intelRankBadge = document.getElementById('intelRankBadge');

        if (homeLevel) homeLevel.textContent = `LVL ${lvl}`;
        if (homeXpFill) homeXpFill.style.width = `${xpPct}%`;
        if (homeXpText) homeXpText.textContent = `${xpInLevel} / 1000 XP (${xp} Total)`;
        if (homeKd) homeKd.textContent = kdRatio;
        if (homeKdSub) homeKdSub.textContent = `${kills} Kills / ${deaths} Deaths`;
        if (homeWinRate) homeWinRate.textContent = `${winRate}%`;
        if (homeRecordSub) homeRecordSub.textContent = `${wins} Wins / ${games} Battles`;
        if (homeHighScore) homeHighScore.textContent = profile.highestScore || 0;
        if (homeScoreSub) homeScoreSub.textContent = `${profile.totalScore || 0} Total Career Pts`;
        if (intelRankBadge) intelRankBadge.textContent = `RANK: ${profile.equippedTitle || 'RECRUIT'}`;
    } catch (e) {
        console.warn('Failed to update Home Intel Dock:', e);
    }
}

/**
 * Battle Arena - Phase 2: Game Loop, Vector Rendering & Collision Engine
 * Low-Resource Architecture: 0 image assets, 0 external libraries, pure Canvas 2D.
 */

// --- Canvas & DOM Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Resolution & High-DPI Display Scaling ---
const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function updateCanvasScaling() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const container = canvas.parentElement || document.getElementById('canvasContainer');
    const displayW = container && container.clientWidth > 0 ? container.clientWidth : (canvas.clientWidth > 0 ? canvas.clientWidth : ARENA_WIDTH);
    const displayH = container && container.clientHeight > 0 ? container.clientHeight : (canvas.clientHeight > 0 ? canvas.clientHeight : ARENA_HEIGHT);
    canvas.width = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
}
updateCanvasScaling();
window.addEventListener('resize', updateCanvasScaling);

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
        speed: 250,
        cooldownMs: 280,
        damage: 20,
        bulletSpeed: 620,
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
        speed: 205,
        cooldownMs: 440,
        damage: 35,
        bulletSpeed: 500,
        weaponName: 'Plasma Cannon',
        color: '#f59e0b',
        accentColor: '#fbbf24',
        projectileRadius: 8
    },
    SCOUT: {
        name: 'SCOUT',
        badgeText: 'SCOUT (Twin Needles)',
        icon: '⚡',
        maxHp: 80,
        maxShield: 40,
        speed: 300,
        cooldownMs: 200,
        damage: 15,
        bulletSpeed: 720,
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
        speed: 230,
        cooldownMs: 560,
        damage: 45,
        bulletSpeed: 920,
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
        currentSelectedClassBadge.textContent = `${className} (${cInfo.weaponName})`;
    }
    const heroChassisSpec = document.getElementById('heroChassisSpec');
    if (heroChassisSpec) {
        heroChassisSpec.textContent = `MARK-IV ${className}`;
    }
    const hangarOperatorTitle = document.getElementById('hangarOperatorTitle');
    if (hangarOperatorTitle) {
        hangarOperatorTitle.textContent = className;
    }
    const hangarOperatorRole = document.getElementById('hangarOperatorRole');
    if (hangarOperatorRole) {
        hangarOperatorRole.textContent = cInfo.description || cInfo.badgeText;
    }

    // Update Signature Tactical Ability Card in Hangar
    if (typeof HERO_ABILITIES !== 'undefined' && HERO_ABILITIES[className]) {
        const ability = HERO_ABILITIES[className];
        const hIcon = document.getElementById('hangarAbilityIcon');
        const hName = document.getElementById('hangarAbilityName');
        const hCd = document.getElementById('hangarAbilityCd');
        const hDesc = document.getElementById('hangarAbilityDesc');
        if (hIcon) hIcon.textContent = ability.icon;
        if (hName) hName.textContent = ability.name;
        if (hCd) hCd.textContent = `${Math.round(ability.cooldownMs / 1000)}s CD`;
        if (hDesc) hDesc.textContent = ability.desc;
    }

    // Update Dossier Stat Meters
    const hpMeter = document.getElementById('operatorHpMeter');
    const hpVal = document.getElementById('operatorHpVal');
    if (hpMeter) hpMeter.style.width = `${Math.min(100, Math.round((cInfo.maxHp / 150) * 100))}%`;
    if (hpVal) hpVal.textContent = `${cInfo.maxHp} HP`;

    const shieldMeter = document.getElementById('operatorShieldMeter');
    const shieldVal = document.getElementById('operatorShieldVal');
    if (shieldMeter) shieldMeter.style.width = `${Math.min(100, Math.round((cInfo.maxShield / 75) * 100))}%`;
    if (shieldVal) shieldVal.textContent = `${cInfo.maxShield} SHD`;

    const spdMeter = document.getElementById('operatorSpeedMeter');
    const spdVal = document.getElementById('operatorSpeedVal');
    if (spdMeter) spdMeter.style.width = `${Math.min(100, Math.round((cInfo.speed / 290) * 100))}%`;
    if (spdVal) spdVal.textContent = `${cInfo.speed} px/s`;

    const dmgMeter = document.getElementById('operatorDamageMeter');
    const dmgVal = document.getElementById('operatorDamageVal');
    const dmgMap = { ASSAULT: 20, JUGGERNAUT: 35, SCOUT: 14, SNIPER: 45 };
    const dmg = dmgMap[className] || 20;
    if (dmgMeter) dmgMeter.style.width = `${Math.min(100, Math.round((dmg / 45) * 100))}%`;
    if (dmgVal) dmgVal.textContent = `${dmg} DMG`;

    const projMeter = document.getElementById('operatorProjSpeedMeter');
    const projVal = document.getElementById('operatorProjSpeedVal');
    const projMap = { ASSAULT: 650, JUGGERNAUT: 420, SCOUT: 620, SNIPER: 820 };
    const pSpeed = projMap[className] || 650;
    if (projMeter) projMeter.style.width = `${Math.min(100, Math.round((pSpeed / 820) * 100))}%`;
    if (projVal) projVal.textContent = `${pSpeed} px/s`;

    const hudWeaponName = document.getElementById('hudWeaponName');
    if (hudWeaponName) hudWeaponName.textContent = cInfo.weaponName;

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
        hudClass.textContent = className;
        hudClass.title = cInfo.weaponName;
    }
    const stagingClassPills = document.getElementById('stagingClassPills');
    if (stagingClassPills) {
        stagingClassPills.querySelectorAll('.staging-class-pill').forEach(pill => {
            if (pill.getAttribute('data-class') === className) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
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

// --- Parallax Mouse Tracking for Living 3D Ship Showcase ---
let heroParallaxX = 0;
let heroParallaxY = 0;
let heroSmoothTiltX = 0;
let heroSmoothTiltY = 0;
const heroThrusterSparks = [];

window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    heroParallaxX = (e.clientX - cx) / cx;
    heroParallaxY = (e.clientY - cy) / cy;
});

// --- Cinematic Procedural Hero Operator Renderer for Menus (Living 3D Showcase) ---
function renderHeroChassis(targetCanvas, className, time) {
    if (!targetCanvas) return;
    const hCtx = targetCanvas.getContext('2d');
    if (!hCtx) return;

    const w = targetCanvas.width;
    const h = targetCanvas.height;
    hCtx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const cInfo = WARRIOR_CLASSES[className] || WARRIOR_CLASSES.ASSAULT;
    const primaryColor = cInfo.color || '#10b981';
    const accentColor = cInfo.accentColor || '#34d399';

    // Smooth lerp mouse parallax tilt
    heroSmoothTiltX += (heroParallaxX - heroSmoothTiltX) * 0.08;
    heroSmoothTiltY += (heroParallaxY - heroSmoothTiltY) * 0.08;

    // Idle floating bob
    const floatY = Math.sin(time * 0.002) * 7;

    hCtx.save();
    hCtx.translate(cx, cy + floatY);

    // Living 3D perspective tilt
    hCtx.transform(1, heroSmoothTiltY * 0.05, heroSmoothTiltX * 0.05, 1, 0, 0);

    // Idle breathing & chassis scale
    const breath = 1 + Math.sin(time * 0.0025) * 0.02;
    const chassisScale = targetCanvas.id === 'hangarOperatorCanvas' ? 1.75 : 1.62;
    hCtx.scale(chassisScale * breath, chassisScale * breath);

    // 1. Ambient back-glow
    const bgGrad = hCtx.createRadialGradient(0, 0, 10, 0, 0, 190);
    bgGrad.addColorStop(0, primaryColor + '28');
    bgGrad.addColorStop(0.5, primaryColor + '08');
    bgGrad.addColorStop(1, 'transparent');
    hCtx.fillStyle = bgGrad;
    hCtx.beginPath();
    hCtx.arc(0, 0, 190, 0, Math.PI * 2);
    hCtx.fill();

    // 2. Rotating holographic 3D gimbal orbit rings
    hCtx.save();
    hCtx.rotate(time * 0.0004);
    hCtx.strokeStyle = 'rgba(22, 200, 242, 0.2)';
    hCtx.lineWidth = 1.5;
    hCtx.setLineDash([14, 8, 4, 8]);
    hCtx.beginPath();
    hCtx.arc(0, 0, 135, 0, Math.PI * 2);
    hCtx.stroke();
    hCtx.restore();

    hCtx.save();
    hCtx.rotate(-time * 0.0003);
    hCtx.strokeStyle = primaryColor + '38';
    hCtx.lineWidth = 1;
    hCtx.setLineDash([22, 14]);
    hCtx.beginPath();
    hCtx.arc(0, 0, 160, 0, Math.PI * 2);
    hCtx.stroke();
    hCtx.restore();

    // Cardinal calibration ticks
    hCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    hCtx.lineWidth = 1.5;
    hCtx.setLineDash([]);
    const tickLen = 8;
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
        const x1 = Math.cos(angle) * 120;
        const y1 = Math.sin(angle) * 120;
        const x2 = Math.cos(angle) * (120 + tickLen);
        const y2 = Math.sin(angle) * (120 + tickLen);
        hCtx.beginPath();
        hCtx.moveTo(x1, y1);
        hCtx.lineTo(x2, y2);
        hCtx.stroke();
    });

    // 3. Dynamic engine thruster particles
    const thrusterOffset = 42;
    if (Math.random() < 0.55 && heroThrusterSparks.length < 40) {
        [-14, 14].forEach(xOff => {
            heroThrusterSparks.push({
                x: xOff + (Math.random() - 0.5) * 6,
                y: thrusterOffset + 2,
                vx: (Math.random() - 0.5) * 10,
                vy: Math.random() * 25 + 30,
                alpha: 1,
                size: Math.random() * 2.2 + 1.2,
                color: primaryColor
            });
        });
    }

    // Render thruster sparks
    for (let i = heroThrusterSparks.length - 1; i >= 0; i--) {
        const p = heroThrusterSparks[i];
        p.x += p.vx * 0.03;
        p.y += p.vy * 0.03;
        p.alpha -= 0.04;
        if (p.alpha <= 0) {
            heroThrusterSparks.splice(i, 1);
            continue;
        }
        hCtx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        hCtx.beginPath();
        hCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        hCtx.fill();
    }

    // Core thruster exhaust flame
    const flameLen = 28 + Math.sin(time * 0.02) * 9;
    const thrusterGrad = hCtx.createLinearGradient(0, thrusterOffset, 0, thrusterOffset + flameLen);
    thrusterGrad.addColorStop(0, '#ffffff');
    thrusterGrad.addColorStop(0.25, primaryColor);
    thrusterGrad.addColorStop(1, 'transparent');

    hCtx.fillStyle = thrusterGrad;
    [-14, 14].forEach(xOff => {
        hCtx.beginPath();
        hCtx.moveTo(xOff - 5, thrusterOffset);
        hCtx.lineTo(xOff, thrusterOffset + flameLen);
        hCtx.lineTo(xOff + 5, thrusterOffset);
        hCtx.closePath();
        hCtx.fill();
    });

    // 4. Hero Fighter Hull Geometry
    hCtx.shadowColor = primaryColor;
    hCtx.shadowBlur = 18;

    if (className === 'ASSAULT') {
        // Vanguard Diamond Chassis with layered armor plates
        hCtx.fillStyle = '#0f172a';
        hCtx.strokeStyle = primaryColor;
        hCtx.lineWidth = 3;

        hCtx.beginPath();
        hCtx.moveTo(0, -50);
        hCtx.lineTo(36, 16);
        hCtx.lineTo(26, 42);
        hCtx.lineTo(0, 34);
        hCtx.lineTo(-26, 42);
        hCtx.lineTo(-36, 16);
        hCtx.closePath();
        hCtx.fill();
        hCtx.stroke();

        // Armored Wing Plates & Cockpit Canopy
        hCtx.fillStyle = primaryColor + '35';
        hCtx.beginPath();
        hCtx.moveTo(0, -32);
        hCtx.lineTo(22, 10);
        hCtx.lineTo(0, 24);
        hCtx.lineTo(-22, 10);
        hCtx.closePath();
        hCtx.fill();

        // Forward Dual Pulse Cannons
        hCtx.fillStyle = primaryColor;
        hCtx.fillRect(-5, -58, 4, 18);
        hCtx.fillRect(1, -58, 4, 18);
    } else if (className === 'JUGGERNAUT') {
        // Heavy Titan Dreadnought Bulkhead
        hCtx.fillStyle = '#1e1b18';
        hCtx.strokeStyle = primaryColor;
        hCtx.lineWidth = 4;

        hCtx.beginPath();
        hCtx.moveTo(-30, -38);
        hCtx.lineTo(30, -38);
        hCtx.lineTo(48, 12);
        hCtx.lineTo(34, 44);
        hCtx.lineTo(-34, 44);
        hCtx.lineTo(-48, 12);
        hCtx.closePath();
        hCtx.fill();
        hCtx.stroke();

        // Dual Heavy Plasma Barrels
        hCtx.fillStyle = primaryColor;
        hCtx.fillRect(-20, -56, 9, 24);
        hCtx.fillRect(11, -56, 9, 24);

        // Armor Plates
        hCtx.fillStyle = primaryColor + '38';
        hCtx.fillRect(-24, -16, 48, 26);
    } else if (className === 'SCOUT') {
        // Hyper Agile Delta Wing
        hCtx.fillStyle = '#180f24';
        hCtx.strokeStyle = primaryColor;
        hCtx.lineWidth = 2.5;

        hCtx.beginPath();
        hCtx.moveTo(0, -54);
        hCtx.lineTo(42, 28);
        hCtx.lineTo(18, 40);
        hCtx.lineTo(0, 30);
        hCtx.lineTo(-18, 40);
        hCtx.lineTo(-42, 28);
        hCtx.closePath();
        hCtx.fill();
        hCtx.stroke();

        // Twin Needle Barrels
        hCtx.fillStyle = primaryColor;
        hCtx.fillRect(-16, -48, 3, 22);
        hCtx.fillRect(13, -48, 3, 22);
    } else if (className === 'SNIPER') {
        // Precision Long-Range Rail Chassis
        hCtx.fillStyle = '#091522';
        hCtx.strokeStyle = primaryColor;
        hCtx.lineWidth = 2.5;

        hCtx.beginPath();
        hCtx.moveTo(0, -64);
        hCtx.lineTo(24, 12);
        hCtx.lineTo(18, 44);
        hCtx.lineTo(-18, 44);
        hCtx.lineTo(-24, 12);
        hCtx.closePath();
        hCtx.fill();
        hCtx.stroke();

        // Extended Hyper Railgun Barrel
        hCtx.fillStyle = '#ffffff';
        hCtx.fillRect(-2, -76, 4, 32);

        // Magnetic Coil Rings
        hCtx.fillStyle = primaryColor;
        [-68, -58, -48].forEach(yPos => {
            hCtx.fillRect(-6, yPos, 12, 3);
        });

        // Laser Sight Beam
        hCtx.strokeStyle = 'rgba(22, 200, 242, 0.45)';
        hCtx.lineWidth = 1.2;
        hCtx.beginPath();
        hCtx.moveTo(0, -76);
        hCtx.lineTo(0, -150);
        hCtx.stroke();
    }

    // 5. Glowing Central Fusion Reactor
    hCtx.shadowBlur = 24;
    hCtx.shadowColor = accentColor;
    const coreGrad = hCtx.createRadialGradient(0, 0, 1, 0, 0, 13);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.6, accentColor);
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    hCtx.fillStyle = coreGrad;
    hCtx.beginPath();
    hCtx.arc(0, 0, 13, 0, Math.PI * 2);
    hCtx.fill();

    hCtx.restore();

    // Update Floating Holographic Spec Card
    if (targetCanvas.id === 'heroShowcaseCanvas') {
        const specPill = document.getElementById('heroSpecClassPill');
        const weaponPill = document.getElementById('heroSpecWeaponPill');
        const dmgFill = document.getElementById('heroSpecDmg');
        const spdFill = document.getElementById('heroSpecSpd');
        const hpFill = document.getElementById('heroSpecHp');
        const rofFill = document.getElementById('heroSpecRof');
        if (specPill) specPill.textContent = className;
        if (weaponPill) weaponPill.textContent = cInfo.weaponName;
        if (dmgFill) dmgFill.style.width = `${Math.min(100, (cInfo.damage / 45) * 100)}%`;
        if (spdFill) spdFill.style.width = `${Math.min(100, (cInfo.speed / 300) * 100)}%`;
        if (hpFill) hpFill.style.width = `${Math.min(100, (cInfo.maxHp / 150) * 100)}%`;
        if (rofFill) rofFill.style.width = `${Math.min(100, (1000 / cInfo.cooldownMs) * 20)}%`;
    }
}

function renderHeroCanvases(time) {
    const activeClass = mySelectedClass || 'ASSAULT';
    const heroShowcaseCanvas = document.getElementById('heroShowcaseCanvas');
    if (heroShowcaseCanvas && heroShowcaseCanvas.offsetParent !== null) {
        renderHeroChassis(heroShowcaseCanvas, activeClass, time);
    }
    const hangarOperatorCanvas = document.getElementById('hangarOperatorCanvas');
    if (hangarOperatorCanvas && hangarOperatorCanvas.offsetParent !== null) {
        renderHeroChassis(hangarOperatorCanvas, activeClass, time);
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
        this.lastHeartbeatTime = 0;
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

    playShieldBreak() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(1800, now);
            osc1.frequency.exponentialRampToValueAtTime(120, now + 0.32);

            osc2.type = 'square';
            osc2.frequency.setValueAtTime(950, now);
            osc2.frequency.exponentialRampToValueAtTime(60, now + 0.28);

            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.95, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.33);
            osc2.stop(now + 0.33);
        } catch {}
    }

    playDryFire() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.setValueAtTime(260, now + 0.025);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        } catch {}
    }

    playHeartbeat() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            [0, 0.12].forEach((offset, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + offset;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(idx === 0 ? 68 : 52, t);
                osc.frequency.exponentialRampToValueAtTime(28, t + 0.14);
                gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.75, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.15);
            });
        } catch {}
    }

    updateHeartbeat(active) {
        if (!active || this.muted) return;
        const now = performance.now();
        if (now - this.lastHeartbeatTime >= 950) {
            this.lastHeartbeatTime = now;
            this.playHeartbeat();
        }
    }

    playKillstreak(count) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const freqs = count >= 3 ? [440, 554.37, 659.25, 880] : [392, 523.25, 659.25];
            freqs.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + i * 0.07;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.7, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.32);
            });
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

    playUiHover() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2400, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.015);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.016);
        } catch {}
    }

    playUiClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(750, now);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.036);
        } catch {}
    }

    playUiDeploy() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(320, now + 0.25);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.42);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.43);
        } catch {}
    }

    playEmote() {
        this.playUiDeploy();
    }

    playGameStart() {
        this.playUiDeploy();
    }

    playKillcam() {
        this.playKillSting();
    }

    playLevelUp() {
        this.playAchievementUnlocked();
    }

    playGameOver() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.52);
        } catch {}
    }

    playHitmarker(isCrit = false) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = isCrit ? 'square' : 'triangle';
            const baseFreq = isCrit ? 2800 : 2100;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(isCrit ? 1400 : 950, now + 0.026);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * (isCrit ? 0.65 : 0.45), now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.028);
        } catch {}
    }

    playKillSting() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(140, now);
            subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
            subGain.gain.setValueAtTime(this.getEffectiveVolume() * 0.8, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            subOsc.connect(subGain);
            subGain.connect(this.ctx.destination);
            subOsc.start(now);
            subOsc.stop(now + 0.36);

            const chord = [523.25, 659.25, 783.99, 1046.5];
            chord.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + i * 0.04;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.45, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.4);
            });
        } catch {}
    }

    playAbilityStim() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.26);
        } catch {}
    }

    playAbilityShockwave() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 0.45);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.95, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        } catch {}
    }

    playAbilityBlink() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.19);
        } catch {}
    }

    playAbilityRailBeam() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(95, now + 0.38);
            gain.gain.setValueAtTime(this.getEffectiveVolume() * 0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.42);
        } catch {}
    }
}

const soundEngine = new SoundEngine();

// Tactical UI Audio Feedback for all interactive buttons
let lastUiHoverTime = 0;
document.addEventListener('mouseover', (e) => {
    const btn = e.target.closest('button, [role="button"], .nav-tab, .diff-pill, .mode-card, .class-card, .filter-pill, .staging-class-pill');
    if (!btn) return;
    const now = performance.now();
    if (now - lastUiHoverTime > 55) {
        lastUiHoverTime = now;
        soundEngine.playUiHover();
    }
}, { passive: true });

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, [role="button"], .nav-tab, .diff-pill, .mode-card, .class-card, .filter-pill, .staging-class-pill');
    if (!btn) return;
    if (btn.id === 'giantPlayNowBtn' || btn.classList.contains('btn-launch-match') || btn.classList.contains('btn-primary-launch')) {
        soundEngine.playUiDeploy();
    } else {
        soundEngine.playUiClick();
    }
}, { passive: true });

function updateSoundButtonUi(isMuted) {
    if (!soundToggleBtn) return;
    if (isMuted) {
        soundToggleBtn.innerHTML = '🔇 <span id="soundToggleText">Sound: OFF</span>';
        soundToggleBtn.classList.add('muted');
        soundToggleBtn.title = 'Audio Synthesizer Muted (Click to Unmute)';
    } else {
        soundToggleBtn.innerHTML = '<span class="sound-eq-icon active"><span></span><span></span><span></span></span> <span id="soundToggleText">Sound: ON</span>';
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
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    radius: 16,
    speed: 240, // pixels per second
    heading: 0, // radians
    color: '#6366f1',
    accentColor: '#818cf8',
    warriorClass: 'ASSAULT',
    name: 'Guest',
    equippedTitle: 'RECRUIT',
    equippedTrail: 'CYAN_PULSE',
    health: 100,
    maxHealth: 100,
    shield: 0,
    maxShield: 50,
    speedBoostUntil: 0,
    spreadShotUntil: 0,
    alive: true,
    kills: 0,
    deaths: 0,
    lastAttackTime: 0,
    recoilDist: 0,
    recoilAngle: 0,
    damageFlashTimer: 0
};

let playerVx = 0;
let playerVy = 0;

// --- Input Manager ---
const activeKeys = new Set();
let touchMoveVector = { x: 0, y: 0 };

window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) return;
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
            triggerClassAbility();
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

window.addEventListener('blur', () => {
    activeKeys.clear();
    isPointerDown = false;
});

let lastAimX = null;
let lastAimY = null;
let isPointerDown = false;

// Hero Tactical Abilities System
const HERO_ABILITIES = {
    ASSAULT: {
        name: 'OVERCHARGE STIM',
        icon: '⚡',
        cooldownMs: 10000,
        desc: '+40% Speed & 2x Rapid Fire for 4.5s',
        keybind: 'SPACE / R-CLICK'
    },
    JUGGERNAUT: {
        name: 'KINETIC SHOCKWAVE',
        icon: '🛡️',
        cooldownMs: 12000,
        desc: '160px EMP wave reflects shots, 35 dmg + knockback & +50 Shield',
        keybind: 'SPACE / R-CLICK'
    },
    SCOUT: {
        name: 'PHASE BLINK DASH',
        icon: '🌀',
        cooldownMs: 7000,
        desc: '170px phase teleport with 0.8s invulnerability',
        keybind: 'SPACE / R-CLICK'
    },
    SNIPER: {
        name: 'PIERCING RAIL BEAM',
        icon: '🎯',
        cooldownMs: 12000,
        desc: 'Penetrating hyper-velocity laser beam dealing 70 damage',
        keybind: 'SPACE / R-CLICK'
    }
};

let heroAbilityState = {
    lastUsed: -99999,
    cooldownMs: 10000
};

const railBeams = [];

function addRailBeamEffect(startX, startY, endX, endY) {
    railBeams.push({
        startX,
        startY,
        endX,
        endY,
        life: 0.35,
        maxLife: 0.35
    });
}

function renderRailBeams(dt) {
    if (railBeams.length === 0) return;
    ctx.save();
    for (let i = railBeams.length - 1; i >= 0; i--) {
        const rb = railBeams[i];
        rb.life -= dt;
        if (rb.life <= 0) {
            railBeams.splice(i, 1);
            continue;
        }
        const alpha = Math.max(0, rb.life / rb.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer neon aura
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
        ctx.lineWidth = 14 * alpha;
        ctx.beginPath();
        ctx.moveTo(rb.startX, rb.startY);
        ctx.lineTo(rb.endX, rb.endY);
        ctx.stroke();

        // High intensity core beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 * alpha;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(rb.startX, rb.startY);
        ctx.lineTo(rb.endX, rb.endY);
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();
}

function triggerClassAbility() {
    if (isGameOver || !player.alive || isSpectator) return;
    const now = performance.now();
    const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
    const abilityDef = HERO_ABILITIES[currentClass] || HERO_ABILITIES.ASSAULT;

    if (now - heroAbilityState.lastUsed < (heroAbilityState.cooldownMs || abilityDef.cooldownMs)) {
        return;
    }

    heroAbilityState.lastUsed = now;
    heroAbilityState.cooldownMs = abilityDef.cooldownMs;

    if (currentClass === 'ASSAULT') {
        player.stimUntil = Date.now() + 4500;
        soundEngine.playAbilityStim();
        triggerScreenShake(3, 0.15);
        addShockwave(player.x, player.y, 60, '#00f2fe');
        addFloatingText('⚡ OVERCHARGE STIM!', player.x, player.y - 25, '#00f2fe', true);
        if (gameWs && gameWs.readyState === WebSocket.OPEN && (!pvpEmulator || !pvpEmulator.isActive)) {
            gameWs.send(JSON.stringify({ type: 'ABILITY', ability: 'OVERCHARGE_STIM' }));
        }
    } else if (currentClass === 'JUGGERNAUT') {
        soundEngine.playAbilityShockwave();
        triggerScreenShake(8, 0.25);
        addShockwave(player.x, player.y, 160, '#f59e0b');
        player.shield = Math.min((player.maxShield || 75), (player.shield || 0) + 50);
        addFloatingText('+50 SHIELD RESTORED', player.x, player.y - 25, '#38bdf8', true);

        if (pvpEmulator && pvpEmulator.isActive) {
            pvpEmulator.handleShockwave(player.x, player.y, 160, 35, player.name);
        }
        if (gameWs && gameWs.readyState === WebSocket.OPEN && (!pvpEmulator || !pvpEmulator.isActive)) {
            gameWs.send(JSON.stringify({ type: 'ABILITY', ability: 'KINETIC_SHOCKWAVE' }));
        }
    } else if (currentClass === 'SCOUT') {
        soundEngine.playAbilityBlink();
        addShockwave(player.x, player.y, 50, '#c084fc');

        const dashDist = 170;
        const targetX = player.x + Math.cos(player.heading) * dashDist;
        const targetY = player.y + Math.sin(player.heading) * dashDist;

        player.x = Math.max(player.radius + 4, Math.min(ARENA_WIDTH - player.radius - 4, targetX));
        player.y = Math.max(player.radius + 4, Math.min(ARENA_HEIGHT - player.radius - 4, targetY));
        resolveObstacleCollisions(player);

        player.invulnerableUntil = Date.now() + 800;
        addShockwave(player.x, player.y, 70, '#e879f9');
        addFloatingText('🌀 PHASE BLINK', player.x, player.y - 25, '#c084fc', true);

        if (gameWs && gameWs.readyState === WebSocket.OPEN && (!pvpEmulator || !pvpEmulator.isActive)) {
            gameWs.send(JSON.stringify({ type: 'ABILITY', ability: 'PHASE_BLINK', x: player.x, y: player.y }));
        }
    } else if (currentClass === 'SNIPER') {
        soundEngine.playAbilityRailBeam();
        triggerScreenShake(7, 0.2);

        const beamStartX = player.x + Math.cos(player.heading) * 20;
        const beamStartY = player.y + Math.sin(player.heading) * 20;
        const beamEndX = player.x + Math.cos(player.heading) * 900;
        const beamEndY = player.y + Math.sin(player.heading) * 900;

        addMuzzleFlash(player.x, player.y, player.heading, 'SNIPER');
        addRailBeamEffect(beamStartX, beamStartY, beamEndX, beamEndY);
        addFloatingText('🎯 PIERCING RAIL BEAM', player.x, player.y - 25, '#38bdf8', true);

        if (pvpEmulator && pvpEmulator.isActive) {
            pvpEmulator.handleRailBeam(beamStartX, beamStartY, beamEndX, beamEndY, 70, player.name);
        }
        if (gameWs && gameWs.readyState === WebSocket.OPEN && (!pvpEmulator || !pvpEmulator.isActive)) {
            gameWs.send(JSON.stringify({
                type: 'ABILITY',
                ability: 'RAIL_BEAM',
                startX: beamStartX,
                startY: beamStartY,
                endX: beamEndX,
                endY: beamEndY
            }));
        }
    }
}

function updateAbilityHud() {
    const hudBar = document.getElementById('hudAbilityBar');
    if (!hudBar) return;
    const isPlaying = ((activeRoom && activeRoom.status === 'PLAYING') || (pvpEmulator && pvpEmulator.isActive)) && !isGameOver;
    if (!isPlaying || isSpectator || !player.alive) {
        hudBar.style.display = 'none';
        return;
    }
    hudBar.style.display = 'flex';

    const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
    const ability = HERO_ABILITIES[currentClass] || HERO_ABILITIES.ASSAULT;

    const card = document.getElementById('classAbilityCard');
    const fill = document.getElementById('abilityCooldownFill');
    const icon = document.getElementById('abilityIcon');
    const name = document.getElementById('abilityName');
    const meta = document.getElementById('abilityMetaText');

    if (icon) icon.textContent = ability.icon;
    if (name) name.textContent = ability.name;

    const now = performance.now();
    const elapsed = now - heroAbilityState.lastUsed;
    const cd = heroAbilityState.cooldownMs || ability.cooldownMs;

    if (elapsed < cd) {
        const remainingSec = ((cd - elapsed) / 1000).toFixed(1);
        const progress = 1 - (elapsed / cd);
        if (fill) fill.style.transform = `scaleY(${progress})`;
        if (card) {
            card.classList.remove('ready');
            card.classList.add('cooldown');
        }
        if (meta) meta.textContent = `RECHARGING (${remainingSec}s)`;
    } else {
        if (fill) fill.style.transform = 'scaleY(0)';
        if (card) {
            card.classList.remove('cooldown');
            card.classList.add('ready');
        }
        if (meta) meta.textContent = 'READY [SPACE / R-CLICK]';
    }
}

// Canvas pointer tracking for real-time mouse-aim swivel
canvas.addEventListener('pointermove', (e) => {
    if (isGameOver || !player.alive || isSpectator) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;
    lastAimX = Math.max(0, Math.min(ARENA_WIDTH, (e.clientX - rect.left) * scaleX));
    lastAimY = Math.max(0, Math.min(ARENA_HEIGHT, (e.clientY - rect.top) * scaleY));
    player.heading = Math.atan2(lastAimY - player.y, lastAimX - player.x);
});

// Canvas pointer down for directional mouse-aim firing & abilities
canvas.addEventListener('pointerdown', (e) => {
    if (isGameOver || !player.alive || isSpectator) return;
    if (e.button === 2) {
        e.preventDefault();
        triggerClassAbility();
        return;
    }
    isPointerDown = true;
    try {
        canvas.setPointerCapture(e.pointerId);
    } catch (_) {}
    const rect = canvas.getBoundingClientRect();
    const scaleX = ARENA_WIDTH / rect.width;
    const scaleY = ARENA_HEIGHT / rect.height;
    lastAimX = Math.max(0, Math.min(ARENA_WIDTH, (e.clientX - rect.left) * scaleX));
    lastAimY = Math.max(0, Math.min(ARENA_HEIGHT, (e.clientY - rect.top) * scaleY));
    const heading = Math.atan2(lastAimY - player.y, lastAimX - player.x);
    player.heading = heading;
    fireBlaster(heading, false);
});

window.addEventListener('pointerup', (e) => {
    isPointerDown = false;
    try {
        if (e && e.pointerId && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
    } catch (_) {}
});

canvas.addEventListener('pointerenter', () => {
    if (!isSpectator && player.alive && !isGameOver) {
        canvas.classList.add('tactical-active');
    }
});

canvas.addEventListener('pointerleave', () => {
    if (!isPointerDown) {
        canvas.classList.remove('tactical-active');
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

function fireBlaster(targetHeading, isContinuous = false) {
    if (isGameOver || !player.alive || isSpectator) return;
    const isEmulating = pvpEmulator && pvpEmulator.isActive;
    if (!isEmulating) {
        if (!activeRoom || activeRoom.status !== 'PLAYING') return;
        if (!gameWs || gameWs.readyState !== WebSocket.OPEN) return;
    }

    const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
    const classInfo = WARRIOR_CLASSES[currentClass] || WARRIOR_CLASSES.ASSAULT;
    let cooldown = classInfo.cooldownMs;
    if (player.stimUntil && player.stimUntil > Date.now()) {
        cooldown *= 0.5;
    }

    const now = performance.now();
    if (now - player.lastAttackTime < cooldown) {
        // Tactical tactile click on manual trigger only, never during full-auto continuous fire
        if (!isContinuous && (!player._lastDryFire || now - player._lastDryFire > 180)) {
            player._lastDryFire = now;
            soundEngine.playDryFire();
        }
        return;
    }
    player.lastAttackTime = now;

    soundEngine.playLaser(player.spreadShotUntil > Date.now(), currentClass);

    const heading = targetHeading !== undefined ? targetHeading : player.heading;

    // Tactical Weapon Recoil & Muzzle Blast (Rock-steady gun feel)
    const kickback = currentClass === 'JUGGERNAUT' ? 4 : (currentClass === 'SNIPER' ? 6 : 2.5);
    player.recoilDist = kickback;
    player.recoilAngle = heading;
    if (currentClass === 'SNIPER' || currentClass === 'JUGGERNAUT') {
        triggerScreenShake(currentClass === 'SNIPER' ? 2.5 : 1.8, 0.06);
    }
    addMuzzleFlash(player.x, player.y, heading, currentClass);

    currentWeaponHeat = Math.min(100, currentWeaponHeat + (currentClass === 'SNIPER' ? 32 : (currentClass === 'JUGGERNAUT' ? 20 : 12)));
    updateOverheatGauge();

    if (isEmulating) {
        pvpEmulator.handlePlayerAttack(heading);
    } else {
        gameWs.send(JSON.stringify({
            type: 'ATTACK',
            heading: Math.round(heading * 100) / 100,
            equippedTrail: player.equippedTrail || 'CYAN_PULSE'
        }));
    }
}

// Clear keys and pointer state if window loses focus to avoid "stuck key" glitch
window.addEventListener('blur', () => {
    activeKeys.clear();
    isPointerDown = false;
    touchMoveVector = { x: 0, y: 0 };
});

// Update projectiles flight and client-side hit trigger
function updateProjectiles(dt) {
    const now = performance.now();
    projectiles.forEach((p, id) => {
        // Accumulate glowing motion trails
        p.trail = p.trail || [];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Boundary or lifetime expiration
        if (p.x < 0 || p.x > ARENA_WIDTH || p.y < 0 || p.y > ARENA_HEIGHT || (now - p.clientCreatedAt > 2200)) {
            projectiles.delete(id);
            return;
        }

        // Obstacle cover interception: bullet blocked by obstacle box
        if (obstacles.length > 0) {
            for (const obs of obstacles) {
                if (p.x >= obs.x && p.x <= obs.x + obs.width && p.y >= obs.y && p.y <= obs.y + obs.height) {
                    addFloatingText('✦', p.x, p.y, '#38bdf8');
                    addCombatSparks(p.x, p.y, '#38bdf8', 10);
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
                        addCombatSparks(hazard.x, hazard.y, '#f97316', 14);
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
                        addCombatSparks(rp.x, rp.y, '#f43f5e', 12);
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

    if (pvpEmulator && pvpEmulator.isActive) {
        pvpEmulator.update(dt);
    } else {
        updateProjectiles(dt);
    }

    // Remote players position & heading interpolation (lerp) for smooth 60fps rendering
    remotePlayers.forEach(rp => {
        if (rp.targetX !== undefined && rp.targetY !== undefined) {
            const lerpFactor = Math.min(1, 18 * dt);
            const dx = rp.targetX - rp.x;
            const dy = rp.targetY - rp.y;
            if (Math.hypot(dx, dy) > 200) {
                rp.x = rp.targetX;
                rp.y = rp.targetY;
            } else {
                rp.x += dx * lerpFactor;
                rp.y += dy * lerpFactor;
            }
        }
        if (rp.targetHeading !== undefined && rp.heading !== undefined) {
            let dHeading = rp.targetHeading - rp.heading;
            while (dHeading > Math.PI) dHeading -= Math.PI * 2;
            while (dHeading < -Math.PI) dHeading += Math.PI * 2;
            rp.heading += dHeading * Math.min(1, 18 * dt);
        }
    });

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

    // Incorporate Touch Virtual Joystick movement vector
    if (touchMoveVector && (touchMoveVector.x !== 0 || touchMoveVector.y !== 0)) {
        moveX += touchMoveVector.x;
        moveY += touchMoveVector.y;
    }

    // Update player heading angle based on mouse aim or movement direction (works moving or stationary)
    if (lastAimX !== null && lastAimY !== null) {
        player.heading = Math.atan2(lastAimY - player.y, lastAimX - player.x);
    } else if (moveX !== 0 || moveY !== 0) {
        player.heading = Math.atan2(moveY, moveX);
    }

    // Continuous automatic firing while holding mouse button down
    if (isPointerDown && !isGameOver && player.alive && !isSpectator) {
        fireBlaster(player.heading, true);
    }

    // Normalize diagonal movement vector so diagonal speed == straight speed
    const length = Math.hypot(moveX, moveY);
    if (length > 0) {
        moveX /= length;
        moveY /= length;
    }

    // Apply frame-rate independent displacement with smooth velocity dampening
    const nowMs = Date.now();
    const isSpeedBuffed = (player.speedBoostUntil > nowMs) || (player.stimUntil && player.stimUntil > nowMs);
    const effectiveSpeed = isSpeedBuffed ? player.speed * 1.4 : player.speed;
    const targetVx = moveX * effectiveSpeed;
    const targetVy = moveY * effectiveSpeed;

    const accel = length > 0 ? 46 : 38;
    const blend = Math.min(1, accel * dt);
    playerVx += (targetVx - playerVx) * blend;
    playerVy += (targetVy - playerVy) * blend;

    if (Math.abs(playerVx) > 0.4 || Math.abs(playerVy) > 0.4) {
        player.x += playerVx * dt;
        player.y += playerVy * dt;

        if (Math.random() < 0.65) {
            const currentC = player.warriorClass || mySelectedClass || 'ASSAULT';
            const cInfo = WARRIOR_CLASSES[currentC] || WARRIOR_CLASSES.ASSAULT;
            addThrusterParticle(player.x, player.y, player.heading, cInfo.accentColor);
        }

        // Arena boundary collision detection (clamping within walls)
        const minX = player.radius + 2;
        const maxX = ARENA_WIDTH - player.radius - 2;
        const minY = player.radius + 2;
        const maxY = ARENA_HEIGHT - player.radius - 2;

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
    } else {
        // Stationary: broadcast if player swiveled their aim by more than ~2.3 degrees (0.04 rad)
        if (Math.abs(player.heading - lastBroadcastHeading) > 0.04) {
            broadcastPlayerMovement();
        }
    }

    // Out-of-Combat Shield Regeneration (activates after 3.5s of taking no damage)
    if (player.alive && player.shield < player.maxShield) {
        const timeSinceDamage = Date.now() - (player.lastDamageTime || 0);
        if (timeSinceDamage >= 3500) {
            const prevShield = player.shield;
            player.shield = Math.min(player.maxShield, player.shield + 14 * dt);
            if (Math.floor(player.shield) !== Math.floor(prevShield)) {
                updateHudHealth();
            }
        }
    }

    // Update lightweight HUD
    hudPos.textContent = `X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`;
}

let lastBroadcastTime = 0;
let lastBroadcastHeading = 0;
function broadcastPlayerMovement(force = false) {
    if (!gameWs || gameWs.readyState !== WebSocket.OPEN || isSpectator) return;
    const now = performance.now();
    // Throttle to ~30 updates/sec to minimize bandwidth and CPU
    if (!force && now - lastBroadcastTime < 33) return;
    lastBroadcastTime = now;
    lastBroadcastHeading = player.heading;

    gameWs.send(JSON.stringify({
        type: 'MOVE',
        x: Math.round(player.x * 10) / 10,
        y: Math.round(player.y * 10) / 10,
        heading: Math.round(player.heading * 100) / 100
    }));
}

// --- Vector Rendering Engine (0 Images, Pure Canvas Geometry) ---
function renderArena() {
    const map = (activeRoom && activeRoom.mapId) ? activeRoom.mapId : 'CYBER_CORE';

    // 1. Clear background with deep cyber hue tailored to map
    if (map === 'NEON_OUTPOST') {
        ctx.fillStyle = '#0f0e1c';
    } else if (map === 'ORBITAL_STATION') {
        ctx.fillStyle = '#060a14';
    } else {
        ctx.fillStyle = '#0a0e1a';
    }
    ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // 2. High-tech cyber neon grid
    if (map === 'NEON_OUTPOST') {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.08)';
    } else if (map === 'ORBITAL_STATION') {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.07)';
    } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    }
    ctx.lineWidth = 1;
    const gridSize = 40;

    ctx.beginPath();
    for (let x = 0; x <= ARENA_WIDTH; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(ARENA_WIDTH, y);
    }
    ctx.stroke();

    // 2b. High-tech glowing grid intersection points
    ctx.fillStyle = map === 'NEON_OUTPOST' ? 'rgba(236, 72, 153, 0.2)' : (map === 'ORBITAL_STATION' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)');
    for (let x = gridSize; x < ARENA_WIDTH; x += gridSize * 2) {
        for (let y = gridSize; y < ARENA_HEIGHT; y += gridSize * 2) {
            ctx.fillRect(x - 1, y - 1, 2, 2);
        }
    }

    // 3. Center arena tactical radar rings & dynamic holographic sweep cone
    const cx = ARENA_WIDTH / 2;
    const cy = ARENA_HEIGHT / 2;
    const nowTime = performance.now();

    ctx.save();
    ctx.strokeStyle = map === 'NEON_OUTPOST' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(168, 85, 247, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating holographic radar sweep
    const sweepAngle = (nowTime * 0.001) % (Math.PI * 2);
    const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150);
    const sweepColor = map === 'NEON_OUTPOST' ? 'rgba(236, 72, 153, 0.14)' : (map === 'ORBITAL_STATION' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(56, 189, 248, 0.14)');
    sweepGrad.addColorStop(0, sweepColor);
    sweepGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 150, sweepAngle, sweepAngle + 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3b. Floating ambient cyber dust particles
    if (!window._ambientParticles) {
        window._ambientParticles = Array.from({ length: 22 }, () => ({
            x: Math.random() * ARENA_WIDTH,
            y: Math.random() * ARENA_HEIGHT,
            speed: 12 + Math.random() * 16,
            size: 1 + Math.random() * 1.6,
            alpha: 0.15 + Math.random() * 0.25
        }));
    }
    ctx.save();
    window._ambientParticles.forEach(p => {
        p.y -= p.speed * 0.016;
        if (p.y < 0) { p.y = ARENA_HEIGHT; p.x = Math.random() * ARENA_WIDTH; }
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    // 4. Glowing electric arena boundary walls
    ctx.save();
    const wallColor = map === 'NEON_OUTPOST' ? 'rgba(236, 72, 153, 0.7)' : (map === 'ORBITAL_STATION' ? 'rgba(245, 158, 11, 0.7)' : 'rgba(56, 189, 248, 0.7)');
    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = wallColor;
    ctx.shadowBlur = 8;
    ctx.strokeRect(2, 2, ARENA_WIDTH - 4, ARENA_HEIGHT - 4);

    // 5. Corner tactical bracket accents
    const cLen = 22;
    ctx.strokeStyle = map === 'NEON_OUTPOST' ? '#f43f5e' : (map === 'ORBITAL_STATION' ? '#f59e0b' : '#38bdf8');
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(2, 2 + cLen); ctx.lineTo(2, 2); ctx.lineTo(2 + cLen, 2);
    // Top-right
    ctx.moveTo(ARENA_WIDTH - 2 - cLen, 2); ctx.lineTo(ARENA_WIDTH - 2, 2); ctx.lineTo(ARENA_WIDTH - 2, 2 + cLen);
    // Bottom-left
    ctx.moveTo(2, ARENA_HEIGHT - 2 - cLen); ctx.lineTo(2, ARENA_HEIGHT - 2); ctx.lineTo(2 + cLen, ARENA_HEIGHT - 2);
    // Bottom-right
    ctx.moveTo(ARENA_WIDTH - 2 - cLen, ARENA_HEIGHT - 2); ctx.lineTo(ARENA_WIDTH - 2, ARENA_HEIGHT - 2); ctx.lineTo(ARENA_WIDTH - 2, ARENA_HEIGHT - 2 - cLen);
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
    ctx.rect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
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

// Line-of-sight obstacle occlusion test for tactical bot intelligence
function hasObstacleBetween(x1, y1, x2, y2) {
    if (!obstacles || obstacles.length === 0) return false;
    const steps = 8;
    for (let s = 1; s < steps; s++) {
        const px = x1 + (x2 - x1) * (s / steps);
        const py = y1 + (y2 - y1) * (s / steps);
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (px >= obs.x && px <= obs.x + obs.width && py >= obs.y && py <= obs.y + obs.height) {
                return true;
            }
        }
    }
    return false;
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

// Engine Thruster Particle Feedback System
const thrusterParticles = [];

function addThrusterParticle(x, y, heading, color) {
    const opp = heading + Math.PI + (Math.random() - 0.5) * 0.5;
    thrusterParticles.push({
        x: x - Math.cos(heading) * 12,
        y: y - Math.sin(heading) * 12,
        vx: Math.cos(opp) * (45 + Math.random() * 45),
        vy: Math.sin(opp) * (45 + Math.random() * 45),
        alpha: 0.85,
        color: color || '#38bdf8',
        size: 2.2 + Math.random() * 2
    });
}

function renderThrusters(dt) {
    if (thrusterParticles.length === 0) return;
    ctx.save();
    for (let i = thrusterParticles.length - 1; i >= 0; i--) {
        const tp = thrusterParticles[i];
        tp.x += tp.vx * dt;
        tp.y += tp.vy * dt;
        tp.alpha -= dt * 4.0;
        tp.size = Math.max(0.4, tp.size - dt * 2.5);
        if (tp.alpha <= 0) {
            thrusterParticles.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = Math.max(0, tp.alpha);
        ctx.fillStyle = tp.color;
        ctx.shadowColor = tp.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Tactical Combat Impact Sparks
const combatSparks = [];

function addCombatSparks(x, y, color = '#38bdf8', count = 10) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 70 + Math.random() * 180;
        combatSparks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1.0,
            color,
            size: 1.6 + Math.random() * 2.2,
            life: 0.28 + Math.random() * 0.2,
            maxLife: 0.4
        });
    }
}

function renderCombatSparks(dt) {
    if (combatSparks.length === 0) return;
    ctx.save();
    for (let i = combatSparks.length - 1; i >= 0; i--) {
        const sp = combatSparks[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vx *= 0.94;
        sp.vy *= 0.94;
        sp.life -= dt;
        sp.alpha = Math.max(0, sp.life / sp.maxLife);
        if (sp.life <= 0) {
            combatSparks.splice(i, 1);
            continue;
        }
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * sp.alpha, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Tactical Weapon Muzzle Flash Flares
const muzzleFlashes = [];

function addMuzzleFlash(x, y, heading, warriorClass = 'ASSAULT') {
    const classInfo = WARRIOR_CLASSES[warriorClass] || WARRIOR_CLASSES.ASSAULT;
    const barrelDist = (player.radius || 16) + 12;
    muzzleFlashes.push({
        x: x + Math.cos(heading) * barrelDist,
        y: y + Math.sin(heading) * barrelDist,
        heading,
        color: classInfo.accentColor || '#38bdf8',
        radius: warriorClass === 'JUGGERNAUT' ? 18 : (warriorClass === 'SNIPER' ? 22 : 14),
        life: 0.07,
        maxLife: 0.07
    });
}

function renderMuzzleFlashes(dt) {
    if (muzzleFlashes.length === 0) return;
    ctx.save();
    for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
        const mf = muzzleFlashes[i];
        mf.life -= dt;
        if (mf.life <= 0) {
            muzzleFlashes.splice(i, 1);
            continue;
        }
        const alpha = mf.life / mf.maxLife;
        ctx.save();
        ctx.translate(mf.x, mf.y);
        ctx.rotate(mf.heading);
        ctx.globalAlpha = alpha;

        // Core white star flare
        ctx.beginPath();
        ctx.arc(0, 0, mf.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = mf.color;
        ctx.shadowBlur = 16;
        ctx.fill();

        // Directional flare cones
        ctx.beginPath();
        ctx.moveTo(mf.radius * 1.4, 0);
        ctx.lineTo(-mf.radius * 0.5, -mf.radius * 0.4);
        ctx.lineTo(-mf.radius * 0.2, 0);
        ctx.lineTo(-mf.radius * 0.5, mf.radius * 0.4);
        ctx.closePath();
        ctx.fillStyle = mf.color;
        ctx.fill();

        ctx.restore();
    }
    ctx.restore();
}

// High-Octane Tactical Hitmarker Reticle System
let activeHitmarker = null;

function triggerHitmarker(isCrit = false) {
    activeHitmarker = {
        time: performance.now(),
        isCrit,
        duration: 130
    };
}

function renderHitmarkers() {
    if (!activeHitmarker) return;
    const elapsed = performance.now() - activeHitmarker.time;
    if (elapsed > activeHitmarker.duration) {
        activeHitmarker = null;
        return;
    }
    const alpha = 1 - (elapsed / activeHitmarker.duration);
    const expand = (elapsed / activeHitmarker.duration) * 4;
    const r = (activeHitmarker.isCrit ? 12 : 9) + expand;
    const len = activeHitmarker.isCrit ? 7 : 5;
    const color = activeHitmarker.isCrit ? '#ef4444' : '#ffffff';

    const cx = lastAimX || (canvas.width / 2);
    const cy = lastAimY || (canvas.height / 2);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = activeHitmarker.isCrit ? 2.5 : 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = activeHitmarker.isCrit ? 8 : 4;

    const dirs = [
        [-1, -1], [1, -1], [-1, 1], [1, 1]
    ];
    for (const [dx, dy] of dirs) {
        ctx.beginPath();
        ctx.moveTo(dx * (r - len), dy * (r - len));
        ctx.lineTo(dx * r, dy * r);
        ctx.stroke();
    }
    ctx.restore();
}

// --- High-Precision In-Canvas Tactical Crosshair Reticle & Targeting Sights ---
let reticleAngle = 0;

function renderTacticalReticle() {
    if (isGameOver || !player.alive || isSpectator) return;
    if (lastAimX === null || lastAimY === null) return;
    if (lastAimX < 0 || lastAimX > ARENA_WIDTH || lastAimY < 0 || lastAimY > ARENA_HEIGHT) return;

    const now = performance.now();
    const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
    const classInfo = WARRIOR_CLASSES[currentClass] || WARRIOR_CLASSES.ASSAULT;

    let cooldown = classInfo.cooldownMs;
    if (player.stimUntil && player.stimUntil > Date.now()) {
        cooldown *= 0.5;
    }
    const elapsed = now - player.lastAttackTime;
    const cdProgress = Math.min(1.0, elapsed / cooldown);
    const isReady = cdProgress >= 1.0;

    // Detect if aiming over any active enemy (remote player or emulator bot)
    let lockedTarget = null;
    let minTargetDist = 34;

    remotePlayers.forEach((rp, uname) => {
        if (rp.alive !== false) {
            const dist = Math.hypot(rp.x - lastAimX, rp.y - lastAimY);
            if (dist < minTargetDist) {
                minTargetDist = dist;
                lockedTarget = { x: rp.x, y: rp.y, name: uname, hp: rp.health, maxHp: rp.maxHealth || 100, class: rp.warriorClass || 'ASSAULT' };
            }
        }
    });

    if (pvpEmulator && pvpEmulator.isActive && pvpEmulator.bots) {
        pvpEmulator.bots.forEach(b => {
            if (b.alive) {
                const dist = Math.hypot(b.x - lastAimX, b.y - lastAimY);
                if (dist < minTargetDist) {
                    minTargetDist = dist;
                    lockedTarget = { x: b.x, y: b.y, name: b.name, hp: b.hp, maxHp: b.maxHp || 100, class: b.warriorClass || 'ASSAULT' };
                }
            }
        });
    }

    const reticleColor = lockedTarget ? '#f43f5e' : (classInfo.accentColor || '#00f2fe');
    const glowColor = lockedTarget ? 'rgba(244, 63, 94, 0.6)' : 'rgba(0, 242, 254, 0.5)';

    ctx.save();

    // 1. Directional Tactical Laser Aiming Sight (Raycasted to obstacles)
    const pRadius = player.radius || 16;
    const startX = player.x + Math.cos(player.heading) * (pRadius + 6);
    const startY = player.y + Math.sin(player.heading) * (pRadius + 6);

    let laserEndX = lastAimX;
    let laserEndY = lastAimY;
    let hitCover = false;

    if (obstacles && obstacles.length > 0) {
        const dx = lastAimX - startX;
        const dy = lastAimY - startY;
        const maxDist = Math.hypot(dx, dy);
        const steps = Math.min(60, Math.ceil(maxDist / 8));
        for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const sx = startX + dx * t;
            const sy = startY + dy * t;
            for (const obs of obstacles) {
                if (sx >= obs.x && sx <= obs.x + obs.width && sy >= obs.y && sy <= obs.y + obs.height) {
                    laserEndX = sx;
                    laserEndY = sy;
                    hitCover = true;
                    break;
                }
            }
            if (hitCover) break;
        }
    }

    // Draw laser beam
    ctx.strokeStyle = lockedTarget ? 'rgba(244, 63, 94, 0.45)' : (classInfo.accentColor ? `${classInfo.accentColor}55` : 'rgba(0, 242, 254, 0.35)');
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(laserEndX, laserEndY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Laser termination dot
    ctx.beginPath();
    ctx.arc(laserEndX, laserEndY, hitCover ? 3 : 2, 0, Math.PI * 2);
    ctx.fillStyle = hitCover ? '#fbbf24' : reticleColor;
    ctx.shadowColor = hitCover ? '#fbbf24' : reticleColor;
    ctx.shadowBlur = hitCover ? 8 : 4;
    ctx.fill();

    // 2. Draw Crosshair at (lastAimX, lastAimY)
    ctx.translate(lastAimX, lastAimY);

    if (lockedTarget) {
        // --- TARGET LOCKED BRACKET RETICLE ---
        const bSize = 16;
        const bLen = 6;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(-bSize, -bSize + bLen); ctx.lineTo(-bSize, -bSize); ctx.lineTo(-bSize + bLen, -bSize);
        ctx.moveTo(bSize - bLen, -bSize); ctx.lineTo(bSize, -bSize); ctx.lineTo(bSize, -bSize + bLen);
        ctx.moveTo(-bSize, bSize - bLen); ctx.lineTo(-bSize, bSize); ctx.lineTo(-bSize + bLen, bSize);
        ctx.moveTo(bSize - bLen, bSize); ctx.lineTo(bSize, bSize); ctx.lineTo(bSize, bSize - bLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Target telemetry readout card below reticle
        const hpRatio = Math.max(0, Math.min(1, (lockedTarget.hp || 0) / lockedTarget.maxHp));
        ctx.shadowBlur = 0;
        ctx.font = '700 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(6, 8, 15, 0.85)';
        ctx.fillRect(-45, bSize + 4, 90, 16);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-45, bSize + 4, 90, 16);

        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(-43, bSize + 17, 86 * hpRatio, 2);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${lockedTarget.name} [${Math.round(lockedTarget.hp || 0)}HP]`, 0, bSize + 14);
    } else {
        // --- TACTICAL PRECISION SIGHT RETICLE ---
        const rSize = 12;
        ctx.strokeStyle = reticleColor;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isReady ? 8 : 2;

        ctx.beginPath();
        ctx.arc(0, 0, rSize, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * cdProgress));
        ctx.stroke();

        if (isReady) {
            reticleAngle += 0.015;
            ctx.save();
            ctx.rotate(reticleAngle);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 1;
            [-rSize, rSize].forEach(pos => {
                ctx.beginPath();
                ctx.moveTo(pos, -2); ctx.lineTo(pos, 2);
                ctx.moveTo(-2, pos); ctx.lineTo(2, pos);
                ctx.stroke();
            });
            ctx.restore();
        }

        const pipDist = 5;
        const pipLen = 4;
        ctx.beginPath();
        ctx.moveTo(0, -pipDist); ctx.lineTo(0, -pipDist - pipLen);
        ctx.moveTo(0, pipDist); ctx.lineTo(0, pipDist + pipLen);
        ctx.moveTo(-pipDist, 0); ctx.lineTo(-pipDist - pipLen, 0);
        ctx.moveTo(pipDist, 0); ctx.lineTo(pipDist + pipLen, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isReady ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        const distMeters = Math.round(Math.hypot(lastAimX - player.x, lastAimY - player.y) * 0.4);
        ctx.font = '600 8px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.shadowBlur = 0;
        ctx.fillText(`${distMeters}m`, rSize + 4, 3);
    }

    ctx.restore();
}

let killBannerTimeout = null;
let playerKillstreak = 0;
let lastKillTime = 0;
let multiKillTimer = null;

function showKillBanner(victimName, points = 25) {
    const banner = document.getElementById('combatKillBanner');
    const victimEl = document.getElementById('killBannerVictim');
    const titleEl = banner ? banner.querySelector('.kill-banner-title') : null;
    if (!banner || !victimEl) return;

    const now = performance.now();
    if (now - lastKillTime < 6000) {
        playerKillstreak++;
    } else {
        playerKillstreak = 1;
    }
    lastKillTime = now;

    let titleText = 'OPPONENT ELIMINATED';
    let streakBonus = 0;
    if (playerKillstreak === 2) {
        titleText = '⚡ DOUBLE KILL!';
        streakBonus = 50;
        soundEngine.playKillstreak(2);
    } else if (playerKillstreak === 3) {
        titleText = '🔥 TRIPLE KILL!';
        streakBonus = 100;
        soundEngine.playKillstreak(3);
    } else if (playerKillstreak >= 4) {
        titleText = '💀 UNSTOPPABLE SPREE!';
        streakBonus = 200;
        soundEngine.playKillstreak(4);
    }

    if (titleEl) titleEl.textContent = titleText;
    victimEl.textContent = `+${points + streakBonus} PTS • ${victimName.toUpperCase()} ELIMINATED`;
    banner.classList.add('active');
    if (killBannerTimeout) clearTimeout(killBannerTimeout);
    killBannerTimeout = setTimeout(() => {
        banner.classList.remove('active');
    }, 2400);

    // Multi-Kill Combo Floating Graphic Banner
    if (playerKillstreak >= 2) {
        const mkBanner = document.getElementById('multiKillBanner');
        const mkTitle = document.getElementById('multiKillTitle');
        const mkSub = document.getElementById('multiKillSub');
        const mkIcon = document.getElementById('multiKillIcon');
        if (mkBanner && mkTitle && mkSub && mkIcon) {
            let iconGlyph = playerKillstreak === 2 ? '⚡' : (playerKillstreak === 3 ? '💥' : (playerKillstreak === 4 ? '💀' : '👑'));
            mkTitle.textContent = titleText.replace(/[⚡🔥💀!]/g, '').trim();
            mkSub.textContent = `+${points + streakBonus} PTS • STREAK x${playerKillstreak}`;
            mkIcon.textContent = iconGlyph;

            mkBanner.style.display = 'flex';
            mkBanner.classList.remove('streak-fade');
            if (multiKillTimer) clearTimeout(multiKillTimer);
            multiKillTimer = setTimeout(() => {
                mkBanner.classList.add('streak-fade');
                setTimeout(() => { mkBanner.style.display = 'none'; }, 400);
            }, 2200);
        }
    }
}

let damageVignetteTimeout = null;
function triggerDamageVignette(durationMs = 180) {
    const vignette = document.getElementById('combatDamageVignette');
    if (!vignette) return;
    vignette.style.opacity = '0.75';
    if (damageVignetteTimeout) clearTimeout(damageVignetteTimeout);
    damageVignetteTimeout = setTimeout(() => {
        vignette.style.opacity = '';
    }, durationMs);
}

// Global Tactical In-Game HUD Toast
function showTacticalToast(title, desc = '', icon = '⚡') {
    if (!achievementToastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-body">
            <div class="toast-tag">TACTICAL COMMS</div>
            <div class="toast-title">${escapeHtml(title)}</div>
            ${desc ? `<div class="toast-desc">${escapeHtml(desc)}</div>` : ''}
        </div>
    `;
    achievementToastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(80px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 2800);
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
// Render Tactical Cover Obstacles (Pure Vector 2D, Zero External Assets)
function renderObstacles() {
    if (!obstacles || obstacles.length === 0) return;

    const time = performance.now() * 0.002;

    obstacles.forEach(obs => {
        ctx.save();

        const isBunker = obs.type === 'BUNKER';
        const primaryColor = isBunker ? '#818cf8' : '#00f2fe';
        const glowColor = isBunker ? 'rgba(129, 140, 248, 0.6)' : 'rgba(0, 242, 254, 0.55)';

        // 1. Deep Cyber Drop Shadow & Ambient Neon Radiance
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 2. Base Armored Hull Fill with rounded corners
        ctx.fillStyle = '#070b15';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
        } else {
            ctx.rect(obs.x, obs.y, obs.width, obs.height);
        }
        ctx.fill();

        // 3. Multi-Stop Carbon Armor Gradient Surface
        ctx.shadowBlur = 0;
        const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y + obs.height);
        if (isBunker) {
            grad.addColorStop(0, 'rgba(49, 46, 129, 0.55)');
            grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
            grad.addColorStop(1, 'rgba(30, 27, 75, 0.9)');
        } else {
            grad.addColorStop(0, 'rgba(14, 116, 144, 0.45)');
            grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
            grad.addColorStop(1, 'rgba(8, 47, 73, 0.85)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // 4. Luminous High-Contrast Cyber Bevel Perimeter
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 5. Tactical Inner Hazard Hatch / Tech Stripes
        ctx.save();
        ctx.clip(); // clip to obstacle bounding box

        ctx.strokeStyle = isBunker ? 'rgba(129, 140, 248, 0.18)' : 'rgba(0, 242, 254, 0.16)';
        ctx.lineWidth = 2.5;
        const step = 16;
        for (let i = -obs.height; i < obs.width + obs.height; i += step) {
            ctx.beginPath();
            ctx.moveTo(obs.x + i, obs.y);
            ctx.lineTo(obs.x + i + obs.height, obs.y + obs.height);
            ctx.stroke();
        }

        // Active Animated Cyber Power Conduit across center
        const conduitPulse = (Math.sin(time * 3 + obs.x * 0.05) + 1) * 0.5;
        const conduitY = obs.y + obs.height / 2;
        ctx.beginPath();
        ctx.moveTo(obs.x + 4, conduitY);
        ctx.lineTo(obs.x + obs.width - 4, conduitY);
        ctx.strokeStyle = isBunker ? `rgba(165, 180, 252, ${0.25 + conduitPulse * 0.4})` : `rgba(56, 189, 248, ${0.25 + conduitPulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Overhead Spotlight Rim Light
        ctx.beginPath();
        ctx.moveTo(obs.x + 2, obs.y + 1);
        ctx.lineTo(obs.x + obs.width - 2, obs.y + 1);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore(); // restore clip

        // 6. High-Visibility 4-Corner Reinforced Armor L-Brackets
        const bracketLen = Math.min(10, Math.min(obs.width, obs.height) * 0.3);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + bracketLen); ctx.lineTo(obs.x, obs.y); ctx.lineTo(obs.x + bracketLen, obs.y);
        ctx.moveTo(obs.x + obs.width - bracketLen, obs.y); ctx.lineTo(obs.x + obs.width, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + bracketLen);
        ctx.moveTo(obs.x, obs.y + obs.height - bracketLen); ctx.lineTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + bracketLen, obs.y + obs.height);
        ctx.moveTo(obs.x + obs.width - bracketLen, obs.y + obs.height); ctx.lineTo(obs.x + obs.width, obs.y + obs.height); ctx.lineTo(obs.x + obs.width, obs.y + obs.height - bracketLen);
        ctx.stroke();

        if (isBunker) {
            // Central Fortress Deflector Emblem
            const bMidX = obs.x + obs.width / 2;
            const bMidY = obs.y + obs.height / 2;
            ctx.beginPath();
            ctx.arc(bMidX, bMidY, 9, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.45)';
            ctx.fill();
            ctx.strokeStyle = '#c7d2fe';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Diamond shield rune
            ctx.beginPath();
            ctx.moveTo(bMidX, bMidY - 5);
            ctx.lineTo(bMidX + 4, bMidY);
            ctx.lineTo(bMidX, bMidY + 5);
            ctx.lineTo(bMidX - 4, bMidY);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();
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

// Floating score feedback particles with punchy dynamic scaling
function addFloatingText(text, x, y, color = '#fbbf24', isCrit = false) {
    floatingTexts.push({
        text,
        x,
        y,
        vx: (Math.random() - 0.5) * 28,
        vy: isCrit ? -60 : -45,
        alpha: 1.0,
        color,
        scale: isCrit ? 1.75 : 1.35,
        isCrit
    });
}

function renderFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.x += (ft.vx || 0) * dt;
        ft.y += ft.vy * dt;
        ft.alpha -= dt * 1.05;
        if (ft.scale > 1.0) {
            ft.scale = Math.max(1.0, ft.scale - dt * 3.4);
        }

        if (ft.alpha <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.translate(ft.x, ft.y);
        ctx.scale(ft.scale, ft.scale);

        ctx.font = ft.isCrit ? '900 15px Outfit, sans-serif' : '800 12px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // High-contrast dark outline for maximum arcade readability
        ctx.strokeStyle = '#050811';
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, 0, 0);

        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = ft.isCrit ? 12 : 5;
        ctx.fillText(ft.text, 0, 0);

        ctx.restore();
    }
}

// Remote Multiplayer Entities Map
const remotePlayers = new Map();

// Dynamic Arena Objective: Overcharge Beacon Event
function renderOverchargeBeacon() {
    if (!activeRoom || !activeRoom.beaconActive) return;

    const bx = 400.0;
    const by = 300.0;
    const brad = 65.0;
    const now = performance.now();

    ctx.save();
    ctx.translate(bx, by);

    // Pulsing capture radius aura
    const pulse = Math.sin(now * 0.005) * 3;
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, brad + pulse);
    auraGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
    auraGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.12)');
    auraGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, brad + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer rotating tech ring
    ctx.save();
    ctx.rotate(now * 0.0015);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, brad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner reverse-rotating ring
    ctx.save();
    ctx.rotate(-now * 0.002);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, brad * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Core holographic beacon pillar
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 16;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Capture state label
    ctx.shadowBlur = 0;
    ctx.font = '800 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 3;
    const capText = activeRoom.beaconCapturedBy ? `CAPTURED: ${activeRoom.beaconCapturedBy.toUpperCase()}` : 'OVERCHARGE BEACON (+2 PTS / +6 SHIELD/S)';
    ctx.strokeText(capText, 0, -brad - 14);
    ctx.fillStyle = activeRoom.beaconCapturedBy ? '#34d399' : '#fbbf24';
    ctx.fillText(capText, 0, -brad - 14);

    ctx.restore();
}

function updateBeaconHud(active, capturedBy) {
    const beaconEl = document.getElementById('hudBeaconTracker');
    const beaconText = document.getElementById('hudBeaconText');
    if (!beaconEl || !beaconText) return;
    if (active) {
        beaconEl.style.display = 'flex';
        beaconText.textContent = capturedBy ? `BEACON SECURED BY ${capturedBy.toUpperCase()} (+2 PTS / +6 SHIELD/S)` : 'BEACON OVERCHARGE ACTIVE • CAPTURE AT CENTER';
    } else {
        beaconEl.style.display = 'none';
    }
}

function renderProjectiles() {
    const now = performance.now();

    projectiles.forEach((p) => {
        const r = p.radius || 5;

        // Glowing plasma laser streak motion trail with cosmetic tinting
        if (p.trail && p.trail.length > 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let t = 1; t < p.trail.length; t++) {
                ctx.lineTo(p.trail[t].x, p.trail[t].y);
            }
            ctx.lineTo(p.x, p.y);
            let trailStroke = p.speed >= 700 ? 'rgba(0, 242, 254, 0.55)' : (r >= 7 ? 'rgba(245, 158, 11, 0.55)' : (p.speed >= 580 ? 'rgba(192, 132, 252, 0.55)' : 'rgba(16, 185, 129, 0.55)'));
            if (p.equippedTrail === 'GOLDEN_VALOR') {
                trailStroke = 'rgba(245, 158, 11, 0.85)';
            } else if (p.equippedTrail === 'CRIMSON_NEON') {
                trailStroke = 'rgba(244, 63, 94, 0.85)';
            } else if (p.equippedTrail === 'EMERALD_SURGE') {
                trailStroke = 'rgba(16, 185, 129, 0.85)';
            } else if (p.equippedTrail === 'CYAN_PULSE') {
                trailStroke = 'rgba(0, 242, 254, 0.85)';
            }
            ctx.strokeStyle = trailStroke;
            ctx.lineWidth = Math.max(2, r * 0.85);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.heading);

        if (r >= 7) {
            // --- JUGGERNAUT HEAVY PLASMA CANNON ORB ---
            const pulse = Math.sin(now * 0.02) * 2;
            // Fiery outer thermal aura
            ctx.beginPath();
            ctx.arc(0, 0, r + 6 + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
            ctx.fill();

            // Swirling solar corona
            ctx.save();
            ctx.rotate(now * 0.008);
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * (r + 1), Math.sin(angle) * (r + 1), 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
            }
            ctx.restore();

            // Heavy plasma orb body
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 16;
            ctx.fill();

            // White-hot fusion core
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Aerodynamic comet tail
            ctx.beginPath();
            ctx.moveTo(r * 0.5, 0);
            ctx.lineTo(-r * 2.5, -r * 0.7);
            ctx.lineTo(-r * 1.5, 0);
            ctx.lineTo(-r * 2.5, r * 0.7);
            ctx.closePath();
            ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
            ctx.fill();

        } else if (p.speed >= 700 || p.damage >= 40) {
            // --- SNIPER HYPER RAILGUN SLUG (Supersonic Azure Shock) ---
            // Supersonic Mach cone shockwave ring
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-18, -8);
            ctx.lineTo(-12, 0);
            ctx.lineTo(-18, 8);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 242, 254, 0.35)';
            ctx.fill();

            // High-intensity piercing rail slug
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#00f2fe';
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 16;
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-28, -2.5);
            ctx.lineTo(-28, 2.5);
            ctx.closePath();
            ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
            ctx.fill();

            // Tungsten penetrator white core
            ctx.beginPath();
            ctx.moveTo(7, 0);
            ctx.lineTo(-16, -1);
            ctx.lineTo(-16, 1);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

        } else if (p.speed >= 580 || r <= 4) {
            // --- SCOUT TWIN HYPERSONIC NEEDLE DARTS ---
            [-3.5, 3.5].forEach(yOffset => {
                ctx.beginPath();
                ctx.arc(2, yOffset, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#c084fc';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 10;
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(4, yOffset);
                ctx.lineTo(-15, yOffset - 1.5);
                ctx.lineTo(-15, yOffset + 1.5);
                ctx.closePath();
                ctx.fillStyle = 'rgba(192, 132, 252, 0.75)';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(2, yOffset, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            });

            // Electric discharge arc between twin needles
            ctx.beginPath();
            ctx.moveTo(0, -3.5);
            ctx.lineTo(-4, 0);
            ctx.lineTo(0, 3.5);
            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 1;
            ctx.stroke();

        } else {
            // --- ASSAULT PULSE BLASTER (Balanced Emerald Energy Dart) ---
            // Plasma wing fins
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-12, -4.5);
            ctx.lineTo(-8, 0);
            ctx.lineTo(-12, 4.5);
            ctx.closePath();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
            ctx.fill();

            // Emerald energy core
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 12;
            ctx.fill();

            // Ionized white center
            ctx.beginPath();
            ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
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

        // 2. Class-specific vector chassis styling (aligned to heading)
        ctx.save();
        ctx.rotate(rp.heading || 0);
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
        ctx.restore();

        // 3. Remote player body
        ctx.beginPath();
        ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();

        // Hit flash feedback
        if (rp.damageFlashTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, pRadius + 1.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

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

        // 6. Sleek Floating Health & Shield Bar (AAA Minimalist)
        const barWidth = 32;
        const barHeight = 3;
        const barX = -barWidth / 2;
        const barY = -pRadius - 9;
        const hp = rp.health !== undefined ? rp.health : classInfo.maxHp;
        const maxHp = rp.maxHealth || classInfo.maxHp;
        const hpRatio = Math.max(0, Math.min(1, hp / maxHp));

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        // Remote shield bar & aura
        if (rp.shield && rp.shield > 0) {
            const maxShield = rp.maxShield || classInfo.maxShield;
            const shieldRatio = Math.max(0, Math.min(1, rp.shield / maxShield));
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(barX, barY - 3, barWidth * shieldRatio, 2);

            const sPulse = Math.sin(performance.now() * 0.008) * 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, pRadius + 6 + sPulse, 0, Math.PI * 2);
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 1.8;
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 7. Remote player sleek callsign tag (Minimalist & Uncluttered)
        ctx.fillStyle = '#f1f5f9';
        ctx.font = '600 10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(username, 0, -pRadius - 13);

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

    // Kinetic Chassis Recoil Kickback (Game Feel)
    let px = player.x;
    let py = player.y;
    if (player.recoilDist > 0) {
        px -= Math.cos(player.recoilAngle) * player.recoilDist;
        py -= Math.sin(player.recoilAngle) * player.recoilDist;
        player.recoilDist *= 0.82;
        if (player.recoilDist < 0.1) player.recoilDist = 0;
    }
    ctx.translate(px, py);

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

    // 2. Class-specific vector chassis styling (aligned to heading)
    ctx.save();
    ctx.rotate(player.heading || 0);
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
    ctx.restore();

    // 3. Player body
    ctx.beginPath();
    ctx.arc(0, 0, pRadius, 0, Math.PI * 2);
    ctx.fillStyle = classInfo.color;
    ctx.fill();

    // Hit flash feedback for local player
    if (player.damageFlashTimer > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, pRadius + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

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

    // 5b. Directional Tactical Laser Aiming Beam (fallback when cursor off canvas)
    if (lastAimX === null || lastAimY === null) {
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
    }

    // 6. Active Energy Shield Bubble
    if (player.shield > 0) {
        const shieldPulse = Math.sin(performance.now() * 0.008) * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, pRadius + 7 + shieldPulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Spawn Invulnerability Shield Visual & Tech Ring
    if (player.invulnerableUntil && player.invulnerableUntil > Date.now()) {
        const remainSec = ((player.invulnerableUntil - Date.now()) / 1000).toFixed(1);
        const pulse = Math.sin(performance.now() * 0.014) * 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, pRadius + 11 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 242, 254, 0.16)';
        ctx.fill();

        // Orbiting protective tech brackets
        ctx.rotate(performance.now() * 0.003);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, pRadius + 14, (i * Math.PI * 2 / 3), (i * Math.PI * 2 / 3) + 0.8);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.font = '700 9px Orbitron, sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.fillText(`SHIELDED: ${remainSec}s`, 0, -pRadius - 16);
        ctx.restore();
    }

    ctx.restore();
}

/* ==============================================================================
 * TACTICAL CANVAS RADAR / MINIMAP SYSTEM
 * ============================================================================== */
function renderTacticalRadar() {
    const isPlaying = ((activeRoom && activeRoom.status === 'PLAYING') || (pvpEmulator && pvpEmulator.isActive)) && !isGameOver;
    if (!isPlaying) return;

    const radarW = 124;
    const radarH = 92;
    const radarX = ARENA_WIDTH - radarW - 14;
    const radarY = ARENA_HEIGHT - radarH - 14;

    ctx.save();
    // Glass surface
    ctx.fillStyle = 'rgba(6, 10, 22, 0.65)';
    ctx.fillRect(radarX, radarY, radarW, radarH);

    // Border with cyber glow
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(radarX, radarY, radarW, radarH);

    // Center crosshairs
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.beginPath();
    ctx.moveTo(radarX + radarW / 2, radarY);
    ctx.lineTo(radarX + radarW / 2, radarY + radarH);
    ctx.moveTo(radarX, radarY + radarH / 2);
    ctx.lineTo(radarX + radarW, radarY + radarH / 2);
    ctx.stroke();

    // Radar circular range ring
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.beginPath();
    ctx.arc(radarX + radarW / 2, radarY + radarH / 2, radarH * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Radar sweep beam
    const sweepAngle = (performance.now() * 0.0018) % (Math.PI * 2);
    const cx = radarX + radarW / 2;
    const cy = radarY + radarH / 2;
    const sweepLen = Math.hypot(radarW / 2, radarH / 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(radarX, radarY, radarW, radarH);
    ctx.clip();

    const sweepGrad = ctx.createLinearGradient(
        cx, cy,
        cx + Math.cos(sweepAngle) * sweepLen,
        cy + Math.sin(sweepAngle) * sweepLen
    );
    sweepGrad.addColorStop(0, 'rgba(0, 242, 254, 0.35)');
    sweepGrad.addColorStop(1, 'rgba(0, 242, 254, 0)');
    ctx.strokeStyle = sweepGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * sweepLen, cy + Math.sin(sweepAngle) * sweepLen);
    ctx.stroke();

    const scaleX = radarW / ARENA_WIDTH;
    const scaleY = radarH / ARENA_HEIGHT;

    // Obstacles
    ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
    obstacles.forEach(obs => {
        ctx.fillRect(radarX + obs.x * scaleX, radarY + obs.y * scaleY, obs.width * scaleX, obs.height * scaleY);
    });

    // Control Beacon
    if ((activeRoom && activeRoom.beaconActive) || (pvpEmulator && pvpEmulator.isActive)) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
        ctx.beginPath();
        ctx.arc(radarX + 400 * scaleX, radarY + 300 * scaleY, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Power Chips / Coins
    ctx.fillStyle = '#fbbf24';
    coins.forEach(c => {
        ctx.fillRect(radarX + c.x * scaleX - 1, radarY + c.y * scaleY - 1, 2, 2);
    });

    // Remote Players / Autonomous Bots
    remotePlayers.forEach(rp => {
        if (rp.alive === false) return;
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(radarX + rp.x * scaleX, radarY + rp.y * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Local Player (Cyan blip + heading pointer)
    if (player.alive && !isSpectator) {
        ctx.fillStyle = '#00f2fe';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(radarX + player.x * scaleX, radarY + player.y * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        const px = radarX + player.x * scaleX;
        const py = radarY + player.y * scaleY;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(player.heading) * 6, py + Math.sin(player.heading) * 6);
        ctx.stroke();
    }

    ctx.restore(); // clip

    // Radar Header Tag
    ctx.fillStyle = 'rgba(0, 242, 254, 0.8)';
    ctx.font = '700 8px JetBrains Mono, monospace';
    ctx.fillText('RADAR // TELEMETRY', radarX + 6, radarY + 10);

    ctx.restore();
}

/* ==============================================================================
 * PVP COMBAT EMULATOR ENGINE (Zero-Latency Offline Simulation Arena)
 * ============================================================================== */
class PvPEmulatorEngine {
    constructor() {
        this.isActive = false;
        this.map = 'CYBER_CORE';
        this.mode = 'FFA_SOLO'; // FFA_SOLO, DUEL_1V1, BOT_SPECTATE
        this.difficulty = 'VETERAN'; // RECRUIT, VETERAN, ELITE, APEX
        this.botCount = 3;
        this.targetScore = 10;
        this.bots = [];
        this.projectileIdCounter = 1;
        this.beaconActive = true;
        this.beaconX = 400;
        this.beaconY = 300;
        this.beaconRadius = 65;
        this.beaconController = null;
        this.beaconProgress = 0;
        this.matchStartTime = 0;
        this.mockRoom = null;
        this.lastBeaconScoreTick = 0;
        this.lastCoinRespawnTick = 0;
    }

    start(config = {}) {
        this.isActive = true;
        this.map = config.map || 'CYBER_CORE';
        this.mode = config.mode || 'FFA_SOLO';
        this.difficulty = config.difficulty || 'VETERAN';
        this.botCount = parseInt(config.botCount || (this.mode === 'DUEL_1V1' ? 1 : 3), 10);
        this.targetScore = parseInt(config.targetScore || 10, 10);
        this.matchStartTime = Date.now();
        this.lastBeaconScoreTick = performance.now();
        this.lastCoinRespawnTick = performance.now();

        isGameOver = false;
        isSpectator = (this.mode === 'BOT_SPECTATE');

        // Configure Local Player
        const pClass = config.heroClass || mySelectedClass || 'ASSAULT';
        player.warriorClass = pClass;
        mySelectedClass = pClass;
        const cInfo = WARRIOR_CLASSES[pClass] || WARRIOR_CLASSES.ASSAULT;
        player.speed = cInfo.speed;
        player.maxHealth = cInfo.maxHp;
        player.health = cInfo.maxHp;
        player.maxShield = cInfo.maxShield;
        player.shield = cInfo.maxShield;
        player.score = 0;
        player.kills = 0;
        player.deaths = 0;
        player.alive = !isSpectator;
        player.x = 140;
        player.y = 300;
        player.heading = 0;
        player.stimUntil = 0;
        player.speedBoostUntil = 0;
        heroAbilityState.lastUsed = -99999;

        // Mock Multiplayer Room
        this.mockRoom = {
            roomId: 'SIM-' + Math.floor(1000 + Math.random() * 9000),
            name: `ARENA // ${this.map} (${this.difficulty})`,
            status: 'PLAYING',
            gameMode: this.mode === 'DUEL_1V1' ? 'PVP_1V1' : 'PVP_FFA',
            maxPlayers: this.botCount + 1,
            targetScore: this.targetScore,
            beaconActive: true
        };
        activeRoom = this.mockRoom;

        // Reset containers
        projectiles.clear();
        remotePlayers.clear();
        coins.clear();
        arenaHazards.clear();
        obstacles.length = 0;

        // Build Map Terrain, Obstacles & Hazards
        this.buildMap(this.map);

        // Seed Autonomous Bots
        this.seedBots();

        // Seed Data Chips
        this.seedCoins();

        // Update UI Layout
        updateGameLayoutState();

        // Update Emulator Indicator in HUD
        const indicator = document.getElementById('hudEmulatorIndicator');
        const badge = document.getElementById('emulatorIndicatorLabel');
        if (indicator) indicator.style.display = 'flex';
        if (badge) badge.textContent = `SIMULATOR: ${this.mode.replace('_', ' ')} [${this.difficulty}]`;

        hudScore.textContent = player.score;
        hudTarget.textContent = this.targetScore;
        hudHp.textContent = `${player.health} / ${player.maxHealth} HP`;
        hudKd.textContent = `${player.kills} K / ${player.deaths} D`;

        // 3.5s Initial Spawn Protection & Damage Timer Reset
        player.invulnerableUntil = Date.now() + 3500;
        player.lastDamageTime = 0;

        addFloatingText('⚡ PVP SIMULATION ARENA READY', 400, 220, '#00f2fe', true);
        soundEngine.playGameStart();
    }

    stop() {
        this.isActive = false;
        const indicator = document.getElementById('hudEmulatorIndicator');
        if (indicator) indicator.style.display = 'none';
        remotePlayers.clear();
        projectiles.clear();
        coins.clear();
        arenaHazards.clear();
        obstacles.length = 0;
    }

    buildMap(mapName) {
        obstacles.length = 0;
        arenaHazards.clear();

        if (mapName === 'NEON_OUTPOST') {
            // CQB High-Density Urban Outpost
            obstacles.push(
                { x: 180, y: 120, width: 90, height: 26, type: 'BARRIER' },
                { x: 530, y: 120, width: 90, height: 26, type: 'BARRIER' },
                { x: 180, y: 450, width: 90, height: 26, type: 'BARRIER' },
                { x: 530, y: 450, width: 90, height: 26, type: 'BARRIER' },
                { x: 370, y: 180, width: 60, height: 60, type: 'PILLAR' },
                { x: 370, y: 360, width: 60, height: 60, type: 'PILLAR' },
                { x: 120, y: 280, width: 30, height: 70, type: 'BARRIER' },
                { x: 650, y: 280, width: 30, height: 70, type: 'BARRIER' }
            );

            arenaHazards.set('b1', { id: 'b1', type: 'EXPLOSIVE_BARREL', x: 270, y: 220, radius: 14, active: true });
            arenaHazards.set('b2', { id: 'b2', type: 'EXPLOSIVE_BARREL', x: 530, y: 220, radius: 14, active: true });
            arenaHazards.set('b3', { id: 'b3', type: 'EXPLOSIVE_BARREL', x: 270, y: 380, radius: 14, active: true });
            arenaHazards.set('b4', { id: 'b4', type: 'EXPLOSIVE_BARREL', x: 530, y: 380, radius: 14, active: true });
        } else if (mapName === 'ORBITAL_STATION') {
            // Long Sightlines with Geothermal Vents & Jump Conduits
            obstacles.push(
                { x: 220, y: 100, width: 50, height: 160, type: 'PILLAR' },
                { x: 530, y: 100, width: 50, height: 160, type: 'PILLAR' },
                { x: 220, y: 340, width: 50, height: 160, type: 'PILLAR' },
                { x: 530, y: 340, width: 50, height: 160, type: 'PILLAR' },
                { x: 370, y: 280, width: 60, height: 40, type: 'BARRIER' }
            );

            arenaHazards.set('jp1', { id: 'jp1', type: 'JUMP_PAD', x: 110, y: 300, radius: 22, active: true });
            arenaHazards.set('jp2', { id: 'jp2', type: 'JUMP_PAD', x: 690, y: 300, radius: 22, active: true });
            arenaHazards.set('lava1', { id: 'lava1', type: 'LAVA_POOL', x: 380, y: 140, radius: 36, active: true });
            arenaHazards.set('lava2', { id: 'lava2', type: 'LAVA_POOL', x: 380, y: 460, radius: 36, active: true });
            arenaHazards.set('b1', { id: 'b1', type: 'EXPLOSIVE_BARREL', x: 400, y: 230, radius: 14, active: true });
        } else {
            // CYBER_CORE: Balanced Competitive Arena
            obstacles.push(
                { x: 160, y: 130, width: 70, height: 70, type: 'PILLAR' },
                { x: 570, y: 130, width: 70, height: 70, type: 'PILLAR' },
                { x: 160, y: 400, width: 70, height: 70, type: 'PILLAR' },
                { x: 570, y: 400, width: 70, height: 70, type: 'PILLAR' },
                { x: 360, y: 190, width: 80, height: 22, type: 'BARRIER' },
                { x: 360, y: 390, width: 80, height: 22, type: 'BARRIER' }
            );

            arenaHazards.set('b1', { id: 'b1', type: 'EXPLOSIVE_BARREL', x: 270, y: 300, radius: 14, active: true });
            arenaHazards.set('b2', { id: 'b2', type: 'EXPLOSIVE_BARREL', x: 530, y: 300, radius: 14, active: true });
            arenaHazards.set('jp1', { id: 'jp1', type: 'JUMP_PAD', x: 100, y: 300, radius: 22, active: true });
            arenaHazards.set('jp2', { id: 'jp2', type: 'JUMP_PAD', x: 700, y: 300, radius: 22, active: true });
        }
    }

    seedBots() {
        this.bots = [];
        const botTemplates = [
            { name: '[BOT] VORTEX', class: 'ASSAULT' },
            { name: '[BOT] TITAN', class: 'JUGGERNAUT' },
            { name: '[BOT] PHANTOM', class: 'SCOUT' },
            { name: '[BOT] HAWK', class: 'SNIPER' },
            { name: '[BOT] AEGIS', class: 'JUGGERNAUT' },
            { name: '[BOT] CYCLONE', class: 'ASSAULT' },
            { name: '[BOT] RAZOR', class: 'SCOUT' }
        ];

        const spawns = [
            { x: 680, y: 150 },
            { x: 680, y: 450 },
            { x: 400, y: 110 },
            { x: 400, y: 490 },
            { x: 140, y: 150 },
            { x: 140, y: 450 },
            { x: 680, y: 300 }
        ];

        if (this.mode === 'DUEL_1V1') {
            const botClass = this.difficulty === 'APEX' ? 'SNIPER' : 'JUGGERNAUT';
            const cInfo = WARRIOR_CLASSES[botClass] || WARRIOR_CLASSES.JUGGERNAUT;
            const nemesis = {
                id: 'bot_nemesis',
                name: '[NEMESIS] APEX PRIME',
                warriorClass: botClass,
                x: 680,
                y: 300,
                radius: 17,
                heading: Math.PI,
                hp: cInfo.maxHp * 1.25,
                maxHp: cInfo.maxHp * 1.25,
                shield: cInfo.maxShield * 1.2,
                maxShield: cInfo.maxShield * 1.2,
                speed: cInfo.speed * 1.05,
                alive: true,
                kills: 0,
                deaths: 0,
                score: 0,
                lastAttackTime: 0,
                lastAbilityTime: performance.now() - 3000,
                cooldownMs: cInfo.cooldownMs * 0.9,
                respawnTimer: 0,
                strafingDir: 1,
                lastStrafeChange: performance.now(),
                state: 'ENGAGING'
            };
            this.bots.push(nemesis);
            remotePlayers.set(nemesis.name, nemesis);
            return;
        }

        const count = Math.min(this.botCount, botTemplates.length);
        for (let i = 0; i < count; i++) {
            const tmpl = botTemplates[i];
            const sp = spawns[i % spawns.length];
            const cInfo = WARRIOR_CLASSES[tmpl.class] || WARRIOR_CLASSES.ASSAULT;

            const bot = {
                id: 'bot_' + i,
                name: tmpl.name,
                warriorClass: tmpl.class,
                x: sp.x,
                y: sp.y,
                radius: 16,
                heading: Math.random() * Math.PI * 2,
                hp: cInfo.maxHp,
                maxHp: cInfo.maxHp,
                shield: cInfo.maxShield,
                maxShield: cInfo.maxShield,
                speed: cInfo.speed,
                alive: true,
                kills: 0,
                deaths: 0,
                score: 0,
                lastAttackTime: 0,
                lastAbilityTime: performance.now() - 4000,
                cooldownMs: cInfo.cooldownMs,
                respawnTimer: 0,
                strafingDir: Math.random() < 0.5 ? 1 : -1,
                lastStrafeChange: performance.now(),
                state: 'SEEKING'
            };

            this.bots.push(bot);
            remotePlayers.set(bot.name, bot);
        }
    }

    seedCoins() {
        coins.clear();
        const coinSpawns = [
            { id: 'c1', x: 260, y: 180 },
            { id: 'c2', x: 540, y: 180 },
            { id: 'c3', x: 260, y: 420 },
            { id: 'c4', x: 540, y: 420 },
            { id: 'c5', x: 400, y: 220 },
            { id: 'c6', x: 400, y: 380 },
            { id: 'c7', x: 180, y: 300 },
            { id: 'c8', x: 620, y: 300 }
        ];
        coinSpawns.forEach(cs => {
            coins.set(cs.id, { id: cs.id, x: cs.x, y: cs.y, radius: 8 });
        });
    }

    checkPlayerPickups() {
        if (!player.alive || isSpectator) return;
        coins.forEach((c, id) => {
            const dist = Math.hypot(player.x - c.x, player.y - c.y);
            if (dist <= player.radius + c.radius + 4) {
                coins.delete(id);
                player.score += 1;
                soundEngine.playCoin();
                addFloatingText('+1 CHIP', player.x, player.y - 18, '#fbbf24', false);
                hudScore.textContent = player.score;
            }
        });
    }

    handlePlayerAttack(heading) {
        const id = 'p_local_' + (this.projectileIdCounter++);
        const currentClass = player.warriorClass || mySelectedClass || 'ASSAULT';
        const cInfo = WARRIOR_CLASSES[currentClass] || WARRIOR_CLASSES.ASSAULT;
        const speed = (cInfo && cInfo.bulletSpeed) ? cInfo.bulletSpeed : 620;
        const damage = (cInfo && cInfo.damage) ? cInfo.damage : 20;
        const pRadius = currentClass === 'JUGGERNAUT' ? 8 : (currentClass === 'SCOUT' ? 4 : 5);

        projectiles.set(id, {
            id,
            x: player.x + Math.cos(heading) * (player.radius + 12),
            y: player.y + Math.sin(heading) * (player.radius + 12),
            vx: Math.cos(heading) * speed,
            vy: Math.sin(heading) * speed,
            heading,
            speed,
            radius: pRadius,
            damage,
            shooter: player.name,
            isPlayer: true,
            equippedTrail: player.equippedTrail || 'CYAN_PULSE',
            trail: []
        });
    }

    handleBotAttack(bot, heading) {
        const id = 'p_bot_' + (this.projectileIdCounter++);
        const cInfo = WARRIOR_CLASSES[bot.warriorClass] || WARRIOR_CLASSES.ASSAULT;
        const speed = (cInfo && cInfo.bulletSpeed) ? cInfo.bulletSpeed : 580;
        const damage = (cInfo && cInfo.damage) ? cInfo.damage : 20;
        const pRadius = bot.warriorClass === 'JUGGERNAUT' ? 8 : (bot.warriorClass === 'SCOUT' ? 4 : 5);

        projectiles.set(id, {
            id,
            x: bot.x + Math.cos(heading) * (bot.radius + 12),
            y: bot.y + Math.sin(heading) * (bot.radius + 12),
            vx: Math.cos(heading) * speed,
            vy: Math.sin(heading) * speed,
            heading,
            speed,
            radius: pRadius,
            damage,
            shooter: bot.name,
            isPlayer: false,
            equippedTrail: 'CRIMSON_NEON',
            trail: []
        });

        soundEngine.playLaser(false, bot.warriorClass);
        addMuzzleFlash(bot.x, bot.y, heading, bot.warriorClass);
    }

    handleShockwave(x, y, radius, dmg, sourceName) {
        // Destroy incoming projectiles within shockwave radius
        projectiles.forEach((p, id) => {
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist <= radius) {
                projectiles.delete(id);
                addCombatSparks(p.x, p.y, '#f59e0b', 4);
            }
        });

        // Damage opponents in range
        this.bots.forEach(b => {
            if (b.name === sourceName || !b.alive) return;
            const dist = Math.hypot(b.x - x, b.y - y);
            if (dist <= radius) {
                this.applyDamageToBot(b, dmg, sourceName);
                const kbAngle = Math.atan2(b.y - y, b.x - x);
                b.x += Math.cos(kbAngle) * 35;
                b.y += Math.sin(kbAngle) * 35;
                resolveObstacleCollisions(b);
            }
        });
    }

    handleRailBeam(startX, startY, endX, endY, dmg, sourceName) {
        this.bots.forEach(b => {
            if (b.name === sourceName || !b.alive) return;
            const dist = this.distToSegment({ x: b.x, y: b.y }, { x: startX, y: startY }, { x: endX, y: endY });
            if (dist <= b.radius + 8) {
                this.applyDamageToBot(b, dmg, sourceName, true);
                triggerHitmarker(true);
                addCombatSparks(b.x, b.y, '#22d3ee', 8);
            }
        });
    }

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    applyDamageToBot(bot, damage, attackerName, isCrit = false) {
        if (!bot.alive) return;
        let actualDmg = damage;
        bot.damageFlashTimer = 0.16;

        if (bot.shield && bot.shield > 0) {
            const absorbed = Math.min(bot.shield, actualDmg);
            bot.shield -= absorbed;
            actualDmg -= absorbed;
            if (bot.shield <= 0) {
                soundEngine.playShieldBreak();
                addFloatingText('⚡ SHIELD BROKEN!', bot.x, bot.y - 30, '#00f2fe', true);
            }
        }

        if (actualDmg > 0) {
            bot.hp -= actualDmg;
        }

        addFloatingText(isCrit ? `CRIT -${damage}` : `-${damage}`, bot.x, bot.y - 18, isCrit ? '#f43f5e' : '#fbbf24', isCrit);
        soundEngine.playHit();
        addCombatSparks(bot.x, bot.y, '#f59e0b', 5);

        if (attackerName === player.name) {
            triggerHitMarker();
        }

        if (bot.hp <= 0) {
            bot.alive = false;
            bot.hp = 0;
            bot.deaths++;
            bot.respawnTimer = 3.5;

            // Geometry Wars style explosive elimination juice
            addShockwave(bot.x, bot.y, 80, '#ff3b5c');
            addCombatSparks(bot.x, bot.y, '#00f2fe', 22);
            addCombatSparks(bot.x, bot.y, '#f59e0b', 14);
            addCombatSparks(bot.x, bot.y, '#ff3b5c', 14);
            triggerScreenShake(7, 0.2);

            if (attackerName === player.name) {
                player.kills++;
                player.score += 10;
                hudScore.textContent = player.score;
                hudKd.textContent = `${player.kills} K / ${player.deaths} D`;
                soundEngine.playKillcam();
                triggerKillMarker();
                addFloatingText('+10 ELIMINATED!', bot.x, bot.y - 32, '#10b981', true);
                showKillBanner(bot.name, 10);
            } else {
                const killerBot = this.bots.find(b => b.name === attackerName);
                if (killerBot) {
                    killerBot.kills++;
                    killerBot.score += 10;
                }
            }

            if (killFeed) {
                const item = document.createElement('div');
                item.className = 'killfeed-item';
                item.textContent = `${attackerName} ➔ ${bot.name}`;
                killFeed.appendChild(item);
                setTimeout(() => item.remove(), 4000);
            }

            this.checkGameOver();
        }
    }

    applyDamageToPlayer(damage, attackerName) {
        if (!player.alive || isSpectator) return;
        if (player.invulnerableUntil && player.invulnerableUntil > Date.now()) return;

        let actualDmg = damage;
        player.damageFlashTimer = 0.2;
        triggerScreenShake(4, 0.15);

        // Calculate and trigger directional damage indicator
        let attackerX = player.x;
        let attackerY = player.y;
        if (this && this.bots) {
            const b = this.bots.find(bot => bot.name === attackerName);
            if (b) {
                attackerX = b.x;
                attackerY = b.y;
            }
        }
        if (remotePlayers && remotePlayers.has(attackerName)) {
            const rp = remotePlayers.get(attackerName);
            attackerX = rp.x;
            attackerY = rp.y;
        }
        triggerDirectionalDamage(attackerX, attackerY);

        if (player.shield > 0) {
            const absorbed = Math.min(player.shield, actualDmg);
            player.shield -= absorbed;
            actualDmg -= absorbed;
            if (player.shield <= 0) {
                soundEngine.playShieldBreak();
                addFloatingText('⚡ SHIELD CRACKED!', player.x, player.y - 32, '#00f2fe', true);
            }
        }

        player.lastDamageTime = Date.now();

        if (actualDmg > 0) {
            player.health -= actualDmg;
        }

        updateHudHealth();
        addFloatingText(`-${damage}`, player.x, player.y - 20, '#ef4444', false);
        soundEngine.playHit();

        if (player.health <= 0) {
            player.alive = false;
            player.health = 0;
            player.deaths++;
            playerKillstreak = 0;
            soundEngine.updateHeartbeat(false);
            updateHudHealth();

            // Player elimination explosion juice
            addShockwave(player.x, player.y, 90, '#ff3b5c');
            addCombatSparks(player.x, player.y, '#ff3b5c', 28);
            addCombatSparks(player.x, player.y, '#00f2fe', 16);
            triggerScreenShake(10, 0.3);

            const killerBot = this.bots.find(b => b.name === attackerName);
            if (killerBot) {
                killerBot.kills++;
                killerBot.score += 10;
            }

            if (killFeed) {
                const item = document.createElement('div');
                item.className = 'killfeed-item';
                item.textContent = `${attackerName} ➔ ${player.name}`;
                killFeed.appendChild(item);
                setTimeout(() => item.remove(), 4000);
            }

            // Show respawn countdown
            if (respawnOverlay && respawnCountdown) {
                respawnOverlay.style.display = 'flex';
                let remaining = 3;
                respawnCountdown.textContent = remaining;
                const timer = setInterval(() => {
                    remaining--;
                    if (remaining > 0) {
                        respawnCountdown.textContent = remaining;
                    } else {
                        clearInterval(timer);
                        respawnOverlay.style.display = 'none';
                        player.alive = true;
                        player.health = player.maxHealth;
                        player.shield = player.maxShield;
                        player.invulnerableUntil = Date.now() + 3500;
                        player.lastDamageTime = 0;

                        // Farthest safe spawn point selection away from active enemies
                        const spawnSpots = [
                            { x: 100, y: 100 },
                            { x: 700, y: 100 },
                            { x: 100, y: 500 },
                            { x: 700, y: 500 },
                            { x: 400, y: 100 },
                            { x: 400, y: 500 }
                        ];
                        let bestSpot = spawnSpots[0];
                        let maxSafeDist = -1;
                        spawnSpots.forEach(spot => {
                            let minEnemyDist = 9999;
                            if (this && this.bots) {
                                this.bots.forEach(b => {
                                    if (!b.alive) return;
                                    const d = Math.hypot(spot.x - b.x, spot.y - b.y);
                                    if (d < minEnemyDist) minEnemyDist = d;
                                });
                            }
                            if (minEnemyDist > maxSafeDist) {
                                maxSafeDist = minEnemyDist;
                                bestSpot = spot;
                            }
                        });
                        player.x = bestSpot.x;
                        player.y = bestSpot.y;
                        updateHudHealth();
                        addShockwave(player.x, player.y, 75, '#00f2fe');
                        addFloatingText('🛡️ SHIELD DEPLOYED', player.x, player.y - 25, '#00f2fe', true);
                    }
                }, 1000);
            }

            this.checkGameOver();
        }
    }

    update(dt) {
        const now = performance.now();

        // 1. Update Autonomous Bots AI Loop
        this.bots.forEach(bot => {
            if (!bot.alive) {
                bot.respawnTimer -= dt;
                if (bot.respawnTimer <= 0) {
                    bot.alive = true;
                    bot.hp = bot.maxHp;
                    bot.shield = bot.maxShield;
                    bot.x = 680;
                    bot.y = 150 + Math.random() * 300;
                    addShockwave(bot.x, bot.y, 60, '#f43f5e');
                }
                remotePlayers.set(bot.name, bot);
                return;
            }

            // Target Acquisition & Dynamic Locking
            let target = bot.currentTarget;
            if (!target || !target.alive || now > (bot.targetLockUntil || 0)) {
                let candidates = [];
                if (!isSpectator && player.alive) {
                    candidates.push({ target: player, dist: Math.hypot(player.x - bot.x, player.y - bot.y) });
                }
                if (this.mode !== 'DUEL_1V1') {
                    this.bots.forEach(other => {
                        if (other.id === bot.id || !other.alive) return;
                        candidates.push({ target: other, dist: Math.hypot(other.x - bot.x, other.y - bot.y) });
                    });
                }
                if (candidates.length > 0) {
                    candidates.sort((a, b) => a.dist - b.dist);
                    const pickIndex = (Math.random() < 0.75 || candidates.length === 1) ? 0 : 1;
                    bot.currentTarget = candidates[pickIndex].target;
                    bot.targetLockUntil = now + 2500 + Math.random() * 2000;
                } else {
                    bot.currentTarget = null;
                }
                target = bot.currentTarget;
            }

            let minDist = target ? Math.hypot(target.x - bot.x, target.y - bot.y) : 9999;

            if (target) {
                const angle = Math.atan2(target.y - bot.y, target.x - bot.x);

                // Lead Angle Prediction with Natural Human-like Spread
                let leadAngle = angle;
                if (this.difficulty === 'RECRUIT') {
                    leadAngle += (Math.random() - 0.5) * 0.40;
                } else if (this.difficulty === 'VETERAN') {
                    leadAngle += (Math.random() - 0.5) * 0.22;
                } else if (this.difficulty === 'ELITE') {
                    leadAngle += (Math.random() - 0.5) * 0.12;
                } else if (this.difficulty === 'APEX') {
                    const bulletSpeed = (WARRIOR_CLASSES[bot.warriorClass] || WARRIOR_CLASSES.ASSAULT).bulletSpeed;
                    const timeToHit = minDist / bulletSpeed;
                    const targetVx = (target === player ? (activeKeys.has('d') ? 1 : (activeKeys.has('a') ? -1 : 0)) : 0) * (target.speed || 220);
                    const targetVy = (target === player ? (activeKeys.has('s') ? 1 : (activeKeys.has('w') ? -1 : 0)) : 0) * (target.speed || 220);
                    const predX = target.x + targetVx * timeToHit * 0.4;
                    const predY = target.y + targetVy * timeToHit * 0.4;
                    leadAngle = Math.atan2(predY - bot.y, predX - bot.x) + (Math.random() - 0.5) * 0.08;
                }

                bot.heading = leadAngle;

                // Tactical Movement & Spacing
                const preferredDist = bot.warriorClass === 'SNIPER' ? 260 : (bot.warriorClass === 'JUGGERNAUT' ? 110 : 160);
                let moveVx = 0;
                let moveVy = 0;

                if (minDist > preferredDist + 30) {
                    moveVx += Math.cos(angle);
                    moveVy += Math.sin(angle);
                } else if (minDist < preferredDist - 30) {
                    moveVx -= Math.cos(angle);
                    moveVy -= Math.sin(angle);
                }

                // Strafing
                if (now - bot.lastStrafeChange > 2000) {
                    bot.strafingDir *= -1;
                    bot.lastStrafeChange = now;
                }
                const strafeAngle = angle + (Math.PI / 2) * bot.strafingDir;
                moveVx += Math.cos(strafeAngle) * 0.8;
                moveVy += Math.sin(strafeAngle) * 0.8;

                // Hazard repulsion (stay away from lava pools)
                arenaHazards.forEach(h => {
                    if (h.type === 'LAVA_POOL' && h.active) {
                        const hDist = Math.hypot(bot.x - h.x, bot.y - h.y);
                        if (hDist < h.radius + 50) {
                            const repAngle = Math.atan2(bot.y - h.y, bot.x - h.x);
                            moveVx += Math.cos(repAngle) * 2;
                            moveVy += Math.sin(repAngle) * 2;
                        }
                    }
                });

                const len = Math.hypot(moveVx, moveVy);
                if (len > 0) {
                    bot.x += (moveVx / len) * bot.speed * dt;
                    bot.y += (moveVy / len) * bot.speed * dt;
                }

                // Arena bounds & barrier sliding
                bot.x = Math.max(bot.radius + 2, Math.min(ARENA_WIDTH - bot.radius - 2, bot.x));
                bot.y = Math.max(bot.radius + 2, Math.min(ARENA_HEIGHT - bot.radius - 2, bot.y));
                resolveObstacleCollisions(bot);

                // Attack Trigger with line-of-sight check & balanced range
                const hasLos = !hasObstacleBetween(bot.x, bot.y, target.x, target.y);
                if (now - bot.lastAttackTime >= bot.cooldownMs && minDist < 380 && hasLos) {
                    bot.lastAttackTime = now;
                    this.handleBotAttack(bot, leadAngle);
                }

                // Autonomous Tactical Abilities (Elite & Apex)
                if ((this.difficulty === 'ELITE' || this.difficulty === 'APEX') && now - bot.lastAbilityTime >= 10000) {
                    if (bot.warriorClass === 'SCOUT' && bot.hp < bot.maxHp * 0.45) {
                        bot.lastAbilityTime = now;
                        soundEngine.playAbilityBlink();
                        bot.x += Math.cos(leadAngle + Math.PI) * 140;
                        bot.y += Math.sin(leadAngle + Math.PI) * 140;
                        resolveObstacleCollisions(bot);
                        addShockwave(bot.x, bot.y, 50, '#c084fc');
                    } else if (bot.warriorClass === 'JUGGERNAUT' && minDist < 140) {
                        bot.lastAbilityTime = now;
                        soundEngine.playAbilityShockwave();
                        addShockwave(bot.x, bot.y, 140, '#f59e0b');
                        this.handleShockwave(bot.x, bot.y, 140, 30, bot.name);
                        bot.shield = Math.min(bot.maxShield, bot.shield + 40);
                    } else if (bot.warriorClass === 'SNIPER' && minDist > 180) {
                        bot.lastAbilityTime = now;
                        soundEngine.playAbilityRailBeam();
                        const bx2 = bot.x + Math.cos(leadAngle) * 800;
                        const by2 = bot.y + Math.sin(leadAngle) * 800;
                        addRailBeamEffect(bot.x, bot.y, bx2, by2);
                        this.handleRailBeam(bot.x, bot.y, bx2, by2, 60, bot.name);
                    }
                }
            }

            remotePlayers.set(bot.name, bot);
        });

        // 2. Update Ballistics & Local Projectiles
        projectiles.forEach((p, id) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (!p.trail) p.trail = [];
            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 5) p.trail.shift();

            // Wall Collisions
            if (p.x < 0 || p.x > ARENA_WIDTH || p.y < 0 || p.y > ARENA_HEIGHT) {
                projectiles.delete(id);
                addCombatSparks(p.x, p.y, '#00f2fe', 3);
                return;
            }

            // Obstacle Collisions
            for (let obs of obstacles) {
                if (p.x >= obs.x && p.x <= obs.x + obs.width && p.y >= obs.y && p.y <= obs.y + obs.height) {
                    projectiles.delete(id);
                    addCombatSparks(p.x, p.y, '#94a3b8', 4);
                    return;
                }
            }

            // Explosive Barrel Collisions
            arenaHazards.forEach((h, hid) => {
                if (h.type === 'EXPLOSIVE_BARREL' && h.active) {
                    if (Math.hypot(p.x - h.x, p.y - h.y) <= h.radius + p.radius) {
                        h.active = false;
                        projectiles.delete(id);
                        soundEngine.playBarrelExplosion();
                        triggerScreenShake(7, 0.2);
                        addShockwave(h.x, h.y, 90, '#f97316');
                        this.handleShockwave(h.x, h.y, 90, 35, 'VOLATILE_BARREL');
                        return;
                    }
                }
            });

            // Combatant Hit Detection
            if (p.isPlayer) {
                // Player bullet hitting bots
                for (let bot of this.bots) {
                    if (!bot.alive) continue;
                    if (Math.hypot(p.x - bot.x, p.y - bot.y) <= bot.radius + p.radius) {
                        projectiles.delete(id);
                        const isCrit = Math.random() < 0.18;
                        this.applyDamageToBot(bot, p.damage * (isCrit ? 1.5 : 1.0), player.name, isCrit);
                        triggerHitmarker(isCrit);
                        return;
                    }
                }
            } else {
                // Bot bullet hitting Player
                if (player.alive && !isSpectator) {
                    if (Math.hypot(p.x - player.x, p.y - player.y) <= player.radius + p.radius) {
                        projectiles.delete(id);
                        this.applyDamageToPlayer(p.damage, p.shooter);
                        return;
                    }
                }

                // Bot bullet hitting other bots in FFA
                if (this.mode !== 'DUEL_1V1') {
                    for (let bot of this.bots) {
                        if (!bot.alive || bot.name === p.shooter) continue;
                        if (Math.hypot(p.x - bot.x, p.y - bot.y) <= bot.radius + p.radius) {
                            projectiles.delete(id);
                            this.applyDamageToBot(bot, p.damage, p.shooter);
                            return;
                        }
                    }
                }
            }
        });

        // 3. Overcharge Beacon Capture Mechanics
        if (now - this.lastBeaconScoreTick >= 2000) {
            this.lastBeaconScoreTick = now;
            const bDist = Math.hypot(player.x - this.beaconX, player.y - this.beaconY);
            if (bDist <= this.beaconRadius && player.alive && !isSpectator) {
                player.score += 2;
                hudScore.textContent = player.score;
                addFloatingText('+2 BEACON CONTROL', 400, 270, '#f59e0b', false);
                this.checkGameOver();
            }
        }

        // 4. Check Coin Collection
        this.checkPlayerPickups();
    }

    checkGameOver() {
        if (isGameOver) return;
        if (player.kills >= this.targetScore || player.score >= this.targetScore * 10) {
            this.showEmulatorGameOver({ name: player.name, kills: player.kills, score: player.score, won: true });
        } else {
            for (let b of this.bots) {
                if (b.kills >= this.targetScore || b.score >= this.targetScore * 10) {
                    this.showEmulatorGameOver({ name: b.name, kills: b.kills, score: b.score, won: false });
                    break;
                }
            }
        }
    }

    showEmulatorGameOver(winner) {
        isGameOver = true;
        soundEngine.playGameOver();

        const isMeWinner = winner.won || winner.name === player.name;
        if (isMeWinner) {
            soundEngine.playKillstreak(4);
        }

        const participants = [
            { name: player.name, class: player.warriorClass, kills: player.kills, deaths: player.deaths, score: player.score },
            ...this.bots.map(b => ({ name: b.name, class: b.warriorClass, kills: b.kills, deaths: b.deaths, score: b.score }))
        ].sort((a, b) => b.score - a.score);

        // Populate lastMatchSummary for clipboard & social sharing
        lastMatchSummary = {
            winner: winner.name,
            winningScore: winner.score,
            roomName: this.mockRoom ? this.mockRoom.name : `ARENA // ${this.map}`,
            roomId: this.mockRoom ? this.mockRoom.roomId : 'ARCADE',
            finishedAt: Date.now(),
            players: participants.map(p => ({
                username: p.name,
                score: p.score,
                kills: p.kills,
                deaths: p.deaths,
                warriorClass: p.class
            }))
        };

        // Update local career XP & progression
        const earnedXp = Math.max(50, player.kills * 75 + player.score * 5 + (isMeWinner ? 300 : 100));
        const profile = getLocalArcadeProfile();
        profile.totalGames = (profile.totalGames || 0) + 1;
        profile.totalScore = (profile.totalScore || 0) + player.score;
        profile.kills = (profile.kills || 0) + player.kills;
        profile.deaths = (profile.deaths || 0) + player.deaths;
        if (isMeWinner) profile.wins = (profile.wins || 0) + 1;
        if (player.score > (profile.highestScore || 0)) profile.highestScore = player.score;
        profile.xp = (profile.xp || 0) + earnedXp;

        const oldLevel = profile.level || 1;
        const newLevel = Math.floor(profile.xp / 1000) + 1;
        if (newLevel > oldLevel) {
            profile.level = newLevel;
            if (newLevel >= 2 && !profile.unlockedTitles.includes('CYBER_STRIKER')) profile.unlockedTitles.push('CYBER_STRIKER');
            if (newLevel >= 5 && !profile.unlockedTitles.includes('ARENA_VETERAN')) profile.unlockedTitles.push('ARENA_VETERAN');
            if (newLevel >= 8 && !profile.unlockedTitles.includes('APEX_PREDATOR')) profile.unlockedTitles.push('APEX_PREDATOR');
            if (newLevel >= 12 && !profile.unlockedTitles.includes('CYBER_IMMORTAL')) profile.unlockedTitles.push('CYBER_IMMORTAL');
            showTacticalToast(`⭐ PROMOTED TO LEVEL ${newLevel}!`, 'New combat rank & titles unlocked in Locker!', '👑');
        }

        if (!profile.matches) profile.matches = [];
        profile.matches.unshift({
            roomId: this.mockRoom ? this.mockRoom.roomId : 'ARCADE',
            roomName: `ARENA // ${this.map}`,
            winner: winner.name,
            winnerUsername: winner.name,
            finishedAt: Date.now(),
            playerScore: player.score,
            durationSeconds: Math.round((Date.now() - this.matchStartTime) / 1000),
            scores: Object.fromEntries(participants.map(p => [p.name, p.score]))
        });
        if (profile.matches.length > 25) profile.matches.pop();
        saveLocalArcadeProfile(profile);
        updateAuthState(profile);

        if (gameOverModal) {
            gameOverModal.style.display = 'flex';
            if (gameOverTitle) {
                gameOverTitle.textContent = isMeWinner ? '🏆 VICTORY ACHIEVED' : '🏁 COMBAT COMPLETE';
            }
            if (winnerAnnouncement) {
                winnerAnnouncement.textContent = isMeWinner
                    ? `🏆 You dominated the arena with ${player.kills} eliminations! (+${earnedXp} XP)`
                    : `☠️ ${winner.name} seized victory with ${winner.kills} eliminations. (+${earnedXp} XP)`;
            }

            if (matchAccoladesRow) {
                const topFragger = [...participants].sort((a, b) => b.kills - a.kills)[0];
                matchAccoladesRow.innerHTML = `
                    <div class="accolade-badge mvp">
                        <span>👑</span>
                        <span>Champion: ${escapeHtml(winner.name)}</span>
                    </div>
                    <div class="accolade-badge top-frags">
                        <span>🎯</span>
                        <span>Top Fragger: ${escapeHtml(topFragger.name)} (${topFragger.kills} Kills)</span>
                    </div>
                    <div class="accolade-badge first-blood">
                        <span>⭐</span>
                        <span>Combat XP: +${earnedXp} XP</span>
                    </div>
                `;
            }

            if (matchSummaryScores) {
                let html = '<div class="scoreboard-table"><div class="scoreboard-row header"><span>PILOT</span><span>CLASS</span><span>K/D</span><span>SCORE</span></div>';
                participants.forEach((p, idx) => {
                    const isMe = p.name === player.name;
                    html += `<div class="scoreboard-row ${isMe ? 'highlight' : ''}">
                        <span>#${idx + 1} ${escapeHtml(p.name)}</span>
                        <span>${escapeHtml(p.class || 'ASSAULT')}</span>
                        <span>${p.kills}K / ${p.deaths}D</span>
                        <span>${p.score} PTS</span>
                    </div>`;
                });
                html += '</div>';
                matchSummaryScores.innerHTML = html;
            }

            if (rematchBtn) {
                rematchBtn.style.display = 'inline-block';
            }
        }
    }
}

const pvpEmulator = new PvPEmulatorEngine();

// --- Delta-Time Game Loop ---
let lastTime = performance.now();
let frameCount = 0;
let lastFpsUpdate = performance.now();

// Reset delta-time clock when returning to tab to prevent physics spikes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        lastTime = performance.now();
    } else {
        activeKeys.clear();
        isPointerDown = false;
    }
});

function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    // Calculate delta time in seconds, clamped between 1ms and 50ms for buttery-smooth consistency
    let dt = (currentTime - lastTime) / 1000;
    dt = Math.max(0.001, Math.min(dt, 0.05));
    lastTime = currentTime;

    // Physics update step
    updatePhysics(dt);

    // Cool down ballistic weapon heat
    if (currentWeaponHeat > 0) {
        currentWeaponHeat = Math.max(0, currentWeaponHeat - dt * 25);
        updateOverheatGauge();
    }

    ctx.save();
    const scaleX = canvas.width / ARENA_WIDTH;
    const scaleY = canvas.height / ARENA_HEIGHT;
    ctx.scale(scaleX, scaleY);

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

    // Update hit flash timers
    if (player.damageFlashTimer > 0) {
        player.damageFlashTimer -= dt;
        if (player.damageFlashTimer < 0) player.damageFlashTimer = 0;
    }
    remotePlayers.forEach(rp => {
        if (rp.damageFlashTimer > 0) {
            rp.damageFlashTimer -= dt;
            if (rp.damageFlashTimer < 0) rp.damageFlashTimer = 0;
        }
    });

    // Visual render step: arena surface -> safe zone -> hazards -> beacon -> obstacles -> coins -> power-ups -> projectiles -> remote players -> local player -> sparks -> shockwaves -> floating text -> hitmarkers
    renderArena();
    renderSafeZone();
    renderHazards();
    renderOverchargeBeacon();
    renderObstacles();
    renderCoins();
    renderPowerUps();
    renderProjectiles();
    renderRailBeams(dt);
    renderThrusters(dt);
    renderRemotePlayers();
    renderPlayer();
    renderMuzzleFlashes(dt);
    renderCombatSparks(dt);
    renderShockwaves(dt);
    renderPings(dt);
    renderEmotes(dt);
    renderFloatingTexts(dt);
    renderHitmarkers();
    renderTacticalReticle();
    renderTacticalRadar();

    if (hasShake) {
        ctx.restore();
    }
    ctx.restore(); // restore dpr high-res matrix

    updateAbilityHud();

    // Render cinematic procedural menu operator canvases if visible
    renderHeroCanvases(currentTime);

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

// --- Backend Health Check & Vercel / Offline Arcade Architecture ---
let isServerOnline = false;

function getBackendBaseUrl() {
    const custom = localStorage.getItem('CYBER_ARENA_BACKEND_URL');
    if (custom && custom.trim().length > 0) {
        return custom.trim().replace(/\/+$/, '');
    }
    return '';
}

function getLocalArcadeProfile() {
    const raw = localStorage.getItem('CYBER_ARENA_LOCAL_PROFILE');
    if (raw) {
        try {
            const p = JSON.parse(raw);
            if (p && p.username) return p;
        } catch {}
    }
    const randId = Math.floor(1000 + Math.random() * 9000);
    const newProfile = {
        username: `Pilot_${randId}`,
        level: 1,
        xp: 0,
        kills: 0,
        deaths: 0,
        wins: 0,
        totalGames: 0,
        totalScore: 0,
        highestScore: 0,
        equippedTitle: 'RECRUIT',
        equippedTrail: 'CYAN_PULSE',
        unlockedTitles: ['RECRUIT'],
        unlockedTrails: ['CYAN_PULSE'],
        matches: []
    };
    saveLocalArcadeProfile(newProfile);
    return newProfile;
}

function saveLocalArcadeProfile(profile) {
    try {
        localStorage.setItem('CYBER_ARENA_LOCAL_PROFILE', JSON.stringify(profile));
    } catch {}
}

function ensureLocalArcadeProfile() {
    const profile = getLocalArcadeProfile();
    currentUserProfile = profile;
            updateHomeIntelDock(profile);
    updateAuthState(profile);
    const userLevelBadge = document.getElementById('userLevelBadge');
    const userTitleBadge = document.getElementById('userTitleBadge');
    if (userLevelBadge) userLevelBadge.textContent = `LVL ${profile.level || 1}`;
    if (userTitleBadge) userTitleBadge.textContent = profile.equippedTitle || 'RECRUIT';
    if (!localStorage.getItem(JWT_STORAGE_KEY)) {
        localStorage.setItem(JWT_STORAGE_KEY, 'arcade_session_' + profile.username);
    }
    return profile;
}

async function checkBackendHealth() {
    const t0 = performance.now();
    const baseUrl = getBackendBaseUrl();
    try {
        const response = await fetch(`${baseUrl}/api/health`);
        const rtt = Math.round(performance.now() - t0);
        if (response.ok) {
            isServerOnline = true;
            statusDot.className = 'status-dot online';
            statusText.textContent = 'ONLINE';
            if (hudPing) {
                hudPing.textContent = `${rtt} ms`;
                hudPing.className = 'telemetry-ping ' + (rtt < 60 ? 'good' : (rtt < 130 ? 'moderate' : 'high'));
            }
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch {
        isServerOnline = false;
        statusDot.className = 'status-dot arcade';
        statusText.textContent = 'ARCADE';
        if (hudPing) {
            hudPing.textContent = '0 ms';
            hudPing.className = 'telemetry-ping good';
        }
        ensureLocalArcadeProfile();
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
        highScoreBadge.textContent = `BEST: ${user.highestScore || 0}`;
        player.name = user.username;
        hudPlayer.textContent = user.username;
    } else {
        userProfileBadge.style.display = 'none';
        if (openMatchHistoryBtn) openMatchHistoryBtn.style.display = 'none';
        authButtons.style.display = 'flex';
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

    if (!isServerOnline) {
        const profile = getLocalArcadeProfile();
        profile.username = username;
        saveLocalArcadeProfile(profile);
        currentUserProfile = profile;
        localStorage.setItem(JWT_STORAGE_KEY, 'arcade_token_' + username);
        updateAuthState(profile);
        closeModal();
        showTacticalToast(`Authorized Pilot: ${username}`, 'Arcade Profile Synchronized', '🎮');
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = currentAuthMode === 'login' ? 'Log In' : 'Register Account';
        return;
    }

    try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(`${baseUrl}${endpoint}`, {
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
        // Fallback to local profile when server is offline
        const profile = getLocalArcadeProfile();
        profile.username = username;
        saveLocalArcadeProfile(profile);
        currentUserProfile = profile;
        localStorage.setItem(JWT_STORAGE_KEY, 'arcade_token_' + username);
        updateAuthState(profile);
        closeModal();
        showTacticalToast(`Authorized Pilot: ${username}`, 'Arcade Profile Synchronized (Offline)', '🎮');
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
const roomGameModeSelect = document.getElementById('roomGameModeSelect');
const maxPlayersSelect = document.getElementById('maxPlayersSelect');
const createRoomAlert = document.getElementById('createRoomAlert');

const currentRoomId = document.getElementById('currentRoomId');
const currentRoomModeBadge = document.getElementById('currentRoomModeBadge');
const hudModeBadge = document.getElementById('hudModeBadge');
const currentRoomName = document.getElementById('currentRoomName');
const currentRoomStatus = document.getElementById('currentRoomStatus');
const playersRoster = document.getElementById('playersRoster');
const leaveRoomBtn = document.getElementById('leaveRoomBtn');
const readyBtn = document.getElementById('readyBtn');
const startGameBtn = document.getElementById('startGameBtn');
const addBotBtn = document.getElementById('addBotBtn');
const pvpDuelBtn = document.getElementById('pvpDuelBtn');
const pvePracticeBtn = document.getElementById('pvePracticeBtn');

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

// Instant Guest Play workflow (0-Friction Immediate Action)
async function quickGuestPlay() {
    if (isAuthenticated()) return true;
    if (!isServerOnline) {
        const p = ensureLocalArcadeProfile();
        closeModal();
        showTacticalToast(`⚡ Guest Pilot: ${p.username} Activated!`, 'Ready for combat deployment', '🎮');
        return true;
    }
    try {
        const baseUrl = getBackendBaseUrl();
        const randId = Math.floor(1000 + Math.random() * 9000);
        const guestName = `Pilot_${randId}`;
        const guestPass = `pass_${randId}_guest`;

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: guestName, password: guestPass })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem(JWT_STORAGE_KEY, data.token);
            updateAuthState(data);
            closeModal();
            showTacticalToast(`⚡ Guest Identity: ${guestName} Activated!`, 'Ready for combat deployment', '🎮');
            return true;
        } else {
            const p = ensureLocalArcadeProfile();
            closeModal();
            showTacticalToast(`⚡ Guest Pilot: ${p.username} Activated!`, 'Ready for combat deployment', '🎮');
            return true;
        }
    } catch (err) {
        const p = ensureLocalArcadeProfile();
        closeModal();
        showTacticalToast(`⚡ Guest Pilot: ${p.username} Activated!`, 'Ready for combat deployment', '🎮');
        return true;
    }
}

let cachedRoomsList = [];
let currentRoomFilterMode = 'ALL';
let currentRoomSearchQuery = '';

function renderFilteredRooms() {
    if (!roomsContainer) return;
    roomsContainer.innerHTML = '';

    const query = currentRoomSearchQuery.trim().toLowerCase();
    const filtered = cachedRoomsList.filter(room => {
        // Mode filter
        const mode = room.gameMode || (room.maxPlayers === 2 ? 'PVP_1V1' : 'PVP_FFA');
        if (currentRoomFilterMode === 'PVP_FFA' && mode !== 'PVP_FFA' && mode !== 'PVP_CHAOS') return false;
        if (currentRoomFilterMode === 'PVP_1V1' && mode !== 'PVP_1V1') return false;
        if (currentRoomFilterMode === 'OPEN' && (room.status === 'PLAYING' || room.currentPlayers >= room.maxPlayers)) return false;

        // Query filter
        if (query) {
            const matchName = (room.name || '').toLowerCase().includes(query);
            const matchId = (room.roomId || '').toLowerCase().includes(query);
            const matchHost = (room.hostUsername || '').toLowerCase().includes(query);
            if (!matchName && !matchId && !matchHost) return false;
        }
        return true;
    });

    roomCountBadge.textContent = `${filtered.length} Arena${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        roomsContainer.appendChild(emptyRoomsMsg);
        return;
    }

    filtered.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';

        const isPlaying = room.status === 'PLAYING';
        const isFull = room.currentPlayers >= room.maxPlayers;
        const canJoin = !isPlaying && !isFull;
        const mode = room.gameMode || (room.maxPlayers === 2 ? 'PVP_1V1' : 'PVP_FFA');
        const modeBadgeHtml = mode === 'PVP_1V1'
            ? '<span class="room-mode-badge mode-1v1">⚔️ 1v1 DUEL</span>'
            : (mode === 'PVP_CHAOS'
                ? '<span class="room-mode-badge mode-chaos">🔥 CHAOS</span>'
                : '<span class="room-mode-badge mode-ffa">💀 FFA</span>');

        card.innerHTML = `
            <div class="room-card-header">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span class="room-code-tag">${escapeHtml(room.roomId)}</span>
                    ${modeBadgeHtml}
                </div>
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
            joinBtn.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    await quickGuestPlay();
                }
                joinRoom(room.roomId, false);
            });
        }

        const spectateBtn = card.querySelector('.room-spectate-btn');
        if (spectateBtn) {
            spectateBtn.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    await quickGuestPlay();
                }
                joinRoom(room.roomId, true);
            });
        }

        roomsContainer.appendChild(card);
    });
}

function openPvPEmulatorModal() {
    const pvpEmulatorModal = document.getElementById('pvpEmulatorModal');
    if (pvpEmulatorModal) pvpEmulatorModal.style.display = 'flex';
}

async function fetchRoomsList() {
    if (!isServerOnline) {
        if (roomsContainer) {
            roomsContainer.innerHTML = `
                <div class="arcade-custom-launcher-card" style="padding: 18px 24px; background: rgba(14, 19, 34, 0.88); border: 1px solid var(--border-highlight); border-radius: var(--radius-md); text-align: center;">
                    <div style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: var(--cyan-primary); letter-spacing: 2px; margin-bottom: 6px;">ARCADE COMBAT SIMULATOR</div>
                    <p style="color: #94a3b8; font-size: 0.84rem; margin-bottom: 16px;">Deploy customized tactical matches instantly against autonomous AI combatants across all 3 arena sectors.</p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button type="button" class="btn-primary-action" id="arcadeLaunchFfaBtn" style="padding: 8px 18px;">⚔️ QUICK FFA (CYBER CORE)</button>
                        <button type="button" class="btn-secondary-action" id="arcadeLaunchDuelBtn" style="padding: 8px 18px;">🔥 1V1 APEX DUEL (NEON OUTPOST)</button>
                        <button type="button" class="btn-secondary-action" id="arcadeLaunchCustomBtn" style="padding: 8px 18px;">⚙️ CONFIGURE CUSTOM ARENA</button>
                    </div>
                </div>
                <div class="featured-arenas-header" style="margin-top: 18px; display: flex; align-items: center; gap: 10px;">
                    <span class="tactical-badge">ARENA DIRECTORY</span>
                    <span class="featured-arenas-title">DEPLOYMENT MAPS & COMBAT THEATERS</span>
                </div>
                <div class="featured-maps-grid">
                    <div class="featured-map-card" data-map="CYBER_CORE">
                        <div class="map-card-thumb map-cyber-core">
                            <span class="map-type-pill">STANDARD</span>
                            <span class="map-scale-tag">1600 × 1200</span>
                        </div>
                        <div class="map-card-body">
                            <h4 class="map-title">Cyber Core</h4>
                            <p class="map-desc">Central fortified bunker with dual jump conduits, 4 tactical control beacons, and high cover density.</p>
                            <div class="map-card-footer">
                                <span class="map-hazard-tag">⚡ Jump Pads + Barrels</span>
                                <button type="button" class="btn-host-map" id="arcadeMapCoreBtn">PLAY THIS MAP</button>
                            </div>
                        </div>
                    </div>
                    <div class="featured-map-card" data-map="NEON_OUTPOST">
                        <div class="map-card-thumb map-neon-outpost">
                            <span class="map-type-pill">CQB DUEL</span>
                            <span class="map-scale-tag">1200 × 900</span>
                        </div>
                        <div class="map-card-body">
                            <h4 class="map-title">Neon Outpost</h4>
                            <p class="map-desc">High-speed tactical arena featuring dual horizontal battlements, 2 central power stations, and rapid slingshots.</p>
                            <div class="map-card-footer">
                                <span class="map-hazard-tag">🔥 Slingshots + EMP</span>
                                <button type="button" class="btn-host-map" id="arcadeMapOutpostBtn">PLAY THIS MAP</button>
                            </div>
                        </div>
                    </div>
                    <div class="featured-map-card" data-map="ORBITAL_STATION">
                        <div class="map-card-thumb map-orbital-station">
                            <span class="map-type-pill">WIDE THEATER</span>
                            <span class="map-scale-tag">1800 × 1400</span>
                        </div>
                        <div class="map-card-body">
                            <h4 class="map-title">Orbital Station</h4>
                            <p class="map-desc">Low-gravity reactor complex with superheated geothermal vents, long sniper sightlines, and quad boost pads.</p>
                            <div class="map-card-footer">
                                <span class="map-hazard-tag">🌀 Geothermal Vents</span>
                                <button type="button" class="btn-host-map" id="arcadeMapOrbitalBtn">PLAY THIS MAP</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const ffaBtn = document.getElementById('arcadeLaunchFfaBtn');
            const duelBtn = document.getElementById('arcadeLaunchDuelBtn');
            const customBtn = document.getElementById('arcadeLaunchCustomBtn');
            const coreBtn = document.getElementById('arcadeMapCoreBtn');
            const outpostBtn = document.getElementById('arcadeMapOutpostBtn');
            const orbitalBtn = document.getElementById('arcadeMapOrbitalBtn');
            if (ffaBtn) ffaBtn.addEventListener('click', () => pvpEmulator.start({ mode: 'FFA_SOLO', map: 'CYBER_CORE', botCount: 3, targetScore: 10 }));
            if (duelBtn) duelBtn.addEventListener('click', () => pvpEmulator.start({ mode: 'DUEL_1V1', map: 'NEON_OUTPOST', difficulty: 'APEX', targetScore: 3 }));
            if (customBtn) customBtn.addEventListener('click', openPvPEmulatorModal);
            if (coreBtn) coreBtn.addEventListener('click', () => pvpEmulator.start({ mode: 'FFA_SOLO', map: 'CYBER_CORE', botCount: 3, targetScore: 10 }));
            if (outpostBtn) outpostBtn.addEventListener('click', () => pvpEmulator.start({ mode: 'DUEL_1V1', map: 'NEON_OUTPOST', difficulty: 'APEX', targetScore: 3 }));
            if (orbitalBtn) orbitalBtn.addEventListener('click', () => pvpEmulator.start({ mode: 'FFA_SOLO', map: 'ORBITAL_STATION', botCount: 4, targetScore: 15 }));
        }
        return;
    }
    try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(`${baseUrl}/api/rooms`, { headers: getAuthHeaders() });
        if (!response.ok) return;

        cachedRoomsList = await response.json();
        renderFilteredRooms();
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
let reconnectAttempts = 0;
let reconnectTimer = null;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;

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
            reconnectAttempts = 0;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            const reconnectBanner = document.getElementById('networkReconnectingBanner');
            if (reconnectBanner) reconnectBanner.style.display = 'none';

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

            // Resilient bounded exponential reconnection if in active room
            if (activeRoom && activeRoom.roomId === roomId && !event.wasClean) {
                reconnectAttempts++;
                if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                    const backoffDelay = Math.min(
                        INITIAL_RECONNECT_DELAY_MS * Math.pow(1.8, reconnectAttempts - 1),
                        MAX_RECONNECT_DELAY_MS
                    );
                    const reconnectBanner = document.getElementById('networkReconnectingBanner');
                    const bannerText = document.getElementById('reconnectingBannerText');
                    if (reconnectBanner && bannerText) {
                        reconnectBanner.style.display = 'flex';
                        bannerText.textContent = `RECONNECTING (ATTEMPT ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) IN ${(backoffDelay / 1000).toFixed(1)}S...`;
                    }
                    if (hudState) hudState.textContent = `WS: Reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`;

                    if (reconnectTimer) clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => {
                        if (activeRoom && activeRoom.roomId === roomId) {
                            connectGameWebSocket(roomId);
                        }
                    }, backoffDelay);
                } else {
                    const bannerText = document.getElementById('reconnectingBannerText');
                    if (bannerText) bannerText.textContent = 'CONNECTION LOST. PLEASE RETURN TO LOBBY.';
                    showTacticalToast('Session Disconnected', 'Could not restore arena session after 10 attempts.', '⚠️');
                }
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
    reconnectAttempts = 0;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    const reconnectBanner = document.getElementById('networkReconnectingBanner');
    if (reconnectBanner) reconnectBanner.style.display = 'none';

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
                        targetX: msg.x,
                        targetY: msg.y,
                        heading: msg.heading,
                        targetHeading: msg.heading,
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
                    rp.targetX = msg.x;
                    rp.targetY = msg.y;
                    rp.targetHeading = msg.heading;
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
            if (activeRoom) {
                activeRoom.status = 'PLAYING';
            }
            updateGameLayoutState();
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
            if (msg.mapId && activeRoom) {
                activeRoom.mapId = msg.mapId;
            }
            if (msg.beaconActive !== undefined && activeRoom) {
                activeRoom.beaconActive = !!msg.beaconActive;
                activeRoom.beaconCapturedBy = msg.beaconCapturedBy || null;
                updateBeaconHud(activeRoom.beaconActive, activeRoom.beaconCapturedBy);
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
                        equippedTrail: (p.shooterUsername === player.name || p.shooter === player.name) ? (player.equippedTrail || 'CYAN_PULSE') : (p.equippedTrail || 'CYAN_PULSE'),
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
                            targetX: p.x,
                            targetY: p.y,
                            heading: p.heading || 0,
                            targetHeading: p.heading || 0,
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
                updateGameLayoutState();
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
                equippedTrail: (msg.shooter === player.name) ? (player.equippedTrail || 'CYAN_PULSE') : (msg.equippedTrail || 'CYAN_PULSE'),
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

            // Tactile Combat Sparks & Silhouettes
            addCombatSparks(targetX, targetY, isMe ? '#f43f5e' : '#38bdf8', 12);

            if (msg.shieldDamage > 0) {
                if (msg.currentShield === 0) {
                    soundEngine.playShieldBreak();
                    addFloatingText('⚡ SHIELD BROKEN!', targetX, targetY - 42, '#00f2fe', true);
                    addShockwave(targetX, targetY, 36, '#06b6d4');
                    addCombatSparks(targetX, targetY, '#38bdf8', 16);
                } else {
                    soundEngine.playShieldDeflect();
                }
                addFloatingText(`-${msg.shieldDamage} 🛡️`, targetX, targetY - 28, '#06b6d4', false);
            }
            if (msg.healthDamage > 0) {
                const isCrit = msg.healthDamage >= 30;
                soundEngine.playHit();
                addFloatingText(`-${msg.healthDamage}`, targetX, targetY - 14, isMe ? '#ef4444' : '#f87171', isCrit);
            } else if (!msg.shieldDamage) {
                soundEngine.playHit();
                addFloatingText(`-${msg.damage}`, targetX, targetY - 14, isMe ? '#ef4444' : '#f87171', false);
            }

            if (isMe) {
                player.damageFlashTimer = 0.14;
                triggerDamageVignette(180);
                triggerScreenShake(msg.healthDamage >= 30 ? 7 : 3.5, 0.15);
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
                    rp.damageFlashTimer = 0.14;
                    if (msg.currentShield !== undefined) rp.shield = msg.currentShield;
                    rp.health = msg.currentHealth;
                    rp.alive = !msg.isEliminated;
                }
                // If local player was shooter or fired recently, trigger hitmarker feedback
                if (msg.shooterUsername === player.name || (performance.now() - player.lastAttackTime < 800)) {
                    const isCrit = (msg.healthDamage >= 30);
                    triggerHitmarker(isCrit);
                    soundEngine.playHitmarker(isCrit);
                }
            }
            break;
        }
        case 'BEACON_UPDATE': {
            if (activeRoom) {
                activeRoom.beaconActive = !!msg.active;
                activeRoom.beaconCapturedBy = msg.capturedBy || null;
            }
            updateBeaconHud(msg.active, msg.capturedBy);
            if (msg.active) {
                soundEngine.playPowerUp();
                showTacticalToast('Beacon Active', 'Overcharge beacon online! Secure center coordinate.', '⚡');
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
                soundEngine.playKillSting();
                showKillBanner(msg.victim, 25);
                triggerScreenShake(6.5, 0.25);
                addFloatingText('+25 ELIMINATION!', player.x, player.y - 24, '#fbbf24', true);
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
                updateGameLayoutState();
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
const hudHpGhost = document.getElementById('hudHpGhost');
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
        if (hudHpGhost) {
            hudHpGhost.style.width = `${hpPct}%`;
        }
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

    if (hpRatio <= 0.28 && player.alive) {
        hudHp.className = 'low-hp';
        document.getElementById('combatDamageVignette')?.classList.add('danger-pulse');
        soundEngine.updateHeartbeat(true);
    } else if (hpRatio <= 0.5) {
        hudHp.className = 'mid-hp';
        document.getElementById('combatDamageVignette')?.classList.remove('danger-pulse');
        soundEngine.updateHeartbeat(false);
    } else {
        hudHp.className = '';
        document.getElementById('combatDamageVignette')?.classList.remove('danger-pulse');
        soundEngine.updateHeartbeat(false);
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(reportText).then(() => {
            if (copyBattleReportBtn) {
                const originalText = copyBattleReportBtn.textContent;
                copyBattleReportBtn.textContent = '✅ Copied to Clipboard!';
                setTimeout(() => { copyBattleReportBtn.textContent = originalText; }, 2200);
            }
        }).catch(() => {
            if (copyBattleReportBtn) {
                const originalText = copyBattleReportBtn.textContent;
                copyBattleReportBtn.textContent = '📋 Report Generated!';
                setTimeout(() => { copyBattleReportBtn.textContent = originalText; }, 2200);
            }
        });
    } else {
        if (copyBattleReportBtn) {
            const originalText = copyBattleReportBtn.textContent;
            copyBattleReportBtn.textContent = '📋 Report Ready!';
            setTimeout(() => { copyBattleReportBtn.textContent = originalText; }, 2200);
        }
    }
}

function closeGameOverModal() {
    gameOverModal.style.display = 'none';
}

async function triggerRematch() {
    if (pvpEmulator && pvpEmulator.isActive) {
        closeGameOverModal();
        pvpEmulator.start({
            map: pvpEmulator.map,
            mode: pvpEmulator.mode,
            difficulty: pvpEmulator.difficulty,
            botCount: pvpEmulator.botCount,
            targetScore: pvpEmulator.targetScore,
            heroClass: player.warriorClass || mySelectedClass
        });
        return;
    }
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

function renderLocalCareerProfile() {
    const profile = getLocalArcadeProfile();
    currentUserProfile = profile;
    if (profileStatUsername) profileStatUsername.textContent = profile.username;
    if (profileStatGames) profileStatGames.textContent = profile.totalGames || 0;
    if (profileStatTotalScore) profileStatTotalScore.textContent = profile.totalScore || 0;
    if (profileStatHighScore) profileStatHighScore.textContent = profile.highestScore || 0;

    const statLevel = document.getElementById('profileStatLevel');
    const statXpFill = document.getElementById('profileStatXpFill');
    const statXpText = document.getElementById('profileStatXpText');
    const statKd = document.getElementById('profileStatKd');
    const statWins = document.getElementById('profileStatWins');
    const statTitle = document.getElementById('profileStatTitle');
    const userLevelBadge = document.getElementById('userLevelBadge');
    const userTitleBadge = document.getElementById('userTitleBadge');

    const lvl = profile.level || 1;
    const xp = profile.xp || 0;
    const xpInLevel = xp % 1000;
    const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100));
    const kills = profile.kills || 0;
    const deaths = profile.deaths || 0;
    const kdRatio = (kills / Math.max(1, deaths)).toFixed(2);

    if (statLevel) statLevel.textContent = `LVL ${lvl}`;
    if (statXpFill) statXpFill.style.width = `${xpPct}%`;
    if (statXpText) statXpText.textContent = `${xpInLevel} / 1000 XP (Total: ${xp} XP)`;
    if (statKd) statKd.textContent = `${kills} / ${deaths} (${kdRatio})`;
    if (statWins) statWins.textContent = `${profile.wins || 0} Victories`;
    if (statTitle) statTitle.textContent = profile.equippedTitle || 'RECRUIT';

    if (userLevelBadge) userLevelBadge.textContent = `LVL ${lvl}`;
    if (userTitleBadge) userTitleBadge.textContent = profile.equippedTitle || 'RECRUIT';

    populateCosmeticsLocker(profile);
    updateHomeIntelDock(profile);

    const matches = profile.matches || [];
    if (matches.length === 0) {
        matchHistoryList.innerHTML = `<div class="empty-state-card" id="emptyCareerCard">
              <div class="empty-state-icon">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#16C8F2" stroke-width="1.8">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
              </div>
              <div class="empty-state-title">NO COMBAT OPERATIONS RECORDED</div>
              <p class="empty-state-desc">Your pilot flight telemetry and combat log diagnostics will initialize automatically when you enter battle. Deploy into quick matches, PvP duels, or bot simulations to record K/D ratios, match accolades, and career XP.</p>
              <div class="empty-state-actions">
                  <button class="btn-primary-action" type="button" onclick="switchView('play')" style="padding: 10px 22px;">
                      <span>DEPLOY COMBAT ARENA</span>
                  </button>
              </div>
          </div>`;
        return;
    }

    matchHistoryList.innerHTML = matches.map(m => {
        const dateStr = new Date(m.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(m.finishedAt).toLocaleDateString();
        const isWinner = m.winner === profile.username || m.winnerUsername === profile.username;
        const outcomeClass = isWinner ? 'victory' : 'defeat';
        const outcomeText = isWinner ? '🏆 Victory' : 'Defeat';

        const chips = Object.entries(m.scores || {}).map(([uname, score]) => {
            const isWin = uname === m.winner || uname === m.winnerUsername;
            return `<span class="match-player-chip ${isWin ? 'is-winner' : ''}">${isWin ? '👑 ' : ''}${escapeHtml(uname)}: ${score}</span>`;
        }).join('');

        return `
            <div class="match-card">
                <div class="match-card-top">
                    <span class="match-card-title">
                        <span>${escapeHtml(m.roomName || 'Arcade Arena')}</span>
                        <span class="room-code-tag">${escapeHtml(m.roomId || 'ARCADE')}</span>
                    </span>
                    <span class="match-outcome-badge ${outcomeClass}">${outcomeText}</span>
                </div>
                <div class="match-card-details">
                    <span>Score: <strong class="match-personal-score">${m.playerScore || 0} pts</strong></span>
                    <span>Duration: ${m.durationSeconds || 0}s</span>
                    <span class="match-time-tag">${dateStr}</span>
                </div>
                <div class="match-roster-breakdown">
                    ${chips}
                </div>
            </div>
        `;
    }).join('');
}

async function fetchAndShowMatchHistory(openModalFlag = false) {
    if (openModalFlag && matchHistoryModal) matchHistoryModal.style.display = 'flex';
    matchHistoryList.innerHTML = '<div class="empty-history-msg">Loading battle records...</div>';

    if (!isServerOnline) {
        renderLocalCareerProfile();
        return;
    }

    // Populate user career stats
    try {
        const baseUrl = getBackendBaseUrl();
        const profileRes = await fetch(`${baseUrl}/api/auth/me`, { headers: getAuthHeaders() });
        if (profileRes.ok) {
            const profile = await profileRes.json();
            currentUserProfile = profile;
            profileStatUsername.textContent = profile.username;
            profileStatGames.textContent = profile.totalGames;
            profileStatTotalScore.textContent = profile.totalScore;
            profileStatHighScore.textContent = profile.highestScore;

            // Progression level & XP
            const statLevel = document.getElementById('profileStatLevel');
            const statXpFill = document.getElementById('profileStatXpFill');
            const statXpText = document.getElementById('profileStatXpText');
            const statKd = document.getElementById('profileStatKd');
            const statWins = document.getElementById('profileStatWins');
            const statTitle = document.getElementById('profileStatTitle');
            const userLevelBadge = document.getElementById('userLevelBadge');
            const userTitleBadge = document.getElementById('userTitleBadge');

            const lvl = profile.level || 1;
            const xp = profile.xp || 0;
            const xpInLevel = xp % 1000;
            const xpPct = Math.min(100, Math.round((xpInLevel / 1000) * 100));
            const kills = profile.kills || 0;
            const deaths = profile.deaths || 0;
            const kdRatio = (kills / Math.max(1, deaths)).toFixed(2);

            if (statLevel) statLevel.textContent = `LVL ${lvl}`;
            if (statXpFill) statXpFill.style.width = `${xpPct}%`;
            if (statXpText) statXpText.textContent = `${xpInLevel} / 1000 XP (Total: ${xp} XP)`;
            if (statKd) statKd.textContent = `${kills} / ${deaths} (${kdRatio})`;
            if (statWins) statWins.textContent = `${profile.wins || 0} Victories`;
            if (statTitle) statTitle.textContent = profile.equippedTitle || 'RECRUIT';

            if (userLevelBadge) userLevelBadge.textContent = `LVL ${lvl}`;
            if (userTitleBadge) userTitleBadge.textContent = profile.equippedTitle || 'RECRUIT';

            player.equippedTitle = profile.equippedTitle || 'RECRUIT';
            player.equippedTrail = profile.equippedTrail || 'CYAN_PULSE';

            populateCosmeticsLocker(profile);
            populateClassMastery(profile.weaponMastery);
            populateDailyChallenges(profile.dailyChallenges);
        } else {
            renderLocalCareerProfile();
            return;
        }
    } catch {
        renderLocalCareerProfile();
        return;
    }

    // Fetch match logs
    try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/api/matches/me`, { headers: getAuthHeaders() });
        if (res.ok) {
            const matches = await res.json();
            if (matches.length === 0) {
                matchHistoryList.innerHTML = `<div class="empty-state-card" id="emptyCareerCard">
              <div class="empty-state-icon">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#16C8F2" stroke-width="1.8">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
              </div>
              <div class="empty-state-title">NO COMBAT OPERATIONS RECORDED</div>
              <p class="empty-state-desc">Your pilot flight telemetry and combat log diagnostics will initialize automatically when you enter battle. Deploy into quick matches, PvP duels, or bot simulations to record K/D ratios, match accolades, and career XP.</p>
              <div class="empty-state-actions">
                  <button class="btn-primary-action" type="button" onclick="switchView('play')" style="padding: 10px 22px;">
                      <span>DEPLOY COMBAT ARENA</span>
                  </button>
              </div>
          </div>`;
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
        } else {
            renderLocalCareerProfile();
        }
    } catch (e) {
        renderLocalCareerProfile();
    }
}

function populateCosmeticsLocker(profile) {
    const titleSelect = document.getElementById('selectCosmeticTitle');
    const trailSelect = document.getElementById('selectCosmeticTrail');
    const unlockedTitles = profile.unlockedTitles || ['RECRUIT'];
    const unlockedTrails = profile.unlockedTrails || ['CYAN_PULSE'];

    const allTitles = [
        { id: 'RECRUIT', name: 'Recruit (Starter)' },
        { id: 'CYBER_STRIKER', name: 'Cyber Striker (Level 2)' },
        { id: 'ARENA_VETERAN', name: 'Arena Veteran (Level 5)' },
        { id: 'APEX_PREDATOR', name: 'Apex Predator (Level 8)' },
        { id: 'CYBER_IMMORTAL', name: 'Cyber Immortal (Level 12)' }
    ];

    if (titleSelect) {
        titleSelect.innerHTML = allTitles.map(t => {
            const isUnlocked = unlockedTitles.includes(t.id);
            const isEquipped = (profile.equippedTitle || 'RECRUIT') === t.id;
            return `<option value="${t.id}" ${isEquipped ? 'selected' : ''} ${!isUnlocked ? 'disabled' : ''}>${t.name}${isEquipped ? ' [EQUIPPED]' : (isUnlocked ? '' : ' 🔒')}</option>`;
        }).join('');
    }

    const allTrails = [
        { id: 'CYAN_PULSE', name: 'Cyan Pulse (Standard)', color: '#00f2fe' },
        { id: 'EMERALD_SURGE', name: 'Emerald Surge (Level 3)', color: '#10b981' },
        { id: 'CRIMSON_NEON', name: 'Crimson Neon (Level 5)', color: '#f43f5e' },
        { id: 'GOLDEN_VALOR', name: 'Golden Valor (Level 8)', color: '#f59e0b' }
    ];

    if (trailSelect) {
        trailSelect.innerHTML = allTrails.map(t => {
            const isUnlocked = unlockedTrails.includes(t.id);
            const isEquipped = (profile.equippedTrail || 'CYAN_PULSE') === t.id;
            return `<option value="${t.id}" ${isEquipped ? 'selected' : ''} ${!isUnlocked ? 'disabled' : ''}>${t.name}${isEquipped ? ' [EQUIPPED]' : (isUnlocked ? '' : ' 🔒')}</option>`;
        }).join('');
        trailSelect.onchange = () => {
            updateTrailPreview(trailSelect.value);
        };
    }

    updateTrailPreview(profile.equippedTrail || 'CYAN_PULSE');
}

function updateTrailPreview(trailId) {
    const swatch = document.getElementById('trailPreviewSwatch');
    const label = document.getElementById('trailPreviewLabel');
    if (!swatch || !label) return;
    const colors = {
        'CYAN_PULSE': { color: '#00f2fe', label: 'Cyan Pulse Stream' },
        'EMERALD_SURGE': { color: '#10b981', label: 'Emerald Surge Stream' },
        'CRIMSON_NEON': { color: '#f43f5e', label: 'Crimson Neon Stream' },
        'GOLDEN_VALOR': { color: '#f59e0b', label: 'Golden Valor Stream' }
    };
    const c = colors[trailId] || colors['CYAN_PULSE'];
    const core = swatch.querySelector('.trail-swatch-core');
    if (core) {
        core.style.background = c.color;
        core.style.boxShadow = `0 0 12px ${c.color}`;
    }
    label.textContent = c.label;
}

async function equipSelectedCosmetics() {
    const titleSelect = document.getElementById('selectCosmeticTitle');
    const trailSelect = document.getElementById('selectCosmeticTrail');
    const title = titleSelect ? titleSelect.value : 'RECRUIT';
    const trail = trailSelect ? trailSelect.value : 'CYAN_PULSE';

    try {
        const res = await fetch('/api/auth/equip-cosmetics', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, trail })
        });
        if (res.ok) {
            const updated = await res.json();
            player.equippedTitle = updated.equippedTitle;
            player.equippedTrail = updated.equippedTrail;
            const statTitle = document.getElementById('profileStatTitle');
            const userTitleBadge = document.getElementById('userTitleBadge');
            if (statTitle) statTitle.textContent = updated.equippedTitle;
            if (userTitleBadge) userTitleBadge.textContent = updated.equippedTitle;
            updateTrailPreview(updated.equippedTrail);
            showTacticalToast('Loadout Saved', `Equipped ${updated.equippedTitle} & ${updated.equippedTrail}`, '🎨');
            if (soundEngine) soundEngine.playEmote();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to equip cosmetic');
        }
    } catch (e) {
        alert('Network error equipping cosmetic: ' + e.message);
    }
}

function populateClassMastery(mastery) {
    if (!mastery) return;
    const classes = ['ASSAULT', 'SNIPER', 'JUGGERNAUT', 'SCOUT'];
    classes.forEach(c => {
        const tierEl = document.getElementById(`mastery${c.charAt(0) + c.slice(1).toLowerCase()}Tier`);
        const fillEl = document.getElementById(`mastery${c.charAt(0) + c.slice(1).toLowerCase()}Fill`);
        const xpEl = document.getElementById(`mastery${c.charAt(0) + c.slice(1).toLowerCase()}Xp`);

        const mData = mastery[c] || { xp: 0, level: 1 };
        const tier = mData.level || 1;
        const xp = mData.xp || 0;
        const xpInTier = xp % 500;
        const pct = Math.min(100, Math.round((xpInTier / 500) * 100));

        if (tierEl) tierEl.textContent = `Tier ${tier}`;
        if (fillEl) fillEl.style.width = `${pct}%`;
        if (xpEl) xpEl.textContent = `${xpInTier} / 500 XP (Total: ${xp})`;
    });
}

function populateDailyChallenges(challenges) {
    const list = document.getElementById('dailyChallengesList');
    if (!list) return;
    if (!challenges || challenges.length === 0) {
        list.innerHTML = '<div class="empty-state-card">No daily directives active. Check back at 00:00 UTC.</div>';
        return;
    }
    list.innerHTML = challenges.map(ch => `
        <div class="daily-item ${ch.completed ? 'completed' : ''}">
            <span class="daily-item-title">${ch.completed ? '✅ ' : '⚡ '}${escapeHtml(ch.title)}</span>
            <span class="daily-item-reward">+${ch.xpReward} XP</span>
        </div>
    `).join('');
}

function closeMatchHistoryModal() {
    matchHistoryModal.style.display = 'none';
}

function renderArcadeLeaderboard() {
    const profile = getLocalArcadeProfile();
    const mockData = [
        { rank: 1, username: 'APEX_PRIME', highestScore: 1850, totalScore: 14200, totalGames: 142 },
        { rank: 2, username: '[BOT] TITAN', highestScore: 1420, totalScore: 9800, totalGames: 110 },
        { rank: 3, username: '[BOT] VORTEX', highestScore: 1180, totalScore: 7400, totalGames: 89 },
        { rank: 4, username: profile.username, highestScore: profile.highestScore || 250, totalScore: profile.totalScore || 250, totalGames: profile.totalGames || 1 },
        { rank: 5, username: '[BOT] PHANTOM', highestScore: 940, totalScore: 5600, totalGames: 76 },
        { rank: 6, username: '[BOT] HAWK', highestScore: 780, totalScore: 4100, totalGames: 63 }
    ].sort((a, b) => b.highestScore - a.highestScore);

    mockData.forEach((d, i) => d.rank = i + 1);

    leaderboardTbody.innerHTML = mockData.map(entry => {
        let badgeClass = 'rank-other';
        let rankDisplay = entry.rank;
        if (entry.rank === 1) { badgeClass = 'rank-1'; rankDisplay = '🥇'; }
        else if (entry.rank === 2) { badgeClass = 'rank-2'; rankDisplay = '🥈'; }
        else if (entry.rank === 3) { badgeClass = 'rank-3'; rankDisplay = '🥉'; }
        const isMe = entry.username === profile.username;

        return `
            <tr class="${isMe ? 'highlight' : ''}">
                <td><span class="rank-badge ${badgeClass}">${rankDisplay}</span></td>
                <td class="warrior-name">${isMe ? '👑 ' : ''}${escapeHtml(entry.username)}</td>
                <td class="warrior-score-high">${entry.highestScore}</td>
                <td>${entry.totalScore}</td>
                <td>${entry.totalGames}</td>
            </tr>
        `;
    }).join('');
}

async function fetchAndShowLeaderboard(openModalFlag = false) {
    if (openModalFlag && leaderboardModal) leaderboardModal.style.display = 'flex';
    leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">Loading rankings...</td></tr>';

    if (!isServerOnline) {
        renderArcadeLeaderboard();
        return;
    }

    try {
        const baseUrl = getBackendBaseUrl();
        const res = await fetch(`${baseUrl}/api/leaderboard`);
        if (res.ok) {
            const data = await res.json();
            if (data.length === 0) {
                renderArcadeLeaderboard();
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
            renderArcadeLeaderboard();
        }
    } catch (e) {
        renderArcadeLeaderboard();
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

let currentActiveNavView = 'play';

function switchView(viewName) {
    currentActiveNavView = viewName;
    const views = {
        'play': document.getElementById('viewPlay'),
        'operators': document.getElementById('viewOperators'),
        'career': document.getElementById('viewCareer'),
        'leaderboard': document.getElementById('viewLeaderboard'),
        'arenas': document.getElementById('viewArenas')
    };

    // Close any modal that may be open when switching main navigation
    const activeRoomView = document.getElementById('activeRoomView');
    if (activeRoomView) activeRoomView.style.display = 'none';

    Object.keys(views).forEach(key => {
        const el = views[key];
        if (el) {
            if (key === viewName) {
                el.style.display = 'flex';
                el.classList.add('active');
            } else {
                el.style.display = 'none';
                el.classList.remove('active');
            }
        }
    });

    const navTabs = document.querySelectorAll('.client-topbar .nav-tab');
    navTabs.forEach(tab => {
        const tabView = tab.getAttribute('data-view');
        tab.classList.toggle('active', tabView === viewName);
    });

    if (viewName === 'leaderboard') {
        fetchAndShowLeaderboard(false);
    } else if (viewName === 'career') {
        fetchAndShowMatchHistory(false);
        renderAchievementsGrid();
    } else if (viewName === 'arenas') {
        fetchRoomsList();
    }
}

function updateGameLayoutState() {
    const isPlaying = activeRoom && activeRoom.status === 'PLAYING' && !isGameOver;
    const viewCombat = document.getElementById('viewCombat');
    const clientTopbar = document.getElementById('clientTopbar');
    const clientFooter = document.getElementById('clientFooter');
    const hudBar = document.getElementById('gameHudBar');
    const activeRoomView = document.getElementById('activeRoomView');

    if (isPlaying) {
        if (viewCombat) viewCombat.style.display = 'flex';
        if (hudBar) hudBar.style.display = 'flex';
        setTimeout(updateCanvasScaling, 40);
        if (clientTopbar) clientTopbar.style.display = 'none';
        if (clientFooter) clientFooter.style.display = 'none';
        ['viewPlay', 'viewOperators', 'viewCareer', 'viewLeaderboard', 'viewArenas', 'activeRoomView'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        document.body.classList.add('in-combat-mode');
    } else {
        if (viewCombat) viewCombat.style.display = 'none';
        if (hudBar) hudBar.style.display = 'none';
        if (clientTopbar) clientTopbar.style.display = 'flex';
        if (clientFooter) clientFooter.style.display = 'flex';
        document.body.classList.remove('in-combat-mode');

        if (activeRoom) {
            if (activeRoomView) activeRoomView.style.display = 'flex';
            ['viewPlay', 'viewOperators', 'viewCareer', 'viewLeaderboard', 'viewArenas'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
        } else {
            if (typeof switchView === 'function') {
                switchView(currentActiveNavView || 'play');
            }
        }
    }
    updateTouchControlsVisibility();
}

function switchToLobbyBrowser() {
    if (pvpEmulator && pvpEmulator.isActive) {
        pvpEmulator.stop();
    }
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
    const pauseMenuModal = document.getElementById('pauseMenuModal');
    if (pauseMenuModal) pauseMenuModal.style.display = 'none';
    disconnectGameWebSocket();
    stopRoomPolling();
    hudRoom.textContent = 'None (Lobby)';
    hudState.textContent = 'Combat Ready';
    fetchRoomsList();
    updateGameLayoutState();
    if (typeof switchView === 'function') {
        switchView('play');
    }
}

function renderActiveRoom(room) {
    activeRoom = room;
    const isPlaying = room.status === 'PLAYING';
    updateGameLayoutState();

    currentRoomId.textContent = room.roomId;
    currentRoomName.textContent = room.name;
    hudRoom.textContent = `${room.name} (${room.roomId})`;

    const mode = room.gameMode || (room.maxPlayers === 2 ? 'PVP_1V1' : 'PVP_FFA');
    if (currentRoomModeBadge) {
        if (mode === 'PVP_1V1') {
            currentRoomModeBadge.textContent = '1v1 DUEL';
            currentRoomModeBadge.className = 'room-mode-badge mode-1v1';
        } else if (mode === 'PVP_CHAOS') {
            currentRoomModeBadge.textContent = 'CHAOS FFA';
            currentRoomModeBadge.className = 'room-mode-badge mode-chaos';
        } else {
            currentRoomModeBadge.textContent = 'FFA DEATHMATCH';
            currentRoomModeBadge.className = 'room-mode-badge mode-ffa';
        }
    }

    if (hudModeBadge) {
        if (mode === 'PVP_1V1') {
            hudModeBadge.textContent = '1v1 DUEL';
        } else if (mode === 'PVP_CHAOS') {
            hudModeBadge.textContent = 'CHAOS FFA';
        } else {
            hudModeBadge.textContent = 'FFA DEATHMATCH';
        }
    }

    if (mode === 'PVP_1V1' && hudTarget && winningScore === 100) {
        winningScore = 45;
        hudTarget.textContent = '45';
        if (scoreboardGoal) scoreboardGoal.textContent = '45';
    }

    // Connect WebSocket channel for this room
    connectGameWebSocket(room.roomId);

    // Status pill
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

    // Render empty slots for visual clarity and polish
    const totalSlots = room.maxPlayers || 2;
    const currentCombatants = room.players.filter(p => !p.spectator).length;
    for (let i = currentCombatants; i < totalSlots; i++) {
        const emptyChip = document.createElement('div');
        emptyChip.className = 'player-chip empty-slot';
        emptyChip.innerHTML = `
            <span class="player-chip-name">⏳ Waiting for Pilot...</span>
            <span class="player-status-tag waiting">Empty Slot</span>
        `;
        playersRoster.appendChild(emptyChip);
    }

    // Sync in-staging loadout pills
    const stagingClassPills = document.getElementById('stagingClassPills');
    if (stagingClassPills) {
        stagingClassPills.querySelectorAll('.staging-class-pill').forEach(pill => {
            if (pill.getAttribute('data-class') === mySelectedClass) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
    }

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

async function createRoom(name, maxPlayers, gameMode, botDifficulty = 'VETERAN', mapId = 'CYBER_CORE') {
    try {
        const payload = {
            name,
            maxPlayers: parseInt(maxPlayers, 10),
            gameMode: gameMode || (parseInt(maxPlayers, 10) === 2 ? 'PVP_1V1' : 'PVP_FFA'),
            botDifficulty: botDifficulty || 'VETERAN',
            mapId: mapId || 'CYBER_CORE'
        };
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
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
    if (pvpEmulator && pvpEmulator.isActive) {
        switchToLobbyBrowser();
        return;
    }
    if (!activeRoom) {
        switchToLobbyBrowser();
        return;
    }
    const roomId = activeRoom.roomId;
    if (roomId && !roomId.startsWith('SIM-')) {
        try {
            await fetch(`/api/rooms/${roomId}/leave`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch {
            // Continue cleanup locally
        }
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

let isMatchmakingBusy = false;
let currentBotDifficulty = 'VETERAN';
let currentSelectedMap = 'CYBER_CORE';

function setMatchmakingBusy(busy, statusMessage) {
    isMatchmakingBusy = busy;
    const giantPlayNowBtn = document.getElementById('giantPlayNowBtn');
    const cancelMatchmakingBtn = document.getElementById('cancelMatchmakingBtn');
    const matchmakingStatusText = document.getElementById('matchmakingStatusText');

    if (giantPlayNowBtn) {
        if (busy) {
            giantPlayNowBtn.classList.add('busy');
        } else {
            giantPlayNowBtn.classList.remove('busy');
        }
    }

    if (cancelMatchmakingBtn) {
        cancelMatchmakingBtn.style.display = busy ? 'inline-flex' : 'none';
    }

    if (matchmakingStatusText) {
        if (statusMessage) {
            matchmakingStatusText.textContent = statusMessage;
        } else if (!busy) {
            matchmakingStatusText.textContent = 'Ready for tactical deployment. Select a mode or jump into instant combat.';
        }
    }
}

async function quickPvPDuel() {
    if (isMatchmakingBusy) return;
    setMatchmakingBusy(true, 'Searching for 1v1 PvP Duel sector...');
    if (!isServerOnline) {
        setMatchmakingBusy(false);
        pvpEmulator.start({
            mode: 'DUEL_1V1',
            map: currentSelectedMap || 'NEON_OUTPOST',
            difficulty: 'APEX',
            targetScore: 3,
            heroClass: mySelectedClass || 'ASSAULT'
        });
        return;
    }
    if (!isAuthenticated()) {
        const ok = await quickGuestPlay();
        if (!ok) {
            setMatchmakingBusy(false);
            return;
        }
    }
    try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(`${baseUrl}/api/rooms`, { headers: getAuthHeaders() });
        if (response.ok) {
            const rooms = await response.json();
            const joinable = rooms.find(r => (r.gameMode === 'PVP_1V1' || r.maxPlayers === 2) && r.status === 'WAITING' && r.currentPlayers < r.maxPlayers);
            if (joinable) {
                await joinRoom(joinable.roomId);
                setMatchmakingBusy(false);
                return;
            }
        }
        const randId = Math.floor(1000 + Math.random() * 9000);
        await createRoom(`⚔️ 1v1 Duel #${randId}`, 2, 'PVP_1V1');
    } catch {
        // Standalone fallback: launch offline duel immediately
        pvpEmulator.start({
            mode: 'DUEL_1V1',
            map: currentSelectedMap || 'NEON_OUTPOST',
            difficulty: 'APEX',
            targetScore: 3,
            heroClass: mySelectedClass || 'ASSAULT'
        });
    } finally {
        setMatchmakingBusy(false);
    }
}

async function startPracticeBattle() {
    if (isMatchmakingBusy) return;
    setMatchmakingBusy(true, `Initializing AI Dojo simulation (${currentBotDifficulty})...`);
    if (!isServerOnline) {
        setMatchmakingBusy(false);
        pvpEmulator.start({
            mode: 'FFA_SOLO',
            map: currentSelectedMap || 'CYBER_CORE',
            difficulty: currentBotDifficulty || 'RECRUIT',
            botCount: 1,
            targetScore: 5,
            heroClass: mySelectedClass || 'ASSAULT'
        });
        return;
    }
    if (!isAuthenticated()) {
        const ok = await quickGuestPlay();
        if (!ok) {
            setMatchmakingBusy(false);
            return;
        }
    }
    try {
        const baseUrl = getBackendBaseUrl();
        const randId = Math.floor(1000 + Math.random() * 9000);
        const res = await fetch(`${baseUrl}/api/rooms`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                name: `🤖 Practice Dojo #${randId}`, 
                maxPlayers: 2, 
                gameMode: 'PVP_1V1',
                botDifficulty: currentBotDifficulty
            })
        });
        if (res.ok) {
            const roomData = await res.json();
            renderActiveRoom(roomData);
            // Auto spawn AI Bot Opponent
            await fetch(`${baseUrl}/api/rooms/${roomData.roomId}/bot`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            // Auto launch combat match immediately for seamless training flow
            const startRes = await fetch(`${baseUrl}/api/rooms/${roomData.roomId}/start`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (startRes.ok) {
                const startedRoom = await startRes.json();
                renderActiveRoom(startedRoom);
                connectGameWebSocket(startedRoom.roomId);
            } else {
                const updated = await fetch(`${baseUrl}/api/rooms/${roomData.roomId}`, { headers: getAuthHeaders() });
                if (updated.ok) {
                    renderActiveRoom(await updated.json());
                }
            }
        } else {
            pvpEmulator.start({
                mode: 'FFA_SOLO',
                map: currentSelectedMap || 'CYBER_CORE',
                difficulty: currentBotDifficulty || 'RECRUIT',
                botCount: 1,
                targetScore: 5,
                heroClass: mySelectedClass || 'ASSAULT'
            });
        }
    } catch (err) {
        pvpEmulator.start({
            mode: 'FFA_SOLO',
            map: currentSelectedMap || 'CYBER_CORE',
            difficulty: currentBotDifficulty || 'RECRUIT',
            botCount: 1,
            targetScore: 5,
            heroClass: mySelectedClass || 'ASSAULT'
        });
    } finally {
        setMatchmakingBusy(false);
    }
}

async function quickBattle() {
    if (isMatchmakingBusy) return;
    setMatchmakingBusy(true, 'Searching for Quick Match FFA sector...');
    if (!isServerOnline) {
        setMatchmakingBusy(false);
        pvpEmulator.start({
            mode: 'FFA_SOLO',
            map: currentSelectedMap || 'CYBER_CORE',
            difficulty: currentBotDifficulty || 'VETERAN',
            botCount: 3,
            targetScore: 10,
            heroClass: mySelectedClass || 'ASSAULT'
        });
        return;
    }
    if (!isAuthenticated()) {
        const ok = await quickGuestPlay();
        if (!ok) {
            setMatchmakingBusy(false);
            return;
        }
    }
    try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(`${baseUrl}/api/rooms`, { headers: getAuthHeaders() });
        if (response.ok) {
            const rooms = await response.json();
            const joinable = rooms.find(r => r.status === 'WAITING' && r.currentPlayers < r.maxPlayers);
            if (joinable) {
                await joinRoom(joinable.roomId);
                setMatchmakingBusy(false);
                return;
            }
        }
        const randId = Math.floor(1000 + Math.random() * 9000);
        await createRoom(`Cyber Arena #${randId}`, 4, 'PVP_FFA');
    } catch {
        pvpEmulator.start({
            mode: 'FFA_SOLO',
            map: currentSelectedMap || 'CYBER_CORE',
            difficulty: currentBotDifficulty || 'VETERAN',
            botCount: 3,
            targetScore: 10,
            heroClass: mySelectedClass || 'ASSAULT'
        });
    } finally {
        setMatchmakingBusy(false);
    }
}

function setupRoomEventListeners() {
    openCreateRoomBtn.addEventListener('click', openCreateRoomModal);
    closeCreateRoomModalBtn.addEventListener('click', closeCreateRoomModal);
    refreshRoomsBtn.addEventListener('click', fetchRoomsList);

    // Header & Modal Instant Guest Play buttons: activate guest profile without forced combat deploy
    const quickGuestPlayBtn = document.getElementById('quickGuestPlayBtn');
    if (quickGuestPlayBtn) {
        quickGuestPlayBtn.addEventListener('click', () => {
            quickGuestPlay();
        });
    }
    const modalGuestPlayBtn = document.getElementById('modalGuestPlayBtn');
    if (modalGuestPlayBtn) {
        modalGuestPlayBtn.addEventListener('click', () => {
            quickGuestPlay().then(() => closeModal());
        });
    }

    // Cancel Matchmaking Button
    const cancelMatchmakingBtn = document.getElementById('cancelMatchmakingBtn');
    if (cancelMatchmakingBtn) {
        cancelMatchmakingBtn.addEventListener('click', () => {
            setMatchmakingBusy(false, 'Deployment cancelled. Standing by in orbit.');
            showTacticalToast('Deployment Aborted', 'Matchmaking cancelled by operator', '⏹️');
        });
    }

    // AI Training Dojo Difficulty Protocol Pills
    const practiceDifficultyPills = document.getElementById('practiceDifficultyPills');
    if (practiceDifficultyPills) {
        practiceDifficultyPills.querySelectorAll('.diff-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                practiceDifficultyPills.querySelectorAll('.diff-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentBotDifficulty = pill.getAttribute('data-diff') || 'VETERAN';
                if (soundEngine) soundEngine.playEmote();
                showTacticalToast('AI Protocol Selected', `Autonomous combat bot set to ${currentBotDifficulty}`, '🤖');
            });
        });
    }

    // Structured Combat Launchpad & Game Mode Selector
    let currentLobbyMode = 'FFA';

    function setLobbyBattleMode(mode) {
        currentLobbyMode = mode;
        const quickCardFfa = document.getElementById('quickCardFfa');
        const quickCardDuel = document.getElementById('quickCardDuel');
        const quickCardPve = document.getElementById('quickCardPve');
        const quickCardCustom = document.getElementById('quickCardCustom');
        const heroActiveModeBadge = document.getElementById('heroActiveModeBadge');
        const deckSelectedModeBadge = document.getElementById('deckSelectedModeBadge');
        const giantPlayNowBtn = document.getElementById('giantPlayNowBtn');
        const giantPlayLabel = document.getElementById('giantPlayLabel');
        const giantPlaySub = document.getElementById('giantPlaySub');
        const heroQuickPlayBtn = document.getElementById('heroQuickPlayBtn');
        const heroDuelBtn = document.getElementById('heroDuelBtn');
        const heroPracticeBtn = document.getElementById('heroPracticeBtn');
        const heroCustomBtn = document.getElementById('heroCustomBtn');

        if (quickCardFfa) quickCardFfa.classList.toggle('active-mode', mode === 'FFA');
        if (quickCardDuel) quickCardDuel.classList.toggle('active-mode', mode === 'DUEL');
        if (quickCardPve) quickCardPve.classList.toggle('active-mode', mode === 'PRACTICE');
        if (quickCardCustom) quickCardCustom.classList.toggle('active-mode', mode === 'CUSTOM');

        if (heroActiveModeBadge) {
            if (mode === 'FFA') heroActiveModeBadge.textContent = 'FFA DEATHMATCH';
            else if (mode === 'DUEL') heroActiveModeBadge.textContent = '1v1 TACTICAL DUEL';
            else if (mode === 'PRACTICE') heroActiveModeBadge.textContent = 'SOLO AI TRAINING';
            else if (mode === 'CUSTOM') heroActiveModeBadge.textContent = 'CUSTOM ARENAS';
        }

        if (deckSelectedModeBadge) {
            if (mode === 'FFA') deckSelectedModeBadge.textContent = 'MODE: QUICK FFA';
            else if (mode === 'DUEL') deckSelectedModeBadge.textContent = 'MODE: 1v1 DUEL';
            else if (mode === 'PRACTICE') deckSelectedModeBadge.textContent = 'MODE: BOT DOJO';
            else if (mode === 'CUSTOM') deckSelectedModeBadge.textContent = 'MODE: CUSTOM ARENAS';
        }

        if (heroQuickPlayBtn) heroQuickPlayBtn.textContent = (mode === 'FFA') ? 'ACTIVE' : 'SELECT';
        if (heroDuelBtn) heroDuelBtn.textContent = (mode === 'DUEL') ? 'ACTIVE' : 'SELECT';
        if (heroPracticeBtn) heroPracticeBtn.textContent = (mode === 'PRACTICE') ? 'ACTIVE' : 'SELECT';
        if (heroCustomBtn) heroCustomBtn.textContent = (mode === 'CUSTOM') ? 'ACTIVE' : 'BROWSE';

        if (giantPlayNowBtn && giantPlayLabel && giantPlaySub) {
            giantPlayNowBtn.classList.remove('mode-ffa', 'mode-duel', 'mode-practice', 'mode-custom');
            if (mode === 'FFA') {
                giantPlayNowBtn.classList.add('mode-ffa');
                giantPlayLabel.textContent = 'Deploy Into Battle';
                giantPlaySub.textContent = 'Quick Match FFA • 4 Pilots';
            } else if (mode === 'DUEL') {
                giantPlayNowBtn.classList.add('mode-duel');
                giantPlayLabel.textContent = 'Deploy 1v1 Duel';
                giantPlaySub.textContent = '1v1 PvP Duel • First to 3 Kills';
            } else if (mode === 'PRACTICE') {
                giantPlayNowBtn.classList.add('mode-practice');
                giantPlayLabel.textContent = 'Practice With AI';
                giantPlaySub.textContent = `Practice vs ${currentBotDifficulty} Bot • Solo Training`;
            } else if (mode === 'CUSTOM') {
                giantPlayNowBtn.classList.add('mode-custom');
                giantPlayLabel.textContent = 'Browse Arenas';
                giantPlaySub.textContent = 'Join or Host Custom Matches';
            }
        }
    }

    const heroQuickPlayBtn = document.getElementById('heroQuickPlayBtn');
    const quickCardFfa = document.getElementById('quickCardFfa');
    if (heroQuickPlayBtn) {
        heroQuickPlayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentLobbyMode === 'FFA') {
                quickBattle();
            } else {
                setLobbyBattleMode('FFA');
            }
        });
    }
    if (quickCardFfa) {
        quickCardFfa.addEventListener('click', () => {
            setLobbyBattleMode('FFA');
        });
        quickCardFfa.addEventListener('dblclick', () => {
            quickBattle();
        });
    }

    const heroDuelBtn = document.getElementById('heroDuelBtn');
    const quickCardDuel = document.getElementById('quickCardDuel');
    if (heroDuelBtn) {
        heroDuelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentLobbyMode === 'DUEL') {
                quickPvPDuel();
            } else {
                setLobbyBattleMode('DUEL');
            }
        });
    }
    if (quickCardDuel) {
        quickCardDuel.addEventListener('click', () => {
            setLobbyBattleMode('DUEL');
        });
        quickCardDuel.addEventListener('dblclick', () => {
            quickPvPDuel();
        });
    }

    const heroPracticeBtn = document.getElementById('heroPracticeBtn');
    const quickCardPve = document.getElementById('quickCardPve');
    if (heroPracticeBtn) {
        heroPracticeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentLobbyMode === 'PRACTICE') {
                startPracticeBattle();
            } else {
                setLobbyBattleMode('PRACTICE');
            }
        });
    }
    if (quickCardPve) {
        quickCardPve.addEventListener('click', () => {
            setLobbyBattleMode('PRACTICE');
        });
        quickCardPve.addEventListener('dblclick', () => {
            startPracticeBattle();
        });
    }

    // Giant Play Now Hero Button
    const giantPlayNowBtn = document.getElementById('giantPlayNowBtn');
    if (giantPlayNowBtn) {
        giantPlayNowBtn.addEventListener('click', () => {
            if (isMatchmakingBusy) return;
            if (soundEngine && typeof soundEngine.playUiDeploy === 'function') {
                soundEngine.playUiDeploy();
            }
            if (currentLobbyMode === 'FFA') {
                quickBattle();
            } else if (currentLobbyMode === 'DUEL') {
                quickPvPDuel();
            } else if (currentLobbyMode === 'PRACTICE') {
                startPracticeBattle();
            } else if (currentLobbyMode === 'CUSTOM') {
                switchView('arenas');
            }
        });
    }

    // Initialize lobby battle mode to FFA on startup
    setLobbyBattleMode('FFA');

    // In-Staging Header Return to Menu Button
    const roomBackToLobbyBtn = document.getElementById('roomBackToLobbyBtn');
    if (roomBackToLobbyBtn) {
        roomBackToLobbyBtn.addEventListener('click', leaveRoom);
    }

    // In-Staging Quick Class Switcher
    const stagingClassPills = document.getElementById('stagingClassPills');
    if (stagingClassPills) {
        stagingClassPills.querySelectorAll('.staging-class-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const cls = pill.getAttribute('data-class');
                if (cls) selectWarriorClass(cls, true);
            });
        });
    }

    // Live Room Filter & Search
    const roomSearchInput = document.getElementById('roomSearchInput');
    if (roomSearchInput) {
        roomSearchInput.addEventListener('input', (e) => {
            currentRoomSearchQuery = e.target.value;
            renderFilteredRooms();
        });
    }

    const modeFilterPills = document.getElementById('modeFilterPills');
    if (modeFilterPills) {
        modeFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                modeFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentRoomFilterMode = pill.getAttribute('data-filter') || 'ALL';
                renderFilteredRooms();
            });
        });
    }

    // Copy Room Code Button
    const copyRoomIdBtn = document.getElementById('copyRoomIdBtn');
    if (copyRoomIdBtn) {
        copyRoomIdBtn.addEventListener('click', () => {
            if (!activeRoom || !activeRoom.roomId) return;
            navigator.clipboard.writeText(activeRoom.roomId).then(() => {
                copyRoomIdBtn.textContent = '✓ Copied!';
                copyRoomIdBtn.classList.add('copied');
                showTacticalToast('Arena Code Copied', `Share ${activeRoom.roomId} with squadmates`, '📋');
                setTimeout(() => {
                    copyRoomIdBtn.textContent = '📋 Copy ID';
                    copyRoomIdBtn.classList.remove('copied');
                }, 2000);
            }).catch(() => {});
        });
    }

    if (pvpDuelBtn) {
        pvpDuelBtn.addEventListener('click', quickPvPDuel);
    }
    if (pvePracticeBtn) {
        pvePracticeBtn.addEventListener('click', startPracticeBattle);
    }

    const quickBattleBtn = document.getElementById('quickBattleBtn');
    if (quickBattleBtn) {
        quickBattleBtn.addEventListener('click', quickBattle);
    }

    if (roomGameModeSelect) {
        roomGameModeSelect.addEventListener('change', () => {
            if (roomGameModeSelect.value === 'PVP_1V1') {
                maxPlayersSelect.value = '2';
            } else if (roomGameModeSelect.value === 'PVP_CHAOS') {
                maxPlayersSelect.value = '8';
            } else if (maxPlayersSelect.value === '2') {
                maxPlayersSelect.value = '4';
            }
        });
    }

    createRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = roomNameInput.value.trim();
        const maxPlayers = maxPlayersSelect.value;
        const gameMode = roomGameModeSelect ? roomGameModeSelect.value : (parseInt(maxPlayers, 10) === 2 ? 'PVP_1V1' : 'PVP_FFA');
        const mapSelect = document.getElementById('roomMapSelect');
        const botDiffSelect = document.getElementById('roomBotDiffSelect');
        const mapId = mapSelect ? mapSelect.value : 'CYBER_CORE';
        const botDiff = botDiffSelect ? botDiffSelect.value : 'VETERAN';
        createRoom(name, maxPlayers, gameMode, botDiff, mapId);
    });

    createRoomModal.addEventListener('click', (e) => {
        if (e.target === createRoomModal) {
            closeCreateRoomModal();
        }
    });

    leaveRoomBtn.addEventListener('click', leaveRoom);
    const hudLeaveMatchBtn = document.getElementById('hudLeaveMatchBtn');
    if (hudLeaveMatchBtn) {
        hudLeaveMatchBtn.addEventListener('click', leaveRoom);
    }
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

    // Primary Client View Navigation Tabs
    const navTabPlay = document.getElementById('navTabPlay');
    const navTabOperators = document.getElementById('navTabOperators');
    const navTabCareer = document.getElementById('navTabCareer');
    const navTabLeaderboard = document.getElementById('navTabLeaderboard');
    const navTabArenas = document.getElementById('navTabArenas');
    const topbarBrandBtn = document.getElementById('topbarBrandBtn');
    const heroChangeOperatorBtn = document.getElementById('heroChangeOperatorBtn');
    const heroCustomBtn = document.getElementById('heroCustomBtn');
    const quickCardCustom = document.getElementById('quickCardCustom');

    if (navTabPlay) navTabPlay.addEventListener('click', () => switchView('play'));
    if (navTabOperators) navTabOperators.addEventListener('click', () => switchView('operators'));
    if (navTabCareer) navTabCareer.addEventListener('click', () => switchView('career'));
    if (navTabLeaderboard) navTabLeaderboard.addEventListener('click', () => switchView('leaderboard'));
    if (navTabArenas) navTabArenas.addEventListener('click', () => switchView('arenas'));
    if (topbarBrandBtn) {
        topbarBrandBtn.addEventListener('click', () => switchView('play'));
        topbarBrandBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchView('play');
            }
        });
    }
    if (heroChangeOperatorBtn) heroChangeOperatorBtn.addEventListener('click', () => switchView('operators'));
    if (heroCustomBtn) heroCustomBtn.addEventListener('click', () => switchView('arenas'));

    if (quickCardCustom) {
        quickCardCustom.addEventListener('click', () => {
            setLobbyBattleMode('CUSTOM');
            switchView('arenas');
        });
    }

    // Equip Operator Loadout Button
    const equipOperatorBtn = document.getElementById('equipOperatorBtn');
    if (equipOperatorBtn) {
        equipOperatorBtn.addEventListener('click', () => {
            if (soundEngine) soundEngine.playLevelUp();
            showTacticalToast('Operator Deployed', `${mySelectedClass} confirmed as active combat chassis`, '🛡️');
            const equipNote = document.getElementById('equipStatusNote');
            if (equipNote) {
                equipNote.textContent = `✓ ${mySelectedClass} Active & Primed for Combat`;
                equipNote.style.color = 'var(--emerald-green)';
            }
        });
    }

    // Refresh Leaderboard Button
    const refreshLeaderboardBtn = document.getElementById('refreshLeaderboardBtn');
    if (refreshLeaderboardBtn) {
        refreshLeaderboardBtn.addEventListener('click', () => {
            if (soundEngine) soundEngine.playEmote();
            fetchAndShowLeaderboard(false);
        });
    }

    // In-Combat Pause Menu Controls
    const pauseMenuModal = document.getElementById('pauseMenuModal');
    const hudPauseTriggerBtn = document.getElementById('hudPauseTriggerBtn');
    const pauseResumeBtn = document.getElementById('pauseResumeBtn');
    const pauseAudioToggleBtn = document.getElementById('pauseAudioToggleBtn');
    const pauseAudioToggleText = document.getElementById('pauseAudioToggleText');
    const pauseSettingsBtn = document.getElementById('pauseSettingsBtn');
    const pauseIntelBtn = document.getElementById('pauseIntelBtn');
    const pauseLeaveMatchBtn = document.getElementById('pauseLeaveMatchBtn');

    function togglePauseMenu(forceOpen) {
        if (!pauseMenuModal) return;
        const isCurrentlyOpen = pauseMenuModal.style.display === 'flex';
        const shouldOpen = (forceOpen !== undefined) ? forceOpen : !isCurrentlyOpen;
        pauseMenuModal.style.display = shouldOpen ? 'flex' : 'none';
        if (shouldOpen && pauseAudioToggleText && soundEngine) {
            pauseAudioToggleText.textContent = soundEngine.isMuted() ? 'AUDIO SYNTHESIZER: MUTED' : 'AUDIO SYNTHESIZER: ACTIVE';
        }
    }

    if (hudPauseTriggerBtn) {
        hudPauseTriggerBtn.addEventListener('click', () => togglePauseMenu());
    }
    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', () => togglePauseMenu(false));
    }
    if (pauseAudioToggleBtn) {
        pauseAudioToggleBtn.addEventListener('click', () => {
            soundEngine.init();
            const muted = soundEngine.toggleMute();
            updateSoundButtonUi(muted);
            if (pauseAudioToggleText) {
                pauseAudioToggleText.textContent = muted ? 'AUDIO SYNTHESIZER: MUTED' : 'AUDIO SYNTHESIZER: ACTIVE';
            }
        });
    }
    if (pauseSettingsBtn) {
        pauseSettingsBtn.addEventListener('click', () => {
            togglePauseMenu(false);
            openSettingsModal();
        });
    }
    if (pauseIntelBtn) {
        pauseIntelBtn.addEventListener('click', () => {
            togglePauseMenu(false);
            openIntelModal();
        });
    }
    if (pauseLeaveMatchBtn) {
        pauseLeaveMatchBtn.addEventListener('click', () => {
            togglePauseMenu(false);
            leaveRoom();
        });
    }
    if (pauseMenuModal) {
        pauseMenuModal.addEventListener('click', (e) => {
            if (e.target === pauseMenuModal) togglePauseMenu(false);
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
            const pauseModal = document.getElementById('pauseMenuModal');
            if (pauseModal && pauseModal.style.display === 'flex') {
                pauseModal.style.display = 'none';
                return;
            }
            if (authModal && authModal.style.display === 'flex') { closeModal(); return; }
            if (createRoomModal && createRoomModal.style.display === 'flex') { closeCreateRoomModal(); return; }
            const pvpEmulatorModal = document.getElementById('pvpEmulatorModal');
            if (pvpEmulatorModal && pvpEmulatorModal.style.display === 'flex') {
                pvpEmulatorModal.style.display = 'none';
                return;
            }
            if (leaderboardModal && leaderboardModal.style.display === 'flex') { closeLeaderboardModal(); return; }
            if (matchHistoryModal && matchHistoryModal.style.display === 'flex') { closeMatchHistoryModal(); return; }
            if (gameOverModal && gameOverModal.style.display === 'flex') { return; }
            if (settingsModal && settingsModal.style.display === 'flex') { closeSettingsModal(); return; }
            if (intelModal && intelModal.style.display === 'flex') { closeIntelModal(); return; }

            // If in active combat and no modal was open, open the pause menu!
            const isPlaying = activeRoom && activeRoom.status === 'PLAYING' && !isGameOver;
            if (isPlaying && pauseModal) {
                pauseModal.style.display = 'flex';
                const pauseAudioToggleText = document.getElementById('pauseAudioToggleText');
                if (pauseAudioToggleText && soundEngine) {
                    pauseAudioToggleText.textContent = soundEngine.isMuted() ? 'AUDIO SYNTHESIZER: MUTED' : 'AUDIO SYNTHESIZER: ACTIVE';
                }
            }
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

    // Graphics Quality Presets
    const qualityPills = document.querySelectorAll('#graphicsQualityPills .preset-pill');
    const savedQuality = localStorage.getItem('battle_arena_graphics_preset') || 'high';
    qualityPills.forEach(pill => {
        if (pill.getAttribute('data-quality') === savedQuality) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
        pill.addEventListener('click', () => {
            qualityPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const q = pill.getAttribute('data-quality') || 'high';
            localStorage.setItem('battle_arena_graphics_preset', q);
            currentGraphicsPreset = q;
        });
    });

    // Crosshair Customization Controls
    const chColorBtns = document.querySelectorAll('#chColorPicker .ch-color-btn');
    const chSizeRange = document.getElementById('chSizeRange');
    const chSizeDisplay = document.getElementById('chSizeDisplay');
    const chGapRange = document.getElementById('chGapRange');
    const chGapDisplay = document.getElementById('chGapDisplay');

    const savedChColor = localStorage.getItem('battle_arena_ch_color') || '#16C8F2';
    const savedChSize = localStorage.getItem('battle_arena_ch_size') || '10';
    const savedChGap = localStorage.getItem('battle_arena_ch_gap') || '5';

    function applyCrosshairSettings(color, size, gap) {
        document.documentElement.style.setProperty('--crosshair-color', color);
        document.documentElement.style.setProperty('--preview-ch-color', color);
        document.documentElement.style.setProperty('--ch-size', `${size}px`);
        document.documentElement.style.setProperty('--ch-gap', `${gap}px`);
        if (chSizeDisplay) chSizeDisplay.textContent = `${size}px`;
        if (chGapDisplay) chGapDisplay.textContent = `${gap}px`;
    }

    applyCrosshairSettings(savedChColor, savedChSize, savedChGap);

    chColorBtns.forEach(btn => {
        if (btn.getAttribute('data-color') === savedChColor) btn.classList.add('active');
        else btn.classList.remove('active');

        btn.addEventListener('click', () => {
            chColorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.getAttribute('data-color') || '#16C8F2';
            localStorage.setItem('battle_arena_ch_color', color);
            applyCrosshairSettings(color, chSizeRange ? chSizeRange.value : 10, chGapRange ? chGapRange.value : 5);
        });
    });

    if (chSizeRange) {
        chSizeRange.value = savedChSize;
        chSizeRange.addEventListener('input', (e) => {
            const val = e.target.value;
            localStorage.setItem('battle_arena_ch_size', val);
            const activeColor = localStorage.getItem('battle_arena_ch_color') || '#16C8F2';
            applyCrosshairSettings(activeColor, val, chGapRange ? chGapRange.value : 5);
        });
    }

    if (chGapRange) {
        chGapRange.value = savedChGap;
        chGapRange.addEventListener('input', (e) => {
            const val = e.target.value;
            localStorage.setItem('battle_arena_ch_gap', val);
            const activeColor = localStorage.getItem('battle_arena_ch_color') || '#16C8F2';
            applyCrosshairSettings(activeColor, chSizeRange ? chSizeRange.value : 10, val);
        });
    }

    // Colorblind Mode Selector
    const colorblindSelect = document.getElementById('colorblindModeSelect');
    if (colorblindSelect) {
        const savedCb = localStorage.getItem('battle_arena_colorblind') || 'none';
        colorblindSelect.value = savedCb;
        if (savedCb !== 'none') {
            document.body.classList.add(`colorblind-${savedCb}`);
        }
        colorblindSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            localStorage.setItem('battle_arena_colorblind', val);
            document.body.classList.remove('colorblind-deuteranopia', 'colorblind-protanopia', 'colorblind-tritanopia');
            if (val !== 'none') {
                document.body.classList.add(`colorblind-${val}`);
            }
        });
    }

    // Mobile Fallback Screen Bypass
    const mobileBypassBtn = document.getElementById('mobileBypassBtn');
    if (mobileBypassBtn) {
        mobileBypassBtn.addEventListener('click', () => {
            const banner = document.getElementById('mobileBlockerBanner');
            if (banner) banner.style.display = 'none';
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
    const tabCosmeticsBtn = document.getElementById('tabCosmeticsBtn');
    const cosmeticsSection = document.getElementById('cosmeticsSection');
    const saveCosmeticsBtn = document.getElementById('saveCosmeticsBtn');

    if (tabMatchLogsBtn) {
        tabMatchLogsBtn.addEventListener('click', () => {
            tabMatchLogsBtn.classList.add('active');
            if (tabAchievementsBtn) tabAchievementsBtn.classList.remove('active');
            if (tabCosmeticsBtn) tabCosmeticsBtn.classList.remove('active');
            if (matchRecordsSection) matchRecordsSection.style.display = 'block';
            if (achievementsSection) achievementsSection.style.display = 'none';
            if (cosmeticsSection) cosmeticsSection.style.display = 'none';
        });
    }

    if (tabAchievementsBtn) {
        tabAchievementsBtn.addEventListener('click', () => {
            tabAchievementsBtn.classList.add('active');
            if (tabMatchLogsBtn) tabMatchLogsBtn.classList.remove('active');
            if (tabCosmeticsBtn) tabCosmeticsBtn.classList.remove('active');
            if (matchRecordsSection) matchRecordsSection.style.display = 'none';
            if (achievementsSection) achievementsSection.style.display = 'block';
            if (cosmeticsSection) cosmeticsSection.style.display = 'none';
            renderAchievementsGrid();
        });
    }

    if (tabCosmeticsBtn) {
        tabCosmeticsBtn.addEventListener('click', () => {
            tabCosmeticsBtn.classList.add('active');
            if (tabMatchLogsBtn) tabMatchLogsBtn.classList.remove('active');
            if (tabAchievementsBtn) tabAchievementsBtn.classList.remove('active');
            if (matchRecordsSection) matchRecordsSection.style.display = 'none';
            if (achievementsSection) achievementsSection.style.display = 'none';
            if (cosmeticsSection) cosmeticsSection.style.display = 'block';
        });
    }

    if (saveCosmeticsBtn) {
        saveCosmeticsBtn.addEventListener('click', () => {
            equipSelectedCosmetics();
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

function setupPvPEmulatorEventListeners() {
    const pvpEmulatorModal = document.getElementById('pvpEmulatorModal');
    const closeEmulatorModalBtn = document.getElementById('closeEmulatorModalBtn');
    const navTabEmulator = document.getElementById('navTabEmulator');
    const heroOpenEmulatorBtn = document.getElementById('heroOpenEmulatorBtn');
    const heroPracticeBtn = document.getElementById('heroPracticeBtn');
    const pvpEmulatorForm = document.getElementById('pvpEmulatorForm');
    const quickApexDuelBtn = document.getElementById('quickApexDuelBtn');
    const emulatorQuickRestartBtn = document.getElementById('emulatorQuickRestartBtn');
    const emulatorQuickConfigBtn = document.getElementById('emulatorQuickConfigBtn');
    const emulatorBotCount = document.getElementById('emulatorBotCount');
    const botCountValDisplay = document.getElementById('botCountValDisplay');
    const emulatorMapCards = document.querySelectorAll('.emulator-map-card');
    const emulatorSelectedMap = document.getElementById('emulatorSelectedMap');

    function openEmulatorModal() {
        if (pvpEmulatorModal) pvpEmulatorModal.style.display = 'flex';
    }

    function closeEmulatorModal() {
        if (pvpEmulatorModal) pvpEmulatorModal.style.display = 'none';
    }

    if (navTabEmulator) navTabEmulator.addEventListener('click', openEmulatorModal);
    if (heroOpenEmulatorBtn) heroOpenEmulatorBtn.addEventListener('click', openEmulatorModal);
    if (heroPracticeBtn) heroPracticeBtn.addEventListener('click', openEmulatorModal);
    if (closeEmulatorModalBtn) closeEmulatorModalBtn.addEventListener('click', closeEmulatorModal);

    if (pvpEmulatorModal) {
        pvpEmulatorModal.addEventListener('click', (e) => {
            if (e.target === pvpEmulatorModal) closeEmulatorModal();
        });
    }

    if (emulatorMapCards && emulatorSelectedMap) {
        emulatorMapCards.forEach(card => {
            card.addEventListener('click', () => {
                emulatorMapCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                emulatorSelectedMap.value = card.dataset.map || 'CYBER_CORE';
            });
        });
    }

    if (emulatorBotCount && botCountValDisplay) {
        emulatorBotCount.addEventListener('input', () => {
            botCountValDisplay.textContent = emulatorBotCount.value;
        });
    }

    if (pvpEmulatorForm) {
        pvpEmulatorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const map = emulatorSelectedMap ? emulatorSelectedMap.value : 'CYBER_CORE';
            const heroClass = document.getElementById('emulatorHeroClass')?.value || 'ASSAULT';
            const mode = document.getElementById('emulatorModeSelect')?.value || 'FFA_SOLO';
            const difficulty = document.getElementById('emulatorDifficultySelect')?.value || 'VETERAN';
            const botCount = emulatorBotCount ? emulatorBotCount.value : 3;
            const targetScore = document.getElementById('emulatorTargetScore')?.value || 10;

            closeEmulatorModal();
            pvpEmulator.start({
                map,
                heroClass,
                mode,
                difficulty,
                botCount,
                targetScore
            });
        });
    }

    if (quickApexDuelBtn) {
        quickApexDuelBtn.addEventListener('click', () => {
            closeEmulatorModal();
            pvpEmulator.start({
                map: 'CYBER_CORE',
                heroClass: player.warriorClass || mySelectedClass || 'ASSAULT',
                mode: 'DUEL_1V1',
                difficulty: 'APEX',
                botCount: 1,
                targetScore: 5
            });
        });
    }

    if (emulatorQuickRestartBtn) {
        emulatorQuickRestartBtn.addEventListener('click', () => {
            if (pvpEmulator.isActive) {
                triggerRematch();
            }
        });
    }

    if (emulatorQuickConfigBtn) {
        emulatorQuickConfigBtn.addEventListener('click', openEmulatorModal);
    }
}

// --- Mobile & Touch Screen Tactile Controller Engine ---
let isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

function updateTouchControlsVisibility() {
    const touchOverlay = document.getElementById('touchControls');
    if (!touchOverlay) return;
    const inGame = (activeRoom && activeRoom.status === 'PLAYING') || (pvpEmulator && pvpEmulator.isActive);
    if (isTouchDevice && inGame && player.alive && !isSpectator) {
        touchOverlay.style.display = 'flex';
    } else {
        touchOverlay.style.display = 'none';
    }
}

function setupTouchControlsEventListeners() {
    const touchOverlay = document.getElementById('touchControls');
    const joystickZone = document.getElementById('touchJoystickZone');
    const joystickBase = document.getElementById('touchJoystickBase');
    const joystickThumb = document.getElementById('touchJoystickThumb');
    const touchFireBtn = document.getElementById('touchFireBtn');
    const touchAbilityBtn = document.getElementById('touchAbilityBtn');
    const touchEmoteBtn = document.getElementById('touchEmoteBtn');

    if (!joystickZone || !joystickThumb) return;

    let joystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    const maxRadius = 45;

    function handleJoystickStart(e) {
        soundEngine.init();
        joystickActive = true;
        const rect = joystickBase.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        handleJoystickMove(e);
    }

    function handleJoystickMove(e) {
        if (!joystickActive) return;
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : joystickCenter.x);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : joystickCenter.y);
        const dx = clientX - joystickCenter.x;
        const dy = clientY - joystickCenter.y;
        const dist = Math.hypot(dx, dy);

        if (dist === 0) {
            touchMoveVector = { x: 0, y: 0 };
            joystickThumb.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxRadius);
        const thumbX = Math.cos(angle) * clampedDist;
        const thumbY = Math.sin(angle) * clampedDist;

        joystickThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;
        touchMoveVector = {
            x: Math.cos(angle) * (clampedDist / maxRadius),
            y: Math.sin(angle) * (clampedDist / maxRadius)
        };
        // Update aim heading in direction of thumb movement if not manual-firing
        if (!isPointerDown) {
            player.heading = angle;
        }
    }

    function handleJoystickEnd() {
        joystickActive = false;
        touchMoveVector = { x: 0, y: 0 };
        joystickThumb.style.transform = 'translate(-50%, -50%)';
    }

    joystickZone.addEventListener('pointerdown', (e) => {
        try { joystickZone.setPointerCapture(e.pointerId); } catch (_) {}
        handleJoystickStart(e);
    });
    joystickZone.addEventListener('pointermove', handleJoystickMove);
    joystickZone.addEventListener('pointerup', (e) => {
        try { if (e && e.pointerId && joystickZone.hasPointerCapture(e.pointerId)) joystickZone.releasePointerCapture(e.pointerId); } catch (_) {}
        handleJoystickEnd();
    });
    joystickZone.addEventListener('pointercancel', handleJoystickEnd);

    // Touch Fire Button (supports hold for continuous fire)
    if (touchFireBtn) {
        touchFireBtn.addEventListener('pointerdown', (e) => {
            soundEngine.init();
            isPointerDown = true;
            try { touchFireBtn.setPointerCapture(e.pointerId); } catch (_) {}
            fireBlaster(player.heading, false);
        });
        touchFireBtn.addEventListener('pointerup', (e) => {
            isPointerDown = false;
            try { if (e && e.pointerId && touchFireBtn.hasPointerCapture(e.pointerId)) touchFireBtn.releasePointerCapture(e.pointerId); } catch (_) {}
        });
        touchFireBtn.addEventListener('pointercancel', () => { isPointerDown = false; });
    }

    // Touch Ability Button
    if (touchAbilityBtn) {
        touchAbilityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            soundEngine.init();
            triggerClassAbility();
        });
    }

    // Touch Emote Button
    if (touchEmoteBtn) {
        touchEmoteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleEmoteWheel();
        });
    }

    window.addEventListener('touchstart', () => {
        if (!isTouchDevice) {
            isTouchDevice = true;
            updateTouchControlsVisibility();
        }
    }, { once: true, passive: true });
}

// --- Social Media & Display Event Listeners ---
function toggleFullscreenMode() {
    const doc = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (doc.requestFullscreen) {
            doc.requestFullscreen().catch(() => {});
        } else if (doc.webkitRequestFullscreen) {
            doc.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function setupSocialAndDisplayEventListeners() {
    // 1. Fullscreen Toggle
    const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
    if (fullscreenToggleBtn) {
        fullscreenToggleBtn.addEventListener('click', toggleFullscreenMode);
    }

    // 2. Topbar Share
    const topbarShareBtn = document.getElementById('topbarShareBtn');
    if (topbarShareBtn) {
        topbarShareBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Cyber Battle Arena',
                    text: 'Join me in Cyber Battle Arena! Fast-paced tactical 2D shooter with 60 FPS in-browser combat:',
                    url: window.location.href
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showTacticalToast('Link Copied!', 'Arena link copied to clipboard. Share with your squad!', '🔗');
                });
            }
        });
    }

    // 3. Post to X (Twitter) from Game Over
    const postToTwitterBtn = document.getElementById('postToTwitterBtn');
    if (postToTwitterBtn) {
        postToTwitterBtn.addEventListener('click', () => {
            const kills = player.kills || 0;
            const score = player.score || 0;
            const pClass = player.warriorClass || 'ASSAULT';
            const text = `Just dominated with ${kills} eliminations (${score} pts) playing as ${pClass} in Cyber Battle Arena! ⚡ Think you can beat my score? Play free in your browser:`;
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}&hashtags=CyberBattleArena,IndieDev,WebGaming`;
            window.open(shareUrl, '_blank', 'width=620,height=440');
        });
    }

    // 4. Share to Reddit from Game Over
    const shareToRedditBtn = document.getElementById('shareToRedditBtn');
    if (shareToRedditBtn) {
        shareToRedditBtn.addEventListener('click', () => {
            const kills = player.kills || 0;
            const score = player.score || 0;
            const title = `[Web Game] Cyber Battle Arena: Fast-Paced 2D Tactical Arena Shooter (Just scored ${score} pts, ${kills} kills)`;
            const shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(title)}`;
            window.open(shareUrl, '_blank', 'width=680,height=560');
        });
    }

    // 5. Native Share Sheet
    const nativeShareBtn = document.getElementById('nativeShareBtn');
    if (nativeShareBtn) {
        nativeShareBtn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Cyber Battle Arena Match Report',
                    text: `Scored ${player.score || 0} pts (${player.kills || 0} kills) in Cyber Battle Arena! Try it here:`,
                    url: window.location.href
                }).catch(() => {});
            } else {
                copyBattleReport();
            }
        });
    }

    // 6. Custom Backend URL Setting
    const customBackendUrlInput = document.getElementById('customBackendUrlInput');
    if (customBackendUrlInput) {
        customBackendUrlInput.value = localStorage.getItem('CYBER_ARENA_BACKEND_URL') || '';
        customBackendUrlInput.addEventListener('change', (e) => {
            const val = e.target.value.trim();
            localStorage.setItem('CYBER_ARENA_BACKEND_URL', val);
            checkBackendHealth();
        });
    }
}

// --- AAA In-Game HUD, Visual Juice & Ambient Background Systems ---
let currentGraphicsPreset = localStorage.getItem('battle_arena_graphics_preset') || 'high';
let currentWeaponHeat = 0;

function updateOverheatGauge() {
    const fill = document.getElementById('hudOverheatFill');
    if (fill) {
        fill.style.width = `${Math.min(100, Math.round(currentWeaponHeat))}%`;
        if (currentWeaponHeat > 70) fill.classList.add('hot');
        else fill.classList.remove('hot');
    }
}

function triggerDirectionalDamage(attackerX, attackerY) {
    const container = document.getElementById('directionalDamageContainer');
    if (!container) return;
    const dx = attackerX - player.x;
    const dy = attackerY - player.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180 / Math.PI) + 90;

    const arc = document.createElement('div');
    arc.className = 'directional-damage-arc';
    arc.style.setProperty('--damage-angle', `${angleDeg}deg`);
    container.appendChild(arc);
    setTimeout(() => arc.remove(), 420);
}

function triggerHitMarker() {
    const hm = document.getElementById('hitMarker');
    if (hm) {
        hm.classList.remove('active');
        void hm.offsetWidth;
        hm.classList.add('active');
    }
}

function triggerKillMarker() {
    const km = document.getElementById('killMarker');
    if (km) {
        km.classList.remove('active');
        void km.offsetWidth;
        km.classList.add('active');
    }
}

// 60 FPS Ambient Starfield & Hex Grid Canvas Background
let ambientStars = [];
let ambientHexDrift = 0;
let ambientCanvas = null;
let ambientCtx = null;

function initAmbientBackground() {
    ambientCanvas = document.getElementById('ambientBackgroundCanvas');
    if (!ambientCanvas) return;
    ambientCtx = ambientCanvas.getContext('2d');

    function resizeAmbient() {
        if (!ambientCanvas) return;
        ambientCanvas.width = window.innerWidth;
        ambientCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeAmbient);
    resizeAmbient();

    ambientStars = [];
    for (let i = 0; i < 90; i++) {
        ambientStars.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.8 + 0.5,
            alpha: Math.random() * 0.7 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            layer: Math.random() * 2 + 1
        });
    }

    let lastAmbientTime = performance.now();
    function animateAmbient(currentTime) {
        requestAnimationFrame(animateAmbient);
        const viewCombat = document.getElementById('viewCombat');
        if (viewCombat && viewCombat.style.display !== 'none') return;

        const dt = (currentTime - lastAmbientTime) / 1000;
        lastAmbientTime = currentTime;

        if (!ambientCtx || !ambientCanvas) return;
        ambientCtx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);

        // Render ambient stars with gentle vertical drift
        for (let i = 0; i < ambientStars.length; i++) {
            const star = ambientStars[i];
            star.y -= 8 * star.layer * dt;
            if (star.y < 0) {
                star.y = ambientCanvas.height;
                star.x = Math.random() * ambientCanvas.width;
            }
            const pulse = 0.5 + 0.5 * Math.sin(currentTime * star.twinkleSpeed);
            ambientCtx.fillStyle = `rgba(22, 200, 242, ${star.alpha * pulse * 0.5})`;
            ambientCtx.beginPath();
            ambientCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ambientCtx.fill();
        }

        // Drifting faint hex grid pattern
        ambientHexDrift = (ambientHexDrift + dt * 10) % 60;
        ambientCtx.strokeStyle = 'rgba(22, 200, 242, 0.025)';
        ambientCtx.lineWidth = 1;
        const spacing = 60;
        const startY = ambientHexDrift - spacing;
        ambientCtx.beginPath();
        for (let y = startY; y < ambientCanvas.height + spacing; y += spacing) {
            ambientCtx.moveTo(0, y);
            ambientCtx.lineTo(ambientCanvas.width, y);
        }
        for (let x = 0; x < ambientCanvas.width; x += spacing) {
            ambientCtx.moveTo(x, 0);
            ambientCtx.lineTo(x, ambientCanvas.height);
        }
        ambientCtx.stroke();
    }
    requestAnimationFrame(animateAmbient);
}

// Tactical Crosshair Mouse Listener
function initTacticalCrosshair() {
    const cContainer = document.getElementById('canvasContainer');
    if (!cContainer) return;
    cContainer.addEventListener('mousemove', (e) => {
        const rect = cContainer.getBoundingClientRect();
        const ch = document.getElementById('tacticalCrosshair');
        if (ch) {
            ch.style.left = `${e.clientX - rect.left}px`;
            ch.style.top = `${e.clientY - rect.top}px`;
        }
    });
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
    setupPvPEmulatorEventListeners();
    setupTouchControlsEventListeners();
    setupSocialAndDisplayEventListeners();
    initAmbientBackground();
    initTacticalCrosshair();
    checkBackendHealth();
    updateGameLayoutState();
    verifyExistingSession().then(() => {
        checkMyCurrentRoom();
        fetchRoomsList();
    });
    requestAnimationFrame(gameLoop);
});


    // Featured Tactical Arena Map Host Buttons
    document.querySelectorAll('.btn-host-map').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const map = btn.getAttribute('data-map');
            const mapSelect = document.getElementById('roomMapSelect');
            if (mapSelect && map) mapSelect.value = map;
            const createModal = document.getElementById('createRoomModal');
            if (createModal) createModal.style.display = 'flex';
        });
    });
