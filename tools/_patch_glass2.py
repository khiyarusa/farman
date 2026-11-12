import io
p='tools/assetgen/vehicles.py'
s=io.open(p,encoding='utf-8').read()
s=s.replace('alpha_mode="BLEND", alpha=0.38','alpha_mode="BLEND", alpha=0.72')
s=s.replace('base_color=(0.10, 0.13, 0.14, 1.0), metallic=0.0, roughness=0.08','base_color=(0.06, 0.08, 0.09, 1.0), metallic=0.2, roughness=0.05')
s=s.replace('hw0 = width_at(spec, z0) * 0.972','hw0 = width_at(spec, z0) * 1.005')
s=s.replace('hw1 = width_at(spec, z1) * 0.972','hw1 = width_at(spec, z1) * 1.005')
s=s.replace('hw0t = width_at(spec, z0) * 0.865','hw0t = width_at(spec, z0) * 0.93')
s=s.replace('hw1t = width_at(spec, z1) * 0.865','hw1t = width_at(spec, z1) * 0.93')
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('glass patched')
