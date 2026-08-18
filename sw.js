// ===== SERVICE WORKER =====
const CACHE_NAME = 'betpro-v1';
const BASE_PATH = '/betpro-web/';

const STATIC_ASSETS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'style.css',
  BASE_PATH + 'app.js',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'icon-192.png',
  BASE_PATH + 'icon-512.png'
];

// Установка — кэшируем все файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов — отдаём из кэша, если есть
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Если запрос к нашему сайту — пробуем кэш
  if (url.pathname.startsWith(BASE_PATH) || url.pathname === '/betpro-web/') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) return response;
          return fetch(event.request);
        })
        .catch(() => {
          // Если нет интернета — показываем заглушку
          return caches.match(BASE_PATH + 'index.html');
        })
    );
  }
});
