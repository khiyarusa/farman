/** Road surface types used by tire grip and audio. */

export type SurfaceKind = 'asphalt' | 'dirt' | 'gravel' | 'sand' | 'grass' | 'tunnel';

export interface SurfaceSample {
  kind: SurfaceKind;
  /** 0 = dry, 1 = standing water. */
  wet: number;
}

export interface SurfaceProvider {
  sample(x: number, z: number): SurfaceSample;
  /** Ground height at a world position, metres. */
  heightAt(x: number, z: number): number;
  /** Unit surface normal, used for suspension and tire force direction. */
  normalAt?(x: number, z: number): { x: number; y: number; z: number };
}

export const DRY_SURFACE: SurfaceProvider = {
  sample: () => ({ kind: 'asphalt', wet: 0 }),
  heightAt: () => 0,
  normalAt: () => ({ x: 0, y: 1, z: 0 }),
};
