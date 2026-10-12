# -*- coding: utf-8 -*-
"""Curated Chapter 2 (Cell Injury, Cell Death, and Adaptations).
Built from tools/textbook_src/ch02.json: structure, headings, merged sentences, figures and tables are repaired by hand
(see ch02_notes.md for the few places where text had to be reconstructed). Nodes -> tools/textbook_build.py."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = json.load(open(os.path.join(HERE, '..', 'textbook_src', 'ch02.json'), encoding='utf8'))['blocks']

RUN_HDR = [r'\s*\b\d{2}\s+CHAPTER\s*[2₂]\s+Cell Injury, Cell Death, and Adaptations', r'(?:^|\s+)Cell Injury, Cell Death, and Adaptations\s+\d{2}\b', r'\s*\bCHAPTER 2\s+']
FIX = [('special-ization', 'specialization'), ('tur-gor', 'turgor'), ('sen-sitize', 'sensitize'), ('reoxygen-ation', 'reoxygenation'),
       ('crys-tallize', 'crystallize'), ('hyperlip-idemic', 'hyperlipidemic'), ('nonredun-dant', 'nonredundant'), ('noncrystal-line', 'noncrystalline'),
       ('arche- typal', 'archetypal'), ('BH3- only', 'BH3-only'), ('O₂- derived', 'O₂-derived'), ('intergrated', 'integrated'), ('epitheloid', 'epithelioid'),
       ('prostrate', 'prostate'), ('heathy', 'healthy'), ('micells', 'micelles'), ('Superoxidase dismutases', 'Superoxide dismutases'), ('Superoxidase dismutase', 'Superoxide dismutase'),
       ('functional antigens receptors', 'functional antigen receptors'), ('*per se*cond', 'per second'), ('eIF2a', 'eIF2α'), ('interleukin-1b', 'interleukin-1β'),
       ('IL-1b', 'IL-1β'), ('Creutzfeldt-Jacob', 'Creutzfeldt-Jakob'), ('b cells', 'β cells'), ('are depend on', 'depend on'), (',0.1 mmol', '<0.1 μmol'),
       ('the a isoform of myosin heavy chain is replaced by the b isoform', 'the α isoform of myosin heavy chain is replaced by the β isoform'),
       ('(see Fig. 2.7 and Table 2.2). Apoptosis was', '(see Fig. 2.7 and Table 2.2). Apoptosis was')]
def C(s):
    for r in RUN_HDR: s = re.sub(r, ' ', s)
    for a, b in FIX: s = s.replace(a, b)
    return re.sub(r'\s{2,}', ' ', s).strip()
def M(i): return C(SRC[i].get('md', ''))
def part(s, m):
    assert m in s, (m, s[:80]); a, _, b = s.partition(m); return a.rstrip(), b.rstrip()
def cap(i): return re.sub(r'^\*\*Fig\.? [\d.]+\*\*\s*', '', M(i))
def runin(s):
    m = re.match(r'^(.{3,90}?)\.\s+(.*)$', s, re.S); assert m, s[:60]; return m.group(1).replace('**', ''), m.group(2)

def _dw(s, *junk):   # deletion-only cleanup of diagram labels
    for j in junk:
        assert j in s, (j, s[:60]); s = s.replace(j, ' ' if j.startswith(' ') and not j.endswith(' ') else '', 1)
    return re.sub(r'\s+', ' ', s).strip()
W = lambda x: re.sub(r'\s+', ' ', x).strip()
H2 = lambda t: ('h2', t); H3 = lambda t: ('h3', t); H4 = lambda t: ('h4', t); H5 = lambda t: ('h5', t)
P = lambda s: ('p', W(s)); UL = lambda *a: ('ul', [W(x) for x in a]); OL = lambda *a: ('ol', [W(x) for x in a])
FIG = lambda n, c: ('fig', n, W(c)); KC = lambda *g: ('kc', [(h, [W(i) for i in its]) for h, its in g]); MORPH = lambda *n: ('morph', list(n))
def TAB(n, title, rows, note=''): return ('tab', n, title, rows, note)

N = []
# ---------------------------------------------------------------- opening + introduction
N += [P(M(2)), H2('Introduction to Pathology')]
a, b = part(M(4), 'we will build ')
N += [P(a + ' ' + M(1)), P(b)]
lead = lambda s, k: s.replace(k, '**%s**' % k, 1)
N += [UL(M(5), lead(M(6), 'Pathogenesis'), lead(M(7), 'Morphologic changes'), M(8))]

# ---------------------------------------------------------------- overview of cellular responses
N += [H2('Overview of Cellular Responses to Stress and Noxious Stimuli'), P(M(11)), P(M(12)), FIG('2.1', cap(19))]
N += [P('This chapter discusses' + part(M(21), 'This chapter discusses')[1])]
c22, b22 = part(cap(22), ' The removal of unneeded and aged cells')
N += [FIG('2.2', c22), P('The removal of unneeded and aged cells' + b22)]
N += [H3('Causes of Cell Injury'), P(M(24)),
      H4('Oxygen Deprivation'), P(M(26)), H4('Physical Agents'), P(M(28)),
      H4('Chemical Agents and Drugs'), P(M(30)), P(M(31)), P(M(32)),
      H4('Infectious Agents'), P(M(34)), P(M(35)),
      H4('Immunologic Reactions'), P(M(37)), P(M(38)),
      H4('Genetic Abnormalities'), P(M(40)),
      H4('Nutritional Imbalances'), P(M(42)), P(M(43))]

# ---------------------------------------------------------------- pathways of cellular response
N += [H2('Pathways of Cellular Response to Stress and Injury'), P(M(46)),
      H3('Integrated Stress Response'), P(M(48)), FIG('2.3', cap(49)),
      H3('Unfolded Protein Response and Endoplasmic Reticulum Stress')]
c79, t79 = part(cap(79), ' that result in misfolded protein accumulation')
N += [P(M(52) + ' that result in misfolded protein accumulation' + t79), FIG('2.4', c79)]
rows = json.loads(json.dumps(SRC[77]['rows']))
for r in rows:
    r[:] = [x.replace('Hexosaminidase b subunit', 'Hexosaminidase β subunit').replace('GM gangliosides in neurons 2', 'GM₂ gangliosides in neurons')
             .replace('α-Antitrypsin 1', 'α₁-Antitrypsin').replace('Creutzfeldt-Jacob', 'Creutzfeldt-Jakob').replace('Ab peptide', 'Aβ peptide')
             .replace('Abnormal folding of Ab', 'Abnormal folding of Aβ') for x in r]
rows[4][0] = 'α₁-Antitrypsin deficiency'
N += [TAB('2.1', 'Selected Examples of Diseases Caused by Misfolding of Proteins', rows,
          'CFTR, Cystic fibrosis transmembrane conductance regulator; LDL, low-density lipoprotein; PrPsc, scrapie isoform of the prion protein.')]
N += [KC(('Integrated Stress Response (ISR)', [M(55), M(56), M(57), M(58)]),
         ('Unfolded Protein Response (UPR) and Endoplasmic Reticulum (ER) Stress', [M(60), M(61), M(62), M(63)]))]
N += [H3('Autophagy'), P(M(81)), P(M(82)),
      OL(M(83), M(84), M(85).replace(' Nutrient deprivation', ''))]
t87 = 'In recent years' + part(M(87), 'In recent years')[1]
t87, _ = part(t87, ' Rather, the loading of cargo into the')
N += [P(t87 + ' Rather, the loading of cargo into the autophagosome is selective' + part(M(92), 'autophagosome is selective')[1])]
N += [FIG('2.5', cap(91)), P(M(93)), P(M(94)), UL(M(95), M(96), M(97), M(98))]
N += [KC((None, [M(101), M(102), M(103), M(104)]))]

# ---------------------------------------------------------------- progression of injury and death
N += [H2('Progression of Cell Injury and Death'), P(M(106)), FIG('2.6', cap(107)), P(M(108)), P(M(109)),
      H3('Reversible Cell Injury'), P(M(111)), UL(M(112), M(113), M(114))]
c115 = M(115); cp7, rest = part(c115, ' MORPHOLOGY ')
cp7 = re.sub(r'^\*\*Fig\.? [\d.]+\*\*\s*', '', cp7)
morph_txt, death_txt = part(rest, ' CELL DEATH ')
intro_m, items_m = part(morph_txt, 'include:')
items = [x.strip() for x in re.split(r'\s*\b[1-5]\.\s+', items_m) if x.strip()]
N += [FIG('2.7', cp7), MORPH(P(intro_m + ' include:'), OL(*items))]
N += [H3('Cell Death'), P(death_txt)]
N += [P(M(116) + ' ' + M(120)), TAB('2.2', 'Features of Necrosis and Apoptosis', SRC[117]['rows']), FIG('2.8', cap(118)), FIG('2.9', cap(119))]
N += [H3('Necrosis'), P(M(122)), P(M(123)), P(M(124)), P(M(125)), P(M(126))]
n130a, n130b = part(M(130), ' It is useful to consider')
N += [MORPH(P(M(128)), P(M(129)), P(n130a)), P('It is useful to consider' + ' ' + n130b)]
t134a, t134b = part(M(134), ' Liquefactive necrosis, in contrast')
t135a, t135b = part(M(135), ' Caseous necrosis is encountered'); t135b, t135c = part('Caseous necrosis is encountered' + t135b, ' Fat necrosis refers to')
t136a, t136b = part(M(136), ' Ultimately, in the living patient')
N += [H4('Patterns of Tissue Necrosis'), P(M(132)),
      MORPH(H5('Coagulative Necrosis'), P(t134a), FIG('2.10', cap(157)),
            H5('Liquefactive Necrosis'), P('Liquefactive necrosis, in contrast' + t134b), FIG('2.11', cap(158)),
            H5('Gangrenous Necrosis'), P(t135a),
            H5('Caseous Necrosis'), P(t135b), FIG('2.12', cap(159)),
            H5('Fat Necrosis'), P('Fat necrosis refers to' + t135c), FIG('2.13', cap(160)),
            H5('Fibrinoid Necrosis'), P(t136a), FIG('2.14', cap(161))),
      P('Ultimately, in the living patient' + t136b)]
N += [KC((None, [M(139), M(140), M(141), M(142)]))]

# apoptosis
N += [H3('Apoptosis'), P(M(144)), H4('Causes of Apoptosis'), P(M(146))]
h, t = runin(M(147)); N += [H5(h), P(t), UL(M(148), M(149), M(150), M(151), M(152), M(153)), P(M(154))]
h, t = runin(M(155)); N += [H5(h), P(t), UL(M(156) + ' ' + M(162), M(163), M(164) + ' ' + M(165) + ' ' + M(166), M(167))]
N += [H4('Morphologic and Biochemical Changes in Apoptosis'), P(M(169))]
a175, b176 = part(M(176), 'A). Because')
N += [MORPH(P(M(171)), UL(M(172), M(173), M(174), M(175) + ' Fig. 2.15A).'), P('Because' + b176)), FIG('2.15', cap(177))]
c190, b190 = part(cap(190), ' Mechanisms of Apoptosis Apoptosis results')
N += [H4('Mechanisms of Apoptosis'), P('Apoptosis results' + b190), FIG('2.16', c190), P(M(191))]
h, t = runin(M(192)); N += [H5(h), P(t), P(M(193)), UL(M(194), M(195) + ' ' + M(196), M(197)), P(M(198))]
N += [H5('Extrinsic (Death Receptor–Initiated) Pathway of Apoptosis'), P(M(200)), P(M(201))]
h, t = runin(M(202)); N += [H5(h), P(t)]
h, t = runin(M(203)); N += [H5(h), P(t + ' ' + M(204))]
N += [KC((None, [M(207), M(208), M(209) + ' (1) ' + M(210) + ' (2) ' + M(211)]))]

# other mechanisms
N += [H3('Other Mechanisms of Cell Death'), P(M(213) + ' ' + M(214)), H4('Necroptosis'), P(M(216))]
a217, b217 = part(M(217), ' As indicated in ')
N += [P(a217 + ' As indicated in ' + M(218).replace('**Fig. 2.17**', 'Fig. 2.17')),
      P(b217[:-len(' TNF')] + ' ' + M(227)), FIG('2.17', cap(226))]
_t230 = M(230); _body230, _legend = part(_t230, ' DAMPs, Damage-associated')   # the caption legend was glued to the end of the body paragraph
_legend = 'DAMPs, Damage-associated' + _legend
N += [H4('Pyroptosis'), P(M(229)), P(_body230)]
# Fig 2.18 caption: block 231 ends "...by innate immune" and block 232 continues "infected cells are recognized..." (a word or two is missing in the source -> marked with an ellipsis)
_c232 = re.sub(r'^Cell Injury, Cell Death, and Adaptations \d+\s+', '', M(232))
N += [FIG('2.18', cap(231) + ' … ' + _c232 + ' ' + _legend), H4('Ferroptosis'), P(M(234))]
N += [KC((None, [M(237), M(238), M(239), M(240), M(241), M(242)]))]

# ---------------------------------------------------------------- mechanisms of cell injury
N += [H2('Mechanisms of Cell Injury'), P(M(244)), UL(M(245), M(246) + ' ' + M(247), M(248)), P(M(249)), FIG('2.19', cap(261))]
t251 = M(251).replace(' Hypoxia/**ischemia**', '')
N += [H3('Mitochondrial Damage and Dysfunction'), P(t251 + ' ' + M(254)), P(M(255)),
      UL(M(256) + ' ' + M(257))]
N += [FIG('2.20', cap(264)), UL(M(258), M(265), M(266) + ' ' + M(267), M(268)),
      UL(M(269), M(270))]
N += [H3('Membrane Damage'), P(M(271) + ' ' + M(276)), FIG('2.21', cap(275)), UL(M(277), M(278), M(279) + ' ' + M(280), M(281))]
N += [H3('Damage to DNA'), P(M(283)), P(M(284)), H3('Oxidative Stress: Accumulation of Oxygen-Derived Free Radicals'), P(M(287)), P(M(288)), P(M(289)),
      H4('Generation of Free Radicals'), P(M(291)),
      UL(M(292), M(293), M(294), M(295), M(296).replace('H₂O₂ 1 Fe²⁺ n Fe³⁺ 1 ˙OH 1 OH⁻', 'H₂O₂ + Fe²⁺ → Fe³⁺ + ˙OH + OH⁻'), M(297))]
_rows23 = [[C(c) for c in r] for r in SRC[298]['rows']]
_fx = [('O2•', 'O₂•⁻'), ('HO 2 2', 'H₂O₂'), ('ONOO2', 'ONOO⁻'), ('O during oxidative 2 phosphorylation', 'O₂ during oxidative phosphorylation'),
       ('from HO by 2 hydrolysis', 'from H₂O by hydrolysis'), ('from H₂O₂ by Fenton', 'from H₂O₂ by Fenton'), (' No enzymatic means of inactivation', ''),
       ('Conversion to HO and O 2 2 2 by SOD', 'Conversion to H₂O₂ and O₂ by SOD'), ('Conversion to HO and O 2 2 by catalase', 'Conversion to H₂O and O₂ by catalase'),
       ('HNO by peroxire- 2 doxins', 'HNO₂ by peroxiredoxins'), ('converted to OH and OCl2', 'converted to ˙OH and OCl⁻'), ('produc- tion', 'production'), ('oxygen- derived', 'oxygen-derived')]
for _r in _rows23:
    for _i, _c in enumerate(_r):
        for _x, _y in _fx: _c = _c.replace(_x, _y)
        _r[_i] = _c
_rows23[0][1] = 'O₂•⁻'; _rows23[0][3] = '˙OH'
_rows23[1][3] = _rows23[1][3].replace('from HO 2 2 by Fenton', 'from H₂O₂ by Fenton')
_rows23[1][4] = _rows23[1][4].replace('O₂• and NO', 'O₂•⁻ and NO')
_n23 = M(299).replace('Nitrite', 'nitrite').replace('O₂•,', 'O₂•⁻,').replace('OCl ⁻', 'OCl⁻').replace('ONOO ⁻', 'ONOO⁻').replace('; OH,', '; ˙OH,')
N += [TAB('2.3', 'Properties of the Principal Free Radicals Involved in Cell Injury', _rows23, _n23)]
c302, b302 = part(cap(302), ' Removal of Free Radicals Free radicals are inherently')
N += [FIG('2.22', c302), H4('Removal of Free Radicals'), P('Free radicals are inherently' + b302),
      UL(M(303), M(304), M(305).replace(' include:', ' include:')),
      OL(M(306).replace('(2H₂O₂ n O₂ 1 2H₂O)', '(2H₂O₂ → O₂ + 2H₂O)'),
         M(307).replace('(2 O₂• 1 2H n H₂O₂ 1 O₂)', '(2 O₂•⁻ + 2H⁺ → H₂O₂ + O₂)'),
         M(308).replace('(H₂O₂ 1 2GSH n GSSG [oxidized glutathione] 1 2H₂O)', '(H₂O₂ + 2GSH → GSSG [oxidized glutathione] + 2H₂O)')),
      H4('Pathologic Effects of Free Radicals'), P(M(310)), UL(M(311), M(312), M(313)), P(M(314))]
t316 = part(M(316), ' and later due to')[0] + ' and later due to'
N += [H3('Disturbance in Calcium Homeostasis'), P(t316 + ' ' + M(322)), FIG('2.23', cap(321)), UL(M(323), M(324))]
arrow = lambda s: re.sub(r'\s+n\s+', ' → ', s)
N += [KC((None, [arrow(M(327)), arrow(M(328)), M(329), M(330), M(331), M(332)]))]

# ---------------------------------------------------------------- clinicopathologic correlations
N += [H2('Clinicopathologic Correlations: Selected Examples of Cell Injury and Death'), P(M(335)),
      H3('Hypoxia and Ischemia'), P(M(337)), P(M(338)), H4('Mechanisms of Ischemic Cell Injury'), P(M(340)), P(M(341))]
c346, b346 = part(M(346), ' may sustain loss')
N += [FIG('2.24', cap(345) + ' ' + c346), H3('Ischemia-Reperfusion Injury'), P(M(343) + ' may sustain loss' + b346),
      UL(M(347), M(348), M(349), M(350))]
N += [H3('Chemical (Toxic) Injury'), P(M(352) + ' ' + M(353)), P(M(354)), P(M(355)), UL(M(356), M(357) + ' ' + M(358))]
N += [KC((None, [arrow(M(361)), M(362), M(363), M(364), M(365)]))]

# ---------------------------------------------------------------- adaptations
N += [H2('Cellular Adaptations to Stress'), P(M(367)),
      H3('Hypertrophy'), P(M(369)), P(M(370)),
      UL(M(371) + ' ' + M(372) + ' ' + M(373), M(374)), FIG('2.25', cap(378)),
      H4('Mechanisms of Hypertrophy'), P(M(376))]
c384, b384 = part(M(384), ' effects of mechanical force')
N += [P(M(377) + ' effects of mechanical force' + b384), FIG('2.26', cap(383) + ' ' + c384), UL(M(385), M(386), M(387), M(388)), P(M(389)), P(M(390))]
N += [H3('Hyperplasia'), P(M(392)), UL(M(393), M(394)), P(M(395)), H4('Mechanisms of Hyperplasia'), P(M(397))]
N += [H3('Atrophy'), P(M(399)), P(M(400)), UL(M(401), M(402), M(403), M(404), M(405), M(406)), FIG('2.27', cap(407)), P(M(408)), H4('Mechanisms of Atrophy'), P(M(410))]
N += [H3('Metaplasia'), P(M(412)), P(M(413)), P(M(414)), FIG('2.28', cap(415)), P(M(416)), P(M(417)), H4('Mechanisms of Metaplasia'), P(M(419))]
N += [KC(('Cellular Adaptations to Stress', [
    '**Hypertrophy:** increased cell and organ size, often in response to increased workload; induced by growth factors produced in response to mechanical stress or other stimuli; occurs in tissues with limited proliferative capacity. It may be physiologic (e.g., enlargement of the uterus in pregnancy) or pathologic (e.g., enlargement of the heart in hypertension or valvular disease).',
    '**Hyperplasia:** increased cell numbers in response to hormones and other growth factors; occurs in tissues whose cells can divide or contain abundant tissue stem cells. It may be physiologic in response to increased need (e.g., breast acini during lactation) or pathologic in response to inappropriate secretion of hormones (e.g., endometrial **hyperplasia** due to excessive estrogenic stimulation).',
    '**Atrophy:** decreased cell and organ size, because of decreased nutrient supply or disuse; associated with decreased synthesis of cellular building blocks and increased breakdown of proteins and cellular organelles via the ubiquitin-proteasome pathway and **autophagy**, respectively.',
    '**Metaplasia:** change in phenotype of differentiated cells, often in response to chronic irritation, that makes cells better able to withstand the stress; usually induced by altered differentiation pathway of tissue stem cells; may result in reduced function or increased propensity for malignant transformation.']))]

# ---------------------------------------------------------------- intracellular accumulations
N += [H2('Intracellular Accumulations'),
      P(_dw(M(426), 'Accumulation of INTRACELLULAR ACCUMULATIONS abnormal proteins ', ' 3', 'Lack of ', ' enzyme')),
      OL(_dw(M(427), 'Complex Soluble ', ' substrate products Complex Enzyme substrate'), _dw(M(428), 'Lysosomal storage disease: ', ' endogenous materials 1').replace('a -antitrypsin', 'α₁-antitrypsin'), M(429),
         _dw(M(430), ' 4', 'Ingestion of ', ' indigestible').replace('alteration materials', 'alteration')),
      P(M(431)),
      FIG('2.29', 'Mechanisms of intracellular accumulations. (The caption text was not recoverable from the source; the four numbered mechanisms are listed above.)')]
t432 = M(432)
N += [H3('Lipids'), P('All major classes of lipids can accumulate in cells: triglycerides, cholesterol/cholesterol esters, and phospholipids. Phospholipids are components of the myelin figures found in necrotic cells. In addition, abnormal complexes of lipids and carbohydrates accumulate in the lysosomal storage diseases (Chapter 5). Triglyceride and cholesterol accumulations are discussed here.'),
      H4('Steatosis (Fatty Change)'),
      P('The terms steatosis and fatty change describe abnormal accumulations of triglycerides within parenchymal cells. Fatty change is often seen in the liver because it is the major organ involved in fat metabolism (Fig. 2.30), but it also occurs in the heart, muscle, and kidney. ' + 'The causes' + part(t432, 'The causes')[1]),
      FIG('2.30', cap(440)),
      H4('Cholesterol and Cholesterol Esters'), P(M(434)), P(M(435)), UL(M(436), M(437), M(438), M(439)), FIG('2.31', cap(442))]
N += [H3('Proteins'), P(M(444)), UL(M(445).replace('Reabsorption droplets', '**Reabsorption droplets**', 1)),
      FIG('2.32', cap(449)), UL(M(446), M(447), M(448), M(450) + ' ' + M(451))]
N += [H3('Hyaline Change'), P(M(453)), H3('Glycogen'), P(M(455)), P(M(456)), P(M(457)),
      H3('Pigments'), P(M(459)), H4('Exogenous Pigments'), P(M(461)), P(M(462)), H4('Endogenous Pigments')]
c466, b466 = part(cap(466), ' Hemosiderin, a hemoglobin-derived')
N += [H5('Lipofuscin'), P(M(464)), FIG('2.33', c466), H5('Melanin'), P(M(465)), H5('Hemosiderin'), P('Hemosiderin, a hemoglobin-derived' + b466), P(M(467))]
N += [KC((None, [M(479), ]),
         ('Deposition of lipids', [M(481), M(482)]),
         ('Other deposits', [M(483), M(484), M(485)]),
         ('Pathologic calcifications', [M(487), M(488)]))]

# ---------------------------------------------------------------- pathologic calcification
c471, r471 = part(cap(471), ' Dystrophic Calcification Dystrophic calcification is encountered')
r471 = 'Dystrophic calcification is encountered' + r471
body471, morph471 = part(r471, ' MORPHOLOGY Histologically')
morph471 = 'Histologically' + morph471
m1, m2 = part(morph471, ' On occasion, single necrotic cells'); m2, m3 = part('On occasion, single necrotic cells' + m2, ' In asbestosis')
N += [H2('Pathologic Calcification'), P(M(469)), P(M(470)), FIG('2.34', c471), H3('Dystrophic Calcification'),
      P(body471), MORPH(P(m1), P(m2), P('In asbestosis' + m3)), P(M(472)),
      H3('Metastatic Calcification'), P(M(474)), P(M(475)), P(M(476))]

# ---------------------------------------------------------------- cellular aging
t497 = part(M(497), ' Cells from children')[0] + ' Cells from children ' + M(506)
N += [H2('Cellular Aging'), P(M(490)), P(M(491)), P(M(492)), FIG('2.35', cap(505)),
      H3('DNA Damage'), P(M(494)), P(M(495)), H3('Cellular Senescence'), P(t497.replace(' Cells from children have', ' Cells from children have')),
      UL(M(507) + ' ' + M(508), M(509)), FIG('2.36', cap(518)),
      H3('Defective Protein Homeostasis'), P(M(511)), H3('Dysregulated Nutrient Sensing'), P(M(513)), P(M(514))]
t515 = part(M(515), ' IGF-1, A Increasing age')[0] + ' IGF-1,'
t517 = 'as indicated by its name' + part(M(517), 'as indicated by its name')[1]
N += [UL(t515 + ' ' + t517 + ' ' + M(519), M(520) + ' ' + M(521))]
N += [KC((None, [M(524), M(525), M(526), M(527), M(528) + ' ' + M(529)]))]
N += [('sum', M(531)), ('h2', 'Acknowledgment'), P(M(533))]
refs = [M(535), M(536), M(537) + ' ' + M(538), M(539) + ' ' + M(540), M(541), M(542) + ' ' + M(543), M(544), M(545), M(546), M(547) + ' ' + M(548), M(549) + ' ' + M(550), M(551) + ' ' + M(552), M(553)]
N += [('h2', 'Selected Readings'), ('refs', refs)]

NODES = N
TITLE = 'Cell Injury, Cell Death, and Adaptations'
