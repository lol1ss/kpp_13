const CACHE_NAME = 'coffee-v2';
const DYNAMIC_CACHE = 'coffee-dynamic-v1';
const FILES_TO_CACHE = ['/', '/index.html', '/style.css', '/app.js', '/coffee.jpg', '/manifest.json', '/offline.html'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
    );
    self.clients.claim();
});

self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).then(res => {
                const clone = res.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
                return res;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/offline.html');
                }
                return new Response('Офлайн, ресурс не доступний', { headers: {'Content-Type': 'text/plain'} });
            });
        })
    );
});

self.addEventListener('sync', event => {
    if (event.tag === 'send-order') {
        event.waitUntil(
            fetch('/api/send-order', { method: 'POST', body: JSON.stringify({ item: 'Лате' }) })
                .then(() => self.clients.matchAll().then(clients => clients.forEach(client => client.postMessage('Замовлення відправлено!'))))
                .catch(err => console.log('Помилка sync:', err))
        );
    }
});