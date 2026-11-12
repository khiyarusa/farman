# FARMAN v0.1.0 — Preview Release Notes

**فرمان** · version `0.1.0` · version code `1` · **2026-11-12**
**Channel:** internal preview — debug APK, sideload only
**Package:** `com.khiyarusa.farman`

This is the first playable vertical slice: three cars, one connected region, traffic, seven
missions and a Persian RTL interface, running offline on Android. It is a preview for
testing, not a store release.

---

## What is in this build

### Three cars that do not drive alike

| Car | Drivetrain | Gearbox | Power / torque | Character |
|---|---|---|---|---|
| **Saipa Pride 131** (2008) | FWD | 5-speed manual | 58 hp / 100 N·m | No driver aids; needs the clutch, can stall, narrow tyres and the weakest brakes |
| **Toyota Corolla 2.0** (E210, 2021) | FWD | Belt CVT | 152 hp / 205 N·m | No shift pauses — the ratio sweeps; ABS, TCS and ESC available |
| **BMW 320i** (G20, 2021) | RWD | 8-speed torque-converter automatic | 205 hp / 300 N·m | Converter stall and lock-up, eight ratios, and the only rear-drive car here |

Power is computed from each car's in-game torque curve, so it can differ from a brochure
figure. All three profiles are marked as estimated engineering data.

### One connected region

A 3.6 km × 3.6 km Iranian-inspired map with 11 named roads: a city grid with a parking area,
a dual-carriageway highway, an Alborz-style mountain pass with hairpins, and a rural road
through a Caspian-style village. Free drive starts in the city; missions spawn at named
points across the map.

### Traffic

10–24 lane-following cars, vans and trucks, each with a kinematic collider so you physically
collide with them. They keep headway to the car in front and brake for you. There are **no
traffic lights** and no right-of-way rules; intersections are unmanaged.

### Seven missions

| Mission | Persian title | Goal |
|---|---|---|
| Parking | پارک دقیق | Stop inside the parking zone, without a collision |
| Hill start | حرکت در سربالایی | 25 m uphill without rolling back |
| Traffic | رانندگی ایمن در ترافیک | 60 seconds clean, under the speed limit |
| Emergency braking | ترمز اضطراری | Stop inside the marked braking zone |
| Wet road | کنترل در جاده خیس | Finish the wet route without leaving the road |
| Time trial | مسابقه زمان | Reach the finish before the clock |
| Eco driving | رانندگی بهینه | Finish the route on the least fuel |

Each mission has its own pass/fail rule, a 0–100 score, a credit reward and a best-score
record. Missions are optional; free drive is always available.

### Persian RTL interface

The UI is written in Persian, not translated into it: `lang="fa" dir="rtl"`, bundled
Vazirmatn, Persian digits and separators, Persian road and mission names. The HUD shows
speed, rpm, gear, fuel, coolant, ABS/TCS/ESC/LIMIT/STALL flags, an objective card and a
minimap.

### Cameras, settings and saves

- Three camera modes: chase, close and hood.
- Quality presets (low / balanced / high), render scale, steering mode (wheel / buttons /
  gyro), left/right-handed layout, UI scale, assists, digit style and tutorial hints.
- Career state is saved **locally** in the Android WebView's `localStorage`: credits, selected
  car, paint/rim choices, mission records and settings. There is no account and no cloud sync.

---

## What is explicitly NOT in this build

Please do not file these as regressions; they are known scope cuts for v0.1.0.

- **No audio.** There is no engine, tyre, ambience or UI sound. The four volume sliders in
  Settings store values that nothing consumes.
- **No traffic lights, stop signs or right-of-way.** Traffic only follows lanes, keeps
  headway and brakes for the player.
- **No cockpit interiors.** Chase, close and hood cameras only; no interior mesh.
- **No damage deformation.** Damage is a 0–1 number used for scoring and repair cost; panels
  do not dent, detach or break.
- **No write-back of drive state.** Fuel, tyre wear, engine wear, body damage and odometer are
  simulated during a drive but reset to their pre-drive values when you return to the menu.
  Refuel and repair are therefore mostly cosmetic in this slice.
- **No cloud saves, accounts, multiplayer or leaderboards.** Offline only.
- **No day/night cycle, pedestrians, police or checkpoints.** Two weather states: dry and
  rain (rain changes grip, fog and the clear-sky colour; there are no raindrops or wipers).
- **No gamepad or steering-wheel support.** Touch and keyboard only.
- **Not a signed release.** The APK is a debug build; it is not Play-Store ready and must not
  be uploaded as a production release.

---

## Install the debug APK

**Requirements:** Android 7.0 (API 24) or newer, a device with WebGL2, landscape orientation.
The app is distributed by sideloading only.

1. Download `farman-v0.1.0-debug.apk` from the release or from the `farman-android` artifact
   of the `Android` workflow for this commit. (Inside the artifact the same file is named
   `app-debug.apk`.) Do not use an APK from a different commit.
2. On the phone, allow installs from the app you are using to open the file (Settings →
   Apps → Special access → Install unknown apps). The exact path varies by manufacturer.
3. Open the APK and confirm the install.
4. If Android refuses to update an older debug build, uninstall the old one first.
   **Uninstalling deletes the local save.** There is no cloud backup.

With `adb`:

```bash
adb install -r farman-v0.1.0-debug.apk
```

First launch:

- The boot screen initialises the physics wasm and the garage studio before the menu appears.
- Starting a drive builds the 3D world behind a loading screen; expect this to take longer
  than returning to the menu.
- A one-time tutorial appears for manual and automatic cars the first time each type is
driven. The Help screen carries the reference text, not a replay of the overlay.

To remove the game and its save, uninstall the app or clear its storage.

---

## Known issues

| Issue | Detail |
|---|---|
| Low-poly vehicles | Hard-edged, lofted bodies with no shutlines, badges, interiors, underbody or wheel wells. They read as the right silhouette, not as the real car. |
| Sky and horizon wash out | The gradient sky dome collapses to a near-white band at the horizon; no structured clouds, atmospheric layers or sun disc. |
| Rain is a fog/grip change | No droplets, spray, puddles or wipers. |
| Performance is unmeasured on real hardware | No frame-time, draw-call or thermal data exists yet. The quality presets are budgets. A Galaxy A23 has not been tested. |
| Save writes are debounced | A change is written 400 ms after it is made; a hard kill inside that window can lose the last change. |
| Three settings are inert | Steering sensitivity, control size and control opacity are stored but not applied to the controls. |
| Fuel/wear/damage do not persist | Drive state is per-session; see the scope cut above. |
| Keyboard left steering is dead | `A` / `←` is clamped to zero in the desktop keyboard fallback. Touch steering is unaffected; this only matters on desktop/QA. |
| Mission objectives are geometric | Parking, braking and finish zones are distances along the spawn heading, not authored trigger volumes. A spawn change requires retuning. |
| No audio | Repeating because it is the most noticeable omission. |
| Debug build | Debuggable and not signed for distribution; not a store artifact. |

---

## How it was built

FARMAN is TypeScript 5.9 (strict) with Vite 7, Babylon.js 8.56 for rendering and Rapier 3D
0.21 for rigid-body physics, wrapped for Android with Capacitor 8.6. The simulation runs at a
fixed 60 Hz; the car's handling is a force-based model with per-wheel slip, load transfer and
separate manual, torque-converter and CVT transmissions.

Every 3D model, texture, sky map and the world metadata is generated procedurally by Python
scripts in `tools/assetgen/` — no Blender, no third-party models, no image-generation service.
The `.glb` files are written by a small original glTF writer and committed to
`public/assets/`. The Persian font is Vazirmatn under the SIL Open Font License.

The web bundle is built with `npm run build`, synced into the Android project with
`npx cap sync android`, and the debug APK is assembled by CI on a Linux runner with the
Android SDK 36 and Temurin 21:

```bash
npm ci
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

The workflows are in `.github/workflows/`: `ci.yml` checks types, lint, tests and the web
bundle; `android.yml` builds the debug APK and checksums; `release.yml` attaches the APK and
`SHA256SUMS.txt` to a tagged preview release.

---

## Checksums

The SHA-256 is computed from the exact APK attached to the release and filled in at build
time. If the file is rebuilt, recompute it.

| File | SHA-256 |
|---|---|
| `farman-v0.1.0-debug.apk` | `<fill in at build time>` |

Verify on Linux/macOS: `sha256sum farman-v0.1.0-debug.apk`; on Windows PowerShell:
`Get-FileHash -Algorithm SHA256 .\farman-v0.1.0-debug.apk`.

---

## Feedback

Report issues with the APK SHA-256, phone model, Android version and a screenshot. The
release checklist and the visual QA report define what evidence is useful:
[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) ·
[`../visual-qa/INDEX.md`](../visual-qa/INDEX.md).

This is a preview. The next milestone targets audio, saving drive state, on-device performance
measurement and the visual fixes ordered in [`../../ART_BIBLE.md`](../../ART_BIBLE.md) §9.
