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
        cls.h = rd('index.html')
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
        extra = {'topics', 'practice', 'mcqs', 'textbook', 'menu', 'qa', 'questions', 'howto', 'search', 'b', ''}   # 'b' (By card) is created at runtime by mkView
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
URL = 'file://' + os.path.join(ROOT, 'index.html')
XSS = '"><img src=x onerror=window.__x=1>'

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class Browser(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop()
    def page(self, h='#/'):
        pg = self.b.new_page(); self.errs = []; self.dialogs = []
        pg.on('pageerror', lambda e: self.errs.append(str(e))); pg.on('dialog', lambda d: (self.dialogs.append(d.message), d.accept()))
        pg.goto(URL + h); pg.wait_for_timeout(500); return pg
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
        pg = self.page(); pg.evaluate("()=>{S.bm=['q1'];save()}"); before = self.state(pg); self.imp(pg, {"bm": ["q7"]})
        self.assertEqual(pg.evaluate("()=>localStorage.vivaStatePrev"), before)
    def test_backup_round_trip(self):
        pg = self.page(); pg.evaluate("()=>{S.bm=['q3'];S.fav=['q4'];S.learned=['q5'];S.notes={q3:'<b>x</b>'};S.streak={n:3,last:'2026-10-11'};save()}")
        dump = pg.evaluate("()=>JSON.parse(JSON.stringify(Object.assign({},S,{annot:Annot.dump()})))")
        pg.evaluate("()=>{S.bm=[];S.fav=[];S.learned=[];S.notes={};save()}"); self.imp(pg, dump)
        s = json.loads(self.state(pg)); self.assertEqual((s['bm'], s['fav'], s['learned'], s['notes'], s['streak']), (['q3'], ['q4'], ['q5'], {'q3': '<b>x</b>'}, {'n': 3, 'last': '2026-10-11'}))
    def test_corrupt_saved_state_does_not_break_the_page(self):
        pg = self.page(); pg.evaluate("()=>{localStorage.vivaState=JSON.stringify({bm:['q1'],learned:'oops',notes:5,fav:{a:1}})}"); pg.reload(); self.ready(pg)
        self.assertEqual(self.errs, []); s = pg.evaluate("()=>S"); self.assertEqual(s['bm'], ['q1']); self.assertEqual(s['learned'], []); self.assertEqual(s['notes'], {})
        self.assertIn('oops', pg.evaluate("()=>localStorage.vivaStateCorrupt"))
        pg.evaluate("()=>localStorage.vivaState='{not json'"); pg.reload(); self.ready(pg); self.assertEqual(self.errs, [])
    def test_alias_migration_keeps_progress_and_notes(self):
        al = json.loads(re.search(r'const QALIAS=(\{.*?\});', rd('index.html')).group(1)); a, b = next(iter(al.items()))
        pg = self.page(); pg.evaluate("([a])=>{localStorage.vivaState=JSON.stringify({fav:[a],bm:[a],notes:{[a]:'keep me'},learned:[a],sr:{[a]:{d:1}},streak:{n:0,last:''},recent:[],pref:{}})}", [a]); pg.reload(); self.ready(pg)
        s = pg.evaluate("()=>S")
        for k in ('bm', 'learned', 'fav'): self.assertIn(b, s[k]); self.assertNotIn(a, s[k])
        self.assertIn('keep me', s['notes'].get(b, '')); self.assertIn(b, s['sr'])
    def test_alias_migration_merges_notes_without_loss(self):
        al = json.loads(re.search(r'const QALIAS=(\{.*?\});', rd('index.html')).group(1)); a, b = next(iter(al.items()))
        pg = self.page(); pg.evaluate("([a,b])=>{localStorage.vivaState=JSON.stringify({fav:[],bm:[],notes:{[a]:'old note',[b]:'new note'},learned:[],sr:{},streak:{n:0,last:''},recent:[],pref:{}})}", [a, b]); pg.reload(); self.ready(pg)
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
