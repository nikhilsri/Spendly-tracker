const CACHE_NAME = 'spendly-v2';
const FILES = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install - cache files and activate immediately
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES))
            .then(() => self.skipWaiting()) // Activate immediately
    );
});

// Activate - clean up old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch - Network first for HTML, cache first for assets
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    
    // For HTML files - try network first, fall back to cache
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    // Cache the fresh version
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }
    
    // For other assets - cache first, fall back to network
    e.respondWith(
        caches.match(e.request).then(res => {
            if (res) return res;
            return fetch(e.request).then(response => {
                // Cache new assets
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return response;
            });
        })
    );
});
