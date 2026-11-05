// ---------- sky island look test: gameplay-style direction, HUD, shadows, post FX ----------
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); { const sc = sunL.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.near = 1; sc.far = 200; } sunL.shadow.bias = -.0005; sunL.shadow.normalBias = .03; scene.add(sunL.target);
PLAYER.g.traverse(o => { if (o.isMesh) o.castShadow = true; });
const SUN_DIR = V(120, 220, -260).normalize();
Object.assign(PCOL, { lavap: ['#ffe36e', '#ff9a1f', '#e8521a'], bonemeal: ['#9bff7a', '#5cff4a', '#e0ffd0'], cobp: ['#8e8e92', '#5c5c60', '#b0b0b4'], icep: ['#e6f4ff', '#9cc4f8', '#ffffff'], arrowt: ['#ffffff', '#d8d0c0'] });
const lavaGlow = new THREE.PointLight(0xff8a30, 0, 10, 1.4); scene.add(lavaGlow);
const fillL = new THREE.DirectionalLight(0xdfe8ff, .45); scene.add(fillL); scene.add(fillL.target);
const dropPool = [...Array(6)].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ICON.sapling, transparent: true, alphaTest: .5 })); s.scale.set(.42, .42, 1); s.visible = false; scene.add(s); return s; });
const WY = C0.y + 1, EYEY = WY + EYE;
// ----- island state over time -----
const TREE1 = { x: 19, z: 9 }, LOGB = [34.6, 36.0, 37.4, 39.4], LEAF_T = [39.8, 41.4];
const TREE1C = treeCells(TREE1.x, TREE1.z, WY, 4);
const GEN = { lava: [23, WY, 11], ice: [23, WY, 9], cob: [23, WY, 10] }, T_LAVA = 51.8, T_ICE = 53.2, T_ICEB = 54.6, T_COB = 56.0;
const COB_WIN = [[56.0, 59.4], [60.2, 62.2], [63.0, 999]];
const EXPAND = [[65.4, [17, C0.y, 9]], [66.4, [17, C0.y, 10]], [67.4, [17, C0.y, 11]], [68.4, [16, C0.y, 10]], [75.6, [16, C0.y, 9]], [76.8, [16, C0.y, 11]], [78.0, [15, C0.y, 10]]];
const DAY3_EXTRA = []; for (let x = 13; x <= 16; x++) for (let z = 8; z <= 12; z++) if (!(x === 13 && (z === 8 || z === 12))) DAY3_EXTRA.push([x, C0.y, z, x >= 15 ? 'cobble' : 'dirt']);
const SAP2 = { x: 19, z: 12, plant: 103.0, grow: 104.8 }; const TREE2C = treeCells(SAP2.x, SAP2.z, WY, 5);
const T_TABLE = 45.2, CTAB = [21, WY, 9];
function islandAt(t) {
  const c = new Map(ISLAND_BASE), set = (x, y, z, ty) => c.set(k3(x, y, z), ty);
  TREE1C.forEach(([x, y, z, ty]) => { if (ty === 'log') { const i = y - WY; if (t < LOGB[i]) set(x, y, z, ty); } else { const h = ((x * 7 + y * 13 + z * 5) % 17) / 17; if (t < lerp(LEAF_T[0], LEAF_T[1], h)) set(x, y, z, ty); } });
  if (t >= T_TABLE) set(...CTAB, 'craft');
  if (t >= T_LAVA) set(...GEN.lava, 'lava'); if (t >= T_ICE && t < T_ICEB) set(...GEN.ice, 'ice');
  if (COB_WIN.some(([a, b]) => t >= a && t < b)) set(...GEN.cob, 'cobble');
  EXPAND.forEach(([t0, p]) => { if (t >= t0) set(...p, 'cobble'); });
  if (t >= 101) DAY3_EXTRA.forEach(([x, y, z, ty]) => { if (!c.has(k3(x, y, z))) set(x, y, z, ty); });
  if (t >= SAP2.grow) TREE2C.forEach(([x, y, z, ty]) => { if (!c.has(k3(x, y, z))) set(x, y, z, ty); });
  return c;
}
// ----- inventory / HUD state -----
function hotbar(t) {
  const s = Array(9).fill(null);
  if (t >= 88) s[0] = ['wsword', 1]; if (t >= 46) s[1] = ['wpick', 1];
  if (t >= 28) s[2] = [t < T_LAVA ? 'lavaB' : 'bucket', 1]; if (t >= 29 && t < T_ICE) s[3] = ['ice', 1];
  const cob = (t >= 59.6) + (t >= 62.4) + (t >= 63.6 ? 9 : 0) - EXPAND.filter(([t0]) => t >= t0 && t0 > 64).length; if (t >= 59.6) s[4] = ['cobble', Math.max(1, cob)];
  if (t >= 40.9 && t < SAP2.plant) s[5] = ['sapling', 1]; if (t >= 29.8) s[6] = ['seeds', 3];
  const bones = (t >= 30.6 ? 1 : 0) + (t >= 93.2 ? 2 : 0) - (t >= 104.0) - (t >= 104.6); if (bones > 0) s[7] = ['bone', bones];
  const logs = LOGB.filter(b => t >= b + .55).length; if (logs && t < 43.6) s[8] = ['log', logs]; else if (t >= 43.6 && t < 44.8) s[8] = ['planks', 16]; else if (t >= 44.8 && t < T_TABLE) s[8] = ['craft', 1]; else if (t >= T_TABLE && t < 101) s[8] = ['planks', 8];
  return s;
}
const ITEM_NAME = { wsword: 'Stone Sword', wpick: 'Wooden Pickaxe', lavaB: 'Lava Bucket', bucket: 'Bucket', ice: 'Ice', cobble: 'Cobblestone', sapling: 'Oak Sapling', seeds: 'Wheat Seeds', bone: 'Bone Meal', log: 'Oak Log', planks: 'Oak Planks', craft: 'Crafting Table' };
const SEL = [[0, 4], [32, 4], [43.4, 8], [45.0, 8], [47.5, 2], [53.0, 3], [54.2, 1], [64.6, 4], [79, 4], [88, 0], [102.6, 5], [103.8, 7], [106, 4]];
const selAt = t => { let s = 8; for (const [t0, i] of SEL) if (t >= t0) s = i; return s; };
const hpAt = t => t < 86.4 ? 20 : t < 101 ? 16 + Math.floor(seg(t, 95, 100) * 2) : 20, foodAt = t => t < 60 ? 20 : t < 95 ? 18 : 16, xpAt = t => t < 92 ? 0 : .32;
// ----- direction -----
function fpCam(S, eye, yaw, pitch, fov = 72, o = {}) { S.fp = true; S.player.visible = false; const bob = o.walk ? o.walk : 0; const e = eye.clone(); if (bob) { e.y += Math.abs(Math.cos(bob)) * .055 - .03; e.add(V(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(Math.sin(bob) * .035)); } S.cam = { pos: e, dir: dirFrom(yaw, pitch), fov }; S.fpLook = { yaw, pitch }; }
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z), pitchTo = (a, b) => Math.atan2(b.y - a.y, Math.hypot(b.x - a.x, b.z - a.z));
function mineFX(S, t, t0, t1, cell, kind) { if (t >= t0 && t < t1) { S.target = cell; S.crack = seg(t, t0, t1); S.swing = (t * 4.2) % 1; } if (t >= t1 && t < t1 + .7) S.bursts.push({ type: kind, t0: t1, o: V(cell[0] + .5, cell[1] + .5, cell[2] + .5), n: 26, sp: [1, 3], up: [1, 4], g: 16, life: .7, size: .09, seed: Math.round(t1 * 10), tm: t }); }
function dropFX(S, t, t0, tp, pos, icon) { if (t >= t0 && t < tp) { const k = seg(t, tp - .35, tp); const p = pos.clone().add(V(0, .25 + Math.sin(t * 3) * .08, 0)); if (k > 0 && S.cam) p.lerp(S.cam.pos.clone().add(V(0, -.6, 0)), eInQ(k)); S.drops.push({ p, icon }); } }
function skyState(S, t, ff = false) {
  S.cells = islandAt(t); S.drops = []; S.target = null; S.crack = 0; S.water = []; S.hot = hotbar(t); S.sel = selAt(t); S.hp = hpAt(t); S.food = foodAt(t); S.xp = xpAt(t);
  if (t < 79) envSet(S, 'sky'); else if (t < 80.6) envSet(S, 'sky', 'night', seg(t, 79, 80.6)); else if (t < 100.5) envSet(S, 'night'); else if (t < 101.6) envSet(S, 'night', 'sunset', seg(t, 100.5, 101.6)); else envSet(S, 'sunset', 'sky', seg(t, 101.6, 103));
  S.chestLid = t >= 26.6 && t < 32 ? eOutBack(seg(t, 26.6, 27.0)) * (1 - seg(t, 31.4, 31.9)) : 0;
  S.lavaLit = t >= T_LAVA ? 1 : 0; S.day = t < 101.5 ? 1 : 3;
  // water from the melted ice
  if (t >= T_ICEB) { S.waterBlocks = [[GEN.ice, .88 * clamp((t - T_ICEB) / .3)]]; if (t < T_COB) S.waterBlocks.push([GEN.cob, .5 * seg(t, T_ICEB + .4, T_COB)]); }
  if (t >= T_COB - .1 && t < T_COB + 1.2) S.bursts.push({ type: 'smoke', t0: T_COB, o: V(23.5, WY + .9, 10.5), n: 26, sp: [.3, 1], up: [1, 2.2], drag: 1, life: 1.1, size: .2, seed: 801, tm: t });
  [60.2, 63.0].forEach((tr, i) => { if (t >= tr && t < tr + 1) S.bursts.push({ type: 'smoke', t0: tr, o: V(23.5, WY + .9, 10.5), n: 14, sp: [.2, .8], up: [1, 2], drag: 1, life: .9, size: .16, seed: 810 + i, tm: t }); });
  // skeleton
  if (t >= 83.0 && t < 92.6) { const hurt = [90.4, 91.2, 92.0].some(h => t >= h && t < h + .25); const kb = [90.4, 91.2, 92.0].reduce((a, h) => a + (t > h ? .25 * eOutC(seg(t, h, h + .25)) : 0), 0); S.skel = { pos: V(22.4 + kb, WY, 9.5), yaw: -Math.PI / 2 + .1, draw: Math.max(seg(t, 85.0, 85.8) * (t < 85.8), seg(t, 87.2, 87.8) * (t < 87.8)), hurt, dead: seg(t, 92.0, 92.5), walk: t > 88 && t < 90 ? t * 4 : 0 }; }
  [[85.8, 86.4, V(16.9, EYEY - .2, 10.4)], [87.8, 88.5, V(15.0, EYEY + .3, 11.8)]].forEach(([a, b, to]) => { if (t >= a && t < b) { const k = seg(t, a, b), from = V(22.1, WY + 1.4, 9.5), p = from.clone().lerp(to, k); S.arrow = { p, d: to.clone().sub(from).normalize() }; } });
  if (t >= 92.0 && t < 93.4) S.bursts.push({ type: 'poof', t0: 92.5, o: V(23.1, WY + .8, 9.5), n: 30, sp: [.4, 1.4], up: [.5, 2], drag: 1, life: 1, size: .26, seed: 820, tm: t });
  [90.4, 91.2, 92.0].forEach((h, i) => { if (t >= h && t < h + .6) S.bursts.push({ type: 'crit', t0: h, o: V(22.4, WY + 1.4, 9.5), n: 22, sp: [1.5, 4], up: [0, 3], drag: 2, life: .55, size: .08, seed: 830 + i, tm: t }); });
  if (t >= 86.4) S.hurtT = t < 88 ? 86.4 : null; if (t >= 86.4 && t < 87.4) S.bursts.push({ type: 'crit', t0: 86.4, o: V(16.9, EYEY - .3, 10.4), n: 10, sp: [.5, 2], up: [0, 2], drag: 2, life: .4, size: .06, seed: 840, tm: t });
  // bone meal + growth
  [104.0, 104.6].forEach((tb, i) => { if (t >= tb && t < tb + 1.2) S.bursts.push({ type: 'bonemeal', t0: tb, o: V(SAP2.x + .5, WY + .4, SAP2.z + .5), n: 24, sp: [.3, 1.2], up: [.6, 1.8], drag: 1, life: 1.1, size: .08, seed: 850 + i, tm: t }); });
  if (t >= SAP2.plant && t < SAP2.grow) S.sapling = V(SAP2.x + .5, WY, SAP2.z + .5);
  if (t >= LEAF_T[0] - .2 && t < LEAF_T[1] + .6) for (let i = 0; i < 4; i++) S.bursts.push({ type: 'leafp', t0: LEAF_T[0] + i * .4, o: V(TREE1.x + .5, WY + 3.6, TREE1.z + .5), n: 18, sp: [.5, 2], up: [-1, .5], g: 4, life: 1.2, size: .08, seed: 860 + i, tm: t });
  // ===== shots =====
  const P0 = V(20.5, WY, 10.5);
  if (t < 4) { P(S, V(21.6, WY, 9.6), -2.2, null, {}); const a = .7 + t * .1; S.cam = cam([20.5 + Math.cos(a) * 15, lerp(118, 114, t / 4), 10.5 + Math.sin(a) * 15], [20.5, 108.5, 10.5], 62); }
  else if (t < 7) { const k = eIO(seg(t, 4, 6.2)); fpCam(S, V(18.25, EYEY, 10.5), -Math.PI / 2 + Math.sin(t * 1.3) * .04, lerp(deg(-15), deg(-74), k), 74); }
  else if (t < 10) { P(S, V(18.3, WY, 10.4), -Math.PI / 2, null, {}); S.cam = cam([12.4, 103.2, 15.5], [18.3, 109.6, 10.4], 60); if (t > 8.2) S.overlays.push({ kind: 'pop', t0: 8.2, text: 'HARDCORE', col: '#ff5252' }); }
  else if (t < 18 && !ff) { const shots = [86.6, 56.4, 104.9, 116.5], i = Math.min(3, Math.floor((t - 10) / 2)); skyState(S, shots[i] + (t - 10 - i * 2) * .6, true); S.cut2 = 10 + i * 2; return; }
  else if (t < 25.5) { const atEdge = t >= 21.4 && t < 24.6; const ys = atEdge ? -Math.PI / 2 + .15 : t < 21.4 ? lerp(.4, -1.2, eIO(seg(t, 18.6, 21.4))) : -1.2, pd = seg(t, 21.5, 22.4) - seg(t, 23.6, 24.6); fpCam(S, atEdge ? V(18.3, EYEY, 10.4) : P0.clone().setY(EYEY), ys, lerp(deg(-6), deg(-82), eIO(clamp(pd))) + (pd > .5 ? Math.sin(t * 9) * .015 : 0), 72); if (pd > .2) S.vertigo = pd; }
  else if (t < 32) { const ch = V(21.5, WY + .5, 11.5), e = V(lerp(20.5, 20.9, seg(t, 25.5, 26.4)), EYEY, lerp(10.5, 10.6, seg(t, 25.5, 26.4))); fpCam(S, e, yawTo(e, ch), pitchTo(e, ch), 72, { walk: t < 26.4 ? t * 9 : 0 }); if (t < 26.8) S.target = [21, WY, 11]; if (t > 26.4 && t < 26.8) S.swing = seg(t, 26.4, 26.8); if (t > 27.2) S.overlays.push({ kind: 'chestui', t }); }
  else if (t < 41.5 && !(t >= 35 && t < 37)) { const e = V(19.5, EYEY, 10.85); const lvl = LOGB.findIndex(b => t < b + .1); const ti = lvl < 0 ? 3 : lvl; const tgt = V(19.5, WY + ti + .5, 9.5); const pt = t > 39.6 ? lerp(pitchTo(e, tgt), deg(-28), seg(t, 39.6, 40.4)) : pitchTo(e, tgt); fpCam(S, e, Math.PI + Math.sin(t * .7) * .03, pt, 72);
    LOGB.forEach((b, i) => mineFX(S, t, i ? LOGB[i - 1] + .2 : 33.0, b, [19, WY + i, 9], 'wood')); LOGB.forEach((b, i) => dropFX(S, t, b, b + .55, V(19.5, WY + i + .3, 9.5), 'log')); dropFX(S, t, 40.3, 40.9, V(19.3, WY + .2, 9.8), 'sapling'); }
  else if (t < 37) { P(S, V(19.5, WY, 10.85), Math.PI, null, { use: (t * 4.2) % 1, lookDown: -.2 - seg(t, 35, 37) * .2 }); S.cam = cam([16.3, 111.0, 12.4], [19.4, 110.2, 9.8], 58); LOGB.forEach((b, i) => mineFX(S, t, i ? LOGB[i - 1] + .2 : 33.0, b, [19, WY + i, 9], 'wood')); S.swing = 0; S.target = null; }
  else if (t < 47.5) { const e = V(20.4, EYEY, 10.3), tg = V(21.5, WY + .2, 9.5); fpCam(S, e, yawTo(e, tg), pitchTo(e, tg) - .05, 72); if (t > 43.3) S.overlays.push({ kind: 'craft3', t }); if (t > 44.9 && t < T_TABLE + .05) { S.target = [21, C0.y, 9]; } if (t > 44.9 && t < 45.4) S.swing = seg(t, 44.9, 45.4); if (t >= T_TABLE && t < T_TABLE + .7) S.bursts.push({ type: 'place', t0: T_TABLE, o: V(21.5, WY + .1, 9.5), n: 16, sp: [1, 2.5], up: [1, 3], g: 12, life: .6, size: .08, seed: 870, tm: t }); }
  else if (t < 51.5) { P(S, V(21.4, WY, 10.6), Math.PI / 2, 'lavaB', {}); const a = .55 + (t - 47.5) * .06; S.cam = cam([21 + Math.cos(a) * 9, 113.5, 10 + Math.sin(a) * 9], [21.6, 109, 10], 60); }
  else if (t < 63.5 && !(t >= 55.6 && t < 57.6)) { const e = V(21.55, EYEY, 10.5); const look = t < 54.8 ? (t < 52.6 ? V(23.5, WY + .3, 11.5) : V(23.5, WY + .3, 9.5)) : V(23.5, WY + .4, 10.2); const k = t < 52.6 ? seg(t, 51.2, 51.7) : t < 54.8 ? seg(t, 52.4, 52.9) : seg(t, 54.8, 55.3); fpCam(S, e, yawTo(e, look), pitchTo(e, look), 72);
    if (t > 51.4 && t < 51.8) { S.target = [23, C0.y, 11]; S.swing = seg(t, 51.4, 51.8); } if (t > 52.8 && t < 53.2) { S.target = [23, C0.y, 9]; S.swing = seg(t, 52.8, 53.2); }
    if (t >= T_LAVA && t < T_LAVA + .6) S.bursts.push({ type: 'lavap', t0: T_LAVA, o: V(23.5, WY + .9, 11.5), n: 14, sp: [.4, 1.4], up: [1, 3], g: 10, life: .6, size: .08, seed: 880, tm: t });
    mineFX(S, t, 53.9, T_ICEB, GEN.ice, 'icep'); mineFX(S, t, 58.2, 59.4, GEN.cob, 'cobp'); mineFX(S, t, 61.0, 62.2, GEN.cob, 'cobp'); dropFX(S, t, 59.4, 59.6 + .3, V(23.5, WY + .3, 10.5), 'cobble'); dropFX(S, t, 62.2, 62.7, V(23.5, WY + .3, 10.5), 'cobble'); if (t > 57.6 && t < 60.6) S.overlays.push({ kind: 'pop', t0: 57.6, text: 'INFINITE COBBLE!', col: '#ffd400' }); }
  else if (t < 57.6 && t >= 55.6) { P(S, V(21.55, WY, 10.5), Math.PI / 2, 'wpick', {}); S.cam = cam([25.6, 110.6, 13.0], [23.5, 109.4, 10.2], 52); }
  else if (t < 79 && !(t >= 71.2 && t < 74.2)) { // expanding west, near fall
    let ex, ey = EYEY, yaw = -Math.PI / 2, pitch = deg(-48), walk = 0; const crouch = t >= 71.0;
    if (t < 69.4) { ex = lerp(19.6, 18.35, seg(t, 63.6, 64.6)); const pi = EXPAND.findIndex(([t0]) => t < t0 + .2); const pc = EXPAND[Math.max(0, Math.min(3, pi))][1]; const tg = V(pc[0] + .5, WY - .1, pc[2] + .5); const e = V(ex, ey, 10.5); yaw = yawTo(e, tg); pitch = pitchTo(e, tg); walk = t < 64.6 ? t * 9 : 0;
      EXPAND.slice(0, 4).forEach(([t0, c]) => { if (t > t0 - .45 && t < t0) { S.target = [c[0] + 1, c[1], c[2]]; S.swing = seg(t, t0 - .4, t0); } }); }
    else if (t < 71.2) { const k = seg(t, 69.4, 70.2), back = seg(t, 70.5, 71.0); ex = lerp(18.35, 16.05, k) + back * .6; ey = EYEY - .35 * crouch; pitch = lerp(deg(-40), deg(-80), k) + back * .5 + Math.sin(t * 22) * .02 * (k > .5 && back < 1); yaw = -Math.PI / 2 - .25 * k; walk = k > 0 && k < 1 ? t * 11 : 0; S.vertigo = k * (1 - back * .7); }
    else { ex = 16.65; ey = EYEY - .35; const pi = EXPAND.findIndex(([t0]) => t < t0 + .2); const pc = EXPAND[pi < 4 ? 4 : pi][1]; const tg = V(pc[0] + .5, WY - .1, pc[2] + .5), e = V(ex, ey, 10.5); yaw = yawTo(e, tg); pitch = pitchTo(e, tg); EXPAND.slice(4).forEach(([t0, c]) => { if (t > t0 - .45 && t < t0) { S.target = [c[0] + 1, c[1], c[2]]; S.swing = seg(t, t0 - .4, t0); } }); }
    fpCam(S, V(ex, ey, 10.5), yaw, pitch, 72, { walk }); }
  else if (t < 74.2) { P(S, V(16.65, WY, 10.5), -Math.PI / 2, 'cobble', { lookDown: .9 }, { crouch: 1 }); S.cam = cam([13.4, 106.8, 6.4], [16.6, 109.6, 10.4], 56); }
  else if (t < 101 && !(t >= 86.2 && t < 88.0)) { // night 1
    const kb = t > 86.4 ? .9 * eOutC(seg(t, 86.4, 86.75)) : 0; const charge = seg(t, 88.0, 90.2); let e = V(lerp(17.6 - kb, 21.2, eIO(charge)), EYEY, lerp(10.4, 9.7, charge));
    let yaw = t < 83.2 ? -Math.PI / 2 + Math.sin(t * .4) * .1 : lerp(-Math.PI / 2, Math.PI / 2 - .05, eIO(seg(t, 83.2, 84.0))), pitch = t < 83.2 ? deg(-4) : deg(-2);
    if (t > 93) { yaw = Math.PI / 2; pitch = lerp(deg(-2), deg(-45), seg(t, 92.4, 93)); }
    fpCam(S, e, yaw, pitch, 72 + 6 * (charge > 0 && charge < 1), { walk: (t > 77.6 && t < 79) || (charge > 0 && charge < 1) ? t * 10 : 0 });
    if (t > 90.1 && t < 92.4) S.swing = ((t - 90.1) / .8) % 1; dropFX(S, t, 92.6, 93.3, V(23, WY + .3, 9.5), 'bone'); }
  else if (t < 88.0) { const kb = .9 * eOutC(seg(t, 86.4, 86.75)); P(S, V(17.6 - kb, WY, 10.4), Math.PI / 2, 'cobble', {}); S.cam = cam([19.2, 113.6, 17.4], [19.6, 109.4, 9.8], 56); }
  else if (t < 106) { const e = V(21.6, EYEY, 9.4), tg = V(SAP2.x + .5, t < SAP2.grow ? WY + .2 : WY + 2.2, SAP2.z + .5); fpCam(S, e, yawTo(e, tg), pitchTo(e, tg), 72); if (t > 102.6 && t < SAP2.plant) { S.target = [SAP2.x, C0.y, SAP2.z]; S.swing = seg(t, 102.6, 103.0); } [104.0, 104.6].forEach(tb => { if (t > tb - .3 && t < tb) S.swing = seg(t, tb - .3, tb); }); if (t >= SAP2.grow && t < SAP2.grow + .5) S.treePop = seg(t, SAP2.grow, SAP2.grow + .4); }
  else { P(S, V(20.5, WY, 10.5), Math.PI * .9, 'wsword', {}); const k = eIO(seg(t, 106, 120)); S.cam = cam([lerp(25, 44, k), lerp(112, 128, k), lerp(16, 38, k)], [18.6, lerp(109, 107, k), 10.4], 60); S.fade = seg(t, 118.6, 120); }
  if (S.fp) { S.held = S.hot[S.sel] ? S.hot[S.sel][0] : null; }
}
SCN.skytest = (S, u) => skyState(S, u);
const SKY_EV = [[0.1, 'wind', .4], [8.2, 'boom', .7], ...[10, 12, 14, 16].map(x => [x, 'whoosh', .45]), [21.8, 'heartbeat', .9], [26.7, 'chest', .8], [28.0, 'pop', .4], [29.0, 'pop', .4], [29.8, 'pop', .4], [30.6, 'pop', .4],
  ...[33.2, 33.6, 34.0, 34.4, 34.8, 35.2, 35.6, 36.4, 36.8, 37.2, 37.8, 38.2, 38.6, 39.0].map(x => [x, 'tick', .35]), ...LOGB.flatMap(b => [[b, 'crunch', .8], [b + .55, 'pickup', .5]]), [40.3, 'sparkle', .5], [40.9, 'pickup', .6], [43.6, 'pop', .5], [44.8, 'pop', .5], [45.2, 'thud', .9], [46.0, 'ding', .6],
  [51.8, 'lava', .8], [53.2, 'thud', .7], [54.6, 'glass', .8], [54.7, 'pour', .6], [56.0, 'sizzle', .9], [57.6, 'ding', .7], ...[58.4, 58.8, 59.2, 61.2, 61.6, 62.0].map(x => [x, 'tick', .45]), [59.4, 'crunch', .8], [59.9, 'pickup', .5], [60.2, 'sizzle', .5], [62.2, 'crunch', .8], [62.6, 'pickup', .5], [63.0, 'sizzle', .5],
  [63.8, 'step', .4], [64.2, 'step', .4], ...EXPAND.map(([t0]) => [t0, 'thud', .7]), [69.5, 'step', .5], [69.8, 'step', .5], [70.0, 'gasp', .7], [70.1, 'heartbeat', .8], [70.6, 'whoosh', .4],
  [79, 'riser', .2], [83.4, 'rattle', .8], [85.0, 'bowdraw', .5], [85.8, 'bowshot', .7], [86.4, 'hurt', 1], [87.2, 'bowdraw', .4], [87.8, 'bowshot', .6], [88.3, 'whoosh', .3], ...[88.4, 88.8, 89.2, 89.6, 90.0].map(x => [x, 'step', .45]), [90.4, 'hit', 1], [91.2, 'hit', 1], [92.0, 'hit', 1.1], [92.1, 'rattle', .6], [92.5, 'poof', .6], [93.3, 'pickup', .6],
  [101.6, 'ding', .3], [103.0, 'thud', .5], [104.0, 'sparkle', .5], [104.6, 'sparkle', .5], [104.8, 'pop', .7], [106, 'whoosh', .4]];
window.TIMELINE = { TOTAL, segs: [{ kind: 'skytest', start: 0, dur: TOTAL, ev: SKY_EV }] };
// ----- word-pop captions -----
const WORDCAPS = []; CAPS.forEach(([a, b, s]) => { const words = s.split(' '); const chunks = []; let cur = []; words.forEach(w => { cur.push(w); if (cur.length >= 3 || /[.,!?]$/.test(w)) { chunks.push(cur.join(' ')); cur = []; } }); if (cur.length) chunks.push(cur.join(' ')); const tot = chunks.reduce((x, c) => x + c.length + 4, 0); let tt = a; chunks.forEach(c => { const d = (b - a) * (c.length + 4) / tot; WORDCAPS.push([tt, tt + d, c]); tt += d; }); }); CAPS.splice(0);
// ----- per-frame extras applied after the shared apply() -----
function applyGP(S) {
  const t = S.t;
  if (S.cells) aoMesh(S.cells, islTex, ISL_MATS, islandG); islandG.visible = !!S.cells; clouds.position.y = 62;
  if (S.treePop) { /* growth pop handled by scale on the new tree's cells: subtle; nothing extra */ }
  chestG.visible = !!S.cells; chestG.position.set(21.5, WY, 11.5); chestG.rotation.y = Math.PI; chestLid.rotation.x = -(S.chestLid || 0) * 1.25;
  lavaGlow.intensity = (S.lavaLit || 0) * (S.env === 'night' || S.env2 === 'night' ? 3 : 1.2); lavaGlow.position.set(23.5, WY + 1.2, 11.5);
  waterPool.forEach(w => w.visible = false); (S.waterBlocks || []).forEach(([c, h], i) => { if (h <= .02) return; const m = waterPool[i]; m.visible = true; waterMat.opacity = .72; m.scale.set(1, h, 1); m.position.set(c[0] + .5, c[1] + h / 2, c[2] + .5); });
  const s = S.skel; SKEL.g.visible = !!s && s.dead < 1; if (s) { SKEL.g.position.copy(s.pos); SKEL.g.rotation.set(0, s.yaw, -s.dead * 1.4); const w = s.walk ? Math.sin(s.walk) * .6 : 0; SKEL.legL.rotation.x = w; SKEL.legR.rotation.x = -w; SKEL.armL.rotation.set(-1.45 - s.draw * .1, .2, 0); SKEL.armR.rotation.set(-1.45 + s.draw * .3, -.4 * s.draw, 0); SKEL.g.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.setHex(s.hurt ? 0xaa0000 : 0); }); }
  hlBox.visible = !!S.target && S.fp; if (S.target) hlBox.position.set(S.target[0] + .5, S.target[1] + .5, S.target[2] + .5);
  crackBox.visible = S.crack > 0 && !!S.target; if (crackBox.visible) { crackBox.position.copy(hlBox.position); crackMat.map = CRACKS[Math.min(9, Math.floor(S.crack * 10))]; }
  dropPool.forEach((d, i) => { const o = S.drops && S.drops[i]; d.visible = !!o; if (o) { d.position.copy(o.p); d.material.map = ICON[o.icon]; } });
  if (S.sapling) { const d = dropPool[5]; d.visible = true; d.position.copy(S.sapling).add(V(0, .3, 0)); d.material.map = ICON.sapling; d.scale.set(.7, .7, 1); } else dropPool[5].scale.set(.42, .42, 1);
  if (S.arrow) { const pl = []; for (let i = 0; i < 8; i++) { const p = S.arrow.p.clone().sub(S.arrow.d.clone().multiplyScalar(i * .08)); pl.push(p); } S.arrowPts = pl; }
  window.ISLAND && window.ISLAND.forEach(m => m.visible = false);
  fillL.position.copy(camera.position).add(V(0, 4, 0)); fillL.target.position.copy(camera.position).add(camera.getWorldDirection(V(0, 0, 0)).multiplyScalar(10)); fillL.target.updateMatrixWorld(); fillL.intensity = S.env === 'night' ? .2 : .85;
  if (S.fp && !S.held) { const sx = Math.sin((S.swing || 0) * Math.PI); fpArm.position.set(.5, -.52 + Math.sin(t * 8) * .012, -.7 + sx * .18); fpArm.rotation.set(deg(4) - sx * 1.0, deg(14) - sx * .3, deg(6)); }
  // shadows follow the island; sun direction matches the sun sprite
  const ctr = V(19, WY, 10); sunL.position.copy(ctr).add(SUN_DIR.clone().multiplyScalar(80)); sunL.target.position.copy(ctr); sunL.target.updateMatrixWorld();
  // first-person held block + hurt roll
  fpBlock.visible = S.fp && !!BLOCK_ITEMS[S.held]; if (fpBlock.visible) { fpBlock.material.map = T[BLOCK_ITEMS[S.held]]; fpItem.visible = false; const sx = Math.sin((S.swing || 0) * Math.PI); fpBlock.position.set(.36, -.32 - sx * .05, -.62 + sx * .1); fpBlock.rotation.set(-.2 - sx * .5, .7, 0); }
  if (S.hurtT != null) { const d = t - S.hurtT; if (d >= 0 && d < .5) camera.rotateZ(Math.sin(d * 20) * .06 * (1 - d / .5)); }
  if (S.vertigo) { camera.rotateZ(Math.sin(t * 2.3) * .03 * S.vertigo); camera.fov += 6 * S.vertigo; camera.updateProjectionMatrix(); }
}
// ----- HUD (original art in the style of a survival game HUD) -----
function hudIcon(name, x, y, s) { icon(name, x, y, s); }
function drumstick(x, y, s, full) { const P = ['...XX', '..XmmX', '.XmmmX', 'XmmmX.', 'XbX...', 'Xb....']; P.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; ctx.fillStyle = ch === 'X' ? '#1a0e04' : ch === 'b' ? '#e8e2d0' : (full ? '#b8672c' : '#3a3a3a'); ctx.fillRect(x + i * s, y + j * s, s, s); })); }
function drawHUD(S) {
  const sc = 3.4, w = 182 * sc, x0 = (W - w) / 2, y0 = H - 22 * sc - 14;
  ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x0, y0, w, 22 * sc); ctx.strokeStyle = 'rgba(120,120,120,.9)'; ctx.lineWidth = sc; ctx.strokeRect(x0 + 1, y0 + 1, w - 2, 22 * sc - 2);
  for (let i = 0; i < 9; i++) { const sx = x0 + 3 * sc + i * 20 * sc; ctx.strokeStyle = 'rgba(60,60,60,.9)'; ctx.strokeRect(sx, y0 + 3 * sc, 16 * sc, 16 * sc); const it = S.hot[i]; if (it) { hudIcon(it[0], sx + 8 * sc, y0 + 11 * sc, 15 * sc); if (it[1] > 1) txt(String(it[1]), sx + 16 * sc - 2, y0 + 17 * sc, 26, '#ffffff', { align: 'right', lw: 5, w: 800 }); } }
  const ss = x0 + 3 * sc + S.sel * 20 * sc; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = sc * 1.3; ctx.strokeRect(ss - 2 * sc, y0 + 1 * sc, 20 * sc, 20 * sc);
  // xp bar, hearts, hunger
  const xb = y0 - 7 * sc; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x0, xb, w, 5 * sc); ctx.fillStyle = '#7cff3a'; ctx.fillRect(x0 + sc, xb + sc, (w - 2 * sc) * (S.xp || 0), 3 * sc);
  const hy = xb - 10 * sc; for (let i = 0; i < 10; i++) { const v = S.hp - i * 2; heart(x0 + i * 8 * sc, hy, sc * 1.1, v >= 1); if (v === 1) { ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x0 + i * 8 * sc + 4 * sc, hy + sc, 3.5 * sc, 4 * sc); } }
  for (let i = 0; i < 10; i++) drumstick(x0 + w - (i + 1) * 8 * sc, hy, sc * 1.1, S.food - i * 2 >= 1);
  ctx.restore();
  // crosshair
  ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#ffffff'; ctx.fillRect(W / 2 - 14, H / 2 - 2, 28, 4); ctx.fillRect(W / 2 - 2, H / 2 - 14, 4, 28); ctx.restore();
}
let lastSel = { sel: -1, t: -9, item: null };
function drawItemName(S) { const it = S.hot[S.sel]; const name = it ? ITEM_NAME[it[0]] : null; const t = S.t; const key = S.sel + ':' + (it && it[0]); if (key !== lastSel.key) { lastSel = { key, t }; } }
function selChangeT(t) { let last = 0; for (const [t0] of SEL) if (t >= t0) last = t0; return last; }
function drawOverlaysG(S) {
  const t = S.t;
  for (const o of S.overlays) {
    if (o.kind === 'pop') { const k = eOutBack(seg(t, o.t0, o.t0 + .3)), a = 1 - seg(t, o.t0 + 2.4, o.t0 + 2.8); if (t < o.t0) continue; txt(o.text, W / 2, H * .26, 110, o.col, { scale: Math.max(.01, k), alpha: a, rot: -.04, lw: 18 }); }
    else if (o.kind === 'chestui') { const a = Math.min(seg(t, 27.2, 27.5), 1 - seg(t, 31.4, 31.8)); const items = [[28.0, 'lavaB'], [29.0, 'ice'], [29.8, 'seeds'], [30.6, 'bone']]; ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * .2); ctx.scale(1.35, 1.35); ctx.translate(-W / 2, -H * .2); const pw = 560, ph = 210, px0 = W / 2 - pw / 2, py0 = H * .2; rrect(px0, py0, pw, ph, 10, 'rgba(198,198,198,.96)', '#555', 5); txt('Chest', px0 + 24, py0 + 32, 32, '#404040', { align: 'left', stroke: false, w: 700 });
      for (let i = 0; i < 9; i++) { const sx = px0 + 22 + i * 58, sy = py0 + 62; ctx.fillStyle = '#8b8b8b'; ctx.fillRect(sx, sy, 52, 52); ctx.fillStyle = '#373737'; ctx.fillRect(sx, sy, 52, 3); ctx.fillRect(sx, sy, 3, 52); const it = items[i]; if (it && t < it[0]) hudIcon(it[1], sx + 26, sy + 26, 44); }
      items.forEach(([t0, ic], i) => { if (t >= t0 && t < t0 + .5) { const k = seg(t, t0, t0 + .5); hudIcon(ic, lerp(px0 + 48 + i * 58, W / 2 - 273 + (i + 2) * 60 + 24, eIO(k)), lerp(py0 + 88, H - 47, eIO(k)), 44); } }); ctx.restore(); }
    else if (o.kind === 'craft3') { const steps = [[43.6, 'log', 'planks', 'PLANKS'], [44.8, 'planks', 'craft', 'CRAFTING CTAB'], [46.0, 'craft', 'wpick', 'WOODEN PICKAXE']]; const st = [...steps].reverse().find(s => t >= s[0]); if (!st) continue; const a = Math.min(seg(t, 43.4, 43.7), 1 - seg(t, 47.0, 47.4)), pk = eOutBack(seg(t, st[0], st[0] + .3));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W - 330, H * .42); rrect(-250, -140, 500, 280, 12, 'rgba(198,198,198,.96)', '#555', 5); txt('Crafting', -220, -108, 30, '#404040', { align: 'left', stroke: false, w: 700 });
      ctx.fillStyle = '#8b8b8b'; ctx.fillRect(-200, -70, 120, 120); ctx.fillRect(80, -70, 120, 120); icon(st[1], -140, -10, 96); txt('→', 0, -10, 80, '#555', { stroke: false }); ctx.save(); ctx.translate(140, -10); ctx.scale(pk, pk); icon(st[2], 0, 0, 96); ctx.restore(); txt(st[3], 0, 100, 34, '#404040', { stroke: false }); ctx.restore(); }
  }
  // word-pop captions
  const c = window.SHOW_CAPTIONS ? WORDCAPS.find(([a, b]) => t >= a && t < b + .06) : null; if (c) { const k = eOutBack(seg(t, c[0], c[0] + .12)); const hot = /!|[A-Z]{3,}/.test(c[2]); txt(c[2].toUpperCase(), W / 2, H * .66, 78, hot ? '#ffd400' : '#ffffff', { scale: .7 + .3 * k, lw: 14 }); }
  // day counter (small, top-left)
  if (S.day && t >= 18) { const a = seg(t, 18, 18.4); ctx.save(); ctx.globalAlpha = a; rrect(36, 36, 236, 74, 14, 'rgba(0,0,0,.55)', null); txt('DAY ' + S.day, 154, 75, 44, '#ffffff', { stroke: false }); ctx.restore(); }
  // item name above hotbar for 1.5 s after a slot change
  if (S.fp) { const tc = selChangeT(t), it = S.hot[S.sel]; if (it && t - tc < 1.6) txt(ITEM_NAME[it[0]], W / 2, H - 150, 34, '#ffffff', { alpha: 1 - seg(t, tc + 1.2, tc + 1.6), lw: 6, w: 800 }); }
}
// ----- post: grade, bloom, sun rays, vignette, hurt -----
const small = document.createElement('canvas'); small.width = W / 8; small.height = H / 8; const sctx = small.getContext('2d');
window.renderFrame = function (t, ov) {
  const S = stateAt(t); S.overlays = S.overlays.filter(o => o.kind !== 'daycard'); if (ov) { if (ov.cam) S.cam = cam(ov.cam[0], ov.cam[1], ov.cam[2]); S.fp = false; S.overlays = []; S.cut = null; }
  if (S.arrow) S.trail2 = null; apply(S); applyGP(S);
  const plist = []; for (const b of S.bursts) burstParticles(b, b.tm != null ? b.tm : S.u, plist); (S.arrowPts || []).forEach((p, i) => plist.push([p.x, p.y, p.z, i ? .05 : .08, i ? '#c9a26a' : '#ffffff']));
  const col = new THREE.Color(); for (let i = 0; i < PMAX; i++) { if (i < plist.length) { const [x, y, z, s2, cc] = plist[i]; m4.makeScale(s2, s2, s2).setPosition(x, y, z); col.set(cc); } else m4.makeScale(0, 0, 0); parts.setMatrixAt(i, m4); parts.setColorAt(i, i < plist.length ? col : col.set('#000')); } parts.instanceMatrix.needsUpdate = true; parts.instanceColor.needsUpdate = true;
  renderer.render(scene, camera);
  const night = S.env === 'night' ? 1 : S.env2 === 'night' ? S.envK : (S.env === 'night' && S.env2) ? 1 - S.envK : 0;
  ctx.save(); ctx.filter = `contrast(1.1) saturate(${1.28 - night * .2}) brightness(${1.02})`; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  // bloom: blurred bright copy screened on top
  sctx.filter = 'brightness(1.25) contrast(1.4)'; sctx.drawImage(renderer.domElement, 0, 0, W / 8, H / 8); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .28; ctx.filter = 'blur(14px)'; ctx.drawImage(small, 0, 0, W, H); ctx.restore();
  // sun rays when the sun is on screen
  if (scene.userData.sun.visible && night < .5) { const sp = project(camera.position.clone().add(V(120, 220, -260))); if (sp.vis && sp.x > -400 && sp.x < W + 400 && sp.y > -400 && sp.y < H + 200) { const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 700); g.addColorStop(0, 'rgba(255,240,200,.45)'); g.addColorStop(.3, 'rgba(255,220,160,.12)'); g.addColorStop(1, 'rgba(255,220,160,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  // warm grade + vignette
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = night > .5 ? 'rgba(60,90,200,.25)' : 'rgba(255,190,120,.16)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .42, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (S.hurtT != null) { const d = t - S.hurtT; if (d >= 0 && d < .6) { ctx.fillStyle = `rgba(200,0,0,${.35 * (1 - d / .6)})`; ctx.fillRect(0, 0, W, H); } }
  if (S.vertigo) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.45 * S.vertigo})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  if (S.fade) { ctx.fillStyle = `rgba(0,0,0,${S.fade})`; ctx.fillRect(0, 0, W, H); }
  if (!ov) { if (S.fp) drawHUD(S); drawOverlaysG(S); txt('HollowCraft', W - 40, H - 34, 26, 'rgba(255,255,255,.6)', { align: 'right', lw: 4, w: 800 }); }
  const cutT = S.cut2 ?? S.cut; if (cutT != null) { const d = t - cutT; if (d >= 0 && d < .1) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .1) * .5})`; ctx.fillRect(0, 0, W, H); } }
  if (t < .25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .25})`; ctx.fillRect(0, 0, W, H); }
  return comp.toDataURL('image/jpeg', .92);
};
