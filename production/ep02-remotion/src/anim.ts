import {useCurrentFrame, useVideoConfig} from 'remotion';

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const outBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** 0 before `a`, 1 after `b`, eased in between. */
export const ramp = (t: number, a: number, b: number, e = easeInOut) =>
  e(clamp01((t - a) / (b - a)));

/** Rises over [a,b], holds, falls over [c,d]. */
export const pulse = (t: number, a: number, b: number, c: number, d: number) =>
  ramp(t, a, b) * (1 - ramp(t, c, d));

/** Seconds since the start of the current <Sequence>. */
export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

/** Deterministic pseudo-random in [0,1) — renders must be repeatable per frame. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth deterministic noise in [-1,1] for jitter / shaking. */
export const noise = (t: number, seed = 0) =>
  Math.sin(t * 12.9 + seed * 3.1) * 0.5 + Math.sin(t * 23.7 + seed * 7.7) * 0.3 + Math.sin(t * 41.3 + seed) * 0.2;

export type V3 = [number, number, number];
export const mix3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
