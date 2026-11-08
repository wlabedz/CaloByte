import json
import logging
from functools import cache

from google import genai
from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

import recipe_search

logger = logging.getLogger(__name__)

# On the free tier the Flash models answered in minutes at busy times (3.8-flash: 70-140 s
# per call, 3.6-flash: from 6 s to several minutes); 3.5-flash-lite plans a whole day in ~8 s.
MODEL = "gemini-3.5-flash-lite"
# Fail with a clear error instead of an endless spinner; two rounds fit in Vercel's 60 s limit.
REQUEST_TIMEOUT_S = 25
# Each round is one more Gemini request, so this also guards the free-tier quota.
MAX_TOOL_ROUNDS = 6
FALLBACK_MESSAGE = "Przepraszam, nie udało mi się przygotować odpowiedzi. Spróbuj zapytać inaczej."

SYSTEM_PROMPT = """Jesteś asystentem dietetycznym w aplikacji CaloByte. Odpowiadasz po polsku.

Pomagasz dobierać posiłki i układać jadłospisy dopasowane do kalorii i preferencji
użytkownika. Przepisy wyszukujesz narzędziem search_recipes w bazie aplikacji: około
tysiąca przepisów po angielsku, z wartościami odżywczymi na porcję. Polecasz wyłącznie
przepisy zwrócone przez narzędzie. Parametry narzędzia podajesz po angielsku.

Zasady wyszukiwania:
- Używaj krótkich zapytań (jedno, dwa słowa, np. "chicken", "oatmeal") albo samej
  kategorii; gdy wyszukiwanie nic nie zwróci, poluzuj filtry lub zmień zapytanie.
- Baza nie ma tagów diet. Diety i alergie obsługuj przez exclude_ingredients, np. dla
  diety wegetariańskiej: chicken, beef, pork, bacon, ham, turkey, sausage, fish, salmon,
  tuna, shrimp; bez laktozy: milk, cheese, butter, cream, yogurt.
- Gdy układasz jadłospis na dzień, rozdziel kalorie między posiłki i wyszukaj wszystkie
  posiłki naraz, w jednym kroku. Suma kalorii ma być bliska celowi użytkownika; jeśli
  wyraźnie brakuje, dodaj przekąskę albo dodatek.
- Jeśli w bazie nie ma nic pasującego, powiedz to wprost zamiast polecać coś na siłę.

Odpowiedź zwracasz jako JSON:
- message: krótka odpowiedź dla użytkownika, zwykły tekst bez markdown. Nie wypisuj w niej
  kalorii ani makroskładników poszczególnych przepisów, aplikacja pokazuje je sama.
- recipes: polecane przepisy w kolejności posiłków. id to identyfikator z wyników
  narzędzia, meal to nazwa posiłku (np. Śniadanie, Obiad), title to tytuł przetłumaczony
  na polski. Gdy nic nie polecasz, zostaw pustą listę.

Nie proponuj diet poniżej 1200 kcal dziennie. Jeśli użytkownik wspomina o chorobach,
ciąży lub zaburzeniach odżywiania, zasugeruj konsultację z lekarzem lub dietetykiem.
Nie udzielasz porad medycznych."""

SEARCH_RECIPES_TOOL = {
    "type": "function",
    "name": "search_recipes",
    "description": (
        "Search the app's recipe database (English recipes). Calories and macros are per "
        "serving. Desserts and drinks are left out unless you ask for that category."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": (
                    "Words that must all appear in the recipe name or ingredients, "
                    'e.g. "chicken" or "chicken rice". Empty to search by filters only.'
                ),
            },
            "category": {
                "type": "string",
                "description": (
                    "Recipe category, e.g. Breakfast and Brunch, Main Dishes, Meat and Poultry, "
                    "Seafood, Salad, Soups, Side Dish, Appetizers and Snacks, Bread, Desserts."
                ),
            },
            "max_calories": {"type": "integer", "description": "Maximum calories per serving."},
            "min_protein": {
                "type": "integer",
                "description": "Minimum protein in grams per serving.",
            },
            "exclude_ingredients": {
                "type": "array",
                "items": {"type": "string"},
                "description": 'Ingredients that must not appear, e.g. ["chicken", "milk"].',
            },
        },
    },
}

# The model only picks recipes by id; nutrition and links are filled in from the database
# here, so the numbers shown to the user can't be made up by the model.
ANSWER_FORMAT = {
    "type": "text",
    "mime_type": "application/json",
    "schema": {
        "type": "object",
        "properties": {
            "message": {"type": "string"},
            "recipes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "meal": {"type": "string"},
                        "title": {"type": "string"},
                    },
                    "required": ["id", "meal", "title"],
                },
            },
        },
        "required": ["message", "recipes"],
    },
}


class AIServiceError(Exception):
    """Gemini could not be reached or rejected the request (quota, expired conversation...)."""


class _PickedRecipe(BaseModel):
    id: str
    meal: str
    title: str


class _Answer(BaseModel):
    message: str
    recipes: list[_PickedRecipe]


@cache
def get_client() -> genai.Client:
    # Created on first use: CI has no GEMINI_API_KEY and only imports this module.
    return genai.Client()


def _create(input, previous_id: str | None):
    # system_instruction, tools and response_format are per interaction,
    # so they are sent again on every call, including follow-ups.
    params = {
        "model": MODEL,
        "system_instruction": SYSTEM_PROMPT,
        "tools": [SEARCH_RECIPES_TOOL],
        "response_format": ANSWER_FORMAT,
        "input": input,
    }
    if previous_id:
        params["previous_interaction_id"] = previous_id
    try:
        return get_client().interactions.create(timeout=REQUEST_TIMEOUT_S, **params)
    except Exception as e:
        # The Interactions API raises its own error classes, not google.genai.errors.APIError,
        # and a missing key raises ValueError, so everything from this call is wrapped.
        logger.exception("Gemini request failed")
        raise AIServiceError(str(e)) from e


def _tool_result(call, text: str, is_error: bool = False) -> dict:
    return {
        "type": "function_result",
        "name": call.name,
        "call_id": call.id,
        "is_error": is_error,
        "result": [{"type": "text", "text": text}],
    }


def _run_tool(db: Session, call, found: dict[str, dict]) -> dict:
    if call.name != "search_recipes":
        return _tool_result(call, f"Unknown tool: {call.name}", is_error=True)
    try:
        recipes = recipe_search.search_recipes(db, **(call.arguments or {}))
    except TypeError as e:
        # Unknown or malformed arguments go back to the model, so it can retry.
        return _tool_result(call, f"Invalid search arguments: {e}", is_error=True)
    except SQLAlchemyError as e:
        db.rollback()
        logger.exception("Recipe search failed")
        return _tool_result(call, f"Recipe search failed: {type(e).__name__}", is_error=True)
    found.update({recipe["id"]: recipe for recipe in recipes})
    return _tool_result(call, json.dumps(recipes, ensure_ascii=False))


def run_chat(db: Session, message: str, interaction_id: str | None) -> tuple[str, list[dict], str]:
    found: dict[str, dict] = {}
    interaction = _create(message, interaction_id)

    for _ in range(MAX_TOOL_ROUNDS):
        calls = [step for step in interaction.steps or [] if step.type == "function_call"]
        if not calls:
            break
        interaction = _create([_run_tool(db, call, found) for call in calls], interaction.id)

    try:
        answer = _Answer.model_validate_json(interaction.output_text or "")
    except ValidationError:
        return FALLBACK_MESSAGE, [], interaction.id

    # Recipes picked from an earlier turn of the conversation weren't searched now.
    missing = [picked.id for picked in answer.recipes if picked.id not in found]
    if missing:
        found.update({recipe["id"]: recipe for recipe in recipe_search.get_recipes(db, missing)})

    recipes = [
        {
            **found[picked.id],
            "meal": picked.meal,
            "title": picked.title,
            "original_title": found[picked.id]["title"],
        }
        for picked in answer.recipes
        if picked.id in found
    ]
    return answer.message, recipes, interaction.id
