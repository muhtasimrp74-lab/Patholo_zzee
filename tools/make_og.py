"""Generates icons/og-image.png (1200x630 social share card). Needs: pip install pillow fonttools brotli"""
import io, os
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageFilter
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
def font(name, size):
    f = TTFont(os.path.join(R, 'fonts', name)); f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    return ImageFont.truetype(buf, size)
W, H = 1200, 630
img = Image.new('RGB', (W, H), '#0b1f3a')
px = img.load()
for y in range(H):
    for x in range(W):
        t = (x / W * .6 + y / H * .4)
        px[x, y] = (int(11 + (0 - 11) * t * .9), int(31 + (71 - 31) * t * .9 + 4), int(58 + (171 - 58) * t * .9))
glow = Image.new('RGB', (W, H), (0, 0, 0)); gd = ImageDraw.Draw(glow)
gd.ellipse((720, -160, 1320, 440), fill=(23, 105, 224)); gd.ellipse((560, 330, 1000, 770), fill=(43, 179, 214))
glow = glow.filter(ImageFilter.GaussianBlur(120))
img = Image.blend(img, Image.composite(glow, img, glow.convert('L')), .55)
d = ImageDraw.Draw(img)
# mark + wordmark
d.rounded_rectangle((80, 74, 140, 134), 16, fill=(255, 255, 255, 0), outline=(255, 255, 255), width=3)
pts = [(2, 9), (6, 9), (11, 20), (15, 4), (17, 9), (22, 9)]
sc = 1.9; ox, oy = 80 + 30 - 12 * sc, 74 + 30 - 12 * sc
d.line([(ox + x * sc, oy + y * sc) for x, y in pts], fill='white', width=4, joint='curve')
f_wm = font('fraunces-latin-500-normal.woff2', 40); f_wi = font('fraunces-latin-400-italic.woff2', 40)
d.text((160, 76), 'Patholo', font=f_wm, fill='white'); d.text((160 + d.textlength('Patholo', font=f_wm) + 2, 76), '_zee', font=f_wi, fill=(143, 179, 242))
# headline
d.text((80, 232), 'Systemic', font=font('fraunces-latin-500-normal.woff2', 128), fill='white')
d.text((80, 352), 'Pathology', font=font('fraunces-latin-500-normal.woff2', 128), fill='white')
d.text((84, 506), 'Read. Recall. Answer.', font=font('fraunces-latin-400-italic.woff2', 44), fill=(143, 179, 242))
# footer line
f = font('inter-latin-500-normal.woff2', 26)
d.line((80, 570, 1120, 570), fill=(255, 255, 255, 60), width=1)
d.text((80, 582), '189 viva questions   ·   NMC order   ·   Robbins 11th   ·   Works offline', font=f, fill=(200, 214, 235))
img.save(os.path.join(R, 'icons', 'og-image.png'), optimize=True)
print('ok')
