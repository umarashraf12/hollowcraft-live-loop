// HollowCraft "2 tricks" sample — deterministic voxel renderer.
// window.renderFrame(t) draws the frame at video time t (seconds) and returns a JPEG data URL.
import * as THREE from './node_modules/three/build/three.module.js';

const W = 1920, H = 1080;
const CAPS = await (await fetch('./caps.json')).json();

// ---------- utils ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eOutC = k => 1 - Math.pow(1 - k, 3);
const eInQ = k => k * k;
const eIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const eOutBack = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const deg = d => d * Math.PI / 180;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash2(x, z) { let h = x * 374761393 + z * 668265263; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const s = k => k * k * (3 - 2 * k);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return lerp(lerp(a, b, s(xf)), lerp(c, d, s(xf)), s(zf));
}
const fbm = (x, z) => vnoise(x, z) * .6 + vnoise(x * 2.1, z * 2.1) * .3 + vnoise(x * 4.3, z * 4.3) * .1;

// ---------- pixel textures ----------
function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  t.userData.canvas = c; return t;
}
function jitter(g, n, base, amt, r) {
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = 1 + (r() - .5) * amt;
    g.fillStyle = `rgb(${clamp(base[0] * k, 0, 255)|0},${clamp(base[1] * k, 0, 255)|0},${clamp(base[2] * k, 0, 255)|0})`;
    g.fillRect(x, y, 1, 1);
  }
}
const T = {
  grassTop: canvasTex(16, (g, n) => jitter(g, n, [98, 168, 64], .35, rng(1))),
  grassSide: canvasTex(16, (g, n) => { const r = rng(2); jitter(g, n, [134, 96, 67], .3, r); for (let x = 0; x < n; x++) { const d = 3 + (r() * 2 | 0); for (let y = 0; y < d; y++) { const k = 1 + (r() - .5) * .3; g.fillStyle = `rgb(${98*k|0},${168*k|0},${64*k|0})`; g.fillRect(x, y, 1, 1); } } }),
  dirt: canvasTex(16, (g, n) => jitter(g, n, [134, 96, 67], .35, rng(3))),
  stone: canvasTex(16, (g, n) => { const r = rng(4); jitter(g, n, [125, 125, 128], .25, r); for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(70,70,75,.55)'; g.fillRect(r() * 16 | 0, r() * 16 | 0, 2 + (r() * 3 | 0), 1); } }),
  logSide: canvasTex(16, (g, n) => { const r = rng(5); jitter(g, n, [104, 80, 50], .3, r); for (let x = 0; x < n; x += 3) { g.fillStyle = 'rgba(60,44,26,.6)'; g.fillRect(x, 0, 1, 16); } }),
  logTop: canvasTex(16, (g, n) => { jitter(g, n, [176, 142, 92], .2, rng(6)); g.strokeStyle = '#7a5a34'; g.strokeRect(2.5, 2.5, 11, 11); g.strokeRect(5.5, 5.5, 5, 5); }),
  leaves: canvasTex(16, (g, n) => { const r = rng(7); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .65 + r() * .5; g.fillStyle = `rgb(${46*k|0},${120*k|0},${40*k|0})`; g.fillRect(x, y, 1, 1); } }),
  water: canvasTex(16, (g, n) => { const r = rng(8); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const k = .85 + r() * .3; g.fillStyle = `rgb(${50*k|0},${100*k|0},${220*k|0})`; g.fillRect(x, y, 1, 1); } }),
};

// ---------- item icons (original pixel art) ----------
function px(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
function line(g, x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) px(g, Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n)), c); }
const ICON = {
  sword: canvasTex(16, g => { for (let i = 0; i < 9; i++) { px(g, 5 + i, 10 - i, '#e8eef2'); px(g, 6 + i, 10 - i, '#b9c3c9'); px(g, 5 + i, 9 - i, '#7d878d'); } line(g, 3, 9, 7, 13, '#4a3b2a'); line(g, 2, 12, 4, 14, '#6b4a2b'); px(g, 1, 14, '#3a2a1a'); }),
  pick: canvasTex(16, g => { line(g, 3, 13, 11, 5, '#6b4a2b'); line(g, 4, 13, 12, 5, '#4a3b2a'); for (const [x, y] of [[6,2],[7,2],[8,2],[9,2],[10,3],[11,3],[12,4],[12,5],[13,6],[13,7],[13,8],[5,3],[4,3]]) px(g, x, y, '#8fd6e0'); for (const [x, y] of [[7,3],[8,3],[9,3],[11,4],[12,6],[12,7]]) px(g, x, y, '#4fa3b0'); }),
  bucketW: canvasTex(16, g => { for (let y = 5; y <= 14; y++) { const a = Math.round(3 + (y - 5) * .25), b = Math.round(12 - (y - 5) * .25); for (let x = a; x <= b; x++) px(g, x, y, (x === a || x === b || y === 14) ? '#3c4043' : '#a7adb3'); } for (let x = 4; x <= 11; x++) { px(g, x, 5, '#2f6fe4'); px(g, x, 6, '#5a92f5'); } line(g, 3, 4, 12, 4, '#3c4043'); line(g, 4, 3, 6, 1, '#3c4043'); line(g, 7, 1, 9, 1, '#3c4043'); line(g, 10, 1, 11, 3, '#3c4043'); }),
  bucket: canvasTex(16, g => { for (let y = 5; y <= 14; y++) { const a = Math.round(3 + (y - 5) * .25), b = Math.round(12 - (y - 5) * .25); for (let x = a; x <= b; x++) px(g, x, y, (x === a || x === b || y === 14) ? '#3c4043' : '#a7adb3'); } for (let x = 4; x <= 11; x++) { px(g, x, 5, '#55595d'); px(g, x, 6, '#6c7176'); } line(g, 3, 4, 12, 4, '#3c4043'); line(g, 4, 3, 6, 1, '#3c4043'); line(g, 7, 1, 9, 1, '#3c4043'); line(g, 10, 1, 11, 3, '#3c4043'); }),
  wind: canvasTex(16, g => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 6.3) px(g, x, y, d > 5.2 ? '#3a6ea5' : '#d6ecff'); } for (let i = 0; i < 14; i++) { const a = i * .55, r = 1 + i * .32; px(g, Math.round(7.5 + Math.cos(a) * r), Math.round(7.5 + Math.sin(a) * r), '#5aa8f0'); } px(g, 6, 5, '#ffffff'); px(g, 5, 6, '#ffffff'); }),
  mace: canvasTex(16, g => { line(g, 2, 14, 8, 8, '#6b4a2b'); line(g, 3, 14, 9, 8, '#3f2d1c'); for (let y = 2; y <= 7; y++) for (let x = 8; x <= 13; x++) px(g, x, y, (x === 8 || x === 13 || y === 2 || y === 7) ? '#2c3236' : '#6d7a82'); for (const [x, y] of [[10,0],[11,0],[10,1],[11,1],[14,4],[15,4],[14,5],[15,5],[6,4],[7,4],[6,5],[7,5],[10,8],[11,8]]) px(g, x, y, '#b9c3c9'); px(g, 10, 4, '#9aa6ad'); px(g, 11, 3, '#9aa6ad'); }),
  bread: canvasTex(16, g => { for (let y = 6; y <= 11; y++) for (let x = 2; x <= 13; x++) if (!((x < 4 || x > 11) && (y < 7 || y > 10))) px(g, x, y, y < 8 ? '#c98d3c' : '#a76f2a'); for (const x of [5, 8, 11]) px(g, x, 7, '#e8b56a'); }),
  grass: canvasTex(16, g => { for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) px(g, x, y, y < 6 ? '#62a840' : '#86603f'); }),
  torch: canvasTex(16, g => { line(g, 7, 6, 7, 14, '#6b4a2b'); line(g, 8, 6, 8, 14, '#4a3b2a'); for (const [x, y, c] of [[7,4,'#ffd84a'],[8,4,'#ffd84a'],[7,5,'#ff9a1f'],[8,5,'#ff9a1f'],[7,3,'#fff3a6'],[8,3,'#ffe36e']]) px(g, x, y, c); }),
};
const HOTBAR = ['sword', 'pick', 'bucketW', 'wind', 'mace', 'bread', 'grass', 'torch', null];
const COUNTS = { wind: 16, bread: 12, grass: 64, torch: 32 };

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const SKY = new THREE.Color('#9fd0ff');
scene.fog = new THREE.Fog(SKY, 70, 200);
const camera = new THREE.PerspectiveCamera(70, W / H, 0.05, 600);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xe8f4ff, 0x6a5a40, 1.05));
const sunL = new THREE.DirectionalLight(0xfff2dc, 1.5); sunL.position.set(40, 90, -30); scene.add(sunL);

{ // sky dome + sun
  const geo = new THREE.SphereGeometry(500, 32, 16);
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#3f86e0') }, mid: { value: new THREE.Color('#9fd0ff') } },
    vertexShader: 'varying vec3 vp; void main(){ vp=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; varying vec3 vp; void main(){ float h=normalize(vp).y; gl_FragColor=vec4(mix(mid,top,clamp(h*1.6,0.0,1.0)),1.0);\n#include <colorspace_fragment>\n}' });
  const dome = new THREE.Mesh(geo, mat); dome.renderOrder = -1; scene.add(dome); scene.userData.dome = dome;
  const st = canvasTex(16, g => { g.fillStyle = '#fff6c8'; g.fillRect(2, 2, 12, 12); g.fillStyle = '#ffffff'; g.fillRect(4, 4, 8, 8); });
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, fog: false, depthWrite: false }));
  sun.scale.set(40, 40, 1); scene.add(sun); scene.userData.sun = sun;
}

// ---------- terrain ----------
const MESA = { x0: -7, x1: 7, z0: -36, z1: -19, top: 63 };
function heightAt(x, z) {
  if (x >= MESA.x0 && x <= MESA.x1 && z >= MESA.z0 && z <= MESA.z1) return MESA.top;
  let h = 8 + Math.round((fbm(x * .045 + 10, z * .045 - 7) - .5) * 7);
  const d = Math.hypot(x, z - 10);
  if (d > 55) h += Math.round((d - 55) * .35 * fbm(x * .03, z * .03));
  const flat = (cx, cz, rx, rz, fall) => { const dx = Math.max(0, Math.abs(x - cx) - rx), dz = Math.max(0, Math.abs(z - cz) - rz); return clamp(1 - Math.hypot(dx, dz) / fall); };
  const k = Math.max(flat(0, -10, 10, 9, 8), flat(40, 36, 11, 16, 8), flat(0, -27, 9, 10, 4));
  return Math.round(lerp(h, 8, k));
}
const R = 90;
const HM = new Map(); const hk = (x, z) => x * 1000 + z;
for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) HM.set(hk(x, z), heightAt(x, z));
const hAt = (x, z) => HM.get(hk(x, z)) ?? 8;

const blocks = { grass: [], dirt: [], stone: [], log: [], leaves: [] };
for (let x = -R; x <= R; x++) for (let z = -R; z <= R; z++) {
  const h = hAt(x, z);
  const mn = Math.min(hAt(x + 1, z), hAt(x - 1, z), hAt(x, z + 1), hAt(x, z - 1), h);
  blocks.grass.push([x, h, z]);
  for (let y = h - 1; y > mn - 1 && y > h - 70; y--) (h - y <= 3 ? blocks.dirt : blocks.stone).push([x, y, z]);
}
{ // trees
  const r = rng(42); let n = 0;
  while (n < 70) {
    const x = Math.round((r() - .5) * 150), z = Math.round((r() - .5) * 150);
    const busy = (Math.abs(x) < 14 && z > -40 && z < 6) || (Math.abs(x - 40) < 16 && Math.abs(z - 36) < 22) || Math.hypot(x, z) < 8;
    if (busy) continue;
    const h = hAt(x, z), th = 4 + (r() * 2 | 0);
    for (let y = 1; y <= th; y++) blocks.log.push([x, h + y, z]);
    for (let dy = th - 1; dy <= th + 1; dy++) { const rr = dy === th + 1 ? 1 : 2; for (let dx = -rr; dx <= rr; dx++) for (let dz = -rr; dz <= rr; dz++) { if (Math.abs(dx) === rr && Math.abs(dz) === rr && r() < .6) continue; if (dx === 0 && dz === 0 && dy <= th) continue; blocks.leaves.push([x + dx, h + dy, z + dz]); } }
    n++;
  }
}
const lam = map => new THREE.MeshLambertMaterial({ map });
const MATS = {
  grass: [lam(T.grassSide), lam(T.grassSide), lam(T.grassTop), lam(T.dirt), lam(T.grassSide), lam(T.grassSide)],
  dirt: lam(T.dirt), stone: lam(T.stone),
  log: [lam(T.logSide), lam(T.logSide), lam(T.logTop), lam(T.logTop), lam(T.logSide), lam(T.logSide)],
  leaves: lam(T.leaves),
};
const box = new THREE.BoxGeometry(1, 1, 1);
const m4 = new THREE.Matrix4();
// Face-culled mesher: only faces that can be seen are emitted, grouped per texture.
{
  const FACES = [ // dir, 4 corners (unit cube), normal
    { d: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] }, { d: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
    { d: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }, { d: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
    { d: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] }, { d: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] }];
  const TEXOF = { grass: ['grassSide', 'grassSide', 'grassTop', 'dirt', 'grassSide', 'grassSide'], dirt: 'dirt', stone: 'stone', log: ['logSide', 'logSide', 'logTop', 'logTop', 'logSide', 'logSide'], leaves: 'leaves' };
  const buckets = {};
  const solid = new Set(); for (const k of ['log', 'leaves']) for (const [x, y, z] of blocks[k]) solid.add(x + ',' + y + ',' + z);
  const terrainVisible = (x, y, z, f) => { if (f === 3) return false; if (f === 2) return true; const [dx, , dz] = FACES[f].d; return y > hAt(x + dx, z + dz); };
  for (const [k, list] of Object.entries(blocks)) {
    const terr = k === 'grass' || k === 'dirt' || k === 'stone';
    for (const [x, y, z] of list) for (let f = 0; f < 6; f++) {
      if (terr ? !terrainVisible(x, y, z, f) : solid.has((x + FACES[f].d[0]) + ',' + (y + FACES[f].d[1]) + ',' + (z + FACES[f].d[2])) && k !== 'leaves') continue;
      const tex = Array.isArray(TEXOF[k]) ? TEXOF[k][f] : TEXOF[k];
      const b = buckets[tex] || (buckets[tex] = { p: [], n: [], uv: [], i: [] });
      const base = b.p.length / 3;
      FACES[f].c.forEach(([cx, cy, cz]) => { b.p.push(x + cx, y + cy, z + cz); b.n.push(...FACES[f].d); });
      b.uv.push(0, 0, 1, 0, 1, 1, 0, 1); b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  for (const [tex, b] of Object.entries(buckets)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); g.setIndex(b.i);
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: T[tex], side: tex === 'leaves' ? THREE.DoubleSide : THREE.FrontSide })));
  }
}
// ---------- episode 2 world: mine, sky island, extra textures/icons ----------
Object.assign(T, {
  deep: canvasTex(16, (g, n) => { const r = rng(21); jitter(g, n, [74, 74, 82], .25, r); for (let y = 1; y < n; y += 4) { g.fillStyle = 'rgba(38,38,46,.55)'; g.fillRect(0, y + (r() * 2 | 0), 16, 1); } }),
  dore: canvasTex(16, (g, n) => { const r = rng(22); jitter(g, n, [74, 74, 82], .25, r); for (const [x, y] of [[1, 1], [8, 2], [4, 6], [11, 8], [2, 11], [8, 12], [13, 13], [12, 3]]) { g.fillStyle = '#16807b'; g.fillRect(x, y, 3, 3); g.fillStyle = '#4fe3d8'; g.fillRect(x, y, 2, 2); g.fillStyle = '#e6fffd'; g.fillRect(x, y, 1, 1); } }),
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
  const buckets = {}, made = [];
  for (const [x, y, z, f, type] of faceList) {
    const tex = texOf(type, f); const b = buckets[tex] || (buckets[tex] = { p: [], n: [], uv: [], i: [] }); const base = b.p.length / 3;
    FACES2[f].c.forEach(([cx, cy, cz]) => { b.p.push(x + cx, y + cy, z + cz); b.n.push(...FACES2[f].d); });
    b.uv.push(0, 0, 1, 0, 1, 1, 0, 1); b.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  for (const [tex, b] of Object.entries(buckets)) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); g.setIndex(b.i);
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: T[tex] })); scene.add(m); made.push(m);
  }
  return made;
}
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
for (let z = 0; z <= 24; z++) for (const x of [DXX, DXX + 1]) { dAir(x, 15, z); dAir(x, 16, z); }
const BLAST_C = V(DXX + 1, 16.0, 23.5), BLAST = [];
const DEBRIS = [[DXX + 4, 15, 23], [DXX - 2, 16, 25], [DXX + 1, 13, 24]];
for (let x = DXX - 3; x <= DXX + 3; x++) for (let y = 12; y <= 20; y++) for (let z = 20; z <= 27; z++) { const d = V(x + .5, y + .5, z + .5).distanceTo(BLAST_C); if (d <= 2.6 && !debAir.has(k3(x, y, z)) && !DEBRIS.some(c => c[0] === x && c[1] === y && c[2] === z)) { BLAST.push([x, y, z]); dAir(x, y, z); } }
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

// clouds
const clouds = new THREE.Group(); scene.add(clouds);
{ const r = rng(9); const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: .88, emissive: 0x666666 });
  for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(box, cm); c.scale.set(8 + r() * 16, 2, 6 + r() * 12); c.position.set((r() - .5) * 400, 105 + r() * 6, (r() - .5) * 400); clouds.add(c); } }

// ---------- characters ----------
function faceTex(o) {
  return canvasTex(8, g => {
    g.fillStyle = o.skin; g.fillRect(0, 0, 8, 8);
    g.fillStyle = o.hair; g.fillRect(0, 0, 8, 2); g.fillRect(0, 2, 1, 1); g.fillRect(7, 2, 1, 1);
    if (o.hood) { g.fillStyle = o.hood; g.fillRect(0, 0, 8, 1); g.fillRect(0, 0, 1, 5); g.fillRect(7, 0, 1, 5); }
    g.fillStyle = o.eyeW; g.fillRect(1, 4, 2, 1); g.fillRect(5, 4, 2, 1);
    g.fillStyle = o.eye; g.fillRect(2, 4, 1, 1); g.fillRect(5, 4, 1, 1);
    g.fillStyle = o.mouth; g.fillRect(3, 6, 2, 1);
  });
}
function solidTex(col, accent) { return canvasTex(8, g => { jitter(g, 8, new THREE.Color(col).toArray().map(v => v * 255), .18, rng(col.length * 7 + 3)); if (accent) { g.fillStyle = accent; g.fillRect(0, 0, 8, 1); } }); }
function makeHuman(o) {
  const g = new THREE.Group();
  const M = (c, a) => new THREE.MeshLambertMaterial({ map: solidTex(c, a), transparent: !!o.ghost, opacity: o.ghost ? .38 : 1, depthWrite: !o.ghost });
  const skin = M(o.skin), shirt = M(o.shirt), pants = M(o.pants), hair = M(o.hood || o.hair), shoe = M(o.shoes);
  const face = new THREE.MeshLambertMaterial({ map: faceTex(o), transparent: !!o.ghost, opacity: o.ghost ? .38 : 1 });
  if (o.glow) { face.emissive = new THREE.Color(o.glow); face.emissiveIntensity = .25; }
  const mk = (w, h, d, mat, parent, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const headP = new THREE.Group(); headP.position.y = 1.36; g.add(headP);
  mk(.45, .45, .45, [hair, hair, hair, skin, face, hair], headP, 0, .225, 0);
  if (o.glow) { // glowing eyes overlay
    const em = new THREE.MeshBasicMaterial({ color: o.glow });
    mk(.06, .045, .01, em, headP, -.11, .17, .227); mk(.06, .045, .01, em, headP, .11, .17, .227);
  }
  mk(.45, .68, .23, shirt, g, 0, 1.02, 0);
  const limb = (x, y, sleeve, end, endLen) => { const p = new THREE.Group(); p.position.set(x, y, 0); g.add(p); mk(.22, .68 - endLen, .22, sleeve, p, 0, -(.68 - endLen) / 2, 0); mk(.22, endLen, .22, end, p, 0, -.68 + endLen / 2, 0); return p; };
  const armL = limb(-.335, 1.36, shirt, skin, .2), armR = limb(.335, 1.36, shirt, skin, .2);
  const legL = limb(-.115, .68, pants, shoe, .12), legR = limb(.115, .68, pants, shoe, .12);
  const item = new THREE.Mesh(new THREE.PlaneGeometry(.55, .55), new THREE.MeshLambertMaterial({ map: ICON.sword, transparent: true, alphaTest: .5, side: THREE.DoubleSide }));
  item.position.set(0, -.68, .22); item.rotation.set(deg(-90), 0, deg(-90)); armR.add(item);
  scene.add(g);
  return { g, headP, armL, armR, legL, legR, item, mats: [skin, shirt, pants, hair, shoe, face] };
}
const PLAYER = makeHuman({ skin: '#c68a5e', hair: '#2b1d14', hood: '#16696b', shirt: '#1f8a8a', pants: '#2d3142', shoes: '#1b1b22', eyeW: '#ffffff', eye: '#3b2a8a', mouth: '#8a4a3a' });
const GHOST = makeHuman({ skin: '#ff4040', hair: '#ff2020', shirt: '#ff3030', pants: '#ff3030', shoes: '#ff3030', eyeW: '#ff9090', eye: '#ffffff', mouth: '#ffffff', ghost: true });
const GHOST2 = makeHuman({ skin: '#ff4040', hair: '#ff2020', shirt: '#ff3030', pants: '#ff3030', shoes: '#ff3030', eyeW: '#ff9090', eye: '#ffffff', mouth: '#ffffff', ghost: true });
const MOB = makeHuman({ skin: '#6b8f5e', hair: '#3f5a37', shirt: '#4b3f5c', pants: '#2e2a3a', shoes: '#2a3a26', eyeW: '#1a1a1a', eye: '#ff2a2a', mouth: '#2a3a26', glow: '#ff3030' });
MOB.item.visible = false; GHOST.item.visible = false; GHOST2.item.visible = false;
MOB.g.scale.setScalar(1.08);

function pose(h, p) {
  const s = p.walk ? Math.sin(p.walk) : 0;
  h.legL.rotation.x = s * .7 * (p.walkAmt ?? 1); h.legR.rotation.x = -s * .7 * (p.walkAmt ?? 1);
  h.armL.rotation.set(-s * .6, 0, 0); h.armR.rotation.set(s * .6, 0, 0);
  h.armL.rotation.z = 0; h.armR.rotation.z = 0; h.headP.rotation.set(0, 0, 0);
  if (p.fall) { const f = p.fall, w = Math.sin(p.time * 14) * .35; h.armL.rotation.set(-2.7 + w, 0, -.35 * f); h.armR.rotation.set(-2.7 - w, 0, .35 * f); h.legL.rotation.x = .25 + w * .4; h.legR.rotation.x = -.25 - w * .4; }
  if (p.zombie) { h.armL.rotation.x = -1.5 + s * .1; h.armR.rotation.x = -1.5 - s * .1; }
  if (p.smash != null) { const k = p.smash; h.armR.rotation.set(lerp(-2.9, -.6, k), 0, 0); h.armL.rotation.set(lerp(-2.2, -.3, k), 0, 0); }
  if (p.use) h.armR.rotation.x = -1.2 - Math.sin(p.use * Math.PI) * .9;
  if (p.lookDown) h.headP.rotation.x = p.lookDown;
}

// ---------- first person rig ----------
const fp = new THREE.Group(); camera.add(fp);
const fpArm = new THREE.Group(); fp.add(fpArm);
{ const sl = new THREE.MeshLambertMaterial({ map: solidTex('#1f8a8a') }), sk = new THREE.MeshLambertMaterial({ map: solidTex('#c68a5e') });
  const a = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .62), sl); a.position.set(0, 0, .12); fpArm.add(a);
  const hnd = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .18), sk); hnd.position.set(0, 0, -.27); fpArm.add(hnd); }
const fpItem = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshLambertMaterial({ map: ICON.sword, transparent: true, alphaTest: .5, side: THREE.DoubleSide, depthTest: false }));
fp.add(fpItem); fpArm.children.forEach(c => { c.material.depthTest = false; c.renderOrder = 10; }); fpItem.renderOrder = 11;

// ---------- water, particles, rings, misc ----------
const waterMat = new THREE.MeshLambertMaterial({ map: T.water, transparent: true, opacity: .72, depthWrite: false, emissive: 0x0a1a40 });
const waterPool = []; for (let i = 0; i < 13; i++) { const m = new THREE.Mesh(box, waterMat); m.visible = false; scene.add(m); waterPool.push(m); }
const PMAX = 2600;
const parts = new THREE.InstancedMesh(box, new THREE.MeshBasicMaterial({ color: 0xffffff }), PMAX); parts.frustumCulled = false;
parts.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PMAX * 3), 3); scene.add(parts);
const ringPool = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .07, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, fog: false })); m.visible = false; scene.add(m); ringPool.push(m); }
const orb = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .3), new THREE.MeshBasicMaterial({ color: 0xd6ecff })); orb.visible = false; scene.add(orb);
const trailGeo = new THREE.BufferGeometry(); const trail = new THREE.Line(trailGeo, new THREE.LineDashedMaterial({ color: 0xffe14a, dashSize: .6, gapSize: .35, fog: false, depthTest: false })); trail.renderOrder = 20; trail.visible = false; scene.add(trail);
const outline = new THREE.Group(); scene.add(outline);
for (let i = 0; i < 2; i++) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: 0xffe14a, depthTest: false, fog: false })); l.renderOrder = 21; l.position.set(.5, 9.5 + i, -15.5); outline.add(l); }
outline.visible = false;

const PCOL = {
  splash: ['#ffffff', '#cfe6ff', '#5a92f5', '#3f76e4'], wind: ['#ffffff', '#e6f4ff', '#bfe0ff'],
  smash: ['#62a840', '#86603f', '#6a4a30', '#ffffff', '#4f8d33'], poof: ['#ffffff', '#dddddd', '#bdbdbd'], spark: ['#fff3a6', '#ffd84a', '#ffffff'],
};
function burstParticles(b, t, out) {
  const age = t - b.t0; if (age < 0 || age > b.life) return;
  const r = rng(b.seed); const cols = PCOL[b.type];
  for (let i = 0; i < b.n; i++) {
    const a = r() * Math.PI * 2, el = r(), sp = lerp(b.sp[0], b.sp[1], r()), c = cols[(r() * cols.length) | 0];
    let vx = Math.cos(a) * sp * (b.radial ?? 1), vz = Math.sin(a) * sp * (b.radial ?? 1), vy = lerp(b.up[0], b.up[1], el);
    const drag = b.drag ?? 0, tt = drag ? (1 - Math.exp(-drag * age)) / drag : age;
    const x = b.o.x + vx * tt, z = b.o.z + vz * tt, y = Math.max(b.floor ?? -99, b.o.y + vy * tt - .5 * (b.g ?? 0) * age * age);
    const life = b.life * lerp(.6, 1, r()); if (age > life) continue;
    const s = b.size * (b.type === 'poof' ? Math.sin(Math.PI * age / life) * 1.6 : 1 - age / life * .7);
    out.push([x, y, z, s, c]);
  }
}

// ---------- episode 2: extra 3D pieces ----------
const camLight = new THREE.PointLight(0xffe0b0, 0, 20, 1.3); camera.add(camLight);
const DYN = {};
for (const tex of ['deep', 'dore', 'planks', 'netherrack', 'obsidian', 'lava', 'blueice']) { const im = new THREE.InstancedMesh(box, tex === 'lava' ? new THREE.MeshBasicMaterial({ map: T[tex] }) : new THREE.MeshLambertMaterial({ map: T[tex] }), 160); im.frustumCulled = false; scene.add(im); DYN[tex] = im; }
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
const DIG3 = []; { let i = 0; for (let z = 9; z <= 24; z++) for (const x of [DXX, DXX + 1]) for (const y of [16, 15]) DIG3.push({ x, y, z, tex: 'netherrack', t1: 64.9 + (i++) * .1 }); }
const T_BED = 72.4, T_BOOM = 75.15;
function tunnelSet(S, tm) {
  S.env = 'tunnel';
  for (const d of DIG3) if (tm < d.t1) S.dyn.push({ ...d, wob: seg(tm, d.t1 - .15, d.t1) }); else if (tm < d.t1 + .6) S.bursts.push({ type: 'nrack', t0: d.t1, o: V(d.x + .5, d.y + .5, d.z + .5), n: 14, sp: [1, 2.5], up: [1, 3], g: 16, life: .5, size: .08, seed: d.z * 7 + d.y, tm });
  if (tm < T_BOOM) for (const [x, y, z] of BLAST) S.dyn.push({ x, y, z, tex: 'netherrack' });
  S.bed = tm >= T_BED && tm < T_BOOM ? clamp((tm - T_BED) / .12) : 0;
  if (tm >= T_BOOM) { const o = BLAST_C.clone();
    S.bursts.push({ type: 'nrack', t0: T_BOOM, o, n: 160, sp: [4, 12], up: [-2, 8], g: 14, life: 1.4, size: .16, seed: 501, tm });
    S.bursts.push({ type: 'spark', t0: T_BOOM, o, n: 70, sp: [3, 10], up: [-3, 6], drag: 2, life: .7, size: .12, seed: 502, tm });
    S.bursts.push({ type: 'smoke', t0: T_BOOM + .05, o, n: 28, sp: [.6, 2.4], up: [.2, 1.4], drag: .8, life: 1.3, size: .3, seed: 503, tm });
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
    S.cam = { pos: V(DXX + 1.6, 16.7, 19.2), look: V(DXX + .9, 15.9, 24), fov: 66 };
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
    if (t > 28.25 && t < 30.4) S.overlays.push({ kind: 'pop', t0: 28.25, text: 'OBSIDIAN!', x: W / 2, y: H * .44, size: 120, col: '#c77dff' });
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
    S.cam = { pos: V(DXX + 1, 15 + EYE, z), yaw: Math.sin((t - 59.8) * .5) * .06, pitch: deg(-5), fov: 70 };
    S.overlays.push({ kind: 'coords', x: DXX + .5, y: 15, z, hl: true });
    S.overlays.push({ kind: 'debrisChart', t0: 60.0 });
  } else if (t < 71.6) { // dig fast
    tunnelSet(S, t); S.fp = true; S.hud = true; S.player.visible = false; S.hotbar = TUN_HOTBAR; S.counts = { 1: 6, 2: 64, 3: 8, 4: 2 }; S.held = 'pick';
    const z = 8.5 + clamp((t - 65.1) / .4, 0, 14);
    S.cam = { pos: V(DXX + 1, 15 + EYE + Math.sin(t * 10) * .02, z), yaw: 0, pitch: deg(-10) - (DIG3.find(d => t < d.t1)?.y === 15 ? deg(16) : 0), fov: 72 };
    S.swing = (t * 4) % 1;
    S.overlays.push({ kind: 'coords', x: DXX + .5, y: 15, z });
    if (t > 67.4) S.overlays.push({ kind: 'tag2', t0: 67.4, text: 'BEDS EXPLODE IN THE NETHER', col: '#ff8a80', icon: 'bed' });
  } else if (t < 81.2) { // place bed, step back, BOOM, reveal
    tunnelSet(S, t);
    if (t < 76.2) {
      const zb = t < 72.8 ? 22.3 : lerp(22.3, 18.6, eIO(seg(t, 72.8, 74.3)));
      S.player.pos = V(DXX + .5, 15, zb); S.player.yaw = 0; S.player.held = 'bed'; S.player.p = { use: Math.max(seg(t, T_BED - .25, T_BED), seg(t, T_BOOM - .25, T_BOOM)), walk: t > 72.8 && t < 74.3 ? t * 9 : 0 };
      S.cam = { pos: V(DXX + 1.6, 16.8, 15.6), look: V(DXX + 1.35, 15.6, 23), fov: 64 };
      S.hud = true; S.hotbar = TUN_HOTBAR; S.slot = 1; S.counts = { 1: t > T_BED ? 5 : 6, 2: 64, 3: 8, 4: 2 };
    } else {
      S.player.pos = V(DXX + .5, 15, 18.6); S.player.held = 'pick';
      S.cam = { pos: V(DXX + 1 + Math.sin((t - 76.2) * .3) * .3, 16.6, lerp(19.4, 20.6, seg(t, 76.2, 81.2))), look: V(DXX + 1, 15.6, 24.2), fov: 74 };
      DEBRIS.forEach(([x, y, z], i) => S.overlays.push({ kind: 'worldTag', at: V(x + .5, y + 1.25, z + .5), text: i === 0 ? 'BLAST PROOF' : 'DEBRIS', col: '#ffb380', t0: 76.5 + i * .25 }));
    }
  } else if (t < 87.6) { // crafting chain
    tunnelSet(S, 99); S.player.pos = V(DXX + .5, 15, 18.6);
    S.cam = { pos: V(DXX + 1, 16.6, 20.6), look: V(DXX + 1, 15.6, 24.2), fov: 74 };
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
    S.cam = { pos: V(NX + 5.5 + Math.sin(a) * 1.5, 46, 161), look: V(NX + .4, 42.4, 151), fov: 62 };
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

// ---------- apply state to the 3D scene ----------
const ITEM_TEX = ICON;
function applyHuman(h, st) {
  h.g.visible = st.visible !== false; if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(st.tilt || 0, st.yaw || 0, 0);
  pose(h, st.p || {});
  if (st.sit) { h.legL.rotation.x = -1.45; h.legR.rotation.x = -1.45; h.armL.rotation.x = -.5; h.armR.rotation.x = -.5; }
  if (st.crouch) { h.g.position.y -= .0; h.legL.rotation.x += .35 * st.crouch; h.legR.rotation.x -= .1 * st.crouch; h.g.rotation.x += .28 * st.crouch; }
  if (st.held) { h.item.visible = true; h.item.material.map = ITEM_TEX[st.held]; } else h.item.visible = false;
}
const ENV = { sky: { fog: [SKY.getHex(), 70, 200], bg: null, hemi: 1.05, sun: 1.5, cam: 0, dome: true }, nether: { fog: [0x4a1409, 14, 95], bg: 0x2a0905, hemi: 1.15, hcol: 0xffc29a, sun: .45, cam: 1.6, dome: false }, tunnel: { fog: [0x2a0a06, 4, 26], bg: 0x000000, hemi: .7, hcol: 0xffc29a, sun: .2, cam: 3.2, dome: false } };
function apply(S) {
  const t = S.t, env = ENV[S.env];
  scene.fog.color.setHex(env.fog[0]); scene.fog.near = env.fog[1]; scene.fog.far = env.fog[2];
  scene.background = env.bg == null ? null : new THREE.Color(env.bg);
  scene.userData.dome.visible = env.dome; scene.userData.sun.visible = env.dome; clouds.visible = env.dome;
  hemi.intensity = env.hemi; hemi.color.setHex(env.hcol ?? 0xe8f4ff); sunL.intensity = env.sun; camLight.intensity = env.cam * (1 + Math.sin(t * 13) * .04);
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
  const cnt = Object.fromEntries(Object.keys(DYN).map(k => [k, 0]));
  for (const d of S.dyn) { const im = DYN[d.tex]; const i = cnt[d.tex]++; if (i >= 160) continue; const s = (d.pop ?? 1) * (1 + (d.wob ? Math.sin(t * 60) * .03 * d.wob : 0)); m4.makeScale(s, s, s).setPosition(d.x + .5, d.y + .5, d.z + .5); im.setMatrixAt(i, m4); }
  for (const [k, im] of Object.entries(DYN)) { for (let i = cnt[k]; i < 160; i++) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; }
  // x-ray
  xrayPool.forEach((l, i) => { const h = S.xray && S.xray[i]; l.visible = !!h; xrayFill[i].visible = !!h; if (h) { l.position.set(h[0] + .5, h[1] + .5, h[2] + .5); xrayFill[i].position.copy(l.position); xrayFill[i].material.opacity = .3 * (S.xrayA ?? 1) * (.75 + .25 * Math.sin(t * 6 + i)); l.material.opacity = S.xrayA ?? 1; } });
  edgeBar.visible = S.edge; if (S.edge) { edgeBar.position.set(.5, 64.03, -18 + (S.dyn.filter(d => d.tex === 'planks').length)); edgeBar.material.color.setHSL(.14, 1, .5 + .15 * Math.sin(t * 8)); }
  diaDrop.visible = !!S.drop; if (S.drop) diaDrop.position.copy(S.drop);
  applyExtra(S, t);
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
  if (S.nausea) { const n = S.nausea; ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, H * .1, W / 2, H / 2, H * .9); g.addColorStop(0, `rgba(160,60,255,${.25 * n})`); g.addColorStop(1, `rgba(90,20,170,${.85 * n})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = `rgba(230,180,255,${.5 * n})`; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(W / 2, H / 2, 120 + i * 140 + (t * 220) % 140, t * 2 + i, t * 2 + i + 2.2); ctx.stroke(); } ctx.restore(); }
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
      txt('3 NETHER TRICKS', 0, -90, 132, '#ffffff', { lw: 22 });
      ctx.rotate(-.035); rrect(-560, -10, 1120, 150, 18, '#e53935', '#000', 8);
      txt('EVERY PLAYER NEEDS', 0, 68, 112, '#ffd400', { lw: 16 });
      ctx.restore();
      if (t > o.t0 + .9) { const items = [['lavaB', 'PORTAL'], ['debris', 'NETHERITE'], ['blueice', 'ICE HIGHWAY']]; items.forEach(([ic, l], i) => { const x = W / 2 + (i - 1) * 380, a = seg(t, o.t0 + .9 + i * .2, o.t0 + 1.2 + i * .2) * (1 - out); ctx.save(); ctx.globalAlpha = a; rrect(x - 170, H * .63, 340, 96, 48, 'rgba(0,0,0,.7)', '#fff', 3); icon(ic, x - 150, H * .63 + 16, 64); txt(l, x + 30, H * .63 + 49, 40, '#fff', { stroke: false }); ctx.restore(); }); }
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
      const lines = ['HollowCraft (F3 debug)', `XYZ: ${o.x.toFixed(1)} / ${o.y.toFixed(1)} / ${o.z.toFixed(1)}`];
      lines.forEach((l, i) => { ctx.font = '600 34px "DejaVu Sans Mono", monospace'; const w = ctx.measureText(l).width + 20; ctx.fillStyle = 'rgba(40,40,40,.62)'; ctx.fillRect(40, 140 + i * 46, w, 44); txt(l, 50, 162 + i * 46, 34, i === 1 && o.hl ? '#ffd400' : '#f0f0f0', { align: 'left', stroke: false, font: '600 34px "DejaVu Sans Mono", monospace' }); });
      if (o.hl) { ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.strokeRect(34, 180, 640, 56); }
    } else if (o.kind === 'f3hint') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .35)); ctx.save(); ctx.translate(W * .7, H * .32); ctx.scale(k, k);
      rrect(-330, -150, 660, 300, 22, 'rgba(0,0,0,.72)', '#ffd400', 5);
      keycap(-290, -118, 'F3', '', true); txt('JAVA: PRESS F3', 40, -78, 52, '#fff', { stroke: false });
      txt('BEDROCK:', -290, 30, 44, '#ffd400', { align: 'left', stroke: false }); txt('Settings → Show Coordinates', -290, 90, 40, '#fff', { align: 'left', stroke: false, w: 700 });
      ctx.restore();
    } else if (o.kind === 'ychart') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 120 - (1 - k) * -700, H * .12);
      const pw = 540, ph = 560; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.75)', '#4fe3d8', 5);
      txt('DIAMONDS BY Y LEVEL', -pw / 2, 46, 40, '#4fe3d8', { stroke: false });
      const top = 100, bot = ph - 50, yv = v => lerp(top, bot, (16 - v) / 80); // Y 16 → -64
      for (let v = 16; v >= -64; v -= 4) { const f = clamp((16 - v) / 74) ** 1.6, x0 = -pw + 150, y = yv(v); if (v < -60) continue; rrect(x0, y - 9, f * (pw - 200), 18, 4, v === -56 || v === -60 ? '#4fe3d8' : 'rgba(79,227,216,.55)'); }
      for (const v of [16, 0, -32, -58]) txt(`Y ${v}`, -pw + 130, yv(v), 30, v === -58 ? '#ffd400' : '#cfd8dc', { align: 'right', stroke: false });
      ctx.fillStyle = 'rgba(120,120,120,.6)'; ctx.fillRect(-pw + 30, yv(-60), pw - 60, bot - yv(-60) + 20); txt('BEDROCK', -pw / 2, (yv(-60) + bot + 20) / 2, 28, '#fff', { stroke: false });
      const y58 = yv(-58); ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(-pw + 140, y58); ctx.lineTo(-30, y58); ctx.stroke(); ctx.setLineDash([]);
      txt('BEST', -70, y58 - 30, 34, '#ffd400', { lw: 6 }); ctx.restore();
    } else if (o.kind === 'branchMap') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 110 - (1 - k) * -700, H * .12);
      const pw = 480, ph = 560, cell = 30; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.75)', '#ffd400', 5);
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
      const k = eOutBack(seg(t, o.t0, o.t0 + .3)); ctx.save(); ctx.translate(W / 2, H * .27); ctx.scale(k, k);
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
        rrect(48, y, 620, 80, 16, on ? '#ffd400' : 'rgba(0,0,0,.6)', on ? '#000' : 'rgba(255,255,255,.3)', 4);
        txt(`${i + 1}`, 92, y + 42, 46, on ? '#000' : done ? '#5cff7a' : '#fff', { stroke: false }); txt(s, 136, y + 42, 38, on ? '#000' : done ? '#5cff7a' : '#fff', { align: 'left', stroke: false }); });
    } else if (o.kind === 'proTip') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 80, H * .52); ctx.scale(k, k);
      rrect(-820, -130, 800, 260, 22, 'rgba(0,0,0,.78)', '#ffd400', 5); txt('PRO TIP', -420, -88, 46, '#ffd400', { stroke: false });
      icon('chest', -790, -50, 110); txt('ON HOTBAR', -735, 92, 24, '#fff', { stroke: false });
      txt('→', -620, 6, 64, '#fff', { stroke: false }); keycap(-575, -34, 'RMB', '', true); txt('=', -440, 6, 64, '#fff', { stroke: false }); txt('INSTANT SWAP', -405, 6, 44, '#5cff7a', { stroke: false, align: 'left' });
      ctx.restore();
    }
    else if (o.kind === 'formula') { // lava + water = obsidian
      const k = eOutBack(seg(t, o.t0, o.t0 + .35)); ctx.save(); ctx.translate(W / 2, H * .2); ctx.scale(k, k);
      rrect(-430, -70, 860, 140, 22, 'rgba(0,0,0,.75)', '#c77dff', 5);
      icon('lavaB', -400, -48, 96); txt('+', -260, 0, 80, '#fff', { stroke: false }); icon('bucketW', -210, -48, 96); txt('=', -70, 0, 80, '#fff', { stroke: false });
      ctx.drawImage(T.obsidian.userData.canvas, -10, -46, 92, 92); txt('OBSIDIAN', 230, 0, 54, '#c77dff', { stroke: false }); ctx.restore();
    } else if (o.kind === 'xcell') {
      const p = project(o.at); if (!p.vis) continue; const k = eOutBack(seg(t, o.t0, o.t0 + .3));
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k); ctx.strokeStyle = '#000'; ctx.lineWidth = 18; ctx.lineCap = 'round';
      for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-26, -26 * s); ctx.lineTo(26, 26 * s); ctx.stroke(); }
      ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 9; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-26, -26 * s); ctx.lineTo(26, 26 * s); ctx.stroke(); } ctx.restore();
    } else if (o.kind === 'moldTip') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)), out = seg(t, 51.2, 51.6); ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(W - 90 - (1 - k) * -700, H * .12);
      const pw = 560, ph = 560, cs = 62; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.78)', '#ffd400', 5);
      txt('PRO TIP: DIRT MOLD', -pw / 2, 46, 40, '#ffd400', { stroke: false });
      const ox = -pw / 2 - cs * 3, oy = 92;
      for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 6; gx++) {
        const fx = gx - 1, fy = 4 - (gy - 0); const inFrame = fx >= 0 && fx <= 3 && fy >= 0 && fy <= 4, corner = (fx === 0 || fx === 3) && (fy === 0 || fy === 4), inner = fx >= 1 && fx <= 2 && fy >= 1 && fy <= 3;
        const tex = inFrame && !corner && !inner ? T.obsidian : (!inFrame || corner) ? T.dirt : null;
        if (tex) ctx.drawImage(tex.userData.canvas, ox + gx * cs, oy + gy * cs, cs - 3, cs - 3);
      }
      txt('dirt holds the lava in place', -pw / 2, ph - 40, 30, '#fff', { stroke: false, w: 700 }); ctx.restore();
    } else if (o.kind === 'debrisChart') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W - 110 - (1 - k) * -700, H * .12);
      const pw = 520, ph = 540; rrect(-pw, 0, pw, ph, 22, 'rgba(0,0,0,.78)', '#ffb380', 5);
      txt('ANCIENT DEBRIS BY Y', -pw / 2, 46, 40, '#ffb380', { stroke: false });
      const top = 100, bot = ph - 40, yv = v => lerp(top, bot, (40 - v) / 40);
      for (let v = 38; v >= 2; v -= 3) { const f = Math.exp(-(((v - 15) / 6.5) ** 2)) * .85 + (v < 30 ? .1 : .02); rrect(-pw + 150, yv(v) - 10, f * (pw - 210), 20, 4, Math.abs(v - 14) <= 1 ? '#ffb380' : 'rgba(255,179,128,.55)'); }
      for (const v of [36, 24, 15, 6]) txt(`Y ${v}`, -pw + 130, yv(v), 30, v === 15 ? '#ffd400' : '#cfd8dc', { align: 'right', stroke: false });
      const y15 = yv(15); ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(-pw + 140, y15); ctx.lineTo(-30, y15); ctx.stroke(); ctx.setLineDash([]);
      txt('BEST', -70, y15 - 30, 34, '#ffd400', { lw: 6 }); ctx.restore();
    } else if (o.kind === 'craft') {
      const a1 = seg(t, o.t0, o.t0 + .4), a2 = seg(t, o.t0 + 2.2, o.t0 + 2.6);
      ctx.save(); ctx.globalAlpha = a1; const y1 = H * .23;
      [['debris', 'ANCIENT DEBRIS'], null, ['scrap', 'NETHERITE SCRAP']].forEach((it, i) => { const x = W / 2 + (i - 1) * 380; if (!it) { txt('SMELT →', x, y1, 52, '#ffd400', { lw: 8 }); return; } rrect(x - 110, y1 - 110, 220, 220, 24, 'rgba(0,0,0,.6)', '#ffb380', 4); icon(it[0], x - 80, y1 - 80, 160); txt(it[1], x, y1 + 150, 34, '#fff', { lw: 7 }); });
      ctx.globalAlpha = a2; const y2 = H * .55;
      const row = [['scrap', '×4'], ['+'], ['gold', '×4'], ['='], ['ingot', 'NETHERITE INGOT']];
      row.forEach((it, i) => { const x = W / 2 + (i - 2) * 300; if (it.length === 1) { txt(it[0], x, y2, 90, '#fff', { lw: 10 }); return; } rrect(x - 95, y2 - 95, 190, 190, 22, 'rgba(0,0,0,.6)', i === 4 ? '#ffd400' : '#fff', 4); icon(it[0], x - 70, y2 - 75, 140); txt(it[1], x + (i === 4 ? 0 : 50), y2 + (i === 4 ? 130 : 60), i === 4 ? 36 : 44, i === 4 ? '#ffd400' : '#fff', { lw: 8 }); });
      ctx.restore();
    } else if (o.kind === 'tips') {
      [['chest', 'WEAR ARMOR', 'the bed blast hurts you too'], ['fireres', 'FIRE RESISTANCE', 'lava is everywhere']].forEach(([ic, a, b], i) => {
        const k = eOutBack(seg(t, o.t0 + i * .6, o.t0 + .4 + i * .6)); ctx.save(); ctx.translate(60 + (1 - k) * -700, H * .2 + i * 190);
        rrect(0, 0, 680, 160, 24, 'rgba(0,0,0,.72)', i ? '#ff9a1f' : '#cfd8dc', 5); icon(ic, 20, 20, 120); txt(a, 170, 58, 52, '#fff', { align: 'left', stroke: false }); txt(b, 170, 112, 32, '#cfd8dc', { align: 'left', stroke: false, w: 700 }); ctx.restore(); });
    } else if (o.kind === 'ratio') {
      const k = seg(t, o.t0, o.t0 + .4), g = eOutC(seg(t, o.t0 + .5, o.t0 + 2.2)); ctx.save(); ctx.globalAlpha = k;
      rrect(120, H * .14, W - 240, 420, 26, 'rgba(0,0,0,.72)', '#ffd400', 5);
      txt('1 BLOCK IN THE NETHER = 8 IN THE OVERWORLD', W / 2, H * .14 + 60, 50, '#ffd400', { stroke: false });
      const bx = 380, bw = W - 640;
      txt('NETHER', bx - 30, H * .14 + 170, 42, '#ff8a65', { align: 'right', stroke: false }); rrect(bx, H * .14 + 145, bw / 8 * g, 50, 10, '#ff7043'); txt('125 blocks', bx + bw / 8 * g + 20, H * .14 + 172, 38, '#fff', { align: 'left', stroke: false, alpha: g });
      txt('OVERWORLD', bx - 30, H * .14 + 290, 42, '#9be27a', { align: 'right', stroke: false }); rrect(bx, H * .14 + 265, bw * g, 50, 10, '#66bb6a'); txt('1,000 blocks', bx + bw * g - 20, H * .14 + 340, 38, '#fff', { align: 'right', stroke: false, alpha: g });
      ctx.restore();
    } else if (o.kind === 'speed') {
      ctx.font = FONT(44); const s = `${o.v} BLOCKS/SEC`, w = ctx.measureText(s).width + 70;
      rrect(W - 48 - w, 48, w, 80, 16, 'rgba(0,0,0,.65)', '#78aaf8', 4); txt(s, W - 48 - w / 2, 90, 44, '#cfe6ff', { stroke: false });
    } else if (o.kind === 'speedlines') {
      const r = rng(Math.floor(t * 30)); ctx.save(); ctx.globalAlpha = .55 * o.a; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
      for (let i = 0; i < 38; i++) { const a = r() * Math.PI * 2, r0 = 360 + r() * 300, r1 = r0 + 120 + r() * 260; ctx.lineWidth = 2 + r() * 5; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0 * .7); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1 * .7); ctx.stroke(); }
      ctx.restore();
    } else if (o.kind === 'compare') {
      const k = seg(t, o.t0, o.t0 + .4), g = eOutC(seg(t, o.t0 + .4, o.t0 + 1.8)); ctx.save(); ctx.globalAlpha = k;
      rrect(120, H * .14, W - 240, 330, 26, 'rgba(0,0,0,.75)', '#78aaf8', 5);
      const bx = 700, bw = W - 980;
      [['ELYTRA + ROCKETS', 33, '#cfd8dc', 'elytra'], ['ICE BOAT', 72, '#78aaf8', 'boat']].forEach(([l, v, c, ic], i) => { const y = H * .14 + 90 + i * 130;
        icon(ic, 150, y - 45, 90); txt(l, bx - 30, y, 40, c, { align: 'right', stroke: false }); rrect(bx, y - 28, bw * v / 72 * g, 56, 12, c); txt(`~${Math.round(v * g)} b/s`, bx + bw * v / 72 * g + 20, y, 42, '#fff', { align: 'left', stroke: false }); });
      ctx.restore();
    } else if (o.kind === 'distance') {
      rrect(W / 2 - 420, 40, 840, 150, 22, 'rgba(0,0,0,.72)', o.done ? '#5cff7a' : '#ffd400', 5);
      txt(`OVERWORLD DISTANCE: ${o.d.toLocaleString('en-US')}`, W / 2, 92, 50, o.done ? '#5cff7a' : '#fff', { stroke: false });
      txt(`${o.s.toFixed(2)} s`, W / 2, 152, 46, o.done ? '#5cff7a' : '#ffd400', { stroke: false });
    }
    else if (o.kind === 'outro') {
      const q = seg(t, 138.6, 139.0), cm = seg(t, 140.4, 140.7), sb = seg(t, 143.0, 143.4), clicked = t > 144.3, end = 1 - seg(t, 146.2, 146.6);
      ctx.save(); ctx.globalAlpha = q * end;
      txt('WHICH TRICK ARE YOU', W / 2, H * .16, 88, '#fff', { lw: 14, scale: eOutBack(q) });
      txt('TRYING FIRST?', W / 2, H * .27, 100, '#ffd400', { lw: 15, scale: eOutBack(q) });
      ctx.globalAlpha = cm * end; [['lavaB', '#1'], ['debris', '#2'], ['blueice', '#3']].forEach(([ic, n], i) => { const x = W / 2 + (i - 1) * 230; rrect(x - 95, H * .35, 190, 100, 50, 'rgba(0,0,0,.7)', '#fff', 4); icon(ic, x - 80, H * .35 + 18, 64); txt(n, x + 30, H * .35 + 51, 52, '#fff', { stroke: false }); });
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
const HL = /^(NETHER|NETHERITE|PORTAL|DIAMOND|PICKAXE|ANCIENT|DEBRIS|OBSIDIAN|LAVA|WATER|TEN|CORNERS|FLINT|STEEL|DIRT|MOLD|Y|FIFTEEN|BEDS|BED|EXPLOSIVES|BOOM!|BLAST|PROOF|SCRAP|GOLD|INGOT|ARMOR|FIRE|RESISTANCE|HIGHWAY|EIGHT|BLUE|ICE|BOAT|SEVENTY|ELYTRA|ROCKETS|GHASTS|THOUSAND|TWO|SECONDS|SUBSCRIBE|HOLLOWCRAFT|TRICK|NUMBER|ONE|THREE|FLYING)$/;
const CHUNKS = [];
for (const [a, b, line] of CAPS) {
  const words = line.toUpperCase().split(/\s+/).filter(Boolean); const groups = [];
  for (let i = 0; i < words.length;) { let n = Math.min(4, words.length - i); if (words.length - i - n === 1) n = Math.min(3, n); groups.push(words.slice(i, i + n)); i += n; }
  const total = words.join(' ').length; let acc = 0;
  for (const g of groups) { const len = g.join(' ').length + 1, s = a + (b - a) * acc / total, e = a + (b - a) * Math.min(1, (acc + len) / total); CHUNKS.push({ s, e, g }); acc += len; }
}
function drawCaptions(t, S) {
  const c = CHUNKS.find(c => t >= c.s && t < c.e + .12); if (!c || /^$/.test(c.g.join(' '))) return;
  const y = S.hud ? H - 340 : H - 170, size = 74;
  ctx.font = FONT(size); const widths = c.g.map(w => ctx.measureText(w).width), sp = size * .3;
  const tot = widths.reduce((a, b) => a + b, 0) + sp * (c.g.length - 1);
  let x = W / 2 - tot / 2; const k = eOutBack(seg(t, c.s, c.s + .12));
  c.g.forEach((w, i) => { const on = t >= c.s + (c.e - c.s) * i / c.g.length; const clean = w.replace(/[^A-Z0-9#\-]/g, '');
    txt(w, x + widths[i] / 2, y, size, HL.test(clean) ? '#ffd400' : '#ffffff', { lw: 15, scale: (on ? 1 : .96) * k, alpha: on ? 1 : .55 }); x += widths[i] + sp; });
}
const CUTS = [5.0, 7.2, 9.8, 11.8, 14.0, 18.6, 23.2, 35.4, 40.6, 45.8, 55.0, 59.8, 64.6, 71.6, 76.2, 81.2, 87.6, 97.0, 100.6, 105.4, 109.4, 113.4, 117.6, 122.6, 126.6, 131.0, 138.4];

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

