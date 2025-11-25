import json
import os
from typing import Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
TRENDS_PATH = os.path.join(BASE_DIR, "trends.json")


def update_trends_file() -> Dict[str, Any]:
    """Stub updater: create or refresh a minimal trends.json with sane defaults.
    Replace with real scraping/aggregation when ready.
    """
    data = {
        "culori_populare": ["negru", "alb", "bleumarin", "bej"],
        "sezon": "toamna/primavara",
        "materiale_populare": ["bumbac", "denim", "tricot"],
    }
    try:
        with open(TRENDS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    return data
