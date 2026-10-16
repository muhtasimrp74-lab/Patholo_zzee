#!/usr/bin/env python3
"""Put semicolon-separated items on their own lines (<br>) in tables and prose.
Idempotent: once a semicolon is gone, re-running changes nothing.

Rules
- Only visible text is touched. Tags, attributes, <script>, <style>, <svg>, <pre>, <code>, <textarea>, <title> are skipped.
- HTML entities such as &amp; or &#8209; are never split.
- A semicolon inside parentheses or brackets is kept, e.g. t(12;21).
- A semicolon at the very end of a block is simply dropped.
- The first letter of the new line is capitalised when the word is plain lowercase (so pH, mRNA, e.g. stay as they are).

Usage: python3 tools/split_semicolons.py   (rewrites index.html, textbook/*.html, tools/answers_by_id.json)
"""
import re, os, json, glob

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SKIP = {'script', 'style', 'svg', 'pre', 'code', 'textarea', 'title', 'head'}
BLOCK = {'p', 'li', 'td', 'th', 'tr', 'ul', 'ol', 'table', 'thead', 'tbody', 'div', 'article', 'section', 'header',
         'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'br', 'figure', 'figcaption', 'main', 'aside', 'details', 'summary'}
TOKEN = re.compile(r'(<!--.*?-->|<[^>]+>)', re.S)
ENT = re.compile(r'&#?\w+;')
WORD = re.compile(r'^(?!(?:and|or|but|with|while|whereas|then)\b)([a-z]{3,})(?![\w.(\-/’\'])')


def _cap(seg):
    m = WORD.match(seg)
    return seg[0].upper() + seg[1:] if m else seg


def _split_text(txt, st):
    """Split one text node. st = {'depth': int, 'pending': bool} carried across the block."""
    out, i, n = [], 0, len(txt)
    while i < n:
        m = ENT.match(txt, i)
        if m:
            out.append(m.group()); i = m.end(); st['pending'] = False; continue
        c = txt[i]
        st['seglen'] += 1
        if c in '([': st['depth'] += 1
        elif c in ')]': st['depth'] = max(0, st['depth'] - 1)
        if c == ';' and st['depth'] == 0:
            while out and out[-1] == ' ': out.pop()
            i += 1
            while i < n and txt[i] == ' ': i += 1
            st['pending'] = True          # decide the break once we know something follows in this block
            # table cells: always a new line. Prose: a long clause becomes a new sentence, a short item a new line.
            out.append('\x01' if st['cell'] or st['seglen'] < 50 else '\x03')
            st['seglen'] = 0
            continue
        if st['pending'] and not c.isspace():
            st['pending'] = False
            # capitalise first letter of the new line
            j = i
            seg = txt[j:]
            cap = _cap(seg)
            out.append(cap[0]); i += 1; continue
        out.append(c); i += 1
    return ''.join(out)


def fix(h):
    prev = None
    while prev != h:          # repeat until stable so one run always reaches the fixed point
        prev, h = h, _fix_once(h)
    return h


def _fix_once(h):
    parts = TOKEN.split(h)
    st = {'depth': 0, 'pending': False, 'seglen': 0, 'cell': False}
    skip = 0
    res = []
    for k, p in enumerate(parts):
        if k % 2 == 1:                                   # a tag or comment
            if p.startswith('<!--'):
                res.append(p); continue
            m = re.match(r'<(/?)([a-zA-Z][\w-]*)', p)
            name = m.group(2).lower() if m else ''
            closing = bool(m and m.group(1))
            if name in SKIP:
                skip = max(0, skip + (-1 if closing else (0 if p.endswith('/>') else 1)))
            if name in BLOCK and not skip:
                # end of a block: a pending semicolon at the end is dropped; depth resets
                res.append(('\x02' if st['pending'] else '') + p)
                st['depth'] = 0; st['pending'] = False; st['seglen'] = 0
                if name in ('td', 'th'): st['cell'] = not closing
                elif name in ('tr', 'table', 'thead', 'tbody'): st['cell'] = False
            else:
                res.append(p)
            continue
        if skip or ';' not in p and not st['pending']:
            res.append(p); continue
        res.append(_split_text(p, st))
    out = ''.join(res)
    # \x02 marks "semicolon placeholder directly before a block end": drop that placeholder
    out = re.sub(r'[\x01\x03]((?:\s|</?(?:b|i|em|strong|span|small|a)\b[^>]*>)*)\x02', r'\1', out)
    out = out.replace('\x02', '')
    out = re.sub(r'[\x01\x03](?=\s*<br>)', '', out)   # an existing <br> follows: no second break
    out = re.sub(r'([.!?:])\x03', r'\1 ', out)          # clause already ends with punctuation
    out = out.replace('\x03', '. ').replace('\x01', '<br>')
    return out


def _write(path, new, old):
    if new != old:
        with open(path, 'w', encoding='utf8') as f: f.write(new)
    return new != old


if __name__ == '__main__':
    changed = 0
    for p in [os.path.join(R, 'index.html')] + sorted(glob.glob(os.path.join(R, 'textbook', '*.html'))):
        s = open(p, encoding='utf8').read()
        changed += _write(p, fix(s), s)
    p = os.path.join(R, 'tools/answers_by_id.json')
    d = json.load(open(p, encoding='utf8')); c = 0
    for k, v in d.items():
        if isinstance(v, str) and '<' in v:
            nv = fix(v)
            if nv != v: d[k] = nv; c += 1
    if c:
        open(p, 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False))
    print('files changed', changed, '| answers_by_id entries changed', c)
