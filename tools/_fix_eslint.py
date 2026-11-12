import io
p='eslint.config.js'
s=io.open(p,encoding='utf-8').read()
s=s.replace("'.zwork/**'", "'.zwork/**', '.vite/**'")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('ok')
