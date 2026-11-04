# Builds scene.js for the "Top 20 Epic Minecraft Moments" compilation from the shared engine pieces:
#   ep2 scene head (engine, terrain, characters) + mine + ep3 Nether world + ep2 mid (clouds, props) + world_c.js + tail_c.js
import os
HERE = os.path.dirname(os.path.abspath(__file__)); VP = os.path.dirname(HERE)
src = open(f'{VP}/ep2/scene.js').read()
head = src[:src.index('// --- the mine')]
mine = src[src.index('// --- the mine'):src.index('// clouds')]
w3 = open(f'{VP}/ep3/part_world3.js').read(); w3 = w3[:w3.index('// --- Overworld portal site')]
mid = src[src.index('// clouds'):src.index('// ---------- episode 2: extra 3D pieces')]
open(f'{HERE}/scene.js', 'w').write(head + mine + w3 + mid + open(f'{HERE}/world_c.js').read() + open(f'{HERE}/tail_c.js').read())
print('scene.js written')
