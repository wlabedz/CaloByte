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
├── environments/api-url.ts   # adres API; w deployu nadpisywany zmienną API_URL z repozytorium
├── testing/                  # dane testowe współdzielone przez specy
└── app/
    ├── app.config.ts         # providery: router z withHashLocation(), HttpClient, locale pl, źródło danych
    ├── app.routes.ts         # trasy, widoki ładowane leniwie
    ├── core/
    │   ├── models.ts         # Meal, MealItem (pola jak w bazie), DailyTargets
    │   ├── nutrition.ts      # sumowanie makro, grupowanie posiłków po dniach
    │   └── data/             # MealRepository (kontrakt) + implementacja z danymi przykładowymi
    ├── shared/macro-progress/ # pasek realizacji celu (kalorie, makroskładniki)
    └── features/
        ├── dashboard/        # DashboardComponent — bilans dnia i dzisiejsze posiłki
        └── history/          # HistoryComponent — przegląd dni i średnia kalorii
```

## Routing a GitHub Pages

Router działa z `withHashLocation()`, więc adresy mają postać `…/CaloByte/#/history`.
GitHub Pages serwuje tylko `index.html`, a dzięki hashowi odświeżenie dowolnej podstrony
nie kończy się błędem 404.

## Dane i integracja z API

Widoki pobierają dane wyłącznie przez `MealRepository`. Do czasu podpięcia backendu
w `app.config.ts` zarejestrowane jest `InMemoryMealRepository` z tygodniem przykładowych
posiłków (usuwanie działa w pamięci, do odświeżenia strony). Klient HTTP dziedziczy po
`MealRepository`, korzysta z `API_URL` i podmienia ten jeden provider — widoki zostają bez zmian.

Cele dzienne (`DailyTargets`) są osobnym typem, bo tabela `users` ich nie przechowuje —
backend może je dodać jako kolumny albo wyliczać z wagi, wzrostu, wieku i aktywności.

## Na czym polegają workflowy CI/CD

Nie zmieniaj bez uzgodnienia z osobą od CI/CD:

- nazwa projektu `frontend` → wynik builda w `dist/frontend/browser` (deploy na Pages),
- plik `src/environments/api-url.ts` z eksportem `API_URL` (deploy go nadpisuje),
- skrypt `npm run lint` oraz `ng test --watch=false --coverage` z raportem
  `coverage/frontend/coverage-summary.json` (podsumowanie pokrycia w CI).

## Konwencje

- `ng generate component nazwa` tworzy `nazwa.component.ts` z klasą `NazwaComponent`
  (ustawione w `angular.json`, zgodnie z nazwami z planu projektu).
- Komponenty standalone z `ChangeDetectionStrategy.OnPush`, stan w sygnałach,
  w szablonach `@if` / `@for`.
- Style w zwykłym CSS; kolory i promienie jako zmienne CSS w `src/styles.css`
  (motyw jasny i ciemny).
