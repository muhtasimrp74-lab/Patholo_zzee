# -*- coding: utf-8 -*-
"""Finds the same question asked in different words on the written list (DU) and the box-viva list, so content.py can
show it once, carrying both the (DU-..) exam tags and the A-card tags.
Two questions are 'the same' when, inside one chapter, they ask the same KIND of thing about the same SUBJECT
(Define/What is/Short note on X are all 'definition of X'; Causes of X; Classify X; Differences between X and Y; ...)."""
import re, difflib

_SPELL = [('aemi','emi'), ('haem','hem'), ('leuc','leuk'), ('oedema','edema'), ('tumour','tumor'), ('aet','et'),
          ('diarrhoea','diarrhea'), ('oesoph','esoph'), ('anaem','anem'), ('lymphoma','lymphoma'), ("hodgkin's",'hodgkin'),
          ('thalassaem','thalassem'), ('dyslipidaem','dyslipidem'), ('haemo','hemo'), ('oe','e')]
# kind of question, first match wins (checked on the lower-cased text)
_KINDS = [('name', r'^(name|list|enumerate)\b'), ('contra', r'contraindication'), ('diff', r'differen|distinguish|versus|\bvs\b'), ('class', r'classif|types? of|kinds? of|categor'),
          ('cause', r'\bcauses?\b|etiolog|aetiolog'), ('indic', r'indication'), ('comp', r'complication|hazard|adverse|reaction'),
          ('lab', r'laborator|investigat|diagnos|\bfindings?\b|\btests?\b'), ('feat', r'features?|characteristic|clinical (presentation|manifestation|picture)|presentation|signs?\b|symptoms?'),
          ('mech', r'mechanism|pathogenesis|pathophysiolog|\bsteps?\b|stages?'), ('morph', r'morpholog|gross|microscop|histolog'),
          ('ex', r'^(give |mention |write )?(some |four |two |three |4 |2 |3 )?(the )?examples?\b|\bexamples? of\b'),
          ('func', r'function'), ('effect', r'effects?|consequences?|outcome|fate|sequel'), ('imp', r'importance|significance|merits'),
          ('site', r'\bsites?\b|\bsources?\b|routes?|pathways?'), ('comp2', r'components?|events?|constituents?')]
_STOP = set('a an the of in on and or to for with by from as at is are was do does you your what which how why when write down short note notes '
            'mention give describe state list name define enumerate explain discuss draw briefly important main common some any four two three 4 2 3 '
            'example examples case cases mean about between among into that this these those can may will be it its their them'.split())
def _clean(q):
    s = q.lower().replace('\u2019', "'").replace('\u00b1', ' ')
    s = re.sub(r'\(.*?\)', ' ', s)                         # bracketed asides: (short note), (± simian crease)
    for a, b in _SPELL: s = s.replace(a, b)
    return s
def key(q):
    s = _clean(q)
    kind = 'def'
    for k, pat in _KINDS:
        if re.search(pat, s): kind = k; break
    t = re.sub(r"[^a-z0-9\u03b1-\u03c9 ]", ' ', s)
    toks = [w for w in t.split() if w not in _STOP]
    # drop the kind words themselves
    kw = set(re.findall(r'[a-z]+', ' '.join(p for k, p in _KINDS if k == kind).replace('\\b', ' ')))
    toks = [w for w in toks if not any(w.startswith(x[:6]) and len(x) >= 5 for x in kw)] if kind != 'def' else toks
    return kind, tuple(sorted(set(toks)))

def same(k1, k2):
    if k1[0] != k2[0]: return False
    if k1[1] == k2[1]: return bool(k1[1])
    a, b = ' '.join(k1[1]), ' '.join(k2[1])
    return len(a) > 6 and difflib.SequenceMatcher(None, a, b).ratio() >= 0.93
