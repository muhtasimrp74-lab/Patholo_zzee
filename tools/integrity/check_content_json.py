"""Differential check of the generated content JSON (tools/content_json.py output) against the built legacy site.
  python3 tools/content_json.py && python3 tools/integrity/check_content_json.py [--json build/content] [--site .]
Checks: every file validates against tools/schemas; manifest sha256/bytes match files; every legacy card is present
exactly once with identical id/code/title/answer hashes/source links; chapter HTML and mcqs/source_map are byte-identical
in content to the legacy files; counts agree. Exit 0 = OK."""
import sys, os, json, hashlib, argparse
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from extract_content import cards, sha, text, read
import schema_lite
import re

def load(p):
    with open(p, encoding='utf8') as f: return json.load(f)

def check(jdir, site):
    errs = []; sch = {n: load(os.path.join(ROOT, 'tools', 'schemas', n + '.schema.json')) for n in ('questions', 'chapter', 'manifest')}
    man = load(os.path.join(jdir, 'manifest.json'))
    errs += ['manifest: ' + e for e in schema_lite.validate(man, sch['manifest'])]
    for rel, meta in man['files'].items():
        p = os.path.join(jdir, rel)
        if not os.path.exists(p): errs.append('manifest lists missing file %s' % rel); continue
        b = open(p, 'rb').read()
        if hashlib.sha256(b).hexdigest() != meta['sha256'] or len(b) != meta['bytes']: errs.append('hash/size mismatch %s' % rel)
        kind = 'questions' if rel.startswith('questions/') else 'chapter' if rel.startswith('textbook/ch') else None
        if kind: errs += ['%s: %s' % (rel, e) for e in schema_lite.validate(json.loads(b), sch[kind])[:5]]
    on_disk = {os.path.relpath(os.path.join(d, f), jdir) for d, _, fs in os.walk(jdir) for f in fs} - {'manifest.json'}
    if on_disk != set(man['files']): errs.append('files on disk differ from manifest: %s' % sorted(on_disk ^ set(man['files']))[:5])
    # differential: cards
    legacy = cards(read(os.path.join(site, 'index.html'))); seen = {}
    for rel in man['files']:
        if not rel.startswith('questions/'): continue
        for c in load(os.path.join(jdir, rel))['cards']:
            if c['id'] in seen: errs.append('duplicate card %s' % c['id'])
            seen[c['id']] = c
    for k in sorted(set(legacy) | set(seen), key=lambda x: (not x[1:].isdigit(), int(x[1:]) if x[1:].isdigit() else 0, x)):
        if k not in seen: errs.append('card missing in JSON: %s' % k); continue
        if k not in legacy: errs.append('extra card in JSON: %s' % k); continue
        c = seen[k]; l = legacy[k]
        ans = c['html'].split('<div class="ans">', 1); a = ans[1] if len(ans) > 1 else ''
        a_nosrc = re.sub(r'<div class="srcbar">.*?</div>', '', a, flags=re.S)
        got = {'code': c['code'], 'title': c['title'], 'ans_text_sha': sha(text(a_nosrc)), 'ans_html_sha': sha(a_nosrc), 'src': c['src']}
        if got != l: errs.append('card %s differs: %s' % (k, [f for f in l if l[f] != got[f]]))
    # chapters
    ti = load(os.path.join(site, 'textbook', 'index.json'))
    for ch in ti['chapters']:
        rel = 'textbook/%s.json' % ch['id']
        if rel not in man['files']: errs.append('chapter missing %s' % rel); continue
        if load(os.path.join(jdir, rel))['html'] != read(os.path.join(site, 'textbook', ch['id'] + '.html')): errs.append('chapter html differs %s' % ch['id'])
    if load(os.path.join(jdir, 'textbook/index.json')) != ti: errs.append('textbook index differs')
    for rel, src in (('source_map.json', 'tools/source_map.json'), ('mcqs.json', 'tools/mcqs.json')):
        if load(os.path.join(jdir, rel)) != load(os.path.join(site, src)): errs.append('%s differs' % rel)
    sm = load(os.path.join(site, 'tools/source_map.json'))
    if man['counts']['questions'] != len(legacy): errs.append('count questions %s != %d' % (man['counts']['questions'], len(legacy)))
    if man['counts']['source_links'] != len(sm): errs.append('count source_links mismatch')
    return errs, man

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--json', default=os.path.join(ROOT, 'build', 'content')); ap.add_argument('--site', default=ROOT)
    a = ap.parse_args(); errs, man = check(a.json, a.site)
    print('validator:', schema_lite.BACKEND, '| files:', len(man['files']), '| counts:', man['counts'])
    for e in errs[:50]: print('FAIL', e)
    print('OK' if not errs else 'FAILED (%d)' % len(errs)); return 1 if errs else 0
if __name__ == '__main__': sys.exit(main())
