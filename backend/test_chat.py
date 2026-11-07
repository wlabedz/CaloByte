import json
from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient

import app as app_module
import chat
import spoonacular

client = TestClient(app_module.app)

OATMEAL = {
    "id": 1,
    "title": "Protein Oatmeal",
    "image": "https://img.spoonacular.com/1.jpg",
    "url": "https://example.com/oatmeal",
    "ready_in_minutes": 10,
    "servings": 1,
    "calories": 420,
    "protein_g": 30,
    "carbs_g": 50,
    "fat_g": 10,
}


def interaction(id, steps=(), output_text=None):
    return SimpleNamespace(id=id, steps=list(steps), output_text=output_text)


def function_call(arguments):
    return SimpleNamespace(type="function_call", name="search_recipes", id="call-1", arguments=arguments)


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


def test_chat_returns_reply(monkeypatch):
    recipe = {**OATMEAL, "meal": "Śniadanie", "title": "Owsianka", "original_title": "Protein Oatmeal"}
    monkeypatch.setattr(app_module, "run_chat", lambda message, interaction_id: ("Proszę!", [recipe], "i-1"))

    r = client.post("/chat", json={"message": "Coś na śniadanie"})

    assert r.status_code == 200
    assert r.json() == {"message": "Proszę!", "recipes": [recipe], "interaction_id": "i-1"}


def test_chat_rejects_empty_message():
    r = client.post("/chat", json={"message": ""})
    assert r.status_code == 422


def test_chat_returns_502_when_gemini_fails(monkeypatch):
    def fail(message, interaction_id):
        raise chat.AIServiceError("quota")

    monkeypatch.setattr(app_module, "run_chat", fail)

    r = client.post("/chat", json={"message": "Hej"})

    assert r.status_code == 502


def test_run_chat_fills_recipes_from_tool_results(monkeypatch, fake_gemini):
    monkeypatch.setattr(spoonacular, "search_recipes", lambda **kwargs: [OATMEAL])
    answer = {"message": "Proszę!", "recipes": [{"id": 1, "meal": "Śniadanie", "title": "Owsianka"}]}
    interactions = fake_gemini(
        interaction("i-1", [function_call({"meal_type": "breakfast", "max_calories": 500})]),
        interaction("i-2", output_text=json.dumps(answer)),
    )

    message, recipes, interaction_id = chat.run_chat("Śniadanie na 500 kcal", None)

    assert message == "Proszę!"
    assert recipes == [{**OATMEAL, "meal": "Śniadanie", "title": "Owsianka", "original_title": "Protein Oatmeal"}]
    assert interaction_id == "i-2"
    assert "previous_interaction_id" not in interactions.calls[0]
    assert interactions.calls[1]["previous_interaction_id"] == "i-1"
    assert interactions.calls[1]["input"][0]["call_id"] == "call-1"


def test_run_chat_continues_conversation_and_fetches_earlier_recipes(monkeypatch, fake_gemini):
    requested = []

    def fake_get_recipes(ids):
        requested.extend(ids)
        return [OATMEAL]  # Spoonacular knows recipe 1 but not 99

    monkeypatch.setattr(spoonacular, "get_recipes", fake_get_recipes)
    answer = {
        "message": "To samo co wcześniej.",
        "recipes": [{"id": 1, "meal": "Śniadanie", "title": "Owsianka"}, {"id": 99, "meal": "Obiad", "title": "?"}],
    }
    interactions = fake_gemini(interaction("i-3", output_text=json.dumps(answer)))

    _, recipes, _ = chat.run_chat("Przypomnij śniadanie", "i-2")

    assert interactions.calls[0]["previous_interaction_id"] == "i-2"
    assert requested == [1, 99]
    assert [recipe["id"] for recipe in recipes] == [1]


def test_run_chat_reports_search_errors_to_the_model(monkeypatch, fake_gemini):
    def fail(**kwargs):
        raise httpx.HTTPError("quota exceeded")

    monkeypatch.setattr(spoonacular, "search_recipes", fail)
    interactions = fake_gemini(
        interaction("i-1", [function_call({"query": "soup"})]),
        interaction("i-2", output_text=json.dumps({"message": "Wyszukiwarka nie działa.", "recipes": []})),
    )

    message, recipes, _ = chat.run_chat("Zupa", None)

    assert interactions.calls[1]["input"][0]["is_error"] is True
    assert (message, recipes) == ("Wyszukiwarka nie działa.", [])


def test_run_chat_wraps_gemini_errors(monkeypatch):
    def fail(**params):
        raise ValueError("No API key was provided.")

    monkeypatch.setattr(chat, "get_client", lambda: SimpleNamespace(interactions=SimpleNamespace(create=fail)))

    with pytest.raises(chat.AIServiceError):
        chat.run_chat("Hej", None)


def test_run_chat_falls_back_on_invalid_json(fake_gemini):
    fake_gemini(interaction("i-1", output_text="not json"))

    message, recipes, interaction_id = chat.run_chat("Hej", None)

    assert (message, recipes, interaction_id) == (chat.FALLBACK_MESSAGE, [], "i-1")


def test_search_recipes_maps_spoonacular_response(monkeypatch):
    seen = {}

    def fake_get(path, params):
        seen.update(path=path, params=params)
        return {
            "results": [
                {
                    "id": 1,
                    "title": "Protein Oatmeal",
                    "image": "https://img.spoonacular.com/1.jpg",
                    "sourceUrl": "https://example.com/oatmeal",
                    "readyInMinutes": 10,
                    "servings": 1,
                    "nutrition": {
                        "nutrients": [
                            {"name": "Calories", "amount": 419.6},
                            {"name": "Protein", "amount": 30.2},
                            {"name": "Carbohydrates", "amount": 50},
                            {"name": "Fat", "amount": 9.8},
                        ]
                    },
                }
            ]
        }

    monkeypatch.setattr(spoonacular, "_get", fake_get)

    assert spoonacular.search_recipes(meal_type="breakfast", max_calories=500) == [OATMEAL]
    assert seen["path"] == "/recipes/complexSearch"
    assert seen["params"] == {"type": "breakfast", "maxCalories": 500, "number": 5, "addRecipeNutrition": True}
