# FARMAN — Vehicle Data Sources

What the simulation actually uses, where each number came from, and which numbers are
engineering estimates. The authoritative simulation values are the files in
`src/vehicles/profiles/`; this document compares them against the research record in
`docs/research/VEHICLE_DATA_DRAFT.md` (retrieved 2026-11-12) and flags every divergence.

**Read this first:** all three profiles declare `dataConfidence: 'estimated'`. The research
file marks individual rows V (verified against a manufacturer document or two independent
sources), C (corroborated by one credible catalogue) or E (estimated). The profiles were
derived from that research and then **normalised and tuned for playability**, so a profile
value is not automatically the verified value. Where they differ, the table says so.

The source URLs quoted below are the ones recorded in `docs/research/VEHICLE_DATA_DRAFT.md`;
they were not re-fetched for this document. Treat the research file as the citation record.

## 1. Status legend

| Mark | Meaning |
|---|---|
| **V** | Verified in the research pass: manufacturer document, or two independent sources agreeing |
| **C** | Corroborated: one credible catalogue/spec source, not manufacturer-confirmed |
| **E** | Estimated: no public value found; method stated in the research file |
| **T** | Tuned: changed from the research value to make the car drive as intended; not a measurement |

## 2. Saipa Pride 131 (`src/vehicles/profiles/pride131.ts`)

Identity: 2008 LX, Iran, 1.323 L NA I4, FWD, 5-speed manual, no driver aids.
Profile `dataConfidence: 'estimated'`.

| Parameter | Profile value | Research value | Status | Note |
|---|---|---|---|---|
| Length / width / height | 3.942 / 1.605 / 1.441 m | 3.935 / 1.605 / 1.455 m | V→T | Profile differs by 7 / 0 / 14 mm; the GLB is built from the profile |
| Wheelbase | 2.342 m | 2.345 m | V→T | 3 mm |
| Track F / R | 1.390 / 1.350 m | 1.405 / 1.385 m | V→T | Profile is 15 / 35 mm narrower |
| Tyre | 165/65 R13 | 165/65 R13 (or 175/60 R13) | V | |
| Tyre radius | 0.286 m | 0.272 m unloaded, ≈0.264 m loaded | E | Profile uses a larger rolling radius; affects gearing and ride height |
| Mass | 895 kg | 915 kg net; 990 kg with driver | V→T | 20 kg below kerb, 95 kg below test mass |
| Front weight share | 0.61 | ≈0.62 static (E) | E | |
| CoM height | 0.52 m | 0.55 m (E, 0.38 × height) | E | Below the research estimate; tuned |
| Yaw inertia | 1250 kg·m² | not published | E | Tuned; the fallback formula would give a different value |
| Engine displacement | 1.323 L | 1323 cc | V | |
| Idle / redline / limiter | 850 / 6000 / 6400 rpm | 850±50 / 6000 (E) / none | V/E | Limiter added |
| Peak torque | 100 N·m @ 3000 | 103.3 N·m @ 2800 | V→T | Curve shape differs (see §2.1) |
| Gear ratios 1–5 | 3.667 / 2.043 / 1.323 / 0.943 / 0.743 | 3.454 / 1.944 / 1.275 / 0.861 / 0.692 | **E/T** | **Not the verified set.** All five are longer-legged in the profile |
| Reverse / final drive | 3.667 / 4.06 | 3.583 / 3.778 | **E/T** | First gear overall 14.89 vs 13.05 (+14 %) |
| Clutch | 165 N·m, bite 0.58, range 0.30 | single dry plate (V), capacity not published | E | |
| Brakes F/R torque | 1450 / 900 N·m, bias 0.66 | split 72/28 (E); disc/drum (V) | E | Absolute torques are engineering estimates |
| ABS / TCS / ESC | false / false / false | ABS optional, no TCS/ESC (C) | C | Profile models the base car |
| Cd / frontal area | 0.36 / 1.94 m² | 0.36 (E) / 1.85 m² (E) | E | Area raised |
| Fuel tank | 37 L | 37 L | V | |
| BSFC / idle flow | 285 g/kWh / 0.7 L/h | not published | E | |
| 0–100 / top speed | 16.5 s / 160 km/h | ≈14.5 s (E) / ≈155 km/h (E) | E | Display-only fields; the sim does not enforce them |
| Tyre mu dry/wet | 0.90 / 0.62 | not published | E | |
| Suspension rates | 24k/20k N/m, 2100/1800 N·s/m | not published | E | Used only for load transfer feel |
| Steering | 38° max, 17:1 | turning radius 4.55 m (V) | E | |

### 2.1 Torque curve as used

`[900:62, 1500:78, 2200:90, 3000:100, 3800:96, 4600:88, 5400:76, 6000:64]` (rpm:N·m).

Research anchors were 103.3 N·m @ 2800 and 81 N·m @ 5500 (63 hp). The profile curve peaks
earlier and slightly lower and still makes 64 N·m at 6000 rpm, so the engine does not fall
flat against the limiter. Implied peak power from this curve is ≈43 kW (58 hp) at 5400 rpm,
i.e. **8 % below the published 63 hp**. The garage computes and displays horsepower from
these points (`peakPowerHp` in `src/ui/screens/garage.ts`), so the Pride shows ~58 hp, not 63.

## 3. Toyota Corolla 2.0 CVT (`src/vehicles/profiles/corollaE210.ts`)

Identity: 2021 "2.0 LE (E210)", North America, 1.987 L NA I4, FWD, K120-style CVT.
Profile `dataConfidence: 'estimated'`.

| Parameter | Profile value | Research value | Status | Note |
|---|---|---|---|---|
| Length / width / height | 4.630 / 1.780 / 1.435 m | 4.636 (SE) / 4.630 (LE) / 1.781 / 1.435 | V→T | LE length |
| Wheelbase | 2.700 m | 2.700 m | V | |
| Track F / R | 1.530 / 1.545 m | SE 1.519 / 1.521; LE 1.532 / 1.534 | V→T | Between the two trims |
| Tyre | 205/55 R16 | LE 205/55 R16 (SE 225/40 R18) | V | LE wheel/tyre package |
| Tyre radius | 0.316 m | 0.316 m unloaded | V | |
| Mass | 1360 kg | LE 1340 kg, SE 1411 kg; test mass 1486 kg | V→T | 20 kg above LE kerb, 126 kg below test mass |
| Front weight share | 0.60 | 60/40 estimate | E | |
| CoM height | 0.54 m | 0.55 m (E) | E | |
| Yaw inertia | 2050 kg·m² | not published | E | |
| Engine | 1.987 L, 205 N·m @ 4400 | 1987 cc, 205 N·m @ 4400, 169 hp @ 6600 | V | Peak torque matches |
| Idle / redline / limiter | 650 / 6800 / 7000 | 650 (E) / 6600 (E) / ~6800 (E) | E | Redline raised 200 rpm |
| Gearbox | CVT, belt 2.48 → 0.40 | launch gear 3.377, belt 2.236 → 0.447 | V→T | **No launch gear**; belt range widened |
| `gearRatios` array | 2.48 … 0.55 (6 values) | — | unused | Present only to satisfy `validateProfile`; the CVT path ignores it |
| Reverse / final drive | 2.1 / 4.09 | 3.136 / 4.262 (C) | C→T | Final drive 4 % shorter |
| CVT targets | 1450 rpm light, 5200 rpm heavy, rate 2.2/s | not published | E | Defines the rubber-band feel |
| Brakes F/R | 2300 / 1350 N·m, bias 0.67 | 274 / 259 mm discs (V); split 68/32 (E) | E | |
| Assists | ABS, TCS, ESC, hill start all true | standard (V) | V | |
| Cd / frontal area | 0.29 / 2.10 m² | 0.29 (LE) / 2.05 m² (E) | V/E | Area +2.4 % |
| Fuel tank | 47 L | 47 L (US) | V | |
| 0–100 / top speed | 7.5 s / 195 km/h | ≈8.4 s (C) / ≈180 km/h (E) | E | Optimistic by ~0.9 s; display-only |

### 3.1 Torque curve as used

`[800:140, 1500:170, 2500:190, 4000:202, 4400:205, 5200:197, 6000:180, 6600:160, 7000:140]`.

Research anchors: 205 N·m @ 4400 and 182 N·m @ 6600 (126 kW / 169 hp). The profile keeps
torque high to 7000 rpm, so implied peak power is ≈113 kW (152 hp) at 6000 rpm —
**10 % below the published 169 hp**. The garage therefore shows ~152 hp. Combined with the
CVT targets (1450–5200 rpm), this produces the sustained-rpm rubber-band feel rather than a
peak-power figure.

## 4. BMW 320i G20 (`src/vehicles/profiles/bmw320i.ts`)

Identity: 2021 G20 Sport Line, Europe, 1.998 L turbo I4, RWD, ZF 8HP-style automatic.
Profile `dataConfidence: 'estimated'`.

| Parameter | Profile value | Research value | Status | Note |
|---|---|---|---|---|
| Length / width / height | 4.709 / 1.827 / 1.435 m | 4.709 / 1.827 / 1.435 | V | |
| Wheelbase | 2.851 m | 2.851 m | V | |
| Track F / R | 1.587 / 1.604 m | 1.589 / 1.604 m | V→T | Front 2 mm |
| Tyre | 225/45 R18 | 225/45 R18 (M Sport) | V | |
| Tyre radius | 0.330 m | 0.330 m unloaded | V | |
| Mass | 1545 kg | 1450 kg DIN, 1525 kg EU with driver | V→T | 20 kg above the EU figure |
| Front weight share | 0.51 | 50:50 (V) | V→T | 1 % forward |
| CoM height | 0.53 m | 0.52 m (E, 0.36 × height) | E | |
| Yaw inertia | 2450 kg·m² | not published | E | |
| Engine | 1.998 L turbo, 300 N·m 1350–4000 | B48B20A, 300 N·m 1350–4000, 184 hp | V | Flat plateau matches |
| Idle / redline / limiter | 700 / 6500 / 6800 | 650 (E) / 6500 (E) / ~7000 (E) | E | Idle +50, limiter −200 |
| Gear ratios 1–8 | 5.000 / 3.200 / 2.143 / 1.720 / 1.314 / 1.000 / 0.822 / 0.640 | 5.250 / 3.360 / 2.172 / 1.720 / 1.316 / 1.000 / 0.822 / 0.640 | V→T | 1st and 2nd shortened ~5 % |
| Reverse / final drive | 3.456 / 3.077 | 3.712 / 2.813 (V/C) | V/C→T | Final drive 9 % shorter |
| Torque converter | stall K 172, coupling K 214, ratio 2.05, lock-up 0.86 @ 6 m/s | 2.0:1 stall, lock-up above ~1200 rpm (E) | E | |
| Brakes F/R | 2900 / 1500 N·m, bias 0.66 | vented discs (V); split 62/38 (E) | E | |
| Assists | ABS, TCS, ESC, hill start | ABS + DSC + DTC standard (V) | V | |
| Cd / frontal area | 0.27 / 2.19 m² | 0.25 / 2.22 m² | V→T | Cd raised 8 %, area −1.4 % |
| Fuel tank | 59 L | 59 L | V | |
| 0–100 / top speed | 7.1 s / 240 km/h | 7.1 s / 240 km/h | V | Matches the catalogue |

### 4.1 Torque curve as used

`[900:200, 1350:300, 2000:300, 3000:300, 4000:300, 4800:285, 5500:260, 6500:225, 6800:200]`.

Research anchors: 300 N·m flat 1350–4000; 258 N·m @ 5000 and 198 N·m @ 6500 (135 kW / 184 hp).
The profile's top end is stronger: 225 N·m at 6500 gives ≈153 kW (205 hp) at 6500 rpm —
**11 % above the published 184 hp**. That is a tuning choice, not a data transcription: it
keeps the car pulling to the limiter in 3rd/4th.

## 5. What is estimated, explicitly

These categories are engineering estimates in all three cars, not measurements:

1. **Engine rotational inertia** (0.16 / 0.17 / 0.21 kg·m²). Chosen from typical values for
   the engine class; determines how fast rpm rises and how easily the engine stalls.
2. **Centre-of-mass height** (0.52 / 0.54 / 0.53 m). Derived as a fraction of overall height,
   then adjusted. Drives load transfer and rollover resistance.
3. **Brake torque at the wheels** (front/rear N·m) and **handbrake torque**. Derived from
   vehicle mass and target deceleration, split by an estimated bias; not from caliper data.
4. **Some gear ratios and final drives.** The Pride's whole set, the Corolla's final drive,
   and the BMW's 1st/2nd/final differ from the research record (see tables). The BMW ratios
   are the 8HP51 set rounded toward a shorter launch; the Pride set does not match the
   factory manual recorded in the research file.
5. **Tyre mu, peak slip, load sensitivity, rolling resistance, wheel inertia, optimal
   temperature.** Typical values for the tyre class, tuned for the grip balance each car
   should have.
6. **Suspension spring/damper/anti-roll rates and ride height.** Not used by a spring solver;
   they feed load-transfer feel and visual travel only.
7. **Aero drag coefficient and frontal area.** Cd is taken from the research where available
   (Corolla 0.29) and estimated/adjusted elsewhere (Pride 0.36, BMW 0.27).
8. **Yaw inertia, steering ratio, clutch capacity, converter K-factors, CVT targets, BSFC.**
   All engineering estimates.
9. **Performance fields** (`zeroTo100Sec`, `topSpeedKph`). Display only; no test asserts the
   simulation reproduces them.

## 6. What "tuned for playability" means here

After the reference values were entered, the cars were adjusted against driving feel, not
against a proving ground. The following are design rationales for the shipped values, not
measurements:

- The Pride's gearing is longer than the research set and its mass is below kerb, which makes
  1st gear harder to stall on the hill-start mission and keeps the car from feeling inert.
- The Corolla runs a wider belt spread with no launch gear and a shorter final drive, which
  makes the rubber-band effect legible on a touch screen.
- The BMW uses a shorter final drive and stronger top-end torque, which lets the rear axle be
  provoked at low speed while still pulling at the limiter.
- Grip levels are staggered so the Pride slides early, the Corolla understeers first, and the
  BMW oversteers on throttle — the three handling characters the pillars promise.

Consequence: the profiles are a **gameplay dataset**, not a validation dataset. They should
not be cited as accurate reproductions of the real cars, and the garage horsepower figures
(≈58 / 152 / 205 hp) do not match the manufacturers' published peaks.

## 7. Cross-car sanity checks

These are the quickest way to spot a broken edit (values computed from the profile files):

| | Pride 131 | Corolla 2.0 | BMW 320i |
|---|---|---|---|
| Power / mass | 58 hp / 895 kg = 65 hp/t | 152 hp / 1360 kg = 112 hp/t | 205 hp / 1545 kg = 133 hp/t |
| 1st gear overall | 3.667 × 4.06 = 14.89 | 2.48 × 4.09 = 10.14 (belt low) | 5.000 × 3.077 = 15.39 |
| Top gear overall | 0.743 × 4.06 = 3.02 | 0.40 × 4.09 = 1.64 | 0.640 × 3.077 = 1.97 |
| Engine speed at 100 km/h, top | ≈2800 rpm | ≈1370 rpm | ≈1580 rpm |
| Driven axle share of mass | 61 % | 60 % | 49 % |
| Character | short gearing, low grip, no aids | tall CVT, traction-limited launch | flat 300 N·m, RWD, DSC |

If the Pride sits above 3500 rpm at 100 km/h or the BMW lights its tyres at half throttle in
3rd, a ratio or torque table has been entered wrong.

## 8. Open items carried over from the research

From `docs/research/VEHICLE_DATA_DRAFT.md` §5, still unresolved:

| Item | Why it matters |
|---|---|
| Corolla K120 final drive (4.262 is C, not V) | ±5 % moves every engine speed |
| Pride 131 Cd and 0–100 | Both were estimated; the profile now diverges further |
| BMW 320i-specific final drive (2.813 platform-wide) | Profile uses 3.077, so this is moot for the sim but wrong for a "reference" claim |
| Corolla weight distribution | 60/40 is an estimate |
| Pride redline | 6000 rpm is an estimate |

## 9. Source record

Primary research file: `docs/research/VEHICLE_DATA_DRAFT.md` (retrieved 2026-11-12). Its
source URLs, as recorded there:

- Pride: Saipa 111/131/132/141 owner manual (PDF, jimcontent CDN); chinaaseantrade.com spec
  sheet; autotras.com Saipa 131 page; Wikipedia "Kia Pride".
- Corolla: Toyota 2020 Corolla US brochure (dealereprocess CDN); auto-data.net E210 2.0 CVT
  entry; toyota-club.net K120F CVT FAQ; Wikipedia "Toyota K CVT transmission"; Car and Driver
  and MotorTrend road tests.
- BMW: BMW Group G20 press technical data PDF; auto-data.net G20 320i entry; Wikipedia
  "BMW 3 Series (G20)"; go-parts.com G20 differential listing.
- Traffic archetypes: Wikipedia Peugeot 405 and IKCO Samand; iran2africa Zamyad Z24 listing;
  namu.wiki Z24 cross-check.

Profile files remain the source of truth for simulation values. If a profile number changes,
update the corresponding row here in the same commit.
