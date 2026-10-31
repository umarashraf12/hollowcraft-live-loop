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
for (const tex of ['deep', 'dore', 'planks']) { const im = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial({ map: T[tex] }), 160); im.frustumCulled = false; scene.add(im); DYN[tex] = im; }
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
    S.player.pos = V(-2.7, 9, -8.3); S.player.yaw = Math.PI + .45; S.player.held = 'gapple';
    S.cam = { pos: V(-5.0, 10.5, -6.0), look: V(-4.5, 10.1, -11), fov: 56 };
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
    trick1VA(0); S.player.pos = V(-3.7, 9, -7.6); S.player.yaw = Math.PI + .35; S.player.held = 'potion';
    S.cam = { pos: V(-5.6, 11.4, -5.2), look: V(-4.5, 10.2, -11), fov: 56 };
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
    trick1VA(t); S.player.pos = V(-2.7, 9, -8.3); S.player.yaw = Math.PI + .45;
    S.cam = { pos: V(-5.0, 10.5, -6.2), look: V(-4.5, 10.2, -11.2), fov: 54 };
    if (t > 29.6 && t < 31.6) S.overlays.push({ kind: 'timecard', t0: 29.6, text: '3-5 MINUTES LATER' });
    if (t > T_CURE) S.overlays.push({ kind: 'pop', t0: T_CURE, text: 'CURED!', x: W / 2, y: H * .28, size: 120, col: '#5cff7a' }), (S.flashT = T_CURE);
  } else if (t < 45.6) { // trades before/after
    trick1VA(t); S.fp = true; S.hud = false; S.player.visible = false;
    const eye = V(-4.4, 9 + EYE, -8.4); S.cam = { pos: eye, dir: V(-4.5, 10.5, -11.2).sub(eye).normalize(), fov: 70 };
    if (t < 41.5) S.overlays.push({ kind: 'trades', t0: 34.1, title: 'ARMORER', rows: ARMORER_ROWS, k: seg(t, 36.6, 37.8), x: 120, y: 120 });
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
    S.hotbar = ['axe', 'stick', 'emerald', 'lectern', null, null, null, null, null]; S.slot = 1; S.held = 'stick'; S.counts = { 1: 64, 2: n };
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
  if (t < 113.8) for (let i = 0; i < 5; i++) S.dyn.push({ x: TREE.x, y: 9 + i, z: TREE.z, tex: 'log' });
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

// ---------- apply state to the 3D scene ----------
const ITEM_TEX = ICON;
function applyHuman(h, st) {
  h.g.visible = st.visible !== false; if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(st.tilt || 0, st.yaw || 0, 0);
  pose(h, st.p || {});
  if (st.crouch) { h.g.position.y -= .0; h.legL.rotation.x += .35 * st.crouch; h.legR.rotation.x -= .1 * st.crouch; h.g.rotation.x += .28 * st.crouch; }
  if (st.held) { h.item.visible = true; h.item.material.map = ITEM_TEX[st.held]; } else h.item.visible = false;
}
const ENV = { sky: { fog: [SKY.getHex(), 70, 200], bg: null, hemi: 1.05, sun: 1.5, cam: 0, dome: true }, mine: { fog: [0x050507, 3, 22], bg: 0x000000, hemi: .32, sun: .12, cam: 2.8, dome: false } };
function apply(S) {
  const t = S.t, env = ENV[S.env];
  scene.fog.color.setHex(env.fog[0]); scene.fog.near = env.fog[1]; scene.fog.far = env.fog[2];
  scene.background = env.bg == null ? null : new THREE.Color(env.bg);
  scene.userData.dome.visible = env.dome; scene.userData.sun.visible = env.dome; clouds.visible = env.dome;
  hemi.intensity = env.hemi; sunL.intensity = env.sun; camLight.intensity = env.cam * (1 + Math.sin(t * 13) * .04);
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
      txt('3 VILLAGER TRICKS', 0, -90, 132, '#ffffff', { lw: 22 });
      ctx.rotate(-.035); rrect(-560, -10, 1120, 150, 18, '#e53935', '#000', 8);
      txt('THAT MAKE YOU RICH', 0, 68, 112, '#ffd400', { lw: 16 });
      ctx.restore();
      if (t > o.t0 + .9) { const items = [['gapple', 'CURE'], ['ebook', 'MENDING'], ['emerald', 'EMERALDS']]; items.forEach(([ic, l], i) => { const x = W / 2 + (i - 1) * 380, a = seg(t, o.t0 + .9 + i * .2, o.t0 + 1.2 + i * .2) * (1 - out); ctx.save(); ctx.globalAlpha = a; rrect(x - 170, H * .63, 340, 96, 48, 'rgba(0,0,0,.7)', '#fff', 3); icon(ic, x - 150, H * .63 + 16, 64); txt(l, x + 30, H * .63 + 49, 40, '#fff', { stroke: false }); ctx.restore(); }); }
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
    else if (o.kind === 'trades') {
      const a = eOutBack(seg(t, o.t0, o.t0 + .3)), pw = 780, rh = 124, ph = 110 + o.rows.length * rh;
      ctx.save(); ctx.translate(o.x + pw / 2, o.y + ph / 2); ctx.scale(a, a); ctx.translate(-pw / 2, -ph / 2);
      rrect(0, 0, pw, ph, 18, 'rgba(198,198,198,.96)', '#1b1b1b', 6); rrect(8, 8, pw - 16, 70, 10, 'rgba(0,0,0,.18)');
      txt(o.title, pw / 2, 44, 44, '#3a3a3a', { stroke: false });
      o.rows.forEach((r, i) => {
        const y = 92 + i * rh, hl = r.hl; rrect(16, y, pw - 32, rh - 14, 12, hl ? `rgba(199,125,255,${.35 + .4 * (o.flash || 0)})` : 'rgba(139,139,139,.55)', hl ? '#7a2bd6' : '#555', 3);
        let x = 36; const slot = (ic, n, opts = {}) => { rrect(x, y + 12, 86, 86, 8, '#8b8b8b', '#373737', 3); icon(ic, x + 9, y + 21, 68);
          if (opts.newp != null && o.k > 0) { txt(String(n), x + 78, y + 84, 30, '#ff5252', { align: 'right', lw: 5 }); ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 46, y + 84); ctx.lineTo(x + 82, y + 84); ctx.stroke();
            txt(String(opts.newp), x + 86, y + 34, 44 * eOutBack(o.k), '#2fd06a', { align: 'right', lw: 7 }); }
          else if (n > 1) txt(String(n), x + 78, y + 84, 30, '#fff', { align: 'right', lw: 6 }); x += 100; };
        r.in.forEach(([ic, n], j) => slot(ic, n, j === 0 ? { newp: r.newp } : {}));
        txt('➜', x + 30, y + 56, 52, r.done ? '#2fd06a' : '#555', { stroke: false }); x += 76;
        slot(r.out[0], r.out[1]);
        txt(r.lab, x + 12, y + 56, r.hl ? 46 : 38, r.hl ? '#5a1aa0' : '#2a2a2a', { align: 'left', stroke: false });
      });
      if (o.locked) { ctx.fillStyle = 'rgba(0,0,0,.35)'; rrect(0, 0, pw, ph, 18, 'rgba(0,0,0,.35)'); ctx.save(); ctx.translate(pw - 120, 60);
        rrect(-40, -10, 80, 64, 10, '#ffd400', '#000', 5); ctx.strokeStyle = '#000'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, -10, 24, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -10, 24, Math.PI, 0); ctx.stroke();
        ctx.restore(); txt('LOCKED', pw / 2, ph + 46, 56, '#ffd400', { lw: 9 }); }
      ctx.restore();
    } else if (o.kind === 'tag2b') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .3)); ctx.save(); ctx.translate(W / 2, H * .38); ctx.scale(k, k);
      ctx.font = FONT(50); const w = ctx.measureText(o.text).width + 130;
      rrect(-w / 2, -44, w, 88, 16, 'rgba(0,0,0,.72)', o.col, 4); icon(o.icon, -w / 2 + 16, -30, 60); txt(o.text, 35, 2, 50, o.col, { stroke: false }); ctx.restore();
    } else if (o.kind === 'timecard') {
      const a = seg(t, o.t0, o.t0 + .25) * (1 - seg(t, o.t0 + 1.7, o.t0 + 2.0));
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); txt(o.text, W / 2, H / 2, 110, '#ffd400', { lw: 16 });
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(W / 2, H / 2 - 170, 60, 0, 7); ctx.stroke(); const ang = t * 6; ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 170); ctx.lineTo(W / 2 + Math.cos(ang) * 44, H / 2 - 170 + Math.sin(ang) * 44); ctx.stroke(); ctx.restore();
    } else if (o.kind === 'nope') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .25)); ctx.save(); ctx.translate(100 + 780 - 70, 120 + 92 + 55); ctx.scale(k, k);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 22; ctx.lineCap = 'round'; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-34, -34 * s); ctx.lineTo(34, 34 * s); ctx.stroke(); }
      ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 11; for (const s of [1, -1]) { ctx.beginPath(); ctx.moveTo(-34, -34 * s); ctx.lineTo(34, 34 * s); ctx.stroke(); } ctx.restore();
      txt('NO MENDING', 490, 120 + 358 + 46, 48, '#ff5252', { lw: 8 });
    } else if (o.kind === 'jobs') {
      const items = [['lectern', 'LIBRARIAN'], ['fletch', 'FLETCHER'], ['composter', 'FARMER'], ['smoker', 'BUTCHER']];
      txt('ANY JOB BLOCK WORKS', W / 2, H * .17, 72, '#ffd400', { lw: 12, scale: eOutBack(seg(t, o.t0, o.t0 + .35)) });
      items.forEach(([ic, l], i) => { const k = eOutBack(seg(t, o.t0 + .3 + i * .25, o.t0 + .6 + i * .25)), x = W / 2 + (i - 1.5) * 330, y = H * .42;
        ctx.save(); ctx.translate(x, y); ctx.scale(k, k); rrect(-130, -130, 260, 300, 24, 'rgba(0,0,0,.7)', '#fff', 4); icon(ic, -90, -110, 180); txt(l, 0, 120, 38, '#fff', { stroke: false }); ctx.restore(); });
      if (t > o.t0 + 2.4) txt('...until you trade with it', W / 2, H * .72, 50, '#ff8a80', { lw: 8, alpha: seg(t, o.t0 + 2.4, o.t0 + 2.8) });
    } else if (o.kind === 'sticks') {
      const row = [['log', '×4'], ['→'], ['planksI', '×16'], ['→'], ['stick', '×32'], ['='], ['emerald', '×1']];
      row.forEach((it, i) => { const k = seg(t, o.t0 + i * .3, o.t0 + .3 + i * .3), x = W / 2 + (i - 3) * 245, y = H * .42; ctx.save(); ctx.globalAlpha = k;
        if (it.length === 1) txt(it[0], x, y, 90, '#fff', { lw: 10 }); else { rrect(x - 105, y - 105, 210, 210, 24, 'rgba(0,0,0,.6)', i === 6 ? '#2fd06a' : '#fff', 4); icon(it[0], x - 80, y - 85, 160); txt(it[1], x + 60, y + 72, 48, '#fff', { lw: 8 }); }
        ctx.restore(); });
      if (t > o.t0 + 2.6) txt('EVERY 4 LOGS = 1 EMERALD', W / 2, H * .2, 80, '#2fd06a', { lw: 13, scale: eOutBack(seg(t, o.t0 + 2.6, o.t0 + 2.9)) });
    } else if (o.kind === 'restock') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)); ctx.save(); ctx.translate(W / 2, H * .22); ctx.scale(k, k);
      rrect(-520, -90, 1040, 180, 26, 'rgba(0,0,0,.72)', '#ffd400', 5);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(-470, -42, 84, 84); ctx.fillStyle = '#fff6c8'; ctx.fillRect(-452, -24, 48, 48);
      txt('RESTOCK: UP TO 2× A DAY', 60, -16, 60, '#ffd400', { stroke: false }); txt('while working at their job block', 60, 46, 36, '#fff', { stroke: false, w: 700 }); ctx.restore();
    } else if (o.kind === 'emeralds') {
      rrect(W - 300, 48, 252, 90, 18, 'rgba(0,0,0,.65)', '#2fd06a', 4); icon('emerald', W - 290, 58, 70); txt('× ' + o.n, W - 130, 95, 52, '#fff', { stroke: false });
    }
    else if (o.kind === 'outro') {
      const q = seg(t, 138.6, 139.0), cm = seg(t, 140.4, 140.7), sb = seg(t, 143.0, 143.4), clicked = t > 144.3, end = 1 - seg(t, 146.2, 146.6);
      ctx.save(); ctx.globalAlpha = q * end;
      txt('WHICH TRICK ARE YOU', W / 2, H * .16, 88, '#fff', { lw: 14, scale: eOutBack(q) });
      txt('TRYING FIRST?', W / 2, H * .27, 100, '#ffd400', { lw: 15, scale: eOutBack(q) });
      ctx.globalAlpha = cm * end; [['gapple', '#1'], ['ebook', '#2'], ['stick', '#3']].forEach(([ic, n], i) => { const x = W / 2 + (i - 1) * 230; rrect(x - 95, H * .35, 190, 100, 50, 'rgba(0,0,0,.7)', '#fff', 4); icon(ic, x - 80, H * .35 + 18, 64); txt(n, x + 30, H * .35 + 51, 52, '#fff', { stroke: false }); });
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
const HL = /^(VILLAGER|VILLAGERS|ZOMBIE|RICH|EMERALD|EMERALDS|BROKEN|CURE|DISCOUNTS|SUN|SPLASH|POTION|WEAKNESS|GOLDEN|APPLE|SHAKING|PRICES|ONE|HARD|MENDING|LECTERN|LIBRARIAN|BREAK|TRADES|TRADE|ONCE|LOCKS|FOREVER|JOB|FLETCHER|FLETCHING|STICKS|THIRTY-TWO|FOUR|LOGS|TREE|RESTOCK|TWICE|SUBSCRIBE|HOLLOWCRAFT|TRICK|NUMBER|TWO|THREE|BOOK)$/;
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
const CUTS = [4.0, 6.7, 9.4, 12.0, 14.0, 18.6, 22.4, 28.0, 34.0, 45.6, 56.0, 60.2, 65.0, 82.6, 97.0, 100.8, 104.4, 108.6, 113.8, 116.8, 122.4, 138.4];

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


// Thumbnail hero frame: any timeline moment, no HUD/captions/overlays, optional camera override.
window.renderHero = function (t, cam, opts = {}) {
  const S = stateAt(t); S.overlays = []; S.hud = false; S.fp = false; S.filter = ''; S.nausea = 0; S.flashT = null;
  if (opts.player === false) S.player.visible = false;
  if (cam) S.cam = { pos: V(...cam.pos), look: V(...cam.look), fov: cam.fov || 60 };
  apply(S); renderer.render(scene, camera);
  ctx.save(); ctx.filter = 'saturate(1.35) contrast(1.12)'; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  return comp.toDataURL('image/png');
};
