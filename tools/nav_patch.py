# -*- coding: utf-8 -*-
"""Assembly of the MCQs page (questions come from tools/mcqs.json), the Menu page, textbook reader and their styles.
The main navigation (links bars, bottom nav, active-tab highlight) now lives in src/index.base.html. build.py calls patch(s) last."""
import re, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
CSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nav_patch.css'), encoding='utf8', newline='').read()

JS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nav_patch.js'), encoding='utf8', newline='').read()

def _need(s, old):
    assert old in s, 'nav_patch anchor missing: ' + old[:70]

def patch(s):
    data = json.load(open(os.path.join(HERE, 'mcqs.json'), encoding='utf8'))
    mcq_js = 'const MCQDATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n' + open(os.path.join(HERE, 'mcq.js'), encoding='utf8').read() + '\n'
    A = "const views=[...document.querySelectorAll('.view')]"
    _need(s, A); s = s.replace(A, JS + mcq_js + open(os.path.join(HERE, 'textbook.js'), encoding='utf8').read() + A, 1)
    s = s.replace('</style>', CSS + open(os.path.join(HERE, 'textbook.css'), encoding='utf8').read() + open(os.path.join(HERE, 'mcq.css'), encoding='utf8').read() + open(os.path.join(HERE, 'perf.css'), encoding='utf8').read() + '</style>', 1)
    return s
