import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CUTS, TOTAL_FRAMES} from './edit';
import {SCENE_VIEWS} from './Scenes';

export const CHANNEL = 'MILO & MONSTERS';

const CutView: React.FC<{scene: string; sceneT0: number; cam: string; frames: number}> = ({scene, sceneT0, cam, frames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const View = SCENE_VIEWS[scene];
  return <View t={sceneT0 + frame / fps} cam={cam} k={frame / Math.max(1, frames - 1)} />;
};

const TitleCard: React.FC<{frames: number}> = ({frames}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, frames - 8, frames], [0, 1, 1, 0], {extrapolateRight: 'clamp'});
  const pop = interpolate(f, [0, 10], [0.6, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70, opacity: o}}>
      <div style={{fontSize: 108, fontWeight: 900, color: '#ffb23a', letterSpacing: 3, transform: `scale(${pop}) rotate(-2deg)`, textShadow: '0 7px 0 #6b2a00, 0 0 40px rgba(255,140,40,0.55)'}}>
        MONSTER BABYSITTERS
      </div>
      <div style={{fontSize: 40, fontWeight: 700, color: '#e8eeff', marginTop: 6, textShadow: '0 3px 8px rgba(0,0,0,0.8)'}}>Milo vs Monsters · Episode 2</div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{frames: number}> = ({frames}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [12, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const black = interpolate(f, [frames - 14, frames - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', opacity: o}}>
        <div style={{fontSize: 120, fontWeight: 900, color: '#ffb23a', textShadow: '0 7px 0 #6b2a00'}}>THE END</div>
        <div style={{fontSize: 44, fontWeight: 800, color: '#ffffff', marginTop: 10, textShadow: '0 3px 8px rgba(0,0,0,0.9)'}}>Subscribe for more Milo!</div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: black}} />
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [1, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000', fontFamily: '"DejaVu Sans", sans-serif'}}>
      {CUTS.map((c, i) => (
        <Sequence key={i} from={c.from} durationInFrames={c.frames} name={`${c.scene} ${c.index + 1}: ${c.cut.cam}`}>
          <CutView scene={c.scene} sceneT0={c.sceneT0} cam={c.cut.cam} frames={c.frames} />
          {c.cut.title && <TitleCard frames={c.frames} />}
          {c.cut.end && <EndCard frames={c.frames} />}
        </Sequence>
      ))}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(5,8,25,0.5) 100%)'}} />
      <div style={{position: 'absolute', right: 44, bottom: 32, fontSize: 30, fontWeight: 900, color: 'rgba(255,255,255,0.82)', letterSpacing: 2, textShadow: '0 2px 6px rgba(0,0,0,0.7)'}}>{CHANNEL}</div>
      <AbsoluteFill style={{background: '#000', opacity: fadeIn}} />
      {withAudio && <Audio src={staticFile('soundtrack.wav')} />}
    </AbsoluteFill>
  );
};

export {TOTAL_FRAMES};
