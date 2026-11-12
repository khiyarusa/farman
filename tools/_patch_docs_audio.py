"""Update documentation now that the audio engine exists."""

import io

# README
p = "README.md"
s = io.open(p, encoding="utf-8").read()
s = s.replace(
    "| Audio | Not implemented in this slice — volume settings persist, but nothing plays |",
    "| Audio | Procedural Web Audio: per-vehicle engine note from firing frequency + load, tyre slip noise, wind, rain, UI clicks; four volume buses wired to settings |",
)
s = s.replace(
    "- **No audio playback.** Four volume sliders persist values that nothing consumes;\n  `profile.audio` is metadata only.",
    "- **Audio is synthesised, not recorded.** Convincing, continuous and load-reactive,\n  but it is a synth rather than a sampled engine, and there is no music.",
)
io.open(p, "w", encoding="utf-8", newline="").write(s)

# TECHNICAL_IMPLEMENTATION_PLAN
p = "TECHNICAL_IMPLEMENTATION_PLAN.md"
s = io.open(p, encoding="utf-8").read()
s = s.replace(
    "| Audio | `profile.audio` metadata exists (firing Hz, timbre, gains); four volume settings persist | No audio module, no playback, no files | — |",
    "| Audio | `src/audio/audio.ts` — Web Audio synth (engine firing-frequency oscillators, tyre and wind noise, rain bed, UI blips) driven by telemetry | No sampled recordings, no music | Verified in browser, not on device |",
)
s = s.replace("- Audio of any kind (engine, tyres, wind, UI, music).\n", "- Music and sampled (recorded) engine audio.\n")
s = s.replace(
    "6. **Audio.** New `src/audio/` with an engine synth driven by `rpm`, `throttle`,",
    "6. ~~**Audio.**~~ Done: `src/audio/audio.ts` is an engine synth driven by `rpm`, `throttle`,",
)
io.open(p, "w", encoding="utf-8", newline="").write(s)

# GDD
p = "GDD.md"
s = io.open(p, encoding="utf-8").read()
s = s.replace(
    "| Audio playback | No audio engine. Volume sliders persist values that nothing consumes; `profile.audio` is metadata only. |",
    "| Audio playback | Procedural Web Audio engine (`src/audio/audio.ts`): engine firing-frequency oscillators with load filter, tyre slip noise, wind, rain and UI blips. No music, no recorded samples. |",
)
s = s.replace("3. **No audio.** Settings expose four volume sliders; nothing plays.\n", "3. **No recorded audio or music.** Everything audible is synthesised at runtime.\n")
s = s.replace("tutorial hints; 4 volumes persist (no audio yet)", "tutorial hints; 4 volume buses wired to the synth")
io.open(p, "w", encoding="utf-8", newline="").write(s)

# TDD
p = "TDD.md"
s = io.open(p, encoding="utf-8").read()
s = s.replace(
    "There is **no `src/audio` and no `src/platform`**.",
    "Audio lives in `src/audio/audio.ts` (Web Audio synthesis); there is **no `src/platform`**.",
)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("docs updated for audio")
