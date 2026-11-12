/** Deterministic pseudo-random utilities. All world/traffic randomness is seeded. */

export type Rng = {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  gaussian(mean?: number, stdDev?: number): number;
  fork(salt: number): Rng;
};

/** mulberry32 — small, fast, good enough for content generation. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    gaussian: (mean = 0, stdDev = 1) => {
      // Box–Muller, clamped to avoid absurd tails in content placement.
      const u = Math.max(1e-6, next());
      const v = next();
      const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
      return mean + Math.max(-3, Math.min(3, g)) * stdDev;
    },
    fork: (salt) => createRng((a ^ Math.imul(salt | 0, 0x9e3779b9)) >>> 0),
  };
  return rng;
}

export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Stable 2D value noise based on integer hashing (used for prop jitter). */
export function hash2(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
