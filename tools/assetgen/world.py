"""Procedural Iranian-inspired region for FARMAN.

Builds one connected, drivable region (roughly 3.6 km × 3.6 km):
  • a city grid with sidewalks, buildings, shopfronts and a parking area
  • a dual-carriageway highway with guardrails and signage
  • a mountain pass with hairpins, a rock gallery/tunnel and a bridge
  • a rural road through a Caspian-style forest village

Outputs into public/assets/world/: terrain.glb, roads.glb, props.glb,
vegetation.glb, terrain-height.bin and world.json.
"""

from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image

from glb import GLBBuilder, Material, Mesh, box_rounded, loft, merge, quad, transform
from textures import asphalt as tex_asphalt, concrete as tex_concrete, dirt as tex_dirt, grass as tex_grass, rock as tex_rock

HERE = os.path.dirname(__file__)
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "public", "assets", "world"))
TEX = os.path.abspath(os.path.join(HERE, "..", "..", "public", "assets", "textures"))

SIZE = 3600.0
HEIGHT_RES = 385
TERRAIN_RES = 193


# --------------------------------------------------------------------------
# Height field
# --------------------------------------------------------------------------

def smoothstep(a: float, b: float, x: float) -> float:
    t = max(0.0, min(1.0, (x - a) / (b - a) if b != a else 0.0))
    return t * t * (3 - 2 * t)


def base_height(x: float, z: float) -> float:
    h = 0.0
    # Mountain range to the north.
    h += 235.0 * smoothstep(520, 1720, z) ** 1.35
    # Eastern ridge.
    h += 105.0 * math.exp(-(((x - 1320) ** 2 + (z - 980) ** 2) / (2 * 320 ** 2)))
    # Low rolling hills.
    h += 5.5 * math.sin(x / 175.0) * math.cos(z / 205.0)
    h += 3.0 * math.sin((x + z) / 95.0)
    # River bed for the bridge.
    h -= 9.0 * math.exp(-(((x - 330) ** 2 + (z - 715) ** 2) / (2 * 55 ** 2)))
    # Flatten the city plain.
    r = math.hypot(x, z)
    h *= smoothstep(380, 720, r)
    return h


# --------------------------------------------------------------------------
# Roads
# --------------------------------------------------------------------------

@dataclass
class Road:
    id: str
    name: str
    kind: str
    width: float
    lanes: int
    pts: List[Tuple[float, float]]
    sidewalk: bool = False
    guardrail: bool = False


ROADS: List[Road] = [
    Road("city-main", "خیابان اصلی", "urban", 14, 4, [(-380, 0), (-180, 0), (0, 0), (200, 0), (400, 0)], sidewalk=True),
    Road("city-north", "خیابان شمالی", "urban", 12, 2, [(-370, -280), (-120, -280), (120, -280), (370, -280)], sidewalk=True),
    Road("city-south", "خیابان جنوبی", "urban", 12, 2, [(-370, 280), (0, 280), (370, 280)], sidewalk=True),
    Road("city-west", "بلوار غربی", "urban", 12, 2, [(-280, -370), (-280, 0), (-280, 370)], sidewalk=True),
    Road("city-east", "بلوار شرقی", "urban", 12, 2, [(280, -370), (280, 0), (280, 370)], sidewalk=True),
    Road("city-link", "مسیر فرودگاه", "urban", 10, 2, [(400, 0), (470, 40), (520, 120)], sidewalk=True),
    Road("highway", "بزرگراه شمال", "highway", 22, 6, [(520, 120), (640, 260), (760, 420), (900, 560), (1030, 680)], guardrail=True),
    Road("mountain-1", "گردنه چالوس", "mountain", 9, 2, [(1030, 680), (1120, 760), (1080, 880), (1180, 980), (1120, 1100), (1020, 1200)], guardrail=True),
    Road("mountain-2", "پیچ‌های جنگلی", "mountain", 8, 2, [(1020, 1200), (920, 1300), (980, 1400), (880, 1500), (760, 1560)], guardrail=True),
    Road("rural", "جاده روستایی", "rural", 8, 2, [(0, 360), (110, 470), (240, 570), (330, 700), (430, 810), (560, 880)]),
    Road("village", "خیابان روستا", "rural", 7, 2, [(520, 860), (560, 960), (600, 1060)]),
]

SPAWNS = {
    "city-center": ("city-main", 0.0, 0.0),
    "city-parking": ("city-main", 0.62, 1.0),
    "city-traffic": ("city-main", 0.25, 1.0),
    "highway-braking": ("highway", 0.35, 1.0),
    "highway-time": ("highway", 0.1, 1.0),
    "mountain-hillstart": ("mountain-1", 0.35, 1.0),
    "mountain-wet": ("mountain-2", 0.3, 1.0),
    "rural-eco": ("rural", 0.35, 1.0),
}


def catmull(points: List[Tuple[float, float]], samples_per_seg: int = 24) -> List[Tuple[float, float]]:
    pts = [points[0]] + points + [points[-1]]
    out: List[Tuple[float, float]] = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(samples_per_seg):
            t = k / samples_per_seg
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            z = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, z))
    out.append(points[-1])
    return out


def resample(points: List[Tuple[float, float]], spacing: float = 4.0) -> List[Tuple[float, float]]:
    out = [points[0]]
    acc = 0.0
    for i in range(1, len(points)):
        ax, az = points[i - 1]
        bx, bz = points[i]
        d = math.hypot(bx - ax, bz - az)
        while acc + d >= spacing:
            t = (spacing - acc) / d
            nx, nz = ax + (bx - ax) * t, az + (bz - az) * t
            out.append((nx, nz))
            ax, az = nx, nz
            d = math.hypot(bx - ax, bz - az)
            acc = 0.0
        acc += d
    if out[-1] != points[-1]:
        out.append(points[-1])
    return out


class RoadPath:
    def __init__(self, road: Road) -> None:
        self.road = road
        raw = resample(catmull(road.pts), 4.0)
        ys = [base_height(x, z) for (x, z) in raw]
        # Smooth the grade so roads do not follow every bump.
        win = 6
        smooth = []
        for i in range(len(ys)):
            a = max(0, i - win)
            b = min(len(ys), i + win + 1)
            smooth.append(sum(ys[a:b]) / (b - a))
        self.points: List[Tuple[float, float, float]] = [(x, y, z) for (x, z), y in zip(raw, smooth)]
        self.length = sum(
            math.dist(self.points[i - 1], self.points[i]) for i in range(1, len(self.points))
        )

    def at(self, t: float) -> Tuple[float, float, float]:
        if t <= 0:
            return self.points[0]
        if t >= 1:
            return self.points[-1]
        target = t * (len(self.points) - 1)
        i = int(target)
        f = target - i
        a = self.points[i]
        b = self.points[min(len(self.points) - 1, i + 1)]
        return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f)

    def heading_at(self, t: float) -> float:
        p = self.at(t)
        q = self.at(min(1.0, t + 0.004))
        return math.atan2(q[0] - p[0], q[2] - p[2])


PATHS = {r.id: RoadPath(r) for r in ROADS}


# --------------------------------------------------------------------------
# Terrain
# --------------------------------------------------------------------------

def build_heightfield() -> np.ndarray:
    n = HEIGHT_RES
    xs = np.linspace(-SIZE / 2, SIZE / 2, n)
    zs = np.linspace(-SIZE / 2, SIZE / 2, n)
    gx, gz = np.meshgrid(xs, zs)
    heights = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        for j in range(n):
            heights[i, j] = base_height(float(gx[i, j]), float(gz[i, j]))

    # Flatten terrain along roads (with a soft shoulder).
    for path in PATHS.values():
        width = path.road.width
        for (x, y, z) in path.points[::2]:
            r = int(width * 2.4 + 26)
            i0 = max(0, int((z - r + SIZE / 2) / SIZE * (n - 1)))
            i1 = min(n - 1, int((z + r + SIZE / 2) / SIZE * (n - 1)))
            j0 = max(0, int((x - r + SIZE / 2) / SIZE * (n - 1)))
            j1 = min(n - 1, int((x + r + SIZE / 2) / SIZE * (n - 1)))
            for i in range(i0, i1 + 1):
                for j in range(j0, j1 + 1):
                    px = xs[j]
                    pz = zs[i]
                    d = math.hypot(px - x, pz - z)
                    if d < r:
                        target = y - 0.06
                        blend = smoothstep(r, width * 0.75, d)
                        heights[i, j] = heights[i, j] * (1 - blend) + target * blend
    return heights


def sample_height(heights: np.ndarray, x: float, z: float) -> float:
    n = heights.shape[0]
    fx = (x + SIZE / 2) / SIZE * (n - 1)
    fz = (z + SIZE / 2) / SIZE * (n - 1)
    j = max(0, min(n - 2, int(fx)))
    i = max(0, min(n - 2, int(fz)))
    tx = fx - j
    tz = fz - i
    h00 = heights[i, j]
    h10 = heights[i, j + 1]
    h01 = heights[i + 1, j]
    h11 = heights[i + 1, j + 1]
    return float((h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz)


# --------------------------------------------------------------------------
# Meshes
# --------------------------------------------------------------------------

def terrain_meshes(heights: np.ndarray):
    n = TERRAIN_RES
    xs = np.linspace(-SIZE / 2, SIZE / 2, n)
    zs = np.linspace(-SIZE / 2, SIZE / 2, n)
    verts = []
    uvs = []
    for i in range(n):
        for j in range(n):
            x, z = float(xs[j]), float(zs[i])
            verts.append((x, sample_height(heights, x, z), z))
            uvs.append((x / 26.0, z / 26.0))
    verts_arr = np.asarray(verts, dtype=np.float32)
    uvs_arr = np.asarray(uvs, dtype=np.float32)

    groups: Dict[str, List[int]] = {"grass": [], "rock": [], "dirt": []}
    tri_by_mat: Dict[str, List[Tuple[int, int, int]]] = {"grass": [], "rock": [], "dirt": []}
    for i in range(n - 1):
        for j in range(n - 1):
            a = i * n + j
            b = i * n + j + 1
            c = (i + 1) * n + j + 1
            d = (i + 1) * n + j
            pa, pb, pc, pd = verts_arr[a], verts_arr[b], verts_arr[c], verts_arr[d]
            # Slope from the quad normal.
            nx = ((pb[1] - pa[1]) + (pc[1] - pd[1])) * 0.5
            nz = ((pd[1] - pa[1]) + (pc[1] - pb[1])) * 0.5
            slope = math.hypot(nx, nz) / max(0.001, abs(xs[1] - xs[0]))
            h = (pa[1] + pc[1]) * 0.5
            if h > 165 or slope > 0.85:
                key = "rock"
            elif h < 1.5 and abs(pa[0]) > 420:
                key = "dirt"
            else:
                key = "grass"
            tri_by_mat[key].append((a, b, c))
            tri_by_mat[key].append((a, c, d))

    out = {}
    for key, tris in tri_by_mat.items():
        if not tris:
            continue
        idx = np.asarray(tris, dtype=np.uint32).reshape(-1)
        normals = np.zeros_like(verts_arr)
        t = idx.reshape(-1, 3)
        v0 = verts_arr[t[:, 0]]
        v1 = verts_arr[t[:, 1]]
        v2 = verts_arr[t[:, 2]]
        fn = np.cross(v1 - v0, v2 - v0)
        for k in range(3):
            np.add.at(normals, t[:, k], fn)
        ln = np.linalg.norm(normals, axis=1, keepdims=True)
        ln[ln < 1e-9] = 1
        normals = normals / ln
        out[key] = (verts_arr, normals.astype(np.float32), uvs_arr, idx)
    return out


def road_meshes(heights: np.ndarray):
    asphalt_parts = []
    line_parts = []
    kerb_parts = []
    rail_parts = []
    pole_parts = []

    for path in PATHS.values():
        road = path.road
        half = road.width / 2
        left = []
        right = []
        for (x, y, z) in path.points:
            # Perpendicular in the XZ plane.
            idx = len(left)
            p0 = path.points[max(0, idx - 1)]
            p1 = path.points[min(len(path.points) - 1, idx + 1)]
            dx, dz = p1[0] - p0[0], p1[2] - p0[2]
            ln = math.hypot(dx, dz) or 1
            nx, nz = -dz / ln, dx / ln
            left.append((x + nx * half, y + 0.02, z + nz * half))
            right.append((x - nx * half, y + 0.02, z - nz * half))

        pos = []
        uvs = []
        indices = []
        for k in range(len(left)):
            pos += [left[k], (path.points[k][0], path.points[k][1] + 0.025, path.points[k][2]), right[k]]
            uvs += [(0, k * 0.25), (0.5, k * 0.25), (1, k * 0.25)]
        for k in range(len(left) - 1):
            a = k * 3
            b = (k + 1) * 3
            for s in range(2):
                indices += [a + s, b + s, b + s + 1, a + s, b + s + 1, a + s + 1]
        asphalt_parts.append(
            (
                np.asarray(pos, dtype=np.float32),
                np.tile(np.asarray([0, 1, 0], dtype=np.float32), (len(pos), 1)),
                np.asarray(uvs, dtype=np.float32),
                np.asarray(indices, dtype=np.uint32),
            )
        )

        # Lane markings.
        for i in range(1, len(path.points) - 1, 2):
            x, y, z = path.points[i]
            p0 = path.points[i - 1]
            p1 = path.points[i + 1]
            dx, dz = p1[0] - p0[0], p1[2] - p0[2]
            ln = math.hypot(dx, dz) or 1
            fx, fz = dx / ln, dz / ln
            nx, nz = -fz, fx
            dash_len = 3.0 if road.kind != "highway" else 4.0
            for lane in range(1, max(2, road.lanes // 2 + 1)):
                pass
            # Centre line (dashed for two-way roads, solid pair for the highway).
            if road.kind == "highway":
                for off in (-0.16, 0.16):
                    a = (x + nx * off - fx * dash_len, y + 0.045, z + nz * off - fz * dash_len)
                    b = (x + nx * off + fx * dash_len, y + 0.045, z + nz * off + fz * dash_len)
                    c = (b[0] + nx * 0.09, b[1], b[2] + nz * 0.09)
                    d = (a[0] + nx * 0.09, a[1], a[2] + nz * 0.09)
                    line_parts.append(quad(a, b, c, d, (0, 1, 0)))
            else:
                a = (x - fx * dash_len, y + 0.045, z - fz * dash_len)
                b = (x + fx * dash_len, y + 0.045, z + fz * dash_len)
                c = (b[0] + nx * 0.10, b[1], b[2] + nz * 0.10)
                d = (a[0] + nx * 0.10, a[1], a[2] + nz * 0.10)
                line_parts.append(quad(a, b, c, d, (0, 1, 0)))

            # Edge lines.
            for side in (-1, 1):
                ox, oz = nx * (half - 0.35) * side, nz * (half - 0.35) * side
                a = (x + ox - fx * dash_len, y + 0.045, z + oz - fz * dash_len)
                b = (x + ox + fx * dash_len, y + 0.045, z + oz + fz * dash_len)
                c = (b[0] + nx * 0.1, b[1], b[2] + nz * 0.1)
                d = (a[0] + nx * 0.1, a[1], a[2] + nz * 0.1)
                line_parts.append(quad(a, b, c, d, (0, 1, 0)))

        # Sidewalks / kerbs for urban roads.
        if road.sidewalk:
            for side in (-1, 1):
                strip_pos = []
                strip_uv = []
                strip_idx = []
                for k, (x, y, z) in enumerate(path.points):
                    p0 = path.points[max(0, k - 1)]
                    p1 = path.points[min(len(path.points) - 1, k + 1)]
                    dx, dz = p1[0] - p0[0], p1[2] - p0[2]
                    ln = math.hypot(dx, dz) or 1
                    nx, nz = -dz / ln * side, dx / ln * side
                    inner = (x + nx * half, y + 0.14, z + nz * half)
                    outer = (x + nx * (half + 2.2), y + 0.14, z + nz * (half + 2.2))
                    strip_pos += [inner, outer]
                    strip_uv += [(0, k * 0.4), (1, k * 0.4)]
                for k in range(len(path.points) - 1):
                    a = k * 2
                    b = (k + 1) * 2
                    strip_idx += [a, b, b + 1, a, b + 1, a + 1]
                kerb_parts.append(
                    (
                        np.asarray(strip_pos, dtype=np.float32),
                        np.tile(np.asarray([0, 1, 0], dtype=np.float32), (len(strip_pos), 1)),
                        np.asarray(strip_uv, dtype=np.float32),
                        np.asarray(strip_idx, dtype=np.uint32),
                    )
                )

        # Guardrails on mountain roads.
        if road.guardrail:
            for side in (-1, 1):
                for k in range(0, len(path.points) - 1, 3):
                    x, y, z = path.points[k]
                    p0 = path.points[max(0, k - 1)]
                    p1 = path.points[min(len(path.points) - 1, k + 1)]
                    dx, dz = p1[0] - p0[0], p1[2] - p0[2]
                    ln = math.hypot(dx, dz) or 1
                    nx, nz = -dz / ln * side, dx / ln * side
                    px, pz = x + nx * (half + 0.5), z + nz * (half + 0.5)
                    heading = math.atan2(dx, dz)
                    rail = box_rounded(0.14, 0.32, 4.2, radius=0.03)
                    rail_parts.append(transform(rail, rotate_y=heading, translate=(px, y + 0.72, pz)))
                    pole_parts.append(box_rounded(0.11, 0.85, 0.11, radius=0.02, center=(px, y + 0.38, pz)))

    return asphalt_parts, line_parts, kerb_parts, rail_parts, pole_parts


class Batch:
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


def circle_ring(cx: float, cy: float, cz: float, r: float, n: int = 8) -> np.ndarray:
    pts = []
    for i in range(n):
        a = i / n * math.pi * 2
        pts.append((cx + math.cos(a) * r, cy, cz + math.sin(a) * r))
    return np.asarray(pts, dtype=np.float32)


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------

def tex(name: str) -> bytes:
    with open(os.path.join(TEX, name), "rb") as fh:
        return fh.read()


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    print("heightfield…")
    heights = build_heightfield()
    with open(os.path.join(OUT, "terrain-height.bin"), "wb") as fh:
        fh.write(heights.astype(np.float32).tobytes())

    print("terrain mesh…")
    terrain = terrain_meshes(heights)
    b = GLBBuilder("FARMAN world generator")
    b.material(Material("terrain_grass", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.95, texture_png=tex("grass.png")))
    b.material(Material("terrain_rock", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.92, texture_png=tex("rock.png")))
    b.material(Material("terrain_dirt", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.96, texture_png=tex("dirt.png")))
    mapping = {"grass": "terrain_grass", "rock": "terrain_rock", "dirt": "terrain_dirt"}
    for key, part in terrain.items():
        b.add(Mesh(f"terrain_{key}", part[0], part[1], part[2], part[3], mapping[key]))
    b.write(os.path.join(OUT, "terrain.glb"))

    print("roads…")
    asphalt_parts, line_parts, kerb_parts, rail_parts, pole_parts = road_meshes(heights)
    rb = GLBBuilder("FARMAN road generator")
    rb.material(Material("road_asphalt", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.88, texture_png=tex("asphalt.png")))
    rb.material(Material("road_line", base_color=(0.92, 0.92, 0.88, 1), metallic=0.0, roughness=0.6))
    rb.material(Material("road_kerb", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.9, texture_png=tex("concrete.png")))
    rb.material(Material("road_rail", base_color=(0.62, 0.64, 0.66, 1), metallic=0.9, roughness=0.35))
    rb.add(Mesh("roads", *merge(asphalt_parts), "road_asphalt"))
    if line_parts:
        rb.add(Mesh("markings", *merge(line_parts), "road_line"))
    if kerb_parts:
        rb.add(Mesh("sidewalks", *merge(kerb_parts), "road_kerb"))
    if rail_parts:
        rb.add(Mesh("guardrail", *merge(rail_parts), "road_rail"))
    if pole_parts:
        rb.add(Mesh("guardrail_posts", *merge(pole_parts), "road_rail"))
    rb.write(os.path.join(OUT, "roads.glb"))

    print("props…")
    pb = GLBBuilder("FARMAN prop generator")
    mats = {
        "facade_a": "facade_a",
        "facade_b": "facade_b",
        "facade_c": "facade_c",
        "shop": "shop",
        "metal": "metal",
        "concrete": "prop_concrete",
        "bark": "bark",
        "leaf": "leaf",
        "sign_tehran": "sign_tehran",
        "sign_chalus": "sign_chalus",
        "sign_police": "sign_police",
        "lamp": "lamp",
    }
    pb.material(Material("facade_a", base_color=(1, 1, 1, 1), roughness=0.85, texture_png=tex("facade-a.png")))
    pb.material(Material("facade_b", base_color=(1, 1, 1, 1), roughness=0.85, texture_png=tex("facade-b.png")))
    pb.material(Material("facade_c", base_color=(1, 1, 1, 1), roughness=0.85, texture_png=tex("facade-c.png")))
    pb.material(Material("shop", base_color=(1, 1, 1, 1), roughness=0.8, texture_png=tex("shopfront.png")))
    pb.material(Material("metal", base_color=(0.52, 0.55, 0.58, 1), metallic=0.85, roughness=0.32))
    pb.material(Material("prop_concrete", base_color=(1, 1, 1, 1), roughness=0.9, texture_png=tex("concrete.png")))
    pb.material(Material("bark", base_color=(0.24, 0.17, 0.12, 1), roughness=0.95))
    pb.material(Material("leaf", base_color=(0.14, 0.28, 0.13, 1), roughness=0.9))
    pb.material(Material("sign_tehran", base_color=(1, 1, 1, 1), roughness=0.55, texture_png=tex("sign-tehran.png")))
    pb.material(Material("sign_chalus", base_color=(1, 1, 1, 1), roughness=0.55, texture_png=tex("sign-chalus.png")))
    pb.material(Material("sign_police", base_color=(1, 1, 1, 1), roughness=0.55, texture_png=tex("sign-police.png")))
    pb.material(Material("lamp", base_color=(1.0, 0.95, 0.82, 1), metallic=0.2, roughness=0.3, emissive=(0.35, 0.32, 0.26)))
    props = Batch()
    build_city(props, mats, heights)
    build_props(props, mats, heights)
    props.flush(pb, "props")
    pb.write(os.path.join(OUT, "props.glb"))

    print("vegetation…")
    vb = GLBBuilder("FARMAN vegetation generator")
    vb.material(Material("bark", base_color=(0.22, 0.16, 0.11, 1), roughness=0.95))
    vb.material(Material("leaf", base_color=(0.16, 0.30, 0.15, 1), roughness=0.9))
    veg = Batch()
    build_vegetation(veg, {"bark": "bark", "leaf": "leaf"}, heights)
    veg.flush(vb, "veg")
    vb.write(os.path.join(OUT, "vegetation.glb"))

    print("world.json…")
    roads_json = []
    for path in PATHS.values():
        roads_json.append(
            {
                "id": path.road.id,
                "name": path.road.name,
                "kind": path.road.kind,
                "width": path.road.width,
                "lanes": path.road.lanes,
                "points": [[round(x, 2), round(y, 3), round(z, 2)] for (x, y, z) in path.points],
            }
        )
    spawns = []
    for sid, (road_id, t, offset) in SPAWNS.items():
        path = PATHS[road_id]
        x, y, z = path.at(t)
        h = path.heading_at(t)
        # Offset into the correct lane (right-hand traffic).
        ox = math.cos(h) * offset * 3.2
        oz = -math.sin(h) * offset * 3.2
        spawns.append({"id": sid, "x": round(x - ox, 2), "y": round(y + 0.05, 2), "z": round(z - oz, 2), "yaw": round(h, 4)})

    data = {
        "version": 1,
        "size": SIZE,
        "heightfield": {"file": "terrain-height.bin", "resolution": HEIGHT_RES, "minY": -20, "maxY": 260},
        "models": {
            "terrain": "terrain.glb",
            "roads": "roads.glb",
            "props": "props.glb",
            "vegetation": "vegetation.glb",
        },
        "roads": roads_json,
        "spawns": spawns,
    }
    with open(os.path.join(OUT, "world.json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"world written: {total/1024/1024:.1f} MiB in {OUT}")


if __name__ == "__main__":
    main()
