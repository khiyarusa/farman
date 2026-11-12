import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF/2.0';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { setupEnvironment, type EnvironmentHandles } from './environment';
import { CameraRig } from './cameraRig';
import { VehicleView } from './vehicleView';
import type { VehicleProfile } from '../vehicles/profile';
import type { VehicleSim } from '../vehicles/vehicle';
import type { PhysicsWorld } from '../physics/world';
import type { SurfaceKind, SurfaceProvider } from '../world/surface';
import type { Settings } from '../save/schema';
import { WORLD } from '../core/config';

export interface WorldSpawn {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface WorldRoad {
  id: string;
  name: string;
  kind: 'urban' | 'highway' | 'mountain' | 'rural' | 'tunnel' | 'bridge';
  width: number;
  points: [number, number, number][];
}

export interface WorldData {
  version: number;
  size: number;
  heightfield?: { file: string; resolution: number; minY: number; maxY: number };
  models?: Record<string, string>;
  roads: WorldRoad[];
  spawns: WorldSpawn[];
}

export interface WorldLoadProgress {
  (fraction: number, label: string): void;
}

/**
 * The playable scene.
 *
 * Loads generated world assets when they exist. When they do not (fresh clone
 * before `npm run assets`), a flat test pad is built so the simulation is always
 * runnable and testable.
 */
export class WorldScene {
  readonly scene: Scene;
  readonly camera: CameraRig;
  readonly env: EnvironmentHandles;
  data: WorldData | null = null;
  private view: VehicleView | null = null;
  private roadMeshes: AbstractMesh[] = [];
  private roadSamples: Array<{ x: number; z: number; width: number; kind: WorldRoad['kind']; points: [number, number, number][] }> = [];
  private wetness = 0;
  private heightSampler: ((x: number, z: number) => number) | null = null;
  private roadSegments: Array<{ ax: number; ay: number; az: number; bx: number; by: number; bz: number; half: number; kind: WorldRoad['kind'] }> = [];
  private roadGrid = new Map<string, number[]>();
  private readonly gridCell = 40;
  readonly isFallback: boolean;

  constructor(
    engine: AbstractEngine,
    private readonly physics: PhysicsWorld,
    settings: Settings,
    private readonly quality: 'low' | 'balanced' | 'high',
  ) {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor = new Color4(0.03, 0.04, 0.045, 1);
    this.scene = scene;
    this.isFallback = true;

    this.env = setupEnvironment(scene, {
      skyTexture: './assets/textures/sky-day.png',
      palette: { top: '#3f6f96', horizon: '#a9bcc7', ground: '#4a4238', sun: '#fff3d6' },
      sunDirection: new Vector3(0.42, -1, -0.72),
      sunIntensity: 2.6,
      ambientIntensity: 0.18,
      shadowMapSize: settings.graphics === 'high' ? 2048 : settings.graphics === 'balanced' ? 1024 : 512,
      shadowDistance: 60,
      fog: { color: '#9fb6c4', density: 0.00045 },
    });
    this.camera = new CameraRig(scene);
    void this.quality;
  }

  /** Loads world.json and its models. Falls back to a flat pad on any failure. */
  async load(onProgress: WorldLoadProgress): Promise<void> {
    onProgress(0.05, 'آماده‌سازی جهان');
    let data: WorldData | null = null;
    try {
      const response = await fetch('./assets/world/world.json', { cache: 'no-cache' });
      if (response.ok) data = (await response.json()) as WorldData;
    } catch {
      data = null;
    }

    if (!data || !data.roads?.length) {
      this.buildFallbackPad();
      onProgress(1, 'آماده');
      return;
    }

    this.data = data;
    onProgress(0.15, 'بارگذاری زمین');

    // Heights for spawning and for camera clamping.
    if (data.heightfield) {
      try {
        const bin = await fetch(`./assets/world/${data.heightfield.file}`);
        const buffer = await bin.arrayBuffer();
        const heights = new Float32Array(buffer);
        const n = data.heightfield.resolution;
        const size = data.size;
        this.heightSampler = (x, z) => {
          const fx = ((x + size / 2) / size) * (n - 1);
          const fz = ((z + size / 2) / size) * (n - 1);
          const ix = Math.max(0, Math.min(n - 1, Math.round(fx)));
          const iz = Math.max(0, Math.min(n - 1, Math.round(fz)));
          return heights[iz * n + ix] ?? 0;
        };
        const scale = { x: size, y: 1, z: size };
        // Rapier heightfields are column-major; our file is row-major (z rows).
        const transposed = new Float32Array(n * n);
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            transposed[j * n + i] = heights[i * n + j] as number;
          }
        }
        this.physics.addHeightfield(transposed, n - 1, n - 1, scale, 1.0);
      } catch (err) {
        console.warn('[world] heightfield failed', err);
      }
    }

    const models = data.models ?? {};
    const entries = Object.entries(models);
    let index = 0;
    for (const [kind, file] of entries) {
      onProgress(0.2 + (0.65 * index) / Math.max(1, entries.length), `بارگذاری ${kind}`);
      try {
        const result = await SceneLoader.ImportMeshAsync('', './assets/world/', file, this.scene);
        for (const mesh of result.meshes) {
          if (!mesh.material) continue;
          mesh.isPickable = false;
          mesh.receiveShadows = mesh.name.includes('terrain') || mesh.name.includes('road');
          this.roadMeshes.push(mesh);
          if (kind === 'roads' || kind === 'barriers' || kind === 'props') {
            if (!mesh.name.includes('markings')) this.addMeshCollider(mesh);
          }
          if (kind === 'props' || kind === 'vegetation') {
            this.env.shadows.addShadowCaster(mesh, true);
          }
        }
      } catch (err) {
        console.warn(`[world] model ${file} failed to load`, err);
      }
      index++;
    }

    this.buildRoadSamples(data.roads);
    this.buildRoadIndex(data.roads);
    onProgress(0.95, 'آماده‌سازی ترافیک');
    if (!this.roadMeshes.length) this.buildFallbackPad();
    onProgress(1, 'آماده');
  }

  private addMeshCollider(mesh: AbstractMesh): void {
    const positions = mesh.getVerticesData('position');
    const indices = mesh.getIndices();
    if (!positions || !indices) return;
    const world = mesh.computeWorldMatrix(true);
    const transformed = new Float32Array(positions.length);
    const v = new Vector3();
    for (let i = 0; i < positions.length; i += 3) {
      v.set(positions[i] as number, positions[i + 1] as number, positions[i + 2] as number);
      Vector3.TransformCoordinatesToRef(v, world, v);
      transformed[i] = v.x;
      transformed[i + 1] = v.y;
      transformed[i + 2] = v.z;
    }
    const idx = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
    this.physics.addTrimesh(transformed, idx, 1);
  }

  private buildRoadSamples(roads: WorldRoad[]): void {
    this.roadSamples = roads.map((r) => ({
      x: r.points[0]?.[0] ?? 0,
      z: r.points[0]?.[2] ?? 0,
      width: r.width,
      kind: r.kind,
      points: r.points,
    }));
  }

  /** Spatial hash of road segments, used for height queries and surface type. */
  private buildRoadIndex(roads: WorldRoad[]): void {
    this.roadSegments = [];
    this.roadGrid.clear();
    for (const road of roads) {
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1] as [number, number, number];
        const b = road.points[i] as [number, number, number];
        const index = this.roadSegments.length;
        this.roadSegments.push({
          ax: a[0], ay: a[1], az: a[2],
          bx: b[0], by: b[1], bz: b[2],
          half: road.width / 2 + 0.4,
          kind: road.kind,
        });
        const minX = Math.min(a[0], b[0]) - this.gridCell;
        const maxX = Math.max(a[0], b[0]) + this.gridCell;
        const minZ = Math.min(a[2], b[2]) - this.gridCell;
        const maxZ = Math.max(a[2], b[2]) + this.gridCell;
        for (let gx = Math.floor(minX / this.gridCell); gx <= Math.floor(maxX / this.gridCell); gx++) {
          for (let gz = Math.floor(minZ / this.gridCell); gz <= Math.floor(maxZ / this.gridCell); gz++) {
            const key = `${gx}:${gz}`;
            const bucket = this.roadGrid.get(key);
            if (bucket) bucket.push(index);
            else this.roadGrid.set(key, [index]);
          }
        }
      }
    }
  }

  /** Nearest road surface under a point, or null when off-road. */
  private roadUnder(x: number, z: number): { y: number; kind: WorldRoad['kind'] } | null {
    const gx = Math.floor(x / this.gridCell);
    const gz = Math.floor(z / this.gridCell);
    let bestDist = Infinity;
    let bestY = 0;
    let bestKind: WorldRoad['kind'] = 'urban';
    for (let ix = gx - 1; ix <= gx + 1; ix++) {
      for (let iz = gz - 1; iz <= gz + 1; iz++) {
        const bucket = this.roadGrid.get(`${ix}:${iz}`);
        if (!bucket) continue;
        for (const index of bucket) {
          const s = this.roadSegments[index] as (typeof this.roadSegments)[number];
          const dx = s.bx - s.ax;
          const dz = s.bz - s.az;
          const len2 = dx * dx + dz * dz;
          if (len2 < 0.0001) continue;
          let t = ((x - s.ax) * dx + (z - s.az) * dz) / len2;
          t = Math.max(0, Math.min(1, t));
          const px = s.ax + dx * t;
          const pz = s.az + dz * t;
          const d = Math.hypot(x - px, z - pz);
          if (d < s.half && d < bestDist) {
            bestDist = d;
            bestY = s.ay + (s.by - s.ay) * t;
            bestKind = s.kind;
          }
        }
      }
    }
    return bestDist < Infinity ? { y: bestY, kind: bestKind } : null;
  }

  /** Flat test pad used before the generated world exists. */
  private buildFallbackPad(): void {
    const size = 600;
    const ground = MeshBuilder.CreateGround('test-ground', { width: size, height: size, subdivisions: 2 }, this.scene);
    const mat = new PBRMaterial('test-ground-mat', this.scene);
    mat.albedoColor = new Color3(0.09, 0.095, 0.1);
    mat.metallic = 0.05;
    mat.roughness = 0.86;
    const tex = new DynamicTexture('asphalt-noise', { width: 512, height: 512 }, this.scene, true);
    const ctx = tex.getContext();
    ctx.fillStyle = '#2b2f32';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const g = 30 + Math.random() * 40;
      ctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    tex.update();
    tex.uScale = 24;
    tex.vScale = 24;
    mat.albedoTexture = tex;
    ground.material = mat;
    ground.receiveShadows = true;
    this.physics.addStaticBox({ x: size / 2, y: 1, z: size / 2 }, { x: 0, y: -1, z: 0 });

    // A rough road strip so lane position is readable while testing.
    const road = MeshBuilder.CreateGround('test-road', { width: 9, height: size, subdivisions: 2 }, this.scene);
    road.position.y = 0.015;
    const roadMat = new PBRMaterial('test-road-mat', this.scene);
    roadMat.albedoColor = new Color3(0.05, 0.052, 0.055);
    roadMat.roughness = 0.72;
    roadMat.metallic = 0.02;
    road.material = roadMat;
    road.receiveShadows = true;

    // Lane dashes.
    const dashMat = new PBRMaterial('dash-mat', this.scene);
    dashMat.albedoColor = new Color3(0.9, 0.9, 0.86);
    dashMat.emissiveColor = new Color3(0.12, 0.12, 0.1);
    dashMat.roughness = 0.6;
    for (let i = -300; i < 300; i += 12) {
      const dash = MeshBuilder.CreateGround(`dash-${i}`, { width: 0.18, height: 4, subdivisions: 1 }, this.scene);
      dash.position.set(0, 0.02, i);
      dash.material = dashMat;
    }

    const lineMat = new PBRMaterial('edge-mat', this.scene);
    lineMat.albedoColor = new Color3(0.85, 0.85, 0.8);
    lineMat.roughness = 0.65;
    for (const x of [-4.4, 4.4]) {
      const line = MeshBuilder.CreateGround(`edge-${x}`, { width: 0.14, height: size, subdivisions: 1 }, this.scene);
      line.position.set(x, 0.02, 0);
      line.material = lineMat;
    }

    // Reference objects for scale and camera parallax.
    for (let i = 0; i < 14; i++) {
      const box = MeshBuilder.CreateBox(`ref-${i}`, { width: 6 + (i % 3), height: 3 + (i % 4), depth: 6 }, this.scene);
      box.position.set(i % 2 === 0 ? -18 - (i % 4) * 5 : 18 + (i % 4) * 5, box.getBoundingInfo().boundingBox.extendSize.y, -60 + i * 14);
      const bm = new PBRMaterial(`ref-mat-${i}`, this.scene);
      bm.albedoColor = new Color3(0.32, 0.3, 0.28).scale(0.7 + (i % 3) * 0.15);
      bm.roughness = 0.9;
      box.material = bm;
      box.receiveShadows = true;
      this.physics.addStaticBox({ x: 3, y: 2, z: 3 }, box.position.clone());
    }
  }

  async createVehicleView(
    profile: VehicleProfile,
    paintHex: string,
    rimHex: string,
  ): Promise<VehicleView> {
    const view = await VehicleView.create(this.scene, profile, paintHex, rimHex, { simplified: false });
    for (const mesh of view.casters) this.env.shadows.addShadowCaster(mesh, true);
    this.view = view;
    return view;
  }

  update(vehicle: VehicleSim, dt: number): void {
    this.camera.update(vehicle, dt);
    this.view?.update(vehicle);
    this.env.updateForTarget(new Vector3(vehicle.position.x, vehicle.position.y, vehicle.position.z));
  }

  setWeather(kind: 'dry' | 'rain'): void {
    this.wetness = kind === 'rain' ? 1 : 0;
    this.scene.fogDensity = kind === 'rain' ? 0.0035 : 0.00045;
    this.scene.fogColor = Color3.FromHexString(kind === 'rain' ? '#8e9aa0' : '#c2cfd5');
    this.scene.clearColor = Color4.FromHexString(kind === 'rain' ? '#5d666bff' : '#c9d6ddff');
  }

  get surface(): SurfaceProvider {
    const roads = this.roadSamples;
    const wet = this.wetness;
    const heightAt = (x: number, z: number): number => this.groundHeightAt(x, z);
    const normalAt = (x: number, z: number): { x: number; y: number; z: number } => {
      const e = 0.75;
      const hl = heightAt(x - e, z);
      const hr = heightAt(x + e, z);
      const hd = heightAt(x, z - e);
      const hu = heightAt(x, z + e);
      const nx = (hl - hr) / (2 * e);
      const nz = (hd - hu) / (2 * e);
      const len = Math.hypot(nx, 1, nz) || 1;
      return { x: nx / len, y: 1 / len, z: nz / len };
    };
    if (roads.length === 0) {
      // Fallback pad: the test strip is drivable asphalt.
      return {
        heightAt,
        normalAt,
        sample: (x: number) => (Math.abs(x) < 5.2 ? { kind: 'asphalt' as SurfaceKind, wet } : { kind: 'dirt' as SurfaceKind, wet: wet * 0.4 }),
      };
    }
    return {
      heightAt,
      normalAt,
      sample: (x: number, z: number) => {
        const road = this.roadUnder(x, z);
        if (road) {
          return { kind: (road.kind === 'tunnel' ? 'tunnel' : 'asphalt') as SurfaceKind, wet };
        }
        for (const r of roads) {
          const half = (r.width / 2) * 1.15;
          if (this.distanceToPolyline(x, z, r.points) < half) {
            return { kind: (r.kind === 'tunnel' ? 'tunnel' : 'asphalt') as SurfaceKind, wet };
          }
        }
        return { kind: 'dirt' as SurfaceKind, wet: wet * 0.4 };
      },
    };
  }

  private distanceToPolyline(x: number, z: number, points: [number, number, number][]): number {
    let best = Infinity;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1] as [number, number, number];
      const b = points[i] as [number, number, number];
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const len2 = dx * dx + dz * dz;
      if (len2 < 0.0001) continue;
      let t = ((x - a[0]) * dx + (z - a[2]) * dz) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = a[0] + dx * t;
      const pz = a[2] + dz * t;
      best = Math.min(best, Math.hypot(x - px, z - pz));
    }
    return best;
  }

  groundHeightAt(x: number, z: number): number {
    const road = this.roadUnder(x, z);
    if (road) return road.y + 0.02;
    if (this.heightSampler) return this.heightSampler(x, z);
    return 0;
  }

  spawnFor(id: string): WorldSpawn | null {
    return this.data?.spawns.find((s) => s.id === id) ?? null;
  }

  dispose(): void {
    this.view?.dispose();
    this.view = null;
    this.scene.dispose();
  }
}

export const WORLD_SIZE = WORLD.size;
