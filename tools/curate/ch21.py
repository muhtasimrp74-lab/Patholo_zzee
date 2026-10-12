# -*- coding: utf-8 -*-
"""Curated Chapter 21 (The Lower Urinary Tract and Male Genital System) via the shared engine. Text from tools/textbook_src/ch21.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch21'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+The Lower Urinary Tract and Male Genital System(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('URETERS', 'Ureters', 2), ('URINARY BLADDER', 'Urinary Bladder', 2), ('URETHRA', 'Urethra', 2), ('THE MALE GENITAL TRACT', 'The Male Genital Tract', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('Obstructive Lesions', 'Obstructive Lesions', 3), ('Metaplastic Lesions', 'Metaplastic Lesions', 3), ('Obstruction', 'Obstruction', 3), ('PENIS', 'Penis', 3), ('TESTIS AND EPIDIDYMIS', 'Testis and Epididymis', 3), ('PROSTATE', 'Prostate', 3), ('Acute and Chronic Cystitis', 'Acute and Chronic Cystitis', 4), ('Special Forms of Cystitis', 'Special Forms of Cystitis', 4), ('Urothelial Neoplasms', 'Urothelial Neoplasms', 4), ('Other Epithelial Bladder Tumors', 'Other Epithelial Bladder Tumors', 4), ('Mesenchymal Tumors', 'Mesenchymal Tumors', 4), ('Secondary Tumors', 'Secondary Tumors', 4), ('Hypospadias and Epispadias', 'Hypospadias and Epispadias', 4), ('Phimosis', 'Phimosis', 4), ('Tumors', 'Tumors', 4), ('Cryptorchidism', 'Cryptorchidism', 4), ('Regressive Changes', 'Regressive Changes', 4), ('Inflammation and Infections', 'Inflammation and Infections', 4), ('Vascular Disorders', 'Vascular Disorders', 4), ('Spermatic Cord and Paratesticular Tumors', 'Spermatic Cord and Paratesticular Tumors', 4), ('Testicular Tumors', 'Testicular Tumors', 4), ('Lesions of Tunica Vaginalis', 'Lesions of Tunica Vaginalis', 4), ('Benign Enlargement', 'Benign Enlargement', 4), ('Miscellaneous Tumors', 'Miscellaneous Tumors', 4), ('Exophytic Papillary Lesions', 'Exophytic Papillary Lesions', 5), ('Papilloma', 'Papilloma', 5), ('Benign Tumors and Tumor-like Conditions', 'Benign Tumors and Tumor-like Conditions', 5), ('Malignant Tumors', 'Malignant Tumors', 5), ('Atrophy and Decreased Fertility', 'Atrophy and Decreased Fertility', 5), ('Nonspecific Epididymitis and Orchitis', 'Nonspecific Epididymitis and Orchitis', 5), ('Granulomatous (Autoimmune) Orchitis', 'Granulomatous (Autoimmune) Orchitis', 5), ('Infections', 'Infections', 5), ('Torsion', 'Torsion', 5), ('Germ Cell Tumors', 'Germ Cell Tumors', 5), ('Tumors of Sex Cord–Gonadal Stroma', 'Tumors of Sex Cord–Gonadal Stroma', 5), ('Gonadoblastoma', 'Gonadoblastoma', 5), ('Testicular Lymphoma', 'Testicular Lymphoma', 5), ('Benign Prostatic Hyperplasia', 'Benign Prostatic Hyperplasia', 5), ('Adenocarcinoma', 'Adenocarcinoma', 5), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Congenital Anomalies')] = [('Congenital Anomalies', 3), ('Congenital Anomalies', 3), ('Congenital Anomalies', 4), ('Congenital Anomalies', 4)]
HEADS[auto.norm('Inflammation')] = [('Inflammation', 3), ('Inflammation', 3), ('Inflammation', 4)]
HEADS[auto.norm('Tumors and Tumor-like Lesions')] = [('Tumors and Tumor-like Lesions', 3), ('Tumors and Tumor-like Lesions', 3)]
HEADS[auto.norm('Neoplasms')] = [('Neoplasms', 3), ('Neoplasms', 4)]
HEADS[auto.norm('Pathogenesis')] = [('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4)]
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4)]
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = set()
OVR = {}
# opening: block 2 is the bladder/ureter intro interleaved with margin words; block 1 ("propria. If urine flow...") is its continuation.
# Margin words are moved back to their sentences / deleted (no new words).
_t = M(2)
for _a, _b in [('(except the The terminal portion)', '(except the terminal portion)'), ('type of transitional called', 'type of transitional epithelium called'),
               ('layers of with oval', 'layers of cells with oval'), ('the urecells ters', 'the ureters'), ('with abundant This epithelium', 'with abundant cytoplasm. This epithelium'),
               ('the floor of cytoplasm. the bladder', 'the floor of the bladder'), ('beneath which ing a pouch is', 'beneath which is'), ('creat - (cystocele)', 'creating a pouch (cystocele)'),
               ('retroperitoneum. epithelium Retroperitoneal', 'retroperitoneum. Retroperitoneal'), ('), dle since', '), since')]:
    assert _a in _t, _a; _t = _t.replace(_a, _b)
_blad, _rest = part(_t, ' ureters lie throughout')
_ur = part(_rest, ' In middle-aged')[0]
OVR[2] = [('p', _blad + ' ' + M(1)), ('p', 'The ureters lie throughout' + _ur), ('p', 'In middle-aged' + part(_rest, ' In middle-aged')[1])]
OVR[1] = []
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
TITLE = 'The Lower Urinary Tract and Male Genital System'
