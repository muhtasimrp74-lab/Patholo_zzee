# -*- coding: utf-8 -*-
"""Split the FULL built site into a gated index.html plus private per-topic chunks (deterministic).
Usage: python3 tools/build.py && python3 tools/gate.py
Writes: private-chunks/<id>.json (gitignored, every chunk incl. free), content/manifest.json, content/titles.json, gated index.html.
Free sample (kept inline/static): question topic FREE_VIEW, MCQ chapter 1, textbook ch01."""
import re, os, json, hashlib, bisect, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FREE_VIEW, FREE_MCQ, FREE_TB = '01', 0, 'ch01'
MAX_BYTES = 1_000_000
VIEW = re.compile(r'<div[^>]*class="view[^"]*"[^>]*id="v-([^"]+)"|<div[^>]*id="v-([^"]+)"[^>]*class="view')
CARD = re.compile(r'<article class="card"[^>]*?id="(q\d+)"[^>]*>(.*?)</article>', re.S)
ANS = '<div class="ans">'
MCQ_A, MCQ_B = 'const MCQDATA=', ';\n'

def dumps(o): return json.dumps(o, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
def txt(h): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h)).strip()

def gate(root=ROOT):
    p = os.path.join(root, 'index.html'); s = open(p, encoding='utf8').read()
    if '<div class="ans" data-zz=' in s: sys.exit('index.html is already gated: run tools/build.py first')
    vs = [(m.start(), m.group(1) or m.group(2)) for m in VIEW.finditer(s)]; pos = [x for x, _ in vs]
    chunks, titles, out, last = {}, [], [], 0
    for m in CARD.finditer(s):
        view = vs[bisect.bisect(pos, m.start()) - 1][1]; body = m.group(2); k = body.find(ANS)
        assert k > 0 and body.endswith('</div>'), m.group(1)
        inner = body[k + len(ANS):-6]
        h4 = re.search(r'<h4>(.*?)</h4>', body, re.S); code = re.search(r'<span class="code">(.*?)</span>', body, re.S)
        titles.append([m.group(1), view, txt(code.group(1)) if code else '', txt(h4.group(1)) if h4 else ''])
        chunks.setdefault('q-' + view, {'kind': 'q', 'topic': view, 'cards': {}})['cards'][m.group(1)] = inner
        if view != FREE_VIEW:
            a = m.start(2) + k
            out += [s[last:a], '<div class="ans" data-zz="q-%s"></div>' % view]; last = m.end(2)
    out.append(s[last:]); s = ''.join(out)
    i = s.index(MCQ_A) + len(MCQ_A); j = s.index(MCQ_B, i); mcq = json.loads(s[i:j])
    for q in mcq['q']: chunks.setdefault('mcq-%02d' % (q['c'] + 1), {'kind': 'mcq', 'topic': str(q['c'] + 1), 'q': []})['q'].append(q)
    free = dict(mcq, q=[q for q in mcq['q'] if q['c'] == FREE_MCQ])
    s = s[:i] + json.dumps(free, ensure_ascii=False, separators=(',', ':')) + s[j:]
    tbi = json.load(open(os.path.join(root, 'textbook', 'index.json'), encoding='utf8'))
    for ch in tbi['chapters']:
        chunks['tb-' + ch['id']] = {'kind': 'tb', 'topic': ch['id'], 'html': open(os.path.join(root, 'textbook', ch['id'] + '.html'), encoding='utf8').read()}
    tnames = {'q': {v: v for _, v in vs}, 'tb': {c['id']: c['title'] for c in tbi['chapters']}, 'mcq': {str(n + 1): c[0] for n, c in enumerate(mcq['ch'])}}
    man = {'v': 1, 'free': {'q': 'q-' + FREE_VIEW, 'mcq': 'mcq-%02d' % (FREE_MCQ + 1), 'tb': 'tb-' + FREE_TB}, 'chunks': {}}
    od = os.path.join(root, 'private-chunks'); os.makedirs(od, exist_ok=True)
    for f in os.listdir(od):
        if f.endswith('.json'): os.remove(os.path.join(od, f))
    for cid in sorted(chunks):
        c = chunks[cid]; b = (dumps(dict(c, id=cid)) + '\n').encode('utf8')
        if len(b) > MAX_BYTES: sys.exit('chunk %s is %d bytes (> 1 MB): split it' % (cid, len(b)))
        open(os.path.join(od, cid + '.json'), 'wb').write(b)
        n = len(c.get('cards') or c.get('q') or [1])
        man['chunks'][cid] = {'kind': c['kind'], 'topic': c['topic'], 'title': tnames[c['kind']].get(c['topic'], c['topic']),
                              'items': n, 'free': cid in man['free'].values(), 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()}
    s = s.replace('<script>window.ZZ_MANIFEST=null</script>', '<script>window.ZZ_MANIFEST=%s</script>' % dumps(
        {'free': man['free'], 'gated': sorted(k for k, v in man['chunks'].items() if not v['free'])}), 1)
    open(p, 'w', encoding='utf8').write(s)
    cd = os.path.join(root, 'content'); os.makedirs(cd, exist_ok=True)
    open(os.path.join(cd, 'manifest.json'), 'w', encoding='utf8').write(json.dumps(man, ensure_ascii=False, sort_keys=True, indent=1) + '\n')
    open(os.path.join(cd, 'titles.json'), 'w', encoding='utf8').write(dumps(titles) + '\n')
    return man

if __name__ == '__main__':
    m = gate(); c = m['chunks']
    print('chunks', len(c), 'gated', sum(not v['free'] for v in c.values()), 'max bytes', max(v['bytes'] for v in c.values()))
