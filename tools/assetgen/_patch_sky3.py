import io

p = "tools/assetgen/sky.py"
s = io.open(p, encoding="utf-8").read()
s = s.replace("sky_t = np.clip(y / 0.5, 0, 1) ** 0.42", "sky_t = np.clip(y / 0.5, 0, 1) ** 1.9")
s = s.replace(
    "sky((46, 84, 138), (150, 176, 196), (104, 92, 78)",
    "sky((38, 78, 132), (118, 150, 176), (104, 92, 78)",
)
s = s.replace("0.55, 0.35, \"sky-day.png\"", "0.55, 0.12, \"sky-day.png\"")
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("sky gradient patched")
