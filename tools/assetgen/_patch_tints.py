"""Give terrain and building materials explicit tints so the world reads in colour."""

import io

p = "tools/assetgen/world.py"
s = io.open(p, encoding="utf-8").read()

s = s.replace(
    'b.material(Material("terrain_grass", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.95, texture_png=tex("grass.png")))',
    'b.material(Material("terrain_grass", base_color=(0.52, 0.62, 0.38, 1), metallic=0.0, roughness=0.95, texture_png=tex("grass.png")))',
)
s = s.replace(
    'b.material(Material("terrain_rock", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.92, texture_png=tex("rock.png")))',
    'b.material(Material("terrain_rock", base_color=(0.68, 0.64, 0.58, 1), metallic=0.0, roughness=0.92, texture_png=tex("rock.png")))',
)
s = s.replace(
    'b.material(Material("terrain_dirt", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.96, texture_png=tex("dirt.png")))',
    'b.material(Material("terrain_dirt", base_color=(0.62, 0.52, 0.38, 1), metallic=0.0, roughness=0.96, texture_png=tex("dirt.png")))',
)
s = s.replace(
    'pb.material(Material("facade_a", base_color=(1, 1, 1, 1), roughness=0.85, texture_png=tex("facade-a.png")))',
    'pb.material(Material("facade_a", base_color=(0.86, 0.82, 0.74, 1), roughness=0.85, texture_png=tex("facade-a.png")))',
)
s = s.replace(
    'pb.material(Material("facade_b", base_color=(1, 1, 1, 1), roughness=0.85, texture_png=tex("facade-b.png")))',
    'pb.material(Material("facade_b", base_color=(0.78, 0.76, 0.72, 1), roughness=0.85, texture_png=tex("facade-b.png")))',
)
s = s.replace(
    'pb.material(Material("facade_c", base_color=(1, 1, 1, 1), roughness=0.85, texture_png=tex("facade-c.png")))',
    'pb.material(Material("facade_c", base_color=(0.66, 0.66, 0.63, 1), roughness=0.85, texture_png=tex("facade-c.png")))',
)
s = s.replace(
    'pb.material(Material("shop", base_color=(1, 1, 1, 1), roughness=0.8, texture_png=tex("shopfront.png")))',
    'pb.material(Material("shop", base_color=(0.82, 0.78, 0.70, 1), roughness=0.8, texture_png=tex("shopfront.png")))',
)
s = s.replace(
    'rb.material(Material("road_kerb", base_color=(1, 1, 1, 1), metallic=0.0, roughness=0.9, texture_png=tex("concrete.png")))',
    'rb.material(Material("road_kerb", base_color=(0.72, 0.72, 0.70, 1), metallic=0.0, roughness=0.9, texture_png=tex("concrete.png")))',
)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("tints applied")
