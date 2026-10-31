import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {useVideoConfig} from 'remotion';
import {V3, clamp01, easeIn, easeOut, lerp, noise, outBack, pulse, ramp} from './anim';
import {ARMS, ArmPose, Milo} from './chars/Milo';
import {Woofle} from './chars/Woofle';
import {Sheets, Skeleton} from './chars/Sheets';
import {Jack} from './chars/Jack';
import {Nibbles} from './chars/Nibbles';
import {Mom} from './chars/Mom';
import {CamTable, SceneProps, cutStarts, resolveCam} from './edit';
import {Cam} from './kit';
import {
  Bowl, Duck, Heart, HighChair, Pajamas, Puff, SheetMusic, SkeletonArm, SnoreBubble, SoundRings, Sparkles, Splatter, Spoon, Stars, Steam, Tear, Teddy,
} from './props';
import {Bathroom, CHEST, Hallway, Nursery, TUB} from './sets';

const MP: V3 = [0.4, 0.72, -1.5];
const PJ = '#5b7fe0';
const MOM_TOP = '#d94f70';

const armMix = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k), y: lerp(a.y ?? 0, b.y ?? 0, k)});
const blink = (t: number, at: number) => pulse(t, at, at + 0.07, at + 0.12, at + 0.22);
const v3mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** Ballistic hop between two points with a peak height. */
const hop = (a: V3, b: V3, k: number, h: number): V3 => {
  const p = v3mix(a, b, k);
  return [p[0], p[1] + Math.sin(k * Math.PI) * h, p[2]];
};

const View: React.FC<{cams: CamTable; p: SceneProps; exposure?: number; keyLight?: V3; children: React.ReactNode}> = ({cams, p, exposure = 1.35, keyLight, children}) => {
  const {width, height} = useVideoConfig();
  const c = resolveCam(cams, p.cam, p.t, p.k);
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
      <Cam pos={c.pos} target={c.target} fov={c.fov} />
      {keyLight && <pointLight position={keyLight} intensity={6} distance={7} decay={1.5} color="#ffd9b8" />}
      {children}
    </ThreeCanvas>
  );
};

/* ================================================================ 1. leave */
const LV = cutStarts('leave');
const Leave: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = LV;
  const wave = Math.sin(t * 10) * 0.35;
  const kiss = pulse(t, c[1] + 0.05, c[1] + 0.3, c[1] + 0.55, c[1] + 0.95);
  const turn = ramp(t, c[2], c[2] + 0.35) * Math.PI;
  const exit = ramp(t, c[2] + 0.15, c[2] + 1.0, easeIn);
  const z = lerp(-4.7, -6.4, exit);
  const door = 1 - ramp(t, c[2] + 0.75, c[2] + 1.3, easeIn);
  const cams: CamTable = {
    hallWide: {pos: [0.1, 1.65, -0.8], target: [0, 1.5, -5], fov: 40, to: {pos: [0.1, 1.65, -1.7]}},
    momCU: {pos: [-0.35, 1.86, -3.3], target: [-0.32, 1.84, -4.7], fov: 28, to: {pos: [-0.35, 1.86, -3.45]}},
    doorWide: {pos: [0.4, 1.5, -1.2], target: [0, 1.3, -5.3], fov: 42},
  };
  return (
    <View cams={cams} p={p} exposure={1.5} keyLight={[0.2, 2.4, -3.4]}>
      <Hallway endDoor={door} outside="#22315f">
        <Mom p={[-0.32, 0, z]} rot={[0, turn, 0]} top={MOM_TOP} walk={exit > 0 ? t * 1.8 : 0}
          armR={kiss > 0 ? [lerp(-1.4, -2.3, kiss), 0, lerp(-0.2, -0.75, kiss)] : [-1.3 + wave * 0.2, 0, -0.2]} armL={[0, 0, 0.15]} />
        <Mom dad s={1.05} p={[0.38, 0, z - 0.05]} rot={[0, turn, 0]} walk={exit > 0 ? t * 1.8 + 0.5 : 0} armR={[-2.7 + wave, 0, 0.45]} />
      </Hallway>
    </View>
  );
};

/* ================================================================ 2. reveal */
const RV = cutStarts('reveal');
const Reveal: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = RV;
  const jump = ramp(t, c[5], c[5] + 0.55, easeOut);
  const tada = ramp(t, c[5] + 0.45, c[5] + 0.75, outBack);
  const hidW: V3 = [-2.3, lerp(-1.6, 0.05, ramp(t, c[3], c[3] + 0.35, outBack)), -5.05];
  const hidJ: V3 = [3.0, lerp(-1.8, -0.5, ramp(t, c[4], c[4] + 0.4, outBack)), -3.8];
  const hidN: V3 = [CHEST[0], lerp(-0.75, -0.42, ramp(t, c[1] + 0.2, c[1] + 0.7)), CHEST[2]];
  const hidS: V3 = [4.55 - ramp(t, c[2] + 0.2, c[2] + 0.8) * 0.35, 0.1, -2.55];
  const cams: CamTable = {
    miloCU: {pos: [0.42, 1.62, -0.3], target: [0.4, 1.55, -1.5], fov: 30, to: {pos: [0.42, 1.6, -0.45]}},
    chest: {pos: [-1.75, 1.05, 0.55], target: [CHEST[0], 0.7, CHEST[2]], fov: 32, to: {pos: [-1.9, 1.0, 0.3]}},
    closet: {pos: [2.5, 1.45, -0.6], target: [4.7, 1.25, -2.4], fov: 34, to: {pos: [2.7, 1.45, -0.8]}},
    window: {pos: [-1.4, 1.85, -1.4], target: [-2.3, 2.2, -4], fov: 36},
    shelf: {pos: [1.9, 1.35, -1.3], target: [3.0, 1.7, -3.6], fov: 34},
    wide: (tt) => ({pos: [0.4, 2.3, 5.6], target: [0.4, 1.25, -0.8], fov: 44, to: {pos: [0.4, 2.1, 4.6]}, shake: pulse(tt, c[5] + 0.45, c[5] + 0.5, c[5] + 0.6, c[5] + 0.9) * 0.05}),
  };
  const up = tada;
  return (
    <View cams={cams} p={p}>
      <Nursery windowOpen={0.4} chestLid={ramp(t, c[1], c[1] + 0.4) * 0.45} closetOpen={lerp(0.25, 0.7, ramp(t, c[2], c[2] + 0.4))}>
        <Milo p={MP} armL={ARMS.crossed} armR={ARMS.crossed} look={t < c[1] ? [Math.sin(t * 4) * 0.8, 0] : [0, 0]} raiseR={ramp(t, c[6] + 0.4, c[6] + 0.7, outBack)} close={0.45 + blink(t, c[6] + 1.0) * 0.55} />
        <Woofle p={hop(hidW, [-1.75, 0, -0.15], jump, 1.2)} rot={[0, lerp(0.25, 0, jump), 0]} s={0.9} mouth={0.2 + up * 0.4} puppy={0.3} armL={[lerp(0.2, -2.6, up), 0, 0.5]} armR={[lerp(0.2, -2.6, up), 0, -0.5]} wag={t * 3} />
        <Sheets p={hop(hidS, [-0.55, 0.15, 0.35], jump, 1.0)} rot={[0, lerp(-Math.PI / 2, 0, jump), 0]} t={t} arms={lerp(0.6, 1.1, up)} />
        <Jack p={hop(hidJ, [1.6, 0, 0.1], jump, 1.0)} rot={[0, lerp(-0.35, -0.1, jump), 0]} s={0.92} flame={1 + up * 0.6} armL={[lerp(0, -2.5, up), 0, 0.6]} armR={[lerp(0, -2.5, up), 0, -0.6]} />
        <Nibbles p={hop(hidN, [2.6, 0, 0.35], jump, 1.3)} rot={[0, lerp(0.7, -0.2, jump), 0]} cape={up} mouth={up * 0.6} armL={[lerp(0, -2.4, up), 0, 0.5]} armR={[lerp(0, -2.4, up), 0, -0.5]} />
        <Sparkles p={[0.4, 2.2, 0]} t={t} amount={pulse(t, c[5] + 0.5, c[5] + 0.7, c[6] - 0.3, c[6])} spread={2.4} />
      </Nursery>
    </View>
  );
};

/* ================================================================ 3. feed */
const FD = cutStarts('feed');
const MILO_HC: V3 = [1.7, 0.88, 0.3];
const BOWL_TRAY: V3 = [1.6, 1.1, 0.72];
const Feed: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = FD;
  const swoop = (t - c[3]) * 5;
  const lean = ramp(t, c[10], c[10] + 0.4) * 0.35;
  const wx = lerp(0.45, 0.72, ramp(t, c[10], c[10] + 0.4));
  const bonkT = c[10] + 0.7;
  const bonk = ramp(t, bonkT - 0.12, bonkT);
  const gulpOpen = pulse(t, c[6] + 0.1, c[6] + 0.25, c[6] + 0.35, c[6] + 0.5);
  const gobble = ramp(t, c[8], c[8] + 0.45, easeOut);
  const mouthPos: V3 = [1.15, 2.08, 0.55];
  let bowlPos: V3 = BOWL_TRAY;
  let bowlRot: V3 = [0, 0, 0];
  if (t >= c[8] && t < c[9]) {
    bowlPos = v3mix(BOWL_TRAY, [1.05, 2.45, 0.55], gobble);
    bowlRot = [0, 0, gobble * 2.2];
  } else if (t >= c[9] && t < c[10]) {
    bowlPos = [1.22 + Math.sin(t * 14) * 0.02, 2.02, 0.55];
    bowlRot = [0, 0, Math.PI / 2];
  } else if (t >= c[10]) {
    bowlPos = [0.9, 0.02, 1.4];
    bowlRot = [0, 0.5, Math.PI];
  }
  const fill = t < c[8] + 0.5 ? 1 : 1 - ramp(t, c[8] + 0.5, c[8] + 1.6);
  const puppy = Math.max(ramp(t, c[5], c[5] + 0.5) * 0.8, ramp(t, c[9], c[9] + 0.2), t > c[11] ? 1 : 0) * (t > c[6] + 0.6 && t < c[8] ? 0.5 : 1);
  let armR: V3 = [-1.6, 0, -0.2];
  if (t >= c[3] && t < c[5]) armR = [-1.4 + Math.sin(swoop) * 0.7, 0, -0.2 + Math.cos(swoop) * 0.5];
  else if (t >= c[5] && t < c[6] + 0.5) armR = [-2.15, 0, -0.8];
  else if (t >= c[6] + 0.5) armR = [0.1, 0, -0.3];
  const miloArmL: ArmPose =
    t < c[10] ? ARMS.down : t < c[12] ? armMix({x: -2.9, z: 0.3}, {x: -1.6, z: 0.75}, bonk) : ARMS.crossed;
  const cams: CamTable = {
    two: (tt) => ({pos: [1.0, 1.75, 3.6], target: [1.05, 1.6, 0.4], fov: 40, to: {pos: [1.0, 1.7, 3.25]}, shake: pulse(tt, bonkT, bonkT + 0.03, bonkT + 0.1, bonkT + 0.3) * 0.06}),
    bowl: {pos: [1.95, 1.42, 1.45], target: [1.6, 1.12, 0.72], fov: 24, to: {pos: [1.9, 1.38, 1.3]}},
    miloCU: {pos: [1.05, 1.78, 1.45], target: [1.66, 1.7, 0.3], fov: 28, to: {pos: [1.1, 1.77, 1.32]}},
    medium: {pos: [2.5, 2.0, 2.3], target: [1.0, 1.8, 0.45], fov: 38, to: {pos: [2.4, 1.98, 2.1]}},
    wolfCU: {pos: [1.75, 2.05, 1.9], target: [0.85, 1.95, 0.5], fov: 30, to: {pos: [1.7, 2.05, 1.75]}},
    wide: {pos: [1.0, 2.3, 4.8], target: [1.0, 1.5, 0.3], fov: 44},
  };
  return (
    <View cams={cams} p={p} keyLight={[1.6, 2.7, 2.0]}>
      <Nursery windowOpen={0.4} closetOpen={0.7}>
        <HighChair p={[1.7, 0, 0.35]} rot={[0, -0.35, 0]} />
        <Milo
          p={MILO_HC}
          rot={[0, -0.35, 0]}
          close={t >= c[2] && t < c[3] ? 0.62 : t >= c[12] ? 0.5 : 0.45 + blink(t, c[7] + 0.4) * 0.55}
          brow={t >= c[2] && t < c[3] ? 1.4 : 1}
          look={t >= c[2] && t < c[3] ? [0, -0.6] : t >= c[3] && t < c[5] ? [Math.sin(swoop) * 0.9, Math.cos(swoop) * 0.3] : t >= c[12] ? [0.8, 0.2] : [-0.6, 0.15]}
          headTilt={t >= c[12] ? [0, 0.4, 0] : [0, -0.25, 0]}
          armL={miloArmL}
          armR={t >= c[12] ? ARMS.crossed : ARMS.down}
          holdL={t >= c[10] && t < c[12] ? <Spoon p={[0, -0.02, 0.02]} rot={[Math.PI, 0, 0]} mush={false} s={1.1} /> : null}
        />
        <Woofle
          p={[wx, 0, 0.55]}
          rot={[0, Math.PI / 2 - 0.1, 0]}
          s={0.9}
          lean={0.15 + lean}
          puppy={puppy}
          mouth={t < c[3] ? 0.25 : t < c[5] ? 0.35 : t < c[6] + 0.6 ? gulpOpen : t < c[9] ? (t >= c[8] ? 1 : 0.1) : t < c[10] ? 0.55 : 0.1}
          cheeks={pulse(t, c[6] + 0.35, c[6] + 0.5, c[6] + 0.8, c[7]) + (t >= c[8] && t < c[9] ? Math.abs(Math.sin(t * 12)) * 0.7 : 0)}
          headRot={t >= c[8] && t < c[9] ? [-0.55, 0, 0] : t >= c[5] && t < c[6] ? [0.25, 0, 0] : t >= c[11] ? [0.35, 0, 0.18] : [0.05, 0, Math.sin(t * 3) * 0.08]}
          wag={t < c[5] ? t * 3 : 0}
          armL={t >= c[8] && t < c[10] ? [-2.6, 0, 0.4] : [0.15, 0, 0.35]}
          armR={armR}
          holdR={t < c[6] + 0.5 ? <Spoon p={[0, -0.05, 0.08]} rot={[Math.PI, 0, 0]} s={1.6} mush={t < c[6] + 0.3} /> : null}
        />
        <Bowl p={bowlPos} rot={bowlRot} fill={fill} s={t >= c[8] && t < c[10] ? 1.4 : 1} />
        <Steam p={[BOWL_TRAY[0], BOWL_TRAY[1] + 0.1, BOWL_TRAY[2]]} t={t} amount={t < c[3] ? 0.35 : 0} />
        <Splatter p={mouthPos} k={ramp(t, c[8] + 0.5, c[8] + 1.4, (x) => x)} />
        <Stars p={[1.2, 2.05, 0.55]} t={t} amount={pulse(t, bonkT, bonkT + 0.1, c[11] - 0.1, c[11])} />
        <Tear p={[1.0, 2.05 - ((t - c[11]) % 0.6) * 0.6, 0.72]} s={t > c[11] + 0.4 && t < c[12] ? 1.4 : 0.001} />
      </Nursery>
    </View>
  );
};

/* ================================================================ 4. bath */
const BT = cutStarts('bath');
const SK_BATH: V3 = [1.15, 0, -0.85];
const Bath: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = BT;
  const dip = ramp(t, c[2] + 0.2, c[3]);
  const shrink = ramp(t, c[4] + 0.1, c[4] + 1.1, easeOut);
  const ghostX = lerp(1.45, 1.15, dip);
  const throwT = c[8] + 0.3;
  const fly = ramp(t, throwT, throwT + 0.6, (x) => x);
  const towelOn = t >= throwT + 0.6;
  const squeak = pulse(t, c[1] + 0.3, c[1] + 0.35, c[1] + 0.4, c[1] + 0.55) + pulse(t, c[6] + 0.5, c[6] + 0.55, c[6] + 0.6, c[6] + 0.75);
  const cams: CamTable = {
    wide: {pos: [2.7, 2.1, 2.7], target: [0.5, 0.9, -1.1], fov: 42, to: {pos: [2.4, 2.0, 2.3]}},
    duck: {pos: [1.0, 1.2, -0.4], target: [0.45, 0.8, -1.15], fov: 30},
    ghost: {pos: [0.1, 1.55, 1.0], target: [0.95, 1.0, -1.0], fov: 38, to: {pos: [0.2, 1.5, 0.8]}},
    water: {pos: [0.25, 1.15, -0.25], target: [0.95, 0.66, -1.0], fov: 30},
    ghostLow: {pos: [2.5, 0.95, 0.9], target: [1.15, 1.0, -0.85], fov: 40},
    skullCU: {pos: [1.75, 1.4, 0.15], target: [1.15, 1.25, -0.85], fov: 28, to: {pos: [1.7, 1.38, 0.0]}},
    miloCU: {pos: [0.55, 1.2, -0.05], target: [0.17, 1.08, -1.3], fov: 30, to: {pos: [0.52, 1.18, -0.2]}},
    skel: {pos: [2.1, 1.25, 0.7], target: [1.15, 0.9, -0.85], fov: 36},
  };
  const sheetPos: V3 = t < c[4] ? [ghostX, 0.15 - dip * 0.15 + Math.sin(t * 2.4) * 0.05, -0.85] : [lerp(ghostX, SK_BATH[0], shrink), lerp(0.0, 1.37, shrink), -0.85];
  return (
    <View cams={cams} p={p} exposure={1.0}>
      <Bathroom>
        <Milo
          p={[TUB[0] + 0.15, 0.22, TUB[2]]}
          rot={[0, 0.5, 0]}
          close={0.45 + blink(t, c[6] + 0.9) * 0.55}
          look={t >= c[4] ? [0.8, 0.2] : [0.6, 0]}
          armL={ARMS.down}
          armR={t >= c[8] ? armMix({x: -2.8, z: 0.3}, {x: -1.4, z: 0.4}, ramp(t, throwT - 0.1, throwT + 0.1)) : {x: -1.2, z: 0.2}}
          holdR={t < c[8] ? <Duck p={[0, 0.02, 0.05]} squash={squeak} /> : null}
        />
        {t < c[4] + 1.15 && (
          <Sheets p={sheetPos} rot={[0, -1.1, 0]} s={t < c[4] ? 1 : lerp(1, 0.18, shrink)} t={t} arms={t < c[4] ? lerp(1, 0.15, dip) : 0.3} />
        )}
        {t >= c[4] + 1.15 && <Sheets p={[SK_BATH[0], 1.37, SK_BATH[2]]} rot={[0, -1.0, 0.15]} s={0.18} t={0} arms={0.3} />}
        {t >= c[4] && (
          <Skeleton
            p={[SK_BATH[0] + (t >= c[7] && t < c[8] ? noise(t * 3, 4) * 0.02 : 0), 0, SK_BATH[2]]}
            rot={[0, -1.0, 0]}
            s={1.3}
            jaw={t < c[7] ? ramp(t, c[5] + 0.2, c[5] + 0.4) : 0}
            blush={ramp(t, c[5], c[5] + 0.5)}
            cover={t >= c[7] && t < c[9] ? ramp(t, c[7], c[7] + 0.3) : t >= c[9] ? 0.3 : 0}
            towel={towelOn}
          />
        )}
        {t >= throwT && !towelOn && (
          <mesh position={hop([0.5, 1.0, -1.15], [1.15, 1.1, -0.85], fly, 0.6)} rotation={[fly * 6, fly * 4, 0]}>
            <boxGeometry args={[0.4, 0.04, 0.3]} />
            <meshStandardMaterial color="#ffb3a7" roughness={1} />
          </mesh>
        )}
        <Splatter p={[1.0, 0.66, -1.0]} k={ramp(t, c[3] + 0.15, c[3] + 1.1, (x) => x)} c="#bfe9ff" n={12} spread={0.6} />
        {t >= c[9] && [0, 1, 2].map((i) => {
          const life = ((t - c[9]) * 0.6 + i * 0.33) % 1;
          return <Heart key={i} p={[SK_BATH[0] - 0.2 + i * 0.2, 1.5 + life * 0.6, SK_BATH[2] + 0.2]} s={0.6} o={1 - life} />;
        })}
      </Bathroom>
    </View>
  );
};

/* ================================================================ 5. pajamas */
const PJS = cutStarts('pjs');
const SK_PJ: V3 = [1.7, 0, -1.35];
const SHOULDER: V3 = [1.7, 1.0, -1.2];
const MILO_HAND: V3 = [0.68, 1.22, -1.32];
const armFlight = (t: number, a: number, b: number): V3 => {
  const k = ramp(t, a, b, (x) => x);
  const ang = k * Math.PI * 2;
  const loop: V3 = [0.6 + Math.cos(ang) * 1.1, 1.8 + Math.sin(ang) * 0.6 + Math.sin(k * Math.PI) * 0.6, -0.9 + Math.sin(ang) * 0.6];
  const blendIn = clamp01(k * 4);
  const blendOut = clamp01((k - 0.8) * 5);
  return v3mix(v3mix(SHOULDER, loop, blendIn), MILO_HAND, blendOut);
};
const Pjs: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = PJS;
  const walkIn = ramp(t, 0, 1.2, easeOut);
  const popT = c[3] + 0.5;
  const catchT = c[4] + 1.4;
  const zipT = c[7] + 0.3;
  const giveT = c[7] + 1.0;
  const reattachT = c[8] + 0.5;
  const spin = ramp(t, c[2], c[2] + 1.2, easeInOutish) * Math.PI * 2;
  const armPos = t < popT ? SHOULDER : t < catchT ? armFlight(t, popT, catchT) : t < giveT ? MILO_HAND : v3mix(MILO_HAND, SHOULDER, ramp(t, giveT, reattachT));
  const cams: CamTable = {
    wide: {pos: [0.9, 2.1, 3.6], target: [1.0, 1.1, -1.4], fov: 42, to: {pos: [0.95, 2.0, 3.2]}},
    miloCU: {pos: [0.55, 1.6, -0.3], target: [0.4, 1.55, -1.5], fov: 30},
    medium: {pos: [1.1, 1.65, 1.4], target: [1.05, 1.25, -1.4], fov: 38, to: {pos: [1.05, 1.62, 1.2]}},
    shoulder: (tt) => ({pos: [0.55, 1.4, -1.75], target: [1.7, 1.0, -1.3], fov: 44, shake: pulse(tt, popT, popT + 0.03, popT + 0.1, popT + 0.4) * 0.04}),
    armFly: (tt) => ({pos: [0.6, 1.7, 2.6], target: armFlight(tt, popT, catchT), fov: 44}),
    skullCU: {pos: [0.85, 1.38, -1.25], target: [1.7, 1.22, -1.35], fov: 32, to: {pos: [0.95, 1.37, -1.27]}},
  };
  const hasArm = t < popT || t >= reattachT;
  return (
    <View cams={cams} p={p}>
      <Nursery windowOpen={0.4} closetOpen={0.7}>
        <Milo
          p={MP}
          rot={[0, spin, 0]}
          onesie={t >= zipT ? PJ : undefined}
          close={t >= c[1] && t < c[2] ? 0.75 : 0.45}
          brow={t >= c[1] && t < c[2] ? 0.5 : 1}
          headTilt={t >= c[1] && t < c[2] ? [0, 0, Math.sin(t * 22) * 0.15] : [0, 0.3, 0]}
          raiseR={t >= c[6] && t < c[7] ? ramp(t, c[6] + 0.3, c[6] + 0.6) : 0}
          armL={ARMS.down}
          armR={t >= catchT && t < giveT + 0.4 ? armMix({x: -1.1, z: 0.4}, {x: -1.5, z: 0.95}, ramp(t, giveT - 0.4, giveT)) : ARMS.down}
          holdR={t >= catchT && t < giveT ? <SkeletonArm rot={[0, 0, 0.3]} s={1.35} /> : null}
        />
        <Skeleton
          p={[lerp(3.2, SK_PJ[0], walkIn), Math.abs(Math.sin(t * 10)) * 0.04 * (1 - walkIn), SK_PJ[2]]}
          rot={[0, -Math.PI / 2, t >= c[2] && t < popT ? Math.sin(t * 18) * 0.06 : 0]}
          s={1.35}
          run={walkIn < 1 ? t * 2.5 : 0}
          armOff={!hasArm}
          jaw={t >= c[5] && t < c[7] ? ramp(t, c[5] + 0.1, c[5] + 0.3) : 0}
          blush={t >= c[8] ? 1 : 0.2}
          arms={t < c[3] + 0.5 ? {l: [-1.4, 0.1], r: [-1.4, 0.1]} : t >= c[8] ? {l: [0, 0.2], r: [-2.6, -0.3]} : {l: [-0.2, 0.3], r: [-0.2, 0.3]}}
        />
        {t < c[3] + 0.5 && (
          <Pajamas p={t < c[2] ? [SK_PJ[0] - 0.45, 0.95, SK_PJ[2]] : v3mix([SK_PJ[0] - 0.45, 0.95, SK_PJ[2]], [0.75, 1.15, -1.45], ramp(t, c[2], c[2] + 0.5))} rot={[0, Math.PI / 2 + spin * 0.5, Math.sin(t * 9) * 0.2]} s={1.3} />
        )}
        {!hasArm && t < catchT && <SkeletonArm p={armPos} rot={[t * 11, t * 7, 0]} s={1.35} />}
        {t >= giveT && t < reattachT && <SkeletonArm p={armPos} rot={[0, 0, 0.6]} s={1.35} />}
        <Puff p={[MP[0], MP[1] + 0.5, MP[2]]} k={ramp(t, zipT - 0.1, zipT + 0.6, (x) => x)} s={0.7} c="#cfe0ff" />
        <Sparkles p={[MP[0], MP[1] + 0.6, MP[2]]} t={t} amount={pulse(t, zipT, zipT + 0.2, zipT + 0.8, zipT + 1.2)} spread={0.6} />
      </Nursery>
    </View>
  );
};
function easeInOutish(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/* ================================================================ 6. lullaby */
const LB = cutStarts('lullaby');
const NB: V3 = [-0.55, 0, -0.45];
const NB_MOUTH: V3 = [-0.35, 0.93, -0.67];
const Lullaby: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = LB;
  const singing = t >= c[2] && t < c[7] + 0.9;
  const pacOut = c[7] + 0.5;
  const pacIn = c[7] + 0.9;
  const sleepAt = (i: number) => ramp(t, c[9] + 0.3 + i * 0.5, c[9] + 0.8 + i * 0.5);
  const nibSleep = t > c[8] + 0.9;
  const cams: CamTable = {
    wide: {pos: [0.3, 2.2, 4.2], target: [0.2, 1.1, -1.1], fov: 44, to: {pos: [0.3, 2.1, 3.7]}},
    vampCU: {pos: [0.3, 1.25, -1.3], target: [-0.55, 1.0, -0.45], fov: 36, to: {pos: [0.22, 1.23, -1.22]}},
    vampLow: {pos: [0.25, 0.55, -1.05], target: [-0.5, 1.1, -0.45], fov: 42, shake: 0.012},
    jackCU: {pos: [1.0, 2.0, 0.45], target: [1.75, 1.9, -0.65], fov: 28},
    wolfCU: {pos: [-0.45, 1.65, -0.35], target: [-1.6, 2.0, -1.25], fov: 36},
    sill: {pos: [-1.7, 2.0, -2.6], target: [-1.75, 1.45, -3.85], fov: 30, shake: 0.025},
    miloCU: {pos: [0.42, 1.62, -0.3], target: [0.4, 1.55, -1.5], fov: 30, to: {pos: [0.42, 1.6, -0.42]}},
    medium: {pos: [1.0, 1.6, 0.8], target: [-0.1, 1.15, -0.9], fov: 40},
  };
  const twitch = t >= c[6] && t < c[7] ? Math.abs(noise(t * 4, 9)) * 0.55 : 0;
  return (
    <View cams={cams} p={p}>
      <Nursery windowOpen={t >= c[5] && t < c[6] ? 0.4 + noise(t * 6, 3) * 0.08 : 0.4} closetOpen={0.7}>
        <Milo
          p={MP}
          onesie={PJ}
          pacifier={t < pacOut}
          close={t >= c[10] ? 0.55 : 0.45 + twitch}
          closeL={t >= c[6] && t < c[7] ? 0.45 + twitch : undefined}
          brow={t >= c[6] && t < c[7] ? 1.5 : 1}
          look={[-0.5, -0.1]}
          headTilt={[0, -0.4, 0]}
          armL={t >= c[7] && t < c[8] ? armMix({x: -2.6, z: -0.5}, {x: -1.5, z: 0.6}, ramp(t, pacOut - 0.15, pacOut + 0.2)) : t >= c[10] ? ARMS.crossed : ARMS.down}
          armR={t >= c[10] ? ARMS.crossed : ARMS.down}
        />
        <Nibbles
          p={NB}
          rot={[0, 2.4, nibSleep ? 0.15 + sleepAt(3) * 0.15 : 0]}
          puff={t >= c[1] && t < c[2] ? ramp(t, c[1], c[1] + 0.9) : singing ? 0.5 : 0}
          mouth={singing ? 0.85 + Math.sin(t * 30) * 0.12 : 0}
          cape={singing ? 0.5 + Math.sin(t * 8) * 0.25 : 0.1}
          fright={t >= c[8] && !nibSleep ? 0.6 : 0}
          pacifier={t >= pacIn}
          sleep={nibSleep}
          armL={singing ? [-1.8, 0, 0.6] : [0, 0, 0.3]}
          armR={[-1.2, 0, -0.2]}
          holdR={t < c[8] ? <SheetMusic p={[0, -0.05, 0.12]} rot={[-1.2, 0, 0]} s={0.9} /> : null}
        />
        <SoundRings p={[NB[0], 0.95, NB[2]]} rot={[0, 2.4, 0]} t={t} amount={singing ? 1 : 0} />
        <Woofle p={[-1.75, 0, -1.3]} rot={[0, 1.45, sleepAt(0) * 0.2]} s={0.85} puppy={0.6} sleep={sleepAt(0)}
          mouth={t >= c[4] && t < c[7] ? 0.9 : 0.1} headRot={t >= c[4] && t < c[7] ? [-0.7, 0, 0] : [sleepAt(0) * 0.4, 0, 0]} />
        <Jack p={[1.75, 0, -0.65]} rot={[0, -0.9, sleepAt(1) * 0.15]} s={0.9} pucker={t >= c[3] && t < c[9] ? 0.8 : 0} flame={t >= c[9] ? 0.4 : 0.9} sleep={sleepAt(1) > 0.5}
          headRot={[sleepAt(1) * 0.35, 0, 0]} />
        {t >= c[3] && t < c[9] && [-1, 1].map((d) => (
          <Tear key={d} p={[1.75 - 0.1 + d * 0.11, 1.95 - ((t * 0.9 + (d > 0 ? 0.3 : 0)) % 0.6), -0.65 + 0.32]} s={1.3} />
        ))}
        <Skeleton p={[1.9, 0, -2.1]} rot={[0, -1.2, sleepAt(2) * 0.2]} s={1.3} sleep={sleepAt(2) > 0.5} cover={t >= c[2] && t < c[7] ? 1 : 0} />
        {t >= pacOut && t < pacIn && <PacifierProp p={hop([0.4, 1.41, -1.2], NB_MOUTH, ramp(t, pacOut, pacIn, (x) => x), 0.4)} rot={[0, t * 9, 0]} />}
        <Sparkles p={[0.0, 1.8, -1.0]} t={t} amount={pulse(t, c[9] + 1.6, c[9] + 2.0, c[10] + 0.6, c[10] + 1.2)} spread={1.6} c="#c7d6ff" />
      </Nursery>
    </View>
  );
};
const PacifierProp: React.FC<{p: V3; rot?: V3}> = ({p, rot}) => (
  <group position={p} rotation={rot}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.085, 0.085, 0.025, 28]} /><meshStandardMaterial color="#ff8a2a" roughness={0.35} /></mesh>
    <mesh position={[0, 0, 0.035]}><torusGeometry args={[0.045, 0.012, 12, 32]} /><meshStandardMaterial color="#ffb366" roughness={0.3} /></mesh>
  </group>
);

/* ================================================================ 7. return */
const RT = cutStarts('return');
const WOLF_MOUTH: V3 = [0.5, 0.88, -0.4];
const Return: React.FC<SceneProps> = (p) => {
  const t = p.t;
  const c = RT;
  if (t < c[1]) {
    const k = ramp(t, 0, 1.8, (x) => x);
    const cams: CamTable = {hallDoor: {pos: [0.15, 1.55, -1.2], target: [0, 1.35, -5.4], fov: 40, to: {pos: [0.15, 1.55, -1.5]}}};
    return (
      <View cams={cams} p={p} exposure={1.5} keyLight={[0.2, 2.4, -3.4]}>
        <Hallway endDoor={ramp(t, 0, 0.6, easeOut)} outside="#22315f">
          <Mom p={[-0.32, 0, lerp(-6.3, -4.5, k)]} top={MOM_TOP} walk={t * 1.4} armL={[-0.9, 0, 0.5]} armR={[-0.9, 0, -0.5]} />
          <Mom dad s={1.05} p={[0.38, 0, lerp(-6.5, -4.7, k)]} walk={t * 1.4 + 0.5} armL={[-0.9, 0, 0.5]} armR={[-0.9, 0, -0.5]} />
        </Hallway>
      </View>
    );
  }
  const backOut = ramp(t, c[5] + 0.2, c[5] + 1.6, easeIn);
  const shockM = ramp(t, c[2] + 0.1, c[2] + 0.35, outBack);
  const shockD = ramp(t, c[3] + 0.05, c[3] + 0.3, outBack);
  const nod = t >= c[5] ? Math.sin((t - c[5]) * 9) * 0.1 * (1 - backOut) : 0;
  const throwT = c[7] + 0.15;
  const teddyK = ramp(t, throwT, throwT + 0.65, (x) => x);
  const stuffed = t >= throwT + 0.65;
  const snoreK = t >= c[6] && t < throwT + 0.65 ? ((t - c[6]) % 1.4) / 1.4 : 0;
  const cams: CamTable = {
    doorPOV: {pos: [4.15, 2.3, 0.62], target: [0.8, 0.7, -0.9], fov: 52, to: {pos: [3.95, 2.25, 0.55]}},
    momCU: {pos: [3.2, 1.8, 0.75], target: [4.5, 1.84, 0.35], fov: 28},
    dadCU: {pos: [3.25, 1.88, 0.35], target: [4.55, 1.92, 0.9], fov: 28},
    miloCU: {pos: [0.42, 1.62, -0.3], target: [0.4, 1.55, -1.5], fov: 30, to: {pos: [0.42, 1.6, -0.42]}},
    doorIn: {pos: [1.6, 1.65, -0.6], target: [4.6, 1.4, 0.6], fov: 40},
    wolfCU: {pos: [0.95, 1.55, 0.25], target: [0.5, 0.75, -0.45], fov: 32},
    crib: {pos: [2.0, 2.2, 1.6], target: [0.45, 0.95, -0.9], fov: 44},
    endWide: {pos: [0.4, 2.4, 5.0], target: [0.4, 1.0, -1.0], fov: 46, to: {pos: [0.4, 2.8, 6.6]}},
  };
  const showParents = t < c[5] + 1.6;
  return (
    <View cams={cams} p={p}>
      <Nursery windowOpen={0.4} closetOpen={0.7} roomDoor={t < c[1] + 0.6 ? ramp(t, c[1], c[1] + 0.6) * 0.85 : 0.85}>
        <Milo
          p={MP}
          onesie={PJ}
          pacifier={false}
          close={t >= c[7] + 1.3 ? lerp(0.45, 1, ramp(t, c[7] + 1.3, c[7] + 1.8)) : 0.45}
          look={t >= c[4] && t < c[5] ? [0.6, 0.1] : t >= c[7] ? [0.2, -0.6] : [0.7, 0]}
          armL={ARMS.down}
          armR={t >= c[7] && t < throwT + 0.3 ? armMix({x: -2.8, z: 0.2}, {x: -1.3, z: 0.1}, ramp(t, throwT - 0.1, throwT + 0.1)) : ARMS.down}
          shh={t >= c[4] && t < c[6] ? ramp(t, c[4] + 0.3, c[4] + 0.6, outBack) : 0}
          holdR={t >= c[7] && t < throwT ? <Teddy p={[0, -0.05, 0.05]} s={0.7} /> : null}
        />
        <Woofle p={[0.5, 0.3, 1.4]} rot={[-Math.PI / 2, 0, 0]} s={0.8} sleep={1} mouth={stuffed ? 0.35 : 0.5 + Math.sin(t * 4) * 0.15} cheeks={snoreK * 0.6} />
        <SnoreBubble p={[0.5, 1.0 + snoreK * 0.15, -0.38]} k={snoreK} />
        {t >= throwT && <Teddy p={stuffed ? [WOLF_MOUTH[0], WOLF_MOUTH[1] - 0.12, WOLF_MOUTH[2]] : hop([0.65, 1.25, -1.3], WOLF_MOUTH, teddyK, 0.7)} rot={stuffed ? [-0.5, 0, 0] : [teddyK * 7, 0, 0]} s={0.7} />}
        <Jack p={[2.7, 0, -3.0]} rot={[-0.25, -0.3, 0.1]} s={0.85} sleep flame={0.3} />
        <Skeleton p={[-1.3, 0.12, 0.5]} rot={[-1.45, 0, 0.4]} s={1.2} towel sleep />
        <Nibbles p={[-0.85, 0, -0.7]} rot={[0, 0.7, 0.25]} sleep pacifier />
        {showParents && (
          <>
            <Mom p={[lerp(4.5, 5.7, backOut), 0, 0.35]} rot={[nod, -Math.PI / 2, 0]} top={MOM_TOP} shock={t >= c[5] ? 0.4 : shockM}
              walk={backOut > 0 ? t * 1.2 : 0} armL={t < c[5] ? [-1.6 * shockM, 0, 0.6] : [0, 0, 0.2]} armR={t < c[5] ? [-1.6 * shockM, 0, -0.6] : [0, 0, -0.2]} />
            <Mom dad s={1.05} p={[lerp(4.55, 5.75, backOut), 0, 0.9]} rot={[nod, -Math.PI / 2, 0]} shock={t >= c[5] ? 0.4 : shockD}
              walk={backOut > 0 ? t * 1.2 + 0.5 : 0} armL={t < c[5] ? [-2.2 * shockD, 0, 0.3] : [0, 0, 0.2]} />
          </>
        )}
      </Nursery>
    </View>
  );
};

export const SCENE_VIEWS: Record<string, React.FC<SceneProps>> = {
  leave: Leave,
  reveal: Reveal,
  feed: Feed,
  bath: Bath,
  pjs: Pjs,
  lullaby: Lullaby,
  return: Return,
};
