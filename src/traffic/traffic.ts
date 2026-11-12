import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { createRng, type Rng } from '../core/rng';
import type { PhysicsWorld } from '../physics/world';
import type { WorldData, WorldRoad } from '../rendering/worldScene';

interface TrafficAgent {
  root: TransformNode;
  road: number;
  dir: 1 | -1;
  /** Distance along the road polyline, metres. */
  s: number;
  speed: number;
  desired: number;
  lane: number;
  length: number;
  body: import('@dimforge/rapier3d-compat').RigidBody | null;
  lastBrake: number;
}

/**
 * Lane-following AI traffic.
 *
 * Each agent owns a Rapier kinematic body so the player physically collides with
 * it. Speed control uses a simple intelligent-driver model: desired speed by
 * road class, curve anticipation, headway to the next car in the same lane, and
 * braking for the player.
 */
export class TrafficSystem {
  readonly agents: TrafficAgent[] = [];
  private rng: Rng = createRng(90210);
  private cumLengths: number[][] = [];
  private loaded = false;

  constructor(
    private readonly scene: Scene,
    private readonly physics: PhysicsWorld,
    private readonly data: WorldData,
  ) {
    for (const road of data.roads) this.cumLengths.push(cumulative(road.points));
  }

  async load(density: number): Promise<void> {
    const models = ['traffic-sedan.glb', 'traffic-van.glb', 'traffic-truck.glb'];
    const containers = [] as Awaited<ReturnType<typeof SceneLoader.LoadAssetContainerAsync>>[];
    for (const model of models) {
      try {
        const c = await SceneLoader.LoadAssetContainerAsync('./assets/vehicles/', model, this.scene);
        containers.push(c);
      } catch (err) {
        console.warn('[traffic] model failed', model, err);
      }
    }
    if (!containers.length) return;

    const count = Math.round(10 + density * 14);
    const spacing = this.data.roads.length / count;
    for (let i = 0; i < count; i++) {
      const roadIndex = Math.floor(this.rng.next() * this.data.roads.length);
      const road = this.data.roads[roadIndex] as WorldRoad;
      const pts = road.points;
      const total = this.cumLengths[roadIndex]?.at(-1) ?? 0;
      if (total < 30) continue;
      const container = containers[this.rng.int(0, containers.length - 1)] as (typeof containers)[number];
      const entries = container.instantiateModelsToScene(undefined, false, { doNotInstantiate: true });
      const root = entries.rootNodes[0] as TransformNode;
      const dir: 1 | -1 = this.rng.chance(0.5) ? 1 : -1;
      const lane = this.rng.next();
      const s = ((i * spacing * 37) % 1 + 0.05) * total;
      const agent: TrafficAgent = {
        root,
        road: roadIndex,
        dir,
        s,
        speed: 0,
        desired: road.kind === 'highway' ? 26 : road.kind === 'mountain' ? 14 : 12,
        lane,
        length: 4.4,
        body: null,
        lastBrake: 0,
      };
      this.applyTransform(agent, 0);
      this.agents.push(agent);
      void pts;
    }
    this.loaded = true;
  }

  private applyTransform(agent: TrafficAgent, dt: number): void {
    const road = this.data.roads[agent.road] as WorldRoad;
    const pts = road.points;
    const cums = this.cumLengths[agent.road] as number[];
    const total = cums.at(-1) ?? 0;
    let s = agent.s;
    if (agent.dir === 1 && s > total) s = 2;
    if (agent.dir === -1 && s < 2) s = total - 2;
    agent.s = s;

    const idx = findSegment(cums, s);
    const a = pts[idx] as [number, number, number];
    const b = pts[Math.min(pts.length - 1, idx + 1)] as [number, number, number];
    const segLen = Math.max(0.001, (cums[idx + 1] ?? total) - (cums[idx] ?? 0));
    const t = Math.max(0, Math.min(1, (s - (cums[idx] ?? 0)) / segLen));
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    let heading = Math.atan2(b[0] - a[0], b[2] - a[2]);
    if (agent.dir === -1) heading += Math.PI;

    // Right-hand traffic: offset to the right of the direction of travel.
    const laneOffset = (road.width / 2 - 2.1) * (0.35 + agent.lane * 0.5);
    const ox = Math.cos(heading) * laneOffset;
    const oz = -Math.sin(heading) * laneOffset;

    agent.root.position.set(x + ox, y, z + oz);
    agent.root.rotation.y = heading;
    if (agent.body) {
      agent.body.setNextKinematicTranslation({ x: x + ox, y: y + 0.8, z: z + oz });
      agent.body.setNextKinematicRotation({
        x: 0,
        y: Math.sin(heading / 2),
        z: 0,
        w: Math.cos(heading / 2),
      });
    }
    void dt;
  }

  /** Fixed-step update. */
  step(dt: number, playerPosition: { x: number; z: number }, playerSpeed: number): void {
    if (!this.loaded) return;
    for (const agent of this.agents) {
      const road = this.data.roads[agent.road] as WorldRoad;
      const total = this.cumLengths[agent.road]?.at(-1) ?? 0;
      // Headway to the nearest car ahead on the same road and direction.
      let gap = 80;
      for (const other of this.agents) {
        if (other === agent || other.road !== agent.road || other.dir !== agent.dir) continue;
        const ds = (other.s - agent.s) * agent.dir;
        if (ds > 0 && ds < gap) gap = ds;
      }
      // Brake for the player if directly ahead.
      const dx = playerPosition.x - agent.root.position.x;
      const dz = playerPosition.z - agent.root.position.z;
      const dist = Math.hypot(dx, dz);
      const fwdX = Math.sin(agent.root.rotation.y);
      const fwdZ = Math.cos(agent.root.rotation.y);
      const ahead = dx * fwdX + dz * fwdZ > 0 && dist < 22;

      const curveFactor = road.kind === 'mountain' ? 0.65 : road.kind === 'highway' ? 1.05 : 0.9;
      let target = agent.desired * curveFactor;
      if (gap < 30) target = Math.min(target, Math.max(0, (gap - 6) * 0.8));
      if (ahead) target = Math.min(target, Math.max(0, (dist - 5) * 0.8));
      if (playerSpeed < 1 && dist < 12) target = 0;

      const accel = target > agent.speed ? 3.2 : 7.5;
      agent.speed += Math.max(-accel * dt, Math.min(accel * dt, target - agent.speed));
      agent.speed = Math.max(0, Math.min(agent.speed, 40));
      agent.s += agent.speed * dt * agent.dir;
      if (agent.s < 0) agent.s += total;
      if (agent.s > total) agent.s -= total;
      this.applyTransform(agent, dt);
    }
  }

  /** Called on physical spawn, once the world is ready. */
  attachBodies(): void {
    const R = this.physics.api;
    for (const agent of this.agents) {
      const pos = agent.root.position;
      agent.body = this.physics.world.createRigidBody(
        R.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x, pos.y + 0.8, pos.z),
      );
      this.physics.world.createCollider(
        R.ColliderDesc.cuboid(0.9, 0.75, 2.2).setFriction(0.4),
        agent.body,
      );
    }
  }

  dispose(): void {
    for (const agent of this.agents) {
      if (agent.body) this.physics.world.removeRigidBody(agent.body);
      agent.root.dispose(false, true);
    }
    this.agents.length = 0;
  }

  get visibleMeshes(): AbstractMesh[] {
    return this.agents.flatMap((a) => a.root.getChildMeshes());
  }
}

function cumulative(points: [number, number, number][]): number[] {
  const out = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as [number, number, number];
    const b = points[i] as [number, number, number];
    total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    out.push(total);
  }
  return out;
}

function findSegment(cums: number[], s: number): number {
  let lo = 0;
  let hi = cums.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((cums[mid] as number) <= s) lo = mid;
    else hi = mid;
  }
  return Math.min(lo, cums.length - 2);
}

export const __trafficTest = { cumulative, findSegment, Vector3 };
