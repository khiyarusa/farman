import { Scene } from '@babylonjs/core/scene';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { createStudioCamera } from './cameraRig';
import { createProceduralEnvironment } from './environment';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import type { VehicleProfile } from '../vehicles/profile';
import { VehicleView } from './vehicleView';

/**
 * Garage/studio scene: dark reflective floor, soft key light, slow orbit.
 * Deliberately separate from the world scene so the menu loads in under a second
 * and never depends on the 3D world being ready.
 */
export class StudioScene {
  readonly scene: Scene;
  readonly camera: ArcRotateCamera;
  private shadows: ShadowGenerator;
  private key: DirectionalLight;
  private view: VehicleView | null = null;
  private paintHex = '#eef1f2';
  private rimHex = '#c3c8cc';
  private loadingToken = 0;
  private floor: Mesh;
  private idleTime = 0;
  private lastInteraction = 0;

  constructor(engine: AbstractEngine) {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor = new Color4(0.012, 0.016, 0.018, 1);
    this.scene = scene;

    this.camera = createStudioCamera(scene);
    this.camera.attachControl(true);

    const env = createProceduralEnvironment(scene, {
      top: '#1b2429',
      horizon: '#2a3438',
      ground: '#0a0d0f',
      sun: '#dfe9ee',
    });
    if (env) scene.environmentTexture = env;
    scene.environmentIntensity = 0.65;

    this.key = new DirectionalLight('studio-key', new Vector3(-0.35, -1, 0.55), scene);
    this.key.position = new Vector3(6, 11, -7);
    this.key.intensity = 5.2;
    this.key.diffuse = new Color3(0.96, 0.98, 1);
    this.key.specular = new Color3(1, 1, 1);

    const rim = new DirectionalLight('studio-rim', new Vector3(0.3, -0.45, -1), scene);
    rim.intensity = 1.9;
    rim.diffuse = new Color3(0.55, 0.78, 0.72);
    rim.specular = new Color3(0.6, 0.9, 0.8);

    const fill = new DirectionalLight('studio-fill', new Vector3(0.2, -0.6, 1), scene);
    fill.intensity = 0.95;
    fill.diffuse = new Color3(0.5, 0.56, 0.6);
    fill.specular = Color3.Black();

    this.shadows = new ShadowGenerator(1024, this.key);
    this.shadows.usePercentageCloserFiltering = true;
    this.shadows.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.shadows.bias = 0.0012;
    this.shadows.normalBias = 0.02;
    this.shadows.darkness = 0.35;

    // Floor: polished dark concrete with an environment reflection.
    const floorMat = new PBRMaterial('studio-floor-mat', scene);
    floorMat.albedoColor = new Color3(0.045, 0.052, 0.056);
    floorMat.metallic = 0.55;
    floorMat.roughness = 0.32;
    floorMat.environmentIntensity = 1.1;
    const floor = MeshBuilder.CreateDisc('studio-floor', { radius: 40, tessellation: 96 }, scene);
    floor.rotation.x = Math.PI / 2;
    floor.material = floorMat;
    floor.receiveShadows = true;
    this.floor = floor;

    // Soft light pool under the car.
    const pool = MeshBuilder.CreateDisc('studio-pool', { radius: 8.5, tessellation: 64 }, scene);
    pool.rotation.x = Math.PI / 2;
    pool.position.y = 0.012;
    const poolTex = new DynamicTexture('pool-tex', { width: 256, height: 256 }, scene, false);
    const ctx = poolTex.getContext();
    const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.45, 'rgba(210,235,225,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    poolTex.update();
    const poolMat = new StandardMaterial('studio-pool-mat', scene);
    poolMat.diffuseTexture = poolTex;
    poolMat.opacityTexture = poolTex;
    poolMat.emissiveColor = new Color3(0.65, 0.85, 0.78);
    poolMat.disableLighting = true;
    poolMat.backFaceCulling = false;
    poolMat.alpha = 0.9;
    pool.material = poolMat;
    pool.isPickable = false;

    // Studio backdrop: a soft vertical gradient cyclorama.
    const backdrop = MeshBuilder.CreateSphere('studio-backdrop', { diameter: 90, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene);
    const backdropMat = new StandardMaterial('studio-backdrop-mat', scene);
    const backdropTex = new DynamicTexture('studio-backdrop-tex', { width: 8, height: 256 }, scene, false);
    const bctx = backdropTex.getContext();
    const bgrad = bctx.createLinearGradient(0, 0, 0, 256);
    bgrad.addColorStop(0, '#05080a');
    bgrad.addColorStop(0.55, '#101619');
    bgrad.addColorStop(0.78, '#1b2427');
    bgrad.addColorStop(1, '#070a0b');
    bctx.fillStyle = bgrad;
    bctx.fillRect(0, 0, 8, 256);
    backdropTex.update();
    backdropMat.emissiveTexture = backdropTex;
    backdropMat.disableLighting = true;
    backdropMat.backFaceCulling = false;
    backdropMat.fogEnabled = false;
    backdrop.material = backdropMat;
    backdrop.isPickable = false;
    backdrop.infiniteDistance = true;

    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      this.idleTime += dt;
      if (this.idleTime - this.lastInteraction > 6) {
        this.camera.alpha += dt * 0.075;
      }
    });

    scene.onPointerObservable.add(() => {
      this.lastInteraction = this.idleTime;
    });
  }

  async setVehicle(profile: VehicleProfile, paintHex: string, rimHex: string): Promise<void> {
    const token = ++this.loadingToken;
    const previous = this.view;
    this.paintHex = paintHex;
    this.rimHex = rimHex;
    const view = await VehicleView.create(this.scene, profile, paintHex, rimHex, { simplified: false });
    if (token !== this.loadingToken) {
      view.dispose();
      return;
    }
    if (previous) {
      previous.dispose();
    }
    this.view = view;
    for (const mesh of view.casters) {
      this.shadows.addShadowCaster(mesh, true);
    }
    this.camera.setTarget(new Vector3(0, Math.min(0.85, profile.dimensions.height * 0.55), 0));
  }

  setPaint(hex: string): void {
    this.paintHex = hex;
    this.view?.setPaint(hex);
  }

  setRimColor(hex: string): void {
    this.rimHex = hex;
    this.view?.setRimColor(hex);
  }

  /** Applies a slow turntable spin while the garage is open. */
  update(_dt: number): void {
    void this.paintHex;
    void this.rimHex;
    void this.floor;
  }

  dispose(): void {
    this.view?.dispose();
    this.view = null;
    this.scene.dispose();
  }
}
