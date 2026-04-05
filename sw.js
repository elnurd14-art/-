/* ESEP Sklad — Service Worker
   Стратегия:
   - HTML/CSS/JS/иконки → Cache First (быстрый запуск офлайн)
   - Supabase API → Network First с fallback на кеш
   - Шрифты Google → Cache First (долгоживущий кеш)
*/

const SW_VERSION = 'esep-v1.0';
const CACHE_STATIC = SW_VERSION + '-static';
const CACHE_FONTS  = SW_VERSION + '-fonts';
const CACHE_API    = SW_VERSION + '-api';

// Ресурсы для предзагрузки при установке
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install: предзагрузка ключевых ресурсов ───────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting(); // активируем сразу без ожидания
    })
  );
});

// ─── Activate: очистка старых кешей ────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          // Удаляем все кеши не текущей версии
          return key.startsWith('esep-') && !key.startsWith(SW_VERSION);
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim(); // берём управление всеми вкладками
    })
  );
});

// ─── Fetch: умная маршрутизация запросов ───────────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = new URL(req.url);

  // Пропускаем не-GET запросы (POST/PUT/DELETE → всегда сеть)
  if (req.method !== 'GET') return;

  // Пропускаем chrome-extension и прочий мусор
  if (!url.protocol.startsWith('http')) return;

  // 1. Supabase API → Network First (данные должны быть актуальными)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(networkFirstWithCache(req, CACHE_API, 30)); // 30s timeout
    return;
  }

  // 2. Google Fonts → Cache First (шрифты не меняются)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(req, CACHE_FONTS));
    return;
  }

  // 3. Telegram Web App JS → Cache First
  if (url.hostname.includes('telegram.org')) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }

  // 4. Основное приложение → Cache First + фоновое обновление (stale-while-revalidate)
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, CACHE_STATIC));
    return;
  }

  // 5. Всё остальное → сеть
});

// ─── Стратегии кеширования ─────────────────────────────────────────────────

// Cache First: сначала кеш, если нет — сеть + кладём в кеш
function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(cached) {
      if (cached) return cached;
      return fetch(req).then(function(response) {
        if (response && response.status === 200) {
          cache.put(req, response.clone());
        }
        return response;
      }).catch(function() {
        return new Response('Нет соединения', { status: 503 });
      });
    });
  });
}

// Network First: сначала сеть, при ошибке — кеш
function networkFirstWithCache(req, cacheName, timeoutSeconds) {
  return caches.open(cacheName).then(function(cache) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function() { controller.abort(); }, timeoutSeconds * 1000) : null;

    var fetchOpts = controller ? { signal: controller.signal } : {};

    return fetch(req, fetchOpts).then(function(response) {
      if (timer) clearTimeout(timer);
      if (response && response.status === 200) {
        cache.put(req, response.clone());
      }
      return response;
    }).catch(function() {
      if (timer) clearTimeout(timer);
      // Сеть недоступна — возвращаем кешированные данные
      return cache.match(req).then(function(cached) {
        return cached || new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    });
  });
}

// Stale-While-Revalidate: отдаём кеш сразу + обновляем в фоне
function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(cached) {
      var fetchPromise = fetch(req).then(function(response) {
        if (response && response.status === 200) {
          cache.put(req, response.clone());
        }
        return response;
      }).catch(function() {
        return cached;
      });

      return cached || fetchPromise;
    });
  });
}

// ─── Push-уведомления (задел на будущее) ───────────────────────────────────
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'ESEP Sklad', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'esep',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
