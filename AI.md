# Jak korzystaliśmy z AI

Wymóg projektu: opis narzędzi AI, poleceń (promptów) i tego, co poprawialiśmy ręcznie albo po review. Każdy obszar uzupełnia osoba za niego odpowiedzialna (issue #33).

## Frontend (Konrad)

**Narzędzie:** Claude Code (model Claude Opus 5.5) w VS Code, z dostępem do terminala i repozytorium. AI pisało kod i testy, uruchamiało lint, testy i build, a widoki sprawdzało w przeglądarce bez okna (Playwright + Chrome, zrzuty ekranu). Decyzje, review, commity i PR-y — autor.

### #17 — nowa baza Angulara, Pulpit i Historia

- Polecenia (skrót): „zrób część frontendową z mojej roli, resztę zostaw zespołowi”, „wywal obecny front i zrób porządnie od nowa podstawy”.
- Wygenerowane: projekt Angular 22 (bez SSR, routing `withHashLocation()`), `DashboardComponent`, `HistoryComponent`, `MacroProgressComponent`, modele i `MealRepository` z danymi przykładowymi, testy Vitest, README frontendu.
- Decyzje autora: Angular 22 zamiast 21 (z aktualizacją Node do 24.22), usunięcie poprzedniego szkieletu frontu, zostawienie workflowów CI/CD bez zmian.
- Poprawki po sprawdzeniu w przeglądarce: brak spacji w kwotach („1 171/ 1 900kcal” — Angular usuwa białe znaki między elementami), nierówne kafelki makro na telefonie (container query), pliki z samą zmianą końców linii po Prettierze.

### #20 — widok Profil

- Polecenia (skrót): „zrób następny krok na froncie”, potem „rozwiąż komentarze z PR #20”.
- Wygenerowane: `ProfileComponent` (lista i wybór profilu, formularz `POST /users`), `UserRepository` / `HttpUserRepository`, `ActiveUserService`, wspólne style formularzy, testy.
- Decyzja autora po review: `ActiveUserService` nie sprawdza zapamiętanego profilu z `GET /users`; zrobi to obsługa błędów przy endpointach posiłków (404 dla nieznanego `user_id`).
- Poprawki po review (Piotr): walidacja e-maila jak `EmailStr` i błąd 422 przy polu, ponowne wczytanie listy po zapisie, wdrożone API lokalnie tylko z wyboru (`npm run start:deployed-api`), aktualizacja wiki.
- Przy testach w przeglądarce zapisy (`POST /users`) były przechwytywane, żeby nie tworzyć profili w produkcyjnej bazie.

### #23 — motyw jasny i ciemny

- Polecenie (skrót): „zrób motywy ciemny/jasny”.
- Wygenerowane: tokeny kolorów w `light-dark()`, `ThemeService` z zapamiętaniem wyboru, skrypt w `index.html` przeciw miganiu tła, przełącznik w nagłówku, testy.
- Sprawdzone w przeglądarce: przełączanie przy jasnym i ciemnym systemie, wybór po odświeżeniu, motyw ustawiony także bez JS aplikacji, nagłówek na telefonie.

### #24 — „Cofnij” i powiadomienia

- Polecenie (skrót): „zrób kolejny PR z czymś fajnym tego typu jak motywy”.
- Wygenerowane: `ToastService` i `ToastHostComponent`, „Cofnij” przy usuwaniu posiłku zamiast `confirm()`, potwierdzenie zapisu profilu, testy.
- Poprawka po sprawdzeniu: zrzut z szarym powiadomieniem okazał się klatką z animacji wejścia, kolory zweryfikowane po jej zakończeniu.
- #23 i #24 zostały zmergowane do gałęzi pośrednich zamiast do `main`; kod trafił do `main` osobnym PR.

## Backend

_Do uzupełnienia (#33)._

## Baza i CI/CD

_Do uzupełnienia (#33)._

## AI w aplikacji (parsowanie posiłków)

_Do uzupełnienia razem z AddMeal (#29, #33): model, prompt, schemat odpowiedzi JSON, ręczne poprawki._

## Wiki

_Do uzupełnienia (#33): skill `/wiki`, hook przed PR._
