# -*- coding: utf-8 -*-
"""Builds every logo asset (SVG + PNG icons + share image) from the traced vector paths in tools/logo/.
Needs: fonttools, brotli, playwright (chromium). Run: python3 tools/make_logo.py"""
import os, io
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
P = open(os.path.join(HERE, 'logo/P.d')).read(); GOLD = open(os.path.join(HERE, 'logo/gold.d')).read()
W = 663; R = 118  # square size and corner radius (artboard units)

def text_path(txt, x0, x1, base, asc_h, font='fonts/hanken-grotesk-latin-400-normal.woff2'):
    f = TTFont(os.path.join(ROOT, font)); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    lh = SVGPathPen(gs); gs[cmap[ord('l')]].draw(lh)
    ymax = TTFont(os.path.join(ROOT, font))['glyf'][cmap[ord('l')]].yMax
    sc = asc_h / ymax
    adv = [f['hmtx'][cmap[ord(c)]][0] for c in txt]
    nat = sum(adv) * sc; track = ((x1 - x0) - nat) / (len(txt) - 1)
    d = []; x = x0
    for c, a in zip(txt, adv):
        pen = SVGPathPen(gs); gs[cmap[ord(c)]].draw(TransformPen(pen, (sc, 0, 0, -sc, x, base)))
        d.append(pen.getCommands()); x += a * sc + track
    return ''.join(d)
# measured from the reference: text spans x 95..578, baseline y 568, ascender height 48 (artboard units)
TEXT = text_path('Patholozzee', 95.5, 578, 566, 48)

DEFS = '''<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#56111F"/><stop offset=".55" stop-color="#47101E"/><stop offset="1" stop-color="#3B0B17"/></linearGradient>
<linearGradient id="gd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B98B50"/><stop offset=".45" stop-color="#D6AE68"/><stop offset="1" stop-color="#C3975A"/></linearGradient>
<linearGradient id="cr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8EBD5"/><stop offset="1" stop-color="#EBDABE"/></linearGradient>
<filter id="sh" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="3" stdDeviation="4.5" flood-color="#14030a" flood-opacity=".45"/></filter></defs>'''
def art(text=True, rounded=True, scale=1.0, mark_only=False):
    bg = '<rect width="%d" height="%d"%s fill="url(#bg)"/>' % (W, W, ' rx="%d"' % R if rounded else '')
    body = '<g filter="url(#sh)"><path d="%s" fill="url(#gd)"/><path d="%s" fill="url(#cr)"/></g>' % (GOLD, P)
    if text and not mark_only: body += '<path d="%s" fill="#F3E6CF"/>' % TEXT
    if mark_only: tf = 'translate(%.1f %.1f) scale(1.2) translate(-340.5 -287)' % (W / 2, W / 2)
    else: tf = 'translate(%.2f %.2f) scale(%.3f) translate(%.2f %.2f)' % (W / 2, W / 2 + 2.5 * scale, scale, -W / 2, -W / 2 - 2.5)
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" role="img" aria-label="Patholozzee">%s%s<g transform="%s">%s</g></svg>' % (W, W, DEFS, bg, tf, body)
def write(path, s): open(os.path.join(ROOT, path), 'w', encoding='utf8').write(s)
write('icons/logo.svg', art(True, True))                 # full logo (with name)
write('icons/favicon.svg', art(mark_only=True))          # mark only: favicon, header
write('icons/_maskable.svg', art(True, False, .74)); write('icons/_apple.svg', art(True, False, .93))

from playwright.sync_api import sync_playwright
def png(pg, svg_file, out, size, transparent=True):
    svg = open(os.path.join(ROOT, svg_file), encoding='utf8').read()
    pg.set_viewport_size({'width': size, 'height': size})
    pg.set_content('<html><body style="margin:0;background:transparent"><div style="width:%dpx;height:%dpx">%s</div></body></html>' % (size, size, svg.replace('<svg ', '<svg width="%d" height="%d" ' % (size, size), 1)))
    pg.screenshot(path=os.path.join(ROOT, out), omit_background=transparent, clip={'x': 0, 'y': 0, 'width': size, 'height': size})
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(device_scale_factor=1)
    for s, n in ((192, 'icons/icon-192.png'), (512, 'icons/icon-512.png')): png(pg, 'icons/logo.svg', n, s)
    for s in (192, 512): png(pg, 'icons/_maskable.svg', 'icons/icon-maskable-%d.png' % s, s, False)
    png(pg, 'icons/_apple.svg', 'icons/apple-touch-icon.png', 180, False)
    png(pg, 'icons/favicon.svg', 'icons/favicon-32.png', 32); png(pg, 'icons/favicon.svg', 'icons/favicon-16.png', 16)
    png(pg, 'icons/logo.svg', 'icons/logo-1024.png', 1024)
    # share image 1200x630
    logo = open(os.path.join(ROOT, 'icons/logo.svg'), encoding='utf8').read().replace('<svg ', '<svg width="470" height="470" ', 1)
    fonts = ''.join('@font-face{font-family:"%s";font-weight:%s;src:url("file://%s/fonts/%s.woff2")}' % (n, w, ROOT, f) for n, w, f in (('DM Serif Display', 400, 'dm-serif-display-latin-400-normal'), ('Hanken Grotesk', 400, 'hanken-grotesk-latin-400-normal'), ('Hanken Grotesk', 600, 'hanken-grotesk-latin-600-normal'), ('Caveat', 700, 'caveat-latin-700-normal')))
    html = '<html><head><style>%s body{margin:0;width:1200px;height:630px;background:radial-gradient(900px 600px at 18%% 30%%,#5e1424,#2c0711 70%%);font-family:"Hanken Grotesk";color:#F3E6CF;display:flex;align-items:center;gap:64px;padding:0 90px;box-sizing:border-box}h1{font:400 92px/1 "DM Serif Display";margin:0 0 18px}p{margin:0;font:400 34px/1.35 "Hanken Grotesk";color:#E4D3B8}.h{font:700 54px "Caveat";color:#D6AE68;margin-top:26px}.s{filter:drop-shadow(0 18px 40px rgba(0,0,0,.5))}</style></head><body><div class="s">%s</div><div><h1>Patholozzee</h1><p>257 pathology viva and written<br>questions with answers, in NMC order.</p><div class="h">Read. Recall. Answer.</div></div></body></html>' % (fonts, logo)
    tmp = os.path.join(ROOT, '_og.html'); open(tmp, 'w', encoding='utf8').write(html)
    pg.set_viewport_size({'width': 1200, 'height': 630}); pg.goto('file://' + tmp); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(600); os.remove(tmp)
    pg.screenshot(path=os.path.join(ROOT, 'icons/og-image.png')); b.close()
for f in ('icons/_maskable.svg', 'icons/_apple.svg'): os.remove(os.path.join(ROOT, f))
print('logo assets built')
