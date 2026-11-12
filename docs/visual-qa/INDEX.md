# Visual QA — structure and evidence index

This folder holds the visual evidence for a release: screenshots, the written report, and the
capture settings needed to reproduce both. It is evidence, not marketing. A screenshot that
was cropped, retouched, upscaled or taken from a different commit is not evidence.

The screenshot binaries are produced by the visual QA pass; this index defines where they go
and what each one is for.

---

## 1. Folder layout

```
docs/visual-qa/
├── INDEX.md                      ← this file
├── dev/                          ← gitignored scratch captures (not a release artifact)
│   ├── 01-menu.png
│   ├── 02-drive.png
│   └── ...
└── v0.1.0/
    ├── VISUAL_QA_REPORT.md       ← signed report for this version
    └── screenshots/
        ├── 01-menu.png
        ├── 02-free-drive.png
        ├── 03-garage.png
        ├── 04-missions.png
        ├── 05-city-drive.png
        ├── 06-traffic.png
        ├── 07-highway.png
        ├── 08-mountain.png
        ├── 09-rural.png
        ├── 10-rain.png
        ├── 11-pause.png
        └── 12-settings.png
```

Rules:

- **One folder per released version.** `v0.1.0/` is immutable once the release is published.
  A re-capture after fixes goes to `v0.1.0-rc2/` (or the next version), and the report names
  which set it supersedes. Never silently replace a published file.
- **`dev/` is scratch.** It is gitignored on purpose (`docs/visual-qa/dev/` in `.gitignore`).
  Nothing in `dev/` may be cited as release evidence.
- **No binaries in this task's output.** The documentation defines the structure; the QA pass
  runs the game and writes the PNGs.
- **Report before sign-off.** A folder of screenshots without `VISUAL_QA_REPORT.md` is
  incomplete.

---

## 2. Naming convention

```
NN-scene.png
```

- `NN` — two digits, capture order, starting at `01`. Keep the numbers stable across
  re-captures so a report can refer to "08" without ambiguity.
- `scene` — lowercase, hyphen-separated, describes the screen or state, not the build
  (`mountain`, not `mountain-final-v2`).
- Extension `.png`. No spaces, no dates, no version in the filename — the version is the
  folder.
- Optional extra captures use the next free numbers after `12` (`13-results.png`,
  `14-tutorial.png`, `15-help.png`) and must be listed in the report.

The six filenames referenced by the top-level `README.md` are fixed:
`01-menu.png`, `03-garage.png`, `05-city-drive.png`, `08-mountain.png`, `10-rain.png`,
`12-settings.png`. Do not renumber them.

---

## 3. Required captures

All captures are landscape. The baseline viewport is **1280 × 640**; a phone-aspect pass is
also required for the RTL review (see §6).

| File | Screen / state | How to reach it | Purpose |
|---|---|---|---|
| `01-menu.png` | Main menu | Boot completes; do not start a drive | Brand, RTL menu order, credits/level, tagline, version stamp |
| `02-free-drive.png` | Free drive, spawn frame | Menu → رانندگی آزاد; wait for the loading screen to clear; capture before moving | Proves the world loads and the HUD/controls appear at the spawn |
| `03-garage.png` | Garage | Menu → گاراژ | Car selection, specs, paint/rim swatches, service row, RTL spec grid |
| `04-missions.png` | Mission select | Menu → ماموریت‌ها | All seven mission cards, weather badges, completion marks, reward text |
| `05-city-drive.png` | City driving | Free drive from the city spawn; drive forward for a few seconds | City grid, buildings, road markings, HUD in motion |
| `06-traffic.png` | Traffic encounter | City or highway with at least one traffic vehicle visible ahead | Traffic models, lane placement, following distance |
| `07-highway.png` | Highway | Free drive or the time-trial spawn; reach the dual carriageway | Highway width, guardrails, signage, speed at cruise |
| `08-mountain.png` | Mountain pass | Mountain spawn (hill-start or wet mission); capture on the pass | Hairpins, elevation, rock/tunnel geometry, camera at gradient |
| `09-rural.png` | Rural / village | Rural eco spawn | Village road, vegetation, Caspian-style setting |
| `10-rain.png` | Rain | Wet-road mission (`mountain-wet`) or any rain preset | Rain sky/fog, wet grip conditions, HUD readability under the darker palette |
| `11-pause.png` | Pause overlay | In a drive, press the pause button (or `P`) | Overlay layout, resume/restart/exit actions, RTL alignment over the 3D scene |
| `12-settings.png` | Settings | Menu → تنظیمات | Category nav, graphics/audio/controls/assists/interface panels, Persian labels |

Not required for the six-image README, but useful if the pass has time: `13-results.png`
(mission result overlay), `14-tutorial.png` (manual or automatic tutorial), `15-help.png`.

---

## 4. Capture procedure

### 4.1 Environment

- Build from the release commit; record the commit and, if installed, the APK SHA-256.
- Web capture: `npm run dev` (Vite, `http://127.0.0.1:5188/`), Chromium/Edge through
  Playwright with the same GPU flags the QA scripts use:
  `--use-gl=angle --use-angle=d3d11`.
- Viewport: `1280 × 640`, `deviceScaleFactor: 1` for the baseline set. Do not resize after
  load; the renderer and the root font size react to viewport height.
- Disable OS notifications and any browser chrome before capturing.
- Use a fresh save for the set (or record the save state), so credits and mission marks are
  reproducible.

### 4.2 Commands

The intended one-shot entry point is `npm run shots`, which points at
`tools/qa/capture.mjs`. That script is **not in the tree** yet, so use the working scripts
and capture the remaining states with the same Playwright settings:

```bash
npm run dev

# Verify the harness (writes to docs/visual-qa/dev by default)
node tools/qa/smoke.mjs
node tools/qa/garage-shot.mjs
```

`smoke.mjs` currently writes `01-menu.png`, `02-drive.png` and `03-driving.png`;
`garage-shot.mjs` writes `10-menu.png`, `11-garage.png` and `12-garage-angle.png`. Those are
development names. **Do not point them at `v0.1.0/screenshots`** — the filenames do not match
§3. Use them to confirm the harness works, then capture the release set with the required
names: either extend `capture.mjs` (the right fix) or drive the same Playwright session
manually and save under the names in §3. Record which method was used in the report.

Useful environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `FARMAN_URL` | `http://127.0.0.1:5188/` | Target URL |
| `FARMAN_SHOTS` | `docs/visual-qa/dev` | Output directory |

### 4.3 Capture hygiene

- Capture the **whole viewport**, not a cropped element.
- Wait for the loading screen to disappear and for the scene to render at least two frames
  after the state is reached.
- Do not pause the render loop or freeze time for a "cleaner" shot; the set must reflect what
  a player sees.
- Take captures in one session where possible; if the app is reloaded, record it.
- Never edit the PNG afterwards. If a shot is wrong, re-capture it.

---

## 5. Report template

`v0.1.0/VISUAL_QA_REPORT.md` must contain at least:

```markdown
# Visual QA — FARMAN v0.1.0

- Build commit: <sha>
- APK SHA-256: <sha256 or "web build only">
- Capture date: <YYYY-MM-DD>
- Captured by: <name>
- Browser / device: <Edge 1xx / Pixel 7 / Galaxy A23 ...>
- Viewport(s): 1280x640; 412x915
- Dev server: http://127.0.0.1:5188/
- Save state: fresh / <describe>

## Summary
<PASS / PASS WITH DEFECTS / FAIL — one paragraph>

## Capture matrix
| # | File | Screen | Status | Notes |
|---|---|---|---|---|
| 01 | 01-menu.png | Main menu | PASS | |

## Defects
| ID | Severity | Capture | Description | Suspected cause | Owner |
|---|---|---|---|---|---|
| VQ-01 | major | 08-mountain.png | ... | ... | ... |

Severity: blocker (ships broken) / major (visible, must fix before release) /
minor (visible, can ship with a note) / cosmetic.

## RTL and legibility checks
- [ ] Persian digits and separators
- [ ] No clipped text at 1280x640 and 412x915
- [ ] Safe areas respected
- [ ] No tofu / fallback glyphs
- [ ] Touch targets >= ~44 CSS px

## Sign-off
<name>, <date>
```

A report with an empty defect table is allowed only if the reviewer actually looked at every
capture at both viewports. "Looks fine" is not a finding; name what was checked.

---

## 6. What the reviewer checks

### 6.1 Every capture

- The screen is the one named in §3, from the release commit.
- Persian text is complete, right-aligned where expected, and not clipped at the panel edges.
- Numbers use Persian digits (`۰۱۲۳۴۵۶۷۸۹`) and separators by default; the Latin-digit
  setting is checked separately.
- No missing-glyph boxes, no accidental English strings in player-facing labels.
- The HUD does not overlap the controls or the safe-area insets.
- Lighting/exposure is readable: dark cars are not black silhouettes, bright skies do not
  erase the HUD.

### 6.2 RTL-specific

- Menu order and back/next icon direction read correctly in RTL.
- Spec grids and settings rows start from the right; sliders and toggles keep their labels
  attached.
- Mixed Persian + Latin content (car model names, units, version string) is isolated, not
  scrambled. Readouts that must stay LTR use the `.ltr` class.
- The pause and result overlays are centred and dismissible, with the primary action obvious.

### 6.3 Known visual shortcomings (not new defects)

These are already recorded in `ART_BIBLE.md` §9 and must not be re-filed as surprises:
low-poly cars, colour-only paint response, sky/horizon wash-out, flat facades, sparse
roadside props, no contact shadows/AO, rain as a fog change, minimal junction markings,
inert control-size/opacity sliders, and the missing brand favicon. A capture may show them;
the report should reference the existing entry rather than open a duplicate.

---

## 7. What counts as done

- [ ] All 12 required captures exist under `v0.1.0/screenshots/` with the exact names.
- [ ] Each capture is from the release commit, full viewport, unedited.
- [ ] A phone-aspect pass exists for the RTL review (at least menu, garage, settings, HUD).
- [ ] `VISUAL_QA_REPORT.md` is filled, including the capture matrix and defects.
- [ ] Every blocker and major defect is either fixed and re-captured, or explicitly waived by
      the release owner with a date.
- [ ] The six README paths resolve.
- [ ] The folder is tracked by the repository; `dev/` is not cited as evidence.
