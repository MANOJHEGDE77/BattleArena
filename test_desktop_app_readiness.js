const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('===============================================================');
console.log(' CYBER BATTLE ARENA - DESKTOP & PWA APP READINESS VERIFICATION');
console.log('===============================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASSED: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAILED: ${message}`);
        failed++;
    }
}

// 1. Manifest
['docs/manifest.json', 'src/main/resources/static/manifest.json'].forEach(file => {
    const p = path.join(__dirname, file);
    assert(fs.existsSync(p), `${file} exists`);
    const json = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert(json.display === 'standalone', `${file} has display: standalone`);
    assert(json.icons && json.icons.length >= 3, `${file} has required app icons`);
    assert(json.orientation === 'landscape', `${file} specifies landscape orientation`);
});

// 2. Service Worker
['docs/sw.js', 'src/main/resources/static/sw.js'].forEach(file => {
    const p = path.join(__dirname, file);
    assert(fs.existsSync(p), `${file} exists`);
    const content = fs.readFileSync(p, 'utf8');
    assert(content.includes('caches.open'), `${file} implements caching`);
    assert(content.includes('fetch'), `${file} implements offline fetch interception`);
});

// 3. Icons
['docs/assets', 'src/main/resources/static/assets'].forEach(dir => {
    assert(fs.existsSync(path.join(__dirname, dir, 'app-icon.svg')), `${dir}/app-icon.svg exists`);
    assert(fs.existsSync(path.join(__dirname, dir, 'icon-192.png')), `${dir}/icon-192.png exists`);
    assert(fs.existsSync(path.join(__dirname, dir, 'icon-512.png')), `${dir}/icon-512.png exists`);
    assert(fs.existsSync(path.join(__dirname, dir, 'icon-maskable.png')), `${dir}/icon-maskable.png exists`);
});

// 4. HTML Integration
['docs/index.html', 'src/main/resources/static/index.html'].forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert(content.includes('manifest.json'), `${file} links manifest.json`);
    assert(content.includes('id="installAppBtn"'), `${file} has installAppBtn in topbar`);
    assert(content.includes('id="settingsInstallAppBtn"'), `${file} has settingsInstallAppBtn in settings modal`);
    assert(content.includes('mobile-web-app-capable'), `${file} has mobile & standalone meta tags`);
});

// 5. CSS Integration
['docs/css/style.css', 'src/main/resources/static/css/style.css'].forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert(content.includes('.btn-install-app'), `${file} includes .btn-install-app styles`);
    assert(content.includes('display-mode: standalone'), `${file} includes standalone app media queries`);
});

// 6. JS Controller Integration
['docs/js/game.js', 'src/main/resources/static/js/game.js'].forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert(content.includes('serviceWorker.register'), `${file} registers serviceWorker`);
    assert(content.includes('beforeinstallprompt'), `${file} captures beforeinstallprompt`);
    assert(content.includes('deferredInstallPrompt'), `${file} handles deferred install prompt`);
    assert(content.includes('display-mode: standalone'), `${file} checks standalone app mode`);
});

// 7. Desktop Launchers
assert(fs.existsSync(path.join(__dirname, 'CyberArena.bat')), 'CyberArena.bat one-click Windows launcher exists');
const batContent = fs.readFileSync(path.join(__dirname, 'CyberArena.bat'), 'utf8');
assert(batContent.includes('--app='), 'CyberArena.bat uses standalone --app window mode');
assert(batContent.includes('--enable-gpu-rasterization'), 'CyberArena.bat specifies 60 FPS GPU acceleration flags');

assert(fs.existsSync(path.join(__dirname, 'scripts', 'launch_desktop_app.js')), 'scripts/launch_desktop_app.js exists');
try {
    execSync('node --check scripts/launch_desktop_app.js');
    assert(true, 'scripts/launch_desktop_app.js syntax is valid');
} catch (e) {
    assert(false, 'scripts/launch_desktop_app.js syntax is valid');
}

assert(fs.existsSync(path.join(__dirname, 'package.json')), 'package.json exists');
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
assert(pkg.scripts && pkg.scripts.app, 'package.json defines "app" script for lightweight desktop launch');

console.log('===============================================================');
console.log(`TOTAL APP CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('===============================================================');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 ALL DESKTOP & PWA APP READINESS CHECKS PASSED!');
}
