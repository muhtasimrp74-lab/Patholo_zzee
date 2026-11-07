"""Original, procedurally drawn 'micrograph' art for the Chapters cards (icons/ch/<id>.webp). No downloads, no licences:
each chapter gets a seeded drawing in a style that fits its subject. Run: python3 tools/gen_chapter_art.py"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = 152, 456
OUT = os.path.join(os.path.dirname(__file__), '..', 'icons', 'ch')
STYLE = {'c2': 'he', 'c3': 'inflam', 'c4': 'blood', 'c5': 'genes', 'c6': 'immune', 'c7': 'neo', 'c9': 'env', 'c30': 'lab', 'c13': 'immune',
         'c14': 'blood', '01': 'vessel', '02': 'muscle', '03': 'immune', '04': 'lung', '05': 'glands', '06': 'liver', '07': 'glom', '08': 'glands',
         '09': 'glands', 'c23': 'ducts', '10': 'colloid', '11': 'skin', '12': 'bone', '13': 'neuro', '14': 'eye', '15': 'he'}
PINK, LILAC, PURPLE, DEEP = (238, 176, 198), (214, 170, 214), (92, 52, 140), (58, 30, 96)
def grain(im, r):
    a = np.asarray(im).astype(np.int16); a += np.random.default_rng(r.randrange(1 << 30)).integers(-9, 10, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
def blob(d, x, y, rx, ry, fill, outline=None, w=1, rot=0.0, jag=0.18, r=None):
    n = 14; pts = []
    for i in range(n):
        t = 2 * math.pi * i / n; k = 1 + (r.uniform(-jag, jag) if r else 0)
        px, py = rx * k * math.cos(t), ry * k * math.sin(t)
        pts.append((x + px * math.cos(rot) - py * math.sin(rot), y + px * math.sin(rot) + py * math.cos(rot)))
    d.polygon(pts, fill=fill, outline=outline, width=w)
def draw(style, r):
    bg = {'blood': (248, 222, 220), 'neo': (214, 128, 160), 'env': (214, 206, 120), 'lab': (200, 150, 60), 'neuro': (18, 26, 58), 'lung': (250, 236, 240),
          'liver': (206, 140, 130), 'bone': (248, 238, 236), 'immune': (226, 196, 230), 'genes': (246, 234, 244)}.get(style, PINK)
    im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
    rnd = lambda a, b: r.uniform(a, b)
    if style in ('he', 'inflam', 'neo'):
        for _ in range(170): blob(d, rnd(0, W), rnd(0, H), rnd(10, 18), rnd(8, 14), (244, 196, 214), (220, 140, 172), 1, rnd(0, 3), r=r)
        for _ in range(150 if style == 'neo' else 110):
            s = rnd(5, 11) if style == 'neo' else rnd(3, 5.5); blob(d, rnd(0, W), rnd(0, H), s, s * rnd(.7, 1), DEEP if style == 'neo' else PURPLE, rot=rnd(0, 3), jag=.35 if style == 'neo' else .12, r=r)
        if style == 'inflam':
            for _ in range(40):
                x, y = rnd(0, W), rnd(0, H); [d.ellipse([x + dx - 3, y + dy - 3, x + dx + 3, y + dy + 3], fill=DEEP) for dx, dy in ((0, 0), (5, 2), (2, 6))]
    elif style == 'blood':
        for _ in range(120):
            x, y, s = rnd(0, W), rnd(0, H), rnd(9, 14); d.ellipse([x - s, y - s, x + s, y + s], fill=(196, 40, 52)); d.ellipse([x - s * .45, y - s * .45, x + s * .45, y + s * .45], fill=(226, 92, 98))
    elif style == 'immune':
        for _ in range(140):
            x, y, s = rnd(0, W), rnd(0, H), rnd(7, 11); d.ellipse([x - s - 3, y - s - 3, x + s + 3, y + s + 3], fill=(236, 214, 240)); d.ellipse([x - s, y - s, x + s, y + s], fill=(110, 60, 160))
    elif style == 'genes':
        for _ in range(46):
            x, y, l, a = rnd(10, W - 10), rnd(10, H - 10), rnd(10, 20), rnd(0, 3)
            for s in (-1, 1):
                d.line([(x - l * math.cos(a), y - l * math.sin(a) * s), (x + l * math.cos(a), y + l * math.sin(a) * s)], fill=(120, 60, 170), width=6)
    elif style == 'env':
        for _ in range(70):
            x, y, s = rnd(0, W), rnd(0, H), rnd(8, 16); d.ellipse([x - s, y - s, x + s, y + s], fill=(70, 120, 70), outline=(40, 80, 50), width=2)
            for _ in range(6): a = rnd(0, 6.3); d.ellipse([x + s * math.cos(a) - 2, y + s * math.sin(a) - 2, x + s * math.cos(a) + 2, y + s * math.sin(a) + 2], fill=(200, 210, 110))
    elif style == 'lab':
        g = Image.linear_gradient('L').resize((W, H)); im = Image.composite(Image.new('RGB', (W, H), (232, 190, 110)), Image.new('RGB', (W, H), (170, 110, 40)), g); d = ImageDraw.Draw(im)
        cx, cy = W / 2, H * .62; d.polygon([(cx - 14, cy - 90), (cx + 14, cy - 90), (cx + 14, cy - 40), (cx + 52, cy + 40), (cx - 52, cy + 40), (cx - 14, cy - 40)], outline=(255, 248, 236), width=5)
        d.line([(cx - 22, cy - 92), (cx + 22, cy - 92)], fill=(255, 248, 236), width=5); d.polygon([(cx - 30, cy + 2), (cx + 30, cy + 2), (cx + 46, cy + 34), (cx - 46, cy + 34)], fill=(255, 236, 200))
    elif style == 'vessel':
        cx, cy = W / 2, H / 2
        for k, c in ((70, (226, 150, 176)), (58, (244, 196, 214)), (46, (214, 128, 160)), (36, (252, 240, 244))): d.ellipse([cx - k, cy - k * 1.2, cx + k, cy + k * 1.2], fill=c)
        for _ in range(16): x, y = cx + rnd(-24, 24), cy + rnd(-30, 30); d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=(196, 40, 52))
        for _ in range(60): a = rnd(0, 6.3); rr = rnd(40, 66); d.ellipse([cx + rr * math.cos(a) - 2.5, cy + rr * 1.2 * math.sin(a) - 2.5, cx + rr * math.cos(a) + 2.5, cy + rr * 1.2 * math.sin(a) + 2.5], fill=PURPLE)
    elif style == 'muscle':
        for y0 in range(-20, H + 20, 18):
            pts = [(x, y0 + 6 * math.sin(x / 22 + y0)) for x in range(-10, W + 10, 6)]; d.line(pts, fill=(222, 120, 150), width=12); d.line(pts, fill=(240, 170, 192), width=3)
        for _ in range(50): x, y = rnd(0, W), rnd(0, H); d.ellipse([x - 7, y - 2.5, x + 7, y + 2.5], fill=PURPLE)
    elif style in ('lung', 'glands', 'ducts', 'colloid', 'glom'):
        if style != 'lung':
            for _ in range(160): blob(d, rnd(0, W), rnd(0, H), rnd(10, 16), rnd(8, 12), (244, 196, 214), (226, 160, 186), 1, rnd(0, 3), r=r)
        for _ in range({'lung': 40, 'glands': 16, 'ducts': 12, 'colloid': 18, 'glom': 7}[style]):
            x, y = rnd(0, W), rnd(0, H); s = rnd(14, 24) if style != 'glom' else rnd(20, 28)
            fill = {'lung': (255, 250, 252), 'glands': (255, 246, 248), 'ducts': (255, 246, 248), 'colloid': (240, 150, 182), 'glom': (252, 238, 242)}[style]
            d.ellipse([x - s, y - s, x + s, y + s], fill=fill, outline=(214, 128, 160), width=3)
            if style == 'glom': d.ellipse([x - s * .7, y - s * .7, x + s * .7, y + s * .7], fill=(150, 80, 170))
            for k in range(14 if style != 'lung' else 3):
                a = 2 * math.pi * k / 14 + rnd(0, .2); d.ellipse([x + (s + 3) * math.cos(a) - 2.5, y + (s + 3) * math.sin(a) - 2.5, x + (s + 3) * math.cos(a) + 2.5, y + (s + 3) * math.sin(a) + 2.5], fill=PURPLE)
        if style == 'ducts':
            for _ in range(14): x, y, s = rnd(0, W), rnd(0, H), rnd(10, 18); d.ellipse([x - s, y - s, x + s, y + s], fill=(255, 255, 255), outline=(230, 200, 210))
    elif style == 'liver':
        for k in range(26):
            a = 2 * math.pi * k / 26; d.line([(W / 2, H / 2), (W / 2 + 300 * math.cos(a), H / 2 + 300 * math.sin(a))], fill=(232, 176, 166), width=8)
        for _ in range(120): x, y = rnd(0, W), rnd(0, H); d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(90, 50, 120))
        d.ellipse([W / 2 - 10, H / 2 - 10, W / 2 + 10, H / 2 + 10], fill=(255, 244, 240))
    elif style == 'skin':
        for y in range(0, H, 2):
            t = y / H; c = (int(244 - 30 * t), int(200 - 90 * t), int(214 - 40 * t)) if t < .55 else (int(214 - 60 * (t - .55)), int(110 - 30 * (t - .55)), int(170 - 20 * (t - .55)))
            d.line([(0, y + 4 * math.sin(y / 9)), (W, y + 4 * math.sin(y / 9 + 1))], fill=c, width=3)
        for _ in range(110): x, y = rnd(0, W), rnd(H * .3, H); d.ellipse([x - 3, y - 2.5, x + 3, y + 2.5], fill=DEEP)
    elif style == 'bone':
        for _ in range(16):
            x, y = rnd(0, W), rnd(0, H); pts = [(x, y)]
            for _ in range(5): x, y = x + rnd(-30, 30), y + rnd(-30, 30); pts.append((x, y))
            d.line(pts, fill=(232, 140, 168), width=int(rnd(10, 16)), joint='curve')
        for _ in range(140): x, y = rnd(0, W), rnd(0, H); d.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5], fill=PURPLE)
    elif style == 'neuro':
        for _ in range(16):
            x, y = rnd(0, W), rnd(0, H)
            for _ in range(6):
                px, py = x, y
                for _ in range(5): nx, ny = px + rnd(-26, 26), py + rnd(-26, 26); d.line([(px, py), (nx, ny)], fill=(90, 150, 230), width=2); px, py = nx, ny
            d.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(150, 200, 255)); d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 140, 190))
    elif style == 'eye':
        bands = [(236, 170, 196), (120, 70, 160), (246, 206, 222), (110, 60, 150), (240, 190, 210), (80, 40, 110)]
        for i, c in enumerate(bands): d.rectangle([0, i * H / 6, W, (i + 1) * H / 6], fill=c)
        for _ in range(240): x, y = rnd(0, W), rnd(0, H); d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(70, 30, 110) if (int(y / (H / 6)) % 2 == 0) else (220, 170, 230))
    im = im.filter(ImageFilter.GaussianBlur(.7)); return grain(im, r)
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); tot = 0
    for cid, st in STYLE.items():
        r = random.Random('zz-' + cid); p = os.path.join(OUT, cid + '.webp'); draw(st, r).save(p, 'WEBP', quality=58, method=6); tot += os.path.getsize(p)
    print('chapter art:', len(STYLE), 'images,', tot // 1024, 'KB')
