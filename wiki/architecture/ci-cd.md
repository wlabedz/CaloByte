---
title: CI/CD (GitHub Actions)
sources: [raw/miro/2026-11-07-board.md, .github/workflows/ci.yml, .github/workflows/deploy-backend.yml, .github/workflows/deploy-frontend.yml, raw/github/prs/PR-0004.md, raw/github/prs/PR-0006.md, raw/github/prs/PR-0011.md, scripts/wiki_check.py, .claude/hooks/wiki-before-pr.py]
code_sha: 81d47cf
updated: 2026-11-07
---

# CI/CD (GitHub Actions)

## Plan (Miro)

`ci.yml`: ruff + pytest oraz `npm ci` + lint + testy frontu na każdym PR, w równoległych jobach. `deploy-frontend.yml`: `ng build --base-href /<repo>/` + `actions/deploy-pages`. `deploy-backend.yml`: Vercel CLI + smoke test `GET /health`. Deploy automatycznie po merge do `main`. Ochrona `main`: blokada bezpośrednich pushy, obowiązkowy PR + review.

## Stan w kodzie

Są trzy workflow w `.github/workflows/`:

| Workflow | Kiedy | Co robi |
|---|---|---|
| `ci.yml` | PR do `main` | **wiki**: `scripts/wiki_check.py --base origin/<base> --github` na commicie z brancha PR-a (`head.sha`, pełna historia). **backend** (Python 3.13): `pip install -r requirements-dev.txt` → `ruff check .` → `pytest --cov=.` (pokrycie całego `backend/`) z raportem w Step Summary. Job ma usługę `postgres:17` (baza `calobyte_test`, healthcheck `pg_isready`) i zmienne `CALOBYTE_TESTING`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` wskazujące na nią. **frontend** (Node 24): `npm ci` → `npm run lint` → `ng test --watch=false --coverage` z tabelą pokrycia. |
| `deploy-backend.yml` | push do `main` w `backend/**` lub w samym workflow, albo ręcznie | Python 3.13 + `uv` (potrzebny `vercel build`, zob. commit `7d124aa`) + Vercel CLI → `alembic upgrade head` (sekret `DATABASE_URL_UNPOOLED`) → `python -m seed` (krok „Seed catalog data”, ten sam sekret) → `vercel pull/build/deploy --prod` → smoke test `curl $API_URL/health` (do 6 prób: 1 + 5 powtórek). |
| `deploy-frontend.yml` | push do `main` w `frontend/**` lub w samym workflow, albo ręcznie | `npm ci` → generuje `src/environments/api-url.ts` ze zmiennej repo `API_URL` (przerywa się, gdy brak) → `ng build --base-href /<repo>/` → GitHub Pages. |

Sekrety i zmienne: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL_UNPOOLED` (sekrety), `API_URL` (zmienna repo). `backend/vercel.json` wyłącza auto-deploy Vercela z gita, więc wdraża tylko Action.

Migracje i seed odpalają się **przed** deployem nowego kodu. Jeśli deploy się nie uda, baza ma już nowy schemat i dane. Seed jest idempotentny (upsert), więc kolejne deploye nie duplikują wierszy ([backend](backend.md)).

**Check `wiki`**: `scripts/wiki_check.py` porównuje kod zmieniony na branchu (`backend/`, `frontend/src/`, `.github/workflows/`, od merge-base z `main`) z frontmatterem stron wiki. Kończy się kodem 1, gdy strona obejmująca zmieniony plik ma nieaktualny `code_sha` albo zmieniony plik nie jest w `sources` żadnej strony (pomija `*.spec.ts`, style, szablony i migracje), a kodem 2, gdy nie da się sprawdzić. Ten sam skrypt woła lokalny hook `.claude/hooks/wiki-before-pr.py` przed `gh pr create` (tam błąd skryptu przepuszcza, w CI daje czerwony check). Naprawa: `/wiki ingest code` w trybie PR.

Historia: [#1](../changelog.md) `pages.yml` → [#4](../changelog.md) `deploy-frontend.yml` → [#5](../changelog.md) kontrola `API_URL` → [#6](../changelog.md) CI + deploy backendu → [#7, #8](../changelog.md) poprawki → [#9](../changelog.md) pokrycie → [#11](../changelog.md) migracje w CD → `feat/recipe-chat` (przed merge'em): job `wiki`, pokrycie całego backendu, porządki w `deploy-backend.yml`.

## Rozbieżności

- Check `wiki` blokuje merge dopiero wtedy, gdy jest wymaganym status checkiem w ochronie gałęzi `main` (ustawienie w GitHubie, nie w repo); z kodu nie da się sprawdzić, czy jest włączony.
- Wersję Pythona funkcji na Vercelu wybiera konfiguracja projektu w Vercelu, a nie `setup-python` w workflow (ten ustawia ją tylko dla migracji i `vercel build`).
- Plan w Miro: ruff + pytest z mockowaną bazą; CI uruchamia testy na prawdziwym Postgresie jako usłudze.
- PR-y #1–#13 nie mają zapisanego review, choć Miro zakłada obowiązkowy PR + review i min. 1 review na osobę na spotkanie. Od #17 review są (approve od `wlabedz`).
