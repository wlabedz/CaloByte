---
title: Frontend (Angular)
sources: [raw/miro/2026-11-07-board.md, frontend/src/app/app.ts, frontend/src/app/app.config.ts, frontend/src/app/app.routes.ts, frontend/src/app/users.service.ts, frontend/package.json]
code_sha: 933b1a7
updated: 2026-11-07
---

# Frontend (Angular)

## Plan (Miro)

Angular standalone, TS, `@angular-eslint`, Vitest. SPA budowane `ng build` i publikowane na GitHub Pages. Routing z `withHashLocation()`, żeby odświeżenie podstrony nie dawało 404. `provideHttpClient()`, adres API wstrzykiwany przy buildzie ze zmiennych repo. Trzy widoki: **Dashboard** (bilans dnia, progress bary celów, lista posiłków z edycją i usuwaniem), **AddMeal** (opis w języku naturalnym → `POST /meals/parse-ai` → tabela do korekty → zapis), **History/Planner** (poprzednie dni, planowanie, trend). Docelowa struktura: `components/{dashboard,add-meal,history}`, `services/MealService`, `models/{Meal,MealItem}`.

## Stan w kodzie

- Angular 22 (`@angular/core ^22.2.0`), Vitest 5, eslint. Skonfigurowane jest SSR (`@angular/ssr`, `server.ts`, `provideClientHydration()`).
- `app.config.ts`: `provideRouter(routes)` **bez** `withHashLocation()`, `provideHttpClient(withFetch())`.
- `app.routes.ts`: pusta lista tras.
- `app.ts`: jeden komponent z formularzem reaktywnym tworzenia użytkownika (walidacja wymaganych pól, emaila i zakresów wagi i wzrostu) i listą użytkowników na sygnałach. Komunikaty błędów są po angielsku.
- `users.service.ts`: `list()` i `create()` na `${API_URL}/users`. `API_URL` pochodzi z `src/environments/api-url.ts`, generowanego w CD ([ci-cd](ci-cd.md)).
- Brak widoków Dashboard/AddMeal/History i brak `MealService`.

## Rozbieżności

- Brak `withHashLocation()` i brak tras. Przy dodawaniu widoków odświeżanie podstron na Pages da 404.
- SSR i hydracja są włączone, choć hosting to statyczne Pages. Nie wiadomo, czy SSR ma zostać.
- Karteczka „UI” w Miro jest pusta. Nie ma makiet widoków. [Q-003](../questions.md#q-003--ui--otwarte)
