"""One-off patch: improve cabin proportions and paint response for the car generator."""

import io

PATH = "tools/assetgen/vehicles.py"
s = io.open(PATH, encoding="utf-8").read()

# --- proportions -----------------------------------------------------------
s = s.replace(
    """        hood_y=0.92, belt_y=0.90, roof_y=1.40, trunk_y=0.95, nose_y=0.66, tail_y=0.74,
        cabin_start=0.52, cabin_end=-1.05,""",
    """        hood_y=0.80, belt_y=0.84, roof_y=1.40, trunk_y=0.86, nose_y=0.62, tail_y=0.66,
        cabin_start=0.92, cabin_end=-0.88,""",
)
s = s.replace(
    """        hood_y=0.94, belt_y=0.95, roof_y=1.42, trunk_y=1.0, nose_y=0.66, tail_y=0.76,
        cabin_start=0.62, cabin_end=-1.18,""",
    """        hood_y=0.86, belt_y=0.90, roof_y=1.42, trunk_y=0.92, nose_y=0.62, tail_y=0.70,
        cabin_start=0.74, cabin_end=-1.06,""",
)
s = s.replace(
    """        hood_y=0.95, belt_y=0.98, roof_y=1.42, trunk_y=1.0, nose_y=0.68, tail_y=0.78,
        cabin_start=0.58, cabin_end=-1.22,""",
    """        hood_y=0.90, belt_y=0.94, roof_y=1.42, trunk_y=0.95, nose_y=0.64, tail_y=0.72,
        cabin_start=0.66, cabin_end=-1.12,""",
)

# Roof should be wider relative to the body, and the shoulder softer.
s = s.replace("(hw * 0.86, belt + (y_top - belt) * 0.55),", "(hw * 0.88, belt + (y_top - belt) * 0.55),")
s = s.replace("(hw * 0.80, y_top - 0.015),", "(hw * 0.855, y_top - 0.015),")
s = s.replace("(hw * 0.55, y_top),", "(hw * 0.60, y_top),")

# --- paint material response ----------------------------------------------
s = s.replace(
    'mat.metallic = 0.82;\n  mat.roughness = 0.28;',
    'mat.metallic = 0.22;\n  mat.roughness = 0.32;',
)
io.open(PATH, "w", encoding="utf-8", newline="").write(s)

# runtime paint material (TypeScript)
tspath = "src/rendering/vehicleView.ts"
ts = io.open(tspath, encoding="utf-8").read()
ts = ts.replace("  mat.metallic = 0.82;\n  mat.roughness = 0.28;", "  mat.metallic = 0.22;\n  mat.roughness = 0.32;")
io.open(tspath, "w", encoding="utf-8", newline="").write(ts)
print("patched")
