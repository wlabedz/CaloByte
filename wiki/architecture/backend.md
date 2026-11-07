---
title: Backend (FastAPI)
sources: [raw/miro/2026-11-07-board.md, backend/app.py, backend/db.py, backend/schemas.py, backend/test_app.py, backend/requirements.txt, backend/vercel.json]
code_sha: 933b1a7
updated: 2026-11-07
---

# Backend (FastAPI)

## Plan (Miro)

Python 3.13, FastAPI, Pydantic, SQLAlchemy/SQLModel, pytest (min. 8 testów, mockowana baza), ruff. Serverless Function na Vercel (Hobby), obowiązkowe `GET /health`. LLM (Gemini/OpenAI) wołany tylko z backendu, klucze w Secrets Vercela, `response_format={"type": "json_object"}`. Docelowa struktura: `backend/app/{api/, services/, models.py, schemas.py, main.py}`, `backend/tests/`.

## Stan w kodzie

Płaska struktura w `backend/`:

- `app.py`: aplikacja FastAPI, CORS dla `https://wlabedz.github.io` i `http://localhost:4200`. Endpointy: `GET /`, `GET /hello`, `GET /health`, `GET /users`, `POST /users`.
- `db.py`: silnik i sesje, zob. [database](database.md).
- `models.py`: model `User`, zob. [entities/users](../entities/users.md).
- `schemas.py`: `UserCreate` (walidacja długości, `EmailStr`, zakresy wagi i wzrostu), `UserOut`.
- `test_app.py`: 2 testy (`/hello`, `/health`), bez testów `/users` i bez mockowania bazy.
- Zależności: `fastapi`, `psycopg[binary]`, `sqlalchemy`, `python-dotenv`, `email-validator`; dev: `pytest`, `pytest-cov`, `httpx`, `ruff`, `uvicorn`, `alembic`.
- Brak integracji z LLM i brak encji `meals`.

## Rozbieżności

- Struktura katalogów: plan `backend/app/...` + `tests/`, a stan to pliki płasko w `backend/`. [Q-005](../questions.md#q-005--architektura--otwarte)
- Testy: 2 z planowanych min. 8.
- Wybór LLM (Gemini czy OpenAI) jest otwarty. [Q-002](../questions.md#q-002--ai--otwarte)
