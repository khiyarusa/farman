# FARMAN — Technical Implementation Plan

Status snapshot: 2026-11-12, `APP.version 0.1.0`. This is an audit first and a plan second.
Nothing here is aspirational unless it is under §6.

## 1. Verification log for this snapshot

Commands executed in the repository root on 2026-11-12:

| Command | Result |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **Pass**, exit 0 |
| `npm run test` (`vitest run`) | **Fail**, exit 1 — "No test files found"; config includes `tests/**/*.test.ts`, directory absent |
| `npx eslint src` | **Fail** — 2 errors |
| `npm run lint` (repo-wide) | **Fail** — 74 errors, 32 warnings (mostly Node globals in `tools/qa/*.mjs`) |
| `npm run build` | Not run in this pass (would rewrite `dist/`); `dist/` exists from an earlier build |
| `npx cap sync android` / `./gradlew assembleDebug` | Not run; no Android SDK/JDK available locally |
| APK install / device run | Not performed |

`android/` is a generated Capacitor project (`build.gradle`, `gradlew`, `app/`, `variables.gradle`:
minSdk 24, compile/target 36, `sensorLandscape`, `supportsRtl=true`). An APK has not been built
or installed from this working copy. There is no `.github/` directory, so no CI pipeline is
visible in the repository.

## 2. Implemented and working

| Feature | Files | Evidence / notes |
|---|---|---|
| Boot flow with WebGL2 probe and Persian fatal errors | `src/main.ts`, `index.html` | Fails fast before creating the engine |
| Fixed 60 Hz loop with catch-up cap | `src/core/loop.ts`, `src/core/config.ts` | 4 steps max, 0.25 s delta clamp |
| Rapier world lifecycle (new world per drive) | `src/physics/world.ts`, `src/app.ts` | `dispose()` then `PhysicsWorld.create()` on each `startDrive` |
| Three vehicle profiles with structural validation | `src/vehicles/profile.ts`, `src/vehicles/profiles/*` | `validateProfile()` returns error strings; called by tests-to-be |
| Engine model: torque curve, lag, friction, limiter, stall, auto-restart, thermal, BSFC fuel | `src/vehicles/engine.ts` | `monotoneCubic` interpolation, no overshoot |
| Three transmission types | `src/vehicles/transmission.ts` | Manual clutch with bite curve, torque converter with lock-up, CVT with ratio rate limit, auto shift schedule |
| Custom handling: per-wheel slip, load transfer, combined grip clamp, ABS/TCS/ESC, slope, drag | `src/vehicles/vehicle.ts` | 713 lines; emits full telemetry |
| Terrain heightfield + road surface lookup | `src/rendering/worldScene.ts` | `roadUnder` spatial hash; `groundHeightAt` prefers road mesh height |
| World loading with graceful fallback pad | `src/rendering/worldScene.ts` | Missing `world.json`/models still yields a drivable 600 m pad |
| Procedural world: 3.6 km region, 11 roads, city/highway/mountain/rural | `tools/assetgen/world.py`, `public/assets/world/` | 385² heightfield, 4 GLBs, `world.json` |
| Traffic agents with kinematic colliders | `src/traffic/traffic.ts` | 24 free-drive / 16 mission agents; headway + player braking |
| Seven missions with per-kind evaluation and scoring | `src/missions/definitions.ts`, `src/missions/manager.ts` | Objective text, par times, reward, penalty |
| Garage: car selection, specs, condition meters, refuel/repair/service, paint, rims | `src/ui/screens/garage.ts`, `src/app.ts` | Costs from `GAME` + hard-coded paint/rim prices |
| Settings: graphics, render scale, 4 volumes, steering mode, sensitivity, control size/opacity, handedness, UI scale, assists, digits, telemetry, tutorial hints | `src/ui/screens/settings.ts` | Several controls are stored but not consumed — §3 |
| Save: versioned schema, validation/repair, backup, 400 ms debounce, memory fallback | `src/save/*` | `farman.save.v1`, `farman.save.backup` |
| Persian RTL UI, Vazirmatn, Persian digits and separators | `src/ui/design.css`, `src/ui/i18n.ts`, `src/ui/format.ts` | Global digit mode; `.ltr` isolation for telemetry |
| Three cameras (chase/close/hood) with damping and speed FOV | `src/rendering/cameraRig.ts` | No cockpit |
| Studio/garage scene with turntable, floor reflection, three-point light | `src/rendering/studio.ts` | Separate scene; the menu never waits for the world to load |
| Vehicle rendering with GLB binding, proxy fallback, wheel animation, brake/reverse/headlight emissive | `src/rendering/vehicleView.ts` | Wheel nodes `wheel_fl/fr/rl/rr`; proxy built if GLB fails |
| HUD: speed, tach, gear, fuel, coolant, flags, objective, minimap, telemetry block | `src/ui/screens/hud.ts` | Minimap redraw ~8 Hz |
| Tutorials (manual/automatic) and help screen | `src/ui/screens/overlays.ts` | One-shot per save flag |
| Weather dry/rain (fog, clear colour, grip) | `src/rendering/worldScene.ts` | Only the `wet` mission forces rain |

## 3. Partially implemented

| Area | What works | What does not | Where |
|---|---|---|---|
| Economy loop | Credits are earned by missions; refuel/repair/service/paint/rims spend them | Driving never writes fuel, wear, damage or odometer back to the save, so the garage always shows pre-drive state; repairs are cosmetic | `src/app.ts` `disposeDrive`, `src/vehicles/vehicle.ts` |
| Progression | XP accumulates (`score × 2`) | `player.level` never changes; `totalKm` and `sinceServiceKm` are never incremented | `src/app.ts` `persistMission` |
| Settings | Graphics, render scale, UI scale, digits, assists, steering mode and handedness take effect | `steeringSensitivity`, `controlSize`, `controlOpacity` are persisted and never applied; volume sliders have no consumer | `src/ui/screens/settings.ts`, `src/ui/design.css` |
| Audio | `src/audio/audio.ts` — Web Audio synth (engine firing-frequency oscillators, tyre and wind noise, rain bed, UI blips) driven by telemetry | No sampled recordings, no music | Verified in browser, not on device |
| Damage | Scalar `bodyDamage` rises on impacts, affects nothing visually and costs money to repair | No deformation, no panel/glass damage, no performance penalty | `src/vehicles/vehicle.ts` |
| Weather | Dry/rain presets change fog, clear colour and grip | Rain is only reachable through the `wet` mission; no free-drive weather selector, no rain VFX, no wipers | `src/app.ts` `startDrive` |
| Traffic | Lane following, headway, player braking, collisions | No traffic lights, stop signs, lane changes or priority; cars wrap around at road ends; O(n²) headway scan | `src/traffic/traffic.ts` |
| Surfaces | Asphalt/tunnel and dirt drive different grip; wetness blends mu | `gravel`, `sand`, `grass` exist in the type and grip table but are never returned by the world | `src/world/surface.ts`, `src/rendering/worldScene.ts` |
| Mission objectives | All seven evaluate and score correctly | Objectives are geometric distances along the spawn heading, not authored trigger volumes; retuning a spawn silently moves the target | `src/missions/manager.ts` |
| Save robustness | Validation repairs bad values; corrupt JSON is backed up; memory fallback | No flush on `visibilitychange`/`beforeunload`; a hard kill inside the 400 ms debounce loses the mutation; no migration path | `src/save/storage.ts` |
| Android shell | Capacitor project generated, RTL supported, landscape locked, hardware acceleration on | APK not built or installed; no splash/icon assets of our own; `webContentsDebuggingEnabled: false` makes field debugging harder | `android/`, `capacitor.config.ts` |

## 4. Not implemented

- Cockpit interior and cockpit camera (`visual.cockpitEye` is authored in all three profiles
  and never read; the "hood" camera is a bonnet view).
- Music and sampled (recorded) engine audio.
- Traffic-light or right-of-way logic; pedestrians; police; checkpoints.
- Mesh deformation or detachable damage parts.
- Day/night cycle or headlight cones (`sky-dusk.png` is unused).
- Vehicle purchase/unlock flow (all three cars start unlocked) and mission unlocking.
- Level-up rules, skill tree, or any progression beyond credits/XP counters.
- Multiplayer, leaderboards, cloud save, telemetry upload.
- Gamepad/wheel support; haptics.
- Replay, ghost, photo mode.
- Country-scale map, inter-city routes, fuel stations in the world.
- Localisation other than Persian (Latin digits are a display option, not a language).
- Automated CI pipeline in-repo; automated Android build; store packaging.

## 5. Known defects (with severity)

| # | Severity | Defect | Evidence |
|---|---|---|---|
| D1 | High | Keyboard left steering does nothing | `moveTo()` clamps to `0..1` in `src/input/keyboard.ts`; negative steer → 0 |
| D2 | High | Drive state never persisted (fuel/wear/damage/odometer) | No `mutate` call after a drive in `src/app.ts` |
| D3 | High | `npm test` fails: no test files | `vitest run` exit 1; `tests/` absent |
| D4 | Medium | `eslint src` fails on 2 errors | `src/ui/ui.ts:72` empty interface; `src/vehicles/vehicle.ts:352` irregular whitespace |
| D5 | Medium | Repo-wide lint fails on 74 errors | `tools/qa/*.mjs` use `process`/`window`/`console` with no Node env configured in `eslint.config.js` |
| D6 | Medium | `npm run assets` and `npm run shots` point at missing files | `tools/assetgen/build_all.py`, `tools/qa/capture.mjs` do not exist |
| D7 | Medium | No brand favicon or launcher icon (Capacitor defaults are used) | `index.html` → `./assets/brand/icon-192.png`; directory absent; `android/app/src/main/res/mipmap-*` are stock |
| D8 | Medium | Control size/opacity/sensitivity settings inert | Values only stored in `src/save/schema.ts`; no CSS/consumer |
| D9 | Low | No render interpolation; wheel spin assumes 60 fps | `alpha` unused; `VehicleView.update` uses `1/60` |
| D10 | Low | Stale comment and unused API in physics wrapper | `src/physics/world.ts` header + `registerVehicle`/`updateVehicles` with no callers |
| D11 | Low | Two sources for starting credits; unused `GAME.missionBaseReward`, `PHYSICS.linearDamping`, `RENDER.maxDeltaTime` | `src/core/config.ts`, `src/save/schema.ts`, `src/app.ts` |
| D12 | Low | Garage horsepower disagrees with published figures | Curves imply ≈58 / 152 / 205 hp (see `VEHICLE_DATA_SOURCES.md` §2.1, §3.1, §4.1) |

## 6. Next steps, in priority order

### P0 — make the project verifiable (do first)

1. **Create the test suite.** Add `tests/` with the unit tests listed in
   `docs/qa/TEST_PLAN.md`: torque interpolation, gear ratios, clutch coupling, tyre curve,
   save validation, formatting, mission scoring, profile validation. Acceptance: `npm test`
   exits 0 with ≥ 30 assertions covering the physics core and save/format paths.
2. **Fix the two `src` lint errors and the keyboard steer bug (D1, D4).** Add a keyboard
   steer test. Acceptance: `npx eslint src` exits 0; holding `A` produces negative steer.
3. **Persist drive state (D2).** On pause, mission end, and exit, write `fuel`, `tireWear`,
   `engineWear`, `bodyDamage`, `odometerKm`, `sinceServiceKm` back into `vehicles[id]`, and
   add `distanceKm` to `player.totalKm`. Acceptance: drive 2 km, return to garage, odometer
   and fuel reflect the drive; a damaged car still shows damage.
4. **Repair the build scripts (D6) and the icon (D7).** Either add
   `tools/assetgen/build_all.py` and `tools/qa/capture.mjs`, or change the npm scripts to
   the real entry points; generate `public/assets/brand/icon-192.png`/`512` from the boot
   SVG. Acceptance: `npm run assets` and `npm run shots` exit 0 from a clean checkout.

### P1 — close the loop on promised features

5. **Wire the inert settings (D8).** Apply `--control-scale` from `controlSize`, an opacity
   variable from `controlOpacity`, and multiply steering authority by
   `steeringSensitivity`. Acceptance: moving each slider visibly changes the control layer.
6. ~~**Audio.**~~ Done: `src/audio/audio.ts` is an engine synth driven by `rpm`, `throttle`,
   `profile.audio` (firing Hz, timbre, gains), tyre slip noise, wind, UI clicks; respect the
   four volume settings and pause with the game. Acceptance: no clipping at redline, mute
   works, audio stops on background.
7. **Cockpit or honesty.** Either build interior meshes and a cockpit camera using
   `cockpitEye`, or remove `cockpitEye`, rename the hood camera label, and document "no
   cockpit" in the GDD. Do not keep a camera labelled کابین that is a bonnet view.
8. **Save hardening.** Flush on `visibilitychange`/`pagehide`, add `SAVE_VERSION` migration
   scaffolding, and surface `persistent === false` in the UI.
9. **Traffic rules.** Traffic lights with stop lines, lane changes, and a spatial index for
   headway (replace O(n²)). Acceptance: 24 agents at 60 Hz cost < 0.5 ms/frame on desktop
   and no car drives through a red light.
10. **Visual pass, in this order:** per-paint metallic/roughness, contact shadow/AO, sky
    horizon and sun disc, facade depth, roadside density, rain treatment. See
    `ART_BIBLE.md` §9.

### P2 — depth and content

11. **Performance measurement on device.** Add draw-call and frame-time instrumentation,
    capture p50/p95 on a mid-range Android phone, then tune render scale/shadow distance
    against data rather than guesswork.
12. **Mission trigger volumes.** Replace distance-along-heading with authored zones in
    `world.json` (position, radius, heading tolerance) so objectives survive spawn edits.
13. **Damage visuals.** At minimum: darkened/broken lights, a crumpled bumper variant,
    cracked glass decal, and a performance penalty for engine wear.
14. **Progression.** Define level thresholds from XP, unlock a fourth car by level, and add
    a purchase price so credits have a long-term sink.
15. **Free-drive weather and time.** A weather selector in free drive; dusk lighting using
    the existing `sky-dusk.png`.
16. **Asset compression.** Draco or meshopt for the 16 MB of world GLBs; WebP/KTX2 for
    textures; measure startup time before and after.

### P3 — explicitly out of scope for V1

Country-scale map, multiplayer, pedestrians, police pursuits, damage deformation with soft
body physics, replay/ghost, iOS build, localisation beyond Persian. Do not start these
before P0 and P1 are complete.

## 7. Definition of done for V1

- `npm run typecheck && npm run test && npm run build && npx eslint src` all pass.
- `npx cap sync android && ./gradlew assembleDebug` produces an APK in CI, and that APK
  installs and completes a mission on a real device.
- Fuel/wear/damage persist across a drive; the garage reflects them.
- Audio exists and respects settings.
- No user-facing control is inert.
- `GDD.md` §5.2 matches reality exactly (nothing listed as missing that exists, nothing
  claimed that does not).
