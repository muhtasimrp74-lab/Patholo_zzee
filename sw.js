/* Service worker for Patholo_zzee.
   - Everything below is saved on first visit, so the site opens instantly and works offline.
   - Pages and files are served from the saved copy first, then quietly refreshed in the
     background, so an updated index.html appears the next time the app is opened.
   - Your bookmarks, notes and progress are stored by the page itself (localStorage);
     this file never touches them.
   - The 29 Robbins textbook chapters (about 7 MB) are saved in the background after install,
     so the whole site (questions, MCQs, textbook) works with no connection at all.
   When you upload a new version of the site, change VERSION to force a clean refresh. */
const VERSION = 'pathviva-zzee-v130';

const CORE = [
  'index.html',
  'annot/annot.js',
  'annot/annot.css',
  'welcome.js',
  'manifest.json',
  'icons/favicon.svg',
  'icons/favicon-16.png',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/hero-lab.webp',
  'icons/hero-lab-900.webp',
  'icons/hero-lab-m.webp',
  'icons/footer-banner.webp',
  'icons/footer-banner-900.webp',
  'icons/pb-questions.webp',
  'icons/pb-questions-900.webp',
  'icons/pb-chapters.webp',
  'icons/pb-chapters-900.webp',
  'icons/pb-mcqs.webp',
  'icons/pb-mcqs-900.webp',
  'icons/pb-textbook.webp',
  'icons/pb-textbook-900.webp',
  'icons/pb-menu.webp',
  'icons/pb-menu-900.webp',
  'fonts/inter-latin-400-normal.woff2',
  'fonts/inter-greek-400-normal.woff2',
  'fonts/inter-greek-500-normal.woff2',
  'fonts/inter-greek-600-normal.woff2',
  'fonts/dm-serif-display-latin-400-normal.woff2',
  'fonts/newsreader-latin-500-italic.woff2',
  'fonts/newsreader-latin-600-normal.woff2',
  'fonts/hanken-grotesk-latin-400-normal.woff2',
  'fonts/hanken-grotesk-latin-500-normal.woff2',
  'fonts/hanken-grotesk-latin-600-normal.woff2',
  'fonts/hanken-grotesk-latin-700-normal.woff2',
  'fonts/caveat-latin-500-normal.woff2',
  'fonts/caveat-latin-700-normal.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())
      .catch(err => { console.error('[sw] install failed; the previous version stays active:', err); throw err; })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pathviva-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(precacheBook)
  );
});

/* Save the textbook (index + 29 chapters) so it opens offline even if never visited. Failures are ignored and retried next update. */
async function precacheBook() {
  try {
    const cache = await caches.open(VERSION);
    const files = ['textbook/index.json'];
    for (let i = 1; i <= 29; i++) files.push('textbook/ch' + String(i).padStart(2, '0') + '.html');
    files.push('icons/logo.svg');
    const todo = [];
    for (const f of files) if (!(await cache.match(f))) todo.push(f);
    const missing = [];
    for (let i = 0; i < todo.length; i += 3) {
      await Promise.all(todo.slice(i, i + 3).map(f => fetch(f).then(r => { if (r && r.status === 200) return cache.put(f, r); missing.push(f); }).catch(() => { missing.push(f); })));
    }
    if (missing.length) console.warn('[sw] not saved for offline yet (retried on next update):', missing);
    await cache.put('diag.json', new Response(JSON.stringify({ version: VERSION, at: Date.now(), expected: files.length, missing }), { headers: { 'Content-Type': 'application/json' } }));
  } catch (e) { console.warn('[sw] textbook caching failed:', e); }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/sw.js')) return;

  const isPage = req.mode === 'navigate';
  const key = isPage ? 'index.html' : req;
  if (isPage) {  // pages: newest copy when the network answers quickly; the saved copy instantly when offline or slow
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const saved = await cache.match(key, { ignoreSearch: true });
      const net = fetch(req, { cache: 'no-cache' }).then(res => {
        if (res && res.status === 200 && res.type === 'basic') cache.put(key, res.clone()).catch(() => {});
        return res;
      });
      if (!saved) {
        try { return await net; } catch (e) {
          return new Response('You are offline and this file has not been saved yet.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      }
      event.waitUntil(net.catch(() => null));
      return Promise.race([net.catch(() => saved), new Promise(r => setTimeout(() => r(saved), 2500))]);
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
