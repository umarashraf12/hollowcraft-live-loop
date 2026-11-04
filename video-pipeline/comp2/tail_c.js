// ---------- compilation: props & helpers ----------
const camLight = new THREE.PointLight(0xffe0b0, 0, 20, 1.3); camera.add(camLight);
const hemi = scene.children.find(o => o.isHemisphereLight);
const lamT = tex => new THREE.MeshLambertMaterial({ map: T[tex] });
const DYN = {};
for (const tex of ['deep', 'dore', 'planks', 'netherrack', 'obsidian', 'lava', 'blueice', 'log', 'glass']) {
  let mat = tex === 'lava' ? new THREE.MeshBasicMaterial({ map: T.lava }) : tex === 'log' ? [lamT('logSide'), lamT('logSide'), lamT('logTop'), lamT('logTop'), lamT('logSide'), lamT('logSide')] : lamT(tex);
  if (tex === 'glass') { mat.transparent = true; mat.alphaTest = .5; mat.side = THREE.DoubleSide; }
  const im = new THREE.InstancedMesh(box, mat, 200); im.frustumCulled = false; scene.add(im); DYN[tex] = im;
}
const xrayPool = []; for (let i = 0; i < 8; i++) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: 0x4fe3d8, depthTest: false, fog: false })); l.renderOrder = 22; l.visible = false; scene.add(l); const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x4fe3d8, transparent: true, opacity: .3, depthTest: false, fog: false })); m.renderOrder = 21; m.visible = false; scene.add(m); xrayPool.push([l, m]); }
const wingTex = canvasTex(16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const edge = x > 13 - y * .3 || y === 15; px(g, x, y, edge ? '#4a4460' : ((x + y) % 5 === 0 ? '#7c7298' : '#a69cc4')); } });
const wingMat = new THREE.MeshLambertMaterial({ map: wingTex, side: THREE.DoubleSide, transparent: true, alphaTest: .5 });
const wings = new THREE.Group(); wings.position.set(0, 1.32, -.15); PLAYER.g.add(wings);
const wingL = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.15).translate(-.275, -.575, 0), wingMat), wingR = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.15).translate(.275, -.575, 0), wingMat); wings.add(wingL, wingR);
const bed = new THREE.Group(); scene.add(bed);
{ const foot = new THREE.Mesh(new THREE.BoxGeometry(1, .56, 1), [lamT('planks'), lamT('planks'), lamT('wool'), lamT('planks'), lamT('planks'), lamT('planks')]); foot.position.set(0, .28, -.5); bed.add(foot); const head = foot.clone(); head.position.z = .5; bed.add(head);
  const pil = new THREE.Mesh(new THREE.BoxGeometry(.8, .1, .35), lamT('pillow')); pil.position.set(0, .6, .72); bed.add(pil); }
const boat = new THREE.Group(); scene.add(boat);
{ const m = lamT('planks'); const add = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); boat.add(b); };
  add(1.1, .12, 1.7, 0, .06, 0); add(.12, .4, 1.7, -.55, .26, 0); add(.12, .4, 1.7, .55, .26, 0); add(1.1, .4, .12, 0, .26, -.85); add(1.1, .4, .12, 0, .26, .85); }
const portalMat = new THREE.MeshBasicMaterial({ map: T.portal, transparent: true, opacity: .86, side: THREE.DoubleSide, depthWrite: false });
const portal2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), portalMat); portal2.position.set(32, 11.5, PZ2 + .5); scene.add(portal2);
const portalNE = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), portalMat); portalNE.position.set(NX, 43.5, -142.5); scene.add(portalNE);
Object.assign(PCOL, { portal: ['#b04cff', '#e0a0ff', '#7a2bd6'], nrack: ['#7a2826', '#4e1414', '#a8443e'], smoke: ['#bdbdbd', '#8a8a8a', '#e0e0e0'], crit: ['#ffffff', '#cfe6ff', '#ffe36e'],
  boom: ['#ffffff', '#ffe36e', '#ff9a1f', '#bdbdbd'], grassd: ['#62a840', '#86603f', '#4f8d33', '#6a4a30'], wood: ['#6b4a2b', '#b88a52', '#4a3420'], break: ['#4a4a52', '#5c5c66'], dbreak: ['#4fe3d8', '#d6fffb', '#4a4a52'], place: ['#b88a52', '#d9b07a'] });
const EYE = 1.62;
function dirFrom(yaw, pitch) { return V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); }
function shake(t, hits) { let a = 0; for (const [h, amp] of hits) { const d = t - h; if (d >= 0 && d < .7) a += amp * (1 - d / .7); } return V(Math.sin(t * 91) * a, Math.sin(t * 73 + 1) * a, Math.cos(t * 67) * a * .6); }
function keyed(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) { const [t1, v1, e] = keys[i], [t0, v0] = keys[i - 1]; if (t <= t1) { const k = (t - t0) / (t1 - t0); const f = e === 'out' ? eOutC(k) : e === 'in' ? eInQ(k) : e === 'io' ? eIO(k) : k; return lerp(v0, v1, f); } } return keys[keys.length - 1][1]; }
const cam = (p, l, fov = 62) => ({ pos: V(...p), look: V(...l), fov });
const zom = (pos, u, impact, yaw = Math.PI) => { const dead = impact != null ? clamp((u - impact) / .55) : 0; return { kind: 'zombie', pos, yaw, walk: u * 5, alive: u < (impact ?? 1e9) + .6, dead, hurt: impact != null && u >= impact }; };
function smashFX(S, t0, o, k = 1, tm) {
  S.bursts.push({ type: 'smash', t0, o: o.clone().add(V(0, .3, 0)), n: Math.round(160 * k), sp: [4, 11 * k], up: [5, 12], g: 26, life: 1.5, size: .2, seed: 70, floor: o.y + .05, tm });
  S.bursts.push({ type: 'spark', t0, o: o.clone().add(V(0, 1.6, 0)), n: 50, sp: [3, 9], up: [-3, 6], drag: 2, life: .6, size: .1, seed: 71, tm });
  S.bursts.push({ type: 'poof', t0: t0 + .55, o: o.clone().add(V(0, .9, 0)), n: 40, sp: [.4, 1.6], up: [.5, 2], drag: 1, life: 1.1, size: .3, seed: 72, tm });
  S.rings.push({ t0, o: o.clone().add(V(0, .08, 0)), r: 7 * k, life: .7, col: '#ffffff', tm }); S.rings.push({ t0: t0 + .1, o: o.clone().add(V(0, .08, 0)), r: 4.5 * k, life: .6, col: '#ffd84a', tm });
  if (tm == null || Math.abs(tm - t0) < .05) S.hits.push([S.u0 + (tm == null ? t0 : 0) + (tm != null ? S.u - tm + t0 : 0), .3 * k]); S.flashT = t0; S.flashTm = tm;
}
function windFX(S, t0, o, tm) { S.bursts.push({ type: 'wind', t0, o: o.clone().add(V(0, .2, 0)), n: 80, sp: [7, 13], up: [-.5, 3], drag: 3, life: .75, size: .22, seed: 51, tm }); S.rings.push({ t0, o, r: 3.4, life: .55, col: '#e6f4ff', tm }); }
function splashFX(S, t0, o, tm) { S.bursts.push({ type: 'splash', t0, o: o.clone().add(V(0, .6, 0)), n: 90, sp: [2, 6], up: [4, 9], g: 22, life: 1.1, size: .13, seed: 12, floor: o.y, tm }); }
function boomFX(S, t0, o, tm) { S.bursts.push({ type: 'boom', t0, o, n: 140, sp: [5, 13], up: [-1, 9], g: 14, life: 1.3, size: .2, seed: 81, tm }); S.bursts.push({ type: 'smoke', t0: t0 + .05, o, n: 50, sp: [.6, 2.4], up: [.2, 1.6], drag: .8, life: 1.8, size: .45, seed: 82, tm }); S.bursts.push({ type: 'grassd', t0, o, n: 90, sp: [3, 9], up: [4, 10], g: 24, life: 1.4, size: .17, seed: 83, floor: o.y - .4, tm }); S.rings.push({ t0, o: o.clone().add(V(0, -.4, 0)), r: 6, life: .6, col: '#ffffff', tm }); S.flashT = t0; S.flashTm = tm; }
// ep1 water clutch (from the mesa): u from the walk start, real physics g=32
const CL = { x: .5, zA: -18.6, zB: -17.72, ust: .6 };
const CL_LAND = CL.ust + Math.sqrt(55 / 16), CL_PLACE = CL.ust + Math.sqrt(53 / 16);
function clutchPos(u) { if (u < CL.ust) return V(CL.x, 64, lerp(CL.zA, CL.zB, u / CL.ust)); if (u < CL_LAND) { const tau = u - CL.ust; return V(CL.x, 64 - 16 * tau * tau, CL.zB + 1.2 * tau); } return V(CL.x, 9, -15.5); }
function water(S, cell, place, scoop, u, h = .88) { if (u < place || u > scoop + .25) return; const a = clamp((u - place) / .45); S.water.push({ c: cell, a, alpha: u > scoop ? 1 - (u - scoop) / .25 : 1 }); }
// ep2 bridge
function bridgeAt(kf, mode = 'tap') { const k = Math.floor(kf), u = kf - k, edge = -18 + k; const z = u < .7 ? lerp(edge - .75, edge + .25, eIO(u / .7)) : edge + .25; const placed = k + (u >= .75 ? 1 : 0), pop = u >= .75 ? clamp((u - .75) / .1) : 1; const crouch = mode === 'hold' ? 1 : clamp(1 - Math.abs(u - .72) / .22); return { z, placed, pop, crouch, use: u > .7 && u < .95 ? seg(u, .7, .95) : 0, walk: u < .7 ? u * 9 : 0 }; }
function bridgeSet(S, b, x = 0, y = 63, z0 = -18, dir = 1) { const n = b.placed; for (let i = 0; i < n; i++) S.dyn.push({ x, y, z: z0 + i * dir, tex: 'planks', pop: i === n - 1 ? b.pop : 1 }); }
// mine
const BRANCH = []; { let i = 0; for (let x = 203; x <= 207; x++) for (const y of [-57, -58]) BRANCH.push({ x, y, z: 18, i: i++ }); }
const HIDDEN = [[MX - 2, -56, 11], [MX + 3, -60, 23], [MX - 3, -58, 26], [MX + 2, -55, 30], [MX - 4, -57, 18], [MX + 3, -58, 3], [MX - 2, -60, 6]];
// player helper
function P(S, pos, yaw = 0, held = null, p = {}, extra = {}) { Object.assign(S.player, { visible: true, pos, yaw, held, p, ...extra }); }
function tw(u, a, b, k = 1) { return seg(u, a, b) * k; }

// ---------- the 20 clips (local time u, 0..28.5) ----------
const D = 28.5;
const CLIPS = [];
const clip = (n, title, f, ev) => CLIPS.push({ n, title, f, ev });

// #20 speed-build house
clip(20, 'SPEED BUILD HOUSE', (S, u) => {
  const N = HOUSE.length, done = u < 20 ? Math.floor(N * seg(u, 2, 19.5)) : N;
  HOUSE.slice(0, done).forEach(([x, y, z, tx], i) => S.dyn.push({ x, y, z, tex: tx === 'glassB' ? 'glass' : tx, pop: i === done - 1 && u < 20 ? .7 : 1 }));
  const a = u * .45; const pr = u < 20 ? V(HOUSE_C.x + Math.cos(a) * 4.2, 9, HOUSE_C.z + Math.sin(a) * 4.2) : V(lerp(47.5, 47.5, 1), 9, lerp(37.2, 41.8, seg(u, 23, 27)));
  P(S, pr, u < 20 ? Math.atan2(HOUSE_C.x - pr.x, HOUSE_C.z - pr.z) : 0, 'planks', u < 20 ? { use: (u * 6) % 1, walk: u * 6 } : { walk: u > 23 && u < 27 ? u * 9 : 0 });
  const c = u * .18 + 1;
  S.cam = cam([HOUSE_C.x + Math.cos(c) * 11, 14.5, HOUSE_C.z + Math.sin(c) * 11], [HOUSE_C.x, 10.5, HOUSE_C.z], 58);
  if (u < 20) S.overlays.push({ kind: 'pill', text: 'TIMELAPSE x10', col: '#1565c0', t0: 1 });
  if (u > 20.2) S.overlays.push({ kind: 'pop', t0: 20.2, text: 'BUILT IN 20s!', col: '#5cff7a' });
}, [...[...Array(30)].map((_, i) => [2 + i * .58, 'thud', .5]), [20.2, 'ding', .8], [20.2, 'pop', .6]]);

// #19 speed bridging to the sky island
clip(19, 'SPEED BRIDGE TO SKY ISLAND', (S, u) => {
  const kf = Math.min(41, Math.max(0, (u - 2.5) / .4)), b = bridgeAt(kf); bridgeSet(S, b);
  if (kf < 41) P(S, V(.5, 64 - .2 * b.crouch, b.z), Math.PI, 'planks', { walk: b.walk, walkAmt: .5, use: b.use, lookDown: .9 }, { crouch: b.crouch });
  else { const k = seg(u, 19.4, 21.6), j = Math.max(0, Math.sin(Math.PI * seg(u, 22.5, 23.1))) * 1.2; P(S, V(.5, 64 + j, lerp(23.25, 26.5, k)), lerp(Math.PI, 0, seg(u, 19, 19.6)), 'planks', { walk: k > 0 && k < 1 ? u * 9 : 0 }); }
  if (u < 2.5) P(S, V(.5, 64, -18.75), Math.PI, 'planks', { lookDown: .9 });
  if (u < 12) S.cam = cam([7.5, 65.8, b.z - 1.5], [.5, 63.8, b.z]);
  else if (u < 19) S.cam = cam([3.2, 67.2, b.z + 6.5], [.5, 64.2, b.z - 1], 64);
  else { const a = deg(-20) + (u - 19) * .06; S.cam = cam([26 * Math.cos(a), 74, 3 + 26 * Math.sin(a) * .2 - 4], [0, 63, 4], 62); }
  S.overlays.push({ kind: 'speed', text: `BLOCKS: ${b.placed}` });
  if (u > 19.6) S.overlays.push({ kind: 'pop', t0: 19.6, text: 'MADE IT!', col: '#5cff7a' });
}, [...[...Array(39)].map((_, i) => [2.5 + (i + .75) * .4, 'thud', .6]), [19.6, 'ding', .8]]);

// #18 diamond vein jackpot (first person)
const DIA_T = [10.0, 11.4, 12.8], BR_T = i => 1.2 + i * .62;
clip(18, 'DIAMOND JACKPOT', (S, u) => {
  S.env = 'mine'; const tm = u < 14 ? u : u < 22 ? lerp(7.1, 13.3, seg(u, 14, 22)) : 99;
  for (const b of BRANCH) { const t1 = BR_T(b.i); if (tm < t1) S.dyn.push({ x: b.x, y: b.y, z: b.z, tex: 'deep', wob: seg(tm, t1 - .3, t1) }); else if (tm < t1 + .6) S.bursts.push({ type: 'break', t0: t1, o: V(b.x + .5, b.y + .5, b.z + .5), n: 20, sp: [1, 3], up: [1, 3], g: 16, life: .6, size: .09, seed: b.i, tm }); }
  DIA.forEach(([x, y, z], i) => { if (tm < DIA_T[i]) S.dyn.push({ x, y, z, tex: 'dore', wob: seg(tm, DIA_T[i] - .3, DIA_T[i]) }); else if (tm < DIA_T[i] + .7) S.bursts.push({ type: 'dbreak', t0: DIA_T[i], o: V(x + .5, y + .5, z + .5), n: 26, sp: [1, 3], up: [1, 4], g: 18, life: .7, size: .09, seed: 40 + i, tm }); });
  S.fp = true; S.player.visible = false; S.held = 'pick';
  const x = 202.5 + clamp((tm - 1.5) / 1.24, 0, 4), eye = V(x, -58 + EYE, 18.5);
  const tgt = DIA.find((_, i) => tm < DIA_T[i]) || DIA[2]; let dir = dirFrom(Math.PI / 2, deg(-12));
  if (tm > 7.4) dir.lerp(V(tgt[0] + .62, tgt[1] + .45, tgt[2] + .02).sub(eye).normalize(), eIO(seg(tm, 7.4, 8.2))).normalize();
  S.cam = { pos: eye, dir, fov: 70 }; S.swing = tm < 7.4 || (tm > 9.4 && tm < 13) ? (tm * 3.2) % 1 : 0;
  const n = DIA_T.reduce((a, t, i) => a + (tm >= t + .4 ? [3, 4, 2][i] : 0), 0); S.overlays.push({ kind: 'speed', text: `DIAMONDS: ${u >= 22 ? 9 : n}`, col: '#4fe3d8' });
  if (u > 14 && u < 22) S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 14 });
  if (u > 7.6 && u < 10) S.overlays.push({ kind: 'pop', t0: 7.6, text: 'DIAMONDS!', col: '#4fe3d8' });
  if (u >= 22) { S.fp = false; P(S, V(206.5, -58, 18.5), Math.PI / 2, 'diamond'); S.cam = cam([204.4, -56.6, 18.5], [207.5, -57.4, 18.6], 66); S.overlays.push({ kind: 'pop', t0: 22.2, text: 'JACKPOT: 9 DIAMONDS', col: '#4fe3d8' }); }
}, [...[...Array(10)].map((_, i) => [BR_T(i), 'crunch', .7]), [7.6, 'sparkle', 1], ...DIA_T.map(t => [t, 'crunch', 1]), ...DIA_T.map(t => [t + .45, 'pickup', .6]), [22.2, 'ding', .8]]);

// #17 1 vs 3 zombies
const ZK = [6.2, 9.0, 11.8];
clip(17, '1 vs 3 ZOMBIES', (S, u) => {
  const tm = u < 13 ? u : u < 21 ? lerp(10.4, 12.6, seg(u, 13, 21)) : 99;
  const starts = [V(34, 9, 36), V(46, 9, 37), V(40, 9, 44)];
  S.mobs = starts.map((s0, i) => { const k = seg(tm, 0, ZK[i] - .6); const p = s0.clone().lerp(V(40, 9, 30), .75 * eIO(k)); if (tm > ZK[i]) p.add(s0.clone().sub(V(40, 9, 30)).normalize().multiplyScalar(eOutC(seg(tm, ZK[i], ZK[i] + .4)) * 1.4)); return zom(p, tm, ZK[i], Math.atan2(40 - s0.x, 30 - s0.z)); });
  const cur = ZK.findIndex(t => tm < t + .1), tgt = S.mobs[cur < 0 ? 2 : cur].pos;
  P(S, V(40, 9, 30), Math.atan2(tgt.x - 40, tgt.z - 30), 'sword', { use: ZK.reduce((a, t) => Math.max(a, tm > t - .25 && tm < t + .1 ? seg(tm, t - .25, t + .1) : 0), 0) });
  ZK.forEach((t, i) => { if (tm >= t && tm < t + .7) S.bursts.push({ type: 'crit', t0: t, o: S.mobs[i].pos.clone().add(V(0, 1.5, 0)), n: 30, sp: [1, 4], up: [0, 3], drag: 2, life: .6, size: .08, seed: 60 + i, tm }); if (tm >= t + .55 && tm < t + 1.6) S.bursts.push({ type: 'poof', t0: t + .55, o: S.mobs[i].pos.clone().add(V(0, .9, 0)), n: 30, sp: [.4, 1.4], up: [.5, 2], drag: 1, life: 1, size: .26, seed: 64 + i, tm }); });
  if (u < 13) S.cam = cam([47, 13, 24], [40, 10, 34], 60); else if (u < 21) S.cam = cam([44.2, 10.6, 34.6], [39.4, 10.1, 30.6], 56); else { const a = (u - 21) * .3; S.cam = cam([40 + Math.cos(a) * 7, 12, 30 + Math.sin(a) * 7], [40, 10.4, 30], 58); }
  if (u > 13 && u < 21) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 13 });
  if (u > 12.2 && u < 13) S.overlays.push({ kind: 'pop', t0: 12.2, text: 'TRIPLE KILL!', col: '#ff5252' });
  if (u > 21) S.overlays.push({ kind: 'pop', t0: 21.2, text: '1 vs 3 CLUTCH', col: '#ffd400' });
}, [...ZK.flatMap(t => [[t - .15, 'swoosh', .7], [t, 'hit', 1], [t + .55, 'poof', .6]]), [12.2, 'ding', .7], [21.2, 'pop', .6]]);

// generic cliff fall used by the boat/water clutches and the mace drop (from the mesa edge)
function cliffFall(u) { return clutchPos(u); }

// #16 boat clutch
clip(16, 'BOAT CLUTCH', (S, u) => {
  const runs = [[1.0, 1], [11.0, .3], [21.0, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; const uu = (u - r[0]) * r[1];
  const p = cliffFall(uu), landed = uu >= CL_LAND;
  if (uu >= CL_PLACE - .05) S.boat = V(.5, 9, -15.5);
  P(S, landed ? V(.5, 9.15, -15.5) : p, 0, landed ? null : 'boat', { fall: uu > CL.ust && !landed ? 1 : 0, time: u, use: seg(uu, CL_PLACE - .15, CL_PLACE + .1) }, { sit: landed });
  if (landed && uu < CL_LAND + .6) S.bursts.push({ type: 'smoke', t0: CL_LAND, o: V(.5, 9.3, -15.5), n: 24, sp: [1, 3], up: [.5, 2], drag: 2, life: .7, size: .14, seed: 9, tm: uu });
  if (r[0] === 1.0) S.cam = { pos: V(p.x + 7, Math.max(p.y + 2.2, 11.5), p.z + 2.5), look: V(p.x, p.y + .8, p.z), fov: 58 };
  else if (r[0] === 11.0) S.cam = cam([5.2, 10.2, -10.2], [p.x, p.y + 1, p.z], 60); else S.cam = { pos: V(p.x - 3.2, Math.max(p.y + 4.5, 13.5), p.z + 4), look: V(p.x, p.y + .5, p.z), fov: 66 };
  if (r[1] < 1) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 11 });
  if (landed) S.overlays.push({ kind: 'pop', t0: r[0] + CL_LAND / r[1], text: 'BOAT CLUTCH!', col: '#5cff7a' });
}, [[1.6, 'whoosh', .6], [1 + CL_LAND, 'thud', 1], [1 + CL_LAND, 'ding', .6], [11 + CL_LAND / .3, 'thud', .8], [21.6, 'whoosh', .5], [21 + CL_LAND, 'thud', 1], [21 + CL_LAND, 'ding', .6]]);

// #15 x-ray hidden diamonds
clip(15, 'X-RAY: HIDDEN DIAMONDS', (S, u) => {
  S.env = 'mine'; S.fp = true; S.player.visible = false; S.held = 'pick';
  const z = lerp(4, 16, seg(u, 0, 20)); S.cam = { pos: V(MX + .5, -58 + EYE, z), dir: dirFrom(Math.sin(u * .4) * .5, deg(-4)), fov: 74 };
  if (u > 3) { S.xray = HIDDEN; S.xrayA = seg(u, 3, 3.8); S.filter = `brightness(${1 - .35 * S.xrayA})`; }
  S.overlays.push({ kind: 'pill', text: u > 3 ? 'X-RAY VIEW' : 'NORMAL VIEW', col: u > 3 ? '#00897b' : '#555', t0: 0 });
  if (u > 4) S.overlays.push({ kind: 'speed', text: `HIDDEN: ${Math.min(7, Math.floor(seg(u, 4, 12) * 7) + 1)}`, col: '#4fe3d8' });
  if (u > 13) S.overlays.push({ kind: 'pop', t0: 13, text: '7 HIDDEN DIAMONDS', col: '#4fe3d8' });
  if (u > 20) { S.fp = false; S.xray = HIDDEN; P(S, V(MX + .5, -58, lerp(14, 20, seg(u, 20, 28))), 0, 'pick', { walk: u * 8 }); S.cam = cam([MX + .5, -56.4, lerp(10.5, 16.5, seg(u, 20, 28))], [MX + .5, -57.2, lerp(17, 23, seg(u, 20, 28))], 70); }
}, [[3, 'sparkle', 1], [3, 'riser', .5], [13, 'ding', .8]]);

// #14 parkour 4-block jump
function pkRun(u, path) { // path: list of pillar indices; 0.75 s per jump
  const legs = path.length - 1, k = clamp(u / .75, 0, legs), i = Math.min(legs - 1, Math.floor(k)), f = k - i;
  const a = pkTop(path[i]), b = pkTop(path[i + 1]); const p = a.clone().lerp(b, f); p.y = lerp(a.y, b.y, f) + Math.sin(Math.PI * f) * 1.3; return { p, f, i };
}
clip(14, 'PARKOUR: 4 BLOCK JUMP', (S, u) => {
  const path = [0, 1, 2, 3, 4, 5];
  const runs = [[1.5, 1], [9.5, .22], [19.5, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr;
  let uu = (u - r[0]) * r[1]; if (r[0] === 9.5) uu = 2.25 + (u - 9.5) * .1;
  const { p } = pkRun(uu, path); P(S, p, Math.PI / 2, null, { walk: u * 12, walkAmt: 1.3 });
  if (r[0] === 9.5) S.cam = cam([p.x - .5, p.y + 1.5, p.z + 6], [p.x + 1, p.y - .5, p.z], 64); else S.cam = cam([p.x - 4, p.y + 3, p.z + 7], [p.x + 2, p.y - 1, p.z], 66);
  if (r[0] === 9.5) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 9.5 });
  if (u > 9.5 && u < 19.5) S.overlays.push({ kind: 'speed', text: 'GAP: 4 BLOCKS', col: '#ffd400' });
  if (u > 17) S.overlays.push({ kind: 'pop', t0: 17, text: '4 BLOCK JUMP!', col: '#5cff7a' });
}, [...[0, 1, 2, 3, 4].map(i => [1.5 + i * .75 + .7, 'step', .8]), [17, 'ding', .8], ...[0, 1, 2, 3, 4].map(i => [19.5 + i * .75 + .7, 'step', .8])]);

// #13 nether ice highway
clip(13, 'NETHER ICE HIGHWAY', (S, u) => {
  S.env = 'nether'; S.dyn.push(...[...Array(HW.gap1 - HW.gap0 + 1)].map((_, i) => ({ x: NX, y: HW.y, z: HW.gap0 + i, tex: 'blueice' })));
  let z;
  if (u < 10) { z = Math.min(145, -110 + (u < 1.6 ? 0 : (u - 1.6 < .6 ? 60 * (u - 1.6) ** 2 : 21.6 + 72 * (u - 2.2)))); S.cam = cam([NX + 1.1, HW.y + 2.6, z - 4.3], [NX + .5, HW.y + 1.5, z + 6], 72); S.overlays.push({ kind: 'speedlines' }); S.overlays.push({ kind: 'speed', text: `${Math.round(Math.min(72, Math.max(0, (u - 1.6) * 120)))} BLOCKS/SEC`, col: '#cfe6ff' }); }
  else if (u < 19) { z = -100 + ((u - 10) * 72) % 230; S.cam = cam([NX + 22, 52, 10], [NX, 45, 10], 70); }
  else { z = lerp(-60, 30, seg(u, 19, 28.5)); S.cam = cam([NX + 6.5, HW.y + 2.4, z + 1], [NX, HW.y + 1.6, z], 60); S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 19 }); }
  S.boat = V(NX + .5, HW.y + 1, z); P(S, V(NX + .5, HW.y + 1.15, z), 0, null, {}, { sit: true });
  if (u > 4) S.overlays.push({ kind: 'pop', t0: 4, text: '72 BLOCKS/SEC!', col: '#78aaf8' });
}, [[1.6, 'slide', 1], [10, 'whoosh', .5], [13, 'whoosh', .5], [16, 'whoosh', .5], [19, 'slide2', .6]]);

// #12 no-diamond portal speedrun
const P2T = i => 1.5 + i * .95;
clip(12, 'NO-DIAMOND PORTAL SPEEDRUN', (S, u) => {
  S.mold = true;
  PF2.forEach(([x, y], i) => { const t0 = P2T(i); if (u >= t0 && u < t0 + .45) S.dyn.push({ x, y, z: PZ2, tex: 'lava' }); if (u >= t0 + .45) S.dyn.push({ x, y, z: PZ2, tex: 'obsidian' }); if (u >= t0 + .3 && u < t0 + .8) S.water.push({ c: V(x, y + 1, PZ2), a: 1, alpha: 1 }); if (u >= t0 + .45 && u < t0 + 1.4) S.bursts.push({ type: 'smoke', t0: t0 + .45, o: V(x + .5, y + .9, PZ2 + .3), n: 14, sp: [.2, .8], up: [1, 2.5], drag: 1, life: .9, size: .12, seed: i }); });
  const lit = 12.0; S.portal2 = u >= lit ? clamp((u - lit) / .4) : 0;
  if (u < 18) { P(S, V(31.9, 9, lerp(44.2, 47.8, seg(u, 14.5, 17))), 0, u < lit ? (u % .95 < .45 ? 'lavaB' : 'bucketW') : 'flint', { use: u < 11.5 ? (u * 1.05) % 1 : seg(u, lit - .25, lit), walk: u > 14.5 && u < 17 ? u * 9 : 0 }); S.cam = cam([36.2, 12.4, 42.2], [32, 11, 47], 60); S.nausea = seg(u, 16.4, 18); }
  else { S.env = 'nether'; S.dyn.push(...[...Array(HW.gap1 - HW.gap0 + 1)].map((_, i) => ({ x: NX, y: HW.y, z: HW.gap0 + i, tex: 'blueice' }))); const k = seg(u, 18.4, 20.6); P(S, V(NX + .5, 41, lerp(-142.5, -139, k)), 0, 'pick', { walk: k > 0 && k < 1 ? u * 9 : 0 }); const c = eIO(seg(u, 20, 28)); S.cam = cam([lerp(NX + 4.5, NX + 18, c), lerp(43, 60, c), lerp(-135.5, -122, c)], [NX, lerp(42.5, 44, c), lerp(-140, -96, c)], 62); S.nausea = 1 - seg(u, 18, 19); }
  S.overlays.push({ kind: 'speed', text: `OBSIDIAN: ${PF2.filter((_, i) => u >= P2T(i) + .45).length}/10`, col: '#c77dff' });
  if (u > 12.3 && u < 16) S.overlays.push({ kind: 'pop', t0: 12.3, text: 'NO DIAMONDS NEEDED!', col: '#c77dff' });
  if (u > 20.5) S.overlays.push({ kind: 'pop', t0: 20.5, text: 'WELCOME TO THE NETHER', col: '#ff8a65' });
}, [...PF2.flatMap((_, i) => [[P2T(i), 'lava', .7], [P2T(i) + .3, 'pour', .6], [P2T(i) + .45, 'sizzle', .7]]), [12, 'ignite', 1], [16.4, 'riser', .7], [18, 'boom', .5]]);

// creeper helper
function creeperAt(S, pos, yaw, swell, alive = true) { S.mobs.push({ kind: 'creeper', pos, yaw, swell, alive, walk: 0 }); }
// #11 creeper near-miss
clip(11, 'CREEPER NEAR-MISS', (S, u) => {
  const runs = [[0, 1], [9, .3], [19, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; let uu = (u - r[0]) * r[1]; if (r[0] === 19) uu = 7 + (u - 19);
  const boomT = 5.4, cp = V(lerp(28.5, 33.0, seg(uu, 0, 3.6)), 9, 26.5);
  if (uu < boomT) creeperAt(S, cp, Math.PI / 2, seg(uu, 3.8, boomT));
  const px = uu < 4.2 ? 34.2 : lerp(34.2, 40.5, eOutC(seg(uu, 4.2, 6.2)));
  P(S, V(px, 9 + (uu > boomT && uu < boomT + .6 ? Math.sin(Math.PI * seg(uu, boomT, boomT + .6)) * .9 : 0), 26.5), uu < 4.0 ? -Math.PI / 2 : Math.PI / 2, 'pick', { walk: uu > 4.2 && uu < 6.2 ? uu * 15 : 0, walkAmt: 1.4, use: uu < 3.8 ? (uu * 2.2) % 1 : 0 });
  if (uu >= boomT) { boomFX(S, boomT, V(33.0, 9.6, 26.5), uu); S.crater = [V(33.0, 9.04, 26.5), 2.2 * clamp((uu - boomT) / .2)]; if (Math.abs(uu - boomT) < .05 || (r[1] === 1 && u >= r[0] + boomT && u < r[0] + boomT + .05)) S.hits.push([u, .4]); }
  if (r[0] === 0) S.cam = cam([37.5, 11.2, 21.5], [33.5, 10, 26.5], 60); else if (r[0] === 9) S.cam = cam([36.6, 9.8, 30.5], [34.5, 10.2, 26.5], 58); else { const a = (u - 19) * .25; S.cam = cam([33 + Math.cos(a) * 9, 13, 26.5 + Math.sin(a) * 9], [33, 9.5, 26.5], 58); }
  if (r[1] < 1) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 9 });
  if (uu > boomT + .2) S.overlays.push({ kind: 'pop', t0: r[0] + (boomT + .2) / r[1] * (r[0] === 19 ? 0 : 1) + (r[0] === 19 ? 19 : 0), text: 'TOO CLOSE!', col: '#ff5252' });
}, [[3.8, 'hiss', 1], [5.4, 'explode', 1.2], [9 + 3.8 / .3, 'hiss', .7], [9 + 5.4 / .3, 'explode', 1.0], [22.6, 'debris', .4]]);

// #10 elytra ring run
const HOOP_S = [...Array(8)].map((_, i) => (i + .6) / 8.6);
clip(10, 'ELYTRA RING RUN', (S, u) => {
  const s = clamp((u < 18 ? u - 2 : (u - 18) * .7 + 3) / 14, 0, 1), p = hoopPath(s), ahead = hoopPath(Math.min(1, s + .01));
  const yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z); P(S, p, yaw, 'rocket', {}, { wings: 1, tilt: 1.15 });
  S.hoops = HOOP_S.map(hs => ({ pos: hoopPath(hs), yaw: Math.atan2(hoopPath(hs + .01).x - hoopPath(hs).x, hoopPath(hs + .01).z - hoopPath(hs).z), passed: s > hs }));
  const passed = S.hoops.filter(h => h.passed).length;
  S.trail2 = { pts: [...Array(25)].map((_, i) => hoopPath(Math.max(0, s - i * .004))) };
  if (u < 18) { const back = p.clone().sub(ahead.clone().sub(p).normalize().multiplyScalar(6)); back.y += 2.2; S.cam = { pos: back, look: ahead.clone().add(V(0, .5, 0)), fov: 68 }; }
  else { S.fp = true; S.player.visible = false; S.held = 'rocket'; S.cam = { pos: p.clone().add(V(0, .4, 0)), look: hoopPath(Math.min(1, s + .03)), fov: 80 }; S.overlays.push({ kind: 'pill', text: 'FIRST PERSON', col: '#7c4dff', t0: 18 }); }
  S.overlays.push({ kind: 'speed', text: `RINGS: ${passed}/8`, col: '#ffd23e' });
  if (passed === 8 && u < 18) S.overlays.push({ kind: 'pop', t0: 2 + HOOP_S[7] * 14, text: 'PERFECT RUN!', col: '#ffd23e' });
}, [[2, 'rocket', .9], ...HOOP_S.map(hs => [2 + hs * 14, 'ring', .8]), [2 + HOOP_S[7] * 14, 'ding', .8], [18, 'rocket', .6]]);

// #9 bed blast ancient debris
clip(9, 'BED BLAST: ANCIENT DEBRIS', (S, u) => {
  S.env = 'tunnel'; const runs = [[0, 1], [11, .3], [20, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; let uu = (u - r[0]) * r[1]; if (r[0] === 11) uu = 4.0 + (u - 11) * .3; if (r[0] === 20) uu = 8 + (u - 20);
  const T_BED = 1.2, T_BOOM = 4.6;
  if (uu < T_BOOM) for (const [x, y, z] of BLAST) S.dyn.push({ x, y, z, tex: 'netherrack' });
  S.bed = uu >= T_BED && uu < T_BOOM ? 1 : 0;
  const zb = uu < 1.8 ? 22.3 : lerp(22.3, 18.6, eIO(seg(uu, 1.8, 3.3)));
  P(S, V(DXX + .5, 15, zb), 0, 'bed', { use: Math.max(seg(uu, T_BED - .25, T_BED), seg(uu, T_BOOM - .25, T_BOOM)), walk: uu > 1.8 && uu < 3.3 ? uu * 9 : 0 });
  if (uu >= T_BOOM) { const o = BLAST_C.clone(); S.bursts.push({ type: 'nrack', t0: T_BOOM, o, n: 160, sp: [4, 12], up: [-2, 8], g: 14, life: 1.4, size: .16, seed: 501, tm: uu }); S.bursts.push({ type: 'smoke', t0: T_BOOM + .05, o, n: 28, sp: [.6, 2.4], up: [.2, 1.4], drag: .8, life: 1.3, size: .3, seed: 503, tm: uu }); S.flashT = T_BOOM; S.flashTm = uu; }
  if (r[0] === 0) S.cam = cam([DXX + .5, 16.75, 15.2], [DXX + .5, 15.9, 23]); else if (r[0] === 11) S.cam = cam([DXX + .5, 16.7, 19.6], [DXX + .6, 15.9, 24], 66); else S.cam = cam([DXX + .5, 16.6, lerp(19.4, 20.8, seg(u, 20, 28.5))], [DXX + 1, 15.6, 24.2], 74);
  if (r[1] < 1) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 11 });
  if (r[0] === 20) DEBRIS.forEach(([x, y, z], i) => S.overlays.push({ kind: 'tag', at: V(x + .5, y + 1.25, z + .5), text: 'ANCIENT DEBRIS', col: '#ffb380', t0: 20.3 + i * .25 }));
}, [[1.2, 'thud', .8], [4.45, 'click', .8], [4.6, 'explode', 1.3], [11 + .6 / .3, 'explode', 1.0], [20.3, 'pop', .5]]);

// #8 parkour close call (sneak save on the edge)
clip(8, 'PARKOUR CLOSE CALL', (S, u) => {
  const runs = [[1.5, 1], [10, .25], [20, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; const uu = r[0] === 10 ? .6 + (u - 10) * .25 : (u - r[0]) * r[1];
  const a = pkTop(1), b = pkTop(2); let p, crouch = 0, wob = 0;
  if (uu < .75) { const f = uu / .75; p = a.clone().lerp(b.clone().add(V(.42, 0, 0)), f); p.y = a.y + Math.sin(Math.PI * f) * 1.3; }
  else { p = b.clone().add(V(.42 - .12 * eOutC(seg(uu, 1.2, 2.2)), 0, 0)); crouch = uu > .8 ? 1 : 0; wob = uu < 1.6 ? Math.sin(uu * 30) * .12 * (1 - seg(uu, .8, 1.6)) : 0; }
  P(S, p, Math.PI / 2, null, { fall: uu > .75 && uu < 1.4 ? 1 : 0, time: u, walk: uu < .75 ? uu * 12 : 0 }, { crouch, tilt: wob });
  S.cam = r[0] === 10 ? cam([b.x + 1.8, b.y + .8, b.z + 4.2], [b.x + .2, b.y + .2, b.z], 56) : cam([b.x - 2, b.y + 2.5, b.z + 7], [b.x + .5, b.y - .5, b.z], 64);
  if (r[0] === 10) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 10 });
  if (uu > 1.0) S.overlays.push({ kind: 'pop', t0: r[0] + 1.0 / (r[1] || 1) * (r[0] === 10 ? 0 : 1) + (r[0] === 10 ? 11.6 : 0), text: 'SNEAK SAVE!', col: '#5cff7a' });
  if (r[0] === 10) S.overlays.push({ kind: 'tag', at: V(b.x + 1, b.y - .2, b.z + .5), text: 'EDGE', col: '#ffd400', t0: 10.5 });
}, [[2.2, 'step', .9], [2.3, 'gasp', .7], [2.6, 'ding', .5], [12.6, 'step', .7], [22.2, 'step', .9]]);

// #7 first-person water clutch
clip(7, 'FIRST-PERSON WATER CLUTCH', (S, u) => {
  if (u < 14) {
    S.fp = true; S.player.visible = false; const FALL0 = 2.0, tau = u < FALL0 ? 0 : lerp(0, 1.854, seg(u, FALL0, 9.0)), p = u < FALL0 ? V(.5, 64, lerp(-21, CL.zB, seg(u, 0, FALL0))) : u < 9 ? V(.5, 64 - 16 * tau * tau, CL.zB + 1.2 * tau) : V(.5, 9, -15.5);
    let pitch = u < FALL0 ? deg(-12) : lerp(deg(-30), deg(-88), eIO(seg(u, 3, 4.2))); if (u > 9.6) pitch = lerp(deg(-88), deg(-5), eIO(seg(u, 9.6, 10.8)));
    S.cam = { pos: V(p.x, p.y + EYE, p.z), yaw: 0, pitch, fov: u > FALL0 && u < 9 ? 80 : 70 }; S.held = u < 8.8 ? 'bucketW' : 'bucket'; S.swing = u > 8.8 && u < 9.1 ? seg(u, 8.8, 9.1) : 0;
    water(S, V(0, 9, -16), 8.8, 99, u); if (u >= 9.0) splashFX(S, 9.0, V(.5, 9, -15.5)); if (u > FALL0 && u < 9) S.overlays.push({ kind: 'speed', text: `${Math.max(0, p.y - 9).toFixed(1)} BLOCKS`, col: p.y - 9 < 2.3 ? '#ffd400' : '#ffffff' });
    if (u > 2 && u < 9) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 2 });
    if (u > 9.2) S.overlays.push({ kind: 'pop', t0: 9.2, text: 'CLUTCH!', col: '#5cff7a' });
  } else { const uu = (u - 14) * .9; const p = cliffFall(uu); P(S, p, 0, uu > CL_PLACE ? 'bucket' : 'bucketW', { fall: uu > CL.ust && uu < CL_LAND ? 1 : 0, time: u, use: seg(uu, CL_PLACE - .1, CL_PLACE + .2) }); water(S, V(0, 9, -16), CL_PLACE, 99, uu); if (uu >= CL_LAND) splashFX(S, CL_LAND, V(.5, 9, -15.5), uu);
    S.cam = cam([10.5, 12.2, -13.6], [.5, Math.max(10.5, p.y), -15.6], 56); S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 14 }); }
}, [[2.0, 'whoosh7', .8], [8.8, 'pour', .8], [9.0, 'splash', 1.1], [9.2, 'ding', .6], [14 + CL_LAND / .9, 'splash', .9]]);

// #6 wind charge mace smash (first person + side replay)
const W6 = { burst: 4.3, apex: 7.0, dive: 9.6, impact: 11.8 };
const W6Y = [[0, 9], [W6.burst, 9], [W6.apex, 27, 'out'], [W6.dive, 27.6, 'io'], [W6.impact, 11.1, 'in'], [W6.impact + .35, 12.2, 'out'], [W6.impact + .75, 9, 'in']];
const w6mz = t => 44 - .8 * t, W6MZ = w6mz(W6.impact);
const W6Z = [[0, 30], [W6.burst, 30], [W6.apex, 31, 'out'], [W6.dive, 31.5], [W6.impact, W6MZ - .3, 'in']];
clip(6, 'WIND CHARGE MACE SMASH', (S, u) => {
  const tm = u < 13.5 ? u : u < 22 ? lerp(4.0, W6.impact + .2, seg(u, 13.5, 22)) : W6.impact + (u - 22);
  const y = keyed(W6Y, tm), z = keyed(W6Z, tm); S.mobs = [zom(V(40, 9, w6mz(Math.min(tm, W6.impact))), tm, W6.impact)];
  windFX(S, W6.burst, V(40, 9.1, 30), tm); smashFX(S, W6.impact, V(40, 9.05, W6MZ), 1.2, tm);
  if (u < 13.5) { S.fp = true; S.player.visible = false; const eye = V(40, y + EYE, z); let pitch = lerp(deg(-5), deg(-82), eIO(seg(u, 3.0, 3.9))); pitch = lerp(pitch, deg(10), eIO(seg(u, 4.6, 5.6))); pitch = lerp(pitch, deg(-20), eIO(seg(u, 6.4, 7.2)));
    const dir = dirFrom(0, pitch).lerp(V(40, 10.9, w6mz(Math.min(u, W6.impact))).sub(eye).normalize(), eIO(seg(u, 8.2, 9.4))).normalize(); S.cam = { pos: eye, dir, fov: 72 + 14 * seg(u, W6.dive, W6.impact) };
    S.held = u < 8 ? 'wind' : 'mace'; S.switchT = u >= 8 ? 8 : null; S.swing = Math.max(seg(u, 4.0, 4.3) * (u < 4.3 ? 1 : 0), u > W6.impact - .15 && u < W6.impact + .25 ? seg(u, W6.impact - .15, W6.impact + .25) : 0); }
  else { P(S, V(40, y, z), 0, tm < 8 ? 'wind' : 'mace', { smash: tm > W6.dive && tm < W6.impact + .3 ? seg(tm, W6.dive, W6.impact) : null, fall: tm > W6.burst && tm < W6.apex ? .5 : 0, time: tm });
    S.trail2 = { pts: [...Array(40)].map((_, i) => { const tt = lerp(W6.burst, tm, i / 39); return V(40, keyed(W6Y, tt) + .9, keyed(W6Z, tt)); }), dots: true };
    S.cam = u < 22 ? cam([61, 20.5, 33], [40, 19.5, 32.6], 68) : cam([46.5, 11.4, W6MZ - 5.5], [40, 10.2, W6MZ], 62); if (u < 22) S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 13.5 }); }
  if (u > W6.impact && u < 13.5) S.overlays.push({ kind: 'pop', t0: W6.impact, text: 'ONE HIT!', col: '#ffd400' });
}, [[4.0, 'whoosh', .5], [4.3, 'windburst', 1], [8, 'click', .8], [W6.dive, 'dive', .9], [W6.impact, 'smash', 1.2], [13.5 + (W6.burst - 4) / (W6.impact + .2 - 4) * 8.5, 'windburst', .5], [22, 'smash', .6]]);

// #5 creeper destroys the house
clip(5, 'CREEPER DESTROYS THE HOUSE', (S, u) => {
  const runs = [[0, 1], [10, .3], [19, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; let uu = (u - r[0]) * r[1]; if (r[0] === 10) uu = 5.0 + (u - 10) * .3; if (r[0] === 19) uu = 9 + (u - 19);
  const boomT = 6.2, bp = V(46.0, 9.6, 39.2);
  HOUSE.forEach(([x, y, z, tx]) => { const d = V(x + .5, y + .5, z + .5).distanceTo(bp); if (uu < boomT || d > 4.3) S.dyn.push({ x, y, z, tex: tx === 'glassB' ? 'glass' : tx }); });
  if (uu < boomT) creeperAt(S, V(lerp(41, 46.0, seg(uu, 0, 4.2)), 9, lerp(34, 38.9, seg(uu, 0, 4.2))), Math.atan2(5, 4.9), seg(uu, 4.5, boomT));
  if (uu >= boomT) { boomFX(S, boomT, bp, uu); S.bursts.push({ type: 'wood', t0: boomT, o: bp.clone().add(V(0, .8, 0)), n: 90, sp: [3, 10], up: [3, 9], g: 22, life: 1.5, size: .18, seed: 85, tm: uu }); S.crater = [V(46, 9.04, 39.4), 2.6 * clamp((uu - boomT) / .2)]; if (r[1] === 1 && u >= r[0] + boomT - (r[0] === 19 ? 9 : 0) && Math.abs(uu - boomT) < .05) S.hits.push([u, .4]); }
  P(S, V(51.6, 9, 39.6), -1.75, 'planks', {});
  if (r[0] === 0) S.cam = cam([52.5, 12.8, 31.5], [46.5, 10.4, 40], 62); else if (r[0] === 10) S.cam = cam([44.2, 10.2, 35.2], [46.2, 10.6, 40], 60); else { const a = deg(-110) + (u - 19) * .2; S.cam = cam([HOUSE_C.x + Math.cos(a) * 11, 14, HOUSE_C.z + Math.sin(a) * 11], [HOUSE_C.x, 10, HOUSE_C.z], 58); }
  if (r[1] < 1) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 10 });
  if (uu > boomT + .3 && r[0] !== 10) S.overlays.push({ kind: 'pop', t0: r[0] === 0 ? boomT + .3 : 19.3, text: 'NOOO MY HOUSE!', col: '#ff5252' });
}, [[4.5, 'hiss', 1], [6.2, 'explode', 1.3], [6.25, 'debris', .7], [10 + 1.2 / .3, 'hiss', .6], [10 + 1.2 / .3 + 1.7 / .3 * 0 + 5.67, 'explode', .9]]);

// #4 bridge slip + water clutch (from the sky island edge)
clip(4, 'BRIDGE SLIP → WATER CLUTCH', (S, u) => {
  const groundY = hAt(0, 36) + 1, slip = 5.4;
  const runs = [[0, 1], [12, .3], [21, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; let uu = (u - r[0]) * r[1]; if (r[0] === 12) uu = slip + (u - 12) * .3; if (r[0] === 21) uu = slip + (u - 21);
  const kf = Math.min(6.2, uu / .38); const b = bridgeAt(kf); const zb = 30 + (b.z + 18); // bridge continues from the island's far edge (z 31)
  for (let i = 0; i < Math.min(6, b.placed); i++) S.dyn.push({ x: 0, y: 63, z: 31 + i, tex: 'planks' });
  const fallT = Math.sqrt((64 - groundY) / 16), placeT = Math.sqrt((64 - groundY - 2) / 16), land = slip + fallT;
  let p; if (uu < slip) p = V(.5, 64 - .2 * b.crouch, zb + 1); else if (uu < land) { const tau = uu - slip; p = V(.5, 64 - 16 * tau * tau, 38.6 + .8 * tau); } else p = V(.5, groundY, 38.6 + .8 * fallT);
  P(S, p, Math.PI, uu < slip ? 'planks' : 'bucketW', { walk: uu < slip ? b.walk : 0, walkAmt: .5, fall: uu > slip && uu < land ? 1 : 0, time: u, use: seg(uu, slip + placeT - .1, slip + placeT + .2) }, { crouch: uu < slip ? b.crouch : 0 });
  water(S, V(0, groundY, Math.floor(38.6 + .8 * fallT)), slip + placeT, 99, uu); if (uu >= land) splashFX(S, land, V(.5, groundY, 38.6 + .8 * fallT), uu);
  if (r[0] === 0) S.cam = uu < slip ? cam([7.5, 65.8, p.z - 1.5], [.5, 63.8, p.z]) : { pos: V(7, Math.max(p.y + 2, groundY + 2.5), p.z + 2), look: V(.5, p.y + .6, p.z), fov: 60 };
  else if (r[0] === 12) S.cam = cam([6, groundY + 1.5, 44], [.5, Math.max(groundY + 1, p.y), 39], 62); else S.cam = { pos: V(-3.5, Math.max(p.y + 4, groundY + 4), p.z + 5), look: V(.5, p.y, p.z), fov: 64 };
  if (uu > slip && uu < slip + .9 && r[0] !== 12) S.overlays.push({ kind: 'pop', t0: r[0] + (r[0] === 21 ? 0 : slip), text: 'SLIPPED!', col: '#ff5252' });
  if (uu > land) S.overlays.push({ kind: 'pop', t0: r[0] === 0 ? land + .1 : r[0] === 12 ? 12 + (land - slip) / .3 : 21 + (land - slip), text: 'SAVED!', col: '#5cff7a' });
  if (r[0] === 12) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 12 });
}, [...[0, 1, 2, 3, 4].map(i => [(i + .75) * .38, 'thud', .5]), [5.4, 'gasp', .8], [5.5, 'whoosh7', .8], [5.4 + Math.sqrt(54 / 16), 'splash', 1.1], [5.4 + Math.sqrt(54 / 16) + .1, 'ding', .6], [21 + Math.sqrt(54 / 16), 'splash', .9]]);

// #3 elytra mace dive (rocket up, swap, fall, smash)
const E3 = { launch: 1.5, apex: 3.7, swap: 4.9, impact: 10.6 };
const E3mz = t => 46 - .8 * t, E3MZ = E3mz(E3.impact);
const E3Y = [[0, 9], [E3.launch, 9], [E3.apex, 46, 'out'], [E3.swap, 46.6, 'io'], [E3.impact, 11.1, 'in'], [E3.impact + .35, 12.2, 'out'], [E3.impact + .75, 9, 'in']];
const E3Z = [[0, 30], [E3.launch, 30], [E3.apex, 32, 'out'], [E3.swap, 32.3], [E3.impact, E3MZ - .3, 'in']];
clip(3, 'ELYTRA MACE DIVE', (S, u) => {
  const tm = u < 12.5 ? u : u < 21 ? lerp(1.3, E3.impact + .2, seg(u, 12.5, 21)) : E3.impact + (u - 21);
  const y = keyed(E3Y, tm), z = keyed(E3Z, tm); S.mobs = [zom(V(40, 9, E3mz(Math.min(tm, E3.impact))), tm, E3.impact)];
  smashFX(S, E3.impact, V(40, 9.05, E3MZ), 1.3, tm); S.bursts.push({ type: 'spark', t0: E3.launch, o: V(40, 9.3, 30), n: 60, sp: [1, 4], up: [-6, -1], drag: 2, life: .8, size: .14, seed: 81, tm });
  if (u < 12.5 && u > 3.8) { S.fp = true; S.player.visible = false; const eye = V(40, y + EYE, z); const dir = dirFrom(0, deg(-35)).lerp(V(40, 10.9, E3mz(Math.min(u, E3.impact))).sub(eye).normalize(), eIO(seg(u, 3.8, 5.2))).normalize(); S.cam = { pos: eye, dir, fov: 72 + 14 * seg(u, E3.swap, E3.impact) }; S.held = u < 4.3 ? 'rocket' : u < 7 ? 'chest' : 'mace'; S.switchT = u > 7 ? 7 : 4.3; S.swing = u > E3.impact - .15 && u < E3.impact + .25 ? seg(u, E3.impact - .15, E3.impact + .25) : (u > E3.swap - .1 && u < E3.swap + .25 ? seg(u, E3.swap - .1, E3.swap + .25) : 0); if (u > E3.swap && u < E3.swap + 1.4) S.overlays.push({ kind: 'pop', t0: E3.swap, text: 'SWAP!', col: '#ffd400' }); }
  else { P(S, V(40, y, z), 0, tm < E3.swap ? 'rocket' : 'mace', { smash: tm > E3.swap && tm < E3.impact + .3 ? seg(tm, E3.swap, E3.impact) : null }, { wings: tm < E3.swap ? (tm > E3.launch ? 1 : .15) : 0 });
    S.trail2 = tm > E3.launch && tm < E3.swap + .5 ? { pts: [...Array(30)].map((_, i) => { const tt = Math.max(E3.launch, tm - i * .03); return V(40, keyed(E3Y, tt) + .3, keyed(E3Z, tt)); }), sparks: true } : null;
    S.cam = u < 3.8 ? cam([44.8, Math.max(10.4, y - 2.4), z - 6.8], [40, y + .9, z]) : u < 21 ? cam([62, 28, 34], [40, 27.5, 34.5], 70) : cam([46.5, 11.4, E3MZ - 5.5], [40, 10.2, E3MZ], 62); if (u >= 12.5 && u < 21) S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 12.5 }); }
  if (u > E3.impact && u < 12.5) S.overlays.push({ kind: 'pop', t0: E3.impact, text: 'ONE HIT!', col: '#ffd400' });
}, [[1.5, 'rocket', 1], [4.9, 'clank', .9], [4.9, 'dive7', .9], [10.6, 'smash', 1.3], [12.5 + .2 / (E3.impact - 1.1) * 8.5, 'rocket', .4], [21, 'smash', .6]]);

// #2 double wind charge one-shot
const D2 = { b1: 2.0, a1: 3.0, b2: 3.2, a2: 4.6, dive: 5.6, impact: 7.6 };
const d2mz = t => 46 - .8 * t, D2MZ = d2mz(D2.impact);
const D2Y = [[0, 9], [D2.b1, 9], [D2.a1, 21, 'out'], [D2.b2, 21.3, 'io'], [D2.a2, 40, 'out'], [D2.dive, 40.6, 'io'], [D2.impact, 11.1, 'in'], [D2.impact + .35, 12.3, 'out'], [D2.impact + .8, 9, 'in']];
const D2Z = [[0, 30], [D2.b1, 30], [D2.a2, 32.5, 'io'], [D2.impact, D2MZ - .3, 'in']];
clip(2, 'DOUBLE WIND CHARGE ONE-SHOT', (S, u) => {
  const runs = [[0, 1], [10, .38], [21, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; let tm = (u - r[0]) * r[1]; if (r[0] === 10) tm = 1.8 + (u - 10) * .38; if (r[0] === 21) tm = D2.impact - 1.5 + (u - 21);
  const y = keyed(D2Y, tm), z = keyed(D2Z, tm), p = V(40, y, z); S.mobs = [zom(V(40, 9, d2mz(Math.min(tm, D2.impact))), tm, D2.impact)];
  P(S, p, 0, tm < D2.a2 ? 'wind' : 'mace', { fall: tm > D2.b1 && tm < D2.a2 ? .6 : 0, time: tm, smash: tm > D2.dive && tm < D2.impact + .3 ? seg(tm, D2.dive, D2.impact) : null, use: Math.max(seg(tm, D2.b1 - .25, D2.b1 + .1), seg(tm, D2.b2 - .25, D2.b2 + .1)) });
  windFX(S, D2.b1, V(40, 9.1, 30), tm); windFX(S, D2.b2, V(40, 21.2, 30.8), tm); smashFX(S, D2.impact, V(40, 9.05, D2MZ), 1.6, tm);
  if (r[0] === 0) { const off = tm < D2.dive ? V(6.5, 1.5 + seg(tm, D2.b1, D2.a2) * 2, -8) : V(lerp(6.5, 9, seg(tm, D2.dive, D2.impact)), lerp(3.5, 6, seg(tm, D2.dive, D2.impact)), lerp(-8, -9, seg(tm, D2.dive, D2.impact))); const cy = Math.min(y, 36);
    S.cam = tm > D2.impact ? cam([49, 13, D2MZ - 9], [40, 10, D2MZ]) : { pos: V(40 + off.x, cy + off.y + 1, z + off.z), look: V(40, lerp(cy + 1, 10, seg(tm, D2.dive, D2.impact) * .6), lerp(z + 3, D2MZ, seg(tm, D2.dive, D2.impact))), fov: 62 }; }
  else if (r[0] === 10) { S.cam = cam([64, 24, 35], [40, 24, 35], 70); S.trail2 = { pts: [...Array(40)].map((_, i) => { const tt = lerp(D2.b1, tm, i / 39); return V(40, keyed(D2Y, tt) + .9, keyed(D2Z, tt)); }), dots: true }; S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 10 }); }
  else S.cam = cam([44.5, 9.8, D2MZ + 4.5], [40, Math.max(11, y * .6 + 4), lerp(D2MZ, z, .5)], 70);
  if (tm > D2.impact && r[0] !== 10) S.overlays.push({ kind: 'pop', t0: r[0] === 0 ? D2.impact : 21 + 1.5, text: 'ONE-SHOT!', col: '#ffd400' });
}, [[2.0, 'windburst', 1], [3.2, 'windburst', 1.1], [5.6, 'dive', .9], [7.6, 'smash', 1.5], [10 + (D2.b1 - 1.8) / .38, 'windburst', .5], [10 + (D2.b2 - 1.8) / .38, 'windburst', .5], [10 + (D2.impact - 1.8) / .38, 'smash', .8], [22.5, 'smash', 1.2]]);

// #1 55-block mace drop from the cliff
clip(1, '55-BLOCK MACE DROP', (S, u) => {
  const runs = [[0, 1], [7.5, .25], [17.5, 1]]; let r = runs[0]; for (const rr of runs) if (u >= rr[0]) r = rr; let uu = (u - r[0]) * r[1]; if (r[0] === 7.5) uu = 1.6 + (u - 7.5) * .25; if (r[0] === 17.5) uu = 1.0 + (u - 17.5) * .5;
  const jumpT = 1.6, impT = jumpT + Math.sqrt((64 - 11.1) / 16); const mobz = t => -11.0 - .5 * t, MZ = mobz(impT);
  let p; if (uu < jumpT) p = V(.5, 64, lerp(-18.9, -18.1, seg(uu, .8, jumpT))); else if (uu < impT) { const tau = uu - jumpT; p = V(.5, 64 - 16 * tau * tau, lerp(-18.1, MZ - .3, tau / (impT - jumpT))); } else p = V(.5, keyed([[impT, 11.1], [impT + .35, 12.3, 'out'], [impT + .8, 9, 'in']], uu), MZ - .3);
  S.mobs = [zom(V(.5, 9, mobz(Math.min(uu, impT))), uu, impT, Math.PI)];
  P(S, p, 0, 'mace', { smash: uu > jumpT && uu < impT + .3 ? seg(uu, jumpT, impT) : null, walk: uu < jumpT && uu > .8 ? uu * 9 : 0 });
  smashFX(S, impT, V(.5, 9.05, MZ), 1.8, uu);
  if (r[0] === 0) S.cam = uu < jumpT ? cam([4.5, 66.2, -14.5], [.5, 64.6, -18.4], 58) : { pos: V(p.x + 6.5, Math.max(p.y + 2.5, 11.5), p.z + 3.5), look: V(p.x, lerp(p.y, 10, .3), p.z), fov: 62 };
  else if (r[0] === 7.5) S.cam = cam([6.5, 10.0, MZ + 6], [.5, Math.max(11, p.y * .5 + 6), lerp(MZ, p.z, .5)], 66); else S.cam = cam([14, 30, -6], [.5, 30, -15], 72);
  if (r[0] === 7.5) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 7.5 });
  if (r[0] === 17.5) { S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 17.5 }); S.trail2 = { pts: [...Array(40)].map((_, i) => { const tt = lerp(jumpT, Math.min(uu, impT), i / 39); const tau = tt - jumpT; return V(.5, 64 - 16 * tau * tau + .9, lerp(-18.1, MZ - .3, tau / (impT - jumpT))); }), dots: true }; }
  if (uu >= impT && r[0] !== 7.5) S.overlays.push({ kind: 'pop', t0: r[0] === 0 ? impT : 17.5 + (impT - 1.0) / .5, text: '55 BLOCKS = ONE-SHOT', col: '#ffd400' });
  if (uu < impT && uu > jumpT) S.overlays.push({ kind: 'speed', text: `FALL: ${Math.max(0, 64 - p.y).toFixed(0)} BLOCKS`, col: '#ffffff' });
}, [[1.6, 'whoosh7', .9], [1.6 + Math.sqrt(52.9 / 16), 'smash', 1.6], [7.5 + .2 / .25, 'dive', .5], [7.5 + Math.sqrt(52.9 / 16) / .25, 'smash', 1.0], [17.5 + (1.6 + Math.sqrt(52.9 / 16) - 1.0) / .5, 'smash', 1.3]]);

CLIPS.sort((a, b) => b.n - a.n); // countdown 20 → 1
const INTRO = 12, OUTRO = 10, TOTAL = INTRO + CLIPS.length * D + OUTRO;
window.TIMELINE = { INTRO, D, OUTRO, TOTAL, clips: CLIPS.map((c, i) => ({ n: c.n, title: c.title, start: INTRO + i * D, ev: c.ev })) };
const MONTAGE = [[1, 3.1], [2, 7.5], [3, 10.6], [5, 6.3], [11, 5.5], [10, 9], [13, 5], [14, 4.5]];

function newState(t) { return { t, u: 0, u0: 0, env: 'sky', fp: false, held: null, swing: 0, switchT: null, player: { visible: false, pos: V(0, 0, 0), yaw: 0, p: {}, wings: 0 }, mobs: [], dyn: [], water: [], bursts: [], rings: [], hits: [], overlays: [], filter: '', trail2: null, boat: null, bed: 0, portal2: 0, xray: null, crater: null, hoops: null, nausea: 0, flashT: null, flashTm: null }; }
function stateAt(t) {
  if (t < INTRO) { const i = Math.min(MONTAGE.length - 1, Math.floor(t / 1.5)), [n, uu] = MONTAGE[i], c = CLIPS.find(c => c.n === n); const S = newState(t); S.u = uu + (t - i * 1.5); S.u0 = t - S.u; c.f(S, S.u); S.overlays = S.overlays.filter(o => o.kind === 'speedlines'); S.overlays.push({ kind: 'intro' }); S.cut = i * 1.5; return S; }
  if (t >= TOTAL - OUTRO) { const S = newState(t); const a = deg(60) + (t - TOTAL + OUTRO) * .06; P(S, V(.5, 64, -19.5), 0, 'mace', {}, { wings: .15 }); S.cam = cam([.5 + Math.cos(a) * 10, 67, -19.5 + Math.sin(a) * 10], [.5, 65, -19.5], 56); S.overlays.push({ kind: 'outro', t0: TOTAL - OUTRO }); return S; }
  const i = Math.floor((t - INTRO) / D), c = CLIPS[i], S = newState(t); S.u = t - INTRO - i * D; S.u0 = INTRO + i * D; c.f(S, S.u);
  S.overlays.push({ kind: 'counter', n: c.n, title: c.title, u: S.u }); S.cut = INTRO + i * D; return S;
}

// ---------- apply ----------
const ENV = { sky: { fog: [SKY.getHex(), 70, 200], hemi: 1.05, hcol: 0xe8f4ff, sun: 1.5, cam: 0, dome: true, bg: null }, mine: { fog: [0x050507, 3, 22], hemi: .32, hcol: 0xe8f4ff, sun: .12, cam: 2.8, dome: false, bg: 0 },
  nether: { fog: [0x4a1409, 14, 95], hemi: 1.15, hcol: 0xffc29a, sun: .45, cam: 1.6, dome: false, bg: 0x2a0905 }, tunnel: { fog: [0x2a0a06, 6, 34], hemi: 1.05, hcol: 0xffc29a, sun: .3, cam: 4.2, dome: false, bg: 0 } };
function applyHuman(h, st) {
  h.g.visible = !!st.visible; if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(st.tilt || 0, st.yaw || 0, 0); pose(h, st.p || {});
  if (st.sit) { h.legL.rotation.x = -1.45; h.legR.rotation.x = -1.45; h.armL.rotation.x = -.5; h.armR.rotation.x = -.5; }
  if (st.crouch) { h.legL.rotation.x += .35 * st.crouch; h.g.rotation.x += .28 * st.crouch; }
  if (st.held && ICON[st.held]) { h.item.visible = true; h.item.material.map = ICON[st.held]; } else h.item.visible = false;
}
function apply(S) {
  const t = S.t, env = ENV[S.env];
  scene.fog.color.setHex(env.fog[0]); scene.fog.near = env.fog[1]; scene.fog.far = env.fog[2]; scene.background = env.bg == null ? null : new THREE.Color(env.bg);
  scene.userData.dome.visible = env.dome; scene.userData.sun.visible = env.dome; clouds.visible = env.dome;
  hemi.intensity = env.hemi; hemi.color.setHex(env.hcol); sunL.intensity = env.sun; camLight.intensity = env.cam;
  applyHuman(PLAYER, S.player); wings.visible = PLAYER.g.visible && (S.player.wings || 0) > 0; const ws = S.player.wings || 0;
  wingL.rotation.set(0, .2 + .9 * ws, -.1 - .55 * ws); wingR.rotation.set(0, -.2 - .9 * ws, .1 + .55 * ws);
  [GHOST, GHOST2].forEach(h => h.g.visible = false); outline.visible = false; trail.visible = false; orb.visible = false;
  // mobs
  const zs = S.mobs.filter(m => m.kind === 'zombie'); ZOMBIES.forEach((z, i) => { const m = zs[i]; z.g.visible = !!m && m.alive; if (!z.g.visible) return; z.g.position.copy(m.pos); z.g.rotation.set(0, m.yaw, 0); pose(z, { walk: m.dead ? 0 : m.walk, zombie: true }); if (m.dead) { z.g.rotation.x = m.dead * 1.3; } z.mats.forEach(mt => mt.emissive.setHex(m.hurt ? 0xaa0000 : 0)); });
  const cr = S.mobs.find(m => m.kind === 'creeper'); CREEPER.visible = !!cr && cr.alive; if (cr) { CREEPER.position.copy(cr.pos); CREEPER.rotation.set(0, cr.yaw, 0); const sw = cr.swell; CREEPER.scale.set(1 + sw * .25, 1 + sw * .12, 1 + sw * .25); const fl = sw > 0 && Math.floor(t * 8) % 2 === 0; CREEPER.userData.mats.forEach(m => m.emissive.setHex(fl ? 0x888888 : 0)); CREEPER.userData.legs.forEach((l, i) => l.rotation.x = sw > 0 ? 0 : Math.sin(t * 8 + i * Math.PI) * .4); }
  // water cells
  waterPool.forEach(w => w.visible = false); let wi = 0;
  for (const w of S.water) { const c = w.c, a = w.a; waterMat.opacity = .72 * w.alpha; const put = (dx, dz, h) => { if (h <= .02 || wi >= waterPool.length) return; const m = waterPool[wi++]; m.visible = true; m.scale.set(1, h, 1); m.position.set(c.x + dx + .5, c.y + h / 2, c.z + dz + .5); };
    put(0, 0, .88 * clamp(a * 2.5)); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => put(dx, dz, .62 * clamp(a * 2 - .4))); }
  // dynamic blocks
  const cnt = {}; for (const k of Object.keys(DYN)) cnt[k] = 0;
  for (const d of S.dyn) { const im = DYN[d.tex]; if (!im) continue; const i = cnt[d.tex]++; if (i >= 200) continue; const s = (d.pop ?? 1) * (1 + (d.wob ? Math.sin(t * 60) * .03 * d.wob : 0)); m4.makeScale(s, s, s).setPosition(d.x + .5, d.y + .5, d.z + .5); im.setMatrixAt(i, m4); }
  for (const [k, im] of Object.entries(DYN)) { for (let i = cnt[k]; i < 200; i++) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; }
  xrayPool.forEach(([l, m], i) => { const h = S.xray && S.xray[i]; l.visible = m.visible = !!h; if (h) { l.position.set(h[0] + .5, h[1] + .5, h[2] + .5); m.position.copy(l.position); m.material.opacity = .3 * (S.xrayA ?? 1); } });
  bed.visible = S.bed > 0; if (bed.visible) bed.position.set(DXX + .5, 15, 24);
  boat.visible = !!S.boat; if (S.boat) boat.position.copy(S.boat);
  portal2.visible = S.portal2 > 0; if (portal2.visible) portal2.scale.set(1, S.portal2, 1); portalNE.visible = S.env === 'nether';
  T.portal.offset.set(Math.sin(t * .7) * .1, t * .18); lavaSeaTex.offset.set(t * .02, t * .01); T.lava.offset.set(t * .05, t * .03);
  MOLD.forEach(m => m.visible = !!S.mold); crater.visible = !!S.crater; if (S.crater) { crater.position.copy(S.crater[0]); crater.scale.setScalar(Math.max(.01, S.crater[1])); }
  HOOPS.forEach((h, i) => { const o = S.hoops && S.hoops[i]; h.visible = !!o; if (o) { h.position.copy(o.pos); h.rotation.set(0, o.yaw, 0); h.material.color.set(o.passed ? '#5cff7a' : '#ffd23e'); } });
  // camera
  const c = S.cam; camera.fov = c.fov || 62; camera.updateProjectionMatrix(); const sh = shake(t, S.hits); camera.position.copy(c.pos).add(sh);
  if (c.look) camera.lookAt(c.look.clone().add(sh)); else camera.lookAt(camera.position.clone().add(c.dir || dirFrom(c.yaw || 0, c.pitch || 0)));
  scene.userData.dome.position.copy(camera.position); scene.userData.sun.position.copy(camera.position).add(V(120, 220, -260)); clouds.position.x = t * 1.2;
  window.ISLAND && window.ISLAND.forEach(m => m.visible = true);
  fp.visible = S.fp; if (S.fp) { const sw = S.swing || 0, sx = Math.sin(sw * Math.PI), ss = S.switchT != null ? S.u - S.switchT : 9, dip = ss >= 0 && ss < .3 ? Math.sin(Math.PI * ss / .3) * .35 : 0, bob = Math.sin(t * 8) * .012;
    fpArm.position.set(.42, -.4 - dip + bob, -.62 + sx * .15); fpArm.rotation.set(deg(10) - sx * .9, deg(-12), 0); fpItem.visible = !!S.held; if (S.held) fpItem.material.map = ICON[S.held]; fpItem.position.set(.33, -.22 - dip + bob - sx * .05, -.78 + sx * .1); fpItem.rotation.set(-sx * .8, deg(-55), deg(18)); }
  // particles
  const plist = []; for (const b of S.bursts) burstParticles(b, b.tm != null ? b.tm : S.u, plist);
  if (S.trail2) S.trail2.pts.forEach((p, i) => plist.push([p.x, p.y, p.z, S.trail2.dots ? .3 : .2 * (1 - i / S.trail2.pts.length), S.trail2.dots ? '#ffd400' : (i % 2 ? '#fff3a6' : '#ff9a1f')]));
  const col = new THREE.Color(); for (let i = 0; i < PMAX; i++) { if (i < plist.length) { const [x, y, z, s, cc] = plist[i]; m4.makeScale(s, s, s).setPosition(x, y, z); col.set(cc); } else m4.makeScale(0, 0, 0); parts.setMatrixAt(i, m4); parts.setColorAt(i, i < plist.length ? col : col.set('#000')); }
  parts.instanceMatrix.needsUpdate = true; parts.instanceColor.needsUpdate = true;
  ringPool.forEach(r => r.visible = false); let ri = 0;
  for (const r of S.rings) { const tt = r.tm != null ? r.tm : S.u, age = tt - r.t0; if (age < 0 || age > r.life || ri >= ringPool.length) continue; const m = ringPool[ri++], k = age / r.life; m.visible = true; m.position.copy(r.o); m.rotation.set(Math.PI / 2, 0, 0); const s = r.r * eOutC(k) + .2; m.scale.set(s, s, 1 + s * .3); m.material.color.set(r.col); m.material.opacity = (1 - k) * .9; }
}

// ---------- overlays ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const ctx = comp.getContext('2d');
const FONT = (s, w = 900) => `${w} ${s}px "Inter", "Inter Display", sans-serif`;
function txt(s, x, y, size, fill, o = {}) { ctx.save(); ctx.font = FONT(size, o.w || 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle'; if (o.rot || o.scale) { ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale); x = 0; y = 0; } ctx.globalAlpha *= (o.alpha ?? 1); if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.lineWidth = o.lw || size * .16; ctx.strokeText(s, x, y); } ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore(); }
function rrect(x, y, w, h, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function project(v) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, vis: p.z < 1 }; }
function drawOverlays(S) {
  const t = S.t, u = S.u;
  if (S.nausea) { const n = S.nausea; ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .1, W / 2, H / 2, H * .9); g.addColorStop(0, `rgba(160,60,255,${.25 * n})`); g.addColorStop(1, `rgba(90,20,170,${.85 * n})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  for (const o of S.overlays) {
    if (o.kind === 'counter') { const k = eOutBack(seg(o.u, .1, .5)), big = 1 - seg(o.u, 2.6, 3.1);
      if (big > 0) { ctx.save(); ctx.globalAlpha = big; ctx.translate(W / 2, H * .42); ctx.scale(k, k); txt('#' + o.n, 0, -40, 230, '#ffd400', { lw: 30 }); ctx.font = FONT(84); const w = ctx.measureText(o.title).width + 80; rrect(-w / 2, 90, w, 120, 18, '#e53935', '#000', 7); txt(o.title, 0, 152, 84, '#fff', { lw: 12 }); ctx.restore(); }
      if (o.u > 2.8) { const a = seg(o.u, 2.8, 3.2); ctx.save(); ctx.globalAlpha = a; ctx.font = FONT(40); const w = ctx.measureText(o.title).width + 150 + (o.n >= 10 ? 28 : 0); rrect(36, H - 130, w, 86, 20, 'rgba(0,0,0,.7)', '#ffd400', 4); ctx.font = FONT(50); const nw = ctx.measureText('#' + o.n).width; txt('#' + o.n, 66, H - 87, 50, '#ffd400', { stroke: false, align: 'left' }); txt(o.title, 66 + nw + 16, H - 86, 40, '#fff', { align: 'left', stroke: false }); ctx.restore(); } }
    else if (o.kind === 'pill') { const a = seg(u, o.t0, o.t0 + .2); ctx.save(); ctx.globalAlpha = a; ctx.font = FONT(34); const w = ctx.measureText(o.text).width + 74; rrect(48, 48, w, 62, 31, o.col, 'rgba(0,0,0,.35)', 3); ctx.fillStyle = Math.floor(t * 2.5) % 2 ? '#fff' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(80, 79, 10, 0, 7); ctx.fill(); txt(o.text, 102, 80, 34, '#fff', { align: 'left', stroke: false }); ctx.restore(); }
    else if (o.kind === 'speed') { ctx.font = FONT(40); const w = ctx.measureText(o.text).width + 64; rrect(W - 48 - w, 48, w, 76, 14, 'rgba(0,0,0,.62)', o.col || '#ffd400', 3); txt(o.text, W - 48 - w / 2, 87, 40, o.col || '#ffd400', { stroke: false }); }
    else if (o.kind === 'pop') { const k = eOutBack(seg(u, o.t0, o.t0 + .3)), a = 1 - seg(u, o.t0 + 2.6, o.t0 + 3.0); if (u < o.t0) continue; txt(o.text, W / 2, H * .3, 120, o.col, { scale: Math.max(.01, k), alpha: a, rot: -.04, lw: 20 }); }
    else if (o.kind === 'tag') { const p = project(o.at); if (!p.vis) continue; const k = eOutBack(seg(u, o.t0, o.t0 + .3)); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k); ctx.font = FONT(46); const w = ctx.measureText(o.text).width + 50; rrect(-w / 2, -38, w, 76, 12, 'rgba(0,0,0,.72)', o.col, 4); txt(o.text, 0, 2, 46, o.col, { stroke: false }); ctx.restore(); }
    else if (o.kind === 'speedlines') { const r = rng(Math.floor(t * 30)); ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; for (let i = 0; i < 36; i++) { const a = r() * Math.PI * 2, r0 = 360 + r() * 300, r1 = r0 + 120 + r() * 260; ctx.lineWidth = 2 + r() * 5; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * .7); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1 * .7); ctx.stroke(); } ctx.restore(); }
    else if (o.kind === 'intro') { const k = eOutBack(seg(t, .4, .9)); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(0, 0, W, H); ctx.translate(W / 2, H * .42); ctx.scale(k, k); txt('TOP 20 EPIC', 0, -110, 150, '#ffffff', { lw: 22 }); ctx.rotate(-.03); rrect(-660, -20, 1320, 170, 20, '#e53935', '#000', 8); txt('MINECRAFT MOMENTS', 0, 66, 120, '#ffd400', { lw: 16 }); ctx.restore(); }
    else if (o.kind === 'outro') { const q = seg(t, o.t0 + .2, o.t0 + .6), sb = seg(t, o.t0 + 2.4, o.t0 + 2.8), clicked = t > o.t0 + 4.2; ctx.save(); ctx.globalAlpha = q; txt('WHICH MOMENT WAS THE BEST?', W / 2, H * .2, 100, '#fff', { lw: 15, scale: eOutBack(q) }); txt('COMMENT #1 – #20', W / 2, H * .33, 110, '#ffd400', { lw: 16, scale: eOutBack(q) }); ctx.restore();
      if (sb > 0) { const k = eOutBack(sb); ctx.save(); ctx.translate(W / 2, H * .62); ctx.scale(k, k); rrect(-300, -62, 600, 124, 62, clicked ? '#3a3a3a' : '#e53935', '#000', 5); txt(clicked ? 'SUBSCRIBED' : 'SUBSCRIBE', 0, 4, 64, '#fff', { stroke: false }); ctx.restore(); }
      if (t > TOTAL - 1.4) { ctx.fillStyle = `rgba(0,0,0,${seg(t, TOTAL - 1.4, TOTAL - .4)})`; ctx.fillRect(0, 0, W, H); txt('HOLLOWCRAFT', W / 2, H / 2, 120, '#ffd400', { stroke: false, alpha: seg(t, TOTAL - 1.2, TOTAL - .7) }); } }
  }
}
window.renderFrame = function (t, ov) {
  const S = stateAt(t); if (ov) { if (ov.cam) S.cam = cam(ov.cam[0], ov.cam[1], ov.cam[2]); S.fp = false; S.overlays = []; S.cut = null; } apply(S); renderer.render(scene, camera);
  ctx.save(); ctx.filter = S.filter || 'none'; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  if (S.flashT != null) { const d = (S.flashTm != null ? S.flashTm : S.u) - S.flashT; if (d >= 0 && d < .35) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .35) * .8})`; ctx.fillRect(0, 0, W, H); } }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (!ov) drawOverlays(S); if (!ov) txt('HollowCraft', W - 40, H - 34, 30, 'rgba(255,255,255,.75)', { align: 'right', lw: 5, w: 800 });
  if (S.cut != null) { const d = t - S.cut; if (d >= 0 && d < .14) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .14) * .6})`; ctx.fillRect(0, 0, W, H); } }
  if (t < .25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .25})`; ctx.fillRect(0, 0, W, H); }
  return comp.toDataURL('image/jpeg', .9);
};
window.READY = true;
