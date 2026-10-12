# -*- coding: utf-8 -*-
"""Rebuild an empty source table from the leftover blocks that follow its table block.
Only source text is used (no new wording): each 'h' block starts a row (first cell), the following
li/p blocks are joined with '; ' as the second cell.  Returns (rows, drop_indexes)."""
import re

def _clean(s): return re.sub(r'\s+', ' ', re.sub(r'\*+', '', s)).strip()

def rebuild(SRC, C, a, b, header, cut=(), skip=(), asitem=(), rename=None, breaks=(), ashead=()):
    """a..b inclusive = leftover block indexes.  cut = substrings removed from block text (e.g. a footnote tail).
    skip = block indexes inside the range that are NOT table cells (they stay in the text).
    asitem = 'h' blocks that are really cell items; rename = {idx: short label} for a heading; breaks = blocks that start a new row with an empty first cell."""
    rename = rename or {}
    rows = []; cur = None; drop = set()
    for i in range(a, b + 1):
        if i in skip: continue
        blk = SRC[i]; t = blk['t']
        if t in ('fig', 'table', 'label'): continue
        md = C(blk.get('md', ''))
        for c in cut: md = md.replace(c, '')
        md = _clean(md)
        drop.add(i)
        if not md: continue
        if i in rename: md = rename[i]
        if i in breaks: cur = ['', []]; rows.append(cur); cur[1].append(md)
        elif (t == 'h' and i not in asitem) or i in ashead: cur = [md, []]; rows.append(cur)
        else:
            if cur is None: cur = ['', []]; rows.append(cur)
            cur[1].append(md)
    return [list(header)] + [[r[0], '; '.join(r[1])] for r in rows], drop
