/**
 * Generates official high-resolution social preview banner assets
 * Output: social-preview.svg and 1200x630 social-preview.png
 * Pure Node.js with built-in zlib (zero dependencies)
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories exist
['docs/assets', 'src/main/resources/static/assets'].forEach(dir => {
    const full = path.join(__dirname, '..', dir);
    if (!fs.existsSync(full)) {
        fs.mkdirSync(full, { recursive: true });
    }
});

// 1. Generate Rich SVG Banner (1200 x 630)
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0e172a" />
      <stop offset="60%" stop-color="#06080f" />
      <stop offset="100%" stop-color="#020408" />
    </radialGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe" />
      <stop offset="100%" stop-color="#4facfe" />
    </linearGradient>
    <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>
    <filter id="neonCyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="neonRed" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Layer -->
  <rect width="1200" height="630" fill="url(#bgGlow)" />

  <!-- Cyber Grid Lines -->
  <g stroke="rgba(0, 242, 254, 0.08)" stroke-width="1.5">
    <line x1="0" y1="90" x2="1200" y2="90" />
    <line x1="0" y1="180" x2="1200" y2="180" />
    <line x1="0" y1="270" x2="1200" y2="270" />
    <line x1="0" y1="360" x2="1200" y2="360" />
    <line x1="0" y1="450" x2="1200" y2="450" />
    <line x1="0" y1="540" x2="1200" y2="540" />

    <line x1="150" y1="0" x2="150" y2="630" />
    <line x1="300" y1="0" x2="300" y2="630" />
    <line x1="450" y1="0" x2="450" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="750" y1="0" x2="750" y2="630" />
    <line x1="900" y1="0" x2="900" y2="630" />
    <line x1="1050" y1="0" x2="1050" y2="630" />
  </g>

  <!-- Outer Neon Border Frame -->
  <rect x="25" y="25" width="1150" height="580" rx="16" fill="none" stroke="rgba(0, 242, 254, 0.35)" stroke-width="2" />
  <rect x="35" y="35" width="1130" height="560" rx="12" fill="none" stroke="rgba(244, 63, 94, 0.2)" stroke-width="1" stroke-dasharray="16 8" />

  <!-- Corner Brackets -->
  <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="#00f2fe" stroke-width="4" />
  <path d="M 1160 70 L 1160 40 L 1130 40" fill="none" stroke="#00f2fe" stroke-width="4" />
  <path d="M 40 560 L 40 590 L 70 590" fill="none" stroke="#00f2fe" stroke-width="4" />
  <path d="M 1160 560 L 1160 590 L 1130 590" fill="none" stroke="#00f2fe" stroke-width="4" />

  <!-- Center Combat Insignia -->
  <g transform="translate(600, 195)" filter="url(#neonCyan)">
    <!-- Outer Hex Shield -->
    <polygon points="0,-90 78,-45 78,45 0,90 -78,45 -78,-45" fill="rgba(0, 242, 254, 0.06)" stroke="#00f2fe" stroke-width="4" />
    <!-- Inner Crimson Tactical Core -->
    <polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" fill="rgba(244, 63, 94, 0.12)" stroke="#f43f5e" stroke-width="3" stroke-dasharray="10 5" />
    <!-- Central Energy Core -->
    <circle cx="0" cy="0" r="16" fill="#00f2fe" />
    <circle cx="0" cy="0" r="28" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.6" />
    <!-- Ballistic Crosshair Reticle -->
    <line x1="-120" y1="0" x2="-85" y2="0" stroke="#00f2fe" stroke-width="2" />
    <line x1="85" y1="0" x2="120" y2="0" stroke="#00f2fe" stroke-width="2" />
    <line x1="0" y1="-120" x2="0" y2="-95" stroke="#00f2fe" stroke-width="2" />
    <line x1="0" y1="95" x2="0" y2="120" stroke="#00f2fe" stroke-width="2" />
  </g>

  <!-- Title Typography -->
  <text x="600" y="340" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="52" fill="#f8fafc" letter-spacing="8">
    CYBER BATTLE ARENA
  </text>
  <text x="600" y="385" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="700" font-size="20" fill="#00f2fe" letter-spacing="6">
    AUTHORITATIVE TACTICAL MULTIPLAYER 2D COMBAT
  </text>

  <!-- Tagline -->
  <text x="600" y="430" text-anchor="middle" font-family="'Outfit', sans-serif" font-weight="400" font-size="18" fill="#94a3b8" letter-spacing="1.5">
    Deploy into high-velocity arena warfare • Select 4 warrior classes • 60 FPS Browser Engine • Zero Installs
  </text>

  <!-- Tactical Feature Badges Tray -->
  <g transform="translate(600, 500)">
    <!-- Badge 1: 60 FPS -->
    <g transform="translate(-360, 0)">
      <rect x="-85" y="-18" width="170" height="36" rx="18" fill="rgba(0, 242, 254, 0.1)" stroke="#00f2fe" stroke-width="1.5" />
      <text x="0" y="5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#00f2fe">⚡ 60 FPS LERP</text>
    </g>
    <!-- Badge 2: 4 Classes -->
    <g transform="translate(-120, 0)">
      <rect x="-85" y="-18" width="170" height="36" rx="18" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" stroke-width="1.5" />
      <text x="0" y="5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#c084fc">🛡️ 4 OPERATORS</text>
    </g>
    <!-- Badge 3: Bot AI -->
    <g transform="translate(120, 0)">
      <rect x="-85" y="-18" width="170" height="36" rx="18" fill="rgba(244, 63, 94, 0.1)" stroke="#f43f5e" stroke-width="1.5" />
      <text x="0" y="5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#fb7185">🤖 COMBAT AI BOTS</text>
    </g>
    <!-- Badge 4: Vercel Ready -->
    <g transform="translate(360, 0)">
      <rect x="-85" y="-18" width="170" height="36" rx="18" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" stroke-width="1.5" />
      <text x="0" y="5" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#34d399">▲ VERCEL READY</text>
    </g>
  </g>

  <!-- Web Audio Synth & Authoritative Note in Footer -->
  <text x="600" y="565" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="12" fill="#64748b" letter-spacing="2">
    PROCEDURAL WEB AUDIO SYNTHESIZER • MULTI-MAP HAZARDS • PVP &amp; SOLO DOJO
  </text>
</svg>`;

// Write SVG files
['docs/assets/social-preview.svg', 'src/main/resources/static/assets/social-preview.svg'].forEach(rel => {
    fs.writeFileSync(path.join(__dirname, '..', rel), svgContent, 'utf8');
});

// 2. Pure Node.js PNG encoder (creates valid 1200x630 PNG)
function createPngBuffer(width, height) {
    // Generate RGBA pixel buffer
    // Line byte length: 1 filter byte + width * 4 bytes
    const rowBytes = 1 + width * 4;
    const rawData = Buffer.alloc(rowBytes * height);

    for (let y = 0; y < height; y++) {
        const rowOffset = y * rowBytes;
        rawData[rowOffset] = 0; // Filter type: None

        const dy = y / height;
        for (let x = 0; x < width; x++) {
            const dx = x / width;
            const pxOffset = rowOffset + 1 + x * 4;

            // Radial gradient dark void with cyan center ambient
            const cx = (x - width / 2) / (width / 2);
            const cy = (y - height / 2) / (height / 2);
            const dist = Math.sqrt(cx * cx + cy * cy);

            let r = Math.max(6, Math.round(14 - dist * 8));
            let g = Math.max(8, Math.round(20 - dist * 10));
            let b = Math.max(16, Math.round(36 - dist * 18));

            // Grid lines every 60px
            if (x % 60 === 0 || y % 60 === 0) {
                r += 6;
                g += 20;
                b += 28;
            }

            // Outer border frame
            if (x >= 20 && x <= width - 20 && y >= 20 && y <= height - 20) {
                if (x === 20 || x === width - 20 || y === 20 || y === height - 20) {
                    r = 0; g = 242; b = 254; // Bright cyan
                }
            }

            // Center glow core
            if (dist < 0.28) {
                const coreFactor = 1 - dist / 0.28;
                r = Math.min(255, Math.round(r + 30 * coreFactor));
                g = Math.min(255, Math.round(g + 160 * coreFactor));
                b = Math.min(255, Math.round(b + 220 * coreFactor));
            }

            rawData[pxOffset] = r;
            rawData[pxOffset + 1] = g;
            rawData[pxOffset + 2] = b;
            rawData[pxOffset + 3] = 255; // Alpha
        }
    }

    const compressed = zlib.deflateSync(rawData, { level: 8 });

    // CRC32 calculation table
    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[i] = c;
    }

    function crc32(buf, offset, len) {
        let crc = 0xFFFFFFFF;
        for (let i = offset; i < offset + len; i++) {
            crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function makeChunk(type, data) {
        const len = data.length;
        const buf = Buffer.alloc(12 + len);
        buf.writeUInt32BE(len, 0);
        buf.write(type, 4, 4, 'ascii');
        data.copy(buf, 8);
        const crcVal = crc32(buf, 4, 4 + len);
        buf.writeUInt32BE(crcVal, 8 + len);
        return buf;
    }

    // 1. Signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // 2. IHDR Chunk (13 bytes)
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // Bit depth
    ihdrData[9] = 6; // Color type: RGBA
    ihdrData[10] = 0; // Compression: Deflate
    ihdrData[11] = 0; // Filter: Adaptive
    ihdrData[12] = 0; // Interlace: None
    const ihdrChunk = makeChunk('IHDR', ihdrData);

    // 3. IDAT Chunk
    const idatChunk = makeChunk('IDAT', compressed);

    // 4. IEND Chunk
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuf = createPngBuffer(1200, 630);
['docs/assets/social-preview.png', 'src/main/resources/static/assets/social-preview.png'].forEach(rel => {
    fs.writeFileSync(path.join(__dirname, '..', rel), pngBuf);
});

console.log('✅ Generated social-preview.svg and social-preview.png in docs/assets and static/assets!');
