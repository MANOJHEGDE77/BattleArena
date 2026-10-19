/**
 * Verification Script for Cyber Battle Arena 2.0 - Gameplay Flaw Fixes & PvP Combat Emulator
 */

const fs = require('fs');
const path = require('path');

const srcHtml = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/index.html'), 'utf8');
const docsHtml = fs.readFileSync(path.join(__dirname, 'docs/index.html'), 'utf8');
const srcCss = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/css/style.css'), 'utf8');
const docsCss = fs.readFileSync(path.join(__dirname, 'docs/css/style.css'), 'utf8');
const srcJs = fs.readFileSync(path.join(__dirname, 'src/main/resources/static/js/game.js'), 'utf8');
const docsJs = fs.readFileSync(path.join(__dirname, 'docs/js/game.js'), 'utf8');

const tests = [
    {
        name: 'DOM: PvP Emulator Modal & Triggers (#pvpEmulatorModal, #navTabEmulator, #heroOpenEmulatorBtn)',
        check: () => {
            const requiredIds = [
                'pvpEmulatorModal',
                'closeEmulatorModalBtn',
                'pvpEmulatorForm',
                'emulatorMapGrid',
                'emulatorSelectedMap',
                'emulatorHeroClass',
                'emulatorModeSelect',
                'emulatorDifficultySelect',
                'emulatorBotCount',
                'emulatorTargetScore',
                'startEmulatorSubmitBtn',
                'quickApexDuelBtn',
                'navTabEmulator',
                'heroOpenEmulatorBtn',
                'hudAbilityBar',
                'classAbilityCard',
                'abilityCooldownFill',
                'abilityIcon',
                'abilityName',
                'hudEmulatorIndicator',
                'emulatorQuickRestartBtn',
                'emulatorQuickConfigBtn'
            ];
            for (const id of requiredIds) {
                if (!srcHtml.includes(`id="${id}"`)) throw new Error(`Missing ${id} in src index.html`);
                if (!docsHtml.includes(`id="${id}"`)) throw new Error(`Missing ${id} in docs index.html`);
            }
            return true;
        }
    },
    {
        name: 'CSS: Emulator Modal, Ability Bar & Tactical Indicators Styling',
        check: () => {
            const requiredClasses = [
                '.modal-emulator-card',
                '.emulator-map-grid',
                '.emulator-map-card',
                '.hud-ability-bar',
                '.ability-card',
                '.ability-cooldown-fill',
                '.hud-emulator-indicator'
            ];
            for (const cls of requiredClasses) {
                if (!srcCss.includes(cls)) throw new Error(`Missing ${cls} in src style.css`);
                if (!docsCss.includes(cls)) throw new Error(`Missing ${cls} in docs style.css`);
            }
            return true;
        }
    },
    {
        name: 'JS Engine: Dynamic Weapon Barrel & Chassis Aim Heading Rotation',
        check: () => {
            // Verify renderRemotePlayers rotates by rp.heading
            if (!srcJs.includes('ctx.rotate(rp.heading || 0);')) {
                throw new Error('renderRemotePlayers does not rotate by rp.heading');
            }
            // Verify renderPlayer rotates by player.heading
            if (!srcJs.includes('ctx.rotate(player.heading || 0);')) {
                throw new Error('renderPlayer does not rotate by player.heading');
            }
            return true;
        }
    },
    {
        name: 'JS Engine: Stationary Aim Heading Tracking & Pointerdown Continuous Firing',
        check: () => {
            if (!srcJs.includes('isPointerDown')) {
                throw new Error('isPointerDown flag missing');
            }
            if (!srcJs.includes('lastAimX !== null && lastAimY !== null') || !srcJs.includes('player.heading = Math.atan2(lastAimY - player.y, lastAimX - player.x)')) {
                throw new Error('Heading calculation not updated properly');
            }
            return true;
        }
    },
    {
        name: 'JS Engine: Hero Tactical Abilities Architecture (Assault, Juggernaut, Scout, Sniper)',
        check: () => {
            if (!srcJs.includes('HERO_ABILITIES') || !srcJs.includes('triggerClassAbility') || !srcJs.includes('updateAbilityHud')) {
                throw new Error('HERO_ABILITIES or ability handlers missing');
            }
            if (!srcJs.includes('OVERCHARGE STIM') || !srcJs.includes('KINETIC SHOCKWAVE') || !srcJs.includes('PHASE BLINK DASH') || !srcJs.includes('PIERCING RAIL BEAM')) {
                throw new Error('Missing class hero ability definitions');
            }
            if (!srcJs.includes('playAbilityStim') || !srcJs.includes('playAbilityShockwave') || !srcJs.includes('playAbilityBlink') || !srcJs.includes('playAbilityRailBeam')) {
                throw new Error('Missing synthetic audio methods for hero abilities');
            }
            return true;
        }
    },
    {
        name: 'JS Engine: Tactical Radar / Minimap & Piercing Rail Beams in GameLoop',
        check: () => {
            if (!srcJs.includes('function renderTacticalRadar()') || !srcJs.includes('renderTacticalRadar();')) {
                throw new Error('Tactical radar missing or not called in game loop');
            }
            if (!srcJs.includes('function renderRailBeams') || !srcJs.includes('renderRailBeams(dt);')) {
                throw new Error('Rail beams missing or not called in game loop');
            }
            return true;
        }
    },
    {
        name: 'JS Engine: PvP Combat Emulator Engine (AI Bots, Maps, Ballistics, Collisions, Victory)',
        check: () => {
            if (!srcJs.includes('class PvPEmulatorEngine') || !srcJs.includes('const pvpEmulator = new PvPEmulatorEngine();')) {
                throw new Error('PvPEmulatorEngine class or instance missing');
            }
            const methods = ['start', 'stop', 'buildMap', 'seedBots', 'seedCoins', 'handlePlayerAttack', 'handleBotAttack', 'handleShockwave', 'handleRailBeam', 'update', 'checkGameOver', 'showEmulatorGameOver'];
            for (const m of methods) {
                if (!srcJs.includes(m)) throw new Error(`Method ${m} missing in PvPEmulatorEngine`);
            }
            return true;
        }
    },
    {
        name: 'JS Engine: Code Syntax Integrity (node --check on game.js)',
        check: () => {
            const { execSync } = require('child_process');
            execSync('node --check src/main/resources/static/js/game.js');
            execSync('node --check docs/js/game.js');
            return true;
        }
    }
];

console.log('===============================================================');
console.log(' CYBER BATTLE ARENA 2.0 - GAMEPLAY & PVP EMULATOR VERIFICATION');
console.log('===============================================================\n');

let passed = 0;
for (const t of tests) {
    process.stdout.write(`Testing: ${t.name}... `);
    try {
        t.check();
        console.log('✅ PASSED');
        passed++;
    } catch (e) {
        console.log(`❌ FAILED: ${e.message}`);
    }
}

console.log('\n===============================================================');
console.log(`Total Tests: ${tests.length} | Passed: ${passed} | Failed: ${tests.length - passed}`);
console.log('===============================================================');

if (passed === tests.length) {
    process.exit(0);
} else {
    process.exit(1);
}
