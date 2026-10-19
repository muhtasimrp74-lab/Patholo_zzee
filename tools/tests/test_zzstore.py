"""The page really routes saved state through window.zzStore (the typed storage layer), writes the same bytes the legacy app wrote,
and the committed zz-store.js bundle is current. Works against the legacy site and, via SITE_DIR=dist, the Vite build."""
import os, json, subprocess, hashlib, threading, functools, http.server, socketserver, unittest, tempfile, shutil
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DIR = os.path.join(ROOT, os.environ.get('SITE_DIR', '.'))
FIX = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures', 'old_user_data.json'), encoding='utf8'))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

class ZzStore(unittest.TestCase):
    @classmethod
    def setUpClass(c):
        h = functools.partial(Quiet, directory=DIR); socketserver.ThreadingTCPServer.allow_reuse_address = True; socketserver.ThreadingTCPServer.daemon_threads = True
        c.srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), h); c.url = 'http://127.0.0.1:%d/' % c.srv.server_address[1]
        threading.Thread(target=c.srv.serve_forever, daemon=True).start()
        c.pw = sync_playwright().start(); c.b = c.pw.chromium.launch()
    @classmethod
    def tearDownClass(c): c.b.close(); c.pw.stop(); c.srv.shutdown()

    def page(self, seed=True):
        ctx = self.b.new_context(service_workers='block'); p = ctx.new_page(); errs = []; p.on('pageerror', lambda e: errs.append(str(e)))
        p.goto(self.url, wait_until='domcontentloaded'); 
        if seed:
            p.evaluate("d=>{for(const [k,v] of Object.entries(d))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))}", FIX)
            p.goto(self.url + '#/01', wait_until='domcontentloaded'); p.reload(wait_until='domcontentloaded')   # reload so the app boots from the seeded data
        p.wait_for_timeout(1500); return ctx, p, errs

    def test_facade_is_installed_and_reads_old_data(self):
        ctx, p, errs = self.page()
        try:
            self.assertTrue(p.evaluate("typeof zzStore.subscribe==='function' && !!zzStore.repository"))   # the real facade, not the passthrough shim
            self.assertEqual(p.evaluate("zzStore.read('vivaState').bm"), FIX['vivaState']['bm'])
            self.assertEqual(p.evaluate("zzStore.getItem('tbLast')"), FIX['tbLast'])
            self.assertEqual(errs, [])
        finally: ctx.close()

    def test_app_saves_through_the_facade_with_unchanged_bytes(self):
        ctx, p, errs = self.page()
        try:
            p.evaluate("window.__w=[];zzStore.subscribe((k,v)=>__w.push(k));0")   # ;0 because Playwright would call a returned function (the unsubscribe)
            p.evaluate("document.querySelector('#q1 .act[data-k=\"bm\"]').click()")   # same call the app's own shortcut makes
            p.wait_for_timeout(500)
            self.assertIn('vivaState', p.evaluate("__w"))
            st = json.loads(p.evaluate("localStorage.getItem('vivaState')"))
            self.assertEqual(sorted(st['bm']), sorted(FIX['vivaState']['bm'] + ['q1']))   # the click was saved and the old bookmarks survived
            self.assertEqual(st['notes'], FIX['vivaState']['notes']); self.assertEqual(st['learned'], FIX['vivaState']['learned'])   # untouched fields survive
            self.assertEqual(errs, [])
        finally: ctx.close()

    def test_committed_bundle_is_current(self):
        if os.environ.get('SITE_DIR'): self.skipTest('checked on the repo root only')
        tmp = tempfile.mkdtemp()
        try:
            r = subprocess.run(['npx', 'vite', 'build', '-c', 'vite.store.config.ts', '--outDir', tmp], cwd=ROOT, capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr[-500:])
            h = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
            self.assertEqual(h(os.path.join(tmp, 'zz-store.js')), h(os.path.join(ROOT, 'zz-store.js')), 'zz-store.js is stale: run npm run build:store and commit it')
        finally: shutil.rmtree(tmp, ignore_errors=True)

if __name__ == '__main__': unittest.main()
