import { monotoneCubic } from '../core/math';
import type { VehicleProfile } from './profile';

/**
 * Engine model: torque curve + throttle lag + friction/pumping losses + limiter +
 * stall + a simplified thermal model.
 *
 * The engine is a rotational state (rpm) driven by indicated torque and the load
 * torque returned by the clutch/torque converter. It deliberately does not know
 * anything about wheels or gears.
 */

export interface EngineFrame {
  rpm: number;
  /** Net crank torque available to the driveline, NÂ·m (can be negative = engine braking). */
  torque: number;
  /** Crank torque before the clutch/converter load, N·m. */
  crankTorque: number;
  /** Indicated (combustion) torque before friction, NÂ·m. */
  indicated: number;
  /** Friction + pumping losses, NÂ·m. */
  friction: number;
  limiter: boolean;
  stalled: boolean;
  running: boolean;
  /** Fuel burn in litres/hour. */
  fuelLph: number;
  /** Coolant temperature, Â°C. */
  coolantC: number;
  /** 0..1 throttle after lag. */
  throttle: number;
  powerKw: number;
}

export class Engine {
  rpm: number;
  running = true;
  private stalledTimer = 0;
  private limiterTimer = 0;
  private throttleState = 0;
  private coolant = 22;
  private fuelLph = 0;
  readonly profile: VehicleProfile;

  constructor(profile: VehicleProfile) {
    this.profile = profile;
    this.rpm = profile.engine.idleRpm;
    this.coolant = 24;
  }

  get omega(): number {
    return (this.rpm * Math.PI) / 30;
  }

  get stalled(): boolean {
    return !this.running;
  }

  /** Wide-open-throttle crank torque at the given rpm. */
  peakTorqueAt(rpm: number): number {
    const curve = this.profile.engine.torqueCurve;
    return monotoneCubic(
      curve.map((p) => p.rpm),
      curve.map((p) => p.nm),
      rpm,
    );
  }

  stall(): void {
    this.running = false;
    this.stalledTimer = 0;
    this.rpm = 0;
  }

  /** Key-on restart; used by the tutorial and by the auto-restart safety net. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.rpm = Math.max(420, this.profile.engine.idleRpm * 0.7);
  }

  /**
   * @param dt seconds
   * @param throttlePedal 0..1
   * @param loadTorque NÂ·m demanded by the clutch/converter (positive slows the engine)
   */
  update(dt: number, throttlePedal: number, loadTorque: number): EngineFrame {
    const e = this.profile.engine;
    const pedal = Math.min(1, Math.max(0, throttlePedal));

    // Throttle body lag: a first-order filter, so stabs are not instantaneous.
    const lag = Math.max(0.001, e.throttleLagSec);
    this.throttleState += (pedal - this.throttleState) * Math.min(1, dt / lag);
    if (dt > 0.2) this.throttleState = pedal;

    if (this.limiterTimer > 0) this.limiterTimer -= dt;

    if (!this.running) {
      this.stalledTimer += dt;
      // Convenience restart: the game never leaves the player stranded in traffic.
      if (this.stalledTimer > 1.2) this.start();
      this.fuelLph = 0;
      this.coolant += ((24 - this.coolant) * dt) / 90;
      return {
        rpm: this.rpm,
        torque: 0,
        crankTorque: 0,
        indicated: 0,
        friction: 0,
        limiter: false,
        stalled: !this.running,
        running: this.running,
        fuelLph: 0,
        coolantC: this.coolant,
        throttle: this.throttleState,
        powerKw: 0,
      };
    }

    const maxTorque = Math.max(20, this.peakTorqueAt(this.rpm));

    // Rev limiter: fuel cut with hysteresis.
    let limiter = false;
    if (this.rpm >= e.limiterRpm) {
      this.limiterTimer = 0.09;
    }
    if (this.limiterTimer > 0) {
      limiter = true;
    }

    // Idle governor: hold idle with a small PI-ish torque bump.
    const idleError = e.idleRpm - this.rpm;
    const idleAssist =
      this.throttleState < 0.06 && idleError > 0 ? Math.min(38, idleError * 0.22) : 0;

    let indicated = limiter ? 0 : maxTorque * this.throttleState ** 1.12 + idleAssist;
    // Overheat protection: pull timing above 112 Â°C.
    if (this.coolant > 112) indicated *= Math.max(0.55, 1 - (this.coolant - 112) * 0.05);

    // Boost threshold: a turbo four makes little torque below ~1400 rpm at low throttle.
    if (e.aspiration === 'turbo' && this.rpm < 1400) {
      indicated *= 0.55 + 0.45 * (this.rpm / 1400);
    }

    const friction =
      e.frictionTorqueNm +
      e.frictionPer1000Rpm * (this.rpm / 1000) ** 1.35 +
      (1 - this.throttleState) * (6 + this.rpm * 0.011);

    const net = indicated - friction - loadTorque;

    // rpm integration: IÂ·dÏ‰/dt = T_net ; Ï‰ = rpmÂ·Ï€/30
    const inertia = Math.max(0.05, e.inertiaKgM2);
    const omega = this.omega + (net / inertia) * dt;
    this.rpm = Math.max(0, (omega * 30) / Math.PI);

    // Stall when the driveline drags the engine below ~380 rpm.
    if (this.rpm < 380) {
      this.stall();
    }
    if (this.rpm > e.limiterRpm + 150) {
      // Hard mechanical overspeed clamp (e.g. a money shift).
      this.rpm = e.limiterRpm + 150;
    }

    const powerKw = Math.max(0, net * this.omega) / 1000;
    const fuelGPerSec = (this.profile.fuel.bsfcGPerKwh * Math.max(0.6, powerKw)) / 3600 + 0.22;
    this.fuelLph = (fuelGPerSec * 3600) / 745; // petrol density â‰ˆ 0.745 kg/L

    // Thermal: warm-up + load heat vs. airflow cooling.
    const speedFactor = 0.5;
    const heat = 0.9 + Math.max(0, powerKw) * 0.22;
    const cooling = (this.coolant - 24) * (0.012 + 0.0035 * speedFactor);
    this.coolant += (heat - cooling) * dt * 0.55;
    this.coolant = Math.min(125, Math.max(20, this.coolant));

    return {
      rpm: this.rpm,
      torque: net,
      crankTorque: indicated - friction,
      indicated,
      friction,
      limiter,
      stalled: false,
      running: true,
      fuelLph: this.fuelLph,
      coolantC: this.coolant,
      throttle: this.throttleState,
      powerKw,
    };
  }
}
