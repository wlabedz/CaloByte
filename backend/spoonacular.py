import os

import httpx

BASE_URL = "https://api.spoonacular.com"
TIMEOUT_S = 15


def _get(path: str, params: dict):
    # Key in a header rather than the query string, so it never ends up in URL logs.
    response = httpx.get(
        f"{BASE_URL}{path}",
        params=params,
        headers={"x-api-key": os.environ["SPOONACULAR_API_KEY"]},
        timeout=TIMEOUT_S,
    )
    response.raise_for_status()
    return response.json()


def _nutrient(recipe: dict, name: str) -> int | None:
    for nutrient in recipe.get("nutrition", {}).get("nutrients", []):
        if nutrient["name"] == name:
            return round(nutrient["amount"])
    return None


def _summary(recipe: dict) -> dict:
    # Spoonacular returns huge objects; keep only what the chat shows (and pays tokens for).
    return {
        "id": recipe["id"],
        "title": recipe["title"],
        "image": recipe.get("image"),
        "url": recipe.get("sourceUrl"),
        "ready_in_minutes": recipe.get("readyInMinutes"),
        "servings": recipe.get("servings"),
        "calories": _nutrient(recipe, "Calories"),
        "protein_g": _nutrient(recipe, "Protein"),
        "carbs_g": _nutrient(recipe, "Carbohydrates"),
        "fat_g": _nutrient(recipe, "Fat"),
    }


def search_recipes(
    query: str = "",
    meal_type: str = "",
    max_calories: int | None = None,
    min_protein: int | None = None,
    diet: str = "",
    intolerances: str = "",
    cuisine: str = "",
    number: int = 5,
) -> list[dict]:
    params = {
        "query": query,
        "type": meal_type,
        "maxCalories": max_calories,
        "minProtein": min_protein,
        "diet": diet,
        "intolerances": intolerances,
        "cuisine": cuisine,
        "number": number,
        "addRecipeNutrition": True,
    }
    # An empty filter such as cuisine="" would narrow the results instead of being ignored.
    params = {key: value for key, value in params.items() if value not in ("", None)}
    data = _get("/recipes/complexSearch", params)
    return [_summary(recipe) for recipe in data.get("results", [])]


def get_recipes(ids: list[int]) -> list[dict]:
    if not ids:
        return []
    data = _get(
        "/recipes/informationBulk",
        {"ids": ",".join(str(recipe_id) for recipe_id in ids), "includeNutrition": True},
    )
    return [_summary(recipe) for recipe in data]
