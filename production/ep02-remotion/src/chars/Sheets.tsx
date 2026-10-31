import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../anim';
import {Ball, Cap, Cyl, M, Torus} from '../kit';

const useSheetGeometry = (flutter: number) =>
  useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 0.5;
      pts.push(new THREE.Vector2(Math.sin(a) * 0.48, 1.2 + Math.cos(a) * 0.48));
    }
    for (let i = 1; i <= 16; i++) {
      const k = i / 16;
      pts.push(new THREE.Vector2(0.48 + k * k * 0.3, 1.2 - k * 1.15));
    }
    const g = new THREE.LatheGeometry(pts, 64);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const hem = Math.max(0, 0.6 - y) / 0.6;
      const ang = Math.atan2(z, x);
      pos.setY(i, y + Math.sin(ang * 7 + flutter) * 0.07 * hem);
      const r = 1 + Math.sin(ang * 5 - flutter * 1.3) * 0.05 * hem;
      pos.setX(i, x * r);
      pos.setZ(i, z * r);
    }
    g.computeVertexNormals();
    return g;
  }, [flutter]);

export type SheetsProps = {
  p?: V3;
  rot?: V3;
  s?: number;
  t: number;
  arms?: number;
  opacity?: number;
};

/** Bedsheet ghost. `t` drives the hem flutter. */
export const Sheets: React.FC<SheetsProps> = ({p, rot, s = 1, t, arms = 1, opacity = 0.97}) => {
  const geo = useSheetGeometry(Math.round(t * 30) * 0.18);
  const sheet = <meshStandardMaterial color="#f3f6ff" emissive="#9fb7ff" emissiveIntensity={0.25} roughness={0.85} side={THREE.DoubleSide} transparent opacity={opacity} />;
  return (
    <group position={p} rotation={rot} scale={s}>
      <mesh geometry={geo} castShadow>{sheet}</mesh>
      {[-1, 1].map((d) => (
        <group key={d} position={[0.5 * d, 1.05, 0.05]} rotation={[0, 0, d * (0.6 + arms * 1.6)]}>
          <Cap p={[0, -0.25, 0]} r={0.12} l={0.35}>{sheet}</Cap>
        </group>
      ))}
      {[-0.16, 0.16].map((x) => (
        <Ball key={x} p={[x, 1.33, 0.44]} r={0.075} s={[0.8, 1.15, 0.35]} shadow={false}><M c="#05060c" r={0.9} /></Ball>
      ))}
      <Ball p={[0, 1.13, 0.47]} r={0.06} s={[1, 1.4, 0.3]} shadow={false}><M c="#05060c" r={0.9} /></Ball>
      <pointLight position={[0, 1.1, 0.8]} intensity={opacity * 1.4} distance={3} color="#a9c4ff" />
    </group>
  );
};

export type SkeletonProps = {
  p?: V3;
  rot?: V3;
  s?: number;
  /** 0 arms down … 1 hugging ribs (embarrassed) */
  cover?: number;
  run?: number;
  blush?: number;
  pajama?: boolean;
  sleep?: boolean;
  /** 0…1 jaw drop */
  jaw?: number;
  /** right arm popped off */
  armOff?: boolean;
  towel?: boolean;
  holdR?: React.ReactNode;
  /** override arm poses: [x, z] per side */
  arms?: {l: [number, number]; r: [number, number]};
};

export const Skeleton: React.FC<SkeletonProps> = ({p, rot, s = 1, cover = 0, run = 0, blush = 0, pajama = false, sleep = false, jaw = 0, armOff = false, towel = false, holdR, arms}) => {
  const bone = <M c="#f2ecd9" r={0.5} />;
  const swing = Math.sin(run * Math.PI * 2) * 0.7;
  return (
    <group position={p} rotation={rot} scale={s}>
      {[-1, 1].map((d) => (
        <group key={d} position={[0.07 * d, 0.38, 0]} rotation={[swing * d, 0, 0]}>
          <Cyl p={[0, -0.17, 0]} rt={0.018} h={0.34}>{bone}</Cyl>
          <Ball p={[0, -0.35, 0.03]} r={0.035} s={[1, 0.6, 1.6]}>{bone}</Ball>
        </group>
      ))}
      <Torus p={[0, 0.4, 0]} rot={[Math.PI / 2, 0, 0]} r={0.075} t={0.02}>{bone}</Torus>
      <Cyl p={[0, 0.58, -0.04]} rt={0.016} h={0.36}>{bone}</Cyl>
      {pajama ? (
        <Ball p={[0, 0.6, 0]} r={1} s={[0.14, 0.18, 0.11]}><M c="#f5b3c8" r={0.9} /></Ball>
      ) : (
        [0.5, 0.58, 0.66].map((y, i) => (
          <Torus key={y} p={[0, y, 0]} rot={[Math.PI / 2, 0, 0]} s={[1, 0.8, 1]} r={0.1 - i * 0.008} t={0.014}>{bone}</Torus>
        ))
      )}
      {[-1, 1].map((d) => {
        if (d === 1 && armOff) return null;
        const pose = arms ? (d < 0 ? arms.l : arms.r) : null;
        const rx = pose ? pose[0] : -cover * 1.3 - swing * d * 0.6;
        const rz = pose ? pose[1] * d : d * (0.2 - cover * 1.5);
        return (
          <group key={d} position={[0.12 * d, 0.73, 0]} rotation={[rx, 0, rz]}>
            <Cyl p={[0, -0.13, 0]} rt={0.015} h={0.26}>{bone}</Cyl>
            <Ball p={[0, -0.27, 0]} r={0.03}>{bone}</Ball>
            {d === 1 && <group position={[0, -0.29, 0]}>{holdR}</group>}
          </group>
        );
      })}
      {towel && (
        <group position={[0, 0.78, 0]}>
          <mesh position={[0, -0.22, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.24, 0.55, 28, 1, true]} />
            <meshStandardMaterial color="#ffb3a7" roughness={1} side={THREE.DoubleSide} />
          </mesh>
          {[-0.05, -0.3].map((y) => (
            <Torus key={y} p={[0, y, 0]} rot={[Math.PI / 2, 0, 0]} r={0.16 - y * 0.25} t={0.012}><M c="#ffffff" r={1} /></Torus>
          ))}
        </group>
      )}
      <group position={[0, 0.92, 0]} rotation={[sleep ? 0.3 : 0, 0, 0]}>
        <Ball r={0.16} s={[1, 1.05, 1]}>{bone}</Ball>
        <Ball p={[0, -0.12 - jaw * 0.07, 0.04 + jaw * 0.01]} r={0.09} s={[1, 0.5, 0.9]}>{bone}</Ball>
        {jaw > 0.05 && <Ball p={[0, -0.1, 0.1]} r={0.05} s={[1, jaw, 0.4]} shadow={false}><M c="#120d0b" /></Ball>}
        {[-0.06, 0.06].map((x) => (
          <Ball key={x} p={[x, 0.01, 0.135]} r={0.04} s={[1, sleep ? 0.25 : 1.2, 0.5]} shadow={false}><M c="#120d0b" /></Ball>
        ))}
        <Ball p={[0, -0.05, 0.155]} r={0.014} s={[1, 1.4, 0.5]} shadow={false}><M c="#120d0b" /></Ball>
        {blush > 0 &&
          [-0.1, 0.1].map((x) => (
            <Ball key={x} p={[x, -0.05, 0.12]} r={0.035} s={[1.3, 0.7, 0.4]} shadow={false}><M c="#ff6f8a" o={0.7 * blush} /></Ball>
          ))}
      </group>
    </group>
  );
};
