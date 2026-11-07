---
title: Frontend (Angular)
sources: [raw/miro/2026-11-07-board.md, raw/github/prs/PR-0017.md, frontend/src/app/app.config.ts, frontend/src/app/app.routes.ts, frontend/src/app/core/models.ts, frontend/src/app/core/nutrition.ts, frontend/src/app/core/data/meal-repository.ts, frontend/src/app/core/data/in-memory-meal-repository.ts, frontend/src/app/features/dashboard/dashboard.component.ts, frontend/src/app/features/history/history.component.ts, frontend/package.json]
code_sha: aa41ac7
updated: 2026-11-07
---

# Frontend (Angular)

## Plan (Miro)

Angular standalone, TS, `@angular-eslint`, Vitest. SPA budowane `ng build` i publikowane na GitHub Pages. Routing z `withHashLocation()`, żeby odświeżenie podstrony nie dawało 404. `provideHttpClient()`, adres API wstrzykiwany przy buildzie ze zmiennych repo. Trzy widoki: **Dashboard** (bilans dnia, progress bary celów, lista posiłków z edycją i usuwaniem), **AddMeal** (opis w języku naturalnym → `POST /meals/parse-ai` → tabela do korekty → zapis), **History/Planner** (poprzednie dni, planowanie, trend). Docelowa struktura: `components/{dashboard,add-meal,history}`, `services/MealService`, `models/{Meal,MealItem}`.

## Stan w kodzie

Od [#17](../changelog.md) (2026-11-07):

- Angular 22 **bez SSR**: statyczne Pages nie potrzebują serwera. Style w zwykłym CSS (zmienne, motyw jasny i ciemny). Wymagany Node `^22.22.3`, `^24.15` lub `>=26`.
- `app.config.ts`: `provideRouter(routes, withHashLocation())`, `provideHttpClient(withFetch())`, `LOCALE_ID = 'pl'` oraz provider `MealRepository → InMemoryMealRepository`.
- Trasy (`app.routes.ts`, lazy): `/#/dashboard` (Pulpit · CaloByte), `/#/history` (Historia · CaloByte). `''` i `**` przekierowują na dashboard.
- Struktura: `core/` (modele, logika, dane), `features/{dashboard,history}/`, `shared/macro-progress/` (pasek postępu makro).
- **Modele** (`core/models.ts`) mają pola w snake_case, jak kolumny w bazie, a ID to UUID string. `Meal` zawiera pola z planu Miro i do tego `items: MealItem[]`. `MealType = 'breakfast' | 'lunch' | 'dinner'`. `DailyTargets = { kcal, protein, fat, carbs }`.
- **Dane**: widoki korzystają wyłącznie z abstrakcji `MealRepository` (`getTargets`, `getMeals`, `deleteMeal`). Obecnie jest to `InMemoryMealRepository` z danymi przykładowymi (`core/data/sample-data.ts`). Klient HTTP do FastAPI ma podmienić tylko ten provider.
- **Logika** (`core/nutrition.ts`): `sumMacros` sumuje pola `total_*` posiłków. `toDayKey` liczy dzień w lokalnej strefie czasowej, celowo bez `toISOString()`, które działa w UTC. `summarizeByDay` grupuje dni od najnowszego. `percentOf` liczy procent realizacji celu.
- **Pulpit**: dzisiejsze posiłki i sumy względem celu. Usuwanie wymaga potwierdzenia (`confirm`). Komunikaty błędów są po polsku.
- **Historia**: dni z kaloriami względem celu, makro, rozwijane posiłki i średnia kcal z zakończonych dni.
- Testy: 14 testów Vitest (pokrycie ok. 91% według opisu PR).
- Formularz użytkowników i `users.service.ts` zostały usunięte. Front nie woła dziś żadnego endpointu API.

## Rozbieżności

- Brak widoku **AddMeal** (wejście w języku naturalnym, parsowanie przez AI). Są tylko Pulpit i Historia, a Historia bez planowania.
- Pulpit nie ma **edycji** posiłku, tylko usuwanie.
- Dane są przykładowe, bo backend nie ma `meals` ([entities/meals](../entities/meals.md)). Cele dzienne front bierze z `DailyTargets`, którego backend nie ma. [Q-001](../questions.md#q-001)
- Nie wiadomo, czyje posiłki pokazywać, skoro nie ma logowania. [Q-009](../questions.md#q-009)
- Karteczka „UI” w Miro jest pusta. Wygląd zaprojektowano w #17 bez makiet. [Q-003](../questions.md#q-003)
