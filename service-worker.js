const CACHE_NAME = 'ops-portal-v2';

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

  // UNIVERSAL STALE-WHILE-REVALIDATE STRATEGY
  // This serves EVERYTHING (UI and Google Data) instantly from the cache, 
  // then fetches the newest version in the background for the next time.
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
            // Only cache valid responses
            if (networkResponse.ok || networkResponse.type === 'opaque') {
                cache.put(event.request, networkResponse.clone());
            }
        });
        return networkResponse;
      }).catch(() => null); // Fail silently if offline

      // Return the instant cached version if we have it, otherwise wait for the network
      return cachedResponse || fetchPromise;
    })
  );
});
