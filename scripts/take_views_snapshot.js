const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const PORT = 4630;
const CHROME_DEBUG_PORT = 9290;
const DOCS_DIR = path.join(__dirname, '..', 'docs');

const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json',
    '.png': 'image/png'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(DOCS_DIR, reqPath);
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', async () => {
    const tmpDir = path.join(os.tmpdir(), 'chrome_snap_' + Date.now());
    fs.mkdirSync(tmpDir, { recursive: true });
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const proc = spawn(chromePath, [
        '--headless=new',
        '--remote-debugging-port=' + CHROME_DEBUG_PORT,
        '--user-data-dir=' + tmpDir,
        '--window-size=1440,900',
        '--disable-gpu',
        'http://127.0.0.1:' + PORT + '/index.html'
    ]);

    const sleep = ms => new Promise(r => setTimeout(r, ms));
    await sleep(2500);

    try {
        const res = await fetch('http://localhost:' + CHROME_DEBUG_PORT + '/json/list');
        const list = await res.json();
        const page = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl) || list[0];
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise(r => ws.onopen = r);

        let msgId = 1;
        function send(method, params = {}) {
            return new Promise(resolve => {
                const id = msgId++;
                const h = e => {
                    const d = JSON.parse(e.data);
                    if (d.id === id) { ws.removeEventListener('message', h); resolve(d.result); }
                };
                ws.addEventListener('message', h);
                ws.send(JSON.stringify({ id, method, params }));
            });
        }

        await send('Runtime.enable');
        await send('Page.enable');
        await sleep(1500);

        // 0. Initial Play view
        let snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_play.png'), Buffer.from(snap.data, 'base64'));

        // 1. Switch to operators and take snapshot
        await send('Runtime.evaluate', { expression: 'switchView("operators")' });
        await sleep(600);
        snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_operators.png'), Buffer.from(snap.data, 'base64'));

        // 2. Switch to career and take snapshot
        await send('Runtime.evaluate', { expression: 'switchView("career")' });
        await sleep(600);
        snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_career.png'), Buffer.from(snap.data, 'base64'));

        // 3. Switch to ranks (leaderboard) and take snapshot
        await send('Runtime.evaluate', { expression: 'switchView("leaderboard")' });
        await sleep(600);
        snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_leaderboard.png'), Buffer.from(snap.data, 'base64'));

        // 4. Switch to arenas and take snapshot
        await send('Runtime.evaluate', { expression: 'switchView("arenas")' });
        await sleep(600);
        snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_arenas.png'), Buffer.from(snap.data, 'base64'));

        // 5. Open PvP Emulator modal and take snapshot
        await send('Runtime.evaluate', { expression: 'openPvPEmulatorModal()' });
        await sleep(600);
        snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_emulator.png'), Buffer.from(snap.data, 'base64'));

        // 6. Launch match to capture live combat HUD
        await send('Runtime.evaluate', { expression: 'document.getElementById("startEmulatorSubmitBtn")?.click()' });
        await sleep(1500);
        snap = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(DOCS_DIR, 'assets', 'snap_combat.png'), Buffer.from(snap.data, 'base64'));

        console.log('SUCCESS_ALL_SEVEN_VIEWS');
        ws.close();
    } catch (e) {
        console.error(e);
    } finally {
        proc.kill();
        server.close();
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        process.exit(0);
    }
});
