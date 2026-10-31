// ---------- episode 4 world: a small village by the cliff ----------
Object.assign(T, {
  cobble: canvasTex(16, (g, n) => { const r = rng(41); jitter(g, n, [118, 118, 118], .3, r); g.fillStyle = 'rgba(60,60,60,.7)'; for (let i = 0; i < 12; i++) { const x = r() * 14 | 0, y = r() * 14 | 0; g.fillRect(x, y, 3, 1); g.fillRect(x, y, 1, 3); } }),
  lecternTop: canvasTex(16, (g, n) => { jitter(g, n, [176, 134, 82], .15, rng(42)); g.fillStyle = '#ece6d6'; g.fillRect(3, 4, 10, 8); g.fillStyle = '#7a3b2e'; g.fillRect(7, 4, 2, 8); g.fillStyle = '#9a9a9a'; for (let y = 5; y < 12; y += 2) { g.fillRect(4, y, 2, 1); g.fillRect(10, y, 2, 1); } }),
  lecternSide: canvasTex(16, (g, n) => { jitter(g, n, [150, 112, 66], .18, rng(43)); g.fillStyle = 'rgba(80,50,24,.8)'; g.fillRect(0, 3, 16, 1); g.fillRect(0, 12, 16, 1); g.fillRect(6, 4, 4, 8); }),
  fletchTop: canvasTex(16, (g, n) => { jitter(g, n, [214, 196, 140], .12, rng(44)); g.fillStyle = '#5a4a32'; g.fillRect(2, 7, 12, 1); g.fillStyle = '#e0e0e0'; g.fillRect(10, 3, 1, 5); g.fillRect(11, 4, 1, 3); g.fillStyle = '#4a4a4a'; g.fillRect(3, 6, 2, 2); }),
  fletchSide: canvasTex(16, (g, n) => { jitter(g, n, [176, 134, 82], .16, rng(45)); g.fillStyle = '#d8c48c'; g.fillRect(0, 0, 16, 3); g.fillStyle = 'rgba(80,50,24,.8)'; g.fillRect(3, 5, 10, 1); }),
  glass: canvasTex(16, g => { g.clearRect(0, 0, 16, 16); g.fillStyle = 'rgba(230,248,255,1)'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16); g.fillRect(3, 3, 1, 1); g.fillRect(4, 4, 1, 1); }),
});
function pxArt(rows, pal) { return canvasTex(16, g => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) px(g, i, j, pal[ch]); }))); }
Object.assign(ICON, {
  emerald: pxArt(['......XX........', '.....XggX.......', '....XgwggX......', '...XgwggggX.....', '..XggggggggX....', '..XggggggggX....', '...XggggggX.....', '....XggggX......', '.....XggX.......', '......XX........'].map(r => '................'.slice(0, 0) + r), { X: '#0b4f2a', g: '#2fd06a', w: '#c8ffd8' }),
  ebook: pxArt(['', '', '...XXXXXXXXX....', '...XpppppppX....', '...XpwpppppX....', '...XpppppppX....', '...XpppppppX....', '...XpppppppX....', '...XpppppppX....', '...XXXXXXXXX....', '....ttttttt.....'], { X: '#3a1a5a', p: '#a35bff', w: '#f3d9ff', t: '#e8e0c8' }),
  gapple: pxArt(['', '.......bb.......', '......b.........', '....XXXXXXX.....', '...XyyywyyyX....', '...XyywyyyyX....', '...XyyyyyyyX....', '...XyyyyyyyX....', '....XyyyyyX.....', '.....XXXXX......'], { X: '#7a5a10', y: '#ffd23e', w: '#fff6c0', b: '#5a3a1a' }),
  potion: pxArt(['', '.......cc.......', '.......gg.......', '......XggX......', '.....XppppX.....', '....XppwpppX....', '....XpppppppX...', '....XpppppppX...', '.....XpppppX....', '......XXXXX.....'], { X: '#2a2a3a', p: '#6f6f8a', w: '#d8d8f0', g: '#cfe6ff', c: '#8a6a3c' }),
  stick: pxArt(['', '', '...........XX...', '..........XbX...', '.........XbX....', '........XbX.....', '.......XbX......', '......XbX.......', '.....XbX........', '....XbX.........', '....XX..........'], { X: '#3a2814', b: '#8a6a3c' }),
  log: pxArt(['', '..XXXXXXXXXXX...', '..XbbbbbbbbbX...', '..XbttttttbbX...', '..XbtXXXXtbbX...', '..XbtXrrXtbbX...', '..XbtXXXXtbbX...', '..XbttttttbbX...', '..XbbbbbbbbbX...', '..XXXXXXXXXXX...'], { X: '#3a2814', b: '#6b4a2b', t: '#b88a52', r: '#8a6a3c' }),
  axe: pxArt(['', '.......XXX......', '......XiiiX.....', '.....XiiiiX.....', '.....XiibX......', '......XXbX......', '.......bX.......', '......bX........', '.....bX.........', '....bX..........'], { X: '#3a3a3a', i: '#d8d8d8', b: '#8a6a3c' }),
  lectern: pxArt(['', '...XXXXXXXXX....', '...XwwwrwwwX....', '...XXXXXXXXX....', '.....XbbbX......', '.....XbbbX......', '.....XbbbX......', '...XXXXXXXXX....', '...XbbbbbbbX....', '...XXXXXXXXX....'], { X: '#3a2814', w: '#ece6d6', r: '#7a3b2e', b: '#b88a52' }),
  fletch: pxArt(['', '..XXXXXXXXXX....', '..XyyyyyyyyX....', '..XyyfyyyyyX....', '..XXXXXXXXXX....', '..XbbbbbbbbX....', '..XbXXXXXXbX....', '..XbbbbbbbbX....', '..XbbbbbbbbX....', '..XXXXXXXXXX....'], { X: '#3a2814', y: '#d8c48c', f: '#e0e0e0', b: '#b88a52' }),
  helmet: pxArt(['', '', '....XXXXXXX.....', '...XiiiiiiiX....', '...XiwiiiiiX....', '...XiiXXXiiX....', '...XiX...XiX....', '...XX.....XX....'], { X: '#4b5257', i: '#bfc7cb', w: '#eef2f3' }),
  legs: pxArt(['', '...XXXXXXXX.....', '...XiiiiiiX.....', '...XiiiiiiX.....', '...XiiXXiiX.....', '...XiiX.XiiX....', '...XiiX..XiiX...', '...XiiX..XiiX...', '...XXXX..XXXX...'], { X: '#4b5257', i: '#bfc7cb' }),
  composter: pxArt(['', '..XXXXXXXXXX....', '..XbXggggXbX....', '..XbXggggXbX....', '..XbXXXXXXbX....', '..XbbbbbbbbX....', '..XbXbXbXbbX....', '..XbbbbbbbbX....', '..XXXXXXXXXX....'], { X: '#3a2814', b: '#9a7a4a', g: '#6aa83a' }),
  smoker: pxArt(['', '..XXXXXXXXXX....', '..XllllllllX....', '..XXXXXXXXXX....', '..XssssssssX....', '..XsXXXXXXsX....', '..XsXffffXsX....', '..XsXXXXXXsX....', '..XssssssssX....', '..XXXXXXXXXX....'], { X: '#2a2a2a', l: '#6b4a2b', s: '#7a7a7a', f: '#ff9a1f' }),
});
const EMISSIVE_TEX = new Set();
function finishMeshes(ms) { ms.forEach(m => { const tex = Object.keys(T).find(k => T[k] === m.material.map); if (tex === 'glass') { m.material.transparent = true; m.material.alphaTest = .5; m.material.side = THREE.DoubleSide; } }); return ms; }
function cellMeshes(cells, texOf = (t, f) => t) {
  const faces = [];
  for (const [key, type] of cells) { const [x, y, z] = key.split(',').map(Number); for (let f = 0; f < 6; f++) { const [dx, dy, dz] = FACES2[f].d; const nb = cells.get(k3(x + dx, y + dy, z + dz)); if (!nb || (nb === 'glass') !== (type === 'glass')) faces.push([x, y, z, f, type]); } }
  return finishMeshes(emitMeshes(faces, texOf));
}
const VTEX = (t, f) => t === 'log' ? (f === 2 || f === 3 ? 'logTop' : 'logSide') : t === 'fletch' ? (f === 2 ? 'fletchTop' : 'fletchSide') : t;
// static village props
const PEN = { x0: -7, x1: -3, z0: -13, z1: -9 };
{
  const c = new Map(), set = (x, y, z, t) => c.set(k3(x, y, z), t);
  for (let x = PEN.x0; x <= PEN.x1; x++) for (let z = PEN.z0; z <= PEN.z1; z++) {
    const wall = (x === PEN.x0 || x === PEN.x1 || z === PEN.z0) && !(z === PEN.z1);
    if (wall) { set(x, 9, z, 'cobble'); set(x, 10, z, 'cobble'); }
    set(x, 11, z, 'planks');
  }
  for (const x of [PEN.x0, PEN.x1]) { set(x, 9, PEN.z1, 'log'); set(x, 10, PEN.z1, 'log'); }
  // house
  for (let x = 3; x <= 9; x++) for (let z = -18; z <= -15; z++) for (let y = 9; y <= 12; y++) {
    const edgeX = x === 3 || x === 9, edgeZ = z === -18 || z === -15;
    if (y === 12) { set(x, y, z, 'planks'); continue; }
    if (!(edgeX || edgeZ)) continue;
    if (edgeX && edgeZ) { set(x, y, z, 'log'); continue; }
    if (y === 9) { set(x, y, z, 'cobble'); continue; }
    if (z === -15 && x === 6 && y <= 11) continue;           // door
    if (y === 10 && z === -15 && (x === 4 || x === 8)) { set(x, y, z, 'glass'); continue; }
    set(x, y, z, 'planks');
  }
  for (let x = 2; x <= 10; x++) for (let z = -19; z <= -14; z++) set(x, 13, z, 'log');
  cellMeshes(c, VTEX);
}
// tree to chop (logs are dynamic, leaves static)
const TREE = { x: 11, z: -4, h: 5 };
{
  const c = new Map();
  for (let dy = 3; dy <= 6; dy++) { const r = dy >= 6 ? 1 : 2; for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { if (Math.abs(dx) === r && Math.abs(dz) === r && dy !== 4) continue; if (dx === 0 && dz === 0 && dy <= TREE.h) continue; c.set(k3(TREE.x + dx, 9 + dy, TREE.z + dz), 'leaves'); } }
  cellMeshes(c);
}
// villagers
const VSTYLE = {
  unemployed: { skin: '#b98a6a', robe: '#7a5a3a', trim: '#5a3e22', hat: null, zombie: false },
  librarian: { skin: '#b98a6a', robe: '#e8e2d2', trim: '#a8322a', hat: '#8a5a2a', zombie: false },
  fletcher: { skin: '#b98a6a', robe: '#5a6a32', trim: '#c8b078', hat: '#8a6a3c', zombie: false },
  armorer: { skin: '#b98a6a', robe: '#4a4a52', trim: '#1e1e22', hat: null, zombie: false },
  zombie: { skin: '#5e8a4e', robe: '#5a4430', trim: '#3a2a1a', hat: null, zombie: true },
};
const texCache = {};
const ctex = c => texCache[c] || (texCache[c] = solidTex(c));
function vFace(st) {
  return canvasTex(8, g => { g.fillStyle = st.skin; g.fillRect(0, 0, 8, 8); g.fillStyle = st.zombie ? '#2a3a22' : '#3a2a1a'; g.fillRect(1, 2, 6, 1);
    g.fillStyle = '#fff'; g.fillRect(1, 3, 2, 1); g.fillRect(5, 3, 2, 1); g.fillStyle = st.zombie ? '#ff3030' : '#2e8a3a'; g.fillRect(2, 3, 1, 1); g.fillRect(5, 3, 1, 1); });
}
const faceCache = {};
function makeVillager() {
  const g = new THREE.Group(), mats = {};
  const M = k => (mats[k] = new THREE.MeshLambertMaterial({ map: ctex('#888') }));
  const skin = M('skin'), robe = M('robe'), trim = M('trim'), face = M('face'), hat = M('hat');
  const mk = (w, h, d, m, p, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); p.add(b); return b; };
  const body = new THREE.Group(); g.add(body);
  mk(.22, .55, .22, trim, body, -.12, .28, 0); mk(.22, .55, .22, trim, body, .12, .28, 0);
  mk(.5, .9, .32, robe, body, 0, 1.0, 0); mk(.52, .25, .34, trim, body, 0, .62, 0);
  const headP = new THREE.Group(); headP.position.y = 1.45; body.add(headP);
  mk(.5, .62, .5, [skin, skin, skin, skin, face, skin], headP, 0, .31, 0);
  mk(.12, .26, .12, skin, headP, 0, .14, .3);
  const hatM = mk(.62, .1, .62, hat, headP, 0, .66, 0); const hatTop = mk(.4, .14, .4, hat, headP, 0, .76, 0);
  const arms = new THREE.Group(); arms.position.set(0, 1.12, .2); body.add(arms);
  mk(.62, .2, .22, robe, arms, 0, 0, 0); mk(.22, .2, .24, skin, arms, 0, -.02, .02);
  const armL = new THREE.Group(), armR = new THREE.Group(); armL.position.set(-.33, 1.35, 0); armR.position.set(.33, 1.35, 0); body.add(armL, armR);
  mk(.2, .6, .2, robe, armL, 0, -.25, 0); mk(.2, .6, .2, robe, armR, 0, -.25, 0);
  scene.add(g);
  const v = { g, body, headP, arms, armL, armR, hatM, hatTop, mats, style: null,
    setStyle(name) { if (v.style === name) return; v.style = name; const st = VSTYLE[name];
      mats.skin.map = ctex(st.skin); mats.robe.map = ctex(st.robe); mats.trim.map = ctex(st.trim); mats.face.map = faceCache[name] || (faceCache[name] = vFace(st));
      if (st.hat) mats.hat.map = ctex(st.hat); hatM.visible = hatTop.visible = !!st.hat; arms.visible = !st.zombie; armL.visible = armR.visible = st.zombie; } };
  v.setStyle('unemployed'); return v;
}
const VA = makeVillager(), VB = makeVillager(), VC = makeVillager();
