/**
 * Central, immutable-ish configuration for FARMAN.
 * Values here are engineering decisions; per-vehicle behaviour lives in
 * `src/vehicles/profiles`, not in this file.
 */

export const APP = {
  name: 'FARMAN',
  nameFa: 'فرمان',
  version: '0.1.0',
  buildTag: 'v0.1.0-dev',
  appId: 'com.khiyarusa.farman',
} as const;

export const PHYSICS = {
  /** Fixed simulation frequency. 60 Hz is the documented target for mobile. */
  stepHz: 60,
  dt: 1 / 60,
  /** Never simulate more than this many steps in one rendered frame. */
  maxStepsPerFrame: 4,
  /** Drop the accumulated backlog if a frame took longer than this (tab resume). */
  maxFrameDelta: 0.25,
  gravity: -9.81,
  /** Rapier solver iterations; higher = more stable stacking, slower. */
  solverIterations: 6,
  linearDamping: 0.06,
  angularDamping: 0.12,
} as const;

export const RENDER = {
  /** Device-pixel-ratio ceiling per quality profile. */
  maxPixelRatio: { low: 1.0, balanced: 1.25, high: 1.6 },
  /** Percentage of the canvas backbuffer actually rendered (0.5 .. 1). */
  renderScale: { low: 0.72, balanced: 0.9, high: 1.0 },
  shadowMapSize: { low: 512, balanced: 1024, high: 2048 },
  shadowDistance: { low: 32, balanced: 55, high: 80 },
  fov: 0.92,
  nearClip: 0.25,
  farClip: 1400,
  /** Hard cap so a stalled GPU cannot drive unbounded catch-up work. */
  maxDeltaTime: 0.1,
} as const;

export const GAME = {
  /** Iranian rial amounts are shown in thousand-toman units in the UI. */
  startingCredits: 42_000_000,
  fuelPricePerLitre: 3_000,
  repairCostPerPercent: 900_000,
  serviceCost: 2_500_000,
  /** Mission rewards are scaled by score 0..1. */
  missionBaseReward: 6_000_000,
} as const;

export const WORLD = {
  /** Region footprint in metres (square, centred on origin). */
  size: 3600,
  /** Physics heightfield samples per side. */
  heightfieldResolution: 385,
  /** Road surface is drawn this far above the collision heightfield. */
  roadLift: 0.02,
} as const;

export const DEBUG = {
  /** Enabled by ?debug=1 or localStorage farman.debug=1, never in release builds. */
  enabled: false,
} as const;
