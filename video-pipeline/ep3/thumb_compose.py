import sys; sys.path.insert(0, '..')
from thumb_common import *
left = Image.open('h3_0.png').convert('RGB').crop((470, 0, 1520, 1080)).resize((700, 720), Image.LANCZOS)
right = Image.open('h3_1.png').convert('RGB').crop((700, 0, 1750, 1080)).resize((700, 720), Image.LANCZOS)
right = ImageEnhance.Brightness(right).enhance(1.15)
c = split(left, right).convert('RGBA'); L = Image.new('RGBA', (W, H), (0, 0, 0, 0))
text(L, (618, 26), 'NETHERITE', 104, '#ffd400', 12, rot=3)
text(L, (760, 138), 'FAST', 180, '#ffd400', 16, rot=3)
INGOT = ['....XXXXXXXXXX..', '...XllllllllllX.', '..XlwlllllllldX.', '.XllllllllllddX.', 'XXXXXXXXXXXXXXX.', 'XddddddddddddX..', 'XXXXXXXXXXXXX...']
pixel(L, INGOT, {'X': '#141012', 'l': '#6a5e60', 'w': '#b8acae', 'd': '#3b3436'}, (930, 520), 16, glow=(255, 150, 80, 200), rot=8)
tag(L, (40, 600), 'NO DIAMONDS', 58, (229, 57, 53, 255), 'white', rot=-4)
out = Image.alpha_composite(c, L).convert('RGB'); out.save('thumb_ep3.jpg', quality=95); out.resize((320, 180), Image.LANCZOS).save('thumb_ep3_small.jpg')
