/**
 * Test Suite: Vercel Deployment, Smooth Gameplay & Social Media Readiness Verification
 */
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
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

console.log('===============================================================');
console.log(' CYBER BATTLE ARENA - VERCEL, SMOOTH GAMEPLAY & SOCIAL TEST');
console.log('===============================================================\n');

// 1. Vercel Zero-Config
const vercelConfigPath = path.join(rootDir, 'vercel.json');
assert(fs.existsSync(vercelConfigPath), 'vercel.json exists in root directory');
if (fs.existsSync(vercelConfigPath)) {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert(config.outputDirectory === 'docs', 'vercel.json outputDirectory is configured to "docs"');
}

// 2. Root index.html redirect fallback
const rootHtmlPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(rootHtmlPath), 'Root index.html exists for static hosting fallbacks');
if (fs.existsSync(rootHtmlPath)) {
    const rootHtml = fs.readFileSync(rootHtmlPath, 'utf8');
    assert(rootHtml.includes('docs/index.html'), 'Root index.html redirects to docs/index.html');
}

// 3. Social Media Open Graph & Twitter Cards
const docsHtml = fs.readFileSync(path.join(rootDir, 'docs/index.html'), 'utf8');
const staticHtml = fs.readFileSync(path.join(rootDir, 'src/main/resources/static/index.html'), 'utf8');

[
    { name: 'docs/index.html', html: docsHtml },
    { name: 'static/index.html', html: staticHtml }
].forEach(({ name, html }) => {
    assert(html.includes('og:title') && html.includes('og:image'), `${name} has Open Graph meta tags`);
    assert(html.includes('twitter:card') && html.includes('twitter:image'), `${name} has Twitter summary_large_image card tags`);
    assert(html.includes('id="postToTwitterBtn"'), `${name} has Post to X (Twitter) share button`);
    assert(html.includes('id="shareToRedditBtn"'), `${name} has Share to Reddit button`);
    assert(html.includes('id="nativeShareBtn"'), `${name} has Native Share sheet button`);
    assert(html.includes('id="fullscreenToggleBtn"'), `${name} has Fullscreen toggle button`);
    assert(html.includes('id="topbarShareBtn"'), `${name} has Topbar quick share button`);
    assert(html.includes('id="multiKillBanner"'), `${name} has Multi-Kill Combo banner`);
    assert(html.includes('id="customBackendUrlInput"'), `${name} has Custom Backend Server URL setting`);
});

// 4. Social Preview Assets
['docs/assets', 'src/main/resources/static/assets'].forEach(dir => {
    const pngPath = path.join(rootDir, dir, 'social-preview.png');
    const svgPath = path.join(rootDir, dir, 'social-preview.svg');
    assert(fs.existsSync(pngPath) && fs.statSync(pngPath).size > 1000, `${dir}/social-preview.png exists and is non-empty`);
    assert(fs.existsSync(svgPath) && fs.statSync(svgPath).size > 500, `${dir}/social-preview.svg exists and is non-empty`);
});

// 5. CSS Styles
const docsCss = fs.readFileSync(path.join(rootDir, 'docs/css/style.css'), 'utf8');
assert(docsCss.includes('.multi-kill-banner'), 'CSS includes .multi-kill-banner styles');
assert(docsCss.includes('.status-dot.arcade'), 'CSS includes .status-dot.arcade pulse styles');
assert(docsCss.includes('.btn-social-share'), 'CSS includes .btn-social-share styling');
assert(docsCss.includes('.btn-twitter'), 'CSS includes .btn-twitter branding');
assert(docsCss.includes('.btn-reddit'), 'CSS includes .btn-reddit branding');

// 6. Game.js Engine Logic
const docsJs = fs.readFileSync(path.join(rootDir, 'docs/js/game.js'), 'utf8');
assert(docsJs.includes('isServerOnline'), 'Engine tracks isServerOnline state');
assert(docsJs.includes('ensureLocalArcadeProfile'), 'Engine includes ensureLocalArcadeProfile for instant Vercel play');
assert(docsJs.includes('renderLocalCareerProfile'), 'Engine renders offline/arcade career profile');
assert(docsJs.includes('renderArcadeLeaderboard'), 'Engine renders offline/arcade leaderboard');
assert(docsJs.includes('toggleFullscreenMode'), 'Engine includes toggleFullscreenMode handler');
assert(docsJs.includes('setupSocialAndDisplayEventListeners'), 'Engine wires up social share and display listeners');
assert(docsJs.includes('playerVx') && docsJs.includes('playerVy'), 'Engine has playerVx/playerVy smooth velocity dampening');

console.log('\n===============================================================');
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('===============================================================');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('🎉 ALL VERCEL, GAMEPLAY & SOCIAL SHARING FEATURES VERIFIED!');
}

