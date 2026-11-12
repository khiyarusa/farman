# AGENTS.md — durable rules for coding agents

FARMAN is a Persian-first, offline Android driving simulator. These rules are for any agent
or human changing this repository. They describe invariants, not preferences; if a change
requires breaking one, change this file in the same commit and say why.

## 1. Non-negotiable invariants

1. **TypeScript strict stays on.** `tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`,
   `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` and `exactOptionalPropertyTypes: false`.
   Do not weaken compiler options to make an error disappear.
2. **No `any` in new code.** Use `unknown` + a type guard, a discriminated union, or a
   precise interface. `@typescript-eslint/no-explicit-any` is a warning today; treat it as an
   error. Do not silence it with `eslint-disable` unless the value is genuinely opaque
   (e.g. a third-party wasm handle) and the disable has a comment.
3. **The simulation is renderer-free.** `src/vehicles/**`, `src/missions/**`, `src/save/**`,
   `src/traffic/**` and `src/core/**` must not import Babylon, touch the DOM, or read
   `window`. Rendering consumes telemetry; it never drives physics.
4. **Fixed timestep only.** All simulation runs through `FixedStepLoop` at
   `PHYSICS.dt = 1/60`. Never integrate with a variable frame delta. `VehicleSim.step(dt)`
   is called once per fixed step, then `physics.step()` exactly once.
5. **No allocations in hot loops.** `VehicleSim.step`, `TrafficSystem.step`, `Engine.update`
   and `Transmission.step` run 60×/s per entity. Reuse arrays, avoid object literals per
   wheel per step, avoid `map`/`filter`/spread in those paths. New per-step vectors are a
   review blocker. (The existing telemetry rebuild allocates once per step; that is a known
   cost, not a licence to add more.)
6. **Persian text only through the dictionary.** UI strings come from `src/ui/i18n.ts`
   (`FA.*`); mission titles/descriptions live in `src/missions/definitions.ts`; road names
   live in `world.json`. Never inline a Persian string in a screen or component. Existing
   exceptions (a few toasts and boot labels in `src/app.ts`) are debt: move them into `FA`
   when you touch them, and do not add more.
7. **Numbers only through `src/ui/format.ts`.** Never write raw ASCII digits into the DOM.
   Use `formatNumber`, `formatSpeed`, `formatDistance`, `formatMoney`, `formatMoneyShort`,
   `formatTime`, `formatClock`, `formatPercent`, `formatLitres`, `formatTemp`. They apply
   Persian digits, `٬` grouping, `٫` decimals and the `−` sign.
8. **All user-facing text is RTL.** New layout uses logical properties
   (`margin-inline-start`, `inset-inline`, `padding-inline`), never `left`/`right`, except
   where the control cluster must physically swap for `leftHanded`. LTR-only readouts get
   `class="ltr"`.
9. **Assets must be original or licence-compatible.** Procedural assets come from
   `tools/assetgen/*.py`. Any new asset needs an entry in `ASSET_LICENSES.md` with its
   source and licence. No ripped models, textures, fonts, or audio.
10. **Never commit secrets or signing material.** No `.env`, no `*.jks`, no `*.keystore`,
    no passwords in code or docs. `.gitignore` covers these; do not override it.
11. **Do not regress the physics test suite.** Any change to `engine.ts`,
    `transmission.ts`, `tire.ts`, `vehicle.ts` or the profiles must keep the numeric tests
    green once they exist, and must state in the commit message which behaviour changed.
    Until the suite exists (§4), add the test that pins your change.
12. **Docs track code.** A change to physics constants, mission rules, economy values,
    controls, save schema or assets updates `GDD.md` / `TDD.md` / `VEHICLE_DATA_SOURCES.md` /
    `ASSET_LICENSES.md` in the same change.

## 2. Code conventions in this repo

- 2-space indent, single quotes, semicolons, trailing commas in multiline literals.
- Named exports only; no default exports. One class or one cohesive module per file.
- Files `camelCase.ts`, classes `PascalCase`, constants `SCREAMING_SNAKE` inside `as const`
  objects (`PHYSICS`, `RENDER`, `GAME`, `WORLD`).
- Comments in English, explaining *why* a number exists, not what the line does.
- Persian is data, not code: no Persian identifiers, no Persian comments in `.ts`.
- Types hang off `src/vehicles/profile.ts` and `src/save/schema.ts`; do not duplicate shapes.
- Deep Babylon imports (`@babylonjs/core/...`) — never the barrel; it costs ~3.5× bundle
  size (measured in `docs/research/STACK_AND_RAPIER_API.md`).
- No `console.log` in shipped paths; `console.warn`/`error` are acceptable for recoverable
  asset or world failures.

## 3. Architecture boundaries

| Layer | May import | Must not import |
|---|---|---|
| `src/core` | nothing but itself | everything else |
| `src/physics` | `@dimforge/rapier3d-compat`, `src/core` | Babylon, DOM |
| `src/vehicles` | `src/core`, `src/physics`, `src/world/surface`, `src/save/schema` (types) | Babylon, DOM, `src/ui` |
| `src/world` | types only | Babylon |
| `src/traffic` | Babylon (scene graph), `src/physics`, `src/core` | `src/ui` |
| `src/missions` | `src/core`, `src/vehicles` (types) | Babylon, DOM |
| `src/rendering` | Babylon, `src/vehicles`, `src/physics` | `src/ui` |
| `src/ui` | DOM, `src/core`, `src/save` (types) | Babylon |
| `src/app` | everything | — |

`src/traffic` is the one simulation module that touches Babylon today because agents own
their own transform nodes. Do not copy that pattern; new simulation code returns plain data.

## 4. Verification before every commit

```bash
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run build       # typecheck + vite build
```

All three must pass. Current baseline (2026-11-12): `typecheck` passes; `test` **fails with
"No test files found"** because `tests/` does not exist yet; `lint` is red (2 errors in
`src`, 74 repo-wide). Do not treat that baseline as acceptable — when you touch a module
listed in §1.11, add its unit test under `tests/` and make `npm run test` pass for real.
A change that adds no test must say why in the commit message.

Useful extras:

```bash
npx eslint src                      # scoped lint, faster than the repo-wide run
npm run dev                         # Vite on 127.0.0.1:5188
node tools/qa/smoke.mjs             # Playwright capture + debugState dump
```

## 5. How to make common changes

**Add a car**
1. `src/vehicles/profiles/<id>.ts` implementing `VehicleProfile`; fill `sources` with real
   references and mark `dataConfidence` honestly.
2. Register it in `src/vehicles/profiles/index.ts`.
3. Add `defaultVehicleState(tankLitres)` in `createDefaultSave()` and, if it should be
   drivable immediately, to `unlockedVehicleIds`.
4. Generate its GLB: add a `CarSpec` in `tools/assetgen/vehicles.py` and run the script.
5. Document every estimated value in `VEHICLE_DATA_SOURCES.md`.
6. Run `validateProfile()` via a test; it rejects bad ratios, missing clutch/converter/CVT
   data, non-monotonic torque curves and bad mass/geometry ranges.

**Add a mission**
1. Append a `MissionDef` to `MISSIONS` with a unique `id`, a `spawnId` that exists in
   `world.json`, and a `fallback` pose.
2. Add a `case` in `MissionManager.update` and `objectiveText`; a mission without an
   evaluation branch will run forever.
3. Add the Persian title/description in the definition (not in `i18n.ts`; missions are data).
4. Add a scoring test that asserts the pass/fail boundary and the reward formula.

**Add a UI string**
Add it to `FA` in `src/ui/i18n.ts`; use it via `FA.key`. If it contains a number, format the
number with `format.ts` and interpolate.

**Change the save format**
Bump `SAVE_VERSION`, extend `validateSave` with clamps/defaults for every new field, and keep
reading version 1 payloads working (a migration function is required from version 2 on).

**Add a surface type**
Add it to `SurfaceKind`, to `SURFACE_BASE` in `src/vehicles/tire.ts`, and make
`WorldScene.surface.sample` actually return it — otherwise it is dead data.

## 6. Things that will get a change rejected

- A physics tweak with no before/after numbers (top speed, 0–100, stopping distance).
- Frame-rate-dependent integration, `Date.now()`/`performance.now()` inside simulation.
- Babylon imports in `src/vehicles`, `src/missions`, `src/save`, `src/core`.
- Persian strings or digits built by hand in a screen.
- A new dependency without a licence entry and a bundle-size note.
- Regenerating assets by hand instead of via `tools/assetgen` (the generators are the source
  of truth; the GLBs are build products).
- Editing `android/` native files to work around a web-side bug.
- Weakening `tsconfig.json`, `eslint.config.js` or the test include glob to get green.

## 7. Documentation map

| File | Owns |
|---|---|
| `GDD.md` | Player-facing rules: missions, economy, controls, scope |
| `TDD.md` | Architecture, physics rationale, data flow, limits |
| `AGENTS.md` | This contract |
| `ART_BIBLE.md` | Palette, type, lighting, environment and vehicle art rules |
| `ASSET_LICENSES.md` | Provenance and licences for every asset family |
| `VEHICLE_DATA_SOURCES.md` | Per-car values, verified vs estimated |
| `TECHNICAL_IMPLEMENTATION_PLAN.md` | What is done, partial, missing; priority order |
| `docs/qa/TEST_PLAN.md` | Test strategy and manual Android checklist |
| `docs/research/*` | Dated research inputs; do not rewrite history in them |

When code and docs disagree, the code is right and the doc is a bug. Fix the doc in the same
commit.
