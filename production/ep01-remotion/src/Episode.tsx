import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SHOTS} from './Shots';
import timeline from './timeline.json';

export const CHANNEL = 'MILO & MONSTERS';
export const FPS = timeline.fps;
export const STARTS = timeline.shots.reduce<number[]>((acc, s, i) => [...acc, (acc[i] ?? 0) + s.duration * FPS], [0]);
export const TOTAL = STARTS[STARTS.length - 1];

const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const title = interpolate(t, [0.6, 1.2, 3.6, 4.4], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [TOTAL - 24, TOTAL - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeIn = interpolate(frame, [0, 12], [1, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{pointerEvents: 'none', fontFamily: '"DejaVu Sans", sans-serif'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(5,8,25,0.55) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 90, opacity: title}}>
        <div style={{fontSize: 92, fontWeight: 900, color: '#ffb23a', letterSpacing: 4, textShadow: '0 6px 0 #6b2a00, 0 0 40px rgba(255,140,40,0.6)', transform: `scale(${0.9 + title * 0.1})`}}>
          MILO vs MONSTERS
        </div>
        <div style={{fontSize: 40, fontWeight: 700, color: '#e8eeff', marginTop: 10, textShadow: '0 3px 8px rgba(0,0,0,0.8)'}}>The Halloween Candy Guard</div>
      </AbsoluteFill>
      <div style={{position: 'absolute', right: 44, bottom: 32, fontSize: 30, fontWeight: 900, color: 'rgba(255,255,255,0.82)', letterSpacing: 2, textShadow: '0 2px 6px rgba(0,0,0,0.7)'}}>
        {CHANNEL}
      </div>
      <AbsoluteFill style={{background: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: '#000'}}>
    {SHOTS.map((Shot, i) => (
      <Sequence key={i} from={STARTS[i]} durationInFrames={timeline.shots[i].duration * FPS} name={`Shot ${i + 1}`}>
        <Shot />
      </Sequence>
    ))}
    <Overlay />
    {withAudio && <Audio src={staticFile('soundtrack.wav')} />}
  </AbsoluteFill>
);
