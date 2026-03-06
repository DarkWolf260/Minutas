/*
 * Service Worker - Minutas (Manual Implementation)
 */

const CACHE_NAME = 'minutas-assets-v4';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
    '/',
    OFFLINE_URL,
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

// Listener for skipWaiting command
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Stale-While-Revalidate (SWR) strategy
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

    // Skip chrome-extension and other non-http schemes
    if (!url.protocol.startsWith('http')) return;

    // CRITICAL for Development/Next.js:
    // Do NOT cache Next.js internal files (_next/static) or HMR updates in development
    // Do NOT cache API calls (especially health checks)
    if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/') || url.pathname.includes('hot-update')) {
        if (isDev) console.log(`[SW] Bypassing cache for: ${url.pathname}`);
        return; // Let the browser handle these via network directly
    }

    if (isDev) console.log(`[SW] Handling fetch for: ${url.pathname}`);

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate' && !cachedResponse) {
                            return caches.match(OFFLINE_URL);
                        }
                        return cachedResponse;
                    });

                return cachedResponse || fetchPromise;
            });
        })
    );
});
