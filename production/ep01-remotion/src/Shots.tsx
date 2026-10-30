import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {useVideoConfig} from 'remotion';
import {V3, clamp01, easeIn, easeOut, lerp, mix3, noise, outBack, pulse, ramp, useT} from './anim';
import {ARMS, ArmPose, Milo} from './chars/Milo';
import {ClawArm, Woofle} from './chars/Woofle';
import {Sheets, Skeleton} from './chars/Sheets';
import {Jack} from './chars/Jack';
import {Bat, Nibbles} from './chars/Nibbles';
import {Mom} from './chars/Mom';
import {Cam} from './kit';
import {Bone, Bucket, CANDY_COLORS, Candy, Flashlight, Heart, Puff, Sparkles, Steam, Tear, Wrapper} from './props';
import {CHEST, CLOSET, Hallway, Nursery, WINDOW} from './sets';

/** Milo's seat on the mattress. */
const MP: V3 = [0.4, 0.72, -1.5];
const at = (d: V3): V3 => [MP[0] + d[0], MP[1] + d[1], MP[2] + d[2]];

const Stage: React.FC<{children: React.ReactNode; exposure?: number}> = ({children, exposure = 1.35}) => {
  const {width, height} = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      gl={{antialias: true, preserveDrawingBuffer: true}}
      onCreated={({gl}) => {
        gl.toneMappingExposure = exposure;
      }}
    >
      {children}
    </ThreeCanvas>
  );
};

const armMix = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k), y: lerp(a.y ?? 0, b.y ?? 0, k)});
const blink = (t: number, at0: number) => pulse(t, at0, at0 + 0.08, at0 + 0.14, at0 + 0.24);
const suckAt = (t: number) => clamp01(Math.sin(t * 7) * 2 - 1.2);

/* 1 — Milo guards his candy (6s) */
export const Shot01: React.FC = () => {
  const t = useT();
  const k = ramp(t, 0, 6, (x) => x);
  return (
    <Stage>
      <Cam pos={mix3([0.5, 2.1, 6.6], [0.45, 1.65, 2.3], easeOut(k))} target={[0.4, 1.25, -1.6]} fov={40} />
      <Nursery>
        <Milo p={MP} armL={ARMS.crossed} armR={ARMS.crossed} close={0.42 + blink(t, 3.1) * 0.58} suck={suckAt(t)} look={[Math.sin(t * 0.8) * 0.3, 0]} />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 2 — Suspicious side-eye close-up (5s) */
export const Shot02: React.FC = () => {
  const t = useT();
  const lx = -ramp(t, 0.7, 1.1) + ramp(t, 1.9, 2.4) * 2 - ramp(t, 3.1, 3.5);
  const narrow = ramp(t, 3.7, 4.2);
  return (
    <Stage>
      <Cam pos={mix3([0.4, 1.62, -0.25], [0.4, 1.6, -0.45], ramp(t, 0, 5, (x) => x))} target={[0.4, 1.55, -1.5]} fov={30} />
      <Nursery>
        <Milo p={MP} armL={ARMS.crossed} armR={ARMS.crossed} look={[lx, -0.1]} close={0.42 + narrow * 0.2} brow={1 + narrow * 0.4} suck={pulse(t, 1.45, 1.55, 1.6, 1.75) + pulse(t, 1.8, 1.9, 1.95, 2.1)} />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 3 — A hairy claw reaches through the window (6s) */
export const Shot03: React.FC = () => {
  const t = useT();
  const reach = ramp(t, 1.6, 5.6) * 1.3;
  return (
    <Stage>
      <Cam pos={mix3([-1.5, 1.6, -0.5], [-1.6, 1.7, -0.9], ramp(t, 0, 6, (x) => x))} target={[-1.6, 1.9, -4]} fov={46} />
      <Nursery windowOpen={ramp(t, 0.3, 1.4, easeOut) * 0.75}>
        <Woofle p={[-2.3, 0.05, -5.05]} rot={[0, 0.25, 0]} headRot={[0.15, 0, Math.sin(t * 1.4) * 0.08]} mouth={0.15 + ramp(t, 2.4, 3.0) * 0.5} />
        <ClawArm p={[-2.1, 1.9, -4.4]} rot={[0.1, 0.95, 0]} reach={reach} wiggle={t} />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
        <Milo p={MP} armL={ARMS.crossed} armR={ARMS.crossed} look={[-1, 0]} />
      </Nursery>
    </Stage>
  );
};

const WOOF_POS: V3 = [-1.6, 0, -1.05];

/* 4 — Woofle snarls, Milo is unimpressed (6s) */
export const Shot04: React.FC = () => {
  const t = useT();
  const snarl = ramp(t, 0.4, 1.0) * (0.75 + Math.sin(t * 9) * 0.12);
  const lift = ramp(t, 3.0, 3.8, outBack);
  return (
    <Stage>
      <Cam pos={mix3([1.6, 1.75, 2.0], [1.3, 1.7, 1.6], ramp(t, 0, 6, (x) => x))} target={[-0.45, 1.55, -1.3]} fov={40} />
      <Nursery windowOpen={0.75}>
        <Woofle p={WOOF_POS} rot={[0, 1.25, 0]} lean={0.15 + snarl * 0.15} mouth={snarl} headRot={[0.1, 0, noise(t, 1) * 0.08 * snarl]} armL={[-1.0 - snarl * 0.3, 0, 0.7]} armR={[-1.0 - snarl * 0.3, 0, -0.7]} />
        <Milo
          p={MP}
          headTilt={[0, -0.45, 0]}
          look={[-0.6, 0.1]}
          close={0.5}
          armR={ARMS.crossed}
          armL={armMix(ARMS.crossed, {x: -1.45, z: 0.35}, lift)}
          holdL={lift > 0.05 ? <Bone p={[0, -0.05, 0.04]} rot={[0, 0, Math.PI / 2]} s={lift} /> : null}
        />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 5 — Squeak, toss… fetch! (6s) */
export const Shot05: React.FC = () => {
  const t = useT();
  const squash = pulse(t, 0.4, 0.5, 0.55, 0.7);
  const thrown = t > 1.2;
  const fly = ramp(t, 1.2, 2.2, (x) => x);
  const bonePos: V3 = [lerp(MP[0] - 0.35, WINDOW[0] + 0.1, fly), lerp(1.35, 2.3, fly) + Math.sin(fly * Math.PI) * 0.9, lerp(MP[2] + 0.25, WINDOW[2] - 0.6, fly)];
  const puppy = ramp(t, 0.6, 1.2);
  const leap = ramp(t, 3.4, 4.6, easeIn);
  const wpos: V3 = [lerp(WOOF_POS[0], WINDOW[0], leap), Math.sin(leap * Math.PI) * 1.4 + leap * 0.9, lerp(WOOF_POS[2], WINDOW[2] - 0.4, leap)];
  const armL = thrown ? armMix({x: -2.4, z: 0.5}, ARMS.crossed, ramp(t, 1.5, 2.3)) : armMix({x: -1.45, z: 0.35}, {x: -2.4, z: 0.5}, ramp(t, 0.9, 1.2));
  return (
    <Stage>
      <Cam pos={[1.5, 1.8, 1.9]} target={mix3([-0.45, 1.55, -1.3], [-1.3, 1.8, -2.6], ramp(t, 1.2, 4.2))} fov={44} />
      <Nursery windowOpen={0.75}>
        {leap < 0.98 && (
          <Woofle
            p={wpos}
            s={1 - leap * 0.55}
            rot={[0, lerp(1.25, Math.PI + 0.4, ramp(t, 2.9, 3.5)), 0]}
            puppy={puppy}
            mouth={0.35 * puppy}
            wag={t * 3.5 * puppy}
            headRot={[lerp(0.1, -0.35, fly), lerp(0, -0.4, fly), Math.sin(t * 5) * 0.12 * puppy]}
            armL={[-0.6 - leap * 1.6, 0, 0.5]}
            armR={[-0.6 - leap * 1.6, 0, -0.5]}
          />
        )}
        <Milo p={MP} headTilt={[0, -0.45, 0]} look={[-0.6, 0.1]} close={0.5} armR={ARMS.crossed} armL={armL} holdL={!thrown ? <Bone p={[0, -0.05, 0.04]} rot={[0, 0, Math.PI / 2]} squash={squash} /> : null} />
        {thrown && fly < 1 && <Bone p={bonePos} rot={[t * 9, t * 5, 0]} />}
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 6 — The bedsheet ghost floats out of the closet (6s) */
export const Shot06: React.FC = () => {
  const t = useT();
  const k = ramp(t, 0.6, 5.6, (x) => x);
  const gp: V3 = [lerp(CLOSET[0] - 0.3, 1.85, easeOut(k)), 0.15 + Math.sin(t * 2.2) * 0.08, lerp(CLOSET[2], -1.25, easeOut(k))];
  return (
    <Stage>
      <Cam pos={[-0.7, 1.75, 1.2]} target={mix3([3.6, 1.3, -2.1], [2.0, 1.25, -1.5], ramp(t, 1, 6))} fov={44} />
      <Nursery windowOpen={0.75} closetOpen={lerp(0.25, 0.9, ramp(t, 0, 0.9))}>
        <Sheets p={gp} rot={[0, -1.35 + Math.sin(t) * 0.1, Math.sin(t * 2.2) * 0.05]} t={t} arms={0.8 + Math.sin(t * 3) * 0.15} opacity={0.97 * ramp(t, 0.2, 1.0)} />
        <Milo p={MP} headTilt={[0, 0.5, 0]} look={[0.7, 0]} armL={ARMS.crossed} armR={ARMS.crossed} />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 7 — Sheet yanked: an embarrassed tiny skeleton (6s) */
export const Shot07: React.FC = () => {
  const t = useT();
  const yank = ramp(t, 0.5, 1.3, easeOut);
  const shame = ramp(t, 1.0, 1.4);
  const flee = ramp(t, 3.2, 5.4, easeIn);
  const g: V3 = [1.85, 0.15, -1.25];
  return (
    <Stage>
      <Cam pos={[0.9, 1.55, 1.6]} target={[1.25, 1.25, -1.35]} fov={40} />
      <Nursery windowOpen={0.75} closetOpen={0.9}>
        {yank < 1 && (
          <Sheets p={[g[0] + yank * 0.4, g[1] + yank * 1.8, g[2] - yank * 0.3]} rot={[yank * 1.2, -1.35, yank * 2]} t={t} arms={0.9} opacity={0.97 * (1 - yank)} />
        )}
        {t > 0.7 && (
          <Skeleton
            p={[lerp(g[0], 4.6, flee) + noise(t, 3) * 0.01 * (1 - flee), Math.abs(Math.sin(t * 12)) * 0.05 * flee, lerp(g[2], -0.2, flee)]}
            rot={[0, lerp(-1.35, 1.6, ramp(t, 2.9, 3.3)), 0]}
            s={1.2}
            cover={shame}
            blush={shame}
            run={flee > 0 ? t * 3 : 0}
          />
        )}
        <Milo
          p={MP}
          headTilt={[0, 0.55, 0]}
          look={[0.8, 0]}
          close={0.45}
          armL={ARMS.crossed}
          armR={t < 0.5 ? armMix(ARMS.crossed, {x: -1.4, z: 0.7}, ramp(t, 0, 0.5)) : armMix({x: -2.4, z: 0.9}, ARMS.crossed, ramp(t, 1.4, 2.2))}
        />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 8 — Jack rises behind the toy shelf (6s) */
export const Shot08: React.FC = () => {
  const t = useT();
  const rise = ramp(t, 0.2, 2.2, easeOut);
  const laugh = pulse(t, 2.4, 2.6, 4.6, 5.0);
  return (
    <Stage>
      <Cam pos={mix3([1.7, 1.05, -0.2], [1.85, 1.0, -0.7], ramp(t, 0, 6, (x) => x))} target={[3.0, 1.9, -3.7]} fov={42} />
      <Nursery windowOpen={0.75} closetOpen={0.9}>
        <Jack
          p={[3.0, lerp(-2.0, 0, rise), -3.8]}
          rot={[0, -0.35, 0]}
          flame={0.4 + ramp(t, 1.0, 1.5) * 1.2 + Math.sin(t * 20) * 0.1}
          headRot={[0.15 + Math.sin(t * 14) * 0.06 * laugh, 0, Math.sin(t * 3) * 0.15 * laugh]}
          armL={[-0.4 - laugh * 0.5, 0, 0.9 + laugh * 0.3]}
          armR={[-0.4 - laugh * 0.5, 0, -0.9 - laugh * 0.3]}
        />
      </Nursery>
    </Stage>
  );
};

/* 9 — A sour candy for Jack (6s) */
export const Shot09: React.FC = () => {
  const t = useT();
  const give = ramp(t, 0.0, 0.6, outBack);
  const eat = ramp(t, 0.8, 1.2);
  const pucker = ramp(t, 1.4, 1.8, outBack);
  const run = ramp(t, 4.0, 6.0, easeIn);
  const jp: V3 = [lerp(1.75, 4.8, run), 0, lerp(-1.3, 0.2, run)];
  const head: V3 = [jp[0] - 0.42 * (1 - run), 1.9 - 0.25 * (1 - run), jp[2]];
  const candyPos = mix3(at([0.42, 0.52, 0.32]), [head[0] - 0.05, head[1] - 0.15, head[2] + 0.2], eat);
  return (
    <Stage>
      <Cam pos={[0.75, 1.6, 1.55]} target={mix3([1.05, 1.45, -1.4], [2.2, 1.5, -1.0], ramp(t, 4.0, 5.5))} fov={42} />
      <Nursery windowOpen={0.75} closetOpen={0.9}>
        <Jack
          p={jp}
          rot={[0, lerp(-1.25, 1.3, ramp(t, 3.8, 4.3)), 0]}
          lean={0.45 * (1 - run)}
          pucker={pucker}
          flame={1 - pucker * 0.4}
          headRot={[0.2 * (1 - run), 0, noise(t, 5) * 0.15 * pucker]}
          armL={run > 0 ? [Math.sin(t * 14) * 1.2 - 1.5, 0, 0.8] : [-0.3, 0, 0.6]}
          armR={run > 0 ? [Math.cos(t * 14) * 1.2 - 1.5, 0, -0.8] : [-0.3, 0, -0.6]}
          run={run > 0 ? t * 3 : 0}
        />
        {eat < 1 && <Candy p={candyPos} s={1.4 * give} c="#2fd38a" />}
        {pucker > 0.5 && t < 3.6 &&
          [-1, 1].map((d) => <Tear key={d} p={[head[0] + 0.2, head[1] - ((t * 0.9) % 0.5) + 0.05, head[2] + 0.13 * d]} s={1.3} />)}
        <Steam p={[head[0], head[1] + 0.35, head[2]]} t={t} amount={pulse(t, 2.5, 2.8, 4.2, 4.8)} />
        <Milo p={MP} headTilt={[0, 0.55, 0]} look={[0.8, 0.3]} close={0.45} armL={ARMS.crossed} armR={armMix({x: -1.5, z: -0.1}, ARMS.crossed, ramp(t, 1.4, 2.2))} />
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* 10 — Count Nibbles rises from the toy chest (6s) */
export const Shot10: React.FC = () => {
  const t = useT();
  const lid = ramp(t, 0.15, 0.9, outBack);
  const rise = ramp(t, 1.0, 2.6, easeOut);
  return (
    <Stage>
      <Cam pos={mix3([-1.2, 1.2, 1.4], [-1.5, 1.05, 1.0], ramp(t, 0, 6, (x) => x))} target={[CHEST[0], 1.1, CHEST[2]]} fov={42} />
      <Nursery windowOpen={0.75} closetOpen={0.9} chestLid={lid * 0.85} chestGlow={lid}>
        <Nibbles p={[CHEST[0], lerp(-0.8, 0.55, rise), CHEST[2]]} rot={[0, 0.7, 0]} cape={ramp(t, 2.3, 3.0, outBack)} mouth={ramp(t, 3.4, 3.7) * (0.8 + Math.sin(t * 25) * 0.1)} armL={[-0.6 * rise, 0, 0.6]} armR={[-0.6 * rise, 0, -0.6]} />
        <Puff p={[CHEST[0], 0.9, CHEST[2]]} k={ramp(t, 0.5, 2.2, (x) => x)} s={0.8} c="#5b2a46" />
      </Nursery>
    </Stage>
  );
};

/* 11 — Flashlight! Poof… bonk (6s) */
export const Shot11: React.FC = () => {
  const t = useT();
  const on = ramp(t, 0.4, 0.5);
  const fright = ramp(t, 0.5, 0.8);
  const spin = ramp(t, 1.0, 2.9, easeIn);
  const NP: V3 = [-1.55, 0, 0.25];
  const bat = ramp(t, 3.0, 4.5, (x) => x);
  const wall: V3 = [-4.85, 1.9, -0.4];
  const fall = ramp(t, 4.5, 5.2, easeIn);
  const batPos: V3 =
    t < 4.5
      ? [lerp(NP[0], wall[0], bat) + Math.sin(bat * 14) * 0.15, lerp(0.9, wall[1], bat) + Math.sin(bat * 20) * 0.2, lerp(NP[2], wall[2], bat)]
      : [wall[0] + 0.15, lerp(wall[1], 0.12, fall), wall[2]];
  return (
    <Stage>
      <Cam pos={[-0.2, 1.75, 3.0]} target={mix3([-1.0, 1.15, -0.8], [-2.6, 1.2, -0.6], ramp(t, 2.6, 4.2))} fov={46} />
      <Nursery windowOpen={0.75} closetOpen={0.9} chestLid={0.85}>
        <Milo
          p={MP}
          rot={[0, -0.85, 0]}
          close={0.5}
          look={[0, -0.2]}
          armR={ARMS.crossed}
          armL={{x: -1.25, z: 0.05}}
          holdL={<Flashlight p={[0, -0.02, 0]} rot={[Math.PI / 2, 0, 0]} s={1.1} on={on} />}
        />
        {t < 3.0 && (
          <Nibbles
            p={[NP[0] + noise(t, 2) * 0.03 * fright, NP[1] + spin * 0.5, NP[2]]}
            rot={[0, 2.35 + spin * Math.PI * 6, 0]}
            s={1 - spin * 0.6}
            fright={fright}
            mouth={fright}
            cape={0.9 - spin * 0.6}
            armL={[-2.4 * fright, 0, 0.6]}
            armR={[-2.4 * fright, 0, -0.6]}
          />
        )}
        <Puff p={[NP[0], 0.9, NP[2]]} k={ramp(t, 2.9, 3.8, (x) => x)} s={1.1} c="#3b3250" />
        {t >= 3.0 && <Bat p={batPos} rot={[0, t < 4.5 ? -1.4 : 0, t >= 4.5 ? Math.PI * fall : 0]} s={1.2} flap={t < 4.5 ? t * 7 : 0} dizzy={t > 4.5 ? t : 0} />}
        <Bucket p={at([0.58, 0, 0.12])} s={0.9} />
      </Nursery>
    </Stage>
  );
};

/* Hallway huddle, shared by 12–14. */
const Huddle: React.FC<{t: number; fear: number; joy?: number; candies?: number}> = ({t, fear, joy = 0, candies = 0}) => {
  const sh = (seed: number) => noise(t * 2.5, seed) * 0.035 * fear;
  const candy = (i: number) => ramp(candies, i, i + 1);
  return (
    <>
      <Woofle p={[1.0 + sh(1), 0, -0.6]} rot={[0, Math.PI - 0.35, 0]} s={0.88} puppy={0.85 + joy * 0.15} mouth={0.15} lean={-0.1 * fear} armL={[-0.9 * fear - joy * 0.5, 0, 0.9]} armR={[-0.9 * fear - joy * 0.5, 0, -0.9]} wag={joy * t * 3} />
      <Skeleton p={[0.15 + sh(2), 0, -1.2]} rot={[0, Math.PI + 0.2, 0]} s={1.25} cover={fear} blush={0.5 + joy * 0.5} />
      <Jack p={[-0.55 + sh(3), 0, -0.55]} rot={[0, Math.PI + 0.45, 0]} s={0.85} flame={0.35 + joy * 0.6} pucker={fear * 0.6} armL={[-1.2 * fear, 0, 1.0]} armR={[-1.2 * fear, 0, -0.9]} />
      <Bat p={[0.45 + sh(4), 2.05 + Math.sin(t * 3) * 0.05, -0.95]} rot={[0, Math.PI, 0]} s={1.1} flap={t * 5} />
      <Sparkles p={[0.3, 1.6, -0.9]} t={t} amount={joy} spread={1.1} />
      {joy > 0 && [0, 1, 2].map((i) => <Heart key={i} p={[-0.4 + i * 0.7, 2.2 + ((t * 0.4 + i * 0.3) % 1) * 0.7, -0.9]} s={0.8 + joy * 0.4} o={joy * (1 - ((t * 0.4 + i * 0.3) % 1))} />)}
      {[[1.0, 1.75, -0.95], [0.15, 1.25, -1.45], [-0.55, 1.6, -0.95], [0.45, 2.05, -1.15]].map((pp, i) =>
        candy(i) > 0 ? <Candy key={i} p={mix3([0.35, 0.9, -2.2], pp as V3, candy(i))} s={1.6} c={CANDY_COLORS[i]} /> : null,
      )}
    </>
  );
};

/* 12 — Four monsters hiding in the hallway (6s) */
export const Shot12: React.FC = () => {
  const t = useT();
  return (
    <Stage exposure={1.5}>
      <Cam pos={mix3([-0.55, 1.45, -4.2], [-0.45, 1.4, -3.6], ramp(t, 0, 6, (x) => x))} target={[0.35, 1.25, -0.8]} fov={46} />
      <Hallway>
        <Huddle t={t} fear={1} />
      </Hallway>
    </Stage>
  );
};

/* 13 — Milo appears in the doorway (6s) */
export const Shot13: React.FC = () => {
  const t = useT();
  const walk = ramp(t, 0.8, 5.6, (x) => x);
  return (
    <Stage exposure={1.5}>
      <Cam pos={mix3([-0.22, 0.55, 0.9], [-0.22, 0.5, 0.5], ramp(t, 0, 6, (x) => x))} target={[-0.18, 1.0, -5.0]} fov={40} />
      <Hallway>
        <Huddle t={t} fear={1 + ramp(t, 2.0, 2.4) * 0.5} />
        <Milo p={[-0.18, 0, lerp(-5.75, -3.4, walk)]} standing walk={t > 0.8 && t < 5.6 ? t * 1.6 : 0} close={0.5} brow={1.3} armL={ARMS.down} armR={{x: 0.25, z: 0.2}} holdR={<Bucket p={[0, -0.2, 0.05]} s={0.55} />} />
      </Hallway>
    </Stage>
  );
};

/* 14 — The twist: Milo shares (7s) */
export const Shot14: React.FC = () => {
  const t = useT();
  const offer = ramp(t, 0.4, 1.2, outBack);
  const joy = ramp(t, 1.4, 2.0);
  return (
    <Stage exposure={1.5}>
      <Cam pos={mix3([-0.95, 1.4, -3.8], [-0.85, 1.35, -3.4], ramp(t, 0, 7, (x) => x))} target={[0.4, 1.35, -0.9]} fov={50} />
      <Hallway>
        <Huddle t={t} fear={1 - joy} joy={joy} candies={ramp(t, 2.0, 5.2, (x) => x) * 4} />
        <Milo p={[0.35, 0, -2.45]} rot={[0, 0.0, 0]} standing close={0.48} brow={0.8} armL={armMix(ARMS.down, ARMS.forward, offer)} armR={armMix(ARMS.down, ARMS.forward, offer)} />
        <Bucket p={[0.35, lerp(0.15, 0.4, offer), lerp(-2.4, -2.05, offer)]} s={0.65} />
      </Hallway>
    </Stage>
  );
};

/* Morning crib pile, shared by 15–16. */
const SleepPile: React.FC<{t: number; miloClose?: number; miloCloseL?: number; shh?: number}> = ({t, miloClose = 1, miloCloseL, shh = 0}) => {
  const breathe = (seed: number) => 1 + Math.sin(t * 2.2 + seed) * 0.015;
  return (
    <>
      <Woofle p={[MP[0] - 0.65, MP[1] + 0.05, MP[2] - 0.25]} rot={[-1.25, 0.5, 0.15]} s={0.62 * breathe(0)} pajama sleep={1} />
      <Jack p={[MP[0] + 0.85, MP[1] + 0.08, MP[2] + 0.4]} rot={[-Math.PI / 2, 0, -0.9]} s={0.55 * breathe(1)} pajama sleep />
      <Skeleton p={[MP[0] + 0.55, MP[1] + 0.06, MP[2] - 0.15]} rot={[-1.2, -0.3, 0]} s={0.95 * breathe(2)} pajama sleep />
      <Bat p={[MP[0] - 0.2, 1.38, MP[2] - 0.72]} rot={[0, 0, Math.PI]} s={1.2} flap={0} />
      <Milo p={MP} close={miloClose} closeL={miloCloseL} brow={0.9} armL={ARMS.down} armR={armMix(ARMS.down, ARMS.shh, shh)} shh={shh} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Wrapper key={i} i={i} p={[lerp(-1.2, 2.6, (i * 0.37) % 1), 0.012, lerp(-0.6, 1.4, (i * 0.61) % 1)]} />
      ))}
      <Bucket p={[1.9, 0, -0.5]} rot={[0, 0, 1.4]} s={0.9} fill={0} />
    </>
  );
};

/* 15 — Morning: Mom finds the sleepover (7s) */
export const Shot15: React.FC = () => {
  const t = useT();
  const door = ramp(t, 0.3, 1.1, easeOut) * 0.85;
  const shock = ramp(t, 1.3, 1.6, outBack);
  return (
    <Stage exposure={1.15}>
      <Cam pos={mix3([-0.9, 2.1, 3.2], [-0.6, 2.0, 2.8], ramp(t, 0, 7, (x) => x))} target={[2.1, 1.05, -0.7]} fov={52} />
      <Nursery morning roomDoor={door} closetOpen={0.25} windowOpen={0.75}>
        <SleepPile t={t} />
        <Mom p={[4.55, 0, 0.6]} rot={[0, -Math.PI / 2 - 0.25, 0]} shock={shock} armL={[-1.8 * shock, 0, 0.5]} armR={[-1.8 * shock, 0, -0.5]} />
      </Nursery>
    </Stage>
  );
};

/* 16 — "Shh." (6s) */
export const Shot16: React.FC = () => {
  const t = useT();
  return (
    <Stage exposure={1.15}>
      <Cam pos={mix3([0.45, 1.62, -0.25], [0.42, 1.6, -0.45], ramp(t, 0, 6, (x) => x))} target={[0.4, 1.5, -1.5]} fov={36} />
      <Nursery morning roomDoor={0.85} windowOpen={0.75}>
        <SleepPile t={t} miloCloseL={lerp(1, 0.4, ramp(t, 0.9, 1.2))} shh={ramp(t, 1.4, 2.0, outBack)} />
      </Nursery>
    </Stage>
  );
};

export const SHOTS: React.FC[] = [Shot01, Shot02, Shot03, Shot04, Shot05, Shot06, Shot07, Shot08, Shot09, Shot10, Shot11, Shot12, Shot13, Shot14, Shot15, Shot16];
