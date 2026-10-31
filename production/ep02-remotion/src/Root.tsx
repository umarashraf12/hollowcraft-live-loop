import React from 'react';
import {Composition} from 'remotion';
import {Episode, TOTAL_FRAMES} from './Episode';
import {FPS} from './edit';

export const Root: React.FC = () => (
  <Composition id="Episode" component={Episode} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{withAudio: true}} />
);
