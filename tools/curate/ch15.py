# -*- coding: utf-8 -*-
"""Curated Chapter 15 (The Lung) via the shared engine. Text from tools/textbook_src/ch15.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch15'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[1₁][5₅]\s+The Lung(?:\s+\d{3}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('CONGENITAL ANOMALIES', 'Congenital Anomalies', 2), ('PULMONARY EDEMA', 'Pulmonary Edema', 2), ('ACUTE LUNG INJURY AND ACUTE RESPIRATORY', 'Acute Lung Injury and Acute Respiratory Distress Syndrome (Diffuse Alveolar Damage)', 2), ('OBSTRUCTIVE AND RESTRICTIVE LUNG DISEASES', 'Obstructive and Restrictive Lung Diseases', 2), ('DISEASES', 'Diffuse Interstitial (Restrictive) Diseases', 2), ('DISEASES OF VASCULAR ORIGIN', 'Diseases of Vascular Origin', 2), ('PULMONARY INFECTIONS', 'Pulmonary Infections', 2), ('LUNG TRANSPLANTATION', 'Lung Transplantation', 2), ('TUMORS', 'Tumors', 2), ('PLEURA', 'Pleura', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('Hemodynamic Pulmonary Edema', 'Hemodynamic Pulmonary Edema', 3), ('Edema Caused by Microvascular (Alveolar) Injury', 'Edema Caused by Microvascular (Alveolar) Injury', 3), ('Chronic Obstructive Pulmonary Disease', 'Chronic Obstructive Pulmonary Disease', 3), ('Asthma', 'Asthma', 3), ('Fibrosing Diseases', 'Fibrosing Diseases', 3), ('Pulmonary Involvement in Autoimmune Diseases', 'Pulmonary Involvement in Autoimmune Diseases', 3), ('Pneumoconioses', 'Pneumoconioses', 3), ('Complications of Therapies', 'Complications of Therapies', 3), ('Granulomatous Diseases', 'Granulomatous Diseases', 3), ('Pulmonary Eosinophilia', 'Pulmonary Eosinophilia', 3), ('Smoking-Related Interstitial Diseases', 'Smoking-Related Interstitial Diseases', 3), ('Pulmonary Alveolar Proteinosis', 'Pulmonary Alveolar Proteinosis', 3), ('Surfactant Dysfunction Disorders', 'Surfactant Dysfunction Disorders', 3), ('Pulmonary Embolism and Infarction', 'Pulmonary Embolism and Infarction', 3), ('Pulmonary Hypertension', 'Pulmonary Hypertension', 3), ('Diffuse Pulmonary Hemorrhage Syndromes', 'Diffuse Pulmonary Hemorrhage Syndromes', 3), ('Community-Acquired Bacterial Pneumonias', 'Community-Acquired Bacterial Pneumonias', 3), ('Community-Acquired Viral Pneumonia', 'Community-Acquired Viral Pneumonia', 3), ('Healthcare-Associated Pneumonia', 'Healthcare-Associated Pneumonia', 3), ('Lung Abscess', 'Lung Abscess', 3), ('Chronic Pneumonia', 'Chronic Pneumonia', 3), ('Pneumonia in the Immunocompromised Host', 'Pneumonia in the Immunocompromised Host', 3), ('Pulmonary Disease in Human Immunodeficiency Virus', 'Pulmonary Disease in Human Immunodeficiency Virus', 3), ('Carcinomas', 'Carcinomas', 3), ('Neuroendocrine Proliferations and Tumors', 'Neuroendocrine Proliferations and Tumors', 3), ('Miscellaneous Tumors', 'Miscellaneous Tumors', 3), ('Metastatic Tumors', 'Metastatic Tumors', 3), ('Pleural Effusion', 'Pleural Effusion', 3), ('Pneumothorax', 'Pneumothorax', 3), ('Pleural Tumors', 'Pleural Tumors', 3), ('Emphysema', 'Emphysema', 4), ('Chronic Bronchitis', 'Chronic Bronchitis', 4), ('Atopic Asthma', 'Atopic Asthma', 4), ('Nonatopic Asthma', 'Nonatopic Asthma', 4), ('Drug-Induced Asthma', 'Drug-Induced Asthma', 4), ('Occupational Asthma', 'Occupational Asthma', 4), ('Idiopathic Pulmonary Fibrosis', 'Idiopathic Pulmonary Fibrosis', 4), ('Nonspecific Interstitial Pneumonia', 'Nonspecific Interstitial Pneumonia', 4), ('Cryptogenic Organizing Pneumonia', 'Cryptogenic Organizing Pneumonia', 4), ('Sarcoidosis', 'Sarcoidosis', 4), ('Hypersensitivity Pneumonitis', 'Hypersensitivity Pneumonitis', 4), ('Desquamative Interstitial Pneumonia', 'Desquamative Interstitial Pneumonia', 4), ('Respiratory Bronchiolitis–Associated Interstitial Lung Disease', 'Respiratory Bronchiolitis–Associated Interstitial Lung Disease', 4), ('Pulmonary Langerhans Cell Histiocytosis', 'Pulmonary Langerhans Cell Histiocytosis', 4), ('Goodpasture Syndrome (Anti–Glomerular Basement Membrane Disease)', 'Goodpasture Syndrome (Anti–Glomerular Basement Membrane Disease)', 4), ('Idiopathic Pulmonary Hemosiderosis', 'Idiopathic Pulmonary Hemosiderosis', 4), ('Granulomatosis With Polyangiitis', 'Granulomatosis With Polyangiitis', 4), ('Aspiration Pneumonia', 'Aspiration Pneumonia', 4), ('Necrotizing Pneumonia and Lung Abscess', 'Necrotizing Pneumonia and Lung Abscess', 4), ('Influenza', 'Influenza', 4), ('Human Metapneumovirus', 'Human Metapneumovirus', 4), ('Human Coronaviruses', 'Human Coronaviruses', 4), ('Hospital-Acquired Pneumonia', 'Hospital-Acquired Pneumonia', 4), ('Etiology and Pathogenesis', 'Etiology and Pathogenesis', 4), ('Classification', 'Classification', 4), ('Staging', 'Staging', 4), ('Paraneoplastic Syndromes', 'Paraneoplastic Syndromes', 4), ('Carcinoid Tumors', 'Carcinoid Tumors', 4), ('Lymphoma', 'Lymphoma', 4), ('Inflammatory Pleural Effusions', 'Inflammatory Pleural Effusions', 4), ('Noninflammatory Pleural Effusions', 'Noninflammatory Pleural Effusions', 4), ('Solitary Fibrous Tumor', 'Solitary Fibrous Tumor', 4), ('Malignant Mesothelioma', 'Malignant Mesothelioma', 4),
 ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Clinical Features')] = [('Clinical Features', 4)] * 40
HEADS[auto.norm('Pathogenesis')] = [('Pathogenesis', 4)] * 30
HEADS[auto.norm('Aspiration Pneumonia')] = [('Aspiration Pneumonia', 4)] * 2
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries appear in the text.')
DROP = {9, 45, 71, 75, 77}
OVR = {185: [('h3', 'Bronchiectasis'), ('p', M(185))], 192: [('h4', 'Pathogenesis')]}   # heading belongs before the Bronchiectasis intro (block 185), not before its Pathogenesis
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

TITLE = 'The Lung'
