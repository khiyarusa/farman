import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { Scene } from '@babylonjs/core/scene';
import { clamp, damp } from '../core/math';
import type { VehicleSim } from '../vehicles/vehicle';

export type CameraMode = 'chase' | 'close' | 'hood';

/**
 * Third-person 2.5D chase camera. It keeps the car readable at the bottom third
 * of the frame and the road ahead visible, with speed-dependent pull-back.
 */
export class CameraRig {
  readonly camera: UniversalCamera;
  private mode: CameraMode = 'chase';
  private currentPos = new Vector3(0, 3, -7);
  private currentTarget = new Vector3(0, 1, 0);
  private shake = 0;

  constructor(scene: Scene) {
    this.camera = new UniversalCamera('chase-cam', new Vector3(0, 3, -7), scene);
    this.camera.minZ = 0.2;
    this.camera.maxZ = 1600;
    this.camera.fov = 0.92;
    this.camera.inertia = 0;
    this.camera.rotation = new Vector3(0, 0, 0);
    scene.activeCamera = this.camera;
  }

  get modeName(): CameraMode {
    return this.mode;
  }

  cycle(): CameraMode {
    this.mode = this.mode === 'chase' ? 'close' : this.mode === 'close' ? 'hood' : 'chase';
    return this.mode;
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  addShake(amount: number): void {
    this.shake = Math.min(0.5, this.shake + amount);
  }

  /** Called once per rendered frame with the interpolated vehicle pose. */
  update(vehicle: VehicleSim, dt: number): void {
    const pos = vehicle.position;
    const yaw = vehicle.yaw;
    const speed = Math.abs(vehicle.speedMs);
    const fwd = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));

    let back: number;
    let height: number;
    let targetHeight: number;
    let targetAhead: number;
    if (this.mode === 'hood') {
      back = -0.25;
      height = 1.18;
      targetHeight = 1.15;
      targetAhead = 12;
    } else if (this.mode === 'close') {
      back = 4.3;
      height = 1.75;
      targetHeight = 0.95;
      targetAhead = 4;
    } else {
      back = 6.4 + clamp(speed * 0.035, 0, 1.3);
      height = 2.55 + clamp(speed * 0.012, 0, 0.5);
      targetHeight = 1.05;
      targetAhead = 3.2;
    }

    const desired = new Vector3(
      pos.x - fwd.x * back,
      pos.y + height,
      pos.z - fwd.z * back,
    );
    const target = new Vector3(
      pos.x + fwd.x * targetAhead,
      pos.y + targetHeight,
      pos.z + fwd.z * targetAhead,
    );

    // Smooth but responsive: position follows faster than the look-at target.
    const follow = this.mode === 'hood' ? 0.045 : 0.11;
    this.currentPos.x = damp(this.currentPos.x, desired.x, follow, dt);
    this.currentPos.y = damp(this.currentPos.y, desired.y, follow, dt);
    this.currentPos.z = damp(this.currentPos.z, desired.z, follow, dt);
    this.currentTarget.x = damp(this.currentTarget.x, target.x, 0.09, dt);
    this.currentTarget.y = damp(this.currentTarget.y, target.y, 0.09, dt);
    this.currentTarget.z = damp(this.currentTarget.z, target.z, 0.09, dt);

    if (this.shake > 0.001) {
      const s = this.shake;
      this.currentPos.x += (Math.random() - 0.5) * s;
      this.currentPos.y += (Math.random() - 0.5) * s * 0.7;
      this.shake *= Math.max(0, 1 - dt * 6);
    }

    this.camera.position.copyFrom(this.currentPos);
    this.camera.setTarget(this.currentTarget);
    const targetFov = this.mode === 'chase' ? 0.92 + clamp(speed * 0.0035, 0, 0.09) : 0.86;
    this.camera.fov = damp(this.camera.fov, targetFov, 0.4, dt);
  }

  snap(vehicle: VehicleSim): void {
    const pos = vehicle.position;
    const yaw = vehicle.yaw;
    const fwd = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    this.currentPos = new Vector3(pos.x - fwd.x * 6.4, pos.y + 2.55, pos.z - fwd.z * 6.4);
    this.currentTarget = new Vector3(pos.x + fwd.x * 3.2, pos.y + 1.05, pos.z + fwd.z * 3.2);
    this.camera.position.copyFrom(this.currentPos);
    this.camera.setTarget(this.currentTarget);
  }

  dispose(): void {
    this.camera.dispose();
  }
}

/** Orbit camera for the garage/studio scene. */
export function createStudioCamera(scene: Scene): ArcRotateCamera {
  const camera = new ArcRotateCamera('studio-cam', Math.PI * 0.5 + 0.55, 1.22, 9.2, new Vector3(0, 0.72, 0), scene);
  camera.lowerRadiusLimit = 5.2;
  camera.upperRadiusLimit = 14;
  camera.lowerBetaLimit = 0.9;
  camera.upperBetaLimit = 1.46;
  camera.wheelDeltaPercentage = 0.01;
  camera.pinchDeltaPercentage = 0.008;
  camera.panningSensibility = 0;
  camera.inertia = 0.75;
  camera.angularSensibilityX = 2600;
  camera.angularSensibilityY = 2600;
  camera.minZ = 0.2;
  camera.fov = 0.72;
  camera.useAutoRotationBehavior = false;
  scene.activeCamera = camera;
  return camera;
}
