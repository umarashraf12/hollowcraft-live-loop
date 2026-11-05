# Builds scene.js for the gameplay-look test (sky island).
import os
HERE = os.path.dirname(os.path.abspath(__file__)); VP = '/home/user/hollowcraft-live-loop/video-pipeline'; C2 = '/home/user/hc-work/comp2'; D = '/home/user/hc-work/days'
src = open(f'{VP}/ep2/scene.js').read()
head = src[:src.index('// --- the mine')]; mine = src[src.index('// --- the mine'):src.index('// clouds')]
w3 = open(f'{VP}/ep3/part_world3.js').read(); w3 = w3[:w3.index('// --- Overworld portal site')]
mid = src[src.index('// clouds'):src.index('// ---------- episode 2: extra 3D pieces')]
tc = open(f'{C2}/tail_c.js').read(); tc = tc[:tc.index('CLIPS.sort(')]
head = head.replace('if (x >= MESA.x0 && x <= MESA.x1 && z >= MESA.z0 && z <= MESA.z1) return MESA.top;', '')  # no cliff under the sky island
parts = [head, mine, w3, mid, open(f'{C2}/world_c.js').read(), open(f'{D}/world_d.js').read(), tc, open(f'{HERE}/world_g.js').read(), open(f'{D}/tail_d.js').read(), open(f'{HERE}/tail_g.js').read()]
open(f'{HERE}/scene.js', 'w').write(''.join(parts)); print('scene.js written')
