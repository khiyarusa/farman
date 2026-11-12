import RAPIER from '@dimforge/rapier3d-compat';
import { PHYSICS } from '../core/config';

export type RapierApi = typeof RAPIER;
export type RapierWorld = RAPIER.World;
export type RapierBody = RAPIER.RigidBody;
export type RapierCollider = RAPIER.Collider;
export type RapierVehicle = RAPIER.DynamicRayCastVehicleController;

/**
 * Thin ownership wrapper around a Rapier world.
 *
 * FARMAN uses exactly one physics backend: Rapier 3D. The vehicle layer adds a
 * custom powertrain + tire model on top of Rapier's raycast vehicle controller,
 * but suspension, contact queries and rigid-body integration stay in Rapier.
 */
export class PhysicsWorld {
  readonly api: RapierApi;
  readonly world: RapierWorld;
  private readonly eventQueue: RAPIER.EventQueue;
  private vehicleControllers = new Set<RapierVehicle>();

  private constructor(api: RapierApi) {
    this.api = api;
    this.world = new api.World({ x: 0, y: PHYSICS.gravity, z: 0 });
    this.world.timestep = PHYSICS.dt;
    this.world.numSolverIterations = PHYSICS.solverIterations;
    this.eventQueue = new api.EventQueue(true);
  }

  static async create(): Promise<PhysicsWorld> {
    await RAPIER.init();
    return new PhysicsWorld(RAPIER);
  }

  step(): void {
    this.world.step(this.eventQueue);
  }

  /** Advances the vehicle controllers. Must run once per fixed physics step. */
  updateVehicles(dt: number): void {
    for (const controller of this.vehicleControllers) {
      controller.updateVehicle(dt);
    }
  }

  registerVehicle(controller: RapierVehicle): void {
    this.vehicleControllers.add(controller);
  }

  unregisterVehicle(controller: RapierVehicle): void {
    this.vehicleControllers.delete(controller);
    this.world.removeVehicleController(controller);
  }

  /** Static trimesh collider (roads, walls, props). */
  addTrimesh(vertices: Float32Array, indices: Uint32Array, friction = 1): RapierCollider {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const desc = RAPIER.ColliderDesc.trimesh(vertices, indices).setFriction(friction);
    return this.world.createCollider(desc, body);
  }

  addHeightfield(
    heights: Float32Array,
    nrows: number,
    ncols: number,
    scale: { x: number; y: number; z: number },
    friction = 1,
  ): RapierCollider {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const desc = RAPIER.ColliderDesc.heightfield(nrows, ncols, heights, scale).setFriction(friction);
    return this.world.createCollider(desc, body);
  }

  addStaticBox(
    halfExtents: { x: number; y: number; z: number },
    position: { x: number; y: number; z: number },
    rotationY = 0,
    friction = 0.8,
  ): RapierCollider {
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(position.x, position.y, position.z)
        .setRotation(quatFromYaw(rotationY)),
    );
    return this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z).setFriction(friction),
      body,
    );
  }

  dispose(): void {
    for (const controller of this.vehicleControllers) {
      this.world.removeVehicleController(controller);
    }
    this.vehicleControllers.clear();
    this.eventQueue.free();
    this.world.free();
  }
}

export function quatFromYaw(yaw: number): { x: number; y: number; z: number; w: number } {
  return { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) };
}

export function yawFromQuat(q: { x: number; y: number; z: number; w: number }): number {
  // Yaw-only extraction (vehicles stay upright in normal play).
  const siny = 2 * (q.w * q.y + q.z * q.x);
  const cosy = 1 - 2 * (q.y * q.y + q.z * q.z);
  return Math.atan2(siny, cosy);
}
