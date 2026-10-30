import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
mine_src, dive_src, out = sys.argv[1:4]
W, H = 1280, 720
F = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
mine = Image.open(mine_src).convert('RGB').crop((195, 0, 1245, 1080)).resize((700, 720), Image.LANCZOS)
mine = ImageEnhance.Brightness(mine).enhance(1.15)
dive = Image.open(dive_src).convert('RGB').crop((560, 0, 1610, 1080)).resize((700, 720), Image.LANCZOS)
canvas = Image.new('RGB', (W, H)); canvas.paste(dive, (580, 0))
split = lambda y: 650 + (360 - y) * .22           # slanted divider x position at row y
mask = Image.new('L', (W, H), 0); md = ImageDraw.Draw(mask)
md.polygon([(0, 0), (split(0), 0), (split(H), H), (0, H)], fill=255)
canvas.paste(Image.new('RGB', (W, H)), (0, 0), mask)
full_mine = Image.new('RGB', (W, H)); full_mine.paste(mine, (0, 0)); canvas.paste(full_mine, (0, 0), mask)
d = ImageDraw.Draw(canvas)
d.line([(split(0), 0), (split(H), H)], fill='black', width=16); d.line([(split(0), 0), (split(H), H)], fill='white', width=8)
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
# pixel diamonds flying out of the ore
P = ['.....XXXXX......', '....XccwcX......', '...XccwwccX.....', '..XcccwccccX....', '..XXXXXXXXXX....', '...XcccccccX....', '....XcccccX.....', '.....XcccX......', '......XcX.......', '.......X........']
def gem(x, y, s, rot=0):
    g = Image.new('RGBA', (16 * s, 12 * s), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for j, r in enumerate(P):
        for i, ch in enumerate(r):
            if ch != '.': gd.rectangle([i * s, j * s, i * s + s - 1, j * s + s - 1], fill={'X': '#0e4f4b', 'w': '#e8fffd', 'c': '#4fe3d8'}[ch])
    glow = g.filter(ImageFilter.GaussianBlur(s * 1.5)); g2 = Image.new('RGBA', g.size); g2.alpha_composite(glow); g2.alpha_composite(g)
    g2 = g2.rotate(rot, resample=Image.BICUBIC, expand=True); layer.alpha_composite(g2, (int(x), int(y)))
for x, y, s, r in [(420, 300, 9, -12), (520, 430, 7, 15), (120, 470, 6, 20), (300, 560, 8, -8)]: gem(x, y, s, r)
def text(xy, s, size, fill, sw, rot=0):
    f = ImageFont.truetype(F, size); l, t, r, b = ld.textbbox((0, 0), s, font=f, stroke_width=sw)
    tile = Image.new('RGBA', (r - l + 40, b - t + 40), (0, 0, 0, 0)); td = ImageDraw.Draw(tile)
    sh = Image.new('RGBA', tile.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((28 - l, 30 - t), s, font=f, fill=(0, 0, 0, 210), stroke_width=sw, stroke_fill=(0, 0, 0, 210))
    tile.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); td.text((20 - l, 20 - t), s, font=f, fill=fill, stroke_width=sw, stroke_fill='black')
    if rot: tile = tile.rotate(rot, resample=Image.BICUBIC, expand=True)
    layer.alpha_composite(tile, (int(xy[0]), int(xy[1])))
text((22, 18), '3 TRICKS', 150, '#ffd400', 14, rot=3)
# cyan Y -58 tag on the mine side
tag = Image.new('RGBA', (300, 104), (0, 0, 0, 0)); tg = ImageDraw.Draw(tag)
tg.rounded_rectangle((6, 6, 294, 98), 18, fill=(0, 0, 0, 220), outline=(79, 227, 216, 255), width=6)
f = ImageFont.truetype(F, 60); tw = tg.textlength('Y -58', font=f); tg.text(((300 - tw) / 2, 12), 'Y -58', font=f, fill='#4fe3d8')
layer.alpha_composite(tag.rotate(-4, resample=Image.BICUBIC, expand=True), (40, 590))
canvas = Image.alpha_composite(canvas.convert('RGBA'), layer).convert('RGB')
canvas.save(out, quality=95); canvas.resize((320, 180), Image.LANCZOS).save(out.replace('.jpg', '_small.jpg'))
