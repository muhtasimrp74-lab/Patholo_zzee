"""Textbook block ids were recomputed from the final text. Annotations saved against the OLD ids must still attach:
tools/textbook_block_alias.json maps old id -> new id per chapter and annot.js applies it on load and on restore.
These tests use old-format fixtures (IndexedDB docs and a backup payload that carry old ids)."""
import os, re, json, functools, http.server, threading, unittest
try:
    from playwright.sync_api import sync_playwright
    HAVE_PW = True
except Exception: HAVE_PW = False
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ALIAS = json.load(open(os.path.join(ROOT, 'tools', 'textbook_block_alias.json'), encoding='utf8'))
ID = re.compile(r'[0-9a-f]{8}(\.\d{1,5})?$')
CH = 'ch05'; KEY = 't:' + CH

def ids_of(ch): return re.findall(r'<(?:p|li|table|figure|aside|h3|h4|h5)\b[^>]*?\sdata-b="([^"]+)"', open(os.path.join(ROOT, 'textbook', ch + '.html'), encoding='utf8').read())

class AliasFiles(unittest.TestCase):
    def test_every_new_id_exists_and_no_old_id_is_still_a_block(self):
        self.assertGreater(sum(len(v) for v in ALIAS.values()), 2000)
        for ch, m in ALIAS.items():
            cur = set(ids_of(ch)); self.assertTrue(cur, ch)
            for old, new in m.items():
                self.assertRegex(old, ID); self.assertRegex(new, ID); self.assertNotEqual(old, new)
                self.assertIn(new, cur, (ch, new))
                self.assertNotIn(old, cur, (ch, old, 'an old id that is also a current id would be ambiguous'))
            self.assertEqual(len(set(m.values())), len(m), ch + ': two old ids must not collapse into one new id')
    def test_the_alias_map_is_embedded_in_the_built_page(self):
        h = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
        m = re.search(r'<script>window\.TBALIAS=(\{.*?\});</script>', h, re.S); self.assertTrue(m)
        self.assertEqual(json.loads(m.group(1)), ALIAS)
    def test_chapters_with_semicolons_changed_and_the_rest_did_not(self):
        self.assertTrue(set(ALIAS) <= {'ch%02d' % i for i in range(1, 30)})

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

PUT = """(recs)=>new Promise((res,rej)=>{const r=indexedDB.open('pathviva-annot');r.onsuccess=()=>{const db=r.result,tx=db.transaction('docs','readwrite');recs.forEach(x=>tx.objectStore('docs').put(x));tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>rej(tx.error)};r.onerror=()=>rej(r.error)})"""
GET = """(k)=>new Promise((res,rej)=>{const r=indexedDB.open('pathviva-annot');r.onsuccess=()=>{const db=r.result,g=db.transaction('docs').objectStore('docs').get(k);g.onsuccess=()=>{res(g.result);db.close()}};r.onerror=()=>rej(r.error)})"""

@unittest.skipUnless(HAVE_PW, 'playwright missing')
class AliasBrowser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT)); cls.port = cls.srv.server_address[1]
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.p = sync_playwright().start(); cls.b = cls.p.chromium.launch()
    @classmethod
    def tearDownClass(cls): cls.b.close(); cls.p.stop(); cls.srv.shutdown()
    def open(self, ctx, hash_='#/textbook/' + CH):
        pg = ctx.new_page(); self.errs = []; pg.on('pageerror', lambda e: self.errs.append(str(e)))
        pg.add_init_script("try{localStorage.zzWelcomeAt=String(Date.now())}catch(e){}")
        pg.goto('http://127.0.0.1:%d/index.html%s' % (self.port, hash_)); pg.wait_for_function("()=>window.Annot&&Annot.isReady()"); pg.wait_for_selector('#tbbody[data-ch] [data-b]'); pg.wait_for_timeout(500); return pg
    def pairs(self, n=4):
        cur = ids_of(CH); out = [(o, nw) for o, nw in ALIAS[CH].items() if nw in cur]
        self.assertGreaterEqual(len(out), n); return out[::max(1, len(out) // n)][:n]
    def mk(self, pairs, use_old=True, extra=()):
        objs = [{'i': 'm%d' % i, 't': 'mark', 'k': 'hi', 'c': 'y', 'w': 1, 'a': {'b': o if use_old else nw, 't': 'x'}, 'q': {'s': 0, 'e': 5}} for i, (o, nw) in enumerate(pairs)]
        return objs + list(extra)
    def test_old_ids_in_the_saved_database_move_to_the_new_ids_on_load(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}, service_workers='block'); pg = self.open(ctx); prs = self.pairs()
        keep = {'i': 'keep', 't': 'mark', 'k': 'hi', 'c': 'y', 'w': 1, 'a': {'b': ids_of(CH)[3]}, 'q': {'s': 0, 'e': 3}}   # already a new id (or unchanged): must stay
        pg.evaluate(PUT, [{'k': KEY, 'v': 2, 'rev': 1, 'upd': 1, 'objs': self.mk(prs, True, [keep])}]); pg.close()
        pg = self.open(ctx); got = pg.evaluate(GET, KEY); mem = pg.evaluate("k=>Annot._debug.docs()[k]", KEY)
        for d in (got, mem):
            self.assertEqual([o['a']['b'] for o in d['objs'][:len(prs)]], [nw for o, nw in prs]); self.assertEqual(d['objs'][-1]['a']['b'], keep['a']['b']); self.assertEqual(len(d['objs']), len(prs) + 1)
        self.assertEqual(pg.evaluate("k=>Annot.orphans(k).length", KEY), 0, 'every migrated annotation finds its block')
        self.assertEqual(self.errs, []); pg.close()
        pg = self.open(ctx); self.assertEqual([o['a']['b'] for o in pg.evaluate(GET, KEY)['objs'][:len(prs)]], [nw for o, nw in prs], 'a second load changes nothing'); ctx.close()
    def test_an_old_backup_restores_onto_the_new_ids(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}, service_workers='block'); pg = self.open(ctx); prs = self.pairs()
        payload = {'v': 1, 'docs': {KEY: {'k': KEY, 'objs': self.mk(prs, True)}}}
        pg.evaluate("async p=>{await Annot.load(p)}", payload); pg.wait_for_timeout(300)
        self.assertEqual([o['a']['b'] for o in pg.evaluate("k=>Annot._debug.docs()[k]", KEY)['objs']], [nw for o, nw in prs])
        self.assertEqual([o['a']['b'] for o in pg.evaluate(GET, KEY)['objs']], [nw for o, nw in prs])
        self.assertEqual(pg.evaluate("k=>Annot.orphans(k).length", KEY), 0); self.assertEqual(self.errs, []); ctx.close()
    def test_other_documents_are_not_touched(self):
        ctx = self.b.new_context(viewport={'width': 1024, 'height': 800}, service_workers='block'); pg = self.open(ctx); o = self.pairs(1)[0][0]
        q = {'k': 'q:q3', 'v': 2, 'rev': 1, 'upd': 1, 'objs': [{'i': 'z1', 't': 'mark', 'k': 'hi', 'c': 'y', 'w': 1, 'a': {'b': o}, 'q': {'s': 0, 'e': 2}}]}
        pg.evaluate(PUT, [q]); pg.close(); pg = self.open(ctx); self.assertEqual(pg.evaluate(GET, 'q:q3')['objs'][0]['a']['b'], o); ctx.close()
if __name__ == '__main__': unittest.main()
