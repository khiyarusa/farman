"""Sky dome textures (equirectangular) for FARMAN's weather states."""

from __future__ import annotations

import math
import os

import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "textures"))
W, H = 2048, 1024


def sky(top: tuple[int, int, int], horizon: tuple[int, int, int], ground: tuple[int, int, int],
        sun_dir: tuple[float, float, float], sun_color: tuple[int, int, int], clouds: float,
        haze: float, name: str) -> None:
    rng = np.random.default_rng(7)
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    x = np.linspace(0, 1, W, dtype=np.float32)[None, :]

    # Vertical gradient (v=0 is the zenith in an equirect map).
    sky_t = np.clip(y / 0.5, 0, 1) ** 1.9
    col = np.zeros((H, W, 3), dtype=np.float32)
    for c in range(3):
        top_c = top[c] / 255.0
        hor_c = horizon[c] / 255.0
        gnd_c = ground[c] / 255.0
        col[:, :, c] = np.where(y < 0.5, top_c + (hor_c - top_c) * (sky_t ** 0.85), hor_c + (gnd_c - hor_c) * ((y - 0.5) * 2) ** 0.6)

    # Sun glow.
    u = (x - (0.5 + math.atan2(sun_dir[0], sun_dir[2]) / (2 * math.pi))) * 2 * math.pi
    v = math.acos(max(-1.0, min(1.0, sun_dir[1]))) / math.pi
    du = np.minimum(np.abs(u), 2 * math.pi - np.abs(u))
    d = np.sqrt((du / math.pi) ** 2 + ((y - v) * 2) ** 2)
    glow = np.exp(-(d / 0.16) ** 2) * 0.85 + np.exp(-(d / 0.55) ** 2) * 0.25
    for c in range(3):
        col[:, :, c] += glow * (sun_color[c] / 255.0)

    # Soft clouds band.
    noise = rng.random((64, 128)).astype(np.float32)
    cloud_img = Image.fromarray((noise * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(18))
    cloud = np.asarray(cloud_img, dtype=np.float32) / 255.0
    band = np.exp(-((y - 0.30) / 0.10) ** 2)
    cloud_mask = np.clip((cloud - 0.52) * 3.2, 0, 1) * band * clouds
    col = col * (1 - cloud_mask[..., None]) + np.array([0.94, 0.95, 0.96]) * cloud_mask[..., None]

    # Horizon haze.
    haze_band = np.exp(-((y - 0.5) / 0.035) ** 2) * haze
    col = col * (1 - haze_band[..., None]) + np.array([0.82, 0.86, 0.88]) * haze_band[..., None]

    img = Image.fromarray(np.clip(col * 255, 0, 255).astype(np.uint8))
    img.save(os.path.join(OUT, name), optimize=True)
    print("wrote", name)


def main() -> None:
    # Sun high and slightly behind the camera's default view.
    sky((38, 78, 132), (118, 150, 176), (104, 92, 78), (-0.45, 0.62, 0.64), (255, 244, 214), 0.55, 0.12, "sky-day.png")
    sky((30, 38, 56), (140, 104, 82), (82, 70, 62), (-0.55, 0.25, 0.8), (255, 190, 130), 0.4, 0.25, "sky-dusk.png")
    sky((82, 90, 98), (146, 156, 162), (92, 92, 88), (-0.3, 0.75, 0.5), (240, 240, 236), 0.85, 0.6, "sky-rain.png")


if __name__ == "__main__":
    main()
