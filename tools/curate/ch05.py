# -*- coding: utf-8 -*-
"""Curated Chapter 5 (Genes and Human Diseases) via the shared engine. Text from tools/textbook_src/ch05.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch05'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+Genes and Human Diseases(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('MORPHOLGY', 'MORPHOLOGY')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('Mutations', 'Mutations', 3), ('SINGLE-GENE DISORDERS', 'Single-gene Disorders', 2), ('Transmission Patterns of Single-Gene Disorders', 'Transmission Patterns of Single-Gene Disorders', 3), ('Autosomal Dominant Disorders', 'Autosomal Dominant Disorders', 3), ('Autosomal Recessive Disorders', 'Autosomal Recessive Disorders', 3), ('X-Linked Disorders', 'X-Linked Disorders', 3), ('(Mendelian) Disorders', '(Mendelian) Disorders', 3), ('Alterations in Structural Proteins', 'Alterations in Structural Proteins', 3), ('Defects in Receptors and Transport Systems', 'Defects in Receptors and Transport Systems', 3), ('Enzyme Defects and Their Consequences', 'Enzyme Defects and Their Consequences', 3), ('Disorders of Epigenetic Machinery', 'Disorders of Epigenetic Machinery', 3), ('Proteins', 'Proteins', 3), ('Marfan Syndrome', 'Marfan Syndrome', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Clinical Features', 'Clinical Features', 4), ('Ehlers-Danlos Syndrome', 'Ehlers-Danlos Syndrome', 3), ('Ehlers-Danlos Syndromes', 'Ehlers-Danlos Syndromes', 3), ('Familial Hypercholesterolemia', 'Familial Hypercholesterolemia', 3), ('Lysosomal Storage Diseases', 'Lysosomal Storage Diseases', 3), ('Golgi', 'Golgi', 3), ('Small', 'Small', 3), ('Clinical Features', 'Clinical Features', 4), ('Clinical Features', 'Clinical Features', 4), ('Clinical Features', 'Clinical Features', 4), ('Pyruvate Lactate', 'Pyruvate Lactate', 3), ('Disorders of Epigenetic Machinery', 'Disorders of Epigenetic Machinery', 3), ('COMPLEX MULTIGENIC DISORDERS', 'Complex Multigenic Disorders', 2), ('Walking Methylated', 'Walking Methylated', 3), ('Arm Region Band Sub-band', 'Arm Region Band Sub-band', 3), ('X-CHROMOSOME', 'X-chromosome Chromosomal Disorders', 2), ('Commonly Used Cytogenetic Terminology', 'Commonly Used Cytogenetic Terminology', 3), ('Structural Abnormalities of Chromosomes', 'Structural Abnormalities of Chromosomes', 3), ('Other Trisomies', 'Other Trisomies', 3), ('Cytogenetic Disorders Involving Sex Chromosomes', 'Cytogenetic Disorders Involving Sex Chromosomes', 3), ('150 CHAPTER ₅ Genes and Human Diseases', '150 CHAPTER ₅ Genes and Human Diseases', 3), ('X-chromosome', 'X-chromosome', 3), ('Klinefelter Syndrome', 'Klinefelter Syndrome', 3), ('KLINEFELTER SYNDROME', 'Klinefelter Syndrome', 2), ('Turner Syndrome', 'Turner Syndrome', 3), ('Clinical Features', 'Clinical Features', 4), ('Mosaic type: 45,X/46,XX', 'Mosaic type: 45,X/46,XX', 3), ('Pathogenesis', 'Pathogenesis', 4), ('Hermaphroditism and Pseudohermaphroditism', 'Hermaphroditism and Pseudohermaphroditism', 3), ('SINGLE-GENE DISORDERS WITH NONCLASSIC', 'Single-gene Disorders with Nonclassic Inheritance', 2), ('Diseases Caused by Trinucleotide-Repeat Expansions', 'Diseases Caused by Trinucleotide-Repeat Expansions', 3), ('Fragile X Syndrome', 'Fragile X Syndrome', 3), ('Transcriptional Transcriptional Transcriptional Polyglutamine expansions', 'Transcriptional Transcriptional Transcriptional Polyglutamine expansions', 3), ('X Chromosomes Full mutation Normal/Full mutation Normal Normal', 'X Chromosomes Full mutation Normal/Full mutation Normal Normal', 3), ('156 CHAPTER ₅ Genes and Human Diseases', '156 CHAPTER ₅ Genes and Human Diseases', 3), ('X–Associated Primary Ovarian Failure', 'X–Associated Primary Ovarian Failure', 3), ('Optic Neuropathy', 'Optic Neuropathy', 3), ('Genomic Imprinting', 'Genomic Imprinting', 3), ('Prader-Willi Syndrome and Angelman Syndrome', 'Prader-Willi Syndrome and Angelman Syndrome', 3), ('Imprinted Active Active', 'Imprinted Active Active', 3), ('Imprinted Imprinted Active', 'Imprinted Imprinted Active', 3), ('Gonadal Mosaicism', 'Gonadal Mosaicism', 3), ('Somatic Mosaicism', 'Somatic Mosaicism', 3), ('MOLECULAR GENETIC DIAGNOSIS', 'Molecular Genetic Diagnosis', 2), ('PIK3CA-RELATED', 'Pik3ca-related Overgrowth', 2), ('Diagnostic Methods and Indications for Testing', 'Diagnostic Methods and Indications for Testing', 3), ('Laboratory Considerations', 'Laboratory Considerations', 3), ('Indications for Analysis of Inherited Genetic Alterations', 'Indications for Analysis of Inherited Genetic Alterations', 3), ('Indications for Analysis of Acquired Genetic Alterations', 'Indications for Analysis of Acquired Genetic Alterations', 3), ('PCR Detection of DNA and RNA Sequence Alterations', 'PCR Detection of DNA and RNA Sequence Alterations', 3), ('Large-Scale Genomic Alterations', 'Large-Scale Genomic Alterations', 3), ('Fluorescence In Situ Hybridization', 'Fluorescence In Situ Hybridization', 3), ('Laser Detector', 'Laser Detector', 3), ('Array Technology', 'Array Technology', 3), ('Zygosity 0.6', 'Zygosity 0.6', 3), ('Polymorphic Markers', 'Polymorphic Markers', 3), ('Epigenetic Alterations', 'Epigenetic Alterations', 3), ('Next-Generation Sequencing', 'Next-Generation Sequencing', 3), ('Bioinformatics', 'Bioinformatics', 3), ('Clinical Applications of Next-Generation DNA Sequencing', 'Clinical Applications of Next-Generation DNA Sequencing', 3), ('Liquid Biopsies and ctDNA Analysis', 'Liquid Biopsies and ctDNA Analysis', 3), ('166 CHAPTER ₅ Genes and Human Diseases', '166 CHAPTER ₅ Genes and Human Diseases', 3), ('SELECTED READINGS', 'Selected Readings', 2), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [83, 93, 131, 151, 153, 155, 160, 168, 176, 183, 196, 197, 258, 259, 287, 288, 292, 308, 382, 384, 403, 423, 445, 448, 458, 484, 485, 486, 487, 488, 489, 492, 495, 515, 516, 557, 564, 574, 589, 629]
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
TITLE = 'Genes and Human Diseases'
