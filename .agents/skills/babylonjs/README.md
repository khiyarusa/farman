# Babylon.js 8 in a Vite + TypeScript project

Practical defaults for FARMAN, from the official Babylon.js docs (sources at the end). **Version
note:** the project pins `@babylonjs/core` and `@babylonjs/loaders` to exactly **8.56.2**; the import
paths below were verified against 8.0.0. npm's latest is 9.35.0 — keep the pin, never mix majors.

## 1. Imports that actually tree-shake

`@babylonjs/core@8` declares `"sideEffects": true`, so a bundler cannot drop unused modules. That
is why the barrel import is banned here:

```ts
// ✗ pulls in ~everything
import { Engine, Scene } from "@babylonjs/core";

// ✓ per-file, with the .js extension; folders Capitalised, files lowercase
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder.js";
```

The docs measure ~700 KB this way against ~2.3 MB for the bundled import. Some modules also load by
side effect: a scene using the default material needs `standardMaterial.js`, and deserialising a
PBR material needs `pbrMaterial.js` imported first. The same rule holds in Vite — and verify it on
`vite build` output, not the dev server, which pre-bundles dependencies.

## 2. Engine and scene

```ts
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
// 2nd arg: antialiasing. 4th arg: adaptToDeviceRatio — off by default, costs fill rate.
// preserveDrawingBuffer: true only in a capture build (see below).
const engine = new Engine(canvas, true, { stencil: true, preserveDrawingBuffer: false }, false);
const scene = new Scene(engine);

engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize()); // fires on orientation change too
```

`canvas.toDataURL()` and Playwright screenshots come back blank without `preserveDrawingBuffer`;
never ship it enabled.

## 3. PBR materials

```ts
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";

const paint = new PBRMaterial("paint", scene);
paint.albedoColor = new Color3(0.05, 0.28, 0.42);
paint.metallic = 0.9;      // setting metallic OR roughness OR metallicTexture is what
paint.roughness = 0.35;    // selects metallic-roughness mode
paint.albedoTexture = new Texture("/tex/paint_basecolor.webp", scene);
paint.bumpTexture = new Texture("/tex/paint_normal.webp", scene);
```

If none of those three is set, `PBRMaterial` silently runs in **specular-glossiness** mode. For a
glTF-style packed ORM map: `useRoughnessFromMetallicTextureGreen = true`,
`useMetallnessFromMetallicTextureBlue = true` (the API really is spelled "Metallness"). A PBR metal
with nothing to reflect renders black — assign `scene.environmentTexture` before judging paint.

## 4. Loading GLB

```ts
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
registerBuiltInLoaders();                        // once, before any load

import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader.js";
const container = await LoadAssetContainerAsync("/models/peykan.glb", scene);
container.addAllToScene();                       // or inspect, then add
```

Prefer `registerBuiltInLoaders` to `import "@babylonjs/loaders"`: it registers everything but pulls
each importer in dynamically on first use, keeping the glTF parser out of the initial bundle. The
container form suits a vehicle cache — load once, `addAllToScene()` per spawn.

## 5. Shadows

```ts
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js";
const shadows = new ShadowGenerator(1024, sunLight);
shadows.addShadowCaster(vehicleRoot, true);              // true = include descendants
shadows.usePercentageCloserFiltering = true;
shadows.filteringQuality = ShadowGenerator.QUALITY_LOW;  // WebGL2; falls back to Poisson
shadows.bias = 0.0001;                                   // default 0.00005; tune against acne
ground.receiveShadows = true;
```

One generator per light, and one shadow-casting light is the mobile budget.
`useBlurExponentialShadowMap` is softest and slowest. Skip point-light shadows on phones: they
render a cubemap, six faces, and the docs warn about exactly that.

## 6. Instancing

```ts
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js";
const master = container.meshes[0] as Mesh;
master.setEnabled(false);                        // don't draw the source mesh
for (let i = 0; i < 40; i++) {
  master.createInstance(`barrier_${i}`).position.set(i * 8, 0, 12);
}
```

Instances of one mesh share a material and draw in a **single draw call**. Per instance you may
change only `position`, `rotation`, `rotationQuaternion`, `scaling`, `setPivotMatrix`; anything else
needs `registerInstancedBuffer` or a real clone. For glTF sources keep the parent
(`inst.setParent(master.parent)`) or detach it — the loader wraps right-handed glTF in a negative-Z
parent. Past ~1000 copies with no per-instance logic, use thin instances.

## 7. Mobile performance rules

- **Draw calls:** a few hundred per frame. Instancing and shared materials are the levers; every new material is a state change.
- **Materials:** one per surface family (paint, glass, rubber, road, foliage); ten vehicles sharing four beat ten with ten.
- **Textures:** 1024² props, 2048² max for hero vehicle and road atlas; compressed (WebP/KTX2), mipmapped. 2× pixel ratio is 4× the pixels.
- **Lights:** 1–2 real-time plus baked; one directional light casting shadows.
- **CPU-bound wins:** `scene.performancePriority = ScenePerformancePriority.Intermediate` freezes
  materials, skips pointer picking and disables autoClear; `mesh.freezeWorldMatrix()` on static
  geometry; `scene.blockMaterialDirtyMechanism = true` around bulk material edits.
- **Measure:** `SceneInstrumentation.drawCallsCounter`, `EngineInstrumentation.captureGPUFrameTime`
  (needs `EXT_disjoint_timer_query` — check for it on the device first). Read ms and p95, uncapped.

## Sources

[ES6 + tree shaking](https://doc.babylonjs.com/setup/frameworkPackages/es6Support) · [Loading files](https://doc.babylonjs.com/features/featuresDeepDive/importers/loadingFileTypes) · [PBR](https://doc.babylonjs.com/features/featuresDeepDive/materials/using/masterPBR)
[Shadows](https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows) · [Instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances)
[Optimize your scene](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene) · [Framework versions](https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers)
