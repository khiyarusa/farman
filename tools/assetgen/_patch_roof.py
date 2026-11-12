"""One-off patch: flatten the roof and widen the shoulder so glass sits on the body."""

import io

PATH = "tools/assetgen/vehicles.py"
s = io.open(PATH, encoding="utf-8").read()

old = """        (hw * 0.985, belt),
        (hw * 0.965, belt + (y_top - belt) * 0.16),
        (hw * 0.88, belt + (y_top - belt) * 0.55),
        (hw * 0.855, y_top - 0.015),
        (hw * 0.60, y_top),
        (0.0, y_top),"""
new = """        (hw * 0.99, belt),
        (hw * 0.985, belt + (y_top - belt) * 0.18),
        (hw * 0.96, belt + (y_top - belt) * 0.62),
        (hw * 0.90, y_top - 0.012),
        (hw * 0.58, y_top),
        (0.0, y_top),"""
assert old in s
s = s.replace(old, new)

# Taller body sides, smaller arch lift so the wheels stay visible.
s = s.replace("y_bottom = 0.16 + arch_lift(spec, z)", "y_bottom = 0.20 + arch_lift(spec, z)")
s = s.replace("arch_height: float = 0.30", "arch_height: float = 0.26")

# Glass follows the flatter shoulder.
s = s.replace("parts.append(strip(spec.cabin_start - 0.02, spec.cabin_start + 0.62, 0.80, 0.004, 6))",
              "parts.append(strip(spec.cabin_start - 0.02, spec.cabin_start + 0.62, 0.76, 0.006, 6))")
s = s.replace("parts.append(strip(spec.cabin_end + 0.02, spec.cabin_end - 0.55, 0.80, 0.004, 6))",
              "parts.append(strip(spec.cabin_end + 0.02, spec.cabin_end - 0.55, 0.76, 0.006, 6))")

io.open(PATH, "w", encoding="utf-8", newline="").write(s)
print("patched")
