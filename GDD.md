# FARMAN — Game Design Document (V1)

Status: describes the build in this repository as of 2026-11-12 (`APP.version = 0.1.0`).
Everything below is traceable to source; anything aspirational is listed in §5.2 and §14.

| Field | Value |
|---|---|
| Title | FARMAN — فرمان |
| Tagline | هر خودرو، رفتار خودش را دارد |
| Genre | Single-player driving simulation, mission-based |
| Platform | Android (Capacitor WebView, landscape), plus desktop browser for development/QA |
| Input | Touch (wheel / buttons / gyro), keyboard fallback |
| Offline | Yes — all assets bundled, no network calls at runtime |
| Language | Persian-first UI (`lang="fa" dir="rtl"`), English code comments |
| Session length | 2–8 minutes per mission; free drive unlimited |

## 1. Identity

FARMAN is a **single-player, offline-first Android driving simulator** built around one
claim: the three cars do not feel like the same car with different numbers. A 1.3-litre
front-wheel-drive manual with no driver aids, a belt-CVT family sedan, and a rear-drive
turbo sedan are modelled with separate powertrains (manual clutch, torque converter, CVT),
separate torque curves, separate mass/geometry, and separate assist sets
(`src/vehicles/profiles/*.ts`, `src/vehicles/transmission.ts`).

"Advanced but playable" is the design contract:

- **Advanced** — fixed 60 Hz simulation, per-wheel slip and load transfer, engine inertia
  and friction, clutch/converter coupling, ABS/TCS/ESC, wet grip, fuel and coolant models.
- **Playable** — every assist defaults to on where the real car has it, an auto-clutch
  option exists for manual cars, the engine self-restarts 1.2 s after a stall
  (`src/vehicles/engine.ts`), and the car is re-centred on the road by a reset button.
- **Persian-first** — the UI is written in Persian, not translated into it; numbers use
  Persian digits and Persian separators by default (`src/ui/format.ts`).

There is no story, no open-world progression gate, and no monetisation.

## 2. Pillars

1. **Each car behaves like itself.** Powertrain architecture is a first-class model, not a
   multiplier: clutch bite point and stall for the Pride, converter lock-up and kickdown for
   the BMW, a continuously variable ratio for the Corolla.
2. **Touch driving that can be modulated.** Pedals are analog and read the touch point
   inside the pedal, never a fake pressure value (`src/input/controls.ts`).
3. **Persian by construction.** RTL layout, Vazirmatn, Persian digits, Persian road and
   mission names, metric units.
4. **Runs on a phone, offline.** One WebGL2 context, quality presets, no remote assets.
5. **Honest simulation.** Limitations are stated in-game (help screen) and in these docs
   rather than hidden behind fake systems.

## 3. Platform and session shape

- Android `minSdk 24`, `targetSdk 36`, `screenOrientation="sensorLandscape"`
  (`android/variables.gradle`, `android/app/src/main/AndroidManifest.xml`).
- WebGL2 is a hard requirement; `src/main.ts` fails fast with a Persian error if absent.
- Boot: physics wasm init → studio scene with the selected car → main menu. The 3D world is
  only built when a drive starts (`App.startDrive`).
- Pause is explicit: Android backgrounding is not wired to pause; the loop clamps frame
  delta and the accumulator discards backlog (`src/core/loop.ts`).

## 4. Core loop

```
menu → (garage: choose car / paint / rims / fuel / repair)
     → (missions: choose one of 7, or free drive)
     → drive (fixed-step sim, traffic, weather)
     → mission result (score 0–100, credits, best score)
     → back to menu
```

Free drive is always available and is the default primary menu action. Missions are
optional side content, never a gate.

## 5. V1 scope

### 5.1 Implemented

| Area | What exists | Source |
|---|---|---|
| Vehicles | 3 drivable cars, distinct powertrains, paint/rim selection | `src/vehicles/` |
| Physics | 60 Hz force-based bicycle model, per-wheel slip, load transfer, ABS/TCS/ESC | `src/vehicles/vehicle.ts` |
| World | 3.6 km × 3.6 km region, 11 named roads, city/highway/mountain/rural | `public/assets/world/world.json` |
| Traffic | 10–24 lane-following agents with kinematic colliders | `src/traffic/traffic.ts` |
| Missions | 7 missions with per-kind objectives and scoring | `src/missions/` |
| Economy | credits, refuel, repair, full service, paint, rims | `src/app.ts`, `src/core/config.ts` |
| Weather | dry and rain states (grip + fog + sky tint) | `src/rendering/worldScene.ts` |
| Camera | chase, close, hood | `src/rendering/cameraRig.ts` |
| HUD | speed, tach, gear, fuel, coolant, ABS/TCS/ESC flags, minimap, objective | `src/ui/screens/hud.ts` |
| Save | versioned localStorage save with validation, backup, debounce | `src/save/` |
| Settings | quality, render scale, 4 volumes, steering mode, sensitivity, control size/opacity, handedness, UI scale, assists, digits, telemetry, tutorial hints | `src/ui/screens/settings.ts` |
| Onboarding | one-shot manual/automatic tutorial overlay, help screen | `src/ui/screens/overlays.ts` |

### 5.2 Explicitly NOT implemented in V1

| Not present | Consequence |
|---|---|
| Country-scale map | One 3.6 km region; roads end or loop, there is no inter-city network. |
| Multiplayer / online | No networking code at all. |
| Cockpit interior for all cars | Three cameras only: chase, close, hood. `visual.cockpitEye` is authored in every profile but **never read**; there is no interior mesh. |
| Damage deformation | `bodyDamage` is a single 0–1 scalar. No mesh deformation, no detached panels, no broken glass. |
| Traffic-light logic | None. Intersections are unmanaged; traffic AI has no signals, stops, or right-of-way. |
| Audio playback | No audio engine. Volume sliders persist values that nothing consumes; `profile.audio` is metadata only. |
| Pedestrians, police, checkpoints | Not modelled. |
| Day/night cycle | Fixed daylight sky, two weather presets. |
| Wear/fuel persistence from driving | Fuel burn, tyre wear, engine wear and body damage are simulated **inside a drive** but are not written back to the save on exit (`App.disposeDrive`), so the garage always shows pre-drive values. |
| Level progression | `player.level` exists and is displayed; `xp` accumulates from mission score, but no level-up rule exists. |
| Vehicle purchase/unlock | All three cars are unlocked in the default save; `unlockedVehicleIds` is checked but nothing removes an id. |
| Gamepad / wheel support | Keyboard and touch only. |

## 6. Controls

### 6.1 Touch

| Control | Behaviour | Notes |
|---|---|---|
| Steering wheel | Drag around the wheel centre; angle ÷ 0.75π, clamped to ±1; releases spring back at 2.6 rad/s; the graphic rotates ±135° | `steeringMode: 'wheel'` (default) |
| Steering buttons | ◀ / ▶ held for full lock, released for centre | `steeringMode: 'buttons'` |
| Gyro | `gamma / 35°`, clamped ±1; enabled at construction when the mode is `gyro` | No permission prompt; no calibration UI |
| Throttle / brake | Vertical position of the touch inside the pedal, 0 at the bottom to 1 at the top; multi-touch tracked per pointer | Fills are colour-coded: green throttle, red brake |
| Clutch | Third pedal, manual cars only | Same analog rule |
| Gearbox (manual) | ▲ / N / ▼ buttons; shifts need clutch ≥ 0.55 and < 1.4 m/s for R | Refusals toast "برای تعویض دنده، کلاچ را بگیر" |
| Gearbox (automatic) | One button cycling P → R → N → D; R is refused above 1.5 m/s | `VehicleSim.cycleSelector` |
| Handbrake | Hold button; applies rear torque and drops rear lateral grip to 55% | Also Space on keyboard |
| Camera / reset / pause | Top-centre icon buttons | Reset re-spawns at the mission/free-drive spawn |

Steering input is smoothed toward the target in `TouchControls.update`; the vehicle then
moves its actual steer angle toward the input at 320°/s (`VehicleSim.step`).

### 6.2 Keyboard (development and QA)

`W`/`↑` throttle, `S`/`↓` brake, `A`/`D` or `←`/`→` steer, `Ctrl`/`Shift` clutch,
`Space` handbrake, `E` shift up, `Q` shift down, `M` selector, `C` camera, `R` reset,
`P`/`Esc` pause. Analog ramps: throttle 3.2/s, brake 3.6/s, steer 3.4/s
(`src/input/keyboard.ts`).

Known defect: `moveTo()` in that file clamps its result to `0..1`, so **left steering
never leaves zero** on keyboard. Right steering and all pedals work. Fix is pending; see
`TECHNICAL_IMPLEMENTATION_PLAN.md`.

## 7. Mission catalogue

Seven missions, defined in `src/missions/definitions.ts`, evaluated in
`src/missions/manager.ts`. Distances are measured along the spawn heading, not along the
road.

| # | id | Title (fa) | Objective | Pass condition | Fail condition | Par | Reward (T) |
|---|---|---|---|---|---|---|---|
| 1 | `parking` | پارک دقیق | Stop inside the parking zone | Inside 5.2 m of a point 34 m ahead **and** \|v\| < 0.35 m/s for 1.2 s | 60 s elapsed | 60 s | 7,000,000 |
| 2 | `hill-start` | حرکت در سربالایی | 25 m up the hill | Forward distance > 25 m | Rollback < −2.5 m | — | 6,000,000 |
| 3 | `traffic` | رانندگی ایمن در ترافیک | 60 s clean driving | 60 s elapsed | Any collision, or > 3 s above 58 km/h | 60 s | 8,000,000 |
| 4 | `braking` | ترمز اضطراری | Stop in the braking box | Stop < 0.4 m/s while 55–95 m ahead, \|lateral\| < 4.5 m | Passing 100 m | — | 5,500,000 |
| 5 | `wet` | کنترل در جاده خیس | Complete the wet route | 420 m travelled | > 3 s off-road above 3 m/s, or 120 s | 120 s | 8,500,000 |
| 6 | `time-trial` | مسابقه زمان | Reach the finish | 700 m travelled | 90 s elapsed | 90 s | 10,000,000 |
| 7 | `eco` | رانندگی بهینه | Finish with low fuel use | 500 m travelled | 180 s elapsed | 180 s | 7,500,000 |

Each mission spawns from a named point in `world.json` (`city-parking`,
`mountain-hillstart`, `city-traffic`, `highway-braking`, `mountain-wet`, `highway-time`,
`rural-eco`) with a hard-coded fallback pose if the world file is missing. `wet` forces
`weather: 'rain'`; the other six run dry. Traffic density is 0.4 for missions (16 agents)
and 1.0 for free drive (24 agents).

### 7.1 Scoring

Score is 0–100 and multiplies the mission reward.

```
timeFactor      = clamp01(1 − (elapsed − 0.55·par) / (0.9·par))
collisionFactor = clamp01(1 − 0.22·collisions)
fuelFactor      = clamp01(1 − fuelUsed / 4)   // eco missions
                = clamp01(1 − fuelUsed / 6)   // all others
distanceFactor  = clamp01(metres / max(60, distanceM ?? 200))
raw             = 0.40·time + 0.24·collision + 0.18·fuel + 0.18·distance
score           = round(clamp(raw, 0.05, 1)·100 − penalty)
reward          = round(mission.reward · score / 100)     // 0 on failure
```

A collision is counted when `bodyDamage` rises by more than 0.004 in one frame; each adds
12 penalty points. A failed run scores `max(4, 40 − 8·collisions − 0.6·penalty)` and pays
nothing. `elapsed` has no par for `hill-start` and `braking`, so par falls back to the
elapsed time (time factor 1 for a clean finish).

## 8. Economy and progression

| Item | Value | Source |
|---|---|---|
| Starting credits | 42,000,000 تومان | `createDefaultSave()` (duplicates `GAME.startingCredits`) |
| Fuel | 3,000 تومان per litre; tank 37 / 47 / 59 L | `GAME.fuelPricePerLitre` |
| Body repair | 900,000 per damage percent (0–100 %) | `GAME.repairCostPerPercent` |
| Full service | 2,500,000: refuel + body repair + engine wear −0.35 + tyre wear −0.5 + service counter reset | `GAME.serviceCost` |
| Paint | 400,000 per change (charged even for the current colour) | `App.setPaint` |
| Rims | 900,000 per change | `App.setRim` |
| Mission reward | 5,500,000 – 10,000,000 × score/100 | `MISSIONS` |
| XP | `+round(score × 2)` per completed mission | `App.persistMission` |

Design intent: credits should force a choice between cosmetic spending and keeping the car
healthy. Actual V1 behaviour is weaker — see §14.

## 9. Weather

Only two states, chosen per drive (`WorldScene.setWeather`, called with the mission's
`weather` or `'dry'`).

| | Dry | Rain |
|---|---|---|
| Sky | `sky-day.png`, clear colour `#c9d6dd` | `sky-rain.png`, clear colour `#5d666b` |
| Fog | EXP2, density 0.00045, colour `#c2cfd5` | EXP2, density 0.0035, colour `#8e9aa0` |
| Asphalt grip | `tires.muDry` (0.90 / 0.94 / 1.00) | `tires.muWet` (0.62 / 0.66 / 0.70) blended by `surface.wet` |
| Off-road wetness | 0.4 × wet | 0.4 × 1 |

Rain does not change traffic behaviour, braking distances are emergent from grip, and there
is no aquaplaning, spray, or wiper model.

## 10. Vehicle line-up

| id | Persian name | Body | Engine | Gearbox | Drive | Mass | Peak torque | 0–100 | Top speed | Assists |
|---|---|---|---|---|---|---|---|---|---|---|
| `pride-131` | سایپا پراید ۱۳۱ | سدان | 1.323 L NA I4 | دستی ۵ سرعته | FWD | 895 kg | 100 N·m @ 3000 | 16.5 s | 160 km/h | none |
| `corolla-e210` | تویوتا کرولا ۲.۰ | سدان | 1.987 L NA I4 | CVT | FWD | 1360 kg | 205 N·m @ 4400 | 7.5 s | 195 km/h | ABS, TCS, ESC, hill start |
| `bmw-320i` | بی‌ام‌و ۳۲۰i | سدان | 1.998 L turbo I4 | اتوماتیک ۸ سرعته | RWD | 1545 kg | 300 N·m @ 1350–4000 | 7.1 s | 240 km/h | ABS, TCS, ESC, hill start |

Each car carries five paint options and two rim options with Persian names. The Pride is the
default selection and the only manual car; its clutch is the tutorial's subject.

## 11. World

One square region, 3,600 m per side, heightfield 385 × 385 samples (~9.4 m spacing), with
11 named roads:

| id | Name (fa) | Class | Width |
|---|---|---|---|
| `city-main` | خیابان اصلی | urban | 14 m |
| `city-north` | خیابان شمالی | urban | 12 m |
| `city-south` | خیابان جنوبی | urban | 12 m |
| `city-west` | بلوار غربی | urban | 12 m |
| `city-east` | بلوار شرقی | urban | 12 m |
| `city-link` | مسیر فرودگاه | urban | 10 m |
| `highway` | بزرگراه شمال | highway | 22 m |
| `mountain-1` | گردنه چالوس | mountain | 9 m |
| `mountain-2` | پیچ‌های جنگلی | mountain | 8 m |
| `rural` | جاده روستایی | rural | 8 m |
| `village` | خیابان روستا | rural | 7 m |

The region is Iranian-inspired (city grid, dual carriageway, Alborz-style pass, Caspian
forest village) and built entirely from procedural generators — see `ART_BIBLE.md`.

## 12. HUD and feedback

- Speed (Persian digits), tachometer arc with redline zone, gear letter, gearbox label.
- Fuel and coolant bars with warn/danger colours; low-fuel message replaces the objective
  meta text below 12 %.
- Flags: ABS, TCS, ESC (warn colour when intervening), LIMIT, STALL.
- Objective card with mission title, objective text and a live timer.
- Circular minimap (roads only, car fixed at centre, north-up relative to yaw) redrawn at
  ~8 Hz.
- Optional telemetry block (RPM/torque, per-wheel slip, Fz, suspension offset, surface).
- Toasts for gear refusals, camera changes, purchases, mission start/complete/fail.

## 13. Failure and recovery

- Stalling is recoverable: the engine restarts itself after 1.2 s.
- The reset button returns the car to the spawn pose and zeroes wheel speeds.
- A mission failure is shown as an overlay with score, time, distance, collisions, fuel and
  penalty; retry restarts the same mission with a fresh physics world.
- No fail state exists outside missions; free drive cannot be lost.

## 14. Design gaps to resolve before calling V1 complete

1. **Driving does not feed the economy back.** Fuel, tyre wear, engine wear, damage and
   odometer are per-drive only; `disposeDrive` drops them. Until write-back exists, refuel
   and repair are cosmetic.
2. **Level is inert.** XP accumulates, level never changes.
3. **No audio.** Settings expose four volume sliders; nothing plays.
4. **No cockpit.** The hood camera is the closest view; interiors would need meshes.
5. **Traffic has no rules.** No lights, stop signs, or priority; cars brake for the player
   and for headway only.
6. **Mission objectives are geometric.** "Park", "brake zone" and "finish" are distances
   along the spawn heading, not authored trigger volumes, so they break if the spawn pose
   changes without retuning.
