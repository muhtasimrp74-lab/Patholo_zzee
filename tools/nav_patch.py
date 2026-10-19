# -*- coding: utf-8 -*-
"""Main panel = Home, Questions, Chapters, MCQs, Menu. Everything else lives on the Menu page.
Adds the MCQs page (questions come from tools/mcqs.json) and the Menu page. build.py calls patch(s) last."""
import re, os, json

HERE = os.path.dirname(os.path.abspath(__file__))
ICON = {
 'home': '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
 'q':    '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01"/>',
 'qa':   '<path d="M5 4h14v12H9l-4 4zM9 8h6M9 12h4"/>',
 'mcq':  '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>',
 'book': '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
 'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
}
def _a(href, ic, label):
    return '<a href="#/%s"><svg viewBox="0 0 24 24" aria-hidden="true">%s</svg>%s</a>' % (href, ICON[ic], label)
BNAV = ('<nav id="bnav" aria-label="Main">' + _a('', 'home', 'Home') + _a('questions', 'q', 'Questions') + _a('qa', 'qa', 'Chapters')
        + _a('mcqs', 'mcq', 'MCQs') + _a('textbook', 'book', 'Textbook') + _a('menu', 'menu', 'Menu') + '</nav>')
LINKS = ('<div class="links"><a href="#/">Home</a><a href="#/questions">Questions</a><a href="#/qa">Chapters</a>'
         '<a href="#/mcqs">MCQs</a><a href="#/textbook">Textbook</a><a href="#/menu">Menu</a></div>')

CSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nav_patch.css'), encoding='utf8', newline='').read()

JS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nav_patch.js'), encoding='utf8', newline='').read()

HL_OLD = "document.querySelectorAll('#bnav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(p[0]||'')));"
HL_NEW = ("{const k=p[0]||'',key=['practice','bookmarks','favourites','notes','howto','search','menu'].includes(k)?'menu':k==='topics'?'qa':['','questions','qa','mcqs','textbook'].includes(k)?k:'qa';"
          "document.querySelectorAll('#bnav a,.nav .links a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+key))}")

def _need(s, old):
    assert old in s, 'nav_patch anchor missing: ' + old[:70]

def patch(s):
    s, n = re.subn(r'<div class="links">.*?</div>', lambda m: LINKS, s, flags=re.S)
    assert n >= 1
    s, n = re.subn(r'<nav id="bnav" aria-label="Main">.*?</nav>', lambda m: BNAV, s, count=1, flags=re.S)
    assert n == 1
    _need(s, HL_OLD); s = s.replace(HL_OLD, HL_NEW, 1)
    s = re.sub(r'<div class="dact">.*?</div>\n', '', s, count=1, flags=re.S)   # Practice / backup buttons moved to Menu
    data = json.load(open(os.path.join(HERE, 'mcqs.json'), encoding='utf8'))
    mcq_js = 'const MCQDATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n' + open(os.path.join(HERE, 'mcq.js'), encoding='utf8').read() + '\n'
    A = "const views=[...document.querySelectorAll('.view')]"
    _need(s, A); s = s.replace(A, JS + mcq_js + open(os.path.join(HERE, 'textbook.js'), encoding='utf8').read() + A, 1)
    s = s.replace('</style>', CSS + open(os.path.join(HERE, 'textbook.css'), encoding='utf8').read() + open(os.path.join(HERE, 'mcq.css'), encoding='utf8').read() + open(os.path.join(HERE, 'perf.css'), encoding='utf8').read() + '</style>', 1)
    return s
