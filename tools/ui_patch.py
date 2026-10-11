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
.qgo{flex:none;align-self:center;margin-left:auto;padding:7px 13px;border-radius:99px;border:1px solid var(--line2);background:var(--panel);color:var(--lbl);font:600 .78rem var(--body);white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent}
.qgo:hover{background:var(--accbg);border-color:var(--lbl)}
#qexp,#qcol{}
'''
XM = r'''.qsub{margin:14px 4px 6px;font:700 .74rem var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--lbl)}
.qsub[hidden]{display:none}
.code:empty{display:none}
.empty[hidden]{display:none!important}
.xm{display:block;margin-top:3px;font:600 .74rem/1.3 var(--body);color:var(--muted);letter-spacing:.01em}
.card header{flex-wrap:wrap}.card header .xm{flex-basis:100%;margin:2px 0 0}
'''
RINGS = r'''/* ---- linear progress bars (replace rings) ---- */
.ring,.topic .ring,.ring.big,.ring.pp{position:relative;display:block;width:100%;height:22px;margin:12px 0 0;border-radius:99px;background:color-mix(in srgb,var(--line) 85%,var(--blue) 15%);overflow:hidden;font:700 11px/22px var(--body);text-align:right;padding:0 10px;color:var(--text);box-sizing:border-box;top:auto;right:auto;place-items:initial;isolation:isolate}
.ring::before{content:"";position:absolute;z-index:-1;left:0;top:0;bottom:0;width:calc(var(--p,0)*1%);border-radius:99px;background:radial-gradient(circle at calc(100% - 9px) 50%,#fff 0 3px,rgba(255,255,255,.4) 3.5px 6px,transparent 6.5px),linear-gradient(90deg,var(--blue),var(--cobalt))}
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

QAJS = r"""
const QAV=mkView('qa','Chapters','Chapters','Pick a chapter to study viva and written questions together, with full answers. For one flat list to drill, use Questions.');
(function(){const H=document.getElementById('v-home'),ch=document.getElementById('pchips');QAV.append(ch);H.querySelectorAll('section.part').forEach(x=>QAV.append(x))})();

(function(){
const TYW=QMETA.type||{},esc3=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const by={};DATA.forEach(d=>(by[d[2]]=by[d[2]]||[]).push(d));
const kind=d=>TYW[d[3]]==='B'?'b':TYW[d[3]]==='W'?'w':'v';
const hero=document.createElement('section');hero.className='qa-hero';
hero.innerHTML='<div class="qa-top"><div><p class="qa-k">Chapters</p><h2>Every chapter, every question</h2><p class="qa-s">Viva and written questions sit together on each chapter page, in Robbins order, with full answers.</p></div><a class="qa-go" id="qa-next" href="#/">Continue</a></div><div class="qa-stats" id="qa-stats"></div><label class="qa-sr"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" id="qa-q" placeholder="Search chapters or questions" aria-label="Search chapters or questions" autocomplete="off"></label><div class="qa-res" id="qa-res" hidden></div>';
QAV.insertBefore(hero,QAV.querySelector('#pchips')||QAV.firstChild);
const cards=[...QAV.querySelectorAll('a.topic')];
function upd(){
 const L=new Set(S.learned||[]);let n=0,l=0,v=0,w=0,b=0;
 DATA.forEach(d=>{n++;if(L.has(d[3]))l++;const k=kind(d);k==='b'?b++:k==='w'?w++:v++});
 hero.querySelector('#qa-stats').innerHTML=[[n,'questions'],[cards.length,'chapters'],[Math.round(100*l/Math.max(n,1))+'%','learned'],[v+b,'viva'],[w+b,'written']].map(x=>'<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
 const nx=DATA.find(d=>!L.has(d[3])),go=hero.querySelector('#qa-next');
 if(nx){go.href='#/'+nx[2]+'/'+nx[3];go.textContent=l?'Continue · '+esc3(nx[4]):'Start · '+esc3(nx[4])}else{go.href='#/';go.textContent='All learned'}
 cards.forEach(c=>{const t=c.getAttribute('href').slice(2),a=by[t]||[],r=a.filter(d=>L.has(d[3])).length;let m=c.querySelector('.qa-mini');
  if(!m){m=document.createElement('span');m.className='qa-mini';c.append(m);
   const x={v:0,w:0,b:0};a.forEach(d=>x[kind(d)]++);m.dataset.t=[x.v+x.b?(x.v+x.b)+' viva':'',x.w+x.b?(x.w+x.b)+' written':''].filter(Boolean).join(' · ')}
  m.innerHTML='<i><u style="width:'+Math.round(100*r/Math.max(a.length,1))+'%"></u></i><small>'+m.dataset.t+(m.dataset.t?' · ':'')+r+'/'+a.length+' learned</small>'})}
const inp=hero.querySelector('#qa-q'),res=hero.querySelector('#qa-res');
inp.oninput=()=>{const q=inp.value.trim().toLowerCase();cards.forEach(c=>c.hidden=!!q&&!c.textContent.toLowerCase().includes(q));
 QAV.querySelectorAll('section.part').forEach(s=>s.hidden=!!q&&![...s.querySelectorAll('a.topic')].some(c=>!c.hidden));
 if(q.length<3){res.hidden=true;return}
 const m=DATA.filter(d=>d[1].toLowerCase().includes(q));
 res.hidden=false;res.innerHTML=m.length?'<p>'+m.length+' matching question'+(m.length>1?'s':'')+'</p><ul>'+m.slice(0,8).map(d=>'<li><a href="#/'+d[2]+'/'+d[3]+'"><span>'+esc3(d[1])+'</span><em>'+esc3(d[4])+'</em></a></li>').join('')+'</ul>':'<p>No question matches.</p>'};
upd();addEventListener('hashchange',()=>{if(/^#\/qa/.test(location.hash))upd()});
})();
"""
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
    s = _rep(s, '<a href="#/topics">Topics</a><a href="#/questions">Questions</a>', '<a href="#/questions">Questions</a><a href="#/qa">Chapters</a>', 0)
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
function setMode(m){QM=m;S.pref=S.pref||{};const w=QV.querySelector('.qmain');w.classList.toggle('qm-q',m==='q');
QV.querySelectorAll('.qs').forEach(x=>{x.querySelector('.qs-h').setAttribute('aria-expanded',true);x.querySelector('.qs-b').hidden=false});
QV.querySelectorAll('.qi').forEach(i=>open1(i,m==='qa'))}
window.setQMode=setMode;setMode(QM);
const colAll=()=>QV.querySelectorAll('.qs').forEach(x=>{x.querySelector('.qs-h').setAttribute('aria-expanded',false);x.querySelector('.qs-b').hidden=true});window.qColAll=colAll;colAll();""")
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
