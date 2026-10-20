# -*- coding: utf-8 -*-
"""Recorded semicolon treatment for the textbook pages.

The committed textbook/chNN.html carry sentence-split text ('. Moreover, ...') where textbook_build.py's raw output has
'; moreover, ...'. That text was produced by an earlier pass that edited only the finished pages. To let the generator
reproduce the committed pages exactly, the treatment of every semicolon is recorded in tools/textbook_semicolons.json
(one code per ';' in the raw generated chapter, in document order) and re-applied after block ids are computed.

Codes (lower case = also capitalise the next letter):
  K  keep the ';'            P  ';'  -> '.'          S  '; ' -> '. '          B  '; ' -> '<br>'
  D  delete the ';' (it ended a caption or list item)   Q  ';' -> '. ' (no space followed it, e.g. a citation year)   R  ';' -> '<br>' (no space followed it)
Usage:  python3 tools/textbook_semicolons.py --derive RAW_DIR COMMITTED_DIR   (rewrites the json; maintenance only)
"""
import json, os, re, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'textbook_semicolons.json')
REPL = {'P': '.', 'S': '. ', 'B': '<br>', 'D': '', 'Q': '. ', 'R': '<br>'}
EAT = {'P': 1, 'S': 2, 'B': 2, 'D': 1, 'Q': 1, 'R': 1}      # characters of the raw text consumed by the code


def load():
    return json.load(open(DATA, encoding='utf8')) if os.path.exists(DATA) else {}


def apply(h, codes):
    out, k, i, n, cap, tag = [], 0, 0, len(h), False, False
    while i < n:
        c = h[i]
        if c != ';':
            if c == '<': tag = True
            elif c == '>': tag = False
            elif cap and not tag and c.islower(): c = c.upper(); cap = False
            elif cap and not tag and c.isalnum(): cap = False
            out.append(c); i += 1; continue
        code = codes[k]; k += 1
        if code == 'K': out.append(';'); i += 1; cap = False; continue
        up = code.upper(); out.append(REPL[up]); i += EAT[up]; cap = code != up; tag = False
    assert k == len(codes), 'semicolon count mismatch: %d codes for %d semicolons' % (len(codes), k)
    return ''.join(out)


def _derive_one(g, c, name):
    i = j = 0; codes = []; n = len(g); pend = False; tag = False
    def same(i2, j2, cap):
        t, pc = False, cap
        for d in range(60):
            if i2 + d >= n or j2 + d >= len(c): break
            a, b = g[i2 + d], c[j2 + d]
            if a == ';': break
            if a == '<': t = True
            elif a == '>': t = False
            elif pc and not t and a.islower(): a = a.upper(); pc = False
            elif pc and not t and a.isalnum(): pc = False
            if a != b: return False
        return True
    while i < n:
        if g[i] != ';':
            a = g[i]
            if a == '<': tag = True
            elif a == '>': tag = False
            elif pend and not tag and a.islower(): a = a.upper(); pend = False
            elif pend and not tag and a.isalnum(): pend = False
            if j >= len(c) or a != c[j]: raise SystemExit('%s: unexplained difference near raw %d: %r vs %r' % (name, i, g[i - 20:i + 30], c[j - 20:j + 30]))
            i += 1; j += 1; continue
        for code in 'KSBPDQR':
            if code == 'K': r, eat = ';', 1
            else: r, eat = REPL[code], EAT[code]
            if code in 'SB' and g[i:i + 2] != '; ': continue
            if c[j:j + len(r)] != r: continue
            for cap in (False, True):
                if cap and code == 'K': continue
                if same(i + eat, j + len(r), cap):
                    codes.append(code.lower() if cap else code); i += eat; j += len(r); pend = cap; break
            else: continue
            break
        else: raise SystemExit('%s: cannot explain semicolon at raw %d: %r vs %r' % (name, i, g[i - 20:i + 30], c[j - 20:j + 30]))
    assert j == len(c), '%s: committed has %d unexplained trailing chars' % (name, len(c) - j)
    return ''.join(codes)


def derive(raw_dir, committed_dir):
    res = {}
    for f in sorted(glob.glob(os.path.join(raw_dir, 'ch*.html'))):
        b = os.path.basename(f); key = b[:-5]
        g = open(f, encoding='utf8', newline='').read(); c = open(os.path.join(committed_dir, b), encoding='utf8', newline='').read()
        res[key] = _derive_one(g, c, b)
        assert apply(g, res[key]) == c, b + ': derived codes do not reproduce the committed page'
    json.dump(res, open(DATA, 'w', encoding='utf8'), indent=0, sort_keys=True)
    print('wrote', DATA, len(res), 'chapters')


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == '--derive': derive(sys.argv[2], sys.argv[3])
    else: print(__doc__)
