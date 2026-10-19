"""Fast tests for the content JSON generator + differential check (no browser). Generates into a temp dir."""
import os, sys, json, shutil, tempfile, unittest
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'integrity'))
import content_json, check_content_json, schema_lite

class ContentJson(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp(); cls.man = content_json.write(content_json.build(ROOT), cls.tmp)
    @classmethod
    def tearDownClass(cls): shutil.rmtree(cls.tmp, ignore_errors=True)
    def test_counts_and_clean_check(self):
        self.assertEqual(self.man['counts']['questions'], 1310)
        errs, _ = check_content_json.check(self.tmp, ROOT); self.assertEqual(errs, [])
    def test_generation_is_deterministic(self):
        t2 = tempfile.mkdtemp()
        try:
            m2 = content_json.write(content_json.build(ROOT), t2); self.assertEqual(m2, self.man)
        finally: shutil.rmtree(t2, ignore_errors=True)
    def _tampered(self, fn):
        t = tempfile.mkdtemp(); shutil.rmtree(t); shutil.copytree(self.tmp, t)
        try: fn(t); return check_content_json.check(t, ROOT)[0]
        finally: shutil.rmtree(t, ignore_errors=True)
    def test_detects_changed_answer_text(self):
        def f(t):
            p = os.path.join(t, 'questions', sorted(os.listdir(os.path.join(t, 'questions')))[0]); d = json.load(open(p))
            d['cards'][0]['html'] = d['cards'][0]['html'].replace('</div>', 'X</div>', 1); json.dump(d, open(p, 'w'))
        self.assertTrue(self._tampered(f))
    def test_detects_schema_violation_and_missing_card(self):
        def f(t):
            p = os.path.join(t, 'questions', sorted(os.listdir(os.path.join(t, 'questions')))[0]); d = json.load(open(p))
            d['cards'].pop(); d['cards'][0]['id'] = 'bad'; json.dump(d, open(p, 'w'))
        errs = self._tampered(f); self.assertTrue(any('card missing' in e or 'bad' in e or 'pattern' in e for e in errs))
    def test_stdlib_fallback_validator_matches_on_samples(self):
        sch = json.load(open(os.path.join(ROOT, 'tools/schemas/chapter.schema.json'))); good = json.load(open(os.path.join(self.tmp, 'textbook/ch01.json')))
        errs = []; schema_lite._check(good, sch, '$', errs); self.assertEqual(errs, [])
        bad = dict(good, n='x', extra=1); errs = []; schema_lite._check(bad, sch, '$', errs); self.assertEqual(len(errs), 2)
if __name__ == '__main__': unittest.main()
