<<<<<<< Updated upstream
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW зареєстровано!', reg))
            .catch(err => console.log('Помилка:', err));
    });
}

window.addEventListener('online', () => document.getElementById('offline').style.display = 'none');
window.addEventListener('offline', () => document.getElementById('offline').style.display = 'block');

fetch('/api/menu.json')
    .then(res => res.json())
    .then(menu => {
        const ul = document.createElement('ul');
        menu.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} - ${item.price} ₴`;
            ul.appendChild(li);
        });
        document.querySelector('main').appendChild(ul);
    });

async function updateSW() {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return alert('Немає SW');
    reg.update();
    reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('Нова версія! Оновити?')) {
                    newSW.postMessage({ action: 'skipWaiting' });
                }
            }
        });
    });
}

navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());

async function placeOrder() {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
        await reg.sync.register('send-order');
        alert('Замовлення в черзі! Відправиться автоматично.');
    } else {
        alert('Sync не підтримується');
    }
}

navigator.serviceWorker.addEventListener('message', event => {
    alert(event.data);
=======
// Завдання 2: Константи та подія install
const CACHE_NAME = 'coffee-v1';
const DYNAMIC_CACHE = 'coffee-dynamic-v1';
const FILES_TO_CACHE = [
    '/', 
    '/index.html', 
    '/style.css', 
    '/app.js', 
    '/coffee.jpg', 
    '/manifest.json', 
    '/offline.html'
];

self.addEventListener('install', event => {
    console.log('SW: install');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Кешуємо файли');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Завдання 2: Подія activate
self.addEventListener('activate', event => {
    console.log('SW: activate');
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                .map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

// Завдання 5: Обробка повідомлень для skipWaiting
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Завдання 7: Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'send-order') {
        event.waitUntil(
            fetch('/api/send-order', { 
                method: 'POST', 
                body: JSON.stringify({ item: 'Лате' }) 
            })
                .then(() => self.clients.matchAll()
                    .then(clients => clients.forEach(client => 
                        client.postMessage('Замовлення відправлено!')
                    ))
                )
                .catch(err => console.log('Помилка sync:', err))
        );
    }
});

// Завдання 3, 4, 6: Обробка fetch подій
self.addEventListener('fetch', event => {
    // Завдання 6: Network First для API
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(res => {
                    const clone = res.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => cache.put(event.request, clone));
                    return res;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Завдання 3: Cache First для статичних файлів
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                console.log('З кешу:', event.request.url);
                return cached;
            }
            
            return fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Завдання 4: Обробка офлайн для HTML
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                    return new Response('Офлайн, ресурс не доступний', { 
                        headers: {'Content-Type': 'text/plain'} 
                    });
                });
        })
    );
>>>>>>> Stashed changes
});