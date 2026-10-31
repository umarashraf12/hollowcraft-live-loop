// ---- episode 3 props
ICON.ipick = canvasTex(16, g => { line(g, 3, 13, 11, 5, '#6b4a2b'); line(g, 4, 13, 12, 5, '#4a3b2a'); for (const [x, y] of [[6,2],[7,2],[8,2],[9,2],[10,3],[11,3],[12,4],[12,5],[13,6],[13,7],[13,8],[5,3],[4,3]]) px(g, x, y, '#d8d8d8'); for (const [x, y] of [[7,3],[8,3],[9,3],[11,4],[12,6],[12,7]]) px(g, x, y, '#9a9a9a'); });
const lam3 = tex => new THREE.MeshLambertMaterial({ map: T[tex] });
const bed = new THREE.Group(); scene.add(bed);
{ const foot = new THREE.Mesh(new THREE.BoxGeometry(1, .56, 1), [lam3('planks'), lam3('planks'), lam3('wool'), lam3('planks'), lam3('planks'), lam3('planks')]); foot.position.set(0, .28, -.5); bed.add(foot);
  const head = foot.clone(); head.position.z = .5; bed.add(head);
  const pil = new THREE.Mesh(new THREE.BoxGeometry(.8, .1, .35), lam3('pillow')); pil.position.set(0, .6, .72); bed.add(pil); }
const boat = new THREE.Group(); scene.add(boat);
{ const m = lam3('planks'); const add = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); boat.add(b); };
  add(1.1, .12, 1.7, 0, .06, 0); add(.12, .4, 1.7, -.55, .26, 0); add(.12, .4, 1.7, .55, .26, 0); add(1.1, .4, .12, 0, .26, -.85); add(1.1, .4, .12, 0, .26, .85); }
const portalMat = new THREE.MeshBasicMaterial({ map: T.portal, transparent: true, opacity: .86, side: THREE.DoubleSide, depthWrite: false });
const portalOW = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), portalMat); portalOW.position.set(40, 11.5, PZ + .5); scene.add(portalOW);
const portalNE = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), portalMat); portalNE.position.set(NX, 43.5, -142.5); scene.add(portalNE);
PCOL.portal = ['#b04cff', '#e0a0ff', '#7a2bd6']; PCOL.nrack = ['#7a2826', '#4e1414', '#a8443e']; PCOL.smoke = ['#bdbdbd', '#8a8a8a', '#e0e0e0']; PCOL.ice = ['#e6f4ff', '#9cc8ff'];

// ---- trick 1: casting schedule
const CAST = PFRAME.map(([x, y], k) => k === 0 ? { x, y, lava: 24.0, water: 27.5, obs: 28.25, scoop: 32.0 } : k === 1 ? { x, y, lava: 32.5, water: 33.3, obs: 33.75, scoop: 34.6 }
  : (b => ({ x, y, lava: b, water: b + .18, obs: b + .3, scoop: b + .45 }))(35.5 + .55 * (k - 2)));
const P_LIT = 41.5;
function castSet(S, tc) { // tc = casting time (video-time scale of trick 1)
  for (const c of CAST) {
    if (tc >= c.lava && tc < c.obs) S.dyn.push({ x: c.x, y: c.y, z: PZ, tex: 'lava', pop: clamp((tc - c.lava) / .15) });
    if (tc >= c.obs) S.dyn.push({ x: c.x, y: c.y, z: PZ, tex: 'obsidian' });
    if (tc >= c.water && tc < c.scoop) S.water3.push({ x: c.x, y: c.y + 1, z: PZ, h: .88 * clamp((tc - c.water) / .2), coat: tc < c.obs + .15 });
    if (tc >= c.obs && tc < c.obs + 1) S.bursts.push({ type: 'smoke', t0: c.obs, o: V(c.x + .5, c.y + .9, PZ + .3), n: 22, sp: [.2, .8], up: [1, 2.5], drag: 1, life: 1, size: .14, seed: c.x * 13 + c.y, tm: tc });
  }
  S.portalOW = tc >= P_LIT ? clamp((tc - P_LIT) / .4) : 0;
  if (tc >= P_LIT && tc < P_LIT + 1.2) S.bursts.push({ type: 'portal', t0: P_LIT, o: V(40, 11.5, PZ + .5), n: 60, sp: [.5, 2.5], up: [-1, 2], drag: 1.5, life: 1.2, size: .1, seed: 91, tm: tc });
  return CAST.filter(c => tc >= c.obs).length;
}
const OW_HOTBAR = ['ipick', 'lavaB', 'bucketW', 'flint', 'bread', null, null, null, null];
// ---- trick 2: debris tunnel
const DIG3 = []; { let i = 0; for (let z = 9; z <= 24; z++) for (const y of [16, 15]) DIG3.push({ x: DXX, y, z, tex: 'netherrack', t1: 64.9 + (i++) * .2 }); }
const T_BED = 72.4, T_BOOM = 75.15;
function tunnelSet(S, tm) {
  S.env = 'tunnel';
  for (const d of DIG3) if (tm < d.t1) S.dyn.push({ ...d, wob: seg(tm, d.t1 - .15, d.t1) }); else if (tm < d.t1 + .6) S.bursts.push({ type: 'nrack', t0: d.t1, o: V(d.x + .5, d.y + .5, d.z + .5), n: 14, sp: [1, 2.5], up: [1, 3], g: 16, life: .5, size: .08, seed: d.z * 7 + d.y, tm });
  if (tm < T_BOOM) for (const [x, y, z] of BLAST) S.dyn.push({ x, y, z, tex: 'netherrack' });
  S.bed = tm >= T_BED && tm < T_BOOM ? clamp((tm - T_BED) / .12) : 0;
  if (tm >= T_BOOM) { const o = BLAST_C.clone();
    S.bursts.push({ type: 'nrack', t0: T_BOOM, o, n: 160, sp: [4, 12], up: [-2, 8], g: 14, life: 1.4, size: .16, seed: 501, tm });
    S.bursts.push({ type: 'spark', t0: T_BOOM, o, n: 70, sp: [3, 10], up: [-3, 6], drag: 2, life: .7, size: .12, seed: 502, tm });
    S.bursts.push({ type: 'smoke', t0: T_BOOM + .05, o, n: 70, sp: [.6, 2.4], up: [.2, 1.4], drag: .8, life: 2.2, size: .5, seed: 503, tm });
    S.flashT = T_BOOM; S.hits.push([T_BOOM, .45]); }
}
const TUN_HOTBAR = ['pick', 'bed', 'netherrack', 'bread', 'fireres', null, null, null, null];
// ---- trick 3: highway
const HW_HOTBAR = ['blueice', 'boat', 'pick', 'bread', null, null, null, null, null];
function rideZ(t, t0, z0, maxZ = 145) { const dt = t - t0; if (dt <= 0) return z0; const z = dt < .6 ? z0 + 60 * dt * dt : z0 + 21.6 + 72 * (dt - .6); return Math.min(maxZ, z); }
function boatSet(S, z, opts = {}) { S.boat = V(NX + .5, HW.y + 1, z); S.player.pos = V(NX + .5, HW.y + 1.15, z); S.player.yaw = 0; S.player.sit = true; S.player.held = null; S.player.p = {}; if (opts.speed) S.speed = opts.speed; }
function hwIce(S, t) { for (let z = HW.gap0; z <= HW.gap1; z++) { const ta = 105.8 + (z - HW.gap0) * .17; if (t >= ta) S.dyn.push({ x: NX, y: HW.y, z, tex: 'blueice', pop: clamp((t - ta) / .1) }); } }

// ---------- the timeline ----------
function stateAt(t) {
  const S = { t, env: 'sky', hud: false, fp: false, held: null, slot: 0, swing: 0, hotbar: OW_HOTBAR, counts: {}, bursts: [], rings: [], dyn: [], water3: [], xray: null,
    player: { visible: true, pos: V(39.5, 9, 33.3), yaw: 0, p: {}, wings: 0 }, mob: null, overlays: [], hits: [], filter: '', trail2: null, edge: false, drop: null, portalOW: 0, portalNE: 1, bed: 0, boat: null, speed: 0 };
  const nether = () => { S.env = 'nether'; hwIce(S, 999); };

  if (t < 5.0) { // HOOK A: arrival in the Nether, crane up over the lava ocean
    nether(); const k = seg(t, .6, 2.6);
    S.player.pos = V(NX + .5, 41, lerp(-142.5, -139, k)); S.player.yaw = 0; S.player.held = 'ipick'; S.player.p = { walk: k > 0 && k < 1 ? t * 9 : 0 };
    if (t < 1.4) S.bursts.push({ type: 'portal', t0: .2, o: V(NX, 43, -142), n: 50, sp: [.4, 2], up: [-1, 2], drag: 1.5, life: 1.2, size: .1, seed: 92 });
    const c = eIO(seg(t, 1.8, 5.0));
    S.cam = { pos: V(lerp(NX + 4.5, NX + 18, c), lerp(43, 60, c), lerp(-135.5, -122, c)), look: V(NX + lerp(0, 0, c), lerp(42.5, 44, c), lerp(-140, -96, c)), fov: 62 };
    S.overlays.push({ kind: 'hookTag', t0: .2, t1: 4.8, text: 'NETHERITE, FAST' });
  } else if (t < 7.2) { // HOOK B: light the cast portal
    const tc = P_LIT - .55 + (t - 5.0) * .9; castSet(S, Math.max(tc, 41)); S.portalOW = tc >= P_LIT ? clamp((tc - P_LIT) / .4) : 0;
    S.player.pos = V(39.5, 9, 33.4); S.player.held = 'flint'; S.player.p = { use: seg(tc, P_LIT - .25, P_LIT) };
    S.cam = { pos: V(44.5, 11.2, 31.8), look: V(39.8, 11.2, 35.6), fov: 60 };
    if (tc > P_LIT) S.overlays.push({ kind: 'tag2', t0: 5.0 + (P_LIT - (P_LIT - .55)) / .9, text: 'NO DIAMOND PICKAXE', col: '#c77dff', icon: 'flint' });
  } else if (t < 9.8) { // HOOK C: bed blast reveals ancient debris
    const tm = T_BOOM - .8 + (t - 7.2); tunnelSet(S, tm);
    S.player.pos = V(DXX + .5, 15, 18.5); S.player.held = 'bed'; S.player.p = { use: seg(tm, T_BOOM - .25, T_BOOM) };
    S.cam = { pos: V(DXX + .5 + 1.1, 16.9, 15.6), look: V(DXX + .5, 15.8, 23), fov: 64 };
    if (tm > T_BOOM + .7) S.overlays.push({ kind: 'worldTag', at: V(DEBRIS[0][0] + .5, 17.6, DEBRIS[0][2] + .5), text: 'ANCIENT DEBRIS', col: '#ffb380', t0: 7.2 + .8 + .7 });
  } else if (t < 11.8) { // HOOK D: ice boat
    nether(); boatSet(S, -60 + 72 * (t - 9.8)); const z = S.boat.z;
    S.cam = { pos: V(NX + .5 + .7, HW.y + 2.6, z - 4.2), look: V(NX + .5, HW.y + 1.6, z + 6), fov: 74 };
    S.overlays.push({ kind: 'speedlines', a: 1 }); S.overlays.push({ kind: 'speed', v: 72 });
  } else if (t < 14.0) { // TITLE
    nether(); boatSet(S, rideZ(t, 11.4, -100));
    const a = deg(200) + (t - 11.8) * .1;
    S.cam = { pos: V(NX + Math.cos(a) * 40, 62, -40 + Math.sin(a) * 40), look: V(NX, 46, -30), fov: 58 };
    S.overlays.push({ kind: 'title', t0: 11.8, t1: 14.0 });
  } else if (t < 18.6) { // TRICK 1 CARD: orbit the empty portal site (dirt mold visible)
    const a = deg(250) + (t - 14) * .12;
    S.player.pos = V(39.5, 9, 32.5); S.player.held = 'lavaB';
    S.cam = { pos: V(40 + Math.cos(a) * 11, 13, 34 + Math.sin(a) * 11), look: V(40, 11, 36), fov: 56 };
    S.overlays.push({ kind: 'card', t0: 14.0, t1: 18.6, num: '#1', name: 'NO-DIAMOND PORTAL' });
  } else if (t < 23.2) { // can't mine obsidian with iron
    S.player.pos = V(35.5, 9, 31.6); S.player.yaw = 0; S.player.held = 'ipick'; S.player.p = { use: (t * 2.6) % 1 };
    S.cam = { pos: V(38.2, 10.7, 30.2), look: V(35.4, 9.7, 33.2), fov: 56 };
    S.bursts.push({ type: 'smoke', t0: Math.floor(t * 2.6) / 2.6, o: V(35.5, 9.6, 33.0), n: 6, sp: [.3, .8], up: [.5, 1.5], drag: 1, life: .4, size: .06, seed: Math.floor(t * 2.6) });
    S.overlays.push({ kind: 'worldTag', at: V(35.5, 11.2, 33.5), text: '✕ IRON PICKAXE', col: '#ff5252', t0: 19.0 });
    if (t > 20.6) S.overlays.push({ kind: 'tag2', t0: 20.6, text: 'OBSIDIAN NEEDS A DIAMOND PICKAXE', col: '#ff8a80', icon: 'pick' });
  } else if (t < 35.4) { // first person casting demo
    const n = castSet(S, t);
    S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = OW_HOTBAR;
    const c = CAST.find(c => t < c.scoop) || CAST[1], i = CAST.indexOf(c);
    S.held = t < c.lava ? 'lavaB' : t < c.water ? 'bucketW' : t < c.scoop ? 'bucket' : 'bucketW'; S.slot = t < c.lava ? 1 : 2;
    if (S.held === 'bucket') S.hotbar = ['ipick', 'lavaB', 'bucket', 'flint', 'bread', null, null, null, null];
    S.swing = [c.lava, c.water, c.scoop].reduce((a, tt) => Math.max(a, t > tt - .12 && t < tt + .2 ? seg(t, tt - .12, tt + .2) : 0), 0);
    const eye = V(39.6, 9 + EYE, 33.4), tgt = V(c.x + .5, c.y + .5, PZ + .2);
    S.cam = { pos: eye, dir: tgt.sub(eye).normalize().add(V(Math.sin(t * .8) * .01, 0, 0)).normalize(), fov: 70 };
    S.overlays.push({ kind: 'counter', text: `OBSIDIAN: ${n}/10`, col: '#c77dff' });
    if (t > 26.8 && t < 31.3) S.overlays.push({ kind: 'formula', t0: 26.8 });
    if (t > 28.25 && t < 30.4) S.overlays.push({ kind: 'pop', t0: 28.25, text: 'OBSIDIAN!', x: W / 2, y: H * .3, size: 120, col: '#c77dff' });
    void i;
  } else if (t < 40.6) { // fast-forward the rest, wide
    const n = castSet(S, t);
    S.player.pos = V(39.5, 9, 33.4); S.player.held = t % 1 < .5 ? 'lavaB' : 'bucketW'; S.player.p = { use: (t * 1.8) % 1 };
    S.cam = { pos: V(44.2, 12.8, 30.4), look: V(39.8, 11.3, 36), fov: 60 };
    S.overlays.push({ kind: 'pill', text: 'FAST FORWARD x4', col: '#1565c0', t0: 35.4 });
    S.overlays.push({ kind: 'counter', text: `OBSIDIAN: ${n}/10`, col: '#c77dff' });
    if (t > 37.2) for (const [x, y] of [[38, 9], [41, 9], [38, 13], [41, 13]]) S.overlays.push({ kind: 'xcell', at: V(x + .5, y + .5, PZ + .2), t0: 37.2 });
    if (t > 37.4) S.overlays.push({ kind: 'tag2', t0: 37.4, text: 'CORNERS ARE OPTIONAL', col: '#ffd400' });
  } else if (t < 45.8) { // flint and steel, first person, walk in
    castSet(S, t);
    S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = OW_HOTBAR; S.slot = 3; S.held = 'flint'; S.switchT = 40.7;
    S.swing = t > P_LIT - .15 && t < P_LIT + .25 ? seg(t, P_LIT - .15, P_LIT + .25) : 0;
    const z = lerp(33.4, 36.3, eIO(seg(t, 43.6, 45.8)));
    S.cam = { pos: V(39.9, 9 + EYE, z), dir: V(40, 11.3, PZ + .5).sub(V(39.9, 10.6, z)).normalize(), fov: 70 };
    if (t > P_LIT + .6) S.overlays.push({ kind: 'pop', t0: P_LIT + .6, text: "YOU'RE IN!", x: W / 2, y: H * .28, size: 120, col: '#c77dff' });
    S.nausea = seg(t, 44.4, 45.8);
  } else if (t < 55.0) { // pro tip: dirt mold, then the trip through
    castSet(S, 99); const a = deg(200) + (t - 45.8) * .16;
    S.player.pos = V(37.3, 9, 33.6); S.player.yaw = .6; S.player.held = 'flint';
    S.cam = { pos: V(40 + Math.cos(a) * 9, 12.6, 35.5 + Math.sin(a) * 9 - 2), look: V(40, 11.2, 36.3), fov: 58 };
    if (t < 51.6) S.overlays.push({ kind: 'moldTip', t0: 46.0 });
    S.nausea = seg(t, 52.4, 53.4) * (1 - seg(t, 53.6, 54.6));
    if (t > 53.5) { S.env = 'nether'; hwIce(S, 999); S.player.pos = V(NX + .5, 41, -141.5); S.player.yaw = 0; S.cam = { pos: V(NX + 3.5, 43.2, -137), look: V(NX + .3, 42.6, -141.5), fov: 60 }; }
  } else if (t < 59.8) { // TRICK 2 CARD: cavern wide
    nether(); const a = deg(160) + (t - 55) * .07;
    S.player.pos = V(NX + .5, 41, -139.5); S.player.yaw = 0;
    S.cam = { pos: V(NX + Math.cos(a) * 30, 55, -110 + Math.sin(a) * 30), look: V(NX, 40, -120), fov: 60 };
    S.overlays.push({ kind: 'card', t0: 55.0, t1: 59.8, num: '#2', name: 'FIND ANCIENT DEBRIS' });
  } else if (t < 64.6) { // tunnel at Y 15
    tunnelSet(S, 60); S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = TUN_HOTBAR; S.counts = { 1: 6, 2: 64, 3: 8, 4: 2 }; S.held = 'pick';
    const z = lerp(3.5, 6.5, seg(t, 59.8, 64.6));
    S.cam = { pos: V(DXX + .5, 15 + EYE, z), yaw: Math.sin((t - 59.8) * .5) * .06, pitch: deg(-5), fov: 70 };
    S.overlays.push({ kind: 'coords', x: DXX + .5, y: 15, z, hl: true });
    S.overlays.push({ kind: 'debrisChart', t0: 60.0 });
  } else if (t < 71.6) { // dig fast
    tunnelSet(S, t); S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = TUN_HOTBAR; S.counts = { 1: 6, 2: 64, 3: 8, 4: 2 }; S.held = 'pick';
    const z = 8.5 + clamp((t - 65.1) / .4, 0, 14);
    S.cam = { pos: V(DXX + .5, 15 + EYE + Math.sin(t * 10) * .02, z), yaw: 0, pitch: deg(-10) - (DIG3.find(d => t < d.t1)?.y === 15 ? deg(16) : 0), fov: 72 };
    S.swing = (t * 4) % 1;
    S.overlays.push({ kind: 'coords', x: DXX + .5, y: 15, z });
    if (t > 67.4) S.overlays.push({ kind: 'tag2', t0: 67.4, text: 'BEDS EXPLODE IN THE NETHER', col: '#ff8a80', icon: 'bed' });
  } else if (t < 81.2) { // place bed, step back, BOOM, reveal
    tunnelSet(S, t);
    if (t < 76.2) {
      const zb = t < 72.8 ? 22.3 : lerp(22.3, 18.6, eIO(seg(t, 72.8, 74.3)));
      S.player.pos = V(DXX + .5, 15, zb); S.player.yaw = 0; S.player.held = 'bed'; S.player.p = { use: Math.max(seg(t, T_BED - .25, T_BED), seg(t, T_BOOM - .25, T_BOOM)), walk: t > 72.8 && t < 74.3 ? t * 9 : 0 };
      S.cam = { pos: V(DXX + 1.6, 17.0, 15.6), look: V(DXX + .5, 15.6, 22.6), fov: 64 };
      S.hud = true; S.hotbar = TUN_HOTBAR; S.slot = 1; S.counts = { 1: t > T_BED ? 5 : 6, 2: 64, 3: 8, 4: 2 };
    } else {
      S.player.pos = V(DXX + .5, 15, 18.6); S.player.held = 'pick';
      S.cam = { pos: V(DXX + .5 + Math.sin((t - 76.2) * .3) * .4, 16.6, lerp(19.8, 21.0, seg(t, 76.2, 81.2))), look: V(DXX + .5, 15.6, 24.2), fov: 70 };
      DEBRIS.forEach(([x, y, z], i) => S.overlays.push({ kind: 'worldTag', at: V(x + .5, y + 1.25, z + .5), text: i === 0 ? 'BLAST PROOF' : 'DEBRIS', col: '#ffb380', t0: 76.5 + i * .25 }));
    }
  } else if (t < 87.6) { // crafting chain
    tunnelSet(S, 99); S.player.pos = V(DXX + .5, 15, 18.6);
    S.cam = { pos: V(DXX + .5, 16.6, 21.0), look: V(DXX + .5, 15.6, 24.2), fov: 70 };
    S.filter = 'blur(6px) brightness(0.55)'; S.overlays.push({ kind: 'craft', t0: 81.3 });
  } else if (t < 97.3) { // safety tips on the lava shore
    nether(); const k = seg(t, 87.6, 96);
    S.player.pos = V(NX + .5 + 1.4, 41, lerp(-139, -133.5, k)); S.player.yaw = 0; S.player.held = 'fireres'; S.player.p = { walk: t * 8 };
    S.cam = { pos: V(NX + 9, 45, lerp(-141, -133, k)), look: V(NX + 1, 40.5, lerp(-137, -130, k)), fov: 60 };
    S.overlays.push({ kind: 'tips', t0: 87.8 });
  } else if (t < 100.6) { // TRICK 3 CARD: inside the tube
    nether(); S.player.visible = false;
    S.cam = { pos: V(NX + .5, HW.y + 2.3, lerp(-127, -122, seg(t, 97, 100.6))), look: V(NX + .5, HW.y + 1.8, -90), fov: 64 };
    S.overlays.push({ kind: 'card', t0: 97.0, t1: 100.6, num: '#3', name: 'NETHER ICE HIGHWAY' });
  } else if (t < 105.4) { // 1:8 ratio
    nether(); S.player.visible = false; hwIce(S, 999);
    S.cam = { pos: V(NX + 30, 56, lerp(-70, -60, seg(t, 100.6, 105.4))), look: V(NX, 44, -20), fov: 60 };
    S.overlays.push({ kind: 'ratio', t0: 100.8 });
  } else if (t < 109.4) { // place blue ice in the gap
    S.env = 'nether'; S.dyn = []; hwIce(S, t);
    const z = lerp(-114.5, -93, seg(t, 105.6, 109.2));
    S.player.pos = V(NX - .5, HW.y + 1, z); S.player.yaw = 0; S.player.held = 'blueice'; S.player.p = { walk: t * 9, use: (t * 5.9) % 1 };
    S.cam = { pos: V(NX + 1.2, HW.y + 2.8, z - 3.8), look: V(NX + .3, HW.y + 1, z + 2.5), fov: 66 };
    S.hud = true; S.hotbar = HW_HOTBAR; S.counts = { 0: 64 - Math.max(0, Math.floor((t - 105.8) / .17)), 2: 0, 3: 8 };
  } else if (t < 113.4) { // ride, chase cam
    nether(); boatSet(S, rideZ(t, 109.9, -110)); const z = S.boat.z, v = Math.min(72, Math.max(0, (t - 109.9) * 120));
    S.cam = { pos: V(NX + .5 + .6, HW.y + 2.6, z - 4.3), look: V(NX + .5, HW.y + 1.5, z + 6), fov: 66 + 10 * v / 72 };
    S.overlays.push({ kind: 'speed', v: Math.round(v) }); S.overlays.push({ kind: 'speedlines', a: v / 72 });
    S.hud = true; S.hotbar = HW_HOTBAR; S.slot = 1; S.counts = { 0: 44, 3: 8 };
  } else if (t < 117.6) { // compare vs elytra, exterior with boat streaking
    nether(); boatSet(S, -100 + ((t - 113.4) * 72) % 230);
    S.cam = { pos: V(NX + 22, 52, 10), look: V(NX, 45, 10), fov: 70 };
    S.overlays.push({ kind: 'compare', t0: 113.6 });
  } else if (t < 122.6) { // walls + ceiling
    nether(); boatSet(S, -60 + ((t - 117.6) * 30) % 160);
    const z = lerp(-40, -20, seg(t, 117.6, 122.6));
    S.cam = { pos: V(NX + 8.5, HW.y + 5.5, z), look: V(NX, HW.y + 1.8, z + 8), fov: 62 };
    S.overlays.push({ kind: 'worldTag', at: V(NX - 2, HW.y + 4.4, z + 8), text: 'CEILING: NO GHASTS', col: '#ffd400', t0: 117.8 });
    S.overlays.push({ kind: 'worldTag', at: V(NX + 2.5, HW.y + 2.6, z + 6), text: 'WALLS: NO LAVA', col: '#ffd400', t0: 118.8 });
  } else if (t < 126.6) { // 1000 overworld blocks in under 2 s
    nether(); const z = -100 + 72 * (t - 123.4); boatSet(S, z);
    S.cam = { pos: V(NX + .5 + .6, HW.y + 2.6, z - 4.3), look: V(NX + .5, HW.y + 1.5, z + 6), fov: 76 };
    const el = clamp(t - 123.4, 0, 125 / 72); S.overlays.push({ kind: 'distance', d: Math.round(el * 72 * 8), s: el, done: t > 123.4 + 125 / 72 });
    S.overlays.push({ kind: 'speedlines', a: 1 });
  } else if (t < 131.0) { // slow-mo replay, side view through the glass
    nether(); const z = lerp(-100, 25, seg(t, 126.6, 131.0)); boatSet(S, z);
    S.cam = { pos: V(NX + 6.5, HW.y + 2.4, z + 1), look: V(NX, HW.y + 1.6, z), fov: 60 };
    S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 126.6 });
    S.overlays.push({ kind: 'distance', d: Math.round(seg(t, 126.6, 131) * 1000), s: seg(t, 126.6, 131) * 125 / 72, done: false });
  } else if (t < 138.4) { // arrive at the far platform
    nether(); const zb = lerp(108, 149.4, eOutC(seg(t, 131, 133.6)));
    if (t < 134.0) boatSet(S, zb); else { S.boat = V(NX + .5, HW.y + 1, 149.4); const k = seg(t, 134.0, 135.4), j = Math.max(0, Math.sin(Math.PI * seg(t, 136, 136.6))) * 1.2;
      S.player.pos = V(NX + .5, lerp(HW.y + 1, 41, k) + j, lerp(149.4, 154, k)); S.player.yaw = 0; S.player.held = 'pick'; S.player.p = { walk: k > 0 && k < 1 ? t * 9 : 0 }; }
    const a = deg(-30) + (t - 131) * .12;
    S.cam = { pos: V(NX + Math.cos(a) * 12, 48, 150 + Math.sin(a) * 12 - 6), look: V(NX, 42, 151), fov: 60 };
    if (t > 135.6) S.overlays.push({ kind: 'pop', t0: 135.6, text: 'ARRIVED!', x: W / 2, y: H * .28, size: 120, col: '#5cff7a' });
  } else { // OUTRO at the Nether portal platform
    nether(); const a = deg(70) + (t - 138.4) * .07;
    S.player.pos = V(NX + .5, 41, -139.8); S.player.yaw = 0; S.player.held = 'pick';
    S.cam = { pos: V(NX + .5 + Math.cos(a) * 9, 44, -139.8 + Math.sin(a) * 9), look: V(NX + .3, 42.6, -141), fov: 58 };
    S.overlays.push({ kind: 'outro', t0: 138.4 });
  }
  return S;
}
function applyExtra(S, t) {
  bed.visible = S.bed > 0; if (S.bed > 0) { bed.position.set(DXX + .5, 15, 23.5 + .5); bed.scale.setScalar(S.bed); }
  boat.visible = !!S.boat; if (S.boat) boat.position.copy(S.boat);
  portalOW.visible = S.portalOW > 0; if (portalOW.visible) portalOW.scale.set(1, S.portalOW, 1);
  portalNE.visible = S.env === 'nether';
  T.portal.offset.set(Math.sin(t * .7) * .1, t * .18); lavaSeaTex.offset.set(t * .02, t * .01);
  let wi = 0;
  for (const w of S.water3) {
    const top = waterPool[wi++]; if (!top) break; top.visible = w.h > .02; top.scale.set(1, Math.max(.02, w.h), 1); top.position.set(w.x + .5, w.y + w.h / 2, w.z + .5);
    if (w.coat) { const c = waterPool[wi++]; if (!c) break; c.visible = true; c.scale.set(1.04, 1.04, 1.04); c.position.set(w.x + .5, w.y - .5, w.z + .5); }
  }
  if (S.water3.length) waterMat.opacity = .7;
}
