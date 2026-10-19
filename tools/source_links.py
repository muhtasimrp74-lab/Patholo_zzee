# -*- coding: utf-8 -*-
"""Answer -> textbook source links.

Finds which answers were collected from the site textbook (Robbins, textbook/chNN.html) and, for those only, writes a
"Source in textbook" bar into the answer (inside <div class="ans"> of every card in index.html).
  * An answer gets a link only when most of its factual sentences are found, near-verbatim or lightly paraphrased,
    in ONE chapter of the textbook. Answers listed as outside-sourced in answers_build_log.md never get one.
  * Link = #/textbook/<chapter>/<block id>/<question id>: textbook.js scrolls to that paragraph, opens its section,
    highlights it and shows a "Back to answer" bar.
Outputs: tools/source_map.json (question id -> places) and the patched ../index.html.
Idempotent: any existing source bar is removed and rebuilt.  Run by build.py after every other pass.
Usage: python3 tools/source_links.py [--report]
"""
import re, json, html, os, sys, collections, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
STOP = set('a an the of in on at to for from by with and or but nor as is are was were be been being it its this that these those which who whom whose '
           'than then also may can could should would will shall not no into onto over under between among within without per via due such other '
           'both each any all more most less least some many much very often usually only same either neither if when where while their there they them '
           'we you he she his her has have had do does did one two three four five e g i ii iii iv eg ie etc see'.split())

def norm_word(w):
    w = w.lower()
    w = w.replace('ae', 'e').replace('oe', 'e').replace('ph', 'f')
    if len(w) > 4 and w.endswith('our') and w not in ('hour', 'four', 'your'): w = w[:-3] + 'or'
    w = re.sub(r'is(e|ed|es|ing|ation|ations)$', r'iz\1', w)
    w = re.sub(r'ys(e|ed|es|ing)$', r'yz\1', w)
    w = re.sub(r'(.)\1', r'\1', w)                       # collapse doubled letters (ll, ss, tt ...)
    for suf in ('ations', 'ation', 'ings', 'ing', 'ied', 'ies', 'ed', 'es', 'ly', 's', 'e'):
        if len(w) > len(suf) + 3 and w.endswith(suf): w = w[:-len(suf)]; break
    return w

def toks(text):
    out = []
    for w in re.findall(r"[A-Za-z][A-Za-z0-9\-']*|\d+(?:\.\d+)?", text.replace('’', "'")):
        if w.lower() in STOP: continue
        if w[0].isdigit(): out.append(w); continue
        w = w.replace("'s", '').replace("'", '')
        for p in w.split('-'):
            if len(p) > 1 and p.lower() not in STOP: out.append(norm_word(p))
    return out

def strip(h): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))).strip()

# ------------------------------------------------------------------ textbook units
def load_textbook():
    idx = json.load(open(os.path.join(ROOT, 'textbook/index.json')))['chapters']
    units = []
    for c in idx:
        ch = c['id']; h = open(os.path.join(ROOT, 'textbook', ch + '.html'), encoding='utf8').read()
        src = json.load(open(os.path.join(HERE, 'textbook_src', ch + '.json')))['blocks']
        sb = [(set(toks(re.sub(r'[*_]', '', b.get('md', '')))), b.get('page')) for b in src if b.get('md')]
        pos = [(m.start(), m.group(1), strip(m.group(2))) for m in
               re.finditer(r'<section class="tbs" data-a="([^"]+)">.*?<span class="tbs-t">(.*?)</span>', h, re.S)]
        ptr = 0
        for m in re.finditer(r'<(p|li|table|figure|aside|h3|h4|h5)\b[^>]*data-b="([^"]+)"[^>]*>', h):
            tag, b = m.group(1), m.group(2)
            end = h.find('</%s>' % tag, m.end())
            inner = h[m.end():end]
            if tag == 'li': inner = re.split(r'<(?:ul|ol)\b', inner)[0]
            text = strip(inner)
            if len(text) < 25: continue
            sec = None; sname = ''
            for p0, a, n in pos:
                if p0 < m.start(): sec, sname = a, n
            if re.search(r'selected readings|acknowledg', sname, re.I): continue
            t = set(toks(text)); pg = None; best = 0; bi = ptr
            if t:
                for rng in (range(ptr, min(ptr + 40, len(sb))), range(len(sb))):
                    for i in rng:
                        s, p = sb[i]
                        if not s: continue
                        j = len(s & t) / max(1, min(len(s), len(t)))
                        if j > best: best, pg, bi = j, p, i
                    if best >= .8: break
            if best >= .6: ptr = bi
            units.append(dict(ch=ch, n=c['n'], b=b, sec=sec, text=text, page=pg if best >= .5 else None))
    return units

def sentences(text):
    parts = re.split(r'(?<=[.;:!?])\s+(?=[A-Z0-9(\[])', text)
    return [p for p in parts if p.strip()]

class Index:
    def __init__(self, units):
        self.U = units; self.inv = collections.defaultdict(set); self.sent = []
        for ui, u in enumerate(units):
            ss = sentences(u['text'])
            for s in ss + ([u['text']] if len(ss) > 1 else []):     # each sentence, and the whole block (answers often fuse sentences)
                tl = toks(s)
                if len(tl) >= 3: self.sent.append((ui, set(tl), set(zip(tl, tl[1:])), 1.0 if s is not u['text'] or len(ss) == 1 else .88))
        for si, (ui, t, bg, k) in enumerate(self.sent):
            for w in t: self.inv[w].add(si)
        N = len(self.sent); self.idf = {w: math.log(1 + N / (1 + len(v))) for w, v in self.inv.items()}
    def best(self, tl):
        t = set(tl)
        if not t: return None
        cand = collections.Counter()
        for w in t:
            if self.idf.get(w, 0) > 2.0:
                for si in self.inv[w]: cand[si] += self.idf[w]
        W = sum(sorted(self.idf.get(w, 6.0) for w in t)); bgA = set(zip(tl, tl[1:])); best = (0, None)
        for si, _ in sorted(cand.items(), key=lambda kv: (-kv[1], kv[0]))[:60]:
            ui, st, sbg, k = self.sent[si]
            uni = sum(sorted(self.idf.get(w, 6.0) for w in t & st)) / W
            big = len(bgA & sbg) / max(1, len(bgA))
            sc = (.65 * uni + .35 * big) * k
            if sc > best[0] + 1e-12: best = (sc, ui)
        return best

# ------------------------------------------------------------------ answers
def answer_units(ans_html):
    h = re.sub(r'<!--.*?-->', '', ans_html, flags=re.S)
    h = re.sub(r'<div class="srcbar".*?</div>', '', h, flags=re.S)
    out = [strip(m.group(0)) for m in re.finditer(r'<tr\b.*?</tr>', h, re.S)]
    h2 = re.sub(r'<table\b.*?</table>', ' ', h, flags=re.S)
    for m in re.finditer(r'<(p|li)\b[^>]*>(.*?)</\1>', h2, re.S):
        out.extend(sentences(strip(re.sub(r'<(?:ul|ol)\b.*', '', m.group(2), flags=re.S))))
    return [u for u in out if len(toks(u)) >= 4]

THR_UNIT = float(os.environ.get('THR_UNIT', .62))   # an answer sentence counts as "found in the textbook"
THR_COV = float(os.environ.get('THR_COV', .60))     # share of answer content (token weight) found in the textbook
THR_CH = .75                                        # share of matched content in the single best chapter

def analyse(ans_html, IX):
    us = answer_units(ans_html)
    if not us: return None
    tot = hit = 0; per = collections.Counter(); blk = collections.defaultdict(float)
    for u in us:
        tl = toks(u); w = len(tl); tot += w; r = IX.best(tl)
        if r and r[1] is not None and r[0] >= THR_UNIT:
            hit += w; U = IX.U[r[1]]; per[U['ch']] += w; blk[(U['ch'], U['b'])] += w * r[0]
    chs = sorted(per.items(), key=lambda kv: (-kv[1], kv[0]))[:1]
    return dict(cov=hit / tot if tot else 0, conc=(chs[0][1] / hit) if hit else 0, ch=chs[0][0] if chs else None, blk=blk, hit=hit, tot=tot)

def decide(a): return bool(a) and a['cov'] >= THR_COV and a['conc'] >= THR_CH and a['hit'] >= 25

def pick(a, IX, maxn=3):
    ch = a['ch']; cand = sorted(((round(w, 6), b) for (c, b), w in a['blk'].items() if c == ch), key=lambda x: (-x[0], x[1]))
    U = {(u['ch'], u['b']): u for u in IX.U}; chosen = []
    for w, b in cand:
        u = U[(ch, b)]
        if u['page'] is not None and any(c['page'] == u['page'] for c in chosen): continue   # one link per book page
        chosen.append(dict(ch=ch, n=u['n'], b=b, page=u['page'], sec=u['sec']))
        if len(chosen) >= maxn: break
    order = {u['b']: i for i, u in enumerate(IX.U) if u['ch'] == ch}
    chosen.sort(key=lambda c: order[c['b']])
    return chosen

def outside_questions():
    """questions whose answers the build log says came from outside sources"""
    log = open(os.path.join(HERE, 'answers_build_log.md'), encoding='utf8').read(); qs = set(); on = False
    for line in log.split('\n'):
        if line.startswith('#'): on = bool(re.search(r'outside source', line, re.I))
        elif on and line.startswith('|') and not line.startswith('|---') and not line.startswith('| Question'):
            for q in re.split(r'\s/\s', line.split('|')[1]): qs.add(' '.join(toks(q)))
    return qs

def bar(places):
    links = ''.join('<a href="#/textbook/%s/%s/%s">%s</a>' % (p['ch'], p['b'], p['qid'], ('p. %s' % p['page']) if p.get('page') else 'Open') for p in places)
    return '<div class="srcbar"><span class="srcbar-l">&#128214; From the textbook (Robbins Ch %d)</span>%s</div>' % (places[0]['n'], links)

def run(write=True):
    units = load_textbook(); IX = Index(units); out = {}; res = []
    path = os.path.join(ROOT, 'index.html'); x = open(path, encoding='utf8').read()
    x = re.sub(r'<div class="srcbar".*?</div>', '', x, flags=re.S)
    outside = outside_questions()
    parts = re.split(r'(<article class="card" id="q\d+">)', x)
    for i in range(1, len(parts), 2):
        qid = re.search(r'id="(q\d+)"', parts[i]).group(1); body = parts[i + 1]
        m = re.search(r'<div class="ans">(.*?)</div></article>', body, re.S)
        if not m: continue
        title = strip(re.search(r'<h4>(.*?)</h4>', body, re.S).group(1))
        a = analyse(m.group(1), IX); ok = decide(a) and ' '.join(toks(title)) not in outside
        res.append((qid, title, a, ok))
        if ok:
            pl = pick(a, IX)
            for p in pl: p['qid'] = qid
            out[qid] = [{k: v for k, v in p.items() if k != 'qid'} for p in pl]
            s = m.start(1) + len(m.group(1)); parts[i + 1] = body[:s] + bar(pl) + body[s:]
    json.dump(out, open(os.path.join(HERE, 'source_map.json'), 'w'), indent=0, ensure_ascii=False)
    if write: open(path, 'w', encoding='utf8').write(''.join(parts))
    return res, out, outside

if __name__ == '__main__':
    res, out, outside = run(write='--report' not in sys.argv)
    print('answers: %d, linked to textbook: %d, no link: %d' % (len(res), len(out), len(res) - len(out)))
