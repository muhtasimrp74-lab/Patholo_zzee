#!/usr/bin/env python3
"""Add viva-style emphasis and structure to answer HTML. Wording is never changed.

Idempotent: text already inside <strong>/<em>/<h4>/<th> is never touched again.
Usage:  python3 tools/format_answers.py          (rewrites index.html + answers_by_id.json)
"""
import re, json, os, sys

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# ---------- helpers ----------
TOK = re.compile(r'(<[^>]+>)')
SKIP_OPEN = {'strong', 'em', 'h4', 'th', 'a', 'b', 'i'}

def map_text(html, fn):
    """Apply fn(text)->html to text outside strong/em/h4/th/a tags."""
    out, depth = [], 0
    for t in TOK.split(html):
        if t.startswith('<'):
            m = re.match(r'<(/?)(\w+)', t)
            if m and m.group(2).lower() in SKIP_OPEN:
                depth += -1 if m.group(1) else 1
                depth = max(depth, 0)
            out.append(t)
        else:
            out.append(fn(t) if depth == 0 and t.strip() else t)
    return ''.join(out)

B = lambda s: '<strong>%s</strong>' % s
I = lambda s: s   # house rule: no italics inside answer bodies (was <em>)

# ---------- vocab ----------
GENERA = ('Mycobacterium|Staphylococcus|Streptococcus|Escherichia|Helicobacter|Salmonella|Shigella|Vibrio|Clostridium|'
          'Klebsiella|Pseudomonas|Neisseria|Treponema|Candida|Aspergillus|Cryptococcus|Pneumocystis|Plasmodium|'
          'Entamoeba|Giardia|Leishmania|Trypanosoma|Schistosoma|Taenia|Echinococcus|Ascaris|Wuchereria|Bacillus|'
          'Corynebacterium|Listeria|Haemophilus|Bordetella|Legionella|Chlamydia|Mycoplasma|Rickettsia|Borrelia|'
          'Yersinia|Brucella|Campylobacter|Enterococcus|Proteus|Toxoplasma|Cryptosporidium|Histoplasma|Actinomyces|Nocardia')
STOP = 'and|or|the|are|can|may|was|were|with|from|species|spp|infection|infections|that|which|causes|also|but|has|have|then|these|this|for|not|into|usually|often|group|organisms|bacteria|toxin|pneumonia|sepsis|disease|colonies|cells|only|both|than|when|while|after|before|via|per|due|antigen|antigens|osteomyelitis|meningitis|endocarditis|abscess|abscesses|bacteraemia|enterocolitis|vaginosis|urethritis|cervicitis|pharyngitis|gastritis|ulcer'
BINOM = re.compile(r'\b((?:%s)(?:\s+(?!(?:%s)\b)[a-z]{3,})?)\b' % (GENERA, STOP))
GENUS_ONLY = re.compile(r'\b(E\. coli|M\. tuberculosis|S\. aureus|H\. pylori|C\. difficile|P\. falciparum|P\. vivax)\b')
LATIN = re.compile(r'(?<![\w-])(in situ|in vivo|in vitro|de novo|peau d.orange|ex vivo|post mortem|ad hoc|per se|'
                   r'sine qua non|status quo|et al\.|vice versa|in utero|nil per os|bona fide|a priori)(?![\w-])')

EPONYM = re.compile(
    r"\b((?:[A-Z][a-zé]+(?:[-–][A-Z][a-zé]+)*)(?: and [A-Z][a-zé]+)?\s+"
    r"(?:triad|tetrad|pentad|body|bodies|cells?|nodules?|signs?|syndrome|disease|tumou?r|lesions?|nodes?|lines?|"
    r"rings?|phenomenon|criteria|rule|law|classification|stain|reaction|diverticulum|ulcers?|polyps?|"
    r"lymphoma|sarcoma|carcinoma|granuloma|oesophagus|esophagus|bands?|spots?|fibres?|tubercle|crystals?|"
    r"complex|cycle|score|index|theory|hypothesis|test|operation|anaemia|anemia|thyroiditis|gland))\b")
EPONYM_BAD = {'The', 'This', 'These', 'That', 'Those', 'Each', 'Both', 'Some', 'Other', 'Such', 'Most', 'Many', 'Acute',
              'Chronic', 'Severe', 'Mild', 'Benign', 'Malignant', 'Primary', 'Secondary', 'Normal', 'Large', 'Small',
              'Ductal', 'Lobular', 'Squamous', 'Basal', 'Giant', 'Epithelioid', 'Foreign', 'Tuberculous', 'Plasma',
              'Red', 'White', 'Blood', 'Mast', 'Stem', 'Germ', 'Tumour', 'Immune', 'Pulmonary', 'Renal', 'Hepatic'}

CUES = re.compile(r'\b(commonest|most common(?:ly)?|most important|hallmark|pathognomonic|gold standard|'
                  r'investigation of choice|treatment of choice|drug of choice|diagnostic of|characteristic(?:ally)? of|'
                  r'classic(?:al)? triad|never|always|only|most frequent|most frequently)\b', re.I)
CUES_OK = {'commonest', 'most common', 'most commonly', 'most important', 'hallmark', 'pathognomonic', 'gold standard',
           'investigation of choice', 'treatment of choice', 'drug of choice', 'most frequent', 'most frequently',
           'classic triad', 'classical triad'}

NUM = re.compile(r'((?:above|below|more than|less than|greater than|over|under|exceeding|at least|up to|>|<|≥|≤)\s*'
                 r'\d[\d.,]*\s*(?:%|mmol/L|mg/dL|g/dL|mg/L|mmHg|cm|mm|µm|μm|years?|months?|weeks?|days?|hours?|'
                 r'/µL|/μL|/mm³|×\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹]+/L|IU/L|U/L|kPa|°C|g|kg|mL|L)(?:/(?:kg|h|hr|hour|day|min|minute|m²))?)')
TERMED = re.compile(r'\b(?:called|termed|known as|referred to as|designated)\s+(?:the\s+)?([A-Za-z][\w\-–/ ]{2,45}?)(?=[,;.:)]| and | or )')
QUOTED = re.compile(r'(?<![\w])"([^"<>]{3,40})"(?![\w])')
CURLY = re.compile(r'(?<![\w])“([^”<>]{3,40})”(?![\w])')

# ---------- text-level emphasis ----------
class Budget:
    def __init__(self, n): self.n = n
    def take(self):
        if self.n <= 0: return False
        self.n -= 1; return True

def emphasise_text(html, seen, bud):
    def run(t):
        # italics first (no budget: they are cheap and always correct)
        t = BINOM.sub(lambda m: I(m.group(1)), t)
        t = GENUS_ONLY.sub(lambda m: I(m.group(1)), t)
        t = LATIN.sub(lambda m: I(m.group(1)), t)
        t = QUOTED.sub(lambda m: I('"%s"' % m.group(1)), t)
        t = CURLY.sub(lambda m: I('“%s”' % m.group(1)), t)
        # bold: first occurrence only, limited budget
        def eponym(m):
            w = m.group(1)
            if w.split()[0] in EPONYM_BAD or w.lower() in seen or not bud.take(): return w
            seen.add(w.lower()); return B(w)
        t = EPONYM.sub(eponym, t)
        def cue(m):
            w = m.group(1)
            if w.lower() not in CUES_OK or w.lower() in seen or not bud.take(): return w
            seen.add(w.lower()); return B(w)
        t = CUES.sub(cue, t)
        def num(m):
            w = m.group(1)
            if w.lower() in seen or not bud.take(): return w
            seen.add(w.lower()); return B(w)
        t = NUM.sub(num, t)
        def termed(m):
            term = m.group(1)
            if term.lower() in seen or not bud.take(): return m.group(0)
            seen.add(term.lower()); return m.group(0).replace(term, B(term), 1)
        t = TERMED.sub(termed, t)
        return t
    return map_text(html, run)

# ---------- lead sentence ----------
SUBJ = re.compile(r'^((?:The |A |An )?)([A-Za-z][\w\-–’\' /(),]{2,70}?)(\s+(?:is|are|means|refers|results|occurs|describes|denotes|'
                  r'comprises|consists|involves|includes|reflects|arises|develops|forms|may|can|has|have|was|were|'
                  r'represents|causes|produces|leads|requires|shows|presents|affects|retains|contains|contain|lies|begins|ends|'
                  r'undergoes|appears|remains|differ|differs|undergo|show|characterises|characterizes|encompasses|implies|exhibits)\b)')
PREP = {'In','On','At','With','During','After','Before','If','When','For','By','Among','Within','From','To','As','Although','While','Because','Since','I','We','Once','Both','Either','Neither'}
def split_commas(s):
    parts, d, cur = [], 0, ''
    for ch in s:
        if ch == '(': d += 1
        if ch == ')': d -= 1
        if ch == ',' and d == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur); return parts

def bold_list_items(rest):
    """rest = text after 'are/include' up to final period. Bold each short enumerated item (joiners preserved)."""
    body = rest.rstrip('.')
    parts = [(p, ',') for p in split_commas(body)]
    parts[0] = (parts[0][0], '')
    m = re.match(r'^(.*?)(\s+(?:and|or)\s+)(.+)$', parts[-1][0], re.S)
    if m and '(' not in m.group(1) + m.group(3):   # "A, B and C": split the last chunk, text untouched
        parts = parts[:-1] + [(m.group(1), parts[-1][1]), (m.group(2) + m.group(3), '')]
    if len(parts) < 3: return None
    out = []
    for p, sep in parts:
        lead_ws = p[:len(p) - len(p.lstrip())]
        q = p.strip()
        jm = re.match(r'^((?:and|or)\s+)(.+)$', q, re.S)
        joiner = jm.group(1) if jm else ''
        core_all = jm.group(2) if jm else q
        if not core_all or len(re.sub(r'\(.*?\)', '', core_all).split()) > 7 or re.search(r'\b(is|are|which|that|because|whereas|while)\b', core_all): return None
        m2 = re.match(r'^(.*?)(\s*\(.*\))?$', core_all, re.S)
        trail = p[len(p.rstrip()):]
        out.append(sep + lead_ws + joiner + B(m2.group(1)) + (m2.group(2) or '') + trail)
    return ''.join(out) + ('.' if rest.endswith('.') else '')

def lead_emphasis(inner, seen):
    plain = re.sub(r'<[^>]+>', '', inner)
    if inner.startswith('<'):  # lead already starts with emphasis: leave alone
        return inner
    m = SUBJ.match(inner)
    if m and len(m.group(2).split()) <= 8 and m.group(2).split()[0] not in PREP:
        art, subj, verb = m.groups()
        seen.add(subj.lower())
        # enumerated list in lead, e.g. "The types ... are A, B, C and D."
        done = None
        tail = inner[m.end():]
        lm = re.match(r'^(?:\s*(?::|—))?\s+(.*)$', tail)
        if verb.strip() in ('are', 'include') or re.match(r'\s+(are|include|includes)\b', verb):
            em = re.match(r'^(.*?\b(?:are|include|includes|namely|:)\s+)(.+)$', inner)
            if em and ';' not in em.group(2) and '<' not in em.group(2):
                res = bold_list_items(em.group(2))
                if res:
                    return art + subj + verb + tail[:0] + (em.group(1)[len(art + subj + verb):]) + res
        out = art + B(subj) + verb + tail
        # second subject after ';' or 'whereas'
        def second(mm):
            sub2 = mm.group(2)
            if len(sub2.split()) > 6 or sub2.split()[0] in PREP: return mm.group(0)
            return mm.group(1) + B(sub2) + mm.group(3)
        out = re.sub(r'((?:;|whereas|while)\s+(?:the |a |an )?)([A-Za-z][\w\-–’\' ]{2,50}?)(\s+(?:is|are|means|refers|results|occurs|may|can|has|have|was|were|shows|causes)\b)', second, out, count=1)
        return out
    return inner

# ---------- paragraph splitting ----------
ABBR = re.compile(r'(?:\b(?:approx|e\.g|i\.e|vs|viz|cf|Fig|Figs|Dr|Mr|Mrs|No|Nos|ca|etc|esp|spp|sp|al|St)|\b[A-Z]|\bp|\bpp)\.$')
def split_para(inner, maxlen=620, target=380):
    plain = re.sub(r'<[^>]+>', '', inner)
    if len(plain) <= maxlen: return [inner]
    cands, depth_paren = [], 0
    stack = {'strong': 0, 'em': 0}
    i = 0
    toks = TOK.split(inner)
    pos, flat, cuts = 0, '', []
    for t in toks:
        if t.startswith('<'):
            m = re.match(r'<(/?)(strong|em)\b', t)
            if m: stack[m.group(2)] += -1 if m.group(1) else 1
            flat += t; continue
        for mm in re.finditer(r'[.;]\s+(?=[A-Z“"(])', t):
            before = flat + t[:mm.end() - len(mm.group(0).lstrip('.;')) + 1]
            b = re.sub(r'<[^>]+>', '', before)
            if b.count('(') != b.count(')'): continue
            if stack['strong'] or stack['em']: continue
            if mm.group(0)[0] == '.' and ABBR.search(b[-12:]): continue
            cuts.append((len(flat) + mm.end(), len(re.sub(r'<[^>]+>', '', flat)) + mm.end()))
        flat += t
    if not cuts: return [inner]
    parts, last_html, last_plain = [], 0, 0
    for hpos, ppos in cuts:
        if ppos - last_plain >= target and (len(plain) - ppos) >= 140:
            parts.append(inner[last_html:hpos].strip()); last_html, last_plain = hpos, ppos
    parts.append(inner[last_html:].strip())
    return [p for p in parts if p]

# ---------- block-level ----------
MARK = '<!--fa1-->'
def format_ans(ans_html):
    if ans_html.rstrip().endswith(MARK): return ans_html
    h = ans_html
    h = re.sub(r'<p>\s*(?:\*{2,}\s*)+</p>', '', h)          # junk
    h = re.sub(r'<p>\s*</p>', '', h)
    # stand-alone bold line -> sub-heading
    h = re.sub(r'<p><strong(?: class="lbl")?>([^<]{2,70}?)[.:]?</strong></p>', r'<h4 class="sub">\1</h4>', h)
    # run-in headings "<strong>Foo.</strong> text" get a class
    h = re.sub(r'<p><strong>([^<]{2,60}\.)</strong>', r'<p><strong class="rh">\1</strong>', h)
    seen, bud = set(), Budget(9)
    for t in re.findall(r'<(?:strong|em|h4)[^>]*>([^<]+)</', h): seen.add(t.strip().rstrip('.:').lower())
    # split into top-level blocks we can safely process: <p>..</p>, <li>..</li>
    first = [True]
    def p_sub(m):
        inner = m.group(1)
        if first[0]:
            first[0] = False
            if inner.lstrip().startswith('<em>Also asked'):
                first[0] = True
                return m.group(0)
            inner = lead_emphasis(inner, seen)
            inner = emphasise_text(inner, seen, bud)
            return '<p>%s</p>' % inner
        inner = emphasise_text(inner, seen, bud)
        parts = split_para(inner)
        return ''.join('<p>%s</p>' % p for p in parts)
    h = re.sub(r'<p>(.*?)</p>', p_sub, h, flags=re.S)
    # list items: bold the label before a colon
    def li_sub(m):
        inner = m.group(1)
        if '<strong' in inner[:12]: return m.group(0)
        mm = re.match(r'^([^<:.]{3,70}?):(\s)', inner)
        if mm and len(mm.group(1).split()) <= 9:
            inner = B(mm.group(1) + ':') + inner[mm.end() - 1:]
        inner = emphasise_text(inner, seen, bud)
        return '<li>%s</li>' % inner
    h = re.sub(r'<li>(.*?)</li>', li_sub, h, flags=re.S)
    return h + MARK

# ---------- driver ----------
CARD = re.compile(r'(<article class="card" id="q\d+">.*?<div class="ans">)(.*?)(</div></article>)', re.S)

def main():
    p = os.path.join(R, 'index.html')
    h = open(p, encoding='utf8').read()
    n = [0]
    def sub(m):
        new = format_ans(m.group(2))
        if new != m.group(2): n[0] += 1
        return m.group(1) + new + m.group(3)
    h = CARD.sub(sub, h)
    css = open(os.path.join(R, 'tools', 'answerfmt.css'), encoding='utf8').read()
    h = re.sub(r'<style id="ansfmt">.*?</style>', '', h, flags=re.S)
    h = h.replace('</head>', '<style id="ansfmt">' + css + '</style></head>', 1)
    open(p, 'w', encoding='utf8').write(h)
    jp = os.path.join(R, 'tools', 'answers_by_id.json')
    if os.path.exists(jp):
        j = json.load(open(jp, encoding='utf8'))
        j = {k: (format_ans(v) if isinstance(v, str) and v.startswith('<') else v) for k, v in j.items()}
        json.dump(j, open(jp, 'w', encoding='utf8'), ensure_ascii=False)
    print('cards changed:', n[0])

if __name__ == '__main__':
    main()
