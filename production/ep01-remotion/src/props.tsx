import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3, clamp01, rand} from './anim';
import {Ball, Box, Cap, Cone, Cyl, M, Torus} from './kit';

const CANDY_COLORS = ['#ff4f6d', '#ffd23a', '#7c5cff', '#2fd38a', '#ff8a2a', '#36b6ff', '#ff7ad9'];

export const Candy: React.FC<{p?: V3; rot?: V3; s?: number; c?: string}> = ({p, rot, s = 1, c = '#2fd38a'}) => (
  <group position={p} rotation={rot} scale={s}>
    <Ball r={0.05} s={[1.3, 1, 1]}><M c={c} r={0.2} /></Ball>
    {[-1, 1].map((d) => (
      <Cone key={d} p={[0.08 * d, 0, 0]} rot={[0, 0, d * Math.PI / 2]} r={0.035} h={0.05} seg={8}><M c={c} r={0.3} /></Cone>
    ))}
  </group>
);

/** Jack-o'-lantern candy bucket, overflowing. */
export const Bucket: React.FC<{p?: V3; rot?: V3; s?: number; fill?: number}> = ({p, rot, s = 1, fill = 1}) => {
  const face = <M c="#2a1406" e="#ff9a1a" ei={0.5} />;
  return (
    <group position={p} rotation={rot} scale={s}>
      <Ball p={[0, 0.2, 0]} r={1} s={[0.3, 0.24, 0.3]}><M c="#f07a1a" r={0.4} /></Ball>
      <Cyl p={[0, 0.38, 0]} rt={0.24} h={0.06} open><M c="#d9661a" r={0.4} side={THREE.DoubleSide} /></Cyl>
      <Torus p={[0, 0.42, 0]} rot={[0, 0, 0]} r={0.26} t={0.012} arc={Math.PI}><M c="#2b2b2b" r={0.3} /></Torus>
      {[-0.09, 0.09].map((x) => (
        <Cone key={x} p={[x, 0.26, 0.27]} rot={[Math.PI / 2 - 0.3, 0, 0]} r={0.045} h={0.02} seg={3}>{face}</Cone>
      ))}
      <Ball p={[0, 0.14, 0.275]} r={0.1} s={[1.1, 0.35, 0.2]} shadow={false}>{face}</Ball>
      {fill > 0 &&
        Array.from({length: 14}).map((_, i) => {
          const a = rand(i) * Math.PI * 2;
          const r = rand(i + 50) * 0.18;
          return (
            <Candy key={i} p={[Math.cos(a) * r, 0.38 + rand(i + 9) * 0.1 * fill, Math.sin(a) * r]} rot={[rand(i + 3) * 3, rand(i + 4) * 3, 0]} s={0.9} c={CANDY_COLORS[i % CANDY_COLORS.length]} />
          );
        })}
    </group>
  );
};

export const Bone: React.FC<{p?: V3; rot?: V3; s?: number; squash?: number}> = ({p, rot, s = 1, squash = 0}) => (
  <group position={p} rotation={rot} scale={[s * (1 + squash * 0.25), s * (1 - squash * 0.35), s]}>
    <Cap rot={[0, 0, Math.PI / 2]} r={0.035} l={0.22}><M c="#7ec8ff" r={0.25} /></Cap>
    {[-1, 1].map((d) =>
      [-1, 1].map((e) => (
        <Ball key={`${d}${e}`} p={[0.14 * d, 0.035 * e, 0]} r={0.045}><M c="#7ec8ff" r={0.25} /></Ball>
      )),
    )}
  </group>
);

const starShape = () => {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 === 0 ? 0.08 : 0.035;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
};

/** Star-topped toy flashlight. Beam points along +z. */
export const Flashlight: React.FC<{p?: V3; rot?: V3; s?: number; on?: number}> = ({p, rot, s = 1, on = 0}) => {
  const g = useMemo(() => new THREE.ExtrudeGeometry(starShape(), {depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008}), []);
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <group position={p} rotation={rot} scale={s}>
      <Cyl rot={[Math.PI / 2, 0, 0]} rt={0.04} rb={0.035} h={0.22}><M c="#5aa0ff" r={0.35} /></Cyl>
      <mesh geometry={g} position={[0, 0, 0.11]}>
        <M c="#ffe36b" e="#ffd23a" ei={on * 2.5} r={0.3} />
      </mesh>
      {on > 0 && (
        <>
          <mesh position={[0, 0, 0.11 + 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.7, 3.2, 32, 1, true]} />
            <meshBasicMaterial color="#fff3b0" transparent opacity={0.22 * on} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          <primitive object={target} position={[0, 0, 5]} />
          <spotLight position={[0, 0, 0.12]} intensity={60 * on} distance={8} angle={0.35} penumbra={0.5} color="#fff1b8" target={target} />
        </>
      )}
    </group>
  );
};

/** Expanding smoke puff; k goes 0 → 1 over the effect's life. */
export const Puff: React.FC<{p?: V3; k: number; s?: number; c?: string}> = ({p, k, s = 1, c = '#d9d3e8'}) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={p} scale={s}>
      {Array.from({length: 10}).map((_, i) => {
        const a = rand(i + 1) * Math.PI * 2;
        const b = (rand(i + 7) - 0.3) * 1.5;
        const d = 0.1 + k * 0.5 * (0.6 + rand(i + 3));
        return (
          <Ball key={i} p={[Math.cos(a) * d, b * d * 0.6 + k * 0.2, Math.sin(a) * d]} r={0.12 + k * 0.18} shadow={false}>
            <M c={c} r={1} o={(1 - k) * 0.85} />
          </Ball>
        );
      })}
    </group>
  );
};

/** Rising steam column. */
export const Steam: React.FC<{p?: V3; t: number; amount: number}> = ({p, t, amount}) => {
  if (amount <= 0) return null;
  return (
    <group position={p}>
      {Array.from({length: 8}).map((_, i) => {
        const life = ((t * 1.6 + i / 8) % 1);
        return (
          <Ball key={i} p={[Math.sin(i * 2.1 + t * 3) * 0.08, life * 0.9, Math.cos(i * 1.7) * 0.05]} r={0.06 + life * 0.12} shadow={false}>
            <M c="#ffffff" r={1} o={(1 - life) * 0.75 * amount} />
          </Ball>
        );
      })}
    </group>
  );
};

/** Twinkling sparkles around a point. */
export const Sparkles: React.FC<{p?: V3; t: number; amount: number; spread?: number; c?: string}> = ({p, t, amount, spread = 0.5, c = '#fff1a0'}) => {
  if (amount <= 0) return null;
  return (
    <group position={p}>
      {Array.from({length: 14}).map((_, i) => {
        const tw = clamp01(Math.sin(t * 6 + i * 1.9));
        return (
          <mesh key={i} position={[(rand(i) - 0.5) * spread * 2, (rand(i + 20) - 0.5) * spread * 2 + Math.sin(t + i) * 0.05, (rand(i + 40) - 0.5) * spread]} rotation={[0, 0, t + i]} scale={0.02 + tw * 0.035 * amount}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={c} toneMapped={false} transparent opacity={amount} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Heart: React.FC<{p?: V3; s?: number; o?: number}> = ({p, s = 1, o = 1}) => (
  <group position={p} scale={s}>
    <Ball p={[-0.04, 0.02, 0]} r={0.05} shadow={false}><M c="#ff5f86" e="#ff2f66" ei={0.6} o={o} /></Ball>
    <Ball p={[0.04, 0.02, 0]} r={0.05} shadow={false}><M c="#ff5f86" e="#ff2f66" ei={0.6} o={o} /></Ball>
    <Cone p={[0, -0.04, 0]} rot={[0, 0, Math.PI]} r={0.075} h={0.09} shadow={false}><M c="#ff5f86" e="#ff2f66" ei={0.6} o={o} /></Cone>
  </group>
);

export const Tear: React.FC<{p?: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <Ball r={0.035} s={[1, 1.3, 1]} shadow={false}><M c="#8fd6ff" r={0.1} e="#4fb8ff" ei={0.5} o={0.85} /></Ball>
  </group>
);

export const Wrapper: React.FC<{p: V3; i: number}> = ({p, i}) => (
  <Box p={p} rot={[0, rand(i) * 3, 0]} d={[0.12, 0.01, 0.07]}><M c={CANDY_COLORS[i % CANDY_COLORS.length]} r={0.2} m={0.4} /></Box>
);

export {CANDY_COLORS};
