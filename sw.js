// ESEP Sklad — Service Worker v1.0
const CACHE = 'esep-v1';
const OFFLINE_URL = './index.html';

// Ресурсы для предкэширования
const PRECACHE = [
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap',
];

// Домены, которые НИКОГДА не кэшируем (API, auth)
const BYPASS = [
  'supabase.co',
  'telegram.org',
  'fonts.gstatic.com',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(PRECACHE.map((url) => c.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Пропускаем non-GET и API-запросы напрямую
  if (e.request.method !== 'GET') return;
  if (BYPASS.some((d) => url.hostname.includes(d))) return;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

  // Network-first для HTML, cache-first для ассетов
  const isHTML = e.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/';

  if (isHTML) {
    // Network-first: свежая версия, при офлайне — кэш
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(e.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
  } else {
    // Cache-first для шрифтов и статики
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok && res.type !== 'opaque') {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, clone));
          }
          return res;
        });
      })
    );
  }
});
