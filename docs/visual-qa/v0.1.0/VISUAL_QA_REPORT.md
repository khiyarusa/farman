# FARMAN — Visual QA report v0.1.0

**Build:** v0.1.0 preview · **Capture date:** 2026-11-12 · **Method:** Playwright
(Chromium/Edge, ANGLE D3D11) against the Vite development build at 1280×640, plus one
2400×1080 landscape capture to check the phone aspect ratio. Screenshots are genuine
runtime output (`tools/qa/capture.mjs`), not concept art or mockups.

**Device:** desktop browser only. **No physical Android device was available**, so the
Galaxy A23 performance target is *not* verified (see §4).

---

## 1. Screenshot index

| # | File | Scenario |
|---|------|----------|
| 01 | `01-menu.png` | Main menu over the studio scene |
| 02 | `02-garage.png` | Garage with the Saipa Pride 131 selected |
| 03 | `03-garage-angle.png` | Garage, orbited camera (vehicle close-up) |
| 04 | `04-missions.png` | Mission catalogue (RTL) |
| 05 | `05-settings.png` | Settings, graphics tab (RTL controls) |
| 06 | `06-city-manual.png` | Free drive, city street, manual gearbox HUD |
| 07 | `07-driving-manual.png` | Driving at speed with the manual HUD |
| 08 | `08-highway.png` | Highway with traffic and hills |
| 09 | `09-mountain.png` | Mountain pass, hairpin, forest belt |
| 10 | `10-rain.png` | Wet-road weather state |
| 11 | `11-traffic.png` | City traffic (AI vehicles in lane) |
| 12 | `12-pause.png` | Pause overlay |
| 13 | `13-automatic.png` | BMW 320i, automatic HUD (gear indicator) |
| 14 | `14-mission-objective.png` | Parking mission objective |
| 15 | `15-wheel-contact.png` | Low camera on the wheel/road contact |
| 16 | `16-mobile-2400x1080.png` | Landscape phone aspect ratio |

---

## 2. Scores (diagnostic, not marketing)

| Area | Score | Notes |
|------|-------|-------|
| Cohesion of art direction | 4/10 | Clear graphite/desert palette, but procedural low-poly vehicles and flat facades keep it below a premium bar. |
| Menu / garage composition | 7/10 | Strong typography and spacing; studio lighting reads, car silhouette is weak. |
| Vehicle shape and proportions | 4/10 | Parametric loft gives a plausible sedan silhouette but no wheel arches, panel gaps, or trim detail. |
| Materials and lighting | 5/10 | Sun/ambient balance is now reasonable; no shadows on terrain and no IBL detail on paint. |
| Environment / roads | 6/10 | Connected city, highway, mountain pass and forest read as a real place; markings and kerbs present. |
| UI hierarchy and Persian typography | 8/10 | Vazirmatn, RTL, Persian digits, consistent scale; no clipped text in captured screens. |
| HUD readability | 8/10 | Speed/gear/tacho cluster legible over bright and dark scenery. |
| Artifacts | 6/10 | No z-fighting or missing textures in the captures; road-shoulder edge and guardrail geometry had to be removed. |
| Performance symptoms | n/a | Desktop capture only; frame pacing was stable but that says nothing about the A23. |

---

## 3. Defects found and fixed during this pass

1. **Terrain was invisible (critical).** Terrain triangles were wound backwards, so the
   whole land surface was back-face culled and the sky showed through. Fixed in
   `tools/assetgen/world.py` with an `ensure_up()` winding check; terrain now renders
   with grass/rock/dirt materials.
2. **Cars rendered near-black (major).** Car paint used metallic 0.85 with a dark
   procedural environment. Reduced to metallic 0.22 + clearcoat, so body colour reads.
3. **Floating guardrail slabs (major).** The generated rail boxes were malformed and
   oversized. Removed from the generator rather than shipped broken; documented below.
4. **Washed-out distance (major).** Fog density was 0.0022 with a very light fog colour,
   which whited out the mountains. Reduced to 0.00045 and darkened the fog/sky palette.
5. **Persian strings rendered as mojibake in profiles (critical).** Files had been
   round-tripped through a non-UTF-8 encoding during authoring; repaired and re-verified
   by reading `innerText` from the DOM (`سایپا پراید ۱۳۱`).
6. **Tachometer NaN** when the engine reported a non-finite rpm; HUD now guards.

## 4. Known visual issues (not fixed)

- **Sky/horizon is still pale.** The equirect sky's haze band plus tone mapping makes the
  upper third of the frame light grey. Needs a re-authored sky gradient and/or sky
  shader.
- **No cast shadows on terrain.** The shadow generator only covers the vehicle and props
  near the camera; buildings and trees do not shadow the ground.
- **Buildings are boxes with a facade texture.** No balconies, awnings, signage or
  street-level detail.
- **Vehicles have no wheel arches, door seams, mirrors with glass, or interior.** Wheels
  are correct in size/position but visually simple.
- **Trees are two stacked cones.** Acceptable at distance, obvious up close.
- **Road shoulder band** between asphalt and terrain is visible as a light strip on
  mountain roads; it is the shoulder geometry, not a texture gap.
- **Traffic has no traffic lights or intersection logic** — cars follow lanes and headway
  only.
- **No Android device screenshots.** The APK is built by CI; visual evidence is from the
  web build in a desktop browser. Real WebView rendering, touch latency and thermal
  behaviour remain unverified.

## 5. Iteration history

| Cycle | Action | Result |
|-------|--------|--------|
| 1 | First capture of menu/garage/drive | Car was a grey box proxy (GLB not generated yet); scene too dark |
| 2 | Generated vehicle GLBs + studio relight | Car loads, paint still too dark; sky white |
| 3 | Fixed winding, paint metallic, fog | Terrain and colour appear; road and hills read |
| 4 | Removed malformed guardrails, darkened tints | Mountain pass readable; remaining issues listed above |

## 6. Reproduction

```bash
npm run dev            # http://127.0.0.1:5188
node tools/qa/capture.mjs   # writes docs/visual-qa/v0.1.0/screenshots
```

The capture script drives the app through `window.__farman` (garage → missions →
settings → free drive → highway → mountain → rain → traffic → pause → automatic →
mission), so every screenshot is deterministic.
