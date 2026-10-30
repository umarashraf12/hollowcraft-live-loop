import React, {useMemo} from 'react';
import * as THREE from 'three';
import {V3, rand} from './anim';
import {Ball, Box, Cone, Cyl, M} from './kit';

export const CRIB: V3 = [0.4, 0.72, -1.6];
export const WINDOW: V3 = [-2.3, 2.25, -4];
export const CHEST: V3 = [-3.2, 0, -0.9];
export const SHELF: V3 = [3.0, 0, -3.55];
export const CLOSET: V3 = [4.95, 0, -2.2];
export const ROOM_DOOR: V3 = [4.95, 0, 0.6];

const WALL = '#3d5786';
const WALL_DAY = '#9cc3e6';
const WOOD = '#9a6a42';
const WOOD_DARK = '#6e4a2e';

const NightSky: React.FC<{morning: boolean}> = ({morning}) => {
  const stars = useMemo(
    () => Array.from({length: 40}).map((_, i): V3 => [(rand(i) - 0.5) * 6, rand(i + 99) * 3 + 0.5, 0]),
    [],
  );
  return (
    <group position={[WINDOW[0], 0, -6]}>
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[9, 7]} />
        <meshBasicMaterial color={morning ? '#bfe3ff' : '#18275a'} />
      </mesh>
      {!morning && (
        <>
          <mesh position={[0.5, 3.0, 0.05]}>
            <circleGeometry args={[0.32, 48]} />
            <meshBasicMaterial color="#fff6d8" toneMapped={false} />
          </mesh>
          <mesh position={[0.5, 3.0, 0.04]}>
            <circleGeometry args={[0.6, 48]} />
            <meshBasicMaterial color="#8fa8ff" transparent opacity={0.25} />
          </mesh>
          {stars.map((p, i) => (
            <mesh key={i} position={[p[0], p[1], 0.03]}>
              <circleGeometry args={[0.012 + rand(i + 5) * 0.015, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </>
      )}
      {[-1.6, -0.9, 0.2, 1.2, 1.9].map((x, i) => (
        <Cone key={i} p={[x, 1.3 + rand(i) * 0.4, 0.3]} r={0.45 + rand(i + 3) * 0.2} h={2.4 + rand(i + 1) * 0.8} seg={7} shadow={false}>
          <meshBasicMaterial color={morning ? '#5f9a64' : '#0b1430'} />
        </Cone>
      ))}
    </group>
  );
};

const WindowFrame: React.FC<{open: number; morning: boolean}> = ({open, morning}) => {
  const frame = <M c="#e9e2d2" r={0.6} />;
  return (
    <group position={WINDOW}>
      <Box p={[0, -0.95, 0.12]} d={[1.9, 0.08, 0.3]}>{frame}</Box>
      <Box p={[0, 0.95, 0.02]} d={[1.8, 0.08, 0.1]}>{frame}</Box>
      <Box p={[-0.88, 0, 0.02]} d={[0.08, 1.9, 0.1]}>{frame}</Box>
      <Box p={[0.88, 0, 0.02]} d={[0.08, 1.9, 0.1]}>{frame}</Box>
      {[-1, 1].map((d) => (
        <group key={d} position={[0.84 * d, 0, 0.04]} rotation={[0, d * open * 1.3, 0]}>
          <Box p={[-0.42 * d, 0, 0]} d={[0.84, 0.05, 0.04]}>{frame}</Box>
          <Box p={[-0.42 * d, 0.9, 0]} d={[0.84, 0.05, 0.04]}>{frame}</Box>
          <Box p={[-0.42 * d, -0.9, 0]} d={[0.84, 0.05, 0.04]}>{frame}</Box>
          <Box p={[-0.02 * d, 0, 0]} d={[0.05, 1.8, 0.04]}>{frame}</Box>
          <mesh position={[-0.42 * d, 0, 0]}>
            <planeGeometry args={[0.8, 1.78]} />
            <meshStandardMaterial color={morning ? '#e6f4ff' : '#9fb8ff'} transparent opacity={0.12} roughness={0.05} />
          </mesh>
        </group>
      ))}
      {/* curtains: clustered folds */}
      {[-1, 1].map((d) => (
        <group key={d} position={[1.15 * d, 0, 0.25]}>
          {[0, 1, 2, 3].map((i) => (
            <Cyl key={i} p={[i * 0.11 * d, -0.15, (i % 2) * 0.05]} rt={0.075} h={2.4} seg={14}>
              <M c="#2f7a6e" r={0.95} />
            </Cyl>
          ))}
        </group>
      ))}
      <Cyl p={[0, 1.2, 0.25]} rot={[0, 0, Math.PI / 2]} rt={0.03} h={3}><M c={WOOD_DARK} /></Cyl>
      {/* windowsill jack-o-lantern */}
      <group position={[0.55, -0.83, 0.15]}>
        <Ball r={1} s={[0.16, 0.13, 0.15]}><M c="#ea7b1e" r={0.5} /></Ball>
        <Ball p={[0, 0, 0.12]} r={0.07} s={[1.3, 0.6, 0.3]} shadow={false}><M c="#ffcf4a" e="#ff9a1a" ei={3} /></Ball>
        <Cyl p={[0, 0.14, 0]} rt={0.015} h={0.06}><M c="#4d6b2a" /></Cyl>
        {!morning && <pointLight position={[0, 0.05, 0.35]} intensity={1.6} distance={3} color="#ff9a3a" />}
      </group>
    </group>
  );
};

const Crib: React.FC = () => {
  const wood = <M c={WOOD} r={0.55} />;
  const [x, y, z] = CRIB;
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.35, 0]} d={[2.1, 0.3, 1.3]}>{wood}</Box>
      <Box p={[0, 0.6, 0]} d={[2.0, 0.24, 1.2]}><M c="#e8eefc" r={0.9} /></Box>
      <Box p={[0, y + 0.02, 0.05]} d={[1.96, 0.04, 1.1]}><M c="#5f86c9" r={0.95} /></Box>
      <Ball p={[-0.55, y + 0.12, -0.35]} r={1} s={[0.35, 0.1, 0.22]}><M c="#f2f4ff" r={0.95} /></Ball>
      {/* posts */}
      {[[-1.05, -0.65], [1.05, -0.65], [-1.05, 0.65], [1.05, 0.65]].map(([px, pz], i) => (
        <group key={i}>
          <Cyl p={[px, pz < 0 ? 0.85 : 0.6, pz]} rt={0.06} h={pz < 0 ? 1.7 : 1.2}>{wood}</Cyl>
          <Ball p={[px, pz < 0 ? 1.72 : 1.22, pz]} r={0.08}>{wood}</Ball>
        </group>
      ))}
      {/* headboard with bars */}
      <Box p={[0, 1.55, -0.65]} d={[2.1, 0.12, 0.07]}>{wood}</Box>
      {Array.from({length: 9}).map((_, i) => (
        <Cyl key={i} p={[-0.84 + i * 0.21, 1.15, -0.65]} rt={0.025} h={0.8}>{wood}</Cyl>
      ))}
      {/* low side rails */}
      <Box p={[0, 0.98, 0.65]} d={[2.1, 0.07, 0.06]}>{wood}</Box>
      <Box p={[-1.05, 0.98, 0]} d={[0.06, 0.07, 1.3]}>{wood}</Box>
      <Box p={[1.05, 0.98, 0]} d={[0.06, 0.07, 1.3]}>{wood}</Box>
      {Array.from({length: 7}).map((_, i) => (
        <Cyl key={i} p={[-0.78 + i * 0.26, 0.86, 0.65]} rt={0.02} h={0.22}>{wood}</Cyl>
      ))}
    </group>
  );
};

const ToyChest: React.FC<{lid: number; glow: number}> = ({lid, glow}) => (
  <group position={CHEST} rotation={[0, 0.7, 0]}>
    <Box p={[0, 0.32, 0]} d={[1.1, 0.64, 0.7]}><M c="#3c6fb0" r={0.6} /></Box>
    <Box p={[0, 0.32, 0.36]} d={[1.0, 0.08, 0.02]}><M c="#ffd23a" r={0.5} /></Box>
    <group position={[0, 0.66, -0.35]} rotation={[-lid * 1.6, 0, 0]}>
      <Box p={[0, 0.03, 0.35]} d={[1.14, 0.08, 0.74]}><M c="#2f5c97" r={0.6} /></Box>
    </group>
    {glow > 0 && <pointLight position={[0, 0.9, 0]} intensity={glow * 6} distance={3.5} color="#ff2a3a" />}
  </group>
);

const Shelf: React.FC = () => (
  <group position={SHELF}>
    <Box p={[0, 0.55, 0]} d={[1.6, 1.1, 0.5]}><M c="#f1e7d6" r={0.6} /></Box>
    <Box p={[0, 0.55, 0.2]} d={[1.5, 0.05, 0.12]}><M c="#e1d4bd" /></Box>
    {[['#ff6f61', -0.55], ['#ffd23a', -0.35], ['#4fc3f7', -0.15]].map(([c, x], i) => (
      <Box key={i} p={[x as number, 1.2, 0.05]} rot={[0, i * 0.3, 0]} d={[0.18, 0.18, 0.18]}><M c={c as string} r={0.5} /></Box>
    ))}
    {/* teddy */}
    <group position={[0.4, 1.1, 0.05]}>
      <Ball p={[0, 0.12, 0]} r={0.14}><M c="#b07a4f" r={0.95} /></Ball>
      <Ball p={[0, 0.33, 0]} r={0.11}><M c="#b07a4f" r={0.95} /></Ball>
      <Ball p={[-0.08, 0.43, 0]} r={0.04}><M c="#b07a4f" r={0.95} /></Ball>
      <Ball p={[0.08, 0.43, 0]} r={0.04}><M c="#b07a4f" r={0.95} /></Ball>
    </group>
  </group>
);

const Lamp: React.FC<{morning: boolean}> = ({morning}) => (
  <group position={[-1.15, 0, -3.4]}>
    <Box p={[0, 0.35, 0]} d={[0.6, 0.7, 0.5]}><M c={WOOD} r={0.55} /></Box>
    <Ball p={[0, 0.85, 0]} r={0.13} s={[1, 1.1, 1]}><M c="#3f8a6a" r={0.3} /></Ball>
    <Cyl p={[0, 1.15, 0]} rt={0.14} rb={0.24} h={0.26} open>
      <meshStandardMaterial color="#ffe1b0" emissive="#ffb35c" emissiveIntensity={morning ? 0.2 : 1.4} side={THREE.DoubleSide} />
    </Cyl>
    {!morning && <pointLight position={[0, 1.1, 0.2]} intensity={7} distance={7} decay={2} color="#ffb066" />}
  </group>
);

const StringLights: React.FC = () => (
  <group>
    {Array.from({length: 18}).map((_, i) => {
      const k = i / 17;
      const x = -0.9 + k * 5.6;
      const y = 3.55 - Math.sin(k * Math.PI * 3) ** 2 * 0.25;
      return (
        <Ball key={i} p={[x, y, -3.92]} r={0.035} shadow={false}>
          <meshBasicMaterial color={i % 3 === 0 ? '#ff8a2a' : i % 3 === 1 ? '#b78bff' : '#ffd23a'} toneMapped={false} />
        </Ball>
      );
    })}
    <pointLight position={[1.8, 3.3, -3.4]} intensity={2} distance={5} color="#ff9a50" />
  </group>
);

const Door: React.FC<{p: V3; open: number; spill?: string; color?: string}> = ({p, open, spill, color = '#e9e2d2'}) => (
  <group position={p} rotation={[0, -Math.PI / 2, 0]}>
    <Box p={[0, 1.15, 0.02]} d={[1.2, 2.3, 0.02]} shadow={false}><meshBasicMaterial color={spill ?? '#0a0c14'} /></Box>
    <Box p={[-0.63, 1.17, 0]} d={[0.08, 2.4, 0.12]}><M c={color} /></Box>
    <Box p={[0.63, 1.17, 0]} d={[0.08, 2.4, 0.12]}><M c={color} /></Box>
    <Box p={[0, 2.37, 0]} d={[1.34, 0.08, 0.12]}><M c={color} /></Box>
    <group position={[-0.58, 0, 0.03]} rotation={[0, -open * 1.6, 0]}>
      <Box p={[0.58, 1.14, 0]} d={[1.14, 2.28, 0.06]}><M c={color} r={0.6} /></Box>
      <Ball p={[1.02, 1.1, 0.06]} r={0.04}><M c="#d8b25a" m={0.7} r={0.3} /></Ball>
    </group>
  </group>
);

export type NurseryProps = {
  morning?: boolean;
  windowOpen?: number;
  chestLid?: number;
  chestGlow?: number;
  closetOpen?: number;
  roomDoor?: number;
  children?: React.ReactNode;
};

export const Nursery: React.FC<NurseryProps> = ({
  morning = false, windowOpen = 0, chestLid = 0, chestGlow = 0, closetOpen = 0.25, roomDoor = 0, children,
}) => {
  const wall = <M c={morning ? WALL_DAY : WALL} r={0.9} />;
  const shadowCam = useMemo(() => ({left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 30}), []);
  return (
    <>
      {morning ? (
        <>
          <hemisphereLight args={['#fff1da', '#9c7a5c', 1.4]} />
          <directionalLight position={[-4, 6, -9]} intensity={3.2} color="#ffe2b0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={shadowCam.left} shadow-camera-right={shadowCam.right} shadow-camera-top={shadowCam.top} shadow-camera-bottom={shadowCam.bottom} shadow-bias={-0.0004} />
          <directionalLight position={[3, 4, 6]} intensity={1.0} color="#fff4e6" />
        </>
      ) : (
        <>
          <hemisphereLight args={['#6f88c9', '#2a2030', 0.6]} />
          <directionalLight position={[-4, 6, -9]} intensity={1.9} color="#a9c1ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={shadowCam.left} shadow-camera-right={shadowCam.right} shadow-camera-top={shadowCam.top} shadow-camera-bottom={shadowCam.bottom} shadow-bias={-0.0004} />
          <directionalLight position={[2, 3, 6]} intensity={0.55} color="#8095d8" />
          <directionalLight position={[0, 4, -6]} intensity={0.9} color="#7aa0ff" />
          <fog attach="fog" args={['#0d1630', 10, 24]} />
        </>
      )}
      <NightSky morning={morning} />
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} receiveShadow>
        <planeGeometry args={[10, 9]} />
        <M c={morning ? '#c08c5e' : WOOD} r={0.7} />
      </mesh>
      {Array.from({length: 13}).map((_, i) => (
        <Box key={i} p={[-5 + i * 0.8, 0.003, -0.5]} d={[0.012, 0.004, 9]} shadow={false}><M c={WOOD_DARK} /></Box>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.008, 0.6]} receiveShadow>
        <circleGeometry args={[1.7, 64]} />
        <M c={morning ? '#7fc7b8' : '#2e6f72'} r={1} />
      </mesh>
      {/* back wall with window hole */}
      <Box p={[-4.0, 2.1, -4.05]} d={[2.0, 4.2, 0.1]}>{wall}</Box>
      <Box p={[2.0, 2.1, -4.05]} d={[6.0, 4.2, 0.1]}>{wall}</Box>
      <Box p={[-2.3, 0.6, -4.05]} d={[1.8, 1.2, 0.1]}>{wall}</Box>
      <Box p={[-2.3, 3.7, -4.05]} d={[1.8, 1.0, 0.1]}>{wall}</Box>
      <Box p={[0, 4.25, -0.5]} d={[10.2, 0.1, 9.2]} shadow={false}><M c={morning ? '#e8eef8' : '#1d2a4a'} r={1} /></Box>
      {/* soft key on the crib, motivated by the lamp */}
      <pointLight position={[0.9, 2.2, 0.4]} intensity={morning ? 2 : 4.5} distance={5} decay={1.6} color={morning ? '#fff4e0' : '#ffd2a8'} />
      {/* side walls */}
      <Box p={[-5, 2.1, -0.5]} d={[0.1, 4.2, 9]}>{wall}</Box>
      <Box p={[5, 2.1, -0.5]} d={[0.1, 4.2, 9]}>{wall}</Box>
      <Box p={[0, 0.08, -3.99]} d={[10, 0.16, 0.04]}><M c="#e9e2d2" /></Box>
      {/* wall frames */}
      <Box p={[0.6, 2.6, -3.98]} d={[0.7, 0.55, 0.04]}><M c="#e9e2d2" /></Box>
      <Box p={[0.6, 2.6, -3.95]} d={[0.58, 0.43, 0.02]}><M c="#f2a65a" r={0.8} /></Box>
      <Box p={[1.6, 2.4, -3.98]} d={[0.5, 0.65, 0.04]}><M c="#e9e2d2" /></Box>
      <Box p={[1.6, 2.4, -3.95]} d={[0.38, 0.53, 0.02]}><M c="#8b7bd8" r={0.8} /></Box>
      <WindowFrame open={windowOpen} morning={morning} />
      <Crib />
      <ToyChest lid={chestLid} glow={chestGlow} />
      <Shelf />
      <Lamp morning={morning} />
      {!morning && <StringLights />}
      <Door p={CLOSET} open={closetOpen} spill={closetOpen > 0.3 ? '#1a2350' : undefined} />
      <Door p={ROOM_DOOR} open={roomDoor} spill={morning ? '#fff2d6' : '#0a0c14'} />
      {morning && <pointLight position={[4.2, 1.6, 0.6]} intensity={8 * roomDoor} distance={5} color="#fff0d0" />}
      {children}
    </>
  );
};

/** Dark upstairs hallway. Nursery doorway at the far end (z = -5.5). */
export const Hallway: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const wall = <M c="#3a3566" r={0.9} />;
  return (
    <>
      <hemisphereLight args={['#5a62a8', '#1c1424', 0.5]} />
      <directionalLight position={[0, 3, -9]} intensity={1.4} color="#9fb6ff" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[2, 3, 5]} intensity={0.4} color="#7a86c8" />
      <pointLight position={[-0.9, 0.35, -2.6]} intensity={1.5} distance={3} color="#ffd27a" />
      <fog attach="fog" args={['#0b0d1f', 6, 16]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[3, 10]} />
        <M c="#7a5236" r={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -2]} receiveShadow>
        <planeGeometry args={[1.2, 9]} />
        <M c="#7d2f4a" r={1} />
      </mesh>
      <Box p={[-1.5, 2, -2]} d={[0.1, 4, 10]}>{wall}</Box>
      <Box p={[1.5, 2, -2]} d={[0.1, 4, 10]}>{wall}</Box>
      {/* end wall with lit nursery doorway */}
      <Box p={[-1.0, 2, -5.55]} d={[1.0, 4, 0.1]}>{wall}</Box>
      <Box p={[1.0, 2, -5.55]} d={[1.0, 4, 0.1]}>{wall}</Box>
      <Box p={[0, 3.2, -5.55]} d={[1.0, 1.6, 0.1]}>{wall}</Box>
      <mesh position={[0, 1.2, -5.8]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshBasicMaterial color="#7f9cff" />
      </mesh>
      <pointLight position={[0, 1.2, -5.2]} intensity={6} distance={6} color="#8fa8ff" />
      {/* plug-in night light */}
      <Ball p={[-1.44, 0.35, -2.6]} r={0.05} s={[0.4, 1, 1]} shadow={false}><meshBasicMaterial color="#ffd27a" toneMapped={false} /></Ball>
      {/* picture frames */}
      {[-1, 0.8, 2.6].map((z, i) => (
        <Box key={i} p={[1.44, 2.1, -z]} d={[0.04, 0.6, 0.45]}><M c={['#c98b5a', '#6d8fc9', '#c9a35a'][i]} r={0.8} /></Box>
      ))}
      {children}
    </>
  );
};
