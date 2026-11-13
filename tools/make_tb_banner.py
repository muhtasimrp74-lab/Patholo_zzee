#!/usr/bin/env python3
"""Textbook page banner: an original drawing made by this script (no photo, no people, no AI image): a shelf of book spines in
the site's burgundy / rose / cream tones on the dark banner colour, with the left third kept empty for the heading.
Writes icons/pb-textbook.svg (1672 x 940, the size the other page banners use). Deterministic (fixed seed).
Usage: python3 tools/make_tb_banner.py"""
import os, random
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1672, 940
R = random.Random(11)
TONES = ['#7A1F36', '#93304A', '#5B1528', '#A8506A', '#C98FA2', '#E8D9E3', '#2E1F47', '#4A1A28', '#B7A08A', '#8C6A5A']
out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-label="">' % (W, H, W, H),
       '<rect width="%d" height="%d" fill="#1C102F"/>' % (W, H)]

def shelf(y, x0, x1, hmin, hmax):
    """one row of spines standing on a shelf whose top edge is at y"""
    x = x0
    while x < x1:
        w = R.choice([34, 40, 46, 52, 58, 66, 78]); h = R.randint(hmin, hmax); c = R.choice(TONES)
        if x + w > x1: break
        if R.random() < 0.08:   # a gap with a leaning book
            out.append('<g transform="rotate(-9 %d %d)"><rect x="%d" y="%d" width="%d" height="%d" rx="4" fill="%s"/></g>' % (x + w, y, x + 14, y - h, w - 10, h, c))
            x += w + 26; continue
        out.append('<rect x="%d" y="%d" width="%d" height="%d" rx="4" fill="%s"/>' % (x, y - h, w, h, c))
        ink = '#1C102F' if c in ('#E8D9E3', '#C98FA2', '#B7A08A') else '#E8D9E3'
        b = R.randint(26, 60)   # title bands and a small label, drawn as plain bars
        out.append('<rect x="%d" y="%d" width="%d" height="5" fill="%s" opacity=".55"/>' % (x + 7, y - h + b, w - 14, ink))
        out.append('<rect x="%d" y="%d" width="%d" height="5" fill="%s" opacity=".55"/>' % (x + 7, y - h + b + 14, w - 14, ink))
        if w >= 46: out.append('<rect x="%d" y="%d" width="%d" height="%d" rx="2" fill="%s" opacity=".35"/>' % (x + w // 2 - 6, y - h + b + 44, 12, min(120, h - b - 90), ink))
        out.append('<rect x="%d" y="%d" width="%d" height="5" fill="%s" opacity=".4"/>' % (x + 7, y - 34, w - 14, ink))
        x += w + R.choice([3, 4, 6])
    out.append('<rect x="%d" y="%d" width="%d" height="14" fill="#26183C"/>' % (x0 - 40, y, x1 - x0 + 80))
    out.append('<rect x="%d" y="%d" width="%d" height="3" fill="#33234D"/>' % (x0 - 40, y, x1 - x0 + 80))

shelf(300, 860, 1640, 150, 250)
shelf(610, 820, 1640, 170, 270)
shelf(920, 860, 1640, 170, 270)
out.append('</svg>')
open(os.path.join(ROOT, 'icons/pb-textbook.svg'), 'w', encoding='utf8').write('\n'.join(out) + '\n')
print('wrote icons/pb-textbook.svg')
