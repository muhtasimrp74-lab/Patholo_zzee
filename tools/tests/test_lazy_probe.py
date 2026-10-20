"""Stage 5 Option A probe: tools/lazy_probe.py moves every card out of index.html into per-view JSON chunks and a loader puts them
back (placeholders swapped by a parser-blocking script, nothing deferred) BEFORE the boot scripts. After boot the DOM must equal the inline build
(whitespace between tags aside), with no page errors and no loader failure. Probe only: nothing shipped uses it."""
import os, re, sys, threading, tempfile, functools, http.server, socketserver, unittest
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools')); import lazy_probe
JS = """()=>{const b=document.body.cloneNode(true);b.querySelectorAll('script').forEach(s=>s.remove());
const w=document.createTreeWalker(b,NodeFilter.SHOW_COMMENT),cs=[];let n;while(n=w.nextNode())cs.push(n);cs.forEach(c=>c.remove());
return {html:b.innerHTML,cards:document.querySelectorAll('article.card').length,failed:document.documentElement.getAttribute('data-zz-lazy-failed'),
 qm:typeof QMETA!=='undefined'?Object.keys(QMETA).length:-1}}"""

class Lazy(unittest.TestCase):
    @classmethod
    def setUpClass(c):
        c.tmp = tempfile.TemporaryDirectory(); lazy_probe.build(ROOT, c.tmp.name, 'index.full.html')
        class H(http.server.SimpleHTTPRequestHandler):
            def translate_path(self, p):
                p = p.split('?')[0].split('#')[0]
                if p.startswith('/lazy/'):
                    q = os.path.join(c.tmp.name, p[6:])
                    if os.path.exists(q): return q
                    p = p[5:]
                return os.path.join(ROOT, p.lstrip('/'))
            def log_message(self, *a): pass
        socketserver.ThreadingTCPServer.allow_reuse_address = True; c.srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), H)
        c.base = 'http://127.0.0.1:%d' % c.srv.server_address[1]; threading.Thread(target=c.srv.serve_forever, daemon=True).start()
        c.pw = sync_playwright().start(); c.b = c.pw.chromium.launch()
    @classmethod
    def tearDownClass(c): c.b.close(); c.pw.stop(); c.srv.shutdown(); c.tmp.cleanup()

    def snap(self, path):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(self.base + path, wait_until='load'); pg.wait_for_function("()=>!document.documentElement.classList.contains('zz-boot')", timeout=20000)
        pg.wait_for_timeout(1500); r = pg.evaluate(JS); r['errs'] = errs; ctx.close(); return r

    def test_lazy_variant_boots_to_the_same_dom_as_the_inline_build(self):
        a, b = self.snap('/index.full.html'), self.snap('/lazy/index.html'); N = lambda h: re.sub(r'>\s+<', '><', h)
        self.assertEqual((a['errs'], b['errs']), ([], [])); self.assertIsNone(b['failed'])
        self.assertEqual(a['cards'], 1310); self.assertEqual(b['cards'], 1310); self.assertEqual(a['qm'], b['qm'])
        self.assertTrue(N(a['html']) == N(b['html']), 'booted DOM differs between inline and lazy variants')

    def test_html_shrinks_and_chunks_cover_every_card(self):
        n, v = lazy_probe.build(ROOT, self.tmp.name, 'index.full.html'); self.assertEqual(n, 1310)
        self.assertLess(os.path.getsize(os.path.join(self.tmp.name, 'index.html')), os.path.getsize(os.path.join(ROOT, 'index.full.html')) * 0.4)
        self.assertEqual(len([f for f in os.listdir(os.path.join(self.tmp.name, 'zzcards')) if f.endswith('.json')]), v); self.assertTrue(os.path.exists(os.path.join(self.tmp.name, 'zzcards', 'all.js')))

if __name__ == '__main__': unittest.main()
