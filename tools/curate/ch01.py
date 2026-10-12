# -*- coding: utf-8 -*-
"""Curated Chapter 1 (The Cell as a Unit of Health and Disease) via the shared engine. Text from tools/textbook_src/ch01.json; headings were detected by rule (a heading is kept only when body text follows it) and diagram/table-of-contents debris is dropped."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto
KEY = 'ch01'
RUN = [r'\s*(?:\b\d{3,4}\s+)?CHAPTER\s*[\d₀-₉]+\s+The Cell as a Unit of Health and Disease(?:\s+\d{3,4}\b)?\s*']
FIX = [('pool- ing', 'pooling'), ('MORPHOLGY', 'MORPHOLOGY')]
SRC, C, M, cap, part = auto.helpers(KEY, RUN, FIX)
_H = [ ('Cell', 'Cell', 3), ('Protein', 'Protein', 3), ('Histone Organization', 'Histone Organization', 3), ('MicroRNA and Long Noncoding RNA', 'MicroRNA and Long Noncoding RNA', 3), ('Long Noncoding RNA', 'Long Noncoding RNA', 3), ('Gene Editing', 'Gene Editing', 3), ('Dicer', 'Dicer', 3), ('CELLULAR HOUSEKEEPING', 'Cellular Housekeeping', 2), ('Plasma Membrane: Protection and Nutrient Acquisition', 'Plasma Membrane: Protection and Nutrient Acquisition', 3), ('Membrane Transport', 'Membrane Transport', 3), ('Passive Diffusion', 'Passive Diffusion', 3), ('Carriers and Channels', 'Carriers and Channels', 3), ('Receptor-Mediated and Fluid-Phase Uptake', 'Receptor-Mediated and Fluid-Phase Uptake', 3), ('Cytoskeleton', 'Cytoskeleton', 3), ('Cell-Cell Interactions', 'Cell-Cell Interactions', 3), ('and Golgi Apparatus', 'and Golgi Apparatus', 3), ('Denatured', 'Denatured', 3), ('Waste Disposal: Lysosomes and Proteasomes', 'Waste Disposal: Lysosomes and Proteasomes', 3), ('CELLULAR METABOLISM AND MITOCHONDRIAL', 'Cellular Metabolism and Mitochondrial Function', 2), ('TOXIN ATP Caspase cascade', 'TOXIN ATP Caspase cascade', 3), ('CELLULAR SIGNALING', 'Cellular Signaling', 2), ('Signal Transduction Pathways', 'Signal Transduction Pathways', 3), ('Transcription of nuclear Transcription of Transcription', 'Transcription of nuclear Transcription of Transcription', 3), ('Modular Signaling Proteins, Hubs, and Nodes', 'Modular Signaling Proteins, Hubs, and Nodes', 3), ('Transcription Factors', 'Transcription Factors', 3), ('GROWTH FACTORS AND RECEPTORS', 'Growth Factors and Receptors', 2), ('EXTRACELLULAR MATRIX', 'Extracellular Matrix', 2), ('Cross-linking', 'Cross-linking', 3), ('MAINTAINING CELL POPULATIONS', 'Maintaining Cell Populations', 2), ('Proliferation and the Cell Cycle', 'Proliferation and the Cell Cycle', 3), ('Paxillin', 'Paxillin', 3), ('Stem Cells', 'Stem Cells', 3), ('Cardiomyocytes Neurons Hepatocytes', 'Cardiomyocytes Neurons Hepatocytes', 3), ('Regenerative Medicine', 'Regenerative Medicine', 3), ('Ectoderm Mesoderm Endoderm', 'Ectoderm Mesoderm Endoderm', 3), ('CONCLUDING REMARKS', 'Concluding Remarks', 2), ('ACKNOWLEDGMENT', 'Acknowledgment', 2), ('SELECTED READINGS', 'Selected Readings', 2), ]
HEADS = {}
for _s, _d, _l in _H: HEADS.setdefault(auto.norm(_s), []).append((_d, _l))
TABLES = {}
for b in SRC:
    if b['t'] == 'table':
        rows = [[C(c or '') for c in r] for r in (b.get('rows') or [])]
        TABLES[b['id']] = (re.sub(r'^TABLE\s+[\d.]+\s*', '', C(b.get('caption', ''))), rows, C(b.get('note') or '') if rows else 'Table content was lost in the source extraction; its leftover entries may appear in the text.')
DROP = [6, 7, 8, 9, 33, 34, 56, 57, 160, 167, 171, 198, 214, 263, 264, 265, 266, 277, 292, 293, 294, 295, 296, 297, 298, 299, 310, 311, 316, 318, 320, 335]
DROP = set(DROP)
OVR = {}
# opening: block 1 is two columns interleaved (intro + "worms vs humans" text) plus margin words.  Cut at anchors, reorder, delete margin words.
_t = M(1); _P = lambda a: _t.index(a)
_J0 = _t[:_P('humans. What')].strip()                                   # "of disease that are emphasized ... book." (tail of the intro; its lead is lost)
_S1 = _t[_P('humans. What'):_P('The sequencing')]; _S2 = _t[_P('The sequencing'):_P('proteins are recognizable')]
_S3 = _t[_P('proteins are recognizable'):_P('The answer is not')]; _S4 = _t[_P('The answer is not'):_P('THE GENOME')]
_S5 = _t[_P('(so-called'):_P('over 85%')]; _S6 = _t[_P('over 85%'):]
for _x in (' However,', ' that while'): assert _x in _S2; _S2 = _S2.replace(_x, '', 1)
_S6 = _S6.replace(' burgeoning', '').replace('It follows proteins', 'It follows that while proteins')
_A = re.sub(r'\s+', ' ', _S2 + ' … ' + _J0.replace(' the these book', ' the book')).strip()
_B = re.sub(r'\s+', ' ', '… ' + _S3 + ' ' + _S1.replace('? much of', '? Much of') + ' ' + _S5 + ' ' + _S4 + ' ' + _S6 + ' ' + M(2).replace('apparthe ently', 'apparently')).strip()
OVR[1] = [('p', _A), ('p', _B)]; OVR[2] = []
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
TITLE = 'The Cell as a Unit of Health and Disease'
