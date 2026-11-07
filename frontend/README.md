# CaloByte — frontend

Angular 22 (standalone components, sygnały, zoneless, tryb strict), publikowany jako statyczne SPA
na GitHub Pages — bez SSR, bo Pages serwuje wyłącznie pliki statyczne.

## Uruchomienie

Wymagany Node.js `^22.22.3`, `^24.15` lub `>=26` (wymóg Angular CLI 22).

```bash
npm ci
npm start        # http://localhost:4200
npm test         # Vitest; poza terminalem (np. w CI) uruchamia się jednorazowo
npm run lint     # angular-eslint
npm run build    # build produkcyjny do dist/frontend/browser z base href /CaloByte/
```

## Struktura

```
src/
├── environments/
│   ├── api-url.ts            # adres API; w deployu nadpisywany zmienną API_URL z repozytorium
│   └── api-url.development.ts # adres dla `ng serve` (wdrożone API)
├── testing/                  # dane testowe współdzielone przez specy
└── app/
    ├── app.config.ts         # providery: router z withHashLocation(), HttpClient, locale pl, źródła danych
    ├── app.routes.ts         # trasy, widoki ładowane leniwie
    ├── core/
    │   ├── models.ts         # Meal, MealItem, User, NewUser (pola jak w API), DailyTargets
    │   ├── nutrition.ts      # sumowanie makro, grupowanie posiłków po dniach
    │   ├── active-user.service.ts # wybrany profil, zapamiętany w localStorage
    │   └── data/             # kontrakty MealRepository / UserRepository i ich implementacje
    ├── shared/macro-progress/ # pasek realizacji celu (kalorie, makroskładniki)
    └── features/
        ├── dashboard/        # DashboardComponent — bilans dnia i dzisiejsze posiłki
        ├── history/          # HistoryComponent — przegląd dni i średnia kalorii
        └── profile/          # ProfileComponent — wybór i zakładanie profilu (GET/POST /users)
```

Wspólne style (karty, formularze `.field`, przycisk `.button`, `.badge`) są w `src/styles.css`.

## Routing a GitHub Pages

Router działa z `withHashLocation()`, więc adresy mają postać `…/CaloByte/#/history`.
GitHub Pages serwuje tylko `index.html`, a dzięki hashowi odświeżenie dowolnej podstrony
nie kończy się błędem 404.

## Dane i integracja z API

Widoki pobierają dane wyłącznie przez repozytoria z `core/data/`; implementacje wybierają
providery w `app.config.ts`.

- **Profile** idą już z API: `HttpUserRepository` woła `GET /users` i `POST /users`.
  Wybrany profil trzyma `ActiveUserService` — do czasu logowania to on określa, czyje dane widać.
- **Posiłki** to na razie `InMemoryMealRepository` z tygodniem przykładowych posiłków
  (usuwanie działa w pamięci, do odświeżenia strony). Klient HTTP dla posiłków powstaje
  tak samo jak `HttpUserRepository` (dziedziczy po `MealRepository`, używa `API_URL`)
  i podmienia jeden provider — widoki zostają bez zmian.

`npm start` łączy się z wdrożonym API (`api-url.development.ts`, CORS wpuszcza
`localhost:4200`), więc lokalnie nie trzeba stawiać backendu ani bazy. **Zapisy trafiają do tej
samej bazy co produkcja.** Do pracy z lokalnym backendem zmień adres na `http://localhost:8000`.

Cele dzienne (`DailyTargets`) są osobnym typem, bo tabela `users` ich nie przechowuje —
backend może je dodać jako kolumny albo wyliczać z wagi, wzrostu, wieku i aktywności.

## Na czym polegają workflowy CI/CD

Nie zmieniaj bez uzgodnienia z osobą od CI/CD:

- nazwa projektu `frontend` → wynik builda w `dist/frontend/browser` (deploy na Pages),
- plik `src/environments/api-url.ts` z eksportem `API_URL` (deploy go nadpisuje),
- skrypt `npm run lint` oraz `ng test --watch=false --coverage` z raportem
  `coverage/frontend/coverage-summary.json` (podsumowanie pokrycia w CI).

## Motyw jasny i ciemny

Domyślnie aplikacja wygląda tak jak system (`prefers-color-scheme`). Przełącznik w nagłówku
(`ThemeService`) zapisuje wybór w `localStorage` i ustawia `data-theme="light|dark"` na `<html>`;
skrypt w `src/index.html` robi to samo jeszcze przed startem Angulara, żeby tło nie migało.

Każdy kolor w `src/styles.css` ma oba warianty w `light-dark(jasny, ciemny)`. Nowy kolor dodaj
jako token w tym samym miejscu — komponenty używają tylko zmiennych (`var(--…)`).

## Konwencje

- `ng generate component nazwa` tworzy `nazwa.component.ts` z klasą `NazwaComponent`
  (ustawione w `angular.json`, zgodnie z nazwami z planu projektu).
- Komponenty standalone z `ChangeDetectionStrategy.OnPush`, stan w sygnałach,
  w szablonach `@if` / `@for`.
- Style w zwykłym CSS; kolory i promienie jako zmienne CSS w `src/styles.css`
  (zob. „Motyw jasny i ciemny”).
