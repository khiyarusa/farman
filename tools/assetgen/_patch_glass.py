"""One-off patch: make glass conform to the body surface and fix paint response."""

import io

PATH = "tools/assetgen/vehicles.py"
s = io.open(PATH, encoding="utf-8").read()

s = s.replace(
    "metallic=0.85, roughness=0.24, clearcoat=1.0",
    "metallic=0.12, roughness=0.32, clearcoat=1.0",
)

start = s.index("def build_glass(spec: CarSpec):")
end = s.index("def build_wheel(spec: CarSpec")

new = '''def build_glass(spec: CarSpec):
    """Glass panels that conform to the body surface (no floating slabs)."""
    top_curve = body_top_z(spec)
    parts = []

    def strip(z0: float, z1: float, x_scale: float, y_lift: float, steps: int):
        pts = []
        for k in range(steps + 1):
            t = k / steps
            z = z0 + (z1 - z0) * t
            y = curve(top_curve, z) + y_lift
            hw = width_at(spec, z) * x_scale
            pts.append((z, y, hw))
        positions = []
        normals = []
        uvs = []
        indices = []
        for k, (z, y, hw) in enumerate(pts):
            positions += [(-hw, y, z), (hw, y, z)]
            normals += [(0, 1, 0), (0, 1, 0)]
            uvs += [(0, k / steps), (1, k / steps)]
        for k in range(steps):
            a = k * 2
            indices += [a, a + 2, a + 3, a, a + 3, a + 1]
        return (
            np.asarray(positions, dtype=np.float32),
            np.asarray(normals, dtype=np.float32),
            np.asarray(uvs, dtype=np.float32),
            np.asarray(indices, dtype=np.uint32),
        )

    parts.append(strip(spec.cabin_start - 0.02, spec.cabin_start + 0.62, 0.80, 0.004, 6))
    parts.append(strip(spec.cabin_end + 0.02, spec.cabin_end - 0.55, 0.80, 0.004, 6))

    cabin_len = spec.cabin_start - spec.cabin_end
    if spec.body_style not in ("van", "truck"):
        za = spec.cabin_start + 0.16
        zm = spec.cabin_end + cabin_len * 0.5
        zb = spec.cabin_end - 0.04
        for side in (-1, 1):
            for (z0, z1) in ((za, zm), (zm + 0.06, zb)):
                y_belt = min(spec.belt_y + 0.01, curve(top_curve, z0) - 0.03)
                y_belt_b = min(spec.belt_y + 0.01, curve(top_curve, z1) - 0.03)
                y_top = spec.roof_y - 0.035
                hw0 = width_at(spec, z0) * 0.972
                hw1 = width_at(spec, z1) * 0.972
                hw0t = width_at(spec, z0) * 0.80
                hw1t = width_at(spec, z1) * 0.80
                parts.append((
                    np.asarray([
                        [side * hw0, y_belt, z0],
                        [side * hw1, y_belt_b, z1],
                        [side * hw1t, y_top, z1],
                        [side * hw0t, y_top, z0],
                    ], dtype=np.float32),
                    np.tile(np.asarray([side * 0.97, 0.12, 0.0], dtype=np.float32), (4, 1)),
                    np.asarray([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32),
                    np.asarray([0, 1, 2, 0, 2, 3] if side > 0 else [0, 2, 1, 0, 3, 2], dtype=np.uint32),
                ))
    return merge(parts)


'''

s = s[:start] + new + s[end:]
io.open(PATH, "w", encoding="utf-8", newline="").write(s)
print("patched", PATH)
