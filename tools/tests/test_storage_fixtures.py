"""Old-format user data must still load and survive a normal session untouched (Stage 1 safety net, reused in Stage 3).
Seeds localStorage with tools/tests/fixtures/old_user_data.json before the app starts, loads the built site,
and checks the data is shown in the UI and persisted values are not lost or rewritten destructively."""
import json, os, unittest
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FIX = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures', 'old_user_data.json')))
SITE = os.environ.get('SITE_URL') or 'file://' + os.path.join(ROOT, 'index.html')

class OldData(unittest.TestCase):
    @classmethod
    def setUpClass(c):
        c.pw = sync_playwright().start(); c.b = c.pw.chromium.launch()
    @classmethod
    def tearDownClass(c): c.b.close(); c.pw.stop()
    def page(self):
        p = self.b.new_page()
        seed = {k: (v if isinstance(v, str) else json.dumps(v)) for k, v in FIX.items()}
        p.add_init_script("if(!sessionStorage.__seeded){sessionStorage.__seeded=1;const d=%s;for(const k in d)localStorage.setItem(k,d[k])}" % json.dumps(seed))
        return p
    def test_state_survives_load_and_save(self):
        p = self.page(); p.goto(SITE); p.wait_for_timeout(1500)
        p.goto(SITE + '#/bookmarks'); p.wait_for_timeout(800)
        self.assertGreaterEqual(p.locator('#q3').count(), 1)          # bookmarked card is listed
        st = json.loads(p.evaluate("localStorage.vivaState"))
        self.assertEqual(st['notes']['q3'], 'fixture note: BP thresholds')
        self.assertEqual(st['notes']['q25'], 'second note')
        self.assertIn('q10', st['learned']); self.assertIsInstance(st['streak']['n'], int); self.assertGreaterEqual(st['streak']['n'], 1)   # streak may legitimately roll over, never vanish
        self.assertEqual(json.loads(p.evaluate("localStorage.tbDone")), FIX['tbDone'])
        self.assertEqual(json.loads(p.evaluate("localStorage.tbPos")), FIX['tbPos'])
        self.assertEqual(p.evaluate("localStorage.tbLast"), 'ch01')
        self.assertEqual(p.evaluate("localStorage.vivaStateCorrupt"), None)
        p.close()
    def test_corrupt_state_is_kept_not_overwritten(self):
        p = self.b.new_page()
        p.add_init_script("if(!sessionStorage.__s){sessionStorage.__s=1;localStorage.setItem('vivaState','{not json')}")
        p.goto(SITE); p.wait_for_timeout(1500)
        keys = p.evaluate("Object.keys(localStorage)")
        raw = p.evaluate("localStorage.vivaState || ''")
        kept = p.evaluate("localStorage.vivaStateCorrupt || ''")
        self.assertTrue(raw == '{not json' or kept == '{not json', (keys, raw[:50], kept[:50]))
        p.close()
if __name__ == '__main__': unittest.main()

class OldAnnotDB(unittest.TestCase):
    """IndexedDB 'pathviva-annot' v1 (stores docs/meta, keyPath k): a record written under the old schema must be unchanged after reload."""
    def test_annotation_record_survives_reload(self):
        pw = sync_playwright().start()
        try:
            b = pw.chromium.launch(); p = b.new_page(); p.goto(SITE); p.wait_for_timeout(2500)
            rec = {'k': 'q:q3', 'objs': [{'t': 'p', 'c': '#C4573A', 's': 2, 'p': [1, 1, 5, 5]}]}
            p.evaluate("""(rec)=>new Promise((res,rej)=>{const r=indexedDB.open('pathviva-annot');r.onsuccess=()=>{const db=r.result;
                const tx=db.transaction('docs','readwrite');tx.objectStore('docs').put(rec);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>rej(tx.error)};r.onerror=()=>rej(r.error)})""", rec)
            p.reload(); p.wait_for_timeout(2500)
            got = p.evaluate("""()=>new Promise((res,rej)=>{const r=indexedDB.open('pathviva-annot');r.onsuccess=()=>{const db=r.result;
                const g=db.transaction('docs').objectStore('docs').get('q:q3');g.onsuccess=()=>{res({v:db.version,stores:[...db.objectStoreNames],rec:g.result});db.close()}};r.onerror=()=>rej(r.error)})""")
            self.assertEqual(got['v'], 1); self.assertEqual(sorted(got['stores']), ['docs', 'meta'])
            self.assertEqual(got['rec']['objs'], rec['objs'])
            b.close()
        finally: pw.stop()
