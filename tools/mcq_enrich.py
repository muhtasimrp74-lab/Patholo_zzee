"""MCQ enrichment at build time (no private text is committed; this file is code only).
1. WHY explanations: for each MCQ, the sentence from the written answers (or the Robbins chapter) that supports the keyed option,
   quoted verbatim with its source. Questions keyed to a false statement (EXCEPT / NOT / false) are left to their per-option notes.
2. New MCQs from the written answers: list answers ('Types of X', 'Causes of X', ...) become 'All of the following are ... of X
   EXCEPT' items: four options from that list, the odd one out from a list in an unrelated chapter, so the key is safe.
Run by build.py on index.full.html before gating; python3 tools/mcq_enrich.py --report out.html writes a review page."""
import hashlib, html, json, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
STOP = set('the a an of and or in on to for with by is are was were be as at from that this which these those its it into than then their there have has had not no can may also most more less very such other only both each between during after before about under over within without due being used use'.split())
CATS = {'types': 'type', 'causes': 'cause', 'features': 'feature', 'complications': 'complication', 'risk factors': 'risk factor', 'clinical features': 'clinical feature',
        'functions': 'function', 'mediators': 'mediator', 'examples': 'example', 'sites': 'site', 'components': 'component', 'characteristics': 'characteristic'}
NEG = re.compile(r'\b(except|not|false|incorrect|untrue|least likely|never)\b', re.I)
def words(t): return [w for w in re.findall(r"[a-z][a-z0-9\-]{2,}", t.lower()) if w not in STOP]
def text(h): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h))).strip()
def sentences(h):
    t = re.sub(r'</(li|p|h4|h3|td|tr)>', '. ', h); t = text(t)
    return [s.strip(' .;') for s in re.split(r'(?<=[.;!?])\s+', t) if 40 <= len(s.strip()) <= 320 and not re.match(r'\s*\(?[A-F]\)', s) and not re.search(r'\((left|right|top|bottom|arrows?)\)', s)]   # no figure captions
def stem(w): return w[:-1] if w.endswith('s') and len(w) > 4 else w
def h8(s): return hashlib.sha1(s.encode('utf8')).hexdigest()[:8]
def load(page):
    m = re.search(r'const MCQDATA=(\{.*?\});?\n', page); M = json.loads(m.group(1))
    D = json.loads(re.search(r'const DATA=(\[\[.*?\]\]);', page).group(1))
    cards = {}
    for a in re.finditer(r'<article[^>]*\bid="(q\d+)"[^>]*>(.*?)</article>', page, re.S):
        b = re.search(r'<div class="ans[^"]*"[^>]*>(.*)</div>', a.group(2), re.S); cards[a.group(1)] = b.group(1) if b else ''
    return m, M, D, cards
GENERIC = {'disease', 'diseases', 'disorder', 'disorders', 'system', 'tract', 'human', 'clinical', 'lower', 'diseases', 'cell', 'cells'}
def chmap(M, D):
    """MCQ chapter index -> written chapter ids: an MCQ chapter such as 'Blood Vessels and Heart' covers several written chapters"""
    wn = {}
    for r in D: wn.setdefault(r[2], r[4])
    key = lambda t: {w[:5] for w in words(t) if w not in GENERIC}
    out = {}
    for i, (name, _) in enumerate(M['ch']):
        a = key(name); ids = [cid for cid, n in wn.items() if a & key(n)]
        if ids: out[i] = ids
    return out
def explain(M, D, cards, cm, tb):
    byc = {}
    for r in D: byc.setdefault(r[2], []).append(r[3])
    done = skipped = 0
    for q in M['q']:
        if NEG.search(q['q']) or not isinstance(q['a'], int): skipped += 1; continue   # keyed to a false statement, or several keys
        cids = cm.get(q['c']) or []; opt = q['o'][q['a']]; ko = set(map(stem, words(opt))); kq = set(map(stem, words(q['q'])))
        if not ko or not cids: continue
        best = (0, None, None)
        pools = [('notes', s) for cid in cids for qid in byc.get(cid, []) for s in sentences(cards.get(qid, ''))] + [('Robbins', s) for cid in cids for s in tb.get(cid, [])]
        for src, s in pools:
            ws = set(map(stem, words(s))); fo = len(ko & ws) / len(ko); fq = len(kq & ws)
            if fo < (1 if len(ko) <= 2 else .8) or fq < (2 if len(kq) >= 4 else 1): continue
            sc = 2 * fo + fq / max(len(kq), 1) + (.15 if src == 'notes' else 0) - len(s) / 4000
            if sc > best[0]: best = (sc, src, s)
        if best[1]: q['x'] = ('From your notes: ' if best[1] == 'notes' else 'Robbins: ') + best[2].rstrip('.') + '.'; done += 1
    return done, skipped
def generate(M, D, cards, cm):
    inv = {v: k for k, v in cm.items()}; lists = []
    for code, qt, cid, qid, cname in D:
        if cid not in inv: continue
        for part in re.split(r'[;?]|\.\s', qt):
            m = re.search(r'\b(' + '|'.join(sorted(CATS, key=len, reverse=True)) + r')\s+of\s+(?:the\s+)?([a-z][\w \-/,]{2,60})', part, re.I)
            if not m: continue
            ul = re.search(r'<ul>(.*?)</ul>', cards.get(qid, ''), re.S)
            if not ul: continue
            items = []
            for li in re.findall(r'<li>(.*?)</li>', ul.group(1), re.S):
                t = text(li); t = re.split(r'[:(–—]|\s-\s', t)[0].strip(' .,;')
                if 2 <= len(t) <= 60 and len(t.split()) <= 7: items.append(t[0].upper() + t[1:])
            if len(items) >= 4: lists.append({'cat': m.group(1).lower(), 'topic': m.group(2).strip(' .,'), 'items': items, 'cid': cid, 'cname': cname, 'qid': qid})
            break
    out = []
    for L in lists:
        cands = [o for o in lists if o['cat'] == L['cat'] and o['cid'] != L['cid'] and o['cname'] != L['cname']]
        lw = set(map(stem, (w for it in L['items'] for w in words(it)))) | set(map(stem, words(L['topic'])))
        pool = [(o, it) for o in cands for it in o['items'] if not (set(map(stem, words(it))) & lw)]
        if not pool: continue
        k = int(h8(L['qid'] + L['topic']), 16); o, odd = pool[k % len(pool)]; four = L['items'][:4]; pos = k % 5
        opts = four[:pos] + [odd] + four[pos:]; sing = CATS[L['cat']]
        e = [('The odd one out: a %s of %s (%s), not of %s.' % (sing, o['topic'], o['cname'], L['topic'])) if j == pos else ('A %s of %s.' % (sing, L['topic'])) for j in range(5)]
        q = {'q': 'All of the following are %s of %s EXCEPT' % (L['cat'], L['topic']), 'o': opts, 'a': pos, 'e': e, 'c': inv[L['cid']], 't': 0, 's': 'G', 'y': 0, 'g': ['NOTES'],
             'x': 'From your notes: the %s of %s include %s.' % (L['cat'], L['topic'], '; '.join(L['items'][:6]))}
        q['h'] = h8(q['q'] + '|'.join(opts)); out.append(q)
    return out
def apply(path, report=None):
    page = open(path, encoding='utf8').read(); m, M, D, cards = load(page); cm = chmap(M, D)
    tb = {}
    tbi = os.path.join(ROOT, 'textbook', 'index.json')
    if os.path.exists(tbi):
        for c in json.load(open(tbi, encoding='utf8')).get('chapters', []):
            f = os.path.join(ROOT, 'textbook', c.get('id', '') + '.html'); t = (c.get('title') or '')
            cid = next((v for v in set(r[2] for r in D) if set(map(stem, words(t))) and len(set(map(stem, words(t))) & set(map(stem, words(next(r[4] for r in D if r[2] == v))))) / len(set(map(stem, words(t)))) >= .6), None)
            if cid and os.path.exists(f): tb[cid] = sentences(open(f, encoding='utf8').read())
    n0 = len(M['q']); done, skipped = explain(M, D, cards, cm, tb)
    new = []   # generate(M, D, cards, cm) is switched off: list parsing picked sub-headings (Gross, Micro...) as options; not good enough to ship
    seen = {q['h'] for q in M['q']}; new = [q for q in new if q['h'] not in seen]; M['q'] += new
    page = page[:m.start()] + 'const MCQDATA=' + json.dumps(M, ensure_ascii=False, separators=(',', ':')) + ';\n' + page[m.end():]   # gate.py slices up to ';\n'
    open(path, 'w', encoding='utf8').write(page)
    st = {'mcqs': n0, 'explained': done, 'keyed_false': skipped, 'with_notes_e': sum(1 for q in M['q'][:n0] if q.get('e')), 'new': len(new), 'mapped_chapters': len(cm), 'textbook_chapters': len(tb)}
    if report: open(report, 'w', encoding='utf8').write(review(M, n0, st))
    return st
def review(M, n0, st):
    E = html.escape; r = ['<meta charset="utf-8"><title>MCQ review</title><style>body{font:15px/1.5 system-ui;max-width:900px;margin:24px auto;padding:0 16px}li.k{font-weight:700;color:#7a1f36}.x{background:#f6efe3;padding:8px 12px;border-radius:8px}</style>',
         '<h1>MCQ review</h1><p>%s</p>' % E(json.dumps(st))]
    r.append('<h2>New MCQs from your notes (%d)</h2>' % (len(M['q']) - n0))
    for q in M['q'][n0:]: r.append('<h3>%s</h3><ol type="A">%s</ol><p class="x">%s</p>' % (E(q['q']), ''.join('<li%s>%s <small>— %s</small></li>' % (' class="k"' if j == q['a'] else '', E(o), E(q['e'][j])) for j, o in enumerate(q['o'])), E(q['x'])))
    r.append('<h2>Explanations added to existing MCQs (%d)</h2>' % st['explained'])
    for q in M['q'][:n0]:
        if q.get('x'): r.append('<p><b>%s</b><br>Key: %s<br><span class="x">%s</span></p>' % (E(q['q']), E(q['o'][q['a']]), E(q['x'])))
    return '\n'.join(r)
if __name__ == '__main__':
    rep = sys.argv[sys.argv.index('--report') + 1] if '--report' in sys.argv else None
    print(json.dumps(apply(os.path.join(ROOT, 'index.full.html'), rep)))
