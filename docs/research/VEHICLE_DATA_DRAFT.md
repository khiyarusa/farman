# FARMAN — Vehicle Data Draft (3 reference cars)

Research date: **2026-11-12**. Scope: three cars for the driving-simulator physics/vehicle model.
Status legend used in every table:

- **V** = verified — manufacturer document, or two independent sources agreeing.
- **C** = corroborated — one credible catalogue/spec source, not manufacturer-confirmed.
- **E** = **estimated** — no public value found; method stated. Never treat as measured data.

Rule applied: where sources disagree, the manufacturer document wins and the conflict is written down (see each car's Notes).
Values are for the exact variant named in the heading — do not reuse them for other years/trims.

---

## 0. Which Iranian FWD manual was chosen, and why

**Chosen: SAIPA Pride 131 (1.3, 1323 cc), 2005–2010 Iranian market.**

Reason: it is the only one of the three candidates with a **factory owner's manual available in English** that prints the numbers the simulation needs — gear ratios, final drive, idle speed, tyre sizes and net weight — plus two independent catalogues that agree with it. The IKCO Samand LX and Peugeot 405 GLX have good body/chassis data but their Iranian-market gearbox and idle data could not be pinned to a factory document in this research pass, so they would have been `estimated` in more rows. The Pride therefore has the highest verified-row count of the three. Samand and 405 are still used below as traffic archetypes, where only approximate size/mass is needed.

Caveat recorded up front: the Pride's engine is the Mazda B3-derived **M13nI** SOHC 8-valve, and SAIPA's own documents disagree on where peak power sits (5500 vs 5200 rpm) — see §1 Notes.

---

## 1. SAIPA Pride 131 — 1.3, FWD, 5-speed manual (2005–2010)

Body: 4-door sedan (Pride Saba facelift, X100 series). Market: Iran.

### 1.1 Published specifications

| Item | Value | Status | Evidence |
|---|---|---|---|
| Engine code | M13nI (Mazda B3 family, SOHC 8v) | C | trade spec sheet |
| Displacement | 1323 cc | V | manual + catalogue |
| Bore × stroke | 71.0 × 83.6 mm | V | manual + trade sheet |
| Compression ratio | 9.7 : 1 | V | manual + trade sheet |
| Max power | 63 hp (46 kW) @ 5500 rpm | V | owner's manual |
| Max torque | 103.3 N·m @ 2800 rpm | V | owner's manual |
| Idle speed | 850 ± 50 rpm | V | owner's manual |
| Redline | 6000 rpm | **E** | no published limiter; set 500 rpm above the 5500 rpm power peak, matching period Japanese 8v practice |
| Gearbox | 5-speed manual, single dry plate clutch | V | manual |
| Ratios 1–5 | 3.454 / 1.944 / 1.275 / 0.861 / 0.692 | V | manual + trade sheet (identical) |
| Reverse | 3.583 | V | manual + trade sheet |
| Final drive | 3.778 | V | manual + trade sheet |
| Curb (net) mass | 915 kg | V | manual "net weight 131 = 915 kg" + autotras 915 kg |
| Max payload | 400 kg; 4 seats | V | manual |
| L × W × H | 3935 × 1605 × 1455 mm | V | autotras + trade sheet |
| Wheelbase | 2345 mm | V | autotras + trade sheet |
| Track F / R | 1405 / 1385 mm | V | autotras + trade sheet |
| Tyres | 165/65 R13 (steel rim) or 175/60 R13 (alloy) | V | owner's manual |
| Rims | 4.5J×13 steel / 5J×13 alloy | V | owner's manual |
| Brakes | front disc, rear drum; vacuum assist, dual circuit | V | manual + trade sheet |
| Suspension | MacPherson front, torsion beam rear | V | manual + trade sheet |
| Turning radius | 4.55 m | V | manual |
| Fuel tank | 37 L | V | manual + autotras |
| 0–100 km/h | ~14.5 s | **E** | not published. Estimate: 63 hp/915 kg = 68.8 hp/t, terminal ~150 km/h; interpolated against period 1.3 superminis (Kia Pride 1.3 ≈ 14–15 s) |
| Top speed | ~155 km/h | **E** | aero-limited: 0.36 Cd × 1.85 m² at 46 kW → ~43 m/s before drivetrain losses; period road tests quote 150–160 km/h |
| ABS / TCS / ESC | ABS optional on late cars; no TCS; no ESC | C | manual covers "ABS braking system" variant; no stability system in any 131 document |

### 1.2 Simulation parameters

| Parameter | Value | Status | Note |
|---|---|---|---|
| Test mass (kerb + 75 kg driver) | 990 kg | V+E | 915 kg verified + 75 kg standard driver |
| CoM height | 0.55 m | **E** | h_cg ≈ 0.38 × overall height (1.455 m); transverse FWD layout, no correction applied |
| Wheelbase | 2.345 m | V | |
| Track F / R | 1.405 / 1.385 m | V | |
| Tyre radius (unloaded) | 0.272 m (165/65R13) / 0.270 m (175/60R13) | V+derived | computed from size; loaded radius ≈ 0.97 × → 0.264 m |
| Cd | 0.36 | **E** | no published figure for the 131. Period supermini range 0.33–0.38; body is a 1987 Kia Pride shell |
| Frontal area | 1.85 m² | **E** | 0.80 × width × height = 0.80 × 1.605 × 1.455 = 1.87, rounded down for roofline taper |
| Drivetrain | FWD, transverse | V | |
| Gear ratios | [3.454, 1.944, 1.275, 0.861, 0.692] | V | |
| Reverse / final | 3.583 / 3.778 | V | |
| Torque curve `[[rpm,Nm],…]` | `[[850,55],[1500,85],[2000,97],[2500,103],[2800,103],[3500,99],[4000,95],[4500,90],[5000,85],[5500,81],[6000,55]]` | V anchors, **E** between | Anchors: 103 N·m @ 2800 and 81 N·m @ 5500 (= 46.3 kW = 63 hp). Intermediate points interpolated, idle point estimated |
| Engine inertia (crank + flywheel) | 0.14 kg·m² | **E** | 1.3 L 8v iron-block I4 with light flywheel; typical 0.10–0.18 range for this class |
| Brake torque split F/R | 72 / 28 | **E** | static front share ≈ 62% + proportioning-valve forward bias; disc/drum cars typically 70–75% front |
| ABS / TCS / ESC flags | ABS = optional, TCS = false, ESC = false | C | |
| Aero + rolling constants | CdA = 0.67 m², Crr ≈ 0.013 | derived/**E** | CdA = 0.36 × 1.85; Crr for 165-section all-season |

### 1.3 Notes and conflicts

1. **Power peak disagreement.** Owner's manual: 63 hp @ **5500** rpm, 103.3 N·m @ **2800** rpm. Trade spec sheet: 62.5 hp @ **5200** rpm, 103.3 N·m @ **2500** rpm. Catalogue autotras: 63 hp, 103 N·m @ **2500**. Manual is treated as authoritative (it is the manufacturer document); the 5200/2500 figures are probably an earlier carburetted or export tune. Practical effect on the sim is small (<3% at the peaks) but the curve shape above uses 5500/2800.
2. **Mass agreement is unusually strong**: manual prints 915 kg for the 131, catalogue independently prints 915 kg.
3. Ratios are identical in the manual and the trade sheet to three decimals — treat as solid.
4. 4-seat rating (not 5) is what SAIPA prints; Iranian registration follows this.

### 1.4 Sources

| URL | Supports | Retrieved | Confidence |
|---|---|---|---|
| https://sb952effb4c14a0dc.jimcontent.com/download/version/1705402100/module/9695682582/name/Saipa%20Family%20111%20131%20132%20141%20Owner%20Manual.pdf | Idle 850±50, ratios + final 3.778, tyres 165/65R13 & 175/60R13, net weight 915 kg, disc/drum, turning radius | 2026-11-12 | high |
| https://www.chinaaseantrade.com/sell/show.php?itemid=580719 | Engine M13nI, 71.0×83.6, 62.5 hp@5200, 103.3 N·m@2500, identical ratios, dims/tracks | 2026-11-12 | medium |
| https://autotras.com/saipa/131-1994 | Kerb 915 kg, 3935/1605/1455, WB 2345, tracks 1405/1385, disc/drum, 103 N·m@2500 | 2026-11-12 | medium |
| https://en.wikipedia.org/wiki/Kia_Pride | Lineage: Kia Pride (Ford Festiva platform) → Saipa 131; Iranian production 1992–2020 | 2026-11-12 | medium |

---

## 2. Toyota Corolla 2.0 CVT — E210 sedan, US SE (2020–2022)

Variant documented: **SE with Dynamic-Shift CVT** (18-inch wheels). LE differs only where noted (16-inch wheels, softer springs, 1340 kg).

### 2.1 Published specifications

| Item | Value | Status | Evidence |
|---|---|---|---|
| Engine code | M20A-FKS, 1987 cc, DOHC 16v, port + direct injection, 13.0:1 | V | brochure + catalogue |
| Max power | 169 hp (126 kW) @ 6600 rpm | V | Toyota brochure |
| Max torque | 205 N·m @ 4400 rpm (151 lb-ft) | V | catalogue, consistent with 169 hp |
| Idle speed | ~650 rpm | **E** | not published; Toyota 4-cyl idle 600–700 rpm, AC off |
| Redline | 6600 rpm (fuel cut ~6800) | **E** | gauge redline not published in the sources retrieved; set at the power peak, which is how Toyota calibrates M20A |
| Transmission | K120 "Direct Shift" CVT: physical launch gear + belt, 10 simulated steps | V | Toyota + Wikipedia |
| Launch gear ratio | 3.377 forward / 3.136 reverse | V | K120F factory sheet |
| Belt (pulley) range | 2.236 – 0.447 (spread 5.0; overall spread 7.5) | V | K120F factory sheet |
| Final drive | 4.262 | C | K120F factory sheet; see note 3 |
| Curb mass | SE CVT 1411 kg (3110 lb); LE 1340 kg (2955 lb); XSE 1429 kg | V | Toyota brochure |
| L × W × H | 4636 × 1781 × 1435 mm (SE); LE 4630 mm long | V | brochure |
| Wheelbase | 2700 mm | V | brochure |
| Track F / R | 1519 / 1521 mm (SE); LE 1532 / 1534 mm | V | brochure (59.8/59.9 in, 60.3/60.4 in) |
| Tyres | SE 225/40 R18; LE 205/55 R16 | V | brochure wheels + two tyre catalogues |
| Brakes | front ventilated 274 mm, rear solid 259 mm; ECB | V | brochure (10.8 / 10.2 in) |
| Cd | 0.30 (SE/XSE); 0.29 (L/LE/XLE) | V | Toyota brochure |
| 0–100 km/h | ~8.4 s | C | road tests: 0–60 mph 8.0 s (C/D), 8.2 s (MotorTrend XSE) |
| Top speed | ~180 km/h | **E** | not published for US; drag-limited estimate at 126 kW |
| ABS / TCS / ESC | ABS + EBD + BA, TRAC, VSC all standard | V | Star Safety System, brochure |

### 2.2 Simulation parameters

| Parameter | Value | Status | Note |
|---|---|---|---|
| Test mass | 1486 kg | V+E | 1411 kg + 75 kg |
| CoM height | 0.55 m | **E** | 0.38 × 1.435 m; transverse FWD, battery low behind rear seat |
| Wheelbase | 2.700 m | V | |
| Track F / R | 1.519 / 1.521 m | V | SE |
| Tyre radius (unloaded) | 0.319 m (225/40R18); 0.316 m (205/55R16) | V+derived | loaded ≈ 0.309 m |
| Cd | 0.30 | V | SE |
| Frontal area | 2.05 m² | **E** | 0.80 × 1.781 × 1.435 = 2.05 |
| Drivetrain | FWD, transverse | V | |
| CVT model | launch gear 3.377 → belt 2.236…0.447, final 4.262 | V/C | implement as two-mode: gear mode below ~40 km/h, belt above |
| Torque curve `[[rpm,Nm],…]` | `[[700,90],[1000,130],[1500,165],[2000,185],[3000,196],[4000,203],[4400,205],[5000,202],[5600,196],[6200,188],[6600,182],[6800,150]]` | V anchors, **E** between | Anchors 205 N·m @ 4400 and 182 N·m @ 6600 (= 126 kW = 169 hp) |
| Engine inertia | 0.20 kg·m² | **E** | 2.0 L NA I4, alloy block, dual-mass flywheel eliminated (CVT), torque-converter damper adds rotating mass |
| Brake torque split F/R | 68 / 32 | **E** | static front share ≈ 60% + ECB/proportioning bias |
| ABS / TCS / ESC flags | all true | V | |
| Aero constants | CdA = 0.615 m², Crr ≈ 0.011 | derived/**E** | CdA = 0.30 × 2.05 |

### 2.3 Notes and conflicts

1. **CVT is not a fixed-ratio gearbox.** Two numbers matter: the launch gear (3.377, used from standstill to roughly 40 km/h) and the belt range (2.236 low → 0.447 overdrive). Overall ratio spread 7.5:1 is Toyota's own claim; 3.377 × 4.262 = 14.39 at launch, 0.447 × 4.262 = 1.905 at top of belt — giving ~1580 rpm at 100 km/h, which matches observed cruise rpm. This internal consistency is why 4.262 is used despite note 3.
2. **Weight spread by trim is large** (1340–1429 kg). Use the SE figure for the 18-inch car; the LE is 71 kg lighter and has 16-inch wheels, which changes both inertia and tyre radius.
3. **Final drive caveat.** The 4.262 value comes from a K120**F** factory data sheet (the "F" transaxle family). The US FWD Corolla uses K120. A ±5% error in final drive is possible; if a road-test log becomes available (rpm vs GPS speed), correct it there. Marked C, not V, for this reason.
4. Toyota does **not** publish a 0–100 km/h figure for the US Corolla; the 8.4 s is converted from US 0–60 mph road tests.

### 2.4 Sources

| URL | Supports | Retrieved | Confidence |
|---|---|---|---|
| https://cdn.dealereprocess.org/cdn/brochures/toyota/2020-corolla.pdf | Official US brochure: dims, tracks, weights by trim, Cd by trim, brake diameters, Star Safety System | 2026-11-12 | high |
| https://www.auto-data.net/en/toyota-corolla-xii-e210-usa-2.0-169hp-cvt-37866 | 169 hp @ 6600, 205 N·m @ 4400, 225/40R18, 274/259 mm brakes, 1411–1429 kg, M20A-FKS | 2026-11-12 | medium |
| https://toyota-club.net/files/faq/21-01-10_faq_cvt_en.htm | K120F: launch gear 3.377/3.136, pulley 2.236–0.447, final 4.262, 90–91 kg unit weight | 2026-11-12 | medium |
| https://en.wikipedia.org/wiki/Toyota_K_CVT_transmission | K120 architecture: physical first gear + 10 simulated ratios, Aisin build | 2026-11-12 | medium |
| https://www.caranddriver.com/reviews/a26524237/2020-toyota-corolla-sedan-drive | 0–60 mph 8.0 s (2.0 CVT sedan) | 2026-11-12 | medium |
| https://www.motortrend.com/reviews/2020-toyota-corolla-xse-first-test-review | 0–60 mph 8.2 s (XSE 2.0 CVT) | 2026-11-12 | medium |

---

## 3. BMW 320i — G20, 2.0T B48, 8-speed ZF 8HP (2019–2022)

Variant documented: **320i Sedan, RWD, 8-speed Steptronic**, 135 kW/184 hp tune (not the 1.6 L Turkish/Egyptian 170 hp 320i).

### 3.1 Published specifications

| Item | Value | Status | Evidence |
|---|---|---|---|
| Engine code | B48B20A, 1998 cc, twin-scroll turbo, direct injection, 10.2:1 | V | catalogue + BMW press |
| Max power | 184 hp (135 kW) @ 5000–6500 rpm | V | BMW press table / catalogue |
| Max torque | 300 N·m @ 1350–4000 rpm | V | same |
| Idle speed | ~650 rpm | **E** | not published; B48 hot idle 600–700 rpm |
| Redline | 6500 rpm (fuel cut ~7000) | **E** | set at top of the power band; BMW tachometer redline zone starts at 6500 |
| Transmission | ZF 8HP51 (GA8HP51Z), 8-speed automatic | V | parts/transmission ID sources |
| Ratios 1–8 | 5.250 / 3.360 / 2.172 / 1.720 / 1.316 / 1.000 / 0.822 / 0.640 | V | BMW press technical data |
| Reverse | 3.712 | V | BMW press technical data |
| Final drive | 2.813 | V/C | BMW press (330i/320d auto); 320i corroborated by OEM diff part listings |
| Curb mass | 1450 kg (DIN); ~1525 kg (EU, incl. driver/toolkit) | V | catalogue 1450; BMW's DIN/EU convention adds 75 kg |
| Weight distribution | 50 : 50 | V | BMW claim, cited by Wikipedia |
| L × W × H | 4709 × 1827 × 1435 mm (1442 with roof fin) | V | catalogue / BMW press |
| Wheelbase | 2851 mm | V | BMW press |
| Track F / R | 1589 / 1604 mm | V | BMW press technical data |
| Tyres | 205/60 R16 96W XL base; 225/45 R18 on M Sport | V | BMW press (320d base size) + catalogue |
| Brakes | vented discs front and rear, single-piston floating calipers | V | BMW press |
| Cd × A | 0.25 × 2.22 m² (320i); 0.24 × 2.22 (330i); 0.23 × 2.22 (320d) | V | catalogue Cd; BMW press A = 2.22 |
| 0–100 km/h | 7.1 s (7.2 s per BMW's own table) | V | catalogue / Wikipedia |
| Top speed | 240 km/h | V | catalogue |
| ABS / TCS / ESC | ABS + DSC + DTC + CBC + DBC standard | V | BMW press equipment list |

### 3.2 Simulation parameters

| Parameter | Value | Status | Note |
|---|---|---|---|
| Test mass | 1525 kg | V | DIN 1450 + 75 kg driver = EU figure |
| CoM height | 0.52 m | **E** | 0.36 × 1.435 m — lower factor than the FWD cars because of longitudinal engine, rear transaxle and 50:50 balance |
| Wheelbase | 2.851 m | V | |
| Track F / R | 1.589 / 1.604 m | V | |
| Tyre radius (unloaded) | 0.326 m (205/60R16); 0.330 m (225/45R18) | V+derived | loaded ≈ 0.316 m |
| Cd | 0.25 | V | catalogue |
| Frontal area | 2.22 m² | V | BMW press Cd × A |
| Drivetrain | RWD, longitudinal | V | |
| Gear ratios | [5.250, 3.360, 2.172, 1.720, 1.316, 1.000, 0.822, 0.640] | V | |
| Reverse / final | 3.712 / 2.813 | V | |
| Torque curve `[[rpm,Nm],…]` | `[[700,120],[1000,200],[1350,300],[2000,300],[3000,300],[4000,300],[4500,288],[5000,258],[5500,235],[6000,215],[6500,198],[6800,170]]` | V anchors, **E** between | Anchors: 300 N·m flat 1350–4000; 258 N·m @ 5000 and 198 N·m @ 6500 (= 135 kW = 184 hp) |
| Engine inertia | 0.24 kg·m² | **E** | 2.0 L turbo I4 with dual-mass flywheel and torsional damper; heavier than the NA Corolla unit |
| Torque converter | 2.0:1 stall ratio, lock-up above ~1200 rpm (2nd gear onward) | **E** | ZF 8HP typical; needed or the sim will not reproduce 7.1 s |
| Brake torque split F/R | 62 / 38 | **E** | 50:50 static axle load + front-biased proportioning; RWD cars run less front bias than FWD |
| ABS / TCS / ESC flags | all true | V | |
| Aero constants | CdA = 0.555 m², Crr ≈ 0.010 | derived/**E** | CdA = 0.25 × 2.22 (catalogue × BMW press area) |

### 3.3 Notes and conflicts

1. **Which 8HP?** Three ZF generations share the "8HP" name with different ratio sets. The G20 uses 8HP51 (3rd gen): 5.250 first, 0.640 eighth. The 2nd-gen 8HP50 (5.000/0.640) and 1st-gen 8HP45 (4.714/0.667) would give a noticeably different launch. The ratios in the table are the ones printed in BMW's own G20 press technical data, so they are the right set for this car.
2. **Final drive 2.813** is printed by BMW for the G20 330i and 320d automatic; for the 320i it is corroborated only by OEM differential part listings that cover 320i/330i/420i (part 33108647923). Treated as V for the platform, C for the exact 320i. If a 320i-specific BMW sheet surfaces, replace it.
3. **Mass convention.** BMW quotes "unladen to DIN/EU" — 1450 kg is DIN (no driver, 90% fuel). The EU figure adds 75 kg. The sim should use ~1525 kg to match the 7.1 s claim, which is a DIN-based figure; using 1450 kg with a driver will make the car ~0.2 s too quick.
4. Cd differs by body/engine: 0.23 (320d), 0.24 (330i), 0.25 (320i catalogue). The 320i's narrower base tyres and lack of M aero explain the small spread. Use 0.25 for the base car, 0.24 if modelling an M Sport with the same wheels as the 330i.

### 3.4 Sources

| URL | Supports | Retrieved | Confidence |
|---|---|---|---|
| https://www.press.bmwgroup.com/new-zealand/article/attachment/T0288468EN/420361 | BMW G20 press technical data: track 1589/1604, Cd×A 0.24×2.22, 8HP ratios 5.250…0.640, R 3.712, final 2.813, vented brakes F+R, DSC/DTC standard | 2026-11-12 | high |
| https://www.auto-data.net/en/bmw-3-series-sedan-g20-320i-184hp-steptronic-37228 | 184 hp @ 5000–6500, 300 N·m @ 1350–4000, B48B20A, 1450 kg, 4709/1827/1435, Cd 0.25, 205/60R16, 0–100 7.1 s, 240 km/h | 2026-11-12 | medium |
| https://en.wikipedia.org/wiki/BMW_3_Series_(G20) | 50:50 weight distribution (BMW claim, cited); 0–100 7.2 s; 2851 mm wheelbase; 1450–1965 kg range | 2026-11-12 | medium |
| https://www.go-parts.com/garage/differential-bmw-m340i-bmw-330i-bmw-m440i-2019-2026 | G20 non-M final drive 2.81:1, OEM diff part numbers | 2026-11-12 | medium |

---

## 4. Traffic archetypes (simplified — dimensions/mass only)

Traffic cars do not need gearboxes or torque curves; they need a believable footprint, mass and a coarse drag estimate. Values below are for spawning/scaling only.

| Archetype | L × W × H (mm) | Wheelbase (mm) | Mass (kg) | Status | Note |
|---|---|---|---|---|---|
| Saipa Pride 131 sedan | 3935 × 1605 × 1455 | 2345 | 915 | V | Same car as §1; by far the most common Iranian traffic car |
| Peugeot 405 GLX (IKCO) | 4408 × 1716 × 1400 | 2669 | ~1100 | C | Wikipedia gives 1020–1430 kg across the range; 1.8i GLX sits mid-range. Cd 0.29–0.33 |
| IKCO Samand LX | 4502 × 1720 × 1460 | 2671 | 1200 (XU7JP/L3); 1287 (XU7JP4) | V | 0–100 13.1 s (L3) / 9.8 s (L4) per Wikipedia table |
| Zamyad Khavar / Z24 pickup | 4690 × 1660 × 1650 | 2865 | ~1750 | C dims, **E** mass | Dims from Zamyad Z24 spec listing; kerb mass not published in sources retrieved — estimated from a ladder-frame 2.4 L petrol pickup of this size |
| Minibus (HiAce-type, local assembly) | ~4840 × 1880 × 2100 | ~3110 | ~2000 | **E** | No manufacturer sheet retrieved; typical of the class. Use only as a large slow obstacle |

Traffic-model guidance: for these five, a single rigid box collider plus 4 wheel visuals is enough; mass only matters for collision impulse. Do **not** reuse the §1–§3 suspension or tyre models for them.

### 4.1 Sources

| URL | Supports | Retrieved | Confidence |
|---|---|---|---|
| https://en.wikipedia.org/wiki/Peugeot_405 | 4408/1716/1390–1450, WB 2669, 1020–1430 kg, Cd 0.29–0.33, Iranian production 1992–2022 | 2026-11-12 | high |
| https://en.wikipedia.org/wiki/IKCO_Samand | 4502/1720/1460, WB 2671, masses by engine, 0–100 by engine | 2026-11-12 | high |
| https://www.iran2africa.com/product/zamyad-vanet-z24-2 | Zamyad Z24: 4690 × 1660 × 1650, WB 2865, track 1405/1400 | 2026-11-12 | medium |
| https://en.namu.wiki/w/Zamyad%20Z24 | Cross-check of Z24 dimensions | 2026-11-12 | low |

---

## 5. Open items (do not treat as settled)

| Item | Why it matters | Suggested check |
|---|---|---|
| K120 FWD final drive (Corolla) | ±5% error moves all engine speeds and the 0–100 estimate | Toyota service manual for 2019–2022 Corolla sedan, "CVT System – General" ratio table; or log rpm vs GPS speed in a real car |
| Pride 131 Cd and 0–100 | Both drive the car's top speed and launch feel | The ResearchGate paper "Drag Reduction Using Passive Methods on KIA PRIDE Car Model" reports wind-tunnel work on a 1:14 SAIPA 131 model — abstract may quote Cd |
| BMW 320i-specific final drive | Currently inferred from platform-wide 2.813 | BMW 320i (G20) technical data PDF for an EU market, 2019–2020 |
| Corolla weight distribution | FWD sim needs front axle share for load transfer | Corner-weight data from a road test or forum measurement; otherwise keep 60/40 estimate |
| Pride redline | Estimated at 6000 rpm | SAIPA workshop manual or tachometer photo of a 131 cluster |

---

## 6. How the three cars differ (sanity check for tuning)

| | Pride 131 | Corolla 2.0 CVT | BMW 320i |
|---|---|---|---|
| Power / mass | 63 hp / 990 kg = 63 hp/t | 169 hp / 1486 kg = 114 hp/t | 184 hp / 1525 kg = 121 hp/t |
| Overall ratio in 1st | 3.454 × 3.778 = 13.05 | 3.377 × 4.262 = 14.39 (launch gear) | 5.250 × 2.813 = 14.77 |
| Overall ratio in top | 0.692 × 3.778 = 2.61 | 0.447 × 4.262 = 1.91 | 0.640 × 2.813 = 1.80 |
| Engine speed at 100 km/h, top | ~2550 rpm | ~1580 rpm | ~1460 rpm |
| Driven axle share of mass | ~62% front (E) | ~60% front (E) | 50% (V) |
| Character | short gearing, low grip, no assists | tall CVT, traction-limited launch | flat 300 N·m from 1350 rpm, rear drive, DSC |

These four rows are the fastest way to spot a broken tune: if the sim's Pride sits at 4000 rpm at 100 km/h or the BMW lights its tyres at half throttle in 3rd, the final drive or the torque curve has been entered wrong.
