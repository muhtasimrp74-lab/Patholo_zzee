# -*- coding: utf-8 -*-
"""Curated Chapter 3 (Inflammation and Repair). Source: tools/textbook_src/ch03.json. See ch03_notes.md for reconstructions."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = json.load(open(os.path.join(HERE, '..', 'textbook_src', 'ch03.json'), encoding='utf8'))['blocks']
RUN_HDR = [r'\s*CHAPTER\s*[3₃]\s+Inflammation and Repair(?:\s+\d{2}\b)?\s*']
FIX = [('si-alylated', 'sialylated'), ('filopo-dia', 'filopodia'), ('inac-curate', 'inaccurate'), ('hyperalge-sic', 'hyperalgesic'), ('acetylat-ing', 'acetylating'),
       ('a₂-Macro-globulin', 'α₂-macroglobulin'), ('a₁- antitrypsin', 'α₁-antitrypsin'), ('a₁-antitrypsin', 'α₁-antitrypsin'), ('the b1 integrin', 'the β1 integrin'), ('the b2 integrins', 'the β2 integrins'),
       ('MIP-1a or', 'MIP-1α or'), ('macrophage inflammatory protein-1a', 'macrophage inflammatory protein-1α'), ('PGF₂a', 'PGF₂α'), ('PGF₁a', 'PGF₁α'), ('FceRI', 'FcεRI'), ('eicosa 5 20', 'eicosa = 20'),
       ('cells/mL', 'cells/μL'), ('40 to 50 mm in diameter', '40 to 50 μm in diameter'), ('CX₃ C chemokines', 'CX₃C chemokines'), ('effect red cells', 'effete red cells'),
       ('*In situ*ations', 'In situations'), ('inflammation. ,', 'inflammation.'), ('transforming growth factor-β (TGF-β) and IL-10', 'transforming growth factor-β (TGF-β) and IL-10'),
       ('superoxide anion (O•), a major ROS. In neutrophils, 2 this', 'superoxide anion (O₂•⁻), a major ROS. In neutrophils, this'),
       ('converts H O to hypochlorite (ClO⁻), 2 2 the', 'converts H₂O₂ to hypochlorite (ClO⁻), the'), ('O• is converted into hydrogen peroxide 2 (H₂O₂)', 'O₂•⁻ is converted into hydrogen peroxide (H₂O₂)'),
       ('with superoxide (O•) to generate the highly reactive free 2 radical', 'with superoxide (O₂•⁻) to generate the highly reactive free radical'), ('superoxide (O•) and hydrogen peroxide', 'superoxide (O₂•⁻) and hydrogen peroxide'),
       ('recogniz- able', 'recognizable'), ('Greek eicosa', 'Greek eicosa'), ('mm Hg', 'mm Hg')]
def C(s):
    for r in RUN_HDR: s = re.sub(r, ' ', s)
    for a, b in FIX: s = s.replace(a, b)
    return re.sub(r'\s{2,}', ' ', s).strip()
def M(i): return C(SRC[i].get('md', ''))
def part(s, m):
    assert m in s, (m, s[:90]); a, _, b = s.partition(m); return a.rstrip(), b.rstrip()
def cap(i): return re.sub(r'^\*\*Fig\.? [\d.]+\*\*\s*', '', M(i))
def runin(s):
    m = re.match(r'^(.{3,90}?)\.\s+(.*)$', s, re.S); assert m, s[:60]; return m.group(1).replace('**', ''), m.group(2)
W = lambda x: re.sub(r'\s+', ' ', x).strip()
H2 = lambda t: ('h2', t); H3 = lambda t: ('h3', t); H4 = lambda t: ('h4', t); H5 = lambda t: ('h5', t)
P = lambda s: ('p', W(s)); UL = lambda *a: ('ul', [W(x) for x in a]); OL = lambda *a: ('ol', [W(x) for x in a])
FIG = lambda n, c: ('fig', n, W(c)); KC = lambda *g: ('kc', [(h, [W(i) for i in its]) for h, its in g]); MORPH = lambda *n: ('morph', list(n))
def TAB(n, title, rows, note=''): return ('tab', n, title, [[C(c) if isinstance(c, str) else c for c in r] for r in rows], note)
def RUN(i):
    h, t = runin(M(i)); return [H5(h), P(t)]
N = []
# ======================================================= GENERAL FEATURES
N += [H2('General Features of Inflammation')]
intro = ("Inflammation is a response of vascularized tissues that delivers leukocytes and molecules of host defense from the circulation to sites of infection and cell damage. "
 "Although in common medical and lay parlance inflammation suggests a harmful reaction, it is actually a response that is essential for survival. It serves to rid the host of both the initial cause of cell injury (e.g., microbes, toxins) and the consequences of such injury (e.g., necrotic cells and tissues). "
 "The mediators of defense include phagocytic leukocytes, antibodies, and complement proteins. Most of these normally circulate in a resting state in the blood, where they are sequestered from tissues and unable to cause damage and from where they can be rapidly recruited to any site in the body when they are needed. "
 "Some of the cells involved in inflammatory responses also reside in tissues, where they function as sentinels on the lookout for threats. The process of inflammation delivers circulating leukocytes and proteins to tissues and activates the recruited and resident cells as well as some soluble molecules, which then function to get rid of the harmful or unwanted substances. "
 "Without inflammation, infections would go unchecked, wounds would never heal, and injured tissues might remain permanent festering sores. The suffix -itis after an organ denotes inflammation in that site, such as **appendicitis**, conjunctivitis, or meningitis. "
 "The typical inflammatory reaction develops through a series of sequential steps, which can be remembered as the five R’s (Fig. 3.1):")
t4 = part(M(8), '**Fig. 3.1**')  # caption/body split below
c8, b8 = part(cap(8), ' complement proteins) can be delivered')
rec_item = 'Recruitment of leukocytes and plasma proteins into the tissues. Since blood perfuses every tissue, leukocytes and proteins (e.g., complement proteins) can be delivered' + b8
N += [P(intro), OL('Recognition of the noxious agent that is the initiating stimulus for inflammation. The cells involved in inflammation (tissue-resident sentinel cells such as dendritic cells, phagocytes, and others) are equipped with receptors that recognize microbial products and substances released from damaged cells. These receptors are described in more detail later. Engagement of the receptors leads to the production of mediators of inflammation, which then trigger the subsequent steps in the inflammatory response.',
                     rec_item, M(9), M(10), M(11)), FIG('3.1', c8), P(M(12))]
rows31 = [['Feature', 'Acute', 'Chronic'], ['Onset', 'Fast: minutes or hours', 'Slow: days'], ['Cellular infiltrate', 'Mainly neutrophils', 'Monocytes/macrophages and lymphocytes'],
          ['Tissue injury, fibrosis', 'Usually mild and self-limited', 'May be severe and progressive'], ['Local and systemic signs', 'Prominent', 'Less']]
rows32 = [['Disorders', 'Cells and Molecules Involved in Injury'], ['**Acute**', ''], ['Acute respiratory distress syndrome', 'Neutrophils'], ['Asthma', 'Eosinophils; IgE antibodies'],
          ['Glomerulonephritis, vasculitis', 'Antibodies and complement; neutrophils, monocytes'], ['Septic shock', 'Cytokines'], ['**Chronic**', ''],
          ['Rheumatoid arthritis', 'Lymphocytes, macrophages; antibodies?'], ['Asthma', 'Eosinophils; IgE antibodies'], ['Atherosclerosis', 'Macrophages; lymphocytes'], ['Pulmonary fibrosis', 'Macrophages; fibroblasts']]
N += [UL(M(14)), UL(M(15) + ' ' + M(16)), TAB('3.1', 'Features of Acute and Chronic Inflammation', rows31),
      UL(M(17) + ' ' + part(M(22), 'with antiinflammatory drugs')[0].join(['', '']) if False else M(17) + ' with antiinflammatory drugs' + part(M(22), 'with antiinflammatory drugs')[1]),
      TAB('3.2', 'Examples of Diseases Caused by Inflammatory Reactions', rows32, M(21) + ' IgE, immunoglobulin E.'),
      UL(M(23) + ' ' + M(24) + ' ' + M(25), M(26))]
N += [H3('Historical Highlights'), P(M(28)), H3('Causes of Inflammation'), P(M(30)), UL(M(31), M(32), M(33), M(34)),
      H3('Recognition of Microbes and Damaged Cells'), P(M(36)), UL(M(37), M(38), M(39), M(40))]
N += [KC((None, [M(43), M(44), M(45) + ' ' + M(46), M(47), M(48), M(49)]))]
# ======================================================= ACUTE INFLAMMATION
N += [H2('Acute Inflammation'), P(M(52)), P(M(53)), H3('Reactions of Blood Vessels in Acute Inflammation'), P(M(55)),
      FIG('3.2', part(cap(66), ' Leukocytes Histamine,')[0]), H4('Changes in Vascular Flow and Caliber'), P(M(57)),
      UL(M(58), M(59), M(60), part(M(61), ' (high protein content')[0])]
N += [H4('Increased Vascular Permeability (Vascular Leakage)'), P(M(68)), FIG('3.3', cap(67)), UL(M(69), M(70) + ' ' + M(71)), P(M(72))]
N += [H3('Responses of Lymphatic Vessels and Lymph Nodes'), P(M(74)), P(M(75)), KC((None, [M(78), M(79), M(80)]))]
N += [H3('Leukocyte Recruitment to Sites of Inflammation'), P(M(82) + ' ' + M(83)), P(M(84)),
      OL(M(85), M(86), 'Migration in the tissues toward a chemotactic stimulus.'),
      H4('Leukocyte Adhesion to Endothelium'), P(M(89)), P(M(90)), UL(M(91), M(92))]
rows33 = json.loads(json.dumps(SRC[100]['rows']))
for r in rows33: r[:] = [x.replace('a4b7', 'α4β7').replace('endothe- lium', 'endothelium') for x in r]
n101, t101 = part(M(101), ' localization of myosin filaments')
N += [TAB('3.3', 'Endothelial and Leukocyte Adhesion Molecules', rows33, n101),
      H4('Leukocyte Migration Through Endothelium'), P(M(94) + ' ' + M(96)), FIG('3.4', cap(95)),
      H4('Chemotaxis of Leukocytes'), P(M(98)), P(M(99) + ' localization of myosin filaments' + t101), P(part(M(102), ' can also compromise')[0] + ' can also compromise ' + M(105)), FIG('3.5', cap(104))]
N += [KC((None, [M(108), M(109), M(110), M(111)]))]
# phagocytosis
rows34 = [['', 'Neutrophils', 'Macrophages'],
          ['Origin', 'HSCs in bone marrow', 'HSCs in bone marrow (in inflammatory reactions). Many tissue-resident macrophages: stem cells in yolk sac or fetal liver (early in development)'],
          ['Lifespan in tissues', 'Several days', 'Macrophages recruited from blood: days or weeks. Tissue-resident macrophages: years'],
          ['Responses to activating stimuli', 'Rapid, short lived, mostly degranulation and enzymatic activity', 'More prolonged, slower, often dependent on new gene transcription'],
          ['Reactive oxygen species', 'Rapidly induced by assembly of phagocyte oxidase (respiratory burst)', 'Less prominent'],
          ['Nitric oxide', 'Low levels or none', 'Produced by transcriptionally activated iNOS'],
          ['Degranulation', 'Major response; induced by cytoskeletal rearrangement', 'Not prominent'],
          ['Cytokine production', 'Low levels or none', 'Major functional activity; requires transcriptional activation of cytokine genes'],
          ['NET formation', 'Rapidly induced, by extrusion of nuclear contents', 'No'],
          ['Secretion of lysosomal enzymes', 'Prominent', 'Less']]
n118 = part(M(118), ' Images from Forbes')[0]
N += [H3('Phagocytosis and Clearance of the Offending Agent'), P(M(113)), P(M(115) + ' ' + M(116)),
      TAB('3.4', 'Properties of Neutrophils and Macrophages', rows34, n118 + ' This table lists the major differences between neutrophils and macrophages. Note that the two cell types share many features such as phagocytosis, ability to migrate through blood vessels into tissues, and chemotaxis.'),
      P(M(117)), FIG('3.6', cap(126)), H4('Phagocytosis'), P(M(128))]
head129, rest129 = part(M(129), ' Phagocytic Receptors.')
items129 = [x for x in re.split(r'\s+\d\.\s+', head129) if x]
items129[-1] = items129[-1].rstrip('.') + ('l.' if items129[-1].endswith('materia') else '')
h, t = runin('Phagocytic Receptors.' + rest129)
N += [OL(*items129), H5(h), P(t)] + [H5('Engulfment'), P(part(M(130), 'Engulfment. ')[1] + ' ' + M(131))]
N += [H4('Intracellular Destruction of Microbes and Debris'), P(M(133))]
t134 = part(M(134), ' 1. Recognition')[0]
h, t = runin(t134 + ' ' + M(139)); N += [H5(h), P(t), FIG('3.7', cap(138)), P(M(140))]
h, t = runin(M(141)); N += [H5(h), P(t + ' ' + M(142))]
h, t = runin(M(143)); N += [H5(h), P(t), P(M(144))]
N += [H4('Neutrophil Extracellular Traps'), P(M(146)), FIG('3.8', cap(147))]
N += [H3('Leukocyte-Mediated Tissue Injury'), P(M(149)), UL(M(150), M(151), part(M(152), ' In all these situations')[0]),
      P('In all these situations' + part(M(152), ' In all these situations')[1]), P(M(153))]
N += [H3('Other Functional Responses of Activated Leukocytes'), P(M(155)), P(M(156)), H3('Termination of the Acute Inflammatory Response'), P(M(158)),
      KC((None, [M(161), M(162), M(163), M(164), M(165), M(166)]))]
# mediators
N += [H3('Mediators of Inflammation'), P(M(168)),
      UL(M(169), M(170), M(171) + ' ' + part(M(173), 'but we still do not know')[0].join(['', '']) if False else M(171) + ' but we still do not know' + part(M(173), 'but we still do not know')[1])]
N += [TAB('3.5', 'Principal Mediators of Inflammation', SRC[172]['rows'], 'IL, interleukin; TNF, tumor necrosis factor.'),
      UL(M(174), M(175) + ' ' + M(176)), P(M(177))]
N += [H4('Vasoactive Amines: Histamine and Serotonin'), P(M(179)), P(M(180)), P(M(181)), P(M(183)), P(M(184))]
p189a = part(M(189), ' Stimulus Cell membrane')[0]
p189 = p189a + ' in the pathway. Some of these enzymes have restricted tissue distributions. The prostaglandins have numerous functions.'
rows36 = [['Action', 'Eicosanoid'], ['Vasodilation', 'Prostaglandins PGI₂ (prostacyclin), PGE₁, PGE₂, PGD₂'], ['Vasoconstriction', 'Thromboxane A₂, leukotrienes C₄, D₄, E₄'],
          ['Increased vascular permeability', 'Leukotrienes C₄, D₄, E₄'], ['Chemotaxis, leukocyte adhesion', 'Leukotriene B₄, HETE']]
N += [H4('Arachidonic Acid Metabolites'), P(M(186)), P(M(187)), FIG('3.9', cap(200)), TAB('3.6', 'Principal Actions of Arachidonic Acid Metabolites in Inflammation', rows36, 'HETE, hydroxyeicosatetraenoic acid.')]
h, t = runin(M(188)); N += [H5(h), P(t), P(p189), UL(M(204)), P(M(205))]
t206a, t206 = part(M(206), ' Leukotrienes. Leukotrienes are produced'); t206b, t206c = part('Leukotrienes. Leukotrienes are produced' + t206, ' Lipoxins. Lipoxins are also generated')
N += [P(t206a), H5('Leukotrienes'), P(t206b.replace('Leukotrienes. Leukotrienes are produced', 'Leukotrienes are produced')), H5('Lipoxins'), P('Lipoxins are also generated' + t206c)]
h, t = runin(M(207)); N += [H5(h), P(t),
      UL(M(208) + ' ' + SRC[209]['note'].strip() + ' ' + M(210), M(211), M(212), M(213), M(214))]
c216a, c216b = part(M(216), ' The most important cytokines involved')
n216 = 'The most important cytokines involved' + c216b
N += [H4('Cytokines and Chemokines'), P(c216a + ' ' + part(M(217), 'tumor necrosis factor. ')[1] if False else c216a + ' ' + part(M(217), 'TNF, tumor necrosis factor.')[1])]
rows37 = [list(r) for r in SRC[209]['rows']]
rows37[1][0] = '**In acute inflammation**'; rows37[7][0] = '**In chronic inflammation**'
N += [TAB('3.7', 'Cytokines in Inflammation', rows37, n216.replace('There is also considerable', 'There is also considerable') + ' IFN-γ, interferon-γ; IL, interleukin; NK, natural killer; TNF, tumor necrosis factor.')]
h, t = runin(M(218)); N += [H5(h), P(t), P(M(219)), UL(M(220), M(221), M(222))]
t223a, t223b = part(M(223), ' Chemokines. Chemokines are a family')
N += [P(t223a), H5('Chemokines'), P('Chemokines are a family' + t223b), P(M(224))]
t225a = part(M(225), ' LOCAL INFLAMMATION')[0]
t227 = 'chemotaxis' + part(M(227), ' chemotaxis')[1]
fig310 = ('Major roles of cytokines in acute inflammation. TNF and IL-1 (with IL-6 and chemokines) cause local inflammation (endothelial activation, increased expression of adhesion molecules, leukocyte recruitment), systemic protective effects (fever, acute-phase proteins), and systemic pathologic effects (reduced appetite and cachexia, insulin resistance in skeletal muscle, loss of fatty tissue). CRP, C-reactive protein; IL, interleukin; PG, prostaglandin; TNF, tumor necrosis factor.')
N += [FIG('3.10', fig310), UL(t225a + ' ' + t227, M(229), M(230), M(231)), P(M(232)), P(M(233)), UL(M(234), M(235)), P(M(236))]
h, t = runin(M(237)); N += [H5(h), P(t)]
# complement
N += [H4('Complement System'), P(M(239)), P(M(240)), UL(M(241), M(242), part(M(243), ' All three pathways of complement activation lead')[0]),
      P('All three pathways of complement activation lead' + part(M(243), ' All three pathways of complement activation lead')[1]), P(M(244))]
a247, b247 = part(M(247), ' The activation of complement is tightly controlled')
t253 = 'amounts of complement' + part(M(253), 'amounts of complement')[1]
N += [UL(M(245), M(246), a247), P('The activation of complement is tightly controlled' + b247 + ' Regulatory proteins can be overwhelmed when large ' + t253), FIG('3.11', cap(254)),
      UL(M(255), M(256), M(257)), P(M(258)), P(M(259))]
# other mediators
n261a, n261b = part(M(261), ' Products of Coagulation. A link')
h, t = runin(n261a); N += [H4('Other Mediators of Inflammation'), H5(h), P(t), H5('Products of Coagulation'), P('A link' + n261b)]
h, t = runin(M(262) + ' ' + M(263)); N += [H5(h), P(t)]
h, t = runin(M(264)); N += [H5(h), P(t), P(M(265) + ' ' + M(266))]
rows38 = [['Reaction of Inflammation', 'Principal Mediators'], ['Vasodilation', 'Histamine'], ['Increased vascular permeability', 'Histamine and serotonin; C3a and C5a (by liberating vasoactive amines from mast cells and other cells); leukotrienes C₄, D₄, E₄'],
          ['Chemotaxis, leukocyte recruitment and activation', 'TNF, IL-1; chemokines; C3a, C5a; leukotriene B₄'], ['Fever', 'IL-1, TNF; prostaglandins'], ['Pain', 'Prostaglandins; bradykinin; substance P'],
          ['Tissue damage', 'Lysosomal enzymes of leukocytes; reactive oxygen species']]
N += [TAB('3.8', 'Role of Mediators in Different Reactions of Inflammation', rows38, 'IL-1, interleukin-1; TNF, tumor necrosis factor.'),
      KC((None, [M(269) + ' permeability.', M(270), M(271), M(272), M(273)]))]
# morphologic patterns
N += [H3('Morphologic Patterns of Acute Inflammation'), P(M(275)), H4('Serous Inflammation'), P(M(281)), FIG('3.12', cap(279)),
      H4('Fibrinous Inflammation'), P(M(283)), FIG('3.13', cap(284)), P(M(286)),
      H4('Purulent (Suppurative) Inflammation and Abscess'), P(M(288)), P(M(289)), FIG('3.14', cap(285)),
      H4('Ulcers'), P(M(291)), P(M(292)), FIG('3.15', cap(293))]
N += [H3('Outcomes of Acute Inflammation'), P(M(295)), UL(M(296) + ' ' + M(297), M(298), M(299)), FIG('3.16', part(cap(310), ' CHRONIC INFLAMMATION')[0]),
      H3('Summary of Acute Inflammation'), P(M(301)), P(M(302)), KC((None, [M(305), M(306), M(307), M(308), M(309)]))]
# ======================================================= CHRONIC INFLAMMATION
c310 = M(310)
N += [H2('Chronic Inflammation'),
      P('Chronic inflammation is a response of prolonged duration (weeks or months) in which inflammation, tissue injury, and attempts at repair coexist. It may follow acute inflammation, as described earlier, or chronic inflammation may begin insidiously, as a prolonged response without a preceding acute reaction.'),
      H3('Causes of Chronic Inflammation'), P('Chronic inflammation arises in the following settings.')]
a311, b311 = part(M(311), ' role in a group of diseases')
N += [UL(a311, '**Hypersensitivity diseases.** Chronic inflammation plays an important' + ' role in a group of diseases' + b311, M(312)),
      H3('Morphologic Features'), P(M(314)), UL(M(315), M(316), M(317)), P(M(318)),
      H3('Cells and Mediators of Chronic Inflammation'), P(M(320)), H4('Role of Macrophages'), P(M(322)), P(M(323)), P(M(324)), P(M(325)),
      UL(M(326), M(327), M(328), M(335) + ' ' + M(336)), FIG('3.17', cap(329)), FIG('3.18', cap(334)), P(M(337)),
      UL(M(338).replace('Classical macrophage activation', '**Classical macrophage activation**', 1), M(339).replace('Alternative macrophage activation', '**Alternative macrophage activation**', 1)),
      P(M(340)), FIG('3.19', cap(341)), P(M(342))]
N += [H4('Role of Lymphocytes'), P(M(344)), P(M(345)), UL(M(346), M(347), M(348)), P(M(349) + ' ' + M(350)), P(M(351)), FIG('3.20', cap(354)),
      P(part(M(352), ' Antigen- ₊ presenting')[0])]
c361, t361 = part(cap(361), ' recognize antigen')
N += [H4('Other Cells in Chronic Inflammation'), P(M(356)), UL(M(357) + ' ' + M(358), M(359) + ' recognize antigen' + t361, M(362)), FIG('3.21', c361)]
N += [H3('Granulomatous Inflammation'), P(M(364)), P(M(365)), UL(M(366), M(367)), MORPH(P(M(369))),
      P(M(370) + ' ' + M(372)), TAB('3.9', 'Examples of Diseases With Granulomatous Inflammation', SRC[371]['rows']), FIG('3.22', cap(373)),
      KC((None, [M(376), M(377), M(378), M(379), M(380), M(381)]))]
# ======================================================= SYSTEMIC EFFECTS
N += [H2('Systemic Effects of Inflammation'), P(M(383)), P(M(384)),
      UL(M(385) + ' ' + M(386), M(387), M(388) + ' ' + M(390), M(391), M(392) + ' ' + M(393)), P(M(400)),
      KC((None, [M(396), M(397), M(398), M(399)]))]
# ======================================================= TISSUE REPAIR
li404 = M(404); a404 = part(li404, ' Following mild injury')[0]; b404 = part(li404, ' scar formation. cells and their progenitors')[1]
N += [H2('Tissue Repair'), P(M(402)), P(M(403)),
      UL(a404 + ' cells and their progenitors' + b404, M(406)),
      FIG('3.23', 'Mechanisms of tissue repair: regeneration and scar formation. Following mild injury, which damages the epithelium but not the underlying tissue, resolution occurs by regeneration. More severe injury damages the connective tissue, and repair is by scar formation.'),
      P(M(407)), H3('Cell and Tissue Regeneration'), P(M(409)), P(M(410)), UL(M(411), M(412), M(413) + ' ' + M(414))]
a415, b415 = part(M(415), ' Cell proliferation is driven by signals')
N += [P(a415), P('Cell proliferation is driven by signals' + b415), P(M(416) + ' ' + M(417))]
N += [H3('Liver Regeneration'), P(M(419)), UL(M(420), M(421)), KC((None, [M(424), M(425), M(426), M(427)]))]
N += [H3('Repair by Scarring'), P(M(429)), H4('Steps in Scar Formation'), P(M(431)),
      UL(M(432), M(433) + ' ' + M(434) + ' ' + M(435) + ' ' + M(436), M(437), M(438).replace(' Platelet Eschar Fibroblast Epithelial cells', '')),
      FIG('3.24', cap(439)), FIG('3.25', cap(440))]
N += [H4('Angiogenesis'), P(M(442)), P('Angiogenesis involves sprouting of new vessels from existing ones and consists of (Fig. 3.26):'),
      OL(M(444), M(445), M(446), M(447), M(448), M(449), M(450)), FIG('3.26', cap(454))]
h, t = runin(M(456)); N += [H5(h), P(t), P(M(457)), P(M(458) + ' CM to permit remodeling and extension of the vascular tube.' if False else M(458).replace('degrade the E', 'degrade the ECM to permit remodeling and extension of the vascular tube.') if False else M(458) + 'CM to permit remodeling and extension of the vascular tube.')]
m462 = M(462); a462, b462 = part(m462, ' Persistent tissue injury Cytokines'); frag462, c462 = part('Persistent tissue injury Cytokines' + b462, ' in a healing wound site.')
N += [H4('Deposition of Connective Tissue'), P(M(460)), P(M(461)), P(a462 + ' in a healing wound site.' + c462),
      FIG('3.27', cap(463) + ' ' + frag462), H4('Remodeling of Connective Tissue'), P(M(465))]
N += [KC((None, [M(470), M(471), M(472), M(473)]))]
rows310 = [['Feature', 'Healing by first intention', 'Healing by second intention'],
           ['Wound', 'Clean, uninfected; surgical incision', 'Open, often infected; large wound'], ['Tissue loss', 'None or minimal', 'Present'], ['Wound edges', 'Approximated (e.g., sutured)', 'Not approximated'],
           ['Cell death and inflammation', 'Limited', 'Extensive'], ['Healing', 'Epithelial regeneration predominates over fibrosis', 'Regeneration plus scarring; fibrosis predominates; wound contraction'], ['Result', 'Small scar', 'Large scar']]
rows311 = [['Time after injury', 'Principal events'],
           ['Hours', 'Blood clot fills the incision; neutrophils infiltrate the margins and migrate toward the fibrin clot'],
           ['24–48 hours', 'Epithelial cells at the margins proliferate and migrate across the incision; a thin continuous epithelial layer forms'],
           ['Day 3', 'Neutrophils are replaced by macrophages; granulation tissue invades the incision space; collagen fibers appear at the margins'],
           ['Day 5', 'Neovascularization is maximal; collagen fibrils bridge the incision; the epidermis recovers normal thickness'],
           ['Week 2', 'Collagen and fibroblasts continue to accumulate; inflammatory infiltrate, edema, and vascularity diminish'],
           ['Month 1', 'Scar of cellular connective tissue largely free of inflammation, covered by intact epidermis; tensile strength continues to increase over months']]
a476 = M(476).replace(' TABLE 3.11 Kinetics of Healing of Skin Wounds', '')
N += [H3('Healing of Skin Wounds'), P(M(475)), UL(a476, M(477)),
      TAB('3.10', 'Characteristics of Healing of Skin Wounds', rows310), TAB('3.11', 'Kinetics of Healing of Skin Wounds (First Intention)', rows311)]
N += [H3('Factors That Influence Tissue Repair'), P(M(479)),
      UL(M(480), 'Diabetes is a metabolic disease that compromises tissue repair for many reasons (Chapter 24) and is one of the most important systemic causes of abnormal wound healing.',
         'Nutritional status has profound effects on repair; protein deficiency and vitamin C deficiency inhibit collagen synthesis and retard healing.',
         'Glucocorticoids (steroids) have well-documented antiinflammatory effects, and their administration may result in weakness of the scar due to inhibition of TGF-β production and diminished **fibrosis**. In some instances, however, these effects of glucocorticoids are desirable. For example, in corneal infections, glucocorticoids are sometimes prescribed (along with antibiotics) to reduce the likelihood of opacity that may result from scarring.',
         'Aging reduces the capacity to heal injured tissues, for several reasons.', M(490), M(491), M(492), M(493), M(494)),
      FIG('3.28', 'Factors that influence tissue repair (intrinsic: old age, vascular diseases such as diabetes and atherosclerosis, malnutrition, steroids; extrinsic: infection, mechanical factors, foreign bodies). ECM, extracellular matrix.')]
N += [H3('Abnormalities in Tissue Repair'), P(M(496)), H4('Defects in Healing: Chronic Wounds'), P(M(498)), UL(M(499), M(500), M(501), M(503)), FIG('3.29', cap(502)), P(M(504) + ' ' + M(505))]
a509, _ = part(M(509), ' (A) or hyperpigmented')
N += [H4('Excessive Scarring'), P(M(507) + ' ' + M(508)), P(a509), FIG('3.30', 'Keloid. Keloids may appear erythematous in light skin tones (A) or hyperpigmented in darker skin (B). (C) Microscopic appearance of a keloid. Note the thick connective tissue deposited in the dermis.'),
      P(M(512)), KC((None, [M(515), M(516), M(517), M(518)]))]
r521a, r521b = part(M(521), ' Eming SA')
refs = [M(520), r521a, 'Eming SA' + r521b, M(522) + ' ' + M(523), M(524), M(525) + ' ' + M(526), M(527) + ' ' + M(528), M(529), M(530) + ' ' + M(531)] + [M(i) for i in range(532, 537)]
N += [('h2', 'Selected Readings'), ('refs', refs)]
NODES = N
TITLE = 'Inflammation and Repair'
