"""Recipe search for the chat: the model's search_recipes tool runs on our `recipes` table."""

import uuid
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import and_, case, func, not_, or_, select
from sqlalchemy.orm import Session

from models import Recipe

DEFAULT_LIMIT = 8
# Almost half of the Kaggle catalogue is desserts and drinks (also under other categories,
# e.g. "Breakfast and Brunch/Drinks"); leave them out unless the category asks for them.
EXCLUDED_BY_DEFAULT = ("dessert", "drink")


def _int(value: Decimal | None) -> int | None:
    return None if value is None else int(value.quantize(Decimal(1), ROUND_HALF_UP))


def summary(recipe: Recipe) -> dict:
    """What the model sees and what the chat card shows; macros are per serving."""
    return {
        "id": str(recipe.id),
        "title": recipe.name,
        "category": recipe.category,
        "url": recipe.source_url,
        "ready_in_minutes": recipe.total_min,
        "servings": recipe.servings,
        "calories": _int(recipe.kcal),
        "protein_g": _int(recipe.protein),
        "carbs_g": _int(recipe.carbs),
        "fat_g": _int(recipe.fat),
    }


def _contains(column, word: str):
    """Case-insensitive substring match; % and _ typed by the model are literal."""
    escaped = word.lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return column.like(f"%{escaped}%", escape="\\")


def search_recipes(
    db: Session,
    query: str = "",
    category: str = "",
    max_calories: int | None = None,
    min_protein: int | None = None,
    exclude_ingredients: list[str] | None = None,
    limit: int = DEFAULT_LIMIT,
) -> list[dict]:
    ingredients = func.lower(func.array_to_string(Recipe.ingredients_text, " "))
    name = func.lower(Recipe.name)
    # "Breakfast and Brunch/Drinks": the path is more specific than the category.
    categories = func.lower(func.concat_ws("/", Recipe.category, Recipe.category_path))
    words = query.split()
    conditions = [Recipe.kcal > 0]

    # Every word has to appear in the name or the ingredients ("chicken rice").
    for word in words:
        conditions.append(or_(_contains(name, word), _contains(ingredients, word)))
    # There are no diet tags in the dataset, so diets and allergies exclude ingredients.
    for word in filter(None, (w.strip() for w in exclude_ingredients or [])):
        conditions.append(not_(or_(_contains(name, word), _contains(ingredients, word))))

    if category:
        conditions.append(_contains(categories, category))
    for word in EXCLUDED_BY_DEFAULT:
        if word not in category.lower():
            conditions.append(not_(_contains(categories, word)))
    if max_calories is not None:
        conditions.append(Recipe.kcal <= max_calories)
    if min_protein is not None:
        conditions.append(Recipe.protein >= min_protein)

    # "chicken" in the name beats "chicken broth" among the ingredients.
    order = [Recipe.rating.desc().nulls_last(), Recipe.name, Recipe.id]
    if words:
        order.insert(0, case((and_(*(_contains(name, w) for w in words)), 0), else_=1))
    # The dataset repeats some recipes under different ids; show each name once.
    rows = db.scalars(select(Recipe).where(*conditions).order_by(*order).limit(limit * 2))
    unique: dict[str, Recipe] = {}
    for recipe in rows:
        unique.setdefault(recipe.name.lower(), recipe)
    return [summary(r) for r in list(unique.values())[:limit]]


def get_recipes(db: Session, ids: list[str]) -> list[dict]:
    """Recipes picked in an earlier turn of the conversation; unknown or invalid ids are skipped."""
    uuids = []
    for value in ids:
        try:
            uuids.append(uuid.UUID(value))
        except ValueError:
            continue
    if not uuids:
        return []
    return [summary(r) for r in db.scalars(select(Recipe).where(Recipe.id.in_(uuids)))]
