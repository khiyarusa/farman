"""Generate the web favicon / brand icons from the same mark as the Android launcher."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "android_patch"))

from PIL import Image, ImageDraw, ImageFont  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "public", "assets", "brand")
FONT = os.path.join(ROOT, "public", "assets", "fonts", "Vazirmatn-Bold.ttf")


def icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = size * 0.06
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size * 0.22, fill=(11, 15, 17, 255))
    ring = size * 0.33
    cx = cy = size / 2
    d.ellipse([cx - ring, cy - ring, cx + ring, cy + ring], outline=(237, 241, 242, 235), width=max(2, int(size * 0.045)))
    d.ellipse([cx - ring * 0.22, cy - ring * 0.22, cx + ring * 0.22, cy + ring * 0.22], fill=(46, 163, 127, 255))
    w = max(2, int(size * 0.03))
    d.line([cx - ring * 0.85, cy, cx + ring * 0.85, cy], fill=(237, 241, 242, 170), width=w)
    d.line([cx, cy - ring, cx, cy - ring * 0.25], fill=(237, 241, 242, 170), width=w)
    try:
        font = ImageFont.truetype(FONT, int(size * 0.42))
        d.text((cx, cy - size * 0.02), "ف", font=font, fill=(10, 14, 15, 255), anchor="mm")
    except Exception:
        pass
    return img


os.makedirs(OUT, exist_ok=True)
for px in (192, 512):
    icon(px).save(os.path.join(OUT, f"icon-{px}.png"), optimize=True)
print("brand icons written")
