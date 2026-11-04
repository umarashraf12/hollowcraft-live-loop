# Thumbnail for "Top 20 Epic Minecraft Moments": creeper close-up (left) | the house blowing up (right).
# Hero frames come from comp2 scene via thumb.js (renderFrame(t, {cam}) = no overlays, custom camera).
import sys; sys.path.insert(0, '..')
from thumb_common import *
pop = lambda im: ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.4)).enhance(1.12)
cre = pop(Image.open('hero_creeper.jpg').convert('RGB')); hou = pop(Image.open('hero_house.jpg').convert('RGB'))
left = cre.crop((510, 360, 1310, 1080)).resize((800, 720), Image.LANCZOS)   # creeper face fills the left panel
right = hou.crop((330, 160, 1750, 1072)).resize((1120, 720), Image.LANCZOS)
c = split(left, right, x0=600, slope=.2).convert('RGBA'); L = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v = Image.new('L', (W, H), 0); ImageDraw.Draw(v).ellipse((-220, -180, W + 220, H + 180), fill=255)
dark = Image.new('RGBA', (W, H), (0, 0, 0, 255)); dark.putalpha(Image.eval(v.filter(ImageFilter.GaussianBlur(120)), lambda a: int((255 - a) * .55)))
L.alpha_composite(dark)
text(L, (650, 14), 'TOP 20', 160, '#ffd400', 16, rot=-3)
tag(L, (690, 214), 'EPIC MOMENTS', 58, (229, 57, 53, 255), 'white', rot=-3)
tag(L, (1010, 575), '#1 ?!', 76, (255, 212, 0, 255), '#111111', rot=5)
out = Image.alpha_composite(c, L).convert('RGB'); out.save('thumb_comp2.jpg', quality=95); out.resize((320, 180), Image.LANCZOS).save('thumb_comp2_small.jpg')
