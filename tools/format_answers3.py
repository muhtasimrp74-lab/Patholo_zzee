#!/usr/bin/env python3
"""Third emphasis pass (prose-heavy answers). Only inserts <strong>/<em>; wording never changes. Idempotent via <!--fa3-->.
Bold  : short sentence-labels ("Stage of congestion."), section words (Grossly, Microscopically, Clinically, Complications ...),
        subject term of long paragraphs that still have no bold, key descriptive findings after 'characterised by / shows / seen as'.
Italic: short parenthetical names/synonyms, hedges and frequency words (typically, usually, often, rarely, invariably ...).
"""
import re, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from format_answers import TOK, CARD, SKIP_OPEN, SUBJ, PREP
R = os.path.join(HERE, '..')
MARK3, MARK2, MARK1 = '<!--fa3-->', '<!--fa2-->', '<!--fa1-->'
B = lambda s: '<strong>%s</strong>' % s
I = lambda s: '<em>%s</em>' % s

SECTION = re.compile(r'(?:(?<=^)|(?<=[.;:] ))(Grossly|Macroscopically|Microscopically|Histologically|Clinically|Radiologically|Biochemically|'
    r'Complications|Pathogenesis|Morphology|Prognosis|Treatment|Diagnosis|Aetiology|Etiology|Mechanism|Sequelae|Outcome|Fate|Importantly|Note that|Remember)\b')
LABEL_SENT = re.compile(r'^(\s*)((?:[A-Z][\w\-–/’\']*)(?:\s+[\w\-–/’\']+){0,5}?)(\.)(\s+[A-Z]|$)')
FEATURE = re.compile(r'\b(?:characteri[sz]ed by|characteri[sz]ed histologically by|hallmark of|seen as|manifests as|presents as|appears as|shows|show)\s+((?:[a-z\-–]+\s){0,2}[a-z\-–]+(?:\s(?:of|in)\s[a-z\-–]+){0,1})(?=[,;.])')
PAREN = re.compile(r'\(((?:acute|chronic|[A-Za-z][A-Za-z\- ]{3,40}?))\)')
HEDGE = re.compile(r'\b(typically|usually|characteristically|classically|invariably|always|often|frequently|rarely|seldom|occasionally|sometimes|mainly|chiefly|predominantly|especially|particularly)\b')
PAREN_BAD = re.compile(r'\b(e\.g|i\.e|Fig|see|and|or)\b|\d')

def norm(s): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s)).strip().rstrip('.:').lower()

def process(html):
    if MARK3 in html: return html
    toks = TOK.split(html)
    words = len(re.sub(r'<[^>]+>', '', html).split())
    marks = html.count('<strong') + html.count('<em>')
    # quota scales with length and tops up sparse answers (target ~1 mark / 22 words, capped)
    quota = max(0, min(30, words // 22 - marks))
    ital_cap = max(1, quota // 3)
    seen = set(norm(t) for t in re.findall(r'<(?:strong|em|h4)[^>]*>([^<]+)</', html))
    hedge_used = {}
    depth, prev = 0, ''
    out, pbold, ital_used = [], 0, 0
    for t in toks:
        if t.startswith('<'):
            m = re.match(r'<(/?)(\w+)', t)
            if m and m.group(2).lower() in SKIP_OPEN: depth = max(0, depth + (-1 if m.group(1) else 1))
            prev = t; out.append(t); continue
        if not t.strip() or depth: out.append(t); continue
        starts = re.match(r'<(p|li)\b[^>]*>$', prev) is not None
        chosen = []
        free = lambda a, b: all(b <= c[0] or a >= c[1] for c in chosen)
        def add(a, b, kind, key=None):
            if not free(a, b): return False
            chosen.append((a, b, kind)); 
            if key: seen.add(key)
            return True
        # 1. short sentence-label at start of paragraph/bullet (always allowed, it is structural)
        if starts:
            m = LABEL_SENT.match(t)
            if m and m.group(2).split()[0] not in PREP and len(m.group(2)) <= 48 and not re.search(r'\b(is|are|was|were|has|have|may|can)\b', m.group(2)):
                a = m.start(2); add(a, m.end(2), 'B', norm(m.group(2)))
        # 2. section words
        for m in SECTION.finditer(t):
            k = norm(m.group(1))
            if quota > 0 and add(m.start(1), m.end(1), 'B'): quota -= 1; pbold += 1
        # 3. long paragraph still without bold -> subject term
        if starts and len(t) > 220 and not chosen and quota > 0:
            sm = SUBJ.match(t.lstrip())
            if sm and not sm.group(1) and len(sm.group(2).split()) <= 6 and sm.group(2).split()[0] not in PREP and norm(sm.group(2)) not in seen:
                off = len(t) - len(t.lstrip()) + sm.start(2)
                if add(off, off + len(sm.group(2)), 'B', norm(sm.group(2))): quota -= 1
        # 4. key descriptive findings
        n_f = 0
        for m in FEATURE.finditer(t):
            if quota <= 0 or n_f >= 2: break
            k = norm(m.group(1))
            if len(m.group(1).split()) >= 1 and k not in seen and add(m.start(1), m.end(1), 'B', k): quota -= 1; n_f += 1
        # 5. italics: parenthetical names, hedges
        n_i = 0
        for m in PAREN.finditer(t):
            s = m.group(1)
            if ital_used >= ital_cap or n_i >= 2 or PAREN_BAD.search(s) or len(s.split()) > 5 or len(s.split()) < 2: continue
            if add(m.start(1), m.end(1), 'I'): ital_used += 1; n_i += 1
        for m in HEDGE.finditer(t):
            w = m.group(1).lower()
            if ital_used >= ital_cap or hedge_used.get(w, 0) >= 1 or n_i >= 3: continue
            if add(m.start(1), m.end(1), 'I'): hedge_used[w] = 1; ital_used += 1; n_i += 1
        for a, b, kind in sorted(chosen, reverse=True):
            t = t[:a] + (B(t[a:b]) if kind == 'B' else I(t[a:b])) + t[b:]
        out.append(t)
    h = ''.join(out)
    return h.replace(MARK2, MARK3 + MARK2, 1) if MARK2 in h else (h.replace(MARK1, MARK3 + MARK1, 1) if MARK1 in h else h + MARK3)

def main():
    p = os.path.join(R, 'index.html'); h = open(p, encoding='utf8').read(); n = [0]
    def sub(m):
        new = process(m.group(2))
        if new != m.group(2): n[0] += 1
        return m.group(1) + new + m.group(3)
    h = CARD.sub(sub, h); open(p, 'w', encoding='utf8').write(h)
    jp = os.path.join(R, 'tools', 'answers_by_id.json')
    if os.path.exists(jp):
        j = json.load(open(jp, encoding='utf8'))
        j = {k: (process(v) if isinstance(v, str) and v.startswith('<') else v) for k, v in j.items()}
        open(jp, 'w', encoding='utf8').write(json.dumps(j, ensure_ascii=False))
    print('cards emphasised:', n[0])

if __name__ == '__main__': main()
