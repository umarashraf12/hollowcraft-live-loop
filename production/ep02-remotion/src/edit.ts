import {V3, lerp, mix3, easeInOut, noise} from './anim';
import edit from './edit.json';

export type Cut = {cam: string; dur: number; title?: boolean; end?: boolean};
export type SceneDef = {id: string; music: string; cuts: Cut[]; sfx: {cut: number; at: number; file: string; vol?: number}[]};

export const FPS = edit.fps;
export const SCENES = edit.scenes as SceneDef[];

/** Start time (scene seconds) of every cut in a scene, plus its end. */
export const cutStarts = (id: string) => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`no scene ${id}`);
  return s.cuts.reduce<number[]>((acc, c, i) => [...acc, acc[i] + c.dur], [0]);
};

/** Every cut flattened onto the episode timeline (frames). */
export const CUTS = (() => {
  const out: {scene: string; index: number; cut: Cut; from: number; frames: number; sceneT0: number; globalT0: number}[] = [];
  let frame = 0;
  for (const s of SCENES) {
    let t = 0;
    s.cuts.forEach((c, index) => {
      const frames = Math.round(c.dur * FPS);
      out.push({scene: s.id, index, cut: c, from: frame, frames, sceneT0: t, globalT0: frame / FPS});
      frame += frames;
      t += c.dur;
    });
  }
  return out;
})();
export const TOTAL_FRAMES = CUTS.reduce((a, c) => a + c.frames, 0);

export type CamSpec = {pos: V3; target: V3; fov?: number; to?: {pos?: V3; target?: V3; fov?: number}; shake?: number};
export type CamTable = Record<string, CamSpec | ((t: number) => CamSpec)>;

/** Resolve a camera for cut progress k (0…1); moves ease across the cut, shake adds handheld jitter. */
export const resolveCam = (table: CamTable, name: string, t: number, k: number) => {
  const raw = table[name];
  if (!raw) throw new Error(`no camera ${name}`);
  const spec = typeof raw === 'function' ? raw(t) : raw;
  const e = easeInOut(k) * 0.6 + k * 0.4;
  const pos = spec.to?.pos ? mix3(spec.pos, spec.to.pos, e) : spec.pos;
  const target = spec.to?.target ? mix3(spec.target, spec.to.target, e) : spec.target;
  const fov = spec.to?.fov ? lerp(spec.fov ?? 38, spec.to.fov, e) : spec.fov ?? 38;
  const sh = spec.shake ?? 0;
  const jitter: V3 = [noise(t * 3, 1) * sh, noise(t * 3, 2) * sh, 0];
  return {pos: [pos[0] + jitter[0], pos[1] + jitter[1], pos[2]] as V3, target, fov};
};

export type SceneProps = {t: number; cam: string; k: number};
