self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('contrast-visor-store').then((cache) => cache.addAll([
      '/contrastvisor/',
      '/contrastvisor/index.html',
      '/contrastvisor/lib/bundle.js',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
