---
title: Encja recipes
sources: [raw/miro/2026-11-07-board.md, backend/models.py, backend/schemas_catalog.py, backend/routers/recipes.py, backend/catalog_service.py, backend/nutrition.py, backend/migrations/versions/, backend/seed/, frontend/src/app/core/models.ts, frontend/src/app/core/data/, frontend/src/app/features/recipes/]
code_sha: 81d47cf
updated: 2026-11-07
---

# Encja recipes

Przepis: katalog 1090 przepisów z Kaggle (tylko do odczytu) plus przepisy użytkownika (pełny CRUD). Składniki to [recipe_items](recipe_items.md) wskazujące [products](products.md).

## Plan (Miro)

Miro nie ma encji przepisu. W modelu danych są tylko `users`, `meals` i `meal_items`. Przepisów dotyczą dwie karteczki z zasobami: dataset Kaggle „better-recipes-for-a-better-life” (karteczka `3458764688287307297`) i calorieapi.com (`3458764688287307457`), zob. [overview](../overview.md#zasoby). Nie ma więc planu pól ani endpointów.

## Stan w kodzie

**Tabela `recipes`** (`backend/models.py`, klasa `Recipe`; migracja `e677c7db66b7`, zob. [database](../architecture/database.md)):

- Kolumny: `id` (UUID), `name`, `source` (enum `recipe_source`: `kaggle` | `user`), `external_id`, `category`, `category_path`, `servings`, `prep_min`, `cook_min`, `total_min`, `ingredients_text` (`text[]`), `directions`, `rating`, `source_url`, makro na porcję `kcal`/`protein`/`fat`/`carbs`/`fiber` (`Numeric(7,2)`), `user_id` (FK → `users`, `ON DELETE SET NULL`, nullable), `created_at`, `updated_at`.
- Ograniczenia: unikalne `(source, external_id)`; `CHECK servings >= 1`; `prep_min`, `cook_min`, `total_min` `>= 0`. Indeksy: `recipes_category_idx` i `recipes_name_lower_idx` (`lower(name)`).
- Relacja `items` → [recipe_items](recipe_items.md), `cascade="all, delete-orphan"`, kolejność wg `position`.

**API** (`backend/routers/recipes.py`, schematy w `backend/schemas_catalog.py`):

- `GET /recipes?q=&category=&source=&page=&limit=`: lista stronicowana (`limit` 1–100, domyślnie 20), sortowana po `name`; `q` to dopasowanie podciągu bez rozróżniania wielkości liter.
- `GET /recipes/categories`: kategorie z liczbą przepisów. `GET /recipes/{id}`: szczegóły; `items` wypełnione tylko dla przepisów `user`.
- `POST /recipes` (201), `PUT /recipes/{id}`, `DELETE /recipes/{id}` (204). Zapis zawsze ustawia `source = user`. Dla przepisu z katalogu `PUT` i `DELETE` zwracają 403, dla nieznanego `id` jest 404, dla nieznanego `product_id` w pozycji 422.
- Makra przepisu użytkownika liczy backend, nie klient: suma `makro produktu na 100 g × waga / 100` ze składników, dzielona przez `servings` i zaokrąglona half-up (`backend/nutrition.py`, `backend/catalog_service.py`). `total_min` to `prep_min + cook_min`, a `ingredients_text` jest generowany ze składników. Zmiana produktu przelicza przepisy użytkownika, które go używają (`recalculate_recipes_for_product`).
- Walidacja wejścia (`RecipeIn`): `name` 1–200 znaków, `servings` 1–100, `prep_min`/`cook_min` 0–10000, `directions` do 10000 znaków, od 1 do 50 składników, `weight_g` > 0 i do 10000.

**Seed:** `backend/seed/recipes.csv` (1090 wierszy), ładowany przez `python -m seed` (upsert po `(source, external_id)`, `RecipeSource.kaggle`). CSV powstaje jednorazowo ze skryptu `backend/seed/prepare.py` z pliku Kaggle. Działanie seeda: [backend](../architecture/backend.md).

**Frontend:** typy `RecipeSummary`, `RecipeDetail`, `RecipeInput` w `frontend/src/app/core/models.ts`; `RecipeRepository` → `HttpRecipeRepository` w `core/data/`; widoki lista, szczegóły i formularz w `features/recipes/`, zob. [frontend](../architecture/frontend.md). Formularz liczy podgląd makr lustrzaną funkcją `recipePerServing` (`core/nutrition.ts`), a zapisuje tylko `product_id` i wagę. Edycja przepisu z katalogu przekierowuje na szczegóły.

## Rozbieżności

- Miro nie ma encji przepisu ani endpointów, a kod ma całą encję z CRUD-em dla przepisów użytkownika. Powód i zakres nie wynikają z Miro (spec feature'a jest poza repo).
- Dataset Kaggle nie zawiera kalorii. `kcal` przepisów z katalogu jest liczone przy przygotowaniu seeda ze wzoru 4·białko + 4·węglowodany + 9·tłuszcz (`kcal_from_macros`, użyte w `backend/seed/prepare.py`), a białko, tłuszcz, węglowodany i błonnik są wyciągane z tekstu kolumny `nutrition`.
- Przepisy z Kaggle nie są powiązane z produktami: nie mają `recipe_items`, tylko tekst składników w `ingredients_text`, więc ich makr nie da się przeliczyć.
- Przepisy z seeda są tylko do odczytu (403 przy `PUT`/`DELETE`).
- `user_id` jest zawsze `NULL`: endpointy nie przypisują właściciela, bo nie ma logowania ani wyboru użytkownika po stronie API. Miro wymaga danych powiązanych z użytkownikiem, a front ma tylko lokalny „aktywny profil”. [Q-009](../questions.md#q-009)
- Przepisy nie są powiązane z `meals`: nie ma jeszcze sposobu dodania przepisu do posiłku ([meals](meals.md)).
