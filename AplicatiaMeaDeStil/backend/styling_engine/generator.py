"""Generator Versiunea 5.2 – fără manechin, prioritizare trenduri.

Adaptează implementarea transmisă astfel încât să funcționeze cu datele
produse de `app.py`. Dacă nu există `color_hex`, extrage unul din `dominant_rgb`.
"""

from __future__ import annotations
import itertools
import json
import os
from typing import Dict, Tuple, List, Any

from .rules import calculate_outfit_score
import hashlib
import time

# In-memory cache (LRU-ish) pentru rezultate generate
_GEN_CACHE: Dict[str, Dict[str, Any]] = {}
_GEN_CACHE_ORDER: List[str] = []
_GEN_CACHE_MAX = 300  # ajustabil
_GEN_CACHE_TTL = 60 * 60 * 6  # 6 ore


def _cache_get(key: str) -> Any:
    data = _GEN_CACHE.get(key)
    if not data:
        return None
    if time.time() - data.get("_ts", 0) > _GEN_CACHE_TTL:
        # Expirat
        _GEN_CACHE.pop(key, None)
        return None
    return data.get("payload")


def _cache_put(key: str, payload: Any):
    now = time.time()
    if key in _GEN_CACHE:
        _GEN_CACHE[key]["_ts"] = now
        _GEN_CACHE[key]["payload"] = payload
        return
    _GEN_CACHE[key] = {"_ts": now, "payload": payload}
    _GEN_CACHE_ORDER.append(key)
    # Evict dacă depășim
    if len(_GEN_CACHE_ORDER) > _GEN_CACHE_MAX:
        oldest = _GEN_CACHE_ORDER.pop(0)
        _GEN_CACHE.pop(oldest, None)


def _wardrobe_signature(items: List[Dict], filters: Dict) -> str:
    slim = [
        {
            "p": it.get("original_path"),
            "t": it.get("type_from_user"),
            "c": _ensure_color_hex(it),
        }
        for it in items
    ]
    base = {
        "f": {k: filters.get(k) for k in ("style", "season", "gender", "silhouette")},
        "i": slim,
    }
    blob = json.dumps(base, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()

# Maparea etichetelor UI -> tip de bază (simplificată)
CATEGORY_MAP: Dict[str, str] = {
    "Geacă": "Top", "Tricou": "Top", "Bluză": "Top", "Altul": "Top",
    "Pantalon": "Pantalon", "Fustă": "Pantalon",
    "Adidași": "Pantof", "Pantofi": "Pantof", "Ghete": "Pantof", "Altele": "Pantof",
}

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
TRENDS_PATH = os.path.join(BASE_DIR, "trends.json")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _load_trends() -> Dict:
    try:
        with open(TRENDS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _is_hex(s: str) -> bool:
    if not isinstance(s, str):
        return False
    s = s.strip()
    return len(s) in (4, 7) and s.startswith("#") and all(c in "0123456789abcdefABCDEF" for c in s[1:])


def _normalize_hex(s: str) -> str:
    return s.lower() if isinstance(s, str) else s


def _trend_hexes(trends_data: Dict) -> List[str]:
    # Accept atât formatul cu liste de dict {hex:..} cât și liste brute
    hexes: List[str] = []
    colors = trends_data.get("culori_populare") or []
    for c in colors:
        if isinstance(c, dict):
            hx = c.get("hex")
            if _is_hex(hx):
                hexes.append(_normalize_hex(hx))
        elif isinstance(c, str) and _is_hex(c):
            hexes.append(_normalize_hex(c))
    return hexes


def apply_style_filter(items: List[Dict], style_filter: str) -> List[Dict]:
    compatibility = {"casual": ["casual", "sport"], "elegant": ["elegant"], "sport": ["sport"]}
    allowed = compatibility.get(style_filter.lower(), ["casual", "sport", "elegant"])
    filtered = []
    for it in items:
        item_style = it.get("style", "").lower().split("-")[-1]
        if item_style in allowed:
            filtered.append(it)
    return filtered or items  # dacă filtrul elimină tot, revine la lista inițială


def _basic_type(item: Dict) -> str:
    style_parts = item.get("style", "").split("-")
    if len(style_parts) == 2:
        return style_parts[0].lower()
    return CATEGORY_MAP.get(item.get("type_from_user", "Altul"), "Top").lower()


def _ensure_color_hex(item: Dict) -> str:
    hx = item.get("color_hex")
    if _is_hex(hx):
        return _normalize_hex(hx)
    # Fallback din dominant_rgb -> aproximare #RRGGBB
    rgb = item.get("dominant_rgb")
    if isinstance(rgb, (list, tuple)) and len(rgb) == 3:
        r, g, b = [max(0, min(255, int(x))) for x in rgb]
        return f"#{r:02x}{g:02x}{b:02x}"
    return "#aaaaaa"  # neutru


def _color_name(item: Dict) -> str:
    name = item.get("dominant_name") or item.get("color_name")
    if isinstance(name, str):
        return name.strip().lower()
    return ""


def _group_items_by_type(filtered_items: List[Dict]) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    tops: List[Dict] = []
    bottoms: List[Dict] = []
    shoes: List[Dict] = []
    for it in filtered_items:
        bt = _basic_type(it)
        if bt == "top":
            tops.append(it)
        elif bt == "pantalon":
            bottoms.append(it)
        elif bt == "pantof":
            shoes.append(it)
    return tops, bottoms, shoes


def _validate_min_inventory(tops: List[Dict], bottoms: List[Dict], shoes: List[Dict]) -> Optional[Dict[str, str]]:
    if len(tops) >= 5 and len(bottoms) >= 5 and len(shoes) >= 5:
        return None
    return {
        "error": "Adaugă cel puțin 5 tricouri (Top), 5 pantaloni (Pantalon) și 5 încălțăminte (Pantof) pentru a genera o ținută."
    }


def _select_best_outfit(
    tops: List[Dict],
    bottoms: List[Dict],
    shoes: List[Dict],
    trend_hexes: set[str],
    season: Any,
    style: str,
) -> Tuple[float, Optional[Tuple[Dict, Dict, Dict]], Dict[str, Any]]:
    best_score = -1.0
    best_outfit: Optional[Tuple[Dict, Dict, Dict]] = None
    best_analysis: Dict[str, Any] = {}

    for (top, bottom, shoe) in itertools.product(tops, bottoms, shoes):
        colors = [_ensure_color_hex(top), _ensure_color_hex(bottom), _ensure_color_hex(shoe)]
        score, analysis = calculate_outfit_score(colors, season=season, style=style)
        has_trend = any(c and _normalize_hex(c) in trend_hexes for c in colors)
        if has_trend:
            score += 0.15
        analysis["is_trend_match"] = has_trend
        if score > best_score:
            best_score = score
            best_outfit = (top, bottom, shoe)
            best_analysis = analysis

    return best_score, best_outfit, best_analysis


def _build_verdict(score: float) -> str:
    if score >= 0.80:
        return "Potrivire Excelentă"
    if score >= 0.65:
        return "Potrivire Bună"
    return "Poate fi îmbunătățită"


def _build_recommendations(
    is_trending: bool,
    trend_hexes: set[str],
    selected_top: Dict,
    selected_bottom: Dict,
    selected_shoes: Dict,
) -> List[Dict]:
    recommendations: List[Dict] = []
    sample_trends = list(trend_hexes)[:5]

    def _in_trend(hx: str) -> bool:
        return bool(hx and _normalize_hex(hx) in trend_hexes)

    if is_trending or not trend_hexes:
        return recommendations

    if not _in_trend(_ensure_color_hex(selected_top)):
        recommendations.append({"category": "Top", "suggested_hex": sample_trends})
    if not _in_trend(_ensure_color_hex(selected_bottom)):
        recommendations.append({"category": "Pantalon", "suggested_hex": sample_trends})
    if not _in_trend(_ensure_color_hex(selected_shoes)):
        recommendations.append({"category": "Încălțăminte", "suggested_hex": sample_trends})
    return recommendations


def _get_cached_suggestion(items_list: List[Dict], filters: Dict) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    if len(items_list) < 15:
        return None, None
    sig = _wardrobe_signature(items_list, filters)
    return sig, _cache_get(sig)


def _build_analysis_payload(
    best_score: float,
    best_analysis: Dict[str, Any],
    style_filter: str,
    season: str,
    selected_top: Dict,
    selected_bottom: Dict,
    selected_shoes: Dict,
    trend_hexes: set[str],
) -> Dict[str, Any]:
    verdict = _build_verdict(best_score)
    is_trending = bool(best_analysis.get("is_trend_match"))
    trend_note = (
        "Ținuta folosește cel puțin o culoare aflată în tendințe." if is_trending else "Ținuta nu folosește culori aflate în tendințe."
    )
    message = f"Ai creat o ținută în stil {style_filter}. {trend_note} Ajusteaz-o pentru {season} dacă dorești."

    recommendations = _build_recommendations(is_trending, trend_hexes, selected_top, selected_bottom, selected_shoes)
    piece_colors = {
        "top": _color_name(selected_top),
        "bottom": _color_name(selected_bottom),
        "shoes": _color_name(selected_shoes),
    }
    trend_colors_used = [c for c in piece_colors.values() if c]

    analysis = {
        "verdict": verdict,
        "message": message,
        "is_trending": is_trending,
        "score": round(float(best_score), 3),
    }
    if trend_colors_used:
        seen = set()
        ordered = []
        for color in trend_colors_used:
            if color and color not in seen:
                seen.add(color)
                ordered.append(color)
        if ordered:
            analysis["trend_colors_used"] = ordered
    analysis["piece_colors"] = piece_colors
    if recommendations:
        analysis["missing_recommendations"] = recommendations
    return analysis


def generate_suggestion(items_list: List[Dict], filters: Dict):
    style_filter = (filters.get("style") or "casual")
    sig, cached = _get_cached_suggestion(items_list, filters)
    if cached:
        return cached
    filtered_items = apply_style_filter(items_list, style_filter)
    tops, bottoms, shoes = _group_items_by_type(filtered_items)
    inventory_error = _validate_min_inventory(tops, bottoms, shoes)
    if inventory_error:
        return inventory_error

    trends_data = _load_trends()
    trend_hexes = set(_trend_hexes(trends_data))

    season = filters.get("season")
    style = style_filter
    best_score, best_outfit, best_analysis = _select_best_outfit(tops, bottoms, shoes, trend_hexes, season, style)

    if not best_outfit:
        return {"error": "Nu s-a putut construi ținuta."}
    selected_top, selected_bottom, selected_shoes = best_outfit

    analysis = _build_analysis_payload(
        best_score,
        best_analysis,
        style_filter,
        filters.get("season", "sezonul curent"),
        selected_top,
        selected_bottom,
        selected_shoes,
        trend_hexes,
    )

    def _piece(item: Dict) -> Dict:
        return {
            "path": item.get("transparent_path") or item.get("original_path"),
            "transparent_path": item.get("transparent_path"),
            "color": _ensure_color_hex(item),
            "color_name": _color_name(item),
            "category": item.get("type_from_user"),
            "text_logo": item.get("text_logo"),
        }

    result = {
        "top": _piece(selected_top),
        "bottom": _piece(selected_bottom),
        "shoes": _piece(selected_shoes),
        "analysis": analysis,
    }
    if sig:
        _cache_put(sig, result)
    return result
