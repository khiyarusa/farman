import { describe, expect, it } from 'vitest';
import { monotoneCubic, clamp01, smoothstep } from '../src/core/math';
import { Engine } from '../src/vehicles/engine';
import { Transmission } from '../src/vehicles/transmission';
import { getProfile, VEHICLE_PROFILES, assertProfilesValid } from '../src/vehicles/profiles';
import { effectiveMu, slipRatioAt, tireLongitudinalForce } from '../src/vehicles/tire';
import { validateSave, createDefaultSave, SAVE_VERSION } from '../src/save/schema';

describe('math', () => {
  it('interpolates a torque curve without overshoot', () => {
    const xs = [1000, 2000, 3000, 4000];
    const ys = [100, 200, 180, 150];
    expect(monotoneCubic(xs, ys, 1000)).toBeCloseTo(100, 3);
    expect(monotoneCubic(xs, ys, 2000)).toBeCloseTo(200, 3);
    expect(monotoneCubic(xs, ys, 4000)).toBeCloseTo(150, 3);
    const mid = monotoneCubic(xs, ys, 2500);
    expect(mid).toBeGreaterThan(180);
    expect(mid).toBeLessThanOrEqual(200.001);
  });

  it('clamps and smooths', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(smoothstep(0, 10, 5)).toBeCloseTo(0.5, 5);
  });
});

describe('vehicle profiles', () => {
  it('contains three complete, valid vehicles', () => {
    expect(VEHICLE_PROFILES).toHaveLength(3);
    expect(() => assertProfilesValid()).not.toThrow();
    expect(getProfile('pride-131').transmission.kind).toBe('manual');
    expect(getProfile('corolla-e210').transmission.kind).toBe('cvt');
    expect(getProfile('bmw-320i').transmission.kind).toBe('torqueConverter');
  });

  it('has distinct drivetrains and gearbox counts', () => {
    expect(getProfile('pride-131').drivetrain.layout).toBe('FWD');
    expect(getProfile('bmw-320i').drivetrain.layout).toBe('RWD');
    expect(getProfile('bmw-320i').transmission.gearRatios).toHaveLength(8);
    expect(getProfile('corolla-e210').transmission.cvt).toBeTruthy();
  });
});

describe('engine', () => {
  it('produces crank torque on the profile curve', () => {
    const profile = getProfile('pride-131');
    const engine = new Engine(profile);
    let frame = engine.update(1 / 60, 1, 0);
    // Throttle lag means the first frame is still at idle fuelling.
    for (let i = 0; i < 12; i++) frame = engine.update(1 / 60, 1, 0);
    expect(frame.rpm).toBeGreaterThan(0);
    expect(frame.crankTorque).toBeGreaterThan(0);
    expect(engine.peakTorqueAt(3000)).toBeCloseTo(100, 0);
  });

  it('revs up under full throttle in neutral and respects the limiter', () => {
    const engine = new Engine(getProfile('corolla-e210'));
    for (let i = 0; i < 600; i++) engine.update(1 / 60, 1, 0);
    expect(engine.rpm).toBeGreaterThan(3000);
    expect(engine.rpm).toBeLessThanOrEqual(getProfile('corolla-e210').engine.limiterRpm + 160);
  });

  it('does not stall at idle with no load', () => {
    const engine = new Engine(getProfile('bmw-320i'));
    for (let i = 0; i < 300; i++) engine.update(1 / 60, 0.05, 0);
    expect(engine.running).toBe(true);
    expect(engine.rpm).toBeGreaterThan(500);
  });
});

describe('transmission', () => {
  const baseInput = {
    dt: 1 / 60,
    engineRpm: 2000,
    engineOmega: (2000 * Math.PI) / 30,
    engineTorque: 90,
    drivenWheelOmega: 0,
    vehicleSpeedMs: 0,
    throttle: 0.5,
    clutchPedal: 0,
    selector: 'D' as const,
    handbrake: false,
  };

  it('multiplies engine torque by the total ratio', () => {
    const profile = getProfile('pride-131');
    const t = new Transmission(profile);
    t.gear = 1;
    const out = t.step({ ...baseInput });
    const expected = (out.clutchTorque * 3.667 * 4.06 * 0.92) / 2;
    expect(out.wheelTorque).toBeCloseTo(expected, 3);
  });

  it('refuses a manual shift without the clutch', () => {
    const t = new Transmission(getProfile('pride-131'));
    t.gear = 0;
    expect(t.selectManual(1, 0.0, 0)).toBe('needClutch');
    expect(t.selectManual(1, 1.0, 0)).toBe('ok');
  });

  it('selects a higher gear automatically for the torque-converter car', () => {
    const t = new Transmission(getProfile('bmw-320i'));
    t.gear = 1;
    for (let i = 0; i < 200; i++) {
      t.step({ ...baseInput, engineRpm: 5200, engineOmega: (5200 * Math.PI) / 30, vehicleSpeedMs: 20, drivenWheelOmega: 20 / 0.33 });
    }
    expect(t.gear).toBeGreaterThan(1);
  });

  it('keeps a CVT ratio inside its belt range', () => {
    const t = new Transmission(getProfile('corolla-e210'));
    for (let i = 0; i < 600; i++) {
      t.step({ ...baseInput, engineRpm: 3000, engineOmega: (3000 * Math.PI) / 30, vehicleSpeedMs: 30, drivenWheelOmega: 30 / 0.316 });
    }
    const cvt = getProfile('corolla-e210').transmission.cvt!;
    expect(t.cvtRatio).toBeGreaterThanOrEqual(cvt.highRatio - 1e-6);
    expect(t.cvtRatio).toBeLessThanOrEqual(cvt.lowRatio + 1e-6);
  });
});

describe('tires', () => {
  it('peaks at the specified slip ratio and saturates', () => {
    const fz = 4000;
    const mu = 0.9;
    const peak = tireLongitudinalForce(0.1, mu, fz, 0.1);
    expect(peak).toBeGreaterThan(0.9 * mu * fz * 0.85);
    expect(peak).toBeLessThanOrEqual(mu * fz + 1);
    expect(tireLongitudinalForce(0, mu, fz, 0.1)).toBeCloseTo(0, 5);
    expect(Math.abs(tireLongitudinalForce(-0.1, mu, fz, 0.1))).toBeCloseTo(peak, 0);
    expect(Math.abs(tireLongitudinalForce(1.2, mu, fz, 0.1))).toBeLessThan(peak);
  });

  it('reduces grip on wet asphalt and with worn tires', () => {
    const profile = getProfile('bmw-320i');
    const dry = effectiveMu({ profile, surface: { kind: 'asphalt', wet: 0 }, wear: 0, tempC: profile.tires.optimalTempC, normalForce: 4000, referenceLoad: 4000 });
    const wet = effectiveMu({ profile, surface: { kind: 'asphalt', wet: 1 }, wear: 0, tempC: profile.tires.optimalTempC, normalForce: 4000, referenceLoad: 4000 });
    const worn = effectiveMu({ profile, surface: { kind: 'asphalt', wet: 0 }, wear: 1, tempC: profile.tires.optimalTempC, normalForce: 4000, referenceLoad: 4000 });
    expect(wet).toBeLessThan(dry);
    expect(worn).toBeLessThan(dry);
  });

  it('computes slip from wheel and vehicle speed', () => {
    expect(slipRatioAt(0, 0.3, 10)).toBeLessThan(0);
    expect(slipRatioAt(33.33, 0.3, 10)).toBeCloseTo(0, 3);
    expect(slipRatioAt(60, 0.3, 10)).toBeGreaterThan(0);
  });
});

describe('save schema', () => {
  it('creates a valid default save', () => {
    const save = createDefaultSave();
    expect(save.schemaVersion).toBe(SAVE_VERSION);
    expect(Object.keys(save.vehicles)).toHaveLength(3);
    expect(save.player.unlockedVehicleIds).toContain('pride-131');
    expect(save.settings.assists.abs).toBe(true);
  });

  it('repairs corrupted settings and vehicle state', () => {
    const raw = {
      schemaVersion: 99,
      settings: { graphics: 'ultra', masterVolume: 42, assists: { stability: 12 } },
      player: { credits: -50, selectedVehicleId: 'missing', unlockedVehicleIds: [] },
      vehicles: { 'pride-131': { fuel: -3, tireWear: [2, -1, 'x', 0] } },
      missions: { parking: { completed: 'yes', bestScore: 400 } },
    };
    const fixed = validateSave(raw);
    expect(fixed.schemaVersion).toBe(SAVE_VERSION);
    expect(fixed.settings.graphics).toBe('balanced');
    expect(fixed.settings.masterVolume).toBeLessThanOrEqual(1);
    expect(fixed.player.credits).toBe(0);
    expect(fixed.player.unlockedVehicleIds.length).toBeGreaterThan(0);
    expect(fixed.vehicles['pride-131']?.fuel).toBe(0);
    expect(fixed.missions.parking?.completed).toBe(false);
    expect(fixed.missions.parking?.bestScore).toBe(100);
  });

  it('falls back to defaults for junk input', () => {
    expect(validateSave(null).player.credits).toBeGreaterThan(0);
    expect(validateSave('nope').vehicles['bmw-320i']).toBeTruthy();
  });
});
