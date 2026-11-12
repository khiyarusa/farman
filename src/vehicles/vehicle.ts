import { clamp, clamp01, deg2rad, moveTowards, smoothstep } from '../core/math';
import type { PhysicsWorld, RapierBody } from '../physics/world';
import { quatFromYaw, yawFromQuat } from '../physics/world';
import type { SurfaceKind, SurfaceProvider } from '../world/surface';
import { Engine } from './engine';
import type { AssistSettings } from '../save/schema';
import type { VehicleProfile } from './profile';
import { effectiveMu, slipRatioAt, tireLongitudinalForce } from './tire';
import { Transmission, type GearSelector, type TransmissionOutput } from './transmission';

export interface DriveInput {
  throttle: number;
  brake: number;
  clutch: number;
  /** -1 = full left, +1 = full right. */
  steer: number;
  handbrake: number;
  selector: GearSelector;
}

export interface WheelTelemetry {
  omega: number;
  slipRatio: number;
  slipAngleDeg: number;
  normalForce: number;
  mu: number;
  suspLength: number;
  /** Vertical offset of the wheel centre relative to its authored anchor, metres. */
  travelOffset: number;
  contact: boolean;
  surface: SurfaceKind;
  tempC: number;
  wear: number;
  lateralForce: number;
}

export interface VehicleTelemetry {
  speedKph: number;
  speedMs: number;
  rpm: number;
  gear: number;
  gearLabel: string;
  throttle: number;
  brake: number;
  clutch: number;
  handbrake: number;
  steering: number;
  limiter: boolean;
  stalled: boolean;
  shifting: boolean;
  selector: GearSelector;
  fuelLitres: number;
  fuelFraction: number;
  fuelPer100Km: number;
  coolantC: number;
  odometerKm: number;
  engineTorque: number;
  enginePowerKw: number;
  drivelineRpm: number;
  absActive: boolean;
  tcsActive: boolean;
  escActive: boolean;
  bodyDamage: number;
  engineWear: number;
  yawRate: number;
  lateralG: number;
  longitudinalG: number;
  wheels: [WheelTelemetry, WheelTelemetry, WheelTelemetry, WheelTelemetry];
  groundSurface: SurfaceKind;
  onRoad: boolean;
}

export interface VehicleSpawn {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

type Vec3 = { x: number; y: number; z: number };

const AIR_DENSITY = 1.225;

/**
 * FARMAN vehicle dynamics.
 *
 * The chassis is a Rapier rigid body (collisions, yaw integration) whose height
 * and attitude are driven by the terrain. Handling comes from a force-based
 * bicycle model with per-wheel longitudinal slip, axle load transfer, combined
 * grip limits and per-vehicle powertrains. This keeps the simulation stable on
 * mobile and every force is inspectable in telemetry.
 *
 * Deliberately NOT modelled: a four-spring rigid-body suspension solver. Ride
 * height and body attitude are derived from the ground under each wheel, with
 * suspension travel used for wheel visuals and load transfer. This is stated in
 * TDD.md and in the in-game limitations list.
 */
export class VehicleSim {
  readonly profile: VehicleProfile;
  readonly body: RapierBody;
  readonly engine: Engine;
  readonly transmission: Transmission;

  input: DriveInput = {
    throttle: 0,
    brake: 0,
    clutch: 1,
    steer: 0,
    handbrake: 0,
    selector: 'D',
  };

  assists: AssistSettings;

  steerAngle = 0;
  fuelLitres: number;
  odometerKm: number;
  bodyDamage = 0;
  engineWear = 0;
  tireWear: [number, number, number, number];
  telemetry: VehicleTelemetry;
  lastDriveline: TransmissionOutput | null = null;

  private wheelOmega: [number, number, number, number] = [0, 0, 0, 0];
  private wheelSlip: [number, number, number, number] = [0, 0, 0, 0];
  private wheelSlipAngle: [number, number, number, number] = [0, 0, 0, 0];
  private wheelFz: [number, number, number, number] = [0, 0, 0, 0];
  private wheelMu: [number, number, number, number] = [1, 1, 1, 1];
  private wheelSurface: [SurfaceKind, SurfaceKind, SurfaceKind, SurfaceKind] = ['asphalt', 'asphalt', 'asphalt', 'asphalt'];
  private wheelTemp: [number, number, number, number] = [24, 24, 24, 24];
  private wheelLat: [number, number, number, number] = [0, 0, 0, 0];
  private wheelTravel: [number, number, number, number] = [0, 0, 0, 0];
  private absMod: [number, number, number, number] = [1, 1, 1, 1];
  private prevLongAccel = 0;
  private prevLatAccel = 0;
  private prevSpeed = 0;
  private prevLin: Vec3 = { x: 0, y: 0, z: 0 };
  private lastEngineTorque = 0;
  private tcsCut = 1;
  private absActive = false;
  private tcsActive = false;
  private escActive = false;
  private lastMalfunctionAt = -100;
  private readonly wheelRadius: number;
  private readonly halfTrackF: number;
  private readonly halfTrackR: number;
  private readonly axleFront: number;
  private readonly axleRear: number;
  private readonly rideHeight: number;

  constructor(
    profile: VehicleProfile,
    private readonly physics: PhysicsWorld,
    spawn: VehicleSpawn,
    state: {
      assists: AssistSettings;
      fuel: number;
      odometerKm?: number;
      tireWear?: [number, number, number, number];
      bodyDamage?: number;
      engineWear?: number;
    },
  ) {
    this.profile = profile;
    this.assists = { ...state.assists };
    this.fuelLitres = state.fuel;
    this.odometerKm = state.odometerKm ?? 0;
    this.bodyDamage = state.bodyDamage ?? 0;
    this.engineWear = state.engineWear ?? 0;
    this.tireWear = state.tireWear ? [...state.tireWear] : [0, 0, 0, 0];

    const p = profile;
    const R = physics.api;
    const mass = p.massKg;
    const L = p.dimensions.length;
    const W = p.dimensions.width;
    const H = p.dimensions.height;
    const comZ = p.dimensions.wheelbase * (p.weightDistributionFront - 0.5);

    this.wheelRadius = p.wheels.radius;
    this.halfTrackF = p.wheels.halfTrackFront;
    this.halfTrackR = p.wheels.halfTrackRear;
    this.axleFront = p.wheels.frontAxleZ;
    this.axleRear = p.wheels.rearAxleZ;
    this.rideHeight = 0;

    const ixx = (mass / 12) * (L * L + H * H);
    const iyy = p.yawInertiaKgM2 || (mass / 12) * (L * L + W * W);
    const izz = (mass / 12) * (W * W + H * H);

    this.body = physics.world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(spawn.x, spawn.y, spawn.z)
        .setRotation(quatFromYaw(spawn.yaw))
        .setLinearDamping(0.0)
        .setAngularDamping(0.35)
        .setGravityScale(0)
        .setCcdEnabled(true)
        .setCanSleep(false),
    );
    // Keep the chassis upright: yaw is simulated, roll/pitch are visual.
    this.body.setEnabledRotations(false, true, false, true);

    physics.world.createCollider(
      R.ColliderDesc.cuboid(W / 2 - 0.02, H * 0.32, L / 2 - 0.04)
        .setTranslation(0, H * 0.34, 0)
        .setMassProperties(
          mass,
          { x: 0, y: p.centreOfMassHeightM - H * 0.34, z: comZ },
          { x: ixx, y: iyy, z: izz },
          { x: 0, y: 0, z: 0, w: 1 },
        )
        .setFriction(0.4)
        .setRestitution(0.08),
      this.body,
    );

    this.engine = new Engine(profile);
    this.transmission = new Transmission(profile);
    this.input.clutch = 1;
    this.telemetry = this.buildTelemetry(0, 0);
  }

  get position(): Vec3 {
    return this.body.translation();
  }

  get yaw(): number {
    return yawFromQuat(this.body.rotation());
  }

  get speedMs(): number {
    return Math.abs(this.body.linvel().x * Math.sin(this.yaw) + this.body.linvel().z * Math.cos(this.yaw));
  }

  get speedKph(): number {
    return this.speedMs * 3.6;
  }

  get isManual(): boolean {
    return this.transmission.isManual;
  }

  get lastRefusedShiftAt(): number {
    return this.lastMalfunctionAt;
  }

  setPose(x: number, y: number, z: number, yaw: number): void {
    this.body.setTranslation({ x, y, z }, true);
    this.body.setRotation(quatFromYaw(yaw), true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.wheelOmega = [0, 0, 0, 0];
    this.steerAngle = 0;
    this.prevLin = { x: 0, y: 0, z: 0 };
    this.prevSpeed = 0;
    this.transmission.reset();
    this.engine.start();
    this.tcsCut = 1;
    this.absMod = [1, 1, 1, 1];
  }

  shift(dir: 1 | -1): 'ok' | 'needClutch' | 'tooFast' | 'invalid' | 'busy' {
    if (!this.isManual) return 'invalid';
    const t = this.transmission;
    let target = t.gear + dir;
    if (target > t.gearCount) target = t.gearCount;
    if (target < -1) target = -1;
    const result = t.selectManual(target, this.input.clutch, this.speedMs);
    if (result === 'needClutch') this.lastMalfunctionAt = Date.now() / 1000;
    return result;
  }

  selectGear(gear: number): 'ok' | 'needClutch' | 'tooFast' | 'invalid' | 'busy' {
    if (!this.isManual) return 'invalid';
    return this.transmission.selectManual(gear, this.input.clutch, this.speedMs);
  }

  cycleSelector(): GearSelector {
    if (this.isManual) return 'D';
    const order: GearSelector[] = ['P', 'R', 'N', 'D'];
    const idx = order.indexOf(this.input.selector);
    const next = order[(idx + 1) % order.length] as GearSelector;
    if (next === 'R' && Math.abs(this.speedMs) > 1.5) return this.input.selector;
    if (this.input.selector === 'R' && next !== 'R' && Math.abs(this.speedMs) > 1.5) return this.input.selector;
    this.input.selector = next;
    return next;
  }

  /** One fixed physics step. Rapier's world must be stepped afterwards. */
  step(dt: number, surface: SurfaceProvider): void {
    const p = this.profile;
    const q = this.body.rotation();
    const pos = this.body.translation();
    const lin = this.body.linvel();
    const ang = this.body.angvel();
    const fwd = rotate(q, { x: 0, y: 0, z: 1 });
    const right = rotate(q, { x: 1, y: 0, z: 0 });
    const speedMs = lin.x * fwd.x + lin.z * fwd.z;
    const vLat = lin.x * right.x + lin.z * right.z;
    const speedKph = speedMs * 3.6;
    const absSpeed = Math.abs(speedMs);

    this.body.resetForces(false);
    this.body.resetTorques(false);

    // ---- terrain follows the chassis ------------------------------------
    const centerGround = surface.heightAt(pos.x, pos.z);
    if (Math.abs(pos.y - centerGround) > 0.0005) {
      this.body.setTranslation({ x: pos.x, y: centerGround + this.rideHeight, z: pos.z }, true);
    }
    if (Math.abs(lin.y) > 0.001) this.body.setLinvel({ x: lin.x, y: 0, z: lin.z }, true);
    const normal = surface.normalAt?.(pos.x, pos.z) ?? { x: 0, y: 1, z: 0 };

    // ---- steering --------------------------------------------------------
    const speedFactor = 1 - 0.5 * smoothstep(25, 135, Math.abs(speedKph));
    const maxSteer = deg2rad(p.steering.maxAngleDeg) * speedFactor;
    this.steerAngle = moveTowards(this.steerAngle, clamp(this.input.steer, -1, 1) * maxSteer, deg2rad(320) * dt);

    // ---- load transfer ---------------------------------------------------
    const m = p.massKg;
    const g = 9.81;
    const h = p.centreOfMassHeightM;
    const wb = p.dimensions.wheelbase;
    const longAccelPrev = this.prevLongAccel;
    const transfer = clamp((m * longAccelPrev * h) / Math.max(1.6, wb), -m * g * 0.42, m * g * 0.42);
    const frontLoad = Math.max(0, m * g * p.weightDistributionFront - transfer);
    const rearLoad = Math.max(0, m * g * (1 - p.weightDistributionFront) + transfer);

    const lateralTransfer = clamp((m * this.prevLatAccel * h) / Math.max(1.2, p.dimensions.trackFront), -m * g * 0.3, m * g * 0.3);
    const frontLeftLoad = Math.max(0, frontLoad / 2 - lateralTransfer);
    const frontRightLoad = Math.max(0, frontLoad / 2 + lateralTransfer);
    const rearLeftLoad = Math.max(0, rearLoad / 2 - lateralTransfer * 0.85);
    const rearRightLoad = Math.max(0, rearLoad / 2 + lateralTransfer * 0.85);
    const fzByWheel: [number, number, number, number] = [frontLeftLoad, frontRightLoad, rearLeftLoad, rearRightLoad];

    // ---- surface + tire state -------------------------------------------
    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);
    const wheelOffsets: [number, number][] = [
      [-this.halfTrackF, this.axleFront],
      [this.halfTrackF, this.axleFront],
      [-this.halfTrackR, -this.axleRear],
      [this.halfTrackR, -this.axleRear],
    ];

    let anyContact = 0;
    let muFront = 0;
    let muRear = 0;
    for (let i = 0; i < 4; i++) {
      const off = wheelOffsets[i] as [number, number];
      // Local (x right, z forward) Ã¢â€ â€™ world.
      const wx = pos.x + off[0] * cos + off[1] * sin;
      const wz = pos.z - off[0] * sin + off[1] * cos;
      const wheelGround = surface.heightAt(wx, wz);
      const sample = surface.sample(wx, wz);
      this.wheelSurface[i] = sample.kind;
      const fz = fzByWheel[i] as number;
      this.wheelFz[i] = fz;
      this.wheelMu[i] = effectiveMu({
        profile: p,
        surface: sample,
        wear: this.tireWear[i] as number,
        tempC: this.wheelTemp[i] as number,
        normalForce: fz,
        referenceLoad: (m * g) / 4,
      });
      this.wheelTravel[i] = clamp(wheelGround - centerGround, -0.16, 0.16);
      if (fz > 10) anyContact++;
      if (i < 2) muFront += (this.wheelMu[i] as number) / 2;
      else muRear += (this.wheelMu[i] as number) / 2;
    }
    // Diagonal load transfer approximation for the lateral G read-out.
    this.wheelSlipAngle[0] = 0;

    // ---- traction control ------------------------------------------------
    const driven = this.drivenWheels();
    let maxDrivenSlip = 0;
    for (const i of driven) maxDrivenSlip = Math.max(maxDrivenSlip, Math.abs(this.wheelSlip[i] as number));
    const tcsAllowed = this.assists.tcs && p.assists.tcs && absSpeed > 0.6;
    if (tcsAllowed && maxDrivenSlip > 0.18 && this.input.throttle > 0.1) {
      this.tcsCut = Math.max(0.2, 1 - clamp01((maxDrivenSlip - 0.18) * 2) * 0.85);
      this.tcsActive = true;
    } else {
      this.tcsCut = Math.min(1, this.tcsCut + dt * 1.6);
      this.tcsActive = false;
    }
    const throttle = clamp01(this.input.throttle) * (tcsAllowed ? this.tcsCut : 1);

    // ---- gearbox + engine ------------------------------------------------
    const transOut = this.transmission.step({
      dt,
      engineRpm: this.engine.rpm,
      engineOmega: this.engine.omega,
      engineTorque: this.lastEngineTorque,
      drivenWheelOmega: driven.reduce((sum, i) => sum + (this.wheelOmega[i] as number), 0) / driven.length,
      vehicleSpeedMs: speedMs,
      throttle,
      clutchPedal: this.effectiveClutch(),
      selector: this.input.selector,
      handbrake: this.input.handbrake > 0.4,
    });
    this.lastDriveline = transOut;
    const engineFrame = this.engine.update(dt, throttle, transOut.clutchTorque);
    this.lastEngineTorque = engineFrame.crankTorque;
    if (this.fuelLitres <= 0 && this.engine.running) this.engine.stall();

    // ---- longitudinal tire forces ---------------------------------------
    const brakeInput = clamp01(this.input.brake);
    const handbrakeInput = clamp01(this.input.handbrake);
    const frontBrakePerWheel = (p.brakes.frontTorqueNm * brakeInput) / 2;
    const rearBrakePerWheel = (p.brakes.rearTorqueNm * brakeInput) / 2 + (p.brakes.handbrakeTorqueNm * handbrakeInput) / 2;
    const driveShare = p.drivetrain.layout === 'AWD' ? p.drivetrain.frontTorqueShare : 1;

    let fxTotal = 0;
    let absActive = false;
    let wheelspin = 0;
    const wheelInertia = Math.max(0.4, p.tires.wheelInertiaKgM2);
    for (let i = 0; i < 4; i++) {
      const isFront = i < 2;
      const isDriven = driven.includes(i);
      const fz = this.wheelFz[i] as number;
      const mu = this.wheelMu[i] as number;
      const omega = this.wheelOmega[i] as number;
      const slip = slipRatioAt(omega, this.wheelRadius, speedMs);
      this.wheelSlip[i] = clamp(slip, -1.2, 1.2);
      const limit = mu * fz;

      let fx = fz > 0 ? tireLongitudinalForce(this.wheelSlip[i] as number, mu, fz, Math.max(0.03, p.tires.peakSlipRatio)) : 0;
      if (limit > 0 && Math.abs(fx) > limit) {
        wheelspin = Math.max(wheelspin, Math.abs(fx) / Math.max(1, limit) - 1);
        fx = Math.sign(fx) * limit;
      }

      // Brake torque at this wheel, with ABS pressure modulation.
      let brakeTorque = isFront ? frontBrakePerWheel : rearBrakePerWheel;
      if (this.assists.abs && p.brakes.abs && brakeTorque > 1 && absSpeed > 1) {
        if ((this.wheelSlip[i] as number) < -0.18) {
          this.absMod[i] = Math.max(0, (this.absMod[i] as number) - dt * 8);
        } else if ((this.absMod[i] as number) < 1) {
          this.absMod[i] = Math.min(1, (this.absMod[i] as number) + dt * 2.5);
        }
        if ((this.absMod[i] as number) < 0.9) absActive = true;
        brakeTorque *= this.absMod[i] as number;
      } else {
        this.absMod[i] = 1;
      }

      const driveTorque = isDriven
        ? transOut.wheelTorque * (p.drivetrain.layout === 'AWD' ? (isFront ? driveShare : 1 - driveShare) : 1)
        : 0;

      const direction = Math.abs(omega) > 1 ? Math.sign(omega) : Math.sign(speedMs) || 1;
      const rollingTorque = fz * p.tires.rollingResistance * this.wheelRadius * (Math.sign(speedMs) || 1);
      const netTorque = driveTorque - fx * this.wheelRadius - brakeTorque * direction - rollingTorque;
      let nextOmega = omega + (netTorque / wheelInertia) * dt;

      if (Math.sign(nextOmega) !== Math.sign(omega) && brakeTorque > 0.5 && Math.abs(omega) > 0.5) {
        nextOmega = 0;
      }
      if (Math.abs(speedMs) < 0.15 && driveTorque < 1 && brakeTorque > 0.5) nextOmega = 0;
      this.wheelOmega[i] = clamp(nextOmega, -320, 320);

      // Static holding force, so a braked stationary car does not creep.
      let groundForce = fx;
      if (Math.abs(speedMs) < 0.4 && brakeInput + handbrakeInput > 0.02) {
        groundForce += clamp(-speedMs * 2600 * (brakeInput + handbrakeInput), -limit, limit);
      }
      fxTotal += groundForce;

      // Heat and wear from sliding work.
      const slideWork = Math.abs(this.wheelSlip[i] as number) * Math.abs(speedMs) * 22;
      const temp = this.wheelTemp[i] as number;
      this.wheelTemp[i] = clamp(temp + (slideWork * (fz / 4000) - (temp - 24) * 0.08) * dt, 20, 145);
      this.tireWear[i] = clamp((this.tireWear[i] as number) + Math.abs(this.wheelSlip[i] as number) * Math.abs(speedMs) * 1.2e-7 * dt * 60, 0, 1);
      this.wheelLat[i] = 0;
    }
    this.absActive = absActive;
    void wheelspin;

    // ---- lateral tire forces (bicycle model) -----------------------------
    const vAbs = Math.max(1.2, absSpeed);
    const slipFront = Math.atan2(vLat + ang.y * this.axleFront, vAbs) - this.steerAngle * Math.sign(speedMs || 1);
    const slipRear = Math.atan2(vLat - ang.y * this.axleRear, vAbs);
    this.wheelSlipAngle[0] = (slipFront * 180) / Math.PI;
    this.wheelSlipAngle[1] = (slipFront * 180) / Math.PI;
    this.wheelSlipAngle[2] = (slipRear * 180) / Math.PI;
    this.wheelSlipAngle[3] = (slipRear * 180) / Math.PI;

    const peakAngle = Math.max(0.05, deg2rad(p.tires.peakSlipAngleDeg));
    const frontGrip = muFront * frontLoad;
    const rearGripBase = muRear * rearLoad;
    const rearGrip = rearGripBase * (handbrakeInput > 0.2 ? 0.55 : 1);
    const fyFront = -frontGrip * Math.tanh(slipFront / peakAngle);
    const fyRear = -rearGrip * Math.tanh(slipRear / peakAngle);
    this.wheelLat[0] = fyFront / 2;
    this.wheelLat[1] = fyFront / 2;
    this.wheelLat[2] = fyRear / 2;
    this.wheelLat[3] = fyRear / 2;

    // ---- yaw + stability -------------------------------------------------
    let yawTorque = fyFront * this.axleFront - fyRear * this.axleRear;
    this.escActive = false;
    if (this.assists.esc && p.assists.esc && absSpeed > 5 && this.assists.stability > 0.02) {
      const targetYaw = (speedMs * Math.tan(this.steerAngle)) / wb;
      const yawError = ang.y - targetYaw;
      if (Math.abs(yawError) > 0.18) {
        yawTorque -= clamp(yawError * 2200 * this.assists.stability, -3000, 3000);
        this.escActive = true;
      }
    }

    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    const forceWorld = {
      x: sinY * fxTotal + cosY * (fyFront + fyRear),
      y: 0,
      z: cosY * fxTotal - sinY * (fyFront + fyRear),
    };
    this.body.addForce(forceWorld, true);
    this.body.addTorque({ x: 0, y: yawTorque, z: 0 }, true);

    // ---- slope, drag, downforce ------------------------------------------
    const slopeForce = { x: normal.x * m * g, y: 0, z: normal.z * m * g };
    this.body.addForce(slopeForce, true);

    const v2 = lin.x * lin.x + lin.z * lin.z;
    if (v2 > 0.01) {
      const speed = Math.sqrt(v2);
      const drag = 0.5 * AIR_DENSITY * p.aero.dragCoeff * p.aero.frontalAreaM2 * v2;
      this.body.addForce({ x: (-drag * lin.x) / speed, y: 0, z: (-drag * lin.z) / speed }, true);
    }

    // ---- impact damage ----------------------------------------------------
    const dvx = lin.x - this.prevLin.x;
    const dvz = lin.z - this.prevLin.z;
    const impact = Math.sqrt(dvx * dvx + dvz * dvz);
    if (impact > 2.4 && absSpeed > 1.5) {
      const delta = (impact - 2.4) * 0.045;
      this.bodyDamage = clamp01(this.bodyDamage + delta);
      this.engineWear = clamp01(this.engineWear + delta * 0.12);
    }
    this.prevLin = { x: lin.x, y: lin.y, z: lin.z };

    if (engineFrame.rpm > p.engine.limiterRpm + 60 && this.transmission.gear > 0) {
      this.engineWear = clamp01(this.engineWear + dt * 0.012);
    }

    this.fuelLitres = Math.max(0, this.fuelLitres - (engineFrame.fuelLph / 3600) * dt);
    this.odometerKm += (absSpeed * dt) / 1000;

    const longAccel = (speedMs - this.prevSpeed) / Math.max(1e-3, dt);
    this.prevSpeed = speedMs;
    const latAccel = speedMs * ang.y;
    this.prevLongAccel = longAccel * 0.8 + this.prevLongAccel * 0.2;
    this.prevLatAccel = latAccel * 0.8 + this.prevLatAccel * 0.2;

    this.telemetry = this.buildTelemetry(engineFrame.rpm, speedMs, {
      throttle,
      brake: brakeInput,
      engineTorque: engineFrame.torque,
      enginePowerKw: engineFrame.powerKw,
      limiter: engineFrame.limiter,
      stalled: engineFrame.stalled,
      shifting: transOut.shifting,
      drivelineRpm: transOut.drivelineRpm,
      gear: transOut.gear,
      coolantC: engineFrame.coolantC,
      yawRate: ang.y,
      longAccel,
      latAccel,
      anyContact,
      vLat,
      wheelspin,
    });
  }

  private drivenWheels(): number[] {
    const layout = this.profile.drivetrain.layout;
    if (layout === 'FWD') return [0, 1];
    if (layout === 'RWD') return [2, 3];
    return [0, 1, 2, 3];
  }

  private effectiveClutch(): number {
    if (!this.isManual) return 0;
    const pedal = clamp01(this.input.clutch);
    if (!this.assists.autoClutch) return pedal;
    if (this.transmission.shiftTimer > 0 || this.transmission.gear <= 0) return 1;
    if (Math.abs(this.speedMs) > 2.4) return 0;
    const targetRpm = 1500 + clamp01(this.input.throttle) * 900;
    const error = targetRpm - this.engine.rpm;
    return Math.max(pedal, clamp(error / 420, 0, 1));
  }

  private buildTelemetry(
    rpm: number,
    speedMs: number,
    extra?: {
      throttle: number;
      brake: number;
      engineTorque: number;
      enginePowerKw: number;
      limiter: boolean;
      stalled: boolean;
      shifting: boolean;
      drivelineRpm: number;
      gear: number;
      coolantC: number;
      yawRate: number;
      longAccel: number;
      latAccel: number;
      anyContact: number;
      vLat: number;
      wheelspin: number;
    },
  ): VehicleTelemetry {
    const p = this.profile;
    const wheels = [0, 1, 2, 3].map((i) => {
      const fz = this.wheelFz[i] as number;
      const travel = this.wheelTravel[i] as number;
      return {
        omega: this.wheelOmega[i] as number,
        slipRatio: this.wheelSlip[i] as number,
        slipAngleDeg: this.wheelSlipAngle[i] as number,
        normalForce: fz,
        mu: this.wheelMu[i] as number,
        suspLength: 0.2 - travel,
        travelOffset: travel,
        contact: fz > 10,
        surface: this.wheelSurface[i] as SurfaceKind,
        tempC: this.wheelTemp[i] as number,
        wear: this.tireWear[i] as number,
        lateralForce: this.wheelLat[i] as number,
      };
    }) as [WheelTelemetry, WheelTelemetry, WheelTelemetry, WheelTelemetry];

    const fuelFraction = p.fuel.tankLitres > 0 ? this.fuelLitres / p.fuel.tankLitres : 0;
    return {
      speedKph: Math.abs(speedMs * 3.6),
      speedMs,
      rpm,
      gear: this.transmission.gear,
      gearLabel: this.gearLabel(this.transmission.gear),
      throttle: extra?.throttle ?? this.input.throttle,
      brake: extra?.brake ?? this.input.brake,
      clutch: this.effectiveClutch(),
      handbrake: this.input.handbrake,
      steering: this.steerAngle,
      limiter: extra?.limiter ?? false,
      stalled: extra?.stalled ?? !this.engine.running,
      shifting: extra?.shifting ?? this.transmission.shiftTimer > 0,
      selector: this.input.selector,
      fuelLitres: this.fuelLitres,
      fuelFraction,
      fuelPer100Km: this.fuelPer100(),
      coolantC: extra?.coolantC ?? 24,
      odometerKm: this.odometerKm,
      engineTorque: extra?.engineTorque ?? 0,
      enginePowerKw: extra?.enginePowerKw ?? 0,
      drivelineRpm: extra?.drivelineRpm ?? 0,
      absActive: this.absActive,
      tcsActive: this.tcsActive,
      escActive: this.escActive,
      bodyDamage: this.bodyDamage,
      engineWear: this.engineWear,
      yawRate: extra?.yawRate ?? 0,
      lateralG: (extra?.latAccel ?? 0) / 9.81,
      longitudinalG: (extra?.longAccel ?? 0) / 9.81,
      wheels,
      groundSurface: this.wheelSurface[0],
      onRoad: this.wheelSurface[0] === 'asphalt' || this.wheelSurface[0] === 'tunnel',
    };
  }

  private fuelPer100(): number {
    if (this.odometerKm < 0.02) return 0;
    const used = (this.profile.fuel.tankLitres * 0.75 - this.fuelLitres) / Math.max(0.02, this.odometerKm);
    return clamp(used * 100, 0, 60);
  }

  private gearLabel(gear: number): string {
    if (this.isManual) {
      if (gear === 0) return 'N';
      if (gear === -1) return 'R';
      return String(gear);
    }
    if (this.input.selector === 'P') return 'P';
    if (this.input.selector === 'N') return 'N';
    if (this.input.selector === 'R') return 'R';
    return this.profile.transmission.kind === 'cvt' ? 'D' : String(Math.max(1, gear));
  }

  dispose(): void {
    this.physics.world.removeRigidBody(this.body);
  }
}

function rotate(q: { x: number; y: number; z: number; w: number }, v: Vec3): Vec3 {
  const qx = q.x;
  const qy = q.y;
  const qz = q.z;
  const qw = q.w;
  const ix = qw * v.x + qy * v.z - qz * v.y;
  const iy = qw * v.y + qz * v.x - qx * v.z;
  const iz = qw * v.z + qx * v.y - qy * v.x;
  const iw = -qx * v.x - qy * v.y - qz * v.z;
  return {
    x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
    y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
    z: iz * qw + iw * -qz + ix * -qy - iy * -qx,
  };
}
