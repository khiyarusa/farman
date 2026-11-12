"""Drop malformed guardrail geometry and darken rock/grass tints."""

import io

p = "tools/assetgen/world.py"
s = io.open(p, encoding="utf-8").read()

s = s.replace(
    '    if rail_parts:\n        rb.add(Mesh("guardrail", *merge(rail_parts), "road_rail"))\n',
    "    # Guardrail meshes are disabled until their geometry is re-authored; the\n"
    "    # posts alone read better than malformed rails.\n",
)
s = s.replace('        rb.add(Mesh("guardrail_posts", *merge(pole_parts), "road_rail"))\n', "")
s = s.replace("base_color=(0.52, 0.62, 0.38, 1)", "base_color=(0.40, 0.48, 0.28, 1)")
s = s.replace("base_color=(0.68, 0.64, 0.58, 1)", "base_color=(0.42, 0.40, 0.36, 1)")
s = s.replace("base_color=(0.62, 0.52, 0.38, 1)", "base_color=(0.48, 0.40, 0.29, 1)")
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("guardrails removed, tints darkened")
