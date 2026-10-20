# -*- coding: utf-8 -*-
"""Assembly of the page scripts and styles that sit on top of the base page (home, banner, footer, Q&A rings, polish).
The edits to existing application text (Questions page modes, route(), nav columns) live in src/index.base.html and questions.js."""
import re, os

def _rep(s, old, new, count=1):
    assert old in s, 'ui_patch anchor missing: ' + old[:70]
    return s.replace(old, new) if count == 0 else s.replace(old, new, count)

QCSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_qmode.css'), encoding='utf8', newline='').read()
XM = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_xm.css'), encoding='utf8', newline='').read()
RINGS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_rings.css'), encoding='utf8', newline='').read()
UPD = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_upd.js'), encoding='utf8', newline='').read()

HOMEJS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'home.js'),encoding='utf8').read()
TFJS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'topicfilter.js'),encoding='utf8').read()
PBJS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'pagebanner.js'),encoding='utf8').read()
PBCSS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'pagebanner.css'),encoding='utf8').read()
SFJS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'sitefooter.js'),encoding='utf8').read()
SFCSS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'sitefooter.css'),encoding='utf8').read()
HOMECSS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'home.css'),encoding='utf8').read()
CARDCSS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'cardpolish.css'),encoding='utf8').read()
POLISHCSS = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'polish.css'),encoding='utf8').read()

def patch(s):
    # assembly only: the application text edits now live in src/index.base.html and questions.js
    s = _rep(s, "\nroute();\n", "\nroute();\n" + UPD + HOMEJS + PBJS + SFJS + "\n(function(){const d0=dash;dash=function(){d0();if(window.nhRender)nhRender()};const p0=prog;prog=function(){p0();if(window.nhRender)nhRender()};nhRender()})();\n")
    # CSS
    k = s.index('.qtools{display:flex;')
    s = s[:k] + QCSS + s[k:]
    k = s.rindex('</style>')
    s = s[:k] + XM + RINGS + HOMECSS + PBCSS + SFCSS + CARDCSS + POLISHCSS + s[k:]
    return s
