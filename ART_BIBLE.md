# FARMAN — Art Bible

Visual identity for a Persian-first driving simulator on a phone: graphite body, silver
edges, one deep green accent. This document defines what "correct" looks like for UI,
lighting, environment and vehicles, and — in §9 — where the current build falls short.

The palette and type values are copied from `src/ui/design.css`; the lighting values from
`src/rendering/environment.ts` and `src/rendering/studio.ts`.

## 1. Palette

| Token | Hex / value | Use |
|---|---|---|
| `--bg-0` | `#080a0b` | App background, boot screen base, letterboxing |
| `--bg-1` | `#0e1214` | Deep panels, scrims |
| `--bg-2` | `#141a1d` | Raised surface base |
| `--bg-3` | `#1b2226` | Hover / selected surface |
| `--surface` | `rgba(20, 26, 29, 0.92)` | Primary panel |
| `--surface-2` | `rgba(27, 34, 38, 0.94)` | Secondary panel |
| `--line` | `rgba(228, 238, 238, 0.09)` | Hairline borders, dividers |
| `--line-strong` | `rgba(228, 238, 238, 0.18)` | Focused/raised borders |
| `--text` | `#edf1f2` | Primary text |
| `--text-dim` | `#98a5aa` | Secondary text, labels |
| `--text-mute` | `#6d7a7f` | Hints, metadata, disabled |
| `--accent` | `#2ea37f` | Brand green: active states, meters, primary fill |
| `--accent-soft` | `#6fe0b6` | Highlight text, gear digit, needle |
| `--accent-dim` | `rgba(46, 163, 127, 0.18)` | Selected row wash |
| `--warn` | `#e3b25f` | Low fuel, cold engine, ESC intervention |
| `--danger` | `#d5544e` | Overheat, limiter, stall, destructive actions |
| `--silver` | `#c9d2d6` | Switch knob, metallic accents |
| Primary button | `linear-gradient(180deg, #34b48c, #24866a)` | One per screen, text `#04120d` |
| Primary hover | `linear-gradient(180deg, #42c79b, #2a9675)` | |
| Theme colour | `#0a0c0d` | Android status bar / browser chrome |

Rules:

- Green is **signal**, not decoration. At most one primary green action per screen; the rest
  is graphite with silver hairlines.
- No second saturated hue. Red and amber appear only as state, never as branding.
- Nothing is pure white (`#ffffff`) or pure black. Text tops out at `#edf1f2`, backgrounds
  bottom out at `#080a0b`.
- Gradients are vertical and subtle (≤ 4 % white overlay), except the brand green button.

## 2. Typography

Family: **Vazirmatn** (`public/assets/fonts/`), weights 300 / 400 / 500 / 600 / 700,
woff2, `font-display: swap`. Fallback stack: `system-ui, -apple-system, 'Segoe UI', sans-serif`.
`font-feature-settings: 'ss01' on, 'ss02' on` on `body` for the Persian numeral forms the
typeface ships.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Boot title | 3 rem | 700 | `letter-spacing: -0.02em` |
| Brand | 1.9 rem | 700 | Menu lockup |
| H1 (`h-l`) | 1.5 rem | 600 | Screen titles |
| H2 (`h-xl`) | 2.2 rem | 700 | Rare, result/hero |
| Section (`h-m`) | 1.15 rem | 600 | |
| Body | 0.95–1.02 rem | 400 | Line-height 1.65 |
| Small / hint | 0.72–0.8 rem | 400 | `--text-dim` or `--text-mute` |
| Eyebrow | 0.68 rem | 400 | `letter-spacing: 0.22em`, uppercase, mute |
| HUD speed | 2.55 rem | 700 | Tabular numerals |
| HUD gear | 1.7 rem | 700 | `--accent-soft` |
| Result score | 3.4 rem | 700 | Tabular numerals |

The root font size is not fixed: `App.applyUiScale` sets
`clamp(innerHeight × 0.0148, 12, 22) px × settings.uiScale (0.85–1.35)`. Every size in the
CSS is `rem`, so the whole UI scales with the device and the user's UI-scale slider.

Numerals are always tabular (`font-variant-numeric: tabular-nums`) in anything that updates:
speed, rpm, money, timers, scores. Persian digits are the default (`۰–۹`), with `٬` for
thousands and `٫` for decimals; Latin digits are an explicit setting.

## 3. Shape, elevation, motion

| Token | Value |
|---|---|
| Radius S | 0.5 rem (chips, small buttons, badges) |
| Radius M | 0.85 rem (cards, inputs, buttons) |
| Radius L | 1.3 rem (panels, HUD cluster) |
| Shadow 1 | `0 0.4rem 1.6rem rgba(0,0,0,0.45)` |
| Shadow 2 | `0 1rem 3rem rgba(0,0,0,0.55)` |
| Ease | `cubic-bezier(0.22, 0.7, 0.24, 1)` |
| Panel blur | 14 px backdrop |
| Overlay blur | 10 px, wash `rgba(6,8,9,0.62)` |

Elevation is expressed by luminance and blur, not by thick borders:

1. **Canvas** — the 3D scene.
2. **HUD** — translucent graphite (`rgba(8,11,12,0.55)`), 1 px 8 % white border, 8–10 px blur.
3. **Panel/card** — `--surface`, 14 px blur, shadow 1.
4. **Overlay** — full-screen wash + blur, centred panel with shadow 2.

Motion is short and mechanical: 0.12–0.35 s, no bounce, no spring. Buttons scale to 0.975 on
press. `prefers-reduced-motion` collapses all animation to 0.001 ms.

## 4. Lighting and weather

World lighting (`setupEnvironment`):

| Parameter | Value |
|---|---|
| Sun direction | `(0.42, −1, −0.72)` normalised |
| Sun intensity | 2.6, colour `#fff3d6` |
| Ambient (hemispheric) | 0.18, diffuse = horizon `#a9bcc7`, ground `#4a4238 × 0.5` |
| Sky dome | 2400 m sphere, `sky-day.png`, emissive texture tinted `rgb(0.52, 0.60, 0.70)` |
| Procedural env cube | top `#3f6f96`, horizon `#a9bcc7`, ground `#4a4238`, sun `#fff3d6`, 32² per face |
| Environment intensity | 0.85 |
| Tone mapping | ACES, exposure 0.92, contrast 1.14 |
| Fog | EXP2, `#9fb6c4` at 0.00045 in dry, `#c2cfd5` in the weather override |
| Shadow | PCF, bias 0.0015, normal bias 0.02, darkness 0.45 |

Weather presets (`WorldScene.setWeather`):

| | Dry | Rain |
|---|---|---|
| Clear colour | `#c9d6dd` | `#5d666b` |
| Fog | `#c2cfd5`, 0.00045 | `#8e9aa0`, 0.0035 |
| Sky texture | `sky-day.png` | `sky-rain.png` |
| Wetness (grip) | 0 | 1 on asphalt, 0.4 off-road |

Direction: an overcast-but-bright Caspian day. Sun is high and slightly behind-left of the
default driving direction; shadows are soft and short. Rain is desaturated blue-grey, not
night, not a thunderstorm. There is no dusk lighting in gameplay (`sky-dusk.png` is generated
but unused), no night, no headlight cones, no wet-road reflections.

Studio lighting (garage/menu) is deliberately different — a dark showroom:

- Key `(−0.35, −1, 0.55)` at intensity 5.2, cool white `rgb(0.96, 0.98, 1)`.
- Rim `(0.3, −0.45, −1)` at 1.9, green-tinted `rgb(0.55, 0.78, 0.72)`.
- Fill `(0.2, −0.6, 1)` at 0.95, neutral grey.
- Floor: albedo `rgb(0.045, 0.052, 0.056)`, metallic 0.55, roughness 0.32 — a polished dark
  concrete that mirrors the car.
- Backdrop: vertical gradient `#05080a → #101619 → #1b2427 → #070a0b`.
- Idle turntable: camera alpha advances 0.075 rad/s after 6 s without pointer input.

## 5. Environment rules (Iranian-inspired region)

The region is one 3.6 km square with four readable zones. It is *inspired by* Iranian road
corridors; it is not a survey of a real place.

**City grid.** Streets 10–14 m wide, 4 lanes on the main street, low-rise walk-ups, shopfront
frontage at ground level, parked cars and street lights. Building palette: tan brick
`#B0805E`, old red-brown `#8E5340`, concrete `#B7B3A8`, glazed tile `#3C7F8C` as an accent
only. Facades are flat-shaded boxes with window bands; roofs carry water tanks and AC boxes.

**Highway.** 22 m dual carriageway, guardrail `#9BA1A3`, green freeway signage `#0A5C3C`,
concrete New Jersey barriers `#B7B3A8`, lighting masts every 40–50 m.

**Mountain pass.** 8–9 m two-lane road, hairpins, rock cut on the uphill side, guardrail on
the valley side, blue main-road signage `#12508F`, retaining walls with weep holes.

**Caspian forest village.** 7–8 m rural road under broadleaf canopy, deep greens
`#2C4726 / #41602F / #5E7F3A`, galvanised roofs, tea-garden plots, fog-prone atmosphere.

Markings follow Iranian convention: **yellow** `#E4B23C` centre lines (solid, broken, or a
solid+broken pair), **white** `#EDEAE0` lane dividers and edge lines, 0.15 m line width.
Asphalt targets: fresh `#2E3134`, worn `#3D4041`, wet `#202426`. Concrete `#B7B3A8`, stained
`#8F8C83`. Soil `#8B6B4E`.

Avoid: desert/palm/camel imagery, Arabic `ي`/`ك` letterforms, Latin-first signage, US road
furniture (yellow edge lines, wooden poles, mph), Gulf glass towers, teal-orange grading, and
any Persian text that is not a real string from the dictionary.

## 6. Vehicle art rules

Geometry is generated parametrically from the same numbers the physics uses
(`profile.dimensions`, `profile.wheels`, `profile.visual.wheelAnchors`), authored in metres,
+Y up, +Z forward, right-handed.

| Material | Values |
|---|---|
| Paint | `metallic 0.22`, `roughness 0.32`, clearcoat on, intensity 1.0, clearcoat roughness 0.06, IOR 1.52, environment intensity 1.1 |
| Rim | `metallic 1.0`, `roughness 0.24`, environment intensity 1.2 |
| Glass (proxy) | albedo `rgb(0.04, 0.055, 0.06)`, metallic 0.1, roughness 0.06, alpha 0.62, alpha-blend |
| Headlight | emissive `rgb(1, 0.96, 0.88) × 1.2`, always on |
| Brake light | emissive red, scales 1.6 → 3.8 with brake input |
| Reverse light | white when `gear === -1`, otherwise near-black |

Proportion rules:

- Wheelbase, track, wheel radius and tyre width come from the profile; never eyeball them.
- Wheel arches must clear the tyre at full travel (±0.16 m visual offset).
- Belt line, roof line, bonnet and boot heights are per-car parameters in
  `tools/assetgen/vehicles.py`; the three cars must be distinguishable by silhouette alone.
- Glass is a separate material with a slight tint, never opaque black.
- Four wheels are separate nodes named `wheel_fl/fr/rl/rr`, pivoting at the authored anchors.
- Clearcoat is what sells paint on a phone; roughness above 0.4 reads as plastic.
- Cars cast shadows; they do not receive their own (self-shadowing is off).

## 7. UI surface and control rules

- The HUD is a bottom-centre cluster (speed, tach, gear, gauges) plus a top row (objective
  card right, minimap left in RTL flow) and a bottom-right flag strip. It never covers the
  centre of the road.
- Touch targets: pedals 4.2 rem wide × 9.2 rem tall, steering wheel 9.6 rem diameter, gear
  buttons 3 × 2.5 rem, icon buttons 2.5 rem. Minimum tap target is 2.5 rem.
- Pedal fills are the only large colour fields in the HUD: green throttle, red brake, silver
  clutch.
- `--hud-opacity` is 0.9; the cluster itself sits on a 72–88 % opaque gradient so digits stay
  legible over bright asphalt.
- Left-handed mode mirrors the control clusters (steering vs pedals) and nothing else.
- There is no icon library: icons are inline SVG with 1.7–2 px strokes, round caps.

## 8. Camera language

| Mode | Distance | Height | Look-ahead | Character |
|---|---|---|---|---|
| Chase (default) | 6.4 m + 0.035·v (max +1.3) | 2.55 m + 0.012·v | 3.2 m | Road-first, car in the lower third |
| Close | 4.3 m | 1.75 m | 4 m | Shows body form and wheels |
| Hood | −0.25 m (at the bonnet) | 1.18 m | 12 m | Fast, no interior |

FOV eases from 0.92 to 1.01 with speed in chase; 0.86 in the other modes. Camera position is
damped with a 0.11 s half-life (0.045 s in hood), target with 0.09 s. There is no cockpit
camera, no orbit-while-driving, no replay camera.

## 9. Current visual shortcomings (honest list)

These are visible in the shipped build and in `docs/visual-qa/dev/*.png`:

1. **Cars are low-poly approximations.** Body panels are lofted boxes with hard edges; there
   are no shutlines, no badges, no interior, no underbody, no wheel wells. At chase distance
   they read as the right silhouette, not as the real car.
2. **Paint options are colour-only.** `PaintOption.metallic` and `.roughness` are authored per
   colour but `createPaintMaterial` hard-codes metallic 0.22 / roughness 0.32, and `setPaint`
   only changes albedo. Metallic paints therefore look identical in gloss.
3. **Sky and horizon wash out.** The sky dome is a 2048 × 1024 gradient with a soft sun blob,
   emissive-tinted toward blue-grey; at the horizon it collapses to a near-white band. There
   are no clouds with structure, no atmospheric perspective layers, no sun disc.
4. **Building facades are simple.** Flat boxes with a window-band texture; no balconies,
   awnings, roof clutter at street level, or ground-floor depth. Shadowing on facades is
   minimal.
5. **Roadside density is low.** Long stretches show only road, kerb and lamp posts; the
   props/vegetation GLBs exist but are sparse relative to a real city street.
6. **No contact shadows or AO.** The car can look pasted onto the road, especially at midday
   when the shadow falls behind it. There is no SSAO, no decal shadow, no wet reflection.
7. **Rain is a fog change, not weather.** No droplets, no spray, no wipers, no darkened
   asphalt texture, no puddles.
8. **Markings are minimal.** Lane dashes and edge lines exist, but junction markings, arrows,
   zebra crossings and Persian signage on the road are largely absent at driving speed.
9. **Control scaling is inert.** `controlSize` and `controlOpacity` settings persist but are
   never applied to CSS (`--control-scale` stays 1), so the on-screen controls do not change
   size or opacity despite the sliders.
10. **Brand asset missing.** `index.html` requests `./assets/brand/icon-192.png`; the folder
    does not exist, so the favicon is a 404 and the Android launcher icon is the Capacitor
    default.

Fix order if visual quality is the goal: paint material response → contact shadow/AO →
sky horizon and sun → facade depth → roadside density → rain treatment.
