import io
p='android/app/src/main/res/values/ic_launcher_background.xml'
s=io.open(p,encoding='utf-8').read().replace('#FFFFFF','#0B0F11')
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('icon bg set')
