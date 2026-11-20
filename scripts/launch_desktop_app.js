/**
 * CYBER BATTLE ARENA - STANDALONE DESKTOP CLIENT LAUNCHER
 * - Embeds a dedicated high-performance local HTTP game engine
 * - Automatically avoids Windows reserved port exclusions
 * - Detects Edge, Chrome, or Brave native browser runtimes
 * - Launches in a borderless Standalone App Window (--app mode)
 * - Enables Direct3D hardware GPU acceleration
 * - Keeps the server alive while you play and shuts down cleanly on exit
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
// Safe ports outside Windows hyper-v / nat excluded ranges
const CANDIDATE_PORTS = [4321, 4567, 7777, 8000, 3333, 0];

const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
};

function createGameServer() {
    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
        const filePath = path.join(DOCS_DIR, reqPath);

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, {
                'Content-Type': mimeTypes[ext] || 'application/octet-stream',
                'Access-Control-Allow-Origin': '*'
            });
            fs.createReadStream(filePath).pipe(res);
        });
    });
}

function findBrowserPath() {
    const platform = os.platform();
    if (platform === 'win32') {
        const candidatePaths = [
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env.PROGRAMFILES || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
        ];

        for (const p of candidatePaths) {
            try {
                if (fs.existsSync(p)) return p;
            } catch {}
        }

        const bins = ['msedge', 'chrome', 'brave'];
        for (const bin of bins) {
            try {
                const out = execSync(`where ${bin}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim().split('\r\n')[0];
                if (out && fs.existsSync(out)) return out;
            } catch {}
        }
    } else if (platform === 'darwin') {
        const candidatePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) return p;
        }
    } else {
        const bins = ['google-chrome', 'chromium-browser', 'chromium', 'microsoft-edge', 'brave-browser'];
        for (const bin of bins) {
            try {
                const out = execSync(`which ${bin}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
                if (out && fs.existsSync(out)) return out;
            } catch {}
        }
    }
    return null;
}

function startAppWithCandidates(candidates) {
    if (!candidates.length) {
        console.error('❌ Could not bind game engine to any available port.');
        process.exit(1);
    }

    const port = candidates[0];
    const server = createGameServer();

    server.once('error', (err) => {
        // Port unavailable or excluded by Windows NAT/Hyper-V (EACCES/EADDRINUSE)
        startAppWithCandidates(candidates.slice(1));
    });

    server.listen(port, '127.0.0.1', () => {
        const actualPort = server.address().port;
        const appUrl = `http://127.0.0.1:${actualPort}/index.html`;

        console.log(`=====================================================================`);
        console.log(`         🎮 CYBER BATTLE ARENA - STANDALONE APP CLIENT`);
        console.log(`=====================================================================`);
        console.log(`[Engine] Local Game Server active: ${appUrl}`);

        const browserPath = findBrowserPath();
        const appFlags = [
            `--app=${appUrl}`,
            '--window-size=1440,900',
            '--enable-gpu-rasterization',
            '--enable-zero-copy',
            '--ignore-gpu-blocklist',
            '--disable-frame-rate-limit'
        ];

        if (browserPath) {
            console.log(`[Client] Launching standalone hardware-accelerated app window via:`);
            console.log(`         ${browserPath}`);
            console.log(`[Status] Game is running! Keep this window open while playing.`);
            console.log(`         (Closing this window will exit the game).`);
            console.log(`=====================================================================`);

            const browserProc = spawn(browserPath, appFlags, {
                stdio: 'ignore'
            });

            browserProc.on('exit', (code) => {
                console.log(`[Client] Game window closed (Exit code: ${code}). Stopping engine...`);
                server.close(() => {
                    process.exit(0);
                });
            });

            browserProc.on('error', (err) => {
                console.error(`[Error] Failed to spawn browser window:`, err);
                console.log(`[Fallback] Opening standard browser at ${appUrl}...`);
                const openCmd = os.platform() === 'win32' ? 'start' : (os.platform() === 'darwin' ? 'open' : 'xdg-open');
                execSync(`${openCmd} ${appUrl}`);
            });
        } else {
            console.log(`[Fallback] Opening in default web browser: ${appUrl}`);
            const openCmd = os.platform() === 'win32' ? 'start' : (os.platform() === 'darwin' ? 'open' : 'xdg-open');
            execSync(`${openCmd} ${appUrl}`);
            console.log(`[Status] Server is active at ${appUrl}. Press Ctrl+C to stop.`);
        }
    });

    process.on('SIGINT', () => {
        console.log('\n[Engine] Stopping game server...');
        server.close(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
        server.close(() => process.exit(0));
    });
}

startAppWithCandidates(CANDIDATE_PORTS);
