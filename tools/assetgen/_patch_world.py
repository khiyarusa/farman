"""Patch world.py: batch props/vegetation into merged meshes and fix prop orientation."""

import io

PATH = "tools/assetgen/world.py"
s = io.open(PATH, encoding="utf-8").read()

start = s.index("def building_block(")
end = s.index("def circle_ring(")

new = '''class Batch:
    """Collects geometry per material and emits one merged mesh per material."""

    def __init__(self) -> None:
        self.parts: Dict[str, list] = {}

    def add(self, material: str, part) -> None:
        self.parts.setdefault(material, []).append(part)

    def flush(self, builder: GLBBuilder, prefix: str) -> None:
        for i, (mat, parts) in enumerate(self.parts.items()):
            if not parts:
                continue
            merged = merge(parts)
            builder.add(Mesh(f"{prefix}_{mat}_{i}", merged[0], merged[1], merged[2], merged[3], mat))


def box_at(w: float, h: float, d: float, x: float, y: float, z: float, rot: float = 0.0, radius: float = 0.06):
    part = box_rounded(w, h, d, radius=radius)
    return transform(part, rotate_y=rot, translate=(x, y, z))


def build_city(batch: Batch, mats: Dict[str, str], heights: np.ndarray) -> None:
    facade_mats = [mats["facade_a"], mats["facade_b"], mats["facade_c"]]
    k = 0
    for bx in range(-2, 3):
        for bz in range(-2, 3):
            cx = bx * 140.0
            cz = bz * 140.0
            if abs(cx) > 300 or abs(cz) > 300:
                continue
            for slot in range(4):
                ox = ((slot % 2) - 0.5) * 52 + (10 if slot % 2 else -10)
                oz = ((slot // 2) - 0.5) * 52 + (9 if slot // 2 else -9)
                x = cx + ox
                z = cz + oz
                if min(abs(z), abs(x)) < 30 or abs(x) > 330 or abs(z) > 330:
                    continue
                w = 18 + (k * 7) % 16
                d = 16 + (k * 5) % 14
                h = 9 + ((k * 13) % 30)
                y = sample_height(heights, x, z)
                mat = facade_mats[k % 3]
                batch.add(mat, box_at(w, h, d, x, y + h / 2, z, radius=0.35))
                batch.add(mats["shop"], box_at(w + 0.35, 3.4, d + 0.35, x, y + 1.7, z, radius=0.2))
                k += 1


def build_props(batch: Batch, mats: Dict[str, str], heights: np.ndarray) -> None:
    # Street lights along the main avenue.
    for i in range(-9, 10):
        x = i * 40.0
        z = 10.6
        y = sample_height(heights, x, z)
        batch.add(mats["metal"], box_at(0.16, 7.0, 0.16, x, y + 3.5, z, radius=0.03))
        batch.add(mats["metal"], box_at(1.6, 0.12, 0.14, x - 0.75, y + 6.9, z, radius=0.02))
        batch.add(mats["lamp"], box_at(0.5, 0.14, 0.3, x - 1.45, y + 6.82, z, radius=0.02))

    # Fuel station on the city link road.
    sx, sz = 470.0, 64.0
    sy = sample_height(heights, sx, sz)
    batch.add(mats["concrete"], box_at(18, 0.8, 13, sx, sy + 5.3, sz, radius=0.2))
    for dx in (-6.5, 6.5):
        for dz in (-4.5, 4.5):
            batch.add(mats["metal"], box_at(0.5, 5.2, 0.5, sx + dx, sy + 2.6, sz + dz, radius=0.05))
    batch.add(mats["shop"], box_at(10, 4.4, 8, sx + 15, sy + 2.2, sz - 3, radius=0.2))
    for dx in (-2.5, 2.5):
        batch.add(mats["metal"], box_at(0.9, 1.8, 0.7, sx + dx, sy + 0.9, sz, radius=0.08))

    # Direction signs: textured double-sided panels on two posts.
    sign_specs = [
        (545, 150, "sign_tehran", 0.6),
        (985, 655, "sign_chalus", -0.5),
        (1125, 765, "sign_police", 0.9),
    ]
    for (x, z, mat, rot) in sign_specs:
        y = sample_height(heights, x, z)
        for dx in (-2.2, 2.2):
            px = x + dx * math.cos(rot)
            pz = z - dx * math.sin(rot)
            batch.add(mats["metal"], box_at(0.18, 5.0, 0.18, px, y + 2.5, pz, radius=0.03))
        panel = quad((-3.1, 0, 0), (3.1, 0, 0), (3.1, 1.9, 0), (-3.1, 1.9, 0), (0, 0, 1))
        panel = transform(panel, rotate_y=rot + math.pi, translate=(x, y + 3.6, z))
        batch.add(mats[mat], panel)
        backing = box_at(6.2, 1.9, 0.1, 0, 0, 0)
        backing = transform(backing, rotate_y=rot, translate=(x, y + 4.55, z))
        batch.add(mats["metal"], backing)

    # Tunnel gallery on the mountain pass.
    tx, tz = 1150.0, 1045.0
    for k in range(11):
        z = tz - 22 + k * 4.4
        y = sample_height(heights, tx, z)
        for side in (-1, 1):
            batch.add(mats["concrete"], box_at(0.9, 5.4, 4.7, tx + side * 5.1, y + 2.7, z, radius=0.1))
        batch.add(mats["concrete"], box_at(11.4, 0.8, 4.7, tx, y + 5.5, z, radius=0.1))
    portal_y = sample_height(heights, tx, tz - 24)
    batch.add(mats["concrete"], box_at(13.5, 7.6, 1.4, tx, portal_y + 3.8, tz - 24, radius=0.25))

    # Bridge deck over the dry river bed.
    bx, bz = 332.0, 706.0
    by = sample_height(heights, bx, bz) + 1.1
    batch.add(mats["concrete"], box_at(10.5, 1.0, 58, bx, by, bz, radius=0.15))
    for side in (-1, 1):
        for k in range(12):
            z = bz - 27 + k * 4.8
            batch.add(mats["metal"], box_at(0.16, 1.2, 0.16, bx + side * 4.7, by + 1.1, z, radius=0.02))
        batch.add(mats["metal"], box_at(0.18, 0.18, 56, bx + side * 4.7, by + 1.65, bz, radius=0.02))

    # Parking area near the city centre.
    px, pz = 95.0, 74.0
    py = sample_height(heights, px, pz)
    batch.add(mats["concrete"], box_at(36, 0.14, 28, px, py + 0.07, pz, radius=0.1))


def build_vegetation(batch: Batch, mats: Dict[str, str], heights: np.ndarray) -> None:
    rng = np.random.default_rng(4242)
    for _ in range(380):
        x = float(rng.uniform(-1200, 1400))
        z = float(rng.uniform(560, 1650))
        h = sample_height(heights, x, z)
        if h > 170:
            continue
        scale = float(rng.uniform(0.8, 1.5))
        batch.add(mats["bark"], box_at(0.34 * scale, 3.4 * scale, 0.34 * scale, x, h + 1.7 * scale, z, radius=0.06))
        for layer in range(2):
            r = (2.5 - layer * 0.8) * scale
            y0 = h + (2.3 + layer * 1.7) * scale
            cone = loft(
                [
                    circle_ring(x, y0, z, r * 0.30),
                    circle_ring(x, y0 + 1.7 * scale, z, r),
                    circle_ring(x, y0 + 3.5 * scale, z, r * 0.12),
                ],
                close_ring=True,
                cap_ends=True,
            )
            batch.add(mats["leaf"], cone)


'''

s = s[:start] + new + s[end:]

# main(): switch props/vegetation to batched builders
s = s.replace('''    pb.material(Material("sign_police", base_color=(1, 1, 1, 1), roughness=0.55, texture_png=tex("sign-police.png")))
    build_city(pb, mats, heights)
    build_props(pb, mats, heights)
    pb.write(os.path.join(OUT, "props.glb"))''',
'''    pb.material(Material("sign_police", base_color=(1, 1, 1, 1), roughness=0.55, texture_png=tex("sign-police.png")))
    pb.material(Material("lamp", base_color=(1.0, 0.95, 0.82, 1), metallic=0.2, roughness=0.3, emissive=(0.35, 0.32, 0.26)))
    props = Batch()
    build_city(props, mats, heights)
    build_props(props, mats, heights)
    props.flush(pb, "props")
    pb.write(os.path.join(OUT, "props.glb"))''')

s = s.replace('''    vb.material(Material("leaf", base_color=(0.16, 0.30, 0.15, 1), roughness=0.9))
    build_vegetation(vb, {"bark": "bark", "leaf": "leaf"}, heights)
    vb.write(os.path.join(OUT, "vegetation.glb"))''',
'''    vb.material(Material("leaf", base_color=(0.16, 0.30, 0.15, 1), roughness=0.9))
    veg = Batch()
    build_vegetation(veg, {"bark": "bark", "leaf": "leaf"}, heights)
    veg.flush(vb, "veg")
    vb.write(os.path.join(OUT, "vegetation.glb"))''')

# orientation of guardrails along the road
s = s.replace('''                    rail_parts.append(box_rounded(0.12, 0.32, 4.0, radius=0.03, center=(px, y + 0.72, pz)))
                    pole_parts.append(box_rounded(0.10, 0.85, 0.10, radius=0.02, center=(px, y + 0.38, pz)))''',
'''                    heading = math.atan2(dx, dz)
                    rail = box_rounded(0.14, 0.32, 4.2, radius=0.03)
                    rail_parts.append(transform(rail, rotate_y=heading, translate=(px, y + 0.72, pz)))
                    pole_parts.append(box_rounded(0.11, 0.85, 0.11, radius=0.02, center=(px, y + 0.38, pz)))''')

# road mesh must not call .index() inside the loop
s = s.replace('''            idx = path.points.index((x, y, z))
            p0 = path.points[max(0, idx - 1)]''',
'''            idx = len(left)
            p0 = path.points[max(0, idx - 1)]''')

io.open(PATH, "w", encoding="utf-8", newline="").write(s)
print("patched world.py")
