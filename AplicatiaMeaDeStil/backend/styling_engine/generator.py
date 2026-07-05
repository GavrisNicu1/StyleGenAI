"""Generator Versiunea 5.2 – fără manechin, prioritizare trenduri.

Adaptează implementarea transmisă astfel încât să funcționeze cu datele
produse de `app.py`. Dacă nu există `color_hex`, extrage unul din `dominant_rgb`.
"""

from __future__ import annotations
import itertools
import json
import os
from typing import Dict, Tuple, List, Any, Optional

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

def _normalize_category(value: Any) -> str:
    return str(value or "").strip().lower()


def _fold_text(value: Any) -> str:
    text = _normalize_category(value)
    return (
        text.replace("ă", "a")
        .replace("â", "a")
        .replace("î", "i")
        .replace("ș", "s")
        .replace("ş", "s")
        .replace("ț", "t")
        .replace("ţ", "t")
    )


# Maparea etichetelor UI -> tip de bază (simplificată)
CATEGORY_MAP: Dict[str, str] = {
    # Frontend normalized values
    "top": "Top",
    "pantalon": "Pantalon",
    "pantof": "Pantof",
    "costum": "Costum",
    "costume": "Costum",

    # Romanian labels from UI / legacy payloads
    "geacă": "Top", "geaca": "Top", "tricou": "Top", "bluză": "Top", "bluza": "Top", "altul": "Top",
    "pantalon": "Pantalon", "fustă": "Pantalon", "fusta": "Pantalon", "blugi": "Pantalon", "blug": "Pantalon", "jeans": "Pantalon",
    "costum": "Costum", "costume": "Costum",
    "adidași": "Pantof", "adidasi": "Pantof", "pantofi": "Pantof", "ghete": "Pantof", "altele": "Pantof",
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
            continue

        # Fallback robust pe elegant: păstrăm piesele clasice chiar dacă
        # detectorul de stil a etichetat imaginea greșit.
        if style_filter.lower() == "elegant":
            raw_label = _fold_text(it.get("raw_category_label") or it.get("type_from_user") or "")
            if (
                "camas" in raw_label
                or "sacou" in raw_label
                or _looks_like_coat_label(raw_label)
                or _looks_like_jacket_label(raw_label)
                or "costum" in raw_label
                or "pantalon" in raw_label
                or "pantof" in raw_label
                or "adida" in raw_label
            ):
                filtered.append(it)

        # Pentru casual iarna, păstrăm geaca/palton chiar dacă detectorul de stil greșește eticheta.
        if style_filter.lower() == "casual":
            raw_label = _fold_text(it.get("raw_category_label") or it.get("type_from_user") or "")
            if _looks_like_coat_label(raw_label) or _looks_like_jacket_label(raw_label):
                filtered.append(it)
    return filtered or items  # dacă filtrul elimină tot, revine la lista inițială


def _basic_type(item: Dict) -> str:
    category = _normalize_category(item.get("type_from_user", ""))
    mapped = CATEGORY_MAP.get(category)
    if mapped == "Costum":
        return "costum"

    style_parts = item.get("style", "").split("-")
    if len(style_parts) == 2:
        return style_parts[0].lower()
    category = _normalize_category(item.get("type_from_user", "Altul"))
    return CATEGORY_MAP.get(category, "Top").lower()


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


def _raw_category_label(item: Dict) -> str:
    return _fold_text(item.get("raw_category_label") or item.get("type_from_user") or "")


def _looks_like_jacket_label(label: str) -> bool:
    return (
        "geac" in label
        or "jachet" in label
        or "jacket" in label
        or "parka" in label
        or "anorac" in label
    )


def _looks_like_coat_label(label: str) -> bool:
    return (
        "palto" in label
        or "coat" in label
        or "mantou" in label
        or "trench" in label
    )


def _is_classic_elegant_top(item: Dict) -> bool:
    label = _raw_category_label(item)
    return "camas" in label or "sacou" in label


def _is_shirt_top(item: Dict) -> bool:
    label = _raw_category_label(item)
    return "camas" in label


def _is_classic_elegant_bottom(item: Dict) -> bool:
    label = _raw_category_label(item)
    return "pantalon" in label


def _is_blazer_top(item: Dict) -> bool:
    return "sacou" in _raw_category_label(item)


def _is_palton_top(item: Dict) -> bool:
    return _looks_like_coat_label(_raw_category_label(item))


def _is_jacket_top(item: Dict) -> bool:
    return _looks_like_jacket_label(_raw_category_label(item))


def _is_winter_outerwear_top(item: Dict) -> bool:
    return _is_palton_top(item) or _is_jacket_top(item)


def _is_winter_and_requires_outerwear(style_filter: str, season: Any) -> bool:
    season_text = _fold_text(season or "")
    return "iarna" in season_text


def _group_items_by_type(filtered_items: List[Dict]) -> Tuple[List[Dict], List[Dict], List[Dict], List[Dict]]:
    tops: List[Dict] = []
    bottoms: List[Dict] = []
    shoes: List[Dict] = []
    suits: List[Dict] = []
    for it in filtered_items:
        bt = _basic_type(it)
        if bt == "top":
            tops.append(it)
        elif bt == "pantalon":
            bottoms.append(it)
        elif bt == "pantof":
            shoes.append(it)
        elif bt == "costum":
            suits.append(it)
    return tops, bottoms, shoes, suits


def _validate_min_inventory(tops: List[Dict], bottoms: List[Dict], shoes: List[Dict], suits: List[Dict]) -> Optional[Dict[str, str]]:
    effective_tops = len(tops) + len(suits)
    effective_bottoms = len(bottoms) + len(suits)

    if effective_tops >= 5 and effective_bottoms >= 5 and len(shoes) >= 5:
        return None
    missing_parts: List[str] = []
    if effective_tops < 5:
        missing_parts.append(f"Top: {effective_tops}/5")
    if effective_bottoms < 5:
        missing_parts.append(f"Pantalon: {effective_bottoms}/5")
    if len(shoes) < 5:
        missing_parts.append(f"Pantof: {len(shoes)}/5")
    details = ", ".join(missing_parts)
    return {
        "error": (
            "Adaugă cel puțin 5 Top, 5 Pantalon (Costum contează ca set complet) și 5 Pantof pentru a genera o ținută. "
            f"Detectat acum: {details}."
        )
    }


def _select_best_outfit(
    tops: List[Dict],
    bottoms: List[Dict],
    shoes: List[Dict],
    suits: List[Dict],
    trend_hexes: set[str],
    season: Any,
    style: str,
) -> Tuple[float, Optional[Tuple[Dict, Dict, Dict]], Dict[str, Any]]:
    best_score = -1.0
    best_outfit: Optional[Tuple[Dict, Dict, Dict]] = None
    best_analysis: Dict[str, Any] = {}

    def _is_suit(item: Dict) -> bool:
        return _basic_type(item) == "costum"

    standard_tops = list(tops)
    standard_bottoms = list(bottoms)

    # Costumul poate fi purtat ca pereche completă (sus+jos)
    for suit in suits:
        standard_tops.append(suit)
        standard_bottoms.append(suit)

    is_elegant = style.lower() == "elegant"
    has_non_suit_tops = len(tops) > 0
    has_non_suit_bottoms = len(bottoms) > 0
    prefer_mixed_over_double_suit = is_elegant and has_non_suit_tops and has_non_suit_bottoms
    elegant_has_classic_top = any(_is_classic_elegant_top(it) for it in tops)
    elegant_has_classic_bottom = any(_is_classic_elegant_bottom(it) for it in bottoms)
    elegant_has_shirt_top = any(_is_shirt_top(it) for it in tops)

    # Dacă există cămașă în garderobă pe elegant, o impunem în recomandare.
    require_shirt_in_elegant = is_elegant and elegant_has_shirt_top
    require_classic_elegant_pair = is_elegant and elegant_has_classic_top and elegant_has_classic_bottom

    for (top, bottom, shoe) in itertools.product(standard_tops, standard_bottoms, shoes):
        # Interzice combinațiile "jumătate de costum", cu o excepție utilă:
        # pe elegant permitem Cămașă + Pantalon (din costum).
        if _is_suit(top) != _is_suit(bottom):
            allow_shirt_with_suit_bottom = is_elegant and (not _is_suit(top)) and _is_suit(bottom) and _is_shirt_top(top)
            if not allow_shirt_with_suit_bottom:
                continue

        if require_shirt_in_elegant and not _is_shirt_top(top):
            continue

        # Dacă există cămașă/sacou + pantalon, prioritatea absolută este pe această combinație elegantă.
        if require_classic_elegant_pair:
            if _is_suit(top) or _is_suit(bottom):
                continue
            if not _is_classic_elegant_top(top):
                continue
            if not _is_classic_elegant_bottom(bottom):
                continue

        # Dacă există cămașă, evităm perechi costum+costum.
        if require_shirt_in_elegant and _is_suit(top) and _is_suit(bottom):
            continue

        # Evită dublarea costumului când există deja opțiuni clasice elegant (cămașă/sacou + pantalon).
        if prefer_mixed_over_double_suit and _is_suit(top) and _is_suit(bottom):
            continue

        colors = [_ensure_color_hex(top), _ensure_color_hex(bottom), _ensure_color_hex(shoe)]
        score, analysis = calculate_outfit_score(colors, season=season, style=style)
        has_trend = any(c and _normalize_hex(c) in trend_hexes for c in colors)
        if has_trend:
            score += 0.15

        # Penalizare ușoară pentru perechi costum+costum; rămâne fallback valid când ai doar costume.
        if _is_suit(top) and _is_suit(bottom):
            score -= 0.08

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
    selected_outerwear: Optional[Dict],
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
        "outerwear": _color_name(selected_outerwear) if selected_outerwear else None,
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


def _select_outerwear_piece(
    tops: List[Dict],
    suits: List[Dict],
    selected_top: Dict,
    selected_bottom: Dict,
    style_filter: str,
    season: Any,
) -> Optional[Dict]:
    style = style_filter.lower()
    is_winter = _is_winter_and_requires_outerwear(style_filter, season)

    def _is_same_item(a: Dict, b: Dict) -> bool:
        return (a.get("original_path") or a.get("transparent_path")) == (b.get("original_path") or b.get("transparent_path"))

    non_selected_tops = [t for t in tops if not _is_same_item(t, selected_top)]

    if is_winter:
        # Iarna este obligatoriu geacă/palton.
        if style == "elegant":
            palton = next((t for t in non_selected_tops if _is_palton_top(t)), None)
            if palton:
                return palton
            geaca = next((t for t in non_selected_tops if _is_jacket_top(t)), None)
            if geaca:
                return geaca
        else:  # casual / sport / alte stiluri
            geaca = next((t for t in non_selected_tops if _is_jacket_top(t)), None)
            if geaca:
                return geaca
            palton = next((t for t in non_selected_tops if _is_palton_top(t)), None)
            if palton:
                return palton

        # Fallback: dacă piesa de top selectată este deja geacă/palton, o folosim ca strat exterior.
        if _is_winter_outerwear_top(selected_top):
            return selected_top
        return None

    if style != "elegant":
        return None

    blazer = next((t for t in non_selected_tops if _is_blazer_top(t)), None)
    if blazer:
        return blazer

    # Fallback: când folosim pantalon din costum, reutilizăm costumul ca sacou (din costum).
    if _basic_type(selected_bottom) == "costum":
        return selected_bottom
    if _basic_type(selected_top) == "costum":
        return selected_top

    return None


def generate_suggestion(items_list: List[Dict], filters: Dict):
    style_filter = (filters.get("style") or "casual")
    season = filters.get("season")
    sig, cached = _get_cached_suggestion(items_list, filters)
    if cached:
        # Regula nouă de iarnă are prioritate: ignorăm rezultate cache fără strat exterior obligatoriu.
        if _is_winter_and_requires_outerwear(style_filter, season) and not cached.get("outerwear"):
            pass
        else:
            return cached
    filtered_items = apply_style_filter(items_list, style_filter)
    if _is_winter_and_requires_outerwear(style_filter, season):
        # Păstrăm geaca/palton în setul eligibil chiar dacă clasificatorul de stil e imperfect.
        outerwear_pool = [it for it in items_list if _is_winter_outerwear_top(it)]
        existing_keys = {
            (it.get("original_path") or it.get("transparent_path") or id(it))
            for it in filtered_items
        }
        for it in outerwear_pool:
            key = it.get("original_path") or it.get("transparent_path") or id(it)
            if key not in existing_keys:
                filtered_items.append(it)
                existing_keys.add(key)

    tops, bottoms, shoes, suits = _group_items_by_type(filtered_items)
    inventory_error = _validate_min_inventory(tops, bottoms, shoes, suits)
    if inventory_error:
        return inventory_error

    trends_data = _load_trends()
    trend_hexes = set(_trend_hexes(trends_data))

    if _is_winter_and_requires_outerwear(style_filter, season):
        outerwear_keys = {
            (it.get("original_path") or it.get("transparent_path") or id(it))
            for it in tops
            if _is_winter_outerwear_top(it)
        }
        outerwear_count = len(outerwear_keys)
        if outerwear_count < 3:
            return {
                "error": (
                    "Pentru sezonul de iarnă trebuie să ai cel puțin 3 articole în categoria geci/paltoane. "
                    f"Detectat acum: {outerwear_count}/3."
                )
            }

    style = style_filter
    best_score, best_outfit, best_analysis = _select_best_outfit(tops, bottoms, shoes, suits, trend_hexes, season, style)

    if not best_outfit:
        return {"error": "Nu s-a putut construi ținuta."}
    selected_top, selected_bottom, selected_shoes = best_outfit
    selected_outerwear = _select_outerwear_piece(tops, suits, selected_top, selected_bottom, style_filter, season)

    analysis = _build_analysis_payload(
        best_score,
        best_analysis,
        style_filter,
        filters.get("season", "sezonul curent"),
        selected_top,
        selected_bottom,
        selected_shoes,
        selected_outerwear,
        trend_hexes,
    )

    def _piece(item: Dict, role: str) -> Dict:
        category = item.get("raw_category_label") or item.get("type_from_user")
        if _basic_type(item) == "costum":
            if role == "top":
                category = "Sacou (din costum)"
            elif role == "bottom":
                category = "Pantalon (din costum)"
            elif role == "outerwear":
                category = "Sacou (din costum)"

        return {
            "path": item.get("transparent_path") or item.get("original_path"),
            "transparent_path": item.get("transparent_path"),
            "color": _ensure_color_hex(item),
            "color_name": _color_name(item),
            "category": category,
            "text_logo": item.get("text_logo"),
        }

    result = {
        "top": _piece(selected_top, "top"),
        "bottom": _piece(selected_bottom, "bottom"),
        "shoes": _piece(selected_shoes, "shoes"),
        "analysis": analysis,
    }
    if selected_outerwear:
        result["outerwear"] = _piece(selected_outerwear, "outerwear")
    if sig:
        _cache_put(sig, result)
    return result
