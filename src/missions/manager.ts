import { clamp, clamp01 } from '../core/math';
import type { MissionDef } from './definitions';
import type { VehicleSim, VehicleTelemetry } from '../vehicles/vehicle';

export interface MissionResult {
  success: boolean;
  score: number;
  elapsedSec: number;
  distanceKm: number;
  collisions: number;
  fuelUsedL: number;
  penalty: number;
  reward: number;
  reasonFa: string;
}

interface MissionContext {
  startX: number;
  startZ: number;
  yaw: number;
  forwardX: number;
  forwardZ: number;
}

/**
 * One mission instance. Missions are optional and never block free drive.
 * Each kind has its own objective evaluation instead of a generic timer.
 */
export class MissionManager {
  status: 'running' | 'success' | 'failed' = 'running';
  elapsed = 0;
  distanceKm = 0;
  collisions = 0;
  fuelUsedL = 0;
  penalty = 0;
  private lastDamage = 0;
  private lastSpeed = 0;
  private speedingTime = 0;
  private offRoadTime = 0;
  private bestScore = 0;
  private ctx: MissionContext;
  private startFuel: number;
  private failReason = '';
  private stoppedTime = 0;

  constructor(
    readonly def: MissionDef,
    private readonly vehicle: VehicleSim,
    spawn: { x: number; z: number; yaw: number },
  ) {
    this.ctx = {
      startX: spawn.x,
      startZ: spawn.z,
      yaw: spawn.yaw,
      forwardX: Math.sin(spawn.yaw),
      forwardZ: Math.cos(spawn.yaw),
    };
    this.startFuel = vehicle.fuelLitres;
    this.lastDamage = vehicle.bodyDamage;
    this.lastSpeed = 0;
  }

  get timeLeft(): number | null {
    if (!this.def.parTimeSec) return null;
    return Math.max(0, this.def.parTimeSec - this.elapsed);
  }

  get objectiveText(): string {
    switch (this.def.kind) {
      case 'parking':
        return 'در محدوده پارک، کامل توقف کن';
      case 'hillStart':
        return `۲۵ متر در سربالایی پیش برو (${Math.round(this.forwardDistance())} متر)`;
      case 'traffic':
        return `۶۰ ثانیه بدون برخورد و بدون سرعت غیرمجاز`;
      case 'braking':
        return 'در محدوده ترمز توقف کن';
      case 'wet':
        return 'مسیر خیس را بدون خروج از جاده طی کن';
      case 'time':
        return 'به خط پایان برس';
      case 'eco':
        return 'با کمترین مصرف سوخت مسیر را تمام کن';
    }
  }

  update(dt: number, t: VehicleTelemetry): void {
    if (this.status !== 'running') return;
    this.elapsed += dt;

    const moved = (Math.abs(t.speedMs) * dt) / 1000;
    this.distanceKm += moved;
    const damageDelta = Math.max(0, this.vehicle.bodyDamage - this.lastDamage);
    if (damageDelta > 0.004) {
      this.collisions += 1;
      this.penalty += 12;
      this.lastDamage = this.vehicle.bodyDamage;
    }
    this.fuelUsedL = Math.max(0, this.startFuel - this.vehicle.fuelLitres);

    const forward = this.forwardDistance();
    const lateral = this.lateralDistance();

    switch (this.def.kind) {
      case 'parking': {
        const inZone = Math.hypot(forward - 34, lateral) < 5.2;
        const stopped = Math.abs(t.speedMs) < 0.35;
        this.stoppedTime = stopped && inZone ? this.stoppedTime + dt : 0;
        if (this.stoppedTime > 1.2) this.finish(true, 'پارک دقیق انجام شد');
        else if (this.def.parTimeSec && this.elapsed > this.def.parTimeSec) this.finish(false, 'زمان تمام شد');
        break;
      }
      case 'hillStart': {
        if (forward > (this.def.distanceM ?? 25)) this.finish(true, 'حرکت در سربالایی انجام شد');
        if (forward < -2.5) this.finish(false, 'خودرو عقب رفت');
        break;
      }
      case 'traffic': {
        const limit = (this.def.targetSpeedKph ?? 50) + 8;
        if (Math.abs(t.speedKph) > limit) this.speedingTime += dt;
        else this.speedingTime = Math.max(0, this.speedingTime - dt * 0.5);
        if (this.speedingTime > 3) this.finish(false, 'سرعت غیرمجاز');
        if (this.collisions > 0) this.finish(false, 'برخورد با ترافیک');
        if (this.def.parTimeSec && this.elapsed >= this.def.parTimeSec) this.finish(true, 'رانندگی ایمن کامل شد');
        break;
      }
      case 'braking': {
        const within = forward > 55 && forward < 95 && Math.abs(lateral) < 4.5;
        if (Math.abs(t.speedMs) < 0.4 && within) this.finish(true, 'ترمز به‌موقع');
        else if (forward > 100) this.finish(false, 'از محدوده عبور کردی');
        break;
      }
      case 'wet': {
        if (!t.onRoad && Math.abs(t.speedMs) > 3) this.offRoadTime += dt;
        else this.offRoadTime = Math.max(0, this.offRoadTime - dt * 0.4);
        if (this.offRoadTime > 3) this.finish(false, 'از جاده خارج شدی');
        if (this.distanceKm * 1000 > 420) this.finish(true, 'مسیر خیس کامل شد');
        if (this.def.parTimeSec && this.elapsed > this.def.parTimeSec) this.finish(false, 'زمان تمام شد');
        break;
      }
      case 'time': {
        if (this.distanceKm * 1000 > 700) this.finish(true, 'به خط پایان رسیدی');
        if (this.def.parTimeSec && this.elapsed > this.def.parTimeSec) this.finish(false, 'زمان تمام شد');
        break;
      }
      case 'eco': {
        if (this.distanceKm * 1000 > 500) this.finish(true, 'مسیر بهینه کامل شد');
        if (this.def.parTimeSec && this.elapsed > this.def.parTimeSec) this.finish(false, 'زمان تمام شد');
        break;
      }
    }
    this.lastSpeed = t.speedMs;
    void this.lastSpeed;
  }

  private forwardDistance(): number {
    const p = this.vehicle.position;
    return (p.x - this.ctx.startX) * this.ctx.forwardX + (p.z - this.ctx.startZ) * this.ctx.forwardZ;
  }

  private lateralDistance(): number {
    const p = this.vehicle.position;
    return (p.x - this.ctx.startX) * this.ctx.forwardZ - (p.z - this.ctx.startZ) * this.ctx.forwardX;
  }

  private finish(success: boolean, reason: string): void {
    this.status = success ? 'success' : 'failed';
    this.failReason = reason;
    this.score(success);
  }

  private score(success: boolean): void {
    if (!success) {
      this.bestScore = Math.max(4, 40 - this.collisions * 8 - this.penalty * 0.6);
      return;
    }
    const par = this.def.parTimeSec ?? Math.max(20, this.elapsed);
    const timeFactor = clamp01(1 - (this.elapsed - par * 0.55) / (par * 0.9));
    const collisionFactor = clamp01(1 - this.collisions * 0.22);
    const fuelFactor =
      this.def.kind === 'eco'
        ? clamp01(1 - this.fuelUsedL / 4)
        : clamp01(1 - this.fuelUsedL / 6);
    const distanceFactor = clamp01(this.distanceKm * 1000 / Math.max(60, this.def.distanceM ?? 200));
    const raw = 0.4 * timeFactor + 0.24 * collisionFactor + 0.18 * fuelFactor + 0.18 * distanceFactor;
    this.bestScore = Math.round(clamp(raw, 0.05, 1) * 100 - this.penalty);
  }

  result(): MissionResult {
    const success = this.status === 'success';
    const score = this.status === 'running' ? this.bestScore : this.bestScore;
    return {
      success,
      score,
      elapsedSec: this.elapsed,
      distanceKm: this.distanceKm,
      collisions: this.collisions,
      fuelUsedL: this.fuelUsedL,
      penalty: Math.round(this.penalty),
      reward: success ? Math.round((this.def.reward * score) / 100) : 0,
      reasonFa: this.failReason,
    };
  }
}
