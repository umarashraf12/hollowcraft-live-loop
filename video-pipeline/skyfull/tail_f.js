// ---------- full sky island video: island history, sections, extras ----------
const SST = k => SEGS.find(s => s.kind === k).start;
const FEV = [];
const evAt = (k, u, cells, op = 'add') => cells.forEach(c => FEV.push([SST(k) + u, op, ...c]));
const evSpread = (k, u0, u1, cells, op = 'add') => { const n = cells.length; cells.forEach((c, i) => FEV.push([SST(k) + lerp(u0, u1, n > 1 ? i / (n - 1) : 0), op, ...c])); };
const Y0 = C0.y; // 108 = top block layer, players stand on 109
// --- farm (days 4-12)
const FARMLAND = IW_CELLS.map(([x, z]) => [x, Y0, z, 'farmland']);
const F_TILL = FARMLAND.map((_, i) => 6.5 + i * .55);
FARMLAND.forEach((c, i) => evAt('g_farm', F_TILL[i], [c])); evAt('g_farm', 11.0, [[14, Y0, 10]], 'del');
// --- house
const H_FLOOR = []; for (let x = 17; x <= 23; x++) for (let z = 12; z <= 19; z++) if (!ISLAND_BASE.has(k3(x, Y0, z))) H_FLOOR.push([x, Y0, z, 'cobble']);
const H_WALL = []; for (let y = Y0 + 1; y <= Y0 + 3; y++) for (let x = 18; x <= 22; x++) for (let z = 14; z <= 18; z++) { const edge = x === 18 || x === 22 || z === 14 || z === 18; if (!edge) continue; if (z === 14 && x === 20 && y <= Y0 + 2) continue; if (y === Y0 + 2 && (x === 18 || x === 22) && z === 16) continue; H_WALL.push([x, y, z, (x === 18 || x === 22) && (z === 14 || z === 18) ? 'log' : 'cobble']); }
const H_ROOF = []; for (let x = 17; x <= 23; x++) for (let z = 13; z <= 19; z++) H_ROOF.push([x, Y0 + 4, z, 'planks']);
evSpread('g_farm', 38.5, 45.5, H_FLOOR); evSpread('g_farm', 46, 59, H_WALL.sort((a, b) => a[1] - b[1])); evSpread('g_farm', 59.5, 66, H_ROOF);
// --- mob farm (days 13-20): bridge, kill floor, shaft pillars, dark spawning box
const MF = { x0: 2, x1: 11, z0: 6, z1: 15, y: Y0 + 20, hx: [6, 7], hz: [10, 11] };
const MF_BRIDGE = []; for (let x = 9; x <= 12; x++) MF_BRIDGE.push([x, Y0, 10, 'cobble']); for (let x = 4; x <= 8; x++) for (let z = 8; z <= 12; z++) MF_BRIDGE.push([x, Y0, z, 'cobble']);
const MF_SHAFT = []; for (let y = Y0 + 2; y < MF.y; y++) for (const [x, z] of [[5, 9], [8, 9], [5, 12], [8, 12]]) MF_SHAFT.push([x, y, z, 'cobble']);
const MF_BOX = []; for (let x = MF.x0; x <= MF.x1; x++) for (let z = MF.z0; z <= MF.z1; z++) { const hole = MF.hx.includes(x) && MF.hz.includes(z); if (!hole) MF_BOX.push([x, MF.y, z, 'stone']); const edge = x === MF.x0 || x === MF.x1 || z === MF.z0 || z === MF.z1; if (edge) { MF_BOX.push([x, MF.y + 1, z, 'cobble']); MF_BOX.push([x, MF.y + 2, z, 'cobble']); } MF_BOX.push([x, MF.y + 3, z, 'stone']); }
evSpread('g_mob', 15, 20, MF_BRIDGE); evSpread('g_mob', 20, 27, MF_SHAFT.sort((a, b) => a[1] - b[1])); evSpread('g_mob', 27, 37, MF_BOX.sort((a, b) => a[1] - b[1]));
// --- creeper hole (day 30) and repair
const HOLE = [[15, Y0, 9], [16, Y0, 9], [15, Y0, 10], [16, Y0, 10], [17, Y0, 10], [16, Y0, 11], [15, Y0, 11]];
evAt('g_mob', 91.2, HOLE, 'del'); HOLE.forEach((c, i) => evAt('g_mob', 108 + i * .5, [[...c, 'cobble']]));
// --- dripstone lava farm + portal (days 31-35)
const DRIP_C = [[24, Y0, 12, 'cobble'], [25, Y0, 12, 'cobble'], [24, Y0, 13, 'cobble'], [25, Y0, 13, 'cobble'], [26, Y0, 13, 'cobble'], [26, Y0 + 1, 13, 'cobble'], [26, Y0 + 2, 13, 'cobble'], [26, Y0 + 3, 13, 'cobble'], [25, Y0 + 3, 13, 'cobble'], [25, Y0 + 4, 13, 'lava']];
evSpread('g_nether', 1.5, 6.5, DRIP_C);
const P_PLAT = []; for (let x = 17; x <= 22; x++) for (const z of [6, 7]) P_PLAT.push([x, Y0, z, 'cobble']);
const P_FRAME = []; for (let x = 18; x <= 21; x++) { P_FRAME.push([x, Y0 + 1, 6, 'obsidian']); P_FRAME.push([x, Y0 + 5, 6, 'obsidian']); } for (let y = Y0 + 2; y <= Y0 + 4; y++) { P_FRAME.push([18, y, 6, 'obsidian']); P_FRAME.push([21, y, 6, 'obsidian']); }
P_FRAME.sort((a, b) => a[1] - b[1] || a[0] - b[0]); evSpread('g_nether', 15.5, 16.5, P_PLAT); const P_T = P_FRAME.map((_, i) => 17.5 + i * .85); P_FRAME.forEach((c, i) => evAt('g_nether', P_T[i], [c]));
// --- castle (days 61-70) on an eastern platform
const CA_PLAT = []; for (let x = 24; x <= 31; x++) for (let z = 1; z <= 9; z++) CA_PLAT.push([x, Y0, z, 'cobble']); for (const z of [8, 9]) CA_PLAT.push([23, Y0, z, 'cobble']);
const CA = []; for (let y = Y0 + 1; y <= Y0 + 13; y++) for (let x = 25; x <= 29; x++) for (let z = 2; z <= 6; z++) { const edge = x === 25 || x === 29 || z === 2 || z === 6; if (!edge) continue; if (y === Y0 + 13 && (x + z) % 2) continue; const win = (y === Y0 + 6 || y === Y0 + 10) && (x === 27 || z === 4); if (win) continue; if (z === 6 && x === 27 && y <= Y0 + 2) continue; CA.push([x, y, z, 'stonebrick']); }
for (let y = Y0 + 1; y <= Y0 + 3; y++) for (let x = 24; x <= 31; x++) { if (x >= 25 && x <= 29) continue; if (y === Y0 + 3 && x % 2) continue; CA.push([x, y, 8, 'stonebrick']); }
for (const y of [Y0 + 5, Y0 + 9]) for (let x = 26; x <= 28; x++) for (let z = 3; z <= 5; z++) CA.push([x, y, z, 'planks']);
evSpread('g_ender', 37, 44, CA_PLAT); evSpread('g_ender', 44, 70, CA.sort((a, b) => a[1] - b[1] || a[0] - b[0]));
// --- digging down through the island to the hidden portal (day 80)
const DIG = [[20, Y0, 10], [20, Y0 - 1, 10], [20, Y0 - 2, 10], [20, Y0 - 3, 10], [20, Y0 - 4, 10]], DIG_T = [104.6, 106.4, 108.2, 110.0, 111.8];
DIG.forEach((c, i) => evAt('g_ender', DIG_T[i], [c], 'del'));
// --- egg pedestal (day 100)
evAt('g_final', 4.0, [[22, Y0 + 1, 8, 'obsidian']]);
FEV.sort((a, b) => a[0] - b[0]);
let BASE110 = null;
function islandFull(T) { if (T < 110) return islandAt(T); if (!BASE110) BASE110 = islandAt(110); const c = new Map(BASE110); for (const e of FEV) { if (e[0] > T) break; const key = k3(e[2], e[3], e[4]); if (e[1] === 'add') c.set(key, e[5]); else c.delete(key); } return c; }
// wheat growth on the island farm
const W_PLANT = IW_CELLS.map((_, i) => 12.4 + i * .35), W_HARV = IW_CELLS.map((_, i) => 25.4 + i * .45), W_HARV2 = IW_CELLS.map((_, i) => 86.2 + i * .45);
function wheatG(T, i) { const f = SST('g_farm'), m = SST('g_mob'); if (T < f + W_PLANT[i]) return 0; if (T < f + W_HARV[i]) return .08 + .92 * clamp((T - f - 15) / 8); if (T < m + W_HARV2[i]) return Math.min(1, .1 + (T - f - W_HARV[i]) / 40); return Math.min(1, .1 + (T - m - W_HARV2[i]) / 40); }
// ----- common per-frame base -----
const TORCH_T = TORCH_SPOTS.map((_, i) => SST('g_mob') + 113 + i * .6);
function F_base(S, T, day) {
  S.cells = islandFull(T); S.drops = []; S.target = null; S.crack = 0; S.lavaLit = 1; S.day = day; S.T = T;
  S.waterBlocks = [[GEN.ice, .88]]; if (T >= SST('g_farm') + 11.0) S.waterBlocks.push([[14, Y0, 10], .88 * clamp((T - SST('g_farm') - 11.0) / .3)]);
  S.wheat = IW_CELLS.map((_, i) => wheatG(T, i)); S.torchN = TORCH_T.filter(t => T >= t).length;
  S.hp = 20; S.food = 18; S.xp = Math.min(1, .35 + (T - 110) / 900); S.armor = T >= SST('g_mob') + 70 ? 15 : 0;
  S.caul = T >= SST('g_nether') + 6.5 ? clamp((T - SST('g_nether') - 7) / 7) : -1; S.iPortal = T >= SST('g_nether') + 33.6 ? clamp((T - SST('g_nether') - 33.6) / .4) : 0;
  S.egg2 = T >= SST('g_final') + 4.5;
}
const HOTS = {
  farm: T => [['wsword', 1], ['wpick', 1], ['bucketW', 1], ['cobble', 32], T >= SST('g_farm') + 30 ? ['bread', 6] : null, ['seeds', 7], ['bone', 1], ['hoe', 1], ['planks', 24]],
  mob: T => [[T >= SST('g_mob') + 70 ? 'sword' : 'wsword', 1], ['spick', 1], ['bucket', 1], ['cobble', 64], ['bread', 9], ['hoe', 1], ['bone', 4], T >= SST('g_mob') + 111 ? ['torch', 32] : null, ['pearl', T >= SST('g_mob') + 58 ? 1 : 0]].map(x => x && x[1] === 0 ? null : x),
  nether: T => [['sword', 1], ['spick', 1], [T < SST('g_nether') + 15 ? 'bucket' : 'lavaB', 1], ['cobble', 64], ['bread', 9], ['flint', 1], ['obsI', 2], ['torch', 30], T >= SST('g_nether') + 96 ? ['rod', 1 + (T >= SST('g_nether') + 104) * 3] : null],
  ender: T => [['sword', 1], ['spick', 1], ['bucket', 1], ['cobble', 64], ['bread', 9], ['rod', 4], ['pearl', Math.min(12, 1 + Math.floor(clamp((T - SST('g_ender') - 11) / 11) * 11))], ['torch', 30], ['stoneB', 64]],
  dragon: T => [['sword', 1], ['bow', 1], ['bucketW', 1], ['cobble', 64], ['bread', 9], null, null, ['torch', 30], T >= SST('g_dragon') + 86 ? ['egg', 1] : null],
};
const ITEM_NAME2 = { sword: 'Iron Sword', spick: 'Stone Pickaxe', hoe: 'Wooden Hoe', bread: 'Bread', torch: 'Torch', pearl: 'Ender Pearl', flint: 'Flint and Steel', obsI: 'Obsidian', rod: 'Blaze Rod', bow: 'Bow', stoneB: 'Stone Bricks', egg: 'Dragon Egg', bucketW: 'Water Bucket' }; Object.assign(ITEM_NAME, ITEM_NAME2);
function orbitCam(S, ctr, r, h, a, fov = 60) { S.cam = cam([ctr.x + Math.cos(a) * r, ctr.y + h, ctr.z + Math.sin(a) * r], [ctr.x, ctr.y, ctr.z], fov); }
function fpLookAt(S, e, tg, fov = 72, o = {}) { fpCam(S, e, yawTo(e, tg), pitchTo(e, tg), fov, o); }
const swingOn = (S, u, t0, d = .35) => { if (u > t0 - d && u < t0) S.swing = seg(u, t0 - d, t0); };
// ===================== HOOK =====================
SCN.g_hook = (S, u) => {
  if (u < 10) { skyState(S, u, true); return; }
  const shots = [['g_dragon', 61.0], ['g_nether', 87.4], ['g_ender', 71.0], ['g_mob', 91.0]], i = Math.min(3, Math.floor((u - 10) / 2));
  SCN[shots[i][0]](S, shots[i][1] + (u - 10 - i * 2) * .7); S.cut2 = 10 + i * 2; S.overlays = S.overlays.filter(o => o.kind !== 'bossbar' && o.kind !== 'speed'); S.day = null;
};
SCN.g_act1 = (S, u) => skyState(S, u + 18);
// ===================== FARM + HOUSE + ZOMBIES (days 4-12) =====================
SCN.g_farm = (S, u) => {
  const T = SST('g_farm') + u; F_base(S, T, u < 33 ? 4 : u < 76 ? 6 : 9); S.hot = HOTS.farm(T); S.sel = u < 11 ? 7 : u < 12.4 ? 2 : u < 25 ? 5 : u < 33 ? 4 : u < 76 ? 3 : 0;
  if (u < 74) envSet(S, 'sky'); else if (u < 77) envSet(S, 'sky', 'night', seg(u, 74, 77)); else envSet(S, 'night');
  if (u < 15) { const e = V(16.2, EYEY, 10.5), i = Math.max(0, F_TILL.findIndex(t => u < t + .2)), c = FARMLAND[Math.min(i, FARMLAND.length - 1)]; const tg = u < 6 ? V(13.8, WY - .2, 10.5) : u < 11 ? V(c[0] + .5, WY - .2, c[2] + .5) : u < 12.4 ? V(14.5, WY - .3, 10.5) : V(IW_CELLS[Math.min(6, Math.floor((u - 12.4) / .35))][0] + .5, WY - .2, IW_CELLS[Math.min(6, Math.floor((u - 12.4) / .35))][1] + .5); fpLookAt(S, e, tg);
    F_TILL.forEach((t, j) => { swingOn(S, u, t); if (u > t - .4 && u < t) S.target = [FARMLAND[j][0], Y0, FARMLAND[j][2]]; }); swingOn(S, u, 11.0); W_PLANT.forEach(t => swingOn(S, u, t, .25)); }
  else if (u < 25) { P(S, V(15.8, WY, 10.5), -Math.PI / 2, 'seeds', {}); orbitCam(S, V(14, Y0 + 1, 10.4), 7.5, 4.2, 1.2 + (u - 15) * .08, 56); S.overlays.push({ kind: 'pill', text: 'TIMELAPSE', col: '#1565c0', t0: 15 }); }
  else if (u < 33) { const e = V(15.6, EYEY, 10.5), j = Math.min(6, Math.max(0, Math.floor((u - 25.2) / .45))), tg = V(IW_CELLS[j][0] + .5, WY + .2, IW_CELLS[j][1] + .5); fpLookAt(S, e, u < 28.8 ? tg : V(14, WY + .4, 10.5)); W_HARV.forEach((t, k) => { swingOn(S, u, t, .3); if (u >= t && u < t + .7) S.bursts.push({ type: 'wheatp', t0: t, o: V(IW_CELLS[k][0] + .5, WY + .5, IW_CELLS[k][1] + .5), n: 10, sp: [.6, 2], up: [1, 3], g: 12, life: .7, size: .08, seed: 900 + k, tm: u }); }); if (u > 29.2) S.overlays.push({ kind: 'craftF', u, t0: 29.2, steps: [[29.2, 'wheat', 'bread', 'BREAD']] }); }
  else if (u < 38) { const e = V(21.7, EYEY, lerp(10.4, 11.6, seg(u, 33, 34.4))); fpLookAt(S, e, V(21.2, WY - .4, 16.5), 72, { walk: u < 34.4 ? u * 9 : 0 }); }
  else if (u < 68) { P(S, V(20.5, WY, 12.4), Math.PI * .1, 'cobble', { use: (u * 5) % 1 }); orbitCam(S, V(20.4, Y0 + 2, 15.8), 13, 6.5, 1.0 + (u - 38) * .07, 58); S.overlays.push({ kind: 'pill', text: 'TIMELAPSE', col: '#1565c0', t0: 38 }); }
  else if (u < 76) { const k = seg(u, 68, 72.5), e = V(20.5, EYEY, lerp(12.4, 16.6, eIO(k))); fpCam(S, e, 0, deg(-4), 72, { walk: k > 0 && k < 1 ? u * 9 : 0 }); S.torchIn = 1; }
  else { // night 9: two zombies on the island
    const z1d = 90.2, z2d = 101.2, Z1 = V(16.4, WY, 10.6), Z2s = V(22.6, WY, 9.4);
    const z2p = u < 92.4 ? Z2s.clone().lerp(V(17.4, WY, 10.0), eIO(seg(u, 86, 92.4))) : V(17.4, WY, 10.0).add(V(-.4 * seg(u, 99.6, 101.2), 0, 0));
    S.mobs = []; if (u < z1d + .6) S.mobs.push(zom(Z1.clone().add(V(u < 84 ? lerp(-2, 0, seg(u, 77, 84)) : 0, 0, 0)), u, z1d, Math.PI / 2)); if (u < z2d + .6) S.mobs.push(zom(z2p, u, z2d, -Math.PI / 2 - .2));
    const kb = u > 93.0 ? 1.1 * eOutC(seg(u, 93.0, 93.35)) : 0; let e = V(lerp(20.5, 17.6, eIO(seg(u, 79, 84))) - kb, EYEY, lerp(13.4, 10.6, seg(u, 79, 84)));
    if (u >= 93.5 && u < 96.5) { P(S, e.clone().setY(WY), Math.PI / 2, 'wsword', {}); S.cam = cam([12.0, 112.4, 13.8], [16.2, 109.8, 10.2], 58); }
    else { const tg = u < 91 ? Z1.clone().add(V(0, 1.5, 0)) : u < 93.6 ? V(15.0, EYEY, 10.4) : z2p.clone().add(V(0, 1.5, 0)); const lookBack = u >= 91 && u < 93.6 ? lerp(yawTo(e, Z1), yawTo(e, z2p), seg(u, 92.0, 92.8)) : yawTo(e, tg); fpCam(S, e, lookBack, pitchTo(e, tg), 72, { walk: (u > 79 && u < 84) ? u * 9 : 0 }); }
    [88.6, 89.4, 90.2, 99.6, 100.4, 101.2].forEach(h => swingOn(S, u, h, .3)); [88.6, 89.4, 90.2].forEach((h, i) => { if (u >= h && u < h + .5) S.bursts.push({ type: 'crit', t0: h, o: Z1.clone().add(V(0, 1.4, 0)), n: 18, sp: [1.5, 4], up: [0, 3], drag: 2, life: .5, size: .08, seed: 910 + i, tm: u }); });
    if (u > 93 && u < 93.6) S.hurtT = T - u + 93.0; S.hurtT = u > 93 && u < 94 ? 93.0 : null; if (S.hurtT != null) S.hurtT = u >= 93 ? (S.t - u + 93.0) : null; S.hp = u < 93 ? 20 : 14;
    dropFX(S, u, 101.6, 104.0, z2p.clone().add(V(0, .2, 0)), 'iron'); if (u > 104.0 && u < 107) S.overlays.push({ kind: 'pop', t0: 104.0, text: 'IRON!', col: '#e8eef2' }); if (u > 104) S.hot[8] = ['iron', 1]; if (u > 104.4) S.sel = 8;
    if (u >= 110) { P(S, V(17.6, WY, 10.6), Math.PI * .6, 'iron', {}); orbitCam(S, V(18, Y0 + 2, 13), lerp(12, 22, seg(u, 110, 125)), lerp(4, 9, seg(u, 110, 125)), 2.4 + (u - 110) * .04, 58); S.torchIn = 1; }
  }
};
// ===================== MOB FARM + IRON + CREEPER (days 13-30) =====================
const MOB_FALL = [41.2, 44.0, 46.8, 49.6, 52.4, 55.2], MOB_KIND = ['zombie', 'zombie', 'skel', 'zombie', 'skel', 'ender'];
SCN.g_mob = (S, u) => {
  const T = SST('g_mob') + u; F_base(S, T, u < 38 ? 13 : u < 62 ? 20 : u < 84 ? 25 : 30); S.hot = HOTS.mob(T); S.sel = u < 38 ? 1 : u < 84 ? 0 : u < 107 ? 5 : u < 111 ? 3 : 7;
  if (u >= 38 && u < 61) envSet(S, u < 39.5 ? 'sky' : 'night', u < 39.5 ? 'night' : null, seg(u, 38, 39.5)); else envSet(S, 'sky');
  if (u < 14) { const e = V(21.55, EYEY, 10.5); fpLookAt(S, e, V(23.5, WY + .4, 10.2)); const per = u < 6 ? 1.2 : .4, k = Math.floor(u / per), t0 = k * per; S.target = GEN.cob; S.crack = seg(u, t0, t0 + per * .85); S.swing = (u * 4.2 * (u < 6 ? 1 : 2.2)) % 1; if (S.crack > .95) S.cells.delete(k3(...GEN.cob));
    if (u > 6) { S.overlays.push({ kind: 'speed', text: `COBBLE: ${Math.round(lerp(64, 512, seg(u, 6, 14)))}`, col: '#c8c8cc' }); S.overlays.push({ kind: 'pill', text: 'x8 SPEED', col: '#7c4dff', t0: 6 }); } }
  else if (u < 38) { P(S, V(12.4, WY, 10.5), -Math.PI / 2, 'cobble', { use: (u * 5) % 1 }); orbitCam(S, V(8, Y0 + 9, 10.5), 30, 8, 1.4 + (u - 14) * .06, 60); S.overlays.push({ kind: 'pill', text: 'TIMELAPSE', col: '#1565c0', t0: 14 }); }
  else if (u < 62) { // night: mobs fall down the shaft
    S.killLight = 1;
    const fallers = MOB_FALL.map((t0, i) => { const land = t0 + 1.1, y = u < land ? MF.y + 1 - 16 * (u - t0) ** 2 : WY, dead = land + 1.2; return { i, t0, land, dead, y, kind: MOB_KIND[i] }; }).filter(f => u >= f.t0 && u < f.dead + .6);
    S.mobs = fallers.filter(f => f.kind === 'zombie').map(f => zom(V(6.9, f.y, 10.9), u, f.dead, Math.PI / 2));
    const sk = fallers.find(f => f.kind === 'skel'); if (sk) S.skel = { pos: V(6.9, sk.y, 10.9), yaw: Math.PI / 2, draw: 0, hurt: u > sk.dead - .1 && u < sk.dead + .2, dead: seg(u, sk.dead, sk.dead + .5), walk: 0 };
    const en = fallers.find(f => f.kind === 'ender'); if (en) S.ender = { pos: V(6.9, en.y, 10.9), yaw: Math.PI / 2, stare: 0, dead: seg(u, en.dead, en.dead + .5), hurt: u > en.dead - .1 && u < en.dead + .2 };
    if (u < 44) { P(S, V(8.9, WY, 10.6), -Math.PI / 2, 'wsword', {}); S.cam = cam([12.5, 113.5, 15.5], [6.9, lerp(126, 110, seg(u, 41, 43.5)), 10.9], 62); }
    else { const e = V(8.75, EYEY, 10.7); fpLookAt(S, e, V(6.9, WY + 1.2, 10.9)); MOB_FALL.forEach(t0 => { const d = t0 + 2.3; [d - .8, d - .4, d].forEach(h => swingOn(S, u, h, .3)); }); }
    fallers.forEach(f => { if (u >= f.dead && u < f.dead + .8) S.bursts.push({ type: 'poof', t0: f.dead, o: V(6.9, WY + .9, 10.9), n: 24, sp: [.4, 1.4], up: [.5, 2], drag: 1, life: .9, size: .24, seed: 920 + f.i, tm: u }); });
    [[48.0, 'bone'], [49.0, 'iron'], [57.6, 'pearl']].forEach(([t0, ic]) => dropFX(S, u, t0, t0 + 1.6, V(6.9, WY + .2, 10.9), ic));
    if (u > 58.2 && u < 61.5) S.overlays.push({ kind: 'pop', t0: 58.2, text: 'ENDER PEARL!', col: '#7adcc0' }); if (u > 58) S.overlays.push({ kind: 'speed', text: 'PEARLS: 1/12', col: '#7adcc0' }); }
  else if (u < 84) { // iron gear
    if (u < 75) { const e = V(20.5, EYEY, 16.4); fpLookAt(S, e, V(20.5, WY + .2, 18.2)); S.torchIn = 1; S.overlays.push({ kind: 'craftF', u, t0: 63, steps: [[63.5, 'iron', 'sword', 'IRON SWORD'], [67.5, 'iron', 'chestplate', 'IRON ARMOR']] }); }
    else { P(S, V(20.5, WY, 11.6), Math.PI * .9, 'sword', {}); orbitCam(S, V(20.5, Y0 + 2.4, 11.6), 6.5, 1.2, -1.2 + (u - 75) * .1, 52); } }
  else if (u < 107) { // creeper
    const boom = 91.2, CP = V(17.3, WY, 10.5); if (u < boom) S.mobs = [{ kind: 'creeper', pos: CP.clone().add(V(lerp(3, 0, seg(u, 84, 88.4)), 0, 0)), yaw: -Math.PI / 2, swell: seg(u, 88.6, boom), alive: true, walk: 0 }];
    if (u >= boom) { boomFX(S, boom, CP.clone().add(V(0, .5, 0)), u); absHit(S, boom, .45); }
    const kb = u > boom ? 1.2 * eOutC(seg(u, boom, boom + .4)) : 0; const e = V(15.0 - kb * .9, EYEY, 10.4);
    if (u < 88.6) { const j = Math.min(6, Math.max(0, Math.floor((u - 86.2) / .45))); fpLookAt(S, e, V(IW_CELLS[j][0] + .5, WY + .2, IW_CELLS[j][1] + .5)); W_HARV2.forEach(t => swingOn(S, u, t, .3)); }
    else if (u < 95.5) { const tg = u < boom ? CP.clone().add(V(0, 1.2, 0)) : V(16, WY - 1.5, 10.4); fpCam(S, e, lerp(-Math.PI / 2, Math.PI / 2, eIO(seg(u, 88.6, 89.3))), u < boom ? pitchTo(e, tg) : lerp(deg(-10), deg(-62), seg(u, boom + .4, 93.5)), 72); if (u > 93) S.vertigo = .8; }
    else if (u < 101) { P(S, V(14.1, WY, 10.4), Math.PI / 2, 'hoe', {}, { crouch: 1 }); S.cam = cam([16.2, 104.5, 15.2], [15.6, 108.6, 10.2], 58); }
    else { fpLookAt(S, V(14.1, EYEY - .35, 10.4), V(16.2, WY - .6, 10.4)); if (u > 106) S.vertigo = .3; }
    S.hp = u < boom ? 20 : 9; if (u >= boom && u < boom + .6) S.hurtT = S.t - u + boom; }
  else if (u < 126) { if (u < 112) { fpLookAt(S, V(14.4, EYEY - .35, 10.4), V(16, WY - .4, 10.2)); HOLE.forEach((c, i) => { const t0 = 108 + i * .5; swingOn(S, u, t0, .3); if (u > t0 - .3 && u < t0) S.target = [c[0] - 1, c[1], c[2]]; }); }
    else { P(S, V(20.5, WY, 11.2), Math.PI, 'torch', {}); orbitCam(S, V(17, Y0 + 2, 12), 21, 7, -2.6 + (u - 112) * .08, 60); S.overlays.push({ kind: 'pill', text: 'TIMELAPSE', col: '#1565c0', t0: 112 }); } }
  else { const e = V(20.5, EYEY, 9.0); fpLookAt(S, e, V(20.5, WY + 1.5, 4.5), 72, { walk: u < 128 ? u * 9 : 0 }); }
};
// ===================== DRIPSTONE, OBSIDIAN, NETHER, BLAZES (days 31-55) =====================
const NPORT = V(NX + .5, 43, -142.5), NB = (k) => V(NX + 3 + k, 43, -140 + k * .9);
SCN.g_nether = (S, u) => {
  const T = SST('g_nether') + u; F_base(S, T, u < 40 ? 31 : u < 128 ? 40 : 55); S.hot = HOTS.nether(T);
  S.sel = u < 7 ? 3 : u < 15 ? 2 : u < 31 ? 2 : u < 40 ? 5 : u < 80 ? 3 : u < 118 ? 0 : 3;
  if (u < 40 || u >= 128) envSet(S, 'sky'); else { envSet(S, 'nether'); S.cells = null; S.waterBlocks = []; }
  if (u < 15) { const e = V(23.4, EYEY, 11.2); fpLookAt(S, e, u < 7 ? V(25, WY + 1.5, 13) : V(25.5, WY + .9, 13.5)); DRIP_C.forEach((_, i) => swingOn(S, u, 1.5 + i * (5 / 9), .3)); if (u > 7) for (let k = 0; k < 6; k++) { const t0 = 7 + k * 1.3; if (u >= t0 && u < t0 + .9) S.bursts.push({ type: 'lavap', t0, o: V(25.5, 110.1, 13.5), n: 2, sp: [0, .05], up: [-.5, -.4], g: 2, life: .9, size: .06, seed: 940 + k, tm: u }); } if (u > 14.2) S.overlays.push({ kind: 'pop', t0: 14.2, text: 'INFINITE LAVA!', col: '#ff9a1f' }); }
  else if (u < 31) { const e = V(19.9, EYEY, 9.4); fpLookAt(S, e, V(19.9, WY + 2, 6.4)); P_T.forEach((t, i) => { swingOn(S, u, t, .35); if (u >= t - .4 && u < t + .2) { S.target = [P_FRAME[i][0], P_FRAME[i][1], P_FRAME[i][2]]; } if (u >= t && u < t + .8) S.bursts.push({ type: 'smoke', t0: t, o: V(P_FRAME[i][0] + .5, P_FRAME[i][1] + .9, 6.5), n: 8, sp: [.2, .6], up: [.8, 1.6], drag: 1, life: .8, size: .14, seed: 950 + i, tm: u }); }); S.overlays.push({ kind: 'speed', text: `OBSIDIAN: ${P_T.filter(t => u >= t).length}/14`, col: '#c77dff' }); }
  else if (u < 40) { if (u < 35) { const e = V(19.9, EYEY, 9.0); fpLookAt(S, e, V(20, WY + 2.4, 6.5)); swingOn(S, u, 33.6, .4); } else { const k = seg(u, 35, 37.4); fpCam(S, V(20, EYEY, lerp(9.0, 6.6, k)), Math.PI, deg(0), 72 + k * 12, { walk: k < 1 ? u * 9 : 0 }); S.nausea = seg(u, 36, 39.5); } }
  else if (u < 60) { const k = seg(u, 44, 58); const e = NPORT.clone().add(V(0, 1.62, 3.2)); fpCam(S, e, lerp(.2, 1.6, eIO(k)), deg(-6) + Math.sin(u * .5) * .02, 74); S.nausea = 1 - seg(u, 40, 42); }
  else if (u < 74) { const k = clamp((u - 60) / 12), n = Math.floor(k * 18); for (let i = 0; i < n; i++) S.extraCells = (S.extraCells || []).concat([[Math.floor(NB(i).x), 42, Math.floor(NB(i).z), 'cobble']]); if (u < 68) { const e = NB(n - .4).add(V(0, 1.27, 0)); fpLookAt(S, e, NB(n + .6).add(V(0, -.6, 0)), 72); S.swing = (u * 2.5) % 1; S.overlays.push({ kind: 'pill', text: 'x4 SPEED', col: '#7c4dff', t0: 60 }); } else { P(S, NB(n - .5).add(V(0, 0, 0)), Math.PI * .3, 'cobble', {}, { crouch: 1 }); S.cam = cam([NX - 6, 52, -150], [NX + 10, 42, -130], 64); } }
  else if (u < 118) { // fortress and blazes
    for (let i = 0; i < 18; i++) S.extraCells = (S.extraCells || []).concat([[Math.floor(NB(i).x), 42, Math.floor(NB(i).z), 'cobble']]);
    const e = V(NF.x + .5, NF.y + 1 + 1.62, NF.z - 10); const B1 = V(NF.x - 1.5 + Math.sin(u) * .6, NF.y + 1.5 + Math.sin(u * 1.7) * .3, NF.z - 4), B2 = V(NF.x + 1.8 + Math.sin(u * .8) * .6, NF.y + 2 + Math.sin(u * 1.3) * .3, NF.z + 1);
    const b1d = 94.6, b2d = 108.0; const B2n = u > 100 ? B2.clone().lerp(V(NF.x + .5, NF.y + 1.2, NF.z - 6.2), eIO(seg(u, 100, 104))) : B2;
    S.blazes = [{ pos: B1, alive: u < b1d + .5, hurt: [93.0, 93.8, 94.6].some(h => u >= h && u < h + .25), dead: seg(u, b1d, b1d + .5) }, { pos: B2n, alive: u < b2d + .5, hurt: [106.4, 107.2, 108.0].some(h => u >= h && u < h + .25), dead: seg(u, b2d, b2d + .5) }];
    let eye = u < 80 ? V(NF.x + .5, NF.y + 2.62, NF.z - 17) : u < 92 ? e : V(NF.x + .5, NF.y + 2.62, lerp(NF.z - 10, NF.z - 5.6, seg(u, 92, 92.8)));
    if (u < 80) fpLookAt(S, eye, V(NF.x + .5, NF.y + 2, NF.z + 6), 70, { walk: u * 8 });
    else if (u >= 86.6 && u < 89.5) { P(S, eye.clone().setY(NF.y + 1), 0, 'sword', {}); S.cam = cam([NF.x + 6, NF.y + 4.5, NF.z - 14], [NF.x + .5, NF.y + 2, NF.z - 6], 60); }
    else { const tg = u < 100 ? B1 : B2n; fpLookAt(S, eye, tg); }
    [[85.6, B1], [99.8, B2]].forEach(([t0, src], i) => { if (u >= t0 && u < t0 + .9) { const p = src.clone().lerp(eye.clone().add(V(0, -.3, 0)), seg(u, t0, t0 + .8)); S.bursts.push({ type: 'lavap', t0: u - .01, o: p, n: 14, sp: [0, .3], up: [-.2, .2], drag: 3, life: .2, size: .16, seed: 960 + i, tm: u }); } });
    S.onFire = seg(u, 86.4, 86.7) * (1 - seg(u, 90.5, 92)); if (u >= 86.4 && u < 87) S.hurtT = S.t - u + 86.4; S.hp = u < 86.4 ? 20 : u < 100.6 ? 13 : 10; if (u >= 100.6 && u < 101.2) S.hurtT = S.t - u + 100.6;
    [93.0, 93.8, 94.6, 106.4, 107.2, 108.0].forEach(h => swingOn(S, u, h, .3)); [[94.6, B1], [108.0, B2n]].forEach(([t0, p], i) => { if (u >= t0 && u < t0 + .8) S.bursts.push({ type: 'smoke', t0, o: p.clone(), n: 26, sp: [.4, 1.4], up: [.4, 1.6], drag: 1, life: .8, size: .22, seed: 970 + i, tm: u }); });
    dropFX(S, u, 95.0, 96.2, B1.clone().setY(NF.y + 1.2), 'rod'); dropFX(S, u, 108.4, 109.6, B2n.clone().setY(NF.y + 1.2), 'rod');
    if (u > 96 && u < 99) S.overlays.push({ kind: 'pop', t0: 96, text: 'BLAZE ROD!', col: '#ffcf3a' }); if (u > 96) S.overlays.push({ kind: 'speed', text: `RODS: ${u < 104 ? 1 : 4}`, col: '#ffcf3a' }); }
  else if (u < 128) { for (let i = 0; i < 18; i++) S.extraCells = (S.extraCells || []).concat([[Math.floor(NB(i).x), 42, Math.floor(NB(i).z), 'cobble']]); const k = seg(u, 118, 127), n = 17 * (1 - k); fpLookAt(S, NB(n).add(V(0, 1.62, 0)), NB(n - 2).add(V(0, 1.2, 0)), 76, { walk: u * 10 }); S.nausea = seg(u, 126, 128); }
  else { if (u < 136) { const k = seg(u, 128, 131); fpCam(S, V(20, EYEY, lerp(7.0, 9.6, k)), 0, deg(-4), 72, { walk: k < 1 ? u * 9 : 0 }); S.nausea = 1 - seg(u, 128, 130); } else { P(S, V(20.5, WY, 9.6), Math.PI * .2, 'rod', {}); orbitCam(S, V(20, Y0 + 3, 9), 18, 6, .9 + (u - 136) * .07, 60); } }
};
// ===================== ENDERMEN, CASTLE, THE HIDDEN PORTAL (days 56-85) =====================
SCN.g_ender = (S, u) => {
  const T = SST('g_ender') + u; F_base(S, T, u < 36 ? 56 : u < 80 ? 70 : 80); S.hot = HOTS.ender(T); S.sel = u < 26 ? 0 : u < 36 ? 6 : u < 80 ? 8 : u < 100 ? 6 : 1;
  if (u < 26) envSet(S, 'night'); else if (u < 28) envSet(S, 'night', 'sky', seg(u, 26, 28)); else if (u < 80) envSet(S, u < 66 ? 'sky' : 'sky', 'sunset', seg(u, 62, 72)); else envSet(S, u < 118 ? 'sky' : 'stronghold');
  if (u < 13) { const EP = V(22.6, WY, 8.6), e = V(17.8, EYEY, 10.6); const tpT = 6.2; const ep = u < tpT ? EP : V(18.9, WY, 10.4); S.ender = { pos: ep, yaw: yawTo(ep, e), stare: seg(u, 4.6, 6.2), dead: seg(u, 10.1, 10.6), hurt: [8.0, 8.7, 9.4, 10.1].some(h => u >= h && u < h + .25) };
    if (u >= tpT - .1 && u < tpT + .8) [EP, ep].forEach((p, i) => S.bursts.push({ type: 'portal', t0: tpT, o: p.clone().add(V(0, 1.4, 0)), n: 40, sp: [.4, 1.6], up: [-.5, 1.5], drag: 1, life: .8, size: .08, seed: 980 + i, tm: u }));
    fpLookAt(S, e, ep.clone().add(V(0, 2.6, 0)), 72 - 10 * seg(u, 4.6, 6.0) * (u < tpT)); [8.0, 8.7, 9.4, 10.1].forEach(h => swingOn(S, u, h, .3)); if (u > 4.8 && u < tpT) S.vertigo = .5; if (u >= tpT && u < tpT + .4) S.cut2 = S.t - u + tpT;
    dropFX(S, u, 10.6, 11.8, V(18.9, WY + .2, 10.4), 'pearl'); if (u >= 7.2 && u < 7.8) S.hurtT = S.t - u + 7.2; S.hp = u < 7.2 ? 20 : 16; }
  else if (u < 26) { const k = Math.floor((u - 13) / 3.2), lu = (u - 13) % 3.2; const spots = [V(16.4, WY, 9.2), V(22.4, WY, 15.8), V(9.4, WY, 10.4), V(21.4, WY, 8.6)], ep = spots[k % 4]; const e = ep.clone().add(V(1.6, 1.62, .4)); S.ender = { pos: ep, yaw: yawTo(ep, e), stare: 0, dead: seg(lu, 2.2, 2.7), hurt: [1.0, 1.6, 2.2].some(h => lu >= h && lu < h + .25) }; fpLookAt(S, e, ep.clone().add(V(0, 2.2, 0))); [1.0, 1.6, 2.2].forEach(h => swingOn(S, lu, h, .3)); S.overlays.push({ kind: 'speed', text: `PEARLS: ${Math.min(12, 2 + k * 3 + (lu > 2.6 ? 1 : 0))}/12`, col: '#7adcc0' }); }
  else if (u < 36) { fpLookAt(S, V(20.5, EYEY, 16.4), V(20.5, WY + .2, 18.2)); S.torchIn = 1; S.overlays.push({ kind: 'craftF', u, t0: 26, steps: [[26.4, 'rod', 'gold', 'BLAZE POWDER'], [29.4, 'pearl', 'eye', 'EYE OF ENDER x12']] }); }
  else if (u < 80) { P(S, V(23.6, WY, 9.0), -Math.PI * .4, 'stoneB', { use: (u * 5) % 1 }); const r = u < 70 ? 24 : lerp(24, 30, seg(u, 70, 80)); orbitCam(S, V(24, Y0 + 6, 7), r, u < 70 ? 9 : lerp(9, 14, seg(u, 70, 80)), -1.1 + (u - 36) * .055, 60); if (u < 70) S.overlays.push({ kind: 'pill', text: 'TIMELAPSE', col: '#1565c0', t0: 36 }); }
  else if (u < 100) { // the eye flies down
    const e = V(22.4, EYEY, 10.4); const k = clamp((u - 83.4) / 3.2), ep = u < 83.4 ? null : (u < 86.6 ? V(22.4 + k * 2.2, EYEY + Math.sin(k * Math.PI * .5) * 3, 10.4 + k * 1.6) : V(24.6, EYEY + 3 - (u - 86.6) * 4, 12.0 + (u - 86.6) * .2));
    if (ep) { S.eyeBall = ep; S.trail2 = { pts: [...Array(10)].map((_, i) => ep.clone().add(V(0, i * .25 * (u > 86.6 ? 1 : -.3), 0))), dots: false }; }
    if (u < 93.5) { fpLookAt(S, e, ep ? ep : V(24.6, EYEY + 2, 12), 72); if (u > 82.8 && u < 83.4) S.swing = seg(u, 82.8, 83.4); if (u > 89) S.vertigo = .5; }
    else { P(S, V(22.4, WY, 10.4), Math.PI / 2, null, { lookDown: .9 }); const yy = Math.max(96, EYEY + 3 - (u - 86.6) * 4); S.eyeBall = V(24.6, yy, 12.6); S.trail2 = { pts: [...Array(10)].map((_, i) => S.eyeBall.clone().add(V(0, i * .25, 0))), dots: false }; S.cam = cam([30, 100.5, 18], [20.5, lerp(106, 101, seg(u, 93.5, 100)), 10], 60); } }
  else if (u < 118) { const lvl = DIG_T.filter(t => u >= t + .25).length; const e = V(20.5, WY + EYE - lvl, 10.5); fpCam(S, e, Math.PI * .5, deg(-86), 72); const i = DIG_T.findIndex(t => u < t); if (i >= 0) { const t0 = i ? DIG_T[i - 1] + .3 : 102.8; if (u > t0) { S.target = DIG[i]; S.crack = seg(u, t0, DIG_T[i]); S.swing = (u * 4.2) % 1; } } if (u > 112) S.fade = seg(u, 112.2, 113.4) * (1 - seg(u, 117, 118)); }
  else { // hidden portal room under the island
    S.cells = null; S.waterBlocks = [];
    const placed = FRAME_EYES.filter((_, i) => u >= 121 + i * .7).length; S.eyes = placed; S.shPortal = seg(u, 130, 130.4); S.torch2 = 1;
    FRAME_EYES.forEach((fe, i) => { const t0 = 121 + i * .7; if (u >= t0 && u < t0 + .7) S.bursts.push({ type: 'eyep', t0, o: V(fe[0], fe[1] + .2, fe[2]), n: 14, sp: [.4, 1.4], up: [.6, 2], drag: 1.2, life: .7, size: .07, seed: 990 + i, tm: u }); });
    if (u < 130) { const i = Math.min(11, Math.max(0, Math.floor((u - 120.6) / .7))), a = FRAME_EYES[i][3]; const e = SHC.clone().add(V(Math.sin(a) * 3.4, 1.62, Math.cos(a) * 3.4)); fpLookAt(S, e, V(FRAME_EYES[i][0], FRAME_EYES[i][1], FRAME_EYES[i][2]), 72); swingOn(S, u, 121 + i * .7, .3); S.held = 'eye'; S.sel = 5; if (u < 120) S.fade = 1 - seg(u, 118, 119.2); }
    else if (u < 140) { P(S, SHC.clone().add(V(0, 1, -1.9)), 0, 'sword', {}); S.cam = cam([SHC.x + 3.6, SH.y + 3.4, SHC.z - 4.4], [SHC.x, SH.y + .7, SHC.z], 60); if (u > 130.2 && u < 133.5) S.overlays.push({ kind: 'pop', t0: 130.2, text: 'PORTAL OPEN!', col: '#2fae8a' }); }
    else { const k = seg(u, 140, 141.2); fpCam(S, SHC.clone().add(V(0, 2.6 - (u > 141.2 ? (u - 141.2) ** 2 * 6 : 0), -1.9 + 1.9 * k)), 0, deg(-80), 74); S.fade = seg(u, 145, 149.5); } }
};
// ===================== THE ENDER DRAGON (days 86-87), first person =====================
SCN.g_dragon = (S, u) => {
  const T = SST('g_dragon') + u; F_base(S, T, 87); S.cells = null; S.hot = HOTS.dragon(T); S.sel = u >= 13.6 && u < 29.6 ? 1 : 0;
  const ud = Math.min(u, 72); SCN.dragon(S, ud); S.u = ud; S.overlays = S.overlays.filter(o => o.kind !== 'pop' || o.text === 'DRAGON DEFEATED!');
  S.waterBlocks = []; S.lavaLit = 0; S.armor = 15; const dp = S.dragon ? S.dragon.pos : EC;
  const eye = S.player.pos.clone().add(V(0, 1.62, 0));
  if (u < 6) { /* keep the wide establishing shot */ }
  else if (u < 13.6) fpLookAt(S, eye, dp, 74);
  else if (u < 29.6) { const k = Math.min(5, Math.max(0, CT.findIndex(t => u < t + .4))), tp = CRYSTALS[CORD[k]].position; fpLookAt(S, eye, tp, 62); const t0 = CT[k]; S.swing = u > t0 - 1.1 && u < t0 - .55 ? seg(u, t0 - 1.1, t0 - .55) * .4 : 0; S.fovKick = u > t0 - 1.0 && u < t0 - .55 ? 1 : 0; }
  else if (u < 34.0) { fpLookAt(S, eye, dp, 76 + 8 * seg(u, 31, 33.3)); if (u >= 33.3 && u < 33.9) S.hurtT = S.t - u + 33.3; }
  else if (u < 37.6) { /* third-person replay of the dodge from the shared scene */ S.fp = false; }
  else if (u < 58.6) { const HEAD = EC.clone().add(V(.3, 2.2, -6.7)); fpLookAt(S, eye, HEAD, u > 55.4 ? 60 : 72); [...HITS, FINAL].forEach(h => swingOn(S, u, h, .35)); }
  else if (u < 72) { /* death beams, shared wide shot */ }
  else { S.egg = u < 86; const k = seg(u, 88, 100); const p = P0.clone().add(V(0, 0, lerp(-.7, 8.0, eIO(k)))); const e2 = p.clone().add(V(0, 1.62, 0)); if (u < 88) fpLookAt(S, eye, EC.clone().add(V(0, 5.6, 0)), 70); else fpLookAt(S, e2, EC.clone().add(V(0, 0, 0)), 72, { walk: k > 0 && k < 1 ? u * 9 : 0 }); swingOn(S, u, 85.6, .4); if (u > 86 && u < 89) S.overlays.push({ kind: 'pop', t0: 86, text: 'DRAGON EGG!', col: '#c77dff' }); S.exitPortal = 1; if (u > 100) { const kk = seg(u, 100, 101.5); fpCam(S, EC.clone().add(V(0, 1.62 + 1.2 * Math.sin(kk * Math.PI) - (u > 101.5 ? (u - 101.5) ** 2 * 3 : 0), -1 + kk)), 0, deg(-70), 74); } S.fade = seg(u, 108, 114); }
  if (S.fp && S.fovKick) S.cam.fov -= 8;
};
// ===================== DAY 100 =====================
SCN.g_final = (S, u) => {
  const T = SST('g_final') + u; F_base(S, T, 100); S.hot = HOTS.dragon(T); S.sel = 8; envSet(S, u < 40 ? 'sunset' : 'sunset', u < 40 ? 'sky' : null, u < 40 ? 1 - seg(u, 10, 40) : 0);
  if (u < 8) { const e = V(20.6, EYEY, 9.4); fpLookAt(S, e, V(22.5, WY + 1.4, 8.5)); swingOn(S, u, 4.0, .4); S.held = 'egg'; }
  else if (u < 28) { P(S, V(21.0, WY, 9.6), Math.PI * .8, 'sword', {}); orbitCam(S, V(16, Y0 + 6, 10), lerp(30, 38, seg(u, 8, 28)), lerp(10, 16, seg(u, 8, 28)), -2.0 + (u - 8) * .06, 62);
    [['f', V(13.8, Y0 + 2, 10.4), 11.0, 'FARM'], ['h', V(20.5, Y0 + 6, 16.5), 12.4, 'HOUSE'], ['m', V(6.5, MF.y + 5, 10.5), 13.8, 'MOB FARM'], ['p', V(20, Y0 + 7, 6.5), 15.2, 'NETHER PORTAL'], ['c', V(27, Y0 + 15, 4), 16.6, 'CASTLE']].forEach(([, at, t0, text]) => S.overlays.push({ kind: 'tag', at, text, col: '#ffd400', t0, until: 27 })); }
  else { P(S, V(27.5, Y0 + 14, 4.5), Math.PI * .8 + u * .03, 'sword', {}, { wings: .15 }); orbitCam(S, V(27.5, Y0 + 15, 4.5), 9, 1.5, -.4 + (u - 28) * .05, 56); if (u > 27) S.overlays.push({ kind: 'outro2', t0: S.t - u + 27 }); }
};
// ===================== events for the sound design =====================
const EVF = {
  g_hook: [[0.1, 'wind', .4], [8.2, 'boom', .7], ...[10, 12, 14, 16].map(x => [x, 'whoosh', .45]), [10.1, 'smash', .6], [12.1, 'sizzle', .5], [16.1, 'explode', .7], [21.8 - 18 + 18, 'riser', .1]],
  g_act1: SKY_EV.filter(([t]) => t >= 18 && t < 110).map(([t, k, g]) => [t - 18, k, g]),
  g_farm: [...F_TILL.map(t => [t, 'crunch', .5]), [11.0, 'pour', .7], ...W_PLANT.map(t => [t, 'pop', .25]), [15, 'riser', .3], ...W_HARV.map(t => [t, 'crunch', .45]), [29.4, 'pop', .6], [29.8, 'ding', .6], ...[...Array(40)].map((_, i) => [38.6 + i * .7, 'thud', .45]), [66.2, 'ding', .6], [68.4, 'step', .4], [68.9, 'step', .4], [69.4, 'step', .4], [74, 'riser', .2],
    [79, 'groan', .7], [82.4, 'groan', .8], [88.6, 'hit', 1], [89.4, 'hit', 1], [90.2, 'hit', 1], [90.8, 'poof', .5], [92.0, 'groan', .9], [93.0, 'hurt', 1], [99.6, 'hit', 1], [100.4, 'hit', 1], [101.2, 'hit', 1.1], [101.8, 'poof', .5], [104.0, 'pickup', .7], [104.1, 'ding', .7]],
  g_mob: [...[...Array(5)].map((_, i) => [i * 1.2 + 1.0, 'crunch', .6]), ...[...Array(20)].map((_, i) => [6.2 + i * .4, 'crunch', .45]), ...[...Array(36)].map((_, i) => [15 + i * .62, 'thud', .4]), [38, 'riser', .2],
    ...MOB_FALL.flatMap(t0 => [[t0 + .2, 'whoosh', .35], [t0 + 1.1, 'thud', .8], [t0 + 1.5, 'hit', .9], [t0 + 1.9, 'hit', .9], [t0 + 2.3, 'hit', 1], [t0 + 2.4, 'poof', .4]]), [41.4, 'groan', .5], [46.8, 'rattle', .6], [49.2, 'pickup', .5], [55.4, 'roar', .25], [59.2, 'pickup', .6], [59.4, 'sparkle', .6],
    [63.5, 'pop', .5], [64, 'clank', .7], [67.5, 'pop', .5], [68, 'clank', .9], [86.2, 'crunch', .4], [86.65, 'crunch', .4], [87.1, 'crunch', .4], [88.4, 'hiss', 1], [91.2, 'explode', 1.3], [91.3, 'debris', .8], [91.4, 'hurt', 1], [93.2, 'heartbeat', .9], [101, 'wind', .5], ...HOLE.map((_, i) => [108 + i * .5, 'thud', .6]), ...[...Array(16)].map((_, i) => [113 + i * .6, 'click', .35])],
  g_nether: [...DRIP_C.map((_, i) => [1.5 + i * (5 / 9), 'thud', .45]), ...[...Array(6)].map((_, k) => [7.9 + k * 1.3, 'lava', .2]), [14.2, 'ding', .6], ...P_T.flatMap(t => [[t - .35, 'lava', .3], [t - .1, 'pour', .3], [t, 'sizzle', .45]]), [33.6, 'ignite', 1], [35.2, 'riser', .6], [37.6, 'whoosh7', .7], [40.2, 'boom', .5],
    ...[...Array(24)].map((_, i) => [60 + i * .5, 'thud', .35]), [74, 'riser', .3], [85.6, 'bowshot', .4], [86.4, 'explode', .6], [86.5, 'hurt', 1], [86.6, 'sizzle', .8], [93.0, 'hit', 1], [93.8, 'hit', 1], [94.6, 'hit', 1.1], [94.8, 'poof', .5], [96.2, 'pickup', .7], [96.3, 'ding', .7], [99.8, 'bowshot', .4], [100.6, 'hurt', .9], [106.4, 'hit', 1], [107.2, 'hit', 1], [108.0, 'hit', 1.1], [108.2, 'poof', .5], [109.6, 'pickup', .7], ...[...Array(16)].map((_, i) => [118 + i * .5, 'step', .4]), [126, 'riser', .5], [128.2, 'whoosh7', .6]],
  g_ender: [[4.6, 'roar', .5], [6.2, 'whoosh7', .8], [6.3, 'boom', .4], [7.2, 'hurt', .9], [8.0, 'hit', 1], [8.7, 'hit', 1], [9.4, 'hit', 1], [10.1, 'hit', 1.1], [10.4, 'poof', .5], [11.8, 'pickup', .7], ...[0, 1, 2, 3].flatMap(k => [[13 + k * 3.2 + 1.0, 'hit', .8], [13 + k * 3.2 + 1.6, 'hit', .8], [13 + k * 3.2 + 2.2, 'hit', .9], [13 + k * 3.2 + 2.6, 'pickup', .5]]), [26.4, 'pop', .5], [29.4, 'pop', .5], [29.8, 'sparkle', .7],
    ...[...Array(50)].map((_, i) => [37 + i * .66, 'thud', .35]), [70.2, 'ding', .7], [83.4, 'whoosh', .5], [83.5, 'sparkle', .6], [87.0, 'whoosh', .5], [89.4, 'heartbeat', .8], ...DIG_T.flatMap(t => [[t - .9, 'tick', .4], [t - .5, 'tick', .4], [t, 'crunch', .8], [t + .3, 'thud', .5]]), [112.6, 'boom', .4], ...FRAME_EYES.map((_, i) => [121 + i * .7, 'click', .6]), [129.6, 'riser', .6], [130, 'boom', .7], [130.1, 'sparkle', 1], [140.6, 'whoosh7', .7], [142, 'riser', .5]],
  g_dragon: [...EV.dragon.filter(([t]) => t < 72), [85.6, 'hit', .6], [86, 'pickup', .7], [86.1, 'ding', .6], [100.4, 'whoosh7', .6], [102, 'riser', .6]],
  g_final: [[4.0, 'thud', .6], [4.3, 'sparkle', .6], [8, 'whoosh', .4], [9.6, 'pop', .4], [11, 'pop', .4], [12.4, 'pop', .4], [13.8, 'pop', .4], [15.2, 'pop', .4], [16.6, 'pop', .4], [27.2, 'pop', .7], [28, 'pop', .6], [29.6, 'click', 1], [29.75, 'bell', .9]],
};
window.TIMELINE = { TOTAL, segs: SEGS.map(sg => ({ kind: sg.kind, start: sg.start, dur: sg.dur, ev: EVF[sg.kind] || [] })) };
Object.assign(ENV.end, { fog: [0x1e1432, 50, 190], bg: 0x1e1432, hemi: 1.7, hcol: 0xe6dcff, stars: 1 });
// ===================== extras applied after applyGP =====================
const ironShirt = solidTex('#c8ccd0'), ironPants = solidTex('#a8acb0'); const shirt0 = PLAYER.mats[1].map, pants0 = PLAYER.mats[2].map;
window.__applyF = S => {
  const t = S.t;
  if (S.extraCells && S.extraCells.length) { const c = new Map(); S.extraCells.forEach(([x, y, z, ty]) => c.set(k3(x, y, z), ty)); aoMesh(c, islTex, ISL_MATS, islandG); islandG.visible = true; }
  else if (!S.cells) islandG.visible = false;
  chestG.visible = !!S.cells; if (!S.cells) { lavaGlow.intensity = 0; waterPool.forEach(w => w.visible = false); }
  iWheat.visible = !!S.cells && !!S.wheat; if (iWheat.visible) { IW_CELLS.forEach(([x, z], i) => { const g = S.wheat[i]; if (g <= 0) m4.makeScale(0, 0, 0); else m4.makeScale(1, .12 + .92 * g, 1).setPosition(x + .5, WY, z + .5); iWheat.setMatrixAt(i, m4); tmpC.set('#5fbf3a').lerp(cB.set('#e3c35a'), clamp((g - .7) / .3)); iWheat.setColorAt(i, tmpC); }); iWheat.instanceMatrix.needsUpdate = true; iWheat.instanceColor.needsUpdate = true; }
  torchMeshes.forEach((m, i) => m.visible = !!S.cells && i < (S.torchN || 0)); const night = S.env === 'night' ? 1 : S.env2 === 'night' ? S.envK : 0;
  torchLights.forEach((l, i) => { l.intensity = 0; }); if (S.cells && (night > .3 || S.torchIn)) { const lp = [[20.5, 110.6, 17.6], [17.5, 110, 12.9], [15.5, 110, 10.1], [9.5, 110, 10.4]]; torchLights.forEach((l, i) => { const on = i === 0 ? (S.T >= SST('g_farm') + 66) : i < 1 + Math.floor((S.torchN || 0) / 4); l.intensity = on ? (i === 0 && S.torchIn ? 2.2 : 1.6 * night) : 0; l.position.set(...lp[i]); }); }
  if (S.killLight) { torchLights[3].intensity = 2.6; torchLights[3].position.set(8.5, 111.2, 11.5); }
  caulG.visible = drip.visible = !!S.cells && S.caul >= 0; if (caulG.visible) caulG.userData.lava.position.y = .25 + .55 * S.caul;
  iPortal.visible = !!S.cells && S.iPortal > 0; if (iPortal.visible) iPortal.scale.set(1, S.iPortal, 1);
  egg.visible = !!S.egg || (!!S.cells && S.egg2); if (S.cells && S.egg2) egg.position.set(22.5, WY + 1.45, 8.5); else egg.position.set(END.x + .5, END.y + 5.5, END.z + .5);
  const en = S.ender; ENDER.g.visible = !!en && en.dead < 1; if (en) { ENDER.g.position.copy(en.pos); ENDER.g.rotation.set(0, en.yaw, -en.dead * 1.4); const sh = en.stare ? Math.sin(t * 40) * .03 * en.stare : 0; ENDER.head.position.x = sh; ENDER.jaw.position.y = -.04 - en.stare * .12; ENDER.armL.rotation.x = en.stare * -.3; ENDER.armR.rotation.x = en.stare * -.3; ENDER.mats.forEach(m => m.emissive && m.emissive.setHex(en.hurt ? 0x990000 : (m === ENDER.mats[1] ? 0x300040 : 0))); }
  BLAZES.forEach((b, i) => { const s = S.blazes && S.blazes[i]; b.g.visible = !!s && s.alive && s.dead < 1; if (!b.g.visible) return; b.g.position.copy(s.pos).add(V(0, -1.5, 0)); b.g.scale.setScalar(1 - s.dead * .6); b.rods.forEach((r, j) => { const a = j / 10 * Math.PI * 2 + t * 2.4 * (j % 2 ? 1 : -1), rr = j % 2 ? .55 : .4; r.position.set(Math.cos(a) * rr, .6 + (j % 2) * .45 + Math.sin(t * 3 + j) * .08, Math.sin(a) * rr); }); b.mats.forEach(m => m.color.setHex(s.hurt ? 0xff6060 : 0xffffff)); });
  blazeLight.intensity = S.blazes ? 2.2 : 0; if (S.blazes) blazeLight.position.copy(S.blazes[0].pos);
  if (DRAGON.g.visible && S.dragon && !S.dragon.hurt) DRAGON.mats.forEach(m => m.emissive && m.emissive.setHex(0x1c1028));
  PLAYER.mats[1].map = S.armor ? ironShirt : shirt0; PLAYER.mats[2].map = S.armor ? ironPants : pants0;
  if (S.fp && S.held && !BLOCK_ITEMS[S.held] && S.held !== 'egg') fpItem.material.map = ICON[S.held];
};
function drawFire(a, t) { ctx.save(); ctx.globalAlpha = a; const g = ctx.createLinearGradient(0, H * .55, 0, H); g.addColorStop(0, 'rgba(255,120,0,0)'); g.addColorStop(1, 'rgba(255,90,0,.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); const r = rng(Math.floor(t * 12)); for (let i = 0; i < 26; i++) { const x = r() * W, hh = 140 + r() * 260; ctx.fillStyle = i % 3 ? 'rgba(255,170,30,.55)' : 'rgba(255,240,140,.6)'; ctx.beginPath(); ctx.moveTo(x - 40, H); ctx.quadraticCurveTo(x + (r() - .5) * 60, H - hh * .6, x + (r() - .5) * 30, H - hh); ctx.quadraticCurveTo(x + 30, H - hh * .5, x + 40, H); ctx.fill(); } ctx.restore(); }
window.__drawF = S => {
  const t = S.t;
  if (S.onFire) drawFire(S.onFire, t);
  if (S.nausea) { const n = S.nausea; ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .05, W / 2, H / 2, H * .9); g.addColorStop(0, `rgba(170,70,255,${.3 * n})`); g.addColorStop(1, `rgba(90,20,170,${.9 * n})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const keep = S.overlays.filter(o => ['bossbar', 'speed', 'pill', 'tag', 'outro2', 'craftF'].includes(o.kind));
  for (const o of keep) {
    if (o.kind === 'craftF') { const st = [...o.steps].reverse().find(s => o.u >= s[0]); if (!st) continue; const last = o.steps[o.steps.length - 1][0]; const a = Math.min(seg(o.u, o.t0, o.t0 + .3), 1 - seg(o.u, last + 3.2, last + 3.6)), pk = eOutBack(seg(o.u, st[0], st[0] + .3));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W - 330, H * .42); rrect(-250, -140, 500, 280, 12, 'rgba(198,198,198,.96)', '#555', 5); txt('Crafting', -220, -108, 30, '#404040', { align: 'left', stroke: false, w: 700 }); ctx.fillStyle = '#8b8b8b'; ctx.fillRect(-200, -70, 120, 120); ctx.fillRect(80, -70, 120, 120); icon(st[1], -140, -10, 96); txt('→', 0, -10, 80, '#555', { stroke: false }); ctx.save(); ctx.translate(140, -10); ctx.scale(pk, pk); icon(st[2], 0, 0, 96); ctx.restore(); txt(st[3], 0, 100, 34, '#404040', { stroke: false }); ctx.restore(); }
  }
  const S2 = Object.assign({}, S, { overlays: keep.filter(o => o.kind !== 'craftF') }); drawOverlays(S2);
};
// hold the selected hotbar item in first person (all new sections)
['g_farm', 'g_mob', 'g_nether', 'g_ender', 'g_dragon', 'g_final'].forEach(k => { const f = SCN[k]; SCN[k] = (S, u) => { f(S, u); if (S.fp && S.held == null && S.hot) S.held = S.hot[S.sel] ? S.hot[S.sel][0] : null; }; });
