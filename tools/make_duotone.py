# -*- coding: utf-8 -*-
"""Reprints the banner artwork as two-colour plates in the site's haematoxylin-and-eosin palette (deep violet shadows, eosin-pink
lights), the way a stained slide reads. Sources are the full-colour originals as last committed in ORIG; outputs overwrite the files
in ../icons under the same names, so nothing else has to change. To go back to full colour: git checkout ORIG -- icons/<file>.
Run from the repo root:  python3 tools/make_duotone.py"""
import io, os, subprocess
from PIL import Image, ImageOps
ORIG = 'f991333'
HERE = os.path.dirname(os.path.abspath(__file__)); ICONS = os.path.join(HERE, '..', 'icons')
FILES = ['hero-lab.webp', 'hero-lab-m.webp', 'pb-questions.webp', 'pb-questions-900.webp', 'pb-chapters.webp', 'pb-chapters-900.webp',
         'pb-mcqs.webp', 'pb-mcqs-900.webp', 'footer-banner.webp', 'footer-banner-900.webp']
SHADOW, MID, LIGHT = '#1C102F', '#8A3760', '#F8CFDB'
def plate(im):
    g = ImageOps.autocontrast(im.convert('L'), cutoff=(1, 0.5))
    g = g.point(lambda v: int(255 * (v / 255.0) ** 0.82))          # the artwork is night-time dark: lift the midtones a little
    return ImageOps.colorize(g, black=SHADOW, white=LIGHT, mid=MID, midpoint=120)
if __name__ == '__main__':
    for f in FILES:
        raw = subprocess.run(['git', 'show', '%s:icons/%s' % (ORIG, f)], capture_output=True, check=True, cwd=os.path.join(HERE, '..')).stdout
        out = plate(Image.open(io.BytesIO(raw)).convert('RGB'))
        out.save(os.path.join(ICONS, f), 'WEBP', quality=80, method=6)
        print(f, out.size, os.path.getsize(os.path.join(ICONS, f)))
