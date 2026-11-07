from collections.abc import Sequence
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

_HUNDRED = Decimal(100)
_KCAL_Q = Decimal(1)
_MACRO_Q = Decimal("0.01")


@dataclass(frozen=True)
class Macros:
    kcal: Decimal
    protein: Decimal
    fat: Decimal
    carbs: Decimal
    fiber: Decimal


def item_macros(per_100g: Macros, weight_g: Decimal) -> Macros:
    """Scale per-100g values to the given weight (unrounded)."""
    f = weight_g / _HUNDRED
    return Macros(
        kcal=per_100g.kcal * f,
        protein=per_100g.protein * f,
        fat=per_100g.fat * f,
        carbs=per_100g.carbs * f,
        fiber=per_100g.fiber * f,
    )


def recipe_per_serving(
    items: Sequence[tuple[Macros, Decimal]], servings: int
) -> Macros:
    """Sum per-100g items at their weights, divide by servings, round."""
    if not items:
        raise ValueError("recipe must have at least one item")
    if servings < 1:
        raise ValueError("servings must be >= 1")
    scaled = [item_macros(m, w) for m, w in items]
    n = Decimal(servings)

    def per(field: str, q: Decimal) -> Decimal:
        total = sum((getattr(m, field) for m in scaled), Decimal(0))
        return (total / n).quantize(q, rounding=ROUND_HALF_UP)

    return Macros(
        kcal=per("kcal", _KCAL_Q),
        protein=per("protein", _MACRO_Q),
        fat=per("fat", _MACRO_Q),
        carbs=per("carbs", _MACRO_Q),
        fiber=per("fiber", _MACRO_Q),
    )


def kcal_from_macros(protein: Decimal, carbs: Decimal, fat: Decimal) -> Decimal:
    return protein * 4 + carbs * 4 + fat * 9
