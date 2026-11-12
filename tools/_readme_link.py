import io
p='README.md'
s=io.open(p,encoding='utf-8').read().replace('releases/tag/v0.1.2','releases/tag/v0.1.3').replace('FARMAN v0.1.2 debug APK','FARMAN v0.1.3 debug APK')
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('readme link updated')
