# Builds scene.js for the full sky island video.
import os
HERE = os.path.dirname(os.path.abspath(__file__)); VP = '/home/user/hollowcraft-live-loop/video-pipeline'; C2 = '/home/user/hc-work/comp2'; D = '/home/user/hc-work/days'
src = open(f'{VP}/ep2/scene.js').read()
head = src[:src.index('// --- the mine')]; mine = src[src.index('// --- the mine'):src.index('// clouds')]
w3 = open(f'{VP}/ep3/part_world3.js').read(); w3 = w3[:w3.index('// --- Overworld portal site')]
mid = src[src.index('// clouds'):src.index('// ---------- episode 2: extra 3D pieces')]
tc = open(f'{C2}/tail_c.js').read(); tc = tc[:tc.index('CLIPS.sort(')]
def rep(s, a, b):
    assert s.count(a) == 1, a; return s.replace(a, b)
head = rep(head, 'if (x >= MESA.x0 && x <= MESA.x1 && z >= MESA.z0 && z <= MESA.z1) return MESA.top;', '')
wg = rep(open(f'{HERE}/world_g.js').read(), "t === 'ice' ? 'iceB' : t;", "t === 'ice' ? 'iceB' : t === 'farmland' ? (f === 2 ? 'farmland' : 'dirt') : t;")
tg = open(f'{HERE}/tail_g.js').read()
tg = rep(tg, 'apply(S); applyGP(S);', 'apply(S); applyGP(S); if (window.__applyF) window.__applyF(S);')
tg = rep(tg, 'drawOverlaysG(S);', 'drawOverlaysG(S); if (window.__drawF) window.__drawF(S);')
tg = rep(tg, '  for (let i = 0; i < 10; i++) drumstick(', "  if (S.armor) for (let i = 0; i < 10; i++) { const ax = x0 + i * 8 * sc, ay = hy - 9 * sc, q = sc * 1.1; ctx.fillStyle = '#1a1a1a'; ctx.fillRect(ax, ay, 7 * q, 7 * q); ctx.fillStyle = S.armor - i * 2 >= 1 ? '#d8dce0' : '#3a3a3a'; ctx.fillRect(ax + q, ay + q, 5 * q, 5 * q); ctx.fillStyle = 'rgba(255,255,255,.5)'; if (S.armor - i * 2 >= 1) ctx.fillRect(ax + q, ay + q, 2 * q, q); }\n  for (let i = 0; i < 10; i++) drumstick(")
parts = [head, mine, w3, mid, open(f'{C2}/world_c.js').read(), open(f'{D}/world_d.js').read(), tc, wg, open(f'{HERE}/world_f.js').read(), open(f'{D}/tail_d.js').read(), tg, open(f'{HERE}/tail_f.js').read()]
open(f'{HERE}/scene.js', 'w').write(''.join(parts)); print('scene.js written')
