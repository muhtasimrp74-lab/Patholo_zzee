# -*- coding: utf-8 -*-
"""Separate a two-column page that the extractor interleaved line by line.
The text is cut (never retyped) at short anchor strings; segments alternate between the two columns
(segment 0 = column A, segment 1 = column B, segment 2 = column A ...).  A word broken by a line-end hyphen
across two segments of the same column is joined ('hy-' + 'drostatic' -> 'hydrostatic')."""
import re

def split(text, anchors, first='A'):
    pos = [0]
    for a in anchors:
        i = text.find(a, pos[-1] + (1 if pos[-1] else 0))
        assert i >= 0, ('anchor not found', a)
        pos.append(i)
    pos.append(len(text))
    segs = [text[pos[k]:pos[k + 1]].strip() for k in range(len(pos) - 1)]
    cols = {'A': [], 'B': []}
    order = ['A', 'B'] if first == 'A' else ['B', 'A']
    for k, s in enumerate(segs): cols[order[k % 2]].append(s)
    def join(parts):
        out = ''
        for p in parts:
            if not p: continue
            if out.endswith('-') and p[:1].islower() and not out.endswith(' -'): out = out[:-1] + p
            else: out = (out + ' ' + p) if out else p
        return re.sub(r'\s+', ' ', out).strip()
    return join(cols['A']), join(cols['B'])
