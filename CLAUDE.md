# CaloByte: zasady dla Claude

Planer posiłków z AI. Użytkownik opisuje posiłek językiem naturalnym, a backend z pomocą LLM wylicza składniki i makro do dziennego bilansu. Projekt zespołowy, 4 osoby, 5 spotkań kontrolnych i obrona z live codingiem.

## Najpierw wiki

Przy pytaniach o projekt (wymagania, model danych, role, historia zmian, decyzje) zacznij od [wiki/index.md](wiki/index.md). Zasady wiki są w [wiki/CLAUDE.md](wiki/CLAUDE.md). Wiki aktualizuje się skillem `/wiki` (`ingest prs|miro|code|all`, `lint`). Niewiadome, których nie rozstrzygają ani kod, ani wiki, zgłaszaj jako pytania do analityka (`/wiki lint`), a nie zgaduj.

Źródła prawdy:
- wymagania i plan: tablica Miro https://miro.com/app/board/uXjVEWYP5RY=/ (zrzuty w `raw/miro/`),
- stan faktyczny: kod w repo,
- pytania do analityka: `wiki/questions.md`.

## Struktura

- `backend/`: FastAPI (Python 3.13), SQLAlchemy + psycopg 3, Alembic. Deploy jako funkcja serverless na Vercel.
- `frontend/`: Angular (standalone), Vitest, eslint. Deploy na GitHub Pages.
- `.github/workflows/`: `ci.yml` (lint + testy na PR), `deploy-backend.yml`, `deploy-frontend.yml`.
- `wiki/`, `raw/`: wiki projektu utrzymywana przez LLM.

## Komendy

Backend (w `backend/`):

```bash
pip install -r requirements-dev.txt
ruff check .
pytest --cov=.
alembic upgrade head        # wymaga DATABASE_URL_UNPOOLED w backend/.env.local
uvicorn app:app --reload
python -m seed              # ładuje backend/seed/*.csv do bazy
python -m seed.prepare --kaggle <plik> --usda-dir <katalog> --out seed   # regeneruje CSV
```

Testy backendu wymagają lokalnego Postgresa, np. `docker run -d --name calobyte-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=calobyte_test postgres:17`. Domyślny adres to `postgresql://postgres:postgres@localhost:5432/calobyte_test`; nadpisują go `DATABASE_URL` i `DATABASE_URL_UNPOOLED`. `conftest.py` odmawia uruchomienia testów na bazie spoza hosta lokalnego.

Uwaga: `python -m seed` bez `CALOBYTE_TESTING=1` pisze do bazy z `backend/.env.local`, czyli potencjalnie produkcyjnej.

Frontend (w `frontend/`):

```bash
npm ci
npm run lint
npx ng test --watch=false
npm start                   # ng serve, http://localhost:4200
```

## Zasady pracy

- `main` jest chroniony. Każda zmiana idzie przez branch i PR z review.
- Przed zgłoszeniem pracy jako gotowej uruchom lint i testy części, którą zmieniasz, tak jak robi to CI.
- Sekrety (`DATABASE_URL*`, klucze LLM, tokeny Vercela) nigdy nie trafiają do repo ani na frontend. Lokalnie trzymamy je w `backend/.env.local`, który jest w `.gitignore`.
- Migracje: zmiana modelu w `backend/models.py` wymaga migracji Alembic w tym samym PR. Migracje uruchamiają się w CD przed deployem nowego kodu, więc muszą być kompatybilne wstecz.
- Wywołania LLM tylko z backendu, z odpowiedzią wymuszoną jako JSON.
- Wiki aktualizujemy raz na PR, w tym samym PR co kod: przed `gh pr create` uruchom `/wiki ingest code` w trybie PR (sekcja „Tryb PR” w skillu `/wiki`). Niejasności wyjaśniaj z autorem zmian, a nierozstrzygnięte dodawaj jako pytania `Q-NNN`. Hook `.claude/hooks/wiki-before-pr.py` blokuje `gh pr create`, dopóki wiki nie jest aktualna. Nie obchodź go.
- Zmiany w AI-asystowanym kodzie dokumentujemy w `AI.md` (wymóg projektu).
- `docs/superpowers/` (specy i plany ze skilli) jest lokalne i nie trafia do repo.
