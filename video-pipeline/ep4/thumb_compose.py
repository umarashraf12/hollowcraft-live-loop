import sys; sys.path.insert(0, '..')
from thumb_common import *
left = Image.open('h4_2.png').convert('RGB').crop((300, 0, 1350, 1080)).resize((700, 720), Image.LANCZOS)
right = Image.new('RGB', (700, 720)); rd = ImageDraw.Draw(right)
for y in range(720): rd.line([(0, y), (700, y)], fill=(int(8 + 20 * y / 720), int(70 + 60 * (1 - y / 720)), int(34 + 20 * y / 720)))
c = split(left, right).convert('RGBA'); L = Image.new('RGBA', (W, H), (0, 0, 0, 0))
# light rays behind the emerald
rays = Image.new('RGBA', (W, H), (0, 0, 0, 0)); rdd = ImageDraw.Draw(rays)
import math
for k in range(14):
    a = k * math.pi / 7; rdd.polygon([(980, 430), (980 + 700 * math.cos(a - .09), 430 + 700 * math.sin(a - .09)), (980 + 700 * math.cos(a + .09), 430 + 700 * math.sin(a + .09))], fill=(160, 255, 190, 40))
L.alpha_composite(rays)
EM = ['......XX......', '.....XggX.....', '....XgwggX....', '...XgwggggX...', '..XggggggggX..', '.XggggggggggX.', '.XggggggggggX.', '..XggggggggX..', '...XggggggX...', '....XggggX....', '.....XggX.....', '......XX......']
pixel(L, EM, {'X': '#0b4f2a', 'g': '#2fd06a', 'w': '#d8ffe4'}, (850, 280), 20, glow=(80, 255, 140, 230))
text(L, (650, 44), '1 EMERALD?!', 90, '#2fd06a', 12, rot=3)
tag(L, (800, 600), '9  →  1', 66, (255, 255, 255, 255), '#1b1b1b', rot=-3)
tag(L, (40, 40), 'MENDING', 56, (163, 91, 255, 255), 'white', rot=-4)
out = Image.alpha_composite(c, L).convert('RGB'); out.save('thumb_ep4.jpg', quality=95); out.resize((320, 180), Image.LANCZOS).save('thumb_ep4_small.jpg')
