import io
p='tools/qa/capture.mjs'
s=io.open(p,encoding='utf-8').read()
s=s.replace("""  cam.position.set(v.x + 2.4, v.y + 0.55, v.z + 1.8);
  cam.setTarget({ x: v.x, y: v.y + 0.35, z: v.z });""",
"""  cam.position.set(v.x + 2.4, v.y + 0.55, v.z + 1.8);
  const target = cam.position.clone();
  target.set(v.x, v.y + 0.35, v.z);
  cam.setTarget(target);""")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('ok')
