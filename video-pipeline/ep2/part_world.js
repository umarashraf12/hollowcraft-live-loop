// ---------- episode 2 world: mine, sky island, extra textures/icons ----------
Object.assign(T, {
  deep: canvasTex(16, (g, n) => { const r = rng(21); jitter(g, n, [74, 74, 82], .25, r); for (let y = 1; y < n; y += 4) { g.fillStyle = 'rgba(38,38,46,.55)'; g.fillRect(0, y + (r() * 2 | 0), 16, 1); } }),
  dore: canvasTex(16, (g, n) => { const r = rng(22); jitter(g, n, [74, 74, 82], .25, r); for (const [x, y] of [[2, 2], [9, 3], [5, 7], [12, 9], [3, 12], [9, 13]]) { g.fillStyle = '#4fe3d8'; g.fillRect(x, y, 2, 2); g.fillStyle = '#d6fffb'; g.fillRect(x, y, 1, 1); g.fillStyle = '#16807b'; g.fillRect(x + 1, y + 1, 1, 1); } }),
  planks: canvasTex(16, (g, n) => { const r = rng(23); jitter(g, n, [178, 136, 84], .16, r); g.fillStyle = 'rgba(92,60,30,.75)'; for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1); for (const [x, y] of [[5, 0], [12, 4], [3, 8], [10, 12]]) g.fillRect(x, y, 1, 3); }),
});
Object.assign(ICON, {
  diamond: canvasTex(16, g => { const P = ['.....XXXXX......', '....XccwcX......', '...XccwwccX.....', '..XcccwccccX....', '..XXXXXXXXXX....', '...XcccccccX....', '....XcccccX.....', '.....XcccX......', '......XcX.......', '.......X........']; P.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') px(g, i + 1, j + 3, ch === 'X' ? '#0e4f4b' : ch === 'w' ? '#e8fffd' : '#4fe3d8'); })); }),
  planks: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (y - 2) % 4 === 3 ? '#7a5228' : '#b88a52'); }),
  rocket: canvasTex(16, g => { line(g, 4, 12, 10, 6, '#b3261e'); line(g, 5, 12, 11, 6, '#e53935'); line(g, 4, 11, 10, 5, '#e53935'); line(g, 11, 4, 12, 3, '#e0e0e0'); px(g, 11, 5, '#e0e0e0'); px(g, 10, 4, '#e0e0e0'); line(g, 2, 14, 4, 12, '#6b4a2b'); px(g, 7, 8, '#ffd84a'); }),
  elytra: canvasTex(16, g => { for (let y = 2; y < 14; y++) { const w = Math.round(lerp(3, 6, (y - 2) / 12)); for (let x = 0; x < w; x++) { px(g, 7 - x, y, x === w - 1 || y === 13 ? '#4a4460' : '#9c92b8'); px(g, 8 + x, y, x === w - 1 || y === 13 ? '#4a4460' : '#9c92b8'); } } line(g, 6, 3, 3, 12, '#6f6690'); line(g, 9, 3, 12, 12, '#6f6690'); }),
  chest: canvasTex(16, g => { for (let y = 3; y < 15; y++) for (let x = 2; x < 14; x++) { const hole = y < 6 && x > 5 && x < 10; const arm = y > 7 && (x < 4 || x > 11); if (!hole && !arm) px(g, x, y, (x === 2 || x === 13 || y === 14) ? '#4b5257' : (y < 6 ? '#e3e8ea' : '#bfc7cb')); } }),
});

// generic face-culled mesher for a cell map {key -> type}; airMode=true emits solid faces that border the air set
const FACES2 = [
  { d: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] }, { d: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { d: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }, { d: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { d: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] }, { d: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }];
const k3 = (x, y, z) => x + ',' + y + ',' + z;
function emitMeshes(faceList, texOf) { // faceList: [x,y,z,f,type]
  const buckets = {};
  for (const [x, y, z, f, type] of faceList) {
    const tex = texOf(type, f); const b = buckets[tex] || (buckets[tex] = { p: [], n: [], uv: [], i: [] }); const base = b.p.length / 3;
    FACES2[f].c.forEach(([cx, cy, cz]) => { b.p.push(x + cx, y + cy, z + cz); b.n.push(...FACES2[f].d); });
    b.uv.push(0, 0, 1, 0, 1, 1, 0, 1); b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  for (const [tex, b] of Object.entries(buckets)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); g.setIndex(b.i);
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: T[tex] })));
  }
}
// --- the mine (x around 200, deep underground; nothing else is out there)
const MX = 200;
const mineAir = new Set(); const air = (x, y, z) => mineAir.add(k3(x, y, z));
for (let i = 0; i <= 12; i++) { const f = -46 - i; for (let y = f; y <= f + 2; y++) air(MX, y, -12 + i); }   // staircase down to Y -58
for (let z = 0; z <= 29; z++) { air(MX, -58, z); air(MX, -57, z); }                                          // main tunnel
for (const bz of [6, 9, 12, 15]) for (let x = MX + 1; x <= MX + 12; x++) { air(x, -58, bz); air(x, -57, bz); } // branches every 3 blocks
for (let x = MX + 1; x <= MX + 7; x++) { air(x, -58, 18); air(x, -57, 18); }                                 // branch being dug on camera
const DIA = [[207, -57, 19], [207, -58, 19], [207, -58, 20]]; DIA.forEach(c => air(...c));
{
  const faces = [];
  const inBox = (x, y, z) => x >= MX - 8 && x <= MX + 16 && y >= -64 && y <= -38 && z >= -18 && z <= 36;
  for (const key of mineAir) {
    const [x, y, z] = key.split(',').map(Number);
    for (let f = 0; f < 6; f++) {
      const [dx, dy, dz] = FACES2[f].d, nx = x + dx, ny = y + dy, nz = z + dz;
      if (!inBox(nx, ny, nz) || mineAir.has(k3(nx, ny, nz))) continue;
      faces.push([nx, ny, nz, f ^ 1, ny <= -61 ? 'stone' : 'deep']); // face of the neighbour that looks back into the air cell
    }
  }
  emitMeshes(faces, t => t);
}
// torches along the tunnels
const torchMat = new THREE.MeshBasicMaterial({ color: 0xffd36a }), stickMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2b });
const TORCHES = [[MX + .13, -56.9, 3.5, 1], [MX + .87, -56.9, 9.5, -1], [MX + .13, -56.9, 15.5, 1], [MX + .87, -56.9, 21.5, -1], [MX + .13, -56.9, 27.5, 1], [MX + 4.5, -56.9, 12.13, 0], [MX + 4.5, -56.9, 18.13, 0], [MX + .5, -45.9, -11.13, 0]];
for (const [x, y, z, s] of TORCHES) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const st = new THREE.Mesh(new THREE.BoxGeometry(.1, .45, .1), stickMat); g.add(st);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(.13, .13, .13), torchMat); fl.position.y = .28; g.add(fl);
  g.rotation.z = s * -.35; if (s === 0) g.rotation.x = .35; scene.add(g);
}
// --- floating island at the end of the bridge
{
  const cells = new Map();
  for (let x = -3; x <= 3; x++) for (let z = 24; z <= 30; z++) {
    const d = Math.max(Math.abs(x), Math.abs(z - 27));
    cells.set(k3(x, 63, z), 'grass'); cells.set(k3(x, 62, z), 'dirt'); if (d <= 2) cells.set(k3(x, 61, z), 'dirt'); if (d <= 1) cells.set(k3(x, 60, z), 'stone'); if (d === 0) cells.set(k3(x, 59, z), 'stone');
  }
  const faces = [];
  for (const [key, type] of cells) { const [x, y, z] = key.split(',').map(Number); for (let f = 0; f < 6; f++) { const [dx, dy, dz] = FACES2[f].d; if (!cells.has(k3(x + dx, y + dy, z + dz))) faces.push([x, y, z, f, type]); } }
  emitMeshes(faces, (t, f) => t === 'grass' ? (f === 2 ? 'grassTop' : f === 3 ? 'dirt' : 'grassSide') : t);
}
