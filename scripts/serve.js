const http = require('http');
const fs = require('fs');
const path = require('path');

const CANDIDATE_PORTS = [process.env.PORT ? parseInt(process.env.PORT) : 4321, 4567, 7777, 8000, 3333, 0];
const DOCS_DIR = path.join(__dirname, '..', 'docs');

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

function createServer() {
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

function startServer(candidates) {
    if (!candidates.length) {
        console.error('❌ Could not bind to any port.');
        process.exit(1);
    }
    const port = candidates[0];
    const server = createServer();

    server.once('error', (err) => {
        console.warn(`[Port ${port} unavailable (${err.code}), trying next safe port...]`);
        startServer(candidates.slice(1));
    });

    server.listen(port, '0.0.0.0', () => {
        const actualPort = server.address().port;
        console.log(`🎮 Cyber Battle Arena is live on: http://localhost:${actualPort}`);
    });
}

startServer(CANDIDATE_PORTS);
