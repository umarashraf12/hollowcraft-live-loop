// ---------- episode 3 world: Nether cavern, glass ice highway, debris tunnel, Overworld portal site ----------
Object.assign(T, {
  netherrack: canvasTex(16, (g, n) => { const r = rng(31); jitter(g, n, [112, 38, 36], .35, r); for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(60,14,14,.6)'; g.fillRect(r() * 16 | 0, r() * 16 | 0, 2 + (r() * 3 | 0), 1); } }),
  obsidian: canvasTex(16, (g, n) => { const r = rng(32); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .7 + r() * .6; g.fillStyle = `rgb(${22*k|0},${14*k|0},${38*k|0})`; g.fillRect(x, y, 1, 1); } for (let i = 0; i < 6; i++) { g.fillStyle = '#4a2a78'; g.fillRect(r() * 15 | 0, r() * 15 | 0, 2, 1); } }),
  lava: canvasTex(16, (g, n) => { const r = rng(33); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .8 ? '#ffe36e' : v > .45 ? '#ff9a1f' : '#e8521a'; g.fillRect(x, y, 1, 1); } }),
  blueice: canvasTex(16, (g, n) => { const r = rng(34); jitter(g, n, [120, 170, 250], .12, r); g.fillStyle = 'rgba(230,245,255,.8)'; for (let i = 0; i < 5; i++) { const x = r() * 12 | 0, y = r() * 12 | 0; g.fillRect(x, y, 3, 1); g.fillRect(x + 2, y + 1, 2, 1); } }),
  debris: canvasTex(16, (g, n) => { const r = rng(35); jitter(g, n, [92, 62, 52], .25, r); g.strokeStyle = '#3a2a24'; g.lineWidth = 1; g.strokeRect(3.5, 3.5, 9, 9); g.strokeRect(6.5, 6.5, 3, 3); g.fillStyle = '#c9a98c'; g.fillRect(4, 4, 2, 1); g.fillRect(10, 11, 2, 1); }),
  bricks: canvasTex(16, (g, n) => { const r = rng(36); jitter(g, n, [58, 26, 32], .2, r); g.fillStyle = '#21090d'; for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) g.fillRect(x, y, 1, 3); }),
  glass: canvasTex(16, g => { g.clearRect(0, 0, 16, 16); g.fillStyle = 'rgba(230,248,255,1)'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(3, 3, 1, 1); g.fillRect(4, 4, 1, 1); g.fillRect(11, 9, 1, 1); g.fillRect(12, 10, 1, 1); }),
  glow: canvasTex(16, (g, n) => { const r = rng(37); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = r(); g.fillStyle = v > .7 ? '#fff3b0' : v > .3 ? '#f2c65a' : '#a8742e'; g.fillRect(x, y, 1, 1); } }),
  portal: canvasTex(32, (g, n) => { const r = rng(38); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const w = Math.sin(x * .45 + Math.sin(y * .3) * 2) * .5 + .5; const k = .55 + w * .45 + r() * .1; g.fillStyle = `rgba(${150*k|0},${40*k|0},${255*k|0},.92)`; g.fillRect(x, y, 1, 1); } }),
  wool: canvasTex(16, (g, n) => jitter(g, n, [180, 30, 36], .15, rng(39))),
  pillow: canvasTex(16, (g, n) => jitter(g, n, [236, 236, 236], .06, rng(40))),
});
T.lava.wrapS = T.lava.wrapT = THREE.RepeatWrapping; T.portal.wrapS = T.portal.wrapT = THREE.RepeatWrapping;
Object.assign(ICON, {
  lavaB: canvasTex(16, g => { for (let y = 5; y <= 14; y++) { const a = Math.round(3 + (y - 5) * .25), b = Math.round(12 - (y - 5) * .25); for (let x = a; x <= b; x++) px(g, x, y, (x === a || x === b || y === 14) ? '#3c4043' : '#a7adb3'); } for (let x = 4; x <= 11; x++) { px(g, x, 5, '#ff7a1a'); px(g, x, 6, '#ffb347'); } line(g, 3, 4, 12, 4, '#3c4043'); line(g, 4, 3, 6, 1, '#3c4043'); line(g, 7, 1, 9, 1, '#3c4043'); line(g, 10, 1, 11, 3, '#3c4043'); }),
  flint: canvasTex(16, g => { line(g, 3, 12, 8, 7, '#8c8c8c'); line(g, 4, 12, 9, 7, '#5c5c5c'); for (const [x, y] of [[9, 3], [10, 3], [11, 4], [11, 5], [10, 6], [9, 6], [8, 5], [8, 4]]) px(g, x, y, '#4a4a4a'); px(g, 9, 4, '#7a7a7a'); px(g, 10, 5, '#7a7a7a'); px(g, 12, 2, '#ffd84a'); px(g, 13, 1, '#ff9a1f'); }),
  bed: canvasTex(16, g => { for (let x = 1; x < 15; x++) { for (let y = 7; y < 11; y++) px(g, x, y, x < 5 ? '#ececec' : '#b41e24'); px(g, x, 11, '#8a6a3c'); } px(g, 1, 12, '#6b4a2b'); px(g, 14, 12, '#6b4a2b'); }),
  debris: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x === 2 || y === 13 || x === 13 || y === 2) ? '#3a2a24' : ((x === 5 || x === 10 || y === 5 || y === 10) && x > 4 && x < 11 && y > 4 && y < 11) ? '#3a2a24' : '#6e4c40'); }),
  scrap: canvasTex(16, g => { for (const [x, y, w] of [[5, 4, 6], [3, 6, 10], [3, 8, 10], [4, 10, 8], [6, 12, 4]]) for (let i = 0; i < w; i++) px(g, x + i, y, (i + y) % 3 ? '#4a3b38' : '#6e5a54'), px(g, x + i, y + 1, '#3a2c2a'); }),
  ingot: canvasTex(16, g => { for (let y = 6; y < 11; y++) for (let x = 2 + (10 - y); x < 14 - (y - 6); x++) px(g, x, y, y === 6 ? '#6a5e60' : '#3b3436'); line(g, 4, 11, 12, 11, '#211c1d'); }),
  gold: canvasTex(16, g => { for (let y = 6; y < 11; y++) for (let x = 2 + (10 - y); x < 14 - (y - 6); x++) px(g, x, y, y === 6 ? '#fff3a6' : '#f2c32e'); line(g, 4, 11, 12, 11, '#a8741a'); }),
  boat: canvasTex(16, g => { for (let x = 1; x < 15; x++) { px(g, x, 9, '#8a6a3c'); px(g, x, 10, '#6b4a2b'); } for (let x = 3; x < 13; x++) px(g, x, 11, '#5a3e22'); line(g, 4, 3, 9, 8, '#6b4a2b'); px(g, 3, 2, '#b88a52'); }),
  blueice: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x + y) % 5 === 0 ? '#e6f4ff' : '#78aaf8'); }),
  fireres: canvasTex(16, g => { for (let y = 6; y < 15; y++) for (let x = 4; x < 12; x++) if (Math.hypot(x - 7.5, y - 10) < 4.6) px(g, x, y, '#f08a24'); for (let y = 2; y < 6; y++) { px(g, 7, y, '#cfe6ff'); px(g, 8, y, '#cfe6ff'); } px(g, 6, 8, '#ffd08a'); }),
  netherrack: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x * 7 + y * 3) % 5 ? '#7a2826' : '#4e1414'); }),
});
const EMISSIVE_TEX = new Set(['lava', 'glow']);
function finishMeshes(ms) { ms.forEach(m => { const tex = Object.keys(T).find(k => T[k] === m.material.map); if (EMISSIVE_TEX.has(tex)) m.material = new THREE.MeshBasicMaterial({ map: T[tex] }); if (tex === 'glass') { m.material.transparent = true; m.material.alphaTest = .5; m.material.side = THREE.DoubleSide; } }); return ms; }
function cellMeshes(cells, texOf = (t, f) => t) { // generic face-culled set {key->type}
  const faces = [];
  for (const [key, type] of cells) { const [x, y, z] = key.split(',').map(Number); for (let f = 0; f < 6; f++) { const [dx, dy, dz] = FACES2[f].d; const nb = cells.get(k3(x + dx, y + dy, z + dz)); if (!nb || (nb === 'glass') !== (type === 'glass')) faces.push([x, y, z, f, type]); } }
  return finishMeshes(emitMeshes(faces, texOf));
}

// --- Nether cavern around x=-300 (open lava ocean, floor + ceiling heightmaps)
const NX = -300;
const netherFloor = (x, z) => {
  let h = 24 + Math.round(fbm(x * .05 + 3, z * .05 - 9) * 14);
  const plat = (cz, r) => clamp(1 - (Math.hypot(x - NX, z - cz) - r) / 6);
  return Math.round(lerp(h, 40, Math.max(plat(-140, 9), plat(158, 9))));
};
const netherCeil = (x, z) => 78 + Math.round(fbm(x * .07 - 5, z * .07 + 2) * 12) - (hash2(x, z) > .93 ? 4 : 0);
{
  const faces = [], NF = new Map(), NC = new Map();
  for (let x = NX - 46; x <= NX + 46; x++) for (let z = -175; z <= 175; z++) { NF.set(hk(x, z), netherFloor(x, z)); NC.set(hk(x, z), netherCeil(x, z)); }
  const fAt = (x, z) => NF.get(hk(x, z)) ?? 40, cAt = (x, z) => NC.get(hk(x, z)) ?? 70;
  for (let x = NX - 46; x <= NX + 46; x++) for (let z = -175; z <= 175; z++) {
    const h = fAt(x, z);
    faces.push([x, h, z, 2, 'netherrack']);
    for (let f = 0; f < 6; f++) { if (f === 2 || f === 3) continue; const [dx, , dz] = FACES2[f].d; const nh = fAt(x + dx, z + dz); for (let y = nh + 1; y <= h; y++) faces.push([x, y, z, f, 'netherrack']); }
    const c = cAt(x, z), glow = hash2(x * 3, z * 5) > .985;
    faces.push([x, c, z, 3, glow ? 'glow' : 'netherrack']);
    for (let f = 0; f < 6; f++) { if (f === 2 || f === 3) continue; const [dx, , dz] = FACES2[f].d; const nc = cAt(x + dx, z + dz); for (let y = c; y < nc; y++) faces.push([x, y, z, f, 'netherrack']); }
  }
  finishMeshes(emitMeshes(faces, t => t));
}
const lavaSea = new THREE.Mesh(new THREE.PlaneGeometry(100, 360), new THREE.MeshBasicMaterial({ map: T.lava }));
lavaSea.rotation.x = -Math.PI / 2; lavaSea.position.set(NX, 32.9, 0); T.lava.repeat.set(1, 1); scene.add(lavaSea);
const lavaSeaTex = T.lava.clone(); lavaSeaTex.needsUpdate = true; lavaSeaTex.repeat.set(100, 360); lavaSea.material.map = lavaSeaTex;
// --- glass-walled blue-ice highway over the lava, z -128..150
const HW = { y: 44, z0: -128, z1: 150, gap0: -112, gap1: -93 };
{
  const cells = new Map();
  for (let z = HW.z0; z <= HW.z1; z++) {
    for (let x = NX - 2; x <= NX + 2; x++) { cells.set(k3(x, HW.y, z), x === NX ? 'blueice' : 'bricks'); cells.set(k3(x, HW.y + 3, z), x === NX && z % 6 === 0 ? 'glow' : 'bricks'); }
    for (const x of [NX - 2, NX + 2]) { cells.set(k3(x, HW.y + 1, z), 'bricks'); cells.set(k3(x, HW.y + 2, z), 'glass'); }
    if (z % 24 === 0) for (let y = 30; y < HW.y; y++) cells.set(k3(NX, y, z), 'bricks');
    if (z >= HW.gap0 && z <= HW.gap1) cells.delete(k3(NX, HW.y, z)); // gap filled by blue ice on camera
  }
  // platforms + nether portal at the start
  for (const [cz, zz] of [[-140, -131], [158, 151]]) for (let x = NX - 3; x <= NX + 3; x++) for (let z = Math.min(cz - 3, zz); z <= Math.max(cz + 3, zz); z++) cells.set(k3(x, 40, z), 'bricks');
  for (const [x, y] of [[NX - 1, 41], [NX, 41], [NX - 2, 42], [NX + 1, 42], [NX - 2, 43], [NX + 1, 43], [NX - 2, 44], [NX + 1, 44], [NX - 1, 45], [NX, 45]]) cells.set(k3(x, y, -143), 'obsidian');
  cellMeshes(cells);
}
// --- debris tunnel at Y 15 (sealed box at x=-450)
const DXX = -450;
const debAir = new Set(); const dAir = (x, y, z) => debAir.add(k3(x, y, z));
for (let z = 0; z <= 24; z++) { dAir(DXX, 15, z); dAir(DXX, 16, z); }
const BLAST_C = V(DXX + .5, 16.0, 23.5), BLAST = [];
for (let x = DXX - 3; x <= DXX + 3; x++) for (let y = 12; y <= 20; y++) for (let z = 20; z <= 27; z++) { const d = V(x + .5, y + .5, z + .5).distanceTo(BLAST_C); if (d <= 2.6 && !debAir.has(k3(x, y, z))) { BLAST.push([x, y, z]); dAir(x, y, z); } }
const DEBRIS = [[DXX + 3, 15, 23], [DXX - 2, 16, 25], [DXX, 13, 24]];
{
  const faces = [], deb = new Set(DEBRIS.map(c => k3(...c)));
  const inBox = (x, y, z) => x >= DXX - 8 && x <= DXX + 8 && y >= 6 && y <= 26 && z >= -4 && z <= 32;
  for (const key of debAir) { const [x, y, z] = key.split(',').map(Number);
    for (let f = 0; f < 6; f++) { const [dx, dy, dz] = FACES2[f].d, nx = x + dx, ny = y + dy, nz = z + dz; if (!inBox(nx, ny, nz) || debAir.has(k3(nx, ny, nz))) continue; faces.push([nx, ny, nz, f ^ 1, deb.has(k3(nx, ny, nz)) ? 'debris' : 'netherrack']); } }
  finishMeshes(emitMeshes(faces, t => t));
}
// --- Overworld portal site at the flat field (x 40, z 36) with a dirt mold behind the frame
const PFRAME = [[39, 9], [40, 9], [38, 10], [41, 10], [38, 11], [41, 11], [38, 12], [41, 12], [39, 13], [40, 13]];
const PZ = 36;
{
  const cells = new Map();
  for (let x = 37; x <= 42; x++) for (let y = 9; y <= 14; y++) cells.set(k3(x, y, PZ + 1), 'dirt');
  cells.set(k3(35, 9, 33), 'obsidian');
  cellMeshes(cells);
}
