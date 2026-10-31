import React from 'react';
import {V3} from '../anim';
import {Ball, Cap, Limb, M, Skin} from '../kit';

const SKIN = '#e9b48f';

export const Mom: React.FC<{p?: V3; rot?: V3; s?: number; shock?: number; armL?: V3; armR?: V3; walk?: number; dad?: boolean; top?: string; legs?: string}> = ({
  p, rot, s = 1, shock = 0, armL = [0, 0, 0.15], armR = [0, 0, -0.15], walk = 0, dad = false, top, legs,
}) => {
  const shirt = top ?? (dad ? '#4f7fc4' : '#f7a8c4');
  const pants = legs ?? (dad ? '#3a4054' : '#c7b8d6');
  const hair = dad ? '#2f2016' : '#5a3824';
  const step = Math.sin(walk * Math.PI * 2) * 0.35;
  return (
    <group position={p} rotation={rot} scale={s}>
      {[-1, 1].map((d) => (
        <group key={d} position={[0.12 * d, 0.85, 0]} rotation={[step * d, 0, 0]}>
          <Cap p={[0, -0.4, 0]} r={0.1} l={0.7}><M c={pants} r={0.9} /></Cap>
          <Ball p={[0, -0.82, 0.06]} r={0.1} s={[1, 0.6, 1.5]}><M c={dad ? '#3a2a20' : '#ffd1dc'} r={0.95} /></Ball>
        </group>
      ))}
      <Ball p={[0, 1.15, 0]} r={1} s={dad ? [0.36, 0.44, 0.27] : [0.32, 0.42, 0.24]}><M c={shirt} r={0.95} /></Ball>
      <Limb p={[-0.3, 1.42, 0]} rot={armL} r={0.065} l={0.48} mat={<Skin c={SKIN} />} end={<Ball r={0.07}><Skin c={SKIN} /></Ball>} />
      <Limb p={[0.3, 1.42, 0]} rot={armR} r={0.065} l={0.48} mat={<Skin c={SKIN} />} end={<Ball r={0.07}><Skin c={SKIN} /></Ball>} />
      <Cap p={[0, 1.6, 0]} r={0.06} l={0.08}><Skin c={SKIN} /></Cap>
      <group position={[0, 1.84, 0]}>
        <Ball r={0.22} s={[0.95, 1.05, 0.95]}><Skin c={SKIN} /></Ball>
        <mesh position={[0, 0.02, -0.02]} rotation={[-0.25, 0, 0]}>
          <sphereGeometry args={[0.235, 40, 20, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
          <M c={hair} r={0.7} />
        </mesh>
        {dad ? (
          <Ball p={[0, -0.13, 0.08]} r={0.15} s={[1, 0.55, 0.8]}><M c="#3b2a20" r={1} o={0.5} /></Ball>
        ) : (
          <Ball p={[0, 0.25, -0.06]} r={0.11}><M c={hair} r={0.7} /></Ball>
        )}
        {[-0.075, 0.075].map((x) => (
          <group key={x} position={[x, 0.02, 0.19]} scale={1 + shock * 0.35}>
            <Ball r={0.045} shadow={false}><M c="#ffffff" r={0.3} /></Ball>
            <Ball p={[0, 0, 0.035]} r={0.024 - shock * 0.008} s={[1, 1, 0.5]} shadow={false}><M c="#3b2414" /></Ball>
          </group>
        ))}
        {[-1, 1].map((d) => (
          <Cap key={d} p={[0.075 * d, 0.1 + shock * 0.04, 0.2]} rot={[0, 0, Math.PI / 2 - d * 0.15]} r={0.01} l={0.05} shadow={false}><M c={hair} /></Cap>
        ))}
        <Ball p={[0, -0.1, 0.2]} r={0.04} s={[1, 0.25 + shock * 1.2, 0.4]} shadow={false}><M c="#6a2230" /></Ball>
      </group>
    </group>
  );
};
