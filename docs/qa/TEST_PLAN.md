# FARMAN — Test Plan

Status: **no automated tests exist yet.** `vite.config.ts` includes `tests/**/*.test.ts`;
the directory does not exist, and `npm test` exits 1 with "No test files found". This plan
defines what to build, with concrete expected values taken from the source so the tests are
not tautologies.

Verified baseline, 2026-11-12:

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | Pass |
| Unit tests | `npm run test` | Fail — no test files |
| Lint (src) | `npx eslint src` | Fail — 2 errors |
| Lint (repo) | `npm run lint` | Fail — 74 errors, 32 warnings |
| Build | `npm run build` | Not run this pass |
| Visual harness | `node tools/qa/smoke.mjs` | Requires `npm run dev` on 127.0.0.1:5188 and Edge |

## 1. Strategy

| Layer | Tool | Scope | Gate |
|---|---|---|---|
| Unit | Vitest 3.2 (jsdom env) | Pure simulation, save, formatting, scoring | Every commit |
| Integration | Vitest, no renderer | Multi-step drive scenarios on a flat surface | Every commit |
| Build | npm scripts | typecheck, lint, test, Vite build | Every commit / CI |
| Package | Capacitor + Gradle | sync, assembleDebug, install | CI on `ubuntu-latest` |
| Visual | Playwright 1.65 | Boot, menu, drive, garage, HUD | Pre-merge / nightly |
| Manual | Human, real device | Touch feel, orientation, performance, lifecycle | Every release candidate |

Rules: tests must not hit the network, must not read the wall clock (inject `dt` and a fake
`now`), and must not import Babylon. Anything that needs a scene belongs in visual QA.

## 2. Unit tests

Suggested layout: `tests/engine.test.ts`, `transmission.test.ts`, `tire.test.ts`,
`profile.test.ts`, `save.test.ts`, `format.test.ts`, `mission.test.ts`, `loop.test.ts`,
`traffic.test.ts`.

### 2.1 Engine torque interpolation (`src/vehicles/engine.ts`, `src/core/math.ts`)

| Case | Expectation |
|---|---|
| Pride at 900 rpm | exactly 62 N·m |
| Pride at 3000 rpm | exactly 100 N·m |
| Pride at 6000 rpm | exactly 64 N·m |
| Below first point (500 rpm) | clamps to 62, never extrapolates negative |
| Above last point (7000 rpm) | clamps to 64 |
| Midpoint 3400 rpm | between 96 and 100 (monotone cubic, no overshoot above 100) |
| BMW 1350–4000 rpm | 300 N·m across the plateau (±0.001) |
| Corolla 4400 rpm | 205 N·m |
| `peakTorqueAt` on a curve with two equal points | returns the plateau value, not NaN |

Also assert `monotoneCubic` never overshoots on a monotone table (property test over the
three real curves, 100 samples each).

### 2.2 Transmission (`src/vehicles/transmission.ts`)

| Case | Expectation |
|---|---|
| Pride 1st total ratio | `3.667 × 4.06 = 14.888` (±1e-6) |
| Pride 5th total ratio | `0.743 × 4.06 = 3.017` |
| Pride reverse | `3.667 × 4.06 = 14.888` |
| Neutral | ratio 0, wheel torque 0, clutch torque 0 |
| BMW 8th | `0.640 × 3.077 = 1.969` |
| Corolla CVT ratio bounds | always within `[0.40, 2.48] × 4.09` |
| CVT ratio rate | cannot change more than `2.2 × dt` per step |
| Manual shift without clutch | `selectManual(..., clutchPedal: 0.2, ...)` returns `'needClutch'` |
| Reverse above 1.4 m/s | returns `'tooFast'` |
| Shift while shifting | second call returns `'busy'` |
| Manual coupling, pedal = 1 | engagement 0, output torque 0, `slipping: true` |
| Manual coupling, pedal = 0, slip > 1 | torque = `capacity × tanh(1.4·slip)`, sign follows slip |
| Locked clutch | with `|slip| < 0.9` and engagement > 0.92, output equals engine torque clamped to capacity |
| Converter pump | `(rpm/K)²` clamped to `1.9 × peak torque`; K interpolates stall→coupling |
| Converter lock-up | locks above speed ratio 0.86 and 6 m/s, unlocks below 0.78 or 3 m/s (hysteresis) |

### 2.3 Tyre model (`src/vehicles/tire.ts`)

| Case | Expectation |
|---|---|
| `tireLongitudinalForce(0, …)` | 0 |
| Peak location | force is maximal near `peakSlipRatio`; at `0.5 × peak` and `2 × peak` it is lower |
| Symmetry | `F(-s) = -F(s)` for the same mu/Fz |
| Saturation | force never exceeds `mu × Fz` for `|slip| ≤ 1.2` |
| Zero load | 0 force, no NaN |
| `slipRatioAt` at standstill | denominator ≥ 1.6, no division by zero |
| `effectiveMu` dry vs wet | wet < dry for every profile |
| Load sensitivity | doubling `normalForce` at fixed reference yields mu × 2^−k |
| Wear | mu at wear 1 is 62 % of mu at wear 0 |
| Temperature | mu at 20 °C and at 145 °C is lower than at `optimalTempC` |
| Clamp | returned mu always within `[0.22, 1.35]` |

### 2.4 Profile validation (`src/vehicles/profile.ts`)

| Case | Expectation |
|---|---|
| All three shipped profiles | `validateProfile(p)` returns `[]` |
| Mass 100 kg | error contains "massKg out of range" |
| Three gear ratios | error "needs at least 4 gears" |
| Non-increasing torque rpm | error "torque curve rpm not increasing" |
| Manual without `clutch` | error "manual needs clutch data" |
| CVT without `cvt` | error "CVT needs ratio data" |
| Wheel anchors length 3 | error "four wheel anchors required" |

### 2.5 Save (`src/save/schema.ts`, `src/save/storage.ts`)

| Case | Expectation |
|---|---|
| `createDefaultSave()` | 3 vehicles, 42,000,000 credits, selected `pride-131`, schema 1 |
| `validateSave(null)` | returns defaults, no throw |
| credits `-5` / `1e20` / `"x"` | clamped to 0 / 9,999,999,999 / 42,000,000 |
| graphics `"ultra"` | falls back to `balanced` |
| fuel 999 | clamped to 200 |
| tireWear outside 0–1 | clamped per wheel |
| missing vehicle entry | re-created from defaults |
| selected vehicle not unlocked | pushed into `unlockedVehicleIds` |
| corrupt JSON in storage | backup key written, defaults returned |
| `mutate` then `flush` | round-trips through a fake `Storage` |
| debounce | two mutations in < 400 ms produce one write |
| no `localStorage` | `persistent === false`, values still readable in-session |

### 2.6 Formatting and RTL (`src/ui/format.ts`)

| Case | Expectation |
|---|---|
| `toFaDigits('0123456789')` | `'۰۱۲۳۴۵۶۷۸۹'` |
| `toLatinDigits('۴۲')` | `'42'` |
| `formatNumber(42000000)` | `'۴۲٬۰۰۰٬۰۰۰'` (U+066C separator) |
| `formatNumber(-1234.5, 1)` | `'−۱٬۲۳۴٫۵'` (U+2212 minus, U+066B decimal) |
| `formatNumber(NaN)` | `'—'` in Persian digits mode |
| `formatMoney(2_500_000)` | ends with `' تومان'` |
| `formatMoneyShort(42_000_000)` | `'۴۲ میلیون'` |
| `formatTime(75.4)` | `'۱:۱۵'` |
| `formatTime(9.5)` | `'۹.۵'` |
| `formatPercent(0.5)` | `'۵۰٪'` |
| `formatDistance(0.42)` | `'۴۲۰ م'` |
| `formatDistance(12.4)` | contains `'کیلومتر'` |
| digit mode `latin` | all of the above emit ASCII digits |

String assertions must use the exact Unicode characters; a test that only checks "contains
a digit" will pass on the bug this is meant to catch.

### 2.7 Mission scoring (`src/missions/manager.ts`)

Use a fake `VehicleSim` stub exposing `position`, `bodyDamage`, `fuelLitres` and a mutable
telemetry object.

| Case | Expectation |
|---|---|
| Clean parking run at par/2, 0 collisions, 0.5 L used | score 100 (clamped), reward = mission reward |
| One collision | `collisions === 1`, `penalty === 12`, score reduced |
| Failure (time out) | `success false`, reward 0, score ≥ 4 |
| Reward rounding | `round(reward × score / 100)` |
| Hill start forward 26 m | success |
| Hill start rollback −3 m | failure, reason mentions rollback |
| Traffic 4 s over 58 km/h | failure |
| Traffic 58 km/h exactly | no speeding accumulation |
| Braking stop at 70 m | success |
| Braking passes 101 m | failure |
| Wet: 3.1 s off-road at 5 m/s | failure |
| Time trial at 700 m | success |

### 2.8 Loop (`src/core/loop.ts`)

| Case | Expectation |
|---|---|
| `advance(16.67)` after start | 1 step, alpha ≈ 0 |
| `advance(+100 ms)` | 4 steps max (clamped), alpha in `[0,1)` |
| `advance` without `start` | 0 |
| `resync` | accumulator 0, alpha 0 |
| long pause (5 s) | accumulator never exceeds `4 × dt` |

### 2.9 Traffic helpers (`src/traffic/traffic.ts`)

`__trafficTest` exports `cumulative` and `findSegment`.

| Case | Expectation |
|---|---|
| `cumulative([[0,0,0],[3,0,4]])` | `[0, 5]` |
| `findSegment` at 0 / mid / end | 0 / correct index / `length − 2` |
| Zero-length segment | skipped without NaN |

## 3. Integration scenarios (no renderer)

Build a `VehicleSim` against `DRY_SURFACE` and a real `PhysicsWorld` (Rapier init is async
and works in Node/jsdom), step at 1/60 for a fixed number of steps.

| Scenario | Setup | Assertion |
|---|---|---|
| Launch | Pride, 1st, clutch released over 1 s, full throttle | moves forward; 0–50 km/h in 5–10 s; no NaN in telemetry |
| Stall | Pride, 1st, clutch dumped at idle | engine stalls (or bogs), auto-restart within 1.5 s |
| Braking dry | 80 km/h, full brake, straight | stops in 25–45 m; ABS flag active at some point |
| Braking wet | same with `wet: 1` | stopping distance ≥ 1.3 × dry |
| Hill start | 10 % slope via a custom `SurfaceProvider` | rollback < 2.5 m with handbrake, then climbs |
| Coast | 50 km/h, neutral | decelerates monotonically; no creep after stop with brake |
| Steering | 60 km/h, 50 % steer | yaw rate positive, lateral G > 0.2, no roll (body roll not simulated) |
| Fuel | 5 minutes at full throttle | fuel decreases; `fuelPer100Km` finite and < 60 |
| Thermal | 10 minutes at load | coolant rises then plateaus below 125 °C |
| Save round-trip | mutate → flush → new store | all fields equal |

Tolerances: ±5 % on distances, ±0.2 s on times, exact equality only for pure functions.
Never assert a 0–100 time: the profiles are tuned, not validated (`VEHICLE_DATA_SOURCES.md`).

## 4. Build checks

| Step | Command | Pass criterion |
|---|---|---|
| Types | `npm run typecheck` | exit 0 |
| Lint (source) | `npx eslint src` | exit 0 (currently 2 errors) |
| Lint (repo) | `npm run lint` | exit 0 (currently 74 errors; fix the Node globals config first) |
| Unit + integration | `npm run test` | exit 0, no skipped tests |
| Bundle | `npm run build` | exit 0; check `dist/assets` sizes against the previous build (±10 %) |
| Capacitor sync | `npx cap sync android` | exit 0; `android/app/src/main/assets/public` populated |
| Gradle | `cd android && ./gradlew assembleDebug` | `app-debug.apk` produced |
| APK sanity | `aapt dump badging app-debug.apk` | package `com.khiyarusa.farman`, minSdk 24, targetSdk 36 |

CI shape (no `.github/` exists yet; add one workflow):

```yaml
- run: npm ci
- run: npm run typecheck
- run: npx eslint src
- run: npm run test
- run: npm run build
- run: npx cap sync android
- run: cd android && ./gradlew assembleDebug
- uses: actions/upload-artifact@v4   # app-debug.apk
```

`ubuntu-latest` already ships the Android SDK, JDK 17 and `android-36`; pin
`actions/setup-java@v4` with Temurin 17 for determinism (see
`docs/research/STACK_AND_RAPIER_API.md` §6).

## 5. Visual QA (Playwright)

Harness scripts in `tools/qa/`: `smoke.mjs` (menu → drive → 3.2 s of throttle → screenshot
+ `debugState`), `garage-shot.mjs`, `debug-drive.mjs`, plus several one-off probes. They
launch Edge with `--use-gl=angle --use-angle=d3d11` at 1280 × 640, navigate to
`http://127.0.0.1:5188/`, and read `window.__farman`.

Checklist per run:

1. Boot screen reaches the menu within 5 s; no `pageerror`, no console error.
2. Menu shows Persian brand, tagline, credits and six nav items.
3. Entering free drive mounts the HUD, touch controls and no tutorial after it was dismissed.
4. `debugState` reports `mode: 'drive'`, a non-null vehicle, finite speed, `body.mass` equal
   to the profile mass (±1 kg), four wheel `fz` values summing to ≈ `m·g`.
5. After 3 s of throttle the car has moved > 20 m and speed > 15 km/h.
6. Screenshot is not blank/black; HUD digits are visible; no element overlaps the road
   centre at 16:9 and 20:9.
7. Garage: car renders, paint swatch changes albedo, chips switch cars without a blank frame.
8. Rain mission: fog is visibly denser than dry.

Store captures under `docs/visual-qa/<date>/` (the `dev/` folder is gitignored). Compare
against the previous run with a perceptual diff; a > 2 % pixel change needs a human look.
Do not add `preserveDrawingBuffer` to ship screenshots — use Playwright's page screenshot.

## 6. Manual Android checklist (release candidate)

Run on a real mid-range phone, Android 10+ and Android 14+, fresh install.

| # | Check | Pass criterion |
|---|---|---|
| 1 | Install APK | Installs without "unknown source" errors beyond the expected prompt |
| 2 | First launch | Reaches menu < 8 s; no white flash longer than 1 s |
| 3 | Orientation | Locks to landscape; rotating the phone does not restart the activity |
| 4 | Safe areas | HUD and controls clear of notch and gesture bar |
| 5 | Persian text | Vazirmatn renders, no tofu, digits are Persian, punctuation correct |
| 6 | Steering wheel | Drag is smooth; releases to centre; no page scroll/zoom |
| 7 | Pedals | Analog fill follows finger; multi-touch throttle+brake works |
| 8 | Clutch | Manual car stalls if released too fast; auto-clutch option prevents it |
| 9 | Gear buttons | Shift refused without clutch with a Persian toast |
| 10 | Gyro mode | Steering responds to tilt; no permission dialog; recentres |
| 11 | Camera cycle | Chase → close → hood → chase, no clipping through the car |
| 12 | Pause/resume | Pause stops the sim; resume does not teleport or explode physics |
| 13 | Background/foreground | Returning after 1 min does not accumulate steps; car is where it was |
| 14 | Back button | Does not exit mid-drive without confirmation |
| 15 | Save persistence | Kill the app, relaunch: settings, credits, selected car, mission records survive |
| 16 | Fuel/service | Values persist after the P0-3 fix; before it, document the known gap |
| 17 | Traffic | Cars collide physically, do not jitter, do not drive through the player |
| 18 | Performance | 30 fps minimum on balanced at 1.25 DPR; no thermal throttle in 10 min |
| 19 | Audio | Silent build is a known gap; after audio ships, check mute and background stop |
| 20 | Exit | Native exit closes the app; web build shows the browser-close message |

Log device model, Android version, SoC, and measured fps in the release notes. A build that
has not been through this list is not release-ready, regardless of green unit tests.
