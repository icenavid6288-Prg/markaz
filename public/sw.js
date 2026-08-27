const CACHE_NAME = 'markaz-static-v4';
const STATIC_ASSETS = [
    '/manifest.webmanifest',
    '/images/pwa-icon.svg',
    '/images/brand-logo.png',
    '/offline.html',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        )),
    );
    self.clients.claim();
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch (_) { payload = { body: event.data?.text() }; }
    const title = payload.title || 'مرکز رشد و کارآفرینی دکتر بیدی';
    const options = {
        body: payload.body || payload.message || 'یک اعلان جدید برای شما دارید.',
        icon: '/app-icon',
        badge: '/app-icon',
        dir: 'rtl',
        lang: 'fa-IR',
        tag: payload.tag || 'markaz-notification',
        data: { url: payload.url || '/dashboard' },
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href;
    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
        const existing = windows.find((client) => client.url.startsWith(self.location.origin));
        return existing ? existing.focus().then(() => existing.navigate(target)) : clients.openWindow(target);
    }));
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    // Never cache authenticated panels, API responses, or Inertia data.
    const isPrivate = url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/api');
    if (isPrivate) {
        if (request.mode === 'navigate') {
            event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
        }
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
        return;
    }

    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/images/') || url.pathname === '/manifest.webmanifest' || url.pathname === '/app-manifest.webmanifest' || url.pathname === '/offline.html') {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return response;
            })),
        );
    }
});
