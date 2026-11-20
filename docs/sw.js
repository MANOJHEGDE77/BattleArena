/**
 * CYBER BATTLE ARENA - ULTRA-LIGHTWEIGHT SERVICE WORKER
 * Provides instant app booting, cache-first offline support for Solo Dojo & Emulator,
 * and seamless background asset synchronization.
 */
const CACHE_NAME = 'cyber-arena-v2.0.1';
const CORE_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/game.js',
    './manifest.json',
    './assets/app-icon.svg',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/icon-maskable.png',
    './assets/mode_ffa_bg.svg',
    './assets/mode_duel_bg.svg',
    './assets/mode_pve_bg.svg',
    './assets/mode_custom_bg.svg'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CORE_ASSETS).catch(err => {
                console.warn('[SW] Core asset caching warning:', err);
            });
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((k) => {
                    if (k !== CACHE_NAME) {
                        return caches.delete(k);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Bypass WebSockets and backend API calls
    if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.pathname.startsWith('/api') || url.pathname.startsWith('/auth') || url.pathname.startsWith('/rooms')) {
        return;
    }

    // Static assets: Cache-First with Network fallback
    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;
            return fetch(e.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return response;
            }).catch(() => {
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
