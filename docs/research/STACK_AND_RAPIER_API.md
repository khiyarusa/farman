# FARMAN — Stack & Rapier Vehicle API verification

Retrieved **2026-11-12**. Method: pinned packages fetched with `npm pack` / installed into a scratch dir
(`%TEMP%\farman-verify`, never the repo), shipped `.d.ts` files read directly, then behaviour measured by
executing the real packages under Node 24.20.0 / npm 11.19.0; a real production Vite build was produced.
Citations: `pkg@version → path:line` for package files, `URL` for web docs.

> Scope: this reports what the packages **do**. Where a shipped declaration disagrees with measured
> behaviour, both are recorded.

## 0. Pin verdict

| Package | Pin | Published? | Verdict |
|---|---|---|---|
| `@babylonjs/core` | 8.56.2 | yes — **final 8.x** (170 releases; `latest` = 9.35.0) | OK, 3 majors behind |
| `@dimforge/rapier3d-compat` | 0.21.0 | yes — equals `latest` | OK |
| `vite` | 7.3.8 | yes — `latest` 8.3.8 | OK |
| `typescript` | 5.9.3 | yes — `latest` 7.0.2 | OK; satisfies typescript-eslint peer |
| `vitest` | 3.2.7 | yes — `latest` 5.1.0, tag `V3` = 3.2.7 | OK |
| `@capacitor/core` `cli` `android` | 8.6.0 | yes — equals `latest` | OK |
| `playwright` | 1.65.0 | yes — equals `latest` | OK |

All eight resolve: `npm view <pkg>@<pin> version` returned each pin exactly (2026-11-12).

---

## 1. `@dimforge/rapier3d-compat` 0.21.0

### 1.1 `init()` for the compat build

```ts
// dist/init.d.ts:3 — "Initializes RAPIER. Has to be called and awaited before using any library methods."
export declare function init(): Promise<void>;
```
```ts
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();          // no argument, no wasm path
```

- **No arguments needed**: wasm is base64-inlined in `dist/rapier.mjs` (4,340,292 B; contains the wasm magic
  `AGFzbQ`). A Vite build emitted **no** `.wasm` asset → nothing to copy or configure. Measured cold init
  111–119 ms.
- Default (`RAPIER.init`) and named (`import { init }`) both work; double `await` is safe (idempotent).
- `dist/rapier.d.ts:2-3` → `export * from "./exports"; export default RAPIER;`
- `package.json`: `main: dist/rapier.cjs`, `module: dist/rapier.mjs`, `types: dist/rapier.d.ts`,
  `sideEffects: false`, **no `exports` map** (deep imports resolve by path).

### 1.2 `DynamicRayCastVehicleController` — complete API (verbatim)

Source: `dist/control/ray_cast_vehicle_controller.d.ts`. All 49 prototype members (plus `constructor`) were
also confirmed by enumerating the live prototype.

```ts
export declare class DynamicRayCastVehicleController {
    constructor(chassis: RigidBody, broadPhase: BroadPhase, narrowPhase: NarrowPhase,
                bodies: RigidBodySet, colliders: ColliderSet);                                    // :15
    /** @internal */ free(): void;
    updateVehicle(dt: number, filterFlags?: QueryFilterFlags, filterGroups?: InteractionGroups,
                  filterPredicate?: (collider: Collider) => boolean): void;                       // :28
    currentVehicleSpeed(): number;                                                                // :32
    chassis(): RigidBody;
    get indexUpAxis(): number;                      set indexUpAxis(axis: number);                // :40
    get indexForwardAxis(): number;                 set setIndexForwardAxis(axis: number);         // :48,:52 ← G3
    addWheel(chassisConnectionCs: Vector, directionCs: Vector, axleCs: Vector,
             suspensionRestLength: number, radius: number): void;                                 // :62
    numWheels(): number;                                                                          // :66
    wheelChassisConnectionPointCs(i, target?: Vector): Vector | null;
    setWheelChassisConnectionPointCs(i, value: Vector): void;
    wheelSuspensionRestLength(i): number | null;    setWheelSuspensionRestLength(i, v): void;      // :86
    wheelMaxSuspensionTravel(i): number | null;     setWheelMaxSuspensionTravel(i, v): void;       // :94
    wheelRadius(i): number | null;                  setWheelRadius(i, v): void;                    // :102
    wheelSuspensionStiffness(i): number | null;     setWheelSuspensionStiffness(i, v): void;
    wheelSuspensionCompression(i): number | null;   setWheelSuspensionCompression(i, v): void;
    wheelSuspensionRelaxation(i): number | null;    setWheelSuspensionRelaxation(i, v): void;
    wheelMaxSuspensionForce(i): number | null;      setWheelMaxSuspensionForce(i, v): void;
    wheelBrake(i): number | null;                   setWheelBrake(i, v): void;                     // :150
    wheelSteering(i): number | null;                setWheelSteering(i, v): void;                  // :154
    wheelEngineForce(i): number | null;             setWheelEngineForce(i, v): void;               // :166
    wheelDirectionCs(i, target?: Vector): Vector | null;   setWheelDirectionCs(i, v): void;
    wheelAxleCs(i, target?: Vector): Vector | null;        setWheelAxleCs(i, v): void;
    wheelFrictionSlip(i): number | null;            setWheelFrictionSlip(i, v): void;              // :212
    wheelSideFrictionStiffness(i): number | null;   setWheelSideFrictionStiffness(i, v): void;     // :224
    wheelRotation(i): number | null;                                                              // :228
    wheelForwardImpulse(i): number | null;          wheelSideImpulse(i): number | null;
    wheelSuspensionForce(i): number | null;
    wheelContactNormal(i, target?: Vector): Vector | null;                                        // :248
    wheelContactPoint(i, target?: Vector): Vector | null;
    wheelSuspensionLength(i): number | null;                                                      // :260
    wheelHardPoint(i, target?: Vector): Vector | null;                                            // :268
    wheelIsInContact(i): boolean;                                                                 // :272
    wheelGroundObject(i): Collider | null;                                                        // :276
}
```

**No `Wheel` class, no `wheelInfos`; `addWheel()` returns `undefined`** (measured). Wheels are addressed
purely by integer index — the `chassisConnectionPointCs / suspensionRestLength / radius / …` "wheel object
fields" belong to ammo.js `btRaycastVehicle`, **not** Rapier.

**Absent** (all `typeof === 'undefined'`, verified): `setWheelSuspensionRaise`, `wheelSuspensionRaise`,
`setWheelSkidInfo`, `wheelSkidInfo`, `setWheelDeltaRotation`, `wheelDeltaRotation`, `resetSuspension`.

**Raycast output is push-based, not returned**: after `updateVehicle()` read `wheelIsInContact(i)`,
`wheelSuspensionLength(i)`, `wheelContactNormal(i)`, `wheelContactPoint(i)`, `wheelHardPoint(i)`,
`wheelGroundObject(i)`, plus `wheelRotation(i)` and `currentVehicleSpeed()`.

### 1.3 Wall-clock: what `updateVehicle` actually does

Verbatim (`:161`) `setWheelEngineForce` → *"Sets the forward force applied by the i-th wheel on the chassis."*
Verbatim (`:145`) `setWheelBrake` → *"Set the maximum amount of braking impulse applied on the i-th wheel to
slow down the vehicle."*

Measured on a 1 000 kg chassis, 4 wheels in contact, `updateVehicle(dt)` then `world.step()`:

**(a) Engine force is Newtons, integrated over the `dt` you pass.** One call, `F = 500`/wheel (2 000 N):

| `dt` | measured Δv | `F_total · dt / m` |
|---|---|---|
| 1/120 | 0.01667 | 0.01667 |
| 1/60 | 0.03333 | 0.03333 |
| 1/30 | 0.06667 | 0.06667 |

→ **Δv = F × dt / m per wheel.** So **calling `updateVehicle` twice per `world.step()` doubles the force**:
speed after 1 s at `F = 300`/wheel was 0.961 m/s (1 call/step), 1.935 (2), 3.568 (4). Re-setting the same
force each call changes nothing (setter is idempotent) — the multiplication comes from the **call count**.
**Call `updateVehicle` exactly once per physics step.**

**(b) Brake is an impulse in N·s and is NOT scaled by `dt`.** `B = 100`/wheel, 4 wheels, m = 1 000:
Δv = 0.400 at both `dt = 1/60` and `1/30` (0.327 at 1/120, there traction-limited). Rule `Δv = B × wheels / m`
holds across the sweep (B = 10→0.04, 25→0.10, 50→0.20, 100→0.40), scales with call count (B=50: 1→0.20,
2→0.40, 4→0.80) and is per-wheel (B=50: 1 wheel→0.05, 4→0.20). Saturates high (B≥250 → Δv capped 0.655).
No wheel contact ⇒ no effect (Δv = 0). → **Frame-rate dependent; normalise it yourself.**

**(c) `frictionSlip` only clamps — it never scales.** At `F = 300`/wheel (below grip) speed was identical
(1.89 m/s) for `fs` = 0.5 / 1 / 2 / 5 / 10.5. At `F = 3 000` it bites: `fs`0.5→13.16, 1→15.08, 2→17.00,
5→18.26 m/s. It is an upper bound on longitudinal impulse, visible only once engine force exceeds traction.

**(d) Drive direction comes from the axle, not `indexForwardAxis`.** Suspension `(0,-1,0)`: `axleCs.z = -1`
→ drives to **−X** (`currentVehicleSpeed()` −1.575); `axleCs.z = +1` → **+X** (+1.575). Flip the axle to
reverse. Defaults `indexForwardAxis = 0` (X), `indexUpAxis = 1` (Y).

### 1.4 Defaults present right after `addWheel` (measured; rest length 0.35, radius 0.4 passed in)

`suspensionStiffness` 5.88 · `suspensionCompression` 0.83 · `suspensionRelaxation` 0.88 ·
`maxSuspensionForce` 6000 · `maxSuspensionTravel` 5 · `frictionSlip` 10.5 · `sideFrictionStiffness` 1 ·
`brake`/`steering`/`engineForce`/`rotation` 0. These are Bullet `btRaycastVehicle` defaults, consistent with
the controller being "ported from the `btRaycastVehicle` of Bullet" —
[rapier.rs vehicle_controller](https://rapier.rs/docs/user_guides/javascript/vehicle_controller) (retrieved
2026-11-12).

### 1.5 Diff vs 0.14 (read from both packages)

| | 0.14.0 | 0.21.0 |
|---|---|---|
| Constructor | `(chassis, bodies, colliders, queries: QueryPipeline)` — **4 args** (`control/…:14`) | `(chassis, broadPhase, narrowPhase, bodies, colliders)` — **5 args** (`:15`) |
| `updateVehicle` | 4-param form (`:27`) | identical 4-param form (`:28`) |
| `addWheel` → `void` | yes (`:61`) | yes (`:62`) |
| `Wheel` object | never existed | still absent |
| `init()` | `Promise<void>` | unchanged |
| Layout / wasm | files at package root; separate `rapier_wasm3d_bg.wasm` (3.08 MB) | `dist/…`; wasm base64-inlined |
| `world.createVehicleController` | present (`pipeline/world.d.ts:191`) | present; `removeVehicleController` too |

**The real 0.14→0.21 break is the constructor**: `QueryPipeline` replaced by `broadPhase` + `narrowPhase`.
0.14-era snippets fail at runtime. Prefer the stable factory `world.createVehicleController(chassis)`
(returns a real instance, `instanceof` verified) and free with `world.removeVehicleController(v)`.

`filterExcludeCollider` / `filterExcludeRigidBody` exist in **neither** version. The official replacement is
the flag form — the docs' own loop is
`vehicle.updateVehicle(world.integrationParameters.dt, RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC)`
([rapier.rs](https://rapier.rs/docs/user_guides/javascript/vehicle_controller)), which also stops rays hitting
the chassis. `world.integrationParameters.dt` equals `world.timestep` (measured 0.01666666753590107).

---

## 2. `@babylonjs/core` 8.56.2

Read from the installed package (`node_modules/@babylonjs/core`).

```ts
// Engines/engine.d.ts:288
constructor(canvasOrContext: Nullable<HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContext
            | WebGL2RenderingContext>, antialias?: boolean, options?: EngineOptions,
            adaptToDeviceRatio?: boolean);
// scene.d.ts:1322
constructor(engine: AbstractEngine, options?: SceneOptions);
// Engines/abstractEngine.d.ts:562
runRenderLoop(renderFunction: () => void): void;
// Lights/Shadows/shadowGenerator.d.ts:578
constructor(mapSize: number, light: IShadowLight, usefullFloatFirst?: boolean,
            camera?: Nullable<Camera>, useRedTextureType?: boolean, forceGLSL?: boolean);
// Materials/PBR/pbrMaterial.d.ts:397
constructor(name: string, scene?: Scene, forceGLSL?: boolean);
// Loading/sceneLoader.d.ts:426 (standalone)
export declare function LoadAssetContainerAsync(source: SceneSource, scene: Scene,
            options?: LoadAssetContainerOptions): Promise<AssetContainer>;
```

- **`Engine.NewScene` does not exist in 8.56.2.** Zero hits for `static NewScene` package-wide; the only
  `NewScene` token is `onNewSceneAddedObservable` (`Engines/abstractEngine.js:937`). Use `new Scene(engine)`.
- **GLB**: either `SceneLoader.LoadAssetContainerAsync(rootUrl, sceneFilename?, scene?, onProgress?,
  pluginExtension?, name?)` → `Promise<AssetContainer>` (`Loading/sceneLoader.d.ts:625`), or the standalone
  `LoadAssetContainerAsync(source, scene, options?)` (`:426`). Lowercase `loadAssetContainerAsync` is marked
  `@deprecated Please use LoadAssetContainerAsync instead` (`:429`).
- **PBR**: `new PBRMaterial(name, scene)`; `metallic`, `roughness`, `albedoColor: Color3`
  (`Materials/PBR/pbrMaterial.d.ts:179`), `environmentIntensity` (`:50`).
- **Shadows**: `new ShadowGenerator(1024, light)`; `usePercentageCloserFiltering` /
  `useBlurExponentialShadowMap` / `filteringQuality` (`:341`–`:379`), `addShadowCaster`,
  `getShadowMap(): Nullable<RenderTargetTexture>` (`:58`).

### Tree-shaking does require side-effect imports — yes

`package.json` declares `"sideEffects": ["**/*", "!src/Maths/ThinMaths/**"]`, so bundlers must treat (almost)
every file as side-effectful and cannot drop unused code from a barrel import. Import **deep file paths**
only, plus explicit side-effect imports for anything registered by side effect.

Measured with Vite 7.3.8, same feature set, production build:

| Import style | Bundle | gzip |
|---|---|---|
| Deep paths (`@babylonjs/core/Engines/engine.js`, …) | **1,717.89 kB** | 413.95 kB |
| Barrel (`from "@babylonjs/core"`) | **5,958.40 kB** | 1,299.12 kB |

→ 3.5× penalty. Official confirmation —
[doc.babylonjs.com ES6 support](https://doc.babylonjs.com/setup/frameworkPackages/es6Support) (retrieved
2026-11-12): *"Some of the modules work through side effects, so you might need to `import
"@babylonjs/core/Meshes/meshBuilder.js"` for side effects only"*; FAQ: *"By default, any mesh in a scene are
using the scene defaultMaterial. With tree shaking you might not need this material… you can simply `import
"@babylonjs/core/Materials/standardMaterial.js"`"*; and *"if you know you will need to deserialize a
PBRMaterial, you can `import "@babylonjs/core/Materials/PBR/pbrMaterial.js"` beforehand."*

Verified to exist and typecheck: `Materials/standardMaterial.js`, `Rendering/depthRendererSceneComponent.js`,
and for GLB `@babylonjs/loaders/glTF/2.0/index.js` (`@babylonjs/loaders@8.56.2`, `"sideEffects": true`).
Both `moduleResolution: "bundler"` and `"NodeNext"` typecheck clean; there is **no `exports` map**, so the
`.js` extension in deep specifiers is mandatory.

---

## 3. `vite` 7.3.8

`engines.node: "^20.19.0 || >=22.12.0"` → Node 24.20.0 OK. A real build of Babylon 8.56.2 + Rapier 0.21.0 +
TS 5.9.3 succeeded in **10.61 s**, zero type errors, **no `.wasm` emitted**, no Babylon-specific config.

## 4. `typescript` 5.9.3

`typescript-eslint@8.72.0` peer is `"typescript": ">=4.8.4 <6.1.0"` → **5.9.3 satisfies it**
(`npm view typescript-eslint@8.72.0 peerDependencies`, 2026-11-12). No conflict.

## 5. `vitest` 3.2.7

`vitest@3.2.7` depends on `"vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"` → **vite 7.3.8 satisfies `^7.0.0-0`**, so
npm dedupes to one Vite copy. It declares no `vite` *peer*, so the usual "vitest 3 vs vite 7" worry does not
apply to this pin pair. `engines.node: "^18 || ^20 || >=22"` OK. Keep `@vitest/coverage-v8@3.2.7` in lockstep
(peer `vitest: 3.2.7`).

## 6. Capacitor 8.6.0 (core / cli / android)

**Requirements (official)** — [environment setup](https://capacitorjs.com/docs/getting-started/environment-setup)
(retrieved 2026-11-12): NodeJS **22+** (and `@capacitor/cli@8.6.0` `engines.node` is literally `">=22.0.0"`);
Android Studio **Otter | 2025.2.1+**; Android SDK Platform **API 24+**; *"You do not need to separately
install the Java Development Kit (JDK). Android Studio will automatically install the proper JDK for you."*

**JDK 17** — AGP compatibility table: `JDK | 17 | 17` (min 17, default 17); also `Gradle | 8.13`,
`SDK Build Tools | 35.0.0`, max API 36 — [AGP release notes](https://developer.android.com/build/releases/gradle-plugin)
(page updated 2026-01-08, retrieved 2026-11-12).

**What `npx cap add android` actually generated** (`@capacitor/android@8.6.0`, run 2026-11-12):
`build.gradle` → `classpath 'com.android.tools.build:gradle:8.13.0'`; `gradle-wrapper.properties` →
`gradle-8.14.3-all.zip`; `variables.gradle` → `minSdkVersion 24`, `compileSdkVersion 36`,
`targetSdkVersion 36`, activity 1.11.0 / appcompat 1.7.1 / core 1.17.0 / fragment 1.8.9 / webkit 1.14.0.
Matches the migration guide verbatim ([updating to 8](https://capacitorjs.com/docs/updating/8-0), retrieved
2026-11-12): *"minSdkVersion = 24 / compileSdkVersion = 36 / targetSdkVersion = 36"*, *"Update gradle plugin
to 8.13.0"*, *"Update gradle wrapper to 8.14.3"*.

**`cap add android` works without a local Android SDK — confirmed.** On a machine with no Android SDK, no
`ANDROID_HOME`, no JDK 17: `√ Adding native android project in android in 308.04ms`; `npx cap sync android`
→ `√ Sync finished in 0.267s`, including *"Copying web assets from dist to
android\app\src\main\assets\public"*. Only Gradle **assembly** needs the SDK. Re-verified in a path with
spaces and parentheses (`…\farman space test\Farman (Android)`): succeeded in 468 ms — the repo's own
`Farman (Android)` path is fine for JS-side tooling.

**GitHub Actions**: `ubuntu-latest` (Ubuntu 24.04 image) **already ships the Android SDK** — no
`android-actions/setup-android` step needed. From the runner manifest
([Ubuntu2404-Readme](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md),
image `20260907.300.1`, retrieved 2026-11-12): `ANDROID_HOME=/usr/local/lib/android/sdk`, platforms include
**`android-36`**, build-tools 36.0.0/36.1.0/35.0.0, NDK 27.3.13750724, Java **17.0.20 is the default**
(`JAVA_HOME_17_X64`; 21 and 25 also present), Node 22.23.2 / 24.20.0 cached. CI shape: `npm ci` →
`npm run build` → `npx cap sync android` → `cd android && ./gradlew assembleDebug` (wrapper 8.14.3 is used,
not the image's Gradle 9.7.1). Pin `actions/setup-java@v4` `temurin` `17` if you want determinism.
Capacitor's own CI page pushes hosted Appflow rather than a YAML recipe —
[ci-cd](https://capacitorjs.com/docs/guides/ci-cd) (retrieved 2026-11-12).

## 7. `playwright` 1.65.0

`engines.node: ">=20"` → OK on Node 24.20; equals `latest`, so no skew. Not exercised here.

---

## 8. Gotchas

- **G1 — call `updateVehicle` exactly once per `world.step()`.** Engine force is integrated over the `dt` you
  pass, so N calls apply N×dt of force (0.961 / 1.935 / 3.568 m/s for 1/2/4 calls at F=300).
- **G2 — engine force (N, ×dt) and brake (N·s, not ×dt) use different unit systems.** Brake is therefore
  frame-rate dependent; normalise it or stopping distance drifts with step rate.
- **G3 — `indexForwardAxis` has no setter.** `vehicle.indexForwardAxis = 2` throws
  `TypeError: Cannot set property indexForwardAxis of #<…> which has only a getter`. The declaration is
  misnamed: the setter is `set setIndexForwardAxis(axis)` (`:52`), so write `vehicle.setIndexForwardAxis = 2`.
  `indexUpAxis` is a normal get/set pair.
- **G4 — no `Wheel` object.** `addWheel()` returns `undefined`; no `wheelInfos`. `const w =
  vehicle.addWheel(...); w.suspensionStiffness = …` is ammo.js, not Rapier.
- **G5 — `number | null` is a lie at the edges.** Out-of-range index: scalar getters return **`undefined`**
  (not `null`), vector getters return `null`, and **`wheelGroundObject(5)` returns a bogus `Collider`** — a
  dangling handle if used. `wheelIsInContact(5)` → `false`; setters silently no-op. Guard with
  `i < vehicle.numWheels()`; test with `??`/`!= null`, never `=== null`.
- **G6 — never use the 0.14 constructor.** 0.21 takes `(chassis, broadPhase, narrowPhase, bodies, colliders)`.
  Use `world.createVehicleController(chassis)` / `world.removeVehicleController(v)`.
- **G7 — pass `QueryFilterFlags.EXCLUDE_DYNAMIC`** (or a predicate) to `updateVehicle`, else wheel rays can hit
  the chassis and read it as ground. This replaces the non-existent `filterExcludeCollider` argument.
- **G8 — drive direction follows `axleCs`.** Flipping its sign reverses the car and negates
  `currentVehicleSpeed()`. Keep the axle perpendicular to intended forward or it will not move.
- **G9 — Babylon barrel imports cost 3.5×** (1.72 MB vs 5.96 MB). Import deep paths; add `standardMaterial` /
  `pbrMaterial` / `glTF/2.0` side-effect imports explicitly.
- **G10 — `Engine.NewScene` is not in Babylon 8.** Use `new Scene(engine)`.
- **G11 — `wheelRotation(i)` is accumulated spin**, not a normalised angle (0 at rest, 0.4348 after 30 driven steps) — use it as a delta and wrap for rendering.
- **G12 — Babylon 8.56.2 is a dead end**: last 8.x ever, with 9.35.0 shipped. Choose that knowingly.

## 9. Verified / unverified

| Claim | Status | Evidence |
|---|---|---|
| All 8 pins exist on npm | **Verified** | `npm view <pkg>@<pin> version`, 2026-11-12 |
| `RAPIER.init()` argless; wasm inlined | **Verified** | runtime + `AGFzbQ` in `rapier.mjs`; no `.wasm` in build |
| Full vehicle-controller member list | **Verified** | `.d.ts` + live prototype (49 members) |
| No `Wheel` object; `addWheel` → `undefined` | **Verified** | `.d.ts:62` + runtime |
| Engine force = N; Δv = F·dt/m | **Verified** | 3-point dt sweep, exact |
| Brake = N·s; Δv = B·wheels/m; not dt-scaled | **Verified** | dt + B/wheel/call sweeps |
| `frictionSlip` clamps only above traction | **Verified** | F=300 flat; F=3000 monotonic |
| 0.14 ctor is 4-arg with `QueryPipeline` | **Verified** | `@0.14.0 → control/…:14` |
| `indexForwardAxis` setter misnamed/getter-only | **Verified** | `.d.ts:52` + runtime `TypeError` |
| Babylon 8 engine/scene/PBR/shadow/loader signatures | **Verified** | 8.56.2 `.d.ts` line refs |
| `Engine.NewScene` absent in 8.56.2 | **Verified** | package-wide grep = 0 hits |
| Side-effect imports needed; 3.5× barrel cost | **Verified** | `sideEffects` field + two real builds |
| Vite 7.3.8 + Babylon 8 + Rapier 0.21 + TS 5.9 | **Verified** | `vite build` 10.61 s; `tsc --noEmit` clean |
| vitest 3.2.7 accepts vite 7.3.8 | **Verified** | dep `vite ^5\|\|^6\|\|^7.0.0-0` |
| typescript-eslint 8.72 accepts TS 5.9.3 | **Verified** | peer `>=4.8.4 <6.1.0` |
| Capacitor 8: Node ≥22, AGP 8.13, Gradle 8.14.3, JDK 17, SDK 24/36 | **Verified** | docs + generated files |
| `cap add`/`sync` without Android SDK, incl. spaced path | **Verified** | exit 0; 308 ms / 468 ms |
| `ubuntu-latest` has Android SDK + JDK 17 + `android-36` | **Verified** | runner image manifest |
| Playwright 1.65 on Node 24 | **Verified (engines)** | `>=20` |
| **Runtime rendering / 60 fps in a real Android WebView** | **Unverified** | no device, SDK or JDK locally |
| **`./gradlew assembleDebug` end-to-end in CI** | **Unverified** | cannot build locally; CI not run |
| **Babylon 8 vs the live doc site** | **Caveat** | doc.babylonjs.com is not version-pinned to 8 (nav already shows v9-era "Babylon Lite"); v8 claims rest on the 8.56.2 package |
| **Rapier determinism across ARM devices** | **Unverified** | not tested |
| **Playwright E2E against the built bundle** | **Unverified** | not run this pass |
| **Babylon 8 → 9 migration cost** | **Unverified** | not attempted |

## 10. Suggested next steps

1. **Prove the Android build in CI before writing game code**: one workflow doing `npm ci && npm run build &&
   npx cap sync android && ./gradlew assembleDebug`. It is the only unverified load-bearing claim and it is
   cheap on `ubuntu-latest`.
2. **Benchmark the 1.72 MB bundle for WebView startup**; if it hurts, code-split the GLB loader and heavy PBR
   fragment shaders, or drop to `StandardMaterial` for distant props.
3. **Tune against mass, not against tutorials.** The official example uses `setWheelEngineForce(0, 30)` because
   its chassis is light (density 100 on a ~0.6 m hull); and remember brake is an impulse, not a force.
4. **Re-evaluate the Babylon major before building deep** — 8.56.2 receives no further patches.
