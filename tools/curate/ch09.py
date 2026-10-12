# -*- coding: utf-8 -*-
"""Curated Chapter 9 (Environmental and Nutritional Diseases) via the shared engine. Text from tools/textbook_src/ch09.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch09'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+Environmental and Nutritional Diseases(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('MORPHOLGY', 'MORPHOLOGY')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('HEALTH DISPARITIES', 'Health Disparities', 2), ('HEALTH EFFECTS OF CLIMATE CHANGE', 'Health Effects of Climate Change', 2), ('TOXICITY OF CHEMICAL AND PHYSICAL AGENTS', 'Toxicity of Chemical and Physical Agents', 2), ('Soil', 'Soil', 3), ('XENOBIOTIC', 'Xenobiotic', 2), ('ENVIRONMENTAL POLLUTION', 'Environmental Pollution', 2), ('Air Pollution', 'Air Pollution', 3), ('Outdoor Air Pollution', 'Outdoor Air Pollution', 3), ('Indoor Air Pollution', 'Indoor Air Pollution', 3), ('Metals as Environmental Pollutants', 'Metals as Environmental Pollutants', 3), ('Lead', 'Lead', 3), ('Pb2+', 'Pb2+', 3), ('Mercury', 'Mercury', 3), ('Arsenic', 'Arsenic', 3), ('Cadmium', 'Cadmium', 3), ('AGRICULTURAL EXPOSURES', 'Agricultural Exposures', 2), ('Smoking and Lung Cancer', 'Smoking and Lung Cancer', 3), ('Tobacco Smoke', 'Tobacco Smoke', 3), ('Smoking and Other Diseases', 'Smoking and Other Diseases', 3), ('0–40 Alc', '0–40 Alc', 3), ('EFFECTS OF ALCOHOL', 'Effects of Alcohol', 2), ('Anticoagulants', 'Anticoagulants', 3), ('Menopausal Hormone Therapy', 'Menopausal Hormone Therapy', 3), ('Oral Contraceptives', 'Oral Contraceptives', 3), ('Acetaminophen', 'Acetaminophen', 3), ('According to the United Nations World Drug Report 2023, there were', 'According to the United Nations World Drug Report 2023, there were', 3), ('CENTRAL NERVOUS SYSTEM SYNAPSE', 'Central Nervous System Synapse', 2), ('Cocaine', 'Cocaine', 3), ('Opioids and Opiates', 'Opioids and Opiates', 3), ('Amphetamines and Related Drugs', 'Amphetamines and Related Drugs', 3), ('Marijuana', 'Marijuana', 3), ('Other Drugs', 'Other Drugs', 3), ('INJURY BY PHYSICAL AGENTS', 'Injury by Physical Agents', 2), ('Mechanical Trauma', 'Mechanical Trauma', 3), ('Thermal Injury', 'Thermal Injury', 3), ('Thermal Burns', 'Thermal Burns', 3), ('Hyperthermia', 'Hyperthermia', 3), ('Hypothermia', 'Hypothermia', 3), ('Electrical Injury', 'Electrical Injury', 3), ('Injury Produced by Ionizing Radiation', 'Injury Produced by Ionizing Radiation', 3), ('Radiation Units', 'Radiation Units', 3), ('Main Determinants of Biologic Effects of Ionizing Radiation', 'Main Determinants of Biologic Effects of Ionizing Radiation', 3), ('IONIZING', 'Ionizing Radiation', 2), ('SKIN', 'Skin', 2), ('LUNGS', 'Lungs', 2), ('Spermatogonia', 'Spermatogonia', 3), ('Total-Body Irradiation', 'Total-Body Irradiation', 3), ('Acute Effects on Hematopoietic and Lymphoid Systems', 'Acute Effects on Hematopoietic and Lymphoid Systems', 3), ('NUTRITIONAL DISEASES', 'Nutritional Diseases', 2), ('Dietary Insufficiency', 'Dietary Insufficiency', 3), ('Severe Acute Malnutrition', 'Severe Acute Malnutrition', 3), ('Marasmus', 'Marasmus', 3), ('Kwashiorkor', 'Kwashiorkor', 3), ('Malnutrition in High-Resource Countries', 'Malnutrition in High-Resource Countries', 3), ('Cachexia', 'Cachexia', 3), ('Anorexia Nervosa and Bulimia', 'Anorexia Nervosa and Bulimia', 3), ('Vitamin Deficiencies', 'Vitamin Deficiencies', 3), ('R ₉ Environmental and Nutritional Diseases 399', 'R ₉ Environmental and Nutritional Diseases 399', 3), ('Vitamin D', 'Vitamin D', 3), ('Vitamin D', 'Vitamin D', 3), ('Intestine', 'Intestine', 3), ('Obesity', 'Obesity', 3), ('Osteocytes', 'Osteocytes', 3), ('Leptin', 'Leptin', 3), ('Regulates', 'Regulates', 3), ('Gut Hormones', 'Gut Hormones', 3), ('Adiponectin', 'Adiponectin', 3), ('Adipose Tissue', 'Adipose Tissue', 3), ('Role of the Gut Microbiome', 'Role of the Gut Microbiome', 3), ('Clinical Consequences of Obesity', 'Clinical Consequences of Obesity', 3), ('PI3K/AKT pathway', 'PI3K/AKT pathway', 3), ('Obesity and Cancer', 'Obesity and Cancer', 3), ('Diet and Cancer', 'Diet and Cancer', 3), ('Diet and Systemic Diseases', 'Diet and Systemic Diseases', 3), ('SELECTED READINGS', 'Selected Readings', 2), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [10, 16, 33, 34, 86, 87, 91, 92, 93, 94, 95, 96, 97, 98, 153, 183, 192, 233, 259, 260, 273, 280, 281, 282, 370, 371, 372, 381, 393, 509, 512, 555, 572]
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
TITLE = 'Environmental and Nutritional Diseases'
