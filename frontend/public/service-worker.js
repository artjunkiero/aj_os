/* ART JUNKIE OS - simple offline shell service worker */
const CACHE = 'aj-os-v1';
const CORE = ['/', '/manifest.json', '/logo192.svg', '/logo512.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return; // never cache API
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => caches.match('/')))
  );
});
