"""Fix inverted winding on terrain / road surfaces (they were back-face culled)."""

import io

p = "tools/assetgen/world.py"
s = io.open(p, encoding="utf-8").read()

helper = '''
def ensure_up(part):
    """Flips triangle winding so the surface normal points up (+Y)."""
    pos, nrm, uv, idx = part
    if len(nrm) and float(nrm[:, 1].mean()) < 0:
        tri = idx.reshape(-1, 3)[:, [0, 2, 1]].reshape(-1)
        nrm = nrm * -1.0
        return (pos, nrm.astype(np.float32), uv, tri.astype(np.uint32))
    return part


'''

s = s.replace("def terrain_meshes(heights: np.ndarray):", helper + "def terrain_meshes(heights: np.ndarray):")

# Terrain: compute normals from the (fixed) winding and force upward.
s = s.replace(
    "        out[key] = (verts_arr, normals.astype(np.float32), uvs_arr, idx)",
    "        out[key] = ensure_up((verts_arr, normals.astype(np.float32), uvs_arr, idx))",
)

# Road surfaces and paint.
s = s.replace(
    "    rb.add(Mesh(\"roads\", *merge(asphalt_parts), \"road_asphalt\"))",
    "    rb.add(Mesh(\"roads\", *ensure_up(merge(asphalt_parts)), \"road_asphalt\"))",
)
s = s.replace(
    "        rb.add(Mesh(\"markings\", *merge(line_parts), \"road_line\"))",
    "        rb.add(Mesh(\"markings\", *ensure_up(merge(line_parts)), \"road_line\"))",
)
s = s.replace(
    "        rb.add(Mesh(\"sidewalks\", *merge(kerb_parts), \"road_kerb\"))",
    "        rb.add(Mesh(\"sidewalks\", *ensure_up(merge(kerb_parts)), \"road_kerb\"))",
)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("winding fixed")
