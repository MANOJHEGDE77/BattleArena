const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('--- STARTING UNIVERSAL AAA UI TRANSFORMATION ---');

const ROOT = path.resolve(__dirname, '..');
const DOCS_HTML = path.join(ROOT, 'docs', 'index.html');
const DOCS_CSS = path.join(ROOT, 'docs', 'css', 'style.css');
const DOCS_JS = path.join(ROOT, 'docs', 'js', 'game.js');

const SRC_HTML = path.join(ROOT, 'src', 'main', 'resources', 'static', 'index.html');
const SRC_CSS = path.join(ROOT, 'src', 'main', 'resources', 'static', 'css', 'style.css');
const SRC_JS = path.join(ROOT, 'src', 'main', 'resources', 'static', 'js', 'game.js');

// -------------------------------------------------------------
// 1. UPDATE docs/index.html
// -------------------------------------------------------------
let html = fs.readFileSync(DOCS_HTML, 'utf8');

// A. Update #settingsModal with modern tabbed command deck
const oldSettingsModalStart = html.indexOf('<div class="modal-overlay" id="settingsModal" style="display: none;">');
const oldSettingsModalEnd = html.indexOf('<!-- ========================================================================= -->\n    <!-- TACTICAL INTEL & KEYBINDS MODAL -->', oldSettingsModalStart);

if (oldSettingsModalStart === -1 || oldSettingsModalEnd === -1) {
    throw new Error('Could not find #settingsModal in docs/index.html');
}

const newSettingsModalHtml = `<div class="modal-overlay" id="settingsModal" style="display: none;">
        <div class="modal-card modal-settings-deck">
            <div class="modal-header settings-header">
                <div class="settings-header-brand">
                    <span class="settings-header-icon">⚙️</span>
                    <div>
                        <h3 class="settings-modal-title">SYSTEMS &amp; CONTROLS CONFIG</h3>
                        <p class="settings-modal-subtitle">Tactical audio synthesis, ballistic crosshair tuning, rendering fidelity, and app integration</p>
                    </div>
                </div>
                <button class="modal-close-btn" id="closeSettingsModalBtn" type="button" aria-label="Close Settings">&times;</button>
            </div>

            <!-- Settings Tactical Navigation Tabs -->
            <div class="settings-nav-tabs" role="tablist">
                <button class="settings-tab-btn active" data-tab="settingsAudio" type="button" role="tab" aria-selected="true">
                    <span>🔊</span> AUDIO
                </button>
                <button class="settings-tab-btn" data-tab="settingsGraphics" type="button" role="tab" aria-selected="false">
                    <span>🖥️</span> GRAPHICS
                </button>
                <button class="settings-tab-btn" data-tab="settingsCrosshair" type="button" role="tab" aria-selected="false">
                    <span>🎯</span> CROSSHAIR
                </button>
                <button class="settings-tab-btn" data-tab="settingsApp" type="button" role="tab" aria-selected="false">
                    <span>⚡</span> STANDALONE APP
                </button>
                <button class="settings-tab-btn" data-tab="settingsNetwork" type="button" role="tab" aria-selected="false">
                    <span>🌐</span> NETWORK &amp; ACCESS
                </button>
            </div>

            <div class="modal-body settings-tab-body">
                <!-- TAB 1: AUDIO -->
                <div class="settings-tab-pane active" id="settingsAudio" role="tabpanel">
                    <div class="settings-card">
                        <div class="settings-subhead">AUDIO SYNTHESIS &amp; MASTER CHANNELS</div>
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <label for="masterVolumeRange">Master Volume</label>
                                <span class="settings-val-badge" id="masterVolDisplay">50%</span>
                            </div>
                            <input type="range" id="masterVolumeRange" min="0" max="100" value="50" class="settings-slider">
                        </div>
                        <div class="settings-row">
                            <div class="settings-row-label">
                                <label for="sfxVolumeRange">SFX Combat Synthesis</label>
                                <span class="settings-val-badge" id="sfxVolDisplay">75%</span>
                            </div>
                            <input type="range" id="sfxVolumeRange" min="0" max="100" value="75" class="settings-slider">
                        </div>
                        <div class="settings-toggle-row">
                            <div class="toggle-info">
                                <span class="toggle-title">Atmospheric Cyber Drone &amp; Synth</span>
                                <span class="toggle-desc">Procedural sub-bass binaural harmonic oscillator loop</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="ambientDroneToggle">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- TAB 2: GRAPHICS -->
                <div class="settings-tab-pane" id="settingsGraphics" role="tabpanel" style="display: none;">
                    <div class="settings-card">
                        <div class="settings-subhead">GRAPHICS PRESET &amp; RENDERING FIDELITY</div>
                        <div class="settings-row">
                            <label>Visual Quality Preset</label>
                            <div class="graphics-preset-pills" id="graphicsQualityPills">
                                <button type="button" class="preset-pill" data-quality="low">LOW</button>
                                <button type="button" class="preset-pill" data-quality="medium">MEDIUM</button>
                                <button type="button" class="preset-pill active" data-quality="high">HIGH (AAA)</button>
                            </div>
                        </div>
                        <div class="settings-toggle-row">
                            <div class="toggle-info">
                                <span class="toggle-title">Combat Screen Recoil &amp; Trauma Shake</span>
                                <span class="toggle-desc">Dynamic blast impulse and projectile recoil feedback</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="screenShakeToggle" checked>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="settings-note-box">
                            <span class="note-icon">ℹ️</span>
                            <span>High preset enables dynamic weapon bloom, projectile trails, particle thrusters, and directional damage arcs.</span>
                        </div>
                    </div>
                </div>

                <!-- TAB 3: CROSSHAIR -->
                <div class="settings-tab-pane" id="settingsCrosshair" role="tabpanel" style="display: none;">
                    <div class="settings-card">
                        <div class="settings-subhead">BALLISTIC RETICLE TUNING</div>
                        <div class="crosshair-config-row">
                            <div class="crosshair-preview-stage">
                                <div class="ch-preview-box" id="crosshairPreviewBox">
                                    <div class="ch-preview-reticle" id="chPreviewReticle">
                                        <span class="ch-prev-tick ch-prev-top"></span>
                                        <span class="ch-prev-tick ch-prev-bottom"></span>
                                        <span class="ch-prev-tick ch-prev-left"></span>
                                        <span class="ch-prev-tick ch-prev-right"></span>
                                        <span class="ch-prev-dot" id="chPreviewDot"></span>
                                    </div>
                                </div>
                                <span class="ch-preview-hint">Live Targeting Reticle</span>
                            </div>
                            <div class="crosshair-controls-col">
                                <div class="ch-control-item">
                                    <label>Reticle Color Palette</label>
                                    <div class="ch-color-picker" id="chColorPicker">
                                        <button type="button" class="ch-color-btn active" data-color="#16C8F2" style="background: #16C8F2;" title="Cyan"></button>
                                        <button type="button" class="ch-color-btn" data-color="#00E6A0" style="background: #00E6A0;" title="Teal Green"></button>
                                        <button type="button" class="ch-color-btn" data-color="#E02694" style="background: #E02694;" title="Magenta"></button>
                                        <button type="button" class="ch-color-btn" data-color="#FFB300" style="background: #FFB300;" title="Amber"></button>
                                        <button type="button" class="ch-color-btn" data-color="#FFFFFF" style="background: #FFFFFF;" title="White"></button>
                                    </div>
                                </div>
                                <div class="ch-control-item">
                                    <div class="settings-row-label">
                                        <label for="chSizeRange">Reticle Scale</label>
                                        <span class="settings-val-badge" id="chSizeDisplay">10px</span>
                                    </div>
                                    <input type="range" id="chSizeRange" min="6" max="18" value="10" class="settings-slider">
                                </div>
                                <div class="ch-control-item">
                                    <div class="settings-row-label">
                                        <label for="chGapRange">Center Gap</label>
                                        <span class="settings-val-badge" id="chGapDisplay">5px</span>
                                    </div>
                                    <input type="range" id="chGapRange" min="2" max="12" value="5" class="settings-slider">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAB 4: STANDALONE APP -->
                <div class="settings-tab-pane" id="settingsApp" role="tabpanel" style="display: none;">
                    <div class="settings-card">
                        <div class="settings-subhead">DESKTOP APPLICATION &amp; OFFLINE CLIENT</div>
                        <div class="app-mode-card">
                            <div class="app-mode-header">
                                <div class="app-icon-badge">⚡</div>
                                <div class="app-mode-meta">
                                    <h4 class="app-mode-title">Dedicated Borderless Window Mode</h4>
                                    <p class="app-mode-desc">Ultra-low latency Direct3D GPU acceleration, isolated cache sandbox, and full offline standalone simulation capability.</p>
                                </div>
                                <button type="button" class="btn-action-pill" id="settingsInstallAppBtn">INSTALL APP</button>
                            </div>
                            <div class="app-mode-features-grid">
                                <div class="app-feature-pill"><span>🚀</span> 60+ FPS Hardware Rasterization</div>
                                <div class="app-feature-pill"><span>📴</span> Zero-Network Offline Play</div>
                                <div class="app-feature-pill"><span>⌨️</span> Direct Keyboard Polling</div>
                                <div class="app-feature-pill"><span>🎮</span> Zero Browser URL Bar Distraction</div>
                            </div>
                        </div>
                        <div class="settings-row" style="margin-top: 12px;">
                            <span style="font-size: 0.76rem; color: var(--text-muted); display: block; line-height: 1.5;">
                                💡 <strong>Quick Launchers:</strong> Double-click <code style="color: var(--cyan-primary);">CyberArena.bat</code> in the project directory or run <code style="color: var(--cyan-primary);">npm run app</code> in terminal to start the native standalone app window immediately.
                            </span>
                        </div>
                    </div>
                </div>

                <!-- TAB 5: NETWORK & ACCESS -->
                <div class="settings-tab-pane" id="settingsNetwork" role="tabpanel" style="display: none;">
                    <div class="settings-card">
                        <div class="settings-subhead">ACCESSIBILITY &amp; TEAM PALETTE</div>
                        <div class="settings-row">
                            <label for="colorblindModeSelect">Colorblind Vision Palette</label>
                            <select id="colorblindModeSelect" class="form-input settings-select">
                                <option value="none" selected>Default (Tactical Cyan / Combat Red)</option>
                                <option value="deuteranopia">Deuteranopia (Yellow / Blue)</option>
                                <option value="protanopia">Protanopia (Soft Gold / Violet)</option>
                                <option value="tritanopia">Tritanopia (Cyan / Coral)</option>
                            </select>
                        </div>

                        <div class="settings-subhead" style="margin-top: 16px;">REMOTE COMBAT BACKEND INFRASTRUCTURE</div>
                        <div class="settings-row">
                            <label for="customBackendUrlInput">Remote Multiplayer Server URL (Optional)</label>
                            <input type="text" id="customBackendUrlInput" placeholder="e.g. https://battle-arena.up.railway.app" class="form-input settings-text-input">
                            <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 5px;">Leave blank for local host or standalone arcade engine (Vercel).</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-footer">
                <button type="button" class="btn-secondary-action" id="modalSoundToggleBtn">AUDIO: ACTIVE</button>
                <button type="button" class="btn-primary-action" id="saveSettingsBtn">SAVE &amp; CLOSE</button>
            </div>
        </div>
    </div>\n\n    `;

html = html.slice(0, oldSettingsModalStart) + newSettingsModalHtml + html.slice(oldSettingsModalEnd);

// B. Update #viewCombat to include widescreen telemetry wings and corner brackets
const oldCombatCanvasStart = html.indexOf('<div class="combat-canvas-viewport">');
const oldCombatCanvasEnd = html.indexOf('<!-- BOTTOM COMBAT HUD DOCKED CONTROLS -->', oldCombatCanvasStart);

if (oldCombatCanvasStart === -1 || oldCombatCanvasEnd === -1) {
    throw new Error('Could not find .combat-canvas-viewport in docs/index.html');
}

// Read inside of canvas container
const canvasContainerStart = html.indexOf('<div class="canvas-container" id="canvasContainer">', oldCombatCanvasStart);
const canvasContainerEnd = html.indexOf('</div>\n                </div>\n\n                <!-- BOTTOM COMBAT HUD DOCKED CONTROLS -->', canvasContainerStart);

const canvasContainerInner = html.slice(canvasContainerStart + '<div class="canvas-container" id="canvasContainer">'.length, canvasContainerEnd);

const newCombatViewportHtml = `<div class="combat-canvas-viewport">
                    <!-- Bounded Exponential Reconnection Alert Banner -->
                    <div class="network-reconnecting-banner" id="networkReconnectingBanner" style="display: none;">
                        <span class="reconnect-pulse-dot"></span>
                        <span id="reconnectingBannerText">CONNECTING TO SECURE ARENA SERVER...</span>
                    </div>

                    <div class="combat-viewport-layout">
                        <!-- Widescreen Tactical Telemetry Wing Left -->
                        <aside class="combat-telemetry-wing wing-left" aria-label="Left Telemetry Wing">
                            <div class="wing-card wing-sensors">
                                <div class="wing-header">
                                    <span class="wing-pulse-led"></span>
                                    <span class="wing-title">SYS-DIAG // SENSORS</span>
                                </div>
                                <div class="wing-stat-list">
                                    <div class="wing-stat-row">
                                        <span class="wing-stat-label">RADAR LINK</span>
                                        <span class="wing-stat-val text-cyan">ONLINE</span>
                                    </div>
                                    <div class="wing-stat-row">
                                        <span class="wing-stat-label">DAMPENERS</span>
                                        <span class="wing-stat-val text-emerald">OPTIMAL</span>
                                    </div>
                                    <div class="wing-stat-row">
                                        <span class="wing-stat-label">REACTOR CORE</span>
                                        <span class="wing-stat-val text-gold">NOMINAL</span>
                                    </div>
                                </div>
                            </div>

                            <div class="wing-card wing-tactical-keys">
                                <div class="wing-header">
                                    <span class="wing-icon">⌨️</span>
                                    <span class="wing-title">TACTICAL COMMS</span>
                                </div>
                                <div class="wing-comms-hints">
                                    <div class="comm-hint-item"><span class="keycap">T</span> Tactical Callouts</div>
                                    <div class="comm-hint-item"><span class="keycap">ENTER</span> Team Comms</div>
                                    <div class="comm-hint-item"><span class="keycap">TAB</span> Live Standings</div>
                                    <div class="comm-hint-item"><span class="keycap">ESC</span> Pause &amp; Config</div>
                                </div>
                            </div>
                        </aside>

                        <!-- Main Combat Canvas Container with Cyber Corner Brackets -->
                        <div class="canvas-container" id="canvasContainer">
                            <div class="canvas-bracket bracket-tl" aria-hidden="true"></div>
                            <div class="canvas-bracket bracket-tr" aria-hidden="true"></div>
                            <div class="canvas-bracket bracket-bl" aria-hidden="true"></div>
                            <div class="canvas-bracket bracket-br" aria-hidden="true"></div>
${canvasContainerInner}
                        </div>

                        <!-- Widescreen Tactical Telemetry Wing Right -->
                        <aside class="combat-telemetry-wing wing-right" aria-label="Right Telemetry Wing">
                            <div class="wing-card wing-objective">
                                <div class="wing-header">
                                    <span class="wing-pulse-led gold"></span>
                                    <span class="wing-title">TACTICAL DIRECTIVE</span>
                                </div>
                                <div class="wing-objective-body">
                                    <div class="directive-mode" id="wingDirectiveMode">FFA DEATHMATCH</div>
                                    <div class="directive-goal">Eliminate hostile chassis &amp; collect core charges to claim victory.</div>
                                    <div class="directive-target-box">
                                        <span>GOAL:</span>
                                        <strong id="wingTargetScore">100 PTS</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="wing-card wing-ballistics">
                                <div class="wing-header">
                                    <span class="wing-icon">🎯</span>
                                    <span class="wing-title">WEAPONRY &amp; MOBILITY</span>
                                </div>
                                <div class="wing-comms-hints">
                                    <div class="comm-hint-item"><span class="keycap">L-CLICK</span> Primary Fire</div>
                                    <div class="comm-hint-item"><span class="keycap">SPACE</span> Class Ability</div>
                                    <div class="comm-hint-item"><span class="keycap">W A S D</span> Vector Move</div>
                                    <div class="comm-hint-item"><span class="keycap">R-CLICK</span> Special Ability</div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>\n\n                `;

html = html.slice(0, oldCombatCanvasStart) + newCombatViewportHtml + html.slice(oldCombatCanvasEnd);

// C. Update #gameOverModal to feature elite esports podium ceremony & Pilot XP Card
const oldGameOverStart = html.indexOf('<div class="modal-overlay" id="gameOverModal" style="display: none;">');
const oldGameOverEnd = html.indexOf('<!-- Achievement Toast Notifications Container -->', oldGameOverStart);

if (oldGameOverStart === -1 || oldGameOverEnd === -1) {
    throw new Error('Could not find #gameOverModal in docs/index.html');
}

const newGameOverHtml = `<div class="modal-overlay" id="gameOverModal" style="display: none;">
        <div class="modal-card modal-game-over">
            <div class="modal-header game-over-header">
                <div class="game-over-banner-crest">
                    <span class="game-over-crown-icon" id="gameOverCrownIcon">👑</span>
                    <div>
                        <h3 id="gameOverTitle">COMBAT COMPLETE</h3>
                        <p class="winner-announcement" id="winnerAnnouncement">Player reached the target score!</p>
                    </div>
                </div>
                <div class="match-meta-pill" id="matchMetaPill" style="display: none;">Match #0</div>
            </div>
            <div class="modal-body game-over-body">
                <!-- Pilot XP Progression Card -->
                <div class="gameover-xp-card" id="gameOverXpCard">
                    <div class="xp-card-header">
                        <span class="xp-tag">PILOT PROGRESSION</span>
                        <span class="xp-gain-badge" id="gameOverXpGain">+150 COMBAT XP</span>
                    </div>
                    <div class="xp-bar-container">
                        <div class="xp-meta-row">
                            <span class="xp-current-lvl" id="gameOverCurrentLvl">LVL 1 PILOT</span>
                            <span class="xp-ratio-text" id="gameOverXpRatio">150 / 1000 XP</span>
                        </div>
                        <div class="xp-bar-track">
                            <div class="xp-bar-fill" id="gameOverXpFill" style="width: 15%;"></div>
                        </div>
                    </div>
                </div>

                <!-- Match Accolades Medals Row -->
                <div class="match-accolades-section">
                    <div class="section-label-micro">COMBAT ACCOLADES &amp; MEDALS</div>
                    <div class="match-accolades-row" id="matchAccoladesRow"></div>
                </div>

                <!-- Combat Timeline Highlights -->
                <div class="match-highlights-box" id="matchHighlightsBox">
                    <div class="highlights-header">
                        <span class="hl-dot"></span>
                        <span>COMBAT TIMELINE &amp; HIGHLIGHTS</span>
                    </div>
                    <div class="highlights-list" id="highlightsList"></div>
                </div>

                <!-- Match Standings Scoreboard -->
                <div class="match-standings-section">
                    <div class="section-label-micro">FINAL ARENA STANDINGS</div>
                    <div class="match-summary-scores" id="matchSummaryScores"></div>
                </div>

                <!-- Social Media Sharing Showcase -->
                <div class="social-share-container" id="socialShareContainer">
                    <span class="social-share-title">⚡ TRANSMIT BATTLE RECORD TO SOCIAL CHANNELS</span>
                    <div class="social-share-row" id="socialShareRow">
                        <button class="btn-social-share btn-twitter" id="postToTwitterBtn" type="button" title="Post Match Result to X (Twitter)">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            <span>POST TO X</span>
                        </button>
                        <button class="btn-social-share btn-reddit" id="shareToRedditBtn" type="button" title="Share Match on Reddit">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
                            <span>REDDIT</span>
                        </button>
                        <button class="btn-social-share btn-native-share" id="nativeShareBtn" type="button" title="Share via Mobile Share Sheet">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            <span>SHARE</span>
                        </button>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary-action" id="copyBattleReportBtn" type="button">SHARE REPORT</button>
                    <button class="btn-primary-action" id="rematchBtn" style="display: none;" type="button">REMATCH</button>
                    <button class="btn-accent-action" id="returnToLobbyBtn" type="button">RETURN TO MENU</button>
                    <button class="btn-ghost-action" id="viewLeaderboardFromGameOverBtn" type="button">RANKS</button>
                </div>
            </div>
        </div>
    </div>\n\n    `;

html = html.slice(0, oldGameOverStart) + newGameOverHtml + html.slice(oldGameOverEnd);

fs.writeFileSync(DOCS_HTML, html, 'utf8');
console.log('✔ Successfully updated docs/index.html');

// -------------------------------------------------------------
// 2. UPDATE docs/js/game.js
// -------------------------------------------------------------
let js = fs.readFileSync(DOCS_JS, 'utf8');

// A. Add settings tab switching logic into setupSettingsEventListeners
const oldSettingsInit = `function setupSettingsEventListeners() {`;
if (!js.includes(oldSettingsInit)) {
    throw new Error('Could not find setupSettingsEventListeners in docs/js/game.js');
}

const newSettingsTabInit = `function setupSettingsEventListeners() {
    // Settings Tab Switching
    const settingsTabs = document.querySelectorAll('.settings-tab-btn');
    settingsTabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            settingsTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const panes = document.querySelectorAll('.settings-tab-pane');
            panes.forEach(p => {
                if (p.id === tabId) {
                    p.classList.add('active');
                    p.style.display = 'block';
                } else {
                    p.classList.remove('active');
                    p.style.display = 'none';
                }
            });
        });
    });
`;

js = js.replace(oldSettingsInit, newSettingsTabInit);

// B. Improve renderOverchargeBeacon() so it renders a clean tactical pill badge
const oldBeaconText = `    const capText = activeRoom.beaconCapturedBy ? \`CAPTURED: \${activeRoom.beaconCapturedBy.toUpperCase()}\` : 'OVERCHARGE BEACON (+2 PTS / +6 SHIELD/S)';
    ctx.strokeText(capText, 0, -brad - 14);
    ctx.fillStyle = activeRoom.beaconCapturedBy ? '#34d399' : '#fbbf24';
    ctx.fillText(capText, 0, -brad - 14);`;

const newBeaconPill = `    const capText = activeRoom.beaconCapturedBy ? \`SECURED: \${activeRoom.beaconCapturedBy.toUpperCase()}\` : 'OVERCHARGE ZONE';
    const textWidth = ctx.measureText(capText).width;
    const pillW = textWidth + 24;
    const pillH = 20;
    const pillY = -brad - 18;
    ctx.fillStyle = 'rgba(6, 10, 20, 0.85)';
    ctx.strokeStyle = activeRoom.beaconCapturedBy ? 'rgba(52, 211, 153, 0.7)' : 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(-pillW / 2, pillY - pillH / 2, pillW, pillH, 10);
    } else {
        ctx.rect(-pillW / 2, pillY - pillH / 2, pillW, pillH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = activeRoom.beaconCapturedBy ? '#34d399' : '#fbbf24';
    ctx.fillText(capText, 0, pillY);`;

if (js.includes(oldBeaconText)) {
    js = js.replace(oldBeaconText, newBeaconPill);
    console.log('✔ Enhanced renderOverchargeBeacon with tactical pill badge');
}

// C. Update GameOver modal logic to animate XP card
const oldShowGameOverModalSnippet = `            if (winnerAnnouncement) {
                winnerAnnouncement.textContent = isMeWinner
                    ? \`🏆 You dominated the arena with \${player.kills} eliminations! (+\${earnedXp} XP)\`
                    : \`☠️ \${winner.name} seized victory with \${winner.kills} eliminations. (+\${earnedXp} XP)\`;
            }`;

const newShowGameOverModalSnippet = `            if (winnerAnnouncement) {
                winnerAnnouncement.textContent = isMeWinner
                    ? \`🏆 You dominated the arena with \${player.kills} eliminations!\`
                    : \`☠️ \${winner.name} seized victory with \${winner.kills} eliminations.\`;
            }
            const goXpGain = document.getElementById('gameOverXpGain');
            const goCurLvl = document.getElementById('gameOverCurrentLvl');
            const goXpRatio = document.getElementById('gameOverXpRatio');
            const goXpFill = document.getElementById('gameOverXpFill');
            if (goXpGain) goXpGain.textContent = \`+\${earnedXp} COMBAT XP\`;
            if (goCurLvl) goCurLvl.textContent = \`LVL \${profile.level} PILOT\`;
            if (goXpRatio) goXpRatio.textContent = \`\${profile.xp % 1000} / 1000 XP\`;
            if (goXpFill) goXpFill.style.width = \`\${Math.min(100, Math.round(((profile.xp % 1000) / 1000) * 100))}%\`;`;

if (js.includes(oldShowGameOverModalSnippet)) {
    js = js.replace(oldShowGameOverModalSnippet, newShowGameOverModalSnippet);
    console.log('✔ Added XP progression animation to offline GameOver modal');
}

fs.writeFileSync(DOCS_JS, js, 'utf8');
console.log('✔ Successfully updated docs/js/game.js');

// -------------------------------------------------------------
// 3. UPDATE docs/css/style.css
// -------------------------------------------------------------
let css = fs.readFileSync(DOCS_CSS, 'utf8');

// Append new comprehensive styles for Settings tabs, Combat Telemetry Wings, Corner Brackets, and Game Over Podium
const extraUiCss = `
/* ==========================================================================
   ENHANCED AAA SETTINGS COMMAND DECK
   ========================================================================== */
.modal-settings-deck {
    max-width: 680px;
    width: 95vw;
    background: linear-gradient(180deg, rgba(10, 15, 28, 0.98) 0%, rgba(6, 9, 18, 0.98) 100%);
    border: 1px solid rgba(22, 200, 242, 0.35);
    border-radius: 12px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 32px rgba(22, 200, 242, 0.15);
    overflow: hidden;
}

.settings-header {
    padding: 18px 24px 14px 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.settings-header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
}

.settings-header-icon {
    font-size: 1.5rem;
    filter: drop-shadow(0 0 8px rgba(22, 200, 242, 0.6));
}

.settings-modal-title {
    font-family: var(--font-display);
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 1px;
    color: #ffffff;
    margin: 0;
}

.settings-modal-subtitle {
    font-size: 0.74rem;
    color: var(--text-muted);
    margin: 2px 0 0 0;
}

.settings-nav-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 18px;
    background: rgba(4, 7, 14, 0.65);
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    overflow-x: auto;
}

.settings-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
}

.settings-tab-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.05);
}

.settings-tab-btn.active {
    color: var(--cyan-primary);
    background: rgba(22, 200, 242, 0.12);
    border-color: rgba(22, 200, 242, 0.3);
    box-shadow: 0 0 12px rgba(22, 200, 242, 0.2);
}

.settings-tab-body {
    padding: 20px 24px;
    min-height: 280px;
    max-height: 58vh;
    overflow-y: auto;
}

.settings-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.settings-row-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.settings-row-label label {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
}

.settings-val-badge {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    background: rgba(22, 200, 242, 0.15);
    color: var(--cyan-primary);
    border-radius: 4px;
    border: 1px solid rgba(22, 200, 242, 0.25);
}

.settings-slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.settings-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--cyan-primary);
    box-shadow: 0 0 10px var(--cyan-primary);
    cursor: pointer;
    transition: transform 0.15s ease;
}

.settings-slider::-webkit-slider-thumb:hover {
    transform: scale(1.25);
}

.settings-note-box {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(22, 200, 242, 0.06);
    border: 1px solid rgba(22, 200, 242, 0.18);
    border-radius: 6px;
    font-size: 0.74rem;
    color: var(--text-muted);
    line-height: 1.45;
}

.app-mode-card {
    padding: 14px 18px;
    background: rgba(14, 20, 36, 0.6);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.app-mode-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.app-icon-badge {
    font-size: 1.4rem;
    padding: 8px 12px;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 8px;
}

.app-mode-meta {
    flex: 1;
}

.app-mode-title {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
}

.app-mode-desc {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin: 3px 0 0 0;
    line-height: 1.4;
}

.app-mode-features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.app-feature-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(6, 9, 18, 0.6);
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 4px;
    font-size: 0.72rem;
    color: var(--text-secondary);
}

.settings-select,
.settings-text-input {
    width: 100%;
    padding: 8px 12px;
    background: rgba(6, 8, 16, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 6px;
    color: #ffffff;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    outline: none;
    transition: border-color 0.2s ease;
}

.settings-select:focus,
.settings-text-input:focus {
    border-color: var(--cyan-primary);
    box-shadow: 0 0 10px rgba(22, 200, 242, 0.25);
}

/* ==========================================================================
   COMBAT VIEWPORT LAYOUT & TACTICAL TELEMETRY WINGS
   ========================================================================== */
.combat-viewport-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 100%;
    height: 100%;
    max-width: 1860px;
    position: relative;
    z-index: 10;
}

.combat-telemetry-wing {
    width: 220px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex-shrink: 0;
    user-select: none;
    pointer-events: none;
}

@media (max-width: 1280px) {
    .combat-telemetry-wing {
        display: none !important;
    }
}

.wing-card {
    background: rgba(8, 12, 24, 0.82);
    border: 1px solid rgba(22, 200, 242, 0.2);
    border-radius: 8px;
    padding: 12px 14px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
}

.wing-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.wing-pulse-led {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px #10b981;
    animation: ledPulse 1.8s infinite ease-in-out;
}

.wing-pulse-led.gold {
    background: #f59e0b;
    box-shadow: 0 0 8px #f59e0b;
}

@keyframes ledPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
}

.wing-title {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 1px;
    color: var(--text-secondary);
}

.wing-icon {
    font-size: 0.9rem;
}

.wing-stat-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.wing-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.7rem;
}

.wing-stat-label {
    color: var(--text-muted);
}

.wing-stat-val {
    font-weight: 700;
}

.text-cyan { color: var(--cyan-primary); }
.text-emerald { color: #10b981; }
.text-gold { color: #f59e0b; }

.wing-comms-hints {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.comm-hint-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--text-secondary);
}

.keycap {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(22, 200, 242, 0.12);
    border: 1px solid rgba(22, 200, 242, 0.35);
    border-radius: 4px;
    color: var(--cyan-primary);
    font-size: 0.64rem;
    font-weight: 800;
    min-width: 18px;
    text-align: center;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.4);
}

.directive-mode {
    font-family: var(--font-display);
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--cyan-primary);
    margin-bottom: 4px;
}

.directive-goal {
    font-size: 0.68rem;
    color: var(--text-muted);
    line-height: 1.35;
    margin-bottom: 8px;
}

.directive-target-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: #fbbf24;
}

/* CYBER CORNER BRACKETS FOR CANVAS */
.canvas-bracket {
    position: absolute;
    width: 20px;
    height: 20px;
    pointer-events: none;
    z-index: 20;
    border-color: rgba(22, 200, 242, 0.85);
    box-shadow: 0 0 10px rgba(22, 200, 242, 0.4);
}

.bracket-tl {
    top: 4px;
    left: 4px;
    border-top: 2px solid;
    border-left: 2px solid;
}

.bracket-tr {
    top: 4px;
    right: 4px;
    border-top: 2px solid;
    border-right: 2px solid;
}

.bracket-bl {
    bottom: 4px;
    left: 4px;
    border-bottom: 2px solid;
    border-left: 2px solid;
}

.bracket-br {
    bottom: 4px;
    right: 4px;
    border-bottom: 2px solid;
    border-right: 2px solid;
}

/* ==========================================================================
   GAME OVER MODAL ESPORTS PODIUM & XP PROGRESSION
   ========================================================================== */
.modal-game-over {
    max-width: 640px;
    width: 95vw;
    background: linear-gradient(180deg, rgba(12, 18, 32, 0.98) 0%, rgba(6, 9, 18, 0.98) 100%);
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.2);
    border-radius: 12px;
}

.game-over-header {
    padding: 20px 24px 16px 24px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.game-over-banner-crest {
    display: flex;
    align-items: center;
    gap: 14px;
}

.game-over-crown-icon {
    font-size: 2rem;
    filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.7));
    animation: crownFloat 2.5s infinite ease-in-out;
}

@keyframes crownFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}

.gameover-xp-card {
    padding: 12px 16px;
    background: rgba(14, 22, 42, 0.7);
    border: 1px solid rgba(22, 200, 242, 0.25);
    border-radius: 8px;
    margin-bottom: 14px;
}

.xp-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.xp-tag {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 800;
    color: var(--text-muted);
}

.xp-gain-badge {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    font-weight: 800;
    padding: 2px 8px;
    background: rgba(16, 185, 129, 0.18);
    border: 1px solid rgba(16, 185, 129, 0.35);
    border-radius: 4px;
    color: #34d399;
}

.xp-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    margin-bottom: 6px;
}

.xp-current-lvl {
    color: #ffffff;
    font-weight: 700;
}

.xp-ratio-text {
    color: var(--cyan-primary);
}

.xp-bar-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    overflow: hidden;
}

.xp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0284c7, #00f2fe);
    box-shadow: 0 0 10px rgba(0, 242, 254, 0.6);
    transition: width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.section-label-micro {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin-bottom: 8px;
}

.match-accolades-section,
.match-standings-section {
    margin-bottom: 14px;
}
`;

css += '\n' + extraUiCss;
fs.writeFileSync(DOCS_CSS, css, 'utf8');
console.log('✔ Successfully updated docs/css/style.css');

// -------------------------------------------------------------
// 4. MIRROR TO src/main/resources/static/
// -------------------------------------------------------------
fs.copyFileSync(DOCS_HTML, SRC_HTML);
fs.copyFileSync(DOCS_CSS, SRC_CSS);
fs.copyFileSync(DOCS_JS, SRC_JS);

console.log('✔ Successfully mirrored to src/main/resources/static/');

// -------------------------------------------------------------
// 5. VERIFY EXACT SHA256 SYNCHRONIZATION
// -------------------------------------------------------------
function sha256(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

const pairs = [
    [DOCS_HTML, SRC_HTML, 'index.html'],
    [DOCS_CSS, SRC_CSS, 'css/style.css'],
    [DOCS_JS, SRC_JS, 'js/game.js']
];

for (const [a, b, label] of pairs) {
    const hashA = sha256(a);
    const hashB = sha256(b);
    if (hashA !== hashB) {
        throw new Error(`Hash mismatch on ${label}!`);
    }
    console.log(`✔ SHA256 MATCH (${label}): ${hashA.slice(0, 16)}...`);
}

console.log('--- ALL UI UPDATES COMPLETED SUCCESSFULLY ---');
