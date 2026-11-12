import type { VehicleProfile } from '../profile';

/**
 * BMW 320i (G20) — rear-wheel drive, 2.0 turbocharged four, ZF 8HP torque-converter
 * automatic. Deliberately included so that RWD behaviour is a first-class case.
 */
export const bmw320i: VehicleProfile = {
  id: 'bmw-320i',
  make: 'BMW',
  model: '320i',
  trim: 'G20 Sport Line',
  year: 2021,
  market: 'Europe',
  nameFa: 'بی‌ام‌و ۳۲۰i',
  nameEn: 'BMW 320i G20',
  bodyStyleFa: 'سدان',
  dataConfidence: 'estimated',

  dimensions: {
    length: 4.709,
    width: 1.827,
    height: 1.435,
    wheelbase: 2.851,
    trackFront: 1.587,
    trackRear: 1.604,
  },
  wheels: {
    radius: 0.33,
    width: 0.225,
    frontAxleZ: 1.4255,
    rearAxleZ: -1.4255,
    halfTrackFront: 0.7935,
    halfTrackRear: 0.802,
    tireSize: '225/45 R18',
  },

  massKg: 1545,
  weightDistributionFront: 0.51,
  centreOfMassHeightM: 0.53,
  yawInertiaKgM2: 2450,

  engine: {
    code: 'B48B20',
    displacementL: 1.998,
    cylinders: 4,
    aspiration: 'turbo',
    idleRpm: 700,
    redlineRpm: 6500,
    limiterRpm: 6800,
    torqueCurve: [
      { rpm: 900, nm: 200 },
      { rpm: 1350, nm: 300 },
      { rpm: 2000, nm: 300 },
      { rpm: 3000, nm: 300 },
      { rpm: 4000, nm: 300 },
      { rpm: 4800, nm: 285 },
      { rpm: 5500, nm: 260 },
      { rpm: 6500, nm: 225 },
      { rpm: 6800, nm: 200 },
    ],
    inertiaKgM2: 0.21,
    frictionTorqueNm: 15,
    frictionPer1000Rpm: 2.4,
    throttleLagSec: 0.07,
    maxBoostBar: 1.1,
  },

  drivetrain: {
    layout: 'RWD',
    frontTorqueShare: 0,
    finalDrive: 3.077,
    efficiency: 0.91,
  },

  transmission: {
    kind: 'torqueConverter',
    labelFa: 'اتوماتیک ۸ سرعته',
    gearRatios: [5.0, 3.2, 2.143, 1.72, 1.314, 1.0, 0.822, 0.64],
    reverseRatio: 3.456,
    shiftTimeSec: 0.18,
    torqueConverter: {
      stallK: 172,
      couplingK: 214,
      stallTorqueRatio: 2.05,
      lockupSpeedRatio: 0.86,
      lockupMinSpeedMs: 6,
    },
  },

  tires: {
    muDry: 1.0,
    muWet: 0.7,
    muDirt: 0.5,
    muGravel: 0.44,
    peakSlipRatio: 0.1,
    peakSlipAngleDeg: 8,
    loadSensitivity: 0.11,
    rollingResistance: 0.0105,
    wheelInertiaKgM2: 1.35,
    optimalTempC: 80,
  },

  suspension: {
    front: { springRateNm: 33_000, dampingNs: 2_900, travelM: 0.15, antiRollNm: 17_000 },
    rear: { springRateNm: 30_000, dampingNs: 2_700, travelM: 0.15, antiRollNm: 9_500 },
    rideHeightM: 0.14,
  },

  brakes: {
    frontTorqueNm: 2_900,
    rearTorqueNm: 1_500,
    frontBias: 0.66,
    abs: true,
    handbrakeTorqueNm: 1_800,
  },

  assists: { abs: true, tcs: true, esc: true, hillStart: true },

  aero: { dragCoeff: 0.27, frontalAreaM2: 2.19, downforceCoeff: 0.05 },

  steering: { maxAngleDeg: 35, speedSensitivityKph: 130, ratio: 15.1 },

  fuel: { tankLitres: 59, bsfcGPerKwh: 255, idleLph: 0.65 },

  performance: { zeroTo100Sec: 7.1, topSpeedKph: 240 },

  visual: {
    model: 'bmw-320i.glb',
    scale: 1,
    paints: [
      { id: 'stock', nameFa: 'سفید آلپاین', hex: '#f0f2f2', metallic: 0.2, roughness: 0.28 },
      { id: 'graphite', nameFa: 'خاکستری معدنی', hex: '#4a5055', metallic: 0.9, roughness: 0.24 },
      { id: 'black', nameFa: 'مشکی براق', hex: '#101314', metallic: 0.7, roughness: 0.2 },
      { id: 'blue', nameFa: 'آبی تیره', hex: '#1b3a5a', metallic: 0.85, roughness: 0.24 },
      { id: 'green', nameFa: 'سبز کارخانه', hex: '#1f3b33', metallic: 0.8, roughness: 0.26 },
    ],
    rims: [
      { id: 'stock', nameFa: 'آلیاژی ۱۸ اینچ', hex: '#c0c6cb' },
      { id: 'sport', nameFa: 'اسپرت تیره', hex: '#7c838a' },
    ],
    wheelAnchors: [
      [-0.7935, 0.33, 1.4255],
      [0.7935, 0.33, 1.4255],
      [-0.802, 0.33, -1.4255],
      [0.802, 0.33, -1.4255],
    ],
    cockpitEye: [0.05, 1.12, 0.37],
  },

  audio: {
    firingHzAt1000: 33.3,
    timbre: 'turbo4',
    exhaustGain: 0.55,
    intakeGain: 0.55,
  },

  sources: [
    { label: 'BMW 320i G20 technical data (press kit)', confidence: 'estimated' },
    { label: 'ZF 8HP gear ratios and final drive', url: 'https://en.wikipedia.org/wiki/ZF_8HP_transmission', confidence: 'estimated' },
  ],
};
