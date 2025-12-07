from __future__ import annotations

import base64
import io
import json
import os
import uuid
from typing import Any, Dict, List, Optional

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

# Importuri din proiectul tău (păstrează structura existentă)
from trends.aggregator import update_trends_file
from ai_model.style_classifier import classify_style
from styling_engine.color_detector import process_image_color
from ai_model.text_detector import extract_text
from styling_engine.generator import generate_suggestion

# Try‑on (opțional)
from styling_engine.tryon_warp import compose_on_mannequin, remove_bg as remove_bg_fn

# Propunere din web (nou)
from web_fetcher import get_web_outfit

# Authentication & Outfits
from auth import register_user, login_user, get_current_user, verify_jwt_token, require_admin, reset_user_password
from outfits import save_outfit, get_user_outfits, toggle_outfit_like, delete_outfit, get_outfit_by_id
from database import execute_query_one
from admin import (
    get_dashboard_stats, 
    get_activity_chart_data, 
    get_style_distribution,
    get_top_users,
    get_all_users,
    get_recent_outfits
)
from ai_metrics import (
    log_generation,
    get_generation_statistics,
    get_style_popularity,
    get_generation_timeline,
    get_common_errors
)

# ---------------- Config de bază ----------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # restrânge în producție

BASE_DIR = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
ASSETS_FOLDER = os.path.join(BASE_DIR, "assets")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}


def _is_allowed(file) -> bool:
    return bool(file and getattr(file, "mimetype", None) in ALLOWED_MIME)


def _to_rel(p: str) -> str:
    """Cale relativă pentru JSON, prietenoasă cu frontendul (expo Image)."""
    ap = os.path.abspath(p)
    rel = ap.replace(BASE_DIR, "").lstrip("\\/").replace("\\", "/")
    return rel


# ---------------- Static + health ----------------
@app.route("/uploads/<path:filename>")
def send_file_uploads(filename: str):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.get("/health")
def health() -> Any:
    return jsonify({"status": "ok"})


# ---------------- /get_suggestion (multipart) ----------------
@app.post("/get_suggestion")
def get_suggestion():
    import time
    start_time = time.time()
    
    # Get user_id from token if authenticated
    user_id = None
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_data = verify_jwt_token(token)
            if user_data:
                user_id = user_data.get('user_id')
    except Exception:
        pass
    
    if "files" not in request.files:
        return jsonify({"status": "error", "message": "Lipsește 'files'"}), 400

    uploaded_files = request.files.getlist("files")
    categories = request.form.getlist("categories")
    style_filter = request.form.get("style_filter", "casual").lower()
    season = request.form.get("season", "toamna/primavara").lower()
    gender = request.form.get("gender", "barbati").lower()
    silhouette = request.form.get("silhouette", "mediu").lower()

    print(f"[DEBUG] Received categories: {categories}")
    print(f"[DEBUG] Files count: {len(uploaded_files)}, Categories count: {len(categories)}")

    if (not uploaded_files) or (not categories) or (len(uploaded_files) != len(categories)):
        return jsonify({"status": "error", "message": "Datele trimise nu se potrivesc."}), 400

    item_data: List[Dict[str, Any]] = []

    for file, category_from_user in zip(uploaded_files, categories):
        if not _is_allowed(file):
            return jsonify({"status": "error", "message": f"Tip fișier neacceptat pentru {file.filename}"}), 400

        ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(file_path)

        # Optional: decupare fundal (rembg); dacă eșuează, păstrăm originalul
        transparent_path = file_path
        try:
            from rembg import remove  # opțional
            with Image.open(file_path) as im:
                cut = remove(im)
                transparent_name = f"transparent_{uuid.uuid4()}.png"
                transparent_path = os.path.join(UPLOAD_FOLDER, transparent_name)
                cut.save(transparent_path)
        except Exception:
            pass

        # Analize de bază (culoare, stil, text/logo)
        image_info = process_image_color(transparent_path)   # color aware de alpha
        style_prediction = classify_style(file_path)
        text_logo = extract_text(file_path)

        image_info["original_path"] = _to_rel(file_path)
        image_info["transparent_path"] = _to_rel(transparent_path)
        image_info["type_from_user"] = category_from_user
        image_info["style"] = style_prediction
        image_info["text_logo"] = text_logo

        item_data.append(image_info)

    filters = {"style": style_filter, "season": season, "gender": gender, "silhouette": silhouette}
    print(f"[INFO] Generez ținuta pentru filtre: {filters}")
    
    try:
        outfit_suggestion = generate_suggestion(item_data, filters)

        if outfit_suggestion.get("error"):
            processing_time = time.time() - start_time
            log_generation(user_id, style_filter, season, gender, processing_time, False, outfit_suggestion.get("error"))
            return jsonify({"status": "error", "message": outfit_suggestion.get("error")})

        processing_time = time.time() - start_time
        log_generation(user_id, style_filter, season, gender, processing_time, True, None)
        return jsonify({"status": "success", "outfit_suggestion": outfit_suggestion})
    except Exception as e:
        processing_time = time.time() - start_time
        log_generation(user_id, style_filter, season, gender, processing_time, False, str(e))
        return jsonify({"status": "error", "message": f"Generation failed: {e}"}), 500


# ---------------- /web_outfit (JSON) ----------------

def _load_trend_colors() -> List[str]:
    """Culori din trends.json (chei flexibile)."""
    p = os.path.join(BASE_DIR, "trends.json")
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
            colors = data.get("culori_populare") or data.get("colors") or data.get("palette") or []
            return [str(c).strip().lower() for c in colors if c]
        except Exception:
            return []
    return []


@app.post("/web_outfit")
def web_outfit():
    """
    Body(JSON): { style_filter, season, gender, trend_colors? }
    Return: { status: 'success', web_outfit: { top, bottom, shoes } }
    """
    import time
    start_time = time.time()
    
    # Get user_id from token if authenticated
    user_id = None
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_data = verify_jwt_token(token)
            if user_data:
                user_id = user_data.get('user_id')
    except Exception:
        pass
    
    try:
        payload = request.get_json(silent=True) or {}
        style_filter = str(payload.get("style_filter", "casual")).lower()
        season = str(payload.get("season", "toamna/primavara")).lower()
        gender = str(payload.get("gender", "barbati")).lower()

        trend_colors_payload = payload.get("trend_colors")
        from_payload = (
            [str(c).strip().lower() for c in trend_colors_payload if c]
            if isinstance(trend_colors_payload, list)
            else []
        )
        piece_colors_payload = payload.get("piece_colors")
        piece_colors = (
            {
                str(k).strip().lower(): str(v).strip().lower()
                for k, v in piece_colors_payload.items()
                if isinstance(k, str) and isinstance(v, str) and v.strip()
            }
            if isinstance(piece_colors_payload, dict)
            else {}
        )

        trend_colors = from_payload or _load_trend_colors()
        web_suggestion = get_web_outfit(style_filter, season, gender, trend_colors, piece_colors or None)
        
        processing_time = time.time() - start_time
        log_generation(user_id, style_filter, season, gender, processing_time, True, None)
        return jsonify({"status": "success", "web_outfit": web_suggestion}), 200
    except Exception as e:
        processing_time = time.time() - start_time
        log_generation(user_id, style_filter, season, gender, processing_time, False, str(e))
        return jsonify({"status": "error", "message": f"web_outfit failed: {e}"}), 500


# ---------------- Try‑on opțional ----------------
@app.post("/compose_mannequin")
def compose_mannequin_route():
    mannequin = request.form.get("mannequin", "male")
    silhouette = request.form.get("silhouette", "mediu")
    try:
        feather = int(request.form.get("feather", "2"))
    except Exception:
        feather = 2
    feather = max(0, min(6, feather))

    top_file = request.files.get("top")
    bottom_file = request.files.get("bottom")
    shoes_file = request.files.get("shoes")

    for f in (top_file, bottom_file, shoes_file):
        if f and not _is_allowed(f):
            return jsonify({"status": "error", "message": f"Tip fișier neacceptat ({getattr(f, 'filename', 'unknown')})"}), 400

    template_path = os.path.join(STATIC_FOLDER, f"mannequin_{mannequin}.png")
    try:
        template = Image.open(template_path).convert("RGBA")
    except Exception:
        template = Image.new("RGBA", (768, 1024), (255, 255, 255, 0))

    out_png = compose_on_mannequin(
        template,
        top_bytes=(top_file.read() if top_file else None),
        bottom_bytes=(bottom_file.read() if bottom_file else None),
        shoes_bytes=(shoes_file.read() if shoes_file else None),
        mannequin_kind=mannequin,
        silhouette=silhouette,
        feather=feather,
        cleanup=True,
    )
    b64 = base64.b64encode(out_png).decode("utf-8")
    return jsonify({"status": "success", "image_base64_png": b64, "size": list(template.size)})


@app.post("/compose_from_paths")
def compose_from_paths_route():
    data = request.get_json(force=True, silent=True) or {}
    mannequin = data.get("mannequin", "male")
    silhouette = data.get("silhouette", "mediu")
    try:
        feather = int(data.get("feather", 2))
    except Exception:
        feather = 2
    feather = max(0, min(6, feather))

    top_path = data.get("top_path")
    bottom_path = data.get("bottom_path")
    shoes_path = data.get("shoes_path")

    template_path = os.path.join(STATIC_FOLDER, f"mannequin_{mannequin}.png")
    try:
        template = Image.open(template_path).convert("RGBA")
    except Exception:
        template = Image.new("RGBA", (768, 1024), (255, 255, 255, 0))

    def read_bytes(p: Optional[str]) -> Optional[bytes]:
        if not p:
            return None
        safe_roots = [UPLOAD_FOLDER, STATIC_FOLDER, ASSETS_FOLDER]
        abs_p = os.path.abspath(os.path.join(BASE_DIR, p) if not os.path.isabs(p) else p)
        if not any(abs_p.startswith(os.path.abspath(root)) for root in safe_roots):
            return None
        try:
            with open(abs_p, "rb") as f:
                return f.read()
        except Exception:
            return None

    out_png = compose_on_mannequin(
        template,
        top_bytes=read_bytes(top_path),
        bottom_bytes=read_bytes(bottom_path),
        shoes_bytes=read_bytes(shoes_path),
        mannequin_kind=mannequin,
        silhouette=silhouette,
        feather=feather,
        cleanup=True,
    )
    b64 = base64.b64encode(out_png).decode("utf-8")
    return jsonify({"status": "success", "image_base64_png": b64, "size": list(template.size)})


# ---------------- /remove_bg ----------------
@app.post("/remove_bg")
def remove_bg_route():
    if "image" not in request.files:
        return jsonify({"status": "error", "message": "Lipsește ‘image’"}), 400
    raw_file = request.files["image"]
    if not _is_allowed(raw_file):
        return jsonify({"status": "error", "message": "Tip fișier neacceptat"}), 400

    raw = raw_file.read()
    cut_rgba, _ = remove_bg_fn(raw)
    buf = io.BytesIO()
    cut_rgba.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return jsonify({"status": "success", "image_base64_png": b64})


# ---------------- Tendințe ----------------
@app.get("/trends")
def get_trends():
    try:
        with open(os.path.join(BASE_DIR, "trends.json"), "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception:
        return jsonify({"culori_populare": [], "sezon": "", "materiale_populare": []})


@app.post("/trends/update")
def trends_update():
    try:
        data = update_trends_file()
        return jsonify({"status": "success", "trends": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------- Authentication Endpoints ----------------

@app.post("/auth/register")
def auth_register():
    """Register a new user"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        if len(password) < 6:
            return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400
        
        result = register_user(email, password)
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.post("/auth/login")
def auth_login():
    """Login a user"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        
        print(f"[LOGIN] Attempting login for email: {email}")
        
        if not email or not password:
            print("[LOGIN] Missing email or password")
            return jsonify({"status": "error", "message": "Email and password are required"}), 400
        
        print("[LOGIN] Calling login_user()...")
        result = login_user(email, password)
        print(f"[LOGIN] Success! User: {result.get('user', {}).get('email')}")
        return jsonify(result), 200
    except Exception as e:
        print(f"[LOGIN] Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 401


@app.post("/auth/reset-password")
def auth_reset_password():
    """Reset user password"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        email = data.get("email", "").strip()
        
        print(f"[RESET_PASSWORD] Request for email: {email}")
        
        if not email:
            print("[RESET_PASSWORD] Missing email")
            return jsonify({"status": "error", "message": "Email is required"}), 400
        
        print("[RESET_PASSWORD] Calling reset_user_password()...")
        result = reset_user_password(email)
        print(f"[RESET_PASSWORD] Success! New password generated for: {email}")
        return jsonify({
            "status": "success",
            "message": "Password reset successfully",
            "new_password": result['new_password']
        }), 200
    except Exception as e:
        print(f"[RESET_PASSWORD] Error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400


@app.get("/auth/me")
def auth_me():
    """Get current user from token"""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"status": "error", "message": "Invalid authorization header"}), 401
        
        token = auth_header.replace("Bearer ", "")
        user = get_current_user(token)
        return jsonify({"status": "success", "user": user}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 401


# ---------------- Outfits Endpoints ----------------

def _get_user_from_token():
    """Helper to extract user_id from JWT token"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Exception("Missing or invalid authorization header")
    
    token = auth_header.replace("Bearer ", "")
    payload = verify_jwt_token(token)
    return payload.get("user_id")


@app.post("/outfits/save")
def outfits_save():
    """Save a new outfit for the authenticated user"""
    try:
        user_id = _get_user_from_token()
        data = request.get_json(force=True, silent=True) or {}
        
        image_url = data.get("image_url", "").strip()
        style_data = data.get("style_data", {})
        
        print(f"[DEBUG] Save outfit request - user_id: {user_id}, image_url: {image_url}, style_data keys: {list(style_data.keys())}")
        
        # Verify user exists in database
        verify_query = "SELECT id FROM users WHERE id = ?"
        user_exists = execute_query_one(verify_query, (user_id,))
        
        if not user_exists:
            print(f"[ERROR] User {user_id} not found in database - token may be invalid")
            return jsonify({"status": "error", "message": "User not found. Please log in again."}), 401
        
        if not image_url:
            print("[ERROR] Missing image_url in request")
            return jsonify({"status": "error", "message": "image_url is required and cannot be empty"}), 400
        
        if not style_data:
            print("[WARN] Empty style_data in request")
        
        result = save_outfit(user_id, image_url, style_data)
        print(f"[SUCCESS] Outfit saved successfully - outfit_id: {result.get('outfit', {}).get('id')}")
        return jsonify({"status": "success", **result}), 201
    except Exception as e:
        print(f"[ERROR] Save outfit failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400


@app.get("/outfits/history")
def outfits_history():
    """Get all outfits for the authenticated user"""
    try:
        user_id = _get_user_from_token()
        liked_only = request.args.get("liked_only", "false").lower() == "true"
        
        outfits = get_user_outfits(user_id, liked_only)
        return jsonify({"status": "success", "outfits": outfits}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.post("/outfits/<int:outfit_id>/like")
def outfits_like(outfit_id: int):
    """Toggle like status for an outfit"""
    try:
        user_id = _get_user_from_token()
        result = toggle_outfit_like(outfit_id, user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.delete("/outfits/<int:outfit_id>")
def outfits_delete(outfit_id: int):
    """Delete an outfit"""
    try:
        user_id = _get_user_from_token()
        result = delete_outfit(outfit_id, user_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.get("/outfits/<int:outfit_id>")
def outfits_get(outfit_id: int):
    """Get a specific outfit by ID"""
    try:
        user_id = _get_user_from_token()
        outfit = get_outfit_by_id(outfit_id, user_id)
        return jsonify({"status": "success", "outfit": outfit}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


# ---------------- Admin Endpoints ----------------

def _get_admin_from_token():
    """Helper to verify admin access from JWT token"""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise Exception("Missing or invalid authorization header")
    
    token = auth_header.replace("Bearer ", "")
    admin_user = require_admin(token)
    return admin_user


@app.get("/admin/dashboard")
def admin_dashboard():
    """Get admin dashboard statistics (admin only)"""
    try:
        _get_admin_from_token()  # Verify admin access
        
        # Get all statistics
        stats = get_dashboard_stats()
        activity_data = get_activity_chart_data(days=7)
        style_dist = get_style_distribution()
        top_users = get_top_users(limit=5)
        recent_outfits = get_recent_outfits(limit=10)
        
        return jsonify({
            "status": "success",
            "dashboard": {
                "stats": stats,
                "activity_chart": activity_data,
                "style_distribution": style_dist,
                "top_users": top_users,
                "recent_outfits": recent_outfits
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 403


@app.get("/admin/users")
def admin_users():
    """Get all users list (admin only)"""
    try:
        _get_admin_from_token()  # Verify admin access
        
        users = get_all_users()
        return jsonify({
            "status": "success",
            "users": users
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 403


@app.get("/admin/ai-metrics")
def admin_ai_metrics():
    """Get AI generation metrics and analytics (admin only)"""
    try:
        _get_admin_from_token()  # Verify admin access
        
        stats = get_generation_statistics()
        style_popularity = get_style_popularity()
        timeline = get_generation_timeline(days=7)
        common_errors = get_common_errors(limit=5)
        
        return jsonify({
            "status": "success",
            "ai_metrics": {
                "statistics": stats,
                "style_popularity": style_popularity,
                "timeline": timeline,
                "common_errors": common_errors
            }
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 403


# ---------------- Entrypoint dev ----------------
if __name__ == "__main__":
    # atenție: debug=True doar pentru dev
   app.run(debug=True, host='0.0.0.0', port=5000)