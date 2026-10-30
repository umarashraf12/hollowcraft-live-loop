import {ThreeCanvas} from '@remotion/three';
import React from 'react';
import {useT} from './anim';
import {ARMS, Milo} from './chars/Milo';
import {Woofle} from './chars/Woofle';
import {Sheets, Skeleton} from './chars/Sheets';
import {Jack} from './chars/Jack';
import {Bat, Nibbles} from './chars/Nibbles';
import {Mom} from './chars/Mom';
import {Cam} from './kit';
import {Bucket} from './props';
import {CRIB, Nursery} from './sets';

/** Cast line-up in the nursery — handy in Remotion Studio for tweaking designs. */
export const Preview: React.FC<{view?: 'room' | 'cast'}> = ({view = 'cast'}) => {
  const t = useT();
  return (
    <ThreeCanvas width={1920} height={1080} shadows gl={{antialias: true}}>
      {view === 'room' ? <Cam pos={[0.6, 2.2, 6.8]} target={[0, 1.2, -1.5]} fov={45} /> : <Cam pos={[0, 1.5, 5.2]} target={[0, 1.1, 0]} fov={42} />}
      <Nursery>
        <Milo p={[CRIB[0], CRIB[1], CRIB[2] + 0.1]} armL={ARMS.crossed} armR={ARMS.crossed} />
        <Bucket p={[CRIB[0] + 0.55, CRIB[1], CRIB[2] + 0.1]} s={0.9} />
        {view === 'cast' && (
          <>
            <Woofle p={[-2.4, 0, 0.3]} s={0.95} />
            <Sheets p={[-0.9, 0.1, 0.6]} t={t} />
            <Skeleton p={[0.2, 0, 1.2]} blush={1} cover={1} />
            <Jack p={[1.3, 0, 0.5]} />
            <Nibbles p={[2.5, 0, 0.8]} cape={0.8} mouth={0.5} />
            <Bat p={[2.4, 2.2, 0.5]} flap={t * 4} />
            <Mom p={[3.6, 0, 0.2]} shock={1} />
          </>
        )}
      </Nursery>
    </ThreeCanvas>
  );
};
