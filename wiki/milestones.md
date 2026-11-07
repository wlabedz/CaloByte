---
title: Kamienie milowe
sources: [raw/miro/2026-11-07-board.md, wiki/changelog.md]
code_sha: 933b1a7
updated: 2026-11-07
---

# Kamienie milowe

Oś z Miro: Spotkanie 1: Start → Spotkanie 2: CI & Baza → Spotkanie 3: CD & Integracja → Spotkanie 4: Twist & AI → Spotkanie 5: Obrona. **Dat spotkań nie ma w Miro**, więc wpisy w changelogu mają kamień milowy `?`.

## Spotkanie 1: Start i szkielet
- Plan: repo z ochroną `main` (PR + review), `/backend` z `GET /health`, `/frontend` z routingiem i base-href, „Hello World” na Pages i Vercelu.
- Stan: zrobione. Backend z `/health` w #3, Angular w #2, deploy Pages w #1/#4, Vercel w #6. Ochrona brancha nie jest sprawdzona; review w PR-ach nie ma.

## Spotkanie 2: CI i model danych
- Plan: `ci.yml` (ruff, pytest, lint, testy frontu), baza Neon + `DATABASE_URL`, CRUD `meals` z walidacją (400/404/422), pierwsze testy backendu i min. 2 testy komponentów.
- Stan: częściowo. CI w #6/#9 i baza + Alembic w #10–#12 są. **Brak tabeli i CRUD `meals`**. Jest tylko `users` (GET/POST). Backend ma 2 testy, front 1 plik spec.

## Spotkanie 3: CD i integracja
- Plan: `deploy-frontend.yml` (base-href, deploy-pages), `deploy-backend.yml` (Vercel CLI + smoke `/health`); dalsze punkty w Miro są puste.
- Stan: oba workflow istnieją (#4–#8, #11). Integracja front–back na przykładzie formularza `users` (#13).

## Spotkanie 4: Twist i AI
- Plan: brak szczegółów w Miro. Z ról wynika integracja LLM, AddMealComponent i twist „Statystyki z wykresem”.
- Stan: nie rozpoczęte.

## Spotkanie 5: Obrona
- Plan: brak szczegółów. Wiadomo tylko o 20-minutowym live codingu ([team](team.md)).
