# -*- coding: utf-8 -*-
"""Strip CSS and JS comments from the GENERATED pages (index.html, index.full.html). Run by tools/build.py after gate.py and
before the CSP hashes and the service-worker stamp. The source files under tools/ and src/ keep their comments.

CSS (<style> blocks): every /* ... */ outside a string is removed.
JS (inline <script> blocks): no JS parser is available here, so only comments that cannot be mistaken for code are removed:
  - a /* ... */ block or a // line that starts its own line,
  - a /* ... */ block or a // remark that ends a line and is separated from the code before it by white space.
A comment in the middle of a line of code is left alone. Text inside the page body (answers, textbook) is never touched.
Idempotent and deterministic."""
import os, re

_CSS = re.compile(r'''("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|/\*.*?\*/''', re.S)
_JS_OWN_BLOCK = re.compile(r'^[ \t]*/\*(?:[^*]|\*(?!/))*\*/[ \t]*\n', re.M)                 # a block comment on its own line(s)
_JS_OWN_LINE = re.compile(r'^[ \t]*//[^\n]*\n', re.M)                                       # a // line
_JS_TAIL_BLOCK = re.compile(r'[ \t]+/\*(?:[^*]|\*(?!/))*\*/[ \t]*$', re.M)                  # code;   /* remark */
_JS_TAIL_LINE = re.compile(r'''(?<=[;{},)])[ \t]+//(?![^\n]*['"`])[^\n]*$''', re.M)         # code;   // remark (no quotes after it)
_BLOCK = re.compile(r'(<style\b[^>]*>)(.*?)(</style>)|(<script\b(?![^>]*\bsrc=)(?![^>]*type="application/(?:ld\+)?json")[^>]*>)(.*?)(</script>)', re.S)

def css(t):
    t = _CSS.sub(lambda m: m.group(1) or '', t)
    return re.sub(r'\n[ \t]*(?=\n)', '', t)

def js(t):
    for _ in range(3):   # a tail comment can uncover an own-line one
        n = _JS_TAIL_LINE.sub('', _JS_TAIL_BLOCK.sub('', _JS_OWN_LINE.sub('', _JS_OWN_BLOCK.sub('', t))))
        if n == t: break
        t = n
    return t

def strip(page):
    return _BLOCK.sub(lambda m: m.group(1) + css(m.group(2)) + m.group(3) if m.group(1) is not None else m.group(4) + js(m.group(5)) + m.group(6), page)

def apply(root):
    out = {}
    for name in ('index.full.html', 'index.html'):
        p = os.path.join(root, name)
        if not os.path.exists(p): continue
        s = open(p, encoding='utf8').read(); t = strip(s)
        assert strip(t) == t, 'comment stripping is not idempotent'
        if t != s: open(p, 'w', encoding='utf8').write(t)
        out[name] = len(s) - len(t)
    return out

if __name__ == '__main__':
    print(apply(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
