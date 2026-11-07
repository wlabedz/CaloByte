---
title: Frontend (Angular)
sources: [raw/miro/2026-11-07-board.md, raw/github/prs/PR-0017.md, frontend/src/app/, frontend/src/environments/, frontend/src/testing/, frontend/src/styles.css, frontend/angular.json, frontend/package.json]
code_sha: 1bae832
updated: 2026-11-07
---

# Frontend (Angular)

## Plan (Miro)

Angular standalone, TS, `@angular-eslint`, Vitest. SPA budowane `ng build` i publikowane na GitHub Pages. Routing z `withHashLocation()`, żeby odświeżenie podstrony nie dawało 404. `provideHttpClient()`, adres API wstrzykiwany przy buildzie ze zmiennych repo. Trzy widoki: **Dashboard** (bilans dnia, progress bary celów, lista posiłków z edycją i usuwaniem), **AddMeal** (opis w języku naturalnym → `POST /meals/parse-ai` → tabela do korekty → zapis), **History/Planner** (poprzednie dni, planowanie, trend). Docelowa struktura: `components/{dashboard,add-meal,history}`, `services/MealService`, `models/{Meal,MealItem}`.

## Stan w kodzie

Od [#17](../changelog.md) (2026-11-07), z widokiem Profil z #20:

- Angular 22 **bez SSR**: statyczne Pages nie potrzebują serwera. Style w zwykłym CSS (zmienne, motyw jasny i ciemny). Wymagany Node `^22.22.3`, `^24.15` lub `>=26`.
- `app.config.ts`: `provideRouter(routes, withHashLocation())`, `provideHttpClient(withFetch())`, `LOCALE_ID = 'pl'` oraz providery `MealRepository → InMemoryMealRepository` i `UserRepository → HttpUserRepository`.
- Trasy (`app.routes.ts`, lazy): `/#/dashboard` (Pulpit · CaloByte), `/#/history` (Historia · CaloByte), `/#/profile` (Profil · CaloByte). `''` i `**` przekierowują na dashboard.
- Struktura: `core/` (modele, logika, dane, `ActiveUserService`), `features/{dashboard,history,profile}/`, `shared/macro-progress/` (pasek postępu makro). Wspólne style (`.card`, `.field`, `.field-error`, `.button`, `.badge`) w `src/styles.css`.
- **Modele** (`core/models.ts`) mają pola w snake_case, jak kolumny w bazie, a ID to UUID string. `Meal` zawiera pola z planu Miro i do tego `items: MealItem[]`. `MealType = 'breakfast' | 'lunch' | 'dinner'`. `DailyTargets = { kcal, protein, fat, carbs }`. `NewUser` i `User` odwzorowują `UserCreate` i `UserOut` z backendu, z polskimi etykietami `activity` i `sex`.
- **Dane**: widoki korzystają wyłącznie z abstrakcji w `core/data/`. Posiłki to `MealRepository` (`getTargets`, `getMeals`, `deleteMeal`) z implementacją `InMemoryMealRepository` i danymi przykładowymi (`core/data/sample-data.ts`). Profile idą z API: `UserRepository` → `HttpUserRepository` (`GET /users`, `POST /users`). Klient HTTP dla posiłków ma powstać tym samym wzorcem i podmienić jeden provider.
- **Aktywny profil** (`core/active-user.service.ts`): wybór `{ id, name }` w sygnale, zapamiętany w `localStorage` (`calobyte.activeUser`). Zastępuje logowanie, dopóki go nie ma. Serwis nie sprawdza, czy zapamiętany profil nadal istnieje. Ustalenie z review #20 (autor PR, 2026-11-07): przy endpointach posiłków nieznany `user_id` ma dawać `404`, a wybór czyści wtedy interceptor albo guard.
- **Profil**: lista profili (imię, e-mail, waga, wzrost, BMI, aktywność) z wyborem aktywnego (`aria-pressed`) oraz formularz nowego profilu z walidacją jak w `UserCreate`. E-mail musi mieć kropkę w domenie, bo `EmailStr` odrzuca np. `a@b`. Odpowiedź 422 dla `email` jest pokazywana przy polu, a 409 ma osobny komunikat o zajętym adresie. Nowy profil od razu staje się aktywny. Gdy wcześniej nie udało się wczytać listy, po zapisie jest pobierana od nowa.
- **Adres API**: `npm start` korzysta z `http://localhost:8000` (lokalny backend). `npm run start:deployed-api` (konfiguracja `deployed-api` w `angular.json`) łączy lokalny front z wdrożonym `https://calo-byte.vercel.app`, więc zapisy trafiają do produkcyjnej bazy. W deployu adres pochodzi ze zmiennej repo `API_URL` ([ci-cd](ci-cd.md)).
- **Logika** (`core/nutrition.ts`): `sumMacros` sumuje pola `total_*` posiłków. `toDayKey` liczy dzień w lokalnej strefie czasowej, celowo bez `toISOString()`, które działa w UTC. `summarizeByDay` grupuje dni od najnowszego. `percentOf` liczy procent realizacji celu.
- **Pulpit**: dzisiejsze posiłki i sumy względem celu. Usuwanie wymaga potwierdzenia (`confirm`). Komunikaty błędów są po polsku.
- **Historia**: dni z kaloriami względem celu, makro, rozwijane posiłki i średnia kcal z zakończonych dni.
- Testy: 25 testów Vitest.

## Rozbieżności

- Brak widoku **AddMeal** (wejście w języku naturalnym, parsowanie przez AI). Są Pulpit, Historia i Profil, a Historia bez planowania.
- Pulpit nie ma **edycji** posiłku, tylko usuwanie.
- Posiłki są przykładowe, bo backend nie ma `meals` ([entities/meals](../entities/meals.md)), więc wybrany profil nie wpływa jeszcze na Pulpit ani Historię. Cele dzienne front bierze z `DailyTargets`, którego backend nie ma. [Q-001](../questions.md#q-001)
- Zamiast logowania jest wybór profilu. Każdy, kto otworzy stronę, widzi wszystkie profile z e-mailem i wagą (`GET /users` bez uwierzytelniania). [Q-009](../questions.md#q-009)
- Karteczka „UI” w Miro jest pusta. Wygląd zaprojektowano w #17 bez makiet. [Q-003](../questions.md#q-003)
