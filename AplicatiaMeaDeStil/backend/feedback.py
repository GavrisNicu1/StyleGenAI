"""
Feedback module - stores user reactions for generated outfits and provides a simple preference summary.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List

from database import execute_query, execute_query_one


def save_outfit_feedback(user_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
    is_liked = 1 if bool(payload.get("is_liked")) else 0
    style = str(payload.get("style") or "").strip().lower()
    season = str(payload.get("season") or "").strip().lower()
    gender = str(payload.get("gender") or "").strip().lower()

    top_category = str(payload.get("top_category") or "").strip()
    bottom_category = str(payload.get("bottom_category") or "").strip()
    shoes_category = str(payload.get("shoes_category") or "").strip()

    top_color = str(payload.get("top_color") or "").strip().lower()
    bottom_color = str(payload.get("bottom_color") or "").strip().lower()
    shoes_color = str(payload.get("shoes_color") or "").strip().lower()

    query = """
        INSERT INTO outfit_feedback (
            user_id, is_liked, style, season, gender,
            top_category, bottom_category, shoes_category,
            top_color, bottom_color, shoes_color
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    execute_query(
        query,
        (
            user_id,
            is_liked,
            style,
            season,
            gender,
            top_category,
            bottom_category,
            shoes_category,
            top_color,
            bottom_color,
            shoes_color,
        ),
    )

    db_type = os.getenv('DB_TYPE', 'mssql').lower()
    if db_type == 'sqlite':
        created = execute_query_one(
            "SELECT created_at FROM outfit_feedback WHERE user_id = ? ORDER BY id DESC LIMIT 1",
            (user_id,),
        )
    else:
        created = execute_query_one(
            "SELECT TOP 1 created_at FROM outfit_feedback WHERE user_id = ? ORDER BY id DESC",
            (user_id,),
        )

    return {
        "status": "success",
        "message": "Feedback salvat",
        "feedback": {
            "liked": bool(is_liked),
            "style": style,
            "season": season,
            "created_at": str(created[0]) if created else None,
        },
    }


def _top_ranked(rows: List[Dict[str, Any]], key_name: str) -> List[Dict[str, Any]]:
    ranked = sorted(rows, key=lambda r: int(r.get("score", 0)), reverse=True)
    return [
        {"name": str(row.get(key_name) or ""), "score": int(row.get("score") or 0)}
        for row in ranked
        if str(row.get(key_name) or "").strip()
    ][:3]


def _row_value(row: Any, key: str, fallback_index: int = 0) -> Any:
    try:
        return row[key]
    except Exception:
        pass
    if isinstance(row, dict):
        return row.get(key)
    try:
        return row[fallback_index]
    except Exception:
        return None


def get_user_feedback_summary(user_id: int) -> Dict[str, Any]:
    totals_query = """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN is_liked = 1 THEN 1 ELSE 0 END) AS liked,
            SUM(CASE WHEN is_liked = 0 THEN 1 ELSE 0 END) AS disliked
        FROM outfit_feedback
        WHERE user_id = ?
    """
    totals = execute_query_one(totals_query, (user_id,))

    if not totals or int(totals[0] or 0) == 0:
        return {
            "status": "success",
            "summary": {
                "total": 0,
                "liked": 0,
                "disliked": 0,
                "top_categories": [],
                "top_colors": [],
            },
        }

    categories_query = """
        SELECT top_category AS label,
               SUM(CASE WHEN is_liked = 1 THEN 1 ELSE -1 END) AS score
        FROM outfit_feedback
        WHERE user_id = ? AND top_category <> ''
        GROUP BY top_category
        UNION ALL
        SELECT bottom_category AS label,
               SUM(CASE WHEN is_liked = 1 THEN 1 ELSE -1 END) AS score
        FROM outfit_feedback
        WHERE user_id = ? AND bottom_category <> ''
        GROUP BY bottom_category
    """
    colors_query = """
        SELECT top_color AS label,
               SUM(CASE WHEN is_liked = 1 THEN 1 ELSE -1 END) AS score
        FROM outfit_feedback
        WHERE user_id = ? AND top_color <> ''
        GROUP BY top_color
        UNION ALL
        SELECT bottom_color AS label,
               SUM(CASE WHEN is_liked = 1 THEN 1 ELSE -1 END) AS score
        FROM outfit_feedback
        WHERE user_id = ? AND bottom_color <> ''
        GROUP BY bottom_color
    """

    category_rows = execute_query(categories_query, (user_id, user_id), fetch=True)
    color_rows = execute_query(colors_query, (user_id, user_id), fetch=True)

    # Aggregate duplicate labels produced by UNION ALL.
    category_scores: Dict[str, int] = {}
    for row in category_rows:
        label = str(_row_value(row, "label", 0) or "").strip()
        if not label:
            continue
        category_scores[label] = category_scores.get(label, 0) + int(_row_value(row, "score", 1) or 0)

    color_scores: Dict[str, int] = {}
    for row in color_rows:
        label = str(_row_value(row, "label", 0) or "").strip()
        if not label:
            continue
        color_scores[label] = color_scores.get(label, 0) + int(_row_value(row, "score", 1) or 0)

    ranked_categories = _top_ranked(
        [{"label": key, "score": value} for key, value in category_scores.items()],
        "label",
    )
    ranked_colors = _top_ranked(
        [{"label": key, "score": value} for key, value in color_scores.items()],
        "label",
    )

    return {
        "status": "success",
        "summary": {
            "total": int(totals[0] or 0),
            "liked": int(totals[1] or 0),
            "disliked": int(totals[2] or 0),
            "top_categories": ranked_categories,
            "top_colors": ranked_colors,
        },
    }
