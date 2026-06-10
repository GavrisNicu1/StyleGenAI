from __future__ import annotations
from typing import List, Tuple, Dict, Any, Optional

# Extended scoring: input = list of 3 hex colors [top, bottom, shoes]
# Returns (score, analysis_dict)
# Components (base):
#  - Harmony (0..0.4)
#  - Contrast balance (0..0.2)
#  - Accent / Neutral mix (0..0.2)
#  - Repetition penalty (-0..0.1)
#  - Diversity bonus (0..0.2)
# Extensions:
#  - Neutral count, accent presence indicators
#  - Distinct pair count
#  - Recommended accent color suggestion if palette too flat
#  - Optional season/style modifiers (light touch) via params

NEUTRALS = {"#000000", "#ffffff", "#f5f5f5", "#808080", "#aaaaaa", "#cccccc", "#222222", "#444444", "#e0e0e0", "#beige", "#f5deb3"}
ACCENT_LIBRARY = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de"]  # iOS palette inspired accents


def _contrast_score(distinct_pairs: int) -> float:
    if 1 <= distinct_pairs <= 2:
        return 0.2
    if distinct_pairs == 3:
        return 0.1
    return 0.05


def _accent_mix_score(neutral_count: int) -> float:
    if neutral_count == 2:
        return 0.2
    if neutral_count == 1:
        return 0.15
    if neutral_count == 3:
        return 0.10
    return 0.12


def _repetition_penalty(unique_colors: int) -> float:
    if unique_colors == 3:
        return 0.0
    if unique_colors == 2:
        return 0.05
    return 0.10


def _diversity_bonus(unique_colors: int, avg_d: float) -> float:
    if unique_colors == 3 and avg_d < 0.55:
        return 0.2
    if unique_colors == 3:
        return 0.12
    return 0.05


def _style_modifier(style: Optional[str], neutral_count: int, distinct_pairs: int) -> float:
    if not style:
        return 0.0
    st = style.lower()
    if st == "elegant" and neutral_count >= 2:
        return 0.03
    if st == "sport" and distinct_pairs >= 2:
        return 0.02
    if st == "casual" and neutral_count in (1, 2):
        return 0.02
    return 0.0


def _season_modifier(season: Optional[str], neutral_count: int, distinct_pairs: int) -> float:
    if not season:
        return 0.0
    se = season.lower()
    if se.startswith("iarna") and neutral_count >= 2:
        return 0.02
    if se.startswith("vara") and neutral_count == 1 and distinct_pairs >= 2:
        return 0.02
    return 0.0


def _hex_to_rgb(h: str) -> Tuple[int, int, int]:
    h = h.strip().lstrip('#')
    if len(h) == 3:
        h = ''.join(c*2 for c in h)
    try:
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    except Exception:
        return 170, 170, 170  # fallback gray


def _dist(a: Tuple[int, int, int], b: Tuple[int, int, int]) -> float:
    return ((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2) ** 0.5 / 441.67295593  # normalize ~sqrt(255^2*3)


def _closest_accent(neutral_hexes: List[str]) -> str:
    # Pick an accent farthest from average neutral cluster
    if not neutral_hexes:
        return ACCENT_LIBRARY[0]
    rgbs = [_hex_to_rgb(h) for h in neutral_hexes]
    avg = (
        sum(c[0] for c in rgbs) / len(rgbs),
        sum(c[1] for c in rgbs) / len(rgbs),
        sum(c[2] for c in rgbs) / len(rgbs),
    )
    best = None
    best_d = -1
    for a in ACCENT_LIBRARY:
        d = _dist(_hex_to_rgb(a), (int(avg[0]), int(avg[1]), int(avg[2])))
        if d > best_d:
            best_d = d
            best = a
    return best or ACCENT_LIBRARY[0]


def calculate_outfit_score(hex_colors: List[str], *, season: Optional[str] = None, style: Optional[str] = None) -> Tuple[float, Dict[str, Any]]:
    if len(hex_colors) != 3:
        return 0.0, {"error": "Need exactly 3 colors"}
    top_c, bottom_c, shoes_c = [c.lower() for c in hex_colors]
    rgbs = [_hex_to_rgb(c) for c in (top_c, bottom_c, shoes_c)]

    # Harmony = inverse distances (closer colors moderately good but not identical)
    d_tb = _dist(rgbs[0], rgbs[1])
    d_bs = _dist(rgbs[1], rgbs[2])
    d_ts = _dist(rgbs[0], rgbs[2])
    avg_d = (d_tb + d_bs + d_ts) / 3.0
    # Ideal moderate distance ~0.35; penalize too low/high
    harmony = max(0.0, 1.0 - abs(avg_d - 0.35) / 0.35) * 0.4

    # Contrast balance: at least one pair reasonably distinct (>0.25) and not all extreme
    distinct_pairs = sum(d > 0.25 for d in (d_tb, d_bs, d_ts))
    contrast = _contrast_score(distinct_pairs)

    # Accent/neutral mix: prefer 1 accent + 2 neutrals or 2 neutrals + 1 near-neutral
    neutral_flags = [c in NEUTRALS for c in (top_c, bottom_c, shoes_c)]
    neutral_count = sum(neutral_flags)
    accent_mix = _accent_mix_score(neutral_count)

    # Repetition penalty: identical hex among pieces
    unique_colors = len(set(hex_colors))
    repetition_penalty = _repetition_penalty(unique_colors)

    # Diversity bonus: reward 3 distinct but not wildly clashing
    diversity_bonus = _diversity_bonus(unique_colors, avg_d)

    # Style/season modifiers (very light influence so base score dominates)
    style_mod = _style_modifier(style, neutral_count, distinct_pairs)
    season_mod = _season_modifier(season, neutral_count, distinct_pairs)

    score = harmony + contrast + accent_mix + diversity_bonus - repetition_penalty + style_mod + season_mod
    score = max(0.0, min(1.0, score))

    # Accent recommendation if palette too flat (all neutral) or very low harmony
    recommended_accent = None
    if neutral_count >= 2 and unique_colors <= 2:
        recommended_accent = _closest_accent([c for c, nf in zip((top_c, bottom_c, shoes_c), neutral_flags) if nf])
    elif harmony < 0.15 and distinct_pairs == 0:
        recommended_accent = _closest_accent([top_c, bottom_c, shoes_c])

    analysis = {
        "harmony": round(harmony, 3),
        "contrast": round(contrast, 3),
        "accent_mix": round(accent_mix, 3),
        "diversity_bonus": round(diversity_bonus, 3),
        "repetition_penalty": round(repetition_penalty, 3),
        "avg_distance": round(avg_d, 3),
        "neutral_count": neutral_count,
        "distinct_pairs": distinct_pairs,
        "style_mod": round(style_mod, 3),
        "season_mod": round(season_mod, 3),
    }
    if recommended_accent:
        analysis["recommended_accent_hex"] = recommended_accent
    return score, analysis
