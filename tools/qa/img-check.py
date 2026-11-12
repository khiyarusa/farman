from PIL import Image
import numpy as np
for name in ("sky-day.png","sky-dusk.png"):
    im = Image.open("public/assets/textures/"+name).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    print(name, im.size, "top mean", a[:200].mean(axis=(0,1)).round(1), "mid", a[450:550].mean(axis=(0,1)).round(1), "bottom", a[-100:].mean(axis=(0,1)).round(1))
