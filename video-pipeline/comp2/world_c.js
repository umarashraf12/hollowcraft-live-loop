// ---------- compilation world additions ----------
// parkour course in the sky over the plains (x 58..84, y 60)
const PK = { y: 60, z: 0, pillars: [[58, 60, 3], [64, 60, 1], [68, 60, 1], [72, 61, 1], [77, 61, 1], [81, 61, 3]] }; // [x, topY, width]
{
  const c = new Map();
  for (const [x, top, w] of PK.pillars) for (let dx = 0; dx < w; dx++) for (let dz = -Math.floor(w / 2); dz <= Math.floor(w / 2); dz++) for (let y = top - 7; y <= top; y++) c.set(k3(x + dx, y, PK.z + dz), y === top ? 'grass' : 'stone');
  cellMeshes(c, (t, f) => t === 'grass' ? (f === 2 ? 'grassTop' : f === 3 ? 'dirt' : 'grassSide') : t);
}
const pkTop = i => { const [x, top, w] = PK.pillars[i]; return V(x + w / 2, top + 1, PK.z + .5); };
// new portal site for the speedrun clip (frame in the x-y plane at z = 47, x 30..33)
const PF2 = [[31, 9], [32, 9], [30, 10], [33, 10], [30, 11], [33, 11], [30, 12], [33, 12], [31, 13], [32, 13]], PZ2 = 47;
const MOLD = cellMeshes(new Map([...Array(6)].flatMap((_, i) => [...Array(5)].map((__, j) => [k3(29 + i, 9 + j, PZ2 + 1), 'dirt']))));
// speed-build house plan at the arena's far side (x 45..49, z 40..44): walls 3 high with a door, then a flat roof
const HOUSE = [];
{ const x0 = 45, z0 = 40; for (let y = 9; y <= 11; y++) for (let x = x0; x <= x0 + 4; x++) for (let z = z0; z <= z0 + 4; z++) {
    const edge = x === x0 || x === x0 + 4 || z === z0 || z === z0 + 4; if (!edge) continue; if (z === z0 && x === x0 + 2 && y <= 10) continue;
    HOUSE.push([x, y, z, (x === x0 || x === x0 + 4) && (z === z0 || z === z0 + 4) ? 'log' : (y === 10 && (x === x0 + 2 || z === z0 + 2) && !(z === z0) ? 'glassB' : 'planks')]); }
  for (let x = x0 - 1; x <= x0 + 5; x++) for (let z = z0 - 1; z <= z0 + 5; z++) HOUSE.push([x, 12, z, 'planks']); }
HOUSE.sort((a, b) => a[1] - b[1] || (a[0] + a[2]) - (b[0] + b[2]));
const HOUSE_C = V(47.5, 9, 42.5);
// creeper model (original-proportioned: 4 legs, tall body, square head)
const creeperTex = canvasTex(8, g => { const r = rng(91); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = r(); g.fillStyle = v > .7 ? '#9be27a' : v > .3 ? '#5aa83a' : '#3a7a2a'; g.fillRect(x, y, 1, 1); } });
const creeperFace = canvasTex(8, g => { const r = rng(92); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = r(); g.fillStyle = v > .6 ? '#7ccc5a' : '#4a9a34'; g.fillRect(x, y, 1, 1); } g.fillStyle = '#111'; g.fillRect(1, 2, 2, 2); g.fillRect(5, 2, 2, 2); g.fillRect(3, 4, 2, 3); g.fillRect(2, 5, 1, 3); g.fillRect(5, 5, 1, 3); });
function makeCreeper() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ map: creeperTex }), f = new THREE.MeshLambertMaterial({ map: creeperFace });
  const mk = (w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); g.add(b); return b; };
  const legs = []; for (const [x, z] of [[-.14, .17], [.14, .17], [-.14, -.17], [.14, -.17]]) legs.push(mk(.24, .38, .24, m, x, .19, z));
  mk(.48, .78, .28, m, 0, .77, 0); mk(.5, .5, .5, [m, m, m, m, f, m], 0, 1.41, 0);
  g.userData = { legs, mats: [m, f] }; g.visible = false; scene.add(g); return g;
}
const CREEPER = makeCreeper();
// extra zombies for the horde clip
const ZOMBIES = [MOB, makeHuman({ skin: '#6b8f5e', hair: '#3f5a37', shirt: '#3a5a7a', pants: '#2e2a3a', shoes: '#2a3a26', eyeW: '#1a1a1a', eye: '#ff2a2a', mouth: '#2a3a26', glow: '#ff3030' }),
  makeHuman({ skin: '#5f8a56', hair: '#3a5032', shirt: '#5a3a3a', pants: '#2a2a3a', shoes: '#2a3a26', eyeW: '#1a1a1a', eye: '#ff2a2a', mouth: '#2a3a26', glow: '#ff3030' })];
ZOMBIES.slice(1).forEach(z => { z.item.visible = false; z.g.scale.setScalar(1.06); });
// flight hoops (vertical gold rings) along the elytra course
const HOOPS = []; const hoopMat = new THREE.MeshBasicMaterial({ color: 0xffd23e, fog: false });
for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(2.6, .22, 8, 40), hoopMat.clone()); m.visible = false; scene.add(m); HOOPS.push(m); }
const hoopPath = s => V(-70 + s * 140, 36 + Math.sin(s * 9) * 6 + s * 4, 20 + Math.sin(s * 5.5) * 14); // s 0..1
// crater decal
const crater = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x2a1c12, transparent: true, opacity: .85, depthWrite: false })); crater.rotation.x = -Math.PI / 2; crater.visible = false; scene.add(crater);
