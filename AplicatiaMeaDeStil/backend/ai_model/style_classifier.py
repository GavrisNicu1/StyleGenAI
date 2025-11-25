from typing import Optional

# Very naive stub: classify based on filename keywords

def classify_style(path: str, fallback: Optional[str] = None) -> str:
    p = path.lower()
    if any(k in p for k in ["suit", "blazer", "office", "formal"]):
        return "formal"
    if any(k in p for k in ["sport", "sneaker", "trainers"]):
        return "sport"
    if any(k in p for k in ["jeans", "denim", "hoodie", "tee", "tshirt", "tricou"]):
        return "casual"
    return fallback or "casual"
