# FARMAN — Release Checklist

**Release:** `v0.1.0` (preview) · **Version code:** 1 · **Date opened:** 2026-11-12
**Artifact under test:** Android debug APK built from the commit recorded below.

This checklist is the release gate. A gate is only **passed** when the evidence named in the
last column is attached to the release record — a command that exits 0 is not evidence that
the game behaves correctly (`gamedev-verification`, level 1 vs level 4). Do not ship on a
partially filled table.

Copy this file to `docs/release/RELEASE_CHECKLIST_v0.1.0_filled.md` (or attach it to the
release issue) and fill every row for the actual build.

---

## 0. Release identity

| Field | Value |
|---|---|
| App name | FARMAN — فرمان |
| Package | `com.khiyarusa.farman` |
| Version name | `0.1.0` (`APP.version`, `android/app/build.gradle`) |
| Version code | `1` |
| Commit | `<fill in>` |
| Build date | `<fill in>` |
| Built by | CI — `android.yml` (Android SDK 36, Temurin 21); the local machine has no SDK |
| Artifact | `farman-v0.1.0-debug.apk` (built from `app-debug.apk`) |
| SHA-256 | `<fill in — see gate 12>` |

---

## 1. Gate summary

Status values: **PASS** (evidence attached), **FAIL**, **OPEN** (not yet run or evidence
incomplete), **N/A** (justified waiver). Do not mark a gate PASS from a previous build; the
evidence must belong to the commit in §0.

| # | Gate | Pass criterion | Evidence to attach | Status 2026-11-12 |
|---|---|---|---|---|
| 1 | Build passes | `npm ci && npm run typecheck && npm run lint && npm run build` all exit 0 from a clean checkout; `dist/` is produced | Command log + bundle sizes | **OPEN** — local typecheck/lint/build pass; clean CI run pending |
| 2 | Tests pass | `npm run test` exits 0; no skipped tests that cover a gate | Vitest summary (file/test counts) | **OPEN** — 24/24 locally; attach the clean run |
| 3 | 3 vehicles drive | Each car launches, shifts, brakes, reverses and resets in free drive without a crash or unrecoverable stall | Per-car notes + telemetry/HUD captures | **OPEN** |
| 4 | Manual vs automatic behaviour is distinct | The Pride needs the clutch and can stall; the Corolla CVT sweeps without shift pauses; the BMW torque-converter auto steps through 8 gears and locks up | Three short screen recordings or telemetry logs + the matrix in §3 | **OPEN** |
| 5 | Missions start and finish | All 7 missions start from their spawn, show the objective, reach success or failure, and open the result overlay | Mission matrix in §4, one line per mission | **OPEN** |
| 6 | Save persists | Settings, paint/rim choice, credits and mission records survive a reload; corrupt JSON falls back to the backup without a crash | Before/after save JSON + reload notes | **OPEN** |
| 7 | RTL screens verified | Menu, garage, missions, settings, help, pause, results: no clipped text, correct Persian digits, safe areas respected, no Latin fallback glyphs | Screenshot set + the RTL checklist in §5 | **OPEN** |
| 8 | Screenshots committed | The 12 captures defined in `docs/visual-qa/INDEX.md` exist (including the six README paths), plus `VISUAL_QA_REPORT.md`; files are tracked, not only local | Paths + commit hash | **OPEN** |
| 9 | APK built by CI | The `Android` workflow (`android.yml`) produced `farman-v0.1.0-debug.apk` for the release commit and the `farman-android` artifact downloads | Workflow run URL + artifact name + digest | **OPEN** — no run recorded in this checkout |
| 10 | Signing policy respected | Only a debug APK is offered for installation unless all four keystore secrets exist; the unsigned release AAB stays a CI artifact and is never published as a download; no key material in the repo | `apksigner verify --print-certs` output; artifact list; secret names present/absent (never values) | **OPEN** — policy is debug-only; verify on the artifact |
| 11 | Release notes drafted | `docs/release/RELEASE_NOTES_v0.1.0.md` matches the shipped feature set and known issues | Link + reviewer initials | **PASS** — notes drafted |
| 12 | Checksums computed | SHA-256 of the APK is recorded in the release record and in the notes; it matches CI's `SHA256SUMS.txt` | `sha256sum` / `Get-FileHash` output + CI checksum file | **OPEN** |

---

## 2. Gate 1 — build

Run from a clean checkout, not from a warm `node_modules`:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

Pass criteria:

- `tsc --noEmit` reports no diagnostics.
- Vite reports a successful build and writes `dist/index.html` plus `dist/assets/*`.
- Record the chunk sizes. A Rapier chunk above the 4096 kB warning limit is expected
  (the wasm is inlined); it is a warning, not a failure, but note it in the release record.
- The build must not require the dev server, Python, or an Android SDK.

Reference run on 2026-11-12: 900 modules transformed; `index` 318.70 kB, `babylon`
2,797.86 kB, `physics` 4,334.40 kB (gzip 1,644.49 kB). Numbers will move; record the run you
actually ship.

## 3. Gate 3–4 — vehicles and gearbox behaviour

Use free drive, dry weather, assists at their defaults, and the same short route for each car.
Record speed, rpm, gear and any warning flags from the HUD or `window.__farman.debugState`.

### 3.1 Drive matrix

| Car | What must happen | Fail if |
|---|---|---|
| Pride 131 (manual, FWD) | Clutch travels; shift up/down only with clutch ≥ 55 %; stall is possible and self-recovers after 1.2 s; reverse refused above 1.4 m/s; no ABS/TCS/ESC flags | It moves in gear with the clutch fully out at rest without stalling, shifts without the clutch, or cannot recover from a stall |
| Corolla 2.0 (CVT, FWD) | Selector P→R→N→D; no discrete shift pause; ratio changes continuously; ABS/TCS/ESC/hill-start available | It behaves like a stepped automatic, or the ratio leaves 2.48–0.4 |
| BMW 320i (8AT, RWD) | Selector cycles; eight forward ratios; converter stall and lock-up; kickdown; rear axle is the driven one | It drives the front axle, shifts like a CVT, or the converter never locks |

### 3.2 Manual vs automatic distinctness

| Check | Manual (Pride) | Torque-converter automatic (BMW) | CVT (Corolla) |
|---|---|---|---|
| Launch from rest | Clutch bite + throttle; stalls if released under load | Creep with no throttle; converter multiplication | Creep; ratio moves to the low side |
| Gear change | Explicit ▲/▼, 0.28 s shift, refused without clutch | Automatic schedule, 0.18 s shift, kickdown on throttle | No shift event; ratio sweeps at a bounded rate |
| Engine speed vs road speed | Fixed by the selected ratio | Slip below lock-up, then 1:1 above 0.86 speed ratio | Engine speed targets ~1450 rpm light / ~5200 rpm heavy |
| Forced error | Stall is possible | Lugging is masked by the converter | No stall; the belt range is the limit |

Record three short clips or telemetry logs. The gate fails if two cars feel like the same
gearbox with different ratios.

## 4. Gate 5 — missions

Spawns come from `public/assets/world/world.json`; the fallback pose in
`src/missions/definitions.ts` is used only if the world file cannot be read.

| # | Mission | Spawn | Evidence to record |
|---|---|---|---|
| 1 | پارک دقیق (`parking`) | `city-parking` | Objective card, stop inside the zone, result overlay, reward/record written |
| 2 | حرکت در سربالایی (`hill-start`) | `mountain-hillstart` | 25 m forward progress; rollback failure path also checked |
| 3 | رانندگی ایمن در ترافیک (`traffic`) | `city-traffic` | 60 s clean run; one collision fails; speeding > 3 s fails |
| 4 | ترمز اضطراری (`braking`) | `highway-braking` | Stop inside 55–95 m; passing 100 m fails |
| 5 | کنترل در جاده خیس (`wet`) | `mountain-wet` | Rain preset applied; 420 m; off-road > 3 s fails |
| 6 | مسابقه زمان (`time-trial`) | `highway-time` | 700 m before 90 s |
| 7 | رانندگی بهینه (`eco`) | `rural-eco` | 500 m; fuel-used factor visible in the result |

For each: the mission must **start** (loading completes, HUD objective is the mission's, not
free drive), **finish** (success or failure), and **open the result overlay** after the
1.1 s settle. A mission that cannot reach its success path (it only ever times out) fails
this gate.

Also confirm the result is written to the save (`missions[id].attempts` increments,
`bestScore` updates, credits change by the displayed reward).

## 5. Gate 6 — save persistence

The save is versioned JSON in `localStorage` under `farman.save.v1`; the backup key is
`farman.save.backup`.

| Step | Expected |
|---|---|
| Fresh install, change paint and rims, wait ≥ 400 ms, reload | New paint/rim and the deducted credits are still there |
| Complete one mission, reload | `missions.<id>.attempts` increased; `bestScore` and credits match the result overlay |
| Change a setting (quality, steering mode, digits), reload | Setting persists and is applied before the first frame |
| Hand-edit `farman.save.v1` to invalid JSON, reload | A copy appears at `farman.save.backup`; the game starts from defaults with no crash |
| Set `schemaVersion` to an older value, reload | `validateSave` repairs to version 1 (there is no migration chain beyond v1 yet) |
| Kill the app within 400 ms of a change | The last change may be lost — this is a known limitation, not a gate failure; note it |

**Out of scope for this gate:** fuel, tyre wear, engine wear, body damage and odometer are
simulated per drive and are **not** written back when leaving a drive (`GDD.md` §5.2). Do not
claim they persist.

## 6. Gate 7 — RTL screens

Capture each screen at 1280 × 640 (landscape baseline) and at a phone aspect ratio
(360 × 640 or 412 × 915). Check:

- [ ] `index.html` is `lang="fa" dir="rtl"` and the layout starts from the right.
- [ ] Menu, garage, missions, settings, help, pause, results all render Persian correctly.
- [ ] Persian digits `۰۱۲۳۴۵۶۷۸۹` and separators `٬` / `٫`; the digits setting switches to
      Latin and back without a reload.
- [ ] No clipped or overlapping Persian text; no tofu boxes; Vazirmatn is the rendered face.
- [ ] Safe-area insets respected on a notched/gesture-bar device (top bar, pedals, pause).
- [ ] Touch targets are comfortably tappable (no control smaller than ~44 CSS px in either axis).
- [ ] Icons that imply direction (back, next) point the correct way in RTL.
- [ ] HUD numbers remain LTR-isolated (`.ltr`) where they are readouts, not sentences.
- [ ] The tutorial and help screens are readable and dismissible.

Attach the screenshots; a PASS without them is not evidence.

## 7. Gate 8 — screenshots

Required captures: all 12 in `docs/visual-qa/INDEX.md` §3. The full set covers free drive,
missions, traffic, highway, rural, pause and settings as well as the six README paths. The
six minimum paths are:

```
docs/visual-qa/v0.1.0/screenshots/01-menu.png
docs/visual-qa/v0.1.0/screenshots/03-garage.png
docs/visual-qa/v0.1.0/screenshots/05-city-drive.png
docs/visual-qa/v0.1.0/screenshots/08-mountain.png
docs/visual-qa/v0.1.0/screenshots/10-rain.png
docs/visual-qa/v0.1.0/screenshots/12-settings.png
```

- [ ] Files are the real captures from this build; no editing, cropping or upscaling.
- [ ] `docs/visual-qa/v0.1.0/VISUAL_QA_REPORT.md` is filled and signed.
- [ ] The files are tracked by the repository. `docs/visual-qa/dev/` is gitignored scratch;
      `docs/visual-qa/v0.1.0/` must not be.
- [ ] Screenshot capture settings (viewport, browser, URL) are recorded in the report.

## 8. Gate 9–10 — APK, CI and signing

### 8.1 CI build

The APK is assembled on CI because the authoring machine has no Android SDK and no JDK 21.
The `Android` workflow (`android.yml`) runs the expected sequence:

```bash
npm ci
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

Attach the workflow run URL, the `farman-android` artifact name
(`farman-v0.1.0-debug.apk`) and its digest. A local `gradlew assembleDebug` on a machine
without the SDK is not a substitute for this gate. The `android.yml` job also emits an
unsigned release AAB (`farman-v0.1.0-release-unsigned.aab`); that file is not a publishable
release artifact.

### 8.2 Signing policy

| Condition | Allowed output | Rule |
|---|---|---|
| No keystore secrets | **Debug APK only** (`assembleDebug`, debug keystore) | Distributable for internal testing only; the unsigned release AAB from the same workflow must not be published |
| All four secrets present in CI | `assembleRelease`, signed | Keystore file (base64 or path), store password, key alias and key password. The secret names are defined by the CI pipeline; never put them in this repository. |
| Some but not all secrets | **Stop** | Do not fall back to an unsigned release build |
| Any `*.jks` / `*.keystore` / password in the repo or docs | **Stop** | `.gitignore` covers these; a committed key is a security incident, not a build fix |

Rules:

- Never commit signing material or print secret values in CI logs.
- An unsigned `assembleRelease` APK is not a release candidate; it cannot be installed over a
  signed build and must not be published.
- Verify the certificate of the artifact you publish:

  ```bash
  apksigner verify --print-certs farman-v0.1.0-debug.apk
  ```

  A debug APK shows the Android debug certificate. Record the SHA-256 fingerprint, not the
  password.

- Version code and name in `android/app/build.gradle` must match §0.

## 9. Gate 11 — release notes

- [ ] `docs/release/RELEASE_NOTES_v0.1.0.md` exists and is dated.
- [ ] Every feature claim is traceable to `GDD.md` §5.1 or to source; no aspiration is
      written as shipped.
- [ ] The "not in this build" list matches `GDD.md` §5.2 (no audio, no traffic lights, no
      cockpit, no damage deformation, no write-back of drive state, local saves only).
- [ ] Install instructions match the actual artifact name and Android minimum (API 24).
- [ ] Known issues include the sky/horizon wash-out and the absence of on-device performance
      data.
- [ ] The SHA-256 placeholder is replaced with the real digest before publishing.

## 10. Gate 12 — checksums

Compute from the exact file that will be published:

```bash
# Linux / CI
sha256sum farman-v0.1.0-debug.apk | tee farman-v0.1.0-debug.apk.sha256

# Windows PowerShell
Get-FileHash -Algorithm SHA256 .\farman-v0.1.0-debug.apk | Format-List
```

CI already writes `SHA256SUMS.txt` next to the artifact; recompute locally from the exact
file that will be published and confirm the two agree. Record the digest in §0 and in the
release notes. If the APK is rebuilt, recompute — a checksum from a previous build is worse
than no checksum.

---

## 11. Known gaps carried into this release

These do not block an internal preview, but they must not be presented as finished:

| Gap | Consequence | Reference |
|---|---|---|
| No audio runtime | Four volume sliders persist values that nothing consumes | `GDD.md` §5.2, `ASSET_LICENSES.md` §5 |
| Drive state not written back | Fuel, wear, damage and odometer reset to pre-drive values in the garage | `GDD.md` §5.2, §14 |
| Keyboard left steering dead | Desktop/QA only; touch is unaffected | `TDD.md` §13 |
| No traffic lights or right-of-way | Intersections are unmanaged | `GDD.md` §5.2 |
| No damage deformation | `bodyDamage` is a scalar; the mesh never changes | `GDD.md` §5.2 |
| No on-device performance data | Quality presets are budgets, not measurements | `TDD.md` §12 |
| `npm run assets` / `npm run shots` entry points absent | Run the individual generators and `tools/qa/smoke.mjs` | `TDD.md` §11 |
| OFL text not bundled in `public/` | Licence-compliance blocker for a public release | `ASSET_LICENSES.md` §2 |
| Trademark clearance not done | Legal blocker for a store release | `ASSET_LICENSES.md` §6 |

Waivers must name an owner and a date. A waiver is not a PASS.

---

## 12. Sign-off

| Role | Name | Date | Signature / comment |
|---|---|---|---|
| Build and tests | | | |
| Gameplay / vehicles | | | |
| Visual QA / RTL | | | |
| Release owner | | | |

**Release decision:** ☐ Ship preview　☐ Hold　☐ Reject

Reason (required if not Ship):

---

## 13. Post-release checks (first 24 hours)

- [ ] Install the published APK on a clean device (not an upgrade) and complete the tutorial.
- [ ] Confirm the app launches with no network connection and no Play Services.
- [ ] Confirm the save survives a force-stop and relaunch.
- [ ] Record the first real frame-time sample on the target phone (Galaxy A23 or equivalent)
      and attach it to `TDD.md` §12 or the next release record.
- [ ] File every new defect with the build's SHA-256, device model and Android version.
