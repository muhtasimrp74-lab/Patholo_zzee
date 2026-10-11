# -*- coding: utf-8 -*-
"""Reads box_src/General_Pathology_Box_Viva_Robbins_Index.md and writes box_viva.txt (the A-card viva list,
placed in Robbins chapter > sub-chapter > topic).  Run:  python3 tools/boxviva_parse.py  then  python3 tools/build.py
box_viva.txt line format
   Question text {A-1 Q13, Q15; A-6 x2} ⭐⭐        one question on the card(s) named inside the braces (stars = times asked)
   @ Case title :: Ask 1 | Ask 2 :: variants {..} ⭐  a clinical case; asks are shown under the case
Headings:  # CHAPTER n | Robbins chapter  >  ## sub-chapter  >  ### topic.   A trailing 🖍 marks a question highlighted on the scan."""
import re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'box_src', 'General_Pathology_Box_Viva_Robbins_Index.md')
STAR, PEN = '⭐', '\U0001F58D'
C2 = 'Cellular Adaptations to Stress'; CI = 'Cell Injury: Causes and Morphology'

def tgt(sid, t):
    l = t.lower()
    if sid == '1.1':
        for k, tp in (('atroph', 'Atrophy'), ('hyperplasia', 'Hyperplasia'), ('metaplasia', 'Metaplasia'), ('dysplasia', 'Dysplasia')):
            if k in l: return 2, C2, tp
        return 2, C2, 'Overview of adaptation'
    if sid == '1.2': return 2, 'Cellular Aging', 'Cellular aging'
    if sid == '1.3':
        if re.search('free radical|antioxidant|atp|calcium', l): return 2, 'Mechanisms of Cell Injury', 'Free radicals, ATP depletion and calcium'
        if 'types of reversible' in l: return 2, CI, 'Types of cell injury'
        if re.search('reversible|morpholog|swelling', l): return 2, CI, 'Morphology of cell injury'
        return 2, CI, 'Cell injury: definition and causes'
    if sid == '1.4': return 2, 'Necrosis', ('Definition of necrosis' if l.startswith('define necrosis') else 'Types of necrosis')
    if sid == '1.5': return 2, 'Apoptosis', 'Apoptosis'
    if sid == '1.6':
        if 'calcification' in l: return 2, 'Pathologic Calcification', 'Pathologic calcification'
        tp = 'Fatty change' if 'fatty' in l else 'Hyaline change' if 'hyaline' in l else 'Intracellular accumulation'
        return 2, 'Intracellular Accumulations', tp
    if sid == '1.7': return 2, 'Intracellular Accumulations', 'Fatty liver (case)'
    if sid == '2.1': return 3, 'Overview of Inflammation', 'Introduction to inflammation'
    if sid == '2.2': return 3, 'Acute Inflammation: Vascular Events', 'Vascular changes and permeability'
    if sid == '2.3':
        if re.search('phago|killing|degraded|mps', l): return 3, 'Acute Inflammation: Cellular Events', 'Phagocytes and phagocytosis'
        return 3, 'Acute Inflammation: Cellular Events', 'Leukocyte recruitment and chemotaxis'
    if sid == '2.4': return 3, 'Chemical Mediators of Inflammation', 'Chemical mediators'
    if sid == '2.5':
        S = 'Morphology, Outcomes and Systemic Effects'
        if re.search('morphological|ulcer|abscess', l): return 3, S, 'Morphological patterns'
        if re.search('outcome|resolution', l): return 3, S, 'Outcomes and resolution'
        if re.search('beneficial|harmful', l): return 3, S, 'Effects of acute inflammation'
        return 3, S, 'Systemic effects and investigations'
    if sid == '2.6':
        S = 'Chronic and Granulomatous Inflammation'
        if 'macrophage' in l: return 3, S, 'Macrophages'
        if 'giant' in l: return 3, S, 'Giant cells'
        if 'granuloma' in l: return 3, S, 'Granulomatous inflammation'
        return 3, S, 'Chronic inflammation'
    if sid == '2.7':
        S = 'Tissue Repair and Wound Healing'
        if 'granulation' in l: return 3, S, 'Granulation tissue'
        if re.search('regeneration|repair|healing\\.|types of cells', l) and 'wound' not in l: return 3, S, 'Regeneration and repair'
        return 3, S, 'Wound healing'
    if sid == '2.8': return 3, 'Clinical Scenarios', 'Inflammation cases'
    if sid == '3.1':
        if re.search('exudate|transudate|body fluid', l): return 4, 'Edema and Effusions', 'Exudates, transudates and body fluids'
        return 4, 'Edema and Effusions', 'Edema'
    if sid == '3.2': return 4, 'Hyperemia and Congestion', 'Hyperemia and congestion'
    if sid == '3.3': return 4, 'Thrombosis', 'Thrombosis'
    if sid == '3.4': return 4, 'Embolism', 'Embolism'
    if sid == '3.5': return 4, 'Infarction', 'Infarction'
    if sid == '3.6': return 4, 'Shock', 'Shock'
    if sid == '3.7':
        tp = 'Potassium' if 'kalaemia' in l else 'Sodium' if 'natraemia' in l else 'Calcium' if 'calcaemia' in l else 'Acid–base disorders' if re.search('acidosis|alkalosis', l) else 'Normal serum electrolytes'
        return 4, 'Fluid, Electrolyte and Acid–Base Disorders', tp
    if sid == '3.8': return 4, 'Embolism', 'Pulmonary embolism (case)'
    if sid == '4.1': return 5, 'Genes, Mutations and Classification', 'Genes and mutations'
    if sid == '4.2': return 5, 'Single-Gene Disorders', 'Transmission patterns'
    if sid == '4.3': return 5, 'Cytogenetic Disorders', 'Chromosomal disorders'
    if sid == '4.4': return 5, 'Laboratory Diagnosis of Genetic Disorders', 'Laboratory diagnosis'
    if sid == '4.5': return 5, 'Cytogenetic Disorders', 'Cytogenetic cases'
    if sid == '5.1':
        if 'amyloid' in l: return 6, 'Amyloidosis', 'Amyloidosis'
        if re.search('autoimmun|immunodef', l): return 6, 'Autoimmunity and Immunodeficiency', 'Autoimmunity and immunodeficiency'
        return 6, 'Immunity and Hypersensitivity', ('Hypersensitivity' if 'hypersens' in l else 'Immunity')
    if sid == '6.1': return 7, 'Nomenclature', 'Definitions and nomenclature'
    if sid == '6.2': return 7, 'Differentiation, Anaplasia and Dysplasia', 'Anaplasia and carcinoma in situ'
    if sid == '6.3': return 7, 'Invasion and Metastasis', 'Invasion and metastasis'
    if sid == '6.4': return 7, 'Carcinogenesis and Tumour Biology', 'Carcinogenesis'
    if sid == '6.5': return 7, 'Clinical Aspects of Neoplasia', 'Clinical aspects'
    if sid == '6.6': return 7, 'Laboratory Diagnosis of Tumours', 'Laboratory diagnosis'
    if sid == '6.7': return 7, 'Clinical Scenarios', 'Tumour cases'
    if sid == '7.1':
        if re.search('tobacco|alcohol', l): return 9, 'Tobacco and Alcohol', 'Tobacco and alcohol'
        if re.search('burn|radiation', l): return 9, 'Physical Injury: Burns and Radiation', 'Burns and radiation'
        return 9, 'Environmental Hazards and Toxicity', 'Environmental hazards and toxins'
    if sid == '7.2':
        if 'dietary habit' in l: return 9, 'Diet and Systemic Disease', 'Diet and cancer'
        return 9, 'Nutritional Diseases', 'Nutritional disorders'
    if sid == '8.1': return 11, 'Arteriosclerosis', 'Atherosclerosis: diet'
    if sid == '8.2': return 12, 'Ischemic Heart Disease', 'Myocardial infarction (case)'
    if sid == '10.1': return 23, 'Breast Lumps', 'Breast lump (case)'
    if sid == '11.1': return 24, 'Diabetes Mellitus (Endocrine Pancreas)', 'HbA1c'
    H = 'Haemopoiesis and Laboratory Assessment'
    if sid == '9.1':
        if 'granulopoiesis' in l or 'granulocytic' in l: return 13, 'Reactive Leukocyte Disorders', 'Granulopoiesis'
        if re.search('marrow|trephine|tap', l): return 14, H, 'Bone marrow examination'
        if re.search('haemopoiesis', l): return 14, H, 'Haemopoiesis'
        return 14, H, 'Peripheral film, red cell indices and haemoglobin'
    if sid == '9.2': return 14, 'Anaemia: General', 'Classification and investigation'
    if sid == '9.3': return 14, 'Iron Deficiency and Microcytic Anaemia', 'Iron deficiency anaemia'
    if sid == '9.4': return 14, 'Megaloblastic and Macrocytic Anaemia', 'Megaloblastic anaemia'
    if sid == '9.5': return 14, 'Haemolytic Anaemias', 'Haemolytic anaemia'
    if sid == '9.6':
        tp = 'Sickle cell anaemia' if 'sickle' in l else 'Thalassaemia' if 'thalass' in l else 'Haemoglobinopathies'
        return 14, 'Haemoglobinopathies and Thalassaemia', tp
    if sid == '9.7': return 14, 'Aplastic Anaemia and Pancytopenia', 'Pancytopenia'
    if sid == '9.8': return 13, 'Reactive Leukocyte Disorders', 'Leukocyte disorders and leukaemoid reaction'
    if sid == '9.9':
        S = 'Leukaemias'
        if re.search('cml|cgl|philadelphia|blast', l): return 13, S, 'Chronic myeloid leukaemia'
        if 'cll' in l: return 13, S, 'Chronic lymphocytic leukaemia'
        return 13, S, 'Acute leukaemias'
    if sid == '9.10':
        if 'splen' in l: return 13, 'Spleen and Hypersplenism', 'Splenomegaly and hypersplenism'
        return 13, 'Myeloproliferative and Myelodysplastic Disorders', 'Myeloproliferative disorders'
    if sid == '9.11': return 13, 'Plasma Cell Disorders', 'Myeloma and paraproteinaemia'
    if sid == '9.12':
        if re.search('lymphoma|reed|hodgkin', l): return 13, 'Lymphoid Neoplasms', 'Hodgkin and non-Hodgkin lymphoma'
        return 13, 'Lymph Node Disorders', 'Lymphadenopathy and lymphadenitis'
    if sid == '9.13': return 14, 'Bleeding and Coagulation Disorders', 'Bleeding disorders'
    if sid == '9.14': return 14, 'Blood Groups, Transfusion and Anticoagulants', 'Transfusion and anticoagulants'
    if sid == '9.15':
        if re.search('splenomegaly and total wbc|elderly man|weakness, fever', l): return 13, 'Clinical Scenarios', 'Leukocyte and plasma cell cases'
        return 14, 'Clinical Scenarios', 'Haematology cases'
    raise SystemExit('no mapping for %s %s' % (sid, t))

TITLES = {2: 'Cell Injury, Cell Death, and Adaptations', 3: 'Inflammation and Repair', 4: 'Hemodynamic Disorders, Thromboembolic Disease, and Shock',
          5: 'Genes and Human Diseases', 6: 'Diseases of the Immune System', 7: 'Neoplasia', 9: 'Environmental and Nutritional Diseases',
          11: 'Blood Vessels', 12: 'The Heart', 13: 'Diseases of White Blood Cells, Lymph Nodes, Spleen, and Thymus',
          14: 'Red Blood Cell and Bleeding Disorders', 23: 'The Breast', 24: 'The Endocrine System'}

def tags(s):
    """'`A-1 Q13, Q15`' / '`A-6 x2, A-7 Q19`' -> [(box, label)] one per occurrence."""
    out = []
    for part in re.split(r',\s*(?=A-\d)', s.strip('` ')):
        m = re.match(r'^A-(\d+)\s*(.*)$', part.strip())
        if not m: raise SystemExit('bad tag: ' + s)
        box, rest = m.group(1), m.group(2).strip()
        labs = [x.strip() for x in rest.split(',') if x.strip()] or ['']
        for lb in labs:
            x = re.match(r'^[×x]\s*(\d+)$', lb)
            if x: out += [(box, '')] * int(x.group(1))
            else: out.append((box, lb))
    return out

def fmt(occ):
    g = {}
    for b, lb in occ:
        g.setdefault(b, [])
        if lb: g[b].append(lb)
    return '; '.join('A-%s%s' % (b, (' ' + ', '.join(l)) if l else '') for b, l in g.items())

def main():
    ents, sid, n_top, nq, nocc = {}, None, {}, 0, 0
    lines = open(SRC, encoding='utf8').read().splitlines()
    i = 0; cur = None  # cur = open scenario
    chap = None
    def add(sid_, text, line):
        nonlocal nq
        tg = tgt(sid_, text)
        ents.setdefault(tg[0], {}).setdefault(tg[1], {}).setdefault(tg[2], []).append(line); nq += 1
    while i < len(lines):
        L = lines[i].rstrip(); i += 1
        m = re.match(r'^# (\d+)\. ', L)
        if m: chap = int(m.group(1)); sid = None; n_top[chap] = 0; continue
        m = re.match(r'^## (\d+\.\d+) ', L)
        if m: sid = m.group(1); continue
        if chap in (8, 10, 11) and sid is None: sid_cur = None
        if chap in (5, 8, 10, 11) and not re.match(r'^## ', L): pass
        if chap is None or not L.startswith('- '): continue
        body = L[2:]
        if body.startswith('*(') or body.startswith('(') : continue   # editorial notes
        scen = re.match(r'^(⭐+)\s+\*\*(.+?)\*\*\s*(?:`\[(.*)\]`)?\s*$', body)
        if scen:
            stars, title, var = len(scen.group(1)), scen.group(2), (scen.group(3) or '')
            asks, occ = [], []
            while i < len(lines) and lines[i].startswith('  - '):
                a = lines[i][4:].rstrip(); i += 1
                if a.startswith('('): continue
                am = re.match(r'^(.*?)\s+—\s+`(.*)`$', a)
                if not am: raise SystemExit('bad ask: ' + a)
                asks.append(am.group(1).strip()); occ += tags(am.group(2))
            if not asks: raise SystemExit('scenario with no asks: ' + title)
            # case-level boxes = the distinct occurrences of the first ask (each printed case appears once per box)
            first = []
            lm = [x for x in re.finditer(r'`', '')]
            sid_ = sid or {5: None}.get(chap)
            if sid_ is None: sid_ = {8: '8.2', 10: '10.1', 11: '11.1'}.get(chap)
            boxes = []
            for b, lb in occ:
                boxes.append((b, lb))
            # de-duplicate: occurrences that name the same box+label are one printed case
            seen, uniq = set(), []
            for b, lb in boxes:
                k = (b, lb)
                if k in seen: continue
                seen.add(k); uniq.append((b, lb))
            nocc += 0
            add(sid_, title + ' ' + ' '.join(asks), '@ %s :: %s :: %s {%s} %s' % (title, ' | '.join(asks), var if ':' in var else '', fmt(uniq), STAR * stars))
            continue
        q = re.match(r'^(⭐+)\s*(\U0001F58D️?)?\s*(.+?)\s+—\s+`(.*)`$', body)
        if not q: raise SystemExit('unparsed: ' + L)
        stars, pen, text, tg_ = len(q.group(1)), q.group(2), q.group(3).strip(), q.group(4)
        sid_ = sid or {5: '5.1', 8: '8.1', 10: '10.1', 11: '11.1'}.get(chap)
        if chap == 8 and text.startswith('**'):      # the chest-pain case is printed as one case with two asks
            case8 = text.strip('*').split('** \u2014')[0].strip('* '); case_occ = tags(tg_); continue
        if chap == 8 and text.startswith('Laboratory investigations'):
            add('8.2', case8, '@ %s :: Likely diagnosis? | Laboratory investigations to confirm that diagnosis? ::  {%s} %s' % (case8, fmt(case_occ), STAR)); continue
        occ = tags(tg_)
        stars = max(stars, len(occ))   # source line 'Normal haemoglobin level' has one star but A-6 x2
        add(sid_, text, '%s {%s} %s%s' % (text, fmt(occ), STAR * stars, (' ' + PEN) if pen else ''))
    out = ['# Box viva (A-cards A1–A10): General Pathology + Haematology, generated by tools/boxviva_parse.py from the box viva list.',
           '# Line:  Question {A-1 Q13, Q15; A-6 x2} ⭐⭐   (stars = times asked; box + question number as printed)',
           '#        @ Case title :: Ask 1 | Ask 2 :: printed variants {boxes} ⭐   (clinical case; one question on the card)',
           '']
    for ch in sorted(ents):
        out.append('# CHAPTER %d | %s' % (ch, TITLES[ch]))
        for sub, tps in ents[ch].items():
            out.append('## ' + sub)
            for tp, ls in tps.items():
                out.append('### ' + tp); out += ls
        out.append('')
    open(os.path.join(HERE, 'box_viva.txt'), 'w', encoding='utf8').write('\n'.join(out))
    print('questions written:', nq)
main()
