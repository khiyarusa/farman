import io
p='src/core/config.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("version: '0.1.0',","version: '0.1.2',").replace("buildTag: 'v0.1.0-dev',","buildTag: 'v0.1.2-preview',")
io.open(p,'w',encoding='utf-8',newline='').write(s)
p='package.json'
s=io.open(p,encoding='utf-8').read().replace('"version": "0.1.0"','"version": "0.1.2"')
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('version bumped')
