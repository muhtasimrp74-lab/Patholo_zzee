# -*- coding: utf-8 -*-
"""Curated Chapter 29 (The Eye) via the shared engine. Text from tools/textbook_src/ch29.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch29'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+The Eye(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('ORBIT', 'Orbit', 2), ('EYELID', 'Eyelid', 2), ('CONJUNCTIVA', 'Conjunctiva', 2), ('SCLERA', 'Sclera', 2), ('CORNEA', 'Cornea', 2), ('ANTERIOR SEGMENT', 'Anterior Segment', 2), ('UVEA', 'Uvea', 2), ('RETINA AND VITREOUS', 'Retina and Vitreous', 2), ('OPTIC NERVE', 'Optic Nerve', 2), ('THE END-STAGE EYE: PHTHISIS BULBI', 'The End-Stage Eye: Phthisis Bulbi', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('Proptosis', 'Proptosis', 3), ('Other Orbital Inflammatory Conditions', 'Other Orbital Inflammatory Conditions', 3), ('Conjunctivitis-Trachoma and Other Causes of Pa', 'Conjunctivitis and Trachoma', 3), ('Pterygium and Pinquecula', 'Pterygium and Pinguecula', 3), ('Keratitis and Ulcers', 'Keratitis and Ulcers', 3), ('Corneal Degenerations and Dystrophies', 'Corneal Degenerations and Dystrophies', 3), ('Cataract', 'Cataract', 3), ('Anterior Segment Inflammation', 'Anterior Segment Inflammation', 3), ('Glaucoma', 'Glaucoma', 3), ('Uveitis', 'Uveitis', 3), ('Uveal Nevi and Melanomas', 'Uveal Nevi and Melanomas', 3), ('Endophthalmitis, and Panophthalmitis', 'Endophthalmitis and Panophthalmitis', 3), ('Retinal Detachment', 'Retinal Detachment', 3), ('Retinal Vascular Disease', 'Retinal Vascular Disease', 3), ('Radiation Retinopathy', 'Radiation Retinopathy', 3), ('Retinal Artery and Vein Occlusions', 'Retinal Artery and Vein Occlusions', 3), ('Age-Related Macular Degeneration', 'Age-Related Macular Degeneration', 3), ('Other Retinal Degenerations', 'Other Retinal Degenerations', 3), ('Retinal Neoplasms', 'Retinal Neoplasms', 3), ('Anterior Ischemic Optic Neuropathy', 'Anterior Ischemic Optic Neuropathy', 3), ('Papilledema', 'Papilledema', 3), ('Glaucomatous Optic Nerve Damage', 'Glaucomatous Optic Nerve Damage', 3), ('Other Optic Neuropathies', 'Other Optic Neuropathies', 3), ('Band Keratopathies', 'Band Keratopathies', 4), ('Keratoconus', 'Keratoconus', 4), ('Fuchs Endothelial Dystrophy', 'Fuchs Endothelial Dystrophy', 4), ('Hypertension', 'Hypertension', 4), ('Diabetes Mellitus', 'Diabetes Mellitus', 4), ('Retinitis Pigmentosa', 'Retinitis Pigmentosa', 4), ('Retinoblastoma', 'Retinoblastoma', 4), ('Retinal Lymphoma', 'Retinal Lymphoma', 4), ('Optic Neuritis', 'Optic Neuritis', 4), ('Epidemiology and Pathogenesis', 'Epidemiology and Pathogenesis', 4), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Neoplasms')] = [('Neoplasms', 3), ('Neoplasms', 3), ('Neoplasms', 3), ('Neoplasms', 3)]
HEADS[auto.norm('Pathogenesis')] = [('Pathogenesis', 4), ('Pathogenesis', 5)]
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 5)]
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = set(range(1, 8))
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
TITLE = 'The Eye'
