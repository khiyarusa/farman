# Game-dev skills for FARMAN (vendored, third-party)

Ten engine-neutral design/technique skills, six workflow skills, and four measurement
scripts. Apache-2.0, copied verbatim from two upstream repositories. See
[`SOURCE.md`](SOURCE.md) for commit SHAs, licences, and exactly what was left out.

**Read this before trusting any code sample in here.** Every snippet upstream is Godot 4.7
GDScript or Unity 6.3 C#. FARMAN is Babylon.js 8 + TypeScript + Rapier on Capacitor. The
*concepts, numbers and checklists* transfer; the *APIs* do not. Translate, don't paste.

---

## What is here

| Skill | Use it when |
|---|---|
| [`game-feel/`](game-feel/SKILL.md) | A crash, curb strike or engine note reads flat. Trauma-based shake, hit-stop, easing, squash. |
| [`input-systems/`](input-systems/SKILL.md) | Touch pedals/steering, deadzones, response curves, press buffering, rebinding. |
| [`camera-systems/`](camera-systems/SKILL.md) | Chase/hood/cockpit cameras, frame-rate-independent smoothing, look-ahead, bounds. |
| [`level-design/`](level-design/SKILL.md) | Road and route layout, gating, pacing, blockout review. |
| [`game-ui-ux/`](game-ui-ux/SKILL.md) | HUD, menus, safe areas on phones, scaling, focus order, event-driven HUD. |
| [`save-systems/`](save-systems/SKILL.md) | Save slots, atomic writes, schema versioning and migration. |
| [`performance-optimization/`](performance-optimization/SKILL.md) | Frame budget, CPU-vs-GPU triage, draw calls, pooling, mobile budgets. |
| [`game-ai/`](game-ai/SKILL.md) | Traffic/NPC behaviour: FSM, perception, steering, A*. |
| [`audio-design/`](audio-design/SKILL.md) | Bus layout, volume in dB, ducking, adaptive engine/music layers, SFX variation. |
| [`physics-tuning/`](physics-tuning/SKILL.md) | Fixed timestep, tunnelling/CCD, damping, stability — the Rapier tuning theory. |
| [`gamedev-orchestrator/`](gamedev-orchestrator/SKILL.md) | Turning a vague brief into stages with falsifiable gates. |
| [`gamedev-verification/`](gamedev-verification/SKILL.md) | Before saying "done". Four levels of evidence. |
| [`gamedev-visual-iteration/`](gamedev-visual-iteration/SKILL.md) | Render → compare → rank → fix one cause → re-render. |
| [`gamedev-performance/`](gamedev-performance/SKILL.md) | Budget-first framing of the same problem as `performance-optimization`. |
| [`gamedev-debugging/`](gamedev-debugging/SKILL.md) | A failure whose cause is unclear. |
| [`gamedev-game-testing/`](gamedev-game-testing/SKILL.md) | Turning "it works" into a test. |
| [`gamedev-blender-headless/`](gamedev-blender-headless/SKILL.md) | **Reference only.** Documents a Blender pipeline this project does not have. |

## How to use them

Read one skill at a time, only when the task matches its description. Loading all
seventeen produces mush — that is the upstream libraries' own advice, and it is correct.

Each `SKILL.md` ends with a "Check it" section. Those checks are the point; the prose is
support. Where a check demands a Godot headless run, substitute the equivalent here:

| Upstream check | FARMAN equivalent |
|---|---|
| `godot --headless --script …` | `vitest` for pure logic; Playwright + Edge for anything that needs a renderer |
| Godot Profiler / Visual Profiler | Babylon `SceneInstrumentation.drawCallsCounter`, `EngineInstrumentation.captureGPUFrameTime` |
| Godot FPS overlay | `engine.getFps()` plus frame-time percentiles, measured uncapped |
| Blender turnaround render | Playwright screenshot from a fixed camera at a fixed size |

## The measurement tools

`tools/refmatch/` runs on Python 3.13 with Pillow and numpy, both already present.

```powershell
# Numeric comparison — the primary metric
python .agents\skills\gamedev\tools\refmatch\compare.py --ref shot_target.png --test shot_now.png

# Three-panel diagnostic sheet (reference / render / disagreement overlay)
$r = "$PWD\.agents\skills\gamedev\tools\refmatch"
python -c "import sys,runpy; sys.path.insert(0,r'$r'); sys.argv=['overlay.py','--ref','ref.png','--test','now.png','--out','diag.png']; runpy.run_path(r'$r\overlay.py', run_name='__main__')"
```

Two known defects, both verified on this machine and both documented in `SOURCE.md`:

- `--out` and `--json` crash on numpy 2.x (`int64` is not JSON serialisable). Use the text
  report.
- The tool **always exits 0**. If you gate CI on it, grep stdout for `[FAIL]` rather than
  trusting the exit code. (A check that cannot fail is not a check — `gamedev-verification`
  makes the same point about validators that pass on an empty set.)

`overlay.py` only imports `compare` when its own directory is on `sys.path`; the wrapper
above is the working invocation, a plain absolute-path call fails.

## What these skills do not know about this project

- They have never seen Babylon.js, Rapier, Capacitor, Vite or a touchscreen-only driving
  game. Treat every number as a starting value to tune, not a measurement of FARMAN.
- They cannot run on this machine's target. No Android SDK, no device, no Blender: every
  claim about how the game feels on a phone is a hypothesis until a human plays it.
- The upstream libraries' own reliability differs. The discipline skills are
  documentation-grade. ForgeSkills' own `docs/LIMITATIONS.md` says its Godot/Unity skills
  were written but **never executed**, and that its showcase reconstruction **failed** its
  own IoU gate. Weight them accordingly.

## Licence

Apache-2.0. Both upstream licences and the awesome-gamedev NOTICE are in
[`LICENSES/`](LICENSES/). Do not delete them, and if you edit a copied file, say so at the
top of that file.
