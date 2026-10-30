"""Run from the repo root:   python3 -m unittest discover -s tools/tests -v
Browser tests need `pip install playwright && playwright install chromium` (skipped when playwright is missing)."""
import os, re, sys, json, hashlib, subprocess, unittest, shutil, tempfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); TOOLS = os.path.join(ROOT, 'tools'); HERE = os.path.dirname(__file__)
sys.path.insert(0, TOOLS); sys.path.insert(0, HERE)
import gen_manifests as G
def rd(p):
    with open(os.path.join(ROOT, p), encoding='utf8') as f: return f.read()
def sha(p):
    with open(os.path.join(ROOT, p), 'rb') as f: return hashlib.sha1(f.read()).hexdigest()
CARD = r'<article class="card" id="(q\d+)"'

class Build(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.before = sha('index.html')
        cls.r = subprocess.run([sys.executable, 'build.py'], cwd=TOOLS, capture_output=True, text=True)
        cls.h = rd('index.full.html')
    def test_build_succeeds_cleanly(self):
        self.assertEqual(self.r.returncode, 0, self.r.stderr)
        for bad in ('UNPLACED', 'no question matches heading', 'heading not in outline'): self.assertNotIn(bad, self.r.stdout)
    def test_committed_index_is_not_stale(self):
        self.assertEqual(self.before, sha('index.html'), 'committed index.html differs from a fresh build: run tools/build.py and commit')
    def test_build_is_deterministic(self):
        first = sha('index.html'); subprocess.run([sys.executable, 'build.py'], cwd=TOOLS, capture_output=True, check=True)
        self.assertEqual(first, sha('index.html'))
    def test_no_italics_in_answer_bodies(self):
        bad = [c for c in re.findall(r'<article class="card" id="q\d+">.*?<div class="ans">(.*?)</div></article>', self.h, re.S) if re.search(r'<(?:em|i)[\s>]', c)]
        self.assertEqual(len(bad), 0, '%d answer bodies contain <em>/<i>: house rule is no italics in answers' % len(bad))
    def test_no_meta_commentary_in_answer_bodies(self):
        pat = re.compile(r'(?i)textbook|build log|outside source')
        bad = [i for i, c in re.findall(r'<article class="card" id="q(\d+)">.*?<div class="ans">(.*?)</div></article>', self.h, re.S) if pat.search(re.sub(r'<[^>]+>', ' ', re.sub(r'<div class="srcbar".*?</div>', '', c, flags=re.S)))]   # the source-link bar is UI (tools/source_links.py), not answer text
        self.assertEqual(bad, [], 'answer bodies must not carry source/meta commentary (log it in answers_build_log.md): q%s' % bad[:5])
    def test_answers_md_has_no_duplicate_headings(self):
        heads = re.findall(r'(?m)^## (.+)$', rd('tools/answers.md')); dup = sorted({h for h in heads if heads.count(h) > 1})
        self.assertEqual(dup, [], 'duplicate ## headings in answers.md (keep only the newest): %s' % dup[:5])
    def test_question_ids_unique_and_complete(self):
        ids = re.findall(CARD, self.h); self.assertEqual(len(ids), len(set(ids)), 'duplicate question ids'); self.assertGreaterEqual(len(ids), 1310)
    def test_data_rows_point_to_real_views_and_cards(self):
        views = set(re.findall(r'<div class="view" id="v-([\w-]+)"', self.h)); cards = set(re.findall(CARD, self.h))
        bad = [r[3] for r in G.rows(self.h) if r[2] not in views or r[3] not in cards]; self.assertFalse(bad, bad[:5])
    def test_internal_links_resolve(self):
        views = set(re.findall(r'<div class="view" id="v-([\w-]+)"', self.h))
        extra = {'topics', 'practice', 'mcqs', 'textbook', 'menu', 'qa', 'questions', 'howto', 'search', 'b', 'account', ''}   # 'b' (By card) and 'account' (acctui.js) are created at runtime by mkView
        miss = {t for t in re.findall(r'href="#/([\w-]+)', self.h) if t not in views | extra}; self.assertFalse(miss, miss)
    def test_inline_scripts_parse(self):
        if not shutil.which('node'): self.skipTest('node missing')
        for i, s in enumerate(re.findall(r'<script>([\s\S]*?)</script>', self.h)):
            with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf8') as f: f.write(s)
            r = subprocess.run(['node', '--check', f.name], capture_output=True, text=True); os.unlink(f.name); self.assertEqual(r.returncode, 0, 'script %d: %s' % (i, r.stderr[:200]))
    def test_every_answer_heading_matches_a_question(self):
        import content
        qs = {it[1] for t in content.TOPICS for it in t[3]}; self.assertFalse([k for k in content.ANSWERS if k not in qs])

class Identity(unittest.TestCase):
    """Stable ids and reviewed duplicate merges."""
    @classmethod
    def setUpClass(cls): cls.h = rd('index.html'); cls.al = json.loads(re.search(r'const QALIAS=(\{.*?\});', cls.h).group(1))
    def test_shipped_ids_keep_their_question(self):
        gold = json.loads(rd('tools/tests/qids.json')); now = {r[3]: G.qhash(r[1]) for r in G.rows(self.h)}
        moved = [i for i, hh in gold.items() if i in now and now[i] != hh]
        gone = [i for i in gold if i not in now and i not in self.al]
        self.assertFalse(moved, 'ids now point at a different question text (positional ids shifted?) %s' % moved[:10])
        self.assertFalse(gone, 'shipped ids vanished without an alias %s' % gone[:10])
    def test_aliases_valid_no_chains_and_reviewed(self):
        cards = set(re.findall(CARD, self.h))
        for a, b in self.al.items():
            self.assertIn(b, cards, 'alias target missing'); self.assertNotIn(b, self.al, 'alias chain %s->%s' % (a, b)); self.assertNotIn(a, cards, 'merged-away card still rendered')
        reviewed = json.loads(rd('tools/tests/aliases.json')); new = {a: b for a, b in self.al.items() if reviewed.get(a) != b}
        self.assertFalse(new, 'new/changed duplicate merges need review, then run tools/tests/gen_manifests.py: %s' % new)
    def test_duplicate_matcher(self):
        import dupmerge as d
        self.assertTrue(d.same(d.key('Define necrosis.'), d.key('Short note on necrosis.')))
        self.assertFalse(d.same(d.key('Causes of necrosis'), d.key('Classify necrosis')))
        self.assertFalse(d.same(d.key('Define apoptosis.'), d.key('Define necrosis.')))

class Schema(unittest.TestCase):
    def test_mcqs(self):
        d = json.loads(rd('tools/mcqs.json')); self.assertEqual(set(d), {'ch', 'q'}); hs = [q['h'] for q in d['q']]
        self.assertEqual(len(hs), len(set(hs)), 'duplicate mcq hash ids')
        for q in d['q']:
            self.assertIsInstance(q['q'], str); self.assertTrue(q['q'].strip()); self.assertIsInstance(q['o'], list); self.assertGreaterEqual(len(q['o']), 2)
            self.assertTrue(all(isinstance(o, str) for o in q['o'])); self.assertTrue((q['a'] in range(len(q['o']))) if isinstance(q['a'], int) else (len(q['a']) == len(q['o']) and set(q['a']) <= {0, 1}), q['h']); self.assertLess(q['c'], len(d['ch']))
    def test_textbook(self):
        d = json.loads(rd('textbook/index.json')); self.assertEqual(len(d['chapters']), 29)
        for c in d['chapters']: self.assertTrue(os.path.exists(os.path.join(ROOT, 'textbook', c['id'] + '.html')), c['id'])
    def test_manifest(self):
        m = json.loads(rd('manifest.json')); self.assertIn('icons', m)
        for i in m['icons']: self.assertTrue(os.path.exists(os.path.join(ROOT, i['src'])), i['src'])

class Pwa(unittest.TestCase):
    def core(self): return re.findall(r"'([^']+)'", re.search(r'const CORE = \[(.*?)\];', rd('sw.js'), re.S).group(1))
    def test_sw_core_files_exist(self): self.assertFalse([f for f in self.core() if not os.path.exists(os.path.join(ROOT, f))])
    def test_every_font_used_is_precached(self):
        used = set(re.findall(r'url\(\s*["\']?(fonts/[\w.-]+\.woff2)', rd('index.html'))); self.assertFalse(used - set(self.core()), used - set(self.core()))
    def test_textbook_chapters_exist(self):
        for i in range(1, 30): self.assertTrue(os.path.exists(os.path.join(ROOT, 'textbook', 'ch%02d.html' % i)), i)
    def test_sw_reports_install_failure_and_cache_gaps(self):
        s = rd('sw.js'); self.assertIn('install failed', s); self.assertIn('diag.json', s)
        if shutil.which('node'): self.assertEqual(subprocess.run(['node', '--check', os.path.join(ROOT, 'sw.js')]).returncode, 0)
    def test_sw_version_bumped_when_site_changes(self):
        # Installed copies only refresh when VERSION changes; a changed index.html with an old VERSION is the stale-offline-copy bug.
        v = re.search(r"const VERSION = '([^']+)'", rd('sw.js')).group(1); p = os.path.join(HERE, 'sw_version.json')
        known = json.loads(rd('tools/tests/sw_version.json')) if os.path.exists(p) else {}
        self.assertIn(v, known, 'VERSION %s is not recorded; if you changed site files this is expected: run gen_manifests/record the new hash' % v)
        self.assertEqual(known[v], sha('index.html'), 'index.html changed but sw.js VERSION (%s) was not bumped' % v)

try:
    from playwright.sync_api import sync_playwright; HAVE_PW = True
except Exception: HAVE_PW = False
URL = 'file://' + os.path.join(ROOT, 'index.full.html')
XSS = '"><img src=x onerror=window.__x=1>'

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class Browser(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls):
        cls.b.close(); cls.p.stop()
        if getattr(cls, 'srv', None): cls.srv.shutdown(); cls.srv.server_close()
    @classmethod
    def http_url(cls):  # the same page over http: Chromium can lose a file:// localStorage write made just before a reload (not over http)
        if not getattr(cls, 'srv', None):
            import http.server, threading, functools
            class Q(http.server.SimpleHTTPRequestHandler):
                def log_message(self, *a): pass
            cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        return 'http://127.0.0.1:%d/index.full.html' % cls.srv.server_address[1]
    def page(self, h='#/', base=None):
        pg = self.b.new_page(); self.errs = []; self.dialogs = []
        pg.add_init_script("try{if(localStorage.getItem('zzWelcomeAt')===null)localStorage.setItem('zzWelcomeAt',String(Date.now()))}catch(e){}")  # returning visitor: no first-run welcome dialog over the page
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        pg.goto((base or URL) + h); pg.wait_for_timeout(500); return pg
    def imp(self, pg, obj):
        pg.evaluate("t=>imp(new File([t],'b.json'))", obj if isinstance(obj, str) else json.dumps(obj)); pg.wait_for_timeout(900); self.ready(pg)
    def ready(self, pg):
        pg.wait_for_function("()=>document.readyState==='complete'&&typeof Annot==='object'&&Annot.isReady()"); pg.wait_for_timeout(500)
    def state(self, pg): return pg.evaluate("()=>localStorage.vivaState")
    def test_pages_load_without_errors(self):
        pg = self.page()
        for h in ('#/', '#/qa', '#/questions', '#/05', '#/mcqs', '#/menu', '#/textbook'): pg.goto(URL + h); pg.wait_for_timeout(300)
        self.assertEqual(self.errs, [])
    def test_malformed_backups_rejected_state_untouched(self):
        pg = self.page(); pg.evaluate("()=>{S.bm=['q1'];S.learned=['q2'];save()}"); before = self.state(pg)
        bad = [{"bm": ["q5"], "learned": "oops"}, {"bm": "x"}, [], {"bm": [], "notes": 5}, {"bm": [], "fav": {"a": 1}}, {"bm": [1]}, {"bm": [], "mcq": []}, {"bm": [], "ink": []}, {"bm": [], "streak": {"n": "x", "last": ""}}, {"bm": [], "sr": None}, "not json {", "null", "42"]
        for b in bad: self.imp(pg, b); self.assertEqual(self.state(pg), before, b)
        self.assertEqual(self.errs, []); self.assertEqual(len(self.dialogs), len(bad))
    def test_failed_ink_restore_rolls_back_everything(self):
        pg = self.page(); pg.evaluate("()=>{S.bm=['q1'];save()}"); before = self.state(pg)
        pg.evaluate("()=>{Ink.load=async()=>{throw new Error('boom')}}"); self.imp(pg, {"bm": ["q9"], "ink": {}})
        self.assertEqual(self.state(pg), before); self.assertTrue(any('could not be restored' in d for d in self.dialogs), self.dialogs)
    def test_import_keeps_previous_state_copy(self):
        pg = self.page(base=self.http_url()); pg.evaluate("()=>{S.bm=['q1'];save()}"); before = self.state(pg); self.imp(pg, {"bm": ["q7"]})
        self.assertEqual(pg.evaluate("()=>localStorage.vivaStatePrev"), before)
    def test_backup_round_trip(self):
        pg = self.page(base=self.http_url()); pg.evaluate("()=>{S.bm=['q3'];S.fav=['q4'];S.learned=['q5'];S.notes={q3:'<b>x</b>'};S.streak={n:3,last:'2026-10-11'};save()}")
        dump = pg.evaluate("()=>JSON.parse(JSON.stringify(Object.assign({},S,{annot:Annot.dump()})))")
        pg.evaluate("()=>{S.bm=[];S.fav=[];S.learned=[];S.notes={};save()}"); self.imp(pg, dump)
        s = json.loads(self.state(pg)); self.assertEqual((s['bm'], s['fav'], s['learned'], s['notes'], s['streak']), (['q3'], ['q4'], ['q5'], {'q3': '<b>x</b>'}, {'n': 3, 'last': '2026-10-11'}))
    def plant(self, pg, tag, js):  # run js once, before the app's scripts, on the next load of pg
        pg.add_init_script("if(!sessionStorage.getItem('%s')){sessionStorage.setItem('%s','1');%s}" % (tag, tag, js))
    def test_corrupt_saved_state_does_not_break_the_page(self):
        # the saved state is planted before the app's scripts run on the reload: a localStorage write made by the old document just before
        # reload() can fail to reach the next one in Chromium (seen in CI and locally, about 1 run in 3), which lost the bookmark and failed this test
        plant = lambda tag, js: pg.add_init_script("if(!sessionStorage.getItem('%s')){sessionStorage.setItem('%s','1');%s}" % (tag, tag, js))
        pg = self.page(); plant('zzT1', "localStorage.vivaState=JSON.stringify({bm:['q1'],learned:'oops',notes:5,fav:{a:1}})"); pg.reload(); self.ready(pg)
        self.assertEqual(self.errs, []); s = pg.evaluate("()=>S"); self.assertEqual(s['bm'], ['q1']); self.assertEqual(s['learned'], []); self.assertEqual(s['notes'], {})
        self.assertIn('oops', pg.evaluate("()=>localStorage.vivaStateCorrupt"))
        plant('zzT2', "localStorage.vivaState='{not json'"); pg.reload(); self.ready(pg); self.assertEqual(self.errs, [])
    # ---- swipe pager (v199+): footer, reading tools, back-to-top and nav shadow must follow the pane that scrolls ----
    TABS = ('#/', '#/questions', '#/qa', '#/mcqs', '#/textbook', '#/menu')
    def phone(self, h='#/', touch=True, w=390, ht=844, still=False):
        pg = self.b.new_page(viewport={'width': w, 'height': ht}, has_touch=touch, is_mobile=touch, reduced_motion='reduce' if still else 'no-preference'); self.errs = []
        pg.add_init_script("try{if(localStorage.getItem('zzWelcomeAt')===null)localStorage.setItem('zzWelcomeAt',String(Date.now()))}catch(e){}")
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.goto(URL + h); pg.wait_for_timeout(900); return pg
    def landed(self, pg):  # the track has come to rest on the active pane (measuring mid-slide reads moving positions)
        pg.wait_for_function("()=>{const T=document.getElementById('zz-pager'),v=document.querySelector('.view:not([hidden])');return !T||!document.documentElement.classList.contains('zz-pg')||Math.abs(T.scrollLeft-[...T.children].indexOf(v)*T.clientWidth)<2}", polling=100, timeout=8000)
        pg.wait_for_timeout(250)
    def test_pager_footer_sits_at_the_end_of_each_tab_pane(self):
        pg = self.phone(still=True)   # instant tab changes: this checks where things end up, not the slide
        for h in self.TABS:
            pg.evaluate("h=>{location.hash=h}", h); pg.wait_for_timeout(300); self.landed(pg)
            r = pg.evaluate("""()=>{const f=document.querySelector('footer.sf'),v=document.querySelector('.view:not([hidden])'),fr=f.getBoundingClientRect();
              const kids=[...v.children].filter(e=>e!==f&&e.getClientRects().length),last=kids[kids.length-1];
              const h1=[...v.querySelectorAll('h1')].find(x=>x.getClientRects().length),hr=h1&&h1.getBoundingClientRect();
              return {inPane:v.contains(f),below:!last||fr.top>=last.getBoundingClientRect().bottom-1,
                h1:!!(hr&&fr.left<hr.right&&hr.left<fr.right&&fr.top<hr.bottom&&hr.top<fr.bottom)}}""")
            self.assertTrue(r['inPane'], h + ': the footer must scroll with the tab pane, not sit in body flow behind the fixed pager')
            self.assertTrue(r['below'], h + ': the footer must come after the last content block'); self.assertFalse(r['h1'], h + ': the footer overlaps the heading')
            fb, bb = pg.evaluate("""async()=>{const s=zzScroller();for(let i=0;i<10;i++){s.scrollTop=s.scrollHeight;await new Promise(r=>setTimeout(r,200))}
              const f=document.querySelector('footer.sf').getBoundingClientRect(),b=document.getElementById('bnav');return [f.bottom,b.getBoundingClientRect().top]}""")
            self.assertLessEqual(fb, bb + 2, h + ': at the end of the pane the footer must sit above the bottom bar, not behind it')
            pg.evaluate("zzScroller().scrollTop=0")
        pg.evaluate("location.hash='#/01'"); pg.wait_for_timeout(700)
        self.assertEqual(pg.evaluate("document.querySelector('footer.sf').parentElement===document.body"), True, 'a sub-page keeps the footer in body flow')
        pg.evaluate("location.hash='#/menu'"); pg.wait_for_timeout(700)
        self.assertEqual(pg.evaluate("document.querySelector('#v-menu').contains(document.querySelector('footer.sf'))"), True, 'back on a tab the footer returns to its pane')
        self.assertEqual(self.errs, [])
    def test_reading_tools_stay_on_screen_on_every_tab(self):
        for w, ht, touch in ((390, 844, True), (1440, 900, False)):
            pg = self.phone(touch=touch, w=w, ht=ht, still=True)   # instant tab changes; measured once the track has landed
            for h in self.TABS[1:] + self.TABS[:1]:
                pg.evaluate("h=>{location.hash=h}", h); pg.wait_for_timeout(300); self.landed(pg)
                r = pg.evaluate("""()=>{const t=document.getElementById('tools').getBoundingClientRect(),n=document.querySelector('.view:not([hidden]) .nav');
                  const ov=e=>{if(!e)return false;const b=e.getBoundingClientRect();return t.left<b.right&&b.left<t.right&&t.top<b.bottom&&b.top<t.bottom};
                  return {on:t.width>0&&t.left>=0&&t.right<=innerWidth,hit:ov(n&&n.querySelector('.logo'))||ov(n&&n.querySelector('.pill'))}}""")
                self.assertTrue(r['on'], '%s at %d: the reading tools strip is off screen' % (h, w)); self.assertFalse(r['hit'], '%s at %d: the reading tools overlap the logo or the menu pill' % (h, w))
            pg.close()
    def settle(self, pg):  # a smooth scroll to the top can take longer than a fixed wait on a loaded CI machine
        try: pg.wait_for_function("()=>zzScroller().scrollTop===0", polling=100, timeout=6000)
        except Exception: pass
    def test_back_to_top_ring_and_footer_button_scroll_the_pane(self):
        pg = self.phone('#/questions', still=True)   # instant jumps: this checks where the buttons take you, not the animation
        pg.evaluate("zzScroller().scrollTop=1800"); pg.wait_for_timeout(500)
        self.assertTrue(pg.evaluate("document.querySelector('.fx-top').classList.contains('on')"), 'the back-to-top ring must appear when the pane is scrolled')
        pg.click('.fx-top'); self.settle(pg); self.assertEqual(pg.evaluate("zzScroller().scrollTop"), 0)
        pg.evaluate("async()=>{const s=zzScroller();for(let i=0;i<10;i++){s.scrollTop=s.scrollHeight;await new Promise(r=>setTimeout(r,150))}}")
        self.assertGreater(pg.evaluate("zzScroller().scrollTop"), 0)
        pg.click('footer.sf .sf-top'); self.settle(pg); self.assertEqual(pg.evaluate("zzScroller().scrollTop"), 0, "the footer's Back to top must scroll the pane")
    def test_nav_shadow_follows_pane_scroll(self):
        pg = self.phone('#/questions')
        pg.evaluate("zzScroller().scrollTop=300"); pg.wait_for_timeout(400)
        self.assertTrue(pg.evaluate("document.documentElement.classList.contains('zz-scrolled')"))
        pg.evaluate("zzScroller().scrollTop=0"); pg.wait_for_timeout(400)
        self.assertFalse(pg.evaluate("document.documentElement.classList.contains('zz-scrolled')"))
    def test_swipe_that_settles_on_the_next_pane_changes_tab_and_moves_the_footer(self):
        pg = self.phone('#/questions', touch=False)
        # leave the track where a finished swipe leaves it, one pane on (CI's headless Chromium does not animate wheel or gesture
        # scrolling of the snap track); the pager must then update the hash and carry the footer into the new pane
        pg.evaluate("()=>{const T=document.getElementById('zz-pager');T.scrollLeft=T.clientWidth*2}")
        pg.wait_for_function("()=>location.hash==='#/qa'", polling=100, timeout=6000); pg.wait_for_timeout(400)
        self.assertTrue(pg.evaluate("document.getElementById('v-qa').contains(document.querySelector('footer.sf'))"))
    def test_service_worker_keeps_the_app_shell_after_visiting_a_legal_page(self):
        base = self.http_url().rsplit('/', 1)[0]; pg = self.b.new_page()
        pg.goto(base + '/index.html#/'); pg.evaluate("()=>navigator.serviceWorker.ready.then(()=>1)"); pg.reload()
        pg.wait_for_function("()=>!!navigator.serviceWorker.controller", polling=200, timeout=20000)
        pg.goto(base + '/terms.html'); pg.wait_for_timeout(1500)
        r = pg.evaluate("""async()=>{const c=await caches.open((await caches.keys()).find(k=>k.startsWith('pathviva-zzee-')));
          const h=await c.match('index.html'),t=await c.match('/terms.html');return [h?(await h.text()).includes('id="bnav"'):null,!!t]}""")
        self.assertEqual(r[0], True, 'visiting terms.html must not overwrite the cached app shell')
        self.assertTrue(r[1], 'terms.html is saved under its own path'); pg.close()
    def test_alias_migration_keeps_progress_and_notes(self):
        al = json.loads(re.search(r'const QALIAS=(\{.*?\});', rd('index.html')).group(1)); a, b = next(iter(al.items()))
        pg = self.page(); self.plant(pg, 'zzA1', "const a=%s;localStorage.vivaState=JSON.stringify({fav:[a],bm:[a],notes:{[a]:'keep me'},learned:[a],sr:{[a]:{d:1}},streak:{n:0,last:''},recent:[],pref:{}})" % (json.dumps(a))); pg.reload(); self.ready(pg)  # planted before load: see test_corrupt_saved_state
        s = pg.evaluate("()=>S")
        for k in ('bm', 'learned', 'fav'): self.assertIn(b, s[k]); self.assertNotIn(a, s[k])
        self.assertIn('keep me', s['notes'].get(b, '')); self.assertIn(b, s['sr'])
    def test_alias_migration_merges_notes_without_loss(self):
        al = json.loads(re.search(r'const QALIAS=(\{.*?\});', rd('index.html')).group(1)); a, b = next(iter(al.items()))
        pg = self.page(); self.plant(pg, 'zzA2', "const a=%s,b=%s;localStorage.vivaState=JSON.stringify({fav:[],bm:[],notes:{[a]:'old note',[b]:'new note'},learned:[],sr:{},streak:{n:0,last:''},recent:[],pref:{}})" % (json.dumps(a), json.dumps(b))); pg.reload(); self.ready(pg)  # planted before load: see test_corrupt_saved_state
        n = pg.evaluate("()=>S.notes")[b]; self.assertIn('old note', n); self.assertIn('new note', n)
    def test_ink_follows_merged_question_on_load_and_import(self):
        al = json.loads(re.search(r'const QALIAS=(\{.*?\});', rd('index.html')).group(1)); a, b = next(iter(al.items())); stroke = {'t': 'p', 'c': '#C4573A', 's': 2, 'p': [1, 1, 5, 5]}
        pg = self.page()
        pg.evaluate("""([a,st])=>new Promise(r=>{const q=indexedDB.open('pathviva-ink',1);q.onupgradeneeded=()=>q.result.createObjectStore('ink',{keyPath:'id'});q.onsuccess=()=>{const t=q.result.transaction('ink','readwrite');t.objectStore('ink').put({id:a,w:600,fs:1,strokes:[st]});t.oncomplete=r}})""", [a, stroke])
        pg.reload(); self.ready(pg); self.assertEqual(list(pg.evaluate("()=>Ink.dump().docs")), ['q:' + b])
        pg.evaluate("()=>Ink.load({})"); pg.wait_for_timeout(300); self.imp(pg, {"bm": [], "ink": {a: {"w": 600, "fs": 1, "strokes": [stroke]}}})
        self.assertEqual(list(pg.evaluate("()=>Ink.dump().docs")), ['q:' + b]); self.assertEqual(self.errs, [])
    def test_hostile_backup_values_never_execute(self):
        pg = self.page(); P = XSS
        self.imp(pg, {"bm": [P], "fav": [P], "learned": [P], "notes": {P: P}, "sr": {P: {"d": 1}}, "recent": [P, {"a": P}], "pref": {"x": P}, "streak": {"n": 1, "last": P},
                      "mcq": {"p": {P: {"n": 1}}, "bm": [P], "hist": [P], "o": {P: P}, "day": {"d": P, "n": 0}, "rd": {P: 1}, "rv": [P], "nt": {P: P}}})
        for h in ('#/', '#/qa', '#/questions', '#/menu', '#/mcqs', '#/practice', '#/05', '#/textbook'): pg.goto(URL + h); pg.wait_for_timeout(350)
        self.assertIsNone(pg.evaluate("()=>window.__x ?? null"), 'script from backup data executed')
    BARS = "()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {hid:document.documentElement.classList.contains('zz-hide'),nav:r('#bnav').top>=innerHeight,tools:r('#tools').bottom<=0}}"
    def test_bars_hide_while_scrolling_down_and_return_on_scroll_up(self):
        for h in ('#/02', '#/'):   # a document-scrolling page and the swipe pager's panes
            pg = self.b.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); self.errs = []; pg.on('pageerror', lambda e: self.errs.append(str(e)))
            # a returning user with a saved name and the exam-date question deferred: no welcome card or prompt locks scrolling
            pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','Test');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
            pg.goto(URL + h); pg.mouse.move(195, 480)   # scroll the content under the finger, not the bar at (0, 0)
            pg.wait_for_function("()=>[document.scrollingElement,...document.querySelectorAll('[class*=pane]')].some(e=>e.scrollHeight>e.clientHeight+400)", timeout=8000); pg.wait_for_timeout(1500)
            for _ in range(3):   # the router scrolls a freshly opened page to the top once: scroll again if that undid the gesture
                for _ in range(6): pg.mouse.wheel(0, 120); pg.wait_for_timeout(60)
                pg.wait_for_timeout(500)
                if pg.evaluate(self.BARS)['hid']: break
            pg.wait_for_timeout(500); self.assertEqual(pg.evaluate(self.BARS), {'hid': True, 'nav': True, 'tools': True}, h + ': scrolling down hides both bars')
            pg.mouse.wheel(0, -60); pg.wait_for_timeout(500); self.assertEqual(pg.evaluate(self.BARS), {'hid': False, 'nav': False, 'tools': False}, h + ': any scroll up brings them back')
            for _ in range(8): pg.mouse.wheel(0, -400); pg.wait_for_timeout(40)
            pg.wait_for_timeout(300); self.assertFalse(pg.evaluate(self.BARS)['hid'], h + ': always shown at the top'); self.assertEqual(self.errs, []); pg.close()
    def test_filter_drawer_is_never_covered_by_the_tab_bar(self):
        for w, ht in ((412, 860), (756, 1210)):   # bottom sheet on phones, side drawer on tablets
            pg = self.phone('#/02', w=w, ht=ht); pg.locator('button:has-text("Filters") >> visible=true').first.click(); pg.wait_for_timeout(700)
            top = pg.evaluate("()=>{const b=[...document.querySelectorAll('#qf button')].find(x=>/^Show/.test(x.textContent.trim())),r=b.getBoundingClientRect(),t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return [b===t||b.contains(t),document.querySelector('#bnav').getBoundingClientRect().top>=innerHeight]}")
            self.assertEqual(top, [True, True], '%d px: the Show button is on top and the tab bar steps aside' % w); pg.close()
    def test_active_tab_has_one_indicator_under_liquid_glass(self):
        pg = self.phone('#/'); pg.evaluate("()=>{S.pref.fx='full';dispatchEvent(new Event('resize'))}"); pg.wait_for_timeout(900)
        if not pg.evaluate("()=>document.documentElement.classList.contains('zz-lgon')"): self.skipTest('Liquid Glass needs Chromium at the Full tier')
        s = pg.evaluate("()=>{const c=getComputedStyle(document.querySelector('#bnav a.on'));return [c.boxShadow,c.backgroundColor]}")
        self.assertEqual(s, ['none', 'rgba(0, 0, 0, 0)'], 'the glass pill is the only indicator (no square-cornered box under it)'); pg.close()
    def test_daily_welcome_does_not_ask_a_known_name_again(self):
        for name, asks in (('Muhtasim', False), (None, True)):
            pg = self.b.new_page(viewport={'width': 412, 'height': 860})
            pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()-3*864e5));%s" % ("localStorage.setItem('zzName','%s')" % name if name else ''))
            pg.goto(URL + '#/'); pg.wait_for_selector('.zz-wd.on'); pg.wait_for_timeout(300)
            self.assertEqual(pg.locator('.zz-wd input').is_visible(), asks, 'name %r' % name); pg.close()
    def test_filters_row_sits_close_to_the_list_it_filters(self):
        pg = self.phone('#/01'); pg.wait_for_timeout(600)
        gap = pg.evaluate("()=>{const f=[...document.querySelectorAll('.tf-row')].find(e=>e.getBoundingClientRect().height>0),h=f.nextElementSibling.querySelector('h2,h3');return h.getBoundingClientRect().top-f.getBoundingClientRect().bottom}")
        self.assertTrue(8 <= gap <= 32, 'gap under the Filters row: %.0f px (was about 65)' % gap); pg.close()
    def test_daily_goal_chips_fit_on_one_line_on_tablets(self):
        pg = self.b.new_page(viewport={'width': 768, 'height': 1024}); pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()))")
        pg.goto(URL + '#/mcqs'); pg.wait_for_selector('#v-mcqs .mx-goal button'); pg.wait_for_timeout(400)
        g = pg.evaluate("()=>{const r=document.querySelector('#v-mcqs .mx-goal'),b=[...r.querySelectorAll('button')],s=getComputedStyle(r.firstElementChild);return {rows:new Set(b.map(x=>Math.round(x.getBoundingClientRect().top))).size,minw:Math.min(...b.map(x=>x.getBoundingClientRect().width)),label:[s.textTransform,+s.fontWeight>=700]}}")
        self.assertEqual(g['rows'], 1, '10 / 20 / 30 / 50 share one line ("50" wrapped alone before)'); self.assertGreaterEqual(g['minw'], 44)
        self.assertEqual(g['label'], ['uppercase', True], 'the GOAL label is in capitals and bold'); pg.close()
    def test_legal_pages_use_the_app_look_in_light_and_dark(self):
        for scheme in ('light', 'dark'):
            pg = self.b.new_page(viewport={'width': 412, 'height': 860}, color_scheme=scheme)
            for f in ('privacy', 'terms', 'refund'):
                pg.goto('file://' + os.path.join(ROOT, f + '.html'))
                s = pg.evaluate("()=>{const b=getComputedStyle(document.body),a=getComputedStyle(document.querySelector('a'));return [b.fontFamily.split(',')[0].trim(),a.color,b.backgroundColor.match(/\\d+/g).slice(0,3).map(Number)]}")
                self.assertEqual(s[0], 'Hanken', f + ': the app font, not the browser default'); self.assertNotEqual(s[1], 'rgb(0, 0, 238)', f + ': links in the app colour')
                self.assertEqual(sum(s[2]) < 200, scheme == 'dark', '%s (%s): background follows the colour scheme %r' % (f, scheme, s[2]))
            pg.close()
    CR = r"""()=>{const h=[...document.querySelectorAll('section.pb p.zz-hi')].find(e=>e.offsetParent);if(!h)return null;const P=c=>c.match(/[\d.]+/g).map(Number),L=a=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(a[0])+.7152*f(a[1])+.0722*f(a[2])};
      const fg=L(P(getComputedStyle(h).color)),bg=L(P(getComputedStyle(h.closest('section.pb')).backgroundColor));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)}"""
    def test_hero_greeting_line_is_readable_on_the_dark_band(self):
        for scheme in ('light', 'dark'):
            for h in ('#/mcqs', '#/textbook'):
                pg = self.b.new_page(viewport={'width': 412, 'height': 860}, color_scheme=scheme); pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','Test')")
                pg.goto(URL + h); pg.wait_for_selector('section.pb p.zz-hi'); cr = pg.evaluate(self.CR)
                self.assertGreaterEqual(cr, 4.5, '%s %s: greeting line contrast %.2f:1 (WCAG AA needs 4.5)' % (scheme, h, cr)); pg.close()
    SWIPE = """async()=>{const T=document.getElementById('zz-pager');let c=0;const o=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(){c++;return o.call(this)};
        T.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const w=T.clientWidth;
        for(let i=1;i<=24;i++){for(let k=0;k<3;k++){T.scrollLeft=w*(i*3+k)/150;T.dispatchEvent(new Event('scroll'))}await new Promise(r=>requestAnimationFrame(()=>r()))}
        Element.prototype.getBoundingClientRect=o;return c}"""
    def test_swiping_between_tabs_does_not_force_layout_every_frame(self):
        # 24 frames with 3 scroll events each: the tab pill used to measure the bar on every event (216 layout reads, a forced
        # synchronous layout each time); now one measurement per gesture and one update per frame
        pg = self.b.new_page(viewport={'width': 412, 'height': 860}, has_touch=True, is_mobile=True)
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(URL + '#/'); pg.wait_for_function("()=>document.documentElement.classList.contains('zz-pg')"); pg.wait_for_timeout(800)
        n = pg.evaluate(self.SWIPE); self.assertLessEqual(n, 12, 'layout reads during a 24-frame swipe: %d' % n); pg.close()
    def test_filter_drawer_opened_on_the_questions_tab_is_not_under_its_scrim(self):   # the owner's screenshot: drawer dimmed by its own scrim
        for w, ht in ((756, 1210), (412, 860)):
            pg = self.b.new_page(viewport={'width': w, 'height': ht}, has_touch=True, is_mobile=True)
            pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
            pg.goto(URL + '#/'); pg.wait_for_timeout(1200); pg.locator('#bnav >> text=Questions').click(); pg.wait_for_timeout(1300)   # through the swipe pager
            pg.locator('button:has-text("Filters") >> visible=true').first.click(); pg.wait_for_timeout(800)
            r = pg.evaluate("()=>{const f=document.getElementById('qf'),b=f.getBoundingClientRect(),pts=[[b.left+b.width/2,b.top+60],[b.left+b.width/2,b.top+b.height/2],[b.left+30,b.bottom-40]];return {onTop:pts.map(([x,y])=>f.contains(document.elementFromPoint(x,y))),caps:[...f.querySelectorAll('h4')].filter(h=>h.offsetParent).map(h=>getComputedStyle(h).textTransform+'/'+getComputedStyle(h).fontWeight)}}")
            self.assertEqual(r['onTop'], [True, True, True], '%d px: the drawer is above the scrim, not dimmed by it' % w)
            self.assertTrue(r['caps'] and all(c == 'uppercase/700' for c in r['caps']), '%d px: section labels in capitals and bold %r' % (w, r['caps'][:3]))
            pg.click('#qscrim', position={'x': w - 20, 'y': 40}); pg.wait_for_timeout(500)
            self.assertFalse(pg.evaluate("()=>document.body.classList.contains('qf-open')"), 'tapping the scrim still closes it'); pg.close()
    def test_systemic_answers_are_upgraded_at_build_time(self):   # tools/answers_upgrade.py via apply_answers_by_id.py
        sys.path.insert(0, os.path.join(ROOT, 'tools')); import answers_upgrade as U
        by = json.load(open(os.path.join(ROOT, 'tools', 'answers_by_id.json'), encoding='utf8'))
        full = open(os.path.join(ROOT, 'index.full.html'), encoding='utf8').read(); pub = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
        card = lambda h, n: re.search(r'<article class="card" id="q%s">.*?<div class="ans">(.*?)</div></article>' % n, h, re.S)
        shown = 0
        for n, a in by.items():
            m = card(full, n); self.assertTrue(m, 'q%s exists' % n); ans = m.group(1); new = U.upgraded(a)
            shown += new[:80] in ans
            self.assertTrue(U.balanced(ans), 'q%s: balanced markup' % n); self.assertNotIn('<br', ans, 'q%s: no stray line breaks' % n)
            self.assertNotRegex(U.text(ans), r'\[[^\]]*[A-Za-z][^\]]*\]', 'q%s: no bracketed glosses' % n)
            pm = card(pub, n)
            if not (pm and len(re.sub(r'<[^>]+>|\s', '', pm.group(1))) > 40):   # paid card: the upgrade stays gated
                self.assertNotIn(new[:80], pub, 'q%s: paid answer stays gated' % n)
        self.assertGreaterEqual(shown, 200, 'upgraded answers reach their cards (%d of %d)' % (shown, len(by)))
        for n, fixes in U.FIXES.items():   # textbook corrections reach their cards
            ans = card(full, n).group(1)
            for f, r in fixes: self.assertIn(r, ans, 'q%s corrected' % n); self.assertNotIn(f, ans)
    def test_cards_share_the_mcq_look_across_tabs(self):   # owner: designs consistent across the app, like the MCQ tab
        for theme in ('light', 'dark'):
            pg = self.phone('#/'); pg.evaluate("t=>{document.documentElement.dataset.theme=t}", theme)
            for h in ('#/mcqs', '#/qa', '#/menu', '#/'): pg.evaluate("h=>{location.hash=h}", h); pg.wait_for_timeout(700)   # tabs render on first visit
            r = pg.evaluate("""()=>{const g=s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e);return [c.borderTopLeftRadius,c.boxShadow]};
                return {mcq:g('#v-mcqs .mx-acc'),qa:g('#v-qa .topic'),hero:g('#v-qa .qa-hero'),home:g('#v-home .nh-prog'),menu:g('#v-menu .zm-list')}}""")
            ref = r.pop('mcq'); self.assertTrue(ref and ref[0] == '28px', '%s: MCQ card %r' % (theme, ref))
            for k, v in r.items():
                self.assertEqual(v, ref, '%s: the %s card matches the MCQ card (corners and shadow)' % (theme, k))
            pg.close()
    def returning(self, h, w=412, ht=860, full=False):
        pg = self.b.new_page(viewport={'width': w, 'height': ht}, has_touch=True, is_mobile=True)
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(URL + h); pg.wait_for_timeout(1000)
        if full: pg.evaluate("()=>{S.pref.fx='full';dispatchEvent(new Event('resize'))}"); pg.wait_for_timeout(1500)
        return pg
    def test_a_swiped_in_tab_does_not_replay_its_entrance_like_a_refresh(self):
        pg = self.returning('#/', full=True)
        r = pg.evaluate("""async()=>{const T=document.getElementById('zz-pager'),before=new Set(document.getAnimations()),seen=new Set();T.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));T.scrollTo({left:T.clientWidth,behavior:'smooth'});
            const t0=performance.now();while(performance.now()-t0<1800){for(const a of document.getAnimations())if(!before.has(a))seen.add(a);await new Promise(r=>requestAnimationFrame(r))}
            const on=a=>a.effect&&a.effect.target;return {entrance:[...seen].filter(a=>on(a)&&on(a).matches&&on(a).matches('h1,h2,.pb-pic img,.nh-bn-pic img')).length,pill:[...seen].filter(a=>on(a)&&on(a).classList&&on(a).classList.contains('fx-pill')).length,hash:location.hash}}""")
        self.assertEqual(r['hash'], '#/questions'); self.assertEqual(r['entrance'], 0, 'the arriving title and picture do not re-animate')
        self.assertLessEqual(r['pill'], 2, 'the tab pill tracks the swipe without easing on every frame (%d transitions)' % r['pill']); pg.close()
    def test_bars_track_the_finger_then_settle(self):
        pg = self.returning('#/02'); pg.mouse.move(200, 480)
        pg.evaluate("()=>window.scrollTo({top:400,behavior:'instant'})"); pg.wait_for_timeout(500)
        pg.evaluate("()=>{window.scrollBy({top:30,behavior:'instant'})}"); pg.wait_for_timeout(30)   # mid-gesture: part of the way
        mid = pg.evaluate("()=>{const r=document.getElementById('bnav').getBoundingClientRect();return [+getComputedStyle(document.getElementById('bnav')).getPropertyValue('--zz-f')||0,r.top<innerHeight&&r.bottom>innerHeight]}")
        self.assertTrue(0 < mid[0] < 1 and mid[1], 'mid-scroll the tab bar is partly away, following the finger: %r' % mid)
        pg.wait_for_timeout(500); end = pg.evaluate("()=>+getComputedStyle(document.getElementById('bnav')).getPropertyValue('--zz-f')")
        self.assertIn(end, (0, 1), 'when the scroll stops the bars settle fully open or closed'); pg.close()
    def test_no_light_strip_under_the_footer(self):
        pg = self.returning('#/', w=412, ht=860); pg.wait_for_timeout(500); pg.mouse.move(200, 480)   # Home: the footer is the last thing on the page
        for _ in range(40): pg.mouse.wheel(0, 600); pg.wait_for_timeout(25)
        pg.wait_for_timeout(800)
        r = pg.evaluate("()=>{const t=document.elementFromPoint(200,innerHeight-6),sf=document.querySelector('#v-home .sf'),bg=sf&&getComputedStyle(sf).backgroundColor;"
                        "const inFooter=!!(t&&t.closest('.sf')),spacer=t&&t.classList&&t.classList.contains('zz-pane')?getComputedStyle(t,'::after').backgroundColor:null;"
                        "return [inFooter||spacer===bg,(t&&(t.className||t.tagName)).toString().slice(0,20),spacer,bg]}")
        self.assertTrue(r[0], 'the bottom of the page is footer-coloured, not a light strip %r' % r[1:]); pg.close()
    def test_home_has_no_progress_map(self):   # owner: the canvas map was confusing; per-chapter progress lives on the Chapters tab
        pg = self.phone('#/'); pg.wait_for_timeout(800)
        self.assertFalse(pg.evaluate("()=>!!document.querySelector('#v-home .nh-col, #v-home .nh-col-c canvas')"))
        self.assertNotIn('Progress map', pg.inner_text('#v-home')); self.assertEqual(self.errs, []); pg.close()
    SMALLTXT = r"""(id)=>{const v=document.getElementById(id),out=[];v.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||e.closest('.ans,#tbbody,svg'))return;
        if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))return;const s=getComputedStyle(e);if(s.visibility==='visible'&&parseFloat(s.fontSize)<12)out.push(s.fontSize+' '+(e.className||e.tagName)+' '+e.textContent.trim().slice(0,12))});return out.slice(0,6)}"""
    def test_interface_text_is_at_least_12px_and_labels_are_capitals(self):
        pg = self.b.new_page(viewport={'width': 412, 'height': 900}, has_touch=True, is_mobile=True)
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(URL + '#/'); pg.wait_for_timeout(1200)
        for h, v in (('#/mcqs', 'v-mcqs'), ('#/', 'v-home'), ('#/qa', 'v-qa'), ('#/questions', 'v-questions'), ('#/textbook', 'v-textbook'), ('#/menu', 'v-menu')):   # all six tabs
            pg.evaluate("h=>{location.hash=h}", h); pg.wait_for_timeout(1200)
            self.assertEqual(pg.evaluate(self.SMALLTXT, v), [], '%s: interface text below 12 px' % h)
        lab = pg.evaluate("()=>[...document.querySelectorAll('#v-home .nh-k,#v-qa .qa-k,#v-mcqs .mx-eb')].map(e=>{const s=getComputedStyle(e);return s.textTransform+'/'+s.fontWeight})")
        self.assertTrue(lab and set(lab) == {'uppercase/700'}, 'section labels in capitals and bold: %r' % sorted(set(lab))); pg.close()
    def test_answer_typography_is_unchanged_so_ink_stays_on_its_words(self):   # baseline measured before the typography pass
        pg = self.b.new_page(viewport={'width': 412, 'height': 900}); pg.goto(URL + '#/02'); pg.wait_for_timeout(1000)
        r = pg.evaluate("()=>{const g=s=>{const c=getComputedStyle(document.querySelector(s));return [c.fontSize,c.lineHeight,c.letterSpacing,c.wordSpacing,c.fontWeight]};return [g('.card .ans p'),g('.card .ans li'),g('.card .ans h4.sub')]}")
        self.assertEqual(r, [['16px', '27.2px', '0.048px', '0px', '400'], ['16px', '25.6px', '0.048px', '0px', '400'], ['15.2px', 'normal', 'normal', '0px', '700']]); pg.close()
    def test_every_tab_is_ready_before_the_first_swipe_and_not_rebuilt_on_arrival(self):   # owner: instant, preloaded like a game
        pg = self.b.new_page(viewport={'width': 412, 'height': 860}, has_touch=True, is_mobile=True, service_workers='block')
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(self.http_url() + '#/'); pg.wait_for_function("()=>document.documentElement.classList.contains('zz-ready')", timeout=10000); pg.wait_for_timeout(1200)
        tabs = pg.evaluate("()=>Object.fromEntries([...document.getElementById('zz-pager').children].map(p=>[p.id.slice(2),[p.querySelectorAll('*').length,p.classList.contains('zz-see'),getComputedStyle(p).visibility]]))")
        for t in ('mcqs', 'textbook'): self.assertGreater(tabs[t][0], 150, '%s is built before anyone visits it: %r' % (t, tabs[t]))
        self.assertEqual(pg.evaluate("()=>[...new Set([...document.querySelectorAll('.qi,.topic')].slice(0,40).map(e=>getComputedStyle(e).contentVisibility))]"), ['visible'])
        for t in ('v-mcqs', 'v-textbook'):
            h, added = pg.evaluate("""async(to)=>{const T=document.getElementById('zz-pager'),P=[...T.children],k=P.findIndex(p=>p.id===to);let n=0;const mo=new MutationObserver(l=>l.forEach(m=>{if(P[k].contains(m.target))n+=m.addedNodes.length}));
                mo.observe(T,{subtree:true,childList:true});T.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));T.scrollTo({left:T.clientWidth*k,behavior:'smooth'});await new Promise(r=>setTimeout(r,1800));mo.disconnect();return [location.hash,n]}""", t)
            self.assertLessEqual(added, 20, '%s: arriving rebuilt the tab (%d nodes added)' % (h, added))
    TAPS = r"""(id)=>{const v=document.getElementById(id),out=[];v.querySelectorAll('button,a[href],[role=button],input,select').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||e.closest('.ans,#tbbody,p,li'))return;
        if(getComputedStyle(e).visibility==='visible'&&(r.height<43.5||r.width<43.5))out.push(Math.round(r.width)+'x'+Math.round(r.height)+' '+(e.className||e.tagName)+' '+e.textContent.trim().slice(0,12))});return out.slice(0,5)}"""
    def test_every_control_is_at_least_44px(self):   # touch targets on all six tabs (inline links inside sentences excepted)
        pg = self.b.new_page(viewport={'width': 412, 'height': 900}, has_touch=True, is_mobile=True)
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(URL + '#/'); pg.wait_for_timeout(1200)
        for h, v in (('#/mcqs', 'v-mcqs'), ('#/', 'v-home'), ('#/questions', 'v-questions'), ('#/qa', 'v-qa'), ('#/textbook', 'v-textbook'), ('#/menu', 'v-menu')):
            pg.evaluate("h=>{location.hash=h}", h); pg.wait_for_timeout(1100); self.assertEqual(pg.evaluate(self.TAPS, v), [], '%s: controls under 44 px' % h)
        pg.close()
    def test_importance_stars_are_one_css_element_each(self):   # ~2,950 <svg><use> pairs were ~180 KB of markup and an extra element each
        pg = self.phone('#/02'); pg.wait_for_timeout(500)
        r = pg.evaluate("()=>[document.querySelectorAll('svg.zs').length,document.querySelectorAll('i.zs').length,getComputedStyle(document.querySelector('i.zs.on')).webkitMaskImage.slice(0,20)]")
        self.assertEqual(r[0], 0); self.assertGreater(r[1], 2000); self.assertTrue(r[2].startswith('url('), r); pg.close()
    def test_keyboard_users_can_skip_to_the_content(self):   # the first Tab shows a skip link; Enter lands in the current tab
        pg = self.phone('#/qa'); pg.wait_for_timeout(600); pg.keyboard.press('Tab')
        r = pg.evaluate("()=>{const a=document.activeElement,b=a.getBoundingClientRect();return [a.className,a.textContent,b.top>=0&&b.bottom<=innerHeight]}")
        self.assertEqual(r, ['zz-skip', 'Skip to content', True], 'first Tab: a visible skip link')
        pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
        self.assertTrue(pg.evaluate("()=>!!document.activeElement.closest('#v-qa')"), 'Enter moves focus into the current tab')
        self.assertNotEqual(pg.evaluate("()=>getComputedStyle(document.activeElement).outlineStyle"), 'none', 'focus is visible'); self.assertEqual(self.errs, []); pg.close()
    OVER = r"""(id)=>{const v=document.getElementById(id),out=[];v.querySelectorAll('*').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||getComputedStyle(e).visibility!=='visible'||r.right<=innerWidth+.5||getComputedStyle(e).position==='fixed')return;
        let p=e.parentElement,clip=false;while(p&&p!==v){if(/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)){clip=true;break}p=p.parentElement}if(!clip)out.push((e.className||e.tagName)+' '+Math.round(r.right))});return out.slice(0,4)}"""
    def test_audit_small_phones_headings_and_labels(self):   # design audit: 320 px overflow, heading levels, label style
        pg = self.b.new_page(viewport={'width': 320, 'height': 800}, has_touch=True, is_mobile=True)
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(URL + '#/'); pg.wait_for_timeout(1200)
        for h, v in (('#/', 'v-home'), ('#/questions', 'v-questions'), ('#/qa', 'v-qa'), ('#/mcqs', 'v-mcqs'), ('#/textbook', 'v-textbook'), ('#/menu', 'v-menu'), ('#/02', 'v-02')):
            pg.evaluate("h=>{location.hash=h}", h); pg.wait_for_timeout(1000); self.assertEqual(pg.evaluate(self.OVER, v), [], '%s: nothing runs off a 320 px screen' % h)
        self.assertEqual(pg.evaluate("()=>[...new Set([...document.querySelectorAll('#v-02 h3.sub')].map(h=>h.getAttribute('aria-level')))]"), ['2'], 'chapter section headings are level 2 under the page h1')
        pg.evaluate("()=>{location.hash='#/mcqs'}"); pg.wait_for_timeout(900)
        t = pg.evaluate("()=>{const s=[...document.querySelectorAll('#v-mcqs small')].find(e=>/Suggested next/i.test(e.textContent));return s?getComputedStyle(s).textTransform:null}")
        self.assertIn(t, ('uppercase', None), 'the Suggested next label follows the capitals rule'); pg.close()
    def test_csp_allows_only_hashed_inline_scripts(self):   # no 'unsafe-inline' for scripts: every inline script is listed by hash
        sys.path.insert(0, os.path.join(ROOT, 'tools')); import csp
        for f in ('index.html', 'index.full.html'):
            s = open(os.path.join(ROOT, f), encoding='utf8').read(); m = re.search(r"script-src ([^;\"]*)", s); self.assertTrue(m, f)
            self.assertNotIn("'unsafe-inline'", m.group(1), f); self.assertEqual(sorted(re.findall(r"'sha256-[^']+'", m.group(1))), csp.hashes(s), f + ': every inline script hashed')
        h = open(os.path.join(ROOT, '_headers'), encoding='utf8').read(); src = re.search(r"script-src ([^;]*)", h).group(1)
        self.assertNotIn("'unsafe-inline'", src); self.assertEqual(sorted(re.findall(r"'sha256-[^']+'", src)), csp.hashes(open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()))
        pg = self.phone('#/'); msgs = []; pg.on('console', lambda m: msgs.append(m.text) if 'Content Security Policy' in m.text else None)
        pg.evaluate("()=>{window.__acc=0;window.zzAccountPage=()=>{window.__acc++};const d=document.createElement('dialog');d.innerHTML='<button data-zz-act=close>x</button>';document.body.append(d);d.showModal();d.querySelector('button').click();window.__open=d.open;const a=document.createElement('button');a.dataset.zzAct='account';document.body.append(a);a.click()}")
        self.assertEqual(pg.evaluate("()=>[window.__open,window.__acc]"), [False, 1], 'delegated buttons close dialogs and open the account page')
        self.assertEqual(msgs, []); self.assertEqual(self.errs, []); pg.close()
    def test_scroll_following_bars_do_not_restyle_the_whole_page(self):   # --zz-f on <html> restyled every element each frame (190-480 ms/s)
        pg = self.returning('#/02'); pg.mouse.move(200, 480); pg.wait_for_timeout(800)
        for _ in range(10): pg.mouse.wheel(0, 60); pg.wait_for_timeout(30)
        pg.wait_for_timeout(100)
        r = pg.evaluate("()=>[document.documentElement.style.getPropertyValue('--zz-f'),document.getElementById('bnav').style.getPropertyValue('--zz-f')]")
        self.assertEqual(r[0], '', 'nothing written on <html>'); self.assertNotEqual(r[1], '', 'the value lives on the bars'); pg.close()
    def test_mcq_home_has_no_loading_shimmer_once_it_is_drawn(self):   # the 120 px shimmer showed above a drawn home while paid MCQs loaded
        pg = self.returning('#/mcqs'); pg.wait_for_selector('#v-mcqs .mx .mx-acc')
        h = pg.evaluate("()=>{const v=document.getElementById('v-mcqs');v.dataset.zzSt='loading';const s=getComputedStyle(v.querySelector('.mx'),'::before');return [s.content,s.display]}")
        self.assertIn(h[1], ('none',), 'no placeholder above a drawn MCQ home %r' % h); pg.close()
    def test_continue_where_you_left_off_follows_your_reading_and_is_readable(self):
        # reading a chapter never counted (S.recent only changed through #/02/q... links), and the shared light card material had
        # turned this dark card's title white-on-white
        pg = self.returning('#/02'); pg.mouse.move(200, 480); pg.wait_for_timeout(800)
        for _ in range(12): pg.mouse.wheel(0, 250); pg.wait_for_timeout(60)
        pg.wait_for_timeout(1500)
        r = pg.evaluate("()=>{const id=S.recent[0],c=id&&document.getElementById(id),b=c&&c.getBoundingClientRect();return [id,!!b&&b.top<innerHeight&&b.bottom>0,c&&c.querySelector('header h4').textContent.trim()]}")
        self.assertTrue(r[0] and r[1], 'the question being read is recorded: %r' % r)
        h4 = pg.evaluate("()=>{const c=[...document.querySelectorAll('#v-02 article.card')][1];c.querySelector('header').click();return [c.id,c.querySelector('header h4').textContent.trim()]}")
        self.assertEqual(pg.evaluate("()=>S.recent[0]"), h4[0], 'tapping a card records it too')
        pg.evaluate("()=>{location.hash='#/'}"); pg.wait_for_timeout(1500)
        t = pg.evaluate("()=>document.querySelector('#v-home .nh-start').innerText")
        self.assertIn('CONTINUE WHERE YOU LEFT OFF', t.upper()); self.assertIn(h4[1][:30], t)
        cr = pg.evaluate(r"""()=>{const s=document.querySelector('#v-home .nh-start'),P=c=>c.match(/[\d.]+/g).map(Number),L=a=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(a[0])+.7152*f(a[1])+.0722*f(a[2])};
            let bg=null,e=s;while(e&&!bg){const v=P(getComputedStyle(e).backgroundColor);if(v.length<4||v[3]>.9)bg=v;e=e.parentElement}const lb=L(bg);
            return [...s.querySelectorAll('.nh-k,.nh-crumb,h2')].map(x=>{const l=L(P(getComputedStyle(x).color));return +((Math.max(l,lb)+.05)/(Math.min(l,lb)+.05)).toFixed(1)})}""")
        self.assertTrue(cr and min(cr) >= 4.5, 'label, crumb and title readable on the card: %r' % cr); pg.close()
    def test_lamplit_book_opens_turns_and_leads_to_the_reader(self):   # Textbook tab: the book on the lamp-lit desk
        ctx = self.b.new_context(viewport={'width': 412, 'height': 900}, reduced_motion='reduce', service_workers='block'); pg = ctx.new_page(); errs = []; msgs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: msgs.append(m.text) if 'Content Security Policy' in m.text else None)
        pg.add_init_script("localStorage.setItem('zzWelcomeAt',String(Date.now()));localStorage.setItem('zzName','T');localStorage.setItem('zzExamAsk',String(Date.now()+7*864e5))")
        pg.goto(self.http_url() + '#/textbook'); pg.wait_for_selector('#v-textbook .ll-cover', timeout=10000)
        nums = lambda: pg.evaluate("()=>[...document.querySelectorAll('#v-textbook .ll-list a span')].map(s=>+s.textContent)")
        self.assertEqual(pg.get_attribute('#v-textbook .ll-cover', 'aria-expanded'), 'false'); pg.click('#v-textbook .ll-cover'); pg.wait_for_timeout(300)
        self.assertEqual(pg.get_attribute('#v-textbook .ll-cover', 'aria-expanded'), 'true'); self.assertEqual(nums(), [1, 2, 3, 4, 5, 6], 'opens on the contents, in order')
        self.assertTrue(pg.evaluate("()=>document.querySelector('#v-textbook .ll').classList.contains('calm')"), 'reduced motion: no 3D motion')
        pg.click('#v-textbook .ll-next'); self.assertEqual(nums(), [7, 8, 9, 10, 11, 12]); pg.keyboard.press('ArrowLeft'); self.assertEqual(nums()[0], 1, 'arrow keys turn the contents')
        self.assertEqual(pg.evaluate("()=>getComputedStyle(document.querySelector('#v-textbook .ll-k')).textTransform"), 'uppercase')
        pg.keyboard.press('Escape'); self.assertEqual(pg.get_attribute('#v-textbook .ll-cover', 'aria-expanded'), 'false', 'Escape closes the book')
        pg.click('#v-textbook .ll-cover'); pg.wait_for_timeout(200); pg.click('#v-textbook .ll-list a >> nth=0'); pg.wait_for_timeout(600)
        self.assertEqual(pg.evaluate('location.hash'), '#/textbook/ch01', 'a chapter opens the reader'); self.assertEqual((errs, msgs), ([], [])); ctx.close()
    def test_idle_page_does_not_keep_rewriting_the_root_class(self):   # liquid.js re-added zz-lgon on every run, retriggering its own observer forever
        pg = self.page('#/mcqs'); pg.wait_for_timeout(1500)
        n = pg.evaluate("()=>new Promise(r=>{let n=0;const mo=new MutationObserver(l=>{n+=l.length});mo.observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme','data-tone']});setTimeout(()=>{mo.disconnect();r(n)},1500)})")
        self.assertEqual(n, 0, 'an idle page leaves <html> attributes alone'); pg.close()
    def test_home_banner_only_on_home_and_cta_works(self):
        pg = self.page(); pg.wait_for_timeout(300)
        self.assertEqual(pg.locator('.nh-banner').count(), 1); self.assertEqual(pg.locator('#v-home h1:visible').count(), 1)
        self.assertGreater(pg.evaluate("()=>document.querySelector('.nh-banner img').naturalWidth"), 0, 'hero image failed to load')
        self.assertEqual(pg.get_attribute('.nh-bn-cta', 'href'), '#/qa'); pg.click('.nh-bn-cta'); pg.wait_for_timeout(500)
        self.assertEqual(pg.evaluate('location.hash'), '#/qa'); self.assertEqual(pg.locator('.nh-banner:visible').count(), 0)
        for h in ('#/questions', '#/05', '#/mcqs', '#/textbook', '#/menu'): pg.goto(URL + h); pg.wait_for_timeout(300); self.assertEqual(pg.locator('.nh-banner:visible').count(), 0, h)
        self.assertEqual(self.errs, [])
    def test_home_banner_responsive_no_overflow(self):
        for w, h in ((1440, 900), (820, 1100), (390, 844), (360, 740)):
            pg = self.b.new_page(viewport={'width': w, 'height': h}); pg.goto(URL + '#/'); pg.wait_for_timeout(700)
            self.assertFalse(pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth"), 'horizontal overflow at %d' % w)
            r = pg.evaluate("()=>{const b=document.querySelector('.nh-banner').getBoundingClientRect(),c=document.querySelector('.nh-bn-cta').getBoundingClientRect();return [b.height,c.bottom,c.right<=innerWidth]}")
            self.assertTrue(r[2], w); self.assertLess(r[1], h, 'CTA below the fold at %d' % w)
            if w >= 1000: self.assertTrue(420 <= r[0] <= 500, r[0])
            pg.close()
    def test_tab_banners_present_load_and_do_not_overflow(self):
        tabs = {'questions': 'Questions', 'qa': 'Chapters', 'mcqs': 'MCQs', 'textbook': 'Textbook', 'menu': 'Menu'}
        for w, h in ((1440, 900), (820, 1000), (390, 844)):
            pg = self.b.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            for r, t in tabs.items():
                pg.goto(URL + '#/' + r); pg.wait_for_timeout(500)
                self.assertEqual(pg.locator('#v-%s .pb' % r).count(), 1, r)
                self.assertGreater(pg.evaluate("()=>document.querySelector('#v-%s .pb img').naturalWidth" % r), 0, 'banner image failed: ' + r)
                self.assertEqual(pg.locator('#v-%s h1:visible' % r).count(), 1, r); self.assertEqual(pg.inner_text('#v-%s h1' % r).strip(), t)
                self.assertFalse(pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth"), 'overflow %s at %d' % (r, w))
            pg.goto(URL + '#/05'); pg.wait_for_timeout(300); self.assertEqual(pg.locator('.pb:visible').count(), 0, 'banner leaked onto a topic page')
            self.assertEqual(errs, []); pg.close()
    def test_questions_default_collapsed_and_filters(self):
        pg = self.page('#/questions'); pg.wait_for_timeout(300)
        self.assertEqual(pg.eval_on_selector_all('#qlist .qs-h', 'e=>e.filter(x=>x.getAttribute("aria-expanded")==="true").length'), 0)
        pg.click('[data-qv=W]'); pg.wait_for_timeout(200); self.assertIn('of', pg.inner_text('#qsum'))
    def test_bookmark_and_note_workflow(self):
        pg = self.page('#/05'); pg.wait_for_timeout(300); c = pg.query_selector('#v-05 .card'); self.assertIsNotNone(c); cid = c.get_attribute('id')
        c.query_selector('.act[data-k="bm"]').click(); self.assertIn(cid, pg.evaluate("()=>S.bm"))
        c.query_selector('.act[data-k="notes"]').click(); c.query_selector('textarea').fill('my <i>note</i>'); pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate("id=>S.notes[id]", cid), 'my <i>note</i>'); self.assertEqual(self.errs, [])
if __name__ == '__main__': unittest.main()
