import io

p = "src/rendering/worldScene.ts"
s = io.open(p, encoding="utf-8").read()
s = s.replace("density: 0.0013", "density: 0.00045")
s = s.replace("color: '#aebfc7'", "color: '#9fb6c4'")
s = s.replace("this.scene.fogDensity = kind === 'rain' ? 0.005 : 0.0013;", "this.scene.fogDensity = kind === 'rain' ? 0.0035 : 0.00045;")
io.open(p, "w", encoding="utf-8", newline="").write(s)

p = "src/rendering/environment.ts"
s = io.open(p, encoding="utf-8").read()
tinted = "0.52, 0.60, 0.70" in s
s = s.replace("mat.emissiveColor = new Color3(1, 1, 1);", "mat.emissiveColor = new Color3(0.52, 0.60, 0.70);")
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("fog patched; tint already present:", tinted)
