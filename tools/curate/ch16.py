# -*- coding: utf-8 -*-
"""Curated Chapter 16 (Head and Neck) via the shared engine. Text from tools/textbook_src/ch16.json; this file only sets headings, drops debris and merges."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch16'
RUN = [r'\s*(?:\b\d{3}\s+)?CHAPTER\s*[1₁][6₆]\s+Head and Neck(?:\s+\d{3}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('DISEASES OF TEETH AND SUPPORTING', 'Diseases of Teeth and Supporting Structures', 2), ('UPPER AIRWAYS', 'Upper Airways', 2), ('EARS', 'Ears', 2), ('NECK', 'Neck', 2), ('SALIVARY GLANDS', 'Salivary Glands', 2), ('SELECTED READINGS', 'Selected Readings', 2), ('INFECTIONS', 'Infections', 3), ('ORAL MANIFESTATIONS OF SYSTEMIC DISEASE', 'Oral Manifestations of Systemic Disease', 3), ('Squamous Cell Carcinoma', 'Oral Squamous Cell Carcinoma', 3), ('ODONTOGENIC CYSTS AND TUMORS', 'Odontogenic Cysts and Tumors', 3), ('NOSE', 'Nose', 3), ('NASOPHARYNX', 'Nasopharynx', 3), ('LARYNX', 'Larynx', 3), ('OTOSCLEROSIS', 'Otosclerosis', 3), ('TUMORS', 'Tumors', 3), ('BRANCHIAL CLEFT CYST (CERVICAL', 'Branchial Cleft Cyst (Cervical Lymphoepithelial Cyst)', 3), ('THYROGLOSSAL DUCT CYST', 'Thyroglossal Duct Cyst', 3), ('PARAGANGLIOMA', 'Paraganglioma', 3), ('XEROSTOMIA', 'Xerostomia', 3), ('Mucocele', 'Mucocele', 3), ('Sialolithiasis and Nonspecific Sialadenitis', 'Sialolithiasis and Nonspecific Sialadenitis', 3), ('NEOPLASMS', 'Neoplasms of the Salivary Glands', 3), ('Gingivitis', 'Gingivitis', 4), ('Periodontitis', 'Periodontitis', 4), ('Fibrous Proliferative Lesions', 'Fibrous Proliferative Lesions', 4), ('Herpes Simplex Virus Infections', 'Herpes Simplex Virus Infections', 4), ('Deep Fungal Infections', 'Deep Fungal Infections', 4), ('Hairy Leukoplakia', 'Hairy Leukoplakia', 4), ('Sinonasal Angiofibroma', 'Sinonasal Angiofibroma', 4), ('Sinonasal Papilloma', 'Sinonasal Papilloma', 4), ('Olfactory Neuroblastoma', 'Olfactory Neuroblastoma', 4), ('NUT Carcinoma', 'NUT Carcinoma', 4), ('Nasopharyngeal Carcinoma', 'Nasopharyngeal Carcinoma', 4), ('Squamous Papilloma and Papillomatosis', 'Squamous Papilloma and Papillomatosis', 4), ('Carcinoma of the Larynx', 'Carcinoma of the Larynx', 4), ('Warthin Tumor (Papillary Cystadenoma', 'Warthin Tumor (Papillary Cystadenoma Lymphomatosum)', 4), ('Mucoepidermoid Carcinoma', 'Mucoepidermoid Carcinoma', 4), ('Adenoid Cystic Carcinoma', 'Adenoid Cystic Carcinoma', 4), ('Acinic Cell Carcinoma', 'Acinic Cell Carcinoma', 4), ('Infectious Rhinitis', 'Infectious Rhinitis', 5), ('Allergic Rhinitis', 'Allergic Rhinitis', 5), ('Nasal Polyps', 'Nasal Polyps', 5), ('Chronic Rhinitis', 'Chronic Rhinitis', 5), ('Sinusitis', 'Sinusitis', 5), ('Necrotizing Lesions of the Nose and Upper Airway', 'Necrotizing Lesions of the Nose and Upper Airway', 5), ('Hyperplasia-Dysplasia-Carcinoma Sequence', 'Hyperplasia-Dysplasia-Carcinoma Sequence', 5),]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
HEADS[auto.norm('Inflammatory Lesions')] = [('Inflammatory Lesions', 4)] * 3 + [('Inflammatory Lesions', 3)]
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; see the text.')
DROP = {4} | set(range(234, 241))
OVR = {12: [('h2', 'Oral Cavity'), ('h3', 'Inflammatory/Reactive Lesions')], 113: [('h3', 'Tumors of the Nose and Nasopharynx')]}

_t234, _t236, _t238, _t239 = M(234), M(236), M(238), M(239)
_mu = _t234.split(' organized in sheets')[0]
_ac = '…organized in sheets' + _t234.split(' organized in sheets')[1].split(' SELECTED READINGS')[0] + ' ' + re.sub(r'^.*?(The clinical course)', r'\1', _t234.split('Classifi-')[1].split(' cation of Head')[0] + ' ' + _t234.split(' mitoses, and necrosis. Although', 1)[0].split('pleomorphism,')[0], flags=re.S) if False else None
_rest234 = _t234.split(' SELECTED READINGS ', 1)[1]
_clin = 'The clinical course of acinic cell carcinomas' + _rest234.split('The clinical course of acinic cell carcinomas', 1)[1].split(' cation of Head')[0] + ' mitoses, and necrosis.' + _t234.split(' mitoses, and necrosis. Although', 1)[1].split(' Cancer Genome', 1)[0].replace('resec- tion', 'resection') if False else None
def _between(t, a, b): return t.split(a, 1)[1].split(b, 1)[0]
_acin = '…organized in sheets' + _between(_t234, ' organized in sheets', ' SELECTED READINGS ').rstrip() + _t234.split(' SELECTED READINGS ', 1)[1].split(' Badoual C.')[0] + ' The clinical course of acinic cell carcinomas is reflected by the histologic grade, which considers the degree of nuclear pleomorphism, mitoses, and necrosis. Although recurrence is uncommon after resection, 10% to 15% of tumors metastasize to lymph nodes. The survival rate is approximately 90% at 5 years and 60% at 20 years.'
_badoual = 'Badoual C. Update from the 5th Edition of the World Health Organization Classification of Head and Neck Tumors: Oropharynx and Nasopharynx. Head Neck Pathol. 2022;16(1):19-30. [New WHO classification of head and neck tumors with a comprehensive overview of oropharyngeal and nasopharyngeal lesions.]'
_tcga = 'Cancer Genome Atlas Network. Comprehensive genomic characterization ' + re.sub(r'^KEY CONCEPTS ', '', M(235))
_fas = _t236.split(' Diseases of Salivary Glands')[0]
_kre = 'Kreimer AR, Chaturvedi AK, Alemany L, *et al.* Summary from an international ' + 'cancer seminar' + _t238.split('cancer seminar', 1)[1]
_who = 'WHO Classification of Tumours Editorial Board. Head and neck tumours. Lyon ' + M(240)
_who2 = _t239.replace('WHO Classification of Tumours Editorial Board. Head and neck tumours. Lyon ', '')
TAIL = [('kc', [(None, [M(237), _t238.split(' cancer seminar')[0], _who2, _mu, _acin])]), ('h2', 'Selected Readings'), ('refs', [_badoual, _tcga, _fas, _kre, _who])]
NODES = auto.make(KEY, RUN, FIX, HEADS, RUNIN=[], OVR=OVR, DROP=DROP, TABLES=TABLES) + TAIL
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
TITLE = 'Head and Neck'
