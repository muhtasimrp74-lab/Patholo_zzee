# -*- coding: utf-8 -*-
"""Parses tools/mcq_src/past_papers.md and practice_bank.md into tools/mcqs.json.
Run: python3 tools/mcq_parse.py
Output: {"ch": [[chapter, [topic, ...]], ...], "q": [question, ...]}
Question: {h (stable id), c, t, y (0 SBA / 1 T/F), q, o[], a (index | [0/1 x5]), e[] (per-option notes, past papers only),
           w[] (per-option warning notes), s ('P' past paper / 'N' practice bank), g[] (exam tags), k (conflict note)}"""
import re, os, json, sys, collections, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'mcq_src')

# canonical chapter -> topic list (practice-bank names; past-paper names map onto them)
CHAPTERS = [
 ('Cell Injury, Cell Death and Adaptations', ['Cell Injury and Necrosis', 'Apoptosis', 'Free Radicals', 'Adaptations', 'Intracellular Accumulations and Calcification']),
 ('Inflammation and Repair', ['Acute and Chronic Inflammation', 'Chemical Mediators', 'Systemic Effects, Leukocytes and Phagocytosis', 'Granulomatous Inflammation', 'Wound Healing']),
 ('Hemodynamic Disorders, Thromboembolism and Shock', ['Edema', 'Thrombosis', 'Embolism and Infarction', 'Shock']),
 ('Genetic Disorders', ['Single-Gene Disorders', 'Chromosomal Disorders']),
 ('Neoplasia', ['Benign and Malignant Neoplasms', 'Anaplasia and Dysplasia', 'Grading and Staging', 'Carcinogenesis', 'Metastasis', 'Premalignant Lesions and Tumour Markers', 'Childhood Tumours']),
 ('Infectious Diseases', ['Tuberculosis', 'Transfusion Medicine']),
 ('Blood Vessels and Heart', ['Atherosclerosis', 'Myocardial Infarction', 'Rheumatic Fever and Vascular Disorders']),
 ('Diseases of Red Cells, Bleeding Disorders and Bone Marrow', ['Iron Deficiency Anaemia', 'Megaloblastic Anaemia', 'Aplastic Anaemia and Pancytopenia', 'Haemolytic Anaemias', 'Bleeding Disorders and Coagulation Tests', 'Bone Marrow Examination', 'Red Cell Morphology']),
 ('Diseases of White Cells, Lymph Nodes and Spleen', ['Reactive Leukocyte Disorders', 'Leukaemias', 'Myeloproliferative and Plasma Cell Disorders', 'Lymphomas and Lymphadenopathy']),
 ('Lung', ['Chronic Obstructive Pulmonary Disease and Asthma', 'Pneumonia', 'Lung Tumours']),
 ('Head and Neck and Gastrointestinal Tract', ['Salivary Gland Tumours', 'Oesophagus and Stomach', 'Inflammatory Bowel Disease and Appendix']),
 ('Liver, Biliary Tract and Jaundice', ['Cirrhosis and Hepatitis', 'Jaundice, Liver Function Tests and Gallstones']),
 ('Kidney, Lower Urinary Tract and Male Genital System', ['Nephrotic and Nephritic Syndromes', 'Proteinuria, Haematuria and Urinary Casts', 'Urinary Tract Infection, Renal and Bladder Tumours', 'Male Genital System']),
 ('Female Genital Tract and Breast', ['Ovarian Tumours', 'Uterus, Endometriosis and Cervix', 'Breast']),
 ('Endocrine System', ['Diabetes Mellitus', 'Thyroid', 'Parathyroid and Calcium Disorders']),
 ('Bone, Soft Tissue, Peripheral Nerve and Central Nervous System', ['Bone Tumours and Metabolic Bone Disease', 'Osteomyelitis', 'Peripheral Nerve Sheath Tumours and CNS Tumours', 'CSF and Meningitis']),
 ('Clinical Pathology and Laboratory Medicine', ['Acid-Base Disorders', 'ESR and Haematological Tests', 'Histopathology Techniques', 'Anticoagulants and Laboratory Samples', 'Lipids, Glucose, Urine and Electrolytes']),
]
CH_IDX = {n: i for i, (n, _) in enumerate(CHAPTERS)}
CH_ALIAS = {  # past-paper chapter heading -> canonical chapter
 'Diseases of Infancy and Childhood': 'Neoplasia',
 'Diseases of White Cells, Lymph Nodes, Spleen and Thymus': 'Diseases of White Cells, Lymph Nodes and Spleen',
 'Endocrine System (Diabetes, Thyroid, Parathyroid)': 'Endocrine System',
 'Head and Neck (Salivary Glands) and Gastrointestinal Tract': 'Head and Neck and Gastrointestinal Tract',
 'Bone and Soft Tissue, Peripheral Nerve, and Central Nervous System': 'Bone, Soft Tissue, Peripheral Nerve and Central Nervous System',
 'Clinical Pathology and Laboratory Medicine (outside Robbins systemic chapters)': 'Clinical Pathology and Laboratory Medicine',
}
TOPIC_ALIAS = {  # past-paper topic heading -> practice-bank topic
 'Cell Injury (General)': 'Cell Injury and Necrosis', 'Adaptations: Metaplasia and Hyperplasia': 'Adaptations',
 'Systemic Effects of Inflammation': 'Systemic Effects, Leukocytes and Phagocytosis', 'Phagocytic Cells': 'Systemic Effects, Leukocytes and Phagocytosis',
 'Infarction': 'Embolism and Infarction',
 'Autosomal Dominant Disorders': 'Single-Gene Disorders', 'Autosomal Recessive Disorders': 'Single-Gene Disorders', 'X-Linked Disorders': 'Single-Gene Disorders',
 'Genetic vs Non-genetic Derangements': 'Single-Gene Disorders',
 'Benign vs Malignant Neoplasms': 'Benign and Malignant Neoplasms', 'Anaplasia, Dysplasia and Cytomorphology': 'Anaplasia and Dysplasia',
 'Premalignant Lesions': 'Premalignant Lesions and Tumour Markers', 'Hormone-Producing Tumours': 'Premalignant Lesions and Tumour Markers',
 'Transfusion-Transmitted Infections': 'Transfusion Medicine',
 'Atherosclerosis: Risk Factors': 'Atherosclerosis', 'Rheumatic Fever': 'Rheumatic Fever and Vascular Disorders',
 'Aplastic Anemia': 'Aplastic Anaemia and Pancytopenia', 'Pancytopenia': 'Aplastic Anaemia and Pancytopenia', 'Iron Deficiency Anemia': 'Iron Deficiency Anaemia',
 'Megaloblastic Anemia': 'Megaloblastic Anaemia', 'Hemolytic Anemias and Hemolysis': 'Haemolytic Anaemias',
 'Microcytic and Macrocytic Pictures; Leukoerythroblastic Picture': 'Red Cell Morphology',
 'Reactive Leukocytosis': 'Reactive Leukocyte Disorders', 'Acute Leukemias': 'Leukaemias',
 'Chronic Myeloid Leukemia and Myeloproliferative Disorders': 'Myeloproliferative and Plasma Cell Disorders', 'Plasma Cell Neoplasms': 'Myeloproliferative and Plasma Cell Disorders',
 'Obstructive Lung Disease and COPD': 'Chronic Obstructive Pulmonary Disease and Asthma',
 'Stomach: Gastric Carcinoma': 'Oesophagus and Stomach', 'Peptic Ulcer Disease': 'Oesophagus and Stomach', 'Appendix': 'Inflammatory Bowel Disease and Appendix',
 'Inflammatory Bowel Disease': 'Inflammatory Bowel Disease and Appendix',
 'Liver Function Tests': 'Jaundice, Liver Function Tests and Gallstones', 'Gallstones': 'Jaundice, Liver Function Tests and Gallstones',
 'Jaundice and Bilirubin': 'Jaundice, Liver Function Tests and Gallstones', 'Cirrhosis and Chronic Liver Disease': 'Cirrhosis and Hepatitis',
 'Proteinuria': 'Proteinuria, Haematuria and Urinary Casts', 'Hematuria': 'Proteinuria, Haematuria and Urinary Casts', 'Urinary Casts': 'Proteinuria, Haematuria and Urinary Casts',
 'Uterus: Leiomyoma': 'Uterus, Endometriosis and Cervix', 'Endometriosis': 'Uterus, Endometriosis and Cervix',
 'Bone Tumours': 'Bone Tumours and Metabolic Bone Disease', 'Peripheral Nerve Sheath Tumours': 'Peripheral Nerve Sheath Tumours and CNS Tumours',
 'CNS Tumours': 'Peripheral Nerve Sheath Tumours and CNS Tumours', 'CSF Findings in Meningitis': 'CSF and Meningitis',
 'Acid–Base Disorders': 'Acid-Base Disorders', 'ESR': 'ESR and Haematological Tests', 'Parathyroid and Calcium': 'Parathyroid and Calcium Disorders',
 'Lipids and Lipoproteins': 'Lipids, Glucose, Urine and Electrolytes', 'Glucose, Urine and Other Biochemical Tests': 'Lipids, Glucose, Urine and Electrolytes',
}

def place(chapter, topic, stem, opts):
    """Return (chapter idx, topic idx)."""
    chapter = CH_ALIAS.get(chapter, chapter)
    if topic == 'Fixatives and Anticoagulants':   # split by content
        topic = 'Anticoagulants and Laboratory Samples' if 'nticoag' in stem else 'Histopathology Techniques'
    topic = TOPIC_ALIAS.get(topic, topic)
    c = CH_IDX[chapter]
    return c, CHAPTERS[c][1].index(topic)

LET = 'abcde'
def norm(t): return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9 ]', '', t.lower())).strip()

def _blocks(path):
    """Yield (chapter, topic, kind, header-line, body-lines)."""
    started, ch, tp, kind, cur = False, None, None, None, None
    out = []
    for l in open(path, encoding='utf8').read().split('\n'):
        if not started:
            if l.startswith('---'): started = True
            continue
        if l.startswith('# '): ch, tp, kind, cur = l[2:].strip(), None, None, None
        elif l.startswith('## '): tp, kind, cur = l[3:].strip(), None, None
        elif l.startswith('### '): kind, cur = l[4:].strip(), None
        elif l.startswith('#### ') or re.match(r'^\*\*\d+\. ', l):
            cur = [ch, tp, kind, l, []]; out.append(cur)
        elif cur is not None and l.strip(): cur[4].append(l)
    return out

def parse_past(path):
    res = []
    for ch, tp, kind, head, body in _blocks(path):
        m = re.match(r'^#### (.*?)\s*`([^`]+)`\s*$', head)
        stem, tag = m.group(1).strip(), m.group(2)
        y = 1 if kind == 'T/F' else 0
        o, a, e, w = [], ([] if y else None), [], []
        for l in body:
            m = re.match(r'^- ([a-e])\) (.*)$', l)
            if not m: continue
            rest = m.group(2)
            note, warn = '', ''
            if y:
                mm = re.match(r'^(.*?) — \*\*(True|False)([^*]*)\*\*(.*)$', rest)
                assert mm, (head, l)
                text, val, extra, tail = mm.groups()
                a.append(1 if val == 'True' else 0)
                note = (tail or '').strip()
                m2 = re.match(r'^\((.*)\)\s*(.*)$', note)           # "(key's note: ...)" -> plain text
                if m2: note = (m2.group(1) + ' ' + m2.group(2)).strip()
                note = re.sub(r"^key's note:\s*", '', note, flags=re.I).strip('"')
                if 'per' in extra:
                    note = ('Per the printed key. ' + note[:1].upper() + note[1:]).strip()
            else:
                if rest.startswith('**'):
                    mm = re.match(r'^\*\*(.*?) — ✓ Correct\.\*\*\s*(.*)$', rest); assert mm, (head, l)
                    text, note = mm.group(1), mm.group(2).strip(); a = len(o)
                else:
                    mm = re.match(r'^(.*?) — ✗\s*(.*)$', rest); assert mm, (head, l)
                    text, note = mm.group(1), mm.group(2).strip()
            if '⚠' in note:
                note, warn = [x.strip() for x in note.split('⚠', 1)]
                warn = re.sub(r'^Key note:\s*', '', warn)
            note = re.sub(r'\s+([.,;])', r'\1', note.replace('"', '')).strip()
            note = re.sub(r'\.\s*\.', '.', note)
            if note and note[-1] not in '.!?)': note += '.'
            o.append(text.strip()); e.append(note); w.append(warn)
        res.append(dict(y=y, q=stem, o=o, a=a, e=e, w=w, s='P', g=[tag], ch=ch, tp=tp))
    return res

def parse_bank(path):
    res = []
    for ch, tp, kind, head, body in _blocks(path):
        m = re.match(r'^\*\*\d+\. (.*?)\*\*\s*`[^`]*`\s*$', head)
        stem = m.group(1).strip()
        y = 1 if kind == 'T/F' else 0
        o, a = [], None
        for l in body:
            m = re.match(r'^- ([a-e])\) (.*)$', l)
            if m: o.append(m.group(2).strip()); continue
            if l.startswith('**Ans'):
                if y:
                    a = [1 if v == 'T' else 0 for v in re.findall(r'[a-e]\) ([TF])', l)]
                else:
                    a = LET.index(re.search(r'\*\*Ans: ([a-e])\)', l).group(1))
        res.append(dict(y=y, q=stem, o=o, a=a, e=None, w=None, s='N', g=[], ch=ch, tp=tp))
    return res

def main():
    A = parse_past(os.path.join(SRC, 'past_papers.md'))
    B = parse_bank(os.path.join(SRC, 'practice_bank.md'))
    bad = []
    for q in A + B:
        n = len(q['o'])
        if n != 5: bad.append(('options', q['q'][:50], n))
        if q['y'] == 0 and not (isinstance(q['a'], int) and 0 <= q['a'] < n): bad.append(('sba', q['q'][:50], q['a']))
        if q['y'] == 1 and not (isinstance(q['a'], list) and len(q['a']) == n): bad.append(('tf', q['q'][:50], q['a']))
        q['c'], q['t'] = place(q['ch'], q['tp'], q['q'], q['o'])
    if bad: sys.exit('PROBLEMS: %r' % bad[:20])
    # merge exact duplicates (same stem + same options)
    seen, out, merged, conflicts = {}, [], 0, []
    for q in A + B:
        key = (q['y'], norm(q['q']), tuple(sorted(norm(x) for x in q['o'])))
        if key in seen:
            p = seen[key]; merged += 1
            for g in q['g']:
                if g not in p['g']: p['g'].append(g)
            # same answer? compare by option text
            def am(x): return {norm(t): (x['a'] == i if x['y'] == 0 else bool(x['a'][i])) for i, t in enumerate(x['o'])}
            if am(p) != am(q):
                conflicts.append(p['q'])
                p['k'] = 'This question appears in more than one paper and the printed keys differ; one of them is shown.'
            continue
        seen[key] = q; out.append(q)
    out.sort(key=lambda q: (q['c'], q['t'], q['s'] != 'N', q['y']))   # chapter/topic, practice bank first? keep stable below
    for i, q in enumerate(out):
        q['h'] = hashlib.md5(('%d|%s|%s' % (q['y'], norm(q['q']), '|'.join(sorted(norm(x) for x in q['o'])))).encode()).hexdigest()[:8]
        for k in ('ch', 'tp'): q.pop(k)
        if q['e'] is None: q.pop('e'); q.pop('w')
        else:
            if not any(q['e']): q.pop('e')
            if not any(q['w']): q.pop('w')
        if not q['g']: q.pop('g')
    json.dump({'ch': [[n, t] for n, t in CHAPTERS], 'q': out}, open(os.path.join(HERE, 'mcqs.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    cnt = collections.Counter((q['s'], q['y']) for q in out)
    print('questions', len(out), 'merged duplicates', merged, 'key conflicts', len(conflicts), dict(cnt))
    perT = collections.Counter((q['c'], q['t']) for q in out)
    print('topics', len(perT), 'min/max per topic', min(perT.values()), max(perT.values()))
    print('warnings', sum(1 for q in out if q.get('w')), 'with notes', sum(1 for q in out if q.get('e')))

if __name__ == '__main__':
    main()
