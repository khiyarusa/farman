import type { VehicleProfile } from '../profile';

/**
 * Saipa Pride 131 — the Iranian everyman sedan.
 * 1.3 litre 8-valve four, front-wheel drive, five-speed manual, no driver aids.
 * Reference data: see docs/VEHICLE_DATA_SOURCES.md (confidence: mixed verified/estimated).
 */
export const pride131: VehicleProfile = {
  id: 'pride-131',
  make: 'Saipa',
  model: 'Pride 131',
  trim: 'LX',
  year: 2008,
  market: 'Iran',
  nameFa: 'سایپا پراید ۱۳۱',
  nameEn: 'Saipa Pride 131',
  bodyStyleFa: 'سدان',
  dataConfidence: 'estimated',

  dimensions: {
    length: 3.942,
    width: 1.605,
    height: 1.441,
    wheelbase: 2.342,
    trackFront: 1.39,
    trackRear: 1.35,
  },
  wheels: {
    radius: 0.286,
    width: 0.165,
    frontAxleZ: 1.171,
    rearAxleZ: -1.171,
    halfTrackFront: 0.695,
    halfTrackRear: 0.675,
    tireSize: '165/65 R13',
  },

  massKg: 895,
  weightDistributionFront: 0.61,
  centreOfMassHeightM: 0.52,
  yawInertiaKgM2: 1250,

  engine: {
    code: 'M13 / 131',
    displacementL: 1.323,
    cylinders: 4,
    aspiration: 'na',
    idleRpm: 850,
    redlineRpm: 6000,
    limiterRpm: 6400,
    torqueCurve: [
      { rpm: 900, nm: 62 },
      { rpm: 1500, nm: 78 },
      { rpm: 2200, nm: 90 },
      { rpm: 3000, nm: 100 },
      { rpm: 3800, nm: 96 },
      { rpm: 4600, nm: 88 },
      { rpm: 5400, nm: 76 },
      { rpm: 6000, nm: 64 },
    ],
    inertiaKgM2: 0.16,
    frictionTorqueNm: 12,
    frictionPer1000Rpm: 2.6,
    throttleLagSec: 0.09,
    maxBoostBar: 0,
  },

  drivetrain: {
    layout: 'FWD',
    frontTorqueShare: 1,
    finalDrive: 4.06,
    efficiency: 0.92,
  },

  transmission: {
    kind: 'manual',
    labelFa: 'دستی ۵ سرعته',
    gearRatios: [3.667, 2.043, 1.323, 0.943, 0.743],
    reverseRatio: 3.667,
    shiftTimeSec: 0.28,
    clutch: {
      maxTorqueNm: 165,
      bitePoint: 0.58,
      engagementRange: 0.3,
    },
  },

  tires: {
    muDry: 0.9,
    muWet: 0.62,
    muDirt: 0.55,
    muGravel: 0.48,
    peakSlipRatio: 0.11,
    peakSlipAngleDeg: 7,
    loadSensitivity: 0.14,
    rollingResistance: 0.0125,
    wheelInertiaKgM2: 0.85,
    optimalTempC: 70,
  },

  suspension: {
    front: { springRateNm: 24_000, dampingNs: 2_100, travelM: 0.17, antiRollNm: 9_000 },
    rear: { springRateNm: 20_000, dampingNs: 1_800, travelM: 0.16, antiRollNm: 5_500 },
    rideHeightM: 0.155,
  },

  brakes: {
    frontTorqueNm: 1_450,
    rearTorqueNm: 900,
    frontBias: 0.66,
    abs: false,
    handbrakeTorqueNm: 1_100,
  },

  assists: { abs: false, tcs: false, esc: false, hillStart: false },

  aero: { dragCoeff: 0.36, frontalAreaM2: 1.94, downforceCoeff: 0.02 },

  steering: { maxAngleDeg: 38, speedSensitivityKph: 140, ratio: 17 },

  fuel: { tankLitres: 37, bsfcGPerKwh: 285, idleLph: 0.7 },

  performance: { zeroTo100Sec: 16.5, topSpeedKph: 160 },

  visual: {
    model: 'pride-131.glb',
    scale: 1,
    paints: [
      { id: 'stock', nameFa: 'سفید صدفی', hex: '#eef1f2', metallic: 0.1, roughness: 0.35 },
      { id: 'silver', nameFa: 'نقره‌ای', hex: '#b9c0c6', metallic: 0.85, roughness: 0.28 },
      { id: 'graphite', nameFa: 'طوسی گرافیتی', hex: '#3d4348', metallic: 0.8, roughness: 0.3 },
      { id: 'green', nameFa: 'سبز تیره', hex: '#1d3a31', metallic: 0.7, roughness: 0.3 },
      { id: 'red', nameFa: 'قرمز', hex: '#8f1d20', metallic: 0.5, roughness: 0.3 },
    ],
    rims: [
      { id: 'stock', nameFa: 'فولادی', hex: '#9aa0a4' },
      { id: 'alloy', nameFa: 'آلیاژی', hex: '#c6ccd0' },
    ],
    wheelAnchors: [
      [-0.695, 0.286, 1.171],
      [0.695, 0.286, 1.171],
      [-0.675, 0.286, -1.171],
      [0.675, 0.286, -1.171],
    ],
    cockpitEye: [0.15, 1.13, 0.34],
  },

  audio: {
    firingHzAt1000: 26.7,
    timbre: 'small4',
    exhaustGain: 0.55,
    intakeGain: 0.75,
  },

  sources: [
    { label: 'Saipa Pride 131 overview (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Saipa_Pride', confidence: 'estimated' },
    { label: 'Pride 131 technical sheet — 1.3L 8V, 5MT, 895 kg', confidence: 'estimated', note: 'Iranian market data varies by year; figures normalised to 2008 LX' },
  ],
};
