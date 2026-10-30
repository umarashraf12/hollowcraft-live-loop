import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {Episode, FPS, TOTAL} from './Episode';
import {Preview} from './Preview';
import {SHOTS} from './Shots';
import timeline from './timeline.json';

export const Root: React.FC = () => (
  <>
    <Composition id="Episode" component={Episode} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080} defaultProps={{withAudio: true}} />
    <Composition id="Preview" component={Preview} durationInFrames={90} fps={FPS} width={1920} height={1080} defaultProps={{view: 'cast' as const}} />
    {SHOTS.map((Shot, i) => (
      <Composition
        key={i}
        id={`Shot${String(i + 1).padStart(2, '0')}`}
        component={() => (
          <AbsoluteFill>
            <Shot />
          </AbsoluteFill>
        )}
        durationInFrames={timeline.shots[i].duration * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    ))}
  </>
);
