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
  S.hollow = { visible: true, pos: t < 10.4 ? V(.5, 9, -3.6) : t < 22.4 ? V(lerp(.5, 7, seg(t, 10.4, 12.0)), 9, lerp(-3.6, 2, seg(t, 10.4, 12.0))) : V(.5, 9, -7.4), yaw: t > 10.4 && t < 22.4 ? .6 : (t >= 22.4 ? Math.PI : 0), held: t > 22.4 && t < 24.9 ? 'torch' : null, p: t > 10.4 && t < 12.0 ? { walk: t * 9 } : {} };
  if (t > 22.4) S.hollow.yaw = Math.PI;
  S.pip = t < 11.4 ? { visible: true, pos: V(.5, 13, -10.5), yaw: 0, p: t > 6.4 && t < 10.4 ? { use: (t * 1.5) % 1 } : {} } : { visible: true, pos: V(-.6, 9, -10.7), yaw: .5, p: t > 18.5 && t < 25.5 ? { fall: 1, time: t } : {} };
  if (t < 23.6) for (const y of [9, 10]) S.dyn.push({ c: [0, y, -8], tex: 'iron' });
  if (t > 24.9) { S.torches.push([.5, 9, -9.4, 0, 1]); S.lights.push([.5, 10.4, -9.4, 2.2 + (t < 25.6 ? 2 : 0)]); }
  if (t > 18.0 && t < 24.9) S.lights.push([.2, 11.2, -10.2, .35]);
  if (t > 24.9 && t < 25.3) S.flashT = 24.9;
  if (t > 12.4 && t < 26.0) {
    let pos;
    if (t < 15.0) pos = V(.5, 9, lerp(8, -4.6, eOutC(seg(t, 12.4, 14.8))));
    else if (t < 18.0) pos = V(.5, 9 + .55 * Math.sin(Math.PI * seg(t, 15.2, 17.6)), lerp(-4.6, -7.3, eIO(seg(t, 15.2, 17.6))));
    else pos = V(.5, 9, lerp(-7.3, -9.4, eIO(seg(t, 18.6, 20.2))));
    const phase = t > 18.6 && t < 20.2;
    S.vd = { pos, yaw: Math.PI, alpha: seg(t, 12.4, 13.4) * (phase ? .45 + .3 * Math.sin(t * 30) : 1) * (1 - seg(t, 25.2, 26.0)), arms: t > 22.0 && t < 24.6 ? 1 : 0, scale: 1.2 };
  }
  if (t > 25.2 && t < 26.8) S.bursts.push({ type: 'vpoof', t0: 25.2, o: V(.5, 10.4, -9.2), n: 90, sp: [1, 3.5], up: [-.5, 3], drag: 1.5, life: 1.4, size: .14, seed: 78 });
  if (t > 15.0 && t < 17.6) S.bursts.push({ type: 'sparkle', t0: 15 + Math.floor((t - 15) * 4) / 4, o: V(.5, 9.2, -6), n: 6, sp: [.5, 1.5], up: [1, 3], drag: 1, life: .6, size: .07, seed: Math.floor(t * 4) });
  // cameras
  if (t < 4.4) S.cam = { pos: V(5.0, 11.8, 1.5), look: V(.3, 11.4, -9.5), fov: 66 };
  else if (t < 6.4) S.cam = { pos: V(1.5, 10.6, -.2), look: V(.5, 10.5, -3.6), fov: 60 };
  else if (t < 10.4) S.cam = { pos: V(3.0, 13.8, -5.0), look: V(.5, 13.6, -10.3), fov: 64 };
  else if (t < 12.4) S.cam = { pos: V(5.0, 11.8, 1.5), look: V(.3, 11.0, -9.5), fov: 66 };
  else if (t < 15.0) S.cam = { pos: V(3.4, 11.6, -6.2), look: V(.5, 10.5, 2), fov: 66 };
  else if (t < 18.0) S.cam = { pos: V(5.2, 11.2, -5.0), look: V(.5, 10.4, -6.6), fov: 64 };
  else if (t < 27.0) S.cam = { pos: V(.6, 10.6, -11.45), look: V(.4, 10.2, -8), fov: 74 };
  else if (t < 30.9) S.cam = { pos: V(.5, 10.7, -11.4), look: V(.2, 10.2, -8.2), fov: 70 };
  else S.cam = { pos: V(.2, 10.3, -9.4), look: V(-.6, 10, -10.7), fov: 58 };
  if (t > 27.0) { S.pip.pos = V(-.5, 9, -10.4); S.pip.p = {}; S.hollow.pos = V(.9, 9, -8.6); S.hollow.yaw = Math.PI + .3; }
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
  S.amb = .06 + .4 * (S.lights.length ? 0 : 0);
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
  else if (t < 20.4) S.cam = { pos: V(2.4, 101.5, 63.6), look: V(3.4, 101.4, 62.4), fov: 56 };
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
  hemi.color.copy(DAY.hemi).lerp(NIGHT.hemi, k); hemi.intensity = S.env === 'room' ? S.amb : lerp(1.05, .2, k); sunL.intensity = S.env === 'room' ? 0 : lerp(1.5, .05, k);
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
    plist.push([p.x + Math.cos(a) * .35 * (1 + ph) * sc, p.y + (.2 + ph * 1.9) * sc, p.z + Math.sin(a) * .35 * (1 + ph) * sc, .22 * (1 - ph) * S.vd.alpha, PCOL.voidsmoke[i % 4]]); }
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
function rrect(x, y, w, h, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function wrap(words, size, maxW) { ctx.font = FONT(size); const lines = [[]]; for (const w of words) { const cur = lines[lines.length - 1]; const test = [...cur, w].join(' '); if (ctx.measureText(test).width > maxW && cur.length) lines.push([w]); else cur.push(w); } return lines; }
function drawOverlays(S) {
  const t = S.t;
  for (const o of S.overlays) {
    if (o.kind === 'hook') { if (t > o.t1) continue; const k = eOutBack(seg(t, o.t0 + .05, o.t0 + .4)), out = seg(t, o.t1 - .3, o.t1);
      ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(W / 2, H * .15); ctx.scale(k, k); ctx.rotate(-.03);
      txt(o.l1, 0, -70, 92, '#ffffff', { lw: 16 }); ctx.font = FONT(84); const w = ctx.measureText(o.l2).width + 70; rrect(-w / 2, 10, w, 120, 18, '#e53935', '#000', 7); txt(o.l2, 0, 74, 84, '#ffd400', { lw: 12 }); ctx.restore(); }
    else if (o.kind === 'big') { const k = eOutBack(seg(t, o.t0, o.t0 + .35)), out = o.t1 < 90 ? seg(t, o.t1 - .3, o.t1) : 0; txt(o.text, W / 2, H * o.y, o.size || 120, o.col, { scale: Math.max(.01, k), alpha: 1 - out, rot: -.03, lw: (o.size || 120) * .17 }); }
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
  const words = line.toUpperCase().split(/\s+/), lines = wrap(words, 76, W - 140); const y0 = H * .6;
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
