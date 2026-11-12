"""Tune lighting, fog and sky palette for a less washed-out image."""

import io

# --- sky palette ----------------------------------------------------------
p = "tools/assetgen/sky.py"
s = io.open(p, encoding="utf-8").read()
s = s.replace(
    "sky((70, 118, 168), (196, 212, 220), (120, 108, 92)",
    "sky((46, 84, 138), (150, 176, 196), (104, 92, 78)",
)
s = s.replace("sky((48, 56, 74), (156, 120, 96)", "sky((30, 38, 56), (140, 104, 82)")
s = s.replace("sky((96, 104, 110), (168, 176, 180)", "sky((82, 90, 98), (146, 156, 162)")
io.open(p, "w", encoding="utf-8", newline="").write(s)

# --- image processing -----------------------------------------------------
p = "src/rendering/environment.ts"
s = io.open(p, encoding="utf-8").read()
s = s.replace("ip.exposure = 1.05;", "ip.exposure = 0.92;")
s = s.replace("ip.contrast = 1.06;", "ip.contrast = 1.14;")
io.open(p, "w", encoding="utf-8", newline="").write(s)

# --- world env ------------------------------------------------------------
p = "src/rendering/worldScene.ts"
s = io.open(p, encoding="utf-8").read()
s = s.replace("sunIntensity: 2.1,", "sunIntensity: 2.6,")
s = s.replace("ambientIntensity: 0.28,", "ambientIntensity: 0.18,")
s = s.replace("fog: { color: '#c2cfd5', density: 0.0022 }", "fog: { color: '#aebfc7', density: 0.0013 }")
s = s.replace(
    "palette: { top: '#5d87ad', horizon: '#c9d6dd', ground: '#4a4238', sun: '#fff3d6' }",
    "palette: { top: '#3f6f96', horizon: '#a9bcc7', ground: '#4a4238', sun: '#fff3d6' }",
)
s = s.replace("this.scene.fogDensity = kind === 'rain' ? 0.006 : 0.0016;", "this.scene.fogDensity = kind === 'rain' ? 0.005 : 0.0013;")
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("lighting patched")
