self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('contrast-visor-store').then((cache) => cache.addAll([
      '/web/',
      '/web/index.html',
      '/web/lib/bundle.js',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
