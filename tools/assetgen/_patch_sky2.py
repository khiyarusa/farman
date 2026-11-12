"""Steepen the sky gradient and front-light the scene."""

import io

p = "tools/assetgen/sky.py"
s = io.open(p, encoding="utf-8").read()
s = s.replace("sky_t = np.clip(y / 0.5, 0, 1)", "sky_t = np.clip(y / 0.5, 0, 1) ** 0.42")
s = s.replace("band = np.exp(-((y - 0.34) / 0.13) ** 2)", "band = np.exp(-((y - 0.30) / 0.10) ** 2)")
s = s.replace("haze_band = np.exp(-((y - 0.5) / 0.05) ** 2) * haze", "haze_band = np.exp(-((y - 0.5) / 0.035) ** 2) * haze")
io.open(p, "w", encoding="utf-8", newline="").write(s)

p = "src/rendering/worldScene.ts"
s = io.open(p, encoding="utf-8").read()
s = s.replace("sunDirection: new Vector3(-0.55, -1, -0.42)", "sunDirection: new Vector3(0.42, -1, -0.72)")
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("sky patched")
