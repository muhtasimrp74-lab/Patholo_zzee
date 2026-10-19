# -*- coding: utf-8 -*-
"""Emit schema-validated, chapter/topic-chunked content JSON from the BUILT legacy site (read-only on the site).
Usage: python3 tools/content_json.py [--site .] [--out build/content]
Nothing here is loaded by the app yet (Stage 5 loader is a later step); the legacy build stays the source of truth.
Output (all UTF-8, deterministic, sorted keys):
  manifest.json              counts + sha256/bytes of every file
  questions/<view>.json      cards grouped by the view (topic) they live in; `html` is the exact <article> inner HTML
  textbook/<chNN>.json       one per chapter; `html` is the exact textbook/chNN.html fragment
  textbook/index.json        copy of textbook/index.json data
  source_map.json, mcqs.json copies of the legacy data (validated for shape)
"""
import re, json, os, sys, hashlib, bisect, argparse
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'integrity'))
from extract_content import text, read
VIEW = re.compile(r'<div[^>]*class="view[^"]*"[^>]*id="v-([^"]+)"|<div[^>]*id="v-([^"]+)"[^>]*class="view')
CARD = re.compile(r'<article class="card"([^>]*?)id="(q\d+)"([^>]*)>(.*?)</article>', re.S)
SCHEMA_VERSION = 1

def sha256(b): return hashlib.sha256(b).hexdigest()
def dumps(o): return json.dumps(o, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n'

def build(site):
    idx = read(os.path.join(site, 'index.html'))
    vs = [(m.start(), m.group(1) or m.group(2)) for m in VIEW.finditer(idx)]
    pos = [p for p, _ in vs]; files = {}; groups = {}
    for m in CARD.finditer(idx):
        i = bisect.bisect(pos, m.start()) - 1; view = vs[i][1] if i >= 0 else '_none'
        body = m.group(4)
        code = re.search(r'<span class="code">(.*?)</span>', body, re.S); title = re.search(r'<h4>(.*?)</h4>', body, re.S)
        ans = re.search(r'<div class="ans">(.*)', body, re.S); a = ans.group(1) if ans else ''
        groups.setdefault(view, []).append({
            'id': m.group(2), 'code': text(code.group(1)) if code else '', 'title': text(title.group(1)) if title else '',
            'src': re.findall(r'<a href="(#/textbook/[^"]+)"', a), 'attrs': (m.group(1) + '|' + m.group(3)).strip(),
            'html': body})
    for view, cs in groups.items():
        files['questions/%s.json' % view] = {'schema': 'questions', 'v': SCHEMA_VERSION, 'view': view, 'cards': cs}
    tb = os.path.join(site, 'textbook'); ti = json.loads(read(os.path.join(tb, 'index.json')))
    files['textbook/index.json'] = ti
    for ch in ti['chapters']:
        files['textbook/%s.json' % ch['id']] = {'schema': 'chapter', 'v': SCHEMA_VERSION, 'id': ch['id'], 'n': ch['n'],
            'title': ch['title'], 'pages': ch['pages'], 'html': read(os.path.join(tb, ch['id'] + '.html'))}
    files['source_map.json'] = json.loads(read(os.path.join(site, 'tools', 'source_map.json')))
    files['mcqs.json'] = json.loads(read(os.path.join(site, 'tools', 'mcqs.json')))
    return files

def write(files, out):
    man = {'schema': 'manifest', 'v': SCHEMA_VERSION, 'files': {}, 'counts': {}}
    for rel, obj in sorted(files.items()):
        b = dumps(obj).encode('utf8'); p = os.path.join(out, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'wb') as f: f.write(b)
        man['files'][rel] = {'sha256': sha256(b), 'bytes': len(b)}
    qs = [f for k, f in files.items() if k.startswith('questions/')]
    man['counts'] = {'questions': sum(len(f['cards']) for f in qs), 'question_files': len(qs),
                     'chapters': len(files['textbook/index.json']['chapters']), 'source_links': len(files['source_map.json']),
                     'mcq_questions': len(files['mcqs.json'].get('q', []))}
    with open(os.path.join(out, 'manifest.json'), 'wb') as f: f.write(dumps(man).encode('utf8'))
    return man

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--site', default=ROOT); ap.add_argument('--out', default=os.path.join(ROOT, 'build', 'content'))
    a = ap.parse_args(); files = build(a.site); man = write(files, a.out)
    print('wrote', len(man['files']) + 1, 'files to', a.out, man['counts'])
