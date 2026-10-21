"""Stage 1 gating: the committed index.html has no gated content; loadChunk() fills topics, deep links, quiz mode,
textbook chapters and MCQs from the chunk base URL, with loading/error/retry states and an in-memory cache.
Needs private-chunks/ (python3 tools/build.py, or tools/restore_private.sh in CI)."""
import os, re, json, unittest, threading, functools, http.server
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HAVE_CHUNKS = os.path.exists(os.path.join(ROOT, 'private-chunks', 'q-02.json'))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

class StaticGate(unittest.TestCase):
    def test_index_has_no_gated_answers_or_mcqs(self):
        h = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
        man = json.load(open(os.path.join(ROOT, 'content', 'manifest.json'), encoding='utf8'))
        self.assertEqual(len(re.findall(r'<div class="ans" data-zz="q-[^"]+"></div>', h)),
                         sum(m['items'] for m in man['chunks'].values() if m['kind'] == 'q' and not m['free']))
        i = h.index('const MCQDATA=') + 14; q = json.loads(h[i:h.index(';\n', i)])['q']
        self.assertTrue(q and all(x['c'] == 0 for x in q))
        self.assertIn('"gated":["mcq-02"', h)

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class Loader(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
        cls.port = cls.srv.server_address[1]; threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop(); cls.srv.shutdown()
    def open(self, hash_, base='private-chunks/'):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        pg.add_init_script('window.ZZ_CHUNK_BASE=%s' % json.dumps(base)); self.reqs = []
        pg.on('request', lambda r: self.reqs.append(r.url))
        pg.goto('http://127.0.0.1:%d/index.html%s' % (self.port, hash_)); return pg
    def chunk_reqs(self, cid): return [u for u in self.reqs if u.endswith('/' + cid + '.json')]

    def test_topic_open_fills_answers_and_caches(self):
        pg = self.open('#/02')
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")
        self.assertGreater(pg.evaluate("()=>document.querySelector('#q7 .ans').textContent.length"), 50)
        pg.evaluate("()=>{location.hash='#/03'}"); pg.wait_for_function("()=>!document.querySelector('#v-03 .ans[data-zz]')")
        pg.evaluate("()=>{location.hash='#/02'}"); pg.wait_for_timeout(200)
        self.assertEqual(len(self.chunk_reqs('q-02')), 1)
        self.assertEqual(pg.evaluate("()=>loadChunk('q-02').then(c=>Object.keys(c.cards).length)"), 42)
        self.assertEqual(len(self.chunk_reqs('q-02')), 1, 'served from the in-memory cache')

    def test_free_topic_needs_no_chunk(self):
        pg = self.open('#/01'); pg.wait_for_timeout(500)
        self.assertEqual([u for u in self.reqs if '/private-chunks/' in u], [])
        self.assertEqual(pg.evaluate("()=>document.querySelectorAll('#v-01 .ans[data-zz]').length"), 0)

    def test_deep_link_and_quiz_mode(self):
        cid = json.load(open(os.path.join(ROOT, 'content', 'titles.json'), encoding='utf8'))
        q = next(r[0] for r in cid if r[1] == 'c14')
        pg = self.open('#/c14/' + q)
        pg.wait_for_function("id=>!document.querySelector('#'+id+' .ans[data-zz]')", arg=q)
        pg.evaluate("()=>setQuiz(true)"); pg.evaluate("()=>{location.hash='#/c7'}")
        pg.wait_for_function("()=>!document.querySelector('#v-c7 .ans[data-zz]')")
        self.assertTrue(pg.evaluate("()=>document.body.classList.contains('quiz')"))

    def test_gated_textbook_chapter_loads_from_chunk(self):
        pg = self.open('#/textbook/ch02'); pg.wait_for_selector('#tbbody[data-ch=ch02]')
        self.assertGreater(pg.evaluate("()=>document.getElementById('tbbody').textContent.length"), 5000)
        self.assertEqual(len(self.chunk_reqs('tb-ch02')), 1)
        self.assertFalse([u for u in self.reqs if u.endswith('textbook/ch02.html')])

    def test_mcqs_load_all_chapters_on_open(self):
        pg = self.open('#/mcqs'); pg.wait_for_function("()=>MCQDATA.q.length===884", timeout=15000)
        self.assertFalse(pg.evaluate("()=>document.querySelector('.view[data-zz-st]')"))
        self.assertEqual(len(set(re.findall(r'mcq-\d+', ' '.join(self.reqs)))), 16)

    def test_error_state_then_retry(self):
        pg = self.open('#/02', base='missing/')
        pg.wait_for_selector('#q7 .ans[data-zz-st=error] button')
        self.assertIn('Could not load', pg.text_content('#q7 .ans'))
        pg.evaluate("()=>{window.ZZ_CHUNK_BASE='private-chunks/'}"); pg.evaluate("()=>document.querySelector('#q7 .ans button').click()")
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")

if __name__ == '__main__': unittest.main()

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class AccountClient(unittest.TestCase):
    """account.js against a mocked API: refresh on load, OTP sign-in, bearer on chunk loads, logout."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def page(self, rt=None):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close); self.calls = []
        if rt: pg.add_init_script("localStorage.setItem('zz-rt', %s)" % json.dumps(rt))
        def api(route):
            r = route.request; path = r.url.split('/api/')[1]; self.calls.append((path, r.headers.get('authorization')))
            body = json.loads(r.post_data or '{}') if r.method == 'POST' else {}
            tok = {'access_token': 'acc2', 'refresh_token': 'rt2', 'expires_in': 900, 'user': {'id': 'u1', 'display_name': 'A'}}
            if path == 'auth/refresh': return route.fulfill(status=200 if body.get('refresh_token') == 'rt1' else 401, json=tok)
            if path == 'auth/otp/start': return route.fulfill(json={'ok': True})
            if path == 'auth/otp/verify': return route.fulfill(status=200 if body.get('code') == '123456' else 401, json=tok)
            if path == 'auth/logout': return route.fulfill(json={'ok': True})
            if path.startswith('chunks/'):
                if r.headers.get('authorization') != 'Bearer acc2': return route.fulfill(status=401, json={'error': 'unauthorized'})
                return route.fulfill(body=open(os.path.join(ROOT, 'private-chunks', path[7:]), 'rb').read(), content_type='application/json')
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); return pg
    def test_refresh_on_load_then_chunks_with_bearer(self):
        pg = self.page('rt1'); pg.goto('http://127.0.0.1:%d/index.html#/02' % self.port)
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")
        self.assertEqual(pg.evaluate("()=>localStorage.getItem('zz-rt')"), 'rt2')
        self.assertIn(('chunks/q-02.json', 'Bearer acc2'), self.calls)
        self.assertFalse(pg.evaluate("()=>Object.keys(localStorage).some(k=>localStorage.getItem(k)==='acc2')"), 'access token never stored')
    def test_otp_sign_in_unlocks_then_logout(self):
        pg = self.page(); pg.goto('http://127.0.0.1:%d/index.html#/02' % self.port)
        pg.wait_for_selector('#q7 .ans[data-zz-st=error]', state='attached')
        self.assertIn('locked', pg.text_content('#q7 .ans'))
        pg.evaluate('()=>zzSignIn()'); pg.fill('#zz-phone', '01712345678'); pg.click('#zz-send')
        pg.wait_for_selector('#zz-code'); pg.fill('#zz-code', '123456'); pg.click('#zz-verify')
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")
        pg.evaluate('()=>zzAccount.logout()')
        self.assertIsNone(pg.evaluate("()=>localStorage.getItem('zz-rt')"))
        self.assertEqual(pg.evaluate('()=>zzAuthHeaders()'), {})
