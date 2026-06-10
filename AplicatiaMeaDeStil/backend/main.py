import base64
import io
from typing import Annotated, List, Optional, Tuple

from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from rembg import remove

app = FastAPI(title="StyleGenAI Backend (Stub)")

# Allow Expo dev hosts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/get_suggestion")
async def get_suggestion(
    style_filter: Annotated[str, Form(...)],
    season: Annotated[str, Form(...)],
    gender: Annotated[str, Form(...)],
    silhouette: Annotated[str, Form(...)],
    categories: Annotated[List[str], Form()] = [],
    files: Optional[List[UploadFile]] = None,
):
    # NOTE: This is a stub/dummy response to unblock frontend integration.
    # Replace this with your actual model + logic (brand detection, projection, trends).
    suggestion = {
        "top": {"path": "static/sample_top.png", "category": "Tricou"},
        "bottom": {"path": "static/sample_bottom.png", "category": "Pantalon"},
        "shoes": {"path": "static/sample_shoes.png", "category": "Adidași"},
        "analysis": {
            "verdict": f"Tinuta {style_filter}/{season}/{gender}/{silhouette}",
            "message": "Exemplu de mesaj. Înlocuiește cu analiza reală.",
            "is_trending": True,
        },
    }
    return {"status": "success", "outfit_suggestion": suggestion}


def _load_image_file_to_rgba(image_bytes: bytes) -> Image.Image:
    """Load to an RGBA Pillow image, preserving transparency when present."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    return img


def _resize_to_fit(box_size: Tuple[int, int], img: Image.Image) -> Image.Image:
    """Resize image preserving aspect ratio to fit within box_size."""
    bw, bh = box_size
    iw, ih = img.size
    scale = min(bw / iw, bh / ih)
    new_size = (max(1, int(iw * scale)), max(1, int(ih * scale)))
    return img.resize(new_size, Image.LANCZOS)


@app.post("/compose_mannequin")
async def compose_mannequin(
    mannequin: Annotated[str, Form()] = "male",
    top: Annotated[Optional[UploadFile], File()] = None,
    bottom: Annotated[Optional[UploadFile], File()] = None,
    shoes: Annotated[Optional[UploadFile], File()] = None,
):
    """
    Accepts clothing photos, removes background, and composites them onto a
    mannequin template. Returns a PNG image as base64 in JSON.

    This is a pragmatic 2D overlay, not a 3D try-on. For best results, send
    product photos shot from the front on a neutral background.
    """

    # 1) Load mannequin template (place your own PNG in backend/static)
    template_path = f"backend/static/mannequin_{mannequin}.png"
    try:
        template = Image.open(template_path).convert("RGBA")
    except Exception:
        # Fallback to a blank canvas if template missing
        template = Image.new("RGBA", (768, 1024), (255, 255, 255, 0))

    canvas = template.copy()

    async def place_item(file: Optional[UploadFile], box: Tuple[int, int, int, int]):
        if not file:
            return
        raw = await file.read()
        # Remove background
        cut = remove(raw)  # bytes
        item_img = _load_image_file_to_rgba(cut)
        # Fit and paste centered inside box
        x1, y1, x2, y2 = box
        bw, bh = x2 - x1, y2 - y1
        fitted = _resize_to_fit((bw, bh), item_img)
        fw, fh = fitted.size
        offset = (x1 + (bw - fw) // 2, y1 + (bh - fh) // 2)
        canvas.alpha_composite(fitted, dest=offset)

    # 2) Very simple heuristic boxes measured for a 768x1024 template
    W, H = canvas.size
    top_box = (int(0.23 * W), int(0.17 * H), int(0.77 * W), int(0.47 * H))
    bottom_box = (int(0.28 * W), int(0.46 * H), int(0.72 * W), int(0.86 * H))
    shoes_box = (int(0.35 * W), int(0.84 * H), int(0.65 * W), int(0.98 * H))

    await place_item(top, top_box)
    await place_item(bottom, bottom_box)
    await place_item(shoes, shoes_box)

    # 3) Encode to base64 PNG
    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return {"status": "success", "image_base64_png": encoded, "size": list(canvas.size)}

# To run: python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 5000
