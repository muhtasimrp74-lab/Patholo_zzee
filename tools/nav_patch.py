# -*- coding: utf-8 -*-
"""Main panel = Home, Questions, Q&A, MCQs, Menu. Everything else lives on the Menu page.
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
BNAV = ('<nav id="bnav" aria-label="Main">' + _a('', 'home', 'Home') + _a('questions', 'q', 'Questions') + _a('qa', 'qa', 'Q&amp;A')
        + _a('mcqs', 'mcq', 'MCQs') + _a('textbook', 'book', 'Textbook') + _a('menu', 'menu', 'Menu') + '</nav>')
LINKS = ('<div class="links"><a href="#/">Home</a><a href="#/questions">Questions</a><a href="#/qa">Q&amp;A</a>'
         '<a href="#/mcqs">MCQs</a><a href="#/textbook">Textbook</a><a href="#/menu">Menu</a></div>')

CSS = r'''
/* ===== main panel: Home / Questions / Q&A / MCQs / Menu ===== */
@media(max-width:1000px){#bnav{grid-template-columns:repeat(6,1fr)}}
.nav .links a.on{color:var(--navy);border-bottom-color:var(--clay)}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:6px 0 22px}
.mtile{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:56px;padding:12px 16px;border-radius:16px;
 background:var(--panel);border:1px solid var(--line);color:var(--text);font:600 .95rem var(--body);text-decoration:none;cursor:pointer;text-align:left}
.mtile:hover{border-color:var(--clay)}
.mtile .cn{display:inline-flex!important;min-width:24px;height:24px;padding:0 8px;align-items:center;justify-content:center;border-radius:99px;background:var(--soft);color:var(--muted);font:600 .75rem var(--body)}
.mh{margin:22px 4px 8px;font:700 .74rem var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--lbl)}
.mq{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px var(--gx,18px);margin:0 0 14px}
.mq h4{margin:0 0 12px;font:600 1.05rem/1.4 var(--body)}
.mq .mo{display:block;width:100%;text-align:left;margin:0 0 8px;padding:11px 14px;border-radius:12px;border:1px solid var(--line);background:var(--soft);color:var(--text);font:500 .95rem/1.4 var(--body);cursor:pointer}
.mq .mo.ok{border-color:var(--sage,#2e8b57);background:color-mix(in srgb,var(--sage,#2e8b57) 18%,var(--panel))}
.mq .mo.no{border-color:#c0504d;background:color-mix(in srgb,#c0504d 14%,var(--panel))}
.mq .me{margin:10px 0 0;color:var(--muted);font-size:.9rem;line-height:1.5}
.mq .mt{margin:0 0 6px;font:700 .72rem var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--lbl)}
.mscore{margin:0 4px 14px;color:var(--muted);font:600 .9rem var(--body)}
.mempty{padding:34px 20px;border:1px dashed var(--line);border-radius:18px;text-align:center;color:var(--muted)}
.mempty b{display:block;margin-bottom:6px;color:var(--text);font-size:1.05rem}

/* ===== Textbook (Robbins) reader ===== */
.tbl{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin:6px 0 22px}
.tbl a{display:flex;gap:12px;align-items:center;min-height:60px;padding:12px 14px;border-radius:16px;background:var(--panel);border:1px solid var(--line);color:var(--text);text-decoration:none}
.tbl a:hover{border-color:var(--clay)}
.tbl .n{flex:none;min-width:38px;height:30px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border-radius:99px;background:var(--soft);color:var(--lbl);font:700 .78rem var(--body)}
.tbl b{display:block;font:600 .95rem/1.3 var(--body)}.tbl small{color:var(--muted);font:500 .75rem var(--body)}
.tbcont{display:block;margin:0 0 16px;padding:14px 16px;border-radius:16px;background:var(--accbg);color:var(--navy);text-decoration:none;font:600 .95rem var(--body)}
.tbbar{display:flex;justify-content:space-between;gap:10px;margin:0 0 18px;flex-wrap:wrap}
.tbbar a{padding:9px 14px;border-radius:12px;border:1px solid var(--line2);background:var(--panel);color:var(--navy);text-decoration:none;font:600 .85rem var(--body)}
.tbbar a[aria-disabled=true]{opacity:.4;pointer-events:none}
.tbh .no{font:700 .72rem var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--lbl)}
.tbh h2{font:500 clamp(1.6rem,4.5vw,2.3rem)/1.15 var(--disp);margin:6px 0 22px;color:var(--navy)}
.tb{font:400 1.06rem/1.75 Charter,'Iowan Old Style','Palatino Linotype',Georgia,serif;color:var(--text);max-width:46rem}
.tb p{margin:0 0 1.05rem;overflow-wrap:break-word}
.tb b{font-weight:700;color:var(--navy);background:linear-gradient(transparent 58%,color-mix(in srgb,var(--amber,#f2b36b) 45%,transparent) 58%);padding:0 .06em;border-radius:2px}
.tb i{color:var(--muted)}
.tb h2{font:700 1.3rem/1.3 var(--body);margin:2.4rem 0 .8rem;padding-left:.8rem;border-left:4px solid var(--blue);color:var(--navy)}
.tb h3{font:700 1.02rem/1.35 var(--body);margin:1.7rem 0 .5rem;color:var(--lbl)}
.tb ul,.tb ol{margin:0 0 1.1rem;padding-left:1.3rem}.tb ul{list-style:disc}.tb li{margin:0 0 .5rem}
.tb .tbk{display:inline-block;margin:1.6rem 0 .6rem;padding:.25rem .8rem;border-radius:99px;background:var(--btn);color:#fff;font:700 .7rem var(--body);letter-spacing:.16em}
.tb figure{margin:1.5rem 0;padding:.8rem 1rem;background:var(--soft);border:1px solid var(--line);border-radius:12px;font:.85rem/1.55 var(--body);color:var(--muted)}
.tb .tbw{overflow-x:auto;margin:1.5rem 0;border:1px solid var(--line);border-radius:12px;background:var(--panel)}
.tb .tbc{padding:.65rem .9rem;font:700 .86rem/1.4 var(--body);color:var(--lbl);border-bottom:1px solid var(--line)}
.tb table{border-collapse:collapse;width:100%;font:.86rem/1.5 var(--body)}
.tb th,.tb td{padding:.5rem .75rem;text-align:left;vertical-align:top;border-bottom:1px solid var(--line)}.tb th{background:var(--soft);color:var(--navy)}
.tb .tbn{padding:.5rem .9rem;font:.76rem/1.5 var(--body);color:var(--muted)}
.tb .tbpg{float:right;margin:.2rem 0 0 .8rem;font:600 .68rem var(--body);color:var(--muted);opacity:.7}
'''

JS = r'''
/* ---- MCQs + Menu pages ---- */
const MCQS=__MCQS__;
{const M=mkView('mcqs','MCQs','MCQs','Pick the best answer. Tap an option to check it.');
 const esc2=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 if(!MCQS.length){M.innerHTML='<div class="mempty"><b>MCQs are coming soon</b>Questions will appear here once they are added.</div>'}
 else{let done=0,right=0;M.innerHTML='<p class="mscore" id="mscore"></p>'+MCQS.map((q,i)=>`<div class="mq" data-i="${i}">${q.t?`<p class="mt">${esc2(q.t)}</p>`:''}<h4>${i+1}. ${esc2(q.q)}</h4>${q.o.map((o,j)=>`<button type="button" class="mo" data-j="${j}">${'ABCDE'[j]||j+1}. ${esc2(o)}</button>`).join('')}<div class="me" hidden>${q.e?esc2(q.e):''}</div></div>`).join('');
  const sc=()=>{M.querySelector('#mscore').textContent=done?`Score: ${right} / ${done} answered`:`${MCQS.length} questions`};sc();
  M.addEventListener('click',e=>{const b=e.target.closest('.mo');if(!b)return;const c=b.closest('.mq');if(c.dataset.d)return;c.dataset.d=1;const q=MCQS[+c.dataset.i],j=+b.dataset.j;
   c.querySelectorAll('.mo').forEach((x,k)=>{if(k===q.a)x.classList.add('ok')});if(j!==q.a)b.classList.add('no');else right++;done++;if(q.e)c.querySelector('.me').hidden=false;sc()})}}
{const X=mkView('menu','Menu','Menu','Everything else lives here.');
 X.innerHTML=`<p class="mh">Study</p><div class="mgrid"><a class="mtile" href="#/practice">Practice</a><a class="mtile" href="#/howto">How to read</a></div>
<p class="mh">Saved</p><div class="mgrid"><a class="mtile" href="#/bookmarks">Bookmarks<span class="cn" data-c="bm">0</span></a><a class="mtile" href="#/favourites">Favourites<span class="cn" data-c="fav">0</span></a><a class="mtile" href="#/notes">Notes<span class="cn" data-c="notes">0</span></a></div>
<p class="mh">Display</p><div class="mgrid"><button type="button" class="mtile" id="mq-quiz">Quiz mode</button><button type="button" class="mtile" data-tt="theme">Theme</button><button type="button" class="mtile" data-tt="fm">Smaller text</button><button type="button" class="mtile" data-tt="fp">Larger text</button><button type="button" class="mtile" data-tt="focus">Focus</button><button type="button" class="mtile" data-tt="print">Print</button></div>
<p class="mh">Your data</p><div class="mgrid"><button type="button" class="mtile" onclick="exp()">Export backup</button><label class="mtile">Import backup<input type="file" accept=".json" hidden onchange="imp(this.files[0])"></label></div>`;
 X.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{const t=document.querySelector('#tools [data-t="'+b.dataset.tt+'"]');if(t)t.click()});
 const qb=X.querySelector('#mq-quiz'),qs=()=>{qb.textContent=document.body.classList.contains('quiz')?'Quiz mode: on':'Quiz mode: off'};qs();
 qb.onclick=()=>{setQuiz(!document.body.classList.contains('quiz'),true);qs()}}
/* ---- Textbook (Robbins) ---- */
{const T=mkView('textbook','Textbook','Textbook','Robbins Pathologic Basis of Disease, chapter by chapter. Opens fast and works offline once read.');
 const E=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 let IDX=null,tok=0;const lk=()=>{try{return localStorage.getItem('tbLast')}catch(e){return null}};
 async function tb(){const p=location.hash.replace(/^#\/?/,'').split('/');if(p[0]!=='textbook')return;const my=++tok;
  try{if(!IDX){const r=await fetch('textbook/index.json');if(!r.ok)throw 0;IDX=await r.json()}}
  catch(e){if(my===tok)T.innerHTML='<div class="mempty"><b>Textbook unavailable</b>Open it once while online; chapters you read are then saved for offline use.</div>';return}
  if(my!==tok)return;const C=IDX.chapters,i=C.findIndex(x=>x.id===p[1]);
  if(i<0){const l=C.find(x=>x.id===lk());
   T.innerHTML=(l?`<a class="tbcont" href="#/textbook/${l.id}">Continue: Ch ${l.n} · ${E(l.title)}</a>`:'')+`<div class="tbl">${C.map(c=>`<a href="#/textbook/${c.id}"><span class="n">${c.n}</span><span><b>${E(c.title)}</b><small>${c.pages?'pp. '+c.pages[0]+'–'+c.pages[1]:''}</small></span></a>`).join('')}</div>`;document.title='Textbook | Patholo_zzee';return}
  const c=C[i],pv=C[i-1],nx=C[i+1];try{localStorage.setItem('tbLast',c.id)}catch(e){}
  const bar=`<div class="tbbar"><a href="${pv?'#/textbook/'+pv.id:'#/textbook'}" ${pv?'':'aria-disabled="true"'}>‹ ${pv?'Ch '+pv.n:'Previous'}</a><a href="#/textbook">All chapters</a><a href="${nx?'#/textbook/'+nx.id:'#/textbook'}" ${nx?'':'aria-disabled="true"'}>${nx?'Ch '+nx.n:'Next'} ›</a></div>`;
  T.innerHTML=bar+`<header class="tbh"><div class="no">Chapter ${c.n}</div><h2>${E(c.title)}</h2></header><div class="tb"><p>Loading…</p></div>`+bar;document.title='Ch '+c.n+' | Textbook | Patholo_zzee';window.scrollTo(0,0);
  try{const r=await fetch('textbook/'+c.id+'.html');if(!r.ok)throw 0;const h=await r.text();if(my===tok)T.querySelector('.tb').innerHTML=h}
  catch(e){if(my===tok)T.querySelector('.tb').innerHTML='<div class="mempty"><b>Chapter not available offline yet</b>Connect once to download it.</div>'}}
 addEventListener('hashchange',tb);setTimeout(tb,0)}
'''

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
    A = "const views=[...document.querySelectorAll('.view')]"
    _need(s, A); s = s.replace(A, JS.replace('__MCQS__', json.dumps(data, ensure_ascii=False)) + A, 1)
    s = s.replace('</style>', CSS + '</style>', 1)
    return s
