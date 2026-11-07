import re
from decimal import Decimal

_TIME_UNITS = {"days": 1440, "hrs": 60, "mins": 1}
_TIME_RE = re.compile(r"(\d+)\s*(days|hrs|mins)")

_NUTRITION_LABELS = {
    "protein": "Protein",
    "fat": "Total Fat",
    "carbs": "Total Carbohydrate",
    "fiber": "Dietary Fiber",
}

_SPLIT_RE = re.compile(r",\s+(?=[\d½¼¾⅓⅔⅛])")


def parse_minutes(text: str) -> int | None:
    matches = _TIME_RE.findall(text or "")
    if not matches:
        return None
    return sum(int(n) * _TIME_UNITS[u] for n, u in matches)


def parse_nutrition(text: str) -> dict[str, Decimal]:
    result = {key: Decimal(0) for key in _NUTRITION_LABELS}
    for segment in (text or "").split(","):
        segment = segment.strip()
        for key, label in _NUTRITION_LABELS.items():
            m = re.match(rf"{re.escape(label)}\s+(\d+(?:\.\d+)?)\s*g\b", segment)
            if m:
                result[key] = Decimal(m.group(1))
    return result


def parse_category(path: str) -> tuple[str | None, str | None]:
    parts = [p for p in (path or "").split("/") if p.strip()]
    if not parts:
        return None, None
    return parts[0], "/".join(parts)


def split_ingredients(text: str) -> list[str]:
    parts = _SPLIT_RE.split(text or "")
    cleaned = (" ".join(p.split()) for p in parts)
    return [p for p in cleaned if p]
