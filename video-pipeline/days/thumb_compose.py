# Thumbnail for "I Survived 100 Days in Hardcore Minecraft": night-1 dirt hut with zombies (left) | the Ender Dragon (right).
# Hero frames come from the scene via thumb.js (renderFrame(t, {cam}) = no overlays, custom camera).
import sys; sys.path.insert(0, '..')
from thumb_common import *
def pop(im, b): return ImageEnhance.Contrast(ImageEnhance.Color(ImageEnhance.Brightness(im).enhance(b)).enhance(1.35)).enhance(1.15)
left = pop(Image.open('hero_night1.jpg').convert('RGB'), 1.75).crop((230, 40, 1306, 1080)).resize((760, 720), Image.LANCZOS)
right = pop(Image.open('hero_dragon.jpg').convert('RGB'), 1.9).crop((520, 40, 1596, 1080)).resize((760, 720), Image.LANCZOS)
c = split(left, right, x0=640, slope=.18).convert('RGBA'); L = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v = Image.new('L', (W, H), 0); ImageDraw.Draw(v).ellipse((-220, -180, W + 220, H + 180), fill=255)
dark = Image.new('RGBA', (W, H), (0, 0, 0, 255)); dark.putalpha(Image.eval(v.filter(ImageFilter.GaussianBlur(120)), lambda a: int((255 - a) * .5)))
L.alpha_composite(dark)
text(L, (250, 8), '100 DAYS', 165, '#ffd400', 16, rot=0)
tag(L, (120, 205), 'HARDCORE', 60, (229, 57, 53, 255), 'white', rot=-3)
tag(L, (40, 600), 'DAY 1', 54, (20, 20, 20, 235), '#ffffff', rot=3)
tag(L, (950, 600), 'THE END', 54, (120, 40, 180, 255), '#ffffff', rot=-3)
out = Image.alpha_composite(c, L).convert('RGB'); out.save('thumb_days.jpg', quality=95)
