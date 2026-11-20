/**
 * Cross-platform Lightweight Desktop App Launcher for Cyber Arena
 * Works on Windows, macOS, and Linux
 * Usage: node scripts/launch_desktop_app.js (or "npm run app")
 */
const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');

const PORT = 3000;
const APP_URL = `http://localhost:${PORT}/index.html`;

function checkServerReady(cb) {
    const req = http.get(APP_URL, (res) => {
        if (res.statusCode === 200) cb(true);
        else cb(false);
    });
    req.on('error', () => cb(false));
    req.setTimeout(500, () => { req.destroy(); cb(false); });
}

function findBrowserBinary() {
    const platform = os.platform();
    if (platform === 'win32') {
        const edgePaths = [
            'msedge',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
        ];
        for (const p of edgePaths) {
            try {
                if (p === 'msedge') { execSync('where msedge', { stdio: 'ignore' }); return 'msedge'; }
                if (fs.existsSync(p)) return p;
            } catch {}
        }
        const chromePaths = [
            'chrome',
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];
        for (const p of chromePaths) {
            try {
                if (p === 'chrome') { execSync('where chrome', { stdio: 'ignore' }); return 'chrome'; }
                if (fs.existsSync(p)) return p;
            } catch {}
        }
    } else if (platform === 'darwin') {
        const paths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        ];
        for (const p of paths) {
            if (fs.existsSync(p)) return p;
        }
    } else {
        const paths = ['google-chrome', 'chromium-browser', 'chromium', 'microsoft-edge'];
        for (const p of paths) {
            try { execSync(`which ${p}`, { stdio: 'ignore' }); return p; } catch {}
        }
    }
    return null;
}

function launchAppWindow() {
    const browser = findBrowserBinary();
    const flags = [
        `--app=${APP_URL}`,
        '--window-size=1440,900',
        '--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--ignore-gpu-blocklist',
        '--disable-frame-rate-limit'
    ];

    console.log(`🎮 Launching Cyber Arena in native Standalone App mode...`);
    if (browser) {
        const proc = spawn(browser, flags, { detached: true, stdio: 'ignore' });
        proc.unref();
        console.log(`🚀 Standalone App running via: ${browser}`);
    } else {
        // Fallback open URL
        const openCmd = os.platform() === 'win32' ? 'start' : (os.platform() === 'darwin' ? 'open' : 'xdg-open');
        execSync(`${openCmd} ${APP_URL}`);
    }
}

// Check if server is running, if not start it
checkServerReady((isUp) => {
    if (!isUp) {
        console.log('[Server] Starting lightweight background game server on port 3000...');
        const srv = spawn('node', [path.join(__dirname, 'serve.js')], { detached: true, stdio: 'ignore' });
        srv.unref();
        setTimeout(launchAppWindow, 1200);
    } else {
        launchAppWindow();
    }
});
