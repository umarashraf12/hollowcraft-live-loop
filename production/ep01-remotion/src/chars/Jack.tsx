import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3} from '../anim';
import {Ball, Box, Cone, Cyl, Limb, M} from '../kit';

const tri = (w: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(0, h / 2);
  s.closePath();
  return new THREE.ShapeGeometry(s);
};

const grin = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.26, 0.04);
  s.quadraticCurveTo(0, -0.05, 0.26, 0.04);
  s.lineTo(0.2, -0.04);
  s.lineTo(0.13, 0.0);
  s.lineTo(0.08, -0.1);
  s.lineTo(0.0, -0.05);
  s.lineTo(-0.08, -0.1);
  s.lineTo(-0.13, 0.0);
  s.lineTo(-0.2, -0.04);
  s.closePath();
  return new THREE.ShapeGeometry(s);
};

const Straw: React.FC = () => (
  <group>
    {[-0.5, -0.2, 0.15, 0.45].map((a, i) => (
      <Cone key={i} p={[Math.sin(a) * 0.05, -0.08, 0]} rot={[Math.PI + a * 0.4, 0, a]} r={0.03} h={0.2} seg={6}>
        <M c="#e3c15b" r={0.9} />
      </Cone>
    ))}
  </group>
);

export type JackProps = {
  p?: V3;
  rot?: V3;
  s?: number;
  flame?: number;
  /** 0 grin … 1 sour pucker */
  pucker?: number;
  armL?: V3;
  armR?: V3;
  headRot?: V3;
  lean?: number;
  run?: number;
  pajama?: boolean;
  sleep?: boolean;
};

export const Jack: React.FC<JackProps> = ({
  p, rot, s = 1, flame = 1, pucker = 0, armL = [0, 0, 0.5], armR = [0, 0, -0.5], headRot = [0, 0, 0], lean = 0, run = 0, pajama = false, sleep = false,
}) => {
  const eyeG = useMemo(() => tri(0.15, 0.15), []);
  const mouthG = useMemo(grin, []);
  const glow = sleep ? 0.15 : flame;
  const fire = <meshStandardMaterial color="#ffcf4a" emissive="#ff9a1a" emissiveIntensity={1.2 + glow * 2.2} toneMapped={false} side={THREE.DoubleSide} />;
  const swing = Math.sin(run * Math.PI * 2) * 0.6;
  const coat = pajama ? '#a6d98c' : '#6e5232';
  return (
    <group position={p} rotation={rot} scale={s}>
      {[-1, 1].map((d) => (
        <group key={d} position={[0.14 * d, 0.95, 0]} rotation={[swing * d, 0, 0]}>
          <Cyl p={[0, -0.45, 0]} rt={0.07} rb={0.06} h={0.9}><M c={pajama ? '#86c46c' : '#3f4f6b'} r={0.9} /></Cyl>
          <group position={[0, -0.9, 0]}><Straw /></group>
        </group>
      ))}
      <group position={[0, 0.95, 0]} rotation={[lean, 0, 0]}>
        <Cyl p={[0, 0.42, 0]} rt={0.24} rb={0.34} h={0.9}><M c={coat} r={0.95} /></Cyl>
        {!pajama && (
          <>
            <Box p={[0.12, 0.3, 0.29]} rot={[0.15, 0, 0.2]} d={[0.13, 0.13, 0.02]}><M c="#a03e2e" r={0.9} /></Box>
            <Box p={[-0.15, 0.6, 0.24]} rot={[0.15, 0, -0.3]} d={[0.1, 0.1, 0.02]}><M c="#3a6e8f" r={0.9} /></Box>
          </>
        )}
        <Limb p={[-0.27, 0.8, 0]} rot={armL} r={0.055} l={0.6} mat={<M c={coat} r={0.95} />} end={<Straw />} />
        <Limb p={[0.27, 0.8, 0]} rot={armR} r={0.055} l={0.6} mat={<M c={coat} r={0.95} />} end={<Straw />} />
        {/* pumpkin head */}
        <group position={[0, 1.2, 0]} rotation={headRot}>
          {Array.from({length: 8}).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <Ball key={i} p={[Math.sin(a) * 0.13, 0, Math.cos(a) * 0.13]} rot={[0, a, 0]} r={1} s={[0.2, 0.3, 0.27]}>
                <M c="#e8761c" r={0.55} />
              </Ball>
            );
          })}
          <Cyl p={[0, 0.3, 0]} rot={[0, 0, 0.25]} rt={0.035} rb={0.05} h={0.14}><M c="#4d6b2a" r={0.8} /></Cyl>
          {/* carved face */}
          {[-1, 1].map((d) => (
            <group key={d} position={[0.13 * d, 0.07, 0.395]} rotation={[-0.1, d * 0.3, 0]}>
              <mesh geometry={eyeG} scale={[1, sleep ? 0.2 : 1, 1]}>{fire}</mesh>
              {!sleep && (
                <Cone p={[0, 0.1 + glow * 0.06, -0.02]} s={[1, 0.6 + glow * 1.1, 1]} r={0.045} h={0.16} seg={8}>
                  {fire}
                </Cone>
              )}
            </group>
          ))}
          <mesh geometry={mouthG} position={[0, -0.12, 0.395]} rotation={[-0.2, 0, 0]} scale={[1 - pucker * 0.7, 1 + pucker * 1.6, 1]}>
            {fire}
          </mesh>
          <pointLight position={[0, 0, 0.7]} intensity={1 + glow * 4} distance={4} color="#ff9a3a" />
          {/* hat */}
          <group position={[0, 0.3, -0.02]} rotation={[-0.1, 0, 0.15]}>
            <Cyl rt={0.36} h={0.03}><M c="#3b2c1c" r={0.95} /></Cyl>
            <Cone p={[0, 0.25, 0]} rot={[0.2, 0, -0.3]} r={0.18} h={0.5}><M c="#3b2c1c" r={0.95} /></Cone>
          </group>
        </group>
      </group>
    </group>
  );
};
