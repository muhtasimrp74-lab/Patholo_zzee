# -*- coding: utf-8 -*-
"""Builds ../index.html from src/index.base.html (original 15 systemic topics) + content.py (GP and HM topics)."""
import re, json, html, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import content, robbins_map, robbins_outline as RO
UNPLACED = []
_all_q = {it[1] for t in content.TOPICS for it in t[3]}
for _k in content.ANSWERS:
    if _k not in _all_q: print('answers.md: no question matches heading ->', _k[:80])
s = open(os.path.join(HERE, 'src/index.base.html'), encoding='utf8').read()

# Parts, in book order. General Pathology and Haematology are filled from content.TOPICS (see content.py);
# while a part has no topics the site shows a tidy "coming soon" panel for it.
SYS = ['%02d' % i for i in range(1, 16)]
# Written chapters that share a Robbins chapter with an original viva topic are shown on ONE page (same as General Pathology):
MERGE = {'01': 'c11', '02': 'c12', '04': 'c15', '05': 'c17', '06': 'c18', '07': 'c20', '08': 'c21', '09': 'c22', '10': 'c24', '11': 'c25', '12': 'c26', '13': 'c28'}
MERGE_REV = {v: k for k, v in MERGE.items()}
SYS_ORDER = SYS[:9] + ['c23'] + SYS[9:]
PART_DEFS = [('A', 'General Pathology', 'gp'), ('B', 'Haematology', 'hm'), ('C', 'Systemic Pathology', 'sys')]
PARTS = [(L, N, K, (SYS_ORDER + [t[0] for t in content.TOPICS if t[2] == K and t[0] not in MERGE_REV and t[0] not in SYS_ORDER]) if K == 'sys' else [t[0] for t in content.TOPICS if t[2] == K]) for L, N, K in PART_DEFS]
PART_OF = {t: p[2] for p in PARTS for t in p[3]}
e = lambda t: html.escape(t, quote=False)

# ---- exam meta (importance stars + exam-year chips) ----
import math
def _star(on):
    return '<svg class="zs %s" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#zz-star"/></svg>' % ('on' if on else 'off')
def xm_html(stars, refs, tag='span', boxes=None, hl=False):
    """Importance as custom stars (filled = importance, or times asked on the A-cards; at least 3 slots), each exam year as its own chip,
    and for box-viva questions each A-card with the question numbers as printed."""
    parts = []
    if stars:
        parts.append('<span class="imp%s" role="img" aria-label="%s">%s</span>' % (' num' if stars > 3 else '', ('Asked %d time%s' % (stars, '' if stars == 1 else 's')) if (boxes or stars > 3) else ('Importance: %d of 3' % stars), (_star(True) + '<b>%d</b>' % stars) if stars > 3 else ''.join(_star(i < stars) for i in range(3))))
    for c, lab in (boxes or []):
        parts.append('<span class="ex-y"><b class="ex-p">%s</b>%s</span>' % (e(c), e(lab) if lab else ''))
    if hl:
        parts.append('<span class="ex-y ex-hl">Highlighted</span>')
    last = None
    for tok in [t.strip() for t in (refs or '').split(',') if t.strip()]:
        m = re.match(r'^([A-Za-z]+)-(.+)$', tok)
        if m:
            last, tok = m.group(1), m.group(2)
        if last:
            parts.append('<span class="ex-y"><b class="ex-p">%s</b>%s</span>' % (e(last), e(tok)))
        else:
            parts.append('<span class="ex-y">%s</span>' % e(tok))
    return '<%s class="xm">%s</%s>' % (tag, ''.join(parts), tag) if parts else ''
_pts = []
for _k in range(10):
    _a = -math.pi / 2 + _k * math.pi / 5; _r = 8.4 if _k % 2 == 0 else 3.9
    _pts.append('%.2f %.2f' % (12 + _r * math.cos(_a), 12.8 + _r * math.sin(_a)))
_STAR_D = 'M' + ' L'.join(_pts) + 'Z'
STAR_SPRITE = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
    '<linearGradient id="zz-star-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9A5BB"/><stop offset=".55" stop-color="#B4506F"/><stop offset="1" stop-color="#7A1F36"/></linearGradient>'
    '<symbol id="zz-star" viewBox="0 0 24 24" overflow="visible"><path d="%s" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    '<path d="M9.4 8.7 L11.1 5.9" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" style="opacity:var(--zhl,0)"/></symbol></defs></svg>') % _STAR_D

old_grid = re.search(r'<h2 id="topics">.*?(?=</main></div><div class="view" id="v-01")', s, re.S).group()
old_cards = {m.group(1): m.group(0) for m in re.finditer(r'<a class="topic" href="#/(\d\d)">.*?</a>', old_grid, re.S)}
names = {k: re.search(r'<h3>(.*?)</h3>', v).group(1) for k, v in old_cards.items()}
short = dict(re.findall(r'<option value="(\d\d)"[^>]*>\d\d  (.*?)</option>', re.search(r'<select class="jump".*?</select>', s, re.S).group()))

n = len(re.findall(r'id="q\d+"', s)); base_n = n
new_data, new_views, written, exam, tree_gp = [], {}, {}, {}, {}
RAW = {}
# question ids: the original written questions keep their numbers; box-viva questions (item[7]) are numbered after them,
# so bookmarks, notes and progress saved on the live site never move.
QID, _k = {}, n
def _rank(it): return it[8] if len(it) > 8 else (1 if len(it) > 7 else 0)   # 0 written, 1 box viva, 2 DU written (merged items keep their survivor's rank)
for _pass in (0, 1, 2):
    for _ti, _t in enumerate(content.TOPICS):
        for _ii, _it in enumerate(_t[3]):
            if _rank(_it) == _pass:
                _k += 1; QID[(_ti, _ii)] = _k
for _ti, (tid, tname, part, qs) in enumerate(content.TOPICS):
    names[tid] = e(tname); short[tid] = e(tname)
    arts = []
    live = []
    _prev = None
    for _ii, item in enumerate(qs):
        if (tid, _ii) in content.DROPPED: continue      # same question as another card: shown once there
        live.append(item)
        code, q, ans = item[:3]
        n = QID[(_ti, _ii)]
        if len(item) > 3 and item[3] in ('W', 'B'): written['q%d' % n] = item[3]
        pl = None
        if len(item) > 6:
            pl = tuple(item[6])
            if _rank(item) == 2:                      # DU written question: place it under the Robbins heading/topic it belongs to
                pp = RO.place_du(int(tid[1:]), q, pl[1], _prev)
                if pp: pl = pp
                else: UNPLACED.append((tid, q))
                _prev = pl
            pl = RO.norm(*pl)
            tree_gp['q%d' % n] = list(pl)
        stars, refs = (item[4], item[5]) if len(item) > 5 else (0, '')
        ex = item[7] if len(item) > 7 else {}
        if ex:
            exam['q%d' % n] = [stars, refs, sorted({2000 + int(y) for y in re.findall(r'(?<!\d)(\d{2})(?!\d)', refs)}), ex['boxes'], 1 if ex['hl'] else 0]
        elif stars or refs:
            exam['q%d' % n] = [stars, refs, sorted({2000 + int(y) for y in re.findall(r'(?<!\d)(\d{2})(?!\d)', refs)})]
        xm = xm_html(stars, refs, boxes=ex.get('boxes'), hl=ex.get('hl'))
        new_data.append([code, q, MERGE_REV.get(tid, tid), 'q%d' % n, html.unescape(names[MERGE_REV[tid]]) if tid in MERGE_REV else tname])
        arts.append((pl, _ii, '<article class="card" id="q%d"><header tabindex="0">%s<h4>%s</h4>%s</header><div class="ans">%s</div></article>' % (n, ''.join('<span class="code">%s</span>' % c for c in code.split()), e(q), xm, ans)))
    RAW[tid] = (live, arts)
RAW_OWN = {}
def render(arts, _own):
    def _key(a):
        pl_, ii_ = a[0], a[1]
        if not pl_: return (2, 999, 999, ii_)
        so, to = RO.sub_order(pl_[0]), RO.topic_order(pl_[0], pl_[1])
        return (0 if pl_[0] == _own else 1, so.index(pl_[1]) if pl_[1] in so else 500, to.index(pl_[2]) if pl_[2] in to else 500, ii_)
    arts = sorted(arts, key=_key)
    _multi = {}
    for a in arts:
        if a[0]: _multi.setdefault((a[0][0], a[0][1]), set()).add(a[0][2])
    _out, _ls, _lt = [], None, None
    for pl_, ii_, h_ in arts:
        if pl_:
            if (pl_[0], pl_[1]) != _ls: _out.append('<h3 class="sub">%s</h3>' % e(pl_[1])); _ls = (pl_[0], pl_[1]); _lt = None
            if len(_multi[_ls]) > 1 and pl_[2] != _lt: _out.append('<h4 class="tsub">%s</h4>' % e(pl_[2])); _lt = pl_[2]
        _out.append(h_)
    return ''.join(_out)
for tid, (live, arts) in RAW.items():
    new_views[tid] = (live, render(arts, int(tid[1:]) if tid[1:].isdigit() else None))
total = max(QID.values()) - len(content.DROPPED)
ALIAS = {'q%d' % QID[(content.TOPICS_IDX[a[0]], a[1])]: 'q%d' % QID[(content.TOPICS_IDX[b[0]], b[1])] for a, b in content.ALIAS.items()}
order = [t for p in PARTS for t in p[3]]  # book order: Part A, B, C

# Robbins chapter labels shown instead of the internal topic ids (01..15, c2 ...)
OLD_CH = {'01': 11, '02': 12, '03': 13, '04': 15, '05': 17, '06': 18, '07': '20\u201321', '08': 21, '09': 22, '10': 24, '11': 25, '12': 26, '13': 28, '14': 29, '15': 'P'}
def NO(t):
    c = OLD_CH.get(t)
    if c is None and t.startswith('c') and t[1:].isdigit(): c = int(t[1:])
    return 'Practical' if c == 'P' else ('Biochem' if c == 30 else 'Ch %s' % c)
CHAP = {c: (v[0], list(v[1])) for c, v in robbins_map.CHAPTERS.items()}
for c, (t, subs) in content.GP_CHAPTERS.items():
    CHAP.setdefault(c, (t, []))
    CHAP[c][1].extend(x for x in subs if x not in CHAP[c][1])
CH_ORDER = sorted((c for c in CHAP if c != 'P')) + ['P']
TREE = {k: list(RO.norm(*v)) for k, v in robbins_map.SYS.items()}
TREE.update(tree_gp)
# headings in Robbins order (robbins_outline.py); any heading that is not listed there goes after the listed ones
for _c in list(CHAP):
    _o = RO.sub_order(_c)
    if _o: CHAP[_c] = (CHAP[_c][0], list(_o))
for _q, (_c, _s, _t) in TREE.items():
    if _s not in CHAP[_c][1]: CHAP[_c][1].append(_s); print('heading not in outline:', _c, _s)
    elif _t not in RO.topic_order(_c, _s) and RO.OUT.get(_c): print('topic not in outline:', _c, _s, '|', _t)
if UNPLACED: print('UNPLACED questions (add a rule in robbins_outline.py):', UNPLACED)

def jump(cur):
    return '<select class="jump" aria-label="Jump to topic">' + ''.join('<option value="%s"%s>%s  %s</option>' % (t, ' selected' if t == cur else '', NO(t), short[t]) for t in order) + '</select>'

# ---- merge pass: original viva topic + written chapter of the same Robbins chapter -> one page (viva and written together)
_RM = {k: RO.norm(*v) for k, v in robbins_map.SYS.items()}
for _old, _ct in MERGE.items():
    _vm = re.search(r'<div class="view" id="v-%s".*?(?=<div class="view" id="v-)' % _old, s, re.S); _vt = _vm.group()
    _i, _j = _vt.index('<main>') + 6, _vt.index('<p class="none">')
    _ol = [(_RM[m.group(1)], int(m.group(1)[1:]) - 1000, m.group(0)) for m in re.finditer(r'<article class="card" id="(q\d+)">.*?</article>', _vt[_i:_j], re.S)]
    _live, _ar = RAW[_ct]; _tot = len(_ol) + len(_live)
    _nv = _vt[:_i] + render(_ol + _ar, int(OLD_CH[_old].split('\u2013')[0]) if isinstance(OLD_CH[_old], str) else OLD_CH[_old]) + _vt[_j:]
    _nv = re.sub(r'\d+ questions, in the same order as the NMC viva list\.', '%d questions · viva and written, in Robbins order.' % _tot, _nv)
    s = s.replace(_vt, _nv, 1)
    old_cards[_old] = re.sub(r'\d+ questions</span>', '%d questions</span>' % _tot, old_cards[_old])

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
    h = re.sub(r'<select class="jump".*?</select>', lambda m: jump(tid), head, flags=re.S).replace('id="v-01"', 'id="v-%s"' % tid).replace('Blood Vessels | Systemic Pathology Viva', '%s | Patholo_zzee' % names[tid])
    h = h.replace('All topics</a> / 01', 'All topics</a> / %s' % NO(tid)).replace('<h1>Blood Vessels</h1>', '<h1>%s</h1>' % names[tid])
    h = h.replace('6 questions, in the same order as the NMC viva list.', '%d questions · Part %s, %s.' % (len(qs), pl[0], pl[1]))
    views += h + '<main>' + arts + '<p class="none">No question matches your search.</p>' + pager(tid) + '</main></div>'
for _t in old_cards:  # prev/next links of the original topics follow the full book order
    s = re.sub(r'(id="v-%s".*?)<div class="pager">.*?</div>' % _t, lambda m, _t=_t: m.group(1) + pager(_t), s, count=1, flags=re.S)
assert "v.querySelectorAll('.sub').forEach(h=>{let e=h.nextElementSibling,vis=false;while(e&&e.classList.contains('card')){if(!e.classList.contains('hide'))vis=true;e=e.nextElementSibling}h.classList.toggle('hide',!vis)});" in s
s = s.replace("v.querySelectorAll('.sub').forEach(h=>{let e=h.nextElementSibling,vis=false;while(e&&e.classList.contains('card')){if(!e.classList.contains('hide'))vis=true;e=e.nextElementSibling}h.classList.toggle('hide',!vis)});", "v.querySelectorAll('.sub,.tsub').forEach(h=>{const t=h.classList.contains('tsub');let e=h.nextElementSibling,vis=false;while(e&&!e.classList.contains('sub')&&!(t&&e.classList.contains('tsub'))){if(e.classList.contains('card')&&!e.classList.contains('hide'))vis=true;e=e.nextElementSibling}h.classList.toggle('hide',!vis)});", 1)
s = s.replace('<div class="view" id="v-bookmarks"', views + '<div class="view" id="v-bookmarks"', 1)
s = re.sub(r'<select class="jump".*?</select>', lambda m: jump(re.search(r'<option value="([^"]+)" selected', m.group()).group(1)), s, flags=re.S)
s = s.replace('"Histopathology Practical"]];', '"Histopathology Practical"]' + ''.join(', ' + json.dumps(d, ensure_ascii=False) for d in new_data) + '];', 1)

def qn(c): return int(re.search(r'(\d+) questions', c).group(1))
def card(tid):
    if tid in old_cards: c = old_cards[tid]
    else:
        qs = new_views[tid][0]
        c = '<a class="topic" href="#/%s"><span class="no">%s</span><h3>%s</h3><p>%s</p><span class="cnt">%d questions</span></a>' % (tid, NO(tid), names[tid], e('; '.join(q[1][:50] + ('…' if len(q[1]) > 50 else '') for q in qs[:2])), len(qs))
    c = re.sub(r'<span class="no">[^<]*</span>', '<span class="no">%s</span>' % NO(tid), c, count=1)
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

NEWIMP = r"""function vbk(o){const ob=x=>x&&typeof x==='object'&&!Array.isArray(x),ar=x=>Array.isArray(x),ids=x=>ar(x)&&x.length<=20000&&x.every(i=>typeof i==='string'&&i.length<=40);
if(!ob(o)||!ids(o.bm))return null;const r={bm:o.bm};
for(const k of['fav','learned'])if(k in o){if(!ids(o[k]))return null;r[k]=o[k]}
if('notes' in o){if(!ob(o.notes)||!Object.values(o.notes).every(v=>typeof v==='string'&&v.length<50000))return null;r.notes=o.notes}
for(const k of['sr','pref'])if(k in o){if(!ob(o[k]))return null;r[k]=o[k]}
if('streak' in o){if(!ob(o.streak)||typeof o.streak.n!=='number'||typeof o.streak.last!=='string')return null;r.streak=o.streak}
if('recent' in o){if(!ar(o.recent))return null;r.recent=o.recent}
if('mcq' in o){const m=o.mcq;if(!ob(m))return null;for(const k of['p','o','rd','nt','day'])if(k in m&&!ob(m[k]))return null;for(const k of['bm','hist','rv','ms'])if(k in m&&!ar(m[k]))return null;r.mcq=m}
return r}
function imp(f){if(!f)return;f.text().then(async t=>{let o,r=null;try{o=JSON.parse(t);r=vbk(o)}catch(e){}if(!r){alert('That file is not a valid backup. Nothing was changed.');return}
const ink=o.ink,ann=o.annot;if(ink!==undefined&&!(ink&&typeof ink==='object'&&!Array.isArray(ink))){alert('The handwriting data in that backup is not valid. Nothing was changed.');return}
if(ann!==undefined&&!(typeof Annot!=='undefined'&&Annot.validate(ann))){alert('The handwriting data in that backup is not valid. Nothing was changed.');return}
let prev=null;try{prev=zzStore.getItem('vivaState')}catch(e){}
try{if(prev!==null)zzStore.setItem('vivaStatePrev',prev)}catch(e){}
try{zzStore.setItem('vivaState',JSON.stringify(Object.assign({},S,r)))}catch(e){alert('Could not save the restored data (storage full?). Nothing was changed.');return}
if((ann!==undefined||ink)&&typeof Ink!=='undefined'){try{if(ann!==undefined)await Annot.load(ann);else await Ink.load(ink)}catch(e){try{if(prev===null)zzStore.removeItem('vivaState');else zzStore.setItem('vivaState',prev)}catch(e2){}alert('The handwriting in that backup could not be restored, so the restore was cancelled. Your notes and progress were not changed.');return}}
Object.assign(S,r);save();location.reload()})}"""
s = s.replace("function imp(f){if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!o||!Array.isArray(o.bm))throw 0;Object.assign(S,o);save();location.reload()}catch(e){alert('That file is not a valid backup.')}})}",
 NEWIMP, 1)
_MIG = "const QALIAS=%s;(function(){let ch=0;const mv=(a,x,y)=>{const i=a.indexOf(x);if(i<0)return;a.splice(i,1);if(!a.includes(y))a.push(y);ch=1};for(const x in QALIAS){const y=QALIAS[x];['fav','bm','learned'].forEach(k=>{if(Array.isArray(S[k]))mv(S[k],x,y)});if(S.notes&&S.notes[x]!=null){S.notes[y]=S.notes[y]?S.notes[y]+'\\n'+S.notes[x]:S.notes[x];delete S.notes[x];ch=1}if(S.sr&&S.sr[x]){if(!S.sr[y])S.sr[y]=S.sr[x];delete S.sr[x];ch=1}}if(ch)try{zzStore.setItem('vivaState',JSON.stringify(S))}catch(e){}})();" % json.dumps(ALIAS)
_k0 = "try{S=Object.assign(S,JSON.parse(zzStore.getItem('vivaState')||'{}'))}catch(e){}"
assert _k0 in s
_SAFE = r"""try{const raw=zzStore.getItem('vivaState')||'{}',o=JSON.parse(raw),ty=x=>Array.isArray(x)?'a':x===null?'n':typeof x;let bad=ty(o)!=='object';if(!bad)for(const k in o){if(k==='__proto__')continue;if(k in S&&ty(o[k])!==ty(S[k])){bad=1;continue}S[k]=o[k]}if(bad)try{zzStore.setItem('vivaStateCorrupt',raw)}catch(e){}}catch(e){}"""
s = s.replace(_k0, _SAFE + _MIG, 1)
assert 'Annot.load' in s and 'Annot.dump' in s and 'localeCompare(b))' in s


QMETA = {'parts': [[p[2], p[1], p[0]] for p in PARTS], 'partOf': PART_OF, 'type': written, 'exam': exam, 'tree': TREE, 'alias': ALIAS, 'chapters': [[c, CHAP[c][0], NO('c%d' % c if c != 'P' else '15') if c != 'P' else 'Practical', CHAP[c][1], {s_: RO.topic_order(c, s_) for s_ in CHAP[c][1]}] for c in CH_ORDER]}
QUESTIONS_JS = '\nconst QMETA=%s;\n' % json.dumps(QMETA, ensure_ascii=False) + open(os.path.join(HERE, 'questions.js'), encoding='utf8').read() + '\n'

PART_JS = "const PART_OF=%s;\n" % json.dumps(PART_OF) + r"""(function(){const p=prog;prog=function(){p();const L=new Set(S.learned),T={},N={};DATA.forEach(d=>{const k=PART_OF[d[2]];N[k]=(N[k]||0)+1;if(L.has(d[3]))T[k]=(T[k]||0)+1});document.querySelectorAll('[data-pp]').forEach(r=>{const k=r.dataset.pp,c=N[k]?Math.round(100*(T[k]||0)/N[k]):0;r.style.setProperty('--p',c);r.textContent=c+'%'})};prog();
const ch=document.getElementById('pchips');if(!ch)return;const secs=[...document.querySelectorAll('section.part')],orig=secs.map(x=>[...x.querySelectorAll('.topic')]);let f='all',srt=false;
function apply(){secs.forEach((x,i)=>{x.hidden=f!=='all'&&x.dataset.part!==f;const g=x.querySelector('.grid'),a=orig[i].slice();if(srt)a.sort((u,v)=>v.dataset.n-u.dataset.n||u.getAttribute('href').localeCompare(v.getAttribute('href')));g&&a.forEach(t=>g.append(t))});ch.querySelectorAll('[data-f]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===f));ch.querySelector('[data-sort]').setAttribute('aria-pressed',srt)}
ch.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.f)f=b.dataset.f;else srt=!srt;apply()}})();
"""

UX_JS = r"""
function cardRows(){const by={A:[],B:[]};DATA.forEach(d=>d[0].split(' ').forEach(c=>{const m=/^([AB])\d+$/.exec(c);if(m&&!by[m[1]].includes(c))by[m[1]].push(c)}));
return ['A','B'].map(L=>{const a=by[L].sort((x,y)=>x.slice(1)-y.slice(1));return '<div class="chips" style="padding:0;margin:0 0 12px;max-width:none;flex-wrap:wrap"><span class="mu" style="align-self:center">'+L+'-box cards:</span>'+(a.length?a.map(c=>'<a href="#/b/'+c+'">'+c+'</a>').join(''):'<span class="soon-t">coming soon</span>')+'</div>'}).join('')}
function emptyHTML(k){const EMPTY_UI={bm:['No bookmarks yet','<path d="M6 3h12v18l-6-4-6 4z"/>'],fav:['No favourites yet','<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'],notes:['No notes yet','<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>']};
const u=EMPTY_UI[k]||EMPTY_UI.bm;return '<div class="empty"><svg viewBox="0 0 24 24" aria-hidden="true">'+u[1]+'</svg><b>'+u[0]+'</b><p>'+EMPTY[k].replace(/^No [a-z]+ yet\. /,'')+'</p><a class="pill" href="#/topics">Browse topics</a></div>'}
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
function burst(){if(RM)return;const cs=['#7A1F36','#D98FA8','#0f7a4a','#6B2D5C','#E9A5BB'];for(let i=0;i<26;i++){const e=document.createElement('i');e.className='cf';const a=(Math.random()*160+10)*Math.PI/180,d=120+Math.random()*180;e.style.cssText='--c:'+cs[i%5]+';--x:'+(Math.cos(a)*d*(Math.random()<.5?-1:1)).toFixed(0)+'px;--y:'+(-Math.sin(a)*d).toFixed(0)+'px;--r:'+((Math.random()*720-360)|0)+'deg';document.body.appendChild(e);setTimeout(()=>e.remove(),1400)}}
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
"""
s = re.sub(r'@font-face\{font-family:"(?:Plus Jakarta Sans|Source Sans 3)".*?\}\n?', '', s)
s = s.replace('</style>', CSS + open(os.path.join(HERE, 'theme.css'), encoding='utf8').read() + open(os.path.join(HERE, 'premium.css'), encoding='utf8').read() + '</style>', 1)
H1 = '<h1>Viva Prep —<br>Read.<br>Recall. Answer.</h1>'
assert H1 in s
s = s.replace(H1, '<p class="eyebrow">NMC viva list · Robbins 11th</p><h1>Pathology<em>Read. Recall. Answer.</em></h1>', 1)
STATS = '<div class="stats"><div><b>%d</b><span>Questions</span></div><div><b>%d</b><span>Topics</span></div><div><b>NMC</b><span>Question order</span></div><div><b>11th</b><span>Robbins edition</span></div></div>' % (total, len(order))
T = '<ul id="res"></ul></div></div></div></div><main'
assert T in s
s = s.replace(T, '<ul id="res"></ul></div></div></div>' + STATS + '</div><main', 1)
s = s.replace('content="#000000" media', 'content="#1C1219" media').replace('content="#f7f4f2" media', 'content="#F8F3EE" media')
# the API lives on its own origin when the site is served from GitHub Pages (window.ZZ_API), so connect-src must name it:
# with 'self' alone the browser blocks every sign-in, plan and paid-content request there and the app reads it as offline
CSP = "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://patholo-zzee-app.muhtasimrp74.workers.dev; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'\"><meta name=\"referrer\" content=\"no-referrer\">"
s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + CSP, 1)
POLISH_JS = open(os.path.join(HERE, 'polish.js'), encoding='utf8').read() + '\n' + open(os.path.join(HERE, 'tutorial.js'), encoding='utf8').read() + '\n' + open(os.path.join(HERE, 'motion.js'), encoding='utf8').read()
assert '</script>' not in POLISH_JS
s = s.replace("<script>\nif ('serviceWorker'", '<script>window.TBALIAS=' + open(os.path.join(HERE, 'textbook_block_alias.json'), encoding='utf8').read().strip() + ';</script>\n<script>\n' + POLISH_JS + '\n</script>\n<script src="annot/annot.js"></script>\n<script src="welcome.js" defer></script>\n<script>\nif (\'serviceWorker\'', 1)
assert s.count('</head>') == 1
s = s.replace('</head>', '<link rel="stylesheet" href="annot/annot.css"></head>', 1)
assert 'src="annot/annot.js"' in s and 'annot/annot.css' in s and 'Content-Security-Policy' in s and 'zz-listen' in s

# fix: counts() also matched dashboard elements with data-c="0".."3" and threw on S["0"].length
_C_OLD = "document.querySelectorAll('[data-c]').forEach(e=>{const k=e.dataset.c;"
assert _C_OLD in s
s = s.replace(_C_OLD, "document.querySelectorAll('[data-c=bm],[data-c=fav],[data-c=notes]').forEach(e=>{const k=e.dataset.c;", 1)
# the page's own JS rewrites every .logo's innerHTML at load; keep the wordmark through that
s, _n = re.subn(r"(\.logo'\)\.forEach\(l=>l\.innerHTML='<img[^>]*>)'", lambda m: m.group(1) + '<span class="wm">Patholo<i>_zzee</i></span>\'', s, count=1, flags=re.S)
assert _n == 1
# ---- site name: Patholo_zzee everywhere the visitor can see it
for _old, _new in (('Systemic Pathology Viva Questions with Answers', 'Patholo_zzee'), ('Systemic Pathology Viva', 'Patholo_zzee'),
                   ("'viva-backup-'", "'patholo_zzee-backup-'")):
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
s, nlogo = re.subn(r'(<a class="logo"[^>]*><img[^>]*>)</a>', lambda m: m.group(1) + '<span class="wm">Patholo<i>_zzee</i></span></a>', s, flags=re.S)
assert nlogo >= 1
TR_OLD = 'Blood Vessels</a></div></div><div class="phones">'
assert TR_OLD in s
s = s.replace(TR_OLD, 'Blood Vessels</a></div><p class="trust"><span>Works offline</span><span>Private, stays on your device</span><span>No sign-up</span></p></div><div class="phones">', 1)
SITE = 'https://muhtasimrp74-lab.github.io/Patholo_zzee/'
DESC = '%d pathology questions (viva and written), in NMC order (Robbins 11th). Practice mode, bookmarks, notes and handwriting. Works offline.' % total
META = ('<meta name="description" content="%s"><link rel="canonical" href="%s">'
 '<meta property="og:type" content="website"><meta property="og:site_name" content="Patholo_zzee">'
 '<meta property="og:title" content="Patholo_zzee: Pathology Viva Questions"><meta property="og:description" content="%s">'
 '<meta property="og:url" content="%s"><meta property="og:image" content="%sicons/og-image.png">'
 '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
 '<meta property="og:image:alt" content="Patholo_zzee. Pathology viva questions. Read. Recall. Answer.">'
 '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Patholo_zzee: Pathology Viva Questions">'
 '<meta name="twitter:description" content="%s"><meta name="twitter:image" content="%sicons/og-image.png">') % (DESC, SITE, DESC, SITE, SITE, DESC, SITE)
s = s.replace('<meta name="referrer" content="no-referrer">', '<meta name="referrer" content="no-referrer">' + META, 1)
assert 'og:image' in s
for _t in OLD_CH:  # breadcrumb of the original topic pages: show the Robbins chapter, not 01..15
    s = re.sub(r'(id="v-%s".{0,1500}?All topics</a> / )%s' % (_t, _t), lambda m, _t=_t: m.group(1) + NO(_t), s, count=1, flags=re.S)
for _a, _b in (("BS=[...new Set(DATA.map(d=>d[0]))]", "BS=[...new Set(DATA.flatMap(d=>d[0].split(' ')).filter(Boolean))]"),
               ("DATA.filter(d=>d[0]===b).map(d=>`<div class=\"row nb\">", "DATA.filter(d=>d[0].split(' ').includes(b)).map(d=>`<div class=\"row nb\">"),
               ("DATA.filter(d=>(!b||d[0]===b)&&", "DATA.filter(d=>(!b||d[0].split(' ').includes(b))&&")):
    assert _a in s, _a
    s = s.replace(_a, _b, 1)
# ---- assembly of the page scripts and styles that sit on top of the base page (this replaces ui_patch.py and nav_patch.py,
# which only assembled files by then; the edits to existing application text live in src/index.base.html and questions.js).
# Read modes matter for byte-identical output: files read with newline='' keep their line endings, the others use text mode.
def _asset(name, raw=False): return open(os.path.join(HERE, name), encoding='utf8', newline='' if raw else None).read()
_UI_JS = _asset('ui_upd.js', True) + _asset('home.js') + _asset('pagebanner.js') + _asset('sitefooter.js') + _asset('tabresume.js') + _asset('swupdate.js')
_UI_TAIL = "\n(function(){const d0=dash;dash=function(){d0();if(window.nhRender)nhRender()};const p0=prog;prog=function(){p0();if(window.nhRender)nhRender()};nhRender()})();\n"
assert "\nroute();\n" in s, 'assembly anchor missing: route();'
s = s.replace("\nroute();\n", "\nroute();\n" + _UI_JS + _UI_TAIL, 1)
_k = s.index('.qtools{display:flex;')
s = s[:_k] + _asset('ui_qmode.css', True) + s[_k:]
_k = s.rindex('</style>')
s = s[:_k] + _asset('ui_xm.css', True) + _asset('ui_rings.css', True) + _asset('home.css') + _asset('pagebanner.css') + _asset('sitefooter.css') + _asset('cardpolish.css') + _asset('polish.css') + s[_k:]
_mcq = 'const MCQDATA=' + json.dumps(json.load(open(os.path.join(HERE, 'mcqs.json'), encoding='utf8')), ensure_ascii=False, separators=(',', ':')) + ';\n' + _asset('mcq.js') + '\n'
_A = "const views=[...document.querySelectorAll('.view')]"
assert _A in s, 'assembly anchor missing: views'
s = s.replace(_A, _asset('nav_patch.js', True) + _mcq + _asset('textbook.js') + _A, 1)
s = s.replace('</style>', _asset('nav_patch.css', True) + _asset('textbook.css') + _asset('mcq.css') + _asset('perf.css') + '</style>', 1)
assert '</head><body>' in s
s = s.replace('</head><body>', '</head><body>' + STAR_SPRITE, 1)
# ---- no flash of the old markup: the page's static HTML is rewritten by the big script at the end, so keep the
# body hidden (background stays the theme colour) until that script has built the UI. A failsafe timer reveals it
# anyway if something goes wrong; without JavaScript the class is never added, so the page stays visible.
BOOT_HEAD = ('''<style id="zz-perf">@media (min-width:700px){
/* big screens: drop per-item blur, cheaper bars, no repainting fixed background */
.card header,.qi-h,.card,.qi,.row,.topic,.dc,.pc,.ph,.part-h,.qs-h,.empty,.nh-row a,.nh-g div,.nh-prog,.dp,#nhr,.nh-toc,.qddl,.stats,.pager a{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.nav,.bar,.nh-bar,#bnav,#tools,.toast,.mx-top{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background-color:color-mix(in srgb,var(--bg) 94%,transparent)!important}
.nav,#bnav,#tools{will-change:transform}
#v-home .nh-ch{contain-intrinsic-size:auto 361px}
body{background:var(--bg)!important;background-attachment:scroll!important}
body::after{content:"";position:fixed;inset:0;z-index:-2;pointer-events:none;background:var(--mesh);transform:translateZ(0)}
body::before{mix-blend-mode:normal!important;opacity:.025!important}
.card,.qi,.row,.topic{will-change:auto}}</style><style id="zz-boot-css">@keyframes zzspin{to{transform:rotate(360deg)}}html.zz-boot::after{content:"";position:fixed;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid rgba(122,31,54,.18);border-top-color:#7A1F36;animation:zzspin .8s linear infinite}html.zz-boot body{visibility:hidden}html.zz-boot{background:var(--bg,#F8F3EE)}</style>'''
             '<script>document.documentElement.classList.add("zz-boot");setTimeout(function(){document.documentElement.classList.remove("zz-boot")},8000)</script>')
BOOT_END = '<script>document.documentElement.classList.remove("zz-boot")</script>'
assert s.count('</head><body>') == 1 and s.rstrip().endswith('</body></html>')
SOFT = '<style id="zz-soft">' + open(os.path.join(HERE, 'softui.css'), encoding='utf8').read() + '</style>'
s = s.replace('</head><body>', BOOT_HEAD + SOFT + '</head><body>', 1)
assert s.count('<footer>Patholo_zzee</footer>') == 1
_k = s.rindex('</body>'); s = s[:_k] + '<script>' + _asset('sync.js') + '</script><script>' + _asset('acctui.js') + '</script>' + s[_k:]  # listeners only: end of body
s = s.replace('<footer>Patholo_zzee</footer>', '<footer>Patholo_zzee · <a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="refund.html">Refunds</a> · <button type="button" class="zz-acct" onclick="zzAccountPage()">Account</button></footer>')
s = s.replace('</head><body>', '<style>' + _asset('zz.css') + '</style></head><body><script>(function(h){if(window.ZZ_API===undefined)window.ZZ_API=/(^|\\.)github\\.io$/.test(h)||h==="patholo-zzee.muhtasimrp74.workers.dev"?"https://patholo-zzee-app.muhtasimrp74.workers.dev/":""})(location.hostname)</script><script>window.ZZ_MANIFEST=null</script><script>' + _asset('account.js') + '</script><script>' + _asset('chunks.js') + '</script><script>' + _asset('pay.js') + '</script>', 1)
s = s.rstrip()[:-len('</body></html>')] + BOOT_END + '</body></html>\n'
import re as _re
s = _re.sub(r'<button(?![^>]*\btype=)', '<button type="button"', s)
open(os.path.join(HERE, '..', 'index.html'), 'w', encoding='utf8').write(s)
os.remove(os.path.join(HERE, '_stage.html'))
print('wrote index.html', len(s))

# re-apply viva-style answer emphasis (idempotent; wording is never changed)
import subprocess, sys
# answers keyed by question id (systemic viva + box-viva cards) are not fed by answers.md: apply them first
subprocess.run([sys.executable, os.path.join(HERE, 'apply_answers_by_id.py')], check=True)
subprocess.run([sys.executable, os.path.join(HERE, 'format_answers.py')], check=True)
# merge any numbered lists split into one <ol> per item (idempotent)
subprocess.run([sys.executable, os.path.join(HERE, 'fix_numbering.py')], check=True)
# denser human-style bold/italic (idempotent; wording never changes)
subprocess.run([sys.executable, os.path.join(HERE, 'format_answers2.py')], check=True)
# prose-style emphasis: sentence labels, section words, italic synonyms/hedges (idempotent; wording never changes)
subprocess.run([sys.executable, os.path.join(HERE, 'format_answers3.py')], check=True)
subprocess.run([sys.executable, os.path.join(HERE, 'split_semicolons.py')], check=True)   # semicolon lists -> separate lines (idempotent)
# edits that were made by hand in index.html and exist nowhere else (see apply_hand_edits.py)
subprocess.run([sys.executable, os.path.join(HERE, 'apply_hand_edits.py')], check=True)
# 'From the textbook' link bar on answers that were collected from Robbins (idempotent; must run after every pass that edits answers)
subprocess.run([sys.executable, os.path.join(HERE, 'source_links.py')], check=True)
# the full page becomes index.full.html (gitignored, tests only); gate.py writes the gated index.html, content/ and private-chunks/
os.replace(os.path.join(HERE, '..', 'index.html'), os.path.join(HERE, '..', 'index.full.html'))
import gate; gate.gate()
