// ---------- episode 2: extra 3D pieces ----------
const camLight = new THREE.PointLight(0xffe0b0, 0, 20, 1.3); camera.add(camLight);
const DYN = {};
for (const tex of ['deep', 'dore', 'planks']) { const im = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ map: T[tex] }), 64); im.frustumCulled = false; scene.add(im); DYN[tex] = im; }
const xrayPool = []; for (let i = 0; i < 10; i++) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: 0x4fe3d8, depthTest: false, fog: false })); l.renderOrder = 22; l.visible = false; scene.add(l); xrayPool.push(l); }
const xrayFill = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: 0x4fe3d8, transparent: true, opacity: .28, depthTest: false, fog: false })); m.renderOrder = 21; m.visible = false; scene.add(m); xrayFill.push(m); }
const edgeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-.02, 64.02, -18), V(1.02, 64.02, -18)]), new THREE.LineBasicMaterial({ color: 0xffd400, depthTest: false, fog: false })); edgeLine.renderOrder = 23; edgeLine.visible = false; scene.add(edgeLine);
const edgeBar = new THREE.Mesh(new THREE.BoxGeometry(1.04, .06, .06), new THREE.MeshBasicMaterial({ color: 0xffd400, depthTest: false, fog: false })); edgeBar.renderOrder = 23; edgeBar.visible = false; scene.add(edgeBar);
// elytra wings on the player's back
const wingTex = canvasTex(16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const edge = x > 13 - y * .3 || y === 15; px(g, x, y, edge ? '#4a4460' : ((x + y) % 5 === 0 ? '#7c7298' : '#a69cc4')); } });
const wingMat = new THREE.MeshLambertMaterial({ map: wingTex, side: THREE.DoubleSide, transparent: true, alphaTest: .5 });
const wings = new THREE.Group(); wings.position.set(0, 1.32, -.15); PLAYER.g.add(wings);
const wingL = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.15).translate(-.275, -.575, 0), wingMat), wingR = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.15).translate(.275, -.575, 0), wingMat);
wings.add(wingL, wingR);
const diaDrop = new THREE.Sprite(new THREE.SpriteMaterial({ map: ICON.diamond, fog: false })); diaDrop.scale.set(.35, .35, 1); diaDrop.visible = false; scene.add(diaDrop);
const hemi = scene.children.find(o => o.isHemisphereLight);

// ---------- helpers ----------
const EYE = 1.62;
function dirFrom(yaw, pitch) { return V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); }
function shake(t, hits) { let a = 0; for (const [h, amp] of hits) { const d = t - h; if (d >= 0 && d < .7) a += amp * (1 - d / .7); } return V(Math.sin(t * 91) * a, Math.sin(t * 73 + 1) * a, Math.cos(t * 67) * a * .6); }
function keyed(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [t1, v1, e] = keys[i], [t0, v0] = keys[i - 1]; if (t <= t1) { const k = (t - t0) / (t1 - t0); const f = e === 'out' ? eOutC(k) : e === 'in' ? eInQ(k) : e === 'io' ? eIO(k) : k; return lerp(v0, v1, f); } }
  return keys[keys.length - 1][1];
}
function mobState(z, t, impact) { const dead = impact != null ? clamp((t - impact) / .55) : 0; return { pos: V(40, 9, z), yaw: Math.PI, walk: t * 5, alive: t < (impact ?? 1e9) + .6, dead, hurt: impact != null && t >= impact }; }
function smashFX(S, t0, o, k = 1, tm) {
  S.bursts.push({ type: 'smash', t0, o: o.clone().add(V(0, .3, 0)), n: Math.round(160 * k), sp: [4, 11 * k], up: [5, 12], g: 26, life: 1.5, size: .2, seed: 70, floor: 9.1, tm });
  S.bursts.push({ type: 'spark', t0, o: o.clone().add(V(0, 1.6, 0)), n: 50, sp: [3, 9], up: [-3, 6], drag: 2, life: .6, size: .1, seed: 71, tm });
  S.bursts.push({ type: 'poof', t0: t0 + .55, o: o.clone().add(V(0, .9, 0)), n: 40, sp: [.4, 1.6], up: [.5, 2], drag: 1, life: 1.1, size: .3, seed: 72, tm });
  S.rings.push({ t0, o: o.clone().add(V(0, .08, 0)), r: 7 * k, life: .7, col: '#ffffff', flat: true, tm }); S.rings.push({ t0: t0 + .1, o: o.clone().add(V(0, .08, 0)), r: 4.5 * k, life: .6, col: '#ffd84a', flat: true, tm });
  if (tm == null) S.hits.push([t0, .32 * k]); S.flashT = t0;
}
function rocketFX(S, t0, o, tm) {
  S.bursts.push({ type: 'spark', t0, o, n: 60, sp: [1, 4], up: [-6, -1], drag: 2, life: .8, size: .14, seed: 81, tm });
  S.bursts.push({ type: 'poof', t0, o, n: 25, sp: [.5, 1.5], up: [-1, .5], drag: 1, life: .9, size: .28, seed: 82, tm });
}
PCOL.break = ['#4a4a52', '#5c5c66', '#3a3a42']; PCOL.dbreak = ['#4fe3d8', '#d6fffb', '#4a4a52']; PCOL.place = ['#b88a52', '#d9b07a'];

// ---- mine: dynamic blocks being dug on camera
const MAIN_DIG = []; { let i = 0; for (let z = 26; z <= 29; z++) for (const y of [-57, -58]) MAIN_DIG.push({ x: MX, y, z, tex: 'deep', t1: 30.95 + (i++) * .34 }); }
const BRANCH_DIG = []; { let i = 0; for (let x = 203; x <= 207; x++) for (const y of [-57, -58]) BRANCH_DIG.push({ x, y, z: 18, tex: 'deep', t1: 33.9 + (i++) * .48 }); }
const DIA_DIG = DIA.map(([x, y, z], i) => ({ x, y, z, tex: 'dore', t1: [41.2, 42.4, 43.6][i], gain: [3, 4, 2][i] }));
const MINE_DYN = [...MAIN_DIG, ...BRANCH_DIG, ...DIA_DIG];
const diamondsAt = tm => DIA_DIG.reduce((a, d) => a + (tm >= d.t1 + .5 ? d.gain : 0), 0);
const HIDDEN = [[MX - 2, -56, 11], [MX + 3, -60, 23], [MX - 3, -58, 26], [MX + 2, -55, 30], [MX - 4, -57, 18], [MX + 3, -58, 3], [MX - 2, -60, 6]];
function mineFX(S, tm) { // break particles + pickups, evaluated at mine-time tm
  for (const d of MINE_DYN) {
    if (tm >= d.t1 && tm < d.t1 + .8) S.bursts.push({ type: d.tex === 'dore' ? 'dbreak' : 'break', t0: d.t1, o: V(d.x + .5, d.y + .5, d.z + .5), n: 26, sp: [1, 3], up: [1, 4], g: 18, life: .7, size: .09, seed: d.x * 7 + d.y * 3 + d.z, tm });
  }
}
function mineSet(S, tm) { S.env = 'mine'; S.dyn = MINE_DYN.filter(d => tm < d.t1).map(d => ({ ...d, wob: seg(tm, d.t1 - .3, d.t1) })); mineFX(S, tm); S.mineT = tm; }
const MINE_HOTBAR = ['pick', 'torch', 'bread', 'planks', null, null, null, null, 'diamond'];

// ---- bridge: k = blocks placed (continuous); u = phase in the current step
function bridgeAt(kf, mode = 'hold') {
  const k = Math.floor(kf), u = kf - k, edge = -18 + k;
  const z = u < .7 ? lerp(edge - .75, edge + .25, eIO(u / .7)) : edge + .25;
  const placed = k + (u >= .75 ? 1 : 0), pop = u >= .75 ? clamp((u - .75) / .1) : 1;
  const crouch = mode === 'hold' ? 1 : clamp(1 - Math.abs(u - .72) / .22);
  return { z, placed, pop, crouch, use: u > .7 && u < .95 ? seg(u, .7, .95) : 0, walk: u < .7 ? u * 9 : 0 };
}
function bridgeSet(S, b, maxK = 99) {
  S.dyn = []; const n = Math.min(b.placed, maxK);
  for (let i = 0; i < n; i++) S.dyn.push({ x: 0, y: 63, z: -18 + i, tex: 'planks', pop: i === n - 1 ? b.pop : 1 });
}
const BRIDGE_HOTBAR = ['planks', 'pick', 'bread', 'torch', null, null, null, null, null];

// ---- elytra + mace
const EL_HOTBAR = (swapped) => ['mace', 'rocket', swapped ? 'elytra' : 'chest', 'bread', null, null, null, null, null];
const mobE = t => 50 - .8 * (t - 96);
const E = { launch: 101.4, apex: 103.6, swap: 104.8, mace: 108.6, impact: 112.5 };
const E_MOBZ = mobE(E.impact);
const EY = [[0, 9], [E.launch, 9], [E.apex, 46, 'out'], [E.swap, 46.6, 'io'], [E.impact, 11.1, 'in'], [E.impact + .35, 12.2, 'out'], [E.impact + .75, 9, 'in']];
const EZ = [[0, 30], [E.launch, 30], [E.apex, 32, 'out'], [E.swap, 32.3], [E.impact, E_MOBZ - .3, 'in']];
function realCombo(launch, apexY, z0, mobZf) { // real-speed: boost 1.4s, swap .2s later, physical fall (g=32)
  const apex = launch + 1.4, swap = apex + .2, fallT = Math.sqrt((apexY + .3 - 11.1) / 16), impact = swap + fallT, mz = mobZf(impact);
  return { launch, apex, swap, impact, mz,
    y: t => t < launch ? 9 : t < apex ? lerp(9, apexY, eOutC((t - launch) / 1.4)) : t < swap ? apexY + .3 * seg(t, apex, swap) : t < impact ? apexY + .3 - 16 * (t - swap) ** 2 : keyed([[impact, 11.1], [impact + .35, 12.1, 'out'], [impact + .75, 9, 'in']], t),
    z: t => t < launch ? z0 : t < impact ? lerp(z0, mz - .3, eIO((t - launch) / (impact - launch))) : mz - .3 };
}
const C_A = realCombo(125.0, 40, 30, t => 46 - .8 * (t - 124.4));
const C_B = realCombo(131.0, 44, 30, t => 44 - .8 * (t - 129.6));
const C_I = realCombo(.7, 34, 30, t => 40 - .8 * t); // intro (launch part), reused for the hook smash with its own fall below
const HD = { apex: 7.7, swap: 7.95 }; HD.impact = HD.swap + Math.sqrt((34.3 - 11.1) / 16); const mobD = t => 40 - .8 * (t - 7.7); HD.mz = mobD(HD.impact);
function elytraPlayer(S, y, z, t, opts = {}) {
  S.player.pos = V(40, y, z); S.player.yaw = opts.yaw ?? 0; S.player.wings = opts.wings ?? 1; S.player.held = opts.held || 'rocket';
  S.player.p = { fall: opts.fall ? 1 : 0, time: t, smash: opts.smash ?? null, use: opts.use ?? 0 };
}

// ---------- the timeline ----------
function stateAt(t) {
  const S = { t, env: 'sky', hud: false, fp: false, held: 'pick', slot: 0, swing: 0, hotbar: MINE_HOTBAR, counts: {}, bursts: [], rings: [], dyn: [], xray: null,
    player: { visible: true, pos: V(.5, 64, -19.5), yaw: 0, p: {}, wings: 0, crouch: 0, tilt: 0 }, mob: null, overlays: [], hits: [], filter: '', trail2: null, edge: false, drop: null };

  if (t < 4.1) { // HOOK A: rocket launch
    const y = C_I.y(t), z = C_I.z(Math.min(t, C_I.launch));
    elytraPlayer(S, Math.min(y, 34), z + seg(t, .7, 2.6) * 1.5, t, { wings: 1, use: seg(t, .45, .7) });
    S.trail2 = { from: .7, to: t, f: tt => V(40, Math.min(C_I.y(tt), 34), 30 + seg(tt, .7, 2.6) * 1.5) };
    rocketFX(S, .7, V(40, 9.3, 30));
    const p = S.player.pos; S.cam = { pos: V(45.5, 10.2, 25), look: V(40, lerp(10.5, p.y + 1, .85), 31), fov: 64 };
    S.overlays.push({ kind: 'hookTag', t0: .15, t1: 3.9, text: 'SEARCHED BY MILLIONS' });
    S.mob = mobState(40 - .8 * t, t, null);
  } else if (t < 5.8) { // HOOK B: diamonds
    const tm = lerp(40.9, 43.75, seg(t, 4.1, 5.8)); mineSet(S, tm);
    S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = MINE_HOTBAR; S.counts = { 1: 24, 2: 8, 3: 32, 8: diamondsAt(tm) };
    const tgt = DIA_DIG.find(d => tm < d.t1) || DIA_DIG[2];
    const eye = V(206.5, -58 + EYE, 18.5); S.cam = { pos: eye, dir: V(tgt.x + .5, tgt.y + .5, tgt.z + .5).sub(eye).normalize(), fov: 70 };
    S.swing = (tm * 3.2) % 1; S.held = 'pick';
    S.overlays.push({ kind: 'diamonds', n: diamondsAt(tm) });
    for (const d of DIA_DIG) if (tm >= d.t1 && tm < d.t1 + 1.2) S.overlays.push({ kind: 'pop', t0: d.t1 + (t - tm) , text: '+' + d.gain, x: W * .6, y: H * .38, size: 110, col: '#4fe3d8', life: 1.0 });
  } else if (t < 7.7) { // HOOK C: speed bridging, side view
    const b = bridgeAt(6 + (t - 5.8) / .38, 'tap'); bridgeSet(S, b);
    S.player.pos = V(.5, 64 - .2 * b.crouch, b.z); S.player.yaw = Math.PI; S.player.crouch = b.crouch; S.player.held = 'planks'; S.player.p = { walk: b.walk, walkAmt: .5, use: b.use, lookDown: .9 };
    S.cam = { pos: V(9, 65.5, b.z - 1), look: V(.5, 63.2, b.z), fov: 62 };
  } else if (t < 10.6) { // HOOK D: elytra mace smash
    const y = t < HD.swap ? 34 + .3 * seg(t, HD.apex, HD.swap) : t < HD.impact ? 34.3 - 16 * (t - HD.swap) ** 2 : keyed([[HD.impact, 11.1], [HD.impact + .35, 12.1, 'out'], [HD.impact + .75, 9, 'in']], t);
    const z = lerp(33, HD.mz - .3, eIO(seg(t, HD.apex, HD.impact)));
    elytraPlayer(S, y, z, t, { wings: t < HD.swap ? 1 : 0, held: 'mace', smash: t > HD.swap ? seg(t, HD.swap, HD.impact) : null });
    S.mob = mobState(mobD(Math.min(t, HD.impact)), t, HD.impact);
    S.cam = { pos: V(58, 21, 35), look: V(40, 21, 36.5), fov: 66 };
    smashFX(S, HD.impact, V(40, 9.05, HD.mz), 1.1);
    if (t > HD.swap - .05 && t < HD.swap + .9) S.overlays.push({ kind: 'worldTag', at: V(40, 37, z), text: 'SWAP!', col: '#ffd400', t0: HD.swap });
    if (t >= HD.impact) S.overlays.push({ kind: 'pop', t0: HD.impact, text: 'ONE-SHOT!', x: W / 2, y: H * .3, size: 140, col: '#ffd400' });
  } else if (t < 14.0) { // TITLE
    const a = deg(150) + (t - 10.6) * .1; const b = bridgeAt(41); bridgeSet(S, b);
    S.player.pos = V(.5, 64, 27); S.player.yaw = Math.PI;
    S.cam = { pos: V(Math.cos(a) * 52, 70, 4 + Math.sin(a) * 52), look: V(0, 58, 2), fov: 55 };
    S.overlays.push({ kind: 'title', t0: 10.6, t1: 14.0 });
  } else if (t < 17.2) { // TRICK 1 CARD: mine cinematic
    mineSet(S, 20); const z = lerp(4, 9, seg(t, 14, 17.2));
    S.player.pos = V(MX + .5, -58, z); S.player.yaw = 0; S.player.held = 'pick'; S.player.p = { walk: t * 8 };
    S.cam = { pos: V(MX + .5, -56.6, z - 3.2), look: V(MX + .5, -57, z + 4), fov: 66 };
    S.overlays.push({ kind: 'card', t0: 14.0, t1: 17.2, num: '#1', name: 'FIND DIAMONDS FAST' });
  } else if (t < 26.2) { // staircase descent, fast-forward, F3 coords
    mineSet(S, 20); S.fp = true; S.hud = true; S.player.visible = false; S.counts = { 1: 24, 2: 8, 3: 32 };
    const k = seg(t, 17.2, 26.0), i = k * 12.4, y = -46 - Math.min(12, i), z = -12 + Math.min(12.4, i) + .5;
    S.cam = { pos: V(MX + .5, y + EYE + Math.sin(t * 22) * .04, z), yaw: 0, pitch: deg(-28), fov: 72 };
    S.overlays.push({ kind: 'pill', text: 'FAST FORWARD x20', col: '#1565c0', t0: 17.2 });
    S.overlays.push({ kind: 'coords', x: MX + .5, y: lerp(12, -58, k), z: z, hl: t >= 21.8 });
    if (t >= 21.8) S.overlays.push({ kind: 'f3hint', t0: 21.8 });
  } else if (t < 30.6) { // at Y -58: chart
    mineSet(S, 20); S.fp = true; S.hud = true; S.player.visible = false; S.counts = { 1: 24, 2: 8, 3: 32 };
    S.cam = { pos: V(MX + .5, -58 + EYE, .6), yaw: Math.sin((t - 26.2) * .5) * .08, pitch: deg(-6), fov: 70 };
    S.overlays.push({ kind: 'coords', x: MX + .5, y: -58, z: .6, hl: true });
    S.overlays.push({ kind: 'ychart', t0: 26.3 });
  } else if (t < 33.6) { // dig main tunnel
    mineSet(S, t); S.fp = true; S.hud = true; S.player.visible = false; S.counts = { 1: 24, 2: 8, 3: 32 };
    const z = 25.5 + clamp((t - 31.35) / .68, 0, 3);
    S.cam = { pos: V(MX + .5, -58 + EYE + Math.sin(t * 9) * .02, z), yaw: 0, pitch: deg(-12) - (MAIN_DIG.find(d => t < d.t1)?.y === -58 ? deg(18) : 0), fov: 70 };
    S.swing = (t * 3) % 1;
    S.overlays.push({ kind: 'coords', x: MX + .5, y: -58, z });
    S.overlays.push({ kind: 'tag2', t0: 30.7, text: '2 BLOCKS HIGH', col: '#ffd400' });
  } else if (t < 45.6) { // dig the branch, reveal + mine diamonds
    mineSet(S, t); S.fp = true; S.hud = true; S.player.visible = false; S.counts = { 1: 24, 2: 8, 3: 32, 8: diamondsAt(t) };
    const x = 202.5 + clamp((t - 34.35) / .96, 0, 4), eye = V(x, -58 + EYE, 18.5);
    let dir = dirFrom(Math.PI / 2, deg(-10) - (BRANCH_DIG.find(d => t < d.t1)?.y === -58 ? deg(18) : 0));
    const tgt = DIA_DIG.find(d => t < d.t1) || DIA_DIG[2];
    if (t > 38.25) dir.lerp(V(tgt.x + .5, tgt.y + .5, tgt.z + .5).sub(eye).normalize(), eIO(seg(t, 38.25, 38.9))).normalize();
    S.cam = { pos: eye, dir, fov: 70 };
    S.swing = t < 38.25 || (t > 40.6 && t < 43.7) ? (t * 3.2) % 1 : 0;
    S.overlays.push({ kind: 'coords', x, y: -58, z: 18.5 });
    S.overlays.push({ kind: 'diamonds', n: diamondsAt(t) });
    if (t < 38.4) S.overlays.push({ kind: 'branchMap', t0: 33.8, prog: seg(t, 33.9, 38.2) });
    if (t >= 38.3 && t < 40.2) S.overlays.push({ kind: 'pop', t0: 38.3, text: 'DIAMONDS!', x: W / 2, y: H * .26, size: 130, col: '#4fe3d8' });
    if (t >= 40.0) S.overlays.push({ kind: 'tag2', t0: 40.0, text: 'FORTUNE III = UP TO 4 PER ORE', col: '#4fe3d8', icon: 'pick' });
    for (const d of DIA_DIG) if (t >= d.t1 && t < d.t1 + 1.1) S.overlays.push({ kind: 'pop', t0: d.t1, text: '+' + d.gain, x: W * .62, y: H * .42, size: 110, col: '#4fe3d8' });
    const dd = DIA_DIG.find(d => t >= d.t1 && t < d.t1 + .5); if (dd) { const k = seg(t, dd.t1, dd.t1 + .5); S.drop = V(lerp(dd.x + .5, x, k), dd.y + .5 + Math.sin(Math.PI * k) * .5, lerp(dd.z + .5, 18.6, k)); }
  } else if (t < 52.3) { // x-ray: hidden diamonds
    mineSet(S, 60); S.fp = true; S.hud = true; S.player.visible = false; S.counts = { 1: 24, 2: 8, 3: 32, 8: 9 };
    const z = lerp(7, 13, seg(t, 45.6, 52.3));
    S.cam = { pos: V(MX + .5, -58 + EYE, z), yaw: Math.sin((t - 45.6) * .45) * .45, pitch: deg(-4), fov: 74 };
    if (t > 46.2) { S.xray = HIDDEN; S.xrayA = seg(t, 46.2, 46.8); S.filter = `brightness(${1 - .35 * S.xrayA})`; }
    S.overlays.push({ kind: 'pill', text: 'X-RAY VIEW', col: '#00897b', t0: 46.2 });
    if (t > 46.6) S.overlays.push({ kind: 'banner', t0: 46.6, text: 'MOST DIAMONDS ARE INSIDE SOLID ROCK', col: '#4fe3d8' });
    S.overlays.push({ kind: 'diamonds', n: 9 });
  } else if (t < 56.3) { // strip-mining montage, third person in branch z=12
    mineSet(S, 60); const x = lerp(201.5, 210, seg(t, 52.3, 56.3));
    S.player.pos = V(x, -58, 12.5); S.player.yaw = Math.PI / 2; S.player.held = 'pick'; S.player.p = { walk: t * 10 };
    S.cam = { pos: V(x - 3.3, -56.4, 12.5), look: V(x + 3, -57.2, 12.5), fov: 66 };
    S.overlays.push({ kind: 'pill', text: 'STRIP MINING', col: '#1565c0', t0: 52.3 });
    S.overlays.push({ kind: 'diamonds', n: 9 + Math.floor(seg(t, 52.8, 56) * 3) * 3 });
  } else if (t < 59.8) { // TRICK 2 CARD
    S.player.pos = V(.5, 64, -18.6); S.player.yaw = 0; S.player.held = 'planks';
    S.cam = { pos: V(lerp(13, 11, seg(t, 56, 59.8)), 66, -13), look: V(.5, 62, -16), fov: 58 };
    S.overlays.push({ kind: 'card', t0: 56.0, t1: 59.8, num: '#2', name: 'SPEED BRIDGING' });
  } else if (t < 65.0) { // turn around, look at the edge
    S.player.pos = V(.5, 64, -18.75); S.player.yaw = lerp(0, Math.PI, eIO(seg(t, 60.6, 61.6))); S.player.held = 'planks';
    S.player.p = { lookDown: lerp(0, .9, eIO(seg(t, 62.4, 63.2))) };
    S.cam = { pos: V(5.5, 66.3, -14.8), look: V(.5, 64.3, -18.6), fov: 56 };
    S.hud = true; S.hotbar = BRIDGE_HOTBAR; S.counts = { 0: 64, 3: 32, 2: 8 };
    if (t > 60.6 && t < 63.2) S.overlays.push({ kind: 'worldTag', at: V(.5, 67.2, -18.7), text: 'FACE AWAY FROM THE GAP', col: '#ffd400', t0: 60.6 });
    if (t > 62.6) { S.edge = true; S.overlays.push({ kind: 'worldTag', at: V(.5, 65.6, -17.4), text: 'LOOK AT THIS EDGE', col: '#ffd400', t0: 62.6 }); }
  } else if (t < 67.6) { // first person: hold sneak + walk back
    const b = bridgeAt(.7 * seg(t, 65.3, 67.3)); bridgeSet(S, b);
    S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = BRIDGE_HOTBAR; S.counts = { 0: 64, 3: 32, 2: 8 }; S.held = 'planks';
    S.cam = { pos: V(.5, 64 + 1.27, b.z), yaw: Math.PI, pitch: deg(-79), fov: 72 }; S.edge = true;
    S.overlays.push({ kind: 'keys', keys: [['S', 'WALK BACK', t > 65.2], ['SHIFT', 'SNEAK', t > 65.0], ['RMB', 'PLACE', false]] });
    S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 65.0 });
  } else if (t < 71.2) { // side view: hanging at the edge, can't fall
    S.player.pos = V(.5, 63.8, -17.75); S.player.yaw = Math.PI; S.player.crouch = 1; S.player.held = 'planks'; S.player.p = { lookDown: .9 };
    S.cam = { pos: V(7.5, 64.6, -16.6), look: V(.5, 62.6, -17.9), fov: 54 };
    S.overlays.push({ kind: 'worldTag', at: V(.5, 66.6, -17.6), text: "SNEAK = CAN'T FALL", col: '#5cff7a', t0: 67.8 });
    S.overlays.push({ kind: 'dropLine', a: V(.5, 63.6, -17.5), b: V(.5, 9, -17.5), t0: 68.4, text: '55 BLOCK DROP' });
  } else if (t < 74.6) { // first person: place, step back, repeat
    const b = bridgeAt(lerp(.7, 2.7, seg(t, 71.3, 74.3))); bridgeSet(S, b);
    S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = BRIDGE_HOTBAR; S.counts = { 0: 64 - b.placed, 3: 32, 2: 8 }; S.held = 'planks';
    S.cam = { pos: V(.5, 64 + 1.27, b.z), yaw: Math.PI, pitch: deg(-79), fov: 72 }; S.swing = b.use;
    S.overlays.push({ kind: 'keys', keys: [['S', 'WALK BACK', b.walk > 0], ['SHIFT', 'SNEAK', true], ['RMB', 'PLACE', b.use > 0]] });
    const k = Math.floor(lerp(.7, 2.7, seg(t, 71.3, 74.3)) - .7 + 1e-6); const u = lerp(.7, 2.7, seg(t, 71.3, 74.3)) % 1;
    S.overlays.push({ kind: 'bigStep', text: u > .7 && u < .99 ? 'PLACE' : 'STEP BACK', n: k });
  } else if (t < 86.6) { // real-speed speed bridging, side tracking
    const kf = Math.min(41, 2.7 + (t - 74.6) / .40), b = bridgeAt(kf, 'tap'); bridgeSet(S, b);
    S.player.pos = V(.5, 64 - .2 * b.crouch, b.z); S.player.yaw = Math.PI; S.player.crouch = b.crouch; S.player.held = 'planks'; S.player.p = { walk: b.walk, walkAmt: .5, use: b.use, lookDown: .9 };
    S.hud = true; S.hotbar = BRIDGE_HOTBAR; S.counts = { 0: 64 - b.placed, 3: 32, 2: 8 };
    if (t < 80.8) S.cam = { pos: V(7.5, 65.8, b.z - 1.5), look: V(.5, 63.8, b.z), fov: 60 };
    else S.cam = { pos: V(3.2, 67.2, b.z + 6.5), look: V(.5, 64.2, b.z - 1), fov: 64 };
    S.overlays.push({ kind: 'pill', text: 'REAL SPEED', col: '#2e7d32', t0: 74.6 });
    S.overlays.push({ kind: 'keys', keys: [['S', 'WALK BACK', true], ['SHIFT', 'TAP AT EDGE', b.crouch > .5], ['RMB', 'PLACE', b.use > 0]] });
    S.overlays.push({ kind: 'counter', text: `BLOCKS: ${b.placed}` });
  } else if (t < 96.3) { // wide: bridge reaches the island, celebrate
    const kf = Math.min(41, 2.7 + (t - 74.6) / .40), b = bridgeAt(kf, 'tap'); bridgeSet(S, b);
    S.hud = false; S.overlays.push({ kind: 'counter', text: `BLOCKS: ${b.placed}` });
    if (kf < 41) { S.player.pos = V(.5, 64 - .2 * b.crouch, b.z); S.player.yaw = Math.PI; S.player.crouch = b.crouch; S.player.held = 'planks'; S.player.p = { walk: b.walk, walkAmt: .5, use: b.use, lookDown: .9 }; }
    else { const k = seg(t, 90.3, 92.6), jy = Math.max(0, Math.sin(Math.PI * seg(t, 93.2, 93.8))) * 1.2;
      S.player.pos = V(.5, 64 + jy, lerp(23.25, 26.5, k)); S.player.yaw = lerp(Math.PI, 0, eIO(seg(t, 89.9, 90.5))); S.player.held = 'planks'; S.player.p = { walk: k > 0 && k < 1 ? t * 9 : 0 }; }
    const a = deg(-20) + (t - 86.6) * .05;
    S.cam = { pos: V(26 * Math.cos(a), 74, 3 + 26 * Math.sin(a) * .2 - 4), look: V(0, 63, 4), fov: 62 };
    if (t > 90.4) S.overlays.push({ kind: 'pop', t0: 90.4, text: 'MADE IT!', x: W / 2, y: H * .28, size: 130, col: '#5cff7a' });
  } else if (t < 101.0) { // TRICK 3 CARD
    elytraPlayer(S, 9, 30, t, { wings: .15, held: 'rocket' });
    S.mob = mobState(mobE(t), t, null);
    S.cam = { pos: V(lerp(28, 29.5, seg(t, 96, 101)), 15, 21), look: V(41, 10, 40), fov: 56 };
    S.overlays.push({ kind: 'card', t0: 96.0, t1: 101.0, num: '#3', name: 'ELYTRA MACE' });
  } else if (t < 103.8) { // rocket boost, low ground cam
    const y = keyed(EY, t), z = keyed(EZ, t);
    elytraPlayer(S, y, z, t, { wings: lerp(.15, 1, seg(t, E.launch, E.launch + .4)), held: 'rocket', use: seg(t, E.launch - .25, E.launch) });
    S.trail2 = { from: E.launch, to: t, f: tt => V(40, keyed(EY, tt), keyed(EZ, tt)) };
    rocketFX(S, E.launch, V(40, 9.3, 30));
    S.mob = mobState(mobE(t), t, null);
    S.cam = { pos: V(46, 10.5, 25.5), look: V(40, lerp(10, y + 1, .9), z), fov: 66 };
    S.hud = true; S.hotbar = EL_HOTBAR(false); S.slot = 1; S.counts = { 1: t > E.launch ? 15 : 16, 3: 8 };
    S.overlays.push({ kind: 'armor', item: 'elytra' });
  } else if (t < 113.2) { // first person: swap + fall + smash
    S.fp = true; S.hud = true; S.player.visible = false;
    const y = keyed(EY, t), z = keyed(EZ, t), eye = V(40, y + EYE, z);
    S.mob = mobState(mobE(Math.min(t, E.impact)), t, E.impact);
    const mobHead = V(40, 10.9, mobE(Math.min(t, E.impact)));
    let dir = dirFrom(0, deg(-35)).lerp(mobHead.clone().sub(eye).normalize(), eIO(seg(t, 103.8, 105.4))).normalize();
    if (t > E.impact) dir.lerp(dirFrom(0, deg(-30)), eIO(seg(t, E.impact + .2, E.impact + .7))).normalize();
    S.cam = { pos: eye, dir, fov: 72 + 14 * seg(t, E.swap, E.impact) - 14 * seg(t, E.impact, E.impact + .4) };
    const swapped = t > E.swap; S.hotbar = EL_HOTBAR(swapped); S.counts = { 1: 15, 3: 8 };
    S.slot = t < 104.2 ? 1 : t < E.mace ? 2 : 0; S.held = S.hotbar[S.slot]; S.switchT = t >= E.mace ? E.mace : t >= 104.2 ? 104.2 : null;
    S.swing = Math.max(t > E.swap - .1 && t < E.swap + .25 ? seg(t, E.swap - .1, E.swap + .25) : 0, t > E.impact - .15 && t < E.impact + .25 ? seg(t, E.impact - .15, E.impact + .25) : 0);
    S.overlays.push({ kind: 'armor', item: swapped ? 'chest' : 'elytra', flash: seg(t, E.swap, E.swap + .5) });
    if (t > 104.2 && t < 105.6) S.overlays.push({ kind: 'slotHint', slot: 2, text: 'RIGHT-CLICK TO SWAP', t0: 104.2 });
    if (t > E.swap && t < E.swap + 1.4) S.overlays.push({ kind: 'pop', t0: E.swap, text: 'SWAP!', x: W / 2, y: H * .3, size: 120, col: '#ffd400' });
    if (t > E.mace && t < E.mace + 1.6) S.overlays.push({ kind: 'slotHint', slot: 0, text: 'MACE', t0: E.mace });
    if (t > 103.8 && t < E.impact) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 103.8 });
    if (t > E.swap && t < E.impact) S.overlays.push({ kind: 'meter', text: `FALLING: ${Math.max(0, 46.6 - y).toFixed(0)} BLOCKS`, col: '#ffffff' });
    if (t > 110.0 && t < E.impact) S.overlays.push({ kind: 'target', at: V(40, 10.2, mobE(t)), t0: 110.0 });
    smashFX(S, E.impact, V(40, 9.05, E_MOBZ), 1.2);
    if (t >= E.impact) S.overlays.push({ kind: 'pop', t0: E.impact, text: 'ONE HIT!', x: W / 2, y: H * .32, size: 140, col: '#ffd400' });
  } else if (t < 124.4) { // replay, side view, with trajectory + steps
    const tm = t < 121.0 ? lerp(E.launch - .2, E.impact, seg(t, 113.2, 121.0)) : E.impact + (t - 121.0);
    const y = keyed(EY, tm), z = keyed(EZ, tm);
    elytraPlayer(S, y, z, tm, { wings: tm < E.swap ? 1 : 0, held: tm < E.swap ? 'rocket' : 'mace', smash: tm > E.swap ? seg(tm, E.swap, E.impact) : null });
    S.mob = mobState(mobE(Math.min(tm, E.impact)), tm, E.impact);
    S.cam = { pos: V(66, 28, 34), look: V(40, 27, 34.5), fov: 66 };
    S.trail2 = { from: E.launch, to: tm, f: tt => V(40, keyed(EY, tt), keyed(EZ, tt)), dots: true };
    S.tmap = tm; rocketFX(S, E.launch, V(40, 9.3, 30), tm); smashFX(S, E.impact, V(40, 9.05, E_MOBZ), 1, tm);
    S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 113.2 });
    const step = tm < E.apex ? 0 : tm < E.swap + .4 ? 1 : tm < E.impact ? 2 : 3;
    S.overlays.push({ kind: 'steps', active: step, items: ['ROCKET UP', 'SWAP TO CHESTPLATE', 'FALL', 'SMASH'] });
    if (t > 117.6) S.overlays.push({ kind: 'proTip', t0: 117.6 });
  } else if (t < 138.4) { // real speed combos
    S.hud = true;
    const C = t < 129.6 ? C_A : C_B, mzf = t < 129.6 ? (tt => 46 - .8 * (tt - 124.4)) : (tt => 44 - .8 * (tt - 129.6));
    const y = C.y(t), z = C.z(t);
    elytraPlayer(S, y, z, t, { wings: t < C.swap ? (t > C.launch ? 1 : .15) : 0, held: t < C.swap ? 'rocket' : 'mace', smash: t > C.swap && t < C.impact + .3 ? seg(t, C.swap, C.impact) : null, use: seg(t, C.launch - .25, C.launch) });
    S.mob = mobState(mzf(Math.min(t, C.impact)), t, C.impact);
    S.trail2 = t < C.swap ? { from: C.launch, to: t, f: C.y && (tt => V(40, C.y(tt), C.z(tt))) } : null;
    rocketFX(S, C.launch, V(40, 9.3, 30)); smashFX(S, C.impact, V(40, 9.05, C.mz), 1.2);
    S.hotbar = EL_HOTBAR(t > C.swap); S.counts = { 1: t < 129.6 ? 15 : 14, 3: 8 }; S.slot = t < C.swap ? 1 : 0;
    if (t < 129.6) S.cam = { pos: V(55, 22, 33), look: V(40, lerp(20, 14, seg(t, C.swap, C.impact)), 37), fov: 66 };
    else if (t < 135.0) S.cam = { pos: V(44.5, 9.8, C.mz + 4.5), look: V(40, lerp(12, y * .7 + 3, .8), lerp(C.mz, z, .5)), fov: 70 };
    else { const a = (t - 135) * .35; S.cam = { pos: V(40 + Math.cos(a) * 8, 12.5, C.mz + Math.sin(a) * 8), look: V(40, 10, C.mz), fov: 60 }; S.player.p.smash = null; S.player.wings = seg(t, 135.6, 136.2); }
    S.overlays.push({ kind: 'pill', text: 'REAL SPEED', col: '#2e7d32', t0: 124.4 });
    if (t >= C.impact && t < C.impact + 1.8) S.overlays.push({ kind: 'pop', t0: C.impact, text: 'ONE-SHOT!', x: W / 2, y: H * .3, size: 150, col: '#ffd400' });
    S.overlays.push({ kind: 'armor', item: t > C.swap && t < 135.6 ? 'chest' : 'elytra' });
  } else { // OUTRO on the cliff with the finished bridge
    const a = deg(60) + (t - 138.4) * .07, b = bridgeAt(41); bridgeSet(S, b);
    S.player.pos = V(.5, 64, -19.5); S.player.yaw = 0; S.player.held = 'mace'; S.player.wings = .15;
    S.cam = { pos: V(.5 + Math.cos(a) * 10, 67, -19.5 + Math.sin(a) * 10), look: V(.5, 65, -19.5), fov: 55 };
    S.overlays.push({ kind: 'outro', t0: 138.4 });
  }
  return S;
}

// ---------- apply state to the 3D scene ----------
const ITEM_TEX = { sword: ICON.sword, pick: ICON.pick, bucketW: ICON.bucketW, bucket: ICON.bucket, wind: ICON.wind, mace: ICON.mace, planks: ICON.planks, rocket: ICON.rocket, elytra: ICON.elytra, chest: ICON.chest, torch: ICON.torch, bread: ICON.bread, diamond: ICON.diamond };
function applyHuman(h, st) {
  h.g.visible = st.visible !== false; if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(st.tilt || 0, st.yaw || 0, 0);
  pose(h, st.p || {});
  if (st.crouch) { h.g.position.y -= .0; h.legL.rotation.x += .35 * st.crouch; h.legR.rotation.x -= .1 * st.crouch; h.g.rotation.x += .28 * st.crouch; }
  if (st.held) { h.item.visible = true; h.item.material.map = ITEM_TEX[st.held]; } else h.item.visible = false;
}
const ENV = { sky: { fog: [SKY.getHex(), 70, 200], bg: null, hemi: 1.05, sun: 1.5, cam: 0, dome: true }, mine: { fog: [0x050507, 3, 22], bg: 0x000000, hemi: .32, sun: .12, cam: 2.8, dome: false } };
function apply(S) {
  const t = S.t, env = ENV[S.env];
  scene.fog.color.setHex(env.fog[0]); scene.fog.near = env.fog[1]; scene.fog.far = env.fog[2];
  scene.background = env.bg == null ? null : new THREE.Color(env.bg);
  scene.userData.dome.visible = env.dome; scene.userData.sun.visible = env.dome; clouds.visible = env.dome;
  hemi.intensity = env.hemi; sunL.intensity = env.sun; camLight.intensity = env.cam * (1 + Math.sin(t * 13) * .04);
  applyHuman(PLAYER, S.player);
  const ws = S.player.wings || 0; wings.visible = PLAYER.g.visible && ws > 0;
  wingL.rotation.set(0, .2 + .9 * ws, -.1 - .55 * ws); wingR.rotation.set(0, -.2 - .9 * ws, .1 + .55 * ws);
  if (S.mob) {
    const m = S.mob; MOB.g.visible = m.alive; MOB.g.position.copy(m.pos); MOB.g.rotation.set(0, m.yaw, 0);
    pose(MOB, { walk: m.dead ? 0 : m.walk, zombie: true });
    if (m.dead) { MOB.g.rotation.x = m.dead * 1.3; MOB.g.position.z += m.dead * 1.2; }
    MOB.mats.forEach(mt => mt.emissive.setHex(m.hurt ? 0xaa0000 : 0x000000));
  } else MOB.g.visible = false;
  GHOST.g.visible = false; GHOST2.g.visible = false; waterPool.forEach(w => w.visible = false); outline.visible = false; trail.visible = false;
  // dynamic blocks
  const cnt = { deep: 0, dore: 0, planks: 0 };
  for (const d of S.dyn) { const im = DYN[d.tex]; const i = cnt[d.tex]++; if (i >= 64) continue; const s = (d.pop ?? 1) * (1 + (d.wob ? Math.sin(t * 60) * .03 * d.wob : 0)); m4.makeScale(s, s, s).setPosition(d.x + .5, d.y + .5, d.z + .5); im.setMatrixAt(i, m4); }
  for (const [k, im] of Object.entries(DYN)) { for (let i = cnt[k]; i < 64; i++) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; }
  // x-ray
  xrayPool.forEach((l, i) => { const h = S.xray && S.xray[i]; l.visible = !!h; xrayFill[i].visible = !!h; if (h) { l.position.set(h[0] + .5, h[1] + .5, h[2] + .5); xrayFill[i].position.copy(l.position); xrayFill[i].material.opacity = .3 * (S.xrayA ?? 1) * (.75 + .25 * Math.sin(t * 6 + i)); l.material.opacity = S.xrayA ?? 1; } });
  edgeBar.visible = S.edge; if (S.edge) { edgeBar.position.set(.5, 64.03, -18 + (S.dyn.filter(d => d.tex === 'planks').length)); edgeBar.material.color.setHSL(.14, 1, .5 + .15 * Math.sin(t * 8)); }
  diaDrop.visible = !!S.drop; if (S.drop) diaDrop.position.copy(S.drop);
  // camera
  const c = S.cam; camera.fov = c.fov || 70; camera.updateProjectionMatrix();
  const sh = shake(t, S.hits);
  camera.position.copy(c.pos).add(sh);
  if (c.look) camera.lookAt(c.look.clone().add(sh)); else { const d = c.dir || dirFrom(c.yaw || 0, c.pitch || 0); camera.lookAt(camera.position.clone().add(d)); }
  scene.userData.dome.position.copy(camera.position);
  scene.userData.sun.position.copy(camera.position).add(V(120, 220, -260));
  clouds.position.x = t * 1.2;
  fp.visible = S.fp;
  if (S.fp) {
    const sw = S.swing || 0, sx = Math.sin(sw * Math.PI);
    const sinceSwitch = S.switchT != null ? t - S.switchT : 9, dip = sinceSwitch < .3 ? Math.sin(Math.PI * sinceSwitch / .3) * .35 : 0;
    const bob = Math.sin(t * 8) * .012;
    fpArm.position.set(.42, -.4 - dip + bob, -.62 + sx * .15); fpArm.rotation.set(deg(10) - sx * .9, deg(-12), 0);
    fpItem.visible = !!S.held; if (S.held) fpItem.material.map = ITEM_TEX[S.held];
    fpItem.position.set(.33, -.22 - dip + bob - sx * .05, -.78 + sx * .1); fpItem.rotation.set(-sx * .8, deg(-55), deg(18));
  }
  // particles (+ rocket trail dots)
  const plist = [];
  for (const b of S.bursts) burstParticles(b, b.tm != null ? b.tm : t, plist);
  if (S.trail2) {
    const tr = S.trail2, from = tr.dots ? tr.from : Math.max(tr.from, tr.to - .9);
    for (let tt = from; tt <= tr.to; tt += tr.dots ? .07 : .022) {
      const p = tr.f(tt), age = tr.to - tt;
      if (tr.dots) plist.push([p.x, p.y + .9, p.z, .3, '#ffd400']);
      else { const r = rng(Math.round(tt * 1000)); plist.push([p.x + (r() - .5) * .3, p.y + .3 - age * 1.5, p.z + (r() - .5) * .3, .22 * (1 - age / .9), r() < .5 ? '#fff3a6' : '#ff9a1f']); }
    }
  }
  const col = new THREE.Color();
  for (let i = 0; i < PMAX; i++) {
    if (i < plist.length) { const [x, y, z, s, cc] = plist[i]; m4.makeScale(s, s, s).setPosition(x, y, z); col.set(cc); } else m4.makeScale(0, 0, 0);
    parts.setMatrixAt(i, m4); parts.setColorAt(i, i < plist.length ? col : col.set('#000'));
  }
  parts.instanceMatrix.needsUpdate = true; parts.instanceColor.needsUpdate = true;
  ringPool.forEach(r => r.visible = false); let ri = 0;
  for (const r of S.rings) { const tt = r.tm != null ? r.tm : t, age = tt - r.t0; if (age < 0 || age > r.life || ri >= ringPool.length) continue;
    const m = ringPool[ri++], k = age / r.life; m.visible = true; m.position.copy(r.o); m.rotation.set(r.flat ? Math.PI / 2 : 0, 0, 0);
    const s = r.r * eOutC(k) + .2; m.scale.set(s, s, 1 + s * .3); m.material.color.set(r.col); m.material.opacity = (1 - k) * .9; }
  orb.visible = false;
}

// ---------- HUD / 2D overlays ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const ctx = comp.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = (s, w = 900) => `${w} ${s}px "Inter", "Inter Display", sans-serif`;
function txt(s, x, y, size, fill, o = {}) {
  ctx.save(); ctx.font = o.font || FONT(size, o.w || 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.scale) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); x = 0; y = 0; }
  ctx.globalAlpha *= (o.alpha ?? 1);
  if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.strokeCol || '#000'; ctx.lineWidth = o.lw || size * .16; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
}
function rrect(x, y, w, h, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function project(v) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, vis: p.z < 1 }; }
function heartPath(x, y, s, fill) {
  const rows = ['.XX...XX.', 'XooX.XooX', 'XoooXoooX', 'XoooooooX', '.XoooooX.', '..XoooX..', '...XoX...', '....X....'];
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; ctx.fillStyle = ch === 'X' ? '#1a0000' : fill; ctx.fillRect(x + i * s, y + j * s, s, s); }));
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 2 * s, y + 2 * s, s, s);
}
function icon(name, x, y, s) { if (ICON[name]) ctx.drawImage(ICON[name].userData.canvas, x, y, s, s); }
function drawHUD(S) {
  const slotW = 88, x0 = W / 2 - slotW * 4.5, y0 = H - 104;
  rrect(x0 - 6, y0 - 6, slotW * 9 + 12, slotW + 12, 6, 'rgba(0,0,0,.55)', '#1b1b1b', 4);
  S.hotbar.forEach((it, i) => {
    const x = x0 + i * slotW;
    rrect(x + 3, y0 + 3, slotW - 6, slotW - 6, 4, 'rgba(110,110,110,.45)', 'rgba(255,255,255,.25)', 2);
    if (it && !(it === 'diamond' && !S.counts[i])) icon(it, x + 14, y0 + 14, slotW - 28);
    const n = S.counts[i]; if (n) txt(String(n), x + slotW - 14, y0 + slotW - 18, 26, '#fff', { align: 'right', lw: 5, w: 800 });
  });
  const sx = x0 + S.slot * slotW;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeRect(sx - 2, y0 - 2, slotW + 4, slotW + 4);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(sx - 6, y0 - 6, slotW + 12, slotW + 12);
  for (let i = 0; i < 10; i++) heartPath(x0 + i * 40, y0 - 50, 4, '#e8262a');
  if (S.fp) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(W / 2 - 14, H / 2 - 2, 28, 4); ctx.fillRect(W / 2 - 2, H / 2 - 14, 4, 28); }
}
function pill(text, col, t0, t) {
  const a = seg(t, t0, t0 + .2); ctx.save(); ctx.globalAlpha = a;
  ctx.font = FONT(34, 900); const w = ctx.measureText(text).width + 74;
  rrect(48, 48, w, 62, 31, col, 'rgba(0,0,0,.35)', 3);
  ctx.fillStyle = (Math.floor(t * 2.5) % 2) ? '#fff' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(80, 79, 10, 0, 7); ctx.fill();
  txt(text, 102, 80, 34, '#fff', { align: 'left', stroke: false }); ctx.restore();
}
function keycap(x, y, k, label, on) {
  ctx.font = FONT(34); const w = Math.max(74, ctx.measureText(k).width + 40);
  rrect(x, y + (on ? 6 : 0), w, 74, 12, on ? '#ffd400' : '#e9e9e9', '#000', 5);
  if (!on) rrect(x, y + 66, w, 14, 6, '#9e9e9e');
  txt(k, x + w / 2, y + 38 + (on ? 6 : 0), 34, '#111', { stroke: false });
  txt(label, x + w / 2, y + 112, 26, on ? '#ffd400' : '#fff', { lw: 6, w: 800 });
  return w;
}
function drawOverlays(S) {
  const t = S.t;
  for (const o of S.overlays) {
    if (o.kind === 'pill') pill(o.text, o.col, o.t0, t);
    else if (o.kind === 'hookTag') {
      const a = seg(t, o.t0, o.t0 + .3) * (1 - seg(t, o.t1 - .3, o.t1));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * .17); ctx.rotate(-.03);
      ctx.font = FONT(74); const w = ctx.measureText(o.text).width + 100;
      rrect(-w / 2, -60, w, 120, 14, '#e53935', '#000', 6); txt(o.text, 0, 4, 74, '#fff', { lw: 10 }); ctx.restore();
    } else if (o.kind === 'title') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .5)), out = seg(t, o.t1 - .35, o.t1);
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H * .4); ctx.scale(k, k);
      txt('3 MINECRAFT TRICKS', 0, -90, 132, '#ffffff', { lw: 22 });
      ctx.rotate(-.035); rrect(-560, -10, 1120, 150, 18, '#e53935', '#000', 8);
      txt('YOU NEED TO KNOW', 0, 68, 116, '#ffd400', { lw: 16 });
      ctx.restore();
      if (t > o.t0 + .9) { const items = [['diamond', 'DIAMONDS'], ['planks', 'BRIDGING'], ['mace', 'ELYTRA MACE']]; items.forEach(([ic, l], i) => { const x = W / 2 + (i - 1) * 380, a = seg(t, o.t0 + .9 + i * .2, o.t0 + 1.2 + i * .2) * (1 - out); ctx.save(); ctx.globalAlpha = a; rrect(x - 170, H * .63, 340, 96, 48, 'rgba(0,0,0,.7)', '#fff', 3); icon(ic, x - 150, H * .63 + 16, 64); txt(l, x + 30, H * .63 + 49, 40, '#fff', { stroke: false }); ctx.restore(); }); }
    } else if (o.kind === 'card') {
      const kin = eOutBack(seg(t, o.t0, o.t0 + .45)), kout = eIO(seg(t, o.t1 - .4, o.t1));
      ctx.save(); ctx.translate((1 - kin) * -1300 + kout * 1500, 0);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.moveTo(0, H * .3); ctx.lineTo(W * .78, H * .3); ctx.lineTo(W * .72, H * .62); ctx.lineTo(0, H * .62); ctx.fill();
      ctx.save(); ctx.translate(150, H * .395); ctx.rotate(-.04); rrect(0, -60, 430, 120, 12, '#e53935', '#000', 6); txt('TRICK ' + o.num, 215, 4, 92, '#fff', { lw: 12 }); ctx.restore();
      txt(o.name, 160, H * .54, 104, '#ffd400', { align: 'left', lw: 14 }); ctx.restore();
    } else if (o.kind === 'slotHint') {
      const slotW = 88, x = W / 2 - slotW * 4.5 + o.slot * slotW + slotW / 2, a = seg(t, o.t0, o.t0 + .2), bob = Math.sin(t * 8) * 8;
      ctx.save(); ctx.globalAlpha = a; txt(o.text, x, H - 222 + bob, 40, '#ffd400', { lw: 8 });
      ctx.fillStyle = '#ffd400'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 18, H - 196 + bob); ctx.lineTo(x + 18, H - 196 + bob); ctx.lineTo(x, H - 174 + bob); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
    } else if (o.kind === 'meter' || o.kind === 'counter') {
      const text = o.text; ctx.font = FONT(36); const w = ctx.measureText(text).width + 60;
      rrect(W - 48 - w, 48, w, 70, 12, 'rgba(0,0,0,.6)', o.col || '#ffd400', 3); txt(text, W - 48 - w / 2, 84, 36, o.col || '#ffd400', { stroke: false });
    } else if (o.kind === 'pop') {
      if (o.t1 && t > o.t1) continue;
      const k = eOutBack(seg(t, o.t0, o.t0 + .3)), a = 1 - seg(t, o.t0 + (o.life ?? 2.6), o.t0 + (o.life ?? 2.6) + .4);
      txt(o.text, o.x, o.y, o.size, o.col, { scale: Math.max(.01, k), lw: o.size * .17, alpha: a, rot: -.04 });
    } else if (o.kind === 'worldTag') {
      const p = project(o.at); if (!p.vis) continue; const k = eOutBack(seg(t, o.t0, o.t0 + .3));
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k); ctx.font = FONT(52); const w = ctx.measureText(o.text).width + 60;
      rrect(-w / 2, -42, w, 84, 14, 'rgba(0,0,0,.72)', o.col, 4); txt(o.text, 0, 2, 52, o.col, { stroke: false }); ctx.restore();
    } else if (o.kind === 'target') {
      const p = project(o.at); if (!p.vis) continue; const k = seg(t, o.t0, o.t0 + .3), r = lerp(260, 90, eOutC(k)) + Math.sin(t * 10) * 6;
      ctx.save(); ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 7; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * (r - 30), p.y + Math.sin(a) * (r - 30)); ctx.lineTo(p.x + Math.cos(a) * (r + 30), p.y + Math.sin(a) * (r + 30)); ctx.stroke(); }
      txt('TARGET', p.x, p.y - r - 40, 46, '#ff3b3b', { lw: 8 }); ctx.restore();
    } else if (o.kind === 'coords') { // F3-style debug panel
      const lines = ['HollowCraft (F3 debug)', `XYZ: ${o.x.toFixed(1)} / ${o.y.toFixed(1)} / ${o.z.toFixed(1)}`, 'Facing: south', 'Biome: deep_dark?  no :)'];
      lines.slice(0, 3).forEach((l, i) => { ctx.font = '600 34px "DejaVu Sans Mono", monospace'; const w = ctx.measureText(l).width + 20; ctx.fillStyle = 'rgba(40,40,40,.62)'; ctx.fillRect(40, 140 + i * 46, w, 44); txt(l, 50, 162 + i * 46, 34, i === 1 && o.hl ? '#ffd400' : '#f0f0f0', { align: 'left', stroke: false, font: '600 34px "DejaVu Sans Mono", monospace' }); });
      if (o.hl) { ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.strokeRect(34, 180, 640, 56); }
    } else if (o.kind === 'f3hint') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .35)); ctx.save(); ctx.translate(W * .7, H * .32); ctx.scale(k, k);
      rrect(-330, -150, 660, 300, 22, 'rgba(0,0,0,.72)', '#ffd400', 5);
      keycap(-290, -118, 'F3', '', true); txt('JAVA: PRESS F3', 40, -78, 52, '#fff', { stroke: false });
      txt('BEDROCK:', -290, 30, 44, '#ffd400', { align: 'left', stroke: false }); txt('Settings → Show Coordinates', -290, 90, 40, '#fff', { align: 'left', stroke: false, w: 700 });
      ctx.restore();
    } else if (o.kind === 'ychart') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 120 - (1 - k) * -700, H * .12);
      const pw = 560, ph = 640; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.75)', '#4fe3d8', 5);
      txt('DIAMONDS BY Y LEVEL', -pw / 2, 46, 40, '#4fe3d8', { stroke: false });
      const top = 100, bot = ph - 50, yv = v => lerp(top, bot, (16 - v) / 80); // Y 16 → -64
      for (let v = 16; v >= -64; v -= 4) { const f = clamp((16 - v) / 74) ** 1.6, x0 = -pw + 150, y = yv(v); if (v < -60) continue; rrect(x0, y - 9, f * (pw - 200), 18, 4, v === -56 || v === -60 ? '#4fe3d8' : 'rgba(79,227,216,.55)'); }
      for (const v of [16, 0, -32, -58]) txt(`Y ${v}`, -pw + 130, yv(v), 30, v === -58 ? '#ffd400' : '#cfd8dc', { align: 'right', stroke: false });
      ctx.fillStyle = 'rgba(120,120,120,.6)'; ctx.fillRect(-pw + 30, yv(-60), pw - 60, bot - yv(-60) + 20); txt('BEDROCK', -pw / 2, (yv(-60) + bot + 20) / 2, 28, '#fff', { stroke: false });
      const y58 = yv(-58); ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(-pw + 140, y58); ctx.lineTo(-30, y58); ctx.stroke(); ctx.setLineDash([]);
      txt('BEST', -70, y58 - 30, 34, '#ffd400', { lw: 6 }); ctx.restore();
    } else if (o.kind === 'branchMap') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 110 - (1 - k) * -700, H * .12);
      const pw = 520, ph = 600, cell = 34; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.75)', '#ffd400', 5);
      txt('TOP VIEW', -pw / 2, 44, 40, '#ffd400', { stroke: false });
      const ox = -pw + 70, oy = 90;
      ctx.fillStyle = '#5a5a64'; ctx.fillRect(ox, oy, cell * 12, cell * 14);
      ctx.fillStyle = '#d9c9a3'; ctx.fillRect(ox, oy, cell, cell * 14); // main tunnel
      [1, 4, 7, 10, 13].forEach((r, i) => { const len = i < 4 ? 11 : Math.round(11 * o.prog); ctx.fillStyle = i < 4 ? '#d9c9a3' : '#ffd400'; ctx.fillRect(ox + cell, oy + r * cell, cell * len, cell); });
      ctx.fillStyle = '#4fe3d8'; if (o.prog > .98) ctx.fillRect(ox + cell * 5, oy + 12 * cell, cell, cell);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox + cell * 9.5, oy + 2 * cell); ctx.lineTo(ox + cell * 9.5, oy + 4 * cell); ctx.stroke();
      txt('2 BLOCKS', ox + cell * 10, oy + 3 * cell, 28, '#fff', { align: 'left', stroke: false });
      txt('MAIN', ox + cell / 2, oy + cell * 14 + 26, 24, '#d9c9a3', { stroke: false });
      ctx.restore();
    } else if (o.kind === 'diamonds') {
      rrect(W - 280, 48, 232, 84, 16, 'rgba(0,0,0,.65)', '#4fe3d8', 4); icon('diamond', W - 266, 58, 64); txt('× ' + o.n, W - 120, 92, 50, '#fff', { stroke: false });
    } else if (o.kind === 'tag2') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .3)); ctx.save(); ctx.translate(W / 2, H * .16); ctx.scale(k, k);
      ctx.font = FONT(50); const w = ctx.measureText(o.text).width + 60 + (o.icon ? 70 : 0);
      rrect(-w / 2, -44, w, 88, 16, 'rgba(0,0,0,.72)', o.col, 4); if (o.icon) icon(o.icon, -w / 2 + 16, -30, 60);
      txt(o.text, o.icon ? 35 : 0, 2, 50, o.col, { stroke: false }); ctx.restore();
    } else if (o.kind === 'banner') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .35)); ctx.save(); ctx.translate(W / 2, H * .2); ctx.scale(k, k);
      txt(o.text, 0, 0, 70, o.col, { lw: 12 }); ctx.restore();
    } else if (o.kind === 'keys') {
      let x = 60; for (const [k, l, on] of o.keys) x += keycap(x, H - 330, k, l, on) + 40;
    } else if (o.kind === 'bigStep') {
      txt(o.text, W / 2, H * .22, 110, '#ffd400', { lw: 16, scale: 1 + .05 * Math.sin(t * 10) });
    } else if (o.kind === 'dropLine') {
      const a = project(o.a), b = project(o.b), al = seg(t, o.t0, o.t0 + .3);
      ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 7; ctx.setLineDash([22, 14]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, Math.min(b.y, H)); ctx.stroke(); ctx.setLineDash([]);
      txt(o.text, a.x + 40, (a.y + Math.min(b.y, H)) / 2, 56, '#ff5252', { align: 'left', lw: 10 }); ctx.restore();
    } else if (o.kind === 'armor') {
      const x = W / 2 - 88 * 4.5 - 140, y = H - 120, f = o.flash || 0;
      rrect(x, y, 112, 112, 12, 'rgba(0,0,0,.6)', f > 0 && f < 1 ? '#ffd400' : '#9e9e9e', 4); icon(o.item, x + 16, y + 10, 80);
      txt('CHEST', x + 56, y - 22, 24, '#fff', { lw: 5, w: 800 });
    } else if (o.kind === 'steps') {
      o.items.forEach((s, i) => { const on = i === o.active, done = i < o.active, y = 180 + i * 96;
        rrect(48, y, 520, 80, 16, on ? '#ffd400' : 'rgba(0,0,0,.6)', on ? '#000' : 'rgba(255,255,255,.3)', 4);
        txt(`${i + 1}`, 92, y + 42, 46, on ? '#000' : done ? '#5cff7a' : '#fff', { stroke: false }); txt(s, 136, y + 42, 38, on ? '#000' : done ? '#5cff7a' : '#fff', { align: 'left', stroke: false }); });
    } else if (o.kind === 'proTip') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 80, H * .52); ctx.scale(k, k);
      rrect(-760, -120, 740, 240, 22, 'rgba(0,0,0,.78)', '#ffd400', 5); txt('PRO TIP', -390, -78, 46, '#ffd400', { stroke: false });
      icon('chest', -730, -40, 110); txt('ON HOTBAR', -670 + 10, 92, 24, '#fff', { stroke: false });
      txt('→', -560, 14, 70, '#fff', { stroke: false }); keycap(-500, -24, 'RMB', '', true); txt('=', -360, 14, 70, '#fff', { stroke: false }); txt('INSTANT SWAP', -180, 14, 50, '#5cff7a', { stroke: false });
      ctx.restore();
    } else if (o.kind === 'outro') {
      const q = seg(t, 138.6, 139.0), cm = seg(t, 140.4, 140.7), sb = seg(t, 143.0, 143.4), clicked = t > 144.3, end = 1 - seg(t, 146.2, 146.6);
      ctx.save(); ctx.globalAlpha = q * end;
      txt('WHICH TRICK ARE YOU', W / 2, H * .16, 88, '#fff', { lw: 14, scale: eOutBack(q) });
      txt('TRYING FIRST?', W / 2, H * .27, 100, '#ffd400', { lw: 15, scale: eOutBack(q) });
      ctx.globalAlpha = cm * end; [['diamond', '#1'], ['planks', '#2'], ['mace', '#3']].forEach(([ic, n], i) => { const x = W / 2 + (i - 1) * 230; rrect(x - 95, H * .35, 190, 100, 50, 'rgba(0,0,0,.7)', '#fff', 4); icon(ic, x - 80, H * .35 + 18, 64); txt(n, x + 30, H * .35 + 51, 52, '#fff', { stroke: false }); });
      ctx.restore();
      if (sb > 0) { const bx = W / 2, by = H * .62, k = eOutBack(sb), pressed = t > 144.15 && t < 144.35 ? .93 : 1;
        ctx.save(); ctx.globalAlpha = 1 - seg(t, 149.3, 150); ctx.translate(bx, by); ctx.scale(k * pressed, k * pressed);
        rrect(-300, -62, 600, 124, 62, clicked ? '#3a3a3a' : '#e53935', '#000', 5); txt(clicked ? 'SUBSCRIBED' : 'SUBSCRIBE', clicked ? -45 : 0, 4, 62, '#fff', { stroke: false });
        if (clicked) { ctx.fillStyle = '#fff'; const bl = Math.sin((t - 144.3) * 20) * Math.max(0, 1 - (t - 144.3)) * .4; ctx.save(); ctx.translate(230, 0); ctx.rotate(bl); ctx.beginPath(); ctx.arc(0, -6, 22, Math.PI, 0); ctx.lineTo(24, 18); ctx.lineTo(-24, 18); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, 24, 7, 0, 7); ctx.fill(); ctx.restore(); }
        ctx.restore();
        const cx = lerp(bx + 520, bx + 120, eIO(seg(t, 143.4, 144.1))), cy = lerp(by + 260, by + 20, eIO(seg(t, 143.4, 144.1)));
        if (t < 145.5) { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 64); ctx.lineTo(16, 50); ctx.lineTo(28, 76); ctx.lineTo(40, 70); ctx.lineTo(28, 46); ctx.lineTo(48, 46); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); } }
      if (t > 146.4) txt('SEE YOU IN THE NEXT ONE!', W / 2, H * .25, 92, '#fff', { lw: 14, scale: eOutBack(seg(t, 146.4, 146.8)), alpha: 1 - seg(t, 149.3, 150) });
      if (t > 148.6) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 148.6, 149.6)})`; ctx.fillRect(0, 0, W, H); txt('HOLLOWCRAFT', W / 2, H / 2, 120, '#ffd400', { stroke: false, alpha: seg(t, 148.8, 149.3) }); }
    }
  }
}
const HL = /^(MILLIONS|DIAMONDS|DIAMOND|FAST|GAP|DEADLIEST|Y|MINUS|FIFTY-EIGHT|F3|BEDROCK|COORDINATES|TUNNEL|BRANCH|THREE|ORE|FORTUNE|FOUR|STRIP|MINING|SOLID|ROCK|BRIDGE|SNEAK|EDGE|BLOCK|SPEED|BRIDGING|ELYTRA|MACE|FIREWORK|ROCKET|CHESTPLATE|SWAP|FALL|FALLING|SMASH|ONE-SHOT|HOTBAR|RIGHT-CLICK|INSTANTLY|REAL|SUBSCRIBE|HOLLOWCRAFT|TRICK|NUMBER|ONE|TWO|SECONDS|PVP)$/;
const CHUNKS = [];
for (const [a, b, line] of CAPS) {
  const words = line.toUpperCase().split(/\s+/).filter(Boolean); const groups = [];
  for (let i = 0; i < words.length;) { let n = Math.min(4, words.length - i); if (words.length - i - n === 1) n = Math.min(3, n); groups.push(words.slice(i, i + n)); i += n; }
  const total = words.join(' ').length; let acc = 0;
  for (const g of groups) { const len = g.join(' ').length + 1, s = a + (b - a) * acc / total, e = a + (b - a) * Math.min(1, (acc + len) / total); CHUNKS.push({ s, e, g }); acc += len; }
}
function drawCaptions(t, S) {
  const c = CHUNKS.find(c => t >= c.s && t < c.e + .12); if (!c || /^(ONE HIT!|THERE IT IS!)$/.test(c.g.join(' '))) return;
  const y = S.hud ? H - 340 : H - 170, size = 74;
  ctx.font = FONT(size); const widths = c.g.map(w => ctx.measureText(w).width), sp = size * .3;
  const tot = widths.reduce((a, b) => a + b, 0) + sp * (c.g.length - 1);
  let x = W / 2 - tot / 2; const k = eOutBack(seg(t, c.s, c.s + .12));
  c.g.forEach((w, i) => { const on = t >= c.s + (c.e - c.s) * i / c.g.length; const clean = w.replace(/[^A-Z0-9#\-]/g, '');
    txt(w, x + widths[i] / 2, y, size, HL.test(clean) ? '#ffd400' : '#ffffff', { lw: 15, scale: (on ? 1 : .96) * k, alpha: on ? 1 : .55 }); x += widths[i] + sp; });
}
const CUTS = [4.1, 5.8, 7.7, 10.6, 14.0, 17.2, 26.2, 30.6, 33.6, 45.6, 52.3, 56.0, 59.8, 65.0, 67.6, 71.2, 74.6, 86.6, 96.3, 101.0, 103.8, 113.2, 124.4, 129.6, 135.0, 138.4];

window.renderFrame = function (t) {
  const S = stateAt(t);
  apply(S); renderer.render(scene, camera);
  ctx.save(); ctx.filter = S.filter || 'none'; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  if (S.flashT != null) { const d = (S.tmap ?? t) - S.flashT; if (d >= 0 && d < .35) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .35) * .85})`; ctx.fillRect(0, 0, W, H); } }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (S.hud) drawHUD(S);
  drawOverlays(S); drawCaptions(t, S);
  txt('HollowCraft', W - 40, H - 34, 30, 'rgba(255,255,255,.75)', { align: 'right', lw: 5, w: 800 });
  for (const c of CUTS) { const d = t - c; if (d >= 0 && d < .14) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .14) * .6})`; ctx.fillRect(0, 0, W, H); } }
  if (t < .25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .25})`; ctx.fillRect(0, 0, W, H); }
  return comp.toDataURL('image/jpeg', .9);
};
window.READY = true;
