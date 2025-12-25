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
});