# -*- coding: utf-8 -*-
"""Page changes made after the original build: separate Questions / Q&A pages, no Topics button,
linear blue progress bars. build.py calls patch(s) on the generated page, so rebuilding keeps them."""
import re, os

def _rep(s, old, new, count=1):
    assert old in s, 'ui_patch anchor missing: ' + old[:70]
    return s.replace(old, new) if count == 0 else s.replace(old, new, count)

QCSS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_qmode.css'), encoding='utf8', newline='').read()
XM = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_xm.css'), encoding='utf8', newline='').read()
RINGS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_rings.css'), encoding='utf8', newline='').read()
UPD = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_upd.js'), encoding='utf8', newline='').read()

QAJS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui_qa.js'), encoding='utf8', newline='').read()
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
    # navigation: no Topics button; separate Questions and Q&A buttons
    s = _rep(s, """l.querySelector('a[href="#/topics"]').insertAdjacentHTML('afterend'""", """l.querySelector('a[href="#/qa"]').insertAdjacentHTML('afterend'""")
    t = '<a href="#/topics"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16"/></svg>Topics</a>'
    s = _rep(s, t, '')
    q = '<a href="#/questions"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01"/></svg>Questions</a>'
    s = _rep(s, q, q + '<a href="#/qa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v12H9l-4 4zM9 8h6M9 12h4"/></svg>Chapters</a>')
    s = _rep(s, 'grid-template-columns:repeat(5,1fr)', 'grid-template-columns:repeat(6,1fr)', 0)
    # Questions page modes
    s = _rep(s, "const QV=mkView('questions','Questions','Questions','Tap a question to read its answer right here, or tap Answer to open it on its own page.');" if "Tap a question to read its answer right here" in s else "const QV=mkView('questions','Questions','Questions','Only the questions. Tap one to reveal its answer, tap again to hide it.');",
             "const QV=mkView('questions','Questions','Questions','Tap a question to read its answer right here, or tap Answer to open it on its own page.');")
    qv = "const QV=mkView('questions','Questions','Questions','Tap a question to read its answer right here, or tap Answer to open it on its own page.');"
    s = _rep(s, qv, qv + QAJS)
    s = _rep(s, "const h=e.target.closest('.qi-h');if(h){const i=h.parentNode;", "const g=e.target.closest('.qgo');if(g){e.preventDefault();location.hash=g.dataset.go;return}const h=e.target.closest('.qi-h');if(h){const i=h.parentNode;")
    a = "$q('qcol').onclick=()=>QV.querySelectorAll('.qi').forEach(i=>open1(i,false));"
    s = _rep(s, a, a + """
let QM='q';
function setMode(m){if(m===QM&&m==='q'&&setMode._d&&!QV.querySelector('.qi.o'))return;setMode._d=1;QM=m;S.pref=S.pref||{};const w=QV.querySelector('.qmain');w.classList.toggle('qm-q',m==='q');
QV.querySelectorAll('.qs').forEach(x=>{x.querySelector('.qs-h').setAttribute('aria-expanded',true);x.querySelector('.qs-b').hidden=false});
QV.querySelectorAll('.qi').forEach(i=>open1(i,m==='qa'))}
window.setQMode=setMode;setMode(QM);
const colAll=()=>QV.querySelectorAll('.qs-h[aria-expanded="true"]').forEach(h=>{h.setAttribute('aria-expanded',false);h.nextElementSibling.hidden=true});addEventListener('beforeprint',()=>QV.querySelectorAll('.qi').forEach(fill));window.qColAll=colAll;colAll();""")
    s = _rep(s, "if(/^#\\/questions/.test(location.hash))sync()", "if(/^#\\/(questions|qa)/.test(location.hash))sync()")
    a = "function route(){const p=location.hash.replace(/^#\\/?/,'').split('/');const v=document.getElementById('v-'+p[0])||document.getElementById('v-home');"
    s = _rep(s, a, """function route(){const p=location.hash.replace(/^#\\/?/,'').split('/');if(p[0]==='topics')p[0]='qa';const v=document.getElementById('v-'+p[0])||document.getElementById('v-home');
if(v.id==='v-questions'&&window.setQMode){setQMode('q');if(!window.__qa&&window.qColAll)qColAll()}""")
    s = _rep(s, "\nroute();\n", "\nroute();\n" + UPD + HOMEJS + PBJS + SFJS + "\n(function(){const d0=dash;dash=function(){d0();if(window.nhRender)nhRender()};const p0=prog;prog=function(){p0();if(window.nhRender)nhRender()};nhRender()})();\n")
    s = s.replace('<small>${esc(d[4])} · ${d[0]}</small>', '<small>${esc(d[4])}${d[0]?\' · \'+d[0]:\'\'}</small>')
    s = s.replace('${qd[0]} · ${esc(qd[4])}', '${qd[0]?qd[0]+\' · \':\'\'}${esc(qd[4])}')
    # CSS
    k = s.index('.qtools{display:flex;')
    s = s[:k] + QCSS + s[k:]
    k = s.rindex('</style>')
    s = s[:k] + XM + RINGS + HOMECSS + PBCSS + SFCSS + CARDCSS + POLISHCSS + s[k:]
    return s
