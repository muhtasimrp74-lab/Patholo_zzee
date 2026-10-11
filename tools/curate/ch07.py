# -*- coding: utf-8 -*-
"""Curated Chapter 7 (Neoplasia) via the shared engine. Text from tools/textbook_src/ch07.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch07'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[7₇]\s+Neoplasia(?:\s+\d{3}\b)?\s*']
FIX = [('a-fetoprotein', 'α-fetoprotein'), ('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [  # (source heading text, display, level)
 ('NOMENCLATURE', 'Nomenclature', 2), ('Benign Tumors', 'Benign Tumors', 3), ('Malignant Tumors', 'Malignant Tumors', 3), ('Mixed Tumors', 'Mixed Tumors', 3),
 ('CHARACTERISTICS OF BENIGN AND MALIGNANT', 'Characteristics of Benign and Malignant Neoplasms', 2), ('Differentiation and Anaplasia', 'Differentiation and Anaplasia', 3),
 ('Metaplasia, Dysplasia, and Carcinoma In Situ', 'Metaplasia, Dysplasia, and Carcinoma In Situ', 3), ('Local Invasion', 'Local Invasion', 3), ('Metastasis', 'Metastasis', 3), ('Pathways of Spread', 'Pathways of Spread', 4),
 ('EPIDEMIOLOGY OF CANCER', 'Epidemiology of Cancer', 2), ('Global Impact of Cancer', 'Global Impact of Cancer', 3), ('Environmental Factors', 'Environmental Factors', 3), ('Age', 'Age', 3),
 ('Genetic Predisposition and Interactions Between', 'Genetic Predisposition and Interactions Between Environmental and Inherited Factors', 3),
 ('MOLECULAR BASIS OF CANCER: ROLE OF GENETIC', 'Molecular Basis of Cancer: Role of Genetic and Epigenetic Alterations', 2), ('CANCER', 'Hallmarks of Cancer', 3),
 ('Self-Sufficiency in Growth Signals: Oncogenes', 'Self-Sufficiency in Growth Signals: Oncogenes', 3), ('Oncoproteins and Cell Growth', 'Oncoproteins and Cell Growth', 4), ('Growth Factors', 'Growth Factors', 4),
 ('Growth Factor Receptors', 'Growth Factor Receptors', 4), ('Downstream Components of the Receptor Tyrosine Kinase', 'Downstream Components of the Receptor Tyrosine Kinase Signaling Pathway', 4),
 ('Nonreceptor Tyrosine Kinases', 'Nonreceptor Tyrosine Kinases', 4), ('Transcription Factors', 'Transcription Factors', 4), ('Cyclins and Cyclin-Dependent Kinases', 'Cyclins and Cyclin-Dependent Kinases', 4),
 ('Insensitivity to Growth Inhibition: Tumor Suppressor', 'Insensitivity to Growth Inhibition: Tumor Suppressor Genes', 3), ('RB: Governor of Proliferation', 'RB: Governor of Proliferation', 4),
 ('TP53: Guardian of the Genome', 'TP53: Guardian of the Genome', 4), ('Other Tumor Suppressor Genes', 'Other Tumor Suppressor Genes', 4),
 ('Growth-Promoting Metabolic Alterations', 'Growth-Promoting Metabolic Alterations', 3), ('Autophagy', 'Autophagy', 4), ('Oncometabolism', 'Oncometabolism', 4), ('Evasion of Cell Death', 'Evasion of Cell Death', 3),
 ('Limitless Replicative Potential: Stem Cell–Like', 'Limitless Replicative Potential: Stem Cell–Like Properties of Cancer Cells', 3), ('Angiogenesis', 'Angiogenesis', 3), ('Invasion and Metastasis', 'Invasion and Metastasis', 3),
 ('Invasion of Extracellular Matrix', 'Invasion of Extracellular Matrix', 4), ('Vascular Dissemination, Homing, and Colonization', 'Vascular Dissemination, Homing, and Colonization', 4),
 ('Evasion of Immune Surveillance', 'Evasion of Immune Surveillance', 3), ('Antitumor Effector Mechanisms', 'Antitumor Effector Mechanisms', 4), ('Mechanisms of Immune Evasion by Cancers', 'Mechanisms of Immune Evasion by Cancers', 4),
 ('Cancer-Enabling Inflammation', 'Cancer-Enabling Inflammation', 3), ('Genomic Instability', 'Genomic Instability', 3), ('DNA Mismatch Repair Factors', 'DNA Mismatch Repair Factors', 4), ('Nucleotide Excision Repair Factors', 'Nucleotide Excision Repair Factors', 4),
 ('Dysregulation of Cancer-Associated Genes', 'Dysregulation of Cancer-Associated Genes', 3), ('Chromosomal Changes', 'Chromosomal Changes', 4), ('Epigenetic Changes', 'Epigenetic Changes', 4), ('Noncoding RNAs and Cancer', 'Noncoding RNAs and Cancer', 4),
 ('Molecular Basis of Multistep Carcinogenesis', 'Molecular Basis of Multistep Carcinogenesis', 3),
 ('CARCINOGENIC AGENTS AND THEIR CELLULAR', 'Carcinogenic Agents and Their Cellular Interactions', 2), ('Chemical Carcinogenesis', 'Chemical Carcinogenesis', 3), ('Radiation Carcinogenesis', 'Radiation Carcinogenesis', 3),
 ('Ultraviolet Rays', 'Ultraviolet Rays', 4), ('Ionizing Radiation', 'Ionizing Radiation', 4), ('Microbial Carcinogenesis', 'Microbial Carcinogenesis', 3), ('Oncogenic RNA Viruses', 'Oncogenic RNA Viruses', 4),
 ('Oncogenic DNA Viruses', 'Oncogenic DNA Viruses', 4), ('Helicobacter Pylori', 'Helicobacter pylori', 4),
 ('CLINICAL ASPECTS OF NEOPLASIA', 'Clinical Aspects of Neoplasia', 2), ('Clinical Manifestations', 'Clinical Manifestations', 3), ('Local and Hormonal Effects', 'Local and Hormonal Effects', 4), ('Cancer Cachexia', 'Cancer Cachexia', 4),
 ('Grading and Staging of Tumors', 'Grading and Staging of Tumors', 3), ('Laboratory Diagnosis of Cancer', 'Laboratory Diagnosis of Cancer', 3), ('Histologic and Cytologic Methods', 'Histologic and Cytologic Methods', 4),
 ('Flow Cytometry', 'Flow Cytometry', 4), ('Molecular Diagnostics and Cytogenetics', 'Molecular Diagnostics and Cytogenetics', 4), ('Molecular Profiling of Tumors', 'Molecular Profiling of Tumors', 4), ('Digital Pathology', 'Digital Pathology', 4),
 ('SELECTED READINGS', 'Selected Readings', 2)]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
# first-occurrence-only entries that repeat as KC titles or figure debris are consumed by the label/kc logic or fall through as debris
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        ti = re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', '')))
        TABLES[b['id']] = (ti, rows, C(b.get('note') or ''))
TABLES['7.10'] = (TABLES['7.10'][0], [], 'Table content was lost in the source extraction (see the Chemical Carcinogenesis text).')
DROP = set(); OVR = {}
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=[], OVR=OVR, DROP=DROP, TABLES=TABLES)

def _post(nodes):
    out = []; last = None   # last text node index in out
    for nd in nodes:
        if nd[0] == 'p':
            t = nd[1].replace('2-Acetylaminofluorene Dimethylaminoazobenzene (butter yellow) ', '')
            if t.startswith('Anticancer drugs (cyclophosphamide'): continue
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
TITLE = 'Neoplasia'
