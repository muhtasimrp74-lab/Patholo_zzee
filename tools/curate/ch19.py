# -*- coding: utf-8 -*-
"""Curated Chapter 19 (The Pancreas) via the shared engine. Text from tools/textbook_src/ch19.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch19'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+The Pancreas(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('CONGENITAL ANOMALIES', 'Congenital Anomalies', 2), ('PANCREATITIS', 'Pancreatitis', 2), ('NONNEOPLASTIC CYSTS', 'Nonneoplastic Cysts', 2), ('NEOPLASMS', 'Neoplasms', 2), ('Acknowledgments', 'Acknowledgments', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('Annular Pancreas', 'Annular Pancreas', 3), ('Agenesis', 'Pancreatic Agenesis', 3), ('Acute Pancreatitis', 'Acute Pancreatitis', 3), ('Chronic Pancreatitis', 'Chronic Pancreatitis', 3), ('Congenital Cysts', 'Congenital Cysts', 3), ('Pseudocysts', 'Pseudocysts', 3), ('Cystic Neoplasms', 'Cystic Neoplasms', 3), ('Pancreatic Carcinoma', 'Pancreatic Carcinoma', 3), ('Acinar Cell Carcinoma', 'Acinar Cell Carcinoma', 3), ('Pancreatoblastoma', 'Pancreatoblastoma', 3), ('Precursors to Pancreatic Cancer', 'Precursors to Pancreatic Cancer', 4), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Pathogenesis')] = [('Pathogenesis', 4), ('Pathogenesis', 4)]
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 4), ('Clinical Features', 4), ('Clinical Features', 4)]
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = set()
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
TITLE = 'The Pancreas'
