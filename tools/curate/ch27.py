# -*- coding: utf-8 -*-
"""Curated Chapter 27 (Peripheral Nerves and Skeletal Muscles) via the shared engine. Text from tools/textbook_src/ch27.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch27'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+Peripheral Nerves and Skeletal Muscles(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('DISEASES OF PERIPHERAL NERVES', 'Diseases of Peripheral Nerves', 2), ('DISEASES OF THE NEUROMUSCULAR JUNCTION', 'Diseases of the Neuromuscular Junction', 2), ('DISEASES OF SKELETAL MUSCLE', 'Diseases of Skeletal Muscle', 2), ('PERIPHERAL NERVE SHEATH TUMORS', 'Peripheral Nerve Sheath Tumors', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('General Types of Peripheral Nerve Injury', 'General Types of Peripheral Nerve Injury', 3), ('Anatomic Patterns of Peripheral Neuropathies', 'Anatomic Patterns of Peripheral Neuropathies', 3), ('Specific Peripheral Neuropathies', 'Specific Peripheral Neuropathies', 3), ('Myasthenia Gravis', 'Myasthenia Gravis', 3), ('Lambert-Eaton Myasthenic Syndrome', 'Lambert-Eaton Myasthenic Syndrome', 3), ('Congenital Myasthenic Syndromes', 'Congenital Myasthenic Syndromes', 3), ('Disorders Caused by Toxins', 'Disorders Caused by Toxins', 3), ('Skeletal Muscle Atrophy', 'Skeletal Muscle Atrophy', 3), ('Neurogenic and Myopathic Changes in Skeletal Muscle', 'Neurogenic and Myopathic Changes in Skeletal Muscle', 3), ('Inflammatory Myopathies', 'Inflammatory Myopathies', 3), ('Inherited Diseases of Skeletal Muscle', 'Inherited Diseases of Skeletal Muscle', 3), ('Gene Therapy for Neuromuscular Diseases', 'Gene Therapy for Neuromuscular Diseases', 3), ('Neurofibromatosis', 'Neurofibromatosis', 3), ('Schwannomas', 'Schwannomas', 3), ('Neurofibromas', 'Neurofibromas', 3), ('Malignant Peripheral Nerve Sheath Tumors', 'Malignant Peripheral Nerve Sheath Tumors', 3), ('Other Types of Nerve Sheath Tumors', 'Other Types of Nerve Sheath Tumors', 3), ('Axonal Neuropathies', 'Axonal Neuropathies', 4), ('Demyelinating Neuropathies', 'Demyelinating Neuropathies', 4), ('Neuronopathies', 'Neuronopathies', 4), ('Inflammatory Neuropathies', 'Inflammatory Neuropathies', 4), ('Infectious Neuropathies', 'Infectious Neuropathies', 4), ('Metabolic, Hormonal, and Nutritional Neuropath', 'Metabolic, Hormonal, and Nutritional Neuropathies', 4), ('Toxic Neuropathies', 'Toxic Neuropathies', 4), ('Neuropathies Associated With Malignancy', 'Neuropathies Associated With Malignancy', 4), ('Neuropathies Caused by Physical Forces', 'Neuropathies Caused by Physical Forces', 4), ('Inherited Peripheral Neuropathies', 'Inherited Peripheral Neuropathies', 4), ('Hereditary Sensory Neuropathies With or Withou', 'Hereditary Sensory Neuropathies', 4), ('Neurogenic Changes', 'Neurogenic Changes', 4), ('Myopathic Changes', 'Myopathic Changes', 4), ('Dermatomyositis', 'Dermatomyositis', 4), ('Antisynthetase Syndrome', 'Antisynthetase Syndrome', 4), ('Immune-Mediated Necrotizing Myopathy', 'Immune-Mediated Necrotizing Myopathy', 4), ('Sporadic Inclusion Body Myositis', 'Sporadic Inclusion Body Myositis', 4), ('Polymyositis', 'Polymyositis', 4), ('Metabolic Changes', 'Metabolic Changes', 4), ('Muscular Dystrophies', 'Muscular Dystrophies', 4), ('Diseases of Lipid or Glycogen Metabolism', 'Diseases of Lipid or Glycogen Metabolism', 4), ('Mitochondrial Myopathies', 'Mitochondrial Myopathies', 4), ('Neurofibromatosis Type 1', 'Neurofibromatosis Type 1', 4), ('Neurofibromatosis Type 2', 'Neurofibromatosis Type 2', 4), ('X-Linked Muscular Dystrophy With Dystrophin Mu', 'X-Linked Muscular Dystrophy With Dystrophin Mutations', 5), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Pathogenesis')] = [('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4), ('Pathogenesis', 4)]
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4)]
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = set(range(0, 11)) | set(range(13, 20))
OVR = {360: [('p', M(360))]}
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
TITLE = 'Peripheral Nerves and Skeletal Muscles'
