"""Procedural, licence-free vehicle assets for FARMAN.

Every mesh is generated from a parametric description of the real car's
proportions (length, width, height, wheelbase, track, wheel radius, belt line,
roof line, hood/trunk heights). No external model is used, so the assets are
original work and can ship with the game.

Output: one .glb per vehicle in public/assets/vehicles/.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

import numpy as np

from glb import GLBBuilder, Material, Mesh, box_rounded, loft, merge, revolve, transform

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "vehicles")


@dataclass
class CarSpec:
    id: str
    name: str
    length: float
    width: float
    height: float
    wheelbase: float
    front_track: float
    rear_track: float
    wheel_radius: float
    wheel_width: float
    hood_y: float
    belt_y: float
    roof_y: float
    trunk_y: float
    nose_y: float
    tail_y: float
    cabin_start: float          # z where the windscreen base sits (relative to centre)
    cabin_end: float            # z where the rear glass base sits
    paint: Tuple[float, float, float]
    rim: Tuple[float, float, float]
    body_style: str = "sedan"
    arch_height: float = 0.26
    door_line: float = 0.0
    mirrors: bool = True
    simplified: bool = False
    ride_offset: float = 0.0


SPECS: List[CarSpec] = [
    CarSpec(
        id="pride-131",
        name="Saipa Pride 131",
        length=3.942, width=1.605, height=1.441, wheelbase=2.342,
        front_track=1.39, rear_track=1.35, wheel_radius=0.286, wheel_width=0.165,
        hood_y=0.70, belt_y=0.88, roof_y=1.40, trunk_y=0.76, nose_y=0.54, tail_y=0.60,
        cabin_start=0.92, cabin_end=-0.88,
        paint=(0.88, 0.90, 0.91), rim=(0.62, 0.65, 0.67),
        body_style="sedan", arch_height=0.30,
    ),
    CarSpec(
        id="corolla-e210",
        name="Toyota Corolla E210",
        length=4.63, width=1.78, height=1.435, wheelbase=2.70,
        front_track=1.53, rear_track=1.545, wheel_radius=0.316, wheel_width=0.205,
        hood_y=0.74, belt_y=0.92, roof_y=1.42, trunk_y=0.80, nose_y=0.56, tail_y=0.64,
        cabin_start=0.74, cabin_end=-1.06,
        paint=(0.90, 0.92, 0.92), rim=(0.72, 0.74, 0.76),
        body_style="sedan", arch_height=0.32,
    ),
    CarSpec(
        id="bmw-320i",
        name="BMW 320i G20",
        length=4.709, width=1.827, height=1.435, wheelbase=2.851,
        front_track=1.587, rear_track=1.604, wheel_radius=0.33, wheel_width=0.225,
        hood_y=0.78, belt_y=0.95, roof_y=1.42, trunk_y=0.84, nose_y=0.58, tail_y=0.66,
        cabin_start=0.66, cabin_end=-1.12,
        paint=(0.06, 0.07, 0.075), rim=(0.68, 0.70, 0.72),
        body_style="sedan", arch_height=0.33,
    ),
    # ---- traffic archetypes (simplified, no mirrors or brightwork) ----------
    CarSpec(
        id="traffic-sedan",
        name="Traffic sedan",
        length=4.5, width=1.74, height=1.42, wheelbase=2.62,
        front_track=1.49, rear_track=1.50, wheel_radius=0.305, wheel_width=0.19,
        hood_y=0.9, belt_y=0.92, roof_y=1.38, trunk_y=0.97, nose_y=0.64, tail_y=0.74,
        cabin_start=0.55, cabin_end=-1.1,
        paint=(0.55, 0.56, 0.57), rim=(0.45, 0.46, 0.47),
        simplified=True, mirrors=False,
    ),
    CarSpec(
        id="traffic-van",
        name="Traffic van",
        length=4.9, width=1.86, height=1.95, wheelbase=2.9,
        front_track=1.58, rear_track=1.58, wheel_radius=0.33, wheel_width=0.21,
        hood_y=1.0, belt_y=1.02, roof_y=1.92, trunk_y=1.9, nose_y=0.72, tail_y=1.85,
        cabin_start=1.0, cabin_end=-2.2,
        paint=(0.82, 0.83, 0.82), rim=(0.4, 0.4, 0.4),
        body_style="van", simplified=True, mirrors=False, arch_height=0.34,
    ),
    CarSpec(
        id="traffic-truck",
        name="Traffic truck",
        length=6.4, width=2.2, height=2.6, wheelbase=3.6,
        front_track=1.8, rear_track=1.75, wheel_radius=0.42, wheel_width=0.28,
        hood_y=1.55, belt_y=1.6, roof_y=2.4, trunk_y=2.3, nose_y=1.0, tail_y=2.2,
        cabin_start=2.0, cabin_end=1.35,
        paint=(0.55, 0.2, 0.15), rim=(0.35, 0.35, 0.35),
        body_style="truck", simplified=True, mirrors=False, arch_height=0.42,
    ),
]


def smoothstep(a: float, b: float, x: float) -> float:
    t = max(0.0, min(1.0, (x - a) / (b - a) if b != a else 0.0))
    return t * t * (3 - 2 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def curve(points: List[Tuple[float, float]], z: float) -> float:
    """Piecewise smooth interpolation over (z, value) key points."""
    if z <= points[0][0]:
        return points[0][1]
    if z >= points[-1][0]:
        return points[-1][1]
    for i in range(1, len(points)):
        z0, v0 = points[i - 1]
        z1, v1 = points[i]
        if z <= z1:
            t = smoothstep(z0, z1, z)
            return lerp(v0, v1, t)
    return points[-1][1]


def body_top_z(spec: CarSpec) -> List[Tuple[float, float]]:
    """Top surface height along the length (bumper to bumper)."""
    nose = spec.length / 2
    tail = -spec.length / 2
    pts = [
        (tail, spec.tail_y),
        (tail + 0.18, spec.trunk_y - 0.02),
        (spec.cabin_end - 0.55, spec.trunk_y),
        (spec.cabin_end, spec.belt_y + 0.03),
        (spec.cabin_end + 0.12, spec.roof_y - 0.03),
        (spec.cabin_start + 0.55, spec.roof_y),
        (spec.cabin_start, spec.belt_y + 0.02),
        (spec.cabin_start - 0.55, spec.hood_y),
        (nose - 0.35, spec.hood_y - 0.03),
        (nose - 0.10, spec.nose_y + 0.06),
        (nose, spec.nose_y),
    ]
    if spec.body_style == "van":
        pts = [
            (tail, spec.tail_y),
            (tail + 0.05, spec.roof_y),
            (spec.cabin_end, spec.roof_y),
            (spec.cabin_start + 0.9, spec.roof_y - 0.01),
            (spec.cabin_start, spec.hood_y),
            (nose - 0.2, spec.hood_y - 0.05),
            (nose, spec.nose_y),
        ]
    if spec.body_style == "truck":
        pts = [
            (tail, spec.tail_y),
            (tail + 0.05, spec.roof_y - 0.1),
            (spec.cabin_end, spec.roof_y - 0.75),
            (spec.cabin_start, spec.roof_y),
            (spec.cabin_start + 0.5, spec.roof_y - 0.05),
            (nose, spec.nose_y),
        ]
    pts.sort(key=lambda p: p[0])
    return pts


def arch_lift(spec: CarSpec, z: float) -> float:
    lift = 0.0
    for axle in (spec.wheelbase / 2, -spec.wheelbase / 2):
        d = abs(z - axle)
        span = spec.wheel_radius * 1.85
        if d < span:
            lift = max(lift, spec.arch_height * math.cos((d / span) * math.pi * 0.5))
    return lift


def width_at(spec: CarSpec, z: float) -> float:
    half = spec.width / 2
    nose = spec.length / 2
    tail = -spec.length / 2
    taper_front = smoothstep(nose, nose - 0.55, z)
    taper_rear = smoothstep(tail, tail + 0.45, z)
    return half * lerp(0.80, 1.0, taper_front) * lerp(0.84, 1.0, taper_rear)


def body_ring(spec: CarSpec, z: float, samples: int = 56) -> np.ndarray:
    hw = width_at(spec, z)
    y_top = curve(body_top_z(spec), z)
    y_bottom = 0.20 + arch_lift(spec, z)
    belt = min(spec.belt_y, y_top - 0.02)
    if y_bottom > y_top - 0.08:
        y_bottom = max(0.05, y_top - 0.20)

    # Control points for the right half of the cross-section.
    ctrl = [
        (0.0, y_bottom),
        (hw * 0.55, y_bottom + 0.01),
        (hw * 0.90, y_bottom + (belt - y_bottom) * 0.22),
        (hw * 0.995, y_bottom + (belt - y_bottom) * 0.55),
        (hw * 0.99, belt),
        (hw * 0.985, belt + (y_top - belt) * 0.18),
        (hw * 0.96, belt + (y_top - belt) * 0.62),
        (hw * 0.90, y_top - 0.012),
        (hw * 0.58, y_top),
        (0.0, y_top),
    ]
    # Catmull-Rom resample of the half profile, then mirror.
    half = []
    for i in range(len(ctrl) - 1):
        p0 = ctrl[max(0, i - 1)]
        p1 = ctrl[i]
        p2 = ctrl[i + 1]
        p3 = ctrl[min(len(ctrl) - 1, i + 2)]
        steps = max(2, samples // (len(ctrl) - 1))
        for k in range(steps):
            t = k / steps
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            half.append((x, y))
    half.append(ctrl[-1])

    right = half
    left = [(-x, y) for (x, y) in reversed(half[1:-1])]
    loop = right + left
    pts = np.array(loop, dtype=np.float32)
    # Ring lies in the XY plane at z.
    return np.stack([pts[:, 0], pts[:, 1], np.full(len(pts), z, dtype=np.float32)], axis=1)


def build_body(spec: CarSpec) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    stations = 54 if not spec.simplified else 24
    zs = np.linspace(-spec.length / 2, spec.length / 2, stations)
    rings = [body_ring(spec, float(z)) for z in zs]
    return loft(rings, close_ring=True, cap_ends=True)


def build_glass(spec: CarSpec):
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

    # windshield glass is part of the body surface (painted)
    # rear glass is part of the body surface (painted)

    cabin_len = spec.cabin_start - spec.cabin_end
    if spec.body_style not in ("van", "truck"):
        za = spec.cabin_start + 0.16
        zm = spec.cabin_end + cabin_len * 0.5
        zb = spec.cabin_end - 0.04
        for side in (-1, 1):
            for (z0, z1) in ((za, zm), (zm + 0.06, zb)):
                y_belt = min(spec.belt_y + 0.01, curve(top_curve, z0) - 0.03)
                y_belt_b = min(spec.belt_y + 0.01, curve(top_curve, z1) - 0.03)
                y_top = spec.roof_y - 0.085
                hw0 = width_at(spec, z0) * 0.972
                hw1 = width_at(spec, z1) * 0.972
                hw0t = width_at(spec, z0) * 0.865
                hw1t = width_at(spec, z1) * 0.865
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


def build_wheel(spec: CarSpec, segments: int = 28):
    r = spec.wheel_radius
    w = spec.wheel_width
    tire_profile = [
        (r * 0.66, -w / 2),
        (r * 0.90, -w / 2),
        (r * 0.985, -w * 0.34),
        (r, -w * 0.12),
        (r, w * 0.12),
        (r * 0.985, w * 0.34),
        (r * 0.90, w / 2),
        (r * 0.66, w / 2),
    ]
    tire = revolve(tire_profile, segments, axis="x")
    rim_profile = [
        (r * 0.30, -w * 0.10),
        (r * 0.62, -w * 0.16),
        (r * 0.68, -w * 0.06),
        (r * 0.68, w * 0.10),
        (r * 0.40, w * 0.14),
        (r * 0.24, w * 0.10),
    ]
    rim = revolve(rim_profile, segments, axis="x")
    disc = revolve(
        [(r * 0.18, -w * 0.02), (r * 0.56, -w * 0.04), (r * 0.56, w * 0.02), (r * 0.18, w * 0.02)],
        segments,
        axis="x",
    )
    return tire, rim, disc


def build_lights(spec: CarSpec):
    nose = spec.length / 2
    tail = -spec.length / 2
    hw = width_at(spec, nose * 0.98)
    front = []
    rear = []
    for side in (-1, 1):
        x = side * hw * 0.62
        front.append(
            box_rounded(0.36, 0.13, 0.06, radius=0.03, center=(x, spec.hood_y - 0.10, nose - 0.015))
        )
        rear.append(
            box_rounded(0.34, 0.14, 0.05, radius=0.03, center=(side * hw * 0.64, spec.tail_y - 0.02, tail + 0.015))
        )
    grille = box_rounded(spec.width * 0.30, 0.16, 0.05, radius=0.03, center=(0.0, spec.nose_y + 0.02, nose - 0.012))
    return merge(front), merge(rear), grille


def build_trim(spec: CarSpec):
    parts = []
    nose = spec.length / 2
    tail = -spec.length / 2
    # Front and rear bumper bands.
    parts.append(box_rounded(spec.width * 0.94, 0.20, 0.10, radius=0.05, center=(0.0, spec.nose_y - 0.12, nose - 0.03)))
    parts.append(box_rounded(spec.width * 0.94, 0.20, 0.10, radius=0.05, center=(0.0, spec.tail_y - 0.14, tail + 0.03)))
    # Rocker panels.
    for side in (-1, 1):
        parts.append(
            box_rounded(0.06, 0.10, spec.wheelbase * 1.15, radius=0.02,
                        center=(side * width_at(spec, 0.0) * 0.985, 0.24, 0.0))
        )
    # Plates.
    parts.append(box_rounded(0.34, 0.11, 0.012, radius=0.006, center=(0.0, spec.nose_y - 0.16, nose + 0.001)))
    parts.append(box_rounded(0.34, 0.11, 0.012, radius=0.006, center=(0.0, spec.tail_y - 0.18, tail - 0.001)))
    return merge(parts)


def build_mirrors(spec: CarSpec):
    parts = []
    z = spec.cabin_start + 0.12
    hw = width_at(spec, z)
    for side in (-1, 1):
        parts.append(box_rounded(0.16, 0.10, 0.09, radius=0.02, center=(side * (hw + 0.06), spec.belt_y + 0.06, z)))
        parts.append(box_rounded(0.09, 0.04, 0.03, radius=0.01, center=(side * (hw + 0.01), spec.belt_y + 0.04, z)))
    return merge(parts)


def make_materials(builder: GLBBuilder, spec: CarSpec) -> Dict[str, str]:
    m = {
        "paint": Material("farfan_paint", base_color=(*spec.paint, 1.0), metallic=0.12, roughness=0.32, clearcoat=1.0, clearcoat_roughness=0.06),
        "glass": Material("farfan_glass", base_color=(0.10, 0.13, 0.14, 1.0), metallic=0.0, roughness=0.08, alpha_mode="BLEND", alpha=0.38, double_sided=True),
        "rubber": Material("farfan_rubber", base_color=(0.018, 0.018, 0.02, 1.0), metallic=0.0, roughness=0.92),
        "rim": Material("farfan_rim", base_color=(*spec.rim, 1.0), metallic=1.0, roughness=0.22),
        "disc": Material("farfan_brake", base_color=(0.28, 0.28, 0.29, 1.0), metallic=0.9, roughness=0.45),
        "chrome": Material("farfan_chrome", base_color=(0.75, 0.77, 0.78, 1.0), metallic=1.0, roughness=0.12),
        "trim": Material("farfan_trim", base_color=(0.035, 0.038, 0.04, 1.0), metallic=0.1, roughness=0.65),
        "light_front": Material("farfan_headlight", base_color=(0.92, 0.93, 0.9, 1.0), metallic=0.1, roughness=0.08, emissive=(0.35, 0.34, 0.3)),
        "light_rear": Material("farfan_brake", base_color=(0.45, 0.03, 0.03, 1.0), metallic=0.1, roughness=0.2, emissive=(0.45, 0.03, 0.02)),
        "plate": Material("farfan_plate", base_color=(0.86, 0.87, 0.85, 1.0), metallic=0.0, roughness=0.5),
    }
    for mat in m.values():
        builder.material(mat)
    return {k: v.name for k, v in m.items()}


def build_car(spec: CarSpec, out_dir: str) -> str:
    builder = GLBBuilder(f"FARMAN vehicle generator — {spec.name}")
    mats = make_materials(builder, spec)

    body = build_body(spec)
    builder.add(Mesh("body", body[0], body[1], body[2], body[3], mats["paint"]))

    glass = build_glass(spec)
    builder.add(Mesh("glass", glass[0], glass[1], glass[2], glass[3], mats["glass"]))

    front, rear, grille = build_lights(spec)
    builder.add(Mesh("lights_front", front[0], front[1], front[2], front[3], mats["light_front"]))
    builder.add(Mesh("lights_rear", rear[0], rear[1], rear[2], rear[3], mats["light_rear"]))
    builder.add(Mesh("grille", grille[0], grille[1], grille[2], grille[3], mats["trim"]))

    trim = build_trim(spec)
    builder.add(Mesh("trim", trim[0], trim[1], trim[2], trim[3], mats["trim"]))

    if spec.mirrors:
        mirrors = build_mirrors(spec)
        builder.add(Mesh("mirrors", mirrors[0], mirrors[1], mirrors[2], mirrors[3], mats["paint"]))

    # Wheels as separate nodes so they can spin, steer and follow suspension.
    anchors = [
        ("wheel_fl", -spec.front_track / 2, spec.wheelbase / 2),
        ("wheel_fr", spec.front_track / 2, spec.wheelbase / 2),
        ("wheel_rl", -spec.rear_track / 2, -spec.wheelbase / 2),
        ("wheel_rr", spec.rear_track / 2, -spec.wheelbase / 2),
    ]
    tire, rim, disc = build_wheel(spec, 20 if spec.simplified else 28)
    for (name, x, z) in anchors:
        builder.add(Mesh(f"{name}_tire", tire[0], tire[1], tire[2], tire[3], mats["rubber"], parent=name))
        builder.add(Mesh(f"{name}_rim", rim[0], rim[1], rim[2], rim[3], mats["rim"], parent=name))
        builder.add(Mesh(f"{name}_disc", disc[0], disc[1], disc[2], disc[3], mats["disc"], parent=name))
        # Parent node translation is applied by the caller through the node name.
        # glTF nodes created by GLBBuilder do not know the wheel position, so encode
        # it in the mesh translations (they are all identical and local to the node).
        for mesh in builder.meshes[-3:]:
            mesh.translation = (0.0, 0.0, 0.0)

    # Move the wheel parent nodes into place by adding a translation after build.
    data = builder.build()
    data = _translate_wheel_nodes(data, {
        "wheel_fl": (-spec.front_track / 2, spec.wheel_radius, spec.wheelbase / 2),
        "wheel_fr": (spec.front_track / 2, spec.wheel_radius, spec.wheelbase / 2),
        "wheel_rl": (-spec.rear_track / 2, spec.wheel_radius, -spec.wheelbase / 2),
        "wheel_rr": (spec.rear_track / 2, spec.wheel_radius, -spec.wheelbase / 2),
    })

    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{spec.id}.glb")
    with open(path, "wb") as fh:
        fh.write(data)
    return path


def _translate_wheel_nodes(glb_bytes: bytes, positions: Dict[str, Tuple[float, float, float]]) -> bytes:
    """Injects translations for named parent nodes into an already-built GLB."""
    import json
    import struct

    magic, version, total = struct.unpack_from("<III", glb_bytes, 0)
    json_len, json_type = struct.unpack_from("<II", glb_bytes, 12)
    json_start = 20
    doc = json.loads(glb_bytes[json_start:json_start + json_len].decode("utf-8").rstrip(" \x00"))
    for node in doc.get("nodes", []):
        name = node.get("name")
        if name in positions and "mesh" not in node:
            node["translation"] = list(positions[name])
    new_json = json.dumps(doc, separators=(",", ":")).encode("utf-8")
    pad = (-len(new_json)) % 4
    new_json += b" " * pad
    bin_start = json_start + json_len
    bin_len, bin_type = struct.unpack_from("<II", glb_bytes, bin_start)
    bin_chunk = glb_bytes[bin_start:bin_start + 8 + bin_len]
    out_total = 12 + 8 + len(new_json) + len(bin_chunk)
    out = struct.pack("<III", magic, version, out_total)
    out += struct.pack("<II", len(new_json), json_type) + new_json
    out += bin_chunk
    return out


def main() -> None:
    out_dir = os.path.abspath(OUT_DIR)
    total = 0
    for spec in SPECS:
        path = build_car(spec, out_dir)
        size = os.path.getsize(path)
        total += size
        print(f"  {spec.id:16s} {size/1024:7.1f} KiB  {os.path.basename(path)}")
    print(f"vehicles: {len(SPECS)} files, {total/1024/1024:.2f} MiB")


if __name__ == "__main__":
    main()
