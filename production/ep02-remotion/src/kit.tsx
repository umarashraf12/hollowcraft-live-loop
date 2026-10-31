import {useThree} from '@react-three/fiber';
import React, {useLayoutEffect} from 'react';
import * as THREE from 'three';
import {V3} from './anim';

type MatProps = {
  c: string;
  r?: number;
  m?: number;
  e?: string;
  ei?: number;
  o?: number;
  flat?: boolean;
  side?: THREE.Side;
};

/** Short-hand standard material. */
export const M: React.FC<MatProps> = ({c, r = 0.65, m = 0, e, ei = 1, o, flat, side}) => (
  <meshStandardMaterial
    color={c}
    roughness={r}
    metalness={m}
    emissive={e ?? '#000000'}
    emissiveIntensity={e ? ei : 0}
    transparent={o !== undefined}
    opacity={o ?? 1}
    depthWrite={o === undefined || o > 0.6}
    flatShading={flat}
    side={side}
  />
);

/** Soft "skin" material: a touch of sheen reads as subsurface glow under moonlight. */
export const Skin: React.FC<{c: string}> = ({c}) => (
  <meshPhysicalMaterial color={c} roughness={0.55} sheen={0.6} sheenColor="#ffb4a0" sheenRoughness={0.6} />
);

type ShapeProps = {
  p?: V3;
  rot?: V3;
  s?: V3 | number;
  children?: React.ReactNode;
  shadow?: boolean;
};

const sc = (s: V3 | number | undefined): V3 => (s === undefined ? [1, 1, 1] : typeof s === 'number' ? [s, s, s] : s);

export const Ball: React.FC<ShapeProps & {r?: number; seg?: number}> = ({p, rot, s, r = 1, seg = 40, children, shadow = true}) => (
  <mesh position={p} rotation={rot} scale={sc(s)} castShadow={shadow} receiveShadow>
    <sphereGeometry args={[r, seg, Math.round(seg * 0.75)]} />
    {children}
  </mesh>
);

export const Box: React.FC<ShapeProps & {d: V3}> = ({p, rot, s, d, children, shadow = true}) => (
  <mesh position={p} rotation={rot} scale={sc(s)} castShadow={shadow} receiveShadow>
    <boxGeometry args={d} />
    {children}
  </mesh>
);

export const Cyl: React.FC<ShapeProps & {rt: number; rb?: number; h: number; seg?: number; open?: boolean}> = ({
  p, rot, s, rt, rb, h, seg = 32, open, children, shadow = true,
}) => (
  <mesh position={p} rotation={rot} scale={sc(s)} castShadow={shadow} receiveShadow>
    <cylinderGeometry args={[rt, rb ?? rt, h, seg, 1, open]} />
    {children}
  </mesh>
);

export const Cap: React.FC<ShapeProps & {r: number; l: number}> = ({p, rot, s, r, l, children, shadow = true}) => (
  <mesh position={p} rotation={rot} scale={sc(s)} castShadow={shadow} receiveShadow>
    <capsuleGeometry args={[r, l, 8, 20]} />
    {children}
  </mesh>
);

export const Cone: React.FC<ShapeProps & {r: number; h: number; seg?: number}> = ({p, rot, s, r, h, seg = 24, children, shadow = true}) => (
  <mesh position={p} rotation={rot} scale={sc(s)} castShadow={shadow}>
    <coneGeometry args={[r, h, seg]} />
    {children}
  </mesh>
);

export const Torus: React.FC<ShapeProps & {r: number; t: number; arc?: number}> = ({p, rot, s, r, t, arc = Math.PI * 2, children, shadow = true}) => (
  <mesh position={p} rotation={rot} scale={sc(s)} castShadow={shadow}>
    <torusGeometry args={[r, t, 16, 48, arc]} />
    {children}
  </mesh>
);

/** A limb hanging from a pivot: rotate the pivot, the capsule follows. */
export const Limb: React.FC<{p: V3; rot: V3; r: number; l: number; children?: React.ReactNode; mat: React.ReactNode; end?: React.ReactNode}> = ({
  p, rot, r, l, mat, end, children,
}) => (
  <group position={p} rotation={rot}>
    <Cap p={[0, -l / 2 - r * 0.3, 0]} r={r} l={l}>
      {mat}
    </Cap>
    <group position={[0, -l - r * 0.6, 0]}>
      {end}
      {children}
    </group>
  </group>
);

/** Drives the default camera from props every frame (deterministic). */
export const Cam: React.FC<{pos: V3; target: V3; fov?: number; roll?: number}> = ({pos, target, fov = 35, roll = 0}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(...target);
    camera.fov = fov;
    camera.near = 0.05;
    camera.far = 80;
    camera.updateProjectionMatrix();
  });
  return null;
};
