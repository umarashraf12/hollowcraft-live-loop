// ---------- gameplay look: textures, icons, island mesher with ambient occlusion, skeleton, chest, block highlight/crack ----------
Object.assign(T, {
  leavesA: canvasTex(16, g => { const r = rng(81); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const v = r(); if (v < .12) continue; const k = .6 + r() * .55; g.fillStyle = `rgb(${50 * k | 0},${128 * k | 0},${42 * k | 0})`; g.fillRect(x, y, 1, 1); } }),
  cobble: canvasTex(16, (g, n) => { const r = rng(82); jitter(g, n, [118, 118, 120], .18, r); g.fillStyle = 'rgba(60,60,64,.85)'; for (const [x, y, w, h] of [[0, 4, 7, 1], [6, 0, 1, 5], [9, 3, 7, 1], [3, 9, 9, 1], [12, 4, 1, 6], [2, 5, 1, 5], [7, 10, 1, 6], [0, 13, 7, 1], [11, 13, 5, 1]]) g.fillRect(x, y, w, h); g.fillStyle = 'rgba(170,170,174,.6)'; for (let i = 0; i < 8; i++) g.fillRect(r() * 15 | 0, r() * 15 | 0, 2, 1); }),
  iceB: canvasTex(16, (g, n) => { jitter(g, n, [150, 190, 250], .1, rng(83)); g.fillStyle = 'rgba(240,250,255,.85)'; g.fillRect(2, 3, 5, 1); g.fillRect(9, 10, 4, 1); g.fillRect(11, 2, 1, 4); }),
  chestF: canvasTex(16, (g, n) => { jitter(g, n, [168, 116, 56], .15, rng(84)); g.fillStyle = '#4a2e14'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(0, 6, 16, 1); g.fillStyle = '#d0d0d0'; g.fillRect(7, 5, 2, 4); g.fillStyle = '#6a6a6a'; g.fillRect(7, 8, 2, 1); }),
  chestS: canvasTex(16, (g, n) => { jitter(g, n, [150, 102, 50], .15, rng(85)); g.fillStyle = '#4a2e14'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(0, 6, 16, 1); }),
  bone: canvasTex(16, (g, n) => jitter(g, n, [222, 220, 206], .08, rng(86))),
  boneD: canvasTex(16, (g, n) => jitter(g, n, [160, 158, 150], .1, rng(87))),
});
Object.assign(ICON, {
  sapling: canvasTex(16, g => { line(g, 8, 15, 8, 8, '#6b4a2b'); for (const [x, y] of [[5,4],[6,4],[7,3],[8,3],[9,3],[10,4],[11,4],[4,5],[5,5],[6,6],[7,6],[9,6],[10,6],[11,5],[12,5],[6,7],[7,8],[9,8],[10,7],[8,5],[8,6],[7,5],[9,5]]) px(g, x, y, (x + y) % 3 ? '#3f9a34' : '#2a7424'); }),
  seeds: canvasTex(16, g => { for (const [x, y] of [[5,6],[8,5],[10,8],[6,10],[9,11],[12,6],[4,9],[11,11]]) { px(g, x, y, '#5aa83a'); px(g, x + 1, y, '#3a7a2a'); } }),
  bone: canvasTex(16, g => { line(g, 4, 12, 11, 5, '#e8e6da'); line(g, 5, 12, 12, 5, '#c8c6b8'); for (const [x, y] of [[2,12],[3,13],[3,11],[4,14],[12,3],[13,4],[11,2],[14,5]]) px(g, x, y, '#e8e6da'); }),
  cobble: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x * 7 + y * 5) % 6 < 2 ? '#5c5c60' : '#8e8e92'); }),
  ice: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, (x + y) % 6 === 0 ? '#f0f8ff' : '#9cc4f8'); }),
  lavaB: ICON.lavaB, wsword: canvasTex(16, g => { for (let i = 0; i < 9; i++) { px(g, 5 + i, 10 - i, '#c8c8cc'); px(g, 6 + i, 10 - i, '#9a9aa0'); px(g, 5 + i, 9 - i, '#6a6a70'); } line(g, 3, 9, 7, 13, '#4a3b2a'); line(g, 2, 12, 4, 14, '#6b4a2b'); px(g, 1, 14, '#3a2a1a'); }),
});
// island mesher with per-vertex ambient occlusion (soft corner shading like smooth lighting)
const AO_LEVEL = [.42, .62, .8, 1];
const SOLID = t => !!t && t !== 'leavesA';
function aoMesh(cells, texOf, mats, group) {
  const buckets = {};
  const solidAt = (x, y, z) => SOLID(cells.get(k3(x, y, z)));
  for (const [key, type] of cells) {
    const [x, y, z] = key.split(',').map(Number);
    for (let f = 0; f < 6; f++) {
      const F = FACES2[f], [dx, dy, dz] = F.d, nb = cells.get(k3(x + dx, y + dy, z + dz));
      if (nb && SOLID(nb) && SOLID(type)) continue; if (nb && nb === type && type === 'leavesA') continue;
      const tex = texOf(type, f), b = buckets[tex] || (buckets[tex] = { p: [], n: [], uv: [], c: [], i: [] }), base = b.p.length / 3;
      const axes = [0, 1, 2].filter(a => F.d[a] === 0), aos = [];
      F.c.forEach(cc => { b.p.push(x + cc[0], y + cc[1], z + cc[2]); b.n.push(dx, dy, dz);
        const o = [x + dx, y + dy, z + dz], s = axes.map(a => cc[a] ? 1 : -1);
        const p1 = o.slice(), p2 = o.slice(), p3 = o.slice(); p1[axes[0]] += s[0]; p2[axes[1]] += s[1]; p3[axes[0]] += s[0]; p3[axes[1]] += s[1];
        const s1 = solidAt(...p1), s2 = solidAt(...p2), c3 = solidAt(...p3), ao = s1 && s2 ? 0 : 3 - (s1 + s2 + c3); const v = AO_LEVEL[ao]; aos.push(ao); b.c.push(v, v, v); });
      b.uv.push(0, 0, 1, 0, 1, 1, 0, 1);
      if (aos[0] + aos[2] < aos[1] + aos[3]) b.i.push(base + 1, base + 2, base + 3, base + 1, base + 3, base); else b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  group.children.forEach(m => m.geometry.dispose()); group.clear();
  for (const [tex, b] of Object.entries(buckets)) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.c, 3)); g.setIndex(b.i);
    if (!mats[tex]) { const m = tex === 'lava' ? new THREE.MeshBasicMaterial({ map: T.lava, vertexColors: false }) : new THREE.MeshLambertMaterial({ map: T[tex], vertexColors: true }); if (tex === 'leavesA') { m.alphaTest = .5; m.transparent = false; m.side = THREE.DoubleSide; } mats[tex] = m; }
    const mesh = new THREE.Mesh(g, mats[tex]); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  }
}
const islandG = new THREE.Group(); scene.add(islandG); const ISL_MATS = {}; window.__ISLM = ISL_MATS; window.__ISLG = islandG; window.__R = renderer;
const C0 = { x: 20, y: 108, z: 10 };
const ISLAND_BASE = new Map();
{ const set = (x, y, z, t) => ISLAND_BASE.set(k3(x, y, z), t);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue; set(C0.x + dx, C0.y, C0.z + dz, 'grass'); if (Math.abs(dx) + Math.abs(dz) <= 3) set(C0.x + dx, C0.y - 1, C0.z + dz, 'dirt'); if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) set(C0.x + dx, C0.y - 2, C0.z + dz, 'dirt'); }
  for (const dz of [-1, 0, 1]) { set(C0.x + 3, C0.y, C0.z + dz, 'grass'); set(C0.x + 3, C0.y - 1, C0.z + dz, 'dirt'); }
  set(C0.x, C0.y - 3, C0.z, 'stone'); set(C0.x + 1, C0.y - 3, C0.z, 'stone'); set(C0.x, C0.y - 4, C0.z, 'stone'); set(C0.x, C0.y - 3, C0.z - 1, 'dirt'); }
const islTex = (t, f) => t === 'grass' ? (f === 2 ? 'grassTop' : f === 3 ? 'dirt' : 'grassSide') : t === 'log' ? (f === 2 || f === 3 ? 'logTop' : 'logSide') : t === 'craft' ? (f === 2 ? 'craftTop' : f === 3 ? 'planks' : 'craftSide') : t === 'ice' ? 'iceB' : t;
function treeCells(x, z, y0, h = 4) { const out = []; for (let y = y0; y < y0 + h; y++) out.push([x, y, z, 'log']); const top = y0 + h - 1; for (let dy = -1; dy <= 1; dy++) { const r = dy === 1 ? 1 : 2; for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { if (Math.abs(dx) === r && Math.abs(dz) === r && (dx + dz + dy) % 2) continue; if (dx === 0 && dz === 0 && dy <= 0) continue; out.push([x + dx, top + dy, z + dz, 'leavesA']); } } out.push([x, top + 2, z, 'leavesA']); return out; }
// chest model with lid
const chestG = new THREE.Group(); scene.add(chestG);
const chestLid = new THREE.Group();
{ const m = [lamT('chestS'), lamT('chestS'), lamT('chestS'), lamT('chestS'), lamT('chestF'), lamT('chestS')]; const body = new THREE.Mesh(new THREE.BoxGeometry(.88, .62, .88), m); body.position.y = .31; chestG.add(body);
  chestLid.position.set(0, .62, -.44); chestG.add(chestLid); const lid = new THREE.Mesh(new THREE.BoxGeometry(.88, .26, .88), [lamT('chestS'), lamT('chestS'), lamT('chestS'), lamT('chestS'), lamT('chestS'), lamT('chestS')]); lid.position.set(0, .13, .44); chestLid.add(lid);
  chestG.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
// skeleton (original model: thin bone limbs)
function makeSkeleton() {
  const g = new THREE.Group(), b = new THREE.MeshLambertMaterial({ map: T.bone }), d = new THREE.MeshLambertMaterial({ map: T.boneD });
  const face = canvasTex(8, gg => { jitter(gg, 8, [222, 220, 206], .08, rng(88)); gg.fillStyle = '#1a1a1a'; gg.fillRect(1, 3, 2, 2); gg.fillRect(5, 3, 2, 2); gg.fillRect(3, 5, 2, 1); gg.fillRect(2, 6, 4, 1); });
  const mk = (w, h, dd, mat, par, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat); m.position.set(x, y, z); m.castShadow = true; par.add(m); return m; };
  const head = new THREE.Group(); head.position.y = 1.36; g.add(head); mk(.45, .45, .45, [b, b, b, b, new THREE.MeshLambertMaterial({ map: face }), b], head, 0, .225, 0);
  mk(.42, .68, .2, d, g, 0, 1.02, 0); mk(.36, .08, .22, b, g, 0, 1.2, 0); mk(.36, .08, .22, b, g, 0, 1.0, 0);
  const limb = (x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); mk(.11, .68, .11, b, p, 0, -.34, 0); return p; };
  const armL = limb(-.28, 1.34), armR = limb(.28, 1.34), legL = limb(-.1, .68), legR = limb(.1, .68);
  const bow = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshLambertMaterial({ map: ICON.bow, transparent: true, alphaTest: .5, side: THREE.DoubleSide })); bow.position.set(0, -.62, .18); bow.rotation.set(0, Math.PI / 2, 0); armL.add(bow);
  g.visible = false; scene.add(g); return { g, head, armL, armR, legL, legR };
}
const SKEL = makeSkeleton();
// block highlight + breaking cracks + held block in first person
const hlBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: .75 })); hlBox.visible = false; scene.add(hlBox);
const CRACKS = [...Array(10)].map((_, s) => canvasTex(16, g => { g.clearRect(0, 0, 16, 16); const r = rng(500); g.fillStyle = 'rgba(0,0,0,.72)'; const n = (s + 1) * 7; for (let i = 0; i < n; i++) { let x = 8, y = 8; const a = r() * 6.28; for (let j = 0; j < 2 + (r() * (2 + s)) | 0; j++) { x += Math.cos(a + (r() - .5)) * 1.3; y += Math.sin(a + (r() - .5)) * 1.3; } g.fillRect(Math.round(x), Math.round(y), 1, 1); } }));
const crackMat = new THREE.MeshBasicMaterial({ map: CRACKS[0], transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
const crackBox = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), crackMat); crackBox.visible = false; scene.add(crackBox);
const fpBlock = new THREE.Mesh(new THREE.BoxGeometry(.32, .32, .32), lamT('cobble')); fpBlock.material.depthTest = false; fpBlock.renderOrder = 11; fpBlock.visible = false; fp.add(fpBlock);
const BLOCK_ITEMS = { cobble: 'cobble', ice: 'iceB', craft: 'craftSide', grassB: 'dirt' };
