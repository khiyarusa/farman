# Skills audit — two public game-dev skill libraries, measured against FARMAN

**Date:** 2026-11-12 · **Auditor:** research pass, no product code touched
**Scope:** `gamedev-skills/awesome-gamedev-agent-skills` and `sekaikx/ForgeSkills`, cloned
into `%TEMP%` and read at the commits below. Target: FARMAN (فرمان) — Babylon.js 8 +
TypeScript + Vite + Rapier, Capacitor-wrapped, offline Android, touch-only input.

---

## 1. Summary

Both libraries are Apache-2.0 and both may be redistributed, so copying was legally
open. The useful part of each is different: **awesome-gamedev-agent-skills supplies
tuning numbers and design rules** (10 relevant engine-neutral discipline skills), while
**ForgeSkills supplies workflow discipline** (evidence gates, one-variable iteration,
verification levels) and one genuinely reusable measurement tool.

Neither library knows Babylon.js. The awesome router lists 12 engines and Babylon is not
among them — its documented fallback for an unknown engine is to default to *Godot*. So
no engine skill from either repo was copied; only engine-neutral material, translated
into FARMAN's stack.

Two defects in ForgeSkills' comparison tool were found by running it, not by reading it:
its JSON output path crashes on numpy 2.x, and it exits 0 even when it prints `[FAIL]`.
Both are recorded in §7 and worked around in the vendored README.

**Overall confidence: high** for everything in §3–§7 that was executed or read directly;
**low** for any claim about how FARMAN will actually feel on a phone, which no document
here can settle (see §9).

### Evidence base

| Claim type | How it was established |
|---|---|
| Commit SHAs, licence text, file inventory | `git rev-parse HEAD`, `git ls-files`, file reads in the TEMP clones |
| Tool behaviour | Executed on this machine: Python 3.13.15, Pillow 12.2.0, numpy 2.5.4 |
| Babylon module paths and versions | `unpkg.com` HEAD requests against `@babylonjs/core@8.0.0`; `npm view @babylonjs/core version` |
| Tuning numbers | Quoted from the upstream `SKILL.md` files, cited by skill and section |
| Environment facts | `Get-Command blender`, `Get-Command ffmpeg`, `node -v`, `python --version` |

---

## 2. Upstream pins

| Repository | Commit SHA | Commit date | Licence | NOTICE |
|---|---|---|---|---|
| https://github.com/gamedev-skills/awesome-gamedev-agent-skills | `c6ca6c41c839b68319ffc08430b99ab768debc32` | 2026-11-12 13:23:53 +0545 | Apache-2.0 | Yes — "Copyright 2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors" |
| https://github.com/sekaikx/ForgeSkills | `cefbba0720b58b110a2e8ab36e71e46246ea1e29` | 2026-10-29 23:36:40 +0100 | Apache-2.0 | None in repo |

Both licence texts and the NOTICE are vendored at `.agents/skills/gamedev/LICENSES/`.
Apache-2.0 §4(d) requires the NOTICE to travel with any redistribution — deleting that
folder would be a licence violation, not a tidy-up.

**Version pin.** `package.json` pins `@babylonjs/core` and `@babylonjs/loaders` to exactly
**8.56.2**, confirmed installed in `node_modules` on 2026-11-12 — so the "Babylon 8" brief is
honoured by an exact pin rather than a range. npm's latest is **9.35.0** (`npm view
@babylonjs/core version`), which is precisely why the pin matters: an unpinned install would
jump a major version. Caveat: the repository was empty when this audit began and was
scaffolded by a parallel task mid-pass, so `package.json` is the authority, not this paragraph.

---

## 3. Inventory — every skill inspected

Legend: **Copied** = present at `.agents/skills/gamedev/<name>/`. **Depth**: *read* = full
body read; *fm* = frontmatter/description only.

### 3.1 awesome-gamedev-agent-skills — disciplines (`skills/disciplines/…`)

| Skill | Path | One-line purpose | Used? | Why |
|---|---|---|---|---|
| `game-feel` | `game-feel/SKILL.md` + `references/feedback-recipes.md` | Trauma-based shake, hit-stop, easing, squash/stretch, knockback | **Copied** (read) | Directly relevant: curb strikes, crashes, gear shifts. Supplies a tier table of concrete magnitudes. |
| `input-systems` | `input-systems/SKILL.md` + `references/buffering-and-accessibility.md` | Named actions, stick deadzones and response curves, press buffering, rebinding | **Copied** (read) | The single most applicable skill: touch pedals, steering, device detection, buffer windows. |
| `camera-systems` | `camera-systems/SKILL.md` + `references/follow-and-framing.md` | Frame-rate-independent follow, deadzone, look-ahead, bounds, orbit, FP look | **Copied** (read) | Chase/hood/cockpit cameras and the `1-exp(-rate·dt)` fix for FPS-dependent smoothing. |
| `level-design` | `level-design/SKILL.md` + `references/pacing-and-flow.md` | Blockout from measured player metrics, gating, pacing curve, reachability | **Copied** (read) | Road/route layout, gating, "measure the controller before sizing the jump" applies to corner radii. |
| `game-ui-ux` | `game-ui-ux/SKILL.md` + `references/layout-and-flow.md` | HUD/menu layout, scaling, safe areas, focus, event-driven HUD | **Copied** (read) | Persian-first RTL UI on phones with cutouts; safe-area and text-size rules are concrete. |
| `save-systems` | `save-systems/SKILL.md` + `references/versioning-and-migration.md` | What to serialise, atomic writes, slots, versioned migration | **Copied** (read) | Offline career progress must survive crashes and content patches. |
| `performance-optimization` | `performance-optimization/SKILL.md` + `references/profiling-and-budgets.md` | Budget → measure → one bottleneck → re-measure; draw calls, pooling, GC | **Copied** (read) | Mobile frame budget and the asset-budget table (textures, draw calls, lights) is the core of §6. |
| `game-ai` | `game-ai/SKILL.md` + `references/{pathfinding,fsm-perception-steering}.md` | FSM/perception/steering/A*, stuck and fairness guards | **Copied** (read) | Traffic and NPC drivers; the hysteresis and repath numbers are directly reusable. |
| `audio-design` | `audio-design/SKILL.md` + `references/adaptive-music.md` | Bus layout, dB mapping, loudness, ducking, adaptive layers, SFX variation | **Copied** (read) | Engine-note layering by RPM/load is adaptive audio; loudness targets are mobile-specific. |
| `physics-tuning` | `physics-tuning/SKILL.md` + `references/timestep-and-ccd.md` | Fixed timestep, interpolation, CCD/tunnelling, damping, solver, layers | **Copied** (read) | Rapier is not covered, but the fixed-step/CCD reasoning is exactly the vehicle-physics failure mode. |
| `ai-behavior-trees-utility-ai` | `skills/disciplines/ai-behavior-trees-utility-ai/` | BT/utility runtimes, blackboard, response curves | Not copied (fm) | Out of scope for v1. `game-ai`'s FSM covers traffic. Revisit only if state count outgrows an FSM. |
| `create-game-assets` | `skills/disciplines/create-game-assets/` | Art direction, asset generation/QA, licence records | Not copied (fm) | Needs an image-generation pipeline and an asset manifest this project does not have. |
| `dialogue-systems` | `skills/disciplines/dialogue-systems/` | Ink/Yarn branching dialogue | Not copied (fm) | A driving simulator has no dialogue requirement in scope. |
| `procedural-gen` | `skills/disciplines/procedural-gen/` | Seeded RNG, dungeons, WFC, noise terrain, loot | Not copied (fm) | Roads are authored, not generated, in the current scope. |
| `shader-programming` | `skills/disciplines/shader-programming/` | GLSL/HLSL effect maths, mobile shimmer | Not copied (fm) | No custom shader is in scope; Babylon PBR covers the material needs. |
| `router` | `router/SKILL.md` (+ `references/`) | Engine detection → minimal skill set | **Not copied** (read) | Its engine table has no Babylon entry and its §7 fallback defaults to Godot. Copying it would mis-route. |

### 3.2 awesome-gamedev-agent-skills — engine skills inspected

| Skill | Path | Purpose | Used? | Why |
|---|---|---|---|---|
| `unity-build-size` | `skills/unity/unity-build-size/SKILL.md` + `references/platform-android.md`, `references/gltf-textures.md` | Build-size reduction with per-platform limits | **Not copied** (read) | Instructions are Unity-only. **Facts extracted into §8** (Play size limits, ASTC block costs) because they govern FARMAN's AAB/APK anyway. |
| Godot / Unreal / three.js / Phaser / PixiJS / Roblox / Defold / LÖVE / pygame / Ebitengine / Bevy sets | `skills/<engine>/…` | Engine APIs | Not copied (inventory only) | Wrong engines. The three.js skills are the closest neighbours and still not interchangeable with Babylon. |

### 3.3 ForgeSkills (`skills/…`)

| Skill | Path | One-line purpose | Used? | Why |
|---|---|---|---|---|
| `gamedev-orchestrator` | `gamedev-orchestrator/SKILL.md` | Brief → six-line contract → stages with artifacts and falsifiable gates | **Copied** (read) | Best thing in either repo for this project: it forces acceptance criteria before code. |
| `gamedev-verification` | `gamedev-verification/SKILL.md` | Four levels of evidence; the false-success catalogue | **Copied** (read) | Directly addresses "the build exited 0" as a definition of done. |
| `gamedev-visual-iteration` | `gamedev-visual-iteration/SKILL.md` | Render → measure → rank → fix one cause → re-render, with a ledger | **Copied** (read) | Pairs with the vendored `compare.py`; the one-variable rule is what keeps visual passes honest. |
| `gamedev-debugging` | `gamedev-debugging/SKILL.md` | Reproduce, isolate, bisect | **Copied** (not read in full; description + index) | Cheap to keep, and the project will need it. |
| `gamedev-game-testing` | `gamedev-game-testing/SKILL.md` | Smoke runs, state machines, visual regression, bots | **Copied** (not read in full) | Same reasoning; overlaps `performance-optimization`'s measurement advice. |
| `gamedev-performance` | `gamedev-performance/SKILL.md` | Budget-first draw-call/LOD/texture-memory planning | **Copied** (first 40 lines) | Complements the awesome perf skill with a budgeting worksheet. Overlaps it; see §7 tension note. |
| `gamedev-blender-headless` | `gamedev-blender-headless/SKILL.md` + `references/mcp-vs-headless.md` | Scripted Blender builds/renders/exports | **Copied, REFERENCE-ONLY** (first 60 lines) | No Blender on this machine and none in the pipeline. Its `tools/blender/*.py` were **not** copied. |
| `gamedev-reference-reconstruction` | `gamedev-reference-reconstruction/SKILL.md` + `references/` | Rebuild a concept sheet as measured 3D | Not copied (index) | Its gate (silhouette IoU ≥ 0.85) is worth keeping as a *principle*; the procedure is Blender-bound and, by upstream's own admission, **failed** its own gate (IoU 0.4628). |
| `gamedev-lighting`, `gamedev-camera`, `gamedev-locomotion`, `gamedev-vfx-impact`, `gamedev-animation`, `gamedev-procedural-modeling`, `gamedev-modular-kit`, `gamedev-texture-authoring`, `gamedev-foliage`, `gamedev-art-direction`, `gamedev-visual-artifacts`, `gamedev-world-from-data`, `gamedev-boss-encounter`, `gamedev-audio-wire`, `gamedev-gameplay-systems` | `skills/<name>/SKILL.md` | Various | Not copied (inventory/index) | Blender- or Godot/Unity-bound, or out of scope. `gamedev-visual-artifacts` (symptom → cause table) is the one to revisit if Babylon renders start shimmering. |
| `gamedev-godot-pipeline`, `gamedev-unity-pipeline`, `gamedev-godot-visual-polish`, `tools/godot/*` | `skills/…`, `tools/godot/…` | Engine wiring, per-setting frame cost | Not copied | No Godot/Unity here. Upstream `docs/LIMITATIONS.md` §1 says these were **written but never executed** — doubly excluded. |
| `gamedev-concept-lab`, `gamedev-concept-judge` | `skills/…` | Market scan and BUILD/NARROW/STOP verdict | Not copied (index) | The game and its premise are already decided. Useful if the scope is ever re-litigated. |

### 3.4 Tools inspected and executed

| Tool | Path | Verdict |
|---|---|---|
| `compare.py` | `tools/refmatch/compare.py` | **Copied.** Engine-agnostic (Pillow + numpy only). Works in text mode. JSON path broken on numpy 2.x; always exits 0. |
| `overlay.py` | `tools/refmatch/overlay.py` | **Copied.** Produces the 3-panel diagnostic sheet. Needs its directory on `sys.path`. |
| `measure_sheet.py`, `palette_report.py` | `tools/refmatch/` | **Copied.** Same dependency set; used for cropping a concept sheet and reading its palette. Not executed individually. |
| Blender tools (`character_blockout.py`, `render_compare_views.py`, `validate_scene.py`, `explorer_build.py`) | `tools/blender/` | **Not copied.** Require Blender 4.2+/5.x; absent here. |
| Godot ablation (`ablation_capture.gd`, `ablation_report.py`) | `tools/godot/` | **Not copied.** Requires Godot; upstream says unexecuted. |
| `tools/texture/*`, `tools/token_budget.py`, `tools/validate_skills.py` | `tools/` | Not copied. Texture tools are useful in principle but there is no texture pipeline in scope; the validators check *their* library's frontmatter, not ours. |

---

## 4. What was copied, and what deliberately was not

```
.agents/skills/gamedev/
├── README.md              ← ours
├── SOURCE.md              ← ours (SHAs, licences, omissions, tool defects)
├── LICENSES/              ← both Apache-2.0 texts + the awesome NOTICE
├── <10 awesome discipline skills>/  SKILL.md + references/
├── <7 ForgeSkills workflow skills>/ SKILL.md        (blender-headless = reference only)
└── tools/refmatch/        ← compare.py, overlay.py, measure_sheet.py, palette_report.py
```

38 files in total: 31 Markdown (29 copied verbatim + `README.md` and `SOURCE.md` written for
this repo), 4 Python, 3 licence/notice texts. No copied file was modified.

Not copied, with reasons already stated above: the Router, every engine-specific skill
set, the Blender and Godot tool directories, the out-of-scope disciplines, and ForgeSkills'
knowledge base and examples.

---

## 5. What we will actually apply — 15 numbered practices

Each practice states the number, where it comes from, and what is FARMAN's own choice.
Numbers marked **(upstream)** are quoted from the cited file; numbers marked **(FARMAN)**
are starting values chosen for this game and must be tuned on device. Do not let the
second kind masquerade as the first.

Where these land (module names from the tree as scaffolded; contents not reviewed here):
practices 1–3 → `src/input/controls.ts`, 4 → `src/rendering/cameraRig.ts`, 6 →
`src/ui/screens/hud.ts` + `src/ui/design.css`, 7 → `src/save/schema.ts` + `src/save/storage.ts`,
11 → `src/physics/world.ts`, 14 → audio (no module yet).

**1. Touch pedals: 1-D deadzone with rescale, gamma, and a release ramp.**
Per-axis deadzone 3 % of pedal travel **(FARMAN)**, then rescale
`(m − d) / (1 − d)` so travel starts from zero rather than jumping at the deadzone edge,
then `pow(scaled, 1.6)` **(FARMAN curve; upstream's pattern, `input-systems` §2)**. Release
uses a 120 ms ramp implemented as a one-pole filter `a += (target − a) · (1 − exp(−dt/τ))`
with τ ≈ 40 ms — the frame-rate-independent form from `camera-systems` §2, not a fixed
`lerp`. Note the deliberate departure: upstream's 0.2 radial deadzone and radial rescale
are for **2-D sticks**; a pedal is one axis, so a per-axis deadzone is correct there and
only there.

**2. Steering: radial deadzone only, 0.15, gamma 1.6, separate from sensitivity.**
Radial (vector-length) deadzone, never per-axis, or diagonals get clipped into the axes
and the car snaps to straight (`input-systems` §2: "clamping each axis separately… carves
a square hole"). Rescale past the deadzone and apply the curve; keep the curve exponent
separate from a sensitivity gain so both are exposable in settings. Speed-sensitive
maximum steer angle is a FARMAN addition, not upstream.

**3. Buffer discrete presses for 150 ms, in game time, and clear on state change.**
Upstream's window is 100–200 ms with 0.15 s as the code default (`input-systems` §3,
`buffering-and-accessibility.md` §"Buffer windows"). Measure in game time from the physics
step so the window freezes during pause and hit-stop, consume on fire so one press is one
action, and `clear()` on pause, respawn, crash-reset and scene change. Two buffered actions
becoming legal on the same tick resolve by a fixed priority, not dictionary order.

**4. Chase camera: exponential smoothing at rate 8, look-ahead, view-clamped bounds.**
`pos = lerp(pos, target, 1 − exp(−rate·dt))` with rate 5–12 **(upstream)**; at rate 8 and
300 px/s the documented lag is ~33–37 px at both 30 and 144 FPS, versus 90 px / 19 px for a
fixed `lerp(…, 0.1)` — the frame-rate dependence this exists to kill (`camera-systems` §2,
`follow-and-framing.md`). Look-ahead of 12 m eased toward its goal so a direction flip does
not whip the camera **(FARMAN)**. Clamp the **view**, not the centre:
`[min + half_view, max − half_view]` (§"Gotchas"), and add shake as a final additive offset,
never into the follow target.

**5. Juice tiers, with hit-stop capped at 150 ms and flashes at 3 per second.**
Use upstream's table (`game-feel` §"Tiers"): small trauma 0.10–0.20 with no hit-stop (kerb
strike, gear change); medium 0.30–0.50 with 0.04–0.06 s (panel scrape, light contact);
large 0.70–1.00 with 0.10–0.15 s (heavy crash). Shake magnitude is `trauma²`, decay
1.0–1.5 trauma/sec, `max_offset` 8–16 × 6–10 px at 1080p, `max_roll` 0.05–0.12 rad
(`feedback-recipes.md` §1). Overlapping hit-stops must not let an older timer restore time
during a newer freeze. Keep every freeze under ~0.15 s and any large flash at or under
three per second (WCAG 2.3.1, cited in `game-feel` §"Gotchas"). Ship a 0–100 % shake slider
defaulting to 60–80 %.

**6. HUD: 1920×1080 reference with `expand`, safe-area insets, event-driven values.**
One scaling policy for the whole UI, anchored to corners, expanding outward rather than
letterboxing (`game-ui-ux` §"Workflow" 3). Inset health/speed/timer UI to the safe area and
reapply on resize and orientation change — Android cutouts and the gesture bar are exactly
the case the skill calls out. Minimum text 18 px at 1080p, scalable to 200 %, and 4.5:1
contrast for informational text (XAG 101/102, cited in `game-ui-ux` §"Version notes").
Speed and RPM update from events/throttled ticks, not a per-frame poll of the physics body.

**7. Saves: integer `version` from v1, JSON, atomic write, migration chain, own autosave slot.**
Write `tmp` → keep previous as `.bak` → rename; load tries the primary then the `.bak`
(`save-systems` §2). Refuse a save stamped newer than the build, migrate older ones one
step at a time, validate before applying, and **never delete a migration** (§3). Autosave
on safe boundaries into its own file, throttled to once a minute (§4). Store plain data —
ids, numbers, flags, seed — never engine objects. On Capacitor, target the app-data
directory via the Filesystem API rather than WebView `localStorage`, because app data
survives a WebView storage clear and `localStorage` does not **(inference — verify on
device, see §9)**.

**8. Frame budget: 16.67 ms at 60 FPS, p95 ≤ 16.6 ms, with 20–30 % headroom.**
60 FPS is 16.67 ms and 30 is 33.3 ms; mobile should keep 20–30 % headroom so the game
survives thermal throttling (`performance-optimization` §1 and §3 pattern 1). Uncap before
measuring — vsync hides a 4 ms frame and a 15 ms frame behind the same "60 FPS" — then
read **milliseconds**, average and p95, not FPS. A phone that holds 60 FPS for two minutes
and then drops is overheating, not under-optimised; test with a 15-minute session.

**9. Babylon-specific budgets: ≤ 300 draw calls, 1–2 real-time lights, textures ≤ 2048².**
From the upstream mobile column (`profiling-and-budgets.md` §7): textures 1024–2048,
draw calls "a few hundred", real-time lights 1–2 plus baked, static meshes 5k–20k tris.
FARMAN budgets **(FARMAN)**: ≤ 300 draw calls, 1024² for props and 2048² for the player
vehicle and road atlas, one shadow-casting directional light. Measure with
`SceneInstrumentation.drawCallsCounter` and `EngineInstrumentation.captureGPUFrameTime`
rather than guessing — both are documented Babylon APIs and present in `@babylonjs/core@8`.

**10. Instance every repeated prop; disable the master mesh.**
Instances draw in a single draw call (`optimize_your_scene`, official docs). Barriers,
cones, palms, lamp posts and crowd props should be `master.createInstance(...)` on one
shared material. Set `master.setEnabled(false)` (or `isVisible = false`) so the source mesh
is not drawn on top of its instances, and note the glTF caveat: an instanced glTF node
must keep the same parent (`newInstance.setParent(source.parent)`) or have the parent
removed, because the loader wraps right-handed glTF in a negative-Z parent
(`instances`, official docs). Past ~1000 copies with no per-instance logic, switch to thin
instances.

**11. Rapier at a fixed 1/60 step, interpolated, with the accumulator clamped.**
Simulate at a fixed timestep and interpolate the visual transform; never integrate with the
frame `dt` (`physics-tuning` §1). Keep `speed / tick_rate` below the thinnest collider, or
enable CCD on the vehicle, or raycast — a 4 px wall and a 3000 px/s body is the exact
tunnel case upstream ships a test for. Clamp steps per frame (Godot's default is 8,
`physics-tuning` §"Gotchas") so a 200 ms hitch does not launch the car. Keep mass ratios
within about 1:10 for stability, and re-tune damping if the tick rate ever changes, because
exponential damping is tick-rate dependent.

**12. Traffic AI: sense at 5–10 Hz, hysteresis, dwell time, budgeted repaths.**
One sensor writes `target`, `last_known_pos`, `can_see` on a 5–10 Hz timer; decisions read
those facts and never raycast (`game-ai` §"Workflow" 2). Separate enter/exit thresholds
(chase at 10 m, give up at 14 m) and a minimum time in state of 0.3–0.5 s, or the agent
flickers at the boundary (§"Gotchas"). Repath when the target moves more than a cell or
every 0.25–0.5 s, staggered, with a per-frame search budget; a stall of ~2 s triggers a
repath, and two failed repaths change state. Verify the heuristic by comparing A* cost to
Dijkstra's on ~50 random grids.

**13. Size the road with the vehicle's measured numbers, not with geometry intuition.**
Measure the real controller before choosing corner radii and lane widths: turn radius at a
reference speed, braking distance, and the time from full lock to full lock. Upstream's
analogue is `level-design` §1, where measuring the real jump gave 93.6 px apex against 90 px
from the ideal formula — the formula is a starting point, the measurement is the fact.
Then author the route as beats with an intensity value (0.1 rest … 1.0 climax) and validate
the curve: no more than 2 high-intensity beats in a row, and a rest beat immediately before
the climax (§2). Keep the route graph and check that every gate is reachable with the keys
actually obtainable in order (§3) — the soft-lock check, applied to a career-mode route.

**14. Audio: buses, squared sliders, −18 LUFS on mobile, ducking with a slow release.**
Six buses (`Master`, `Music`, `SFX`, `Ambience`, `UI`, `Voice`); map a 0–1 slider by
squaring it and converting to dB, muting at 0 — a raw slider used as dB gives +0.5 dB at
"0.5", which is no change at all (`audio-design` §1). Integrated loudness about **−18 LUFS
(±2)** for handheld/mobile and −24 for console/PC, true peak at or below **−1 dBTP** (§4).
Duck music under any voice/impact bed with threshold ≈ −30 dB, ratio 4:1–8:1, attack up to
10 ms, release 300–500 ms, and duck a dedicated bus so the player's own slider is not
overwritten (§2). Vary repeated one-shots by ±1 semitone and ±2 dB (§3) — the engine loop
is the most repetitive sound in a driving game.

**15. Every "done" needs level-4 evidence, and the visual gate must be greppable.**
Upstream's four levels: the command exited 0 → the artifact exists → it parses → **behaviour
was observed and measured** (`gamedev-verification`). For visual work, run the vendored
`compare.py` in text mode and read the `[FAIL]` lines; because the tool always exits 0
(§7 below), gate CI on the text, e.g. `... | Select-String "\[FAIL\]"` and fail the job when
it matches. Change **one variable per pass**, revert a fix that makes the number worse even
if it was work, and keep the ledger from `gamedev-visual-iteration` §"The ledger" — an
overshoot is as much a defect as an undershoot.

---

## 6. The forbidden-shortcut list — what is NOT usable here

Stated plainly, because a skills folder that implies capability it lacks is worse than no
skills folder.

| Not usable | Why | What to do instead |
|---|---|---|
| **Blender headless build/render pipeline** (`gamedev-blender-headless`, `tools/blender/*`) | No Blender installed (`Get-Command blender` → nothing), and no Blender step in a Babylon/Vite asset flow. This is the single largest part of ForgeSkills' workflow that does not transfer. | Vendor GLB from an external DCC once, or build geometry procedurally in Babylon. Marked reference-only in the repo. |
| **ForgeSkills' Build and Render stages as written** | Both assume Blender (`character_blockout.py` → `render_compare_views.py`). | Substitute: Build = TypeScript in the Vite app; Render = Playwright + Edge screenshot from a **fixed** camera and viewport. `package.json` already declares `shots` → `node tools/qa/capture.mjs`, but `tools/` does not exist yet, so the capture script is still to be written. `Compare` works unchanged — `compare.py` takes two PNGs and does not care what produced them. |
| **Godot headless checks** (`godot --headless --script …`) in 10 of the copied skills | No Godot, and FARMAN is not a Godot project. | `vitest` for pure logic (deadzone maths, buffer windows, save migration); Playwright for anything needing a renderer. |
| **Unity build-size checker** (`check_unity_build_size.py`) | Reads Unity project files. | Use the *limits* (§8) manually, or measure the `.aab` with `bundletool` in CI. |
| **Godot ablation capture** (`tools/godot/*`) | Needs Godot; upstream states it was never executed. | Babylon's own instrumentation counters give the per-setting cost directly. |
| **The awesome `router`** | No Babylon in its engine table; §7 default is Godot. | Route manually: pick the discipline skill by task, translate to Babylon. |
| **All engine-specific skill sets** (Godot, Unity, Unreal, three.js, Phaser, Pixi, Roblox, Defold, LÖVE, pygame, Ebitengine, Bevy) | Wrong engine. three.js is the nearest neighbour and still not Babylon. | The Babylon guide produced alongside this audit (`.agents/skills/babylonjs/README.md`). |
| **Audio loudness measurement as written** (`--write-movie` + `ffmpeg ebur128`) | No Godot; `ffmpeg` is **not on PATH** (verified). | Either install ffmpeg and record a browser/device capture, or measure in-page with `AnalyserNode`. Unverified — see §9. |
| **`compare.py --out` / `--json`** | Crashes on numpy 2.5.4 (`int64` not JSON serialisable). | Text mode only. |
| **`compare.py` as a CI gate** | Exits 0 on failure. | Grep stdout for `[FAIL]`. |
| **`overlay.py` by absolute path** | `ModuleNotFoundError: No module named 'compare'` under the isolated Python here. | The `sys.path` wrapper documented in the vendored README. |
| **Godot/Unity pipelines, `gamedev-foliage` shaders, `gamedev-godot-visual-polish`** | Engine-bound **and** self-declared unexecuted in upstream `docs/LIMITATIONS.md` §1. | Ignore. |

---

## 7. Conflicts and defects found (kept, not smoothed over)

- **The two perf skills disagree on order.** `gamedev-performance` says budget first;
  `gamedev-orchestrator` says blockout first. Upstream's own `LIMITATIONS.md` §8 resolves
  it: budget the *target*, build the blockout, then measure against the budget — do not
  optimise blockout geometry. Both skills are vendored; use the resolution, not either
  half.
- **`compare.py` cannot fail a build.** It prints `[FAIL]` and returns 0. This is the exact
  failure mode `gamedev-verification` warns about ("a tool exiting 0 means a process ran"),
  occurring inside the same repository. Measured on a deliberately mismatched pair.
- **`compare.py` JSON output is broken on numpy 2.x.** `TypeError: Object of type int64 is
  not JSON serializable`, raised *after* the metrics are computed, so the text report is
  unaffected and the numbers are real.
- **`compare.py` is translation-invariant.** A subject shifted 18 px scored IoU 1.0; only a
  shape change moved it (0.6797). It normalises to the subject's bounding box, so it cannot
  detect framing or position errors — do not use it as a screenshot-diff for "is the car in
  the right place".
- **SSIM is advisory.** Upstream says so twice; a blurred blob can outscore a sharp correct
  render. Never let it override a named structural defect.
- **Numbers are documented practice, not measurements.** ForgeSkills `LIMITATIONS.md` §5:
  hitstop 40–90 ms, coyote 0.08–0.15 s and similar "were not measured in a running game".
  Treat every magnitude in §5 above as a starting value.

---

## 8. Mobile-deployment facts worth keeping (extracted, not copied)

From `skills/unity/unity-build-size/references/platform-android.md` at
`c6ca6c41c839b68319ffc08430b99ab768debc32` (Unity-specific instructions, engine-neutral
store facts):

| Fact | Value |
|---|---|
| Play base module limit | 500 MB |
| One asset pack | 1.5 GB |
| Base + feature modules + install-time packs | 4 GB |
| Fast-follow + on-demand packs | 30 GB |
| Legacy APK upload | 100 MB per APK |
| Warning threshold on mobile data | > 200 MB; treat 200 MB as the comfortable target |
| ASTC block cost | each block is 128 bits → 4×4 = 8 bpp, 6×6 ≈ 3.6 bpp, 8×8 = 2 bpp |

Practical consequence for FARMAN: an offline driving sim with GLB vehicles and audio can
pass 100 MB without trying. That is an AAB-and-asset-pack conversation for later, but the
texture decision (ASTC/WebP, 1024² props) is made now and is expensive to reverse.

Note this file is **Unity's** size reference. Babylon/Capacitor builds are not IL2CPP and
none of its per-architecture advice applies.

---

## 9. Open questions / not verified

| Question | Why it matters | Suggested check |
|---|---|---|
| Does Capacitor's WebView preserve `localStorage` across app updates and low-storage eviction? | Decides practice 7's storage target. Stated as inference above, not fact. | Install a build, save, force-stop, clear cache, update the APK, relaunch, read the save. |
| What is the real frame time on the target phone? | Every budget in §5 is a starting value from desktop-typical ranges. | 15-minute session, report frame time in minute 1 vs minute 15; Babylon `getFps()` plus a frame-time histogram. |
| Does `EXT_disjoint_timer_query` exist in the Android WebView's GPU path? | `captureGPUFrameTime` returns nothing without it; docs note it was disabled post-Spectre and re-enabled in Chrome/Edge. | Log the extension string on device before trusting GPU ms. |
| Stay on the pinned 8.56.2, or move to 9.x? | 8.56.2 is pinned and installed; npm latest is 9.35.0. | Not urgent. When moving, bump `core` and `loaders` together (docs: one version for all `@babylonjs/*`) and re-check the import paths in `.agents/skills/babylonjs/README.md`. |
| Do the touch-pedal numbers (3 %, γ 1.6, 120 ms) feel right? | They are chosen, not measured. | Tune with the buffer/deadzone exposed as live-tunable constants; log actual travel per input. |
| Does `overlay.py`/`measure_sheet.py` handle phone-aspect screenshots usefully? | Their metrics assume a subject on a neutral/alpha background. | Run once on a real 1080×2340 screenshot before relying on it. |

---

## 10. Suggested next step

Highest value first:

1. **Pin the Babylon major version** and get a hello-world Vite scene running, then wire
   `SceneInstrumentation` and print draw calls per frame *before* any content exists. A
   budget you can read from minute one is the cheapest performance insurance available.
2. **Build the input layer to practice 1–3 with every constant in a single tuning module**,
   because touch feel is the one thing that cannot be judged from a document.
3. **Add the save round-trip test** (write, truncate the primary, load the `.bak`) as the
   first automated test — it is pure logic, needs no renderer, and catches the class of bug
   that silently destroys a player's career progress.
