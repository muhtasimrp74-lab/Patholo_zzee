"""Batch upgrade of the systemic by-id answers (tools/answers_by_id.json) and an automatic claim check against the site's own
textbook (tools/textbook_src, Robbins 11th). See docs/answers_upgrades_log.md.

  python3 tools/answers_upgrade.py --html REPORT.html     (review list of flagged sentences; nothing is written to the repo)

Runs at build time: tools/apply_answers_by_id.py passes every answer through upgraded(), so no answer text is ever committed
(the leak checks stay as they are). The upgrade only restructures existing text, it never adds claims:
  1. inline [glosses] without digits are removed (the earlier programme removed them by hand);
  2. a <br> inside a sentence becomes a sentence break;
  3. a paragraph that opens with a bold run-in label ("<strong>Acute phase</strong>.") becomes a sub-heading + paragraph;
  4. later paragraphs of three or more sentences become bullet points (the first paragraph stays the direct answer);
  5. a sentence that repeats an earlier one almost word for word is dropped;
  6. British spelling (ischaemia, oedema, oesophagus, tumour ...), in text only, never inside tags.
Every sentence is then matched to its closest textbook sentence in the card's chapters (from tools/source_map.json, else all
chapters); a sentence is VERIFIED when most of its words and all of its numbers occur there, otherwise it is flagged with the
closest passage so a reviewer reads only the flagged sentences."""
import html, json, math, os, re, sys, collections
H = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(H, '..')
FA = re.compile(r'(<!--fa\d-->)+\s*$')
BRIT = [(r'ischemi', 'ischaemi'), (r'edema', 'oedema'), (r'esophag', 'oesophag'), (r'hemorrhag', 'haemorrhag'), (r'hematolog', 'haematolog'),
        (r'hematom', 'haematom'), (r'hemoglobin', 'haemoglobin'), (r'hemolys', 'haemolys'), (r'hemolytic', 'haemolytic'), (r'anemi', 'anaemi'),
        (r'leukemi', 'leukaemi'), (r'tumor', 'tumour'), (r'color', 'colour'), (r'etiolog', 'aetiolog'), (r'cecum', 'caecum'), (r'cecal', 'caecal'),
        (r'diarrhea', 'diarrhoea'), (r'fiber', 'fibre'), (r'gynecolog', 'gynaecolog'), (r'pediatric', 'paediatric'), (r'estrogen', 'oestrogen'),
        (r'hypoxemi', 'hypoxaemi'), (r'septicemi', 'septicaemi'), (r'uremi', 'uraemi'), (r'glycemi', 'glycaemi'), (r'hematuri', 'haematuri'),
        (r'hemoptys', 'haemoptys'), (r'hematemes', 'haematemes'), (r'hemosiderin', 'haemosiderin'), (r'hemochromatos', 'haemochromatos'),
        (r'hemangiom', 'haemangiom'), (r'hemophili', 'haemophili'), (r'hemostas', 'haemostas'), (r'orthopedic', 'orthopaedic'), (r'esophageal', 'oesophageal')]
ABBR = r'(?:e\.g|i\.e|vs|Fig|Figs|approx|cf|No|St|Dr|Mr|Mrs|et al|[A-Z])'
STOP = set('the of and or a an in to is are be by with for as on at from that this which it its their was were has have may can also not into than'
           ' such these those there other often usually most more less one two three after before when while'.split())

def text(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()
def in_text(s, fn):   # apply fn to text between tags only
    return ''.join(fn(p) if i % 2 == 0 else p for i, p in enumerate(re.split(r'(<[^>]+>)', s)))
def brit(t):
    for a, b in BRIT:
        t = re.sub(r'\b' + a, b, t); t = re.sub(r'\b' + a.capitalize(), b.capitalize(), t)
    return t
def balanced(s):
    st = []
    for m in re.finditer(r'<(/?)([a-z0-9]+)[^>]*?(/?)>', s):
        if m.group(2) in ('br', 'img', 'hr', 'wbr') or m.group(3): continue
        if m.group(1):
            if not st or st.pop() != m.group(2): return False
        else: st.append(m.group(2))
    return not st
def sentences(inner):   # split inner HTML at sentence ends that are outside tags; None if a split would cut a tag pair
    raw, parts = re.split(r'(?<=[.!?])\s+(?=(?:<[^>]+>)*[A-Z(])', inner), []
    for p in raw:   # re-join after abbreviations (e.g., i.e., M. bovis, Fig.)
        if parts and re.search(r'\b%s\.$' % ABBR, text(parts[-1])): parts[-1] += ' ' + p
        else: parts.append(p)
    return parts if all(balanced(p) for p in parts) else None
def toks(s): return [w[:6] for w in re.findall(r'[a-z0-9]+', s.lower()) if w not in STOP and len(w) > 1]
def nums(s): return set(re.findall(r'\d+(?:\.\d+)?', re.sub(r'\(\d\)|,', ' ', s)))   # list markers like (1) are not claims

def upgrade(a, light=False):
    fa = FA.search(a); tail = fa.group(0) if fa else ''; a = a[:fa.start()] if fa else a
    a = in_text(a, lambda t: re.sub(r'\s*\[[^\[\]0-9]{3,160}\]', '', t))                                         # 1
    a = in_text(a, lambda t: re.sub(r'\[([^\[\]]*[A-Za-z][^\[\]]*)\]', r'(\1)', t))   # glosses with numbers keep their content in parentheses
    a = in_text(a, lambda t: re.sub(r'([a-z0-9)%])\.([A-Z][a-z])', r'\1. \2', t))   # missing space after a full stop
    a = re.sub(r'([a-z0-9)\]])\s*<br\s*/?>\s*([a-z])', lambda m: m.group(1) + '. ' + m.group(2).upper(), a)     # 2
    a = re.sub(r'\s*<br\s*/?>\s*', ' ', a)
    if light: return in_text(a, brit) + tail   # glosses, line breaks and spelling only
    a = re.sub(r'<p><strong(?: class="rh")?>([^<]{2,60}?)(?:\.</strong>|</strong>\.)\s+', lambda m: '<h4 class="sub">%s</h4><p>' % m.group(1).strip()   # 3: run-in label ends with a period
               if len(m.group(1).split()) <= 6 else m.group(0), a)
    a = in_text(a, lambda t: re.sub(r'(?<!\b%s)(?<=[a-z0-9)%%]\.)( )([a-z])' % r'e\.g|i\.e', lambda m: m.group(1) + m.group(2).upper(), t))   # capitalise a sentence start
    seen, out, first = [], [], True
    for blk in re.findall(r'<(?:p|h4|ul|ol|div)[^>]*>.*?</(?:p|h4|ul|ol|div)>', a, re.S) or [a]:
        if blk.startswith('<p'):
            inner = blk[blk.index('>') + 1:-4]; ss = sentences(inner) or [inner]; keep = []
            for s in ss:                                                                                         # 5
                t = set(toks(text(s)))
                if t and any(len(t & o) / len(t | o) >= .85 for o in seen): continue
                seen.append(t); keep.append(s)
            if not keep: continue
            if not first and len(keep) >= 3 and len(text(inner)) > 280: out.append('<ul>' + ''.join('<li>%s</li>' % s.strip() for s in keep) + '</ul>')  # 4
            else: out.append('<p>' + ' '.join(s.strip() for s in keep) + '</p>')
            first = False
        else: out.append(blk)
    a = in_text(''.join(out), brit)                                                                              # 6
    return a + tail

def upgraded(a):
    """Full restructure, else the light upgrade (glosses, breaks, spelling), else the answer unchanged: never broken markup."""
    for lt in (False, True):
        new = upgrade(a, lt)
        if balanced(new): return new
    return a

def textbook():
    S = []
    for f in sorted(os.listdir(os.path.join(H, 'textbook_src'))):
        d = json.load(open(os.path.join(H, 'textbook_src', f), encoding='utf8'))
        for k, b in enumerate(d['blocks']):
            md = re.sub(r'[*_`#>]|\[|\]|\(see [^)]*\)', ' ', b.get('md', ''))
            for s in re.split(r'(?<=[.;:])\s+', md):
                if len(s) > 25: S.append((f[:4], b.get('page'), s.strip(), '%s#%d' % (f[:4], k)))
    return S

def main():
    by = json.load(open(os.path.join(H, 'answers_by_id.json'), encoding='utf8'))
    man = {}
    T = {r[0][1:]: r for r in json.load(open(os.path.join(ROOT, 'content', 'titles.json'), encoding='utf8'))}
    sm = json.load(open(os.path.join(H, 'source_map.json'), encoding='utf8')); topic_ch = collections.defaultdict(collections.Counter)
    for q, v in sm.items():
        for e in (v if isinstance(v, list) else eval(v)):
            if q[1:] in T: topic_ch[T[q[1:]][1]][e['ch']] += 1
    S = textbook(); df = collections.Counter(); TS = []
    BT = collections.defaultdict(str)
    for ch, pg, s, bk in S: BT[bk] += ' ' + s
    for ch, pg, s, bk in S:
        t = set(toks(s)); TS.append(t); df.update(t)
    idx = collections.defaultdict(list)
    for i, t in enumerate(TS):
        for w in t: idx[w].append(i)
    N = len(S); idf = lambda w: math.log(N / (1 + df[w]))
    up, report, tot = dict(man), [], collections.Counter()
    for n, a in by.items():
        new = man.get(n)
        if not new:   # never ship broken markup: full restructure, else the light upgrade, else unchanged
            for lt in (False, True):
                new = upgrade(a, lt)
                if balanced(new): tot['full' if not lt else 'light'] += 1; break
            else: new = a; tot['unchanged'] += 1
        up[n] = new
        chs = {c for c, _ in topic_ch[T.get(n, [0, '?'])[1]].most_common(3)}
        flags = []
        for s in sentences(re.sub(r'</?(p|ul|ol|li|div|table|thead|tbody|tr|h4)[^>]*>', ' . ', new)) or []:
            st = text(s).strip(' .')
            if len(st) < 25: continue
            q = set(toks(st)); w = sum(idf(x) for x in q) or 1; best, bs = None, 0
            cand = [i for i, _ in collections.Counter(i for x in q for i in idx.get(x, [])).most_common(600) if not chs or S[i][0] in chs]
            covered, picks = set(), []
            for _ in range(3):   # greedy: up to three textbook sentences that together cover the claim
                gain = lambda i: sum(idf(x) for x in (q & TS[i]) - covered)
                i = max(cand, key=gain, default=None)
                if i is None or gain(i) <= 0: break
                picks.append(i); covered |= q & TS[i]
            best = picks[0] if picks else None; bs = sum(idf(x) for x in covered) / w
            nb = ' '.join(BT[S[i][3]] for i in picks)
            ok_n = nums(st) <= nums(nb) if best is not None else not nums(st)
            v = 'VERIFIED' if bs >= .55 and ok_n else 'PARTIAL' if bs >= .35 else 'UNVERIFIED'
            tot[v] += 1
            if v != 'VERIFIED': flags.append((v, st, S[best] if best is not None else None, round(bs, 2), sorted(nums(st) - nums(nb))))
        report.append((n, T.get(n, [0, '?', '', '?'])[3], flags))
    print('upgraded %d answers; sentences: %s' % (len(up), dict(tot)))
    if '--html' in sys.argv:
        e = html.escape; out = ['<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Answer review</title>'
            '<style>body{font:15px/1.5 system-ui;max-width:60rem;margin:auto;padding:1rem}details{border:1px solid #ddd;border-radius:10px;margin:.5rem 0;padding:.5rem 1rem}'
            '.U{color:#a00}.P{color:#a60}blockquote{margin:.3rem 0 .8rem 1rem;color:#555;border-left:3px solid #ccc;padding-left:.6rem}</style>',
            '<h1>Answer review</h1><p>%s. Only flagged sentences are listed; each shows the closest sentence in the site&rsquo;s textbook.</p>' % e(str(dict(tot)))]
        for n, q, fl in sorted(report, key=lambda r: -len(r[2])):
            if not fl: continue
            out.append('<details><summary><b>q%s</b> %s &mdash; %d flagged</summary>' % (n, e(html.unescape(q)), len(fl)))
            for v, st, b, sc, mn in fl:
                out.append('<p class="%s"><b>%s</b> (%.2f%s) %s</p><blockquote>%s</blockquote>' % (v[0], v, sc, ', numbers not found: ' + e(', '.join(mn)) if mn else '', e(st),
                           e('%s p%s: %s' % b[:3]) if b else 'no match'))
            out.append('</details>')
        open(sys.argv[sys.argv.index('--html') + 1], 'w', encoding='utf8').write(''.join(out))

if __name__ == '__main__': main()
