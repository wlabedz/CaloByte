import json
import uuid
from decimal import Decimal
from types import SimpleNamespace

import pytest
from sqlalchemy.exc import OperationalError

import app as app_module
import chat
import recipe_search
from models import Recipe, RecipeSource


def make_recipe(db, name, category="Main Dishes", ingredients=("salt",), **kw):
    vals = {"kcal": Decimal(400), "protein": Decimal(20), "fat": Decimal(10),
            "carbs": Decimal(50), "fiber": Decimal(3)}
    vals.update(kw)
    r = Recipe(name=name, source=RecipeSource.kaggle, external_id="k-" + name, category=category,
               servings=2, ingredients_text=list(ingredients), directions="d", **vals)
    db.add(r)
    db.commit()
    return r


def card(recipe, meal, title):
    return {**recipe_search.summary(recipe), "meal": meal, "title": title, "original_title": recipe.name}


def interaction(id, steps=(), output_text=None):
    return SimpleNamespace(id=id, steps=list(steps), output_text=output_text)


def function_call(arguments, name="search_recipes"):
    return SimpleNamespace(type="function_call", name=name, id="call-1", arguments=arguments)


def answer(*picked, message="Proszę!"):
    return json.dumps({"message": message, "recipes": [
        {"id": str(id), "meal": meal, "title": title} for id, meal, title in picked
    ]})


class FakeInteractions:
    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def create(self, **params):
        self.calls.append(params)
        return self.responses.pop(0)


@pytest.fixture
def fake_gemini(monkeypatch):
    def install(*responses):
        interactions = FakeInteractions(*responses)
        monkeypatch.setattr(chat, "get_client", lambda: SimpleNamespace(interactions=interactions))
        return interactions

    return install


def test_chat_returns_reply(client, db_session, monkeypatch):
    oatmeal = make_recipe(db_session, "Protein Oatmeal", category="Breakfast and Brunch")
    recipe = card(oatmeal, "Śniadanie", "Owsianka")
    monkeypatch.setattr(app_module, "run_chat", lambda db, message, interaction_id: ("Proszę!", [recipe], "i-1"))

    r = client.post("/chat", json={"message": "Coś na śniadanie"})

    assert r.status_code == 200
    assert r.json() == {"message": "Proszę!", "recipes": [recipe], "interaction_id": "i-1"}


def test_chat_rejects_empty_message(client):
    r = client.post("/chat", json={"message": ""})
    assert r.status_code == 422


def test_chat_returns_502_when_gemini_fails(client, monkeypatch):
    def fail(db, message, interaction_id):
        raise chat.AIServiceError("quota")

    monkeypatch.setattr(app_module, "run_chat", fail)

    r = client.post("/chat", json={"message": "Hej"})

    assert r.status_code == 502


def test_run_chat_fills_recipes_from_the_database(db_session, fake_gemini):
    oatmeal = make_recipe(db_session, "Protein Oatmeal", category="Breakfast and Brunch",
                          ingredients=["1 cup oats", "1 scoop protein powder"], kcal=Decimal("419.6"))
    make_recipe(db_session, "Pancakes", category="Breakfast and Brunch", kcal=Decimal(700))
    interactions = fake_gemini(
        interaction("i-1", [function_call({"category": "breakfast", "max_calories": 500})]),
        interaction("i-2", output_text=answer((oatmeal.id, "Śniadanie", "Owsianka"))),
    )

    message, recipes, interaction_id = chat.run_chat(db_session, "Śniadanie na 500 kcal", None)

    assert message == "Proszę!"
    assert recipes == [card(oatmeal, "Śniadanie", "Owsianka")]
    assert recipes[0]["calories"] == 420
    assert interaction_id == "i-2"
    assert "previous_interaction_id" not in interactions.calls[0]
    assert interactions.calls[1]["previous_interaction_id"] == "i-1"
    tool_result = interactions.calls[1]["input"][0]
    assert tool_result["call_id"] == "call-1"
    assert [r["title"] for r in json.loads(tool_result["result"][0]["text"])] == ["Protein Oatmeal"]


def test_run_chat_continues_conversation_and_fetches_earlier_recipes(db_session, fake_gemini):
    oatmeal = make_recipe(db_session, "Protein Oatmeal")
    interactions = fake_gemini(interaction("i-3", output_text=answer(
        (oatmeal.id, "Śniadanie", "Owsianka"),
        (uuid.uuid4(), "Obiad", "?"),  # unknown id
        ("not-a-uuid", "Kolacja", "?"),  # made-up id
        message="To samo co wcześniej.",
    )))

    _, recipes, _ = chat.run_chat(db_session, "Przypomnij śniadanie", "i-2")

    assert interactions.calls[0]["previous_interaction_id"] == "i-2"
    assert [recipe["id"] for recipe in recipes] == [str(oatmeal.id)]


@pytest.mark.parametrize("call", [
    function_call({"cuisine": "italian"}),  # argument the tool doesn't have
    function_call({}, name="get_weather"),
])
def test_run_chat_reports_bad_tool_calls_to_the_model(db_session, fake_gemini, call):
    interactions = fake_gemini(
        interaction("i-1", [call]),
        interaction("i-2", output_text=answer(message="Nie umiem.")),
    )

    message, recipes, _ = chat.run_chat(db_session, "Zupa", None)

    assert interactions.calls[1]["input"][0]["is_error"] is True
    assert (message, recipes) == ("Nie umiem.", [])


def test_run_chat_reports_database_errors_to_the_model(db_session, fake_gemini, monkeypatch):
    def fail(db, **kwargs):
        raise OperationalError("select", {}, Exception("connection lost"))

    monkeypatch.setattr(recipe_search, "search_recipes", fail)
    interactions = fake_gemini(
        interaction("i-1", [function_call({"query": "soup"})]),
        interaction("i-2", output_text=answer(message="Baza nie działa.")),
    )

    message, _, _ = chat.run_chat(db_session, "Zupa", None)

    assert interactions.calls[1]["input"][0]["is_error"] is True
    assert message == "Baza nie działa."


def test_run_chat_wraps_gemini_errors(db_session, monkeypatch):
    def fail(**params):
        raise ValueError("No API key was provided.")

    monkeypatch.setattr(chat, "get_client", lambda: SimpleNamespace(interactions=SimpleNamespace(create=fail)))

    with pytest.raises(chat.AIServiceError):
        chat.run_chat(db_session, "Hej", None)


def test_run_chat_falls_back_on_invalid_json(db_session, fake_gemini):
    fake_gemini(interaction("i-1", output_text="not json"))

    message, recipes, interaction_id = chat.run_chat(db_session, "Hej", None)

    assert (message, recipes, interaction_id) == (chat.FALLBACK_MESSAGE, [], "i-1")


def names(results):
    return [r["title"] for r in results]


def test_search_matches_all_words_in_name_or_ingredients(db_session):
    make_recipe(db_session, "Chicken Fried Rice", ingredients=["2 cups rice", "1 chicken breast"])
    make_recipe(db_session, "Lemon Chicken", ingredients=["1 chicken", "1 lemon"])
    make_recipe(db_session, "Rice Salad", category="Salad", ingredients=["1 cup RICE"])

    assert names(recipe_search.search_recipes(db_session, query="Chicken rice")) == ["Chicken Fried Rice"]
    assert names(recipe_search.search_recipes(db_session, query="rice")) == ["Chicken Fried Rice", "Rice Salad"]
    assert names(recipe_search.search_recipes(db_session, query="100%")) == []


def test_search_filters_macros_category_and_excluded_ingredients(db_session):
    make_recipe(db_session, "Steak", category="Meat and Poultry", ingredients=["1 beef steak"],
                protein=Decimal(40), kcal=Decimal(600))
    make_recipe(db_session, "Tofu Bowl", ingredients=["200 g tofu", "rice"], protein=Decimal(25), kcal=Decimal(450))
    make_recipe(db_session, "Bacon Salad", category="Salad", ingredients=["bacon"], protein=Decimal(30),
                kcal=Decimal(300))

    def search(**kw):
        return names(recipe_search.search_recipes(db_session, **kw))

    assert search(min_protein=30) == ["Bacon Salad", "Steak"]
    assert search(max_calories=500) == ["Bacon Salad", "Tofu Bowl"]
    assert search(category="meat") == ["Steak"]
    assert search(exclude_ingredients=["Beef", "bacon", " "]) == ["Tofu Bowl"]


def test_search_skips_desserts_and_drinks_unless_asked(db_session):
    make_recipe(db_session, "Brownies", category="Desserts")
    make_recipe(db_session, "Smoothie", category="Drinks Recipes")
    make_recipe(db_session, "Soup", category=None)
    make_recipe(db_session, "Broken", kcal=Decimal(0))

    make_recipe(db_session, "Mimosa", category="Breakfast and Brunch", category_path="Breakfast and Brunch/Drinks")
    make_recipe(db_session, "Omelette", category="Breakfast and Brunch", category_path="Breakfast and Brunch/Eggs")

    assert names(recipe_search.search_recipes(db_session)) == ["Omelette", "Soup"]
    assert names(recipe_search.search_recipes(db_session, category="breakfast")) == ["Omelette"]
    assert names(recipe_search.search_recipes(db_session, category="eggs")) == ["Omelette"]
    assert names(recipe_search.search_recipes(db_session, category="Desserts")) == ["Brownies"]
    assert names(recipe_search.search_recipes(db_session, category="drinks")) == ["Mimosa", "Smoothie"]


def test_search_ranks_name_matches_first(db_session):
    make_recipe(db_session, "Lamb Stew", ingredients=["2 cups chicken broth"], rating=Decimal(5))
    make_recipe(db_session, "Chicken Curry", ingredients=["chicken"], rating=Decimal(4))

    assert names(recipe_search.search_recipes(db_session, query="chicken")) == ["Chicken Curry", "Lamb Stew"]


def test_search_orders_by_rating_and_limits_results(db_session):
    make_recipe(db_session, "B", rating=Decimal("4.9"))
    make_recipe(db_session, "A")
    make_recipe(db_session, "C", rating=Decimal("3.0"))

    assert names(recipe_search.search_recipes(db_session)) == ["B", "C", "A"]
    assert names(recipe_search.search_recipes(db_session, limit=1)) == ["B"]


def test_search_returns_each_name_once(db_session):
    make_recipe(db_session, "Mango Bread")
    r = Recipe(name="Mango Bread", source=RecipeSource.kaggle, external_id="dup", servings=1,
               ingredients_text=[], directions="d", kcal=1, protein=1, fat=1, carbs=1, fiber=1)
    db_session.add(r)
    db_session.commit()

    assert names(recipe_search.search_recipes(db_session)) == ["Mango Bread"]


def test_run_chat_answers_without_tools_after_the_last_search_round(fake_gemini, monkeypatch):
    # A model that keeps searching must still get to answer instead of FALLBACK_MESSAGE.
    monkeypatch.setattr(recipe_search, "search_recipes", lambda db, **kw: [])
    search = interaction("i", [function_call({"query": "oatmeal"})])
    gemini = fake_gemini(*[search] * chat.MAX_TOOL_ROUNDS, interaction("last", output_text=answer()))

    message, recipes, interaction_id = chat.run_chat(None, "Śniadanie?", None)

    assert (message, recipes, interaction_id) == ("Proszę!", [], "last")
    assert len(gemini.calls) == chat.MAX_TOOL_ROUNDS + 1
    assert all("tools" in call for call in gemini.calls[:-1])
    assert "tools" not in gemini.calls[-1]
