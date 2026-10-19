"""Stage 6: the Vite build (dist/) must work offline from a cold start. Needs `npm run build` first.
Checks (page responses >= 400 are the failure signal, since the worker revalidates in the background and that fetch fails offline by design): sw_precache.json lists every local file the built page requests; after the worker installs, all of them are cached;
with the network off, a reload shows the home page with no failed same-origin request and a topic opens with its cards."""
import os, re, json, threading, functools, http.server, socketserver, unittest
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIST = os.path.join(ROOT, 'dist')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
@unittest.skipUnless(os.path.exists(os.path.join(DIST, 'sw_precache.json')), 'run npm run build first')
class DistOffline(unittest.TestCase):
    @classmethod
    def setUpClass(c):
        with open(os.path.join(DIST, 'sw_precache.json'), encoding='utf8') as fh: c.pre = json.load(fh)
        socketserver.ThreadingTCPServer.allow_reuse_address = True; socketserver.ThreadingTCPServer.daemon_threads = True
        c.srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=DIST))
        c.url = 'http://127.0.0.1:%d/' % c.srv.server_address[1]
        threading.Thread(target=c.srv.serve_forever, daemon=True).start()
        c.pw = sync_playwright().start(); c.b = c.pw.chromium.launch()
    @classmethod
    def tearDownClass(c): c.b.close(); c.pw.stop(); c.srv.shutdown()
    def test_precache_list_covers_every_local_file_the_built_page_references(self):
        with open(os.path.join(DIST, 'index.html'), encoding='utf8') as fh: html = fh.read()
        refs = {m[1] for m in re.findall(r'(?:src|href)="(\./)?((?:assets|annot|icons|fonts)/[^"?#]+|welcome\.js|zz-store\.js)"', html)}
        css = ''
        for f in self.pre['files']:
            if f.endswith('.css'):
                with open(os.path.join(DIST, f), encoding='utf8') as fh: css += fh.read()
        for u in re.findall(r'url\(["\']?(?:\./|\.\./)?([^)"\'?#]+)', css): refs.add(u)
        refs = {r for r in refs if not re.search(r"['+]", r)}  # skip JS string concatenations such as icons/pb-'+k+'.webp
        missing = sorted(r for r in refs if re.match(r'(assets|annot|icons|fonts)/', r) and r not in self.pre['files'])
        self.assertEqual(missing, [])
        self.assertTrue(self.pre['version'].startswith('pathviva-zzee-dist-'))
    def test_cold_offline_reload_and_topic_open_have_no_failed_requests(self):
        ctx = self.b.new_context(service_workers='allow'); pg = ctx.new_page(); failed = []; errs = []
        pg.on('response', lambda r: failed.append(r.url) if r.status >= 400 else None)  # worker revalidation fetches fail offline by design
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(self.url, wait_until='domcontentloaded', timeout=90000)
        pg.wait_for_function("()=>!document.documentElement.classList.contains('zz-boot')", timeout=60000)
        pg.evaluate("navigator.serviceWorker.ready.then(()=>1)")
        pg.wait_for_function("(n)=>caches.keys().then(async k=>{if(!k.length)return false;const c=await caches.open(k[0]);return (await c.keys()).length>=n})", arg=len(self.pre['files']), timeout=60000)
        # the worker saves the 29-chapter textbook in the background after install; wait for it before going offline
        pg.wait_for_function("caches.keys().then(async k=>{const c=await caches.open(k[0]);return !!(await c.match('textbook/ch29.html'))})", timeout=120000)
        have = pg.evaluate("caches.keys().then(async k=>{const c=await caches.open(k[0]);return [k[0],(await c.keys()).map(r=>new URL(r.url).pathname.replace(/^\\//,''))]})")
        self.assertEqual(have[0], self.pre['version'])
        got = set(have[1]) | {'index.html'}
        self.assertEqual(sorted(set(self.pre['files']) - got), [])
        ctx.set_offline(True); failed.clear()
        try:
            pg.reload(wait_until='load', timeout=30000)
            pg.wait_for_function("()=>!document.documentElement.classList.contains('zz-boot')", timeout=60000); pg.wait_for_timeout(1500)
            self.assertTrue(pg.locator('#v-home').is_visible()); self.assertGreater(pg.locator('article.card').count(), 1000)
            pg.goto(self.url + '#/01'); pg.wait_for_timeout(800)
            self.assertGreater(pg.locator('#v-01 article.card').count(), 5)
            self.assertEqual([u for u in failed if u.startswith(self.url)], []); self.assertEqual(errs, [])
        finally: ctx.set_offline(False); ctx.close()
if __name__ == '__main__': unittest.main()
