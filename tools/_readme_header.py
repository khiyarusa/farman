import io
p='README.md'
s=io.open(p,encoding='utf-8').read()
header = """# FARMAN · فرمان

[![CI](https://github.com/khiyarusa/farman/actions/workflows/ci.yml/badge.svg)](https://github.com/khiyarusa/farman/actions/workflows/ci.yml)
[![Android](https://github.com/khiyarusa/farman/actions/workflows/android.yml/badge.svg)](https://github.com/khiyarusa/farman/actions/workflows/android.yml)

> **Download:** [FARMAN v0.1.2 debug APK](https://github.com/khiyarusa/farman/releases/tag/v0.1.2) · preview build, debug-signed.
"""
if s.startswith('# FARMAN'):
    s = header + s.split('\n', 1)[1]
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('readme header updated')
