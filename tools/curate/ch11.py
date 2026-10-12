# -*- coding: utf-8 -*-
"""Curated Chapter 11 (Blood Vessels) via the shared engine. Text from tools/textbook_src/ch11.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch11'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[1₁][1₁]\s+Blood Vessels(?:\s+\d{3}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('narrrowed', 'narrowed')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [
 ('Vascular Structure and Function', 'Vascular Structure and Function', 2), ('VASCULAR ANOMALIES', 'Vascular Anomalies', 2), ('VASCULAR WALL RESPONSE TO INJURY', 'Vascular Wall Response to Injury', 2),
 ('Endothelial Cells', 'Endothelial Cells', 3), ('Vascular Smooth Muscle Cells', 'Vascular Smooth Muscle Cells', 3), ('Response of Vascular Wall Cells to Injury', 'Response of Vascular Wall Cells to Injury', 3),
 ('HYPERTENSIVE VASCULAR DISEASE', 'Hypertensive Vascular Disease', 2), ('Blood Pressure Regulation', 'Blood Pressure Regulation', 3), ('Mechanisms of Secondary Hypertension', 'Mechanisms of Secondary Hypertension', 3),
 ('Vascular Pathology in Hypertension', 'Vascular Pathology in Hypertension', 3), ('ARTERIOSCLEROSIS', 'Arteriosclerosis', 2), ('ATHEROSCLEROSIS', 'Atherosclerosis', 2),
 ('Epidemiology', 'Epidemiology', 3), ('Risk Factors', 'Risk Factors', 3), ('Constitutional Risk Factors', 'Constitutional Risk Factors', 4), ('Modifiable Major Risk Factors', 'Modifiable Major Risk Factors', 4),
 ('Additional Risk Factors', 'Additional Risk Factors', 4), ('Pathogenesis', 'Pathogenesis', 3), ('Pathogenesis', 'Pathogenesis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Pathogenesis', 'Pathogenesis', 4),
 ('Pathogenesis', 'Pathogenesis', 4), ('Pathogenesis', 'Pathogenesis', 4), ('Pathogenesis', 'Pathogenesis', 4), ('Acute Plaque Change', 'Acute Plaque Change', 4),
 ('ANEURYSMS AND DISSECTION', 'Aneurysms and Dissection', 2), ('Abdominal Aortic Aneurysm', 'Abdominal Aortic Aneurysm', 3), ('Thoracic Aortic Aneurysm', 'Thoracic Aortic Aneurysm', 3), ('Aortic Dissection', 'Aortic Dissection', 3),
 ('VASCULITIS', 'Vasculitis', 2), ('Infectious Vasculitis', 'Infectious Vasculitis', 3), ('Takayasu Arteritis', 'Takayasu Arteritis', 3), ('Medium Vessel Vasculitis', 'Medium Vessel Vasculitis', 3),
 ('Small Vessel Vasculitis', 'Small Vessel Vasculitis', 3), ('Eosinophilic Granulomatosis With Polyangiitis', 'Eosinophilic Granulomatosis With Polyangiitis (Churg-Strauss Syndrome)', 4),
 ('DISORDERS OF BLOOD VESSEL HYPERREACTIVITY', 'Disorders of Blood Vessel Hyperreactivity', 2), ('Raynaud Phenomenon', 'Raynaud Phenomenon', 3), ('Myocardial Vessel Vasospasm', 'Myocardial Vessel Vasospasm', 3),
 ('VEINS AND LYMPHATICS', 'Veins and Lymphatics', 2), ('Varicose Veins', 'Varicose Veins', 3), ('Thrombophlebitis and Phlebothrombosis', 'Thrombophlebitis and Phlebothrombosis', 3),
 ('Superior and Inferior Vena Caval Syndromes', 'Superior and Inferior Vena Caval Syndromes', 3), ('Lymphangitis and Lymphedema', 'Lymphangitis and Lymphedema', 3),
 ('VASCULAR TUMORS', 'Vascular Tumors', 2), ('Benign Tumors and Tumor-Like Conditions', 'Benign Tumors and Tumor-Like Conditions', 3), ('Vascular Ectasias', 'Vascular Ectasias', 4), ('Hemangiomas', 'Hemangiomas', 4),
 ('Lymphangiomas', 'Lymphangiomas', 4), ('Bacillary Angiomatosis', 'Bacillary Angiomatosis', 4), ('Intermediate-Grade (Borderline) Tumors', 'Intermediate-Grade (Borderline) Tumors', 3), ('Kaposi Sarcoma', 'Kaposi Sarcoma', 4),
 ('Hemangioendothelioma', 'Hemangioendothelioma', 4), ('Malignant Tumors', 'Malignant Tumors', 3), ('Angiosarcoma', 'Angiosarcoma', 4), ('PATHOLOGY OF VASCULAR INTERVENTION', 'Pathology of Vascular Intervention', 2),
 ('Endovascular Stenting', 'Endovascular Stenting', 3), ('Vascular Replacement', 'Vascular Replacement', 3), ('SELECTED READINGS', 'Selected Readings', 2)]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 4)] * 12
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or ''))
for _k in ('11.2', '11.3', '11.5'):
    if not TABLES[_k][1]: TABLES[_k] = (TABLES[_k][0], [], 'Table content was lost in the source extraction; see the surrounding text.')
_h, _t = auto.runin(M(191)) if hasattr(auto, 'runin') else re.match(r'^(.{3,90}?)\.\s+(.*)$', M(191), re.S).groups()
OVR = {330: [('h3', 'Giant Cell (Temporal) Arteritis'), ('h4', 'Pathogenesis')], 348: [('h4', 'Pathogenesis')],
       191: [('h4', _h.replace('**', '')), ('p', _t)], 212: [('h3', 'Consequences of Atherosclerotic Disease'), ('h4', 'Atherosclerotic Stenosis')]}
DROP = {4, 305, 217, 216, 219, 227, 229, 67, 68, 462, 463, 464, 465}
OVR[139] = [('p', M(139).replace('Genetic variation Family history Increasing age Male sex ', '', 1))]
OVR[71] = [('p', M(71).replace('Pregnancy-induced (preeclampsia) ', '', 1))]
def _ri(i, head, lv):   # split a run-in subheading ("Head. Body...") out of source block i by cutting only
    t = M(i).replace('**', ''); a, b = part(t, head + '.')
    return ([('p', a)] if a else []) + [('h%d' % lv, head), ('p', b)]
OVR[347] = _ri(347, 'Thromboangiitis Obliterans (Buerger Disease)', 3)
OVR[355] = _ri(355, 'Polyarteritis Nodosa', 3)
OVR[365] = _ri(365, 'Kawasaki Disease', 3)
OVR[386] = _ri(386, 'Microscopic Polyangiitis', 4)
OVR[392] = _ri(392, 'Granulomatosis With Polyangiitis', 4)
# block 353: Buerger text interleaved with the tail of the Fig 11.24 caption -> cut the caption tail out
_a, _r = part(M(353), ' autopsy of the patient'); _tail, _rest = part(' autopsy of the patient' + _r, ' rest—')
OVR[353] = [('p', _a.rsplit(' at', 1)[0] + ' at rest—' + _rest.lstrip())]
FIGFIX = {'11.24': cap(354) + ' ' + _tail.strip()}
OVR[360] = [('p', M(360) + ' ' + M(361).replace('**Fig. 11.26**', 'Fig. 11.26'))]; OVR[361] = []   # paragraph split by a caption: join
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=[], OVR=OVR, DROP=DROP, TABLES=TABLES, FIGFIX=FIGFIX)
def _post(nodes):
    out = []; last = None   # last text node index in out
    for nd in nodes:
        if nd[0] == 'p':
            t = nd[1].replace('2-Acetylaminofluorene Dimethylaminoazobenzene (butter yellow) ', '')
            if t.startswith(('foam cells Lumen', 'extracellular lipids')): continue
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
TITLE = 'Blood Vessels'
