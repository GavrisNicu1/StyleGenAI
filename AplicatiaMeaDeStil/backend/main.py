from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

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
    style_filter: str = Form(...),
    season: str = Form(...),
    gender: str = Form(...),
    silhouette: str = Form(...),
    categories: List[str] = Form([]),
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

# To run: python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 5000
