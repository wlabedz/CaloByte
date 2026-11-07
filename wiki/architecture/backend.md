---
title: Backend (FastAPI)
sources: [raw/miro/2026-11-07-board.md, backend/app.py, backend/db.py, backend/schemas.py, backend/chat.py, backend/spoonacular.py, backend/test_app.py, backend/test_chat.py, backend/requirements.txt, backend/vercel.json]
code_sha: 04d0c3f
updated: 2026-11-07
---

# Backend (FastAPI)

## Plan (Miro)

Python 3.13, FastAPI, Pydantic, SQLAlchemy/SQLModel, pytest (min. 8 testów, mockowana baza), ruff. Serverless Function na Vercel (Hobby), obowiązkowe `GET /health`. LLM (Gemini/OpenAI) wołany tylko z backendu, klucze w Secrets Vercela, `response_format={"type": "json_object"}`. Docelowa struktura: `backend/app/{api/, services/, models.py, schemas.py, main.py}`, `backend/tests/`.

## Stan w kodzie

Płaska struktura w `backend/`:

- `app.py`: aplikacja FastAPI, CORS dla `https://wlabedz.github.io` i `http://localhost:4200`. Endpointy: `GET /`, `GET /hello`, `GET /health`, `GET /users`, `POST /users`, `POST /chat`.
- `db.py`: silnik i sesje, zob. [database](database.md). Wczytuje też `backend/.env.local`, więc lokalne klucze API działają dopiero, gdy aplikacja zaimportuje `db`.
- `models.py`: model `User`, zob. [entities/users](../entities/users.md).
- `schemas.py`: `UserCreate` (walidacja długości, `EmailStr`, zakresy wagi i wzrostu), `UserOut`; dla czatu `ChatRequest` (`message` 1–4000 znaków, opcjonalne `interaction_id`), `RecipeOut`, `ChatResponse`.
- **Czat z przepisami** (`POST /chat`, `chat.py`): asystent dietetyczny na Gemini (`gemini-3.5-flash-lite`, Interactions API z pakietu `google-genai`). Model dostaje narzędzie `search_recipes`, które woła Spoonacular (`spoonacular.py`, `GET /recipes/complexSearch` z wartościami odżywczymi), i oddaje odpowiedź wymuszoną jako JSON (`message` + wybrane przepisy). Model wskazuje przepisy tylko po `id`; kalorie, makro, zdjęcia i linki backend bierze z odpowiedzi Spoonacular (przepisy z wcześniejszych tur rozmowy dociąga przez `/recipes/informationBulk`), żeby model nie mógł zmyślić wartości odżywczych. Historię rozmowy przechowuje Gemini (`previous_interaction_id`; na darmowym planie przez 1 dzień), a front odsyła tylko `interaction_id`. Pętla narzędzi ma limit 6 rund, a jedno zapytanie do Gemini 25 s (`REQUEST_TIMEOUT_S`). Każdy błąd zapytania do Gemini, także brak klucza, jest logowany i kończy się `502`.
- Klucze `GEMINI_API_KEY` i `SPOONACULAR_API_KEY` są w sekretach Vercela (Production); lokalnie trzeba je wpisać ręcznie do `backend/.env.local`, bo `vercel env pull` nie pobiera wartości oznaczonych jako tajne.
- `vercel.json`: `maxDuration` 60 s dla `app.py`, bo pytanie o jadłospis to kilka zapytań do Gemini.
- Testy: `test_app.py` (2: `/hello`, `/health`) i `test_chat.py` (9: endpoint `/chat`, pętla narzędzi, kontynuacja rozmowy, błędy Gemini i Spoonacular, mapowanie odpowiedzi Spoonacular). Gemini i Spoonacular są w testach podmienione, więc CI nie potrzebuje kluczy. `/users` nadal bez testów i bez mockowania bazy.
- Zależności: `fastapi`, `psycopg[binary]`, `sqlalchemy`, `python-dotenv`, `email-validator`, `google-genai`, `httpx`; dev: `pytest`, `pytest-cov`, `ruff`, `uvicorn`, `alembic`.
- Brak encji `meals` i brak parsowania posiłków przez LLM (`POST /meals/parse-ai` z planu).

## Rozbieżności

- Struktura katalogów: plan `backend/app/...` + `tests/`, a stan to pliki płasko w `backend/`. [Q-005](../questions.md#q-005)
- Testy: 11, czyli powyżej planowanych min. 8, ale bez mockowanej bazy, o której mówi plan; endpointy `/users` nie mają testów.
- Czatu z przepisami nie ma w planie z Miro: to dodatek ponad plan (autor PR, 2026-11-07). Spoonacular nie występuje w Miro; jego darmowy plan to 50 punktów dziennie, czyli kilka–kilkanaście rozmów, a po wyczerpaniu czat odpowiada, że nie może pobrać przepisów.
- Plan zakłada `response_format={"type": "json_object"}`; czat wymusza JSON przez `response_format` ze schematem w Interactions API Gemini.
- Czat używa Gemini, ale wybór LLM dla parsowania posiłków (AddMeal) pozostaje otwarty (autor PR, 2026-11-07). [Q-002](../questions.md#q-002)
