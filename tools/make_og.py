#!/usr/bin/env python3
"""Share (Open Graph / Twitter) image, 1200x630, in the site's own look: the eosin field with the wordmark and headline in
TAN Buster on the left, the two-colour hero plate on the right. Writes icons/og-card.png (the file build.py names in the og:image
and twitter:image meta tags). Fonts and the plate are read from this repo, nothing is downloaded. Needs playwright + Chromium.
Usage: python3 tools/make_og.py"""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
U = 'file://' + ROOT + '/'
HTML = ('<html><head><meta charset="utf-8"><style>'
        '@font-face{font-family:"TAN Buster";src:url(' + U + 'fonts/tan-buster-bold.woff2)}@font-face{font-family:"Oswald";src:url(' + U + 'fonts/oswald-latin-wght-normal.woff2);font-weight:200 700}'
        '@font-face{font-family:"Tinos";src:url(' + U + 'fonts/tinos-subset-400-normal.woff2)}'
        'body{margin:0;width:1200px;height:630px;display:grid;grid-template-columns:700px 500px;background:#F4B9CA;color:#23153A}'
        '.t{box-sizing:border-box;padding:60px 40px 0 64px}.w{margin:0;font:400 38px/1 "TAN Buster"}'
        'h1{margin:44px 0 0;font:400 56px/1.26 "TAN Buster";letter-spacing:-.005em}'
        'p{margin:30px 0 0;font:400 34px/1.3 "Times New Roman","Tinos",serif}small{display:block;margin:34px 0 0;font:500 26px/1 Oswald;letter-spacing:.03em;color:#4B2B50}'
        '.p{border-left:4px solid #23153A;background:#1C102F url(' + U + 'icons/hero-lab.webp) 58% 18%/cover}</style></head><body>'
        '<div class="t"><p class="w">Patholo_zzee</p><h1>Pathology for viva and written exams</h1>'
        '<p>Questions with full answers, MCQs and the Robbins textbook.</p><small>NMC viva list, Robbins 11th edition</small></div><div class="p"></div></body></html>')
if __name__ == '__main__':
    tmp = os.path.join(ROOT, '.og.html'); open(tmp, 'w', encoding='utf8').write(HTML)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
        pg.goto('file://' + tmp); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(500)
        assert pg.evaluate("document.querySelector('small').getBoundingClientRect().bottom") < 590, 'the text runs off the card'
        pg.screenshot(path=os.path.join(ROOT, 'icons/og-card.png')); b.close()
    os.remove(tmp); print('wrote icons/og-card.png')
