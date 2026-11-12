# SOURCE — provenance for `.agents/skills/gamedev/`

Everything in this folder is third-party material, copied verbatim. Nothing here was
written for FARMAN. The one exception is this file and `README.md`.

Retrieval performed on **2026-11-12** on Windows, from a clone made into `%TEMP%`
(`%TEMP%\farman-skills-audit`), never inside this repository.

---

## Upstream 1 — awesome-gamedev-agent-skills

| Field | Value |
|---|---|
| URL | https://github.com/gamedev-skills/awesome-gamedev-agent-skills |
| Commit SHA (HEAD at clone) | `c6ca6c41c839b68319ffc08430b99ab768debc32` |
| Commit date | 2026-11-12 13:23:53 +0545 |
| Licence | Apache-2.0 (`LICENSES/awesome-gamedev-agent-skills-LICENSE.txt`) |
| NOTICE | `LICENSES/awesome-gamedev-agent-skills-NOTICE.txt` — "Copyright 2026 Abhishek Barali and the awesome-gamedev-agent-skills contributors" |
| Upstream maturity note | README claims 79 skills across 12 engines; engine examples verified by the authors on real toolchains for 10 of 12 engines (their claim, not re-tested here) |

Copied verbatim (10 discipline skills, `SKILL.md` + `references/`):

```
game-feel/                     input-systems/            camera-systems/
level-design/                  game-ui-ux/               save-systems/
performance-optimization/      game-ai/                  audio-design/
physics-tuning/
```

Apache-2.0 permits redistribution, including in a closed-source product, provided the
licence and NOTICE are retained and modified files are marked. **No file here was
modified**, so no change notices are required. If you edit a copied file, add a line at
the top of that file saying so — that is an Apache-2.0 §4(b) obligation, not a style
preference.

Deliberately **not** copied from this repo:

- `router/` — its engine table has 12 entries and **Babylon.js is not one of them**. Its
  documented fallback for an unknown engine is to *default to Godot*, which would be
  actively wrong here. Keeping it would invite a mis-route.
- `skills/godot/**`, `skills/unity/**`, `skills/unreal/**`, `skills/web-engines/**`,
  `skills/other-engines/**`, `skills/ebitengine/**` — engine-specific APIs for engines
  this project does not use. The three.js skills are the nearest neighbours to Babylon.js
  and are still not interchangeable.
- `skills/disciplines/{create-game-assets,dialogue-systems,procedural-gen,shader-programming,ai-behavior-trees-utility-ai}/`
  — real skills, out of scope for a driving simulator's first milestone. Revisit
  `ai-behavior-trees-utility-ai` if traffic AI outgrows a finite state machine.
- `skills/unity/unity-build-size/references/platform-android.md` — inspected, and it does
  contain store-limit facts (Play base module 500 MB, 200 MB comfortable target, ASTC
  block sizes). It is Unity-specific in its instructions, so it was **summarised in the
  audit, not copied**.

## Upstream 2 — ForgeSkills

| Field | Value |
|---|---|
| URL | https://github.com/sekaikx/ForgeSkills |
| Commit SHA (HEAD at clone) | `cefbba0720b58b110a2e8ab36e71e46246ea1e29` |
| Commit date | 2026-10-29 23:36:40 +0100 |
| Licence | Apache-2.0 (`LICENSES/ForgeSkills-LICENSE.txt`) |
| NOTICE file | none in the upstream repo |
| Upstream maturity note | `docs/LIMITATIONS.md` states the Godot and Unity skills were **written but never executed** (no engine installed at authoring time), and that the repo's own reference-reconstruction test **failed its gate** (silhouette IoU 0.4628 vs required 0.85). Treated accordingly: workflow discipline trusted, engine specifics not. |

Copied verbatim:

```
gamedev-orchestrator/     gamedev-verification/      gamedev-visual-iteration/
gamedev-debugging/        gamedev-game-testing/      gamedev-performance/
gamedev-blender-headless/ ← REFERENCE-ONLY, see below
tools/refmatch/compare.py     tools/refmatch/overlay.py
tools/refmatch/measure_sheet.py  tools/refmatch/palette_report.py
```

`gamedev-blender-headless/` is marked **reference-only**: it documents Blender 4.x/5.x CLI
and MCP procedure. Blender is not installed on this machine and is not part of this
project's pipeline, so **none of `tools/blender/*.py` was copied** — `character_blockout.py`,
`render_compare_views.py`, `validate_scene.py` and `explorer_build.py` all remain upstream
only. Reading the SKILL.md is fine; do not attempt to run its commands here.

Also **not** copied: `gamedev-godot-pipeline`, `gamedev-unity-pipeline`,
`tools/godot/*` (no Godot/Unity here), `gamedev-*` asset/lighting/animation/locomotion/VFX
skills (Blender- or engine-bound, or out of scope), `docs/knowledge-base/**` and
`examples/**` (large, and the technique citations are already in each SKILL.md).

## Files added by us, not upstream

| File | Author |
|---|---|
| `SOURCE.md` | this repo |
| `README.md` | this repo |

## Verified behaviour of the copied tools (measured on this machine, 2026-11-12)

These were run, not assumed. Reproduce with `python tools/refmatch/compare.py --help`.

| Check | Result |
|---|---|
| `compare.py --ref a.png --test b.png` (text report) | Works. Prints silhouette IoU, 10-band width profile, bbox aspect, palette ΔE, luminance correlation, SSIM. Correctly reported FAIL on a deliberately mismatched pair (IoU 0.6797). |
| `compare.py --out report.json` | **Crashes** on numpy 2.5.4: `TypeError: Object of type int64 is not JSON serializable`. Same for `--json`. The text mode is unaffected. |
| `compare.py` exit code | **Always 0**, pass or fail. It prints `[FAIL]` but never sets an error code, so it cannot gate CI as-is. |
| `overlay.py --ref --test --out` | Works **only** with the directory on `sys.path`; a plain absolute-path invoke raises `ModuleNotFoundError: No module named 'compare'` under the isolated Python 3.13 build used here. Recipe in `README.md`. Produced a 1168×538 three-panel sheet. |
| Dependencies | Pillow 12.2.0 and numpy 2.5.4 were already installed; `requirements.txt` upstream asks for `pillow>=10`, `numpy>=1.24`. |

## Re-verifying or updating this copy

```powershell
$tmp = Join-Path $env:TEMP "farman-skills-audit"
git clone https://github.com/gamedev-skills/awesome-gamedev-agent-skills.git $tmp\awesome
git clone https://github.com/sekaikx/ForgeSkills.git $tmp\forgeskills
git -C $tmp\awesome rev-parse HEAD      # compare with the SHA above
```

If a SHA has moved, re-read the two `SKILL.md` files you care about before re-copying —
these libraries are young and their advice changes between commits.
