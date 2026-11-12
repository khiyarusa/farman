import io
p='docs/visual-qa/v0.1.0/VISUAL_QA_REPORT.md'
s=io.open(p,encoding='utf-8').read()
s=s.replace("| 16 | `16-mobile-2400x1080.png` | Landscape phone aspect ratio |","| 16 | `16-mobile-2400x1080.png` | Landscape phone aspect ratio |\n| 17 | `17-mission-result.png` | Parking mission result overlay (score ۸۲) |")
io.open(p,'w',encoding='utf-8',newline='').write(s)
print('qa index updated')
