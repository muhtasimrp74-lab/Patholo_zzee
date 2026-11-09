"""Regenerates the two golden files the tests compare against. Run ONLY after deliberately reviewing a change:
    python3 tools/build.py && python3 tools/tests/gen_manifests.py
qids.json     every question id ever shipped -> short hash of its text (a shifted/renumbered id would orphan users' saved data)
(sw_version.json retired: tools/sw_stamp.py derives VERSION from the content)
aliases.json  reviewed duplicate merges (merged-away id -> surviving id); a NEW fuzzy merge fails the test until added here."""
import re, json, os, hashlib
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); HERE = os.path.dirname(__file__)
def site():
    with open(os.path.join(ROOT, 'index.html'), encoding='utf8') as f: return f.read()
def rows(h):
    m = re.search(r'const DATA=(\[\[.*?\]\]);', h, re.S) or re.search(r'(\[\[\"[A-Z0-9 ]*\", \".*?\]\]);const COLL', h, re.S)
    return json.loads(m.group(1))
def qhash(t): return hashlib.sha1(t.encode('utf8')).hexdigest()[:10]
if __name__ == '__main__':
    h = site(); old = {}
    p = os.path.join(HERE, 'qids.json')
    if os.path.exists(p):
        with open(p, encoding='utf8') as f: old = json.load(f)
    ids = dict(old); ids.update({r[3]: qhash(r[1]) for r in rows(h)})   # ids are only ever added, never dropped
    with open(p, 'w', encoding='utf8') as f: json.dump(dict(sorted(ids.items(), key=lambda kv: int(kv[0][1:]))), f, indent=0)
    al = json.loads(re.search(r'const QALIAS=(\{.*?\});', h).group(1))
    with open(os.path.join(HERE, 'aliases.json'), 'w', encoding='utf8') as f: json.dump(dict(sorted(al.items(), key=lambda kv: int(kv[0][1:]))), f, indent=0)
    import hashlib
    pass   # sw.js VERSION is now a content hash written by tools/sw_stamp.py (build.py); sw_version.json is gone
    print('qids', len(ids), 'aliases', len(al), 'sw', v)
