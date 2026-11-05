// ---------- full sky island video: extra models, icons, textures ----------
Object.assign(T, {
  ironA: canvasTex(16, (g, n) => { jitter(g, n, [196, 200, 204], .07, rng(91)); g.fillStyle = '#8a8e92'; g.fillRect(0, 7, 16, 1); g.fillRect(7, 0, 1, 16); }),
  ender: canvasTex(16, (g, n) => { const r = rng(92); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .6 + r() * .5; g.fillStyle = `rgb(${18 * k | 0},${14 * k | 0},${22 * k | 0})`; g.fillRect(x, y, 1, 1); } }),
  blaze: canvasTex(16, (g, n) => { const r = rng(93); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .7 ? '#fff36a' : v > .35 ? '#ffc21a' : '#d88a10'; g.fillRect(x, y, 1, 1); } }),
  dripT: canvasTex(16, (g, n) => jitter(g, n, [150, 112, 86], .2, rng(94))),
  cauldron: canvasTex(16, (g, n) => { jitter(g, n, [70, 70, 76], .15, rng(95)); g.fillStyle = '#2a2a30'; g.fillRect(0, 0, 16, 2); g.fillRect(0, 14, 3, 2); g.fillRect(13, 14, 3, 2); }),
});
const blazeFace = canvasTex(8, g => { jitter(g, 8, [255, 200, 40], .2, rng(96)); g.fillStyle = '#3a2000'; g.fillRect(1, 3, 2, 1); g.fillRect(5, 3, 2, 1); g.fillRect(2, 5, 4, 1); });
const enderFace = canvasTex(8, g => { jitter(g, 8, [20, 16, 26], .2, rng(97)); g.fillStyle = '#e07bff'; g.fillRect(0, 4, 3, 1); g.fillRect(5, 4, 3, 1); g.fillStyle = '#ffffff'; g.fillRect(1, 4, 1, 1); g.fillRect(6, 4, 1, 1); });
Object.assign(ICON, {
  spick: canvasTex(16, g => { line(g, 3, 13, 11, 5, '#6b4a2b'); line(g, 4, 13, 12, 5, '#4a3b2a'); for (const [x, y] of [[6,2],[7,2],[8,2],[9,2],[10,3],[11,3],[12,4],[12,5],[13,6],[13,7],[13,8],[5,3],[4,3]]) px(g, x, y, '#9a9aa0'); for (const [x, y] of [[7,3],[8,3],[9,3],[11,4],[12,6],[12,7]]) px(g, x, y, '#6a6a70'); }),
  iron: canvasTex(16, g => { for (let y = 6; y < 11; y++) for (let x = 2 + (10 - y); x < 14 - (y - 6); x++) px(g, x, y, y === 6 ? '#ffffff' : '#c8ccd0'); line(g, 4, 10, 12, 10, '#8a8e92'); }),
  pearl: canvasTex(16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 5.6) px(g, x, y, d < 2.2 ? '#2a6a5a' : d < 4 ? '#1a4a3e' : '#0e2a24'); } px(g, 6, 5, '#7adcc0'); }),
  rod: canvasTex(16, g => { line(g, 4, 12, 11, 5, '#ffcf3a'); line(g, 5, 12, 12, 5, '#d88a10'); px(g, 3, 13, '#fff36a'); px(g, 12, 4, '#fff36a'); }),
  obsI: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x * 5 + y * 3) % 7 === 0 ? '#5a3a8a' : '#1a1028'); }),
  stoneB: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (y === 7 || (y < 7 && x === 7) || (y > 7 && (x === 4 || x === 11))) ? '#4e4e4e' : '#8a8a8a'); }),
  chestplate: canvasTex(16, g => { for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) { const sleeve = y < 7 && (x < 4 || x > 11); const neck = y < 5 && x > 5 && x < 10; if (!neck) px(g, x, y, sleeve ? '#a8acb0' : '#d0d4d8'); } }),
  egg: canvasTex(16, g => { for (let y = 2; y < 15; y++) for (let x = 3; x < 13; x++) { const d = Math.hypot((x - 7.5) / 5, (y - 9) / 6.5); if (d < 1) px(g, x, y, (x * 3 + y * 7) % 9 === 0 ? '#a64cff' : '#160c22'); } }),
});
// island farm wheat (instanced crosses) and torches
const IW_CELLS = [[13, 9], [13, 10], [13, 11], [14, 8], [14, 9], [14, 11], [14, 12]];
const iWheat = new THREE.InstancedMesh(wheatGeo, new THREE.MeshLambertMaterial({ map: T.wheat, transparent: true, alphaTest: .5, side: THREE.DoubleSide }), IW_CELLS.length); iWheat.frustumCulled = false; iWheat.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(IW_CELLS.length * 3), 3); scene.add(iWheat);
const TORCH_SPOTS = [[17.5, 109, 12.9], [22.5, 109, 12.9], [17.5, 109, 19.1], [23.5, 109, 19.1], [15.5, 109, 8.1], [15.5, 109, 12.1], [12.5, 109, 10.4], [9.5, 109, 10.4], [4.5, 109, 8.5], [8.5, 109, 12.5], [23.5, 109, 8.1], [18.5, 109, 6.6], [21.5, 109, 6.6], [24.5, 109, 12.5], [26.5, 109, 14.5], [13.5, 109, 12.6]];
const torchMeshes = TORCH_SPOTS.map(([x, y, z]) => { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.BoxGeometry(.12, .6, .12), new THREE.MeshLambertMaterial({ map: solidTex('#6b4a2b') })); s.position.y = .3; g.add(s); const f = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), new THREE.MeshBasicMaterial({ color: 0xffd36a })); f.position.y = .66; g.add(f); g.position.set(x, y, z); g.visible = false; scene.add(g); return g; });
const torchLights = [...Array(4)].map(() => { const l = new THREE.PointLight(0xffb050, 0, 9, 1.4); scene.add(l); return l; });
// cauldron + pointed dripstone (lava farm) and the island portal
const caulG = new THREE.Group(); scene.add(caulG);
{ const m = new THREE.MeshLambertMaterial({ map: T.cauldron }); const wall = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; caulG.add(b); };
  wall(.9, .12, .9, 0, .2, 0); wall(.12, .82, .9, -.39, .41, 0); wall(.12, .82, .9, .39, .41, 0); wall(.9, .82, .12, 0, .41, -.39); wall(.9, .82, .12, 0, .41, .39);
  const lv = new THREE.Mesh(new THREE.PlaneGeometry(.66, .66), new THREE.MeshBasicMaterial({ map: T.lava })); lv.rotation.x = -Math.PI / 2; lv.position.y = .3; caulG.add(lv); caulG.userData.lava = lv; }
caulG.position.set(25.5, 109, 13.5); caulG.visible = false;
const drip = new THREE.Mesh(new THREE.ConeGeometry(.22, .9, 5), new THREE.MeshLambertMaterial({ map: T.dripT })); drip.rotation.x = Math.PI; drip.position.set(25.5, 110.55, 13.5); drip.visible = false; scene.add(drip);
const iPortal = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), portalMat); iPortal.position.set(20, 111.5, 6.5); iPortal.visible = false; scene.add(iPortal);
// enderman (original: tall, thin, purple eyes) and blaze (floating head with orbiting rods)
function makeEnderman() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ map: T.ender }), f = new THREE.MeshLambertMaterial({ map: enderFace, emissive: 0x300040 });
  const mk = (w, h, d, mat, par, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); b.castShadow = true; par.add(b); return b; };
  const head = new THREE.Group(); head.position.y = 2.45; g.add(head); mk(.46, .46, .46, [m, m, m, m, f, m], head, 0, .23, 0); const jaw = mk(.44, .14, .44, m, head, 0, -.04, 0);
  mk(.42, .62, .2, m, g, 0, 2.12, 0);
  const limb = (x, y, len) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); mk(.12, len, .12, m, p, 0, -len / 2, 0); return p; };
  const armL = limb(-.28, 2.4, 1.5), armR = limb(.28, 2.4, 1.5), legL = limb(-.1, 1.82, 1.82), legR = limb(.1, 1.82, 1.82);
  g.visible = false; scene.add(g); return { g, head, jaw, armL, armR, legL, legR, mats: [m, f] };
}
const ENDER = makeEnderman();
function makeBlaze() {
  const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ map: T.blaze }), f = new THREE.MeshBasicMaterial({ map: blazeFace });
  const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), [m, m, m, m, f, m]); head.position.y = 1.5; g.add(head);
  const rods = []; for (let i = 0; i < 10; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .12), m); g.add(r); rods.push(r); }
  g.visible = false; scene.add(g); return { g, head, rods, mats: [m, f] };
}
const BLAZES = [makeBlaze(), makeBlaze()];
const blazeLight = new THREE.PointLight(0xffa030, 0, 8, 1.4); scene.add(blazeLight);
// Nether fortress (nether brick bridge + pillars) near the Nether portal
const NF = { x: NX + 18, y: 46, z: -120 };
{ const c = new Map(), set = (x, y, z) => c.set(k3(x, y, z), 'bricks');
  for (let x = NF.x - 2; x <= NF.x + 2; x++) for (let z = NF.z - 18; z <= NF.z + 14; z++) { set(x, NF.y, z); if (Math.abs(x - NF.x) === 2) set(x, NF.y + 1, z); }
  for (const z of [NF.z - 16, NF.z - 6, NF.z + 4, NF.z + 12]) for (const x of [NF.x - 2, NF.x + 2]) for (let y = 33; y < NF.y; y++) set(x, y, z);
  for (let x = NF.x - 4; x <= NF.x + 4; x++) for (let z = NF.z + 6; z <= NF.z + 14; z++) { set(x, NF.y, z); const edge = Math.abs(x - NF.x) === 4 || z === NF.z + 14; if (edge) for (let y = NF.y + 1; y <= NF.y + 4; y++) if (!((y === NF.y + 2) && (x + z) % 2)) set(x, y, z); }
  cellMeshes(c); }
