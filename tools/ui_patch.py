# -*- coding: utf-8 -*-
"""Page changes made after the original build: separate Questions / Q&A pages, no Topics button,
linear blue progress bars. build.py calls patch(s) on the generated page, so rebuilding keeps them."""
import re

def _rep(s, old, new, count=1):
    assert old in s, 'ui_patch anchor missing: ' + old[:70]
    return s.replace(old, new) if count == 0 else s.replace(old, new, count)

QCSS = r'''.qmode{display:inline-flex;gap:4px;padding:4px;margin:4px 0 12px;border-radius:12px;background:var(--soft);border:1px solid var(--line2)}
.qmode button{height:38px;padding:0 20px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:600 .9rem var(--body);cursor:pointer}
.qmode button[aria-selected=true]{background:var(--panel);color:var(--navy);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.qm-q .qi-a,.qm-q .chv,.qm-q #qexp,.qm-q #qcol{display:none!important}.qm-q .qi-h{cursor:default}
#qexp,#qcol{}
'''
XM = r'''.code:empty{display:none}
.empty[hidden]{display:none!important}
.xm{display:block;margin-top:3px;font:600 .74rem/1.3 var(--body);color:var(--muted);letter-spacing:.01em}
.card header{flex-wrap:wrap}.card header .xm{flex-basis:100%;margin:2px 0 0}
'''
RINGS = r'''/* ---- linear progress bars (replace rings) ---- */
.ring,.topic .ring,.ring.big,.ring.pp{position:relative;display:block;width:100%;height:22px;margin:12px 0 0;border-radius:99px;background:color-mix(in srgb,var(--line) 85%,#2563eb 15%);overflow:hidden;font:700 11px/22px var(--body);text-align:right;padding:0 10px;color:var(--text);box-sizing:border-box;top:auto;right:auto;place-items:initial;isolation:isolate}
.ring::before{content:"";position:absolute;z-index:-1;left:0;top:0;bottom:0;width:calc(var(--p,0)*1%);border-radius:99px;background:radial-gradient(circle at calc(100% - 9px) 50%,#fff 0 3px,rgba(255,255,255,.4) 3.5px 6px,transparent 6.5px),linear-gradient(90deg,#7db4fb,#2f7bf0 55%,#1747b8)}
.ring.z::before{display:none}
.ring.hi{text-align:left;color:#fff}
.ring.big{height:28px;font-size:13px;line-height:28px;margin:0;min-width:160px}
.topic h3{padding-right:0}
.topic{align-content:space-between!important}
.topic .ring{grid-column:1/-1;justify-self:stretch;align-self:end}
#dash .dc>div[style*=flex]{flex-direction:column!important;align-items:stretch!important;gap:8px!important}
'''
UPD = r'''
function updRings(){document.querySelectorAll('.ring').forEach(r=>{const v=parseFloat(r.style.getPropertyValue('--p'))||0;r.classList.toggle('hi',v>=82);r.classList.toggle('z',v<=0)})}
(function(){const p0=prog;prog=function(){p0();updRings()}})();updRings();
'''

def patch(s):
    # navigation: no Topics button; separate Questions and Q&A buttons
    s = _rep(s, '<a href="#/topics">Topics</a><a href="#/questions">Questions</a>', '<a href="#/questions">Questions</a><a href="#/qa">Q&amp;A</a>', 0)
    s = _rep(s, """l.querySelector('a[href="#/topics"]').insertAdjacentHTML('afterend'""", """l.querySelector('a[href="#/qa"]').insertAdjacentHTML('afterend'""")
    t = '<a href="#/topics"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16"/></svg>Topics</a>'
    s = _rep(s, t, '')
    q = '<a href="#/questions"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01"/></svg>Questions</a>'
    s = _rep(s, q, q + '<a href="#/qa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v12H9l-4 4zM9 8h6M9 12h4"/></svg>Q&amp;A</a>')
    s = _rep(s, 'grid-template-columns:repeat(5,1fr)', 'grid-template-columns:repeat(6,1fr)', 0)
    # Questions page modes
    s = _rep(s, "const QV=mkView('questions','Questions','Questions','Switch between a clean list of questions and the full questions with answers.');" if "Switch between" in s else "const QV=mkView('questions','Questions','Questions','Only the questions. Tap one to reveal its answer, tap again to hide it.');",
             "const QV=mkView('questions','Questions','Questions','Switch between a clean list of questions and the full questions with answers.');")
    s = _rep(s, "const h=e.target.closest('.qi-h');if(h){const i=h.parentNode;", "const h=e.target.closest('.qi-h');if(h){if(QM==='q')return;const i=h.parentNode;")
    a = "$q('qcol').onclick=()=>QV.querySelectorAll('.qi').forEach(i=>open1(i,false));"
    s = _rep(s, a, a + """
let QM='q';
function setMode(m){QM=m;S.pref=S.pref||{};const w=QV.querySelector('.qmain');w.classList.toggle('qm-q',m==='q');
QV.querySelectorAll('.qs').forEach(x=>{x.querySelector('.qs-h').setAttribute('aria-expanded',true);x.querySelector('.qs-b').hidden=false});
QV.querySelectorAll('.qi').forEach(i=>open1(i,m==='qa'))}
window.setQMode=setMode;setMode(QM);""")
    s = _rep(s, "if(/^#\\/questions/.test(location.hash))sync()", "if(/^#\\/(questions|qa)/.test(location.hash))sync()")
    a = "function route(){const p=location.hash.replace(/^#\\/?/,'').split('/');const v=document.getElementById('v-'+p[0])||document.getElementById('v-home');"
    s = _rep(s, a, """function route(){const p=location.hash.replace(/^#\\/?/,'').split('/');const v=document.getElementById('v-'+(p[0]==='qa'?'questions':p[0]))||document.getElementById('v-home');
if(v.id==='v-questions'&&window.setQMode){const qa=p[0]==='qa';setQMode(qa?'qa':'q');const h=v.querySelector('h1'),l=v.querySelector('.lede'),c=v.querySelector('.crumb');if(h)h.textContent=qa?'Q&A':'Questions';if(l)l.textContent=qa?'Every question with its full answer.':'Just the questions. Test yourself, then check the answers in Q&A.';v.dataset.title=(qa?'Q&A':'Questions')+' | Patholo_zzee'}""")
    s = _rep(s, "\nroute();\n", "\nroute();\n" + UPD)
    s = s.replace('<small>${esc(d[4])} · ${d[0]}</small>', '<small>${esc(d[4])}${d[0]?\' · \'+d[0]:\'\'}</small>')
    s = s.replace('${qd[0]} · ${esc(qd[4])}', '${qd[0]?qd[0]+\' · \':\'\'}${esc(qd[4])}')
    # CSS
    k = s.index('.qtools{display:flex;')
    s = s[:k] + QCSS + s[k:]
    k = s.rindex('</style>')
    s = s[:k] + XM + RINGS + s[k:]
    return s
