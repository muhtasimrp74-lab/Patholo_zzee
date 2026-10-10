# -*- coding: utf-8 -*-
"""Semi-automatic chapter curation engine (used by ch04.py, ch07.py ...).

Raw source: tools/textbook_src/chNN.json (blocks). The engine
  * cleans text (running headers, hyphenation breaks, Greek letters),
  * rebuilds the Robbins heading hierarchy from an explicit HEADS list (stray 'h' blocks = diagram debris are dropped),
  * turns MORPHOLOGY runs into Morphology boxes and 'label' runs into Key-concept boxes,
  * merges paragraphs that were split across pages/figures, groups bullets,
  * lets each chapter script override individual blocks (OVR), drop blocks (DROP) and supply rebuilt tables/figures.
Output: a list NODES consumed by textbook_build.build_curated().
"""
import json, os, re, collections
HERE = os.path.dirname(os.path.abspath(__file__))
W = lambda x: re.sub(r'\s+', ' ', x).strip()


def load(key):
    return json.load(open(os.path.join(HERE, '..', 'textbook_src', key + '.json'), encoding='utf8'))


def norm(t):
    return re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()


GREEK = {'a': 'α', 'b': 'β', 'g': 'γ', 'd': 'δ', 'k': 'κ', 'e': 'ε', 'm': 'μ', 'w': 'ω'}
SUB = str.maketrans('0123456789', '₀₁₂₃₄₅₆₇₈₉')


def greek(s):
    # "TGF-b", "IFN-g", "NF-kB", "anti-b₂", "IL-1b" -> Greek; "b-catenin", "a-fetoprotein" -> Greek
    s = re.sub(r'(?<=[A-Za-z0-9₀-₉])-([abgdk])(?![A-Za-z])', lambda m: '-' + GREEK[m.group(1)], s)
    s = re.sub(r'(?<![A-Za-z0-9])([abgd])-(?=[A-Za-z])', lambda m: GREEK[m.group(1)] + '-', s)
    s = re.sub(r'(?<=[A-Za-z])-kB\b', '-κB', s)
    s = re.sub(r'\bIL-1b\b', 'IL-1β', s); s = re.sub(r'\bIL-1a\b', 'IL-1α', s)
    s = re.sub(r'\bTNF-a\b', 'TNF-α', s)
    return s


def unhyphen(s, vocab):
    """join 'pool- ing' -> 'pooling' when the joined word is attested (or the hyphenated form is not)."""
    def rep(m):
        a, b = m.group(1), m.group(2)
        joined = (a + b).lower()
        if (a + '-' + b).lower() in vocab and joined not in vocab: return a + '-' + b
        return a + b
    return re.sub(r'(?<=[A-Za-z])(\b[A-Za-z]{2,})- ([a-z]{2,}\b)', lambda m: rep(m), s)


def helpers(key, RUN_HDR, FIX):
    SRC = load(key)['blocks']
    allt = ' '.join((b.get('md') or '') for b in SRC)
    vocab = set(w.lower() for w in re.findall(r'[A-Za-z][A-Za-z\-]+', allt))

    def C(s):
        for r in RUN_HDR: s = re.sub(r, ' ', s)
        for a, b in FIX: s = s.replace(a, b)
        s = greek(s); s = unhyphen(s, vocab)
        s = re.sub(r'\s+([,.;:)])', r'\1', s); s = re.sub(r'\(\s+', '(', s)
        return re.sub(r'\s{2,}', ' ', s).strip()
    M = lambda i: C(SRC[i].get('md', ''))

    def cap(i):
        return re.sub(r'^\*\*Fig\.? [\d.]+\*\*\.?\s*', '', M(i))

    def part(s, m):
        assert m in s, (m, s[:90]); a, _, b = s.partition(m); return a.rstrip(), b.rstrip()
    return SRC, C, M, cap, part


def make(key, RUN_HDR, FIX, HEADS, RUNIN=(), OVR=None, DROP=(), TABLES=None, FIGFIX=None, CONT=(), SPLIT=None, report=False):
    """HEADS: dict norm(text)->(display, level) or list of tuples [(display, level)] consumed in order.
    OVR: {block_index: [nodes]} replaces the block by the given nodes.  DROP: block indexes to drop.
    TABLES: {id: (title, rows, note)}.  FIGFIX: {fig_id: caption}.  CONT: block indexes forced to merge into previous paragraph.
    SPLIT: {block_index: [(marker, ...)]} unused placeholder."""
    OVR = OVR or {}; TABLES = TABLES or {}; FIGFIX = FIGFIX or {}
    SRC, C, M, cap, part = helpers(key, RUN_HDR, FIX)
    heads = {}
    for k, v in HEADS.items():
        heads[k] = collections.deque(v if isinstance(v, list) else [v])
    T = []  # tokens: ('h', level, text) ('p', text) ('li', text) ('ol', text) ('fig', id, cap) ('tab', id) ('morph',) ('kc',) ('node', n)
    i = 0; N = len(SRC)
    mode = None  # None | 'morph' | 'kc'
    kc_skip = False
    for i, b in enumerate(SRC):
        t = b['t']
        if i in DROP or t == 'hero': continue
        if i in OVR:
            for nd in OVR[i]: T.append(('node', nd))
            continue
        if t == 'h':
            txt = C(b['md']); n = norm(txt)
            if kc_skip: kc_skip = False; continue   # key-concept box title (repeats the section title)
            if n in heads and heads[n]:
                disp, lv = heads[n].popleft()
                mode = None
                T.append(('h', lv, disp)); continue
            if txt.strip().upper() == 'MORPHOLOGY':
                mode = 'morph'; T.append(('morph_start',)); continue
            continue  # debris
        if t == 'label':
            mode = 'kc'; kc_skip = True; T.append(('kc_start',)); continue
        if t == 'fig':
            m = re.match(r'\*\*Fig\.?\s*([\d.]+)\*\*\.?\s*(.*)', b['md'], re.S)
            fid = m.group(1) if m else b.get('id', '?'); c = C(m.group(2)) if m else C(b['md'])
            c = FIGFIX.get(fid, c)
            T.append(('fig', fid, c)); continue
        if t == 'table':
            T.append(('tab', b.get('id'))); continue
        md = C(b.get('md', ''))
        if not md: continue
        if t == 'li': T.append(('li', md))
        elif t == 'ol': T.append(('ol', md))
        else:
            if i in CONT or (md[:1].islower() and T and T[-1][0] in ('p', 'li', 'ol')) :
                if T and T[-1][0] in ('p', 'li', 'ol'):
                    T[-1] = (T[-1][0], T[-1][1] + ' ' + md); continue
            T.append(('p', md))
    # ---- assemble nodes
    NODES = []; cur = NODES; stack = []
    def flush_list(buf, nodes):
        pass
    out = []
    def push(nd): (stack[-1][1] if stack else out).append(nd)
    group = None  # ('ul'/'ol', items)
    def close_group():
        nonlocal group
        if group:
            push((group[0], group[1])); group = None
    pend_h = None
    morph = None; kc = None
    def target(): return morph if morph is not None else (kc if kc is not None else out)
    def emit(nd):
        target().append(nd)
    def end_box():
        nonlocal morph, kc
        close_group()
        if morph is not None:
            out.append(('morph', morph)); morph = None
        if kc is not None:
            out.append(('kc', [(None, [x for nd in kc for x in (nd[1] if nd[0] == 'ul' else [nd[1]])])])); kc = None
    for tk in T:
        k = tk[0]
        if k in ('li', 'ol'):
            tag = 'ul' if k == 'li' else 'ol'
            if group and group[0] != tag: close_group_to(target(), group) if False else None
            if group and group[0] != tag:
                target().append((group[0], group[1])); group = None
            if not group: group = [tag, []]
            group[1].append(tk[1]); continue
        # non-list token: flush group
        if group:
            target().append((group[0], group[1])); group = None
        if k == 'h':
            end_box(); out.append(('h%d' % tk[1], tk[2])); continue
        if k == 'morph_start': end_box(); morph = []; continue
        if k == 'kc_start': end_box(); kc = []; continue
        if k == 'p':
            md = tk[1]
            hit = None
            for r in RUNIN:
                if md.startswith(r + '.'): hit = r; break
            if hit and morph is None and kc is None:
                out.append(('h5', hit)); md = md[len(hit) + 1:].strip()
            emit(('p', md)); continue
        if k == 'fig':
            if morph is not None: end_box()
            if kc is not None: end_box()
            out.append(('fig', tk[1], tk[2])); continue
        if k == 'tab':
            if morph is not None: end_box()
            if kc is not None: end_box()
            ti, rows, note = TABLES[tk[1]]; out.append(('tab', tk[1], ti, rows, note)); continue
        if k == 'node':
            nd = tk[1]
            if morph is not None and nd[0] in ('fig', 'tab'): end_box()
            emit(nd); continue
    if group: target().append((group[0], group[1]))
    end_box()
    # ul of paragraph-like kc handled above
    # normalise: list nodes -> ('ul', [items])
    final = []
    for nd in out:
        if nd[0] in ('ul', 'ol'): final.append((nd[0], [W(x) for x in nd[1]]))
        elif nd[0] == 'p': final.append(('p', W(nd[1])))
        elif nd[0] == 'morph': final.append(('morph', [(x[0], [W(y) for y in x[1]]) if x[0] in ('ul', 'ol') else (('p', W(x[1])) if x[0] == 'p' else x) for x in nd[1]]))
        elif nd[0] == 'kc': final.append(('kc', [(h, [W(y) for y in its]) for h, its in nd[1]]))
        else: final.append(nd)
    if report:
        for nd in final: print(nd[0], (nd[1] if isinstance(nd[1], str) else '')[:100])
    return final
