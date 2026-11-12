"""Configure the Capacitor Android project for FARMAN and generate launcher icons."""

from __future__ import annotations

import io
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ANDROID = os.path.join(ROOT, "android")

# ---------------------------------------------------------------- manifest
p = os.path.join(ANDROID, "app", "src", "main", "AndroidManifest.xml")
s = io.open(p, encoding="utf-8").read()
if "sensorLandscape" not in s:
    s = s.replace(
        'android:launchMode="singleTask"',
        'android:launchMode="singleTask"\n'
        '            android:screenOrientation="sensorLandscape"\n'
        '            android:resizeableActivity="false"\n'
        '            android:hardwareAccelerated="true"',
    )
io.open(p, "w", encoding="utf-8", newline="").write(s)

# ----------------------------------------------------------------- strings
p = os.path.join(ANDROID, "app", "src", "main", "res", "values", "strings.xml")
s = io.open(p, encoding="utf-8").read()
s = s.replace('<string name="app_name">FARMAN</string>', '<string name="app_name">فرمان</string>')
s = s.replace('<string name="title_activity_main">FARMAN</string>', '<string name="title_activity_main">فرمان</string>')
io.open(p, "w", encoding="utf-8", newline="").write(s)

# ------------------------------------------------------------------ gradle
p = os.path.join(ANDROID, "app", "build.gradle")
s = io.open(p, encoding="utf-8").read()
s = s.replace('versionName "1.0"', 'versionName "0.1.0"')
io.open(p, "w", encoding="utf-8", newline="").write(s)

# ------------------------------------------------------------------- icons
FONT = os.path.join(ROOT, "public", "assets", "fonts", "Vazirmatn-Bold.ttf")


def icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = size * 0.06
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=size * 0.22, fill=(11, 15, 17, 255))
    # Steering ring.
    ring = size * 0.33
    cx = cy = size / 2
    d.ellipse([cx - ring, cy - ring, cx + ring, cy + ring], outline=(237, 241, 242, 235), width=max(2, int(size * 0.045)))
    d.ellipse([cx - ring * 0.22, cy - ring * 0.22, cx + ring * 0.22, cy + ring * 0.22], fill=(46, 163, 127, 255))
    # Spokes.
    w = max(2, int(size * 0.03))
    d.line([cx - ring * 0.85, cy, cx + ring * 0.85, cy], fill=(237, 241, 242, 170), width=w)
    d.line([cx, cy - ring, cx, cy - ring * 0.25], fill=(237, 241, 242, 170), width=w)
    # Persian feh.
    try:
        font = ImageFont.truetype(FONT, int(size * 0.42))
        d.text((cx, cy - size * 0.02), "ف", font=font, fill=(10, 14, 15, 255), anchor="mm")
    except Exception:
        pass
    return img


sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
base = icon(512)
for density, px in sizes.items():
    folder = os.path.join(ANDROID, "app", "src", "main", "res", f"mipmap-{density}")
    os.makedirs(folder, exist_ok=True)
    img = base.resize((px, px), Image.LANCZOS)
    img.save(os.path.join(folder, "ic_launcher.png"), optimize=True)
    mask = Image.new("L", (px, px), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, px, px], fill=255)
    round_img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    round_img.paste(img, (0, 0), mask)
    round_img.save(os.path.join(folder, "ic_launcher_round.png"), optimize=True)

# Adaptive icon: foreground layer with the mark, green background.
fg_dir = os.path.join(ANDROID, "app", "src", "main", "res", "drawable")
os.makedirs(fg_dir, exist_ok=True)
fg = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
img = base.resize((300, 300), Image.LANCZOS)
fg.paste(img, (66, 66), img)
fg.save(os.path.join(fg_dir, "ic_launcher_foreground.png"), optimize=True)

p = os.path.join(ANDROID, "app", "src", "main", "res", "values", "colors.xml")
io.open(p, "w", encoding="utf-8", newline="").write(
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<resources>\n"
    "    <color name=\"ic_launcher_background\">#0B0F11</color>\n"
    "    <color name=\"colorPrimary\">#0B0F11</color>\n"
    "    <color name=\"colorPrimaryDark\">#080A0B</color>\n"
    "    <color name=\"colorAccent\">#2EA37F</color>\n"
    "</resources>\n"
)
print("android project patched")
