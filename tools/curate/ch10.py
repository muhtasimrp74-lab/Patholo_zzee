# -*- coding: utf-8 -*-
"""Curated Chapter 10 (Diseases of Infancy and Childhood) via the shared engine. Text from tools/textbook_src/ch10.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch10'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+Diseases of Infancy and Childhood(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('MORPHOLGY', 'MORPHOLOGY')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('Causes of Anomalies', 'Causes of Anomalies', 3), ('Pathogenesis', 'Pathogenesis', 4), ('PREMATURITY AND FETAL GROWTH RESTRICTION', 'Prematurity and Fetal Growth Restriction', 2), ('Fetal Growth Restriction', 'Fetal Growth Restriction', 3), ('Maternal Abnormalities', 'Maternal Abnormalities', 3), ('Fetal Abnormalities', 'Fetal Abnormalities', 3), ('Placental Abnormalities', 'Placental Abnormalities', 3), ('Neonatal Respiratory Distress Syndrome', 'Neonatal Respiratory Distress Syndrome', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Necrotizing Enterocolitis', 'Necrotizing Enterocolitis', 3), ('PERINATAL INFECTIONS', 'Perinatal Infections', 2), ('Transcervical (Ascending) Infections', 'Transcervical (Ascending) Infections', 3), ('Transplacental (Hematologic) Infections', 'Transplacental (Hematologic) Infections', 3), ('Sepsis', 'Sepsis', 3), ('FETAL HYDROPS', 'Fetal Hydrops', 2), ('Immune Hydrops', 'Immune Hydrops', 3), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 4), ('NEWBORN', 'Newborn', 2), ('Jaundice Kernicterus', 'Jaundice Kernicterus', 3), ('Nonimmune Hydrops', 'Nonimmune Hydrops', 3), ('Clinical Features', 'Clinical Features', 4), ('INHERITED METABOLIC DISORDERS AND OTHER', 'Inherited Metabolic Disorders and Other Genetic Disorders', 2), ('Phenylketonuria', 'Phenylketonuria', 3), ('Galactosemia', 'Galactosemia', 3), ('Cystic Fibrosis Gene: Normal Structure and Function', 'Cystic Fibrosis Gene: Normal Structure and Function', 3), ('Cl– Na⁺ H₂O', 'Cl– Na⁺ H₂O', 3), ('Genetic and Environmental Modifiers', 'Genetic and Environmental Modifiers', 3), ('Clinical Features of Cystic Fibrosis', 'Clinical Features of Cystic Fibrosis', 3), ('Criteria for Diagnosis of Cystic Fibrosis', 'Criteria for Diagnosis of Cystic Fibrosis', 3), ('SUDDEN INFANT DEATH SYNDROME', 'Sudden Infant Death Syndrome', 2), ('Epidemiology', 'Epidemiology', 4), ('Infant', 'Infant', 3), ('Hyperthermia', 'Hyperthermia', 3), ('Pathogenesis', 'Pathogenesis', 4), ('TUMORS AND TUMOR-LIKE LESIONS OF INFANCY', 'Tumors and Tumor-like Lesions of Infancy and Childhood', 2), ('Benign Tumors and Tumor-like Lesions', 'Benign Tumors and Tumor-like Lesions', 3), ('Hemangiomas and Vascular Malformations', 'Hemangiomas and Vascular Malformations', 3), ('Fibrous Tumors', 'Fibrous Tumors', 3), ('Teratomas', 'Teratomas', 3), ('Malignant Tumors', 'Malignant Tumors', 3), ('Incidence and Types', 'Incidence and Types', 3), ('Neuroblastic Tumors', 'Neuroblastic Tumors', 3), ('Neck', 'Neck', 3), ('Clinical Features', 'Clinical Features', 4), ('Wilms Tumor', 'Wilms Tumor', 3), ('Pathogenesis and Genetics', 'Pathogenesis and Genetics', 3), ('Clinical Features', 'Clinical Features', 4), ('Acknowledgment', 'Acknowledgment', 3), ('SELECTED READINGS', 'Selected Readings', 2), ('Cohn SL, Pearson ADJ, London WB, et al. The International Neuroblastoma', 'Cohn SL, Pearson ADJ, London WB, et al. The International Neuroblastoma', 3), ('Dammann O, Hartnett ME, Stahl A. Retinopathy of prematurity. Dev Med', 'Dammann O, Hartnett ME, Stahl A. Retinopathy of prematurity. Dev Med', 3), ('of BPD.]', 'of BPD.]', 3), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [121, 129, 154, 155, 156, 160, 163, 165, 208, 235]
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
TITLE = 'Diseases of Infancy and Childhood'
