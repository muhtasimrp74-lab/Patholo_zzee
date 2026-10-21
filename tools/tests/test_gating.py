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
            if path == 'config': return route.fulfill(json={'otp': True, 'password': True})
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
        self.assertIn('Sign in', pg.text_content('#q7 .ans'))
        pg.evaluate('()=>zzSignIn()'); pg.fill('#zz-phone', '01712345678'); pg.click('#zz-send')
        pg.wait_for_selector('#zz-code'); pg.fill('#zz-code', '123456'); pg.click('#zz-verify')
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")
        with pg.expect_navigation(): pg.evaluate('()=>zzAccount.logout()')
        self.assertIsNone(pg.evaluate("()=>localStorage.getItem('zz-rt')"))
        self.assertEqual(pg.evaluate('()=>zzAuthHeaders()'), {})

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class Entitlement(unittest.TestCase):
    """Locked topics leak nothing; expiry keeps local data; renewal unlocks again with the same data."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def test_expiry_then_renewal_keeps_user_data_and_locked_shows_nothing(self):
        state = {'ok': True}; bodies = []
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        pg.add_init_script("if(!localStorage.getItem('zz-rt'))localStorage.setItem('zz-rt','rt')")
        def api(route):
            path = route.request.url.split('/api/')[1]
            if path == 'auth/refresh': return route.fulfill(json={'access_token': 'acc', 'refresh_token': 'rt', 'expires_in': 900})
            if path.startswith('chunks/'):
                if not state['ok']: bodies.append('{"error":"forbidden"}'); return route.fulfill(status=403, body=bodies[-1], content_type='application/json')
                b = open(os.path.join(ROOT, 'private-chunks', path[7:]), 'rb').read(); bodies.append(b.decode()); return route.fulfill(body=b, content_type='application/json')
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api)
        url = 'http://127.0.0.1:%d/index.html#/02' % self.port; pg.goto(url)
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")
        pg.evaluate("()=>{zzStore.setItem('vivaQuiz','1');localStorage.setItem('zz-test-note','my note')}")
        snap = "()=>JSON.stringify(Object.keys(localStorage).filter(k=>k!=='zz-rt').sort().map(k=>[k,localStorage.getItem(k)]))"
        before = pg.evaluate(snap)
        secret = json.load(open(os.path.join(ROOT, 'private-chunks', 'q-02.json'), encoding='utf8'))['cards']['q7']
        sample = re.sub(r'<[^>]+>', ' ', secret).split()[:12]
        state['ok'] = False; bodies.clear(); pg.reload()
        pg.wait_for_selector('#q7 .ans.zz-locked button', state='attached')
        self.assertEqual(pg.text_content('#q7 .ans button'), 'Upgrade')
        dom = pg.evaluate("()=>document.getElementById('v-02').innerHTML")
        self.assertNotIn(' '.join(sample[:8]), re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', dom)))
        self.assertTrue(bodies and all(b == '{"error":"forbidden"}' for b in bodies), 'locked responses carry no content')
        kept = lambda: [x for x in json.loads(before) if x not in json.loads(pg.evaluate(snap))]
        self.assertEqual(kept(), [], 'expiry keeps local progress, notes and settings')
        state['ok'] = True; pg.evaluate("()=>dispatchEvent(new CustomEvent('zz:auth'))")
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')")
        self.assertEqual(kept(), [], 'renewal keeps the same data')
    def test_locked_mcqs_keep_free_chapter_and_locked_chapter_prompts(self):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        pg.route('**/api/chunks/**', lambda r: r.fulfill(status=401, json={'error': 'unauthorized'}))
        pg.goto('http://127.0.0.1:%d/index.html#/mcqs' % self.port)
        pg.wait_for_selector('.zz-banner button')
        self.assertEqual(pg.text_content('.zz-banner button'), 'Sign in')
        n = pg.evaluate('()=>MCQDATA.q.length'); self.assertTrue(0 < n < 884)
        pg.evaluate("()=>{location.hash='#/textbook/ch05'}"); pg.wait_for_selector('#tbbody .zz-locked button')
        self.assertEqual(pg.text_content('#tbbody .zz-locked button'), 'Sign in')

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class PayClient(unittest.TestCase):
    """pay.js against a mocked API: upgrade -> checkout redirect; return page shows pending, re-checks, then the receipt."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def page(self):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close); self.n = 0; self.sent = []
        pg.add_init_script("localStorage.setItem('zz-rt','rt')")
        def api(route):
            r = route.request; path = r.url.split('/api/')[1]
            if path == 'auth/refresh': return route.fulfill(json={'access_token': 'acc', 'refresh_token': 'rt', 'expires_in': 900})
            if path == 'bundles': return route.fulfill(json={'bundles': [{'id': 'ALL', 'name': 'Everything (1 year)', 'price': '1200.00', 'currency': 'BDT'}]})
            if path == 'pay/checkout':
                self.sent.append(json.loads(r.post_data)); return route.fulfill(json={'order_id': 'o1', 'redirect_url': 'http://127.0.0.1:%d/terms.html' % self.port})
            if path == 'pay/orders/o1':
                self.n += 1
                if self.n < 3: return route.fulfill(json={'order': {'status': 'pending'}, 'receipt': None})
                return route.fulfill(json={'order': {'status': 'paid'}, 'receipt': {'receipt_no': 'R0000001', 'bundle': 'ALL', 'amount_minor': 120000, 'currency': 'BDT', 'issued_at': 0}})
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); return pg
    def test_upgrade_starts_checkout_with_bundle_only(self):
        pg = self.page(); pg.goto('http://127.0.0.1:%d/index.html#/01' % self.port)
        pg.wait_for_function('()=>zzAccount.signedIn()'); pg.evaluate('()=>zzUpgrade()')
        with pg.expect_navigation(): pg.click('#zz-pay button[data-b=ALL]')
        self.assertEqual(self.sent, [{'bundle': 'ALL'}])
        self.assertTrue(pg.url.endswith('/terms.html')); self.assertIn('DRAFT', pg.content())
    def test_pending_rechecks_then_shows_receipt(self):
        pg = self.page(); pg.goto('http://127.0.0.1:%d/index.html#/account/order/o1' % self.port)
        pg.wait_for_selector('#zz-pending'); pg.wait_for_selector('#zz-receipt', timeout=20000)
        self.assertIn('R0000001', pg.text_content('#zz-receipt')); self.assertIn('BDT 1,200.00', pg.text_content('#zz-receipt'))
        self.assertGreaterEqual(self.n, 3)
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#zz-pay .zz-legal a')].map(a=>a.getAttribute('href'))"), ['terms.html', 'refund.html', 'privacy.html'])

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class OfflineCache(unittest.TestCase):
    """Opened gated chunks are cached per user; readable offline; logout, expiry and a different user wipe them."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def page(self):
        import base64
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close); self.mode = {'net': 'ok', 'user': 'u1'}
        tok = lambda u: 'h.' + base64.urlsafe_b64encode(json.dumps({'sub': u}).encode()).decode().rstrip('=') + '.s'
        pg.add_init_script("if(!sessionStorage.getItem('once')){sessionStorage.setItem('once',1);localStorage.setItem('zz-rt','rt')}")
        def api(route):
            path = route.request.url.split('/api/')[1]
            if path.startswith('auth/'):
                if path == 'auth/logout': return route.fulfill(json={'ok': True})
                return route.fulfill(json={'access_token': tok(self.mode['user']), 'refresh_token': 'rt', 'expires_in': 900})
            if path.startswith('chunks/'):
                if self.mode['net'] == 'down': return route.abort()
                if self.mode['net'] == 'expired': return route.fulfill(status=403, json={'error': 'forbidden'})
                return route.fulfill(body=open(os.path.join(ROOT, 'private-chunks', path[7:]), 'rb').read(), content_type='application/json')
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); pg.goto('http://127.0.0.1:%d/index.html#/02' % self.port)
        pg.wait_for_function("()=>!document.querySelector('#v-02 .ans[data-zz]')"); return pg
    keys = "()=>caches.keys()"
    read = "()=>{zzWipe=0;dispatchEvent(new CustomEvent('zz:auth'));return new Promise(r=>setTimeout(()=>r(!document.querySelector('#v-02 .ans[data-zz]')),1500))}"
    def test_offline_read_then_logout_wipes(self):
        pg = self.page(); pg.wait_for_function("()=>caches.keys().then(k=>k.includes('zz-chunks-u1'))")
        self.mode['net'] = 'down'
        self.assertTrue(pg.evaluate("()=>new Promise(r=>{document.querySelectorAll('#v-02 .ans').forEach(a=>{a.innerHTML='';a.setAttribute('data-zz','q-02')});dispatchEvent(new CustomEvent('zz:auth'));setTimeout(()=>r(!document.querySelector('#v-02 .ans[data-zz]')),1500)})"), 'readable offline')
        self.mode['net'] = 'ok'
        with pg.expect_navigation(): pg.evaluate('()=>zzAccount.logout()')
        self.assertEqual([k for k in pg.evaluate(self.keys) if k.startswith('zz-chunks-')], [])
    def test_expiry_wipes_and_second_user_cannot_read(self):
        pg = self.page(); pg.wait_for_function("()=>caches.keys().then(k=>k.includes('zz-chunks-u1'))")
        self.mode['user'] = 'u2'; pg.evaluate('()=>zzAccount.refresh()')
        pg.wait_for_function("()=>caches.keys().then(k=>!k.includes('zz-chunks-u1'))")
        self.mode['net'] = 'down'
        self.assertFalse(pg.evaluate("()=>caches.open('zz-chunks-u2').then(c=>c.keys()).then(k=>k.length)"), 'u2 has no copy of u1 data')
        self.mode['net'] = 'ok'; pg.evaluate("()=>{document.querySelectorAll('#v-02 .ans').forEach(a=>{a.innerHTML='';a.setAttribute('data-zz','q-02')});dispatchEvent(new CustomEvent('zz:auth'))}")
        pg.wait_for_function("()=>caches.keys().then(k=>k.includes('zz-chunks-u2'))")
        self.mode['net'] = 'expired'; pg.evaluate("()=>{document.querySelectorAll('#v-02 .ans').forEach(a=>{a.innerHTML='';a.setAttribute('data-zz','q-02')});dispatchEvent(new CustomEvent('zz:auth'))}")
        pg.wait_for_function("()=>caches.keys().then(k=>!k.includes('zz-chunks-u2'))")

def _tok(u):
    import base64
    return 'h.' + base64.urlsafe_b64encode(json.dumps({'sub': u}).encode()).decode().rstrip('=') + '.s'

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class Migration(unittest.TestCase):
    """First login uploads local data with stable upload ids; a failed upload changes nothing locally; local copies are replaced only after confirmation."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def test_retryable_idempotent_and_local_replaced_only_after_confirmation(self):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        mode = {'fail': True}; ids = []
        pg.add_init_script("if(!sessionStorage.getItem('once')){sessionStorage.setItem('once',1);localStorage.setItem('zz-rt','rt');localStorage.setItem('vivaState',JSON.stringify({bm:['q7']}));localStorage.setItem('tbDone','local')}")
        def api(route):
            r = route.request; path = r.url.split('/api/')[1]
            if path == 'auth/refresh': return route.fulfill(json={'access_token': _tok('u1'), 'refresh_token': 'rt', 'expires_in': 900})
            if path == 'sync/upload':
                b = json.loads(r.post_data); ids.append(b['upload_id'])
                return route.fulfill(status=500 if mode['fail'] else 200, json={'ok': not mode['fail']})
            if path == 'sync': return route.fulfill(json={'items': [
                {'kind': 'progress', 'key': 'vivaState/bm', 'value': '["q7","q9"]', 'updated_at': 9, 'deleted': 0, 'conflict': 0},
                {'kind': 'progress', 'key': 'tbDone', 'value': 'cloud', 'updated_at': 9, 'deleted': 0, 'conflict': 0}]})
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api)
        pg.goto('http://127.0.0.1:%d/index.html#/01' % self.port)
        pg.wait_for_function('()=>window.zzAccount&&zzAccount.signedIn()'); pg.wait_for_timeout(500)  # the automatic first attempt fails
        self.assertTrue(ids, 'first login started an upload')
        self.assertFalse(pg.evaluate('()=>zzMigrate()'))
        self.assertEqual(pg.evaluate("()=>[zzStore.getItem('vivaState'),zzStore.getItem('tbDone'),localStorage.getItem('zz-migrated:u1')]"), ['{"bm":["q7"]}', 'local', None])
        first = list(ids); mode['fail'] = False; ids.clear()
        self.assertTrue(pg.evaluate('()=>zzMigrate()'))
        self.assertEqual(ids[0], first[0], 'the retry reuses the same upload id')
        self.assertEqual(pg.evaluate("()=>[zzStore.getItem('vivaState'),zzStore.getItem('tbDone')]"), ['{"bm":["q7","q9"]}', 'cloud'])
        self.assertTrue(pg.evaluate("()=>localStorage.getItem('zz-migrated:u1')"))
        n = len(ids); self.assertFalse(pg.evaluate('()=>zzMigrate()')); self.assertEqual(len(ids), n, 'runs once per user')

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class AbuseClient(unittest.TestCase):
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def page(self, rt=True):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close); self.dels = []
        if rt: pg.add_init_script("if(!localStorage.getItem('zz-rt'))localStorage.setItem('zz-rt','rt')")
        def api(route):
            r = route.request; path = r.url.split('/api/')[1]
            if path == 'auth/refresh': return route.fulfill(json={'access_token': _tok('u1234567890'), 'refresh_token': 'rt', 'expires_in': 900})
            if path == 'me': return route.fulfill(json={'user': {'id': 'u1234567890', 'display_name': 'Ann'}, 'entitlements': [], 'now': 0})
            if path == 'config': return route.fulfill(json={'otp': True, 'password': True})
            if path == 'auth/otp/start': return route.fulfill(json={'ok': True})
            if path == 'auth/otp/verify': return route.fulfill(status=409, json={'error': 'device_limit', 'max': 3, 'removal_token': 'RT', 'devices': [
                {'device_id': 'device-%d000' % i, 'name': 'Phone %d' % i, 'last_seen_at': 0} for i in range(3)]})
            if r.method == 'DELETE': self.dels.append((path, r.headers.get('authorization'))); return route.fulfill(json={'ok': True})
            if path.startswith('chunks/'): return route.fulfill(body=open(os.path.join(ROOT, 'private-chunks', path[7:]), 'rb').read(), content_type='application/json')
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); return pg
    def test_watermark_on_gated_answers_and_textbook(self):
        pg = self.page(); pg.goto('http://127.0.0.1:%d/index.html#/02' % self.port)
        pg.wait_for_function("()=>document.querySelector('#q7 .ans.zz-g') && document.body.classList.contains('zz-wm')")
        pg.wait_for_function("()=>decodeURIComponent(getComputedStyle(document.body).getPropertyValue('--zz-wm')).includes('Ann · u1234567')")
        self.assertIn('svg', pg.evaluate("()=>getComputedStyle(document.querySelector('#q7 .ans')).backgroundImage"))
        pg.evaluate("()=>{location.hash='#/textbook/ch02'}"); pg.wait_for_selector('#tbbody.zz-g')
        self.assertIn('svg', pg.evaluate("()=>getComputedStyle(document.getElementById('tbbody')).backgroundImage"))
    def test_device_limit_lists_devices_and_removes_one(self):
        pg = self.page(rt=False); pg.goto('http://127.0.0.1:%d/index.html#/01' % self.port)
        pg.evaluate('()=>zzSignIn()'); pg.fill('#zz-phone', '01712345678'); pg.click('#zz-send'); pg.fill('#zz-code', '123456'); pg.click('#zz-verify')
        pg.wait_for_selector('#zz-devs button[data-d]'); self.assertEqual(pg.locator('#zz-devs li').count(), 3)
        pg.click('#zz-devs button[data-d=device-0000]'); pg.wait_for_function('()=>document.getElementById("zz-signin").open')
        self.assertEqual(self.dels, [('devices/device-0000', 'Bearer RT')])

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class FrontEnd(unittest.TestCase):
    """Locked topics say so above the questions; the account page works signed out and in; dialogs are labelled and styled."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def page(self, signed, hash_):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        if signed: pg.add_init_script("localStorage.setItem('zz-rt','rt')")
        def api(route):
            path = route.request.url.split('/api/')[1]
            if path == 'auth/refresh': return route.fulfill(status=200 if signed else 401, json={'access_token': _tok('u1234567890'), 'refresh_token': 'rt', 'expires_in': 900})
            if path == 'me': return route.fulfill(json={'user': {'id': 'u1234567890', 'display_name': 'Ann', 'email': 'a@x.io'}, 'entitlements': [{'entitlement': 'qna', 'expires_at': 4102444800000}], 'now': 0})
            if path == 'devices': return route.fulfill(json={'devices': [{'device_id': 'd-this', 'name': 'Android Chrome', 'last_seen_at': 0}, {'device_id': 'd-other', 'name': 'Windows Edge', 'last_seen_at': 0}], 'current': 'd-this', 'max': 3})
            if path.startswith('chunks/'): return route.fulfill(status=401, json={'error': 'unauthorized'})
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); pg.goto('http://127.0.0.1:%d/index.html%s' % (self.port, hash_)); return pg
    def test_locked_topic_notice_above_questions(self):
        pg = self.page(False, '#/02'); pg.wait_for_selector('#v-02 .zz-vlock button')
        self.assertTrue(pg.evaluate("()=>{const n=document.querySelector('#v-02 .zz-vlock'),c=document.querySelector('#v-02 .card');return !!(n.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)}"))
        self.assertEqual(pg.text_content('#v-02 .zz-vlock button'), 'Sign in')
        self.assertEqual(pg.evaluate("()=>getComputedStyle(document.querySelector('#v-02 .zz-vlock button')).backgroundColor"), 'rgb(122, 31, 54)')
    def test_account_page_signed_out_and_in(self):
        pg = self.page(False, '#/account'); pg.wait_for_selector('#v-account:not([hidden]) #zz-a-in')
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#bnav a.on')].map(a=>a.getAttribute('href'))"), ['#/menu'])
        pg.evaluate("()=>{location.hash='#/02'}"); pg.wait_for_timeout(200); pg.evaluate("()=>{location.hash='#/account'}"); pg.wait_for_timeout(300)
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#bnav a.on')].map(a=>a.getAttribute('href'))"), ['#/menu'], 'not the tab you came from')
        pg.click('#zz-a-in'); self.assertTrue(pg.evaluate("()=>document.getElementById('zz-signin').open"))
        self.assertEqual(pg.evaluate("()=>document.getElementById('zz-signin').getAttribute('aria-labelledby')"), 'zz-si-h')
        self.assertTrue(pg.evaluate("()=>getComputedStyle(document.querySelector('#zz-signin .zz-or')).display==='none'"), 'no "or" without Google')
        pg2 = self.page(True, '#/account'); pg2.wait_for_selector('#v-account:not([hidden]) #zz-a-up')
        txt = pg2.text_content('#v-account main')
        self.assertIn('Question bank', txt); self.assertNotIn('qna', txt); self.assertIn('Until 1 Jan 2100', txt)
        self.assertEqual(pg2.locator('#zz-devs button[data-d]').count(), 1, 'this device cannot be removed from itself')

    def test_plan_picker_best_value_first_lock_icon_and_reduced_motion(self):
        ctx = self.b.new_context(service_workers='block', reduced_motion='reduce'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        pg.add_init_script("localStorage.setItem('zz-rt','rt')")
        def api(route):
            path = route.request.url.split('/api/')[1]
            if path == 'auth/refresh': return route.fulfill(json={'access_token': _tok('u1'), 'refresh_token': 'rt', 'expires_in': 900})
            if path == 'bundles': return route.fulfill(json={'bundles': [{'id': k, 'name': k, 'price': v, 'currency': 'BDT'} for k, v in [('QNA', '500.00'), ('MCQ', '500.00'), ('TEXTBOOK', '500.00'), ('ALL', '1200.00')]]})
            if path.startswith('chunks/'): return route.fulfill(status=403, json={'error': 'forbidden'})
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); pg.goto('http://127.0.0.1:%d/index.html#/02' % self.port)
        pg.wait_for_selector('#v-02 .zz-vlock .zz-lk svg')
        self.assertEqual(pg.text_content('#v-02 .zz-vlock button'), 'Upgrade')
        pg.evaluate('()=>zzUpgrade()'); pg.wait_for_selector('#zz-pay .zz-plan')
        self.assertEqual(pg.evaluate("()=>[...document.querySelectorAll('#zz-pay .zz-plan')].map(b=>b.dataset.b)"), ['ALL', 'QNA', 'MCQ', 'TEXTBOOK'])
        self.assertIn('Best value', pg.text_content('#zz-pay .zz-plan.zz-best'))
        self.assertIn('save BDT 300.00', pg.text_content('#zz-pay .zz-plan.zz-best'))
        self.assertEqual(pg.evaluate("()=>getComputedStyle(document.getElementById('zz-pay')).animationName"), 'none', 'reduced motion respected')
        self.assertEqual(pg.evaluate("()=>document.activeElement.id"), 'zz-pay-h', 'focus starts on the title')

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class Launch(unittest.TestCase):
    """Launch flows: password sign-up/sign-in (no SMS) and manual bKash payment."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def page(self):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close); self.sent = []; self.state = {'submitted': False}
        def api(route):
            r = route.request; path = r.url.split('/api/')[1]; body = json.loads(r.post_data or '{}') if r.method == 'POST' else {}
            tok = {'access_token': _tok('u1'), 'refresh_token': 'rt', 'expires_in': 900, 'user': {'id': 'u1', 'display_name': 'ann'}}
            if path == 'config': return route.fulfill(json={'otp': False, 'password': True, 'pay': 'bkash'})
            if path in ('auth/register', 'auth/login'):
                self.sent.append((path, body.get('login')))
                if path == 'auth/register' and body.get('login') == 'taken@x.io': return route.fulfill(status=409, json={'error': 'account_exists'})
                return route.fulfill(json=tok) if body.get('password') == 'correct horse' else route.fulfill(status=401, json={'error': 'wrong_login'})
            if path == 'bundles': return route.fulfill(json={'bundles': [{'id': 'ALL', 'name': 'ALL', 'price': '14000.00', 'currency': 'BDT'}]})
            if path == 'pay/checkout': return route.fulfill(json={'order_id': 'o9', 'amount': '14000.00', 'currency': 'BDT', 'manual': {'method': 'bkash', 'number': '01843890254'}})
            if path == 'pay/manual':
                self.sent.append((path, body.get('trx_id'))); self.state['submitted'] = True; return route.fulfill(json={'ok': True})
            if path == 'pay/orders/o9': return route.fulfill(json={'order': {'status': 'pending', 'amount_minor': 1400000, 'currency': 'BDT', 'submitted_at': 1 if self.state['submitted'] else None}, 'receipt': None, 'manual': {'method': 'bkash', 'number': '01843890254'}})
            if path.startswith('chunks/'): return route.fulfill(status=401, json={'error': 'unauthorized'})
            route.fulfill(status=404, json={})
        pg.route('**/api/**', api); pg.goto('http://127.0.0.1:%d/index.html#/02' % self.port); return pg
    def test_password_sign_up_and_sign_in_without_sms(self):
        pg = self.page(); pg.evaluate('()=>zzSignIn()')
        self.assertTrue(pg.evaluate("()=>document.getElementById('zz-otp').hidden"), 'no SMS option without a provider')
        pg.click('#zz-mode'); self.assertEqual(pg.text_content('#zz-pw'), 'Create account')
        pg.fill('#zz-login', 'taken@x.io'); pg.fill('#zz-pass', 'correct horse'); pg.click('#zz-pw')
        pg.wait_for_function("()=>document.getElementById('zz-msg').textContent.includes('already exists')")
        pg.click('#zz-mode'); pg.fill('#zz-pass', 'bad pass 1'); pg.click('#zz-pw'); pg.wait_for_function("()=>document.getElementById('zz-msg').textContent.includes('Wrong')")
        pg.fill('#zz-pass', 'correct horse')
        pg.click('#zz-eye'); self.assertEqual(pg.get_attribute('#zz-pass', 'type'), 'text'); self.assertEqual(pg.get_attribute('#zz-eye', 'aria-label'), 'Hide password')
        self.assertEqual(pg.input_value('#zz-pass'), 'correct horse'); self.assertEqual(pg.evaluate('()=>document.activeElement.id'), 'zz-pass')
        pg.click('#zz-eye'); self.assertEqual(pg.get_attribute('#zz-pass', 'type'), 'password'); pg.click('#zz-eye')
        pg.click('#zz-pw'); pg.wait_for_function('()=>zzAccount.signedIn()')
        self.assertEqual(pg.get_attribute('#zz-pass', 'type'), 'password', 'hidden again after sign-in')
        self.assertEqual([p for p, _ in self.sent], ['auth/register', 'auth/login', 'auth/login'])
    def test_bkash_manual_payment_flow(self):
        pg = self.page(); pg.evaluate('()=>zzSignIn()'); pg.fill('#zz-login', 'a@x.io'); pg.fill('#zz-pass', 'correct horse'); pg.click('#zz-pw')
        pg.wait_for_function('()=>zzAccount.signedIn()'); pg.evaluate('()=>zzUpgrade()'); pg.click('#zz-pay button[data-b=ALL]')
        pg.wait_for_selector('#zz-trx'); txt = pg.text_content('#zz-pay')
        self.assertIn('01843890254', txt); self.assertIn('BDT 14,000.00', txt); self.assertIn('Send Money', txt)
        pg.fill('#zz-trx', 'bad!'); pg.click('#zz-trx-go'); self.assertIn('8 to 12', pg.text_content('#zz-trx-st')); self.assertEqual([p for p, _ in self.sent if p == 'pay/manual'], [])
        pg.fill('#zz-trx', '9k7ab12cde'); pg.click('#zz-trx-go'); pg.wait_for_selector('#zz-pending')
        self.assertIn(('pay/manual', '9K7AB12CDE'), self.sent); self.assertIn('checking', pg.text_content('#zz-pay').lower())

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class HomeTopics(unittest.TestCase):
    """The home 'Topics and progress' table is built from the topic pages: one row per page, same title, same counts."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def test_rows_match_topic_pages(self):
        ctx = self.b.new_context(service_workers='block'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        pg.route('**/api/**', lambda r: r.fulfill(status=401, json={}))
        pg.goto('http://127.0.0.1:%d/index.html#/' % self.port); pg.wait_for_selector('#v-home .nh-ch')
        rows = pg.evaluate(r"""()=>[...document.querySelectorAll('#v-home .nh-ch')].map(a=>({v:a.querySelector('h4 a').getAttribute('href').slice(2),t:a.querySelector('h4').textContent.trim(),
            n:+/\/ (\d+) read/.exec(a.querySelector('.nh-mu').textContent)[1],s:[...a.querySelectorAll('li em')].reduce((x,e)=>x+ +e.textContent.split('/')[1],0)}))""")
        pages = pg.evaluate(r"""()=>Object.fromEntries([...document.querySelectorAll('.view')].filter(v=>v.querySelector('article.card')).map(v=>[v.id.slice(2),{t:v.querySelector('h1').textContent.trim(),n:v.querySelectorAll('article.card').length}]))""")
        self.assertEqual(sorted(r['v'] for r in rows), sorted(pages))
        for r in rows:
            self.assertEqual((r['t'], r['n']), (pages[r['v']]['t'], pages[r['v']]['n']), r['v'])
            if r['s']: self.assertEqual(r['s'], r['n'], r['v'])

@unittest.skipUnless(HAVE_PW and HAVE_CHUNKS, 'playwright or private-chunks missing')
class Greeting(unittest.TestCase):
    """Premium greeting: part of day from local time, first name, a useful second line, plan badge; phone-sized screen."""
    setUpClass = classmethod(Loader.setUpClass.__func__); tearDownClass = classmethod(Loader.tearDownClass.__func__)
    def banner(self, hour, seed, signed=False, ents=()):
        import datetime
        ctx = self.b.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', timezone_id='Asia/Dhaka'); pg = ctx.new_page(); self.addCleanup(ctx.close)
        t = datetime.datetime(2026, 10, 22, hour, 5, tzinfo=datetime.timezone(datetime.timedelta(hours=6))); pg.clock.install(time=t)
        seed = dict(seed, zzWelcomeAt=str(int(t.timestamp() * 1000) - 3600000))
        if signed: seed['zz-rt'] = 'rt'
        pg.add_init_script('(()=>{const d=%s;for(const k in d)localStorage.setItem(k,d[k])})()' % json.dumps(seed))
        def api(route):
            path = route.request.url.split('/api/')[1]
            if path == 'auth/refresh' and signed: return route.fulfill(json={'access_token': _tok('u1'), 'refresh_token': 'rt', 'expires_in': 900})
            if path == 'me': return route.fulfill(json={'user': {'id': 'u1', 'display_name': 'User 5678'}, 'entitlements': [{'entitlement': e, 'expires_at': 4102444800000} for e in ents], 'now': 0})
            route.fulfill(status=401, json={})
        pg.route('**/api/**', api); pg.goto('http://127.0.0.1:%d/index.html#/home' % self.port); pg.clock.run_for(2500); pg.wait_for_selector('.zz-welcome.on')
        pg.wait_for_timeout(300); return pg
    def test_returning_evening_continue_and_streak(self):
        pg = self.banner(19, {'vivaState': json.dumps({'streak': {'n': 4}, 'learned': ['q7'], 'recent': ['q7']}), 'zzName': 'Muhtasim Ahmed'})
        self.assertEqual(pg.text_content('.zz-welcome b'), 'Good evening, Muhtasim')
        self.assertEqual(pg.get_attribute('.zz-welcome span a', 'href'), '#/02/q7'); self.assertIn('4-day streak', pg.text_content('.zz-welcome span'))
        box = pg.locator('.zz-welcome').bounding_box(); self.assertLessEqual(box['x'] + box['width'], 390)
        self.assertEqual(pg.evaluate("()=>getComputedStyle(document.querySelector('.zz-welcome')).position"), 'fixed', 'overlay: no layout shift')
    def test_new_user_morning_first_step(self):
        pg = self.banner(8, {'vivaState': '{}'})
        self.assertEqual(pg.text_content('.zz-welcome b'), 'Good morning'); self.assertEqual(pg.get_attribute('.zz-welcome span a', 'href'), '#/01')
    def test_late_night_plan_badges(self):
        pg = self.banner(23, {'vivaState': '{}', 'zzName': 'Ann'}, signed=True, ents=('qna', 'mcq', 'textbook'))
        self.assertEqual(pg.text_content('.zz-welcome b'), 'Studying late, Ann')
        pg.wait_for_selector('.zz-welcome .zw-plan:not([hidden])'); self.assertEqual(pg.text_content('.zz-welcome .zw-plan'), 'All access')
        pg2 = self.banner(14, {'vivaState': '{}'}, signed=True)
        pg2.wait_for_selector('.zz-welcome .zw-plan:not([hidden])'); self.assertEqual(pg2.text_content('.zz-welcome .zw-plan'), 'Free plan')
        self.assertEqual(pg2.text_content('.zz-welcome b'), 'Good afternoon', 'no generated "User 5678" name')
