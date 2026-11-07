# Changelog

Jeden wpis na każdy zmergowany PR, od najnowszych. Generowane przez `/wiki ingest prs`. Kamień milowy wynosi `?`, dopóki nie znamy dat spotkań (zob. [milestones.md](milestones.md)).

## 2026-10-28 · #13 Add simple form to test db connection
- Autor: wlabedz · Branch: feat/enable-form · Kamień milowy: ?
- Co: Pierwsze endpointy na danych: `GET /users` i `POST /users` (409 przy powtórzonym emailu) oraz formularz w Angularze, który tworzy użytkownika i wyświetla listę. Sesja bazy przez `get_db()` i `NullPool`.
- Pliki: backend/app.py, backend/db.py, backend/schemas.py, backend/requirements.txt, frontend/src/app/app.ts, frontend/src/app/app.html, frontend/src/app/users.service.ts, frontend/src/app/app.config.ts, frontend/src/app/app.spec.ts, frontend/src/environments/api-url.ts
- Strony wiki: [architecture/backend](architecture/backend.md), [architecture/frontend](architecture/frontend.md), [architecture/database](architecture/database.md), [entities/users](entities/users.md)

## 2026-10-28 · #12 Quick fix in upgrade db
- Autor: wlabedz · Branch: feat/test-mod-db · Kamień milowy: ?
- Co: Poprawka migracji `add_sex_to_users_field`: typ enum `sex` jest tworzony jawnie (`checkfirst=True`) przed dodaniem kolumny z domyślną wartością `male`.
- Pliki: backend/migrations/versions/2026_10_28_1905-80b93a51e10e_add_sex_to_users_field.py
- Strony wiki: [architecture/database](architecture/database.md)

## 2026-10-28 · #11 Test DB connection by adding new field
- Autor: wlabedz · Branch: feat/test-mod-db · Kamień milowy: ?
- Co: Dodane pole `sex` w `users` jako test, czy CD uruchamia migracje. Deploy backendu dostał krok `alembic upgrade head` z sekretem `DATABASE_URL_UNPOOLED`.
- Pliki: .github/workflows/deploy-backend.yml, .gitignore, backend/migrations/versions/2026_10_28_1905-80b93a51e10e_add_sex_to_users_field.py, backend/models.py
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md), [architecture/database](architecture/database.md), [entities/users](entities/users.md)

## 2026-10-28 · #10 Add DB configuration and enable db management using alembic
- Autor: wlabedz · Branch: feat/add-db-config · Kamień milowy: ?
- Co: Podłączenie Postgresa (SQLAlchemy + psycopg 3, adres z `DATABASE_URL`), model `User` i Alembic z pierwszą migracją tworzącą tabelę `users`.
- Pliki: backend/alembic.ini, backend/db.py, backend/migrations/*, backend/models.py, backend/requirements.txt, backend/requirements-dev.txt
- Strony wiki: [architecture/database](architecture/database.md), [entities/users](entities/users.md)

## 2026-10-25 · #9 Add coverage information
- Autor: wlabedz · Branch: add-coverage · Kamień milowy: ?
- Co: CI raportuje pokrycie testami: `pytest --cov` dla backendu i `ng test --coverage` dla frontendu, z podsumowaniem w GitHub Step Summary.
- Pliki: .github/workflows/ci.yml, backend/.gitignore, backend/requirements-dev.txt, frontend/angular.json, frontend/package.json, frontend/package-lock.json
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md)

## 2026-10-25 · #8 Fix missing uv installation
- Autor: wlabedz · Branch: fix-cd-backend · Kamień milowy: ?
- Co: Deploy backendu instaluje `uv` i Pythona przed `vercel build`.
- Pliki: .github/workflows/deploy-backend.yml
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md)

## 2026-10-25 · #7 Remove duplicated default backend/ location
- Autor: wlabedz · Branch: fix-cd-backend · Kamień milowy: ?
- Co: Usunięty zdublowany katalog roboczy `backend/` w workflow deployu backendu.
- Pliki: .github/workflows/deploy-backend.yml
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md)

## 2026-10-25 · #6 Add CI and basic CD for backend
- Autor: wlabedz · Branch: ci-config · Kamień milowy: ?
- Co: Workflow `ci.yml` (ruff + pytest, eslint + testy frontendu na każdym PR do `main`) oraz `deploy-backend.yml` (Vercel CLI + smoke test `GET /health`).
- Pliki: .github/workflows/ci.yml, .github/workflows/deploy-backend.yml, frontend/src/app/app.html
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md)

## 2026-10-25 · #5 Check API_URL and create api-url.ts
- Autor: wlabedz · Branch: fix-cd-frontend · Kamień milowy: ?
- Co: Build frontendu przerywa się, gdy brakuje zmiennej repo `API_URL`, a w przeciwnym razie generuje z niej `src/environments/api-url.ts`.
- Pliki: .github/workflows/deploy-frontend.yml
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md), [architecture/frontend](architecture/frontend.md)

## 2026-10-25 · #4 Refactor CD for frontend
- Autor: wlabedz · Branch: frontend-cd-refactor · Kamień milowy: ?
- Co: `pages.yml` zastąpiony przez `deploy-frontend.yml`: `ng build --base-href /<repo>/` i deploy na GitHub Pages.
- Pliki: .github/workflows/deploy-frontend.yml, .github/workflows/pages.yml (usunięty)
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md)

## 2026-10-25 · #3 Enable Git deployment, CORS, basic tests in backend
- Autor: wlabedz · Branch: backend-extension · Kamień milowy: ?
- Co: Backend FastAPI z CORS dla GitHub Pages i `localhost:4200`, endpointy `/hello` i `/health`, pierwsze testy pytest i `vercel.json` z wyłączonym auto-deployem z gita.
- Pliki: backend/app.py, backend/test_app.py, backend/vercel.json, backend/requirements.txt, backend/requirements-dev.txt, backend/.gitignore
- Strony wiki: [architecture/backend](architecture/backend.md)

## 2026-10-25 · #2 Initialize Angular
- Autor: wlabedz · Branch: add-frontend · Kamień milowy: ?
- Co: Szkielet aplikacji Angular (standalone, SSR config, eslint, vitest), w miejsce statycznego `index.html`.
- Pliki: frontend/** (31 plików)
- Strony wiki: [architecture/frontend](architecture/frontend.md)

## 2026-10-24 · #1 Add initial frontend file
- Autor: wlabedz · Branch: feat-init-frontend · Kamień milowy: ?
- Co: Pierwsza statyczna strona „Hello World” i workflow `pages.yml` publikujący ją na GitHub Pages.
- Pliki: .github/workflows/pages.yml, frontend/index.html, frontend/main.js
- Strony wiki: [architecture/ci-cd](architecture/ci-cd.md)
