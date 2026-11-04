// ---------- 100 days: story scenes, timeline, apply, overlays ----------
for (const tex of ['leaves', 'dirt', 'craft']) {
  const mat = tex === 'craft' ? [lamT('craftSide'), lamT('craftSide'), lamT('craftTop'), lamT('planks'), lamT('craftSide'), lamT('craftSide')] : lamT(tex);
  const im = new THREE.InstancedMesh(box, mat, 200); im.frustumCulled = false; scene.add(im); DYN[tex] = im;
}
DRAGON.g.rotation.order = 'YXZ';
Object.assign(PCOL, { fire: ['#ffd84a', '#ff9a1f', '#e8521a', '#fff3a6'], wheatp: ['#e3c35a', '#c9a23a', '#7cc24a'], leafp: ['#2e7828', '#46a03a'], eyep: ['#2fae8a', '#a64cff', '#d6fff6'],
  xp: ['#c6ff4a', '#7cff3a', '#fff36a'], cryst: ['#ff7ad9', '#ffffff', '#ffb8f0', '#a64cff'], beam: ['#ff7ad9', '#ffb8f0'], arrow: ['#ffffff', '#c9a26a'], dust: ['#d8d8b0', '#b8b890'] });
const SEGJ = await (await fetch('./segs.json')).json(); const SEGS = SEGJ.segs, TOTAL = SEGJ.total;
const absHit = (S, tl, amp) => S.hits.push([S.u0 + tl, amp]);
function envSet(S, a, b = null, k = 0) { S.env = a; S.env2 = b; S.envK = k; }
function pathAt(wp, t) { if (t <= wp[0][0]) return wp[0][1].clone(); for (let i = 1; i < wp.length; i++) if (t <= wp[i][0]) { const k = (t - wp[i - 1][0]) / (wp[i][0] - wp[i - 1][0]); return wp[i - 1][1].clone().lerp(wp[i][1], eIO(k)); } return wp[wp.length - 1][1].clone(); }
const SCN = {}, EV = {};

// ===== Day 1: punch a tree, craft, sunset =====
const TREE = { x: 38, z: 24 }, LOG_T = [9.2, 10.9, 12.6, 14.3], TABLE = { x: 40, y: 9, z: 23 };
const LEAVES = []; for (let dy = 11; dy <= 14; dy++) { const rr = dy >= 14 ? 1 : 2; for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) { if (Math.abs(dx) === rr && Math.abs(dz) === rr && (dx + dz + dy) % 2) continue; if (dx === 0 && dz === 0 && dy <= 12) continue; LEAVES.push([TREE.x + dx, dy, TREE.z + dz]); } }
SCN.day1 = (S, u) => {
  envSet(S, 'sky', 'sunset', seg(u, 23, 34));
  LEAVES.forEach(([x, y, z]) => S.dyn.push({ x, y, z, tex: 'leaves' }));
  LOG_T.forEach((t1, i) => { const y = 9 + i; if (u < t1) S.dyn.push({ x: TREE.x, y, z: TREE.z, tex: 'log', wob: u > t1 - 1.5 ? seg(u, t1 - 1.5, t1) : 0 }); else if (u < t1 + .8) S.bursts.push({ type: 'wood', t0: t1, o: V(TREE.x + .5, y + .5, TREE.z + .5), n: 26, sp: [1, 3], up: [1, 4], g: 16, life: .7, size: .1, seed: 300 + i }); });
  if (u >= 17.4) S.dyn.push({ x: TABLE.x, y: TABLE.y, z: TABLE.z, tex: 'craft', pop: eOutBack(seg(u, 17.4, 17.65)) });
  if (u >= 17.4 && u < 18.2) S.bursts.push({ type: 'place', t0: 17.4, o: V(TABLE.x + .5, 9.2, TABLE.z + .5), n: 18, sp: [1, 2.5], up: [1, 3], g: 12, life: .6, size: .08, seed: 310 });
  const walkK = seg(u, 1.5, 8), pos = V(lerp(31.5, 38.5, eIO(walkK)), 9, lerp(17.5, 22.9, eIO(walkK)));
  let yaw = u < 8 ? Math.atan2(38.5 - 31.5, 22.9 - 17.5) : 0, held = null, p = {};
  if (u > 1.5 && u < 8) p.walk = u * 9;
  const punching = LOG_T.findIndex(t1 => u > t1 - 1.5 && u < t1); if (punching >= 0) { p.use = (u * 3.3) % 1; p.lookDown = -.25 - punching * .14; }
  if (u >= 15 && u < 23) { yaw = lerp(0, Math.atan2(TABLE.x + .5 - 38.5, TABLE.z + .5 - 22.9), eIO(seg(u, 15, 16))); if (u > 17.0 && u < 17.4) p.use = seg(u, 17, 17.4); }
  if (u >= 19.8) held = 'wpick';
  if (u >= 23) { yaw = lerp(Math.atan2(1.5, .6), Math.PI * .85, eIO(seg(u, 23, 26))); }
  P(S, pos, yaw, held, p);
  if (u < 8) S.cam = cam([lerp(31.5, 34.2, u / 8), lerp(14, 12.2, u / 8), lerp(13.2, 16.6, u / 8)], [pos.x, 10.2, pos.z + 1.5], 60);
  else if (u < 15) S.cam = cam([34.4, 11.2, 19.4], [38.4, 11.1, 24.0], 60);
  else if (u < 23) { const a = -2.2 + (u - 15) * .1; S.cam = cam([39.3 + Math.cos(a) * 5.6, 11.6, 23.0 + Math.sin(a) * 5.6], [39.4, 10.2, 23.4], 58); }
  else { const k = eIO(seg(u, 23, 34)); S.cam = cam([lerp(42.5, 47, k), lerp(11.2, 15.5, k), lerp(19.5, 13.5, k)], [38.8, 10.2, 23.2], 60); }
  if (u > 15 && u < 23.2) S.overlays.push({ kind: 'craft', u });
  if (u > 9 && u < 15) S.overlays.push({ kind: 'speed', text: `LOGS: ${LOG_T.filter(t1 => u >= t1).length}`, col: '#d9b07a' });
};
EV.day1 = [...[2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5].map(t => [t, 'step', .35]), ...LOG_T.flatMap(t1 => [[t1 - 1.4, 'hit', .35], [t1 - 1.0, 'hit', .35], [t1 - .6, 'hit', .35], [t1 - .2, 'hit', .35], [t1, 'crunch', .8], [t1 + .4, 'pickup', .6]]),
  [15.5, 'pop', .6], [17.4, 'thud', .9], [17.6, 'pop', .6], [19.8, 'ding', .7], [23, 'riser', .25]];

// ===== Night 1: dirt hut, zombies, sunrise =====
const NZ = [[V(51.5, 9, 37), V(51.5, 9, 26.0)], [V(55, 9, 31), V(54.0, 9, 23.5)], [V(41, 9, 21), V(49.0, 9, 22.6)]];
SCN.night1 = (S, u) => {
  if (u < 5) envSet(S, 'sunset', 'night', seg(u, 0, 5)); else if (u < 20) envSet(S, 'night'); else if (u < 24) envSet(S, 'night', 'sunset', seg(u, 20, 24)); else envSet(S, 'sunset', 'sky', seg(u, 24, 29));
  const nb = HUT_CELLS.length; HUT_CELLS.forEach(([x, y, z], i) => { const t0 = .3 + i * (4.4 / nb); if (u >= t0) S.dyn.push({ x, y, z, tex: 'dirt', pop: eOutBack(seg(u, t0, t0 + .15)) }); });
  S.torch = u >= 5.2 ? (u < 20 ? 1 : 1 - seg(u, 20, 26) * .7) : 0;
  P(S, V(51.5, 9, 23.5), 0, u < 5 ? 'grass' : 'torch', { use: u < 5 ? (u * 5.5) % 1 : (u > 4.9 && u < 5.2 ? seg(u, 4.9, 5.2) : 0) });
  S.mobs = NZ.map(([a, b], i) => { const k = seg(u, 6 + i * .8, 12.5 + i * .8), p = a.clone().lerp(b, eIO(k)); const yaw = Math.atan2(b.x - a.x, b.z - a.z) + (k >= 1 ? Math.sin(u * 2 + i) * .15 : 0); const z = zom(p, u, 24.6 + i * .25, yaw); z.walk = k > 0 && k < 1 ? u * 5 : Math.sin(u * 3 + i) * .4; return z; });
  if (u > 21) NZ.forEach(([, b], i) => { for (let tb = 21; tb < Math.min(u, 25.2 + i * .25); tb += .35) if (u - tb < .7) S.bursts.push({ type: 'fire', t0: tb, o: b.clone().add(V(0, 1.1, 0)), n: 10, sp: [.2, .8], up: [1, 2.6], drag: 1, life: .7, size: .12, seed: 400 + i * 50 + Math.round(tb * 3) }); if (u > 25.0 + i * .25) S.bursts.push({ type: 'poof', t0: 25.0 + i * .25, o: b.clone().add(V(0, .9, 0)), n: 26, sp: [.4, 1.4], up: [.5, 2], drag: 1, life: 1, size: .26, seed: 460 + i }); });
  if (u < 5) S.cam = cam([55.6, 12.2, 28.8], [51.5, 10.2, 23.5], 56);
  else if (u < 14) S.cam = cam([lerp(46.0, 46.8, seg(u, 5, 14)), 13.4, lerp(34.5, 33.4, seg(u, 5, 14))], [51.5, 10.2, 26.0], 60);
  else if (u < 20) { S.fp = true; S.player.visible = false; S.held = 'torch'; S.cam = { pos: V(51.5, 10.62, 23.45), look: V(51.5, 10.45, 25.5), fov: 70 }; }
  else S.cam = cam([45.2, 12.4, 31.5], [51.2, 10.0, 25.0], 58);
  if (u > 26) S.overlays.push({ kind: 'pop', t0: 26, text: 'SURVIVED NIGHT 1!', col: '#ffd400' });
};
EV.night1 = [...[...Array(12)].map((_, i) => [.3 + i * .37, 'thud', .45]), [5.2, 'click', .7], [8.5, 'groan', .7], [10.8, 'groan', .6], [12.6, 'groan', .7], [15.2, 'groan', 1], [17.4, 'groan', .8], [21.2, 'sizzle', .7], [22.6, 'sizzle', .6], [25.1, 'poof', .6], [25.4, 'poof', .5], [26, 'ding', .8]];

// ===== Farm & animals =====
const FARM_TP = FARM_CELLS.map((_, i) => 3.4 + i * (5.4 / FARM_CELLS.length)), FARM_TH = FARM_CELLS.map((_, i) => 15.2 + i * (3.0 / FARM_CELLS.length));
const LEAD = [[16.4, V(50, 9, 41)], [19.2, V(41, 9, 42.2)], [21.6, V(33.5, 9, 41.4)], [23.6, V(33.5, 9, 36.4)], [25.6, V(33.5, 9, 41.6)], [27, V(36.5, 9, 43)]];
const IDLE = [V(29.6, 9, 33.6), V(31.6, 9, 35.4), V(29.9, 9, 37.7), V(32.8, 9, 33.3), V(34.3, 9, 36.6), V(31.2, 9, 38.4)];
const ANIM_START = [V(52.2, 9, 39.2), V(53.4, 9, 40.6), V(52.6, 9, 42.2), V(54.2, 9, 38.4), V(53.6, 9, 43.6), V(54.8, 9, 41.4)];
function animalsIdle(t) { return IDLE.map((p, i) => ({ pos: p.clone().add(V(Math.sin(t * .3 + i) * .4, 0, Math.cos(t * .25 + i * 2) * .4)), yaw: i * 1.3 + Math.sin(t * .2 + i) * .8, walk: Math.sin(t * .3 + i) > .6 ? t * 6 : 0, head: Math.max(0, Math.sin(t * .7 + i * 1.7)) * .5 })); }
SCN.farm = (S, u) => {
  envSet(S, 'sky');
  const g = FARM_CELLS.map((_, i) => { if (u < FARM_TP[i]) return 0; if (u < FARM_TH[i]) return .08 + .92 * clamp((u - 9 - i * .02) / 6); return .07; });
  S.farm = { g, tilled: FARM_CELLS.map((_, i) => u >= FARM_TP[i] - .25) };
  FARM_CELLS.forEach(([x, z], i) => { if (u >= FARM_TH[i] && u < FARM_TH[i] + .8) S.bursts.push({ type: 'wheatp', t0: FARM_TH[i], o: V(x + .5, 9.6, z + .5), n: 10, sp: [.6, 2], up: [1, 3], g: 12, life: .7, size: .09, seed: 500 + i }); });
  S.pen = true; S.gate = u >= 26.8;
  let pp, yaw = Math.PI, held = null, p = {};
  if (u < 9) { const k = seg(u, 3.3, 8.9); pp = V(lerp(35.6, 43.4, k), 9, 45.3); yaw = 0; held = 'hoe'; p = { use: u > 3.3 && u < 8.9 ? (u * 4) % 1 : 0, walk: u > 3.3 && u < 8.9 ? u * 7 : 0, walkAmt: .5 }; }
  else if (u < 16.4) { const k = seg(u, 15.1, 18.2); pp = V(lerp(43.4, 35.6, k), 9, 45.3); yaw = 0; held = u > 15 ? 'wheat' : 'hoe'; p = { use: u > 15.1 && u < 18.2 ? (u * 4) % 1 : 0, walk: u > 15.1 && u < 18.2 ? u * 7 : 0, walkAmt: .5 }; }
  else { pp = pathAt(LEAD, u); const nx = pathAt(LEAD, u + .1); const moving = nx.distanceTo(pp) > .01; yaw = moving ? Math.atan2(nx.x - pp.x, nx.z - pp.z) : yaw; held = 'wheat'; p = { walk: moving ? u * 8 : 0 }; }
  if (u >= 16.4 && u < 18.2) { const k = seg(u, 15.1, 18.2); pp = V(lerp(43.4, 35.6, k), 9, 45.3); yaw = 0; p = { use: (u * 4) % 1, walk: u * 7, walkAmt: .5 }; }
  P(S, pp, yaw, held, p);
  S.animals = ANIMALS.map((_, i) => { const lag = .7 + i * .55, tl = u - lag; let pos, yw, walk = 0;
    if (tl < 18.4) { pos = ANIM_START[i].clone(); yw = -Math.PI / 2 + Math.sin(u * .4 + i) * .4; }
    else if (tl < 23.6) { const a = pathAt(LEAD, Math.max(18.4, tl)), b = pathAt(LEAD, Math.max(18.4, tl) + .1); const side = ((i % 3) - 1) * .9; pos = a.clone().add(V(side, 0, (i % 2) * .6)); if (tl < 19.2) pos.lerp(ANIM_START[i], 1 - seg(tl, 18.4, 19.2)); yw = Math.atan2(b.x - a.x, b.z - a.z); walk = u * 7; }
    else { const a = pathAt(LEAD, 23.6).add(V(((i % 3) - 1) * .9, 0, (i % 2) * .6)), k = seg(tl, 23.6, 25.4); pos = a.lerp(IDLE[i], eIO(k)); yw = k < 1 ? Math.atan2(IDLE[i].x - a.x, IDLE[i].z - a.z) : i * 1.3; walk = k < 1 ? u * 7 : 0; }
    return { pos, yaw: yw, walk, head: Math.max(0, Math.sin(u * .9 + i)) * .3 }; });
  if (u < 3) S.cam = cam([33.2, 15.5, 41.0], [39.5, 9.4, 48], 58);
  else if (u < 9) S.cam = cam([lerp(37.5, 41.5, seg(u, 3, 9)), 12.4, 41.2], [39.5, 9.5, 48], 60);
  else if (u < 15) S.cam = cam([34.0, 13.2, 43.2], [39.5, 9.6, 48.4], 58);
  else if (u < 18.4) S.cam = cam([lerp(41.5, 37.5, seg(u, 15, 18.4)), 12.2, 41.6], [39.5, 9.6, 48], 60);
  else if (u < 27) S.cam = cam([43.5, 15.8, 48.5], [37.5, 9.6, 39.5], 58);
  else { const a = 1.1 + (u - 27) * .06; S.cam = cam([39 + Math.cos(a) * 21, 19, 41 + Math.sin(a) * 21], [39, 9.5, 41], 58); }
  if (u > 9 && u < 15) S.overlays.push({ kind: 'pill', text: 'TIMELAPSE', col: '#1565c0', t0: 9 });
  if (u > 18.3 && u < 21.5) S.overlays.push({ kind: 'pop', t0: 18.3, text: 'FIRST HARVEST!', col: '#e3c35a' });
  if (u > 23.6 && u < 29) S.overlays.push({ kind: 'items', u, t0: 23.6, list: [['bread', 'BREAD'], ['steak', 'STEAK'], ['bed', 'BED']] });
};
EV.farm = [...FARM_TP.filter((_, i) => i % 3 === 0).map(t => [t, 'crunch', .35]), ...FARM_TP.filter((_, i) => i % 4 === 0).map(t => [t + .1, 'pop', .25]), [9, 'riser', .3], ...FARM_TH.filter((_, i) => i % 3 === 0).map(t => [t, 'crunch', .45]), [18.3, 'ding', .7],
  [17.5, 'moo', .7], [19.6, 'baa', .6], [21.0, 'moo', .6], [22.4, 'baa', .6], [24.6, 'moo', .5], [26.8, 'thud', .8], [23.8, 'pop', .5], [24.2, 'pop', .5], [24.6, 'pop', .5], [30.5, 'baa', .4]];

// ===== Stronghold: eye of ender, 12 eyes, portal opens =====
const EYE_T = FRAME_EYES.map((_, i) => 8 + i * .72), SHC = V(SH.x + .5, SH.y, SH.z + .5);
SCN.endportal = (S, u) => {
  if (u < 6) { envSet(S, 'sky'); P(S, V(.5, 9, -8.5), 0, u < .7 ? 'eye' : null, { use: seg(u, .3, .7), lookDown: -.25 });
    const k = clamp((u - .7) / 2.4), ep = V(.5 + k * 1.5, 10.4 + Math.sin(k * Math.PI * .5) * 6.5 - (u > 3.6 ? (u - 3.6) ** 2 * 2.2 : 0), -8.2 + k * 12);
    if (u > .7) { S.trail2 = { pts: [...Array(14)].map((_, i) => { const kk = clamp((u - .7 - i * .05) / 2.4); return V(.5 + kk * 1.5, 10.4 + Math.sin(kk * Math.PI * .5) * 6.5, -8.2 + kk * 12); }), dots: false }; S.eyeBall = ep; }
    S.cam = cam([-1.8, 11.2, -13.2], [1.2, 12.5, -1], 62); return; }
  envSet(S, 'stronghold'); S.torch2 = 1;
  const placed = EYE_T.filter(t => u >= t).length; S.eyes = placed; S.shPortal = seg(u, 17, 17.4);
  EYE_T.forEach((t, i) => { if (u >= t && u < t + .7) S.bursts.push({ type: 'eyep', t0: t, o: V(FRAME_EYES[i][0], FRAME_EYES[i][1] + .2, FRAME_EYES[i][2]), n: 14, sp: [.4, 1.4], up: [.6, 2], drag: 1.2, life: .7, size: .07, seed: 600 + i }); });
  if (u >= 17 && u < 18.5) S.bursts.push({ type: 'eyep', t0: 17, o: SHC.clone().add(V(0, 1, 0)), n: 70, sp: [1, 4], up: [1, 4], drag: 1, life: 1.4, size: .1, seed: 640 });
  if (u < 17) { const i = Math.min(11, Math.max(0, Math.floor((u - 7.6) / .72))), a = u < 7.6 ? FRAME_EYES[0][3] - .5 : lerp(FRAME_EYES[Math.max(0, i - 1)][3], FRAME_EYES[i][3], seg((u - 7.6) % .72, 0, .4)); const pp = SHC.clone().add(V(Math.sin(a) * 3.3, 0, Math.cos(a) * 3.3)); P(S, pp, a + Math.PI, 'eye', { use: u > 7.6 ? ((u - 7.6) / .72) % 1 : 0, lookDown: .45, walk: u < 7.6 ? u * 6 : 0, walkAmt: .4 }); }
  else if (u < 23.8) P(S, SHC.clone().add(V(0, 1, -1.9)), 0, 'sword', { lookDown: .6 });
  else { const k = seg(u, 23.8, 24.6), y = u < 24.6 ? SH.y + 1 + Math.sin(k * Math.PI) * .9 : SH.y + 1 - (u - 24.6) ** 2 * 3; P(S, SHC.clone().add(V(0, 0, lerp(-1.9, 0, k))).setY(y), 0, 'sword', { fall: u > 24.6 ? 1 : 0, time: u }); }
  if (u < 17) { const b = -2.6 + (u - 6) * .18; S.cam = cam([SHC.x + Math.sin(b) * 4.6, SH.y + 4.2, SHC.z + Math.cos(b) * 4.6], [SHC.x, SH.y + .8, SHC.z], 64); }
  else if (u < 24) S.cam = cam([SHC.x + 3.6, SH.y + 3.4, SHC.z - 4.4], [SHC.x, SH.y + .7, SHC.z], 60);
  else S.cam = cam([SHC.x + .3, SH.y + 5.8, SHC.z - .6], [SHC.x, SH.y - 2, SHC.z], 66);
  S.overlays.push({ kind: 'speed', text: `EYES: ${placed}/12`, col: '#2fae8a' });
  if (u > 17.2 && u < 21) S.overlays.push({ kind: 'pop', t0: 17.2, text: 'PORTAL OPEN!', col: '#2fae8a' });
  S.fade = seg(u, 27.6, 29.6);
};
EV.endportal = [[.5, 'whoosh', .6], [.7, 'sparkle', .6], [3.2, 'sparkle', .4], ...EYE_T.flatMap(t => [[t, 'click', .6], [t + .05, 'pop', .25]]), [16.4, 'riser', .6], [17, 'boom', .7], [17.05, 'sparkle', 1], [23.8, 'whoosh7', .7], [24.8, 'riser', .5]];

// ===== The Ender Dragon =====
const EC = V(END.x + .5, END.y + 1, END.z + .5), P0 = EC.clone().add(V(0, 0, -8.5)), PER = EC.clone().add(V(0, 5.3, .8));
const CT = [15.2, 17.6, 20.0, 22.4, 24.8, 27.2], CORD = [5, 0, 1, 4, 2, 3], HITS = [41.2, 42.9, 44.6, 46.3, 48.9, 50.6, 52.3], FINAL = 57.0;
function crystalFX(S, t0, o, u) { S.bursts.push({ type: 'cryst', t0, o, n: 110, sp: [4, 11], up: [-2, 8], g: 6, life: 1.2, size: .18, seed: 780 + Math.round(t0 * 10), tm: u }); S.bursts.push({ type: 'smoke', t0: t0 + .05, o, n: 30, sp: [.6, 2], up: [.2, 1.4], drag: .8, life: 1.4, size: .4, seed: 781 + Math.round(t0 * 10), tm: u }); S.rings.push({ t0, o, r: 5, life: .6, col: '#ff7ad9', tm: u }); if (u - t0 < .35) { S.flashT = t0; S.flashTm = u; } }
const circ = u => { const a = .3 * u + 1.2; return EC.clone().add(V(Math.cos(a) * 21, 17 + Math.sin(u * .7) * 2, Math.sin(a) * 21)); };
function bez(a, b, c, d, k) { const m = 1 - k; return a.clone().multiplyScalar(m * m * m).add(b.clone().multiplyScalar(3 * m * m * k)).add(c.clone().multiplyScalar(3 * m * k * k)).add(d.clone().multiplyScalar(k * k * k)); }
const DIVE = { a: circ(29.6), d: P0.clone().add(V(1.5, 4.2, -1.5)) };
function dragonPos(u) {
  if (u < 29.6) return circ(u);
  if (u < 33.6) return bez(DIVE.a, DIVE.a.clone().add(V(0, -4, -6)), DIVE.d.clone().add(V(0, 3, 10)), DIVE.d, eInQ(seg(u, 29.6, 33.6)) * .6 + seg(u, 29.6, 33.6) * .4);
  if (u < 36.6) return bez(DIVE.d, DIVE.d.clone().add(V(0, -1, -10)), EC.clone().add(V(-12, 16, -26)), EC.clone().add(V(-6, 16, 10)), seg(u, 33.6, 36.6));
  if (u < 39.6) return EC.clone().add(V(-6, 16, 10)).lerp(PER, eIO(seg(u, 36.6, 39.6)));
  if (u < 58.2) return PER.clone();
  return PER.clone().add(V(0, 12 * eIO(seg(u, 58.2, 66)), 0));
}
SCN.dragon = (S, u) => {
  envSet(S, 'end');
  const dp = dragonPos(u), dn = dragonPos(u + .05), v = dn.clone().sub(dp), hz = Math.hypot(v.x, v.z);
  const perched = u >= 39.6 && u < 58.2, dead = u >= 58.2;
  const hurt = HITS.some(h => u >= h && u < h + .25) || (u >= FINAL && u < FINAL + .4);
  const hp = u < HITS[0] ? 1 : u >= FINAL ? 0 : 1 - (HITS.filter(h => u >= h).length / (HITS.length + 1));
  S.dragon = { pos: dp, yaw: perched || dead ? Math.PI : Math.atan2(v.x, v.z), pitch: perched || dead ? 0 : -Math.atan2(v.y, Math.max(hz, .001)) * .7, roll: perched || dead ? 0 : -Math.sin(u * .3) * .25,
    flap: perched ? 0 : dead ? Math.sin(u * 1.5) * .15 : Math.sin(u * (u > 29.6 && u < 33.6 ? 2 : 4.2)), fold: perched ? 1 : 0, neck: perched ? .32 : dead ? -.15 : .04, jaw: (u > 41 && u < 42) || (u > 50 && u < 51.2) || (u > 4 && u < 5.2) ? .9 : dead ? .7 : .1, hurt, scale: dead ? 1 - seg(u, 66, 68) : 1, gone: u >= 68 };
  S.crystals = CRYSTALS.map((_, i) => u < CT[CORD.indexOf(i)]);
  CORD.forEach((ci, k) => { const t0 = CT[k], cp = CRYSTALS[ci].position; if (u >= t0 - .55 && u < t0) { const a = P0.clone().add(V(0, 1.45, 0)), kk = seg(u, t0 - .55, t0); S.arrows = S.arrows || []; S.arrows.push(a.lerp(cp, kk)); }
    if (u >= t0) crystalFX(S, t0, cp.clone(), u); });
  if (u < 58.2) S.crystals.forEach((alive, i) => { if (!alive) return; S.beam = S.beam || []; S.beam.push([CRYSTALS[i].position, dp]); });
  let pp = P0.clone(), yaw = 0, held = u < 13.6 ? 'sword' : u < 29.6 ? 'bow' : 'sword', p = {};
  if (u >= 13.6 && u < 29.6) { const k = Math.min(5, CT.findIndex(t => u < t + .4) < 0 ? 5 : CT.findIndex(t => u < t + .4)), tp = CRYSTALS[CORD[k]].position; yaw = Math.atan2(tp.x - pp.x, tp.z - pp.z); const t0 = CT[k]; p.use = u > t0 - 1.1 && u < t0 - .5 ? seg(u, t0 - 1.1, t0 - .55) : 0; p.lookDown = -.5; }
  if (u >= 29.6 && u < 37.6) { const k = seg(u, 32.9, 33.6); pp = P0.clone().add(V(2.4 * eOutC(k), Math.sin(k * Math.PI) * 1.1, 0)); yaw = Math.atan2(dp.x - pp.x, dp.z - pp.z); }
  if (u >= 37.6 && u < 58.2) { const k = seg(u, 38.2, 40.6); pp = P0.clone().add(V(2.4 * (1 - k), 0, .5 * eIO(k))); yaw = k < 1 && u > 38.2 ? Math.atan2(-2.4, .5) : 0; if (u > 38.2 && u < 40.6) p.walk = u * 8;
    const sw = [...HITS, FINAL].find(h => u > h - .35 && u < h + .1); if (sw) p.use = seg(u, sw - .35, sw + .1); p.lookDown = -.35; }
  if (u >= 58.2) { pp = P0.clone().add(V(0, 0, .5 - 1.2 * eIO(seg(u, 58.2, 60)))); p.lookDown = -.7; }
  P(S, pp, yaw, held, p);
  const HEAD = EC.clone().add(V(.3, 2.2, -6.7));
  [...HITS, FINAL].forEach((h, i) => { if (u >= h && u < h + .7) S.bursts.push({ type: 'crit', t0: h, o: HEAD.clone(), n: i === HITS.length ? 60 : 26, sp: [1.5, 4.5], up: [0, 4], drag: 2, life: .6, size: .1, seed: 700 + i }); });
  if (u >= FINAL) absHit(S, FINAL, .5);
  if (u >= 33.2 && u < 34.2) { S.bursts.push({ type: 'wind', t0: 33.2, o: P0.clone().add(V(0, .5, 0)), n: 70, sp: [5, 11], up: [0, 3], drag: 3, life: .8, size: .2, seed: 720 }); S.bursts.push({ type: 'dust', t0: 33.3, o: P0.clone().add(V(0, .2, 0)), n: 50, sp: [2, 6], up: [1, 4], g: 10, life: 1, size: .15, seed: 721 }); }
  if (u >= 33.3) absHit(S, 33.3, .35);
  if (dead) { S.beams = { o: dp.clone(), n: Math.floor(16 * seg(u, 58.4, 63)), a: Math.min(1, 1 - seg(u, 66, 67.6)) };
    [61, 62.6, 64.2, 65.6, 66.8].forEach((t0, i) => { if (u >= t0 && u < t0 + 2) S.bursts.push({ type: 'xp', t0, o: dp.clone(), n: 60, sp: [3, 9], up: [-2, 6], g: 4, drag: .6, life: 2, size: .16, seed: 740 + i }); }); }
  S.exitPortal = seg(u, 67, 68.5); S.egg = u >= 68.6;
  if (u < 6) { const b = -1.9 + u * .05; S.cam = cam([EC.x + Math.cos(b) * 40, EC.y + 21, EC.z + Math.sin(b) * 40], [EC.x, EC.y + 7, EC.z], 62); }
  else if (u < 13.6) S.cam = { pos: P0.clone().add(V(2.4, 2.4, -3.4)), look: dp.clone().lerp(EC.clone().add(V(0, 8, 0)), .35), fov: 62 };
  else if (u < 28.6) { const k = Math.min(5, Math.max(0, CT.findIndex(t => u < t + .9))), prev = CRYSTALS[CORD[Math.max(0, k - 1)]].position, cur = CRYSTALS[CORD[k < 0 ? 5 : k]].position; const lk = prev.clone().lerp(cur, eIO(seg(u, (k ? CT[k - 1] : 13.6) + .6, (k ? CT[k - 1] : 13.6) + 1.4))); const dir = lk.clone().sub(P0).setY(0).normalize(); S.cam = { pos: P0.clone().add(dir.clone().multiplyScalar(-3.2)).add(V(-dir.z * 1.3, 2.3, dir.x * 1.3)), look: lk, fov: 56 }; }
  else if (u < 37.6) S.cam = { pos: P0.clone().add(V(5.2, 1.7, -5.4)), look: pp.clone().lerp(dp, .5).add(V(0, 1, 0)), fov: 64 };
  else if (u < 55.4) S.cam = cam([EC.x + lerp(10.5, 9, seg(u, 37.6, 55.4)), EC.y + 4.6, EC.z - 8.2], [EC.x, EC.y + 3.0, EC.z - 2.6], 60);
  else if (u < 58.6) S.cam = cam([EC.x + 4.4, EC.y + 2.7, EC.z - 11.2], [EC.x + .3, EC.y + 2.0, EC.z - 6.8], 54);
  else S.cam = cam([EC.x + lerp(6.5, 5, seg(u, 58.6, 72)), EC.y + 3.2, EC.z - lerp(23, 18, seg(u, 58.6, 72))], [EC.x, EC.y + lerp(10, 7, seg(u, 64, 70)), EC.z], 64);
  if (u > 1 && u < 69) S.overlays.push({ kind: 'bossbar', hp, u });
  if (u >= 13.6 && u < 29.6) S.overlays.push({ kind: 'speed', text: `CRYSTALS: ${6 - S.crystals.filter(Boolean).length}/6`, col: '#ff7ad9' });
  if (u > 33.4 && u < 36) S.overlays.push({ kind: 'pop', t0: 33.4, text: 'DODGED!', col: '#5cff7a' });
  if (u > 55.4 && u < 58.6) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 55.4 });
  if (u > 60.4 && u < 64) S.overlays.push({ kind: 'pop', t0: 60.4, text: 'DRAGON DEFEATED!', col: '#ffd400' });
};
EV.dragon = [[4, 'roar', .9], [9.2, 'roar', .7], ...[...Array(24)].map((_, i) => [1 + i * 1.2, 'flap', .35]), ...CT.flatMap(t => [[t - 1.1, 'bowdraw', .5], [t - .55, 'bowshot', .7], [t, 'explode', .8]]), [29.8, 'roar', 1], [32.4, 'dive', .9], [33.2, 'windburst', .9], [33.0, 'gasp', .6],
  ...[34.6, 35.8, 37, 38.2].map(t => [t, 'flap', .45]), [39.6, 'thud', 1], [41, 'roar', .9], ...HITS.map(t => [t, 'hit', 1]), [50, 'roar', .8], [55.4, 'riser', .5], [FINAL, 'smash', 1.3], [58.4, 'roar', 1.1], [58.6, 'riser', .9], [60.4, 'ding', .8], [66.4, 'boom', 1.1], [67, 'sparkle', 1], [68.6, 'pop', .6]];

// ===== Day 100: base tour + outro =====
SCN.tour = (S, u) => {
  envSet(S, 'sky', 'sunset', seg(u, 20, 40) * .7); S.portal2 = 1; PF2.forEach(([x, y]) => S.dyn.push({ x, y, z: PZ2, tex: 'obsidian' }));
  P(S, V(47.5, 13, 42.5), Math.PI * .8 + u * .04, 'mace', {}, { wings: .15 });
  S.egg100 = true;
  if (u < 27) { const a = -2.3 + u * .075; S.cam = cam([41 + Math.cos(a) * 27, lerp(21, 16, seg(u, 0, 27)), 40 + Math.sin(a) * 27], [41, 9.8, 40], 58); }
  else { const a = -.2 + (u - 27) * .05; S.cam = cam([47.5 + Math.cos(a) * 9, 15.5, 42.5 + Math.sin(a) * 9], [47.5, 13.8, 42.5], 56); }
  if (u > 1.5 && u < 25) [['hut', V(51.5, 12.3, 23.5), 1.5, 'FIRST NIGHT'], ['house', V(47.5, 14.6, 42.5), 4.8, 'HOME'], ['farm', V(39.5, 10.6, 48.5), 6.5, 'FARM'], ['pen', V(31.5, 11.4, 35.5), 8, 'ANIMALS'], ['portal', V(32, 14.6, 47.5), 9.6, 'NETHER PORTAL']].forEach(([, at, t0, text]) => S.overlays.push({ kind: 'tag', at, text, col: '#ffd400', t0, until: 25 }));
  if (u > 27) S.overlays.push({ kind: 'outro2', t0: S.u0 + 27 });
};
EV.tour = [[1.5, 'pop', .4], [4.8, 'pop', .4], [6.5, 'pop', .4], [8, 'pop', .4], [9.6, 'pop', .4], [8.2, 'moo', .3], [27.2, 'pop', .7], [28.0, 'pop', .6], [29.6, 'click', 1], [29.75, 'bell', .9]];

// ===== timeline =====
const HOOK = [[15, 21.0], [8, 6.3], [7, 10.3], [2, 15.0], [15, 46.4], [10, 5.0], [17, 3.1], [15, 60.0]];
function baseFlags(S, si) { S.hut = si >= 3; S.house = si >= 4 && si !== 8; S.farm = si >= 6 ? 'grown' : null; S.pen = si >= 6; S.gate = true; S.animals = si >= 6 ? 'idle' : null; S.ring = si >= 9; }
function runSeg(si, u, S) {
  const sg = SEGS[si]; S.si = si; S.u = u; S.u0 = sg.start; baseFlags(S, si);
  if (sg.kind === 'clip') { const c = CLIPS.find(c => c.n === sg.clip); c.f(S, u); if (sg.nopop) S.overlays = S.overlays.filter(o => o.kind !== 'pop'); (sg.pops || []).forEach(([t0, text, col]) => { if (u > t0) S.overlays.push({ kind: 'pop', t0, text, col }); }); }
  else SCN[sg.kind](S, u);
  if (S.animals === 'idle') S.animals = animalsIdle(S.t);
  if (S.farm === 'grown') S.farm = { g: FARM_CELLS.map(() => 1), tilled: FARM_CELLS.map(() => true) };
}
window.TIMELINE = { TOTAL, segs: SEGS.map(sg => ({ kind: sg.kind, start: sg.start, dur: sg.dur, ev: sg.kind === 'clip' ? CLIPS.find(c => c.n === sg.clip).ev : (EV[sg.kind] || []) })) };
function newState(t) { return { t, u: 0, u0: 0, env: 'sky', env2: null, envK: 0, fp: false, held: null, swing: 0, switchT: null, player: { visible: false, pos: V(0, 0, 0), yaw: 0, p: {}, wings: 0 }, mobs: [], dyn: [], water: [], bursts: [], rings: [], hits: [], overlays: [], filter: '', trail2: null, boat: null, bed: 0, portal2: 0, xray: null, crater: null, hoops: null, nausea: 0, flashT: null, flashTm: null, fade: 0 }; }
function stateAt(t) {
  let si = SEGS.findIndex(sg => t < sg.start + sg.dur); if (si < 0) si = SEGS.length - 1; const sg = SEGS[si];
  const S = newState(t);
  if (sg.kind === 'hook') { const sd = sg.dur / HOOK.length, i = Math.min(HOOK.length - 1, Math.floor(t / sd)), [ssi, uu] = HOOK[i]; runSeg(ssi, uu + (t - i * sd), S); S.u0 = t - S.u; S.overlays = S.overlays.filter(o => o.kind === 'speedlines'); S.overlays.push({ kind: 'title100' }); S.cut = i * sd; S.hook = true; S.fade = 0; return S; }
  runSeg(si, t - sg.start, S); S.cut = sg.start;
  if (sg.day != null) S.overlays.push({ kind: 'daycard', day: sg.day, label: sg.label || ('DAY ' + sg.day), title: sg.title, u: t - sg.start });
  return S;
}

// ---------- apply ----------
const ENV = {
  sky: { fog: [SKY.getHex(), 70, 200], hemi: 1.05, hcol: 0xe8f4ff, sun: 1.5, cam: 0, dome: true, bg: null, top: 0x3f86e0, mid: 0x9fd0ff, stars: 0, sunC: 0xffffff },
  sunset: { fog: [0xe0956a, 55, 185], hemi: .8, hcol: 0xffd2b4, sun: .95, cam: 0, dome: true, bg: null, top: 0x3a4c8a, mid: 0xff9a5a, stars: .15, sunC: 0xffb070 },
  night: { fog: [0x0b1430, 26, 115], hemi: .42, hcol: 0x8a9ad8, sun: .14, cam: 0, dome: true, bg: null, top: 0x02050f, mid: 0x14204a, stars: 1, sunC: 0xd8e2ff },
  end: { fog: [0x0e0919, 45, 175], hemi: 1.0, hcol: 0xdccfff, sun: .4, cam: 0, dome: false, bg: 0x0e0919, top: 0x0e0919, mid: 0x0e0919, stars: .9, sunC: 0xffffff },
  stronghold: { fog: [0x050507, 6, 30], hemi: .5, hcol: 0xe8f4ff, sun: .1, cam: 1.4, dome: false, bg: 0, top: 0, mid: 0, stars: 0, sunC: 0xffffff },
  mine: { fog: [0x050507, 3, 22], hemi: .32, hcol: 0xe8f4ff, sun: .12, cam: 2.8, dome: false, bg: 0, top: 0, mid: 0, stars: 0, sunC: 0xffffff },
  nether: { fog: [0x4a1409, 14, 95], hemi: 1.15, hcol: 0xffc29a, sun: .45, cam: 1.6, dome: false, bg: 0x2a0905, top: 0, mid: 0, stars: 0, sunC: 0xffffff },
  tunnel: { fog: [0x2a0a06, 6, 34], hemi: 1.05, hcol: 0xffc29a, sun: .3, cam: 4.2, dome: false, bg: 0, top: 0, mid: 0, stars: 0, sunC: 0xffffff } };
const cA = new THREE.Color(), cB = new THREE.Color();
const mixC = (a, b, k, out) => out.setHex(a).lerp(cB.setHex(b), k);
function applyHuman(h, st) {
  h.g.visible = !!st.visible; if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(st.tilt || 0, st.yaw || 0, 0); pose(h, st.p || {});
  if (st.sit) { h.legL.rotation.x = -1.45; h.legR.rotation.x = -1.45; h.armL.rotation.x = -.5; h.armR.rotation.x = -.5; }
  if (st.crouch) { h.legL.rotation.x += .35 * st.crouch; h.g.rotation.x += .28 * st.crouch; }
  if (st.held && ICON[st.held]) { h.item.visible = true; h.item.material.map = ICON[st.held]; } else h.item.visible = false;
}
const tmpC = new THREE.Color();
function apply(S) {
  const t = S.t, A = ENV[S.env], B = S.env2 ? ENV[S.env2] : A, k = S.env2 ? S.envK : 0;
  mixC(A.fog[0], B.fog[0], k, scene.fog.color); scene.fog.near = lerp(A.fog[1], B.fog[1], k); scene.fog.far = lerp(A.fog[2], B.fog[2], k);
  scene.background = A.bg == null && B.bg == null ? null : mixC(A.bg ?? A.fog[0], B.bg ?? B.fog[0], k, new THREE.Color());
  const dome = A.dome || B.dome; scene.userData.dome.visible = dome; scene.userData.sun.visible = dome && lerp(A.stars, B.stars, k) < .9; clouds.visible = dome;
  const un = scene.userData.dome.material.uniforms; mixC(A.top, B.top, k, un.top.value); mixC(A.mid, B.mid, k, un.mid.value);
  scene.userData.sun.material.color.copy(mixC(A.sunC, B.sunC, k, tmpC));
  hemi.intensity = lerp(A.hemi, B.hemi, k); mixC(A.hcol, B.hcol, k, hemi.color); sunL.intensity = lerp(A.sun, B.sun, k); camLight.intensity = lerp(A.cam, B.cam, k);
  starPts.material.opacity = lerp(A.stars, B.stars, k); starPts.visible = starPts.material.opacity > .01;
  applyHuman(PLAYER, S.player); wings.visible = PLAYER.g.visible && (S.player.wings || 0) > 0; const ws = S.player.wings || 0;
  wingL.rotation.set(0, .2 + .9 * ws, -.1 - .55 * ws); wingR.rotation.set(0, -.2 - .9 * ws, .1 + .55 * ws);
  [GHOST, GHOST2].forEach(h => h.g.visible = false); outline.visible = false; trail.visible = false; orb.visible = false;
  const zs = S.mobs.filter(m => m.kind === 'zombie'); ZOMBIES.forEach((z, i) => { const m = zs[i]; z.g.visible = !!m && m.alive; if (!z.g.visible) return; z.g.position.copy(m.pos); z.g.rotation.set(0, m.yaw, 0); pose(z, { walk: m.dead ? 0 : m.walk, zombie: true }); if (m.dead) { z.g.rotation.x = m.dead * 1.3; } z.mats.forEach(mt => mt.emissive.setHex(m.hurt ? 0xaa0000 : 0)); });
  const cr = S.mobs.find(m => m.kind === 'creeper'); CREEPER.visible = !!cr && cr.alive; if (cr) { CREEPER.position.copy(cr.pos); CREEPER.rotation.set(0, cr.yaw, 0); const sw = cr.swell; CREEPER.scale.set(1 + sw * .25, 1 + sw * .12, 1 + sw * .25); const fl = sw > 0 && Math.floor(t * 8) % 2 === 0; CREEPER.userData.mats.forEach(m => m.emissive.setHex(fl ? 0x888888 : 0)); CREEPER.userData.legs.forEach((l, i) => l.rotation.x = sw > 0 ? 0 : Math.sin(t * 8 + i * Math.PI) * .4); }
  waterPool.forEach(w => w.visible = false); let wi = 0;
  for (const w of S.water) { const c = w.c, a = w.a; waterMat.opacity = .72 * w.alpha; const put = (dx, dz, h) => { if (h <= .02 || wi >= waterPool.length) return; const m = waterPool[wi++]; m.visible = true; m.scale.set(1, h, 1); m.position.set(c.x + dx + .5, c.y + h / 2, c.z + dz + .5); };
    put(0, 0, .88 * clamp(a * 2.5)); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => put(dx, dz, .62 * clamp(a * 2 - .4))); }
  // base pieces
  HUT_MESH.forEach(m => m.visible = !!S.hut); HOUSE_MESH.forEach(m => m.visible = !!S.house); if (S.house) HOUSE_GLASS.forEach(([x, y, z]) => S.dyn.push({ x, y, z, tex: 'glass' }));
  torchRing.visible = !!S.ring; penG.visible = !!S.pen; gateG.visible = !!S.pen && S.gate !== false;
  farmG.visible = !!S.farm; wheatIM.visible = !!S.farm;
  if (S.farm) { farmG.children.forEach((c, i) => c.visible = i < FARM_CELLS.length ? S.farm.tilled[i] : true);
    FARM_CELLS.forEach(([x, z], i) => { const g = S.farm.g[i]; if (g <= 0) m4.makeScale(0, 0, 0); else m4.makeScale(1, .12 + .92 * g, 1).setPosition(x + .5, 9.012, z + .5); wheatIM.setMatrixAt(i, m4); tmpC.set('#5fbf3a').lerp(cB.set('#e3c35a'), clamp((g - .7) / .3)); wheatIM.setColorAt(i, tmpC); });
    wheatIM.instanceMatrix.needsUpdate = true; wheatIM.instanceColor.needsUpdate = true; }
  const an = Array.isArray(S.animals) ? S.animals : null; ANIMALS.forEach((a, i) => { const st = an && an[i]; a.g.visible = !!st; if (!st) return; a.g.position.copy(st.pos); a.g.rotation.set(0, st.yaw, 0); const s = st.walk ? Math.sin(st.walk) : 0; a.legs.forEach((l, j) => l.rotation.x = (j === 0 || j === 3 ? s : -s) * .5); a.head.rotation.x = st.head || 0; });
  hutTorch.visible = (S.torch || 0) > 0; if (hutTorch.visible) hutTorch.position.set(51.5, 9.7, 23.14); torchL.intensity = (S.torch || 0) * 2.4; torchL.position.set(51.5, 10.6, 23.6);
  torchL2.intensity = (S.torch2 || 0) * 2.2; torchL2.position.set(SHC.x, SH.y + 3.5, SHC.z);
  for (let i = 0; i < 12; i++) { if (i < (S.eyes || 0)) { const e = FRAME_EYES[i]; m4.makeTranslation(e[0], e[1], e[2]); } else m4.makeScale(0, 0, 0); eyeIM.setMatrixAt(i, m4); } eyeIM.instanceMatrix.needsUpdate = true;
  starMat.opacity = .95 * (S.shPortal || 0); shPortal.visible = (S.shPortal || 0) > 0; T.stars.offset.set(t * .02, t * .013);
  exitPortal.material.opacity = .95 * (S.exitPortal || 0); exitPortal.visible = (S.exitPortal || 0) > 0;
  CRYSTALS.forEach((c, i) => { const on = S.env === 'end' && S.crystals && S.crystals[i]; c.visible = !!on; if (on) { c.children[0].rotation.set(t * 1.2, t * 1.7, 0); c.userData.cage.rotation.set(t * .8, t * .5, t * .3); c.position.y = PILLARS[i].top + 2.2 + Math.sin(t * 2 + i) * .25; } });
  egg.visible = !!S.egg;
  const d = S.dragon; DRAGON.g.visible = !!d && !d.gone && d.scale > .01;
  if (DRAGON.g.visible) { const g = DRAGON.g; g.position.copy(d.pos); g.rotation.set(d.pitch, d.yaw, d.roll); g.scale.setScalar(1.35 * d.scale);
    const lift = d.flap * .6 * (1 - d.fold), fold = d.fold; DRAGON.wl.sh.rotation.set(0, -fold * .95, -lift + fold * .75); DRAGON.wr.sh.rotation.set(0, fold * .95, lift - fold * .75); DRAGON.wl.tip.rotation.set(0, -fold * .6, -d.flap * .45 * (1 - fold) + fold * .9); DRAGON.wr.tip.rotation.set(0, fold * .6, d.flap * .45 * (1 - fold) - fold * .9);
    DRAGON.neck.forEach((s, i) => s.rotation.set(d.neck * (i < 2 ? 1 : 1.2), Math.sin(t * 1.3 + i) * .05, 0)); DRAGON.head.rotation.x = d.neck > .2 ? -.5 : 0; DRAGON.jaw.position.y = -.42 - d.jaw * .25; DRAGON.jaw.rotation.x = d.jaw * .35;
    DRAGON.tail.forEach((s, i) => s.rotation.set(-.05, Math.sin(t * 2 + i * .7) * .14, 0)); DRAGON.legs.forEach(l => l.rotation.x = d.fold ? 0 : 1.0);
    DRAGON.mats.forEach(m => m.emissive && m.emissive.setHex(d.hurt ? 0x990000 : 0)); }
  beamPool.forEach((b, i) => { const bs = S.beams; b.visible = !!bs && i < bs.n; if (!b.visible) return; const r = rng(900 + i); b.position.copy(bs.o); b.rotation.set(r() * Math.PI * 2 + t * .3 * (r() - .5), r() * Math.PI * 2, r() * Math.PI * 2 + t * .2); b.material.opacity = bs.a * (.45 + .35 * Math.sin(t * 6 + i)); });
  const cnt = {}; for (const kk of Object.keys(DYN)) cnt[kk] = 0;
  for (const dd of S.dyn) { const im = DYN[dd.tex]; if (!im) continue; const i = cnt[dd.tex]++; if (i >= 200) continue; const s = (dd.pop ?? 1) * (1 + (dd.wob ? Math.sin(t * 60) * .03 * dd.wob : 0)); m4.makeScale(s, s, s).setPosition(dd.x + .5, dd.y + .5, dd.z + .5); im.setMatrixAt(i, m4); }
  for (const [kk, im] of Object.entries(DYN)) { for (let i = cnt[kk]; i < 200; i++) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; }
  xrayPool.forEach(([l, m], i) => { const h = S.xray && S.xray[i]; l.visible = m.visible = !!h; if (h) { l.position.set(h[0] + .5, h[1] + .5, h[2] + .5); m.position.copy(l.position); m.material.opacity = .3 * (S.xrayA ?? 1); } });
  bed.visible = S.bed > 0; if (bed.visible) bed.position.set(DXX + .5, 15, 24);
  boat.visible = !!S.boat; if (S.boat) boat.position.copy(S.boat);
  portal2.visible = S.portal2 > 0; if (portal2.visible) portal2.scale.set(1, S.portal2, 1); portalNE.visible = S.env === 'nether';
  T.portal.offset.set(Math.sin(t * .7) * .1, t * .18); lavaSeaTex.offset.set(t * .02, t * .01); T.lava.offset.set(t * .05, t * .03);
  MOLD.forEach(m => m.visible = !!S.mold); crater.visible = !!S.crater; if (S.crater) { crater.position.copy(S.crater[0]); crater.scale.setScalar(Math.max(.01, S.crater[1])); }
  HOOPS.forEach((h, i) => { const o = S.hoops && S.hoops[i]; h.visible = !!o; if (o) { h.position.copy(o.pos); h.rotation.set(0, o.yaw, 0); h.material.color.set(o.passed ? '#5cff7a' : '#ffd23e'); } });
  const c = S.cam; camera.fov = c.fov || 62; camera.updateProjectionMatrix(); const sh = shake(t, S.hits); camera.position.copy(c.pos).add(sh);
  if (c.look) camera.lookAt(c.look.clone().add(sh)); else camera.lookAt(camera.position.clone().add(c.dir || dirFrom(c.yaw || 0, c.pitch || 0)));
  scene.userData.dome.position.copy(camera.position); scene.userData.sun.position.copy(camera.position).add(V(120, 220, -260)); clouds.position.x = t * 1.2; starPts.position.copy(camera.position);
  window.ISLAND && window.ISLAND.forEach(m => m.visible = true);
  fp.visible = S.fp; if (S.fp) { const sw = S.swing || 0, sx = Math.sin(sw * Math.PI), ss = S.switchT != null ? S.u - S.switchT : 9, dip = ss >= 0 && ss < .3 ? Math.sin(Math.PI * ss / .3) * .35 : 0, bob = Math.sin(t * 8) * .012;
    fpArm.position.set(.42, -.4 - dip + bob, -.62 + sx * .15); fpArm.rotation.set(deg(10) - sx * .9, deg(-12), 0); fpItem.visible = !!S.held; if (S.held) fpItem.material.map = ICON[S.held]; fpItem.position.set(.33, -.22 - dip + bob - sx * .05, -.78 + sx * .1); fpItem.rotation.set(-sx * .8, deg(-55), deg(18)); }
  const plist = []; for (const b of S.bursts) burstParticles(b, b.tm != null ? b.tm : S.u, plist);
  if (S.trail2) S.trail2.pts.forEach((p, i) => plist.push([p.x, p.y, p.z, S.trail2.dots ? .3 : .2 * (1 - i / S.trail2.pts.length), S.trail2.dots ? '#ffd400' : (S.eyeBall ? (i % 2 ? '#a64cff' : '#2fae8a') : (i % 2 ? '#fff3a6' : '#ff9a1f'))]));
  if (S.eyeBall) plist.push([S.eyeBall.x, S.eyeBall.y, S.eyeBall.z, .32, '#1e6e56']);
  (S.arrows || []).forEach(a => { plist.push([a.x, a.y, a.z, .16, '#ffffff']); });
  (S.beam || []).forEach(([a, b], j) => { for (let i = 0; i < 18; i++) { const k = ((i / 18) + t * .8) % 1; const p = a.clone().lerp(b, k); plist.push([p.x, p.y, p.z, .12, i % 2 ? '#ff7ad9' : '#ffb8f0']); } });
  const col = new THREE.Color(); for (let i = 0; i < PMAX; i++) { if (i < plist.length) { const [x, y, z, s, cc] = plist[i]; m4.makeScale(s, s, s).setPosition(x, y, z); col.set(cc); } else m4.makeScale(0, 0, 0); parts.setMatrixAt(i, m4); parts.setColorAt(i, i < plist.length ? col : col.set('#000')); }
  parts.instanceMatrix.needsUpdate = true; parts.instanceColor.needsUpdate = true;
  ringPool.forEach(r => r.visible = false); let ri = 0;
  for (const r of S.rings) { const tt = r.tm != null ? r.tm : S.u, age = tt - r.t0; if (age < 0 || age > r.life || ri >= ringPool.length) continue; const m = ringPool[ri++], kq = age / r.life; m.visible = true; m.position.copy(r.o); m.rotation.set(Math.PI / 2, 0, 0); const s = r.r * eOutC(kq) + .2; m.scale.set(s, s, 1 + s * .3); m.material.color.set(r.col); m.material.opacity = (1 - kq) * .9; }
}

// ---------- overlays ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const ctx = comp.getContext('2d');
const FONT = (s, w = 900) => `${w} ${s}px "Inter", "Inter Display", sans-serif`;
function txt(s, x, y, size, fill, o = {}) { ctx.save(); ctx.font = FONT(size, o.w || 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; if (o.rot || o.scale) { ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale); x = 0; y = 0; } ctx.globalAlpha *= (o.alpha ?? 1); if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = o.lw || size * .16; ctx.strokeText(s, x, y); } ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore(); }
function rrect(x, y, w, h, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function project(v) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, vis: p.z < 1 }; }
function icon(name, x, y, s) { const c = ICON[name] && ICON[name].userData.canvas; if (!c) return; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, x - s / 2, y - s / 2, s, s); ctx.restore(); }
function heart(x, y, s, full) { const P = ['.XX.XX.', 'XrrXrrX', 'XrrrrrX', '.XrrrX.', '..XrX..', '...X...']; P.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; ctx.fillStyle = ch === 'X' ? '#1a0000' : (full ? (j < 2 && i % 3 === 1 ? '#ff8a8a' : '#e3262b') : '#3a3a3a'); ctx.fillRect(x + i * s, y + j * s, s, s); })); }
function wrapLines(s, maxW, size) { ctx.font = FONT(size, 800); const words = s.split(' '), lines = []; let cur = ''; for (const w of words) { const tryS = cur ? cur + ' ' + w : w; if (ctx.measureText(tryS).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS; } if (cur) lines.push(cur); return lines; }
function drawCaption(t) { const c = CAPS.find(([a, b]) => t >= a && t < b + .15); if (!c) return; const a = Math.min(seg(t, c[0], c[0] + .12), 1 - seg(t, c[1], c[1] + .15)); const lines = wrapLines(c[2], 1180, 48); ctx.save(); ctx.globalAlpha = a; lines.forEach((ln, i) => txt(ln, W / 2, H - 92 - (lines.length - 1 - i) * 60, 48, '#ffffff', { w: 800, lw: 9 })); ctx.restore(); }
function drawOverlays(S) {
  const t = S.t, u = S.u;
  if (S.nausea) { const n = S.nausea; ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .1, W / 2, H / 2, H * .9); g.addColorStop(0, `rgba(160,60,255,${.25 * n})`); g.addColorStop(1, `rgba(90,20,170,${.85 * n})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  for (const o of S.overlays) {
    if (o.kind === 'daycard') { const k = eOutBack(seg(o.u, .1, .5)), big = 1 - seg(o.u, 2.5, 3.0);
      if (big > 0) { ctx.save(); ctx.globalAlpha = big; ctx.translate(W / 2, H * .4); ctx.scale(k, k); txt(o.label, 0, -40, 210, '#ffd400', { lw: 28 }); ctx.font = FONT(70); const w = ctx.measureText(o.title).width + 80; rrect(-w / 2, 82, w, 106, 18, '#e53935', '#000', 7); txt(o.title, 0, 137, 70, '#fff', { lw: 11 }); ctx.restore(); }
      if (o.u > 2.7) { const a = seg(o.u, 2.7, 3.1); ctx.save(); ctx.globalAlpha = a; rrect(36, 36, 300, 112, 20, 'rgba(0,0,0,.66)', '#ffd400', 4); txt('DAY ' + o.day, 186, 74, 44, '#ffd400', { stroke: false }); for (let i = 0; i < 10; i++) heart(60 + i * 26, 106, 3, true); ctx.restore(); } }
    else if (o.kind === 'pill') { const a = seg(u, o.t0, o.t0 + .2); ctx.save(); ctx.globalAlpha = a; ctx.font = FONT(34); const w = ctx.measureText(o.text).width + 74; rrect(48, 168, w, 62, 31, o.col, 'rgba(0,0,0,.35)', 3); ctx.fillStyle = Math.floor(t * 2.5) % 2 ? '#fff' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(80, 199, 10, 0, 7); ctx.fill(); txt(o.text, 102, 200, 34, '#fff', { align: 'left', stroke: false }); ctx.restore(); }
    else if (o.kind === 'speed') { ctx.font = FONT(40); const w = ctx.measureText(o.text).width + 64; rrect(W - 48 - w, 48, w, 76, 14, 'rgba(0,0,0,.62)', o.col || '#ffd400', 3); txt(o.text, W - 48 - w / 2, 87, 40, o.col || '#ffd400', { stroke: false }); }
    else if (o.kind === 'pop') { const k = eOutBack(seg(u, o.t0, o.t0 + .3)), a = 1 - seg(u, o.t0 + 2.6, o.t0 + 3.0); if (u < o.t0) continue; txt(o.text, W / 2, H * .3, 120, o.col, { scale: Math.max(.01, k), alpha: a, rot: -.04, lw: 20 }); }
    else if (o.kind === 'tag') { if (u < o.t0 || (o.until && u > o.until)) continue; const p = project(o.at); if (!p.vis) continue; const k = eOutBack(seg(u, o.t0, o.t0 + .3)) * (o.until ? 1 - seg(u, o.until - .4, o.until) : 1); if (k <= .01) continue; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k); ctx.font = FONT(42); const w = ctx.measureText(o.text).width + 50; rrect(-w / 2, -36, w, 72, 12, 'rgba(0,0,0,.72)', o.col, 4); txt(o.text, 0, 2, 42, o.col, { stroke: false }); ctx.restore(); }
    else if (o.kind === 'speedlines') { const r = rng(Math.floor(t * 30)); ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; for (let i = 0; i < 36; i++) { const a = r() * Math.PI * 2, r0 = 360 + r() * 300, r1 = r0 + 120 + r() * 260; ctx.lineWidth = 2 + r() * 5; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * .7); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1 * .7); ctx.stroke(); } ctx.restore(); }
    else if (o.kind === 'craft') { const steps = [[15.0, 'log', 'planks', 'PLANKS'], [17.0, 'planks', 'craft', 'CRAFTING TABLE'], [19.6, 'craft', 'wpick', 'WOODEN PICKAXE']]; const st = [...steps].reverse().find(s => o.u >= s[0]); if (!st) continue; const a = Math.min(seg(o.u, 15, 15.3), 1 - seg(o.u, 22.8, 23.2)), pk = eOutBack(seg(o.u, st[0], st[0] + .3));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W - 330, H * .5); rrect(-260, -150, 520, 300, 22, 'rgba(20,16,12,.78)', '#d9b07a', 5); rrect(-215, -95, 150, 150, 14, 'rgba(255,255,255,.1)', 'rgba(255,255,255,.25)', 3); rrect(65, -95, 150, 150, 14, 'rgba(255,255,255,.1)', '#ffd400', 4);
      icon(st[1], -140, -20, 112); txt('→', 0, -20, 90, '#ffffff', { stroke: false }); ctx.save(); ctx.translate(140, -20); ctx.scale(pk, pk); icon(st[2], 0, 0, 112); ctx.restore(); txt(st[3], 0, 102, 40, '#ffd400', { stroke: false }); ctx.restore(); }
    else if (o.kind === 'items') { const a = Math.min(seg(o.u, o.t0, o.t0 + .3), 1 - seg(o.u, o.t0 + 4.6, o.t0 + 5.0)); ctx.save(); ctx.globalAlpha = a; o.list.forEach(([ic, label], i) => { const k = eOutBack(seg(o.u, o.t0 + i * .4, o.t0 + i * .4 + .3)); const x = W / 2 + (i - 1) * 260, y = H * .56; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rrect(-100, -100, 200, 200, 22, 'rgba(0,0,0,.66)', '#ffd400', 4); icon(ic, 0, -14, 130); txt(label, 0, 72, 34, '#fff', { stroke: false }); ctx.restore(); }); ctx.restore(); }
    else if (o.kind === 'bossbar') { const a = Math.min(seg(o.u, 1, 1.6), 1 - seg(o.u, 68, 69)); ctx.save(); ctx.globalAlpha = a; txt('ENDER DRAGON', W / 2, 58, 34, '#ffffff', { lw: 6 }); rrect(W / 2 - 400, 86, 800, 26, 6, 'rgba(0,0,0,.6)', '#000', 3); ctx.fillStyle = '#ff4fd8'; ctx.fillRect(W / 2 - 396, 90, 792 * o.hp, 18); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(W / 2 - 396, 90, 792 * o.hp, 6); ctx.restore(); }
    else if (o.kind === 'title100') { const k = eOutBack(seg(t, .25, .7)), a = 1 - seg(t, 3.5, 4.0); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 0, W, H); ctx.translate(W / 2, H * .4); ctx.scale(k, k); txt('I SURVIVED 100 DAYS', 0, -100, 130, '#ffffff', { lw: 20 }); ctx.rotate(-.03); rrect(-640, -10, 1280, 160, 20, '#e53935', '#000', 8); txt('IN HARDCORE MINECRAFT', 0, 72, 96, '#ffd400', { lw: 14 }); ctx.restore(); }
    else if (o.kind === 'outro2') { const q = seg(t, o.t0 + .2, o.t0 + .6), sb = seg(t, o.t0 + 1.0, o.t0 + 1.4), clicked = t > o.t0 + 2.7; ctx.save(); ctx.fillStyle = `rgba(0,0,0,${.35 * q})`; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = q; txt('200 DAYS NEXT?', W / 2, H * .22, 120, '#ffd400', { lw: 18, scale: eOutBack(q) }); txt('COMMENT BELOW 👇', W / 2, H * .36, 80, '#fff', { lw: 12, scale: eOutBack(q) }); ctx.restore();
      if (sb > 0) { const kk = eOutBack(sb); ctx.save(); ctx.translate(W / 2, H * .6); ctx.scale(kk, kk); rrect(-300, -62, 600, 124, 62, clicked ? '#3a3a3a' : '#e53935', '#000', 5); txt(clicked ? 'SUBSCRIBED' : 'SUBSCRIBE', 0, 4, 64, '#fff', { stroke: false }); ctx.restore(); }
      if (t > TOTAL - 1.6) { ctx.fillStyle = `rgba(0,0,0,${seg(t, TOTAL - 1.6, TOTAL - .6)})`; ctx.fillRect(0, 0, W, H); txt('HOLLOWCRAFT', W / 2, H / 2, 120, '#ffd400', { stroke: false, alpha: seg(t, TOTAL - 1.4, TOTAL - .9) }); } }
  }
  drawCaption(t);
}
window.renderFrame = function (t, ov) {
  const S = stateAt(t); if (ov) { if (ov.cam) S.cam = cam(ov.cam[0], ov.cam[1], ov.cam[2]); S.fp = false; S.overlays = []; S.cut = null; } apply(S); renderer.render(scene, camera);
  ctx.save(); ctx.filter = S.filter || 'none'; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  if (S.flashT != null) { const d = (S.flashTm != null ? S.flashTm : S.u) - S.flashT; if (d >= 0 && d < .35) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .35) * .8})`; ctx.fillRect(0, 0, W, H); } }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (S.fade) { ctx.fillStyle = `rgba(0,0,0,${S.fade})`; ctx.fillRect(0, 0, W, H); }
  if (!ov) drawOverlays(S); if (!ov) txt('HollowCraft', W - 40, H - 34, 30, 'rgba(255,255,255,.75)', { align: 'right', lw: 5, w: 800 });
  if (S.cut != null) { const d = t - S.cut; if (d >= 0 && d < .14) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .14) * .6})`; ctx.fillRect(0, 0, W, H); } }
  if (t < .25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .25})`; ctx.fillRect(0, 0, W, H); }
  return comp.toDataURL('image/jpeg', .9);
};
window.__D = DRAGON; window.__EC = EC; window.READY = true;
