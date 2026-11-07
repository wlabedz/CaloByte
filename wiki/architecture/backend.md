---
title: Backend (FastAPI)
sources: [raw/miro/2026-11-07-board.md, backend/app.py, backend/db.py, backend/schemas.py, backend/schemas_catalog.py, backend/catalog_service.py, backend/nutrition.py, backend/routers/, backend/seed/, backend/conftest.py, backend/test_app.py, backend/test_db.py, backend/test_models.py, backend/test_nutrition.py, backend/test_parsing.py, backend/test_prepare.py, backend/test_products_api.py, backend/test_recipes_api.py, backend/test_seed.py, backend/requirements.txt, backend/vercel.json, backend/chat.py, backend/spoonacular.py, backend/test_chat.py]
code_sha: 81d47cf
updated: 2026-11-07
---

# Backend (FastAPI)

## Plan (Miro)

Python 3.13, FastAPI, Pydantic, SQLAlchemy/SQLModel, pytest (min. 8 testów, mockowana baza), ruff. Serverless Function na Vercel (Hobby), obowiązkowe `GET /health`. LLM (Gemini/OpenAI) wołany tylko z backendu, klucze w Secrets Vercela, `response_format={"type": "json_object"}`. Docelowa struktura: `backend/app/{api/, services/, models.py, schemas.py, main.py}`, `backend/tests/`.

## Stan w kodzie

Płaska struktura w `backend/`:

- `app.py`: aplikacja FastAPI, CORS dla `https://wlabedz.github.io` i `http://localhost:4200`. Endpointy: `GET /`, `GET /hello`, `GET /health`, `GET /users`, `POST /users`, `POST /chat`. Dołącza routery `products` i `recipes` (`include_router`).
- `routers/products.py`: `/products` (lista z wyszukiwaniem, `GET`/`POST`/`PUT`/`DELETE`), `routers/recipes.py`: `/recipes` (lista stronicowana, `/recipes/categories`, `GET`/`POST`/`PUT`/`DELETE`). Szczegóły endpointów, kody 403/404/409/422 i walidacja: [entities/products](../entities/products.md), [entities/recipes](../entities/recipes.md). Przepisy i produkty z seeda są tylko do odczytu (403).
- `schemas_catalog.py`: schematy `ProductIn/Out`, `RecipeIn`, `RecipeSummary`, `RecipeDetail`, `RecipePage`, `CategoryCount`. Wartości `Decimal` są w JSON-ie liczbami (`JsonDecimal`), nie napisami.
- `nutrition.py`: czyste funkcje makr (`Macros`, `item_macros`, `recipe_per_serving` z zaokrągleniem half-up, `kcal_from_macros`). `catalog_service.py`: `recipe_macros` i `recalculate_recipes_for_product` (zmiana produktu przelicza przepisy użytkownika). Front ma lustro tej logiki w `core/nutrition.ts` ([frontend](frontend.md)).
- `seed/`: `python -m seed` (`seed/__main__.py`, `load.py`) wczytuje do bazy `products.csv` (108 produktów USDA) i `recipes.csv` (1090 przepisów Kaggle) idempotentnym upsertem po `(source, external_id)` i zwraca liczniki inserted/updated/unchanged; wiersze `user` nie są ruszane. Pracuje na URL unpooled. `prepare.py` i `parsing.py` to jednorazowe skrypty budujące CSV z surowych plików Kaggle i USDA. Uruchamia go CD, zob. [ci-cd](ci-cd.md).
- `db.py`: silnik i sesje, zob. [database](database.md). Wczytuje też `backend/.env.local`, więc lokalne klucze API działają dopiero, gdy aplikacja zaimportuje `db`.
- `models.py`: model `User`, zob. [entities/users](../entities/users.md).
- `schemas.py`: `UserCreate` (walidacja długości, `EmailStr`, zakresy wagi i wzrostu), `UserOut`; dla czatu `ChatRequest` (`message` 1–4000 znaków, opcjonalne `interaction_id`), `RecipeOut`, `ChatResponse`.
- **Czat z przepisami** (`POST /chat`, `chat.py`): asystent dietetyczny na Gemini (`gemini-3.5-flash-lite`, Interactions API z pakietu `google-genai`). Model dostaje narzędzie `search_recipes`, które woła Spoonacular (`spoonacular.py`, `GET /recipes/complexSearch` z wartościami odżywczymi), i oddaje odpowiedź wymuszoną jako JSON (`message` + wybrane przepisy). Model wskazuje przepisy tylko po `id`; kalorie, makro, zdjęcia i linki backend bierze z odpowiedzi Spoonacular (przepisy z wcześniejszych tur rozmowy dociąga przez `/recipes/informationBulk`), żeby model nie mógł zmyślić wartości odżywczych. Historię rozmowy przechowuje Gemini (`previous_interaction_id`; na darmowym planie przez 1 dzień), a front odsyła tylko `interaction_id`. Pętla narzędzi ma limit 6 rund, a jedno zapytanie do Gemini 25 s (`REQUEST_TIMEOUT_S`). Każdy błąd zapytania do Gemini, także brak klucza, jest logowany i kończy się `502`.
- Klucze `GEMINI_API_KEY` i `SPOONACULAR_API_KEY` są w sekretach Vercela (Production); lokalnie trzeba je wpisać ręcznie do `backend/.env.local`, bo `vercel env pull` nie pobiera wartości oznaczonych jako tajne.
- `vercel.json`: `maxDuration` 60 s dla `app.py`, bo pytanie o jadłospis to kilka zapytań do Gemini.
- Testy: `test_app.py` (2: `/hello`, `/health`), `test_chat.py` (9: czat; Gemini i Spoonacular podmienione, więc CI nie potrzebuje kluczy) oraz `test_products_api.py`, `test_recipes_api.py`, `test_models.py`, `test_nutrition.py`, `test_parsing.py`, `test_prepare.py`, `test_seed.py`, `test_db.py`. Testy API i modeli działają na **prawdziwym Postgresie**, a nie na mocku: `conftest.py` ustawia `CALOBYTE_TESTING=1` (wtedy `db.py` nie ładuje `.env.local`), domyślnie łączy się z `postgresql://postgres:postgres@localhost:5432/calobyte_test`, odmawia pracy na hoście spoza listy lokalnych (`localhost`, `127.0.0.1`, `::1`, `postgres`), robi `alembic upgrade head` na początku sesji i czyści tabele (`TRUNCATE ... CASCADE`) po każdym teście. W CI jest do tego usługa Postgres ([ci-cd](ci-cd.md)).
- Zależności: `fastapi`, `psycopg[binary]`, `sqlalchemy`, `python-dotenv`, `email-validator`, `google-genai`, `httpx`; dev: `pytest`, `pytest-cov`, `ruff`, `uvicorn`, `alembic`.
- Brak encji `meals` i brak parsowania posiłków przez LLM (`POST /meals/parse-ai` z planu).

## Rozbieżności

- Struktura katalogów: plan `backend/app/...` + `tests/`, a stan to pliki płasko w `backend/`. [Q-005](../questions.md#q-005)
- Testy: plan mówi o mockowanej bazie, a testy są na prawdziwym Postgresie (lokalnym lub usłudze w CI). Testów jest ponad 8 planowanych (liczba `def test_` w `backend/test_*.py`: 46).
- Plan zakłada `POST /meals/parse-ai` i encję `meals`; nowe endpointy dotyczą przepisów i produktów, których Miro nie przewiduje ([entities/recipes](../entities/recipes.md)).
- Czatu z przepisami nie ma w planie z Miro: to dodatek ponad plan (autor PR, 2026-11-07). Spoonacular nie występuje w Miro; jego darmowy plan to 50 punktów dziennie, czyli kilka–kilkanaście rozmów, a po wyczerpaniu czat odpowiada, że nie może pobrać przepisów.
- Plan zakłada `response_format={"type": "json_object"}`; czat wymusza JSON przez `response_format` ze schematem w Interactions API Gemini.
- Czat używa Gemini, ale wybór LLM dla parsowania posiłków (AddMeal) pozostaje otwarty (autor PR, 2026-11-07). [Q-002](../questions.md#q-002)
