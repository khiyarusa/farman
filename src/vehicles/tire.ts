import { clamp } from '../core/math';
import type { VehicleProfile } from './profile';
import type { SurfaceKind, SurfaceSample } from '../world/surface';

/**
 * Quasi-static tire model.
 *
 * Longitudinal force follows a simplified Magic Formula with a single peak at
 * `peakSlip`. Lateral force is produced by the physics backend's raycast vehicle
 * friction, using the same friction coefficient, so longitudinal and lateral
 * demand share one grip budget.
 *
 * Limitations (documented, not hidden): there is no full transient slip-curve
 * (relaxation length) model; combined-slip is approximated by the friction
 * ellipse inside the physics backend.
 */

export function tireLongitudinalForce(
  slipRatio: number,
  mu: number,
  normalForce: number,
  peakSlip: number,
): number {
  if (normalForce <= 0) return 0;
  const d = mu * normalForce;
  if (d <= 0) return 0;
  const c = 1.62;
  const b = Math.tan(Math.PI / (2 * c)) / Math.max(0.02, peakSlip);
  const e = 0.32;
  const s = clamp(slipRatio, -1.2, 1.2);
  const bs = b * s;
  return d * Math.sin(c * Math.atan(bs - e * (bs - Math.atan(bs))));
}

export function slipRatioAt(wheelOmega: number, radius: number, longitudinalSpeed: number): number {
  const denom = Math.max(1.6, Math.abs(longitudinalSpeed));
  return (wheelOmega * radius - longitudinalSpeed) / denom;
}

const SURFACE_BASE: Record<SurfaceKind, number> = {
  asphalt: 1,
  tunnel: 1,
  dirt: 0.62,
  gravel: 0.55,
  sand: 0.45,
  grass: 0.4,
};

export interface MuInput {
  profile: VehicleProfile;
  surface: SurfaceSample;
  /** 0 = new, 1 = fully worn. */
  wear: number;
  /** Tire temperature in °C. */
  tempC: number;
  normalForce: number;
  referenceLoad: number;
}

/** Effective friction coefficient for one tire. */
export function effectiveMu(input: MuInput): number {
  const t = input.profile.tires;
  const base =
    input.surface.kind === 'asphalt' || input.surface.kind === 'tunnel'
      ? t.muDry + (t.muWet - t.muDry) * clamp(input.surface.wet, 0, 1)
      : t.muDry * SURFACE_BASE[input.surface.kind];

  const wearFactor = 1 - clamp(input.wear, 0, 1) * 0.38;

  // Tire temperature window: cold tires (first corner) and overheated tires grip less.
  const tempDelta = (input.tempC - t.optimalTempC) / 55;
  const tempFactor = 1 - 0.22 * Math.min(1, tempDelta * tempDelta);

  // Load sensitivity: doubling the load does not double the grip.
  const loadRatio = input.referenceLoad > 1 ? input.normalForce / input.referenceLoad : 1;
  const loadFactor = Math.pow(clamp(loadRatio, 0.25, 3), -t.loadSensitivity);

  return clamp(base * wearFactor * tempFactor * loadFactor, 0.22, 1.35);
}
