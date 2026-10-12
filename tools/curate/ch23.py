# -*- coding: utf-8 -*-
"""Curated Chapter 23 (The Breast) via the shared engine. Text from tools/textbook_src/ch23.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch23'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+The Breast(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('DISORDERS OF DEVELOPMENT', 'Disorders of Development', 2), ('CLINICAL PRESENTATIONS OF BREAST DISEASE', 'Clinical Presentations of Breast Disease', 2), ('INFLAMMATORY DISORDERS', 'Inflammatory Disorders', 2), ('BENIGN EPITHELIAL PROLIFERATIONS', 'Benign Epithelial Proliferations and Precursor Lesions', 2), ('INVASIVE CARCINOMA OF THE BREAST', 'Invasive Carcinoma of the Breast', 2), ('STROMAL TUMORS', 'Stromal Tumors', 2), ('OTHER MALIGNANT TUMORS OF THE BREAST', 'Other Malignant Tumors of the Breast', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('Milk Line Remnants', 'Milk Line Remnants', 3), ('Accessory Axillary Breast Tissue', 'Accessory Axillary Breast Tissue', 3), ('Congenital Nipple Inversion', 'Congenital Nipple Inversion', 3), ('Acute Mastitis', 'Acute Mastitis', 3), ('Squamous Metaplasia of Lactiferous Ducts', 'Squamous Metaplasia of Lactiferous Ducts', 3), ('Duct Ectasia', 'Duct Ectasia', 3), ('Fat Necrosis', 'Fat Necrosis', 3), ('Lymphocytic Mastopathy (Sclerosing Lymphocytic', 'Lymphocytic Mastopathy (Sclerosing Lymphocytic Lobulitis)', 3), ('Granulomatous Mastitis', 'Granulomatous Mastitis', 3), ('Proliferative Breast Disease Without Atypia', 'Proliferative Breast Disease Without Atypia', 3), ('Gynecomastia', 'Gynecomastia', 3), ('Proliferative Breast Disease With Atypia (Atyp', 'Proliferative Breast Disease With Atypia (Atypical Hyperplasia) and Precursor Lesions', 3), ('Lobular Carcinoma In Situ', 'Lobular Carcinoma In Situ', 3), ('Incidence and Epidemiology', 'Incidence and Epidemiology', 3), ('Risk Factors', 'Risk Factors', 3), ('Pathogenesis of Breast Cancer', 'Pathogenesis of Breast Cancer', 3), ('Types of Invasive Breast Carcinoma', 'Types of Invasive Breast Carcinoma', 3), ('Clinical Presentation', 'Clinical Presentation', 3), ('Prognostic and Predictive Factors', 'Prognostic and Predictive Factors', 3), ('Breast Cancer Staging', 'Breast Cancer Staging', 3), ('Management of Breast Cancer', 'Management of Breast Cancer', 3), ('Lesions of Intralobular Stroma', 'Lesions of Intralobular Stroma', 3), ('Lesions of Interlobular Stroma', 'Lesions of Interlobular Stroma', 3), ('Pathogenesis of Familial Breast Cancer', 'Pathogenesis of Familial Breast Cancer', 4), ('Pathogenesis of Sporadic (Nonfamilial) Breast', 'Pathogenesis of Sporadic (Nonfamilial) Breast Cancer', 4), ('Special Histologic Subtypes of Invasive Carcin', 'Special Histologic Subtypes of Invasive Carcinoma', 4), ('Fibroadenoma', 'Fibroadenoma', 4), ('Phyllodes Tumor', 'Phyllodes Tumor', 4), ('Benign Lesions of Interlobular Stroma', 'Benign Lesions of Interlobular Stroma', 4), ('Malignant Lesions of Interlobular Stroma', 'Malignant Lesions of Interlobular Stroma', 4), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4)]
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = set()
OVR = {316: [('p', M(316))]}
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
TITLE = 'The Breast'
