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

// ---------- scene state helpers ----------
const EYE = 1.62;
function dirFrom(yaw, pitch) { return V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)); }
function shake(t, hits) { let a = 0; for (const [h, amp] of hits) { const d = t - h; if (d >= 0 && d < .7) a += amp * (1 - d / .7); } return V(Math.sin(t * 91) * a, Math.sin(t * 73 + 1) * a, Math.cos(t * 67) * a * .6); }

// Clutch, game-time u from walk start (real physics, g=32 b/s^2)
const CL = { x: .5, zA: -18.6, zB: -17.72, ust: .6, top: 64, ground: 9 };
const CL_LAND = CL.ust + Math.sqrt((64 - 9) / 16), CL_PLACE = CL.ust + Math.sqrt((64 - 11) / 16);
function clutchPos(u) {
  if (u < CL.ust) return V(CL.x, 64, lerp(CL.zA, CL.zB, u / CL.ust));
  if (u < CL_LAND) { const tau = u - CL.ust; return V(CL.x, 64 - 16 * tau * tau, CL.zB + 1.2 * tau); }
  return V(CL.x, 9, -15.5);
}
function waterState(placeT, scoopT, t) {
  if (t < placeT || t > scoopT + .25) return null;
  return { amt: clamp((t - placeT) / .45), alpha: t > scoopT ? 1 - (t - scoopT) / .25 : 1 };
}

// generic smash flight: keyframes of [t, y, ease] + z keyframes
function keyed(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) { const [t1, v1, e] = keys[i], [t0, v0] = keys[i - 1]; if (t <= t1) { const k = (t - t0) / (t1 - t0); const f = e === 'out' ? eOutC(k) : e === 'in' ? eInQ(k) : e === 'io' ? eIO(k) : k; return lerp(v0, v1, f); } }
  return keys[keys.length - 1][1];
}

// Trick-2 narrated timing (also used by replay through a time map)
const S2 = { x: 40, z0: 30, burst: 69.3, throwT: 69.0, apex: 72.3, dive: 77.4, impact: 80.3, apexY: 29 };
const mob2z = t => 52 - .8 * (t - 58);
const S2_MOBZ = mob2z(S2.impact);
const S2Y = [[0, 9], [S2.burst, 9], [S2.apex, S2.apexY, 'out'], [S2.dive, S2.apexY + .6, 'io'], [S2.impact, 11.1, 'in'], [S2.impact + .35, 12.2, 'out'], [S2.impact + .75, 9, 'in']];
const S2Z = [[0, S2.z0], [S2.burst, S2.z0], [S2.apex, 31, 'out'], [S2.dive, 31.5], [S2.impact, S2_MOBZ - .3, 'in']];

// Double-charge demo
const S3 = { b1: 92.0, a1: 93.0, b2: 93.2, a2: 94.6, dive: 95.6, impact: 97.6, z0: 30 };
const mob3z = t => 46 - .8 * (t - 90.5);
const S3_MOBZ = mob3z(S3.impact);
const S3Y = [[0, 9], [S3.b1, 9], [S3.a1, 21, 'out'], [S3.b2, 21.3, 'io'], [S3.a2, 40, 'out'], [S3.dive, 40.6, 'io'], [S3.impact, 11.1, 'in'], [S3.impact + .35, 12.3, 'out'], [S3.impact + .8, 9, 'in']];
const S3Z = [[0, 30], [S3.b1, 30], [S3.a2, 32.5, 'io'], [S3.impact, S3_MOBZ - .3, 'in']];

// intro preview smash
const SI = { burst: 5.75, apex: 6.75, dive: 7.05, impact: 7.85, z0: 30 };
const mobIz = t => 40 - .8 * (t - 5.0);
const SI_MOBZ = mobIz(SI.impact);
const SIY = [[0, 9], [SI.burst, 9], [SI.apex, 24, 'out'], [SI.dive, 24.4, 'io'], [SI.impact, 11.1, 'in'], [SI.impact + .35, 12, 'out'], [SI.impact + .75, 9, 'in']];
const SIZ = [[0, 30], [SI.burst, 30], [SI.impact, SI_MOBZ - .3, 'io']];

function mobState(z, t, impact, alive0 = true) {
  const dead = impact != null ? clamp((t - impact) / .55) : 0;
  return { pos: V(40, 9, z), yaw: Math.PI, walk: t * 5, alive: alive0 && t < (impact ?? 1e9) + .6, dead, hurt: impact != null && t >= impact };
}

// ---------- the timeline ----------
function stateAt(t) {
  const S = { t, hud: false, fp: false, fov: 70, held: 'sword', slot: 0, swing: 0, counts: { ...COUNTS }, bursts: [], rings: [], water: null, waterCell: V(0, 9, -16),
    player: { visible: true, pos: V(.5, 9, 0), yaw: 0, p: {} }, mob: null, ghosts: [], overlays: [], hits: [], filter: '', trail: null, outline: false, orb: null };
  const W2 = S.counts; // shorthand

  // shared water state for the narrated clutch (fp 23–38, replay 38–51)
  const clutchFX = (landT, placeT) => { S.bursts.push({ type: 'splash', t0: landT, o: V(.5, 9.6, -15.5), n: 90, sp: [2, 6], up: [4, 9], g: 22, life: 1.1, size: .13, seed: 11, floor: 9 }); };

  if (t < 2.8) { // INTRO shot 1: push-in on player at the cliff edge
    const k = eIO(seg(t, 0, 2.8));
    S.cam = { pos: V(lerp(7, 3.2, k), lerp(57, 63.8, k), lerp(-4, -13.8, k)), look: V(.5, 65.2, -18.6), fov: 55 };
    S.player.pos = V(.5, 64, -18.6); S.player.yaw = 0; S.player.p = { walk: 0 };
    S.overlays.push({ kind: 'hookTag', t0: .1 });
  } else if (t < 5.6) { // INTRO shot 2: real-time clutch, side tracking cam
    const u = t - 2.8, p = clutchPos(u);
    S.player.pos = p; S.player.p = { walk: u < CL.ust ? u * 9 : 0, fall: u > CL.ust && u < CL_LAND ? 1 : 0, time: t, use: seg(u, CL_PLACE - .1, CL_PLACE + .25) };
    S.player.held = u > CL_PLACE ? 'bucket' : 'bucketW';
    const cp = V(p.x + 7, Math.max(p.y + 2.2, 11.5), p.z + 2.5);
    S.cam = { pos: cp, look: V(p.x, p.y + .8, p.z), fov: 58 };
    S.water = waterState(2.8 + CL_PLACE, 99, t);
    S.bursts.push({ type: 'splash', t0: 2.8 + CL_LAND, o: V(.5, 9.6, -15.5), n: 90, sp: [2, 6], up: [4, 9], g: 22, life: 1.1, size: .13, seed: 12, floor: 9 });
    S.hits.push([2.8 + CL_LAND, .08]);
  } else if (t < 9.6) { // INTRO shot 3: smash preview, wide side
    const y = keyed(SIY, t), z = keyed(SIZ, t);
    S.player.pos = V(40, y, z); S.player.yaw = 0;
    S.player.held = t < SI.apex ? 'wind' : 'mace';
    S.player.p = { walk: 0, smash: t > SI.dive && t < SI.impact + .3 ? seg(t, SI.dive, SI.impact) : null, use: seg(t, SI.burst - .25, SI.burst + .1) };
    S.mob = mobState(mobIz(Math.min(t, SI.impact)), t, SI.impact);
    { const mz = mobIz(Math.min(t, SI.impact)), my = Math.min(y, 26); S.cam = { pos: V(54, Math.max(11.5, my * .6 + 5), lerp(z, mz, .5) - 3), look: V(40, lerp(my + .9, 10.5, .45), lerp(z, mz, .5)), fov: 60 }; }
    S.rings.push({ t0: SI.burst, o: V(40, 9.1, 30), r: 3.2, life: .55, col: '#e6f4ff', flat: true });
    S.bursts.push({ type: 'wind', t0: SI.burst, o: V(40, 9.3, 30), n: 70, sp: [7, 12], up: [0, 3], drag: 3, life: .7, size: .2, seed: 13 });
    smashFX(S, SI.impact, V(40, 9.05, SI_MOBZ), 1);
    if (t > SI.impact - .1 && t < SI.impact + .9) S.overlays.push({ kind: 'pop', t0: SI.impact, text: 'ONE HIT!', x: W / 2, y: H * .3, size: 120, col: '#ffd400' });
  } else if (t < 14.0) { // TITLE CARD over orbiting cinematic
    const a = deg(200) + (t - 9.6) * .09;
    S.cam = { pos: V(Math.cos(a) * 46, 52, -27 + Math.sin(a) * 46), look: V(0, 40, -20), fov: 55 };
    S.player.pos = V(.5, 64, -18.6); S.player.yaw = 0;
    S.overlays.push({ kind: 'title', t0: 9.6, t1: 14.0 });
  } else if (t < 17.4) { // TRICK 1 CARD
    const a = deg(250) + (t - 14) * .12;
    S.cam = { pos: V(Math.cos(a) * 34, 24 + (t - 14) * 3, -10 + Math.sin(a) * 34), look: V(0, 45, -22), fov: 55 };
    S.player.pos = V(.5, 64, -21); S.player.yaw = 0;
    S.overlays.push({ kind: 'card', t0: 14.0, t1: 17.4, num: '#1', name: 'WATER BUCKET CLUTCH' });
  } else if (t < 38.4) { // TRICK 1 first-person
    S.fp = true; S.hud = true; S.player.visible = false;
    let p, pitch = deg(-8), yaw = 0, bob = 0;
    const FALL0 = 19.4;
    // fall timing: real until 20.3 (tau .9), frozen 20.3–23.0, slow-mo tau .9→1.854 over 23.0–32.8
    const tauAt = tt => tt < FALL0 ? 0 : tt < 20.3 ? tt - FALL0 : tt < 23.0 ? .9 : lerp(.9, 1.854, seg(tt, 23.0, 32.8));
    const tW = t >= 20.3 && t < 23.0 ? 20.3 : t; // world time freezes
    if (t < FALL0) { const k = seg(t, 17.4, FALL0); p = V(.5, 64, lerp(-23, CL.zB, k)); bob = Math.sin(t * 9) * .05; pitch = deg(lerp(-6, -22, seg(t, 18.6, FALL0))); }
    else if (t < 32.8) { const tau = tauAt(t); p = V(.5, 64 - 16 * tau * tau, CL.zB + 1.2 * tau); pitch = deg(lerp(-22, -40, seg(t, FALL0, 20.3))); pitch = lerp(pitch, deg(-88), eIO(seg(t, 26.3, 27.6))); }
    else { p = V(.5, 9 - .25 * Math.sin(Math.PI * seg(t, 32.8, 33.4)), -15.5); pitch = lerp(deg(-88), deg(-4), eIO(seg(t, 33.6, 34.8))); }
    S.cam = { pos: V(p.x, p.y + EYE + bob, p.z), yaw, pitch, fov: lerp(70, 82, seg(t, 23, 32.8)) * (t > 32.8 ? 1 : 1) };
    if (t >= 32.8) S.cam.fov = lerp(82, 70, seg(t, 32.8, 33.6));
    S.slot = t < 23.6 ? 0 : 2; S.held = t < 23.6 ? 'sword' : (t < 32.42 ? 'bucketW' : 'bucket');
    S.swing = seg(t, 23.6, 23.9) * 0 + (t > 32.42 && t < 32.8 ? seg(t, 32.42, 32.8) : 0);
    S.switchT = t >= 23.6 ? 23.6 : null;
    S.water = waterState(32.42, 99, t);
    if (t >= 32.8) clutchFX(32.8); S.hits.push([32.8, .12]);
    if (t >= 20.3 && t < 23.0) { S.filter = 'saturate(0.25) contrast(1.15) brightness(0.9)'; S.overlays.push({ kind: 'freeze', t0: 20.3, t1: 23.0 }); S.freezeZoom = 1 + seg(t, 20.3, 23.0) * .06; }
    if (t >= 23.0 && t < 32.8) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 23.0 });
    if (t >= 23.6 && t < 26.0) S.overlays.push({ kind: 'slotHint', slot: 2, text: 'WATER BUCKET', t0: 23.6 });
    if (t >= 30.6 && t < 32.8) { const h = Math.max(0, p.y - 9); S.overlays.push({ kind: 'meter', text: `${h.toFixed(1)} BLOCKS TO GROUND`, col: h < 2.3 ? '#ffd400' : '#ffffff' }); }
    if (t >= 33.6 && t < 38.4) S.overlays.push({ kind: 'pop', t0: 34.0, text: 'NO FALL DAMAGE', sub: 'FULL HEALTH', x: W / 2, y: H * .36, size: 96, col: '#5cff7a' });
    if (t >= 33.9) S.heartGlow = seg(t, 33.9, 34.3) * (1 - seg(t, 36.5, 37.5));
    void tW;
  } else if (t < 50.8) { // TRICK 1 replay / explanation, side view
    const tauAt = tt => tt < 40.4 ? lerp(1.58, 1.817, seg(tt, 38.4, 40.4)) : tt < 44.2 ? 1.817 : lerp(1.817, 1.854, seg(tt, 44.2, 44.6));
    let p;
    if (t < 44.6) { const tau = tauAt(t); p = V(.5, 64 - 16 * tau * tau, CL.zB + 1.2 * tau); S.player.p = { fall: 1, time: t < 40.4 ? t : 40.4, use: seg(t, 44.0, 44.4) }; }
    else if (t < 47.6) { p = V(.5, 9, -15.5); S.player.p = { walk: 0, use: seg(t, 46.9, 47.3), lookDown: .5 }; }
    else { const k = seg(t, 47.6, 50.8); p = V(.5, 9 + Math.max(0, Math.sin(Math.PI * seg(t, 47.6, 48.0))) * .6, lerp(-15.5, -11.8, k)); S.player.p = { walk: t * 9 }; }
    S.player.pos = p; S.player.yaw = 0; S.player.held = t < 44.2 ? 'bucketW' : (t < 47.0 ? 'bucket' : 'bucketW');
    S.water = waterState(44.2, 47.0, t);
    if (t >= 44.6) S.bursts.push({ type: 'splash', t0: 44.6, o: V(.5, 9.6, -15.5), n: 70, sp: [1.5, 4], up: [3, 7], g: 22, life: 1, size: .12, seed: 21, floor: 9 });
    S.cam = { pos: V(12.5, 12.6, lerp(-13.6, -12.6, seg(t, 38.4, 50.8))), look: V(.5, 11.7, -14.6), fov: 52 };
    S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 38.4 });
    if (t >= 40.4 && t < 44.3) { S.outline = true; S.overlays.push({ kind: 'bracket', a: V(.5, 9, -15.5), b: V(.5, 11, -15.5), text: '2 BLOCKS', t0: 40.4 }); S.overlays.push({ kind: 'worldTag', at: V(.5, 14.3, -15.5), text: 'PLACE WATER NOW', col: '#ffd400', t0: 40.6 }); }
    if (t >= 42.4 && t < 44.3) {
      S.ghosts.push({ h: GHOST, pos: V(.5, 14.0, -12.6), t0: 42.4 }); S.overlays.push({ kind: 'worldTag', at: V(.5, 16.6, -12.6), text: 'TOO EARLY', col: '#ff5252', t0: 42.4, x: true });
      if (t >= 43.2) { S.ghosts.push({ h: GHOST2, pos: V(.5, 9.3, -10.6), t0: 43.2 }); S.overlays.push({ kind: 'worldTag', at: V(.5, 11.9, -10.6), text: 'TOO LATE', col: '#ff5252', t0: 43.2, x: true }); }
    }
    if (t >= 46.9 && t < 49.5) S.overlays.push({ kind: 'worldTag', at: V(.5, 11.9, -15.5), text: 'SCOOP IT BACK UP', col: '#5ac8ff', t0: 46.9 });
  } else if (t < 58.0) { // montage: two real-speed clutches
    const A = 50.8, B = 54.6, base = t < B ? A : B, u = t - base, p = clutchPos(u);
    S.player.pos = p; S.player.p = { walk: u < CL.ust ? u * 9 : 0, fall: u > CL.ust && u < CL_LAND ? 1 : 0, time: t, use: Math.max(seg(u, CL_PLACE - .1, CL_PLACE + .2), seg(u, CL_LAND + .8, CL_LAND + 1.1)) };
    S.player.held = u > CL_PLACE && u < CL_LAND + .9 ? 'bucket' : 'bucketW';
    S.water = waterState(base + CL_PLACE, base + CL_LAND + .9, t);
    S.bursts.push({ type: 'splash', t0: base + CL_LAND, o: V(.5, 9.6, -15.5), n: 90, sp: [2, 6], up: [4, 9], g: 22, life: 1.1, size: .13, seed: 30 + (base | 0), floor: 9 });
    S.hits.push([base + CL_LAND, .06]);
    if (base === A) S.cam = { pos: V(p.x - 6.5, Math.max(p.y + 1.8, 11), p.z + 3.5), look: V(p.x, p.y + .9, p.z), fov: 60 };
    else S.cam = { pos: V(p.x + 3.5, Math.max(p.y + 4.5, 13.5), p.z + 4), look: V(p.x, p.y + .5, p.z), fov: 66 };
    S.hud = true;
    S.overlays.push({ kind: 'pill', text: 'REAL SPEED', col: '#2e7d32', t0: 50.8 });
    S.slot = 2; S.held3 = true;
  } else if (t < 61.2) { // TRICK 2 CARD, wide of arena
    S.player.pos = V(40, 9, 30); S.player.held = 'sword';
    S.mob = mobState(mob2z(t), t, null);
    S.cam = { pos: V(lerp(26, 28, seg(t, 58, 61.2)), 17, 20), look: V(41, 10, 40), fov: 55 };
    S.overlays.push({ kind: 'card', t0: 58.0, t1: 61.2, num: '#2', name: 'WIND CHARGE + MACE SMASH' });
  } else if (t < 67.4) { // over-shoulder setup
    S.player.pos = V(40, 9, 30); S.player.held = t < 64.4 ? 'sword' : 'wind'; S.hud = true; S.slot = t < 64.4 ? 0 : 3;
    S.mob = mobState(mob2z(t), t, null);
    S.cam = { pos: V(41.1, 11.1, lerp(26.3, 27.0, seg(t, 61.2, 67.4))), look: V(39.6, 10.2, 40), fov: 60 };
    if (t >= 61.7) S.overlays.push({ kind: 'infoCard', t0: 61.7, lines: ['MACE DAMAGE', 'GROWS WITH', 'FALL DISTANCE'], icon: 'mace' });
    if (t >= 64.4) S.overlays.push({ kind: 'worldTag', at: V(40, 15, 52), text: 'NO CLIFF? MAKE ONE.', col: '#ffd400', t0: 64.6 });
  } else if (t < 81.0) { // first-person smash
    S.fp = true; S.hud = true; S.player.visible = false;
    const y = keyed(S2Y, t), z = keyed(S2Z, t), eye = V(40, y + EYE, z);
    S.mob = mobState(mob2z(Math.min(t, S2.impact)), t, S2.impact);
    const mobHead = V(40, 10.9, mob2z(Math.min(t, S2.impact)));
    let pitch = deg(-5);
    pitch = lerp(pitch, deg(-82), eIO(seg(t, 67.7, 68.6)));
    pitch = lerp(pitch, deg(12), eIO(seg(t, 69.6, 70.6)));
    pitch = lerp(pitch, deg(-18), eIO(seg(t, 71.6, 72.6)));
    let dir = dirFrom(0, pitch);
    const toMob = mobHead.clone().sub(eye).normalize();
    dir.lerp(toMob, eIO(seg(t, 74.7, 76.0))).normalize();
    if (t > S2.impact) dir.lerp(dirFrom(0, deg(-30)), eIO(seg(t, S2.impact + .2, S2.impact + .7))).normalize();
    S.cam = { pos: eye, dir, fov: lerp(70, 84, seg(t, 69.3, 70.0)) - 14 * seg(t, 71.6, 72.6) + 16 * seg(t, S2.dive, S2.impact) - 16 * seg(t, S2.impact, S2.impact + .4) };
    S.slot = t < 67.6 ? 0 : t < 74.6 ? 3 : 4; S.held = ['sword', 'pick', 'bucketW', 'wind', 'mace'][S.slot];
    S.switchT = t >= 74.6 ? 74.6 : t >= 67.6 ? 67.6 : null;
    if (t > S2.throwT) W2.wind = 15;
    S.swing = Math.max(seg(t, S2.throwT, S2.throwT + .3) * (t < S2.throwT + .3 ? 1 : 0), t > S2.impact - .15 && t < S2.impact + .25 ? seg(t, S2.impact - .15, S2.impact + .25) : 0);
    if (t > S2.throwT && t < S2.burst) S.orb = V(40, lerp(y + EYE - .3, 9.2, seg(t, S2.throwT, S2.burst)), lerp(z + .5, z + .2, seg(t, S2.throwT, S2.burst)));
    windFX(S, S2.burst, V(40, 9.1, S2.z0));
    smashFX(S, S2.impact, V(40, 9.05, S2_MOBZ), 1.2);
    if (t >= 71.0 && t < S2.impact) S.overlays.push({ kind: 'pill', text: 'SLOW-MO', col: '#e53935', t0: 71.0 });
    if (t >= 67.6 && t < 69.0) S.overlays.push({ kind: 'slotHint', slot: 3, text: 'WIND CHARGE', t0: 67.6 });
    if (t >= 74.6 && t < 76.6) S.overlays.push({ kind: 'slotHint', slot: 4, text: 'MACE', t0: 74.6 });
    if (t >= 76.0 && t < S2.impact) S.overlays.push({ kind: 'target', at: V(40, 10.2, mob2z(t)), t0: 76.0 });
    if (t >= 70.0 && t < S2.impact) S.overlays.push({ kind: 'meter', text: `HEIGHT: ${Math.max(0, y - 9).toFixed(0)} BLOCKS`, col: '#ffffff' });
    if (t >= S2.impact) S.overlays.push({ kind: 'pop', t0: S2.impact, text: 'ONE HIT!', x: W / 2, y: H * .32, size: 140, col: '#ffd400' });
  } else if (t < 90.5) { // third-person replay of the smash with trajectory
    const tm = t < 88.0 ? lerp(68.6, S2.impact, seg(t, 81.0, 88.0)) : S2.impact + (t - 88.0);
    const y = keyed(S2Y, tm), z = keyed(S2Z, tm);
    S.player.pos = V(40, y, z); S.player.yaw = 0;
    S.player.held = tm < 74.6 ? 'wind' : 'mace';
    S.player.p = { fall: tm > S2.burst && tm < S2.apex ? .5 : 0, time: tm, smash: tm > S2.dive && tm < S2.impact + .3 ? seg(tm, S2.dive, S2.impact) : null, use: seg(tm, S2.throwT - .1, S2.throwT + .2) };
    S.mob = mobState(mob2z(Math.min(tm, S2.impact)), tm, S2.impact);
    S.cam = { pos: V(60, 22, 33), look: V(40, 21.5, 32.6), fov: 68 };
    S.trail = { from: S2.burst, to: tm };
    S.tmap = tm;
    windFX(S, S2.burst, V(40, 9.1, S2.z0), tm); smashFX(S, S2.impact, V(40, 9.05, S2_MOBZ), 1, tm);
    S.overlays.push({ kind: 'pill', text: 'REPLAY', col: '#7c4dff', t0: 81.0 });
    S.overlays.push({ kind: 'heightBar', h: Math.max(0, y - 9), max: 20, dmg: tm > S2.dive ? seg(tm, S2.dive, S2.impact) : 0 });
    if (t >= 82.6 && t < 85.6) S.overlays.push({ kind: 'worldTag', at: V(40, 33, 31), text: 'HIGHER = HARDER HIT', col: '#ffd400', t0: 82.6 });
    if (t >= 88.0) S.overlays.push({ kind: 'worldTag', at: V(40, 13.5, S2_MOBZ - .3), text: '0 FALL DAMAGE', col: '#5cff7a', t0: 88.0, heart: true });
  } else if (t < 100.0) { // double wind charge demo, chase cam
    S.hud = true;
    const y = keyed(S3Y, t), z = keyed(S3Z, t), p = V(40, y, z);
    S.player.pos = p; S.player.yaw = 0; S.player.held = t < S3.a2 ? 'wind' : 'mace';
    S.slot = t < S3.a2 ? 3 : 4;
    W2.wind = t > S3.b2 - .2 ? 13 : t > S3.b1 - .2 ? 14 : 15;
    S.player.p = { fall: t > S3.b1 && t < S3.a2 ? .6 : 0, time: t, smash: t > S3.dive && t < S3.impact + .3 ? seg(t, S3.dive, S3.impact) : null, use: Math.max(seg(t, S3.b1 - .25, S3.b1 + .1), seg(t, S3.b2 - .25, S3.b2 + .1)), walk: t < S3.b1 ? 0 : 0 };
    S.mob = mobState(mob3z(Math.min(t, S3.impact)), t, S3.impact);
    const off = t < S3.dive ? V(6.5, 1.5 + seg(t, S3.b1, S3.a2) * 2, -8) : V(lerp(6.5, 9, seg(t, S3.dive, S3.impact)), lerp(3.5, 6, seg(t, S3.dive, S3.impact)), lerp(-8, -9, seg(t, S3.dive, S3.impact)));
    const cy = Math.min(p.y, 36);
    S.cam = { pos: V(40 + off.x, cy + off.y + 1, p.z + off.z), look: V(40, lerp(cy + 1, 10, seg(t, S3.dive, S3.impact) * .6), lerp(p.z + 3, S3_MOBZ, seg(t, S3.dive, S3.impact))), fov: 62 };
    if (t > S3.impact) S.cam = { pos: V(49, 13, S3_MOBZ - 9), look: V(40, 10, S3_MOBZ), fov: 62 };
    windFX(S, S3.b1, V(40, 9.1, 30)); windFX(S, S3.b2, V(40, 21.2, 30.8), undefined, 2);
    smashFX(S, S3.impact, V(40, 9.05, S3_MOBZ), 1.6);
    if (t >= S3.b1 && t < S3.b2 + .8) S.overlays.push({ kind: 'pop', t0: S3.b1, text: 'CHARGE 1', x: W * .26, y: H * .3, size: 80, col: '#bfe0ff' });
    if (t >= S3.b2) S.overlays.push({ kind: 'pop', t0: S3.b2, text: 'CHARGE 2', x: W * .74, y: H * .3, size: 80, col: '#bfe0ff', t1: S3.impact });
    if (t >= S3.impact) S.overlays.push({ kind: 'pop', t0: S3.impact, text: 'ONE-SHOT!', x: W / 2, y: H * .32, size: 170, col: '#ffd400' });
  } else if (t < 108.0) { // recap
    const a = (t - 100) * .16 + deg(-60);
    S.player.pos = V(40, 9, S3_MOBZ - .3); S.player.held = 'mace'; S.player.yaw = Math.PI * .1;
    S.cam = { pos: V(40 + Math.cos(a) * 9, 13, S3_MOBZ + Math.sin(a) * 9), look: V(40, 10.5, S3_MOBZ), fov: 55 };
    S.overlays.push({ kind: 'recap', t0: 100.4 });
  } else { // OUTRO
    const a = deg(80) + (t - 108) * .07;
    S.player.pos = V(.5, 64, -19.5); S.player.yaw = 0; S.player.held = 'mace';
    S.cam = { pos: V(.5 + Math.cos(a) * 10, 67, -19.5 + Math.sin(a) * 10), look: V(.5, 65, -19.5), fov: 55 };
    S.overlays.push({ kind: 'outro', t0: 108.0 });
  }
  return S;
}
function windFX(S, t0, o, tm, seedK = 1) {
  S.bursts.push({ type: 'wind', t0, o: o.clone().add(V(0, .2, 0)), n: 80, sp: [7, 13], up: [-.5, 3], drag: 3, life: .75, size: .22, seed: 50 + seedK, tm });
  S.rings.push({ t0, o, r: 3.4, life: .55, col: '#e6f4ff', flat: true, tm }); S.rings.push({ t0: t0 + .08, o, r: 2.2, life: .5, col: '#bfe0ff', flat: true, tm });
  S.hits.push([t0, .05]);
}
function smashFX(S, t0, o, k = 1, tm) {
  S.bursts.push({ type: 'smash', t0, o: o.clone().add(V(0, .3, 0)), n: Math.round(160 * k), sp: [4, 11 * k], up: [5, 12], g: 26, life: 1.5, size: .2, seed: 70, floor: 9.1, tm });
  S.bursts.push({ type: 'spark', t0, o: o.clone().add(V(0, 1.6, 0)), n: 50, sp: [3, 9], up: [-3, 6], drag: 2, life: .6, size: .1, seed: 71, tm });
  S.bursts.push({ type: 'poof', t0: t0 + .55, o: o.clone().add(V(0, .9, 0)), n: 40, sp: [.4, 1.6], up: [.5, 2], drag: 1, life: 1.1, size: .3, seed: 72, tm });
  S.rings.push({ t0, o: o.clone().add(V(0, .08, 0)), r: 7 * k, life: .7, col: '#ffffff', flat: true, tm }); S.rings.push({ t0: t0 + .1, o: o.clone().add(V(0, .08, 0)), r: 4.5 * k, life: .6, col: '#ffd84a', flat: true, tm });
  if (tm == null) S.hits.push([t0, .32 * k]); S.flashT = t0;
}

// ---------- apply state to the 3D scene ----------
const ITEM_TEX = { sword: ICON.sword, pick: ICON.pick, bucketW: ICON.bucketW, bucket: ICON.bucket, wind: ICON.wind, mace: ICON.mace };
function applyHuman(h, st, t) {
  h.g.visible = st.visible !== false;
  if (!h.g.visible) return;
  h.g.position.copy(st.pos); h.g.rotation.set(0, st.yaw || 0, 0);
  pose(h, st.p || {});
  if (st.held) { h.item.visible = true; h.item.material.map = ITEM_TEX[st.held]; }
}
function apply(S) {
  const t = S.t;
  applyHuman(PLAYER, S.player, t);
  if (S.mob) {
    const m = S.mob; MOB.g.visible = m.alive; MOB.g.position.copy(m.pos); MOB.g.rotation.set(0, m.yaw, 0);
    pose(MOB, { walk: m.dead ? 0 : m.walk, zombie: true });
    if (m.dead) { MOB.g.rotation.x = m.dead * 1.3; MOB.g.position.z += m.dead * 1.2; }
    MOB.mats.forEach(mt => mt.emissive.setHex(m.hurt ? 0xaa0000 : 0x000000));
  } else MOB.g.visible = false;
  for (const g of [GHOST, GHOST2]) g.g.visible = false;
  for (const gs of S.ghosts) { gs.h.g.visible = true; gs.h.g.position.copy(gs.pos); gs.h.g.rotation.set(0, 0, 0); pose(gs.h, { fall: 1, time: 1.3 }); }
  // water
  waterPool.forEach(w => w.visible = false);
  if (S.water) {
    const c = S.waterCell, a = S.water.amt; waterMat.opacity = .72 * S.water.alpha;
    const put = (i, dx, dz, hgt) => { if (hgt <= .02) return; const w = waterPool[i]; w.visible = true; w.scale.set(1, hgt, 1); w.position.set(c.x + dx + .5, c.y + hgt / 2, c.z + dz + .5); };
    put(0, 0, 0, .88 * clamp(a * 2.5));
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz], i) => put(1 + i, dx, dz, .62 * clamp(a * 2 - .4)));
    [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dz], i) => put(5 + i, dx, dz, .32 * clamp(a * 2 - 1)));
  }
  // camera
  const c = S.cam; camera.fov = c.fov || 70; camera.updateProjectionMatrix();
  const sh = shake(t, S.hits);
  camera.position.copy(c.pos).add(sh);
  if (c.look) camera.lookAt(c.look.clone().add(sh));
  else { const d = c.dir || dirFrom(c.yaw || 0, c.pitch || 0); camera.lookAt(camera.position.clone().add(d)); }
  scene.userData.dome.position.copy(camera.position);
  scene.userData.sun.position.copy(camera.position).add(V(120, 220, -260));
  clouds.position.x = t * 1.2;
  // first-person rig
  fp.visible = S.fp;
  if (S.fp) {
    const sw = S.swing || 0, sx = Math.sin(sw * Math.PI);
    const sinceSwitch = S.switchT != null ? t - S.switchT : 9, dip = sinceSwitch < .3 ? Math.sin(Math.PI * sinceSwitch / .3) * .35 : 0;
    const bob = Math.sin(t * 8) * .012;
    fpArm.position.set(.42, -.4 - dip + bob, -.62 + sx * .15); fpArm.rotation.set(deg(10) - sx * .9, deg(-12), 0);
    fpItem.material.map = ITEM_TEX[S.held];
    fpItem.position.set(.33, -.22 - dip + bob - sx * .05, -.78 + sx * .1); fpItem.rotation.set(-sx * .8, deg(-55), deg(18));
  }
  // particles
  const plist = [];
  for (const b of S.bursts) burstParticles(b, b.tm != null ? b.tm : t, plist);
  if (S.trail) for (let tt = S.trail.from; tt <= S.trail.to; tt += .09) plist.push([40, keyed(S2Y, tt) + .9, keyed(S2Z, tt), .32, '#ffd400']);
  const col = new THREE.Color();
  for (let i = 0; i < PMAX; i++) {
    if (i < plist.length) { const [x, y, z, s, cc] = plist[i]; m4.makeScale(s, s, s).setPosition(x, y, z); col.set(cc); }
    else m4.makeScale(0, 0, 0);
    parts.setMatrixAt(i, m4); parts.setColorAt(i, i < plist.length ? col : col.set('#000'));
  }
  parts.instanceMatrix.needsUpdate = true; parts.instanceColor.needsUpdate = true;
  ringPool.forEach(r => r.visible = false);
  let ri = 0;
  for (const r of S.rings) {
    const tt = r.tm != null ? r.tm : t, age = tt - r.t0; if (age < 0 || age > r.life || ri >= ringPool.length) continue;
    const m = ringPool[ri++], k = age / r.life; m.visible = true; m.position.copy(r.o); m.rotation.set(r.flat ? Math.PI / 2 : 0, 0, 0);
    const s = r.r * eOutC(k) + .2; m.scale.set(s, s, 1 + s * .3); m.material.color.set(r.col); m.material.opacity = (1 - k) * .9;
  }
  orb.visible = !!S.orb; if (S.orb) { orb.position.copy(S.orb); orb.rotation.set(t * 9, t * 7, 0); }
  outline.visible = S.outline;
  trail.visible = false;
  if (false) {
    const pts = []; const n = 80;
    for (let i = 0; i <= n; i++) { const tt = lerp(S.trail.from, S.trail.to, i / n); pts.push(V(40, keyed(S2Y, tt) + .9, keyed(S2Z, tt))); }
    trailGeo.setFromPoints(pts); trail.computeLineDistances();
  }
}

// ---------- HUD / 2D overlays ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H; const ctx = comp.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = (s, w = 900) => `${w} ${s}px "Inter", "Inter Display", sans-serif`;
function txt(s, x, y, size, fill, o = {}) {
  ctx.save(); ctx.font = FONT(size, o.w || 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.scale) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); x = 0; y = 0; }
  ctx.globalAlpha *= (o.alpha ?? 1);
  if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.strokeCol || '#000'; ctx.lineWidth = o.lw || size * .16; ctx.strokeText(s, x, y); }
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowOffsetY = size * .08; }
  ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
}
function rrect(x, y, w, h, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function project(v) { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, vis: p.z < 1 }; }
function heartPath(x, y, s, fill) { // pixel heart 9x8
  const rows = ['.XX...XX.', 'XooX.XooX', 'XoooXoooX', 'XoooooooX', '.XoooooX.', '..XoooX..', '...XoX...', '....X....'];
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; ctx.fillStyle = ch === 'X' ? '#1a0000' : fill; ctx.fillRect(x + i * s, y + j * s, s, s); }));
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x + 2 * s, y + 2 * s, s, s);
}
function drawHUD(S) {
  const t = S.t, slotW = 88, x0 = W / 2 - slotW * 4.5, y0 = H - 104;
  rrect(x0 - 6, y0 - 6, slotW * 9 + 12, slotW + 12, 6, 'rgba(0,0,0,.55)', '#1b1b1b', 4);
  HOTBAR.forEach((it, i) => {
    const x = x0 + i * slotW;
    rrect(x + 3, y0 + 3, slotW - 6, slotW - 6, 4, 'rgba(110,110,110,.45)', 'rgba(255,255,255,.25)', 2);
    let icon = it; if (it === 'bucketW' && (S.held === 'bucket')) icon = 'bucket';
    if (icon) ctx.drawImage(ICON[icon].userData.canvas, x + 14, y0 + 14, slotW - 28, slotW - 28);
    const n = S.counts[it]; if (n) txt(String(n), x + slotW - 14, y0 + slotW - 18, 26, '#fff', { align: 'right', lw: 5, w: 800 });
  });
  const sx = x0 + S.slot * slotW;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeRect(sx - 2, y0 - 2, slotW + 4, slotW + 4);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(sx - 6, y0 - 6, slotW + 12, slotW + 12);
  const glow = S.heartGlow || 0;
  for (let i = 0; i < 10; i++) {
    const hx = x0 + i * 40, hy = y0 - 50 - (glow > 0 ? Math.max(0, Math.sin(t * 18 + i)) * 6 * glow : 0);
    heartPath(hx, hy, 4, glow > 0 ? `rgb(255,${lerp(40, 120, glow) | 0},${lerp(40, 120, glow) | 0})` : '#e8262a');
  }
  if (S.fp) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(W / 2 - 14, H / 2 - 2, 28, 4); ctx.fillRect(W / 2 - 2, H / 2 - 14, 4, 28); }
}
function pill(text, col, t0, t) {
  const a = seg(t, t0, t0 + .2); ctx.save(); ctx.globalAlpha = a;
  ctx.font = FONT(34, 900); const w = ctx.measureText(text).width + 74;
  rrect(48, 48, w, 62, 31, col, 'rgba(0,0,0,.35)', 3);
  ctx.fillStyle = (Math.floor(t * 2.5) % 2) ? '#fff' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(80, 79, 10, 0, 7); ctx.fill();
  txt(text, 102, 80, 34, '#fff', { align: 'left', stroke: false }); ctx.restore();
}
function drawOverlays(S) {
  const t = S.t;
  for (const o of S.overlays) {
    if (o.kind === 'pill') pill(o.text, o.col, o.t0, t);
    else if (o.kind === 'hookTag') {
      const a = seg(t, o.t0, o.t0 + .3) * (1 - seg(t, 2.5, 2.8));
      ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H * .17); ctx.rotate(-.03);
      rrect(-430, -62, 860, 124, 14, '#e53935', '#000', 6); txt('THESE FEEL ILLEGAL', 0, 4, 78, '#fff', { lw: 10 }); ctx.restore();
    } else if (o.kind === 'title') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .5)), out = seg(t, o.t1 - .35, o.t1);
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H * .4); ctx.scale(k, k);
      txt('2 MINECRAFT TRICKS', 0, -90, 132, '#ffffff', { lw: 22, shadow: true });
      ctx.rotate(-.035); rrect(-560, -10, 1120, 150, 18, '#e53935', '#000', 8);
      txt('THAT FEEL ILLEGAL', 0, 68, 118, '#ffd400', { lw: 16 });
      ctx.restore();
      if (t > o.t0 + .9) txt('(#2 IS INSANE)', W / 2, H * .64, 54, '#fff', { alpha: seg(t, o.t0 + .9, o.t0 + 1.2) * (1 - out), lw: 10 });
    } else if (o.kind === 'card') {
      const kin = eOutBack(seg(t, o.t0, o.t0 + .45)), kout = eIO(seg(t, o.t1 - .4, o.t1));
      const off = (1 - kin) * -1300 + kout * 1500;
      ctx.save(); ctx.translate(off, 0);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.beginPath(); ctx.moveTo(0, H * .3); ctx.lineTo(W * .78, H * .3); ctx.lineTo(W * .72, H * .62); ctx.lineTo(0, H * .62); ctx.fill();
      ctx.save(); ctx.translate(150, H * .395); ctx.rotate(-.04); rrect(0, -60, 430, 120, 12, '#e53935', '#000', 6); txt('TRICK ' + o.num, 215, 4, 92, '#fff', { lw: 12 }); ctx.restore();
      txt(o.name, 160, H * .54, 96, '#ffd400', { align: 'left', lw: 14 });
      ctx.restore();
    } else if (o.kind === 'freeze') {
      const a = seg(t, o.t0, o.t0 + .15);
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(40, 40, W - 80, H - 80);
      txt('WAIT...', W / 2, H * .2, 120, '#fff', { lw: 18 });
      txt('GAME OVER?', W / 2, H * .34, 84, '#ff5252', { lw: 12, alpha: seg(t, o.t0 + .3, o.t0 + .5) });
      ctx.restore();
    } else if (o.kind === 'slotHint') {
      const slotW = 88, x = W / 2 - slotW * 4.5 + o.slot * slotW + slotW / 2, a = seg(t, o.t0, o.t0 + .2);
      const bob = Math.sin(t * 8) * 8;
      ctx.save(); ctx.globalAlpha = a;
      txt(o.text, x, H - 222 + bob, 40, '#ffd400', { lw: 8 });
      ctx.fillStyle = '#ffd400'; ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 18, H - 196 + bob); ctx.lineTo(x + 18, H - 196 + bob); ctx.lineTo(x, H - 174 + bob); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
    } else if (o.kind === 'meter') {
      rrect(W - 560, 48, 512, 70, 12, 'rgba(0,0,0,.6)', o.col, 3); txt(o.text, W - 304, 84, 36, o.col, { stroke: false });
    } else if (o.kind === 'pop') {
      if (o.t1 && t > o.t1) continue;
      const k = eOutBack(seg(t, o.t0, o.t0 + .3)), a = 1 - seg(t, o.t0 + 2.6, o.t0 + 3.0);
      txt(o.text, o.x, o.y, o.size, o.col, { scale: Math.max(.01, k), lw: o.size * .17, alpha: a, rot: -.04 });
      if (o.sub) txt(o.sub, o.x, o.y + o.size * .85, o.size * .5, '#fff', { alpha: a * seg(t, o.t0 + .3, o.t0 + .5), lw: 9 });
    } else if (o.kind === 'bracket') {
      const a = project(o.a), b = project(o.b), al = seg(t, o.t0, o.t0 + .3), x = a.x + 70;
      ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = '#ffd400'; ctx.lineWidth = 8; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(x - 24, a.y); ctx.lineTo(x, a.y); ctx.lineTo(x, b.y); ctx.lineTo(x - 24, b.y); ctx.stroke();
      txt(o.text, x + 26, (a.y + b.y) / 2, 64, '#ffd400', { align: 'left', lw: 11 }); ctx.restore();
    } else if (o.kind === 'worldTag') {
      const p = project(o.at); if (!p.vis) continue;
      const k = eOutBack(seg(t, o.t0, o.t0 + .3));
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k);
      ctx.font = FONT(52); const w = ctx.measureText(o.text).width + (o.x ? 110 : 60) + (o.heart ? 56 : 0);
      rrect(-w / 2, -42, w, 84, 14, 'rgba(0,0,0,.72)', o.col, 4);
      let tx = 0;
      if (o.x) { txt('✕', -w / 2 + 48, 2, 52, o.col, { stroke: false }); tx = 28; }
      if (o.heart) { heartPath(-w / 2 + 22, -16, 4, '#e8262a'); tx = 26; }
      txt(o.text, tx, 2, 52, o.col, { stroke: false }); ctx.restore();
    } else if (o.kind === 'infoCard') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4));
      ctx.save(); ctx.translate(W - 120 - (1 - k) * -700, 0); ctx.translate(0, H * .2);
      rrect(-640, 0, 600, 300, 20, 'rgba(0,0,0,.72)', '#ffd400', 5);
      ctx.drawImage(ICON.mace.userData.canvas, -620, 70, 160, 160);
      o.lines.forEach((l, i) => txt(l, -440, 80 + i * 72, 58, i === 2 ? '#ffd400' : '#fff', { align: 'left', stroke: false }));
      ctx.restore();
    } else if (o.kind === 'target') {
      const p = project(o.at); if (!p.vis) continue;
      const k = seg(t, o.t0, o.t0 + .3), r = lerp(260, 90, eOutC(k)) + Math.sin(t * 10) * 6;
      ctx.save(); ctx.strokeStyle = '#ff3b3b'; ctx.lineWidth = 7; ctx.globalAlpha = k;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * (r - 30), p.y + Math.sin(a) * (r - 30)); ctx.lineTo(p.x + Math.cos(a) * (r + 30), p.y + Math.sin(a) * (r + 30)); ctx.stroke(); }
      txt('TARGET', p.x, p.y - r - 40, 46, '#ff3b3b', { lw: 8 }); ctx.restore();
    } else if (o.kind === 'heightBar') {
      const x = 90, y = 200, h = 560;
      rrect(x - 14, y - 14, 120, h + 28, 16, 'rgba(0,0,0,.6)', '#fff', 3);
      const f = clamp(o.h / o.max); rrect(x + 10, y + h * (1 - f), 72, h * f, 8, '#5ac8ff');
      txt(`${o.h.toFixed(0)}`, x + 46, y - 50, 54, '#fff', { lw: 8 }); txt('BLOCKS UP', x + 46, y + h + 50, 30, '#fff', { lw: 6 });
      const dx = 260; rrect(dx - 14, y - 14, 120, h + 28, 16, 'rgba(0,0,0,.6)', '#ffd400', 3);
      rrect(dx + 10, y + h * (1 - o.dmg), 72, h * o.dmg, 8, o.dmg > .95 ? '#ff3b3b' : '#ffb300');
      txt('DMG', dx + 46, y - 50, 54, '#ffd400', { lw: 8 }); txt(o.dmg > .95 ? 'MAX!' : '', dx + 46, y + h + 50, 34, '#ff3b3b', { lw: 6 });
    } else if (o.kind === 'recap') {
      const k = eOutBack(seg(t, o.t0, o.t0 + .4)), out = seg(t, 107.5, 108);
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, (1 - k) * 200);
      rrect(160, 150, W - 320, 520, 26, 'rgba(0,0,0,.72)', '#ffd400', 5);
      txt('RECAP', W / 2, 225, 80, '#ffd400', { stroke: false });
      const rows = [['#1', 'WATER BUCKET CLUTCH', 'Place water ~2 blocks above the ground, then scoop it back up', ICON.bucketW], ['#2', 'WIND CHARGE + MACE', 'Launch with a wind charge, switch to the mace, smash on the way down', ICON.mace]];
      rows.forEach(([n, a, b, ic], i) => { const y = 350 + i * 170, kk = seg(t, o.t0 + .4 + i * .5, o.t0 + .7 + i * .5); ctx.globalAlpha = (1 - out) * kk;
        ctx.drawImage(ic.userData.canvas, 230, y - 60, 120, 120); txt(n, 420, y - 22, 60, '#e53935', { align: 'left', stroke: false }); txt(a, 520, y - 22, 60, '#fff', { align: 'left', stroke: false }); txt(b, 420, y + 40, 36, '#cfd8dc', { align: 'left', stroke: false, w: 600 }); });
      ctx.restore();
    } else if (o.kind === 'outro') {
      const q = seg(t, 108.6, 109.0), cm = seg(t, 111.0, 111.3), sb = seg(t, 113.0, 113.4), clicked = t > 114.3;
      ctx.save(); ctx.globalAlpha = q * (1 - seg(t, 116.2, 116.6));
      txt('WHICH TRICK ARE YOU', W / 2, H * .16, 88, '#fff', { lw: 14, scale: eOutBack(q) });
      txt('TRYING FIRST?', W / 2, H * .27, 100, '#ffd400', { lw: 15, scale: eOutBack(q) });
      ctx.globalAlpha = cm * (1 - seg(t, 116.2, 116.6));
      rrect(W / 2 - 330, H * .36, 660, 96, 48, 'rgba(0,0,0,.7)', '#fff', 4);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(W / 2 - 300, H * .36 + 22, 64, 44, 10); ctx.fill(); ctx.beginPath(); ctx.moveTo(W / 2 - 290, H * .36 + 62); ctx.lineTo(W / 2 - 300, H * .36 + 80); ctx.lineTo(W / 2 - 272, H * .36 + 64); ctx.fill();
      txt('COMMENT  #1  OR  #2', W / 2 + 40, H * .36 + 49, 50, '#fff', { stroke: false });
      ctx.restore();
      if (sb > 0) { // subscribe button with cursor
        const bx = W / 2, by = H * .62, k = eOutBack(sb), pressed = t > 114.15 && t < 114.35 ? .93 : 1;
        ctx.save(); ctx.globalAlpha = 1 - seg(t, 119.3, 120); ctx.translate(bx, by); ctx.scale(k * pressed, k * pressed);
        rrect(-300, -62, 600, 124, 62, clicked ? '#3a3a3a' : '#e53935', '#000', 5);
        txt(clicked ? 'SUBSCRIBED' : 'SUBSCRIBE', clicked ? -45 : 0, 4, 62, '#fff', { stroke: false });
        if (clicked) { ctx.fillStyle = '#fff'; const bl = Math.sin((t - 114.3) * 20) * Math.max(0, 1 - (t - 114.3)) * .4; ctx.save(); ctx.translate(230, 0); ctx.rotate(bl); ctx.beginPath(); ctx.arc(0, -6, 22, Math.PI, 0); ctx.lineTo(24, 18); ctx.lineTo(-24, 18); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, 24, 7, 0, 7); ctx.fill(); ctx.restore(); }
        ctx.restore();
        const cx = lerp(bx + 520, bx + 120, eIO(seg(t, 113.4, 114.1))), cy = lerp(by + 260, by + 20, eIO(seg(t, 113.4, 114.1)));
        if (t < 115.5) { ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 64); ctx.lineTo(16, 50); ctx.lineTo(28, 76); ctx.lineTo(40, 70); ctx.lineTo(28, 46); ctx.lineTo(48, 46); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); }
      }
      if (t > 116.4) txt('SEE YOU IN THE NEXT ONE!', W / 2, H * .25, 92, '#fff', { lw: 14, scale: eOutBack(seg(t, 116.4, 116.8)), alpha: 1 - seg(t, 119.3, 120) });
      if (t > 118.6) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 118.6, 119.6)})`; ctx.fillRect(0, 0, W, H); txt('HOLLOWCRAFT', W / 2, H / 2, 120, '#ffd400', { stroke: false, alpha: seg(t, 118.8, 119.3) }); }
    }
  }
}
// captions: chunks of <=4 words, word-level highlight
const HL = /^(ILLEGAL|INSANE|WATER|BUCKET|CLUTCH|BOOM|FALL|DAMAGE|TWO|BLOCKS|TIMING|WIND|CHARGE|MACE|SMASH|ONE|HIT|HIGHER|HARDER|ONE-SHOT|HOTBAR|STRAIGHT|DOWN|FULL|HEALTH|SUBSCRIBE|HOLLOWCRAFT|COMMENTS|TRICK|NUMBER|SLOW|LAUNCHES|STRONGEST)$/;
const CHUNKS = [];
for (const [a, b, line] of CAPS) {
  const words = line.toUpperCase().split(/\s+/).filter(Boolean); const groups = [];
  for (let i = 0; i < words.length;) { let n = Math.min(4, words.length - i); if (words.length - i - n === 1) n = Math.min(3, n); groups.push(words.slice(i, i + n)); i += n; }
  const total = words.join(' ').length; let acc = 0;
  for (const g of groups) { const len = g.join(' ').length + 1, s = a + (b - a) * acc / total, e = a + (b - a) * Math.min(1, (acc + len) / total); CHUNKS.push({ s, e, g }); acc += len; }
}
function drawCaptions(t, S) {
  const c = CHUNKS.find(c => t >= c.s && t < c.e + .12); if (!c || c.g.join(' ') === 'ONE HIT!') return;
  const y = S.hud ? H - 340 : H - 170, size = 74;
  ctx.font = FONT(size); const widths = c.g.map(w => ctx.measureText(w).width), sp = size * .3;
  const tot = widths.reduce((a, b) => a + b, 0) + sp * (c.g.length - 1);
  let x = W / 2 - tot / 2; const k = eOutBack(seg(t, c.s, c.s + .12));
  c.g.forEach((w, i) => {
    const wt = c.s + (c.e - c.s) * i / c.g.length; const on = t >= wt;
    const clean = w.replace(/[^A-Z0-9#\-]/g, '');
    const col = HL.test(clean) ? '#ffd400' : '#ffffff';
    txt(w, x + widths[i] / 2, y, size, col, { lw: 15, scale: (on ? 1 : .96) * k, alpha: on ? 1 : .55 });
    x += widths[i] + sp;
  });
}
const CUTS = [2.8, 5.6, 9.6, 14.0, 17.4, 38.4, 50.8, 54.6, 58.0, 61.2, 67.4, 81.0, 90.5, 100.0, 108.0];

window.renderFrame = function (t) {
  const S = stateAt(t);
  apply(S);
  renderer.render(scene, camera);
  ctx.save();
  ctx.filter = S.filter || 'none';
  if (S.freezeZoom) { const z = S.freezeZoom; ctx.drawImage(renderer.domElement, (W - W * z) / 2, (H - H * z) / 2, W * z, H * z); }
  else ctx.drawImage(renderer.domElement, 0, 0);
  ctx.restore();
  if (S.flashT != null) { const d = (S.tmap ?? t) - S.flashT; if (d >= 0 && d < .35) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .35) * .85})`; ctx.fillRect(0, 0, W, H); } }
  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (S.hud) drawHUD(S);
  drawOverlays(S);
  drawCaptions(t, S);
  txt('HollowCraft', W - 40, H - 34, 30, 'rgba(255,255,255,.75)', { align: 'right', lw: 5, w: 800 });
  for (const c of CUTS) { const d = t - c; if (d >= 0 && d < .14) { ctx.fillStyle = `rgba(255,255,255,${(1 - d / .14) * .6})`; ctx.fillRect(0, 0, W, H); } }
  if (t < .25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .25})`; ctx.fillRect(0, 0, W, H); }
  return comp.toDataURL('image/jpeg', .9);
};
window.READY = true;

// Thumbnail hero frame: frozen mace smash, low angle, no HUD/captions.
window.renderThumb = function (o = {}) {
  const t0 = 50, age = o.age ?? .14, t = t0 + age, mz = 35;
  const S = { t, hud: false, fp: false, bursts: [], rings: [], water: null, ghosts: [], overlays: [], hits: [], trail: null, outline: false, orb: null,
    player: { visible: true, pos: V(40, o.py ?? 11.7, mz - .5), yaw: o.pyaw ?? -.35, held: 'mace', p: { smash: .35 } },
    mob: { pos: V(40, 9, mz), yaw: o.myaw ?? 2.45, walk: 1.2, alive: true, dead: 0, hurt: false } };
  smashFX(S, t0, V(40, 9.05, mz), o.k ?? .8);
  S.bursts.forEach(b => { if (b.type === 'poof') b.t0 = 999; });
  S.cam = { pos: V(o.cx ?? 45.5, o.cy ?? 9.6, o.cz ?? 29.2), look: V(o.lx ?? 40, o.ly ?? 12.0, o.lz ?? mz), fov: o.fov ?? 62 };
  apply(S);
  PLAYER.item.scale.setScalar(o.ms ?? 2.4); PLAYER.item.position.set(0, -.95, 0); PLAYER.item.rotation.set(0, o.mry ?? .6, deg(o.mrz ?? 40));
  pose(PLAYER, { smash: .1 }); renderer.render(scene, camera);
  ctx.save(); ctx.filter = 'saturate(1.35) contrast(1.12)'; ctx.drawImage(renderer.domElement, 0, 0); ctx.restore();
  const vg = ctx.createRadialGradient(W * .62, H / 2, H * .35, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  return comp.toDataURL('image/png');
};
