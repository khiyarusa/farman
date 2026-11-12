import type { VehicleProfile } from '../profile';
import { validateProfile } from '../profile';
import { pride131 } from './pride131';
import { corollaE210 } from './corollaE210';
import { bmw320i } from './bmw320i';

export const VEHICLE_PROFILES: readonly VehicleProfile[] = [pride131, corollaE210, bmw320i];

const byId = new Map(VEHICLE_PROFILES.map((p) => [p.id, p]));

export function getProfile(id: string): VehicleProfile {
  const p = byId.get(id);
  if (!p) throw new Error(`Unknown vehicle profile: ${id}`);
  return p;
}

export function hasProfile(id: string): boolean {
  return byId.has(id);
}

/** Fail fast in development if a profile is structurally broken. */
export function assertProfilesValid(): void {
  for (const p of VEHICLE_PROFILES) {
    const errors = validateProfile(p);
    if (errors.length) throw new Error(`Invalid vehicle profile(s):\n${errors.join('\n')}`);
  }
}

export { pride131, corollaE210, bmw320i };
