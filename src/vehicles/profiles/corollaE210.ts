import type { VehicleProfile } from '../profile';

/**
 * Toyota Corolla 2.0 CVT (E210, US LE) â€” an international front-wheel-drive
 * automatic whose K120 gearbox is a belt CVT, not a stepped automatic.
 */
export const corollaE210: VehicleProfile = {
  id: 'corolla-e210',
  make: 'Toyota',
  model: 'Corolla',
  trim: '2.0 LE (E210)',
  year: 2021,
  market: 'North America',
  nameFa: 'ØªÙˆÛŒÙˆØªØ§ Ú©Ø±ÙˆÙ„Ø§ Û².Û°',
  nameEn: 'Toyota Corolla 2.0 CVT',
  bodyStyleFa: 'Ø³Ø¯Ø§Ù†',
  dataConfidence: 'estimated',

  dimensions: {
    length: 4.63,
    width: 1.78,
    height: 1.435,
    wheelbase: 2.7,
    trackFront: 1.53,
    trackRear: 1.545,
  },
  wheels: {
    radius: 0.316,
    width: 0.205,
    frontAxleZ: 1.35,
    rearAxleZ: -1.35,
    halfTrackFront: 0.765,
    halfTrackRear: 0.7725,
    tireSize: '205/55 R16',
  },

  massKg: 1360,
  weightDistributionFront: 0.6,
  centreOfMassHeightM: 0.54,
  yawInertiaKgM2: 2050,

  engine: {
    code: 'M20A-FKS',
    displacementL: 1.987,
    cylinders: 4,
    aspiration: 'na',
    idleRpm: 650,
    redlineRpm: 6800,
    limiterRpm: 7000,
    torqueCurve: [
      { rpm: 800, nm: 140 },
      { rpm: 1500, nm: 170 },
      { rpm: 2500, nm: 190 },
      { rpm: 4000, nm: 202 },
      { rpm: 4400, nm: 205 },
      { rpm: 5200, nm: 197 },
      { rpm: 6000, nm: 180 },
      { rpm: 6600, nm: 160 },
      { rpm: 7000, nm: 140 },
    ],
    inertiaKgM2: 0.17,
    frictionTorqueNm: 13,
    frictionPer1000Rpm: 2.2,
    throttleLagSec: 0.06,
    maxBoostBar: 0,
  },

  drivetrain: {
    layout: 'FWD',
    frontTorqueShare: 1,
    finalDrive: 4.09,
    efficiency: 0.9,
  },

  transmission: {
    kind: 'cvt',
    labelFa: 'CVT',
    gearRatios: [2.48, 1.8, 1.3, 0.95, 0.72, 0.55],
    reverseRatio: 2.1,
    shiftTimeSec: 0,
    cvt: {
      lowRatio: 2.48,
      highRatio: 0.4,
      targetRpmLight: 1450,
      targetRpmHeavy: 5200,
      ratioChangeRate: 2.2,
    },
  },

  tires: {
    muDry: 0.94,
    muWet: 0.66,
    muDirt: 0.52,
    muGravel: 0.45,
    peakSlipRatio: 0.1,
    peakSlipAngleDeg: 7.5,
    loadSensitivity: 0.12,
    rollingResistance: 0.0105,
    wheelInertiaKgM2: 1.1,
    optimalTempC: 75,
  },

  suspension: {
    front: { springRateNm: 29_000, dampingNs: 2_500, travelM: 0.16, antiRollNm: 13_000 },
    rear: { springRateNm: 24_000, dampingNs: 2_200, travelM: 0.15, antiRollNm: 7_000 },
    rideHeightM: 0.145,
  },

  brakes: {
    frontTorqueNm: 2_300,
    rearTorqueNm: 1_350,
    frontBias: 0.67,
    abs: true,
    handbrakeTorqueNm: 1_600,
  },

  assists: { abs: true, tcs: true, esc: true, hillStart: true },

  aero: { dragCoeff: 0.29, frontalAreaM2: 2.1, downforceCoeff: 0.03 },

  steering: { maxAngleDeg: 36, speedSensitivityKph: 120, ratio: 14.5 },

  fuel: { tankLitres: 47, bsfcGPerKwh: 245, idleLph: 0.55 },

  performance: { zeroTo100Sec: 7.5, topSpeedKph: 195 },

  visual: {
    model: 'corolla-e210.glb',
    scale: 1,
    paints: [
      { id: 'stock', nameFa: 'Ø³ÙÛŒØ¯ Ù…Ø±ÙˆØ§Ø±ÛŒØ¯', hex: '#f2f4f3', metallic: 0.25, roughness: 0.3 },
      { id: 'celestite', nameFa: 'Ø®Ø§Ú©Ø³ØªØ±ÛŒ Ø¢Ø¨ÛŒ', hex: '#7f8c93', metallic: 0.85, roughness: 0.26 },
      { id: 'black', nameFa: 'Ù…Ø´Ú©ÛŒ', hex: '#15181a', metallic: 0.6, roughness: 0.22 },
      { id: 'blue', nameFa: 'Ø¢Ø¨ÛŒ Ø§Ù‚ÛŒØ§Ù†ÙˆØ³ÛŒ', hex: '#1d3a55', metallic: 0.8, roughness: 0.26 },
      { id: 'red', nameFa: 'Ù‚Ø±Ù…Ø²', hex: '#9c2228', metallic: 0.55, roughness: 0.28 },
    ],
    rims: [
      { id: 'stock', nameFa: 'Ø¢Ù„ÛŒØ§Ú˜ÛŒ Ú©Ø§Ø±Ø®Ø§Ù†Ù‡', hex: '#c3c8cc' },
      { id: 'sport', nameFa: 'Ø§Ø³Ù¾Ø±Øª', hex: '#8e959b' },
    ],
    wheelAnchors: [
      [-0.765, 0.316, 1.35],
      [0.765, 0.316, 1.35],
      [-0.7725, 0.316, -1.35],
      [0.7725, 0.316, -1.35],
    ],
    cockpitEye: [0.1, 1.15, 0.36],
  },

  audio: {
    firingHzAt1000: 33.3,
    timbre: 'mid4',
    exhaustGain: 0.45,
    intakeGain: 0.6,
  },

  sources: [
    { label: 'Toyota Corolla E210 press kit / specification sheet', confidence: 'estimated' },
    { label: 'M20A-FKS engine data (169 hp, 151 lb-ft)', url: 'https://en.wikipedia.org/wiki/Toyota_Dynamic_Force_engine', confidence: 'estimated' },
  ],
};
