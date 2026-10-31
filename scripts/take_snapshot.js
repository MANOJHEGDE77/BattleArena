const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const PORT = 4610;
const CHROME_DEBUG_PORT = 9270;
const DOCS_DIR = path.join(__dirname, '..', 'docs');

const mimeTypes = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
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

        await send('Page.enable');
        await sleep(1500);

        const snap = await send('Page.captureScreenshot', { format: 'png' });
        const outPath = path.join(DOCS_DIR, 'assets', 'current_ui_snap.png');
        fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
        console.log('SNAPSHOT_SAVED_OK');
        ws.close();
    } catch (e) {
        console.error('Snapshot error:', e);
    } finally {
        proc.kill();
        server.close();
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        process.exit(0);
    }
});

