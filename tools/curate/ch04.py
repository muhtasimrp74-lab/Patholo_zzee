# -*- coding: utf-8 -*-
"""Curated Chapter 4 via the shared engine (auto.py). Text comes from tools/textbook_src/ch04.json; only deletions/merges/headings are specified here."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch04'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[4₄]\s+Hemodynamic Disorders, Thromboembolic Disease, and Shock(?:\s+\d{3}\b)?\s*']
FIX = [('atrial fibrilation', 'atrial fibrillation'), ('thrombo-philia', 'thrombophilia'), ('a₂-plasmin', 'α₂-plasmin'), ('b₂-glycoprotein', 'β₂-glycoprotein'), ('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
def strip(i, *junk):
    s = M(i)
    for j in junk: s = s.replace(j, ' ')
    return re.sub(r'\s+', ' ', s).strip()
HEADS = {
 'edema and effusions': ('Edema and Effusions', 2), 'increased hydrostatic pressure': ('Increased Hydrostatic Pressure', 3),
 'clinical features': [('Clinical Features', 3), ('Clinical Features', 4), ('Clinical Features', 3)],
 'hyperemia and congestion': ('Hyperemia and Congestion', 2), 'and thrombosis': ('Hemostasis and Thrombosis', 2),
 'normal hemostasis': ('Normal Hemostasis', 3), 'platelets': ('Platelets', 4), 'coagulation cascade': ('Coagulation Cascade', 4), 'endothelium': ('Endothelium', 4),
 'hemorrhagic disorders': ('Hemorrhagic Disorders', 3), 'thrombosis': ('Thrombosis', 3), 'alterations in normal blood flow': ('Alterations in Normal Blood Flow', 4),
 'hypercoagulability': ('Hypercoagulability', 4), 'fate of the thrombus': ('Fate of the Thrombus', 4), 'disseminated intravascular coagulation': ('Disseminated Intravascular Coagulation', 3),
 'embolism': ('Embolism', 2), 'pulmonary embolism': ('Pulmonary Embolism', 3), 'systemic thromboembolism': ('Systemic Thromboembolism', 3), 'fat embolism': ('Fat Embolism', 3),
 'air embolism': ('Air Embolism', 3), 'amniotic fluid embolism': ('Amniotic Fluid Embolism', 3), 'infarction': ('Infarction', 2),
 'factors that influence development of an infarct': ('Factors That Influence Development of an Infarct', 3), 'shock': ('Shock', 2),
 'pathogenesis of septic shock': ('Pathogenesis of Septic Shock', 3), 'stages of shock': ('Stages of Shock', 3), 'selected readings': ('Selected Readings', 2)}
RUNIN = ['Factors That Limit Coagulation', 'Heparin-Induced Thrombocytopenia Syndrome', 'Arterial and Cardiac Thrombosis', 'Venous Thrombosis']
# ---- tables (rows built from source blocks, nothing retyped)
def grp(h, a, b): return [[h, M(i)] for i in range(a, b)]
rows42 = [['Category', 'Examples'], ['**Primary (genetic)**', '']] + [['Common', re.sub(r'\*\*', '', M(i))] for i in (144, 145, 146)] + [['Rare', M(i)] for i in (148, 149, 150)] + [['Very rare', M(i)] for i in (152, 153)] \
        + [['**Secondary (acquired)**', '']] + [['Strong risk factors', re.sub(r'\*\*', '', M(i))] for i in range(155, 164)] + [['Other risk factors', re.sub(r'\*\*', '', M(i))] for i in (165, 166, 167, 168, 169)] + [['Other risk factors', 'Smoking']]
TABLES = {'4.1': ('Pathophysiologic Categories of Edema', [], 'Table content was lost in the source extraction; see the text of this section.'),
          '4.2': ('Hypercoagulable States', rows42, ''), '4.3': ('Three Major Types of Shock', SRC[281]['rows'], '')}
DROP = set(range(14, 20)) - {15, 18, 19} | {8, 55, 57, 76, 83, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 282, 301, 342}
DROP |= {80, 81, 97} | set(range(299, 313)) - {306, 307, 310, 311} | {306, 307, 310, 311}   # septic-shock diagram debris
OVR = {
 56: [('fig', '4.4', C(M(56).replace('**Fig. 4.4** ', '') + ' ' + M(55) + ' ' + M(57)))],
 82: [('fig', '4.6', cap(82) + ' ' + M(83))], 75: [('p', M(75) + ' Fig. 4.6A).')],
 15: [('p', strip(15, 'External pressure (e.g., mass)', 'Lower extremity inactivity with prolonged dependency', 'Arteriolar Dilation', 'Heat', 'Neurohumoral dysregulation', 'Reduced Plasma Osmotic Pressure (Hypoproteinemia)', 'Protein-losing glomerulopathies (nephrotic syndrome)', 'Liver cirrhosis', 'Malnutrition', 'Protein-losing gastroenteropathy', 'Lymphatic Obstruction', 'Inflammatory', 'Neoplastic', 'Postsurgical'))],
 18: [('p', strip(18, 'Excessive salt intake with renal insufficiency', 'Increased tubular reabsorption of sodium', 'Renal hypoperfusion'))],
 19: [('p', strip(19, 'Increased renin-angiotensin-aldosterone secretion', 'Acute inflammation', 'Chronic inflammation', 'Angiogenesis', 'Inflammation', 'Modified from Leaf A, Cotran RS. Renal Pathophysiology. 3rd ed. Oxford Uni- versity Press; ¹⁹⁸⁵:¹⁴⁶.'))],
 84: [('p', strip(84, 'Cofactor VIIIa', 'Phospholipid', ' X surface'))], 85: [('p', strip(85, 'IXa Xa', 'Cofactor Va', 'Xa II', 'Ca²⁺ IIa'))],
 280: [('ul', [M(280) + ' ' + M(282)])], 301: [], 
 341: [('refs', [M(341), M(342) + ' ' + M(343), M(344), M(345) + ' ' + M(346), M(347), M(348), M(349), M(350), M(351), M(352), M(353), M(354), M(355) + ' ' + M(356), M(357) + ' ' + M(358), M(359) + ' ' + M(360)])],
}
DROP |= set(range(343, 361)) | {100, 87}
_a96 = part(M(96), ' The major regulator of NO')[0]
OVR[96] = [('ul', [_a96 + ' The major regulator of NO ' + M(100)])]
OVR[124] = [('p', '…where the high rates' + part(M(124), 'where the high rates')[1])]
_t = M(86)
for _j in ['Inactive factor II (prothrombin) ', 'he- Active factor IIa mostasis', ' Active Inactive Activated (thrombin) bin’s', ' coagulation coagulation factor X', ' factor factor (Xa)', ' (enzyme) (substrate)', 'criti- Fibrinogen Fibrin cal', 'covalently cross- tor II']:
    pass
_a = part(_t, ' • Conversion of fibrinogen')[0]
_a = _a.replace(' coagulation coagulation factor X', '').replace('Inactive factor II (prothrombin) ', '').replace('of he- Active factor IIa mostasis', 'of hemostasis').replace('throm- Active Inactive Activated (thrombin) bin’s', 'thrombin’s')
_b = 'Conversion of fibrinogen' + part(_t, ' • Conversion of fibrinogen')[1]
_b = part(_b, ' tor II (prothrombin)')[0]
for _x, _y in [(' coagulation coagulation factor X', ''), (' factor factor (Xa)', ''), (' (enzyme) (substrate)', ' (enzyme)'), ('criti- Fibrinogen Fibrin cal cofactors', 'critical cofactors'), ('covalently cross-', 'covalently cross-links fibrin.')]:
    _b = _b.replace(_x, _y)
OVR[86] = [('p', re.sub(r'\s+', ' ', _a).strip()), ('ul', [re.sub(r'\s+', ' ', _b).strip()])]
OVR[88] = [('fig', '4.7', 'Conversion of factor X to factor Xa, which in turn converts factor II (prothrombin) to factor IIa (thrombin).'), ('fig', '4.8', cap(88))]
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=RUNIN, OVR=OVR, DROP=DROP, TABLES=TABLES, CONT=())
TITLE = 'Hemodynamic Disorders, Thromboembolic Disease, and Shock'
