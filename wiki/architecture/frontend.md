---
title: Frontend (Angular)
sources: [raw/miro/2026-11-07-board.md, raw/github/prs/PR-0017.md, frontend/src/app/, frontend/src/environments/, frontend/src/testing/, frontend/src/styles.css, frontend/angular.json, frontend/package.json]
code_sha: 81d47cf
updated: 2026-11-07
---

# Frontend (Angular)

## Plan (Miro)

Angular standalone, TS, `@angular-eslint`, Vitest. SPA budowane `ng build` i publikowane na GitHub Pages. Routing z `withHashLocation()`, żeby odświeżenie podstrony nie dawało 404. `provideHttpClient()`, adres API wstrzykiwany przy buildzie ze zmiennych repo. Trzy widoki: **Dashboard** (bilans dnia, progress bary celów, lista posiłków z edycją i usuwaniem), **AddMeal** (opis w języku naturalnym → `POST /meals/parse-ai` → tabela do korekty → zapis), **History/Planner** (poprzednie dni, planowanie, trend). Docelowa struktura: `components/{dashboard,add-meal,history}`, `services/MealService`, `models/{Meal,MealItem}`.

## Stan w kodzie

Od [#17](../changelog.md) (2026-11-07), z widokiem Profil z #20 oraz motywami (#23) i powiadomieniami (#24):

- Angular 22 **bez SSR**: statyczne Pages nie potrzebują serwera. Style w zwykłym CSS. Wymagany Node `^22.22.3`, `^24.15` lub `>=26`.
- **Motyw jasny i ciemny** (#23): każdy token koloru w `src/styles.css` ma oba warianty w `light-dark(jasny, ciemny)`. Domyślnie motyw jest jak w systemie (`color-scheme: light dark`). Przełącznik w nagłówku (`core/theme.service.ts`) zapisuje wybór w `localStorage` (`calobyte.theme`) i ustawia `data-theme="light|dark"` na `<html>`. Skrypt w `src/index.html` robi to samo przed startem Angulara, żeby tło nie migało.
- **Powiadomienia** (#24): `core/toast.service.ts` + `shared/toast/` (`<app-toast-host>` w `AppComponent`), z opcjonalnym przyciskiem akcji. Odliczanie stoi, gdy kursor albo fokus jest na powiadomieniu. Kolory z tokenów `--inverse-*`.
- `app.config.ts`: `provideRouter(routes, withHashLocation())`, `provideHttpClient(withFetch())`, `LOCALE_ID = 'pl'` oraz providery `MealRepository → InMemoryMealRepository`, `UserRepository → HttpUserRepository`, `RecipeRepository → HttpRecipeRepository` i `ProductRepository → HttpProductRepository`.
- Trasy (`app.routes.ts`, lazy): `/#/dashboard` (Pulpit · CaloByte), `/#/history` (Historia · CaloByte), `/#/profile` (Profil · CaloByte) oraz Przepisy: `/#/recipes` (lista), `/#/recipes/new` (Nowy przepis), `/#/recipes/:id` (Przepis) i `/#/recipes/:id/edit` (Edycja przepisu), wszystkie z tytułem „… · CaloByte”. `''` i `**` przekierowują na dashboard. W nawigacji (`app.component.ts`) jest pozycja „Przepisy”.
- Struktura: `core/` (modele, logika, dane, `ActiveUserService`), `features/{dashboard,history,profile,recipes}/`, `shared/macro-progress/` (pasek postępu makro). Wspólne style (`.card`, `.field`, `.field-error`, `.button`, `.badge`) w `src/styles.css`.
- **Modele** (`core/models.ts`) mają pola w snake_case, jak kolumny w bazie, a ID to UUID string. `Meal` zawiera pola z planu Miro i do tego `items: MealItem[]`. `MealType = 'breakfast' | 'lunch' | 'dinner'`. `DailyTargets = { kcal, protein, fat, carbs }`. `NewUser` i `User` odwzorowują `UserCreate` i `UserOut` z backendu, z polskimi etykietami `activity` i `sex`.
- **Dane**: widoki korzystają wyłącznie z abstrakcji w `core/data/`. Posiłki to `MealRepository` (`getTargets`, `getMeals`, `deleteMeal`) z implementacją `InMemoryMealRepository` i danymi przykładowymi (`core/data/sample-data.ts`). Profile idą z API: `UserRepository` → `HttpUserRepository` (`GET /users`, `POST /users`). Klient HTTP dla posiłków ma powstać tym samym wzorcem i podmienić jeden provider.
- **Aktywny profil** (`core/active-user.service.ts`): wybór `{ id, name }` w sygnale, zapamiętany w `localStorage` (`calobyte.activeUser`). Zastępuje logowanie, dopóki go nie ma. Serwis nie sprawdza, czy zapamiętany profil nadal istnieje. Ustalenie z review #20 (autor PR, 2026-11-07): przy endpointach posiłków nieznany `user_id` ma dawać `404`, a wybór czyści wtedy interceptor albo guard.
- **Profil**: lista profili (imię, e-mail, waga, wzrost, BMI, aktywność) z wyborem aktywnego (`aria-pressed`) oraz formularz nowego profilu z walidacją jak w `UserCreate`. E-mail musi mieć kropkę w domenie, bo `EmailStr` odrzuca np. `a@b`. Odpowiedź 422 dla `email` jest pokazywana przy polu, a 409 ma osobny komunikat o zajętym adresie. Nowy profil od razu staje się aktywny. Gdy wcześniej nie udało się wczytać listy, po zapisie jest pobierana od nowa.
- **Adres API**: `npm start` korzysta z `http://localhost:8000` (lokalny backend). `npm run start:deployed-api` (konfiguracja `deployed-api` w `angular.json`) łączy lokalny front z wdrożonym `https://calo-byte.vercel.app`, więc zapisy trafiają do produkcyjnej bazy. W deployu adres pochodzi ze zmiennej repo `API_URL` ([ci-cd](ci-cd.md)).
- **Przepisy** (`features/recipes/`, [entities/recipes](../entities/recipes.md)): `recipe-list` (wyszukiwanie z debounce 300 ms, filtr kategorii i źródła katalog/własne, paginacja po 20), `recipe-detail` (makra na porcję, składniki, kroki; usuwanie przez `confirm`, 404 przekierowuje na listę), `recipe-form` (nowy i edycja przepisu użytkownika: wyszukiwarka produktów od 2 znaków, domyślna waga 100 g, podgląd makr na żywo; przepis z katalogu nie jest edytowalny, formularz przekierowuje na szczegóły) oraz `product-dialog` (dodanie własnego produktu z poziomu formularza, walidacja jak w API). Dane idą przez `RecipeRepository` (`list`, `categories`, `get`, `create`, `update`, `remove`) i `ProductRepository` (`search`, `create`) w implementacjach HTTP (`http-recipe-repository.ts`, `http-product-repository.ts`; puste filtry nie trafiają do URL-a). Typy `Recipe*`, `Product*`, `Page<T>`, `CategoryCount` w `core/models.ts`.
- **Polskie liczebniki** (`core/polish-plural.ts`): `polishPlural` wybiera formę (1 / 2–4 z wyjątkiem 12–14 / reszta), `servingsLabel` daje „1 porcja”, „2 porcje”, „5 porcji”.
- **Logika** (`core/nutrition.ts`): `recipePerServing` jest lustrem `recipe_per_serving` z backendu (zaokrąglenie half-up: kcal do całości, makra do 2 miejsc), używanym tylko do podglądu w formularzu; wartość zapisaną liczy backend. `sumMacros` sumuje pola `total_*` posiłków. `toDayKey` liczy dzień w lokalnej strefie czasowej, celowo bez `toISOString()`, które działa w UTC. `summarizeByDay` grupuje dni od najnowszego. `percentOf` liczy procent realizacji celu.
- **Pulpit**: dzisiejsze posiłki i sumy względem celu. „Usuń” od razu ukrywa posiłek i pokazuje powiadomienie z „Cofnij”; `deleteMeal` leci dopiero, gdy powiadomienie zniknie bez cofnięcia, a przy błędzie posiłek wraca z komunikatem. Komunikaty są po polsku.
- **Historia**: dni z kaloriami względem celu, makro, rozwijane posiłki i średnia kcal z zakończonych dni.
- Testy: Vitest; przepisy mają specyfikacje dla listy, szczegółów, formularza, dialogu produktu, repozytoriów HTTP i `polish-plural`.

## Rozbieżności

- Brak widoku **AddMeal** (wejście w języku naturalnym, parsowanie przez AI). Są Pulpit, Historia i Profil, a Historia bez planowania.
- Przepisy (i produkty) nie występują w planie z Miro, a nie są jeszcze połączone z posiłkami ani z Pulpitem ([entities/recipes](../entities/recipes.md)).
- Pulpit nie ma **edycji** posiłku, tylko usuwanie.
- Posiłki są przykładowe, bo backend nie ma `meals` ([entities/meals](../entities/meals.md)), więc wybrany profil nie wpływa jeszcze na Pulpit ani Historię. Cele dzienne front bierze z `DailyTargets`, którego backend nie ma. [Q-001](../questions.md#q-001)
- Zamiast logowania jest wybór profilu. Każdy, kto otworzy stronę, widzi wszystkie profile z e-mailem i wagą (`GET /users` bez uwierzytelniania). [Q-009](../questions.md#q-009)
- Karteczka „UI” w Miro jest pusta. Wygląd zaprojektowano w #17 bez makiet. [Q-003](../questions.md#q-003)
