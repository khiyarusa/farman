/** Small, allocation-free math helpers used across simulation and UI. */

export const TAU = Math.PI * 2;

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, v: number): number {
  return a === b ? 0 : clamp01((v - a) / (b - a));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = inverseLerp(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = inverseLerp(edge0, edge1, x);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Frame-rate independent exponential smoothing. `halfLife` in seconds. */
export function damp(current: number, target: number, halfLife: number, dt: number): number {
  if (halfLife <= 0) return target;
  const k = 1 - Math.pow(2, -dt / halfLife);
  return current + (target - current) * k;
}

export function moveTowards(current: number, target: number, maxDelta: number): number {
  const d = target - current;
  return Math.abs(d) <= maxDelta ? target : current + Math.sign(d) * maxDelta;
}

export function wrapAngle(a: number): number {
  a = (a + Math.PI) % TAU;
  if (a < 0) a += TAU;
  return a - Math.PI;
}

export function signedAngleDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

export function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

export function rad2deg(r: number): number {
  return (r * 180) / Math.PI;
}

export function sum(values: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < values.length; i++) s += values[i] as number;
  return s;
}

export function avg(values: readonly number[]): number {
  return values.length ? sum(values) / values.length : 0;
}

/**
 * Monotone cubic (Fritsch–Carlson) interpolation over a sorted table.
 * Used for engine torque curves so interpolation never overshoots.
 */
export function monotoneCubic(
  xs: readonly number[],
  ys: readonly number[],
  x: number,
): number {
  const n = xs.length;
  if (n === 0) return 0;
  if (n === 1) return ys[0] as number;
  const x0 = xs[0] as number;
  const xn = xs[n - 1] as number;
  if (x <= x0) return ys[0] as number;
  if (x >= xn) return ys[n - 1] as number;

  // Locate the interval.
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((xs[mid] as number) <= x) lo = mid;
    else hi = mid;
  }

  const h = (xs[hi] as number) - (xs[lo] as number);
  if (h <= 0) return ys[lo] as number;
  const t = (x - (xs[lo] as number)) / h;

  const d0 = (ys[lo] as number);
  const d1 = (ys[hi] as number);
  const m0 = slopeAt(xs, ys, lo);
  const m1 = slopeAt(xs, ys, hi);

  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * d0 + h10 * h * m0 + h01 * d1 + h11 * h * m1;
}

function slopeAt(xs: readonly number[], ys: readonly number[], i: number): number {
  const n = xs.length;
  if (i === 0) {
    return ((ys[1] as number) - (ys[0] as number)) / ((xs[1] as number) - (xs[0] as number));
  }
  if (i === n - 1) {
    return (
      ((ys[n - 1] as number) - (ys[n - 2] as number)) /
      ((xs[n - 1] as number) - (xs[n - 2] as number))
    );
  }
  const dPrev =
    ((ys[i] as number) - (ys[i - 1] as number)) / ((xs[i] as number) - (xs[i - 1] as number));
  const dNext =
    ((ys[i + 1] as number) - (ys[i] as number)) / ((xs[i + 1] as number) - (xs[i] as number));
  if (dPrev * dNext <= 0) return 0;
  const m = (dPrev + dNext) * 0.5;
  const limit = 3 * Math.min(Math.abs(dPrev), Math.abs(dNext));
  return clamp(m, -limit, limit);
}
