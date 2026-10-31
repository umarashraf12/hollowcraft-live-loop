// HollowCraft "2 tricks" sample — deterministic voxel renderer.
// window.renderFrame(t) draws the frame at video time t (seconds) and returns a JPEG data URL.
import * as THREE from './node_modules/three/build/three.module.js';

const W = 1080, H = 1920;
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
  for (let x = -3; x <= 3; x++) for (let z = -13; z <= -7; z++) {
    const wall = Math.abs(x) === 3 || z === -13 || z === -7;
    for (let y = 9; y <= 11; y++) if (wall && !(x === 0 && z === -7 && y <= 10)) set(x, y, z, 'obsidian');
    set(x, 12, z, 'obsidian');
  }
  cellMeshes(c);
}
const lavaMoat = new THREE.Group(); scene.add(lavaMoat);
{ const m = new THREE.MeshBasicMaterial({ map: T.lava }); for (let x = -5; x <= 5; x++) for (let z = -15; z <= -5; z++) { const d = Math.max(Math.abs(x), Math.abs(z + 10)); if (d < 4) continue; const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); q.rotation.x = -Math.PI / 2; q.position.set(x + .5, 9.03, z + .5); lavaMoat.add(q); } }
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
const lightPool = []; for (let i = 0; i < 8; i++) { const l = new THREE.PointLight(0xffb050, 0, 13, 1.2); scene.add(l); lightPool.push(l); }
// characters: Pip (little brother) and VOID (shadow villain)
const PIP = makeHuman({ skin: '#e0a27a', hair: '#7a3b12', hood: '#e8742a', shirt: '#f08a2c', pants: '#3a4a6a', shoes: '#2a2a2a', eyeW: '#ffffff', eye: '#2a6ae0', mouth: '#8a4a3a' });
PIP.g.scale.setScalar(.82);
const VOIDM = makeHuman({ skin: '#0b0b14', hair: '#05050a', shirt: '#0b0b14', pants: '#06060c', shoes: '#000000', eyeW: '#0b0b14', eye: '#0b0b14', mouth: '#0b0b14', glow: '#c84bff' });
VOIDM.g.scale.setScalar(1.3); VOIDM.item.visible = false;
VOIDM.mats.forEach(m => { m.transparent = true; m.emissiveIntensity = 0; });

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

PCOL.voidsmoke = ['#140a22', '#2a1046', '#000000', '#5a2a8a']; PCOL.vpoof = ['#c84bff', '#7a2bd6', '#1a0a2a', '#ffffff']; PCOL.glassb = ['#e6f8ff', '#bfe6ff', '#ffffff']; PCOL.fizz = ['#bdbdbd', '#8a8a8a', '#ffd36a']; PCOL.sparkle = ['#fff6b0', '#ffffff', '#ffd23e'];
// ---------- Shorts: helpers ----------
const SHORT = Number(new URLSearchParams(location.search).get('s') || 1);
const CAPS3 = (await (await fetch('./caps.json')).json())[SHORT];
const EYE = 1.62;
function dirFrom(yaw, pitch) { return V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); }
function shake(t, hits) { let a = 0; for (const [h, amp] of hits) { const d = t - h; if (d >= 0 && d < .7) a += amp * (1 - d / .7); } return V(Math.sin(t * 91) * a, Math.sin(t * 73 + 1) * a, Math.cos(t * 67) * a * .6); }
const hemi = scene.children.find(o => o.isHemisphereLight);
const DYN = {};
for (const tex of ['glass', 'iron']) { const m = new THREE.MeshLambertMaterial({ map: T[tex] }); if (tex === 'glass') { m.transparent = true; m.alphaTest = .5; m.side = THREE.DoubleSide; } const im = new THREE.InstancedMesh(box, m, 64); im.frustumCulled = false; scene.add(im); DYN[tex] = im; }
const voidEyes = []; VOIDM.g.traverse(o => { if (o.isMesh && o.material.isMeshBasicMaterial) voidEyes.push(o); });
const NIGHT = { fog: new THREE.Color('#0b1020'), top: new THREE.Color('#05070f'), mid: new THREE.Color('#151b36'), hemi: new THREE.Color('#7080ff') };
const DAY = { fog: SKY.clone(), top: new THREE.Color('#3f86e0'), mid: new THREE.Color('#9fd0ff'), hemi: new THREE.Color('#e8f4ff') };
const SPK = { H: ['HOLLOW', '#3fd8d0'], P: ['PIP', '#ff9a3c'], V: ['VOID', '#c84bff'] };

// ---------- the three stories ----------
function base(t) {
  return { t, env: 'out', night: 0, amb: 1, hits: [], bursts: [], dyn: [], torches: [], lights: [], overlays: [], filter: '', flashT: null, black: 0,
    hollow: { visible: false, pos: V(0, 0, 0), yaw: 0, p: {} }, pip: { visible: false, pos: V(0, 0, 0), yaw: 0, p: {} }, vd: null };
}
const runPose = t => ({ walk: t * 16, walkAmt: 1.6 });
function story1(t) {
  const S = base(t); S.night = seg(t, 14.4, 17.0);
  S.hollow = { visible: true, pos: V(34.5, 9, 38.6), yaw: 0, held: t > 31.5 ? 'torch' : null, p: {} };
  S.pip = { visible: true, pos: V(44.5, 9, 39.2), yaw: 0, held: null, p: {} };
  for (const [x, y, z] of TORCH_RING) S.torches.push([x, y, z, 0, 1]);
  if (S.night > .2) TORCH_RING.slice(0, 6).forEach(([x, , z], i) => S.lights.push([x, 10.2, z, (1.2 + (t > 29.8 && t < 31.6 ? 1.4 : 0)) * S.night]));
  const glassUp = t < 22.7; if (glassUp) for (const c of MANSION_GLASS) S.dyn.push({ c, tex: 'glass' });
  if (t >= 22.7 && t < 23.8) for (const [x, y, z] of MANSION_GLASS.filter(c => c[2] === 37)) S.bursts.push({ type: 'glassb', t0: 22.7, o: V(x + .5, y + .5, z + .9), n: 14, sp: [1, 4], up: [0, 3], g: 16, life: .9, size: .09, seed: x * 3 + y });
  if (t >= 22.7) S.hits.push([22.7, .25]);
  // Pip: brag, laugh, panic, run
  if (t > 11.6 && t < 14.4) S.pip.pos.y = 9 + Math.abs(Math.sin(t * 9)) * .45;
  if (t > 23.9) { const k = seg(t, 23.9, 27.0); const p = V(lerp(44.5, 33.5, k), 9, lerp(39.2, 38.6, k) + Math.sin(k * Math.PI) * 2.2); S.pip.pos = p; S.pip.yaw = -Math.PI / 2; S.pip.p = k < 1 ? runPose(t) : {}; if (k >= 1) S.pip.yaw = 0; S.pip.p.fall = k < 1 ? 0 : 0; }
  if (t > 22.7 && t < 24.0) { S.pip.p = { fall: 1, time: t }; }
  // VOID
  if (t > 19.5 && t < 31.8) {
    const k = seg(t, 19.5, 22.4), k2 = seg(t, 24.0, 29.6);
    let pos = V(44.5, 9, lerp(52, 42.2, eOutC(k)));
    if (t > 24.0) pos = V(lerp(44.5, 38.4, k2), 9, lerp(42.2, 38.7, k2));
    if (t > 29.6) pos.add(V(.6, 0, .35).multiplyScalar(eOutC(seg(t, 29.8, 31.2))));
    S.vd = { pos, yaw: t > 24 ? -2.1 : Math.PI, alpha: seg(t, 19.5, 20.6) * (1 - seg(t, 30.8, 31.6)), arms: t > 22.2 && t < 23.2 ? 1 : 0, scale: 1.3 * (1 - .25 * seg(t, 30.0, 31.4)) };
  }
  if (t >= 31.0 && t < 32.6) S.bursts.push({ type: 'vpoof', t0: 31.0, o: V(38.9, 10.6, 39.1), n: 90, sp: [1, 4], up: [-.5, 3], drag: 1.5, life: 1.4, size: .16, seed: 77 });
  if (t > 3.0 && t < 8.4) S.bursts.push({ type: 'sparkle', t0: 3.0 + Math.floor((t - 3) * 3) / 3, o: V(44.5, 12.8, 37.6), n: 10, sp: [1, 3], up: [-1, 1.5], drag: 2, life: .7, size: .08, seed: Math.floor(t * 3) });
  // cameras
  if (t < 3.0) S.cam = { pos: V(39.8, 16, 56), look: V(40, 10.6, 35), fov: 70 };
  else if (t < 8.4) S.cam = { pos: V(44.5, 10.4, 43.6), look: V(44.5, lerp(10.6, 12.6, eIO(seg(t, 4.2, 8.2))), 37), fov: 64 };
  else if (t < 11.6) S.cam = { pos: V(34.5, 10.7, 42.6), look: V(34.5, 10.5, 37), fov: 62 };
  else if (t < 14.4) S.cam = { pos: V(39.5, 11.6, 47.5), look: V(39.5, 10.2, 37.5), fov: 66 };
  else if (t < 17.0) S.cam = { pos: V(39.8, 16, 56), look: V(40, 10.6, 35), fov: 70 };
  else if (t < 19.5) S.cam = { pos: V(39.5, 11.6, 47.5), look: V(39.5, 10.2, 37.5), fov: 66 };
  else if (t < 22.6) S.cam = { pos: V(45.5, 10.2, 38.4), look: V(44.6, 11.2, 46), fov: 64 };
  else if (t < 23.9) S.cam = { pos: V(44.5, 11.8, 47.5), look: V(44.5, 11, 37), fov: 66 };
  else if (t < 29.6) { const k = seg(t, 23.9, 29.6); S.cam = { pos: V(lerp(42.5, 37.5, k), 12.2, 48), look: V(lerp(42, 36.5, k), 10.2, 38.5), fov: 66 }; }
  else if (t < 32.0) S.cam = { pos: V(37.6, 10.9, 44.2), look: V(36.6, 10.4, 37.8), fov: 64 };
  else if (t < 34.7) S.cam = { pos: V(34.2, 10.6, 42.6), look: V(34.1, 10.4, 37.8), fov: 58 };
  else S.cam = { pos: V(33.7, 10.2, 40.8), look: V(33.5, 10.1, 38.4), fov: 54 };
  if (t > 32.0) S.pip.pos = V(33.3, 9, 38.4);
  S.overlays.push({ kind: 'hook', t0: 0, t1: 3.0, l1: 'POOR vs RICH BASE', l2: '...THEN VOID CAME' });
  if (t > 14.6 && t < 17.0) S.overlays.push({ kind: 'big', t0: 14.6, t1: 17.0, text: 'NIGHTFALL', col: '#9fb4ff', y: .3 });
  if (t > 33.2) S.overlays.push({ kind: 'big', t0: 33.2, t1: 99, text: 'POOR WINS', col: '#ffd400', y: .2 });
  if (t > 36.0) S.overlays.push({ kind: 'end', t0: 36.0, text: 'FOLLOW FOR PART 2' });
  return S;
}
function story2(t) {
  const S = base(t); S.night = seg(t, 10.4, 12.4);
  S.hollow = { visible: true, pos: t < 10.4 ? V(.5, 9, -2.6) : t < 22.4 ? V(lerp(.5, 7, seg(t, 10.4, 12.0)), 9, lerp(-2.6, 2, seg(t, 10.4, 12.0))) : V(.5, 9, lerp(-6.2, -8.0, seg(t, 23.7, 24.6))), yaw: t > 10.4 && t < 22.4 ? .6 : (t >= 22.4 ? Math.PI : 0), held: t > 22.4 && t < 24.9 ? 'torch' : null, p: t > 10.4 && t < 12.0 ? { walk: t * 9 } : {} };
  if (t > 22.4) S.hollow.yaw = Math.PI;
  S.pip = t < 11.4 ? { visible: true, pos: V(.5, 13, -9.5), yaw: 0, p: t > 6.4 && t < 10.4 ? { use: (t * 1.5) % 1 } : {} } : { visible: true, pos: V(-1.5, 9, -11.6), yaw: .6, p: t > 18.5 && t < 25.5 ? { fall: 1, time: t } : {} };
  if (t < 23.6) for (const y of [9, 10]) S.dyn.push({ c: [0, y, -7], tex: 'iron' });
  if (t > 24.9) { S.torches.push([.5, 9, -9.6, 0, 1]); S.lights.push([.5, 10.4, -9.6, 2.4 + (t < 25.6 ? 2 : 0)]); }
  if (t > 18.0 && t < 24.9) S.lights.push([1.8, 11.4, -11.8, 1.0]);
  if (t > 24.9 && t < 25.3) S.flashT = 24.9;
  if (t > 12.4 && t < 26.0) {
    let pos;
    if (t < 15.0) pos = V(.5, 9, lerp(8, -3.6, eOutC(seg(t, 12.4, 14.8))));
    else if (t < 18.0) pos = V(.5, 9 + .55 * Math.sin(Math.PI * seg(t, 15.2, 17.6)), lerp(-3.6, -6.3, eIO(seg(t, 15.2, 17.6))));
    else pos = V(.5, 9, lerp(-6.3, -9.3, eIO(seg(t, 18.6, 20.2))));
    const phase = t > 18.6 && t < 20.2;
    S.vd = { pos, yaw: Math.PI, alpha: seg(t, 12.4, 13.4) * (phase ? .45 + .3 * Math.sin(t * 30) : 1) * (1 - seg(t, 25.2, 26.0)), arms: t > 22.0 && t < 24.6 ? 1 : 0, scale: 1.2 };
  }
  if (t > 25.2 && t < 26.8) S.bursts.push({ type: 'vpoof', t0: 25.2, o: V(.5, 10.4, -9.3), n: 90, sp: [1, 3.5], up: [-.5, 3], drag: 1.5, life: 1.4, size: .14, seed: 78 });
  if (t > 15.0 && t < 17.6) S.bursts.push({ type: 'sparkle', t0: 15 + Math.floor((t - 15) * 4) / 4, o: V(.5, 9.2, -5), n: 6, sp: [.5, 1.5], up: [1, 3], drag: 1, life: .6, size: .07, seed: Math.floor(t * 4) });
  // cameras
  if (t < 4.4) S.cam = { pos: V(5.0, 11.8, 1.5), look: V(.3, 11.4, -9.5), fov: 66 };
  else if (t < 6.4) S.cam = { pos: V(1.5, 10.6, -.2), look: V(.5, 10.5, -3.6), fov: 60 };
  else if (t < 10.4) S.cam = { pos: V(3.0, 13.8, -5.0), look: V(.5, 13.6, -10.3), fov: 64 };
  else if (t < 12.4) S.cam = { pos: V(5.0, 11.8, 1.5), look: V(.3, 11.0, -9.5), fov: 66 };
  else if (t < 15.0) S.cam = { pos: V(4.2, 11.8, -5.4), look: V(.5, 10.5, 2), fov: 66 };
  else if (t < 18.0) S.cam = { pos: V(6.2, 11.2, -4.4), look: V(.5, 10.4, -5.6), fov: 64 };
  else if (t < 27.0) S.cam = { pos: V(-2.2, 11.0, -12.5), look: V(.3, 10.0, -7.6), fov: 76 };
  else if (t < 30.9) S.cam = { pos: V(2.5, 11.0, -12.5), look: V(-.2, 10.1, -8.6), fov: 76 };
  else S.cam = { pos: V(-.4, 10.3, -9.9), look: V(-1.5, 10, -11.6), fov: 58 };
  if (t > 27.0) { S.pip.pos = V(-1.3, 9, -11.0); S.pip.p = {}; S.hollow.pos = V(.9, 9, -8.6); S.hollow.yaw = Math.PI + .5; }
  const st = (lab, tc, tx) => [lab, t > tc ? (tx && t > tx ? 'x' : 'ok') : null];
  if (t > 6.6 && t < 22.4) S.overlays.push({ kind: 'check', items: [st('LAVA MOAT', 6.8, 15.8), st('OBSIDIAN WALLS', 7.8, 19.6), st('IRON DOOR', 8.6, 21.4)] });
  S.overlays.push({ kind: 'hook', t0: 0, t1: 3.2, l1: 'MAX SECURITY HOUSE', l2: 'vs VOID' });
  if (t > 27.8) S.overlays.push({ kind: 'big', t0: 27.8, t1: 99, text: '1 TORCH > 10,000 BLOCKS', col: '#ffd36a', y: .18, size: 84 });
  if (t > 33.0) S.overlays.push({ kind: 'end', t0: 33.0, text: 'FOLLOW FOR PART 3' });
  return S;
}
function story3(t) {
  const S = base(t); S.env = 'room';
  const outs = [7.0, 10.0, 12.0, 15.0];
  ROOM_TORCHES.forEach(([x, y, z, i]) => { const lit = t < outs[i] ? 1 : 0; S.torches.push([x, y, z, i, lit]); if (lit) S.lights.push([x + (i === 1 ? .6 : i === 2 ? -.6 : 0), y + .5, z + (i === 0 ? .6 : i === 3 ? -.6 : 0), 1.1 + Math.sin(t * 13 + i) * .08]);
    if (t >= outs[i] && t < outs[i] + 1) S.bursts.push({ type: 'fizz', t0: outs[i], o: V(x, y + .7, z), n: 18, sp: [.2, .8], up: [.5, 1.5], drag: 1, life: .9, size: .07, seed: i + 5 }); });
  const spare = t >= 24.0 && t < 30.2;
  if (t >= 24.0) S.torches.push([2.5, 100, 62.5, 9, spare ? 1 : 0]);
  if (spare) { S.lights.push([2.5, 101.3, 62.5, 2.2 + (t < 24.6 ? 2.5 : 0)]); }
  if (t > 24.0 && t < 24.35) S.flashT = 24.0;
  S.amb = .16; S.lights.push([4.6, 101.6, 62.5, .55]);
  S.hollow = { visible: true, pos: V(3.4, 100, 62.4), yaw: -2.2, held: t > 23.4 && t < 24.0 ? 'torch' : null, p: t > 23.4 && t < 24.2 ? { use: seg(t, 23.6, 24.0) } : {} };
  S.pip = { visible: true, pos: V(1.5, 100, 61.6), yaw: .9, p: t > 25.4 && t < 26.4 ? { fall: 1, time: t } : (t > 12.6 && t < 15.5 ? { fall: .6, time: t } : {}) };
  if (t > 25.4 && t < 26.2) S.pip.pos.y += Math.abs(Math.sin((t - 25.4) * 8)) * .5;
  if (t > 17.0 && t < 24.6) S.vd = { pos: V(.7, 100, 60.6), yaw: .5, alpha: t > 24.0 ? 1 - seg(t, 24.05, 24.5) : 1, eyes: seg(t, 17.0, 17.6), arms: t > 22.0 ? 1 : 0, scale: 1.25 + .15 * seg(t, 22.0, 23.6), lean: seg(t, 22.0, 23.6) };
  if (t > 30.6) S.vd = { pos: V(4.4, 100, 64.2), yaw: -2.4, alpha: 1, eyes: seg(t, 30.6, 31.0), arms: 0, scale: 1.3 };
  if (t > 24.3 && t < 25.8) S.bursts.push({ type: 'vpoof', t0: 24.3, o: V(.8, 101.6, 60.9), n: 80, sp: [1, 3], up: [-.5, 2.5], drag: 1.5, life: 1.3, size: .13, seed: 79 });
  if (t >= 30.2 && t < 31.0) S.bursts.push({ type: 'fizz', t0: 30.2, o: V(2.5, 100.8, 62.5), n: 18, sp: [.2, .8], up: [.5, 1.5], drag: 1, life: .9, size: .07, seed: 31 });
  // cameras
  if (t < 7.0) S.cam = { pos: V(4.4, 101.7, 64.5), look: V(1.8, 100.9, 61.0), fov: 70 };
  else if (t < 15.0) S.cam = { pos: V(3.6, 101.2, 63.9), look: V(1.4, 101.1, 60.6), fov: 66 };
  else if (t < 18.2) S.cam = { pos: V(4.0, 101.4, 64.2), look: V(1.2, 101.0, 60.8), fov: 66 };
  else if (t < 20.4) S.cam = { pos: V(2.0, 101.55, 61.4), look: V(3.4, 101.4, 62.4), fov: 58 };
  else if (t < 24.0) { const k = seg(t, 20.4, 24.0); S.cam = { pos: V(lerp(2.9, 2.4, k), 101.2, lerp(63.4, 62.7, k)), look: V(1.2, 101.3, 61.0), fov: lerp(60, 52, k) }; }
  else if (t < 27.4) S.cam = { pos: V(4.4, 101.7, 64.5), look: V(1.8, 100.9, 61.0), fov: 70 };
  else if (t < 30.2) S.cam = { pos: V(2.0, 101.4, 63.9), look: V(3.4, 101.3, 62.4), fov: 58 };
  else { const k = seg(t, 30.6, 33.0); S.cam = { pos: V(lerp(1.2, 2.4, k), 101.4, lerp(61.6, 62.6, k)), look: V(lerp(3.6, 4.3, k), 101.5, lerp(63.0, 64.0, k)), fov: lerp(62, 44, k) }; }
  S.black = seg(t, 33.0, 33.25);
  if (t > 15.0 && t < 24.0) S.hits.push([15.0, .04]);
  if (t > 22.0 && t < 23.0) S.hits.push([22.0, .03]);
  S.overlays.push({ kind: 'hook', t0: 0, t1: 3.2, l1: 'THE TORCHES WENT OUT', l2: '...THEN VOID APPEARED' });
  if (t > 6.0 && t < 15.6) S.overlays.push({ kind: 'torchCount', n: outs.filter(o => t < o).length });
  if (t > 33.3) S.overlays.push({ kind: 'big', t0: 33.3, t1: 99, text: 'PART 2?', col: '#c84bff', y: .45, size: 170 });
  return S;
}
const stateAt = [null, story1, story2, story3][SHORT];

// ---------- apply ----------
function applyHuman(h, st) {
  h.g.visible = !!st.visible; if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(0, st.yaw || 0, 0); pose(h, st.p || {});
  if (st.held) { h.item.visible = true; h.item.material.map = ICON[st.held]; } else h.item.visible = false;
}
function apply(S) {
  const t = S.t;
  const k = S.env === 'room' ? 1 : S.night;
  scene.fog.color.copy(DAY.fog).lerp(NIGHT.fog, k); scene.fog.near = lerp(70, S.env === 'room' ? 6 : 30, k); scene.fog.far = lerp(200, S.env === 'room' ? 30 : 95, k);
  const dome = scene.userData.dome; dome.material.uniforms.top.value.copy(DAY.top).lerp(NIGHT.top, k); dome.material.uniforms.mid.value.copy(DAY.mid).lerp(NIGHT.mid, k);
  scene.userData.sun.visible = k < .6; scene.userData.sun.material.opacity = 1 - k; clouds.visible = true;
  hemi.color.copy(DAY.hemi).lerp(NIGHT.hemi, k); hemi.intensity = S.env === 'room' ? S.amb : lerp(1.05, .34, k); sunL.intensity = S.env === 'room' ? 0 : lerp(1.5, .05, k);
  scene.background = null;
  applyHuman(PLAYER, S.hollow); applyHuman(PIP, S.pip);
  [GHOST, GHOST2, MOB].forEach(h => h.g.visible = false); waterPool.forEach(w => w.visible = false); outline.visible = false; trail.visible = false; orb.visible = false; fp.visible = false;
  // VOID
  VOIDM.g.visible = !!S.vd;
  if (S.vd) { const v = S.vd; VOIDM.g.position.copy(v.pos); VOIDM.g.rotation.set(v.lean ? v.lean * .25 : 0, v.yaw, 0); VOIDM.g.scale.setScalar(v.scale || 1.3);
    pose(VOIDM, { zombie: !!v.arms, walk: 0 }); VOIDM.headP.rotation.x = Math.sin(t * 2) * .08;
    VOIDM.mats.forEach(m => m.opacity = v.alpha); voidEyes.forEach(e => { e.visible = v.alpha > .05 && (v.eyes ?? 1) > .05; e.scale.setScalar(1 + (v.eyes != null ? (1 - v.eyes) * -.9 : 0) + Math.sin(t * 9) * .05); });
    VOIDM.g.position.y += Math.sin(t * 2.4) * .06; }
  // dynamic blocks
  const cnt = { glass: 0, iron: 0 };
  for (const d of S.dyn) { const im = DYN[d.tex]; const i = cnt[d.tex]++; if (i >= 64) continue; m4.makeTranslation(d.c[0] + .5, d.c[1] + .5, d.c[2] + .5); im.setMatrixAt(i, m4); }
  for (const [kk, im] of Object.entries(DYN)) { for (let i = cnt[kk]; i < 64; i++) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; }
  // torches + lights
  torchPool.forEach((g, i) => { const tt = S.torches[i]; g.visible = !!tt; if (!tt) return; const [x, y, z, wall, lit] = tt; g.position.set(x, y, z);
    g.rotation.set(0, 0, 0); if (S.env === 'room' && wall < 4) { if (wall === 0) g.rotation.x = .35; if (wall === 3) g.rotation.x = -.35; if (wall === 1) g.rotation.z = -.35; if (wall === 2) g.rotation.z = .35; g.position.y -= .2; }
    g.userData.flame.visible = lit > 0; g.userData.flame.scale.setScalar(1 + Math.sin(t * 17 + i) * .12); });
  lightPool.forEach((l, i) => { const L = S.lights[i]; l.intensity = L ? L[3] : 0; if (L) l.position.set(L[0], L[1], L[2]); });
  // camera
  const c = S.cam; camera.fov = c.fov || 64; camera.updateProjectionMatrix();
  const sh = shake(t, S.hits); camera.position.copy(c.pos).add(sh); camera.lookAt(c.look.clone().add(sh));
  dome.position.copy(camera.position); scene.userData.sun.position.copy(camera.position).add(V(120, 220, -260)); clouds.position.x = t * 1.2;
  T.lava.offset.set(t * .05, t * .03);
  // particles (+ VOID smoke)
  const plist = [];
  for (const b of S.bursts) burstParticles(b, t, plist);
  if (S.vd && S.vd.alpha > .1) for (let i = 0; i < 46; i++) { const ph = (t * .45 + i / 46) % 1, a = i * 2.39; const p = S.vd.pos; const sc = S.vd.scale || 1.3;
    plist.push([p.x + Math.cos(a) * .35 * (1 + ph) * sc, p.y + (.2 + ph * 1.9) * sc, p.z + Math.sin(a) * .35 * (1 + ph) * sc, (S.env === 'room' || SHORT === 2 && t > 18 ? .09 : .22) * (1 - ph) * S.vd.alpha, PCOL.voidsmoke[i % 4]]); }
  const col = new THREE.Color();
  for (let i = 0; i < PMAX; i++) { if (i < plist.length) { const [x, y, z, s, cc] = plist[i]; m4.makeScale(s, s, s).setPosition(x, y, z); col.set(cc); } else m4.makeScale(0, 0, 0); parts.setMatrixAt(i, m4); parts.setColorAt(i, i < plist.length ? col : col.set('#000')); }
  parts.instanceMatrix.needsUpdate = true; parts.instanceColor.needsUpdate = true;
  ringPool.forEach(r => r.visible = false);
}

// ---------- overlays (vertical-safe: keep text between 12% and 72% of the height) ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const ctx = comp.getContext('2d');
const FONT = (s, w = 900) => `${w} ${s}px "Inter", "Inter Display", sans-serif`;
function txt(s, x, y, size, fill, o = {}) {
  ctx.save(); ctx.font = FONT(size, o.w || 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.rot || o.scale) { ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale); x = 0; y = 0; }
  ctx.globalAlpha *= (o.alpha ?? 1);
  if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.strokeCol || '#000'; ctx.lineWidth = o.lw || size * .17; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
}
function fit(s, size, maxW) { ctx.font = FONT(size); const w = ctx.measureText(s).width; return w > maxW ? size * maxW / w : size; }
function rrect(x, y, w, h, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function wrap(words, size, maxW) { ctx.font = FONT(size); const lines = [[]]; for (const w of words) { const cur = lines[lines.length - 1]; const test = [...cur, w].join(' '); if (ctx.measureText(test).width > maxW && cur.length) lines.push([w]); else cur.push(w); } return lines; }
function drawOverlays(S) {
  const t = S.t;
  for (const o of S.overlays) {
    if (o.kind === 'hook') { if (t > o.t1) continue; const k = eOutBack(seg(t, o.t0 + .05, o.t0 + .4)), out = seg(t, o.t1 - .3, o.t1);
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(W / 2, H * .15); ctx.scale(k, k); ctx.rotate(-.03);
      const s1 = fit(o.l1, 92, W - 90), s2 = fit(o.l2, 84, W - 160); txt(o.l1, 0, -70, s1, '#ffffff', { lw: s1 * .17 }); ctx.font = FONT(s2); const w = ctx.measureText(o.l2).width + 70; rrect(-w / 2, 10, w, 120, 18, '#e53935', '#000', 7); txt(o.l2, 0, 74, s2, '#ffd400', { lw: 12 }); ctx.restore(); }
    else if (o.kind === 'big') { const k = eOutBack(seg(t, o.t0, o.t0 + .35)), out = o.t1 < 90 ? seg(t, o.t1 - .3, o.t1) : 0, sz = fit(o.text, o.size || 120, W - 100); txt(o.text, W / 2, H * o.y, sz, o.col, { scale: Math.max(.01, k), alpha: 1 - out, rot: -.03, lw: sz * .17 }); }
    else if (o.kind === 'end') { const k = eOutBack(seg(t, o.t0, o.t0 + .35)); ctx.save(); ctx.translate(W / 2, H * .7); ctx.scale(k, k); ctx.font = FONT(64); const w = ctx.measureText(o.text).width + 90; rrect(-w / 2, -58, w, 116, 58, '#e53935', '#000', 6); txt(o.text, 0, 4, 64, '#fff', { stroke: false }); ctx.restore(); }
    else if (o.kind === 'check') { const x0 = 70, y0 = H * .1; rrect(x0 - 20, y0 - 20, 640, 70 + o.items.length * 92, 24, 'rgba(0,0,0,.72)', '#ffd400', 5); txt('SECURITY', x0 + 300, y0 + 26, 50, '#ffd400', { stroke: false });
      o.items.forEach(([lab, stt], i) => { const y = y0 + 100 + i * 92; ctx.save(); ctx.globalAlpha = stt ? 1 : .35; txt(lab, x0 + 90, y, 46, stt === 'x' ? '#ff6b6b' : '#fff', { align: 'left', stroke: false });
        ctx.lineWidth = 11; ctx.lineCap = 'round';
        if (stt === 'ok') { ctx.strokeStyle = '#5cff7a'; ctx.beginPath(); ctx.moveTo(x0 + 10, y); ctx.lineTo(x0 + 28, y + 18); ctx.lineTo(x0 + 60, y - 20); ctx.stroke(); }
        if (stt === 'x') { ctx.strokeStyle = '#ff3b3b'; ctx.beginPath(); ctx.moveTo(x0 + 12, y - 20); ctx.lineTo(x0 + 52, y + 20); ctx.moveTo(x0 + 52, y - 20); ctx.lineTo(x0 + 12, y + 20); ctx.stroke(); ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 + 86, y + 2); ctx.lineTo(x0 + 90 + ctx.measureText(lab).width * 0 + 380, y + 2); ctx.stroke(); }
        ctx.restore(); }); }
    else if (o.kind === 'torchCount') { rrect(W / 2 - 230, H * .12, 460, 120, 60, 'rgba(0,0,0,.7)', '#ffd36a', 5); for (let i = 0; i < 4; i++) { const x = W / 2 - 150 + i * 100, on = i < o.n; ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 6, H * .12 + 50, 12, 50); ctx.fillStyle = on ? '#ffd36a' : '#444'; ctx.fillRect(x - 12, H * .12 + 26, 24, 24); } }
  }
}
function drawCaption(t) {
  const c = CAPS3.find(([a, b]) => t >= a && t < b + .25); if (!c) return;
  const [a, b, who, line] = c, [name, col] = SPK[who]; const k = eOutBack(seg(t, a, a + .15));
  const words = line.toUpperCase().split(/\s+/), lines = wrap(words, 76, W - 140); const y0 = H * .71;
  ctx.save(); ctx.translate(W / 2, y0); ctx.scale(k, k);
  ctx.font = FONT(44); const nw = ctx.measureText(name).width + 50; rrect(-nw / 2, -lines.length * 46 - 92, nw, 66, 33, col, '#000', 5); txt(name, 0, -lines.length * 46 - 58, 44, '#111', { stroke: false });
  let wi = 0; const total = words.length;
  lines.forEach((ln, li) => { ctx.font = FONT(76); const lw = ctx.measureText(ln.join(' ')).width; let x = -lw / 2; const y = (li - (lines.length - 1) / 2) * 92;
    for (const w of ln) { const ww = ctx.measureText(w).width, on = t >= a + (b - a) * wi / total; txt(w, x + ww / 2, y, 76, on ? (who === 'H' ? '#ffffff' : col) : 'rgba(255,255,255,.55)', { lw: 14, alpha: on ? 1 : .6 }); x += ww + ctx.measureText(' ').width; wi++; } });
  ctx.restore();
}
window.renderFrame = function (t) {
  const S = stateAt(t); apply(S); renderer.render(scene, camera);
  ctx.save(); ctx.filter = S.filter || 'none'; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  if (S.flashT != null) { const d = t - S.flashT; if (d >= 0 && d < .35) { ctx.fillStyle = `rgba(255,240,200,${(1 - d / .35) * .9})`; ctx.fillRect(0, 0, W, H); } }
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (S.black > 0) { ctx.fillStyle = `rgba(0,0,0,${S.black})`; ctx.fillRect(0, 0, W, H); }
  drawOverlays(S); drawCaption(t);
  txt('HollowCraft', W - 40, H * .045, 34, 'rgba(255,255,255,.8)', { align: 'right', lw: 6, w: 800 });
  if (t < .2) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .2})`; ctx.fillRect(0, 0, W, H); }
  return comp.toDataURL('image/jpeg', .9);
};
window.READY = true;
