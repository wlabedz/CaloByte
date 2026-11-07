---
title: Baza danych
sources: [raw/miro/2026-11-07-board.md, backend/db.py, backend/models.py, backend/migrations/env.py, backend/migrations/versions/, raw/github/prs/PR-0010.md, raw/github/prs/PR-0011.md, raw/github/prs/PR-0012.md]
code_sha: 933b1a7
updated: 2026-11-07
---

# Baza danych

## Plan (Miro)

Neon Postgres w Vercel Storage (Free: 1 GB, auto-suspend 5 min), połączenie przez `DATABASE_URL` ze zmiennych Vercela. Tabele `users`, `meals`, `meal_items` z migracjami (odpowiada Wojtek Łabędź). Decyzja: [0001](../decisions/0001-neon-postgres.md).

## Stan w kodzie

- **Silnik:** PostgreSQL przez SQLAlchemy 2 + psycopg 3. `database_url()` w `backend/db.py:12` czyta `DATABASE_URL` (albo `DATABASE_URL_UNPOOLED` przy `unpooled=True`) i zamienia schemat na `postgresql+psycopg://`. Lokalnie zmienne idą z `backend/.env.local` (`load_dotenv`).
- **Pula połączeń:** `create_engine(..., poolclass=NullPool)`. Aplikacja nie trzyma puli, bo działa jako funkcja serverless na Vercelu, a pulą zarządza pooler po stronie bazy (URL pooled). Silnik jest tworzony raz dzięki `@cache` na `make_session()`.
- **Sesje:** zależność FastAPI `get_db()` (`backend/db.py:27`) otwiera sesję na czas requestu. `app.py` używa jej jako `DbSession`. Przy `IntegrityError` jest rollback i odpowiedź 409.
- **Migracje:** Alembic, `backend/migrations/env.py` bierze `Base.metadata` z `models.py` i URL **unpooled** (DDL nie powinien iść przez pooler). Migracje:
  1. `61ac7f2698e4` create users (2026-10-28)
  2. `80b93a51e10e` add sex to users (2026-10-28, poprawka w #12)
- **Uruchamianie:** w CD (`alembic upgrade head` w `deploy-backend.yml`), zob. [ci-cd](ci-cd.md).
- **Tabele:** tylko `users`, zob. [entities/users](../entities/users.md).

## Rozbieżności

_(uzupełnia `ingest code` / `lint`)_
