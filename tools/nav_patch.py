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

'''

JS = r'''
/* ---- Menu page ---- */
{const X=mkView('menu','Menu','Menu','Everything else lives here.');
 X.innerHTML=`<p class="mh">Study</p><div class="mgrid"><a class="mtile" href="#/practice">Practice</a><a class="mtile" href="#/howto">How to read</a></div>
<p class="mh">Saved</p><div class="mgrid"><a class="mtile" href="#/bookmarks">Bookmarks<span class="cn" data-c="bm">0</span></a><a class="mtile" href="#/favourites">Favourites<span class="cn" data-c="fav">0</span></a><a class="mtile" href="#/notes">Notes<span class="cn" data-c="notes">0</span></a></div>
<p class="mh">Display</p><div class="mgrid"><button type="button" class="mtile" id="mq-quiz">Quiz mode</button><button type="button" class="mtile" data-tt="ink">Ink (handwriting)</button><button type="button" class="mtile" data-tt="theme">Theme</button><button type="button" class="mtile" data-tt="fm">Smaller text</button><button type="button" class="mtile" data-tt="fp">Larger text</button><button type="button" class="mtile" data-tt="focus">Focus</button><button type="button" class="mtile" data-tt="print">Print</button></div>
<p class="mh">Your data</p><div class="mgrid"><button type="button" class="mtile" onclick="exp()">Export backup</button><label class="mtile">Import backup<input type="file" accept=".json" hidden onchange="imp(this.files[0])"></label></div>`;
 X.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>{const t=document.querySelector('#tools [data-t="'+b.dataset.tt+'"]');if(t)t.click()});
 const qb=X.querySelector('#mq-quiz'),qs=()=>{qb.textContent=document.body.classList.contains('quiz')?'Quiz mode: on':'Quiz mode: off'};qs();
 qb.onclick=()=>{setQuiz(!document.body.classList.contains('quiz'),true);qs()}}
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
    mcq_js = 'const MCQDATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n' + open(os.path.join(HERE, 'mcq.js'), encoding='utf8').read() + '\n'
    A = "const views=[...document.querySelectorAll('.view')]"
    _need(s, A); s = s.replace(A, JS + mcq_js + open(os.path.join(HERE, 'textbook.js'), encoding='utf8').read() + A, 1)
    s = s.replace('</style>', CSS + open(os.path.join(HERE, 'textbook.css'), encoding='utf8').read() + open(os.path.join(HERE, 'mcq.css'), encoding='utf8').read() + open(os.path.join(HERE, 'perf.css'), encoding='utf8').read() + '</style>', 1)
    return s
