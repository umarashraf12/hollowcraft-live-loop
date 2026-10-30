import React from 'react';
import {V3} from '../anim';
import {Ball, Cap, Cone, Cyl, Limb, M} from '../kit';

const FUR = '#7c7f8c';
const FUR_LIGHT = '#b3b5bf';
const FUR_DARK = '#555866';

const Fur: React.FC<{c?: string}> = ({c = FUR}) => <M c={c} r={0.95} flat />;

/** Faceted icosphere reads as chunky fur under hard moonlight. */
const FurBall: React.FC<{p?: V3; s?: V3; r?: number; c?: string}> = ({p, s, r = 1, c}) => (
  <mesh position={p} scale={s} castShadow receiveShadow>
    <icosahedronGeometry args={[r, 3]} />
    <Fur c={c} />
  </mesh>
);

const Claws: React.FC = () => (
  <group>
    <FurBall r={0.17} c={FUR_DARK} />
    {[-0.09, 0, 0.09].map((x, i) => (
      <Cone key={i} p={[x, -0.17, 0.08]} rot={[0.5, 0, 0]} r={0.025} h={0.14}>
        <M c="#efe6cf" r={0.3} />
      </Cone>
    ))}
  </group>
);

export type WoofleProps = {
  p?: V3;
  rot?: V3;
  s?: number;
  /** 0 closed … 1 wide snarl */
  mouth?: number;
  /** 0 menacing … 1 happy puppy */
  puppy?: number;
  armL?: V3;
  armR?: V3;
  headRot?: V3;
  wag?: number;
  lean?: number;
  pajama?: boolean;
  sleep?: number;
};

export const Woofle: React.FC<WoofleProps> = ({
  p, rot, s = 1, mouth = 0, puppy = 0, armL = [0.2, 0, 0.35], armR = [0.2, 0, -0.35], headRot = [0, 0, 0], wag = 0, lean = 0, pajama = false, sleep = 0,
}) => {
  const eyeScale = 1 + puppy * 0.7;
  const body = pajama ? '#9fc5f0' : FUR;
  return (
    <group position={p} rotation={rot} scale={s}>
      {/* legs */}
      <Cap p={[-0.3, 0.42, 0]} r={0.17} l={0.45}><Fur c={pajama ? body : FUR_DARK} /></Cap>
      <Cap p={[0.3, 0.42, 0]} r={0.17} l={0.45}><Fur c={pajama ? body : FUR_DARK} /></Cap>
      <Ball p={[-0.3, 0.1, 0.12]} r={0.2} s={[1, 0.6, 1.5]}><Fur c={FUR_DARK} /></Ball>
      <Ball p={[0.3, 0.1, 0.12]} r={0.2} s={[1, 0.6, 1.5]}><Fur c={FUR_DARK} /></Ball>
      <group rotation={[lean, 0, 0]} position={[0, 0.8, 0]}>
        {/* shorts */}
        <Cyl p={[0, 0.12, 0]} rt={0.5} rb={0.56} h={0.4}><M c={pajama ? '#7aa6dd' : '#6b3fa0'} r={0.85} /></Cyl>
        {[-0.4, -0.15, 0.15, 0.42].map((x, i) => (
          <Cone key={i} p={[x, -0.1, 0.42]} rot={[Math.PI, 0, 0]} r={0.07} h={0.12}><M c={pajama ? '#7aa6dd' : '#6b3fa0'} r={0.85} /></Cone>
        ))}
        {/* torso */}
        <FurBall p={[0, 0.72, 0]} s={[0.62, 0.72, 0.5]} c={body} />
        <FurBall p={[0, 0.82, 0.3]} s={[0.38, 0.45, 0.25]} c={pajama ? '#c8def7' : FUR_LIGHT} />
        {/* tail */}
        <group position={[0, 0.25, -0.42]} rotation={[-0.9, 0, Math.sin(wag * Math.PI * 2) * 0.8]}>
          <Cap p={[0, 0.3, 0]} r={0.1} l={0.45}><Fur /></Cap>
          <FurBall p={[0, 0.62, 0]} r={0.13} c={FUR_LIGHT} />
        </group>
        {/* arms */}
        <Limb p={[-0.62, 1.1, 0]} rot={armL} r={0.15} l={0.65} mat={<Fur c={body} />} end={<Claws />} />
        <Limb p={[0.62, 1.1, 0]} rot={armR} r={0.15} l={0.65} mat={<Fur c={body} />} end={<Claws />} />
        {/* head */}
        <group position={[0, 1.55, 0.05]} rotation={headRot}>
          <FurBall r={0.42} />
          <FurBall p={[0, -0.12, 0.1]} s={[0.5, 0.32, 0.4]} c={FUR_LIGHT} />
          {/* snout + upper teeth */}
          <FurBall p={[0, -0.07, 0.42]} s={[0.21, 0.15, 0.36]} c={FUR_LIGHT} />
          <Ball p={[0, 0.01, 0.77]} r={0.075} s={[1.3, 0.9, 1]}><M c="#1a1416" r={0.25} /></Ball>
          {[-0.1, -0.035, 0.035, 0.1].map((x, i) => (
            <Cone key={i} p={[x, -0.2, 0.62 - Math.abs(x) * 0.8]} rot={[Math.PI, 0, 0]} r={0.025} h={0.09 + (i % 3 === 0 ? 0.04 : 0)}><M c="#fffaf0" r={0.3} /></Cone>
          ))}
          {/* jaw */}
          <group position={[0, -0.16, 0.22]} rotation={[mouth * 0.55, 0, 0]}>
            <Ball p={[0, -0.02, 0.18]} r={1} s={[0.17, 0.05, 0.22]}><M c="#8a2c3a" r={0.6} /></Ball>
            <FurBall p={[0, -0.07, 0.18]} s={[0.19, 0.07, 0.24]} c={FUR_LIGHT} />
            {[-0.08, 0.08].map((x, i) => (
              <Cone key={i} p={[x, 0.03, 0.3]} r={0.022} h={0.08}><M c="#fffaf0" r={0.3} /></Cone>
            ))}
            {/* tongue */}
            <Ball p={[0.03, -0.12 * puppy, 0.36 + puppy * 0.05]} r={1} s={[0.07, 0.02 + puppy * 0.1, 0.06]}><M c="#f06c86" r={0.4} /></Ball>
          </group>
          {/* eyes */}
          {[-0.17, 0.17].map((x, i) => (
            <group key={i} position={[x, 0.1, 0.33]} scale={eyeScale}>
              <Ball r={0.075} shadow={false}><M c={puppy > 0.5 ? '#ffffff' : '#ffd23a'} e={puppy > 0.5 ? undefined : '#ffb400'} ei={0.9} r={0.3} /></Ball>
              <Ball p={[0, 0, 0.05]} r={0.045} s={[0.35 + puppy * 0.65, 1, 0.5]} shadow={false}><M c="#120c0a" r={0.2} /></Ball>
              {puppy > 0.3 && (
                <Ball p={[0.02, 0.025, 0.075]} r={0.014} shadow={false}><M c="#ffffff" e="#ffffff" ei={2} /></Ball>
              )}
              {sleep > 0 && (
                <mesh rotation={[-1.2 + 2.77 * sleep, 0, 0]}>
                  <sphereGeometry args={[0.082, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <Fur />
                </mesh>
              )}
            </group>
          ))}
          {/* brows: angry → worried as puppy goes up */}
          <Cap p={[-0.17, 0.24, 0.35]} rot={[0, 0, Math.PI / 2 + (puppy - 0.5) * 0.9]} r={0.03} l={0.12}><Fur c={FUR_DARK} /></Cap>
          <Cap p={[0.17, 0.24, 0.35]} rot={[0, 0, Math.PI / 2 - (puppy - 0.5) * 0.9]} r={0.03} l={0.12}><Fur c={FUR_DARK} /></Cap>
          {/* ears: one proud, one floppy */}
          <Cone p={[-0.27, 0.46, 0]} rot={[0, 0, 0.35]} r={0.15} h={0.42}><Fur c={FUR_DARK} /></Cone>
          <Cone p={[0.38, 0.32, 0]} rot={[0, 0, -1.9 - puppy * 0.3]} r={0.15} h={0.42}><Fur c={FUR_DARK} /></Cone>
        </group>
      </group>
    </group>
  );
};

/** A long hairy arm reaching through the window; `reach` is how far it has slid in. */
export const ClawArm: React.FC<{p: V3; rot: V3; reach: number; wiggle: number}> = ({p, rot, reach, wiggle}) => (
  <group position={p} rotation={rot}>
    <group position={[0, 0, reach]}>
      <Cap p={[0, 0, -0.9]} rot={[Math.PI / 2, 0, 0]} r={0.16} l={1.8}><Fur /></Cap>
      <group position={[0, 0, 0.12]} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <FurBall r={0.19} c={FUR_DARK} />
        {[-0.1, -0.035, 0.035, 0.1].map((x, i) => (
          <group key={i} position={[x, -0.15, 0.05]} rotation={[0.4 + Math.sin(wiggle * 6 + i) * 0.35, 0, 0]}>
            <Cap p={[0, -0.08, 0]} r={0.035} l={0.12}><Fur c={FUR_DARK} /></Cap>
            <Cone p={[0, -0.2, 0.01]} r={0.025} h={0.11}><M c="#efe6cf" r={0.3} /></Cone>
          </group>
        ))}
      </group>
    </group>
  </group>
);
