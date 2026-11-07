---
title: Encja products
sources: [raw/miro/2026-11-07-board.md, backend/models.py, backend/schemas_catalog.py, backend/routers/products.py, backend/catalog_service.py, backend/migrations/versions/, backend/seed/, frontend/src/app/core/models.ts, frontend/src/app/core/data/, frontend/src/app/features/recipes/product-dialog/]
code_sha: 81d47cf
updated: 2026-11-07
---

# Encja products

Produkt spożywczy z wartościami odżywczymi na 100 g: katalog USDA (tylko do odczytu) i produkty dodane przez użytkownika. Służy jako składnik w [recipe_items](recipe_items.md).

## Plan (Miro)

Miro nie ma encji produktu. Jedyne wskazówki to karteczka z API posiłków calorieapi.com i karteczka z datasetem Kaggle ([overview](../overview.md#zasoby)). W kodzie źródłem produktów jest USDA FoodData Central.

## Stan w kodzie

**Tabela `products`** (`backend/models.py`, klasa `Product`; migracja `e677c7db66b7`):

- Kolumny: `id` (UUID), `name` (po polsku), `name_en` (opis USDA), `source` (enum `product_source`: `usda` | `user`), `external_id` (FDC ID), `kcal`/`protein`/`fat`/`carbs`/`fiber` na 100 g (`Numeric(6,2)`), `user_id` (FK → `users`, `SET NULL`, nullable), `created_at`, `updated_at`.
- Ograniczenia: unikalne `(source, external_id)`; `CHECK` makra `>= 0`. Indeks `products_name_lower_idx` (`lower(name)`).

**API** (`backend/routers/products.py`):

- `GET /products?q=&source=&limit=`: szukanie po `name` i `name_en` (podciąg, bez rozróżniania wielkości liter), `limit` 1–50, domyślnie 20. `GET /products/{id}`.
- `POST /products` (201) tworzy produkt z `source = user`. `PUT /products/{id}` zmienia produkt i przelicza przepisy użytkownika, które go używają. `DELETE /products/{id}` (204).
- Produkt z USDA: `PUT`/`DELETE` dają 403. Usunięcie produktu użytego w przepisie daje 409 (klucz obcy `recipe_items.product_id` ma `RESTRICT`).
- Walidacja (`ProductIn`): `name` 1–200 znaków, `kcal` 0–900, `fiber` 0–100, suma białka, tłuszczu i węglowodanów nie większa niż 100 g.

**Seed:** `backend/seed/products.csv` (108 produktów). Wybór produktów (FDC ID i polska nazwa) jest w `backend/seed/usda_selection.csv`, a `backend/seed/prepare.py` dociąga wartości z pliku USDA SR Legacy (nutrienty: energia, białko, tłuszcz, węglowodany, błonnik).

**Frontend:** `Product`/`ProductInput` w `core/models.ts`; `ProductRepository` (`search`, `create`) → `HttpProductRepository`. Dodawanie produktu z poziomu formularza przepisu: `features/recipes/product-dialog/` (walidacja jak w API: `kcal` do 900, błonnik do 100).

## Rozbieżności

- Miro nie ma encji produktu; w kodzie jest tabela z CRUD-em dla produktów użytkownika. Zakres nie wynika z Miro.
- Źródłem jest USDA FoodData Central (domena publiczna), a nie calorieapi.com z karteczki Miro.
- Frontend nie ma jeszcze edycji ani usuwania produktów (`ProductRepository` ma tylko `search` i `create`), choć API je ma.
- `user_id` jest zawsze `NULL` (brak właściciela produktu). [Q-009](../questions.md#q-009)
