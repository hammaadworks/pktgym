// Dummy Service Worker to silence 404 errors in dev environments
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('fetch', () => {
  // Do nothing, let the browser handle requests normally
});
