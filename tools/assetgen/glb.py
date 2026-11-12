"""Minimal, dependency-free glTF 2.0 (.glb) writer.

Only what FARMAN needs: indexed triangle meshes with positions, normals and UVs,
PBR metallic-roughness materials, optional clearcoat, and embedded PNG textures.

Everything is authored in metres, right-handed, +Y up, +Z forward (the same
convention as the Babylon scene and the physics simulation).
"""

from __future__ import annotations

import json
import struct
from dataclasses import dataclass, field
from typing import List, Optional, Sequence, Tuple

import numpy as np


@dataclass
class Material:
    name: str
    base_color: Tuple[float, float, float, float] = (0.8, 0.8, 0.8, 1.0)
    metallic: float = 0.0
    roughness: float = 0.6
    emissive: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    alpha_mode: str = "OPAQUE"
    alpha: float = 1.0
    double_sided: bool = False
    clearcoat: Optional[float] = None
    clearcoat_roughness: float = 0.05
    texture_png: Optional[bytes] = None


@dataclass
class Mesh:
    name: str
    positions: np.ndarray  # (n,3) float32
    normals: np.ndarray  # (n,3) float32
    uvs: np.ndarray  # (n,2) float32
    indices: np.ndarray  # (m,) uint32
    material: str
    translation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    parent: Optional[str] = None


def _align4(b: bytes) -> bytes:
    pad = (-len(b)) % 4
    return b + b"\x00" * pad


class GLBBuilder:
    def __init__(self, generator: str = "FARMAN assetgen") -> None:
        self.generator = generator
        self.materials: List[Material] = []
        self.meshes: List[Mesh] = []
        self._mat_index = {}

    def material(self, mat: Material) -> str:
        if mat.name not in self._mat_index:
            self._mat_index[mat.name] = len(self.materials)
            self.materials.append(mat)
        return mat.name

    def add(self, mesh: Mesh) -> None:
        if mesh.material not in self._mat_index:
            raise KeyError(f"material {mesh.material!r} not registered")
        mesh.positions = np.asarray(mesh.positions, dtype=np.float32)
        mesh.normals = np.asarray(mesh.normals, dtype=np.float32)
        mesh.uvs = np.asarray(mesh.uvs, dtype=np.float32)
        mesh.indices = np.asarray(mesh.indices, dtype=np.uint32)
        self.meshes.append(mesh)

    def build(self) -> bytes:
        gltf = {
            "asset": {"version": "2.0", "generator": self.generator},
            "scene": 0,
            "scenes": [{"nodes": []}],
            "nodes": [],
            "meshes": [],
            "materials": [],
            "accessors": [],
            "bufferViews": [],
            "buffers": [],
            "extensionsUsed": [],
        }
        roots: List[int] = []
        parent_nodes: dict[str, int] = {}

        bin_parts: List[bytes] = []
        offset = 0

        def add_view(data: bytes, target: int) -> int:
            nonlocal offset
            view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data), "target": target}
            bin_parts.append(_align4(data))
            offset += len(_align4(data))
            gltf["bufferViews"].append(view)
            return len(gltf["bufferViews"]) - 1

        def add_accessor(view: int, comp_type: int, count: int, type_str: str,
                         min_v=None, max_v=None) -> int:
            acc = {
                "bufferView": view,
                "componentType": comp_type,
                "count": count,
                "type": type_str,
            }
            if min_v is not None:
                acc["min"] = min_v
            if max_v is not None:
                acc["max"] = max_v
            gltf["accessors"].append(acc)
            return len(gltf["accessors"]) - 1

        image_views = []
        for mat in self.materials:
            if mat.texture_png is not None:
                image_views.append(add_view(mat.texture_png, 0))

        mat_json = []
        image_index = 0
        for mat in self.materials:
            pbr = {
                "baseColorFactor": list(mat.base_color),
                "metallicFactor": mat.metallic,
                "roughnessFactor": mat.roughness,
            }
            entry = {
                "name": mat.name,
                "pbrMetallicRoughness": pbr,
                "emissiveFactor": list(mat.emissive),
                "doubleSided": mat.double_sided,
            }
            if mat.alpha_mode != "OPAQUE" or mat.alpha < 1.0:
                entry["alphaMode"] = mat.alpha_mode
                pbr["baseColorFactor"] = list(mat.base_color[:3]) + [mat.alpha]
            if mat.texture_png is not None:
                entry["pbrMetallicRoughness"]["baseColorTexture"] = {"index": image_index}
                image_index += 1
            if mat.clearcoat is not None:
                entry.setdefault("extensions", {})["KHR_materials_clearcoat"] = {
                    "clearcoatFactor": mat.clearcoat,
                    "clearcoatRoughnessFactor": mat.clearcoat_roughness,
                }
                if "KHR_materials_clearcoat" not in gltf["extensionsUsed"]:
                    gltf["extensionsUsed"].append("KHR_materials_clearcoat")
            mat_json.append(entry)
        gltf["materials"] = mat_json

        if image_views:
            gltf["images"] = [{"bufferView": v, "mimeType": "image/png"} for v in image_views]
            gltf["textures"] = [{"source": i, "sampler": 0} for i in range(len(image_views))]
            gltf["samplers"] = [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}]

        for mesh in self.meshes:
            pos_idx = add_accessor(
                add_view(mesh.positions.tobytes(), 34962),
                5126,
                len(mesh.positions),
                "VEC3",
                [float(mesh.positions[:, 0].min()), float(mesh.positions[:, 1].min()), float(mesh.positions[:, 2].min())],
                [float(mesh.positions[:, 0].max()), float(mesh.positions[:, 1].max()), float(mesh.positions[:, 2].max())],
            )
            nrm_idx = add_accessor(
                add_view(mesh.normals.tobytes(), 34962), 5126, len(mesh.normals), "VEC3"
            )
            uv_idx = add_accessor(
                add_view(mesh.uvs.tobytes(), 34962), 5126, len(mesh.uvs), "VEC2"
            )
            idx_idx = add_accessor(
                add_view(mesh.indices.tobytes(), 34963), 5125, len(mesh.indices), "SCALAR"
            )
            gltf["meshes"].append(
                {
                    "name": mesh.name,
                    "primitives": [
                        {
                            "attributes": {"POSITION": pos_idx, "NORMAL": nrm_idx, "TEXCOORD_0": uv_idx},
                            "indices": idx_idx,
                            "material": self._mat_index[mesh.material],
                            "mode": 4,
                        }
                    ],
                }
            )
            node = {"name": mesh.name, "mesh": len(gltf["meshes"]) - 1}
            if any(v != 0.0 for v in mesh.translation):
                node["translation"] = list(mesh.translation)
            node_index = len(gltf["nodes"])
            gltf["nodes"].append(node)
            if mesh.parent is None:
                roots.append(node_index)
            else:
                parent_index = parent_nodes.get(mesh.parent)
                if parent_index is None:
                    parent_index = len(gltf["nodes"])
                    gltf["nodes"].append({"name": mesh.parent, "children": []})
                    parent_nodes[mesh.parent] = parent_index
                    roots.append(parent_index)
                gltf["nodes"][parent_index].setdefault("children", []).append(node_index)

        gltf["scenes"] = [{"nodes": roots}]

        if not gltf["extensionsUsed"]:
            del gltf["extensionsUsed"]

        binary = b"".join(bin_parts)
        gltf["buffers"] = [{"byteLength": len(binary)}]

        json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
        json_bytes += b" " * ((-len(json_bytes)) % 4)
        binary = _align4(binary)

        total = 12 + 8 + len(json_bytes) + 8 + len(binary)
        out = struct.pack("<III", 0x46546C67, 2, total)
        out += struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
        out += struct.pack("<II", len(binary), 0x004E4942) + binary
        return out

    def write(self, path: str) -> int:
        data = self.build()
        with open(path, "wb") as fh:
            fh.write(data)
        return len(data)


# --------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------

def smooth_normals(positions: np.ndarray, indices: np.ndarray) -> np.ndarray:
    normals = np.zeros_like(positions, dtype=np.float32)
    tri = indices.reshape(-1, 3)
    a = positions[tri[:, 0]]
    b = positions[tri[:, 1]]
    c = positions[tri[:, 2]]
    face = np.cross(b - a, c - a)
    for k in range(3):
        np.add.at(normals, tri[:, k], face)
    lengths = np.linalg.norm(normals, axis=1, keepdims=True)
    lengths[lengths < 1e-9] = 1.0
    return (normals / lengths).astype(np.float32)


def loft(rings: Sequence[np.ndarray], close_ring: bool = True, cap_ends: bool = True,
         v_scale: float = 1.0) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Stitches equal-length rings into a surface.

    rings: list of (n,3) arrays ordered along the sweep direction.
    Returns positions, normals, uvs, indices.
    """
    rings = [np.asarray(r, dtype=np.float32) for r in rings]
    n = len(rings[0])
    m = len(rings)
    positions = np.concatenate(rings, axis=0)
    uvs = np.zeros((m * n, 2), dtype=np.float32)
    for j in range(m):
        v = j / max(1, m - 1) * v_scale
        for i in range(n):
            uvs[j * n + i] = (i / (n - 1 if not close_ring else n), v)

    indices = []
    ring_pairs = n if close_ring else n - 1
    for j in range(m - 1):
        for i in range(ring_pairs):
            a = j * n + i
            b = j * n + (i + 1) % n
            c = (j + 1) * n + (i + 1) % n
            d = (j + 1) * n + i
            indices += [a, b, c, a, c, d]

    if cap_ends:
        # Fan caps (the rings are convex enough for a car body).
        center_start = positions[:n].mean(axis=0)
        center_end = positions[(m - 1) * n:].mean(axis=0)
        positions = np.vstack([positions, center_start, center_end])
        uvs = np.vstack([uvs, np.array([[0.5, 0.0], [0.5, 1.0]], dtype=np.float32)])
        s_idx = len(positions) - 2
        e_idx = len(positions) - 1
        for i in range(ring_pairs):
            a = i
            b = (i + 1) % n
            indices += [s_idx, b, a]
            a2 = (m - 1) * n + i
            b2 = (m - 1) * n + (i + 1) % n
            indices += [e_idx, a2, b2]

    indices_np = np.asarray(indices, dtype=np.uint32)
    normals = smooth_normals(positions, indices_np)
    return positions, normals, uvs, indices_np


def revolve(profile: Sequence[Tuple[float, float]], segments: int, axis: str = "x",
            center: Tuple[float, float, float] = (0.0, 0.0, 0.0)) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Revolves a (radius, height) profile around an axis."""
    pts = list(profile)
    rings = []
    for s in range(segments + 1):
        ang = 2 * np.pi * s / segments
        ring = []
        for (r, h) in pts:
            if axis == "x":
                ring.append((h, center[1] + r * np.cos(ang), center[2] + r * np.sin(ang)))
            elif axis == "y":
                ring.append((center[0] + r * np.cos(ang), h, center[2] + r * np.sin(ang)))
            else:
                ring.append((center[0] + r * np.cos(ang), center[1] + r * np.sin(ang), h))
        rings.append(np.asarray(ring, dtype=np.float32))
    closed = rings + [rings[0]]
    return loft(closed, close_ring=True, cap_ends=False)


def merge(parts: Sequence[Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]]):
    positions = []
    normals = []
    uvs = []
    indices = []
    base = 0
    for (p, n, u, idx) in parts:
        positions.append(p)
        normals.append(n)
        uvs.append(u)
        indices.append(idx + base)
        base += len(p)
    return (
        np.concatenate(positions, axis=0),
        np.concatenate(normals, axis=0),
        np.concatenate(uvs, axis=0),
        np.concatenate(indices, axis=0).astype(np.uint32),
    )


def transform(part, translate=(0.0, 0.0, 0.0), rotate_x: float = 0.0, rotate_y: float = 0.0, rotate_z: float = 0.0, scale=(1.0, 1.0, 1.0)):
    p, n, u, idx = part
    p = p.copy()
    n = n.copy()
    p *= np.asarray(scale, dtype=np.float32)
    if rotate_x:
        c, s = np.cos(rotate_x), np.sin(rotate_x)
        p = np.stack([p[:, 0], p[:, 1] * c - p[:, 2] * s, p[:, 1] * s + p[:, 2] * c], axis=1)
        n = np.stack([n[:, 0], n[:, 1] * c - n[:, 2] * s, n[:, 1] * s + n[:, 2] * c], axis=1)
    if rotate_y:
        c, s = np.cos(rotate_y), np.sin(rotate_y)
        p = np.stack([p[:, 0] * c + p[:, 2] * s, p[:, 1], -p[:, 0] * s + p[:, 2] * c], axis=1)
        n = np.stack([n[:, 0] * c + n[:, 2] * s, n[:, 1], -n[:, 0] * s + n[:, 2] * c], axis=1)
    if rotate_z:
        c, s = np.cos(rotate_z), np.sin(rotate_z)
        p = np.stack([p[:, 0] * c - p[:, 1] * s, p[:, 0] * s + p[:, 1] * c, p[:, 2]], axis=1)
        n = np.stack([n[:, 0] * c - n[:, 1] * s, n[:, 0] * s + n[:, 1] * c, n[:, 2]], axis=1)
    p += np.asarray(translate, dtype=np.float32)
    return (p.astype(np.float32), n.astype(np.float32), u, idx)


def quad(a, b, c, d, normal=None):
    """Two-triangle quad from four corner points (counter-clockwise)."""
    pts = np.array([a, b, c, d], dtype=np.float32)
    idx = np.array([0, 1, 2, 0, 2, 3], dtype=np.uint32)
    n = smooth_normals(pts, idx)
    if normal is not None:
        n = np.tile(np.asarray(normal, dtype=np.float32), (4, 1))
    uvs = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
    return pts, n, uvs, idx


def box_rounded(w, h, d, radius=0.03, center=(0, 0, 0), segments=4):
    """A box with softly bevelled edges, built as a lofted rounded rectangle."""
    hw, hh, hd = w / 2, h / 2, d / 2
    r = min(radius, hw * 0.9, hh * 0.9)
    ring = []
    # Rounded rectangle in the XZ plane for each Y layer.
    corners = [(-hw + r, -hd), (hw - r, -hd), (hw, -hd + r), (hw, hd - r),
               (hw - r, hd), (-hw + r, hd), (-hw, hd - r), (-hw, -hd + r)]
    for (x, z) in corners:
        for k in range(segments):
            ang = (k / segments) * (np.pi / 2)
            px = x + np.cos(ang) * r * (1 if x > 0 else -1 if x < 0 else 0)
            pz = z + np.sin(ang) * r * (1 if z > 0 else -1 if z < 0 else 0)
            ring.append((px, pz))
    rings = []
    for layer, (yy, inset) in enumerate([(-hh, r), (-hh + r, 0.0), (hh - r, 0.0), (hh, r)]):
        pts = []
        for (x, z) in ring:
            pts.append((x * (1 - inset * 0.15), yy, z * (1 - inset * 0.15)))
        rings.append(np.asarray(pts, dtype=np.float32))
    p, n, u, idx = loft(rings, close_ring=True, cap_ends=True)
    return transform((p, n, u, idx), translate=center)
