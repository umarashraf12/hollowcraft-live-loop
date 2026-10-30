import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB').crop((110, 150, 1550, 960)).resize((1280, 720), Image.LANCZOS)
im = ImageEnhance.Color(im).enhance(1.15)
W, H = im.size
F = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
# soft dark gradient on the left for text contrast
grad = Image.new('L', (W, H), 0); gd = ImageDraw.Draw(grad)
for x in range(W): gd.line([(x, 0), (x, H)], fill=int(170 * max(0, 1 - x / (W * .55)) ** 1.4))
im = Image.composite(Image.new('RGB', (W, H), (0, 0, 0)), im, grad)
layer = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
def stroked(xy, text, size, fill, stroke, sw, rot=0, canvas=None):
    f = ImageFont.truetype(F, size)
    l, t, r, b = d.textbbox((0, 0), text, font=f, stroke_width=sw)
    tile = Image.new('RGBA', (r - l + 40, b - t + 40), (0, 0, 0, 0)); td = ImageDraw.Draw(tile)
    # drop shadow
    sh = Image.new('RGBA', tile.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((20 - l + 8, 20 - t + 10), text, font=f, fill=(0, 0, 0, 200), stroke_width=sw, stroke_fill=(0, 0, 0, 200))
    sh = sh.filter(ImageFilter.GaussianBlur(6)); tile.alpha_composite(sh)
    td.text((20 - l, 20 - t), text, font=f, fill=fill, stroke_width=sw, stroke_fill=stroke)
    if rot: tile = tile.rotate(rot, resample=Image.BICUBIC, expand=True)
    layer.alpha_composite(tile, (int(xy[0]), int(xy[1])))
    return tile.size
# red tag
f = ImageFont.truetype(F, 54)
tag = Image.new('RGBA', (360, 110), (0, 0, 0, 0)); tg = ImageDraw.Draw(tag)
tg.rounded_rectangle((6, 6, 354, 104), 16, fill=(229, 57, 53, 255), outline=(0, 0, 0, 255), width=6)
tw = tg.textlength('ILLEGAL?', font=f); tg.text(((360 - tw) / 2, 18), 'ILLEGAL?', font=f, fill='white')
tag = tag.rotate(6, resample=Image.BICUBIC, expand=True); layer.alpha_composite(tag, (46, 40))
# big text
stroked((26, 175), 'ONE', 235, (255, 212, 0, 255), (0, 0, 0, 255), 16, rot=4)
stroked((22, 392), 'HIT?!', 235, (255, 212, 0, 255), (0, 0, 0, 255), 16, rot=4)
# speed lines above the player (smash direction: down)
sl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sl)
for x0, y0, ln, w in [(745, 175, 120, 9), (800, 135, 150, 11), (1060, 190, 130, 10), (1110, 150, 110, 8)]:
    sd.line([(x0 + 30, y0), (x0, y0 + ln)], fill=(255, 255, 255, 235), width=w)
sl = sl.filter(ImageFilter.GaussianBlur(1.2)); layer.alpha_composite(sl)
im = Image.alpha_composite(im.convert('RGBA'), layer).convert('RGB')
im.save(out, quality=95)
im.save(out.replace('.jpg', '.png'))
print(im.size)
