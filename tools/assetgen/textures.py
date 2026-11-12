"""Procedural, licence-free textures for FARMAN (Pillow only).

Generates tileable PBR-ish albedo maps plus Persian road signage faces.
Everything is deterministic (fixed seeds) so rebuilds are reproducible.
"""

from __future__ import annotations

import io
import math
import os
import random
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "textures")
FONT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "fonts")

rng = random.Random(20261112)
np_rng = np.random.default_rng(20261112)


def _noise(size: int, octaves: int = 4) -> np.ndarray:
    """Cheap fractal value noise in [0,1]."""
    out = np.zeros((size, size), dtype=np.float32)
    amp = 1.0
    total = 0.0
    for o in range(octaves):
        n = 2 ** (o + 2)
        base = np_rng.random((n, n)).astype(np.float32)
        img = Image.fromarray((base * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
        arr = np.asarray(img, dtype=np.float32) / 255.0
        out += arr * amp
        total += amp
        amp *= 0.5
    return out / total


def tileable(size: int, scale: int, octaves: int = 4) -> np.ndarray:
    """Wraps noise so the texture tiles seamlessly."""
    a = _noise(size, octaves)
    b = _noise(size, octaves)
    x = np.linspace(0, 1, size, dtype=np.float32)[None, :]
    y = np.linspace(0, 1, size, dtype=np.float32)[:, None]
    return a * (1 - x) * (1 - y) + b * x * y


def save_png(name: str, img: Image.Image) -> str:
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    img.save(path, optimize=True)
    return path


def png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def asphalt(size: int = 512) -> Image.Image:
    n = tileable(size, 8, 5)
    base = 26 + n * 26
    img = np.stack([base, base * 1.02, base * 1.05], axis=2)
    # Aggregate speckle.
    spec = np_rng.random((size, size))
    mask = spec > 0.985
    img[mask] = np.array([70, 72, 74], dtype=np.float32)
    mask2 = spec < 0.02
    img[mask2] = np.array([12, 13, 14], dtype=np.float32)
    # A few tar seams.
    arr = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(arr)
    for _ in range(3):
        y = rng.randint(0, size)
        d.line([(0, y), (size, y + rng.randint(-6, 6))], fill=(18, 19, 20), width=2)
    return arr.filter(ImageFilter.GaussianBlur(0.4))


def grass(size: int = 512) -> Image.Image:
    n = tileable(size, 6, 5)
    g = 62 + n * 58
    r = 44 + n * 32
    b = 34 + n * 22
    img = np.stack([r, g, b], axis=2)
    arr = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(arr)
    for _ in range(1800):
        x, y = rng.randrange(size), rng.randrange(size)
        d.line([(x, y), (x + rng.randint(-2, 2), y - rng.randint(2, 7))], fill=(rng.randint(40, 90), rng.randint(80, 130), rng.randint(30, 60)))
    return arr.filter(ImageFilter.GaussianBlur(0.6))


def rock(size: int = 512) -> Image.Image:
    n = tileable(size, 5, 6)
    base = 92 + n * 62
    img = np.stack([base * 1.02, base * 0.98, base * 0.92], axis=2)
    arr = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(arr)
    for _ in range(70):
        x, y = rng.randrange(size), rng.randrange(size)
        w = rng.randint(10, 60)
        h = rng.randint(4, 18)
        shade = rng.randint(-26, 26)
        d.ellipse([x, y, x + w, y + h], outline=(int(70 + shade), int(68 + shade), int(64 + shade)), width=2)
    return arr.filter(ImageFilter.GaussianBlur(0.7))


def concrete(size: int = 512) -> Image.Image:
    n = tileable(size, 6, 4)
    base = 128 + n * 30
    img = np.stack([base, base * 1.01, base * 1.02], axis=2)
    arr = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(arr)
    for i in range(0, size, 128):
        d.line([(i, 0), (i, size)], fill=(110, 111, 112), width=2)
        d.line([(0, i), (size, i)], fill=(110, 111, 112), width=2)
    return arr.filter(ImageFilter.GaussianBlur(0.5))


def dirt(size: int = 512) -> Image.Image:
    n = tileable(size, 7, 5)
    base = 92 + n * 44
    img = np.stack([base * 1.18, base * 0.96, base * 0.72], axis=2)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))


def facade(size: int = 256, floors: int = 4, columns: int = 5, wall: Tuple[int, int, int] = (196, 186, 168)) -> Image.Image:
    img = Image.new("RGB", (size, size), wall)
    d = ImageDraw.Draw(img)
    # Brick texture.
    for y in range(0, size, 10):
        for x in range(-10, size, 22):
            off = 11 if (y // 10) % 2 else 0
            d.rectangle([x + off, y, x + off + 20, y + 8], outline=(wall[0] - 12, wall[1] - 12, wall[2] - 12))
    # Windows.
    margin_x = size // (columns * 4)
    margin_y = size // (floors * 5)
    cw = (size - margin_x * (columns + 1)) // columns
    ch = (size - margin_y * (floors + 1)) // floors
    for f in range(floors):
        for c in range(columns):
            x0 = margin_x + c * (cw + margin_x)
            y0 = margin_y + f * (ch + margin_y)
            d.rectangle([x0, y0, x0 + cw, y0 + ch], fill=(38, 46, 52))
            d.rectangle([x0 + 2, y0 + 2, x0 + cw - 2, y0 + ch - 2], outline=(120, 130, 136), width=2)
            if rng.random() < 0.18:
                d.rectangle([x0 + 2, y0 + 2, x0 + cw - 2, y0 + ch - 2], fill=(92, 84, 62))
    return img


def shopfront(size: int = 256) -> Image.Image:
    img = Image.new("RGB", (size, size), (176, 168, 156))
    d = ImageDraw.Draw(img)
    d.rectangle([0, size * 0.55, size, size], fill=(64, 62, 58))
    for i in range(3):
        x0 = 10 + i * (size // 3)
        d.rectangle([x0, size * 0.18, x0 + size // 4, size * 0.5], fill=(30, 36, 40))
        d.rectangle([x0, size * 0.18, x0 + size // 4, size * 0.5], outline=(150, 148, 140), width=3)
    # Awning stripes.
    for i in range(0, size, 16):
        d.rectangle([i, size * 0.52, i + 8, size * 0.62], fill=(150, 52, 44))
    return img


def sign_face(width: int = 512, height: int = 160, text: str = "تهران", sub: str = "۱۲ کیلومتر", bg=(22, 74, 140)) -> Image.Image:
    img = Image.new("RGB", (width, height), bg)
    d = ImageDraw.Draw(img)
    d.rectangle([4, 4, width - 5, height - 5], outline=(240, 240, 235), width=4)

    def shape(s: str) -> str:
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            return get_display(arabic_reshaper.reshape(s))
        except Exception:
            return s

    font_path = os.path.join(FONT_DIR, "Vazirmatn-Bold.ttf")
    if not os.path.exists(font_path):
        font_path = os.path.join(FONT_DIR, "Vazirmatn-Regular.ttf")
    try:
        font = ImageFont.truetype(font_path, int(height * 0.38))
        small = ImageFont.truetype(font_path, int(height * 0.2))
    except Exception:
        font = ImageFont.load_default()
        small = font
    t = shape(text)
    bbox = d.textbbox((0, 0), t, font=font)
    d.text(((width - (bbox[2] - bbox[0])) / 2, height * 0.12), t, font=font, fill=(245, 246, 242))
    if sub:
        s2 = shape(sub)
        bbox2 = d.textbbox((0, 0), s2, font=small)
        d.text(((width - (bbox2[2] - bbox2[0])) / 2, height * 0.62), s2, font=small, fill=(225, 232, 236))
    return img


def main() -> None:
    save_png("asphalt.png", asphalt())
    save_png("grass.png", grass())
    save_png("rock.png", rock())
    save_png("concrete.png", concrete())
    save_png("dirt.png", dirt())
    save_png("facade-a.png", facade(wall=(198, 188, 170)))
    save_png("facade-b.png", facade(wall=(178, 170, 158), floors=5, columns=4))
    save_png("facade-c.png", facade(wall=(150, 142, 130), floors=3, columns=6))
    save_png("shopfront.png", shopfront())
    save_png("sign-tehran.png", sign_face(text="تهران", sub="۱۲ کیلومتر"))
    save_png("sign-chalus.png", sign_face(text="چالوس", sub="۴۵ کیلومتر", bg=(18, 96, 70)))
    save_png("sign-police.png", sign_face(text="کنترل سرعت", sub="۵۰", bg=(190, 40, 36)))
    print("textures written to", os.path.abspath(OUT_DIR))


if __name__ == "__main__":
    main()
