from typing import Optional, Tuple
from PIL import Image
import io

try:
    from rembg import remove as rembg_remove
except Exception:  # pragma: no cover
    rembg_remove = None


def remove_bg(raw_bytes: bytes) -> Tuple[Image.Image, Optional[Image.Image]]:
    """Return RGBA image with background removed and optional mask.
    """
    im = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    if rembg_remove is None:
        return im, None
    cut = rembg_remove(im)
    return cut.convert("RGBA"), None


def compose_on_mannequin(
    template: Image.Image,
    top_bytes: Optional[bytes],
    bottom_bytes: Optional[bytes],
    shoes_bytes: Optional[bytes],
    _mannequin_kind: str = "male",
    _silhouette: str = "mediu",
    _feather: int = 2,
    _cleanup: bool = True,
) -> bytes:
    """Very simple 2D overlay composition."""
    canvas = template.copy()

    def place(raw: Optional[bytes], box):
        if not raw:
            return
        cut, _ = remove_bg(raw)
        x1, y1, x2, y2 = box
        bw, bh = x2 - x1, y2 - y1
        fitted = cut.copy()
        fitted.thumbnail((bw, bh), Image.LANCZOS)
        fw, fh = fitted.size
        offset = (x1 + (bw - fw) // 2, y1 + (bh - fh) // 2)
        canvas.alpha_composite(fitted, dest=offset)

    W, H = canvas.size
    top_box = (int(0.23 * W), int(0.17 * H), int(0.77 * W), int(0.47 * H))
    bottom_box = (int(0.28 * W), int(0.46 * H), int(0.72 * W), int(0.86 * H))
    shoes_box = (int(0.35 * W), int(0.84 * H), int(0.65 * W), int(0.98 * H))

    place(top_bytes, top_box)
    place(bottom_bytes, bottom_box)
    place(shoes_bytes, shoes_box)

    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()
