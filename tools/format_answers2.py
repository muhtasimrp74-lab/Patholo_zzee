#!/usr/bin/env python3
"""Second emphasis pass: denser, human-style bold/italic so answers read like a marked-up study guide.
Wording is never changed (only <strong>/<em> are inserted). Idempotent via <!--fa2--> (placed before <!--fa1-->).
Bold  : row labels in tables, "Label —"/"Label:" openers of bullets/paragraphs, importance cues (hallmark, commonest cause,
        irreversible, premalignant ...), key figures (%, -fold, mmHg ...), first mention of key acronyms (HER2, DIC, BRCA1 ...).
Italic: contrast/negation words (not, never, only, without, unlike, except), "(e.g., ...)" examples, "so-called" style terms.
Usage:  python3 tools/format_answers2.py        (rewrites index.html + tools/answers_by_id.json)
"""
import re, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from format_answers import TOK, CARD, SKIP_OPEN, SUBJ, PREP
R = os.path.join(HERE, '..')
MARK2, MARK1 = '<!--fa2-->', '<!--fa1-->'
B = lambda s: '<strong>%s</strong>' % s
I = lambda s: '<em>%s</em>' % s

CUES2 = re.compile(r'\b(hallmark|pathognomonic|gold standard|defining feature|key feature|cardinal feature|investigation of choice|'
    r'treatment of choice|drug of choice|first-line|first line|commonest cause|most common cause|leading cause|major cause|'
    r'most common|commonest|most important|most specific|most sensitive|earliest sign|earliest change|earliest|'
    r'irreversible|life-threatening|medical emergency|premalignant|pre-malignant|precursor lesions?|malignant potential|'
    r'poor prognosis|good prognosis|best prognosis|worst prognosis|prognostic factor|diagnostic criteri(?:a|on)|'
    r'sine qua non|autosomal dominant|autosomal recessive|X-linked recessive|X-linked dominant|metastasi[sz]es|'
    r'never metastasi[sz]es|rapidly fatal|opportunistic)\b', re.I)
NUMS = re.compile(r'(?<![\w.])(\d+(?:\.\d+)?(?:\s?[–-]\s?\d+(?:\.\d+)?)?\s?(?:%|(?:-?fold|mmHg|mg/dL|g/dL|mmol/L|mg/L|µm|μm|cm|mm|kg|hours?|hrs?|days?|weeks?|months?|years?)(?![\w])))'
                  r'|\b((?:two|three|four|five|six|seven|eight|nine|ten|twenty|hundred)-?fold)\b')
ACRO = re.compile(r'(?<![\w/-])([A-Z][A-Z0-9]{1,5}(?:-[A-Z0-9]{1,4})?)(?![\w/])')
ACRO_BAD = set('DNA RNA ATP ADP GTP GDP MCQ USA UK WHO OR AND THE DU BSMMU CT MRI USG ECG EEG EMG OK IV IM PO SC OD BD TDS QDS ICU OPD OT NO YES TO IN OF ON AT IS IT AS BY ET AL PH PCO PO2 CO2 O2 H2O ALL LDL HDL BP HR RR SD SE II III IV VI VII VIII IX XI XII'.split())
EG = re.compile(r'\((e\.g\.|i\.e\.|eg|ie)(,?\s[^()<>]{3,90})\)')
NEG = re.compile(r'\b(not|never|only|without|unlike|except|rarely|cannot|neither|nor|unless|instead|whereas|but not)\b')
LABEL_DASH = re.compile(r'^(\s*)([A-Z0-9][^—–:<>]{2,60}?)(\s+[—–]\s)')
LABEL_COLON = re.compile(r'^(\s*)([A-Za-z][^:<>.]{2,60}?)(\s?:)(\s|$)')

def norm(s): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s)).strip().rstrip('.:').lower()

def process(html):
    if MARK2 in html: return html
    toks = TOK.split(html)
    plain_len = len(re.sub(r'<[^>]+>', '', html))
    bold_left = min(28, 4 + plain_len // 100)
    ital_left = min(14, 2 + plain_len // 200)
    seen = set(norm(t) for t in re.findall(r'<(?:strong|em|h4)[^>]*>([^<]+)</', html))
    neg_count = {}
    depth, prev_tag, prev2_tag = 0, '', ''
    out = []
    for t in toks:
        if t.startswith('<'):
            m = re.match(r'<(/?)(\w+)', t)
            if m and m.group(2).lower() in SKIP_OPEN:
                depth = max(0, depth + (-1 if m.group(1) else 1))
            prev2_tag, prev_tag = prev_tag, t
            out.append(t); continue
        if not t.strip() or depth:
            out.append(t); continue
        starts = re.match(r'<(p|li|td)\b[^>]*>$', prev_tag) is not None
        first_col = starts and prev_tag.startswith('<td') and re.match(r'<tr\b', prev2_tag) is not None
        cands = []   # (prio, start, end, kind)
        if first_col:
            s = t.strip()
            if len(s) <= 60 and '<' not in s:
                a = t.index(s); cands.append((0, a, a + len(s), 'B', True))
        elif starts:
            m = LABEL_DASH.match(t) or LABEL_COLON.match(t)
            if m and len(m.group(2).split()) <= 9:
                cands.append((0, m.start(2), m.end(2), 'B', True))
            else:
                sm = SUBJ.match(t.lstrip())
                if sm and len(sm.group(2).split()) <= 6 and sm.group(2).split()[0] not in PREP and not sm.group(1):
                    off = len(t) - len(t.lstrip()) + sm.start(2)
                    cands.append((0, off, off + len(sm.group(2)), 'B', True))
        for m in CUES2.finditer(t): cands.append((1, m.start(1), m.end(1), 'B', False))
        for m in NUMS.finditer(t): cands.append((2, m.start(), m.end(), 'B', False))
        for m in ACRO.finditer(t):
            if m.group(1) not in ACRO_BAD and not m.group(1).isdigit(): cands.append((3, m.start(1), m.end(1), 'B', False))
        for m in EG.finditer(t): cands.append((4, m.start(1), m.end(2), 'I', False))
        for m in NEG.finditer(t): cands.append((5, m.start(1), m.end(1), 'I', False))
        cands.sort(key=lambda c: (c[0], c[1]))
        node_b, node_i = 0, 0
        cap_b, cap_i = 3 + len(t) // 200, 2 + len(t) // 250
        chosen = []
        def free(a, b): return all(b <= c[0] or a >= c[1] for c in chosen)
        for c in cands:
            prio, a, b, kind = c[0], c[1], c[2], c[3]
            free_label = len(c) > 4 and c[4] is True
            txt = t[a:b]
            if kind == 'B':
                key = txt.strip().lower()
                if not free_label:
                    if bold_left <= 0 or node_b >= cap_b or key in seen: continue
                elif key in seen and not first_col: continue
                if not free(a, b): continue
                chosen.append((a, b, 'B', txt))
                seen.add(key)
                if not free_label: bold_left -= 1; node_b += 1
            else:
                if ital_left <= 0 or node_i >= cap_i: continue
                if prio == 5:
                    w = txt.lower()
                    if neg_count.get(w, 0) >= 2: continue
                    neg_count[w] = neg_count.get(w, 0) + 1
                if prio == 4:
                    if txt.strip().lower() in seen: continue
                if not free(a, b): continue
                chosen.append((a, b, 'I', txt)); ital_left -= 1; node_i += 1
        for a, b, kind, txt in sorted(chosen, reverse=True):
            t = t[:a] + (B(txt) if kind == 'B' else I(txt)) + t[b:]
        out.append(t)
    h = ''.join(out)
    return h.replace(MARK1, MARK2 + MARK1) if h.rstrip().endswith(MARK1) else h + MARK2

def main():
    p = os.path.join(R, 'index.html'); h = open(p, encoding='utf8').read(); n = [0]
    def sub(m):
        new = process(m.group(2))
        if new != m.group(2): n[0] += 1
        return m.group(1) + new + m.group(3)
    h = CARD.sub(sub, h)
    open(p, 'w', encoding='utf8').write(h)
    jp = os.path.join(R, 'tools', 'answers_by_id.json')
    if os.path.exists(jp):
        j = json.load(open(jp, encoding='utf8'))
        j = {k: (process(v) if isinstance(v, str) and v.startswith('<') else v) for k, v in j.items()}
        open(jp, 'w', encoding='utf8').write(json.dumps(j, ensure_ascii=False))
    print('cards emphasised:', n[0])

if __name__ == '__main__':
    main()
