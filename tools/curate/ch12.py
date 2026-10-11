# -*- coding: utf-8 -*-
"""Curated Chapter 12 (The Heart) via the shared engine. Text from tools/textbook_src/ch12.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch12'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[1₁][2₂]\s+The Heart(?:\s+\d{3}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('CARDIAC STRUCTURE AND SPECIALIZATIONS', 'Cardiac Structure and Specializations', 2), ('OVERVIEW OF CARDIAC PATHOPHYSIOLOGY', 'Overview of Cardiac Pathophysiology', 2), ('HEART FAILURE', 'Heart Failure', 2), ('CONGENITAL HEART DISEASE', 'Congenital Heart Disease', 2), ('ISCHEMIC HEART DISEASE', 'Ischemic Heart Disease', 2), ('ARRHYTHMIAS', 'Arrhythmias', 2), ('HYPERTENSIVE HEART DISEASE', 'Hypertensive Heart Disease', 2), ('VALVULAR HEART DISEASE', 'Valvular Heart Disease', 2), ('CARDIOMYOPATHIES', 'Cardiomyopathies', 2), ('PERICARDIAL DISEASE', 'Pericardial Disease', 2), ('TUMORS OF THE HEART', 'Tumors of the Heart', 2), ('CARDIAC TRANSPLANTATION', 'Cardiac Transplantation', 2), ('CARDIAC DEVICES', 'Cardiac Devices', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('Myocardium', 'Myocardium', 3), ('Valves', 'Valves', 3), ('Conduction System', 'Conduction System', 3), ('Blood Supply', 'Blood Supply', 3), ('Effects of Aging on the Heart', 'Effects of Aging on the Heart', 3), ('Pathophysiology and Progression to Heart Failure', 'Pathophysiology and Progression to Heart Failure', 3), ('Left-Sided Heart Failure', 'Left-Sided Heart Failure', 3), ('Right-Sided Heart Failure', 'Right-Sided Heart Failure', 3), ('Incidence', 'Incidence', 3), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 3), ('Left-to-Right Shunts', 'Left-to-Right Shunts', 3), ('Right-to-Left Shunts', 'Right-to-Left Shunts', 3), ('Obstructive Lesions', 'Obstructive Lesions', 3), ('Epidemiology', 'Epidemiology', 3), ('ACUTE CORONARY SYNDROMES', 'Acute Coronary Syndromes', 3), ('Myocardial Infarction', 'Myocardial Infarction', 3), ('Chronic Ischemic Heart Disease', 'Chronic Ischemic Heart Disease', 3), ('Inherited Arrhythmogenic Diseases', 'Inherited Arrhythmogenic Diseases', 3), ('Sudden Cardiac Death', 'Sudden Cardiac Death', 3), ('Systemic (Left-Sided) Hypertensive Heart Disease', 'Systemic (Left-Sided) Hypertensive Heart Disease', 3), ('Calcific Valvular Degeneration', 'Calcific Valvular Degeneration', 3), ('Rheumatic Fever and Rheumatic Heart Disease', 'Rheumatic Fever and Rheumatic Heart Disease', 3), ('Infective Endocarditis', 'Infective Endocarditis', 3), ('Noninfected Vegetations', 'Noninfected Vegetations', 3), ('Carcinoid Heart Disease', 'Carcinoid Heart Disease', 3), ('Complications of Prosthetic Valves', 'Complications of Prosthetic Valves', 3), ('Dilated Cardiomyopathy', 'Dilated Cardiomyopathy', 3), ('Arrhythmogenic Right Ventricular Cardiomyopathy', 'Arrhythmogenic Right Ventricular Cardiomyopathy', 3), ('Hypertrophic Cardiomyopathy', 'Hypertrophic Cardiomyopathy', 3), ('Restrictive Cardiomyopathy', 'Restrictive Cardiomyopathy', 3), ('Myocarditis', 'Myocarditis', 3), ('Other Causes of Myocardial Disease', 'Other Causes of Myocardial Disease', 3), ('Pericardial Effusion and Hemopericardium', 'Pericardial Effusion and Hemopericardium', 3), ('Pericarditis', 'Pericarditis', 3), ('Primary Cardiac Tumors', 'Primary Cardiac Tumors', 3), ('Metastatic Neoplasms', 'Metastatic Neoplasms', 3), ('Ventricular Assist Devices', 'Ventricular Assist Devices', 3), ('Atrial Septal Defect', 'Atrial Septal Defect', 4), ('Patent Foramen Ovale', 'Patent Foramen Ovale', 4), ('Ventricular Septal Defect', 'Ventricular Septal Defect', 4), ('Transposition of the Great Arteries', 'Transposition of the Great Arteries', 4), ('Tricuspid Atresia', 'Tricuspid Atresia', 4), ('Coarctation of the Aorta', 'Coarctation of the Aorta', 4), ('Pulmonary Stenosis and Atresia', 'Pulmonary Stenosis and Atresia', 4), ('Aortic Stenosis and Atresia', 'Aortic Stenosis and Atresia', 4), ('Chronic Arterial Occlusion', 'Chronic Arterial Occlusion', 4), ('Acute Plaque Change', 'Acute Plaque Change', 4), ('Angina Pectoris', 'Angina Pectoris', 4), ('Consequences and Complications of Myocardial Infarction', 'Consequences and Complications of Myocardial Infarction', 4), ('Calcific Aortic Stenosis', 'Calcific Aortic Stenosis', 4), ('Calcific Stenosis of Congenitally Bicuspid Aortic Valve', 'Calcific Stenosis of Congenitally Bicuspid Aortic Valve', 4), ('Mitral Annular Calcification', 'Mitral Annular Calcification', 4), ('Nonbacterial Thrombotic Endocarditis', 'Nonbacterial Thrombotic Endocarditis', 4), ('Endocarditis of Systemic Lupus Erythematosus', 'Endocarditis of Systemic Lupus Erythematosus', 4), ('Amyloidosis', 'Amyloidosis', 4), ('Cardiotoxic Drugs', 'Cardiotoxic Drugs', 4), ('Radiation', 'Radiation', 4), ('Acute Pericarditis', 'Acute Pericarditis', 4), ('Chronic or Healed Pericarditis', 'Chronic or Healed Pericarditis', 4), ('Cardiac Infections', 'Cardiac Infections', 5), ('Toxins', 'Toxins', 5), ('Metabolic Conditions', 'Metabolic Conditions', 5), ('Neuromuscular Disease', 'Neuromuscular Disease', 5), ('Storage Disorders and Other Depositions', 'Storage Disorders and Other Depositions', 5), ('Infiltrative Diseases', 'Infiltrative Diseases', 5), ('Immunologic Conditions', 'Immunologic Conditions', 5), ('Infections', 'Infections', 5), ('Immune-Mediated Reactions', 'Immune-Mediated Reactions', 5), ('Unknown', 'Unknown', 5), ('Infectious Agents', 'Infectious Agents', 5), ('Presumably Immunologically Mediated', 'Presumably Immunologically Mediated', 5), ('Miscellaneous', 'Miscellaneous', 5), ('Pathologic Criteria', 'Pathologic Criteria', 5), ('Major', 'Major', 5), ('Minor', 'Minor', 5),
 ('Clinical Features', 'Clinical Features', 3)]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 3)] + [('Clinical Features', 4)] * 20
HEADS[auto.norm('Pathogenesis')] = [('Pathogenesis', 4)] * 10
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries appear in the text below.')
DROP = set(); OVR = {}
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=[], OVR=OVR, DROP=DROP, TABLES=TABLES)
def _post(nodes):
    out = []; last = None   # last text node index in out
    for nd in nodes:
        if nd[0] == 'p':
            t = nd[1].replace('2-Acetylaminofluorene Dimethylaminoazobenzene (butter yellow) ', '')
            for _a in ('heart size and mass ', ' A • Four-chamber dilation'): t = t.replace(_a, '')
            if t.startswith(('Unstable angina', 'Subendocardial myocardial infarction', 'Idiopathic Defect in force')): continue
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
TITLE = 'The Heart'
