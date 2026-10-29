/**
 * scripts/refine_ui.js
 * Applies Modern AAA Gaming Interface styling to style.css for both docs/ and static/
 */
const fs = require('fs');
const path = require('path');

function refineCss(filePath) {
    let css = fs.readFileSync(filePath, 'utf8');

    // Normalize CRLF to LF
    css = css.replace(/\r\n/g, '\n');

    // 1. :root design tokens
    const rootBlock = `:root {
    /* Surface Colors — Deep charcoal & blue-black */
    --bg-void: #070a10;
    --bg-stage: #0b0f19;
    --bg-surface: #101626;
    --bg-surface-elevated: #151d30;
    --bg-surface-hover: #1c2740;
    --bg-glass: rgba(14, 20, 34, 0.78);
    --bg-glass-elevated: rgba(18, 26, 44, 0.90);

    /* Borders & Dividers */
    --border-subtle: rgba(255, 255, 255, 0.07);
    --border-default: rgba(255, 255, 255, 0.12);
    --border-hover: rgba(255, 255, 255, 0.20);
    --border-highlight: rgba(56, 189, 248, 0.35);
    --border-combat: rgba(244, 63, 94, 0.35);

    /* Primary Accent: Sophisticated Sky Cyan & Blue */
    --cyan-primary: #38bdf8;
    --cyan-muted: #0284c7;
    --cyan-dim: rgba(56, 189, 248, 0.10);
    --cyan-glow: 0 4px 16px rgba(56, 189, 248, 0.25);
    --accent-primary: #38bdf8;
    --accent-blue: #0284c7;
    --accent-blue-deep: #1e40af;
    --accent-violet: #818cf8;

    /* Combat Accent: Hostile / Alert Crimson */
    --combat-red: #f43f5e;
    --combat-red-dim: rgba(244, 63, 94, 0.12);
    --combat-glow: 0 4px 16px rgba(244, 63, 94, 0.25);

    /* Functional Accents */
    --emerald-green: #10b981;
    --amber-gold: #f59e0b;
    --purple-scout: #818cf8;

    /* Typography */
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --font-display: 'Orbitron', 'Inter', -apple-system, sans-serif;
    --font-ui: 'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* Radii & Transitions */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --transition-fast: 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    --transition-smooth: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}`;

    css = css.replace(/:root\s*\{[\s\S]*?\n\}/, rootBlock);

    // 2. Navigation Tabs (.nav-tab)
    const navTabOldRegex = /\.nav-tab\s*\{[\s\S]*?\.topbar-actions\s*\{/;
    const navTabNew = `.nav-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.4px;
    cursor: pointer;
    transition: all var(--transition-fast);
    outline: none;
}

.nav-tab .tab-icon {
    width: 15px;
    height: 15px;
    color: var(--text-muted);
    transition: color var(--transition-fast), transform var(--transition-fast);
}

.nav-tab::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 12px;
    right: 12px;
    height: 2px;
    background: var(--accent-primary);
    border-radius: 2px;
    opacity: 0;
    transform: scaleX(0.5);
    transition: all var(--transition-fast);
}

.nav-tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.04);
}

.nav-tab:hover .tab-icon {
    color: var(--accent-primary);
}

.nav-tab.active {
    color: var(--text-primary);
    font-weight: 600;
    background: rgba(255, 255, 255, 0.05);
}

.nav-tab.active .tab-icon {
    color: var(--accent-primary);
}

.nav-tab.active::after {
    opacity: 1;
    transform: scaleX(1);
}

.nav-tab:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
}

/* Topbar Actions & Telemetry */
.topbar-actions {`;

    if (navTabOldRegex.test(css)) {
        css = css.replace(navTabOldRegex, navTabNew);
    }

    // 3. Header Action Buttons (.btn-ghost-action, .btn-accent-action)
    const headerBtnsOldRegex = /\/\* Auth Triggers \*\/[\s\S]*?\.tactical-badge\s*\{/;
    const headerBtnsNew = `/* Auth Triggers */
.auth-buttons-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-ghost-action {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 8px;
    color: #cbd5e1;
    font-family: var(--font-ui);
    font-size: 0.76rem;
    font-weight: 500;
    letter-spacing: 0.3px;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all var(--transition-fast);
}

.btn-ghost-action svg {
    width: 13px;
    height: 13px;
    color: var(--amber-gold);
    transition: transform var(--transition-fast);
}

.btn-ghost-action:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.18);
    color: #ffffff;
    transform: translateY(-1px);
}

.btn-ghost-action:active {
    transform: translateY(1px);
}

.btn-ghost-action:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
}

.btn-accent-action {
    padding: 7px 16px;
    background: #0284c7;
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 8px;
    color: #ffffff;
    font-family: var(--font-ui);
    font-size: 0.76rem;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.28);
    transition: all var(--transition-fast);
}

.btn-accent-action:hover {
    background: #0369a1;
    border-color: rgba(56, 189, 248, 0.6);
    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    transform: translateY(-1px);
}

.btn-accent-action:active {
    transform: translateY(1px);
}

.btn-accent-action:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
}

/* Tactical Badge Utility */
.tactical-badge {`;

    if (headerBtnsOldRegex.test(css)) {
        css = css.replace(headerBtnsOldRegex, headerBtnsNew);
    }

    // 4. Tactical badges (.tactical-badge)
    const badgeOldRegex = /\.tactical-badge\s*\{[\s\S]*?\.view-play\s*\{/;
    const badgeNew = `.tactical-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 9px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.4px;
    color: var(--text-secondary);
}

.tactical-badge.live {
    color: var(--emerald-green);
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.08);
}

.tactical-badge.mode {
    color: var(--cyan-primary);
    border-color: rgba(56, 189, 248, 0.3);
    background: rgba(56, 189, 248, 0.08);
}

/* ==============================================================================
 * VIEW 1: PLAY VIEW (Cinematic Hero Stage & Mode Tray)
 * ============================================================================== */
.view-play {`;

    if (badgeOldRegex.test(css)) {
        css = css.replace(badgeOldRegex, badgeNew);
    }

    // 5. Hero title, typography, and operator pill
    const heroTitleOldRegex = /\.title-sub\s*\{[\s\S]*?\/\* THE PRIMARY PLAY LAUNCH ACTION \*\//;
    const heroTitleNew = `.title-sub {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 1.2px;
    color: var(--cyan-primary);
    text-transform: uppercase;
    margin-bottom: 4px;
}

.title-main {
    font-family: var(--font-display);
    font-size: clamp(2.2rem, 3.8vw, 3.2rem);
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.1;
    color: #f8fafc;
}

.hero-summary {
    color: var(--text-secondary);
    font-family: var(--font-ui);
    font-size: 0.95rem;
    line-height: 1.6;
    max-width: 520px;
}

/* Active Operator Quick Card */
.hero-operator-pill {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    background: rgba(18, 24, 38, 0.65);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    max-width: fit-content;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    transition: border-color var(--transition-fast);
}

.hero-operator-pill:hover {
    border-color: rgba(255, 255, 255, 0.15);
}

.operator-pill-avatar {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(16, 185, 129, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(16, 185, 129, 0.25);
}

.avatar-svg {
    width: 100%;
    height: 100%;
}

.operator-pill-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.pill-label {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.4px;
    color: #64748b;
    text-transform: uppercase;
}

.pill-name {
    font-family: var(--font-ui);
    font-size: 0.88rem;
    font-weight: 600;
    color: #f1f5f9;
}

/* Tertiary Button — Modify */
.pill-change-btn {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 8px;
    color: #94a3b8;
    font-family: var(--font-ui);
    font-size: 0.74rem;
    font-weight: 500;
    letter-spacing: 0.2px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all var(--transition-fast);
}

.pill-change-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.20);
    color: #f1f5f9;
    transform: translateY(-1px);
}

.pill-change-btn:active {
    transform: translateY(0);
}

.pill-change-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
}

/* THE PRIMARY PLAY LAUNCH ACTION */`;

    if (heroTitleOldRegex.test(css)) {
        css = css.replace(heroTitleOldRegex, heroTitleNew);
    }

    // 6. Primary and Secondary Launch Buttons (.btn-primary-launch, .btn-emulator-launch)
    const launchSectionOldRegex = /\.hero-launch-section\s*\{[\s\S]*?\/\* Mode-Specific Color Themes for Primary Launch \*\//;
    const launchSectionNew = `.hero-launch-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 14px;
}

.hero-launch-btn-row {
    display: flex;
    align-items: stretch;
    gap: 12px;
    flex-wrap: wrap;
}

/* Primary Button — Deploy Into Battle */
.btn-primary-launch {
    position: relative;
    flex: 1 1 270px;
    min-width: 250px;
    max-width: 360px;
    height: 58px;
    background: linear-gradient(135deg, #0284c7 0%, #1e40af 100%);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 12px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    outline: none;
    box-shadow: 0 4px 16px rgba(2, 132, 199, 0.25), 0 1px 2px rgba(0, 0, 0, 0.4);
    transition: background var(--transition-smooth), border-color var(--transition-smooth), box-shadow var(--transition-smooth), transform var(--transition-fast), filter var(--transition-fast);
    overflow: hidden;
    user-select: none;
}

.btn-launch-glow {
    display: none;
}

.btn-launch-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    width: 100%;
    gap: 14px;
    background: transparent !important;
    border: none !important;
    clip-path: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    overflow: visible !important;
}

.btn-launch-content::before,
.btn-launch-content::after {
    display: none !important;
}

.btn-launch-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    flex-shrink: 0;
    transition: transform var(--transition-fast), background var(--transition-fast);
}

.btn-launch-icon svg {
    width: 16px;
    height: 16px;
    filter: none;
    transition: transform var(--transition-fast);
}

.btn-launch-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    text-align: left;
    gap: 2px;
}

.launch-label {
    font-family: var(--font-ui);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: #ffffff;
    text-shadow: none;
    line-height: 1.2;
}

.launch-desc {
    font-family: var(--font-ui);
    font-size: 0.75rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 0.1px;
    line-height: 1.2;
}

.btn-launch-arrow {
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.9);
    transition: transform var(--transition-fast);
    filter: none;
    margin-left: 4px;
}

/* Primary Button Hover & Active States */
.btn-primary-launch:hover {
    background: linear-gradient(135deg, #0369a1 0%, #2563eb 100%);
    border-color: rgba(56, 189, 248, 0.55);
    box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35), 0 2px 4px rgba(0, 0, 0, 0.3);
    filter: brightness(1.04);
}

.btn-primary-launch:hover .btn-launch-arrow {
    transform: translateX(4px);
}

.btn-primary-launch:hover .btn-launch-icon {
    background: rgba(255, 255, 255, 0.18);
}

.btn-primary-launch:active {
    transform: translateY(1px);
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.3);
}

.btn-primary-launch:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
}

/* Secondary Button — Practice With AI */
.btn-emulator-launch {
    flex: 0 1 auto;
    min-width: 200px;
    height: 58px;
    background: rgba(18, 24, 38, 0.7) !important;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    padding: 0 18px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    cursor: pointer !important;
    outline: none !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
    transition: all var(--transition-smooth) !important;
    color: #f1f5f9 !important;
}

.emulator-btn-glow {
    display: none;
}

.emulator-btn-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.emulator-btn-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #38bdf8;
    font-size: 1rem;
    flex-shrink: 0;
    transition: all var(--transition-fast);
}

.emulator-btn-icon svg {
    color: #38bdf8;
}

.emulator-btn-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    gap: 2px;
}

.emulator-title {
    font-family: var(--font-ui) !important;
    font-size: 0.92rem !important;
    font-weight: 600 !important;
    letter-spacing: 0.2px !important;
    color: #f1f5f9 !important;
    line-height: 1.2;
}

.emulator-sub {
    font-family: var(--font-ui) !important;
    font-size: 0.74rem !important;
    font-weight: 400 !important;
    color: #94a3b8 !important;
    letter-spacing: 0.1px !important;
    line-height: 1.2;
}

.btn-emulator-launch:hover {
    background: rgba(26, 35, 54, 0.85) !important;
    border-color: rgba(56, 189, 248, 0.35) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4) !important;
    transform: translateY(-1px) !important;
    filter: none !important;
}

.btn-emulator-launch:hover .emulator-btn-icon {
    background: rgba(56, 189, 248, 0.12);
    border-color: rgba(56, 189, 248, 0.25);
}

.btn-emulator-launch:active {
    transform: translateY(1px) !important;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3) !important;
}

.btn-emulator-launch:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 3px;
}

/* Mode-Specific Color Themes for Primary Launch */`;

    if (launchSectionOldRegex.test(css)) {
        css = css.replace(launchSectionOldRegex, launchSectionNew);
    }

    // 7. Mode theme colors for primary button & cancel button
    const modeDuelOldRegex = /\.btn-primary-launch\.mode-duel\s*\{[\s\S]*?\.launch-sub-status\s*\{/;
    const modeDuelNew = `.btn-primary-launch.mode-duel {
    background: linear-gradient(135deg, #be123c 0%, #881337 100%);
    border-color: rgba(244, 63, 94, 0.4);
    box-shadow: 0 4px 16px rgba(225, 29, 72, 0.25), 0 1px 2px rgba(0, 0, 0, 0.4);
}

.btn-primary-launch.mode-duel:hover {
    background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);
    border-color: rgba(244, 63, 94, 0.6);
    box-shadow: 0 6px 20px rgba(225, 29, 72, 0.35);
}

.btn-primary-launch.mode-practice {
    background: linear-gradient(135deg, #b45309 0%, #78350f 100%);
    border-color: rgba(245, 158, 11, 0.4);
    box-shadow: 0 4px 16px rgba(217, 119, 6, 0.25), 0 1px 2px rgba(0, 0, 0, 0.4);
}

.btn-primary-launch.mode-practice:hover {
    background: linear-gradient(135deg, #d97706 0%, #92400e 100%);
    border-color: rgba(245, 158, 11, 0.6);
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.35);
}

.launch-sub-status {`;

    if (modeDuelOldRegex.test(css)) {
        css = css.replace(modeDuelOldRegex, modeDuelNew);
    }

    // Cancel deployment button
    const cancelBtnOldRegex = /\.btn-cancel-search\s*\{[\s\S]*?\n\}/;
    const cancelBtnNew = `.btn-cancel-search {
    align-self: flex-start;
    padding: 8px 16px;
    background: rgba(244, 63, 94, 0.08);
    border: 1px solid rgba(244, 63, 94, 0.3);
    border-radius: 8px;
    clip-path: none !important;
    color: #fb7185;
    font-family: var(--font-ui);
    font-size: 0.76rem;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    box-shadow: none;
    transition: all var(--transition-fast);
}

.btn-cancel-search:hover {
    background: rgba(244, 63, 94, 0.16);
    border-color: rgba(244, 63, 94, 0.5);
    color: #ffffff;
    transform: translateY(-1px);
}

.btn-cancel-search:active {
    transform: translateY(1px);
}`;

    if (cancelBtnOldRegex.test(css)) {
        css = css.replace(cancelBtnOldRegex, cancelBtnNew);
    }

    // 8. Game Mode Cards (.mode-cards-grid, .mode-card, .mode-select-btn)
    const modeCardsOldRegex = /\/\* 4 Distinct Game Mode Cards \*\/[\s\S]*?\/\* ==============================================================================\s*\* VIEW 2: OPERATORS VIEW/;
    const modeCardsNew = `/* 4 Distinct Game Mode Cards — Modern AAA Cards */
.mode-selector-tray {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.tray-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.tray-title {
    font-family: var(--font-ui);
    font-size: 0.84rem;
    font-weight: 600;
    letter-spacing: 0.8px;
    color: #f1f5f9;
    text-transform: uppercase;
}

.tray-hint {
    font-family: var(--font-ui);
    font-size: 0.78rem;
    color: #64748b;
    margin-left: 10px;
}

.tray-selection-indicator {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.4px;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.18);
    padding: 3px 10px;
    border-radius: 20px;
}

.mode-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
}

.mode-card {
    position: relative;
    background: rgba(16, 22, 36, 0.65);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    clip-path: none !important;
    padding: 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    cursor: pointer;
    outline: none;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.mode-card-edge {
    display: none;
}

.mode-card:hover {
    transform: translateY(-3px);
    background: rgba(22, 30, 48, 0.75);
    border-color: rgba(56, 189, 248, 0.25);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.mode-card:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
}

.mode-card.active-mode {
    background: rgba(16, 27, 48, 0.85);
    border-color: rgba(56, 189, 248, 0.5);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(56, 189, 248, 0.25);
}

.mode-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.mode-icon-box {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    color: #38bdf8;
    transition: background var(--transition-fast), border-color var(--transition-fast);
}

.mode-card:hover .mode-icon-box {
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.2);
}

.mode-icon-box svg {
    width: 18px;
    height: 18px;
}

.mode-tag {
    font-family: var(--font-ui);
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.3px;
    padding: 3px 8px;
    border-radius: 20px;
    text-transform: uppercase;
}

.tag-ffa {
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}

.tag-duel {
    background: rgba(244, 63, 94, 0.1);
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #fb7185;
}

.tag-practice {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    color: #fbbf24;
}

.tag-custom {
    background: rgba(129, 140, 248, 0.1);
    border: 1px solid rgba(129, 140, 248, 0.2);
    color: #a5b4fc;
}

.mode-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.mode-name {
    font-family: var(--font-ui);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: #f1f5f9;
}

.mode-description {
    font-family: var(--font-ui);
    font-size: 0.8rem;
    line-height: 1.45;
    color: #94a3b8;
}

.mode-difficulty-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
}

.diff-label {
    font-family: var(--font-ui);
    font-size: 0.68rem;
    color: #64748b;
    font-weight: 500;
}

.diff-pill {
    padding: 3px 8px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-family: var(--font-ui);
    font-size: 0.68rem;
    font-weight: 500;
    color: #94a3b8;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.diff-pill:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #f1f5f9;
}

.diff-pill.active {
    background: rgba(56, 189, 248, 0.15);
    border-color: rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    font-weight: 600;
}

.mode-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.mode-capacity {
    font-family: var(--font-ui);
    font-size: 0.72rem;
    color: #64748b;
}

/* Modern Select Button on Cards */
.mode-select-btn {
    position: relative;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    clip-path: none !important;
    color: #94a3b8;
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    box-shadow: none;
    transition: all var(--transition-fast);
}

.mode-select-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    transform: translateY(-1px);
}

.mode-card.active-mode .mode-select-btn {
    background: #0284c7;
    border-color: #38bdf8;
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
}

.mode-select-btn:active {
    transform: translateY(1px);
}

/* ==============================================================================
 * VIEW 2: OPERATORS VIEW`;

    if (modeCardsOldRegex.test(css)) {
        css = css.replace(modeCardsOldRegex, modeCardsNew);
    }

    // 9. Clean up redundant override in lines 4668 for .btn-emulator-launch
    const emulatorOverrideRegex = /\.btn-emulator-launch\s*\{[\s\S]*?\.btn-emulator-launch:hover\s*\{[\s\S]*?\n\}/;
    if (emulatorOverrideRegex.test(css)) {
        css = css.replace(emulatorOverrideRegex, `/* .btn-emulator-launch styled uniformly above */`);
    }

    // 10. Add Reduced Motion & Keyboard Accessibility at the end if not present
    if (!css.includes('prefers-reduced-motion: reduce')) {
        css += `\n\n/* Accessibility & Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
    .btn-launch-arrow,
    .btn-primary-launch:hover .btn-launch-arrow,
    .mode-card:hover {
        transform: none !important;
    }
}
`;
    }

    fs.writeFileSync(filePath, css, 'utf8');
    console.log('Successfully updated CSS in:', filePath);
}

refineCss(path.join(__dirname, '..', 'docs', 'css', 'style.css'));
refineCss(path.join(__dirname, '..', 'src', 'main', 'resources', 'static', 'css', 'style.css'));
