# -*- coding: utf-8 -*-
"""Curated Chapter 4 (Hemodynamic Disorders, Thromboembolic Disease, and Shock).
Source: tools/textbook_src/ch04.json, curated with the shared engine (auto.py). See ch04_notes.md.

Everything here is structural or mechanical: headings, debris removal, re-joining pieces of the
extracted text that were split by page/figure boundaries. No passages are retyped from memory;
what the extraction itself lost or scrambled is listed in ch04_notes.md for repair from the book.
"""
import os, sys, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from auto import make, helpers, load

KEY = 'ch04'
RUN_HDR = [r'(?:\b\d{3}\s+)?CHAPTER\s*[4₄]\s+Hemodynamic Disorders, Thromboembolic Disease, and Shock(?:\s+\d{3}\b)?']
RAW = load(KEY)['blocks']

# ---- text fixes (typos / stray label words that the extraction injected into running text)
FIX = [
    ('atrial fibrilation', 'atrial fibrillation'),
    ('thrombo-philia', 'thrombophilia'),
    ('dyski-netic', 'dyskinetic'),
    ('mediators release from', 'mediators released from'),
    ('pool- ing', 'pooling'),
    # block 5: words from the small Edema/Hemostasis/Thrombosis/Embolism/Infarction schematic landed inside the prose
    ('(edema) or Under body cavities', '(edema) or body cavities'),
    ('the tendency which of vascular', 'the tendency of vascular'),
    ('endothelial via the thoracic duct', 'via the thoracic duct'),
    ('discussed clotting that in detail', 'discussed in detail'),
    ('exudates accumulate due to hemostasis increases', 'exudates accumulate due to increases'),
    ('In perfusion contrast', 'In contrast'),
    ('common (embolism) in many disorders', 'common in many disorders'),
    ('and (infarction) malnutrition', 'and malnutrition'),
    (' Edema The structural integrity', ' The structural integrity'),                       # block 1: figure label inside the intro
    ('FAILURE Organ dysfunction Current evidence', 'Current evidence'),                      # block 313: Fig. 4.20 labels before the paragraph
]
# Homocysteinemia bullet was cut by Table 4.2: the end of it is stuck after the table's last row ("Smoking ...")
_tail170 = RAW[170]['md'].split('Smoking', 1)[1].strip()
FIX.append(('inherited deficiency of cystathione β-synthetase.', 'inherited deficiency of cystathione β-synthetase. ' + _tail170))
# Cardiogenic-shock bullet is cut by Table 4.3; rejoin with its continuation (block 282)
FIX.append(('This can be due to intrinsic myocardial damage', 'This can be due to intrinsic myocardial damage ' + RAW[282]['md'].strip()))

SRC, C, M, cap, part = helpers(KEY, RUN_HDR, FIX)
W = lambda x: re.sub(r'\s+', ' ', x).strip()

# ---- heading hierarchy (level 2 = section, 3 = subsection, 4 = sub-subsection)
HEADS = {
    'edema and effusions': ('Edema and Effusions', 2),
    'increased hydrostatic pressure': ('Increased Hydrostatic Pressure', 3),
    'clinical features': [('Clinical Features', 3), ('Clinical Features', 4), ('Clinical Features', 4)],
    'hyperemia and congestion': ('Hyperemia and Congestion', 2),
    'and thrombosis': ('Hemostasis and Thrombosis', 2),
    'normal hemostasis': ('Normal Hemostasis', 3),
    'platelets': ('Platelets', 4),
    'coagulation cascade': ('Coagulation Cascade', 4),
    'endothelium': ('Endothelium', 4),
    'hemorrhagic disorders': ('Hemorrhagic Disorders', 3),
    'thrombosis': ('Thrombosis', 3),
    'alterations in normal blood flow': ('Alterations in Normal Blood Flow', 4),
    'hypercoagulability': ('Hypercoagulability', 4),
    'fate of the thrombus': ('Fate of the Thrombus', 4),
    'disseminated intravascular coagulation': ('Disseminated Intravascular Coagulation', 3),
    'embolism': ('Embolism', 2),
    'pulmonary embolism': ('Pulmonary Embolism', 3),
    'systemic thromboembolism': ('Systemic Thromboembolism', 3),
    'fat embolism': ('Fat Embolism', 3),
    'air embolism': ('Air Embolism', 3),
    'amniotic fluid embolism': ('Amniotic Fluid Embolism', 3),
    'infarction': ('Infarction', 2),
    'factors that influence development of an infarct': ('Factors That Influence Development of an Infarct', 3),
    'shock': ('Shock', 2),
    'pathogenesis of septic shock': ('Pathogenesis of Septic Shock', 3),
    'stages of shock': ('Stages of Shock', 3),
}
RUNIN = ['Factors That Limit Coagulation', 'Heparin-Induced Thrombocytopenia Syndrome', 'Arterial and Cardiac Thrombosis']

# ---- figures whose caption was cut by a page break / swallowed into the following paragraph
cap44 = cap(56) + ' ' + M(55) + ' ' + M(57)          # Fig. 4.4: (A) ... + (B)(C) ... + (D) ...
cap46 = cap(82) + ' ' + M(83)                         # Fig. 4.6: (A) ... + (B) ...
# ---- Table 4.2 (Hypercoagulable states): the table cells were extracted as loose headings/bullets (blocks 143-170)
def grp(h, a, b, extra=()):
    return [M(h), '; '.join([M(i) for i in range(a, b)] + list(extra))]
smoking = 'Smoking'
rows42 = [['Group', 'Conditions'],
          grp(143, 144, 147), grp(147, 148, 151), grp(151, 152, 154),
          grp(154, 155, 164), grp(164, 165, 170, [smoking])]
TABLES = {'4.2': ('Hypercoagulable States', rows42, ''),
          '4.3': ('Three Major Types of Shock', [[C(c) for c in r] for r in RAW[281]['rows']], '')}
TABLES['4.3'][1][0][2] = 'Principal Mechanisms'

# ---- venous-thrombosis run-in head sits mid-paragraph in block 203
a203, b203 = part(M(203), 'Venous **Thrombosis** (Phlebothrombosis). ')

OVR = {
    # Reduced Plasma Osmotic Pressure: heading run into the paragraph (drop cap lost); strip the schematic labels at its end
    8: [('h3', 'Reduced Plasma Osmotic Pressure'),
        ('p', W('Under' + part(M(8)[len('Reduced Plasma Osmotic Pressure'):], 'LYMPHATICS To thoracic duct')[0]))],
    # intro: strip schematic label that trails block 3
    3: [('p', W(part(M(3), ' increases in venous pressure (e.g.')[0]))],
    55: [], 57: [],
    56: [('fig', '4.4', W(cap44))],
    82: [('fig', '4.6', W(cap46))],
    # Virchow-triad figure labels precede the paragraph (block 124); keep the prose from "where ..." on
    124: [('p', W('where the high rates' + part(M(124), 'where the high rates')[1]))],
    203: [('p', W(a203)), ('h5', 'Venous Thrombosis (Phlebothrombosis)'), ('p', W(b203))],
}
DROP = set([
    12,                 # Table 4.1: source has no rows (see notes)
    76,                 # stray "Fig. 4.6 A)." fragment
    83,                 # rejoined into Fig. 4.6 caption
    282,                # rejoined into the cardiogenic shock bullet
    340,                # SELECTED READINGS handled below
    301, 306, 307, 310, 311,   # Fig. 4.20 diagram labels extracted as paragraph/bullets
] + list(range(143, 171)) + list(range(341, 361)))
CONT = {346, 356, 358, 360}   # reference lines continued on the next block (only for reference rebuild below)

N = make(KEY, RUN_HDR, FIX, HEADS, RUNIN=RUNIN, OVR=OVR, DROP=DROP, TABLES=TABLES, CONT=CONT)

# ---- Selected readings: rejoin entries that were split across lines/pages (blocks 341-360)
refs = [M(341), M(342) + ' ' + M(343), M(344), M(345) + ' ' + M(346), M(347), M(348), M(349), M(350), M(351), M(352), M(353), M(354),
        M(355) + ' ' + M(356), M(357) + ' ' + M(358), M(359) + ' ' + M(360)]
N += [('h2', 'Selected Readings'), ('refs', [W(r) for r in refs])]
NODES = N
TITLE = 'Hemodynamic Disorders, Thromboembolic Disease, and Shock'
