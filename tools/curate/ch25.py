# -*- coding: utf-8 -*-
"""Curated Chapter 25 (The Skin) via the shared engine. Text from tools/textbook_src/ch25.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch25'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+The Skin(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('Ru - • dolph', 'Rudolph'), ('it carries • Dendritic out.', 'it carries out.')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('MORE THAN A MECHANICAL BARRIER', 'More Than a Mechanical Barrier', 2), ('Plaque', 'Plaque', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Dysplastic Nevi', 'Dysplastic Nevi', 3), ('Time', 'Time', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Melanoma', 'Melanoma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('BENIGN EPITHELIAL TUMORS', 'Benign Epithelial Tumors', 2), ('Seborrheic Keratosis', 'Seborrheic Keratosis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Acanthosis Nigricans', 'Acanthosis Nigricans', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Fibroepithelial Polyp', 'Fibroepithelial Polyp', 3), ('Epithelial or Follicular Inclusion Cyst', 'Epithelial or Follicular Inclusion Cyst', 3), ('ADNEXAL (APPENDAGE) TUMORS', 'Adnexal (appendage) Tumors', 2), ('PREMALIGNANT AND MALIGNANT', 'Premalignant and Malignant Epidermal Tumors', 2), ('Actinic Keratosis', 'Actinic Keratosis', 3), ('Squamous Cell Carcinoma', 'Squamous Cell Carcinoma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Basal Cell Carcinoma', 'Basal Cell Carcinoma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Merkel Cell Carcinoma', 'Merkel Cell Carcinoma', 3), ('TUMORS OF THE DERMIS', 'Tumors of the Dermis', 2), ('Dermatofibrosarcoma Protuberans', 'Dermatofibrosarcoma Protuberans', 3), ('Pathogenesis', 'Pathogenesis', 4), ('TUMORS OF CELLULAR MIGRANTS TO THE SKIN', 'Tumors of Cellular Migrants to the Skin', 2), ('Mastocytosis', 'Mastocytosis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('DISORDERS OF EPIDERMAL MATURATION', 'Disorders of Epidermal Maturation', 2), ('Ichthyosis', 'Ichthyosis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('ACUTE INFLAMMATORY DERMATOSES', 'Acute Inflammatory Dermatoses', 2), ('Urticaria', 'Urticaria', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Acute Eczematous Dermatitis', 'Acute Eczematous Dermatitis', 3), ('Erythema Multiforme', 'Erythema Multiforme', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Time', 'Time', 3), ('CHRONIC INFLAMMATORY DERMATOSES', 'Chronic Inflammatory Dermatoses', 2), ('Psoriasis', 'Psoriasis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Seborrheic Dermatitis', 'Seborrheic Dermatitis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Pathogenesis', 'Pathogenesis', 4), ('BLISTERING (BULLOUS) DISEASES', 'Blistering (bullous) Diseases', 2), ('Pemphigus', 'Pemphigus', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Bullous Pemphigoid', 'Bullous Pemphigoid', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Epidermolysis Bullosa and Porphyria', 'Epidermolysis Bullosa and Porphyria', 3), ('DISORDERS OF EPIDERMAL APPENDAGES', 'Disorders of Epidermal Appendages', 2), ('Acne Vulgaris', 'Acne Vulgaris', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Rosacea', 'Rosacea', 3), ('Pathogenesis', 'Pathogenesis', 4), ('PANNICULITIS', 'Panniculitis', 2), ('Erythema Nodosum and Erythema Induratum', 'Erythema Nodosum and Erythema Induratum', 3), ('Other Types of Panniculitis', 'Other Types of Panniculitis', 3), ('INFECTION', 'Infection', 2), ('Pathogenesis', 'Pathogenesis', 4), ('Molluscum Contagiosum', 'Molluscum Contagiosum', 3), ('Impetigo', 'Impetigo', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Superficial Fungal Infections', 'Superficial Fungal Infections', 3), ('SELECTED READINGS', 'Selected Readings', 2), ('Drozdowski R, Spaccarelli N, Peters MS, Grant-Kels JM. Dysplastic nevus part', 'Drozdowski R, Spaccarelli N, Peters MS, Grant-Kels JM. Dysplastic nevus part', 3), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [31, 34, 115, 235, 271, 301]
DROP = set(DROP)
OVR = {}
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=[], OVR=OVR, DROP=DROP, TABLES=TABLES)
def _post(nodes):
    out = []; last = None   # last text node index in out
    for nd in nodes:
        if nd[0] == 'p':
            t = nd[1]
            if len(t) < 60 and not re.search(r'[.:?!)]$', t): continue                      # stray diagram label
            if re.match(r'[a-z(]', t) and last is not None:                                  # continuation across a figure
                ln = out[last]
                out[last] = ('p', ln[1] + ' ' + t) if ln[0] == 'p' else ('ul', ln[1][:-1] + [ln[1][-1] + ' ' + t]); continue
            if t.count(' • ') >= 1 and not t.startswith('•'):
                head, *items = [x.strip() for x in t.split(' • ')]
                out.append(('p', head)); out.append(('ul', [x for x in items if x])); last = len(out) - 1; continue
            out.append(nd); last = len(out) - 1; continue
        if nd[0] == 'ul': out.append(nd); last = len(out) - 1; continue
        out.append(nd)
    return out
NODES = _post(NODES)
TITLE = 'The Skin'
