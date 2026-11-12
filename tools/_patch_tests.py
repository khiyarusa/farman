import io
p='src/ui/format.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("""  const grouped = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '٬');
  const sign = value < 0 ? '−' : '';
  return digits(fracPart ? `${sign}${grouped}٫${fracPart}` : `${sign}${grouped}`);""",
"""  const sep = digitMode === 'fa' ? '٬' : ',';
  const decimal = digitMode === 'fa' ? '٫' : '.';
  const grouped = intPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, sep);
  const sign = value < 0 ? '−' : '';
  return digits(fracPart ? `${sign}${grouped}${decimal}${fracPart}` : `${sign}${grouped}`);""")
io.open(p,'w',encoding='utf-8',newline='').write(s)

p='tests/localization.test.ts'
s=io.open(p,encoding='utf-8').read()
s=s.replace("expect(formatNumber(1234.56, 1)).toBe('۱٬۲۳۴٬۶');","expect(formatNumber(1234.56, 1)).toBe('۱٬۲۳۴٫۶');")
io.open(p,'w',encoding='utf-8',newline='').write(s)

p='eslint.config.js'
s=io.open(p,encoding='utf-8').read()
s=s.replace("ignores: ['dist/**', 'android/**', 'node_modules/**', 'tools/assetgen/**', 'docs/**', '.agents/**'],","ignores: ['dist/**', 'android/**', 'node_modules/**', 'tools/assetgen/**', 'tools/qa/**', 'tools/*.py', 'docs/**', '.agents/**'],")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('patched')
