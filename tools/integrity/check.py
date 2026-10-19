"""One-command differential content integrity check.
  python3 tools/integrity/check.py                      # legacy site (repo root) self-checks: counts, unique ids, qids.json, source links
  python3 tools/integrity/check.py --new dist           # also diff the new (Vite) build against the legacy build
  python3 tools/integrity/check.py --new dist --rebuild-legacy   # rebuild legacy first (~3 min) for a same-commit comparison
Exit code 0 = OK. Any difference is reported as a real mismatch; nothing is frozen, so new content from main never false-fails
as long as legacy and new builds come from the same source commit."""
import sys, os, json, subprocess, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from extract_content import manifest, sha, text, read

def selfcheck(m, root):
    errs = []
    c = m['cards']
    if m['data_rows'] != len(c): errs.append('DATA rows %s != cards %d' % (m['data_rows'], len(c)))
    q = json.load(open(os.path.join(root, 'tools/tests/qids.json')))
    missing = [k for k in q if k not in c and k not in json.load(open(os.path.join(root, 'tools/tests/aliases.json')))]
    if missing: errs.append('shipped ids missing (not aliased): %s' % missing[:10])
    sm = json.load(open(os.path.join(root, 'tools/source_map.json')))
    bad = [k for k in sm if k in c and not c[k]['src']]
    if bad: errs.append('source_map entries without srcbar: %s' % bad[:10])
    return errs

def diff(a, b):
    errs = []
    ca, cb = a['cards'], b['cards']
    for k in sorted(set(ca) | set(cb), key=lambda x: int(x[1:])):
        if k not in cb: errs.append('missing in new: %s' % k)
        elif k not in ca: errs.append('extra in new: %s' % k)
        elif ca[k] != cb[k]:
            errs.append('differs %s: %s' % (k, [f for f in ca[k] if ca[k][f] != cb[k][f]]))
    for f in ('data_rows', 'qmeta_sha', 'qalias_sha', 'views', 'source_map_sha', 'mcqs_sha'):
        if a.get(f) != b.get(f): errs.append('%s differs: %r vs %r' % (f, a.get(f), b.get(f)))
    if a['textbook'] != b['textbook']: errs.append('textbook differs: %s' % sorted(k for k in set(a['textbook']) | set(b['textbook']) if a['textbook'].get(k) != b['textbook'].get(k))[:10])
    return errs

def main():
    args = sys.argv[1:]
    if '--rebuild-legacy' in args: subprocess.check_call([sys.executable, 'tools/build.py'], cwd=ROOT)
    legacy = manifest(ROOT); errs = selfcheck(legacy, ROOT)
    if '--new' in args:
        new = manifest(os.path.join(ROOT, args[args.index('--new') + 1])); errs += diff(legacy, new)
    print('legacy: %d cards, %d views, %d textbook files' % (len(legacy['cards']), len(legacy['views']), len(legacy['textbook'])))
    for e in errs[:50]: print('FAIL', e)
    print('OK' if not errs else 'FAILED (%d)' % len(errs)); return 1 if errs else 0
if __name__ == '__main__': sys.exit(main())
