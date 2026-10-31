// ---- episode 4 props
TREE.x = 9;
ICON.book = pxArt(['', '', '...XXXXXXXXX....', '...XbbbbbbbX....', '...XbbbbbbbX....', '...XbbrrbbbX....', '...XbbbbbbbX....', '...XbbbbbbbX....', '...XXXXXXXXX....', '....ttttttt.....'], { X: '#3a2010', b: '#8a4a2a', r: '#c8a060', t: '#e8e0c8' });
ICON.paper = pxArt(['', '', '....XXXXXXX.....', '....XwwwwwX.....', '....XwlllwX.....', '....XwwwwwX.....', '....XwlllwX.....', '....XwwwwwX.....', '....XXXXXXX.....'], { X: '#9a9a8a', w: '#f4f4ea', l: '#c8c8b8' });
ICON.planksI = ICON.planks;
cellMeshes(new Map([[k3(7, 9, -12), 'fletch']]), VTEX);
DYN.lectern = new THREE.InstancedMesh(box, [lam3x('lecternSide'), lam3x('lecternSide'), lam3x('lecternTop'), lam3x('lecternSide'), lam3x('lecternSide'), lam3x('lecternSide')], 160);
DYN.log = new THREE.InstancedMesh(box, [lam3x('logSide'), lam3x('logSide'), lam3x('logTop'), lam3x('logTop'), lam3x('logSide'), lam3x('logSide')], 160);
DYN.lectern.frustumCulled = DYN.log.frustumCulled = false; scene.add(DYN.lectern, DYN.log);
function lam3x(tex) { return new THREE.MeshLambertMaterial({ map: T[tex] }); }
PCOL.psplash = ['#8a8aa8', '#c8c8e0', '#5a5a78']; PCOL.happy = ['#5cff7a', '#b8ffc4', '#2fd06a']; PCOL.cure = ['#ff4a6a', '#ff9aa8', '#c81e3a']; PCOL.wood = ['#6b4a2b', '#b88a52', '#4a3420']; PCOL.gold = ['#ffd23e', '#fff6c0'];
const ZV_POS = V(-4.5, 9, -11.2), LECT = [0, 9, -12], VB_POS = V(1.5, 9, -11.5), VC_POS = V(8.5, 9, -11.5);
const T_POT = 23.0, T_HIT = 23.45, T_APPLE = 26.2, T_CURE = 31.6;
const ARMORER_ROWS = [{ in: [['emerald', 9]], out: ['chest', 1], lab: 'Iron Chestplate', newp: 1 }, { in: [['emerald', 7]], out: ['legs', 1], lab: 'Iron Leggings', newp: 1 }, { in: [['emerald', 5]], out: ['helmet', 1], lab: 'Iron Helmet', newp: 1 }];
const ROLLS = [['Efficiency II', 18], ['Protection I', 9], ['Unbreaking III', 31], ['Fire Aspect I', 14], ['MENDING', 17]];
const libRows = (i, extra = {}) => [{ in: [['emerald', ROLLS[i][1]], ['book', 1]], out: ['ebook', 1], lab: ROLLS[i][0], hl: i === 4, ...extra }, { in: [['paper', 24]], out: ['emerald', 1], lab: 'Paper' }];
// reroll timeline: lectern present windows
const LECT_ON = [[61.5, 67.6], [68.6, 71.4], [72.0, 73.4], [74.0, 75.4], [76.0, 999]];
const lectAt = t => LECT_ON.some(([a, b]) => t >= a && t < b);
const rollAt = t => { let i = -1; LECT_ON.forEach(([a], k) => { if (t >= a + .5) i = k; }); return i; };
const V_HOTBAR = (sel) => sel;
function ow(S) { S.env = 'sky'; }

// ---------- the timeline ----------
function stateAt(t) {
  const S = { t, env: 'sky', hud: false, fp: false, held: null, slot: 0, swing: 0, hotbar: ['axe', 'potion', 'gapple', 'lectern', 'stick', 'bread', null, null, null], counts: { 1: 2, 2: 3, 4: 64, 5: 8 }, bursts: [], rings: [], dyn: [], xray: null,
    player: { visible: true, pos: V(0, 9, -6), yaw: Math.PI, p: {}, wings: 0 }, mob: null, overlays: [], hits: [], filter: '', trail2: null, edge: false, drop: null,
    va: { style: 'zombie', pos: ZV_POS, yaw: 0, shake: 0, vis: true }, vb: { style: 'unemployed', pos: VB_POS, yaw: 0, vis: true }, vc: { style: 'fletcher', pos: VC_POS, yaw: 0, vis: true }, lectern: false, logs: 5, orb4: null };
  const curedAt = tt => tt >= T_CURE;
  const trick1VA = tt => { S.va.style = curedAt(tt) ? 'armorer' : 'zombie'; S.va.shake = tt >= T_APPLE && tt < T_CURE ? 1 : 0;
    if (tt >= T_HIT && tt < T_HIT + 1) S.bursts.push({ type: 'psplash', t0: T_HIT, o: ZV_POS.clone().add(V(0, 1.2, .2)), n: 50, sp: [1, 3], up: [0, 3], g: 10, life: 1, size: .1, seed: 401, tm: tt });
    if (tt >= T_APPLE && tt < T_CURE) S.bursts.push({ type: 'cure', t0: Math.floor(tt * 4) / 4, o: ZV_POS.clone().add(V(0, 1.4, 0)), n: 10, sp: [.4, 1], up: [.5, 1.5], drag: 1, life: .9, size: .07, seed: Math.floor(tt * 4), tm: tt });
    if (tt >= T_CURE && tt < T_CURE + 1.5) S.bursts.push({ type: 'happy', t0: T_CURE, o: ZV_POS.clone().add(V(0, 1.3, 0)), n: 60, sp: [.5, 2], up: [0, 2.5], drag: 1, life: 1.4, size: .1, seed: 402, tm: tt }); };
  S.lectern = lectAt(t); S.vb.style = t < 63.0 ? 'unemployed' : (lectAt(t) || t < 61.5 ? (rollAt(t) >= 0 ? 'librarian' : 'unemployed') : 'unemployed');

  if (t < 4.0) { // HOOK A: cure moment
    const tt = T_CURE - 1.8 + t * .55; trick1VA(tt);
    S.player.pos = V(-4.5, 9, -7.2); S.player.held = 'gapple';
    S.cam = { pos: V(-2.2, 10.6, -7.4), look: V(-4.6, 10.1, -11), fov: 56 };
    S.overlays.push({ kind: 'hookTag', t0: .15, t1: 3.8, text: 'GET RICH WITH VILLAGERS' });
    if (tt > T_CURE) S.overlays.push({ kind: 'trades', t0: 0.4 + (T_CURE - (T_CURE - 1.8)) / .55, title: 'ARMORER (CURED)', rows: ARMORER_ROWS, k: 1, x: W - 900, y: 140 });
  } else if (t < 6.7) { // HOOK B: price drop on the panel
    trick1VA(40); S.player.visible = false; S.fp = true;
    S.cam = { pos: V(-4.5, 9 + EYE, -8.4), dir: V(-4.5, 10.6, -11.2).sub(V(-4.5, 10.6, -8.4)).normalize(), fov: 70 };
    S.overlays.push({ kind: 'trades', t0: 4.0, title: 'ARMORER', rows: ARMORER_ROWS, k: seg(t, 4.6, 5.4), x: 120, y: 120 });
  } else if (t < 9.4) { // HOOK C: mending appears
    S.lectern = true; S.vb.style = 'librarian'; S.player.visible = false; S.fp = true;
    S.cam = { pos: V(1.2, 9 + EYE, -8.3), dir: V(1.2, 10.4, -11.5).sub(V(1.2, 10.6, -8.3)).normalize(), fov: 70 };
    S.overlays.push({ kind: 'trades', t0: 6.7, title: 'LIBRARIAN', rows: libRows(t < 7.8 ? 2 : 4), x: 120, y: 120, flash: t >= 7.8 ? seg(t, 7.8, 8.2) : 0 });
  } else if (t < 12.0) { // HOOK D: sticks to emeralds
    S.player.pos = V(8.2, 9, -8.2); S.player.held = 'stick'; S.player.p = { use: (t * 2) % 1 };
    S.cam = { pos: V(10.8, 10.8, -7.4), look: V(8.3, 10, -11.2), fov: 56 };
    const n = Math.floor(seg(t, 9.6, 11.8) * 24); S.overlays.push({ kind: 'emeralds', n });
    if (Math.floor(t * 2) % 1 === 0) S.bursts.push({ type: 'happy', t0: Math.floor(t * 2) / 2, o: VC_POS.clone().add(V(0, 2, 0)), n: 8, sp: [.3, 1], up: [.5, 1.5], drag: 1, life: .8, size: .08, seed: Math.floor(t * 2) });
  } else if (t < 14.0) { // TITLE
    const a = deg(60) + (t - 12) * .12;
    S.cam = { pos: V(1 + Math.cos(a) * 20, 18, -9 + Math.sin(a) * 20), look: V(1, 10, -11), fov: 58 };
    S.overlays.push({ kind: 'title', t0: 12.0, t1: 14.0 });
  } else if (t < 18.6) { // TRICK 1 CARD
    trick1VA(0); const a = deg(80) + (t - 14) * .1;
    S.player.pos = V(-4.5, 9, -6.5);
    S.cam = { pos: V(-4.5 + Math.cos(a) * 9, 12.5, -10 + Math.sin(a) * 9), look: V(-4.5, 10, -11), fov: 56 };
    S.overlays.push({ kind: 'card', t0: 14.0, t1: 18.6, num: '#1', name: 'ZOMBIE VILLAGER CURE' });
  } else if (t < 22.4) { // trapped, in the shade
    trick1VA(0); S.player.pos = V(-3.2, 9, -7.0); S.player.yaw = Math.PI + .3; S.player.held = 'potion';
    S.cam = { pos: V(-1.0, 10.9, -6.2), look: V(-4.5, 10, -11), fov: 56 };
    S.overlays.push({ kind: 'worldTag', at: V(-5, 12.6, -11), text: 'ROOF = NO SUNLIGHT', col: '#ffd400', t0: 19.4 });
  } else if (t < 28.0) { // first person: potion, then golden apple
    trick1VA(t); S.fp = true; S.hud = true; S.player.visible = false;
    const eye = V(-4.4, 9 + EYE, -8.0);
    S.cam = { pos: eye, dir: V(-4.5, 10.3, -11.2).sub(eye).normalize(), fov: 70 };
    S.slot = t < 25.0 ? 1 : 2; S.held = t < 25.0 ? 'potion' : 'gapple'; S.switchT = t >= 25.0 ? 25.0 : null;
    S.counts = { 1: t > T_POT ? 1 : 2, 2: t > T_APPLE ? 2 : 3, 4: 64, 5: 8 };
    S.swing = Math.max(t > T_POT - .1 && t < T_POT + .25 ? seg(t, T_POT - .1, T_POT + .25) : 0, t > T_APPLE - .1 && t < T_APPLE + .25 ? seg(t, T_APPLE - .1, T_APPLE + .25) : 0);
    if (t > T_POT && t < T_HIT) { const k = seg(t, T_POT, T_HIT); S.orb4 = V(-4.45, lerp(10.4, 10.4, k) + Math.sin(Math.PI * k) * .6, lerp(-8.4, -10.9, k)); }
    if (t > 23.6) S.overlays.push({ kind: 'tag2', t0: 23.6, text: 'SPLASH POTION OF WEAKNESS', col: '#b0b0d0', icon: 'potion' });
    if (t > 26.3) S.overlays.push({ kind: 'tag2b', t0: 26.3, text: 'GOLDEN APPLE', col: '#ffd23e', icon: 'gapple' });
  } else if (t < 34.0) { // shaking, then cured
    trick1VA(t); S.player.pos = V(-3.4, 9, -7.2); S.player.yaw = Math.PI + .25;
    S.cam = { pos: V(-2.4, 10.4, -7.9), look: V(-4.5, 10.2, -11.2), fov: 54 };
    if (t > 29.6 && t < 31.6) S.overlays.push({ kind: 'timecard', t0: 29.6, text: '3-5 MINUTES LATER' });
    if (t > T_CURE) S.overlays.push({ kind: 'pop', t0: T_CURE, text: 'CURED!', x: W / 2, y: H * .28, size: 120, col: '#5cff7a' }), (S.flashT = T_CURE);
  } else if (t < 45.6) { // trades before/after
    trick1VA(t); S.fp = true; S.hud = false; S.player.visible = false;
    const eye = V(-4.4, 9 + EYE, -8.4); S.cam = { pos: eye, dir: V(-4.5, 10.5, -11.2).sub(eye).normalize(), fov: 70 };
    S.overlays.push({ kind: 'trades', t0: 34.1, title: 'ARMORER', rows: ARMORER_ROWS, k: seg(t, 36.6, 37.8), x: 120, y: 120 });
    if (t > 37.8 && t < 40.6) S.overlays.push({ kind: 'pop', t0: 37.8, text: '1 EMERALD!', x: W * .72, y: H * .3, size: 110, col: '#2fd06a' });
    if (t > 41.6) { S.overlays.push({ kind: 'tag2', t0: 41.6, text: 'THE DISCOUNT STAYS', col: '#5cff7a', icon: 'emerald' }); S.bursts.push({ type: 'happy', t0: 41.6, o: ZV_POS.clone().add(V(0, 2.2, 0)), n: 40, sp: [.3, 1.2], up: [.5, 1.6], drag: 1, life: 1.4, size: .09, seed: 403 }); }
  } else if (t < 56.0) { // pro tip: hard difficulty conversion
    S.va = { style: t < 50.2 ? 'unemployed' : 'zombie', pos: V(-1.5, 9, -4.5), yaw: -Math.PI / 2, shake: t > 49.8 && t < 50.2 ? 1 : 0, vis: true };
    const mx = lerp(-7, -2.6, seg(t, 46.0, 49.4)); S.mob = { pos: V(mx, 9, -4.5), yaw: Math.PI / 2, walk: t < 49.4 ? t * 5 : 0, alive: true, dead: 0, hurt: false };
    if (t > 49.4 && t < 49.9) S.hits.push([49.6, .08]);
    if (t > 50.2 && t < 51.5) S.bursts.push({ type: 'cure', t0: 50.2, o: V(-1.5, 10.4, -4.5), n: 40, sp: [.5, 2], up: [0, 2], drag: 1, life: 1.2, size: .1, seed: 404 });
    S.player.visible = false;
    const a = deg(250) + (t - 45.6) * .05;
    S.cam = { pos: V(-4 + Math.cos(a) * 7, 11.6, -4.5 + Math.sin(a) * 7 + 4), look: V(-3.5, 10, -4.5), fov: 56 };
    S.overlays.push({ kind: 'pill', text: 'DIFFICULTY: HARD', col: '#c62828', t0: 45.8 });
    if (t > 50.4) S.overlays.push({ kind: 'tag2', t0: 50.4, text: 'HARD = 100% ZOMBIE VILLAGERS', col: '#ff8a80' });
  } else if (t < 60.2) { // TRICK 2 CARD
    S.lectern = true; S.vb.style = 'librarian'; const a = deg(70) + (t - 56) * .1;
    S.cam = { pos: V(1 + Math.cos(a) * 8, 12.4, -10.5 + Math.sin(a) * 8), look: V(1, 10, -11.6), fov: 56 };
    S.overlays.push({ kind: 'card', t0: 56.0, t1: 60.2, num: '#2', name: 'MENDING EVERY TIME' });
  } else if (t < 65.0) { // place the lectern
    S.player.pos = V(1.0, 9, -8.6); S.player.held = 'lectern'; S.player.p = { use: seg(t, 61.25, 61.5) };
    S.cam = { pos: V(4.6, 11.4, -7.6), look: V(1.0, 9.9, -11.6), fov: 56 };
    if (t > 63.0 && t < 64.4) S.bursts.push({ type: 'happy', t0: 63.0, o: VB_POS.clone().add(V(0, 2.1, 0)), n: 40, sp: [.3, 1.2], up: [.5, 1.6], drag: 1, life: 1.2, size: .09, seed: 405 });
    if (t > 63.2) S.overlays.push({ kind: 'worldTag', at: V(1.0, 12.6, -11.6), text: 'LECTERN = LIBRARIAN', col: '#ffd400', t0: 63.2 });
  } else if (t < 82.6) { // reroll loop until mending, then trade once
    S.fp = true; S.hud = true; S.player.visible = false; S.slot = 0; S.held = 'axe';
    S.hotbar = ['axe', 'emerald', 'book', 'lectern', null, null, null, null, null]; S.counts = { 1: 64, 2: 12, 3: 1 };
    const eye = V(1.0, 9 + EYE, -8.6); const lookLect = !S.lectern || (t > 67.2 && t < 68.8);
    S.cam = { pos: eye, dir: (lookLect ? V(.5, 9.6, -11.5) : V(1.4, 10.6, -11.5)).sub(eye).normalize(), fov: 70 };
    const r = rollAt(t);
    for (const [a, b] of LECT_ON) { if (t > b - .2 && t < b + .25 && b < 900) S.swing = seg(t, b - .2, b + .25); if (t > a - .2 && t < a + .25) S.swing = seg(t, a - .2, a + .25);
      if (t >= b && t < b + .7) S.bursts.push({ type: 'wood', t0: b, o: V(.5, 9.5, -11.5), n: 26, sp: [1, 3], up: [1, 3], g: 14, life: .6, size: .08, seed: Math.round(b * 10) }); }
    if (r >= 0 && S.lectern) S.overlays.push({ kind: 'trades', t0: LECT_ON[r][0] + .5, title: 'LIBRARIAN', rows: libRows(r, t > 79.0 ? { done: true } : {}), x: 100, y: 120, flash: r === 4 ? seg(t, 76.5, 76.9) : 0, locked: t > 79.2 });
    if (r >= 0 && r < 4 && S.lectern && t > LECT_ON[r][0] + .8) S.overlays.push({ kind: 'nope', t0: LECT_ON[r][0] + .8 });
    if (t > 70.2 && t < 76.6) S.overlays.push({ kind: 'counter', text: `REROLL #${Math.max(1, r + 1)}`, col: '#ffd400' });
    if (t > 76.6 && t < 79.0) S.overlays.push({ kind: 'pop', t0: 76.6, text: 'MENDING!', x: W * .72, y: H * .3, size: 120, col: '#c77dff' });
    if (t > 78.6) { S.held = 'emerald'; S.slot = 1; S.swing = t < 79.2 ? seg(t, 78.6, 79.2) : 0; }
    if (t > 79.2 && t < 80.6) S.bursts.push({ type: 'happy', t0: 79.2, o: VB_POS.clone().add(V(0, 2.1, 0)), n: 40, sp: [.3, 1.2], up: [.5, 1.6], drag: 1, life: 1.2, size: .09, seed: 406 });
  } else if (t < 97.3) { // any job block + mending benefit
    S.lectern = true; S.vb.style = 'librarian';
    const a = deg(40) + (t - 82.6) * .07;
    S.player.pos = V(1.0, 9, -8.4); S.player.held = 'ebook';
    S.cam = { pos: V(1 + Math.cos(a) * 9, 12.5, -9 + Math.sin(a) * 9), look: V(1, 10, -10.5), fov: 56 };
    if (t < 89.5) S.overlays.push({ kind: 'jobs', t0: 82.8 });
    else S.overlays.push({ kind: 'tag2', t0: 89.6, text: 'MENDING REPAIRS YOUR GEAR WITH XP', col: '#c77dff', icon: 'ebook' });
  } else if (t < 100.8) { // TRICK 3 CARD
    const a = deg(80) + (t - 97) * .1;
    S.cam = { pos: V(7.5 + Math.cos(a) * 8, 12.4, -10.5 + Math.sin(a) * 8), look: V(7.6, 10, -11.6), fov: 56 };
    S.overlays.push({ kind: 'card', t0: 97.0, t1: 100.8, num: '#3', name: 'EASIEST EMERALDS' });
  } else if (t < 104.4) { // meet the fletcher
    S.player.pos = V(7.6, 9, -8.2); S.player.held = 'stick';
    S.cam = { pos: V(10.6, 11, -7.6), look: V(7.8, 10, -11.6), fov: 56 };
    S.overlays.push({ kind: 'worldTag', at: V(8.4, 12.8, -11.5), text: 'FLETCHER', col: '#ffd400', t0: 101.2 });
    S.overlays.push({ kind: 'worldTag', at: V(7.5, 10.9, -11.5), text: 'FLETCHING TABLE', col: '#d8c48c', t0: 102.0 });
  } else if (t < 108.6) { // trade panel: sticks
    S.fp = true; S.player.visible = false; const eye = V(8.0, 9 + EYE, -8.4);
    S.cam = { pos: eye, dir: V(8.5, 10.6, -11.5).sub(eye).normalize(), fov: 70 };
    S.overlays.push({ kind: 'trades', t0: 104.5, title: 'FLETCHER', rows: [{ in: [['stick', 32]], out: ['emerald', 1], lab: 'Sticks', hl: true }], x: 120, y: 160 });
  } else if (t < 113.8) { // crafting chain
    S.player.pos = V(7.6, 9, -8.2); S.player.held = 'stick';
    S.cam = { pos: V(10.6, 11, -7.6), look: V(7.8, 10, -11.6), fov: 56 }; S.filter = 'blur(6px) brightness(0.55)';
    S.overlays.push({ kind: 'sticks', t0: 108.7 });
  } else if (t < 116.8) { // chop the tree
    const chop = [114.2, 114.7, 115.2, 115.7, 116.2];
    for (let i = 0; i < 5; i++) { const tt = chop[i]; if (t < tt) S.dyn.push({ x: TREE.x, y: 9 + i, z: TREE.z, tex: 'log', wob: seg(t, tt - .3, tt) }); else if (t < tt + .6) S.bursts.push({ type: 'wood', t0: tt, o: V(TREE.x + .5, 9.5 + i, TREE.z + .5), n: 24, sp: [1, 3], up: [1, 3], g: 14, life: .6, size: .09, seed: i }); }
    S.logs = 0;
    S.player.pos = V(TREE.x + .5, 9, TREE.z + 2.3); S.player.yaw = Math.PI; S.player.held = 'axe'; S.player.p = { use: (t * 2) % 1, lookDown: -.3 };
    S.cam = { pos: V(TREE.x + 4.2, 11.4, TREE.z + 4.4), look: V(TREE.x + .5, 11, TREE.z + .5), fov: 58 };
    S.overlays.push({ kind: 'counter', text: `LOGS: ${chop.filter(c => t >= c).length}`, col: '#d8c48c' });
  } else if (t < 122.4) { // restock
    S.player.visible = false; const a = deg(70) + (t - 116.8) * .08;
    S.vc.work = t; S.cam = { pos: V(7.8 + Math.cos(a) * 6, 11.6, -11 + Math.sin(a) * 6), look: V(7.8, 10, -11.8), fov: 56 };
    S.overlays.push({ kind: 'restock', t0: 117.0 });
  } else if (t < 138.4) { // sell sticks: emerald montage
    S.fp = true; S.hud = true; S.player.visible = false; const eye = V(8.0, 9 + EYE, -8.4);
    S.cam = { pos: eye, dir: V(8.5, 10.6, -11.5).sub(eye).normalize(), fov: 70 };
    const n = Math.min(64, Math.floor(seg(t, 123.0, 135.0) * 64)), beat = Math.floor((t - 123) * 5.3);
    S.hotbar = ['axe', 'stick', 'emerald', 'lectern', null, null, null, null, null]; S.slot = 1; S.held = 'stick'; S.counts = { 1: Math.max(0, 64 * 4 - n * 32 % 256) || 32, 2: n };
    S.swing = t > 123 && t < 135 ? ((t - 123) * 5.3) % 1 : 0;
    if (t > 123 && t < 135) S.bursts.push({ type: 'happy', t0: 123 + beat / 5.3, o: VC_POS.clone().add(V(0, 2.1, 0)), n: 8, sp: [.3, 1], up: [.5, 1.5], drag: 1, life: .7, size: .08, seed: beat });
    S.overlays.push({ kind: 'emeralds', n }); S.overlays.push({ kind: 'pill', text: 'FAST FORWARD', col: '#1565c0', t0: 122.6 });
    if (t > 135.0) S.overlays.push({ kind: 'pop', t0: 135.0, text: 'A FULL STACK!', x: W / 2, y: H * .28, size: 120, col: '#2fd06a' });
  } else { // OUTRO in the village
    S.lectern = true; S.vb.style = 'librarian'; trick1VA(99); const a = deg(60) + (t - 138.4) * .06;
    S.player.pos = V(1.0, 9, -6.5); S.player.yaw = 0; S.player.held = 'emerald';
    S.cam = { pos: V(1 + Math.cos(a) * 10, 12.5, -6.5 + Math.sin(a) * 10), look: V(1, 10.2, -7.5), fov: 56 };
    S.overlays.push({ kind: 'outro', t0: 138.4 });
  }
  if (S.lectern) S.dyn.push({ x: LECT[0], y: LECT[1], z: LECT[2], tex: 'lectern' });
  if (t < 113.8 || t >= 116.8) for (let i = 0; i < 5; i++) if (!(t >= 113.8 && t < 116.8)) S.dyn.push({ x: TREE.x, y: 9 + i, z: TREE.z, tex: 'log' });
  return S;
}
function applyVillager(v, st, t) {
  v.g.visible = st.vis !== false; if (!v.g.visible) return;
  v.setStyle(st.style); v.g.position.copy(st.pos); v.g.rotation.set(0, st.yaw || 0, 0);
  const sh = st.shake ? .05 : 0; v.body.position.set(Math.sin(t * 61) * sh, 0, Math.cos(t * 53) * sh);
  v.headP.rotation.set(st.work ? Math.sin(t * 5) * .25 : 0, Math.sin(t * .7) * .15, 0);
  if (st.style === 'zombie') { v.armL.rotation.x = -1.45; v.armR.rotation.x = -1.45; }
}
function applyExtra(S, t) {
  applyVillager(VA, S.va, t); applyVillager(VB, S.vb, t); applyVillager(VC, S.vc, t);
  orb.visible = !!S.orb4; if (S.orb4) { orb.position.copy(S.orb4); orb.material.color.set('#8a8aa8'); orb.rotation.set(t * 9, t * 7, 0); }
}
