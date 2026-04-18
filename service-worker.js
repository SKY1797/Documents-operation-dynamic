const CACHE_NAME = 'ops-portal-v1';

// The core files needed to load the UI instantly
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const isApiCall = event.request.url.includes('script.google.com');

    if (isApiCall) {
        // 1. DATA STRATEGY (Network First): 
        // Always try to get the freshest folder data from Google Drive.
        // If the network fails (offline), fall back to the cached folder list.
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // 2. UI STRATEGY (Stale-While-Revalidate):
        // Serve HTML/CSS/JS instantly from cache, then update the cache in the background.
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchPromise;
            })
        );
    }
});