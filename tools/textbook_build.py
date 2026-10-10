# -*- coding: utf-8 -*-
"""Textbook (Robbins, cleaned): tools/textbook_src/chNN.json (robbins-clean-v1) -> ../textbook/chNN.html + index.json.
Sections become collapsible panels; KEY CONCEPTS / Morphology / Clinical / Pathogenesis get their own panel styles
(see tools/textbook.css, tools/textbook.js). Run: python3 tools/textbook_build.py  (then bump VERSION in sw.js)"""
import json, glob, os, re, html
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'textbook_src'); OUT = os.path.join(HERE, '..', 'textbook')
MINOR = {'and', 'of', 'the', 'in', 'to', 'for', 'with', 'a', 'an', 'on', 'or', 'by', 'at', 'as', 'from'}
IC_FIG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>'
IC_TAB = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 10h18M9 10v10"/></svg>'
IC_KEY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>'

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    return re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', t)
def tc(s):
    out = []
    for i, w in enumerate(s.split()):
        core = re.sub(r'[^A-Za-z]', '', w); low = core.lower()
        if low in MINOR and i: out.append(w.lower())
        elif len(core) <= 3 and core.isupper(): out.append(w)
        elif w.isupper(): out.append(w[:1] + w[1:].lower())
        else: out.append(w)
    return ' '.join(out)
def kind(t):
    u = t.upper()
    if u.startswith('MORPHOLOGY'): return 'morph'
    if u.startswith('CLINICAL'): return 'clin'
    if u.startswith('PATHOGENESIS'): return 'path'
    if u.startswith(('SELECTED READING', 'ACKNOWLEDG')): return 'refs'
    return 'main'
TAG = {'morph': 'Morphology', 'clin': 'Clinical features', 'path': 'Pathogenesis', 'refs': 'Selected readings'}
JUNK = re.compile(r'^(CHAPTER \d+|[A-Z](\s[A-Z])*)$')

def render(blocks):
    secs = [{'t': None, 'k': 'intro', 'h': []}]; st = {'mode': None, 'last': None}; N = len(blocks)
    add = lambda x: secs[-1]['h'].append(x)
    def close():
        if st['mode']: add('</%s>' % st['mode']); st['mode'] = None
    def pgm(b):
        if b.get('page') and b['page'] != st['last']: st['last'] = b['page']; return '<span class="tbpg">p.%s</span>' % b['page']
        return ''
    i = 0; nfig = ntab = 0
    while i < N:
        b = blocks[i]; t = b['t']; i += 1
        if t == 'hero': continue
        if t == 'h' and b['level'] == 2:
            txt = b['md'].strip()
            if JUNK.match(txt): continue
            close(); secs.append({'t': tc(txt), 'k': kind(txt), 'h': []}); continue
        if t == 'label':
            close(); j = i; items = []
            while j < N:
                x = blocks[j]
                if x['t'] == 'li': items.append(x); j += 1
                elif x['t'] == 'h' and j + 1 < N and blocks[j + 1]['t'] == 'li': items.append(x); j += 1
                else: break
            if any(x['t'] == 'li' for x in items):
                o = ['<aside class="tbkc"><div class="tbkc-t">%s<span>Key concepts</span></div>' % IC_KEY]; inul = False
                for x in items:
                    if x['t'] == 'h':
                        if inul: o.append('</ul>'); inul = False
                        o.append('<h4>%s</h4>' % inline(x['md']))
                    else:
                        if not inul: o.append('<ul>'); inul = True
                        o.append('<li>%s</li>' % inline(x['md']))
                if inul: o.append('</ul>')
                add(''.join(o) + '</aside>'); i = j
            else: add('<div class="tbk">Key concepts</div>')
            continue
        if t in ('li', 'ol'):
            tag = 'ul' if t == 'li' else 'ol'
            if st['mode'] != tag: close(); add('<ul>' if tag == 'ul' else '<ol start="%d">' % b.get('n', 1)); st['mode'] = tag
            add('<li>%s</li>' % inline(b['md'])); continue
        close()
        if t == 'h': add('<h3>%s%s</h3>' % (pgm(b), inline(b['md'])))
        elif t == 'p': add('<p>%s%s</p>' % (pgm(b), inline(b['md'])))
        elif t == 'fig':
            nfig += 1; m = re.match(r'\*\*(Fig\.?\s*[\w.]+)\*\*\s*(.*)', b['md'], re.S)
            head, body = (m.group(1).replace('Fig.', 'Fig').replace('Fig ', 'Figure '), m.group(2)) if m else ('Figure', b['md'])
            add('<figure class="tbf"><div class="tbf-h">%s<b>%s</b></div><figcaption>%s</figcaption></figure>' % (IC_FIG, html.escape(head), inline(body)))
        elif t == 'table':
            ntab += 1; cap = b.get('caption', ''); m = re.match(r'(TABLE\s+[\w.]+)\s*(.*)', cap, re.S)
            num, title = (tc(m.group(1)).replace('Table', 'Table'), m.group(2)) if m else ('Table', cap)
            extra = ''
            if len(title) > 120:
                cut = title.rfind(' ', 0, 120); extra = title[cut:].strip(); title = title[:cut]
            rows = b.get('rows') or []; body = ''
            if rows: body += '<div class="tbt-s"><table>' + ''.join('<tr>%s</tr>' % ''.join(('<th>%s</th>' if k == 0 else '<td>%s</td>') % inline(c or '') for c in r) for k, r in enumerate(rows)) + '</table></div>'
            txt = ' '.join(x for x in (extra, b.get('note') or '') if x)
            if txt: body += '<div class="tbt-n">%s</div>' % inline(txt)
            add('<div class="tbt"><div class="tbt-h">%s<span class="tbt-no">%s</span><span class="tbt-ti">%s</span></div>%s</div>' % (IC_TAB, html.escape(num.title() if num.isupper() else num), inline(title), body))
    close(); return secs, nfig, ntab

def build(ch):
    secs, nfig, ntab = render(ch['blocks']); out = []; toc = []; n = 0; sid = 0
    for s in secs:
        if s['k'] == 'intro':
            if s['h']: out.append('<div class="tbi">%s</div>' % '\n'.join(s['h']))
            continue
        sid += 1; body = '\n'.join(s['h'])
        if s['k'] == 'main':
            n += 1; toc.append((sid, '%02d' % n, s['t']))
            head = '<span class="tbs-n">%02d</span><span class="tbs-t">%s</span>' % (n, html.escape(s['t']))
            out.append('<section class="tbs" data-s="%d"><h2 class="tbs-h" role="button" tabindex="0" aria-expanded="true">%s<span class="tbs-c"></span></h2><div class="tbs-b tb">%s</div></section>' % (sid, head, body))
        else:
            shut = s['k'] == 'refs'
            if shut: toc.append((sid, '↗', s['t'].title() if s['t'] else 'References'))
            head = '<span class="tbs-tag">%s</span>' % TAG[s['k']]
            out.append('<section class="tbs tbs-k tbs-%s%s" data-s="%d"><h2 class="tbs-h" role="button" tabindex="0" aria-expanded="%s">%s<span class="tbs-c"></span></h2><div class="tbs-b tb">%s</div></section>' % (s['k'], ' shut' if shut else '', sid, 'false' if shut else 'true', head, body))
    nav = ''
    if len(toc) > 1:
        nav = '<nav class="tbtoc"><div class="tbtoc-t"><b>In this chapter</b><span>%d sections</span><button type="button" data-all="1">Collapse all</button></div><ol>%s</ol></nav>' % (len(toc), ''.join('<li><a href="javascript:void 0" data-go="%d"><span>%s</span>%s</a></li>' % (a, b, html.escape(c)) for a, b, c in toc))
    words = sum(len(re.sub(r'\*', '', b.get('md', '')).split()) for b in ch['blocks'] if b['t'] in ('p', 'li', 'ol'))
    return nav + '\n'.join(out), {'figs': nfig, 'tables': ntab, 'sections': n, 'min': max(1, round(words / 230))}

os.makedirs(OUT, exist_ok=True); idx = []
for f in sorted(glob.glob(os.path.join(SRC, 'ch*.json'))):
    ch = json.load(open(f, encoding='utf8')); key = os.path.basename(f)[:-5]; h, meta = build(ch)
    open(os.path.join(OUT, key + '.html'), 'w', encoding='utf8').write(h)
    idx.append(dict(id=key, n=ch['chapter_number'], title=ch['title'], pages=ch.get('book_pages'), **meta))
json.dump({'title': 'Robbins Pathologic Basis of Disease', 'chapters': idx}, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'chapters ->', OUT, '| total min', sum(c['min'] for c in idx))
