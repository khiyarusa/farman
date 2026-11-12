# Skills and tools actually used — FARMAN v0.1.0

**Audit log, 2026-11-12.** Scope: the third-party game-dev skills vendored into
`.agents/skills/`, the locally written Babylon.js guide, and the tools that produced and
checked this vertical slice. This is a record of what was used, not a catalogue of what
exists. Where a skill was read but its advice was **not** applied, that is stated.

Companion documents: [`docs/research/SKILLS_AUDIT.md`](../research/SKILLS_AUDIT.md) (the
initial library audit and the 15 candidate practices), `.agents/skills/gamedev/SOURCE.md`
(provenance, commit pins, omissions) and `.agents/skills/gamedev/README.md` (how to read the
vendored set). Code claims below were checked against `src/` on the date above; build and
test results were produced by running the commands, not inferred.

---

## 1. Sources cloned and audited

Both repositories were cloned into `%TEMP%\farman-skills-audit` — never inside this
repository — and read at the commits below. The pins are recorded in
`.agents/skills/gamedev/SOURCE.md`; the licence texts and the awesome NOTICE are vendored in
`.agents/skills/gamedev/LICENSES/`.

| Upstream | URL | Commit SHA | Commit date | Licence | NOTICE |
|---|---|---|---|---|---|
| awesome-gamedev-agent-skills | https://github.com/gamedev-skills/awesome-gamedev-agent-skills | `c6ca6c41c839b68319ffc08430b99ab768debc32` | 2026-11-12 13:23:53 +0545 | Apache-2.0 | Yes — "Copyright 2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors" |
| ForgeSkills | https://github.com/sekaikx/ForgeSkills | `cefbba0720b58b110a2e8ab36e71e46246ea1e29` | 2026-10-29 23:36:40 +0100 | Apache-2.0 | None in the upstream repository |

What was kept from each:

| Source | Vendored | Notes |
|---|---|---|
| awesome-gamedev-agent-skills | 10 engine-neutral discipline skills (`game-feel`, `input-systems`, `camera-systems`, `level-design`, `game-ui-ux`, `save-systems`, `performance-optimization`, `game-ai`, `audio-design`, `physics-tuning`), each with `references/` | Copied verbatim. No engine-specific skill was copied. |
| ForgeSkills | `gamedev-orchestrator`, `gamedev-verification`, `gamedev-visual-iteration`, `gamedev-debugging`, `gamedev-game-testing`, `gamedev-performance`, `gamedev-blender-headless` (reference only), plus `tools/refmatch/{compare,overlay,measure_sheet,palette_report}.py` | `gamedev-blender-headless` is documentation only; none of its `tools/blender/*.py` was copied. |

Deliberately not copied: the awesome `router/` (its engine table has no Babylon.js entry and
its fallback is Godot), every Godot/Unity/Unreal/three.js skill set, the Blender and Godot
tool directories, and the out-of-scope disciplines (`create-game-assets`, `dialogue-systems`,
`procedural-gen`, `shader-programming`, `ai-behavior-trees-utility-ai`). The full reasoning
is in `SOURCE.md` and `docs/research/SKILLS_AUDIT.md` §3–§6.

**Maturity caveat:** ForgeSkills' own `docs/LIMITATIONS.md` says its Godot and Unity skills
were written but never executed, and that its reference-reconstruction test failed its gate
(silhouette IoU 0.4628 against 0.85). Workflow discipline was trusted; engine specifics were
not.

---

## 2. Skills read and applied — the seven named in the brief

Legend: **Read** = the skill body was read during the audit (`SKILLS_AUDIT.md` §3 records
`Copied (read)` for the ten awesome disciplines). **Applied** = a practice from it is visible
in the shipped code. **Partial** = the concept is present but a stated part is missing.

| Skill | Read | Applied | Concrete evidence in this codebase |
|---|---|---|---|
| `game-feel` | Yes | Partial | `CameraRig` has a trauma-style `shake` accumulator (`addShake`, clamped to 0.5) applied as a final additive offset **after** the follow position and decayed by `shake *= max(0, 1 − dt·6)` (`src/rendering/cameraRig.ts`). Chase FOV widens with speed: `0.92 + clamp(speed·0.0035, 0, 0.09)`, eased with `damp`. **Not applied:** hit-stop, flash caps and squash/stretch do not exist, and nothing calls `addShake` yet — crash/kerb feedback is a designed hook, not a shipped effect. |
| `camera-systems` | Yes | Yes | Frame-rate-independent smoothing lives in `damp(current, target, halfLife, dt)` (`src/core/math.ts`, `1 − 2^(−dt/halfLife)` form). The chase camera uses it for position and look-at separately, with speed-dependent pull-back (`6.4 + 0.035·v` m) and 3.2 m look-ahead (`src/rendering/cameraRig.ts`). `snap()` re-seats the camera on reset; the studio camera clamps radius/beta instead of using free orbit. |
| `game-ui-ux` | Yes | Yes | `index.html` is `lang="fa" dir="rtl"` with `viewport-fit=cover`; `src/ui/design.css` defines `--safe-t/b/l/r` from `env(safe-area-inset-*)`, loads bundled Vazirmatn, and uses logical properties. Root type scales from viewport height in `App.applyUiScale()` (`clamp(height·0.0148, 12, 22) px × uiScale`). The HUD is event/telemetry-driven: `Hud.update` writes values once per frame from `VehicleTelemetry`, and the minimap redraws at 120 ms (~8 Hz) instead of every frame. |
| `audio-design` | Yes | **No** | Read and used to shape data, not behaviour: each profile carries `audio.firingHzAt1000`, `timbre`, `exhaustGain`, `intakeGain`, and settings persist four volume buses. There is **no audio runtime** in v0.1.0 — no `AudioContext`, no `src/audio`, no sound files (`ASSET_LICENSES.md` §5). The bus/dB/loudness rules are input for the next milestone; the sliders are inert today. |
| `save-systems` | Yes | Partial | `src/save/schema.ts` has `SAVE_VERSION = 1`, `SAVE_KEY`/`SAVE_BACKUP_KEY`, and a repair-oriented `validateSave()` that clamps every number, checks every enum, preserves unknown vehicle ids and re-creates the three known cars. `SaveStore.read()` copies corrupt JSON to the backup key before falling back to defaults; writes are debounced 400 ms (`src/save/storage.ts`). **Not applied:** the skill's `tmp → .bak → rename` atomic-write chain — `localStorage` has no rename. The JSON + backup + validation path is the substitute, and the missing flush on hard kill is documented as a limitation. |
| `game-ai` | Yes | Partial | `TrafficSystem.step` separates facts from action within one update: it scans headway to the next agent on the same road/direction (gap < 30 m limits target speed to `(gap − 6)·0.8`), treats the player as an obstacle inside 22 m, stops traffic within 12 m of a stationary player, then applies accel 3.2 / brake 7.5 m/s². Curve factors are per road class (mountain 0.65, highway 1.05, otherwise 0.9), placement is seeded (`createRng(90210)`), and each agent owns a kinematic Rapier body so the player collides with it (`src/traffic/traffic.ts`). **Not applied:** no FSM, no A*, no 5–10 Hz perception timer and no hysteresis; the O(n²) headway scan is flagged in `TDD.md` §13. |
| `gamedev-debugging` | Partial (description + index, per `SKILLS_AUDIT.md` §3.3) | Yes, as a method | Reproduce → isolate → inspect is visible in the QA harness: `window.__farman` is exposed in `src/main.ts`; `App.debugState` returns mode, telemetry, position, body mass/sleeping, per-wheel suspension length/contact/normal force, mission status and world-loaded flag. `tools/qa/physics-probe.mjs` reproduces the Pride's suspension in a standalone Rapier world (mass 895 kg, wheel radius 0.286 m, 61 % front share) without the renderer; `debug-drive.mjs` toggles assists and dumps telemetry; `sky-probe.mjs` inspects the sky mesh/material; `text-probe.mjs` reads garage text; `img-check.py` measures sky-image luminance bands. |

### 2.1 What actually changed because of these skills

| Change | File(s) | Skill input |
|---|---|---|
| Exponential `damp()` helper instead of fixed `lerp` factors | `src/core/math.ts`, `src/rendering/cameraRig.ts` | `camera-systems` |
| Speed-dependent chase distance and FOV; separate position/look-at smoothing; snap on reset | `src/rendering/cameraRig.ts` | `camera-systems`, `game-feel` |
| Trauma-style shake accumulator with frame-rate-scaled decay and a final additive offset | `src/rendering/cameraRig.ts` | `game-feel` |
| Safe-area insets, RTL logical layout, viewport-derived root type scale | `src/ui/design.css`, `src/app.ts`, `index.html` | `game-ui-ux` |
| Throttled minimap (120 ms) and telemetry-driven HUD writes | `src/ui/screens/hud.ts` | `game-ui-ux`, `performance-optimization` |
| Versioned save, per-field validation/repair, corrupt-payload backup, debounced writes | `src/save/schema.ts`, `src/save/storage.ts` | `save-systems` |
| Headway/player-braking traffic with kinematic colliders and seeded placement | `src/traffic/traffic.ts` | `game-ai` |
| Debug snapshot + standalone physics probe + Playwright probes | `src/app.ts`, `src/main.ts`, `tools/qa/*.mjs` | `gamedev-debugging`, `gamedev-verification` |

`game-feel`'s most visible recommendation — hit-stop — was deliberately **not** implemented:
there is no freeze timer in the loop, so no crash can pause simulation time.

---

## 3. Other skills read (not in the seven-skill brief)

These were vendored and read, and their influence is narrower or more indirect.

| Skill | Read | Applied | Evidence / caveat |
|---|---|---|---|
| `input-systems` | Yes | Partial | Analog pedals read the touch position inside the pedal (0 at the bottom, 1 at the top) and track multi-touch per pointer; steering has wheel/buttons/gyro modes with pointer capture (`src/input/controls.ts`). **Not applied:** no deadzone, no response curve/gamma, no 150 ms press buffering, no rebinding. The numbers in `SKILLS_AUDIT.md` §5 are proposals, not shipped tuning. |
| `physics-tuning` | Yes | Yes | Fixed 60 Hz via `FixedStepLoop`, `maxStepsPerFrame = 4`, `maxFrameDelta = 0.25 s`, one `physics.step()` per fixed step; CCD enabled on the chassis; 6 solver iterations; `gravityScale(0)` with terrain-following height (`src/core/loop.ts`, `src/core/config.ts`, `src/vehicles/vehicle.ts`). **Not applied:** render interpolation — `alpha` is computed but unused (`TDD.md` §3), and wheel spin assumes 60 fps. |
| `performance-optimization` | Yes | Partial | Quality presets cap device pixel ratio (1.0/1.25/1.6), render scale (0.72/0.90/1.00) and shadow maps (512/1024/2048); one shadow-casting directional light; ACES tone mapping and no post-processing; Babylon/Rapier split into manual chunks (`src/rendering/renderer.ts`, `src/rendering/environment.ts`, `vite.config.ts`). **Not applied:** draw-call/GPU instrumentation and instancing review — world props arrive pre-merged in generated GLBs, and no frame-time measurement exists on device. |
| `gamedev-verification` | Yes | Yes | Evidence levels shaped this document and `docs/release/RELEASE_CHECKLIST.md`: build/test runs are recorded as commands with outputs; device performance is explicitly marked unverified rather than estimated. |
| `gamedev-visual-iteration` | Yes | Yes | One-variable visual passes are visible in `tools/assetgen/_patch_sky2.py`, `_patch_sky3.py`, `_patch_fog.py`, `_patch_lighting.py` and in the `sky-probe*.mjs` / `img-check.py` checks. The vendored `compare.py` was run in text mode only; its JSON path is broken and it always exits 0 (see §6). |
| `gamedev-orchestrator` | Yes | Partial | Its stage/gate discipline is reflected in the existence of `GDD.md`, `TDD.md`, `AGENTS.md` and the release checklist rather than in runtime code. |
| `level-design` | Yes | Partial | The region is authored as 11 named roads with distinct classes and widths, and mission spawns are named (`world.json`). No measured turn-radius/braking-distance pass is recorded; corner radii and lane widths are authored values, not values measured from the car. |

---

## 4. The locally written Babylon.js guide

`.agents/skills/babylonjs/README.md` is **project-authored**, not upstream material. It
summarises official Babylon.js documentation for this stack and is pinned to the project's
Babylon version.

| Section | Guidance | Adopted in the code? |
|---|---|---|
| 1. Imports | Deep per-file imports, never the barrel (`@babylonjs/core` has `sideEffects: true`, so tree-shaking cannot drop unused modules) | Yes — `src/rendering/*.ts` imports `@babylonjs/core/Engines/engine`, `.../Cameras/universalCamera`, etc. The guide shows a `.js` suffix for Node-style resolution; Vite resolves the extensionless specifier used here. |
| 2. Engine/scene | One `Engine`, `adaptToDeviceRatio` off by default, `preserveDrawingBuffer: false` outside capture builds | Yes — `src/rendering/renderer.ts` creates one engine for the app lifetime, keeps `preserveDrawingBuffer: false`, and calls `engine.resize()` on resize/orientation. |
| 3. PBR | Metallic **or** roughness must be set, or PBR silently runs specular-glossiness; a metal with no environment renders black | Yes — `createPaintMaterial`/`createRimMaterial` set metallic and roughness; the world and studio assign a procedural environment cube before rendering. |
| 4. GLB | `registerBuiltInLoaders()` / asset containers for a vehicle cache | Partly — `vehicleView.ts` imports the glTF 2.0 loader directly and uses `ImportMeshAsync`; traffic uses `LoadAssetContainerAsync`. No shared container cache yet. |
| 5. Shadows | One generator per light, one shadow-casting light on mobile, PCF, tuned bias | Yes — `setupEnvironment()` creates one `ShadowGenerator` on the sun with PCF and bias/normalBias; quality presets resize the map. |
| 6. Instancing | Instances share a material and one draw call; disable the master mesh | Not yet needed — props/vegetation are merged in the generated GLB, so there is no per-prop instance loop. |
| 7. Mobile rules | Draw-call/texture/light budgets; measure with `SceneInstrumentation`; read ms and p95 | Budgets are implemented as presets; instrumentation is **not** wired, so the budgets remain targets (`TDD.md` §12). |

Version note in the guide: the project pins `@babylonjs/core` and `@babylonjs/loaders` to
**8.56.2** exactly. npm's latest is 9.35.0, so the pin is deliberate; never mix majors.

---

## 5. Tools used

### 5.1 npm packages

Versions read from `package.json` / installed `package.json` files on 2026-11-12.

| Package | Version | Role in this build |
|---|---|---|
| `@babylonjs/core`, `@babylonjs/loaders` | 8.56.2 | Renderer, PBR materials, GLB loading, shadows, cameras |
| `@dimforge/rapier3d-compat` | 0.21.0 | Rigid bodies, colliders, heightfield/trimesh, wasm inlined |
| `@capacitor/core`, `@capacitor/app`, `@capacitor/android`, `@capacitor/cli` | 8.6.x | Android shell, native exit, `cap sync` |
| `vite` | 7.3.8 | Dev server on 5188, production bundle with manual chunks |
| `typescript` | 5.9.3 | `strict`, `noUncheckedIndexedAccess`, `noUnused*` |
| `vitest` + `jsdom` | 3.2.7 / 31.0.0 | 24 unit tests (physics, save schema, localization) |
| `playwright` | 1.65.0 | Screenshot/telemetry probes against Edge |
| `vazirmatn` | 33.0.3 | Bundled Persian font (OFL-1.1) |
| `eslint` + `typescript-eslint` | 9.39.5 / 8.72.2 | `npm run lint` |

### 5.2 Rapier API inspection

`docs/research/STACK_AND_RAPIER_API.md` inspected `@dimforge/rapier3d-compat@0.21.0` at the
`.d.ts` and runtime level (49 vehicle-controller members, argument shapes, unit behaviour).
The findings changed the design, not just the notes:

- Engine force is in newtons and is integrated over the `dt` passed in; brake is an impulse
  in N·s and is **not** `dt`-scaled — two unit systems in one controller.
- `frictionSlip` only clamps above the traction limit; it cannot express a tyre mu curve.
- `indexForwardAxis` has no setter despite the declaration; `addWheel()` returns
  `undefined`; out-of-range getters return `undefined` or a dangling collider handle.

Consequence: FARMAN does **not** use Rapier's `DynamicRayCastVehicleController` for handling.
`VehicleSim` owns per-wheel slip, load transfer, engine/transmission coupling and tyre
forces; Rapier supplies rigid-body integration, collision and the heightfield. The stale
controller plumbing still exported by `src/physics/world.ts` is recorded as debt in
`TDD.md` §4.

### 5.3 Python asset pipeline

Python 3 + numpy + Pillow, plus `arabic-reshaper` and `python-bidi` for Persian sign faces.
No Blender, no third-party meshes, no image-generation service.

| Script | Output used by the game |
|---|---|
| `tools/assetgen/glb.py` | Original glTF 2.0 `.glb` writer (indexed meshes, PBR metallic-roughness, embedded PNG) |
| `tools/assetgen/vehicles.py` | 3 drivable cars + 3 traffic archetypes, parametric from real dimensions |
| `tools/assetgen/world.py` | `terrain.glb`, `roads.glb`, `props.glb`, `vegetation.glb`, `terrain-height.bin`, `world.json` |
| `tools/assetgen/textures.py` | Asphalt, concrete, dirt, grass, rock, facades, shopfront, three Persian road signs |
| `tools/assetgen/sky.py` | `sky-day.png`, `sky-dusk.png` (unused), `sky-rain.png`, 2048 × 1024 equirectangular |

The generated files are committed under `public/assets/`, so playing or building does not
require Python. Regeneration does; the dependency list is in the README.

### 5.4 Playwright visual QA

The browser scripts launch `chromium` with `channel: 'msedge'` and
`--use-gl=angle --use-angle=d3d11` at 1280 × 640, target `http://127.0.0.1:5188/`, and read
the app through `window.__farman`. `physics-probe.mjs` is the exception: it runs Rapier in
Node with no browser.

| Script | What it does | Evidence produced |
|---|---|---|
| `tools/qa/smoke.mjs` | Waits for the menu, captures it, starts free drive, dismisses the tutorial, drives with keyboard, captures again, prints `debugState` and console errors | `docs/visual-qa/dev/01-menu.png`, `02-drive.png`, `03-driving.png` (gitignored) |
| `tools/qa/garage-shot.mjs` | Menu → garage, captures the default and a dragged camera angle | `dev/10-menu.png`, `11-garage.png`, `12-garage-angle.png` |
| `tools/qa/debug-drive.mjs` | Forces auto-clutch/TCS settings, drives, prints telemetry | Console telemetry |
| `tools/qa/physics-probe.mjs` | Standalone Rapier suspension test with the Pride's numbers; no browser | Numeric probe output |
| `tools/qa/sky-probe.mjs`, `sky-probe2.mjs`, `sky-red.mjs` | Inspect sky mesh/material and render variants | Iteration evidence |
| `tools/qa/text-probe.mjs` | Reads `.garage-specs` text to catch missing glyphs | Text dump |
| `tools/qa/img-check.py` | Mean RGB of top/middle/bottom bands of the sky PNGs | Luminance check |

`npm run shots` points at `tools/qa/capture.mjs`, which is **not in the tree**; the working
entry point is `smoke.mjs` (also recorded in `TDD.md` §11). `FARMAN_URL` and `FARMAN_SHOTS`
override the URL and output directory.

---

## 6. Not used / not applicable

| Skill or tool | Status | Why | What was used instead |
|---|---|---|---|
| **Blender headless** (`gamedev-blender-headless`, ForgeSkills `tools/blender/*`) | Not used | Blender is not installed on this machine and is not part of a Babylon/Vite asset flow. The skill is vendored **reference-only**; none of its Python tools were copied. | `tools/assetgen/glb.py` + parametric Python generators. |
| **Meshy / Tripo** (text-to-3D generation) | Not used | No account, no network dependency in the asset pipeline, and provenance/licence of generated meshes would have to be cleared. The art direction is deliberately low-poly and parametric. | Deterministic geometry from `vehicles.py` / `world.py`. |
| **Godot skills** (`gamedev-godot-pipeline`, `gamedev-godot-visual-polish`, `tools/godot/*`) | Not used | Wrong engine; FARMAN is Babylon.js + TypeScript. Upstream `docs/LIMITATIONS.md` also says these were written but never executed. | Babylon equivalents in `.agents/skills/babylonjs/README.md`; Playwright for renders. |
| **Unity skills** (`unity-build-size`, `check_unity_build_size.py`) | Not used | Instructions are Unity-project-specific. Only the engine-neutral Android size facts (Play base module 500 MB, 200 MB comfort target, ASTC block costs) were extracted into the audit. | Manual APK size tracking; no Unity tooling. |
| **awesome `router/`** | Not used | Its engine table has 12 entries and no Babylon.js; its documented fallback for an unknown engine is Godot, which would mis-route. | Manual selection by task; `SKILLS_AUDIT.md` §3. |
| **Audio loudness measurement** (ForgeSkills `--write-movie` + `ffmpeg ebur128`) | Not applicable | There is no audio runtime, and `ffmpeg` is not on PATH. | Nothing to measure yet. |
| **`compare.py --out` / `--json`** | Not used | Crashes on numpy 2.5.4 (`int64` is not JSON-serialisable). Text mode works. | Text report only. |
| **`compare.py` as a CI gate** | Not used | It always exits 0, even after printing `[FAIL]`. | Gate on grepping stdout for `[FAIL]`, per `gamedev-verification`. |
| **`overlay.py` by absolute path** | Not used as-is | `ModuleNotFoundError: No module named 'compare'` unless its directory is on `sys.path`. | The `sys.path` wrapper documented in `.agents/skills/gamedev/README.md`. |
| **`npm run assets`** (`tools/assetgen/build_all.py`) | Not runnable | The entry point is not in the tree; the individual generators are. | `python tools/assetgen/{vehicles,world,textures,sky}.py`. |
| **`npm run shots`** (`tools/qa/capture.mjs`) | Not runnable | The script is not in the tree. | `node tools/qa/smoke.mjs`. |

---

## 7. Evidence log

| Claim | How it was established | Confidence |
|---|---|---|
| Upstream URLs, SHAs, commit dates, licences, NOTICE text | Read from `.agents/skills/gamedev/SOURCE.md`; licence files exist under `.agents/skills/gamedev/LICENSES/` | High |
| Which skills were read | `docs/research/SKILLS_AUDIT.md` §3 records `Copied (read)` per skill; `SOURCE.md` records the copy list. This log did **not** re-read all 17 `SKILL.md` files. | High for the copy list; medium for depth per skill |
| Code behaviour cited in §2–§5 | Read the named source files on 2026-11-12 | High |
| `typecheck` passes | Ran `npm run typecheck` — exit 0, no diagnostics | High |
| `build` passes | Ran `npm run build` — 900 modules transformed, `dist/` written | High |
| Tests pass | Ran `npm run test` — 2 files, 24/24 tests passed | High (at the time of writing) |
| ESLint status | Ran `npm run lint`; it passed on the final run, but the tree was being edited in parallel, so re-run it before release rather than trusting this log. | Low — re-run before release |
| Device performance | **Not measured.** No Android device or emulator was available; `TDD.md` §12 lists the missing numbers. | Unverified |
| Screen-reader/font rendering on a real phone | **Not verified** on device; desktop Playwright captures only. | Unverified |

### 7.1 Defects in the vendored tooling (kept, not smoothed over)

- `compare.py` prints `[FAIL]` but always exits 0 — it cannot fail a build as-is.
- `compare.py --json` / `--out` crash on numpy 2.x after computing the metrics; text mode is
  unaffected.
- `compare.py` normalises to the subject's bounding box, so it is translation-invariant and
  cannot detect framing/position errors. It is not a screenshot-diff.
- SSIM is advisory; upstream says so twice. A blurred image can outscore a sharp correct one.
- The numbers in the skills are documented practice, not measurements of FARMAN. Treat every
  magnitude as a starting value.

---

## 8. Reproduce this audit

```bash
# provenance (read-only)
cat .agents/skills/gamedev/SOURCE.md

# what the code actually does
npm run typecheck
npm run test
npm run build

# visual/telemetry probes (requires a dev server)
npm run dev
node tools/qa/smoke.mjs
node tools/qa/garage-shot.mjs

# vendored comparison tool, text mode only
python .agents/skills/gamedev/tools/refmatch/compare.py --ref a.png --test b.png
```

Re-cloning the upstream repositories and comparing the SHAs is documented in `SOURCE.md`
§"Re-verifying or updating this copy". If a SHA has moved, re-read the relevant `SKILL.md`
before re-copying; these libraries are young and their advice changes between commits.
