// ---------- Shorts world: rich mansion + torch-ringed dirt hut, obsidian security house + lava moat, bedroom in the sky ----------
Object.assign(T, {
  gold: canvasTex(16, (g, n) => { const r = rng(51); jitter(g, n, [250, 205, 60], .14, r); g.fillStyle = '#fff6b0'; g.fillRect(1, 1, 5, 1); g.fillRect(1, 1, 1, 5); g.fillStyle = 'rgba(160,110,10,.7)'; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16); }),
  diaBlock: canvasTex(16, (g, n) => { const r = rng(52); jitter(g, n, [110, 230, 225], .12, r); g.fillStyle = '#e8fffd'; g.fillRect(1, 1, 5, 1); g.fillRect(1, 1, 1, 5); g.fillStyle = 'rgba(20,120,115,.7)'; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16); }),
  quartz: canvasTex(16, (g, n) => { jitter(g, n, [236, 232, 224], .05, rng(53)); g.fillStyle = 'rgba(180,170,160,.6)'; g.fillRect(0, 15, 16, 1); }),
  glass: canvasTex(16, g => { g.clearRect(0, 0, 16, 16); g.fillStyle = 'rgba(230,248,255,1)'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(3, 3, 1, 1); g.fillRect(4, 4, 1, 1); g.fillRect(11, 10, 1, 1); }),
  obsidian: canvasTex(16, (g, n) => { const r = rng(54); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .7 + r() * .6; g.fillStyle = `rgb(${22*k|0},${14*k|0},${38*k|0})`; g.fillRect(x, y, 1, 1); } for (let i = 0; i < 6; i++) { g.fillStyle = '#4a2a78'; g.fillRect(r() * 15 | 0, r() * 15 | 0, 2, 1); } }),
  iron: canvasTex(16, (g, n) => { jitter(g, n, [200, 204, 206], .06, rng(55)); g.fillStyle = '#8a8e90'; g.fillRect(2, 2, 12, 1); g.fillRect(2, 13, 12, 1); g.fillRect(2, 2, 1, 12); g.fillRect(13, 2, 1, 12); g.fillRect(4, 7, 8, 1); }),
  lava: canvasTex(16, (g, n) => { const r = rng(56); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .8 ? '#ffe36e' : v > .45 ? '#ff9a1f' : '#e8521a'; g.fillRect(x, y, 1, 1); } }),
  wool: canvasTex(16, (g, n) => jitter(g, n, [180, 30, 36], .15, rng(57))),
  chestT: canvasTex(16, (g, n) => { jitter(g, n, [160, 110, 50], .16, rng(58)); g.fillStyle = '#3a2814'; g.fillRect(0, 5, 16, 1); g.fillStyle = '#d8d8d8'; g.fillRect(7, 4, 2, 3); }),
});
T.lava.wrapS = T.lava.wrapT = THREE.RepeatWrapping;
function finishMeshes(ms) { ms.forEach(m => { const tex = Object.keys(T).find(k => T[k] === m.material.map); if (tex === 'glass') { m.material.transparent = true; m.material.alphaTest = .5; m.material.side = THREE.DoubleSide; } }); return ms; }
function cellMeshes(cells, texOf = (t, f) => t) {
  const faces = [];
  for (const [key, type] of cells) { const [x, y, z] = key.split(',').map(Number); for (let f = 0; f < 6; f++) { const [dx, dy, dz] = FACES2[f].d; const nb = cells.get(k3(x + dx, y + dy, z + dz)); if (!nb || (nb === 'glass') !== (type === 'glass')) faces.push([x, y, z, f, type]); } }
  return finishMeshes(emitMeshes(faces, texOf));
}
// --- Short 1: poor dirt hut (center 34,36) with a torch ring, rich mansion (41..47 x 30..38)
const HUT = { x: 34, z: 36 }, MANSION_GLASS = [];
{
  const c = new Map(), set = (x, y, z, t) => c.set(k3(x, y, z), t);
  for (let x = 33; x <= 35; x++) for (let z = 35; z <= 37; z++) { const edge = x !== 34 || z !== 36; if (edge && !(x === 34 && z === 37)) { set(x, 9, z, 'dirt'); set(x, 10, z, 'dirt'); } set(x, 11, z, 'dirt'); }
  for (let x = 41; x <= 47; x++) for (let z = 30; z <= 37; z++) for (let y = 9; y <= 12; y++) {
    const ex = x === 41 || x === 47, ez = z === 30 || z === 37;
    if (y === 12) { set(x, 13, z, (x + z) % 2 ? 'diaBlock' : 'diaBlock'); }
    if (!(ex || ez)) continue;
    if (ex && ez) { set(x, y, z, 'quartz'); continue; }
    if (z === 37 && x === 44 && y <= 10) continue;                                   // door
    if (y === 10 || y === 11) { if ((z === 37 && x !== 44) || (ex && z % 2 === 0)) { MANSION_GLASS.push([x, y, z]); continue; } }
    set(x, y, z, 'gold');
  }
  for (let x = 41; x <= 47; x++) for (let z = 30; z <= 37; z++) set(x, 12, z, 'gold');
  cellMeshes(c);
}
const TORCH_RING = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .2; TORCH_RING.push([HUT.x + .5 + Math.cos(a) * 3.3, 9, HUT.z + .5 + Math.sin(a) * 3.3]); }
// --- Short 2: obsidian security house at (0,-10) with an iron door and a lava moat
const SEC = { x: 0, z: -10 };
{
  const c = new Map(), set = (x, y, z, t) => c.set(k3(x, y, z), t);
  for (let x = -2; x <= 2; x++) for (let z = -12; z <= -8; z++) {
    const wall = Math.abs(x) === 2 || z === -12 || z === -8;
    for (let y = 9; y <= 11; y++) if (wall && !(x === 0 && z === -8 && y <= 10)) set(x, y, z, 'obsidian');
    set(x, 12, z, 'obsidian');
  }
  cellMeshes(c);
}
const lavaMoat = new THREE.Group(); scene.add(lavaMoat);
{ const m = new THREE.MeshBasicMaterial({ map: T.lava }); for (let x = -4; x <= 4; x++) for (let z = -14; z <= -6; z++) { const d = Math.max(Math.abs(x), Math.abs(z + 10)); if (d < 3) continue; const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); q.rotation.x = -Math.PI / 2; q.position.set(x + .5, 9.03, z + .5); lavaMoat.add(q); } }
// --- Short 3: a small bedroom high in the sky (interior only), x 0..4, z 60..64, floor at y 100
const ROOM = { y: 100 };
{
  const c = new Map(), set = (x, y, z, t) => c.set(k3(x, y, z), t);
  for (let x = -1; x <= 5; x++) for (let z = 59; z <= 65; z++) { set(x, 99, z, 'planks'); set(x, 103, z, 'planks'); if (x === -1 || x === 5 || z === 59 || z === 65) for (let y = 100; y <= 102; y++) set(x, y, z, y === 101 && (x === 5 && z === 62) ? 'glass' : 'planks'); }
  cellMeshes(c);
  const bedM = [new THREE.MeshLambertMaterial({ map: T.planks }), new THREE.MeshLambertMaterial({ map: T.planks }), new THREE.MeshLambertMaterial({ map: T.wool }), new THREE.MeshLambertMaterial({ map: T.planks }), new THREE.MeshLambertMaterial({ map: T.planks }), new THREE.MeshLambertMaterial({ map: T.planks })];
  const bedB = new THREE.Mesh(new THREE.BoxGeometry(1, .56, 2), bedM); bedB.position.set(.5, 100.28, 63.5); scene.add(bedB);
  const ch = new THREE.Mesh(new THREE.BoxGeometry(.88, .88, .88), [new THREE.MeshLambertMaterial({ map: T.chestT }), new THREE.MeshLambertMaterial({ map: T.chestT }), new THREE.MeshLambertMaterial({ map: T.planks }), new THREE.MeshLambertMaterial({ map: T.planks }), new THREE.MeshLambertMaterial({ map: T.chestT }), new THREE.MeshLambertMaterial({ map: T.chestT })]);
  ch.position.set(4.4, 100.44, 60.6); scene.add(ch);
}
const ROOM_TORCHES = [[2.5, 101.2, 60.13, 0], [.13, 101.2, 62.5, 1], [4.87, 101.2, 62.5, 2], [2.5, 101.2, 64.87, 3]];
// torch meshes (pool) — positioned per frame
const torchPool = [];
{ const st = new THREE.MeshLambertMaterial({ map: solidTex('#6b4a2b') });
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.BoxGeometry(.12, .6, .12), st); s.position.y = .3; g.add(s);
    const f = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), new THREE.MeshBasicMaterial({ color: 0xffd36a })); f.position.y = .66; g.add(f); g.userData.flame = f; g.visible = false; scene.add(g); torchPool.push(g); } }
const lightPool = []; for (let i = 0; i < 8; i++) { const l = new THREE.PointLight(0xffb050, 0, 11, 1.4); scene.add(l); lightPool.push(l); }
// characters: Pip (little brother) and VOID (shadow villain)
const PIP = makeHuman({ skin: '#e0a27a', hair: '#7a3b12', hood: '#e8742a', shirt: '#f08a2c', pants: '#3a4a6a', shoes: '#2a2a2a', eyeW: '#ffffff', eye: '#2a6ae0', mouth: '#8a4a3a' });
PIP.g.scale.setScalar(.82);
const VOIDM = makeHuman({ skin: '#0b0b14', hair: '#05050a', shirt: '#0b0b14', pants: '#06060c', shoes: '#000000', eyeW: '#0b0b14', eye: '#0b0b14', mouth: '#0b0b14', glow: '#c84bff' });
VOIDM.g.scale.setScalar(1.3); VOIDM.item.visible = false;
VOIDM.mats.forEach(m => { m.transparent = true; });
PCOL.voidsmoke = ['#140a22', '#2a1046', '#000000', '#5a2a8a']; PCOL.vpoof = ['#c84bff', '#7a2bd6', '#1a0a2a', '#ffffff']; PCOL.glassb = ['#e6f8ff', '#bfe6ff', '#ffffff']; PCOL.fizz = ['#bdbdbd', '#8a8a8a', '#ffd36a']; PCOL.sparkle = ['#fff6b0', '#ffffff', '#ffd23e'];
