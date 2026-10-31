from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
W, H = 1280, 720
F = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
def text(layer, xy, s, size, fill, sw, rot=0):
    ld = ImageDraw.Draw(layer); f = ImageFont.truetype(F, size); l, t, r, b = ld.textbbox((0, 0), s, font=f, stroke_width=sw)
    tile = Image.new('RGBA', (r - l + 40, b - t + 40), (0, 0, 0, 0)); td = ImageDraw.Draw(tile)
    sh = Image.new('RGBA', tile.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((28 - l, 30 - t), s, font=f, fill=(0, 0, 0, 210), stroke_width=sw, stroke_fill=(0, 0, 0, 210))
    tile.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6))); td.text((20 - l, 20 - t), s, font=f, fill=fill, stroke_width=sw, stroke_fill='black')
    if rot: tile = tile.rotate(rot, resample=Image.BICUBIC, expand=True)
    layer.alpha_composite(tile, (int(xy[0]), int(xy[1]))); return tile.size
def tag(layer, xy, s, size, bg, fg, rot=0, outline='black'):
    f = ImageFont.truetype(F, size); d = ImageDraw.Draw(Image.new('RGB', (1, 1))); w = int(d.textlength(s, font=f)) + 60; h = int(size * 1.6)
    t = Image.new('RGBA', (w + 12, h + 12), (0, 0, 0, 0)); g = ImageDraw.Draw(t)
    g.rounded_rectangle((6, 6, w + 6, h + 6), 16, fill=bg, outline=outline, width=6); g.text((36, (h - size) / 2 - size * .08 + 6), s, font=f, fill=fg)
    if rot: t = t.rotate(rot, resample=Image.BICUBIC, expand=True)
    layer.alpha_composite(t, (int(xy[0]), int(xy[1])))
def pixel(layer, rows, pal, xy, s, glow=None, rot=0):
    g = Image.new('RGBA', (max(len(r) for r in rows) * s, len(rows) * s), (0, 0, 0, 0)); gd = ImageDraw.Draw(g)
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch in pal: gd.rectangle([i * s, j * s, i * s + s - 1, j * s + s - 1], fill=pal[ch])
    out = Image.new('RGBA', (g.width + 80, g.height + 80), (0, 0, 0, 0))
    if glow: gl = Image.new('RGBA', out.size, (0, 0, 0, 0)); gl.paste(Image.new('RGBA', g.size, glow), (40, 40), g); out.alpha_composite(gl.filter(ImageFilter.GaussianBlur(s * 2.2)))
    out.alpha_composite(g, (40, 40))
    if rot: out = out.rotate(rot, resample=Image.BICUBIC, expand=True)
    layer.alpha_composite(out, (int(xy[0]) - 40, int(xy[1]) - 40))
def split(left, right, x0=650, slope=.22):
    canvas = Image.new('RGB', (W, H)); canvas.paste(right, (W - right.width, 0))
    sx = lambda y: x0 + (360 - y) * slope
    mask = Image.new('L', (W, H), 0); ImageDraw.Draw(mask).polygon([(0, 0), (sx(0), 0), (sx(H), H), (0, H)], fill=255)
    full = Image.new('RGB', (W, H)); full.paste(left, (0, 0)); canvas.paste(full, (0, 0), mask)
    d = ImageDraw.Draw(canvas); d.line([(sx(0), 0), (sx(H), H)], fill='black', width=16); d.line([(sx(0), 0), (sx(H), H)], fill='white', width=8)
    return canvas
