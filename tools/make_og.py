#!/usr/bin/env python3
"""Share (Open Graph / Twitter) image: a plain typographic card, 1200x630: logo, name, one line. No photo, no illustration.
Writes icons/og-card.png (the file build.py names in the og:image and twitter:image meta tags). Needs playwright + Chromium.
Usage: python3 tools/make_og.py"""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = open(os.path.join(ROOT, 'icons/logo.svg'), encoding='utf8').read().replace('<svg ', '<svg width="148" height="148" ', 1)
HTML = ('<html><head><meta charset="utf-8"><style>body{margin:0;width:1200px;height:630px;box-sizing:border-box;padding:0 96px;background:#FAFAF9;color:#1B1B1D;'
        'display:flex;flex-direction:column;justify-content:center;font-family:Georgia,"Times New Roman","DejaVu Serif",serif}'
        'svg{display:block;border-radius:24px;margin:0 0 44px}h1{margin:0;font-size:92px;line-height:1.05;font-weight:400;letter-spacing:-.01em}h1 i{color:#7A1F36}'
        'p{margin:26px 0 0;font:400 36px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,"DejaVu Sans",Arial,sans-serif;color:#55555B}'
        'hr{width:96px;height:4px;margin:40px 0 0;border:0;background:#7A1F36}</style></head><body>'
        + LOGO + '<h1>Patholo<i>_zzee</i></h1><p>Pathology viva, written and MCQ revision with answers, in Robbins order.</p><hr></body></html>')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1200, 'height': 630})
    pg.set_content(HTML); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(ROOT, 'icons/og-card.png')); b.close()
print('wrote icons/og-card.png')
