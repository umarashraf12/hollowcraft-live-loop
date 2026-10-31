import React from 'react';
import {V3} from '../anim';
import {Ball, Cap, Cyl, Limb, M, Skin, Torus} from '../kit';

const SKIN = '#f7c6a3';
const MINT = '#8fdcc4';

export type ArmPose = {x: number; z: number; y?: number};
export const ARMS: Record<string, ArmPose> = {
  down: {x: 0.15, z: 0.25},
  crossed: {x: -1.3, z: -1.05},
  up: {x: -2.7, z: 0.2},
  forward: {x: -1.45, z: -0.12},
  shh: {x: -1.9, z: -0.5},
};

type EyeProps = {x: number; close: number; look: [number, number]; tilt: number; sparkle?: boolean};

const Eye: React.FC<EyeProps> = ({x, close, look, tilt}) => {
  // Lid: top hemisphere rotated around X. -1.2 = wide open, 0 = half (grumpy), 1.57 = shut.
  const lidRot = -1.2 + close * 2.77;
  return (
    <group position={[x, 0.06, 0.255]}>
      <Ball r={0.085} shadow={false}>
        <M c="#ffffff" r={0.25} />
      </Ball>
      <group position={[look[0] * 0.03, look[1] * 0.025, 0.062]}>
        <Ball r={0.048} s={[1, 1, 0.45]} shadow={false}>
          <M c="#5a3620" r={0.3} />
        </Ball>
        <Ball p={[0, 0, 0.018]} r={0.026} s={[1, 1, 0.4]} shadow={false}>
          <M c="#0b0605" r={0.2} />
        </Ball>
        <Ball p={[0.018, 0.02, 0.03]} r={0.011} shadow={false}>
          <M c="#ffffff" e="#ffffff" ei={2} />
        </Ball>
      </group>
      <group rotation={[0, 0, tilt]}>
        <mesh rotation={[lidRot, 0, 0]}>
          <sphereGeometry args={[0.093, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Skin c={SKIN} />
        </mesh>
      </group>
    </group>
  );
};

export type MiloProps = {
  p?: V3;
  rot?: V3;
  s?: number;
  /** 0 open … 1 shut; default 0.42 is the signature grumpy half-lid */
  close?: number;
  closeL?: number;
  closeR?: number;
  look?: [number, number];
  brow?: number;
  armL?: ArmPose;
  armR?: ArmPose;
  holdR?: React.ReactNode;
  holdL?: React.ReactNode;
  headTilt?: V3;
  standing?: boolean;
  walk?: number;
  pacifier?: boolean;
  suck?: number;
  /** 0…1 raises a 'shh' finger in front of the lips */
  shh?: number;
  /** outfit colour (mint onesie by default) */
  onesie?: string;
  /** 0…1 raises the right eyebrow ("really?") */
  raiseR?: number;
};

export const Milo: React.FC<MiloProps> = ({
  p, rot, s = 1, close = 0.42, closeL, closeR, look = [0, 0], brow = 1, armL = ARMS.down, armR = ARMS.down,
  holdR, holdL, headTilt = [0, 0, 0], standing = false, walk = 0, pacifier = true, suck = 0, shh = 0, onesie = MINT, raiseR = 0,
}) => {
  const ONESIE = onesie;
  const skin = <Skin c={SKIN} />;
  const hand = (
    <Ball r={0.07}>
      <Skin c={SKIN} />
    </Ball>
  );
  const lift = standing ? 0.2 : 0;
  const step = Math.sin(walk * Math.PI * 2);
  return (
    <group position={p} rotation={rot} scale={s}>
      <group position={[0, lift + Math.abs(step) * 0.03, 0]} rotation={[0, 0, step * 0.08]}>
        {/* legs */}
        {standing ? (
          <>
            <Limb p={[-0.11, 0.08, 0]} rot={[step * 0.4, 0, 0]} r={0.085} l={0.12} mat={<M c={ONESIE} r={0.8} />} end={<Ball r={0.095} s={[1, 0.7, 1.3]}><M c={ONESIE} r={0.8} /></Ball>} />
            <Limb p={[0.11, 0.08, 0]} rot={[-step * 0.4, 0, 0]} r={0.085} l={0.12} mat={<M c={ONESIE} r={0.8} />} end={<Ball r={0.095} s={[1, 0.7, 1.3]}><M c={ONESIE} r={0.8} /></Ball>} />
          </>
        ) : (
          <>
            <Cap p={[-0.12, 0.09, 0.16]} rot={[Math.PI / 2, 0, 0.1]} r={0.09} l={0.16}><M c={ONESIE} r={0.8} /></Cap>
            <Cap p={[0.12, 0.09, 0.16]} rot={[Math.PI / 2, 0, -0.1]} r={0.09} l={0.16}><M c={ONESIE} r={0.8} /></Cap>
            <Ball p={[-0.13, 0.1, 0.32]} r={0.095} s={[1, 1.1, 0.8]}><M c={ONESIE} r={0.8} /></Ball>
            <Ball p={[0.13, 0.1, 0.32]} r={0.095} s={[1, 1.1, 0.8]}><M c={ONESIE} r={0.8} /></Ball>
          </>
        )}
        {/* body */}
        <Ball p={[0, 0.3, 0]} r={1} s={[0.26, 0.29, 0.24]}>
          <M c={ONESIE} r={0.8} />
        </Ball>
        {[[-0.1, 0.38, 0.2], [0.12, 0.25, 0.21], [0.02, 0.15, 0.22], [-0.15, 0.2, 0.17], [0.15, 0.42, 0.16]].map((q, i) => (
          <Ball key={i} p={q as V3} r={0.022} s={[1, 1, 0.3]} shadow={false}>
            <M c="#ffe07a" r={0.5} />
          </Ball>
        ))}
        {/* arms */}
        <Limb p={[-0.22, 0.45, 0]} rot={[armL.x, -(armL.y ?? 0), -armL.z]} r={0.062} l={0.15} mat={<M c={ONESIE} r={0.8} />} end={hand}>
          {holdL}
        </Limb>
        <Limb p={[0.22, 0.45, 0]} rot={[armR.x, armR.y ?? 0, armR.z]} r={0.062} l={0.15} mat={<M c={ONESIE} r={0.8} />} end={hand}>
          {holdR}
        </Limb>
        {/* head */}
        <group position={[0, 0.84, 0]} rotation={headTilt}>
          <Ball r={0.34} s={[1, 0.94, 0.92]} seg={56}>
            {skin}
          </Ball>
          <Ball p={[-0.33, -0.02, -0.02]} r={0.07} s={[0.6, 1, 0.9]}>{skin}</Ball>
          <Ball p={[0.33, -0.02, -0.02]} r={0.07} s={[0.6, 1, 0.9]}>{skin}</Ball>
          <Torus p={[0.02, 0.33, 0.02]} rot={[0, 0.3, 0.6]} r={0.055} t={0.018} arc={Math.PI * 1.6}>
            <M c="#5b3a22" r={0.5} />
          </Torus>
          {/* cheeks */}
          <Ball p={[-0.17, -0.1, 0.24]} r={0.06} s={[1, 0.7, 0.4]} shadow={false}><M c="#ff9b8f" o={0.45} /></Ball>
          <Ball p={[0.17, -0.1, 0.24]} r={0.06} s={[1, 0.7, 0.4]} shadow={false}><M c="#ff9b8f" o={0.45} /></Ball>
          <Eye x={-0.115} close={closeL ?? close} look={look} tilt={-0.28 * brow} />
          <Eye x={0.115} close={(closeR ?? close) * (1 - raiseR * 0.7)} look={look} tilt={0.28 * brow * (1 - raiseR)} />
          {/* brows: inner ends low = grumpy */}
          <Cap p={[-0.12, 0.17, 0.27]} rot={[0, 0, Math.PI / 2 - 0.35 * brow]} r={0.017} l={0.07} shadow={false}><M c="#5b3a22" /></Cap>
          <Cap p={[0.12, 0.17 + raiseR * 0.06, 0.27]} rot={[0, 0, Math.PI / 2 + 0.35 * brow * (1 - raiseR * 1.6)]} r={0.017} l={0.07} shadow={false}><M c="#5b3a22" /></Cap>
          <Ball p={[0, -0.04, 0.315]} r={0.035} s={[1.2, 0.9, 0.8]}>{skin}</Ball>
          {shh > 0.01 && (
            <group position={[0.02, -0.24 + shh * 0.06, 0.4]} scale={shh}>
              <Ball r={0.065} s={[1, 0.85, 0.8]}>{skin}</Ball>
              <Cap p={[0, 0.09, 0.02]} r={0.023} l={0.08}>{skin}</Cap>
            </group>
          )}
          {pacifier ? (
            <group position={[0, -0.15, 0.3 + suck * 0.015]} scale={1 + suck * 0.06}>
              <Cyl rot={[Math.PI / 2, 0, 0]} rt={0.085} h={0.025}><M c="#ff8a2a" r={0.35} /></Cyl>
              <Torus p={[0, 0, 0.035]} r={0.045} t={0.012}><M c="#ffb366" r={0.3} /></Torus>
              <Cyl p={[0, 0.06, 0.016]} rt={0.008} h={0.025}><M c="#3f8a3a" /></Cyl>
            </group>
          ) : (
            <Torus p={[0, -0.15, 0.3]} rot={[0, 0, Math.PI]} r={0.035} t={0.01} arc={Math.PI}><M c="#a5544a" /></Torus>
          )}
        </group>
      </group>
    </group>
  );
};
