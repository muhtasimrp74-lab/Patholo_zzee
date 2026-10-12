# -*- coding: utf-8 -*-
"""Curated Chapter 14 (Red Blood Cell and Bleeding Disorders) via the shared engine. Text from tools/textbook_src/ch14.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch14'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+Red Blood Cell and Bleeding Disorders(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('MORPHOLGY', 'MORPHOLOGY')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('Chronic Blood Loss', 'Chronic Blood Loss', 3), ('Hemolytic Anemias', 'Hemolytic Anemias', 3), ('Hereditary Spherocytosis', 'Hereditary Spherocytosis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Glucose-6-Phosphate Dehydrogenase Deficiency', 'Glucose-6-Phosphate Dehydrogenase Deficiency', 3), ('Sickle Cell Disease', 'Sickle Cell Disease', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Reversibly', 'Reversibly', 3), ('Thalassemia', 'Thalassemia', 3), ('Molecular Pathogenesis', 'Molecular Pathogenesis', 3), ('Clinical Syndromes', 'Clinical Syndromes', 3), ('Paroxysmal Nocturnal Hemoglobinuria', 'Paroxysmal Nocturnal Hemoglobinuria', 3), ('Immunohemolytic Anemia', 'Immunohemolytic Anemia', 3), ('Secondary', 'Secondary', 3), ('Drugs', 'Drugs', 3), ('Hemolytic Anemia Due to Red Cell Trauma', 'Hemolytic Anemia Due to Red Cell Trauma', 3), ('Red Blood Cell and Bleeding Disorders 591', 'Red Blood Cell and Bleeding Disorders 591', 3), ('Anemias of Diminished Erythropoiesis', 'Anemias of Diminished Erythropoiesis', 3), ('Megaloblastic Anemia', 'Megaloblastic Anemia', 3), ('Unresponsive to Vitamin B₁₂ or Folic Acid Therapy', 'Unresponsive to Vitamin B₁₂ or Folic Acid Therapy', 3), ('Anemia of Vitamin B₁₂ Deficiency: Pernicious Anemia', 'Anemia of Vitamin B₁₂ Deficiency: Pernicious Anemia', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Anemia of Folate Deficiency', 'Anemia of Folate Deficiency', 3), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 4), ('Iron Deficiency Anemia', 'Iron Deficiency Anemia', 3), ('Fe3+', 'Fe3+', 3), ('INEFFECTIVE ERYTHROPOIESIS', 'Ineffective Erythropoiesis Hemochromatosis', 2), ('Fe2+', 'Fe2+', 3), ('Mucosal', 'Mucosal', 3), ('Liver', 'Liver', 3), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 4), ('Anemia of Chronic Inflammation', 'Anemia of Chronic Inflammation', 3), ('Aplastic Anemia', 'Aplastic Anemia', 3), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 4), ('Pure Red Cell Aplasia', 'Pure Red Cell Aplasia', 3), ('Other Forms of Marrow Failure', 'Other Forms of Marrow Failure', 3), ('Aplastic Anemia', 'Aplastic Anemia', 3), ('Other Causes of Underproduction Anemias', 'Other Causes of Underproduction Anemias', 3), ('Absolute', 'Absolute', 3), ('BLEEDING DISORDERS: HEMORRHAGIC DIATHESES', 'Bleeding Disorders: Hemorrhagic Diatheses', 2), ('Bleeding Disorders Caused by Vessel Wall', 'Bleeding Disorders Caused by Vessel Wall', 3), ('Thrombocytopenia', 'Thrombocytopenia', 3), ('Chronic Immune Thrombocytopenic Purpura', 'Chronic Immune Thrombocytopenic Purpura', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Acute Immune Thrombocytopenic Purpura', 'Acute Immune Thrombocytopenic Purpura', 3), ('Drug-Induced Thrombocytopenia', 'Drug-Induced Thrombocytopenia', 3), ('HIV-Associated Thrombocytopenia', 'HIV-Associated Thrombocytopenia', 3), ('Purpura and Hemolytic Uremic Syndrome', 'Purpura and Hemolytic Uremic Syndrome', 3), ('Bleeding Disorders Related to Defective Platelet', 'Bleeding Disorders Related to Defective Platelet', 3), ('Bleeding Disorders Related to Abnormalities in Clotting', 'Bleeding Disorders Related to Abnormalities in Clotting', 3), ('Factor VIII–vWF Complex', 'Factor VIII–vWF Complex', 3), ('Disseminated Intravascular Coagulation', 'Disseminated Intravascular Coagulation', 3), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 4), ('TNF Endothelial', 'TNF Endothelial', 3), ('Thrombotic Thrombocytopenic Purpura and Hemolytic', 'Thrombotic Thrombocytopenic Purpura and Hemolytic', 3), ('Hemophilia', 'Hemophilia', 3), ('Disseminated Intravascular Coagulation', 'Disseminated Intravascular Coagulation', 3), ('Complications of Transfusion', 'Complications of Transfusion', 3), ('Allergic Reactions', 'Allergic Reactions', 3), ('Hemolytic Reactions', 'Hemolytic Reactions', 3), ('Transfusion-Related Acute Lung Injury', 'Transfusion-Related Acute Lung Injury', 3), ('Infectious Complications', 'Infectious Complications', 3), ('SELECTED READINGS', 'Selected Readings', 2), ('George JN, Nester CM. Syndromes of thrombotic microangiopathy. N Engl J', 'George JN, Nester CM. Syndromes of thrombotic microangiopathy. N Engl J', 3), ('Taher AT, Musallam KM, Domenica Cappelini M. b-Thalassemias. New Engl J', 'Taher AT, Musallam KM, Domenica Cappelini M. b-Thalassemias. New Engl J', 3), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [44, 45, 53, 55, 78, 105, 114, 115, 124, 154, 163, 199, 200, 204, 205, 260, 266, 286, 287, 303, 338, 345, 346]
DROP = set(DROP)
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
TITLE = 'Red Blood Cell and Bleeding Disorders'
