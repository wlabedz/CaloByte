# Indeks wiki CaloByte

Spis wszystkich stron. Zasady i sposób zadawania pytań są w [CLAUDE.md](CLAUDE.md).

## Przegląd

- [overview.md](overview.md) — czym jest CaloByte, stos, twist, linki
- [team.md](team.md) — 4 osoby, role i zasady pracy
- [milestones.md](milestones.md) — 5 spotkań: plan kontra stan

## Encje

- [entities/users.md](entities/users.md) — użytkownik: plan z celami dziennymi kontra model antropometryczny w kodzie
- [entities/meals.md](entities/meals.md) — posiłek z sumami makro (model we froncie, bez tabeli w bazie)
- [entities/meal_items.md](entities/meal_items.md) — składnik posiłku z LLM (jeszcze bez tabeli)

## Architektura

- [architecture/backend.md](architecture/backend.md) — FastAPI na Vercelu, endpointy, testy, plan LLM
- [architecture/frontend.md](architecture/frontend.md) — Angular 22 bez SSR, hash routing, Pulpit i Historia na danych przykładowych za MealRepository
- [architecture/ci-cd.md](architecture/ci-cd.md) — trzy workflow GitHub Actions: CI, deploy backendu na Vercel, deploy frontu na Pages
- [architecture/database.md](architecture/database.md) — Postgres, SQLAlchemy + psycopg, NullPool, migracje Alembic

## Decyzje

- [decisions/0001-neon-postgres.md](decisions/0001-neon-postgres.md) — Neon + NullPool + Alembic przez URL unpooled

## Rejestry

- [changelog.md](changelog.md) — co zmieniało się w kolejnych PR-ach
- [questions.md](questions.md) — pytania do analityka i ich status
- [log.md](log.md) — dziennik operacji na wiki
