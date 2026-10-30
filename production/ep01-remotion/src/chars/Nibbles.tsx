import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../anim';
import {Ball, Cap, Cone, Limb, M} from '../kit';

const PALE = '#dfe8e2';

export type NibblesProps = {
  p?: V3;
  rot?: V3;
  s?: number;
  /** 0 wrapped … 1 cape spread wide */
  cape?: number;
  mouth?: number;
  /** 0 smug … 1 shrieking wide eyes */
  fright?: number;
  armL?: V3;
  armR?: V3;
  pajama?: boolean;
  sleep?: boolean;
};

/** Quarter-cylinder cape panel hanging from the shoulders; spread swings it out like a wing. */
const CapeHalf: React.FC<{side: 1 | -1; spread: number}> = ({side, spread}) => {
  const start = side > 0 ? Math.PI / 2 : Math.PI;
  return (
    <group position={[0, 0.86, -0.02]} rotation={[0.08 + spread * 0.25, 0, side * spread * 1.15]}>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.44, 0.82, 16, 1, true, start, Math.PI / 2]} />
        <meshStandardMaterial color="#14101a" roughness={0.5} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.195, 0.435, 0.82, 16, 1, true, start, Math.PI / 2]} />
        <meshStandardMaterial color="#b0142c" roughness={0.35} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

export const Nibbles: React.FC<NibblesProps> = ({
  p, rot, s = 1, cape = 0, mouth = 0, fright = 0, armL = [0, 0, 0.3], armR = [0, 0, -0.3], pajama = false, sleep = false,
}) => {
  const suit = pajama ? '#f2c94c' : '#1c1a24';
  return (
    <group position={p} rotation={rot} scale={s}>
      <Cap p={[-0.1, 0.17, 0]} r={0.07} l={0.15}><M c={suit} r={0.6} /></Cap>
      <Cap p={[0.1, 0.17, 0]} r={0.07} l={0.15}><M c={suit} r={0.6} /></Cap>
      <Ball p={[0, 0.5, 0]} r={1} s={[0.34, 0.36, 0.3]}><M c={suit} r={0.6} /></Ball>
      {!pajama && (
        <>
          <Ball p={[0, 0.55, 0.2]} r={1} s={[0.12, 0.2, 0.12]}><M c="#f4f1ea" r={0.6} /></Ball>
          <Ball p={[0, 0.74, 0.27]} r={0.045} s={[1.6, 0.8, 0.6]}><M c="#c0182e" r={0.4} /></Ball>
          <CapeHalf side={-1} spread={cape} />
          <CapeHalf side={1} spread={cape} />
          {/* collar */}
          {[-1, 1].map((d) => (
            <Cone key={d} p={[0.17 * d, 0.98, -0.12]} rot={[-0.3, 0, -d * 0.35]} r={0.14} h={0.34} seg={3}>
              <M c="#b0142c" r={0.35} />
            </Cone>
          ))}
        </>
      )}
      <Limb p={[-0.3, 0.68, 0]} rot={armL} r={0.06} l={0.18} mat={<M c={suit} r={0.6} />} end={<Ball r={0.065}><M c={PALE} /></Ball>} />
      <Limb p={[0.3, 0.68, 0]} rot={armR} r={0.06} l={0.18} mat={<M c={suit} r={0.6} />} end={<Ball r={0.065}><M c={PALE} /></Ball>} />
      <group position={[0, 1.05, 0]}>
        <Ball r={0.3} s={[1, 0.95, 0.95]}><M c={PALE} r={0.5} /></Ball>
        {/* slicked hair with widow's peak */}
        <mesh position={[0, 0.03, -0.02]} rotation={[-0.35, 0, 0]}>
          <sphereGeometry args={[0.31, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2.1]} />
          <M c="#141018" r={0.25} />
        </mesh>
        <Cone p={[0, 0.18, 0.25]} rot={[Math.PI + 0.5, 0, 0]} r={0.06} h={0.12} seg={4}><M c="#141018" r={0.25} /></Cone>
        {[-1, 1].map((d) => (
          <Cone key={d} p={[0.3 * d, 0.05, 0]} rot={[0, 0, -d * 1.1]} r={0.06} h={0.18}><M c={PALE} r={0.5} /></Cone>
        ))}
        {[-0.1, 0.1].map((x) => (
          <group key={x} position={[x, 0.02, 0.25]} scale={1 + fright * 0.5}>
            <Ball r={0.06} shadow={false}><M c="#ffffff" r={0.3} /></Ball>
            <Ball p={[0, 0, 0.045]} r={0.03 - fright * 0.012} s={[1, 1, 0.5]} shadow={false}><M c="#c4102a" e="#7a0010" ei={0.6} /></Ball>
            {sleep && (
              <mesh rotation={[1.5, 0, 0]}>
                <sphereGeometry args={[0.066, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <M c={PALE} r={0.5} />
              </mesh>
            )}
          </group>
        ))}
        {[-1, 1].map((d) => (
          <Cap key={d} p={[0.1 * d, 0.11 + fright * 0.04, 0.27]} rot={[0, 0, Math.PI / 2 + d * (0.4 - fright * 0.8)]} r={0.012} l={0.07} shadow={false}>
            <M c="#141018" />
          </Cap>
        ))}
        <group position={[0, -0.12, 0.26]}>
          <Ball r={0.06} s={[1.2, 0.15 + mouth * 1.1, 0.4]} shadow={false}><M c="#3a0a14" /></Ball>
          {[-0.035, 0.035].map((x) => (
            <Cone key={x} p={[x, 0.005 - mouth * 0.015, 0.02]} rot={[Math.PI, 0, 0]} r={0.012} h={0.045}><M c="#ffffff" r={0.2} /></Cone>
          ))}
        </group>
      </group>
    </group>
  );
};

const wingShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.05);
  s.quadraticCurveTo(0.25, 0.2, 0.42, 0.08);
  s.quadraticCurveTo(0.36, -0.02, 0.32, -0.08);
  s.quadraticCurveTo(0.26, -0.02, 0.2, -0.08);
  s.quadraticCurveTo(0.14, -0.02, 0.08, -0.08);
  s.quadraticCurveTo(0.04, -0.02, 0, -0.04);
  s.closePath();
  return new THREE.ShapeGeometry(s, 12);
};

export const Bat: React.FC<{p?: V3; rot?: V3; s?: number; flap: number; dizzy?: number}> = ({p, rot, s = 1, flap, dizzy = 0}) => {
  const g = useMemo(wingShape, []);
  const a = Math.sin(flap * Math.PI * 2) * 0.7;
  return (
    <group position={p} rotation={rot} scale={s}>
      <Ball r={0.1} s={[1, 1.1, 0.9]}><M c="#1c1a24" r={0.6} /></Ball>
      {[-1, 1].map((d) => (
        <Cone key={d} p={[0.05 * d, 0.11, 0]} rot={[0, 0, -d * 0.3]} r={0.03} h={0.07}><M c="#1c1a24" /></Cone>
      ))}
      {[-0.035, 0.035].map((x) => (
        <Ball key={x} p={[x, 0.02, 0.085]} r={0.02} shadow={false}><M c="#ff3048" e="#ff1030" ei={1.5} /></Ball>
      ))}
      {[-1, 1].map((d) => (
        <group key={d} position={[0.06 * d, 0.02, 0]} rotation={[0, 0, d * a]} scale={[d, 1, 1]}>
          <mesh geometry={g}>
            <meshStandardMaterial color="#2a2236" side={THREE.DoubleSide} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {dizzy > 0 &&
        [0, 1, 2].map((i) => {
          const ang = dizzy * 8 + (i * Math.PI * 2) / 3;
          return (
            <Ball key={i} p={[Math.cos(ang) * 0.18, 0.2, Math.sin(ang) * 0.18]} r={0.025} shadow={false}>
              <M c="#ffe36b" e="#ffd23a" ei={2} />
            </Ball>
          );
        })}
    </group>
  );
};
