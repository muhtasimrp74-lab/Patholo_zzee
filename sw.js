/* Service worker for Patholo_zzee.
   - Everything below is saved on first visit, so the site opens instantly and works offline.
   - Pages and files are served from the saved copy first, then quietly refreshed in the
     background, so an updated index.html appears the next time the app is opened.
   - Your bookmarks, notes and progress are stored by the page itself (localStorage);
     this file never touches them.
   When you upload a new version of the site, change VERSION to force a clean refresh. */
const VERSION = 'pathviva-zzee-v12';

const CORE = [
  'index.html',
  'ink.js',
  'manifest.json',
  'icons/favicon.svg',
  'icons/favicon-16.png',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'fonts/fraunces-latin-400-normal.woff2',
  'fonts/fraunces-latin-500-normal.woff2',
  'fonts/fraunces-latin-600-normal.woff2',
  'fonts/fraunces-latin-400-italic.woff2',
  'fonts/inter-latin-400-normal.woff2',
  'fonts/inter-latin-500-normal.woff2',
  'fonts/inter-latin-600-normal.woff2',
  'fonts/inter-greek-400-normal.woff2',
  'fonts/inter-greek-500-normal.woff2',
  'fonts/inter-greek-600-normal.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pathviva-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/sw.js')) return;

  const isPage = req.mode === 'navigate';
  const key = isPage ? 'index.html' : req;
  if (isPage) {  // pages: newest copy first (so a new deploy shows up straight away); saved copy only when offline
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.status === 200 && res.type === 'basic') cache.put(key, res.clone()).catch(() => {});
        return res;
      } catch (e) {
        const saved = await cache.match(key, { ignoreSearch: true });
        return saved || new Response('You are offline and this file has not been saved yet.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const saved = await cache.match(key, { ignoreSearch: true });

    const refresh = fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        cache.put(key, res.clone()).catch(() => {});
      }
      return res;
    }).catch(() => null);

    if (saved) {
      event.waitUntil(refresh);
      return saved;
    }
    const fresh = await refresh;
    if (fresh) return fresh;
    if (isPage) {
      const home = await cache.match('index.html');
      if (home) return home;
    }
    return new Response('You are offline and this file has not been saved yet.', {
      status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  })());
});
