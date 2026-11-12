# FARMAN — Technical Design Document

Scope: the code in this repository at `APP.version 0.1.0` (2026-11-12). File paths are
relative to the repository root. Numbers below were read from source, not estimated.

## 1. Runtime shape

| Concern | Decision |
|---|---|
| Language | TypeScript 5.9, `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters` (`tsconfig.json`) |
| Build | Vite 7.3, `base: './'`, target `es2022`, Babylon and Rapier split into manual chunks (`vite.config.ts`) |
| Render | Babylon.js 8.56.2, one `Engine` for the app lifetime, scenes swapped (`src/rendering/renderer.ts`) |
| Physics | Rapier 3D 0.21 (compat, wasm inlined), one `World` per drive |
| Shell | Capacitor 8.6, `webDir: 'dist'`, Android scheme `https` (`capacitor.config.ts`) |
| Simulation rate | 60 Hz fixed, accumulator with a 4-step ceiling (`src/core/config.ts`) |
| Persistence | `localStorage`, versioned JSON (`src/save/`) |

## 2. Module map

| Path | Responsibility | Notes |
|---|---|---|
| `src/core/config.ts` | Immutable constants: physics, render, economy, world | Single source for tuning |
| `src/core/loop.ts` | `FixedStepLoop` accumulator | Returns step count, exposes `alpha` |
| `src/core/math.ts`, `rng.ts`, `events.ts` | Math helpers, seeded RNG, typed emitter | RNG used by traffic; emitter unused in the drive loop |
| `src/physics/world.ts` | Rapier world wrapper: heightfield, trimesh, boxes, body creation | Also holds unused vehicle-controller plumbing |
| `src/vehicles/profile.ts` | `VehicleProfile` schema + `validateProfile()` | 17 range/structure checks plus a monotonic-curve check |
| `src/vehicles/profiles/*.ts` | Three car data files + registry | `index.ts` exports `VEHICLE_PROFILES` |
| `src/vehicles/engine.ts` | rpm state, torque curve, friction, limiter, stall, thermal, fuel | No knowledge of gears |
| `src/vehicles/transmission.ts` | Manual clutch, torque converter, CVT, auto shift schedule | Returns reaction torque |
| `src/vehicles/tire.ts` | Longitudinal Magic-Formula-ish curve, `effectiveMu` | Load/temp/wear/surface factors |
| `src/vehicles/vehicle.ts` | Chassis body, load transfer, tyre forces, assists, telemetry | 713 lines, the core of handling |
| `src/world/surface.ts` | `SurfaceKind`, `SurfaceProvider` interface | `DRY_SURFACE` test double |
| `src/traffic/traffic.ts` | Lane-following agents, kinematic bodies | O(n²) headway scan |
| `src/missions/definitions.ts` | Seven mission definitions | Persian strings inline |
| `src/missions/manager.ts` | Objective evaluation, scoring, reward | Per-kind switch |
| `src/rendering/renderer.ts` | Engine, scaling, render loop | `setHardwareScalingLevel` |
| `src/rendering/worldScene.ts` | World load, road index, surface provider, colliders | `roadUnder`, `groundHeightAt` |
| `src/rendering/environment.ts` | Sky dome, procedural env cube, sun, shadows, fog, ACES | PBR reflections without remote assets |
| `src/rendering/vehicleView.ts` | GLB binding, paint/rim materials, wheel animation | Proxy mesh fallback |
| `src/rendering/cameraRig.ts`, `studio.ts` | Chase/close/hood camera; garage orbit camera and showroom | `damp()` smoothing |
| `src/ui/design.css` | Design tokens, RTL layout, HUD, controls | 1,231 lines |
| `src/ui/i18n.ts` | All Persian UI strings | Single dictionary |
| `src/ui/format.ts` | Persian digits, grouping, money, time, units | Digit mode is global |
| `src/ui/screens/*` | Menu, garage, missions, settings, HUD, overlays | DOM only |
| `src/save/schema.ts`, `storage.ts` | Types, defaults, validation, debounced storage, backup, memory fallback | Version 1, 400 ms debounce |
| `src/input/controls.ts` | Touch wheel/buttons/gyro, pedals, gearbox, handbrake | Pointer capture per control |
| `src/input/keyboard.ts` | Keyboard fallback | Left-steer defect, §13 |
| `src/app.ts` | Orchestrator: screens, drive lifecycle, economy, settings | Owns the loop |
| `src/main.ts` | Boot, WebGL2 probe, fatal error UI, `window.__farman` | QA handle |

There is **no `src/audio` and no `src/platform`**. Capacitor detection is inline
(`App.tryDetectNative`); nothing plays sound. `src/rendering` and `src/traffic` are the only
layers that import Babylon; `src/vehicles` and `src/missions` import Rapier only as types
through `src/physics/world.ts`.

## 3. The fixed-step loop

`FixedStepLoop.advance(nowMs)`:

1. `raw = (now − last) / 1000`, clamped to `[0, 0.25]` (`PHYSICS.maxFrameDelta`).
2. Accumulate, then clamp the accumulator to `dt × 4` (`maxStepsPerFrame`), so a stalled
   tab cannot produce a physics explosion.
3. Drain whole `1/60` steps, at most 4, returning the count.
4. `alpha = accumulator / dt` is exposed for interpolation.

`App.driveFrame` then runs, per step: `vehicle.step(dt, surface)` → `traffic.step(dt)` →
`physics.step()` → `missionRunner.update(dt)`. Rendering happens once per frame afterwards.

**Interpolation is not implemented.** `alpha` is computed but unused: `WorldScene.update`
and `VehicleView.update` read the latest physics pose. Wheel spin in `VehicleView` advances
by `omega × (1/60)` per rendered frame, which is correct only at 60 fps and is a visual-only
approximation.

## 4. Why the custom handling layer replaced Rapier's vehicle controller

`docs/research/STACK_AND_RAPIER_API.md` measured `DynamicRayCastVehicleController` 0.21.0
directly. The findings that killed it for FARMAN:

| Finding | Evidence in that report | Consequence for a sim |
|---|---|---|
| Engine force is Newtons integrated over the `dt` you pass | Δv = F·dt/m matched exactly at 1/120, 1/60, 1/30 | Calling `updateVehicle` twice per step doubles force; frame-rate coupling |
| Brake is an **impulse** in N·s, not scaled by `dt` | Δv = B·wheels/m held at 1/60 and 1/30 | Two unit systems in one controller; stopping distance drifts with step rate |
| `frictionSlip` only clamps, never scales | Identical speed at fs 0.5…10.5 below the traction limit | Cannot express a tyre's mu curve; grip is a ceiling only |
| Drive direction comes from `axleCs`, not `indexForwardAxis` | Flipping axle sign reversed the car | Layout is implicit and easy to break |
| `indexForwardAxis` has no setter despite the declaration | Runtime `TypeError`; the setter is `setIndexForwardAxis` | Misleading API surface |
| No `Wheel` object; `addWheel()` returns `undefined` | `.d.ts:62` + runtime | Per-wheel state must be mirrored externally anyway |
| Out-of-range getters return `undefined` or a bogus collider | `wheelGroundObject(5)` returned a dangling handle | Unsafe telemetry paths |

FARMAN needs per-wheel slip, normal load, mu, temperature and travel in the HUD
(`VehicleTelemetry.wheels`), a clutch that can slip, and a torque curve — none of which the
controller exposes coherently. So `VehicleSim` owns the longitudinal and lateral force
model and uses Rapier only for rigid-body integration, collision and the heightfield.

Debt: `src/physics/world.ts` still exports `RapierVehicle`, `registerVehicle`,
`unregisterVehicle` and `updateVehicles`. Nothing calls them (`grep` finds only the
definition). The header comment there still says the vehicle layer sits "on top of Rapier's
raycast vehicle controller", which is stale and contradicts `vehicle.ts`.

## 5. Vehicle model

Chassis (`VehicleSim` constructor):

- One dynamic Rapier body, `gravityScale(0)`, linear damping 0, angular damping 0.35, CCD
  on, sleeping disabled.
- Rotations locked to yaw only: `setEnabledRotations(false, true, false, true)`. Roll and
  pitch are not simulated.
- Collider: cuboid `(W/2 − 0.02, H·0.32, L/2 − 0.04)` offset `y = H·0.34`, with explicit
  mass properties: mass, CoM `(0, centreOfMassHeightM − H·0.34, wheelbase·(frontShare − 0.5))`,
  inertia `ixx = m(L²+H²)/12`, `iyy = yawInertiaKgM2 || m(L²+W²)/12`, `izz = m(W²+H²)/12`.
- Every step the body's `y` is snapped to `surface.heightAt(x, z)` and vertical velocity is
  zeroed. There is **no four-spring rigid-body suspension solver** and no body roll/pitch:
  height comes from the terrain, while suspension travel is a visual offset used for load
  transfer.

Per step, in order:

1. Read body pose/velocity; compute forward and lateral speed.
2. Reset forces/torques; snap to ground; sample surface normal by central differences
   (`e = 0.75 m`).
3. Steering: max angle scaled by `1 − 0.5·smoothstep(25, 135, kph)`; actual angle moves
   toward input at 320°/s.
4. Load transfer: longitudinal `m·a·h / max(1.6, wb)` clamped to ±0.42·m·g; lateral
   `m·a_lat·h / max(1.2, trackFront)` clamped ±0.3·m·g, rear axle gets 0.85 of it.
5. Per wheel: sample surface kind and `effectiveMu`, store `Fz` and travel
   (`clamp(groundAtWheel − groundAtCentre, ±0.16)`).
6. TCS: if driven-wheel slip > 0.18 and throttle > 0.1, cut throttle to as low as 0.2.
7. Transmission step → clutch/converter torque → engine step with that load.
8. Per wheel longitudinal force: slip ratio `(ωr − v)/max(1.6, |v|)`, Magic-Formula-ish
   curve, clamped to `mu·Fz`; brake torque per axle with ABS pressure modulation (slip
   < −0.18 drops pressure at 8/s, recovers at 2.5/s); wheel inertia integration; a static
   holding force prevents creep when braked below 0.4 m/s.
9. Lateral forces: bicycle model, `slipFront = atan2(vLat + ω_y·a_f, max(1.2,|v|)) − δ`,
   `slipRear = atan2(vLat − ω_y·a_r, …)`, force `−mu·Fz·tanh(slip/peakAngle)`. Handbrake
   scales rear grip by 0.55.
10. Yaw torque `fyFront·a_f − fyRear·a_r`; ESC compares yaw rate to `v·tan(δ)/wb` and
    applies up to ±3000 N·m when the error exceeds 0.18 rad/s.
11. World force = longitudinal along heading + lateral along right; plus slope force
    `normal.xz · m·g`; plus aerodynamic drag `0.5·ρ·Cd·A·v²`.
12. Damage: if the per-step horizontal Δv exceeds 2.4 m/s, `bodyDamage += (Δv − 2.4)·0.045`
    (clamped 0–1) and engine wear rises by 12 % of that.
13. Fuel from BSFC: `g/s = bsfc·max(0.6, kW)/3600 + 0.22`, litres/h = g/h ÷ 745.
14. Telemetry snapshot (speed, rpm, gear, per-wheel data, flags, G-forces).

Known modelling limits: combined slip is approximated by clamping each wheel's longitudinal
force to `mu·Fz` and computing lateral force from axle aggregates; there is no relaxation
length, no tyre pressure, no alignment, no suspension geometry, no roll centre migration.

## 6. Terrain height and road lookup

Height data: `public/assets/world/terrain-height.bin`, 385 × 385 `float32` (592,900 bytes),
row-major with z rows, generated by `tools/assetgen/world.py`.

- `WorldScene.load` reads it into a `Float32Array` and builds `heightSampler(x, z)`:
  map world → `[0, n−1]`, **`Math.round`** to the nearest sample, clamp, index `z·n + x`.
  Sampling is nearest-neighbour, not bilinear; at 9.4 m spacing, road surfaces are smooth
  because the road mesh is separate.
- For Rapier, the array is transposed into column-major order and passed as
  `ColliderDesc.heightfield(n−1, n−1, heights, { x: size, y: 1, z: size })` — heights are
  already metres, so `y` scale is 1.

Road lookup (`WorldScene.roadUnder`) is a spatial hash, not a mesh query:

- Every road segment is inserted into 40 m grid cells, expanded by one cell in each
  direction; each entry stores endpoints, `half = width/2 + 0.4`, and road kind.
- A query hashes the point, scans the 3 × 3 neighbourhood, projects the point onto each
  segment (clamped `t`), keeps the nearest segment whose distance < `half`, and returns the
  interpolated segment `y` and kind.
- `groundHeightAt` returns `road.y + 0.02` (`WORLD.roadLift`) when on a road, else the
  heightfield sample, else 0. This is what the vehicle snaps to, so the car rides the road
  surface, not the coarse heightfield.
- `surface.sample` returns `asphalt` (or `tunnel`) with the current `wet` value when
  `roadUnder` hits; otherwise it retries with `width × 1.15` on the raw polylines, then
  falls back to `dirt` with `wet × 0.4`.

Consequence: `gravel`, `sand` and `grass` exist in `SurfaceKind` and in the grip table but
the world never returns them. Off-road is always `dirt`.

## 7. Colliders

| Body | Shape | Source |
|---|---|---|
| Terrain | Heightfield, 384 × 384 cells, friction 1.0 | `terrain-height.bin` |
| Roads, barriers, props | Static trimesh per GLB mesh, world-transformed, friction 1.0 | `roads.glb`, `props.glb`; meshes named `*markings*` skipped |
| Vegetation | No collider; shadow caster only | `vegetation.glb` |
| Player car | Dynamic cuboid with explicit mass properties | `VehicleSim` |
| Traffic | Kinematic-position cuboid `0.9 × 0.75 × 2.2`, centre `y + 0.8` | `TrafficSystem.attachBodies` |
| Fallback pad | Static box `300 × 1 × 300` at `y = −1` (top at 0) | `buildFallbackPad` |

Trimesh colliders are built by reading each mesh's positions, transforming by its world
matrix, and creating one static body per mesh. There is no mesh merging and no convex
decomposition, so a prop GLB with many sub-meshes becomes many bodies. Vegetation is
deliberately non-colliding to keep the body count down.

## 8. Traffic AI

`src/traffic/traffic.ts`:

- Count = `round(10 + density × 14)` → 24 in free drive, 16 in missions. Each agent picks a
  random road, direction, and lane fraction at load; models are instanced from three GLBs.
- Position is parameterised by arc length `s` along the road polyline; `cumulative()` builds
  prefix lengths and `findSegment()` binary-searches them.
- Lateral offset: `(road.width/2 − 2.1) × (0.35 + lane × 0.5)` to the right of travel;
  heading from the segment, plus π for the opposite direction.
- Desired speed: highway 26 m/s, mountain 14, urban/rural 12, multiplied by a curve factor
  (mountain 0.65, highway 1.05, otherwise 0.9).
- Headway: linear scan of all agents on the same road and direction, gap < 30 m limits
  target speed to `(gap − 6) × 0.8`. The player is treated as an obstacle inside 22 m in
  front, and stops traffic within 12 m if the player is stationary.
- Accel 3.2 m/s², braking 7.5 m/s², speed clamped 0–40 m/s; `s` wraps at the ends, so cars
  teleport from the end of a road to its start.
- Bodies are kinematic-position based and moved with `setNextKinematicTranslation`, so the
  player collides with them but they never react to impacts.

Limits: O(n²) headway, no lane changes, no overtaking, no intersection logic, no traffic
lights, no despawn/spawn culling, and every agent is updated every physics step.

## 9. Save format

`src/save/schema.ts`, version `1`, key `farman.save.v1`, backup key `farman.save.backup`.

```
SaveData { schemaVersion, createdAt, updatedAt,
  settings{graphics, renderScale, master/engine/ambience/uiVolume, steeringMode,
    steeringSensitivity, controlSize, controlOpacity, leftHanded, uiScale,
    assists{abs,tcs,esc,autoClutch,stability}, showTelemetry, digits, tutorialHints},
  player{credits, xp, level, selectedVehicleId, unlockedVehicleIds, totalKm, seenTutorial},
  vehicles{id → paintId, rimId, tireSet, fuel, tireWear[4], engineWear, bodyDamage,
    odometerKm, sinceServiceKm},
  missions{id → completed, attempts, bestScore, bestTimeSec} }
```

Validation is repair-oriented: every number is clamped to a documented range, every enum is
checked against its allowed set, unknown vehicle ids in `vehicles` are preserved, and the
three known cars are re-created if missing. A corrupt JSON payload is copied to the backup
key and defaults are used. Writes are debounced 400 ms (`SaveStore.mutate`) and flushed on
`reset`; there is no `beforeunload` flush, so a hard kill inside the debounce window loses
the last mutation.

There is **no migration code**: `schemaVersion` is written, and `validateSave` always stamps
the current version, but no older payload is transformed. Version 1 is the first format.

`localStorage` is probed; if unavailable (private mode), an in-memory map keeps the session
working with `persistent = false`. Nothing in the UI surfaces that flag.

## 10. Persian RTL and typography

- `index.html`: `<html lang="fa" dir="rtl">`, viewport locked (`user-scalable=no`,
  `viewport-fit=cover`), theme `#0a0c0d`.
- Font: Vazirmatn 300/400/500/600/700, `woff2`, declared with `@font-face` in
  `src/ui/design.css`, files in `public/assets/fonts/`. Two weights are preloaded.
- Sizes are `rem`-based; the root font size is `clamp(innerHeight × 0.0148, 12, 22) ×
  settings.uiScale` (`App.applyUiScale`). All spacing therefore scales with the device.
- Layout uses logical properties (`inset-inline`, `margin-inline-start`,
  `padding-inline-start`), so the RTL/LTR switch is structural. The `leftHanded` setting
  swaps only the control clusters via inline `left`/`right`.
- Numerals: `src/ui/format.ts` converts ASCII digits to `۰۱۲۳۴۵۶۷۸۹`, groups thousands with
  `٬` (U+066C), uses `٫` (U+066B) as the decimal separator and `−` for negatives. A global
  `digitMode` can switch to Latin digits from settings.
- Technical readouts that must stay LTR (telemetry, keyboard hint, version) carry
  `class="ltr"` (`direction: ltr; unicode-bidi: isolate`).
- Strings live only in `src/ui/i18n.ts`; mission and road names are Persian data in their
  own modules/JSON.

## 11. Asset pipeline

`tools/assetgen/` is Python 3 + numpy + Pillow, no Blender, no external models.

| Script | Output |
|---|---|
| `glb.py` | Dependency-free glTF 2.0 `.glb` writer (positions, normals, UVs, PBR metallic-roughness, clearcoat, embedded PNG) |
| `vehicles.py` | Three drivable cars + three traffic archetypes, parametric from real proportions |
| `world.py` | `terrain.glb`, `roads.glb`, `props.glb`, `vegetation.glb`, `terrain-height.bin`, `world.json` |
| `textures.py` | Asphalt, concrete, dirt, grass, rock, three facades, shopfront, three Persian signs; fixed seed 20261112 |
| `sky.py` | `sky-day.png`, `sky-dusk.png`, `sky-rain.png`, 2048 × 1024 equirectangular |

Each script has a `__main__` entry and writes directly into `public/assets/`.
`npm run assets` points at `tools/assetgen/build_all.py`, **which does not exist**; the
scripts must be run individually (`python tools/assetgen/world.py`, etc.). `npm run shots`
points at `tools/qa/capture.mjs`, also missing; `tools/qa/smoke.mjs` is the working capture
script.

Shipped asset weight (uncompressed, no Draco/meshopt): roads 5.8 MB, terrain 4.7 MB,
vegetation 2.7 MB, props 2.5 MB (15.6 MB of world data), vehicles 2.6 MB total, textures
1.2 MB, fonts 0.5 MB — roughly 20 MB of assets.

## 12. Performance budget and known limits

| Lever | Low | Balanced | High |
|---|---|---|---|
| Device pixel ratio cap | 1.0 | 1.25 | 1.6 |
| Render scale | 0.72 | 0.90 | 1.00 |
| Shadow map | 512 | 1024 | 2048 |
| Shadow frustum | fixed: `shadowMaxZ = 260`, light follows the car | same | same |
| Solver iterations | 6 (all profiles) | | |

Other fixed choices: far clip 1400 m, FOV 0.92, EXP2 fog, one shadow-casting directional
light, ACES tone mapping (exposure 0.92, contrast 1.14), no post-processing pipeline, no
SSAO, no SSR, no bloom.

Not measured: frame time on a real Android device, draw calls, GPU memory, thermal
behaviour. The only instrumentation is `window.__farman.debugState` (telemetry, body mass,
sleeping state, wheel contact/Fz); treat performance claims as unverified until measured.

## 13. Known defects and technical debt

The full defect table with severity lives in `TECHNICAL_IMPLEMENTATION_PLAN.md` §5. The
items that are specifically architectural:

1. **No render interpolation** despite `alpha` (see §3); wheel rotation assumes 60 fps.
2. **Stale physics comments/API** in `src/physics/world.ts`: it still describes and exports a
   Rapier vehicle-controller path that nothing calls (§4).
3. **Unused constants/hooks**: `PHYSICS.linearDamping`/`angularDamping` are overridden per
   body; `RENDER.maxDeltaTime` is unused (`App.frame` uses 0.1); `RENDER.shadowDistance` and
   `EnvironmentHandles.setQuality()` are never called, so shadows are sized once at
   construction and the frustum stays fixed.
4. **Drive state is not written back** to the save (fuel, wear, damage, odometer) — the
   simulation and the economy are currently disconnected.
