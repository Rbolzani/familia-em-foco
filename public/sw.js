// Service Worker mínimo — registra o app como PWA sem cache offline
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request))
})
