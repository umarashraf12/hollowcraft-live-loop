# Builds scene.js for "I Survived 100 Days in Hardcore Minecraft":
#   ep2 engine head + mine + ep3 Nether world + ep2 mid + compilation world/clips (world_c.js, tail_c.js up to its timeline) + world_d.js + tail_d.js
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
VP = sys.argv[1] if len(sys.argv) > 1 else '/home/user/hollowcraft-live-loop/video-pipeline'
C2 = sys.argv[2] if len(sys.argv) > 2 else f'{VP}/comp2'
src = open(f'{VP}/ep2/scene.js').read()
head = src[:src.index('// --- the mine')]; mine = src[src.index('// --- the mine'):src.index('// clouds')]
w3 = open(f'{VP}/ep3/part_world3.js').read(); w3 = w3[:w3.index('// --- Overworld portal site')]
mid = src[src.index('// clouds'):src.index('// ---------- episode 2: extra 3D pieces')]
tc = open(f'{C2}/tail_c.js').read(); tc = tc[:tc.index('CLIPS.sort(')]
open(f'{HERE}/scene.js', 'w').write(head + mine + w3 + mid + open(f'{C2}/world_c.js').read() + open(f'{HERE}/world_d.js').read() + tc + open(f'{HERE}/tail_d.js').read())
print('scene.js written')
