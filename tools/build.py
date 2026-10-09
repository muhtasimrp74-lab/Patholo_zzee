# -*- coding: utf-8 -*-
"""Builds ../index.html from src/index.base.html (original 15 systemic topics) + content.py (GP and HM topics)."""
import re, json, html, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import content
s = open(os.path.join(HERE, 'src/index.base.html'), encoding='utf8').read()

# Parts, in book order. General Pathology and Haematology are filled from content.TOPICS (see content.py);
# while a part has no topics the site shows a tidy "coming soon" panel for it.
SYS = ['%02d' % i for i in range(1, 16)]
PART_DEFS = [('A', 'General Pathology', 'gp'), ('B', 'Haematology', 'hm'), ('C', 'Systemic Pathology', 'sys')]
PARTS = [(L, N, K, SYS if K == 'sys' else [t[0] for t in content.TOPICS if t[2] == K]) for L, N, K in PART_DEFS]
PART_OF = {t: p[2] for p in PARTS for t in p[3]}
e = lambda t: html.escape(t, quote=False)

old_grid = re.search(r'<h2 id="topics">.*?(?=</main></div><div class="view" id="v-01")', s, re.S).group()
old_cards = {m.group(1): m.group(0) for m in re.finditer(r'<a class="topic" href="#/(\d\d)">.*?</a>', old_grid, re.S)}
names = {k: re.search(r'<h3>(.*?)</h3>', v).group(1) for k, v in old_cards.items()}
short = dict(re.findall(r'<option value="(\d\d)"[^>]*>\d\d  (.*?)</option>', re.search(r'<select class="jump".*?</select>', s, re.S).group()))

n = len(re.findall(r'id="q\d+"', s)); base_n = n
new_data, new_views, written = [], {}, {}
for tid, tname, part, qs in content.TOPICS:
    names[tid] = e(tname); short[tid] = e(tname)
    arts = []
    for item in qs:
        code, q, ans = item[:3]
        n += 1
        if len(item) > 3 and item[3] == 'W': written['q%d' % n] = 'W'
        new_data.append([code, q, tid, 'q%d' % n, tname])
        arts.append('<article class="card" id="q%d"><header tabindex="0"><span class="code">%s</span><h4>%s</h4></header><div class="ans">%s</div></article>' % (n, code, e(q), ans))
    new_views[tid] = (qs, ''.join(arts))
total = n
order = [t for p in PARTS for t in p[3]]  # book order: Part A, B, C

def jump(cur):
    return '<select class="jump" aria-label="Jump to topic">' + ''.join('<option value="%s"%s>%s  %s</option>' % (t, ' selected' if t == cur else '', t, short[t]) for t in order) + '</select>'

v01 = re.search(r'<div class="view" id="v-01".*?(?=<div class="view" id="v-02")', s, re.S).group()
head = v01[:v01.index('<main>')]
def pager(tid):
    i = order.index(tid)
    prev = '<a href="#/%s"><small>Previous</small>%s</a>' % (order[i-1], short[order[i-1]]) if i else '<span></span>'
    nxt = '<a class="nx" href="#/%s"><small>Next</small>%s</a>' % (order[i+1], short[order[i+1]]) if i < len(order)-1 else '<a class="nx" href="#/"><small>Finished</small>Back to all topics</a>'
    return '<div class="pager">%s%s</div>' % (prev, nxt)

views = ''
for tid in [t for t in order if t not in old_cards]:
    qs, arts = new_views[tid]
    pl = [p for p in PARTS if tid in p[3]][0]
    h = head.replace('id="v-01"', 'id="v-%s"' % tid).replace('Blood Vessels | Systemic Pathology Viva', '%s | Patholo_zee' % names[tid])
    h = h.replace('All topics</a> / 01', 'All topics</a> / %s' % tid).replace('<h1>Blood Vessels</h1>', '<h1>%s</h1>' % names[tid])
    h = h.replace('6 questions, in the same order as the NMC viva list.', '%d questions · Part %s, %s.' % (len(qs), pl[0], pl[1]))
    views += h + '<main>' + arts + '<p class="none">No question matches your search.</p>' + pager(tid) + '</main></div>'
for _t in old_cards:  # prev/next links of the original topics follow the full book order
    s = re.sub(r'(id="v-%s".*?)<div class="pager">.*?</div>' % _t, lambda m, _t=_t: m.group(1) + pager(_t), s, count=1, flags=re.S)
s = s.replace('<div class="view" id="v-bookmarks"', views + '<div class="view" id="v-bookmarks"', 1)
s = re.sub(r'<select class="jump".*?</select>', lambda m: jump(re.search(r'<option value="(\d\d)" selected', m.group()).group(1)), s, flags=re.S)
s = s.replace('"Histopathology Practical"]];', '"Histopathology Practical"]' + ''.join(', ' + json.dumps(d, ensure_ascii=False) for d in new_data) + '];', 1)

def qn(c): return int(re.search(r'(\d+) questions', c).group(1))
def card(tid):
    if tid in old_cards: c = old_cards[tid]
    else:
        qs = new_views[tid][0]
        c = '<a class="topic" href="#/%s"><span class="no">%s</span><h3>%s</h3><p>%s</p><span class="cnt">%d questions</span></a>' % (tid, tid, names[tid], e('; '.join(q[1][:50] + ('…' if len(q[1]) > 50 else '') for q in qs[:2])), len(qs))
    return c.replace('<a class="topic"', '<a class="topic" data-n="%d"' % qn(c), 1)
secs = ''
for letter, pname, key, tids in sorted(PARTS, key=lambda p: not p[3]):  # parts that have questions first; empty ones follow
    if not tids:
        secs += '<section class="part part-empty" data-part="%s"><div class="part-h"><h3>%s</h3><span class="mu">Part %s</span></div><div class="soon"><b>Questions coming soon</b><p>This section is set up and ready. Its topics and questions will appear here as they are added.</p></div></section>' % (key, pname, letter)
        continue
    cs = [card(t) for t in tids]
    secs += '<section class="part" data-part="%s"><div class="part-h"><h3>%s</h3><span class="mu">%d topics · %d questions</span><span class="ring pp" data-pp="%s"></span></div><div class="grid">%s</div></section>' % (key, pname, len(tids), sum(qn(c) for c in cs), key, ''.join(cs))
chips = '<div class="chips" id="pchips" role="group" aria-label="Filter by part"><button aria-pressed="true" data-f="all">All parts</button>' + ''.join('<button aria-pressed="false" data-f="%s">%s</button>' % (p[2], p[1]) for p in PARTS) + '<span class="sp"></span><button aria-pressed="false" data-sort="n">Sort: most questions</button></div>'
s = s.replace(old_grid, '<h2 id="topics">Topics<small>%d questions</small></h2>%s%s' % (total, chips, secs), 1)

s = s.replace('<small>Browse</small>15 topics', '<small>Browse</small>%d topics' % len(order))

s = s.replace("sort((a,b)=>a.slice(1)-b.slice(1))", "sort((a,b)=>(a.slice(1)-b.slice(1))||a.localeCompare(b))", 1)
s = s.replace("new Blob([JSON.stringify(S,null,1)]", "new Blob([JSON.stringify(Object.assign({},S,{ink:(typeof Ink!=='undefined'?Ink.dump():{})}),null,1)]", 1)
s = s.replace("function imp(f){if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!o||!Array.isArray(o.bm))throw 0;Object.assign(S,o);save();location.reload()}catch(e){alert('That file is not a valid backup.')}})}",
 "function imp(f){if(!f)return;f.text().then(async t=>{let o;try{o=JSON.parse(t);if(!o||!Array.isArray(o.bm))throw 0}catch(e){alert('That file is not a valid backup.');return}const ink=o.ink;delete o.ink;Object.assign(S,o);save();if(ink&&typeof Ink!=='undefined')await Ink.load(ink);location.reload()})}", 1)
assert 'Ink.load' in s and 'Ink.dump' in s and 'localeCompare(b))' in s


QMETA = {'parts': [[p[2], p[1], p[0]] for p in PARTS], 'partOf': PART_OF, 'type': written}
QUESTIONS_JS = '\nconst QMETA=%s;\n' % json.dumps(QMETA, ensure_ascii=False) + open(os.path.join(HERE, 'questions.js'), encoding='utf8').read() + '\n'

PART_JS = "const PART_OF=%s;\n" % json.dumps(PART_OF) + r"""(function(){const p=prog;prog=function(){p();const L=new Set(S.learned),T={},N={};DATA.forEach(d=>{const k=PART_OF[d[2]];N[k]=(N[k]||0)+1;if(L.has(d[3]))T[k]=(T[k]||0)+1});document.querySelectorAll('[data-pp]').forEach(r=>{const k=r.dataset.pp,c=N[k]?Math.round(100*(T[k]||0)/N[k]):0;r.style.setProperty('--p',c);r.textContent=c+'%'})};prog();
const ch=document.getElementById('pchips');if(!ch)return;const secs=[...document.querySelectorAll('section.part')],orig=secs.map(x=>[...x.querySelectorAll('.topic')]);let f='all',srt=false;
function apply(){secs.forEach((x,i)=>{x.hidden=f!=='all'&&x.dataset.part!==f;const g=x.querySelector('.grid'),a=orig[i].slice();if(srt)a.sort((u,v)=>v.dataset.n-u.dataset.n||u.getAttribute('href').localeCompare(v.getAttribute('href')));g&&a.forEach(t=>g.append(t))});ch.querySelectorAll('[data-f]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===f));ch.querySelector('[data-sort]').setAttribute('aria-pressed',srt)}
ch.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.f)f=b.dataset.f;else srt=!srt;apply()}})();
"""

UX_JS = r"""
function cardRows(){const by={A:[],B:[]};DATA.forEach(d=>{const m=/^([AB])\d+$/.exec(d[0]);if(m&&!by[m[1]].includes(d[0]))by[m[1]].push(d[0])});
return ['A','B'].map(L=>{const a=by[L].sort((x,y)=>x.slice(1)-y.slice(1));return '<div class="chips" style="padding:0;margin:0 0 12px;max-width:none;flex-wrap:wrap"><span class="mu" style="align-self:center">'+L+'-box cards:</span>'+(a.length?a.map(c=>'<a href="#/b/'+c+'">'+c+'</a>').join(''):'<span class="soon-t">coming soon</span>')+'</div>'}).join('')}
const EMPTY_UI={bm:['No bookmarks yet','<path d="M6 3h12v18l-6-4-6 4z"/>'],fav:['No favourites yet','<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'],notes:['No notes yet','<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>']};
function emptyHTML(k){const u=EMPTY_UI[k]||EMPTY_UI.bm;return '<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true">'+u[1]+'</svg><b>'+u[0]+'</b><p>'+EMPTY[k].replace(/^No [a-z]+ yet\. /,'')+'</p><a class="pill" href="#/topics">Browse topics</a></div>'}
(function(){
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
/* reveal on scroll (skips anything already on screen) */
if('IntersectionObserver' in window&&!RM){document.documentElement.classList.add('js-ready');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.unobserve(e.target);e.target.classList.add('in');setTimeout(()=>e.target.classList.remove('rv','in'),1000)}),{rootMargin:'0px 0px -6% 0px'});
const seen=new Map();document.querySelectorAll('.topic,.dc,.part-h,.stats').forEach(el=>{if(el.getBoundingClientRect().top<innerHeight&&el.offsetParent)return;const p=el.parentNode,n=seen.get(p)||0;seen.set(p,n+1);el.style.setProperty('--i',Math.min(n%6,5));el.classList.add('rv');io.observe(el)})}
/* count-up for numeric hero stats */
document.querySelectorAll('.stats b').forEach(el=>{const v=+el.textContent;if(!v||RM)return;const t0=performance.now(),D=900;el.textContent='0';(function f(t){const k=Math.min(1,(t-t0)/D);el.textContent=Math.round(v*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f);else el.textContent=v})(t0)});
/* topic-complete celebration */
const toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');document.body.appendChild(toast);let tt;
function say(h){toast.innerHTML='<span class="tk"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></span><span>'+h+'</span>';toast.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('on'),3600)}
function burst(){if(RM)return;const cs=['#1769e0','#2bb3d6','#0f7a4a','#f2b36b','#8fb3f2'];for(let i=0;i<26;i++){const e=document.createElement('i');e.className='cf';const a=(Math.random()*160+10)*Math.PI/180,d=120+Math.random()*180;e.style.cssText='--c:'+cs[i%5]+';--x:'+(Math.cos(a)*d*(Math.random()<.5?-1:1)).toFixed(0)+'px;--y:'+(-Math.sin(a)*d).toFixed(0)+'px;--r:'+((Math.random()*720-360)|0)+'deg';document.body.appendChild(e);setTimeout(()=>e.remove(),1400)}}
const NAME={},TOT={};DATA.forEach(d=>{NAME[d[2]]=d[4];TOT[d[2]]=(TOT[d[2]]||0)+1});
function done(){const L=new Set(S.learned),c={};DATA.forEach(d=>{if(L.has(d[3]))c[d[2]]=(c[d[2]]||0)+1});return new Set(Object.keys(TOT).filter(t=>c[t]===TOT[t]))}
let prev=null;const p0=prog;prog=function(){p0();const now=done();if(prev){const fresh=[...now].filter(t=>!prev.has(t));if(fresh.length){burst();say(now.size===Object.keys(TOT).length?'<b>Every topic complete.</b> Outstanding work.':'<b>Topic complete</b><br>'+NAME[fresh[0]])}}prev=now};prog();
})();
"""
MARK = "document.querySelector('#v-home main').insertAdjacentHTML('afterbegin','<div id=\"dash\"></div>');"
assert MARK in s
s = s.replace(MARK, MARK + QUESTIONS_JS, 1)
OLD_EMPTY = '<p class="none" style="display:block">${EMPTY[k]}</p>'
assert OLD_EMPTY in s
s = s.replace(OLD_EMPTY, '${emptyHTML(k)}', 1)
i = s.index('const DATA='); j = s.index('</script>', i)
s = s[:j] + '\n' + PART_JS + UX_JS + s[j:]
open(os.path.join(HERE, '_stage.html'), 'w', encoding='utf8').write(s)
print('questions', base_n, '->', total, 'topics', len(order))

# ---------------------------------------------------------------- CSS, ink script, CSP
CSS = r"""
.chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:4px 0 18px}.chips .sp{flex:1}
.chips button{background:var(--panel);border:1px solid var(--line);color:var(--text);font:600 13px var(--body);padding:8px 14px;border-radius:999px;cursor:pointer}
.chips button[aria-pressed=true]{border-color:var(--orange);color:var(--lbl)}
section.part{margin:0 0 30px}.part-h{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:8px 0 14px}.part-h h3{margin:0;font:800 20px var(--disp)}.part-h .mu{color:var(--muted);font-size:13px;flex:1}
.ring.pp{width:46px;height:46px;font-size:11px}
.card .ans{position:relative}canvas.ink{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2}
#ink{position:fixed;left:50%;transform:translateX(-50%);bottom:70px;z-index:40;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px;max-width:calc(100vw - 20px);background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:6px;box-shadow:0 8px 30px rgba(0,0,0,.35)}
#ink[hidden]{display:none}#ink button{background:none;border:0;color:var(--text);font:600 12px var(--body);padding:7px 10px;border-radius:999px;cursor:pointer}
#ink button:hover:not(:disabled){background:var(--chip)}#ink button:disabled{opacity:.35;cursor:default}#ink button[aria-pressed=true]{background:var(--chip);color:var(--lbl);box-shadow:inset 0 0 0 1px var(--lbl)}
#ink .done{color:var(--lbl)}#ink .sep{width:1px;height:22px;background:var(--line);margin:0 4px}
#ink .sw button{width:22px;height:22px;padding:0;border-radius:50%;background:var(--c);border:2px solid transparent;margin:0 2px}#ink .sw button[aria-pressed=true]{border-color:var(--text);box-shadow:none;background:var(--c)}
#ink .zs button{padding:7px 8px}
body.inking.ink-pen .card .ans,body.inking.ink-hl .card .ans,body.inking.ink-er .card .ans,body.inking.ink-lasso .card .ans{touch-action:none;-webkit-user-select:none;user-select:none;cursor:crosshair}
body.inking .card .ans{outline:1px dashed var(--line);outline-offset:-1px}
@media print{#ink{display:none}}
"""
s = re.sub(r'@font-face\{font-family:"(?:Plus Jakarta Sans|Source Sans 3)".*?\}\n?', '', s)
s = s.replace('</style>', CSS + open(os.path.join(HERE, 'theme.css'), encoding='utf8').read() + '</style>', 1)
H1 = '<h1>Viva Prep —<br>Read.<br>Recall. Answer.</h1>'
assert H1 in s
s = s.replace('<a href="#/topics">Topics</a>', '<a href="#/topics">Topics</a><a href="#/questions">Questions</a>')
s = s.replace(H1, '<p class="eyebrow">NMC viva list · Robbins 11th</p><h1>Systemic Pathology<em>Read. Recall. Answer.</em></h1>', 1)
s = s.replace('<b>Systemic Pathology Viva Questions with Answers.</b> ', '', 1)
STATS = '<div class="stats"><div><b>%d</b><span>Viva questions</span></div><div><b>%d</b><span>Systemic topics</span></div><div><b>NMC</b><span>Question order</span></div><div><b>11th</b><span>Robbins edition</span></div></div>' % (total, len(order))
T = '<ul id="res"></ul></div></div></div></div><main'
assert T in s
s = s.replace(T, '<ul id="res"></ul></div></div></div>' + STATS + '</div><main', 1)
NAV_OLD = re.search(r'<nav id="bnav">.*?</nav>', s, re.S)
assert NAV_OLD
s = s.replace(NAV_OLD.group(), '<nav id="bnav" aria-label="Main"><a href="#/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>Home</a><a href="#/topics"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16"/></svg>Topics</a><a href="#/questions"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01"/></svg>Questions</a><a href="#/practice"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>Practice</a><a href="#/bookmarks"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4z"/></svg>Bookmarks</a><a href="#/notes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/></svg>Notes</a></nav>', 1)
s = s.replace('content="#000000" media', 'content="#0c131f" media').replace('content="#f7f4f2" media', 'content="#f7f6f2" media')
CSP = "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'\"><meta name=\"referrer\" content=\"no-referrer\">"
s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + CSP, 1)
s = s.replace("<script>\nif ('serviceWorker'", '<script src="ink.js"></script>\n<script>\nif (\'serviceWorker\'', 1)
assert 'src="ink.js"' in s and 'Content-Security-Policy' in s

# fix: counts() also matched dashboard elements with data-c="0".."3" and threw on S["0"].length
_C_OLD = "document.querySelectorAll('[data-c]').forEach(e=>{const k=e.dataset.c;"
assert _C_OLD in s
s = s.replace(_C_OLD, "document.querySelectorAll('[data-c=bm],[data-c=fav],[data-c=notes]').forEach(e=>{const k=e.dataset.c;", 1)
# the page's own JS rewrites every .logo's innerHTML at load; keep the wordmark through that
s, _n = re.subn(r"(\.logo'\)\.forEach\(l=>l\.innerHTML='<svg.*?</svg>)'", lambda m: m.group(1) + '<span class="wm">Patholo<i>_zee</i></span>\'', s, count=1, flags=re.S)
assert _n == 1
# ---- site name: Patholo_zee everywhere the visitor can see it
for _old, _new in (('Systemic Pathology Viva Questions with Answers', 'Patholo_zee'), ('Systemic Pathology Viva', 'Patholo_zee'),
                   ("'viva-backup-'", "'patholo_zee-backup-'")):
    assert _old in s, _old
    s = s.replace(_old, _new)
# ---- A-box / B-box card chips, card page wording
_OLDCH = """<div class="chips" style="padding:0;margin:0 0 20px;max-width:none;flex-wrap:wrap"><span class="mu" style="align-self:center">By B-number:</span>${BS.map(b=>`<a href="#/b/${b}">${b}</a>`).join('')}</div>`;prog()}"""
assert _OLDCH in s
s = s.replace(_OLDCH, "${cardRows()}`;prog()}", 1)
_OLDB = "mkView('b','By B-number','B questions','Every question with the same NMC B-number, together.')"
assert _OLDB in s
s = s.replace(_OLDB, "mkView('b','By card','Card questions','Every question on the same viva card, together.')", 1)
_OLDV = "document.querySelector('#v-b h1').textContent=b+' questions';"
assert _OLDV in s
s = s.replace(_OLDV, "document.querySelector('#v-b h1').textContent='Card '+b;", 1)
_OLDE = "<small>${esc(d[4])}</small></a></div>`).join('')}\nfunction pSetup"
assert _OLDE in s
s = s.replace(_OLDE, "<small>${esc(d[4])}</small></a></div>`).join('')||'<p class=\"none\" style=\"display:block\">No questions on this card yet.</p>'}\nfunction pSetup", 1)

# ---- premium polish: wordmark, trust line, social meta
s, nlogo = re.subn(r'(<a class="logo"[^>]*>.*?</svg>)</a>', lambda m: m.group(1) + '<span class="wm">Patholo<i>_zee</i></span></a>', s, flags=re.S)
assert nlogo >= 1
TR_OLD = 'Blood Vessels</a></div></div><div class="phones">'
assert TR_OLD in s
s = s.replace(TR_OLD, 'Blood Vessels</a></div><p class="trust"><span>Works offline</span><span>Private, stays on your device</span><span>No sign-up</span></p></div><div class="phones">', 1)
SITE = 'https://muhtasimrp74-lab.github.io/Patholo_zee/'
DESC = '%d pathology viva questions with answers, in NMC order (Robbins 11th). Practice mode, bookmarks, notes and handwriting. Works offline.' % total
META = ('<meta name="description" content="%s"><link rel="canonical" href="%s">'
 '<meta property="og:type" content="website"><meta property="og:site_name" content="Patholo_zee">'
 '<meta property="og:title" content="Patholo_zee: Pathology Viva Questions"><meta property="og:description" content="%s">'
 '<meta property="og:url" content="%s"><meta property="og:image" content="%sicons/og-image.png">'
 '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
 '<meta property="og:image:alt" content="Patholo_zee. Pathology viva questions. Read. Recall. Answer.">'
 '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Patholo_zee: Pathology Viva Questions">'
 '<meta name="twitter:description" content="%s"><meta name="twitter:image" content="%sicons/og-image.png">') % (DESC, SITE, DESC, SITE, SITE, DESC, SITE)
s = s.replace('<meta name="referrer" content="no-referrer">', '<meta name="referrer" content="no-referrer">' + META, 1)
assert 'og:image' in s
open(os.path.join(HERE, '..', 'index.html'), 'w', encoding='utf8').write(s)
os.remove(os.path.join(HERE, '_stage.html'))
print('wrote index.html', len(s))
