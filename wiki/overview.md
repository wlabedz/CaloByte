---
title: CaloByte — przegląd
sources: [raw/miro/2026-11-07-board.md, README.md]
updated: 2026-11-07
---

# CaloByte — przegląd

**Planer posiłków z AI.** Użytkownik opisuje posiłek językiem naturalnym („2 kromki chleba żytniego z ketchupem…”). Backend z pomocą LLM wyciąga z opisu składniki, gramatury i makro (kcal, białko, tłuszcze, węglowodany, błonnik) i dolicza je do dziennego bilansu względem celów użytkownika.

Projekt zespołowy, 4 osoby ([team](team.md)), realizowany przez 5 spotkań kontrolnych ([milestones](milestones.md)) i zakończony obroną z 20-minutowym live codingiem.

## Stos

| Warstwa | Plan (Miro) | Szczegóły |
|---|---|---|
| Frontend | Angular standalone, TS, eslint, Vitest, SPA na GitHub Pages | [architecture/frontend](architecture/frontend.md) |
| Backend | Python 3.13, FastAPI, Pydantic, SQLAlchemy, pytest, ruff; serverless na Vercel (Hobby) | [architecture/backend](architecture/backend.md) |
| Baza | Neon Postgres (Vercel Storage, Free: 1 GB, auto-suspend 5 min) | [architecture/database](architecture/database.md), [decyzja 0001](decisions/0001-neon-postgres.md) |
| AI | Gemini API lub OpenAI API, tylko z backendu, odpowiedź wymuszona jako JSON | [architecture/backend](architecture/backend.md) |
| CI/CD | GitHub Actions: `ci.yml`, `deploy-frontend.yml`, `deploy-backend.yml` | [architecture/ci-cd](architecture/ci-cd.md) |

## Encje

[users](entities/users.md) 1→N [meals](entities/meals.md) 1→N [meal_items](entities/meal_items.md). Pełny CRUD jest wymagany dla `meals`.

## Twist

Wylosowany twist to **Statystyki z wykresem**: wykres w Angularze (chart.js / ng2-charts) zasilany z endpointu agregującego `GET /meals/stats`. W Miro jest też lista pozostałych możliwych twistów: CSV, audit log, Open-Meteo, filtry z paginacją.

## Zasoby

- Tablica: https://miro.com/app/board/uXjVEWYP5RY=/
- Repo główne: https://github.com/wlabedz/CaloByte ([Q-004](questions.md#q-004)). Karteczka „GitHub” w Miro nadal linkuje https://github.com/pwjtd/CaloByte, więc link na tablicy trzeba poprawić.
- Dataset posiłków: https://www.kaggle.com/datasets/thedevastator/better-recipes-for-a-better-life
- API z posiłkami: https://calorieapi.com
- Wymagane pliki repo wg Miro: `AI.md` (jak korzystano z AI), `README.md` (architektura, setup, linki prod). `AI.md` jeszcze nie istnieje.
