// Service Worker for BuscaPreço PWA
//
// v2: Corrige atualização automática. O HTML principal (a "casca" do app)
// agora usa estratégia "rede primeiro" — sempre busca a versão mais nova do
// servidor antes de considerar o cache, e só usa o cache guardado se o
// usuário estiver offline. Arquivos com hash no nome (gerados pelo build do
// Vite, ex: index-abc123.js) continuam em cache-first, pois são imutáveis
// por natureza (o nome muda a cada build).
const CACHE_NAME = 'buscapreco-cache-v3';
const ASSETS_TO_CACHE = [
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore chrome-extension or external analytics if any
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const isAppShell =
    event.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isAppShell) {
    // Rede primeiro: garante que o usuário sempre receba a versão mais
    // recente do app assim que ela for publicada. "cache: no-store" força o
    // navegador a ignorar qualquer cache HTTP intermediário (não só o do
    // Service Worker) e buscar a página realmente fresca do servidor. Só cai
    // para o cache guardado se estiver offline.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.open(CACHE_NAME).then((cache) =>
            cache.match(event.request).then((cached) => cached || cache.match('/'))
          )
        )
    );
    return;
  }

  // Demais arquivos (JS/CSS com hash no nome, imagens, etc.): cache primeiro,
  // com atualização em segundo plano — seguro porque o nome do arquivo muda
  // a cada novo build.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      });
    })
  );
});
