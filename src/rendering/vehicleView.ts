import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF/2.0';
import type { Scene } from '@babylonjs/core/scene';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import type { VehicleProfile } from '../vehicles/profile';
import type { VehicleSim } from '../vehicles/vehicle';

/**
 * Couples the simulation to its render representation.
 * Wheels are independent transform nodes so steering, rolling and suspension
 * travel are visible and driven directly by physics state.
 */
export class VehicleView {
  readonly root: TransformNode;
  private wheels: TransformNode[] = [];
  private brakeMaterial: PBRMaterial | null = null;
  private reverseMaterial: PBRMaterial | null = null;
  private headlightMaterial: PBRMaterial | null = null;
  private paintMaterial: PBRMaterial;
  private rimMaterial: PBRMaterial;

  private lastRotation: [number, number, number, number] = [0, 0, 0, 0];
  private shadowCasters: AbstractMesh[] = [];
  private disposed = false;

  private constructor(
    readonly scene: Scene,
    readonly profile: VehicleProfile,
    paintHex: string,
    rimHex: string,
  ) {
    this.root = new TransformNode(`car-${profile.id}`, scene);

    this.paintMaterial = createPaintMaterial(scene, paintHex);
    this.rimMaterial = createRimMaterial(scene, rimHex);
  }

  static async create(
    scene: Scene,
    profile: VehicleProfile,
    paintHex: string,
    rimHex: string,
    opts: { simplified?: boolean } = {},
  ): Promise<VehicleView> {
    const view = new VehicleView(scene, profile, paintHex, rimHex);
    try {
      const result = await SceneLoader.ImportMeshAsync(
        '',
        './assets/vehicles/',
        profile.visual.model,
        scene,
      );
      view.bindImported(scene, result.meshes, result.transformNodes);
      view.root.scaling.setAll(profile.visual.scale || 1);
    } catch (err) {
      console.warn(`[vehicle] GLB "${profile.visual.model}" unavailable, using proxy mesh`, err);
      view.buildProxy(profile, opts.simplified === true);
    }
    return view;
  }

  private bindImported(
    scene: Scene,
    meshes: AbstractMesh[],
    transformNodes: TransformNode[],
  ): void {
    const all = [...meshes, ...transformNodes];
    for (const node of all) {
      if (!node.parent) node.parent = this.root;
    }

    const names = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'];
    this.wheels = names.map((name) => {
      const found = scene.getTransformNodeByName(name) ?? scene.getMeshByName(name);
      if (!found) {
        // Fallback: create an empty pivot at the authored anchor.
        const anchor = this.profile.visual.wheelAnchors[names.indexOf(name)] as [number, number, number];
        const node = new TransformNode(name, scene);
        node.parent = this.root;
        node.position.set(anchor[0], anchor[1], anchor[2]);
        return node;
      }
      return found;
    });

    for (const mesh of meshes) {
      if (mesh.getTotalVertices() === 0) continue;
      this.shadowCasters.push(mesh);
      const mat = mesh.material;
      if (!mat) continue;
      const name = mat.name.toLowerCase();
      if (name.includes('paint')) {
        mesh.material = this.paintMaterial;
      } else if (name.includes('rim') || name.includes('wheel_metal')) {
        mesh.material = this.rimMaterial;
      } else if (name.includes('brake')) {
        this.brakeMaterial = mat as PBRMaterial;
      } else if (name.includes('reverse')) {
        this.reverseMaterial = mat as PBRMaterial;
      } else if (name.includes('headlight') || name.includes('light_front')) {
        this.headlightMaterial = mat as PBRMaterial;
      }
      mesh.receiveShadows = true;
    }
  }

  /** Fallback proxy so the game never depends on an asset existing. */
  private buildProxy(profile: VehicleProfile, simplified: boolean): void {
    const p = profile;
    const bodyMat = this.paintMaterial;
    const glassMat = createGlassMaterial(this.scene);
    const darkMat = new StandardMaterial(`proxy-dark-${p.id}`, this.scene);
    darkMat.diffuseColor = new Color3(0.05, 0.055, 0.06);
    darkMat.specularColor = new Color3(0.1, 0.1, 0.1);

    const body = MeshBuilder.CreateBox(
      `proxy-body-${p.id}`,
      { width: p.dimensions.width, height: p.dimensions.height * 0.52, depth: p.dimensions.length },
      this.scene,
    );
    body.position.y = p.dimensions.height * 0.45;
    body.material = bodyMat;
    body.parent = this.root;
    this.shadowCasters.push(body);

    const cabin = MeshBuilder.CreateBox(
      `proxy-cabin-${p.id}`,
      { width: p.dimensions.width * 0.86, height: p.dimensions.height * 0.4, depth: p.dimensions.length * 0.44 },
      this.scene,
    );
    cabin.position.set(0, p.dimensions.height * 0.82, -0.18);
    cabin.material = simplified ? bodyMat : glassMat;
    cabin.parent = this.root;
    this.shadowCasters.push(cabin);

    for (const anchor of p.visual.wheelAnchors) {
      const node = new TransformNode(`wheel_proxy_${anchor.join('_')}`, this.scene);
      node.parent = this.root;
      node.position.set(anchor[0], anchor[1], anchor[2]);
      const tire = MeshBuilder.CreateCylinder(
        `tire_${anchor.join('_')}`,
        { diameter: p.wheels.radius * 2, height: p.wheels.width, tessellation: simplified ? 12 : 24 },
        this.scene,
      );
      tire.rotation.z = Math.PI / 2;
      tire.material = darkMat;
      tire.parent = node;
      const rim = MeshBuilder.CreateCylinder(
        `rim_${anchor.join('_')}`,
        { diameter: p.wheels.radius * 1.15, height: p.wheels.width * 1.04, tessellation: 12 },
        this.scene,
      );
      rim.rotation.z = Math.PI / 2;
      rim.material = this.rimMaterial;
      rim.parent = node;
      this.wheels.push(node);
    }
  }

  get casters(): AbstractMesh[] {
    return this.shadowCasters;
  }

  setPaint(hex: string): void {
    this.paintMaterial.albedoColor = Color3.FromHexString(hex);
  }

  setRimColor(hex: string): void {
    this.rimMaterial.albedoColor = Color3.FromHexString(hex);
  }

  /** Syncs the render graph from the simulation. Called once per rendered frame. */
  update(vehicle: VehicleSim): void {
    if (this.disposed) return;
    const pos = vehicle.position;
    const yaw = vehicle.yaw;
    this.root.position.set(pos.x, pos.y, pos.z);
    this.root.rotation.y = yaw;

    const telemetry = vehicle.telemetry;
    for (let i = 0; i < this.wheels.length; i++) {
      const wheel = this.wheels[i] as TransformNode;
      if (!wheel) continue;
      const tire = telemetry.wheels[i];
      if (!tire) continue;
      // Rolling angle integrates actual wheel speed, so lock-up and wheelspin read correctly.
      this.lastRotation[i] = (this.lastRotation[i] ?? 0) + tire.omega * (1 / 60);
      wheel.rotation.x = -(this.lastRotation[i] as number);
      if (i < 2) wheel.rotation.y = -vehicle.steerAngle;

      const anchor = this.profile.visual.wheelAnchors[i] as [number, number, number];
      // Suspension travel: shorter length = wheel closer to the body.
      wheel.position.y = anchor[1] + tire.travelOffset;
    }

    if (this.brakeMaterial) {
      const braking = telemetry.brake > 0.05 || telemetry.handbrake > 0.1;
      this.brakeMaterial.emissiveColor = braking
        ? new Color3(1, 0.08, 0.06).scale(1.6 + telemetry.brake * 2.2)
        : new Color3(0.35, 0.02, 0.02);
    }
    if (this.reverseMaterial) {
      this.reverseMaterial.emissiveColor =
        telemetry.gear === -1 ? new Color3(1, 0.95, 0.9) : new Color3(0.08, 0.08, 0.08);
    }
    if (this.headlightMaterial) {
      this.headlightMaterial.emissiveColor = new Color3(1, 0.96, 0.88).scale(1.2);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.paintMaterial.dispose();
    this.rimMaterial.dispose();
    this.root.dispose(false, true);
  }
}

function createPaintMaterial(scene: Scene, hex: string): PBRMaterial {
  const mat = new PBRMaterial('farman-paint', scene);
  mat.albedoColor = Color3.FromHexString(hex);
  mat.metallic = 0.22;
  mat.roughness = 0.32;
  mat.clearCoat.isEnabled = true;
  mat.clearCoat.intensity = 1;
  mat.clearCoat.roughness = 0.06;
  mat.clearCoat.indexOfRefraction = 1.52;
  mat.environmentIntensity = 1.1;
  return mat;
}

function createRimMaterial(scene: Scene, hex: string): PBRMaterial {
  const mat = new PBRMaterial('farman-rim', scene);
  mat.albedoColor = Color3.FromHexString(hex);
  mat.metallic = 1;
  mat.roughness = 0.24;
  mat.environmentIntensity = 1.2;
  return mat;
}

function createGlassMaterial(scene: Scene): PBRMaterial {
  const mat = new PBRMaterial('farman-glass-proxy', scene);
  mat.albedoColor = new Color3(0.04, 0.055, 0.06);
  mat.metallic = 0.1;
  mat.roughness = 0.06;
  mat.alpha = 0.62;
  mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
  mat.environmentIntensity = 1.4;
  return mat;
}

/** Collects shadow casters for a scene-level ShadowGenerator. */
export function registerVehicleShadows(view: VehicleView, generator: { addShadowCaster: (m: AbstractMesh, includeDescendants?: boolean) => unknown }): void {
  for (const mesh of view.casters) {
    generator.addShadowCaster(mesh, true);
  }
  for (const wheel of view.root.getChildTransformNodes()) {
    generator.addShadowCaster(wheel as unknown as AbstractMesh, true);
  }
}

export const __test = { createPaintMaterial, createRimMaterial, createGlassMaterial, Vector3 };
