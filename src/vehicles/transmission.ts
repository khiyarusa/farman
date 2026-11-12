import { clamp, clamp01, smoothstep } from '../core/math';
import type { VehicleProfile } from './profile';

/**
 * Gearbox + clutch / torque converter / CVT model.
 *
 * The transmission converts an engine speed and an engine torque into wheel
 * torque, and returns the reaction torque that loads the engine. It also owns
 * the automatic shift schedule, so the three automatic types behave differently
 * instead of sharing one generic script.
 */

export type GearSelector = 'P' | 'R' | 'N' | 'D';

export interface TransmissionInput {
  dt: number;
  engineRpm: number;
  engineOmega: number;
  /** Net engine torque (after friction), N·m. */
  engineTorque: number;
  /** Rotational speed of the driven wheels, rad/s (average). */
  drivenWheelOmega: number;
  vehicleSpeedMs: number;
  throttle: number;
  clutchPedal: number;
  selector: GearSelector;
  handbrake: boolean;
}

export interface TransmissionOutput {
  /** Actually engaged gear: -1 reverse, 0 neutral, 1..n forward. */
  gear: number;
  /** Combined gearbox × final drive ratio (0 in neutral). */
  totalRatio: number;
  /** Torque reaction on the engine, N·m. */
  clutchTorque: number;
  /** Torque delivered to *each* driven wheel, N·m. */
  wheelTorque: number;
  slipping: boolean;
  shifting: boolean;
  cvtRatio: number;
  tcLocked: boolean;
  /** True when a downshift would overspeed the engine. */
  overRevRisk: boolean;
  /** Engine speed the driveline would force in the current gear. */
  drivelineRpm: number;
}

const RPM_TO_RAD = Math.PI / 30;

export class Transmission {
  gear = 0;
  pendingGear = 0;
  shiftTimer = 0;
  private shiftCooldown = 0;
  cvtRatio: number;
  tcLocked = false;
  grind = false;
  private clutchPedalState = 1;
  private lastShiftAt = -100;

  constructor(private readonly profile: VehicleProfile) {
    const t = profile.transmission;
    this.cvtRatio = t.cvt ? t.cvt.lowRatio : 1;
  }

  get isManual(): boolean {
    return this.profile.transmission.kind === 'manual';
  }

  get gearCount(): number {
    return this.profile.transmission.gearRatios.length;
  }

  reset(): void {
    this.gear = 0;
    this.pendingGear = 0;
    this.shiftTimer = 0;
    this.shiftCooldown = 0;
    this.tcLocked = false;
    this.grind = false;
    this.clutchPedalState = 1;
    const cvt = this.profile.transmission.cvt;
    if (cvt) this.cvtRatio = cvt.lowRatio;
  }

  ratioFor(gear: number): number {
    const t = this.profile.transmission;
    if (gear === 0) return 0;
    const final = this.profile.drivetrain.finalDrive;
    if (gear === -1) return t.reverseRatio * final;
    if (t.kind === 'cvt') return this.cvtRatio * final;
    const r = t.gearRatios[gear - 1];
    return (r ?? 1) * final;
  }

  /** Attempt a manual gear selection. Returns a reason when refused. */
  selectManual(
    target: number,
    clutchPedal: number,
    vehicleSpeedMs: number,
  ): 'ok' | 'needClutch' | 'tooFast' | 'invalid' | 'busy' {
    if (!this.isManual) return 'invalid';
    if (this.shiftTimer > 0) return 'busy';
    if (target < -1 || target > this.gearCount) return 'invalid';
    if (target === this.gear) return 'ok';
    if (clutchPedal < 0.55) return 'needClutch';
    if ((target === -1 || this.gear === -1) && Math.abs(vehicleSpeedMs) > 1.4) return 'tooFast';
    this.pendingGear = target;
    this.shiftTimer = this.profile.transmission.shiftTimeSec;
    this.grind = false;
    return 'ok';
  }

  step(input: TransmissionInput): TransmissionOutput {
    const t = this.profile.transmission;
    const dt = input.dt;

    if (this.shiftTimer > 0) {
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        this.gear = this.pendingGear;
        this.shiftCooldown = 0.45;
      }
    }
    if (this.shiftCooldown > 0) this.shiftCooldown -= dt;

    if (t.kind !== 'manual') this.updateAutomatic(input);

    const ratio = this.ratioFor(this.gear);
    const drivelineOmega = input.drivenWheelOmega * ratio;
    const drivelineRpm = (drivelineOmega * 30) / Math.PI;

    // Engine overspeed from a bad downshift is a real, visible consequence.
    const overRevRisk =
      this.gear > 0 && drivelineRpm > this.profile.engine.limiterRpm + 200;

    if (ratio === 0 || this.shiftTimer > 0) {
      return {
        gear: this.gear,
        totalRatio: ratio,
        clutchTorque: 0,
        wheelTorque: 0,
        slipping: false,
        shifting: this.shiftTimer > 0,
        cvtRatio: this.cvtRatio,
        tcLocked: false,
        overRevRisk,
        drivelineRpm,
      };
    }

    const result =
      t.kind === 'manual'
        ? this.manualCoupling(input, drivelineOmega)
        : this.converterCoupling(input, drivelineOmega);

    const eff = this.profile.drivetrain.efficiency;
    // Clutch/converter output must be multiplied by the total gear ratio to reach the axle.
    const wheelTorque = (result.outputTorque * ratio * eff) / 2;

    return {
      gear: this.gear,
      totalRatio: ratio,
      clutchTorque: result.loadTorque,
      wheelTorque,
      slipping: result.slipping,
      shifting: this.shiftTimer > 0,
      cvtRatio: this.cvtRatio,
      tcLocked: result.locked,
      overRevRisk,
      drivelineRpm,
    };
  }

  private manualCoupling(
    input: TransmissionInput,
    drivelineOmega: number,
  ): { loadTorque: number; outputTorque: number; slipping: boolean; locked: boolean } {
    const clutch = this.profile.transmission.clutch;
    if (!clutch) {
      return { loadTorque: 0, outputTorque: 0, slipping: true, locked: false };
    }

    // Pedal 0 = fully engaged, 1 = fully disengaged.
    const pedal = clamp01(input.clutchPedal);
    // Real clutch actuation is not instantaneous (hydraulic release + driver modulation).
    const maxPedalStep = input.dt * 3.2;
    this.clutchPedalState += clamp(pedal - this.clutchPedalState, -maxPedalStep, maxPedalStep);
    const engagement = clamp01((clutch.bitePoint - this.clutchPedalState) / Math.max(0.01, clutch.bitePoint));
    const curved = smoothstep(0, 1, engagement);

    if (curved <= 0.001) {
      return { loadTorque: 0, outputTorque: 0, slipping: true, locked: false };
    }

    const capacity = clutch.maxTorqueNm * curved;
    const slip = input.engineOmega - drivelineOmega;

    // Locked clutch: transmit exactly what the engine produces, rigidly coupled.
    if (Math.abs(slip) < 0.9 && curved > 0.92) {
      const torque = clamp(input.engineTorque, -capacity, capacity);
      return { loadTorque: torque, outputTorque: torque, slipping: false, locked: true };
    }

    // Slipping: Coulomb friction with a smooth sign function.
    const torque = capacity * Math.tanh(slip * 1.4);
    return {
      loadTorque: torque,
      outputTorque: torque,
      slipping: true,
      locked: false,
    };
  }

  private converterCoupling(
    input: TransmissionInput,
    drivelineOmega: number,
  ): { loadTorque: number; outputTorque: number; slipping: boolean; locked: boolean } {
    const t = this.profile.transmission;
    const tc = t.torqueConverter;
    const maxTorque = Math.max(60, this.peakTorque());
    if (!tc) return { loadTorque: input.engineTorque, outputTorque: input.engineTorque, slipping: false, locked: true };

    const speedRatio = clamp01(drivelineOmega / Math.max(input.engineOmega, 2));
    const canLock =
      speedRatio > tc.lockupSpeedRatio &&
      Math.abs(input.vehicleSpeedMs) > tc.lockupMinSpeedMs &&
      this.shiftTimer <= 0;

    // Lock-up clutch with hysteresis so it does not chatter at the threshold.
    if (this.tcLocked && (speedRatio < tc.lockupSpeedRatio - 0.08 || Math.abs(input.vehicleSpeedMs) < 3)) {
      this.tcLocked = false;
    } else if (canLock && input.throttle < 0.88) {
      this.tcLocked = true;
    }

    if (this.tcLocked) {
      const torque = clamp(input.engineTorque, -maxTorque, maxTorque);
      return { loadTorque: torque, outputTorque: torque, slipping: false, locked: true };
    }

    const k = tc.stallK + (tc.couplingK - tc.stallK) * smoothstep(0, 1, speedRatio);
    const pump = Math.min(maxTorque * 1.9, (input.engineRpm / Math.max(60, k)) ** 2);
    const torqueRatio = tc.stallTorqueRatio + (1 - tc.stallTorqueRatio) * smoothstep(0, 0.85, speedRatio);
    const output = pump * torqueRatio;
    return { loadTorque: pump, outputTorque: output, slipping: speedRatio < 0.95, locked: false };
  }

  private peakTorque(): number {
    const curve = this.profile.engine.torqueCurve;
    let max = 0;
    for (const p of curve) max = Math.max(max, p.nm);
    return max;
  }

  private updateAutomatic(input: TransmissionInput): void {
    const t = this.profile.transmission;
    const absSpeed = Math.abs(input.vehicleSpeedMs);

    if (t.kind === 'cvt') {
      const cvt = t.cvt;
      if (!cvt) return;
      const throttle = clamp01(input.throttle);

      // Target engine speed rises with demand; the belt ratio then follows.
      const targetRpm = cvt.targetRpmLight + (cvt.targetRpmHeavy - cvt.targetRpmLight) * throttle ** 0.85;
      const wheelOmega = Math.max(1.5, Math.abs(input.drivenWheelOmega));
      const desired = clamp((targetRpm * RPM_TO_RAD) / (wheelOmega * this.profile.drivetrain.finalDrive), cvt.highRatio, cvt.lowRatio);

      // Ratio moves toward target at a bounded rate (belt sheave speed).
      const maxStep = cvt.ratioChangeRate * input.dt;
      const delta = clamp(desired - this.cvtRatio, -maxStep, maxStep);
      this.cvtRatio = clamp(this.cvtRatio + delta, cvt.highRatio, cvt.lowRatio);
      this.gear = 1;
      this.pendingGear = 1;
      return;
    }

    // Conventional automatic / DCT: choose a gear from speed, throttle and rpm.
    if (input.selector === 'P' || input.selector === 'N') {
      this.gear = 0;
      this.pendingGear = 0;
      return;
    }
    if (input.selector === 'R') {
      this.gear = -1;
      this.pendingGear = -1;
      return;
    }

    const n = this.gearCount;
    if (this.gear <= 0) {
      this.gear = 1;
      this.pendingGear = 1;
      return;
    }

    if (this.shiftTimer > 0 || this.shiftCooldown > 0) return;
    if (absSpeed < 0.5 && input.throttle < 0.05) return;

    const upRpm = 2050 + 2950 * input.throttle;
    const downRpm = 1120 + 950 * input.throttle;
    const kickdown = input.throttle > 0.86 && input.engineRpm < 2400 && absSpeed > 4;

    if (kickdown && this.gear > 1) {
      this.shiftTo(this.gear - 1);
    } else if (input.engineRpm > upRpm && this.gear < n) {
      this.shiftTo(this.gear + 1);
    } else if (input.engineRpm < downRpm && this.gear > 1) {
      this.shiftTo(this.gear - 1);
    }
  }

  private shiftTo(gear: number): void {
    this.pendingGear = gear;
    this.shiftTimer = this.profile.transmission.shiftTimeSec;
    this.lastShiftAt = this.shiftTimer;
    this.tcLocked = false;
  }

  get lastShiftAge(): number {
    return this.lastShiftAt;
  }
}
