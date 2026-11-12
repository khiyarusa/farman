import io
p='src/vehicles/vehicle.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("      const fx = fz > 0 ? tireLongitudinalForce(","      // eslint-disable-next-line prefer-const\n      let fx = fz > 0 ? tireLongitudinalForce(")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('ok')
