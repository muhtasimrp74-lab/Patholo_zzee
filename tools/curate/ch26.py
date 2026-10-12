# -*- coding: utf-8 -*-
"""Curated Chapter 26 (Bones, Joints, and Soft Tissue Tumors) via the shared engine. Text from tools/textbook_src/ch26.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch26'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+Bones, Joints, and Soft Tissue Tumors(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('BONE', 'Bone Basic Structure and Function of Bone', 2), ('Matrix', 'Matrix', 3), ('Development', 'Development', 3), ('Bones, Joints, and Soft Tissue Tumors 1065', 'Bones, Joints, and Soft Tissue Tumors 1065', 3), ('Homeostasis and Remodeling', 'Homeostasis and Remodeling', 3), ('DEVELOPMENTAL DISORDERS OF BONE', 'Developmental Disorders of Bone and Cartilage', 2), ('Defects in Nuclear Proteins and Transcription Factors', 'Defects in Nuclear Proteins and Transcription Factors', 3), ('Defects in Hormones and Signal Transduction Proteins', 'Defects in Hormones and Signal Transduction Proteins', 3), ('Defects in Extracellular Structural Proteins', 'Defects in Extracellular Structural Proteins', 3), ('Osteopetrosis', 'Osteopetrosis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Mucopolysaccharidoses', 'Mucopolysaccharidoses', 3), ('METABOLIC DISEASES OF BONE', 'Metabolic Diseases of Bone', 2), ('Osteopenia and Osteoporosis', 'Osteopenia and Osteoporosis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Increased', 'Increased', 3), ('Decreased Increased', 'Decreased Increased', 3), ('SENILE POSTMENOPAUSAL', 'Senile Postmenopausal Osteoporosis Osteoporosis', 2), ('Clinical Features', 'Clinical Features', 4), ('Osteomalacia and Rickets', 'Osteomalacia and Rickets', 3), ('Hyperparathyroidism', 'Hyperparathyroidism', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Renal Osteodystrophy', 'Renal Osteodystrophy', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Acidosis RANK-L Osteopenia', 'Acidosis RANK-L Osteopenia', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Healing of Fractures', 'Healing of Fractures', 3), ('Bones, Joints, and Soft Tissue Tumors 1075', 'Bones, Joints, and Soft Tissue Tumors 1075', 3), ('Clinical Features', 'Clinical Features', 4), ('OSTEOMYELITIS', 'Osteomyelitis', 2), ('Clinical Features', 'Clinical Features', 4), ('Mycobacterial Osteomyelitis', 'Mycobacterial Osteomyelitis', 3), ('Skeletal Syphilis', 'Skeletal Syphilis', 3), ('BONE TUMORS', 'Bone Tumors', 2), ('Bone-Forming Tumors', 'Bone-Forming Tumors', 3), ('Osteoid Osteoma and Osteoblastoma', 'Osteoid Osteoma and Osteoblastoma', 3), ('Osteosarcoma', 'Osteosarcoma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Cartilage-Forming Tumors', 'Cartilage-Forming Tumors', 3), ('Osteochondroma', 'Osteochondroma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Growth chondrocytes Chondrocyte Osteochondroma', 'Growth chondrocytes Chondrocyte Osteochondroma', 3), ('Clinical Features', 'Clinical Features', 4), ('Chondroma', 'Chondroma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Chondrosarcoma', 'Chondrosarcoma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Ewing Sarcoma', 'Ewing Sarcoma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Giant Cell Tumor', 'Giant Cell Tumor', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Aneurysmal Bone Cyst', 'Aneurysmal Bone Cyst', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Nonossifying Fibroma', 'Nonossifying Fibroma', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Fibrous Dysplasia', 'Fibrous Dysplasia', 3), ('Metastatic Tumors', 'Metastatic Tumors', 3), ('JOINTS', 'Joints', 2), ('ARTHRITIS', 'Arthritis', 2), ('Osteoarthritis', 'Osteoarthritis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Rheumatoid Arthritis', 'Rheumatoid Arthritis', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Arthritis', 'Arthritis', 3), ('Juvenile Idiopathic Arthritis', 'Juvenile Idiopathic Arthritis', 3), ('Seronegative Spondyloarthropathies', 'Seronegative Spondyloarthropathies', 3), ('Ankylosing Spondylitis', 'Ankylosing Spondylitis', 3), ('Reactive Arthritis', 'Reactive Arthritis', 3), ('Infectious Arthritis', 'Infectious Arthritis', 3), ('Suppurative Arthritis', 'Suppurative Arthritis', 3), ('Mycobacterial Arthritis', 'Mycobacterial Arthritis', 3), ('Viral Arthritis', 'Viral Arthritis', 3), ('Lyme Arthritis', 'Lyme Arthritis', 3), ('Crystal-Induced Arthritis', 'Crystal-Induced Arthritis', 3), ('Gout', 'Gout', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Pathogenesis', 'Pathogenesis', 4), ('Bones, Joints, and Soft Tissue Tumors 1097', 'Bones, Joints, and Soft Tissue Tumors 1097', 3), ('JOINT TUMORS', 'Joint Tumors', 2), ('Ganglion and Synovial Cysts', 'Ganglion and Synovial Cysts', 3), ('Tenosynovial Giant Cell Tumor', 'Tenosynovial Giant Cell Tumor', 3), ('Pathogenesis', 'Pathogenesis', 4), ('SOFT TISSUE TUMORS', 'Soft Tissue Tumors', 2), ('Pathogenesis', 'Pathogenesis', 4), ('TUMORS OF ADIPOSE TISSUE', 'Tumors of Adipose Tissue', 2), ('FIBROUS TUMORS', 'Fibrous Tumors', 2), ('Nodular Fasciitis', 'Nodular Fasciitis', 3), ('Superficial Fibromatosis', 'Superficial Fibromatosis', 3), ('Rhabdomyosarcoma', 'Rhabdomyosarcoma', 3), ('SMOOTH MUSCLE TUMORS', 'Smooth Muscle Tumors', 2), ('Leiomyoma', 'Leiomyoma', 3), ('Leiomyosarcoma', 'Leiomyosarcoma', 3), ('TUMORS OF UNCERTAIN ORIGIN', 'Tumors of Uncertain Origin', 2), ('Synovial Sarcoma', 'Synovial Sarcoma', 3), ('Undifferentiated Soft Tissue Sarcoma', 'Undifferentiated Soft Tissue Sarcoma', 3), ('SELECTED READINGS', 'Selected Readings', 2), ('Bones, Joints, and Soft Tissue Tumors 1105', 'Bones, Joints, and Soft Tissue Tumors 1105', 3), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [3, 13, 40, 41, 44, 45, 51, 85, 104, 105, 106, 113, 175, 211, 301, 377, 378, 380, 401, 404, 409, 549]
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
TITLE = 'Bones, Joints, and Soft Tissue Tumors'
