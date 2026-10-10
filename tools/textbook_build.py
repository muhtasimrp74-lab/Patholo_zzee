# -*- coding: utf-8 -*-
"""Textbook (Robbins, cleaned): tools/textbook_src/chNN.json (robbins-clean-v1) -> ../textbook/chNN.html (body fragments)
+ ../textbook/index.json (chapter list). The site loads these on demand from the Textbook tab. Run: python3 tools/textbook_build.py"""
import json, glob, os, re, html
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, 'textbook_src'); OUT = os.path.join(HERE, '..', 'textbook')

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    return re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', t)

def render_blocks(blocks):
    out = []; mode = None; last = None
    def close():
        nonlocal mode
        if mode: out.append('</%s>' % mode); mode = None
    for b in blocks:
        t = b['t']
        if t in ('li', 'ol'):
            tag = 'ul' if t == 'li' else 'ol'
            if mode != tag:
                close(); out.append('<ul>' if tag == 'ul' else '<ol start="%d">' % b.get('n', 1)); mode = tag
            out.append('<li>%s</li>' % inline(b['md'])); continue
        close()
        pg = ''
        if b.get('page') and b['page'] != last and t in ('p', 'h'):
            pg = '<span class="tbpg">p.%s</span>' % b['page']; last = b['page']
        if t == 'hero': continue   # the page header is drawn by the app
        elif t == 'h': out.append('<h%d>%s%s</h%d>' % (b['level'], pg, inline(b['md']), b['level']))
        elif t == 'label': out.append('<div class="tbk">%s</div>' % html.escape(b.get('text') or b.get('md') or ''))
        elif t == 'p': out.append('<p>%s%s</p>' % (pg, inline(b['md'])))
        elif t == 'fig': out.append('<figure>%s</figure>' % inline(b['md']))
        elif t == 'table':
            rows = b.get('rows') or []
            h = '<div class="tbw"><div class="tbc">%s</div>' % inline(b.get('caption', ''))
            if rows:
                h += '<table>' + ''.join('<tr>%s</tr>' % ''.join(('<th>%s</th>' if i == 0 else '<td>%s</td>') % inline(c or '') for c in r) for i, r in enumerate(rows)) + '</table>'
            if b.get('note'): h += '<div class="tbn">%s</div>' % inline(b['note'])
            out.append(h + '</div>')
    close(); return '\n'.join(out)

os.makedirs(OUT, exist_ok=True); idx = []
for f in sorted(glob.glob(os.path.join(SRC, 'ch*.json'))):
    ch = json.load(open(f, encoding='utf8')); key = os.path.basename(f)[:-5]
    open(os.path.join(OUT, key + '.html'), 'w', encoding='utf8').write(render_blocks(ch['blocks']))
    idx.append({'id': key, 'n': ch['chapter_number'], 'title': ch['title'], 'pages': ch.get('book_pages')})
json.dump({'title': 'Robbins Pathologic Basis of Disease', 'chapters': idx}, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'chapters ->', OUT)
