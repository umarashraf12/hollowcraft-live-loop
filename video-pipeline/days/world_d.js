// ---------- 100 days: world additions (base pieces, animals, stronghold, the End, dragon) ----------
Object.assign(T, {
  craftTop: canvasTex(16, (g, n) => { jitter(g, n, [176, 128, 74], .16, rng(61)); g.fillStyle = '#5a3a1c'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(7, 1, 1, 14); g.fillRect(1, 7, 14, 1); }),
  craftSide: canvasTex(16, (g, n) => { jitter(g, n, [150, 104, 60], .18, rng(62)); g.fillStyle = '#4a3018'; g.fillRect(0, 3, 16, 1); g.fillStyle = '#8a8a8a'; g.fillRect(3, 6, 3, 6); g.fillStyle = '#6b4a2b'; g.fillRect(10, 6, 2, 7); g.fillStyle = '#c0c0c0'; g.fillRect(9, 5, 4, 2); }),
  farmland: canvasTex(16, (g, n) => { jitter(g, n, [92, 60, 38], .25, rng(63)); g.fillStyle = 'rgba(50,30,18,.8)'; for (let y = 2; y < 16; y += 4) g.fillRect(0, y, 16, 1); }),
  wheat: canvasTex(16, g => { g.clearRect(0, 0, 16, 16); const r = rng(64); for (let i = 0; i < 6; i++) { const x = 1 + i * 2.6 | 0; for (let y = 3; y < 16; y++) px(g, x, y, y < 7 ? '#f4f4f4' : '#d0d0d0'); px(g, x + 1, 4 + (r() * 3 | 0), '#ffffff'); px(g, x - 1 < 0 ? 0 : x - 1, 5 + (r() * 3 | 0), '#ffffff'); } }),
  stonebrick: canvasTex(16, (g, n) => { jitter(g, n, [122, 122, 122], .16, rng(65)); g.fillStyle = '#4e4e4e'; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 7); g.fillRect(12, 8, 1, 7); }),
  frameTop: canvasTex(16, (g, n) => { jitter(g, n, [170, 196, 150], .12, rng(66)); g.fillStyle = '#2e5a52'; g.fillRect(4, 4, 8, 8); g.fillStyle = '#1a3a36'; g.fillRect(5, 5, 6, 6); }),
  frameSide: canvasTex(16, (g, n) => { jitter(g, n, [200, 206, 150], .12, rng(67)); g.fillStyle = '#3c6e64'; g.fillRect(0, 0, 16, 4); g.fillStyle = '#2e5a52'; for (let x = 1; x < 16; x += 3) g.fillRect(x, 4, 1, 2); }),
  endstone: canvasTex(16, (g, n) => { const r = rng(68); jitter(g, n, [222, 222, 160], .12, r); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(170,170,110,.8)'; g.fillRect(r() * 15 | 0, r() * 15 | 0, 2, 1); } }),
  bedrock: canvasTex(16, (g, n) => { const r = rng(69); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .66 ? '#7a7a7a' : v > .33 ? '#4a4a4a' : '#2a2a2a'; g.fillRect(x, y, 1, 1); } }),
  stars: canvasTex(32, (g, n) => { const r = rng(70); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .97 ? '#d6fff6' : v > .9 ? '#2a6a66' : v > .5 ? '#0c1c22' : '#050a10'; g.fillRect(x, y, 1, 1); } }),
  dragon: canvasTex(16, (g, n) => { const r = rng(71); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .7 + r() * .6; g.fillStyle = `rgb(${26 * k | 0},${24 * k | 0},${30 * k | 0})`; g.fillRect(x, y, 1, 1); } }),
  dwing: canvasTex(16, (g, n) => { const r = rng(72); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .8 + r() * .4; g.fillStyle = `rgb(${44 * k | 0},${36 * k | 0},${54 * k | 0})`; g.fillRect(x, y, 1, 1); } g.fillStyle = '#121014'; g.fillRect(0, 0, 16, 2); for (let x = 3; x < 16; x += 4) g.fillRect(x, 0, 1, 16); }),
  cow: canvasTex(16, (g, n) => { jitter(g, n, [92, 62, 40], .2, rng(73)); g.fillStyle = '#efefef'; g.fillRect(2, 3, 5, 4); g.fillRect(9, 8, 6, 5); g.fillRect(4, 11, 3, 3); }),
  cowFace: canvasTex(16, (g, n) => { jitter(g, n, [92, 62, 40], .2, rng(74)); g.fillStyle = '#efefef'; g.fillRect(4, 2, 8, 6); g.fillStyle = '#111'; g.fillRect(3, 6, 2, 2); g.fillRect(11, 6, 2, 2); g.fillStyle = '#c8a08a'; g.fillRect(4, 10, 8, 5); g.fillStyle = '#5a3a30'; g.fillRect(5, 12, 2, 1); g.fillRect(9, 12, 2, 1); }),
  wool2: canvasTex(16, (g, n) => jitter(g, n, [236, 236, 230], .1, rng(75))),
  sheepFace: canvasTex(16, (g, n) => { jitter(g, n, [214, 190, 170], .1, rng(76)); g.fillStyle = '#fff'; g.fillRect(0, 0, 16, 3); g.fillStyle = '#111'; g.fillRect(3, 7, 2, 2); g.fillRect(11, 7, 2, 2); g.fillStyle = '#e6a6a6'; g.fillRect(6, 11, 4, 2); }),
  egg: canvasTex(16, (g, n) => { const r = rng(77); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .85 ? '#a64cff' : v > .5 ? '#1e1028' : '#0c0812'; g.fillRect(x, y, 1, 1); } }),
});
T.stars.wrapS = T.stars.wrapT = THREE.RepeatWrapping;
Object.assign(ICON, {
  log: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x === 2 || x === 13 || y === 2 || y === 13) ? '#4a3420' : (x % 3 === 0 ? '#5c4126' : '#6b4a2b')); for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) px(g, x, y, '#b08e5c'); for (let x = 6; x < 10; x++) { px(g, x, 6, '#7a5a34'); px(g, x, 9, '#7a5a34'); } }),
  craft: canvasTex(16, g => { for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) px(g, x, y, y < 6 ? (x === 7 || y === 3 ? '#5a3a1c' : '#b0804a') : (y === 6 ? '#4a3018' : '#966838')); for (let y = 8; y < 13; y++) { px(g, 4, y, '#8a8a8a'); px(g, 5, y, '#8a8a8a'); px(g, 11, y, '#6b4a2b'); } }),
  wpick: canvasTex(16, g => { line(g, 3, 13, 11, 5, '#6b4a2b'); line(g, 4, 13, 12, 5, '#4a3b2a'); for (const [x, y] of [[6,2],[7,2],[8,2],[9,2],[10,3],[11,3],[12,4],[12,5],[13,6],[13,7],[13,8],[5,3],[4,3]]) px(g, x, y, '#b88a52'); for (const [x, y] of [[7,3],[8,3],[9,3],[11,4],[12,6],[12,7]]) px(g, x, y, '#7a5228'); }),
  hoe: canvasTex(16, g => { line(g, 3, 13, 11, 5, '#6b4a2b'); line(g, 4, 13, 12, 5, '#4a3b2a'); for (const [x, y] of [[9,2],[10,2],[11,2],[12,2],[12,3],[13,3],[9,3]]) px(g, x, y, '#cfcfcf'); }),
  wheat: canvasTex(16, g => { for (let i = 0; i < 4; i++) { line(g, 4 + i * 2, 14, 6 + i * 2, 4, '#c9a23a'); px(g, 6 + i * 2, 3, '#f0d070'); px(g, 5 + i * 2, 5, '#f0d070'); px(g, 7 + i * 2, 6, '#e0b850'); } line(g, 3, 12, 13, 12, '#8a6a20'); }),
  bow: canvasTex(16, g => { for (let i = 0; i < 12; i++) { const a = -1.2 + i * .2; px(g, Math.round(5 + Math.cos(a) * 7), Math.round(8 + Math.sin(a) * 7), '#6b4a2b'); } line(g, 7, 1, 7, 15, '#e6e6e6'); }),
  eye: canvasTex(16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 6) px(g, x, y, d < 2 ? '#0a2a20' : d < 3.6 ? '#2fae8a' : '#1e6e56'); } }),
  steak: canvasTex(16, g => { for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if (Math.hypot((x - 8) * .8, y - 8.5) < 4.6) px(g, x, y, (x + y) % 4 ? '#8a4a2a' : '#a8603a'); line(g, 11, 5, 14, 2, '#eeeeee'); }),
});
// --- hut, farm, pen, torch ring (static; toggled per segment)
const HUT = { x: 51, z: 23 };
const HUT_CELLS = []; for (let x = 50; x <= 52; x++) for (let z = 22; z <= 24; z++) for (let y = 9; y <= 11; y++) { const inside = x === 51 && z === 23 && y <= 10, win = x === 51 && z === 24 && y === 10; if (!inside && !win) HUT_CELLS.push([x, y, z]); }
HUT_CELLS.sort((a, b) => a[1] - b[1] || a[0] - b[0] || a[2] - b[2]);
const HUT_MESH = cellMeshes(new Map(HUT_CELLS.map(([x, y, z]) => [k3(x, y, z), 'dirt'])));
const HOUSE_MESH = cellMeshes(new Map(HOUSE.filter(h => h[3] !== 'glassB').map(([x, y, z, t]) => [k3(x, y, z), t])), (t, f) => t === 'log' ? (f === 2 || f === 3 ? 'logTop' : 'logSide') : t);
const HOUSE_GLASS = HOUSE.filter(h => h[3] === 'glassB');
const FARM = { x0: 36, x1: 42, z0: 46, z1: 50, wx: 39 }, FARM_CELLS = [];
for (let z = FARM.z0; z <= FARM.z1; z++) for (let x = FARM.x0; x <= FARM.x1; x++) if (x !== FARM.wx) FARM_CELLS.push([x, z]);
const farmG = new THREE.Group(); scene.add(farmG);
{ const fl = new THREE.MeshLambertMaterial({ map: T.farmland }); FARM_CELLS.forEach(([x, z]) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fl); q.rotation.x = -Math.PI / 2; q.position.set(x + .5, 9.012, z + .5); farmG.add(q); });
  const wm = new THREE.MeshLambertMaterial({ map: T.water, emissive: 0x0a1a40 }); for (let z = FARM.z0; z <= FARM.z1; z++) { const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wm); q.rotation.x = -Math.PI / 2; q.position.set(FARM.wx + .5, 8.9, z + .5); farmG.add(q); } }
const wheatGeo = (() => { const g = new THREE.BufferGeometry(), p = [], uv = [], n = [], idx = []; const quad = (ax, az, bx, bz) => { const b = p.length / 3; p.push(ax, 0, az, bx, 0, bz, bx, 1, bz, ax, 1, az); uv.push(0, 0, 1, 0, 1, 1, 0, 1); for (let i = 0; i < 4; i++) n.push(0, 1, 0); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  quad(-.45, -.45, .45, .45); quad(-.45, .45, .45, -.45); quad(-.45, -.2, .45, -.2); quad(-.45, .2, .45, .2);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setIndex(idx); return g; })();
const wheatIM = new THREE.InstancedMesh(wheatGeo, new THREE.MeshLambertMaterial({ map: T.wheat, transparent: true, alphaTest: .5, side: THREE.DoubleSide }), FARM_CELLS.length); wheatIM.frustumCulled = false; scene.add(wheatIM);
wheatIM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(FARM_CELLS.length * 3), 3);
const PEN = { x0: 28, x1: 35, z0: 32, z1: 39, gate: 33 }; // gate gap on the z1 side at x = gate
const penG = new THREE.Group(), gateG = new THREE.Group(); scene.add(penG); scene.add(gateG);
{ const m = new THREE.MeshLambertMaterial({ map: T.planks }); const post = (x, z, grp) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.5, .25), m); b.position.set(x, 9.75, z); grp.add(b); };
  const rail = (x0, z0, x1, z1, grp) => { for (const y of [9.45, 10.15]) { const len = Math.hypot(x1 - x0, z1 - z0); const b = new THREE.Mesh(new THREE.BoxGeometry(x1 !== x0 ? len : .12, .16, z1 !== z0 ? len : .12), m); b.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); grp.add(b); } };
  const pts = []; for (let x = PEN.x0; x <= PEN.x1; x++) pts.push([x + .5, PEN.z0 + .5]); for (let z = PEN.z0 + 1; z <= PEN.z1; z++) pts.push([PEN.x1 + .5, z + .5]); for (let x = PEN.x1 - 1; x >= PEN.x0; x--) pts.push([x + .5, PEN.z1 + .5]); for (let z = PEN.z1 - 1; z > PEN.z0; z--) pts.push([PEN.x0 + .5, z + .5]);
  pts.forEach(([x, z]) => post(x, z, penG)); pts.push(pts[0]);
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1]; const isGate = az === PEN.z1 + .5 && bz === PEN.z1 + .5 && Math.min(ax, bx) === PEN.gate + .5; rail(ax, az, bx, bz, isGate ? gateG : penG); } }
const torchRing = new THREE.Group(); scene.add(torchRing);
{ const st = new THREE.MeshLambertMaterial({ map: solidTex('#6b4a2b') }), fm = new THREE.MeshBasicMaterial({ color: 0xffd36a });
  const spots = []; for (let x = 43; x <= 51; x += 2) { spots.push([x + .5, 38.5]); spots.push([x + .5, 46.5]); } for (let z = 40; z <= 44; z += 2) { spots.push([42.5, z + .5]); spots.push([51.5, z + .5]); }
  spots.forEach(([x, z]) => { const s = new THREE.Mesh(new THREE.BoxGeometry(.12, .6, .12), st); s.position.set(x, 9.3, z); torchRing.add(s); const f = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), fm); f.position.set(x, 9.66, z); torchRing.add(f); }); }
// a single torch + light for the hut (night 1) and the stronghold
const hutTorch = new THREE.Group(); scene.add(hutTorch);
{ const s = new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .12), new THREE.MeshLambertMaterial({ map: solidTex('#6b4a2b') })); s.position.y = .25; hutTorch.add(s); const f = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), new THREE.MeshBasicMaterial({ color: 0xffd36a })); f.position.y = .56; hutTorch.add(f); }
const torchL = new THREE.PointLight(0xffb050, 0, 9, 1.3); scene.add(torchL);
const torchL2 = new THREE.PointLight(0xffb050, 0, 16, 1.2); scene.add(torchL2);
// --- animals
const animalMat = { cow: new THREE.MeshLambertMaterial({ map: T.cow }), cowF: new THREE.MeshLambertMaterial({ map: T.cowFace }), wool: new THREE.MeshLambertMaterial({ map: T.wool2 }), sheepF: new THREE.MeshLambertMaterial({ map: T.sheepFace }), skin: new THREE.MeshLambertMaterial({ map: solidTex('#d6bea8') }) };
function makeAnimal(kind) {
  const g = new THREE.Group(), cow = kind === 'cow'; const mk = (w, h, d, mat, par, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); par.add(b); return b; };
  const body = cow ? animalMat.cow : animalMat.wool, legM = cow ? animalMat.cow : animalMat.skin, face = cow ? animalMat.cowF : animalMat.sheepF;
  mk(.9, cow ? .8 : .85, cow ? 1.35 : 1.2, body, g, 0, cow ? .95 : .92, 0);
  const head = new THREE.Group(); head.position.set(0, cow ? 1.25 : 1.2, cow ? .8 : .72); g.add(head); mk(cow ? .62 : .5, cow ? .6 : .52, .5, [body, body, body, body, face, body], head, 0, 0, .18);
  if (cow) { const horn = new THREE.MeshLambertMaterial({ map: solidTex('#e8e2d0') }); mk(.1, .16, .1, horn, head, -.34, .3, .2); mk(.1, .16, .1, horn, head, .34, .3, .2); }
  const legs = []; for (const [x, z] of [[-.28, .45], [.28, .45], [-.28, -.45], [.28, -.45]]) { const p = new THREE.Group(); p.position.set(x, .6, z); g.add(p); mk(.24, .6, .24, legM, p, 0, -.3, 0); legs.push(p); }
  g.visible = false; scene.add(g); return { g, head, legs, kind };
}
const ANIMALS = ['cow', 'sheep', 'cow', 'sheep', 'cow', 'sheep'].map(makeAnimal);
// --- stronghold portal room (far underground, x -700, z 300) and the End island (x -700, y 60, z 0)
const SH = { x: -700, y: -121, z: 300 };
{ const c = new Map(); for (let x = SH.x - 6; x <= SH.x + 6; x++) for (let z = SH.z - 6; z <= SH.z + 6; z++) for (let y = SH.y - 1; y <= SH.y + 6; y++) { const edge = x === SH.x - 6 || x === SH.x + 6 || z === SH.z - 6 || z === SH.z + 6 || y === SH.y - 1 || y === SH.y + 6; if (edge) c.set(k3(x, y, z), 'stonebrick'); }
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const ring = (Math.abs(dx) === 2) !== (Math.abs(dz) === 2); if (ring) c.set(k3(SH.x + dx, SH.y, SH.z + dz), 'frame'); }
  cellMeshes(c, (t, f) => t === 'frame' ? (f === 2 ? 'frameTop' : 'frameSide') : t); }
const FRAME_EYES = []; for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if ((Math.abs(dx) === 2) !== (Math.abs(dz) === 2)) FRAME_EYES.push([SH.x + dx + .5, SH.y + 1.06, SH.z + dz + .5, Math.atan2(dx, dz)]);
FRAME_EYES.sort((a, b) => a[3] - b[3]);
const eyeIM = new THREE.InstancedMesh(new THREE.BoxGeometry(.42, .14, .42), new THREE.MeshBasicMaterial({ color: 0x2fae8a }), 12); eyeIM.frustumCulled = false; scene.add(eyeIM);
const starMat = new THREE.MeshBasicMaterial({ map: T.stars, transparent: true, opacity: 0, depthWrite: false });
const shPortal = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), starMat); shPortal.rotation.x = -Math.PI / 2; shPortal.position.set(SH.x + .5, SH.y + .8, SH.z + .5); scene.add(shPortal);
const END = { x: -700, y: 60, z: 0 };
const PILLARS = [...Array(6)].map((_, i) => { const a = i / 6 * Math.PI * 2 + .3; return { x: Math.round(END.x + Math.cos(a) * 14), z: Math.round(END.z + Math.sin(a) * 14), top: END.y + 9 + (i * 5) % 9 }; });
{ const c = new Map(); for (let x = END.x - 24; x <= END.x + 24; x++) for (let z = END.z - 24; z <= END.z + 24; z++) { const d = Math.hypot(x - END.x, z - END.z) + fbm(x * .2, z * .2) * 4; if (d > 23) continue; const depth = Math.round(lerp(9, 1, d / 23)); for (let y = END.y - depth; y <= END.y; y++) c.set(k3(x, y, z), 'endstone'); }
  for (const p of PILLARS) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = END.y + 1; y <= p.top; y++) c.set(k3(p.x + dx, y, p.z + dz), 'obsidian');
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const r = Math.max(Math.abs(dx), Math.abs(dz)); if (r === 2 || (dx === 0 && dz === 0)) c.set(k3(END.x + dx, END.y + 1, END.z + dz), 'bedrock'); else c.delete(k3(END.x + dx, END.y, END.z + dz)), c.set(k3(END.x + dx, END.y - 1, END.z + dz), 'bedrock'); }
  for (let y = END.y + 2; y <= END.y + 4; y++) c.set(k3(END.x, y, END.z), 'bedrock');
  cellMeshes(c); }
const exitPortal = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: T.stars, transparent: true, opacity: 0, depthWrite: false })); exitPortal.rotation.x = -Math.PI / 2; exitPortal.position.set(END.x + .5, END.y + .3, END.z + .5); scene.add(exitPortal);
const crystalMat = new THREE.MeshBasicMaterial({ color: 0xff7ad9, fog: false }), cageMat = new THREE.MeshBasicMaterial({ color: 0xe8d0ff, wireframe: true, fog: false });
const CRYSTALS = PILLARS.map(p => { const g = new THREE.Group(); g.position.set(p.x + .5, p.top + 2.2, p.z + .5); g.add(new THREE.Mesh(new THREE.OctahedronGeometry(.55), crystalMat)); const cg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), cageMat); g.add(cg); g.userData.cage = cg; scene.add(g); return g; });
const egg = new THREE.Mesh(new THREE.SphereGeometry(.42, 10, 8), new THREE.MeshLambertMaterial({ map: T.egg, emissive: 0x200830 })); egg.scale.set(1, 1.25, 1); egg.position.set(END.x + .5, END.y + 5.5, END.z + .5); egg.visible = false; scene.add(egg);
// the dragon (original model): long body, neck, head with glowing eyes, tail, two jointed wings
function makeDragon() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ map: T.dragon }), wm = new THREE.MeshLambertMaterial({ map: T.dwing, side: THREE.DoubleSide }), eyeM = new THREE.MeshBasicMaterial({ color: 0xd56bff, fog: false });
  const mk = (w, h, d, mat, par, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); par.add(b); return b; };
  mk(2.0, 1.6, 4.6, m, g, 0, 0, 0); for (let i = 0; i < 4; i++) mk(.3, .5, .5, m, g, 0, 1.0, 1.6 - i * 1.1);
  const neck = new THREE.Group(); neck.position.set(0, .3, 2.3); g.add(neck); const ns = []; let par = neck;
  for (let i = 0; i < 4; i++) { const s = new THREE.Group(); s.position.set(0, 0, i ? .9 : 0); par.add(s); mk(.8, .8, .95, m, s, 0, 0, .45); mk(.2, .3, .3, m, s, 0, .5, .45); ns.push(s); par = s; }
  const head = new THREE.Group(); head.position.set(0, 0, .9); par.add(head); mk(1.2, .95, 1.3, m, head, 0, .1, .55); mk(.8, .5, 1.1, m, head, 0, -.05, 1.6); const jaw = mk(.75, .22, 1.1, m, head, 0, -.42, 1.4);
  mk(.3, .12, .05, eyeM, head, -.36, .32, 1.21); mk(.3, .12, .05, eyeM, head, .36, .32, 1.21); mk(.18, .4, .18, m, head, -.4, .7, .2); mk(.18, .4, .18, m, head, .4, .7, .2);
  const tail = new THREE.Group(); tail.position.set(0, .1, -2.3); g.add(tail); const ts = []; par = tail;
  for (let i = 0; i < 7; i++) { const s = new THREE.Group(); s.position.set(0, 0, i ? -.95 : 0); par.add(s); const w = .8 - i * .08; mk(w, w, .95, m, s, 0, 0, -.45); mk(.18, .3, .3, m, s, 0, w / 2 + .12, -.45); ts.push(s); par = s; }
  const wing = side => { const sh = new THREE.Group(); sh.position.set(side * 1.0, .6, .6); g.add(sh); mk(3.2, .25, .25, m, sh, side * 1.6, 0, 0); const inner = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.4).translate(side * 1.6, 0, -1.7), wm); inner.rotation.x = -Math.PI / 2; sh.add(inner);
    const tip = new THREE.Group(); tip.position.set(side * 3.2, 0, 0); sh.add(tip); mk(3.4, .2, .2, m, tip, side * 1.7, 0, 0); const outer = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.0).translate(side * 1.7, 0, -1.5), wm); outer.rotation.x = -Math.PI / 2; tip.add(outer); return { sh, tip }; };
  const wl = wing(-1), wr = wing(1);
  const legs = []; for (const [x, z] of [[-.8, 1.4], [.8, 1.4], [-.8, -1.4], [.8, -1.4]]) { const p = new THREE.Group(); p.position.set(x, -.7, z); g.add(p); mk(.45, 1.2, .45, m, p, 0, -.6, 0); legs.push(p); }
  g.scale.setScalar(1.35); g.visible = false; scene.add(g);
  return { g, neck: ns, head, jaw, tail: ts, wl, wr, legs, mats: [m, wm] };
}
const DRAGON = makeDragon();
const beamPool = []; { const bm = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.35, 30, .35).translate(0, 15, 0), bm.clone()); b.visible = false; scene.add(b); beamPool.push(b); } }
// stars for night and the End
const starPts = (() => { const r = rng(88), p = []; for (let i = 0; i < 900; i++) { const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); if (u < -.05) continue; p.push(Math.cos(a) * s * 420, u * 420, Math.sin(a) * s * 420); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0, depthWrite: false })); pts.renderOrder = -1; scene.add(pts); return pts; })();
