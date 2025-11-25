## StyleGenAI Backend (Flask v5.3)

Acest backend rulează API-ul v5.3 (Sugestie din garderobă + Propunere din Web, try‑on opțional, CORS, validări) în Flask. Un server FastAPI de test rămâne în `main.py`, dar recomandăm să pornești Flask.

### 1) Instalare dependențe (Windows, din folderul `backend/`)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2) Rulare (Flask)

```powershell
python app.py
```

Serverul pornește pe http://localhost:5000

Endpoint-uri principale:
- POST /get_suggestion (multipart: files[], categories[], + filtre)
- POST /web_outfit (JSON: {style_filter, season, gender})
- POST /compose_mannequin (opțional)
- POST /compose_from_paths (opțional)
- POST /remove_bg
- GET  /trends
- POST /trends/update

Static:
- GET /uploads/<file> – imaginile încărcate

### 3) Alternativ (FastAPI demo – opțional)

```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 5000
```

### 4) Notițe importante
- Am adăugat pachetele: Flask, flask-cors, rembg, opencv-python, duckduckgo-search, requests, beautifulsoup4 etc.
- Modulele interne (`trends/`, `ai_model/`, `styling_engine/`, `web_fetcher.py`) au implementări minime/stub – înlocuiește cu logica ta reală când e gata.
- `generator.generate_suggestion` setează `piece.path` din `transparent_path` sau `original_path` pentru a fi afișate corect în aplicația Expo.
