# -*- coding: utf-8 -*-
"""Curated Chapter 4 via the shared engine (auto.py). Text comes from tools/textbook_src/ch04.json; only deletions/merges/headings are specified here."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch04'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[4₄]\s+Hemodynamic Disorders, Thromboembolic Disease, and Shock(?:\s+\d{3}\b)?\s*']
FIX = [('atrial fibrilation', 'atrial fibrillation'), ('thrombo-philia', 'thrombophilia'), ('a₂-plasmin', 'α₂-plasmin'), ('b₂-glycoprotein', 'β₂-glycoprotein'), ('pool- ing', 'pooling'), ('fac- tor', 'factor'), ('criti- cal', 'critical'), ('com- promised', 'compromised'), ('hypopro- teinemia', 'hypoproteinemia'), ('organ- ism', 'organism')]
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
import colsplit, tabfix
# ---- thrombin activities (block 86): diagram-label words deleted, then the thrombin text (col A) and the Fig 4.7 caption tail (col B) are separated by cutting
_t = M(86)
for _j in ['Inactive factor II (prothrombin) ', ' Active factor IIa ', ' Active Inactive Activated (thrombin) ', ' coagulation coagulation factor X ', ' factor factor (Xa) ', ' (enzyme) (substrate) ', ' Fibrinogen Fibrin ', ' Platelet Neutrophil aggregation adhesion and degranulation muscle cells activation']:
    assert _j.strip() in _t, _j; _t = _t.replace(_j, ' ')
_A, _B = colsplit.split(_t, ['tor II (prothrombin)', '• Platelet activation', 'reaction complex consists', 'tion and aggregation', 'on a platelet phospholipid', 'linking platelet function', 'components together', '• Proinflammatory effects', 'tor Xa becomes', 'cells, endothelium', 'coagulation cascade, converting', 'these receptors by thrombin', '(IIa) using factor Va', 'tory effects that contribute'])
_tail87 = M(87).split(' fac- ')[1]                                  # "links fibrin." = end of the first bullet
_A = _A.replace('cross- •', 'cross-' + _tail87 + ' •')
_intro, *_bul = [x.strip() for x in _A.split(' • ')]
OVR[86] = [('p', _intro), ('ul', _bul)]
OVR[87] = []
OVR[88] = [('fig', '4.7', C(M(87).split(' fac- ')[0].replace('**Fig. 4.7** ', '') + ' fac- ' + _B)), ('fig', '4.8', cap(88))]
# ---- Fig 4.1 / Fig 4.2 captions (block 10) and the right-hand text column of block 11
_c10a, _c10b = colsplit.split(M(10), [' Fig. 4.2 ', ' mally,', ' malnutrition,', ' is little net movement'])
_c11a, _c11b = colsplit.split(M(11), ['synthesis or increased loss', 'drostatic pressure', ' mon causes', ' the extravasation', ' synthesis occurs', ' of the excess fluid', ' Chapter 18)'])
OVR[10] = [('fig', '4.1', re.sub(r'^\*\*Fig\. 4\.1\*\*\s*', '', _c10a) + ' ' + _c11a), ('fig', '4.2', re.sub(r'^Fig\. 4\.2\s*', '', _c10b))]
OVR[11] = []
_lab13 = ['Increased Hydrostatic Pressure', 'Impaired Venous Return', 'Congestive **heart failure**', 'Constrictive **pericarditis**', 'Ascites (liver cirrhosis)']
_t13 = M(13)
for _j in _lab13: assert _j.replace('**', '') in _t13.replace('**', ''), _j; _t13 = _t13.replace(_j, ' ') if _j in _t13 else _t13.replace(_j.replace('**', ''), ' ')
_t13 = re.sub(r'\s+', ' ', _t13).strip()
_cap12 = SRC[12]['caption'].split('Edema ', 1)[1]                    # "capillaries. Regardless of cause ... leads" is the tail of the paragraph, caught in the table caption
_pre8 = 'Under ' + part(M(8), ' inadequate')[0].replace('Reduced Plasma Osmotic Pressure ', '', 1) + ' inadequate'
OVR[8] = [('h3', 'Reduced Plasma Osmotic Pressure'), ('p', re.sub(r'\s+', ' ', _pre8 + ' ' + _c11b + ' ' + C(_cap12) + ' … ' + _t13))]
OVR[13] = []
DROP -= {8, 14, 17}   # these blocks are now rebuilt through OVR (headings / paragraph)
OVR[14] = [('h3', 'Sodium and Water Retention')]
OVR[17] = [('h3', 'Lymphatic Obstruction')]
OVR[19] = [('p', strip(19, 'Increased renin-angiotensin-aldosterone secretion', 'Acute inflammation', 'Chronic inflammation', 'Angiogenesis', 'Inflammation', 'Modified from Leaf A, Cotran RS. Renal Pathophysiology. 3rd ed. Oxford Uni-', 'versity Press; ¹⁹⁸⁵:¹⁴⁶.'))]
for _k in (15, 19):   # hyphenated line breaks that were separated by deleted table-cell text
    OVR[_k] = [('p', OVR[_k][0][1].replace('com- promised', 'compromised').replace('hypopro- teinemia', 'hypoproteinemia').replace('organ- ism', 'organism'))]
# Table 4.1: the cell labels survive as fragments in blocks 13-19 (they were previously deleted from the text); assemble them
_src = ' '.join(M(i) for i in range(13, 20)).replace('**', '')
_row = lambda h, items: [h, '; '.join(items)]
_T41 = [['Category', 'Examples'],
  _row('Increased Hydrostatic Pressure: Impaired Venous Return', ['Congestive heart failure', 'Constrictive pericarditis', 'Ascites (liver cirrhosis)', 'Thrombosis', 'External pressure (e.g., mass)', 'Lower extremity inactivity with prolonged dependency']),
  _row('Arteriolar Dilation', ['Heat', 'Neurohumoral dysregulation']),
  _row('Reduced Plasma Osmotic Pressure (Hypoproteinemia)', ['Protein-losing glomerulopathies (nephrotic syndrome)', 'Liver cirrhosis', 'Malnutrition', 'Protein-losing gastroenteropathy']),
  _row('Sodium Retention', ['Excessive salt intake with renal insufficiency', 'Increased tubular reabsorption of sodium', 'Renal hypoperfusion', 'Increased renin-angiotensin-aldosterone secretion']),
  _row('Lymphatic Obstruction', ['Inflammatory', 'Neoplastic', 'Postsurgical', 'Postirradiation']),
  _row('Inflammation', ['Acute inflammation', 'Chronic inflammation', 'Angiogenesis'])]
for _r in _T41[1:]:
    for _x in _r[1].split('; '): assert _x in _src, _x           # every cell must come from the source text
TABLES['4.1'] = ('Pathophysiologic Categories of Edema', _T41, 'Modified from Leaf A, Cotran RS. Renal Pathophysiology. 3rd ed. Oxford University Press; 1985:146. "Venous obstruction or compression" row label was lost in extraction.')
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=RUNIN, OVR=OVR, DROP=DROP, TABLES=TABLES, CONT=())
TITLE = 'Hemodynamic Disorders, Thromboembolic Disease, and Shock'
