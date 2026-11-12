/**
 * Vehicle profile schema.
 *
 * Every number here is either verified from a cited source or an explicit
 * engineering estimate. `dataConfidence` and `sources` are surfaced in the
 * garage UI and in docs/VEHICLE_DATA_SOURCES.md.
 */

export type DrivetrainLayout = 'FWD' | 'RWD' | 'AWD';
export type TransmissionKind = 'manual' | 'torqueConverter' | 'cvt' | 'dct';
export type DataConfidence = 'verified' | 'estimated';

export interface TorquePoint {
  rpm: number;
  nm: number;
}

export interface SourceRef {
  label: string;
  url?: string;
  confidence: DataConfidence;
  note?: string;
}

export interface PaintOption {
  id: string;
  nameFa: string;
  hex: string;
  metallic: number;
  roughness: number;
}

export interface VehicleProfile {
  id: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  market: string;
  nameFa: string;
  nameEn: string;
  bodyStyleFa: string;
  dataConfidence: DataConfidence;

  /** Chassis dimensions in metres. */
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    trackFront: number;
    trackRear: number;
  };
  /** Wheel positions relative to the chassis centre (x right, y up, z forward). */
  wheels: {
    radius: number;
    width: number;
    /** Distance from the chassis centre to the axle along +Z (forward), in metres. */
    frontAxleZ: number;
    rearAxleZ: number;
    halfTrackFront: number;
    halfTrackRear: number;
    tireSize: string;
  };

  massKg: number;
  /** Fraction of static weight on the front axle, e.g. 0.61 for a FWD hatch. */
  weightDistributionFront: number;
  centreOfMassHeightM: number;
  yawInertiaKgM2: number;

  engine: {
    code: string;
    displacementL: number;
    cylinders: number;
    aspiration: 'na' | 'turbo' | 'supercharged';
    idleRpm: number;
    redlineRpm: number;
    limiterRpm: number;
    /** Crank torque at wide-open throttle. */
    torqueCurve: TorquePoint[];
    /** Rotational inertia of the engine + flywheel, kgÂ·mÂ². */
    inertiaKgM2: number;
    /** Friction torque at idle, NÂ·m (engine braking baseline). */
    frictionTorqueNm: number;
    /** Additional friction per 1000 rpm, NÂ·m. */
    frictionPer1000Rpm: number;
    /** Time constant for throttle response, seconds. */
    throttleLagSec: number;
    maxBoostBar: number;
  };

  drivetrain: {
    layout: DrivetrainLayout;
    /** Share of drive torque to the front axle (1 = FWD, 0 = RWD, 0..1 = AWD). */
    frontTorqueShare: number;
    finalDrive: number;
    efficiency: number;
  };

  transmission: {
    kind: TransmissionKind;
    labelFa: string;
    /** Forward gear ratios, index 0 = first gear. */
    gearRatios: number[];
    reverseRatio: number;
    shiftTimeSec: number;
    /** Manual only. */
    clutch?: {
      maxTorqueNm: number;
      /** Pedal travel fraction where the clutch starts to bite (0..1). */
      bitePoint: number;
      /** Fraction of travel over which it fully engages. */
      engagementRange: number;
    };
    /** Torque converter only. */
    torqueConverter?: {
      /** Capacity factor K at stall, (rad/s)/sqrt(NÂ·m). */
      stallK: number;
      /** Capacity factor at coupling point. */
      couplingK: number;
      /** Torque multiplication at stall. */
      stallTorqueRatio: number;
      lockupSpeedRatio: number;
      lockupMinSpeedMs: number;
    };
    /** CVT only. */
    cvt?: {
      lowRatio: number;
      highRatio: number;
      targetRpmLight: number;
      targetRpmHeavy: number;
      ratioChangeRate: number;
    };
  };

  tires: {
    muDry: number;
    muWet: number;
    muDirt: number;
    muGravel: number;
    peakSlipRatio: number;
    peakSlipAngleDeg: number;
    /** Load sensitivity exponent: mu_eff = mu * (Fz/Fz_ref)^-k. */
    loadSensitivity: number;
    rollingResistance: number;
    /** Wheel rotational inertia (tire + rim + brake), kgÂ·mÂ². */
    wheelInertiaKgM2: number;
    optimalTempC: number;
  };

  suspension: {
    front: { springRateNm: number; dampingNs: number; travelM: number; antiRollNm: number };
    rear: { springRateNm: number; dampingNs: number; travelM: number; antiRollNm: number };
    rideHeightM: number;
  };

  brakes: {
    frontTorqueNm: number;
    rearTorqueNm: number;
    frontBias: number;
    abs: boolean;
    /** Handbrake torque applied to the rear axle, NÂ·m. */
    handbrakeTorqueNm: number;
  };

  assists: { abs: boolean; tcs: boolean; esc: boolean; hillStart: boolean };

  aero: { dragCoeff: number; frontalAreaM2: number; downforceCoeff: number };

  steering: {
    maxAngleDeg: number;
    /** Steering authority reduction above this speed, km/h. */
    speedSensitivityKph: number;
    ratio: number;
  };

  fuel: {
    tankLitres: number;
    /** Brake-specific fuel consumption, g/kWh. */
    bsfcGPerKwh: number;
    idleLph: number;
  };

  performance: { zeroTo100Sec: number | null; topSpeedKph: number | null };

  visual: {
    /** GLB file under public/assets/vehicles. */
    model: string;
    /** Body mesh scale multiplier applied at load (models are authored in metres). */
    scale: number;
    paints: PaintOption[];
    /** Rim options as hex colours; geometry is shared per vehicle. */
    rims: { id: string; nameFa: string; hex: string }[];
    /** Model-space offsets (metres) for the four wheels, order FL, FR, RL, RR. */
    wheelAnchors: [number, number, number][];
    /** Optional interior camera eye point in model space. */
    cockpitEye?: [number, number, number];
  };

  audio: {
    /** Base engine frequency in Hz at 1000 rpm (firing frequency). */
    firingHzAt1000: number;
    /** Timbre family used by the synth engine. */
    timbre: 'small4' | 'mid4' | 'turbo4' | 'six';
    exhaustGain: number;
    intakeGain: number;
  };

  sources: SourceRef[];
}

const CONFIRM = { warn: console.warn };

/** Structural validation used at load time and in unit tests. */
export function validateProfile(p: VehicleProfile): string[] {
  const errors: string[] = [];
  const req = (cond: boolean, msg: string): void => {
    if (!cond) errors.push(`${p.id ?? '?'}: ${msg}`);
  };
  req(p.massKg > 300 && p.massKg < 4000, 'massKg out of range');
  req(p.dimensions.wheelbase > 1.5 && p.dimensions.wheelbase < 4, 'wheelbase out of range');
  req(p.wheels.radius > 0.2 && p.wheels.radius < 0.5, 'wheel radius out of range');
  req(p.engine.torqueCurve.length >= 3, 'torque curve needs >= 3 points');
  req(p.engine.idleRpm > 300, 'idle rpm too low');
  req(p.engine.redlineRpm > p.engine.idleRpm + 1000, 'redline must exceed idle');
  req(p.engine.limiterRpm >= p.engine.redlineRpm, 'limiter below redline');
  req(p.transmission.gearRatios.length >= 4, 'needs at least 4 gears');
  req(p.transmission.gearRatios.every((r) => r > 0.1 && r < 8), 'gear ratio out of range');
  req(p.drivetrain.finalDrive > 1 && p.drivetrain.finalDrive < 6, 'final drive out of range');
  req(p.drivetrain.frontTorqueShare >= 0 && p.drivetrain.frontTorqueShare <= 1, 'bad torque share');
  req(p.dimensions.trackFront > 1 && p.dimensions.trackFront < 2.2, 'front track out of range');
  req(p.brakes.frontBias > 0.3 && p.brakes.frontBias < 0.95, 'brake bias out of range');
  req(p.visual.wheelAnchors.length === 4, 'four wheel anchors required');
  if (p.transmission.kind === 'manual') req(!!p.transmission.clutch, 'manual needs clutch data');
  if (p.transmission.kind === 'torqueConverter')
    req(!!p.transmission.torqueConverter, 'TC automatic needs converter data');
  if (p.transmission.kind === 'cvt') req(!!p.transmission.cvt, 'CVT needs ratio data');

  // Torque curve must be strictly increasing in rpm.
  for (let i = 1; i < p.engine.torqueCurve.length; i++) {
    const a = p.engine.torqueCurve[i - 1] as TorquePoint;
    const b = p.engine.torqueCurve[i] as TorquePoint;
    if (b.rpm <= a.rpm) errors.push(`${p.id}: torque curve rpm not increasing at index ${i}`);
  }
  if (errors.length) CONFIRM.warn('[vehicle] invalid profile:', errors);
  return errors;
}
