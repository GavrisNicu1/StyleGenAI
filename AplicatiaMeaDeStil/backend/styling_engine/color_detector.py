from typing import Dict
from PIL import Image

# Minimal color analysis that returns a rough dominant color name

NAMED = {
    "negru": (0, 0, 0),
    "alb": (255, 255, 255),
    "gri": (128, 128, 128),
    "rosu": (200, 40, 40),
    "verde": (40, 160, 60),
    "albastru": (40, 80, 200),
    "bej": (220, 200, 160),
    "bleumarin": (20, 40, 90),
}


def _closest_name(rgb):
    r, g, b = rgb
    best = None
    best_d = 1e9
    for name, (nr, ng, nb) in NAMED.items():
        d = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2
        if d < best_d:
            best_d = d
            best = name
    return best or "neutru"


def process_image_color(path: str) -> Dict:
    try:
        with Image.open(path).convert("RGBA") as im:
            pixels = [px[:3] for px in im.getdata() if px[3] > 0]
            if not pixels:
                dom = (200, 200, 200)
            else:
                count = len(pixels)
                dom = tuple(int(sum(channel[i] for channel in pixels) / count) for i in range(3))
            name = _closest_name(dom)
            return {"dominant_rgb": dom, "dominant_name": name}
    except Exception:
        return {"dominant_rgb": (200, 200, 200), "dominant_name": "neutru"}
