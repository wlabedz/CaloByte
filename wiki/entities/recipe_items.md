---
title: Encja recipe_items
sources: [raw/miro/2026-11-07-board.md, backend/models.py, backend/schemas_catalog.py, backend/routers/recipes.py, backend/catalog_service.py, backend/nutrition.py, backend/migrations/versions/, frontend/src/app/core/models.ts, frontend/src/app/features/recipes/recipe-form/]
code_sha: c7e0981
updated: 2026-11-11
---

# Encja recipe_items

Składnik przepisu: [produkt](products.md) w podanej wadze, należący do [przepisu](recipes.md).

## Plan (Miro)

Miro nie ma encji przepisu ani składnika przepisu. Najbliższa jest `meal_items` ([meal_items](meal_items.md)), ale dotyczy posiłków z LLM, nie przepisów.

## Stan w kodzie

**Tabela `recipe_items`** (`backend/models.py`, klasa `RecipeItem`; migracja `e677c7db66b7`):

- Kolumny: `id` (UUID), `recipe_id` (FK → `recipes`, `ON DELETE CASCADE`), `product_id` (FK → `products`, `ON DELETE RESTRICT`), `weight_g` (`Numeric(7,2)`), `position` (kolejność w przepisie).
- Ograniczenie: `CHECK weight_g > 0`. Brak unikalności `(recipe_id, product_id)`, więc ten sam produkt może wystąpić kilka razy.
- Tabela nie ma własnych endpointów: składniki są częścią ciała `POST`/`PUT /recipes` (`items: [{product_id, weight_g}]`, 1–50 pozycji) i podmieniane w całości przy zapisie.
- W odpowiedzi `RecipeItemOut` niesie `product_name` oraz makra przeliczone na podaną wagę (`item_macros` w `backend/nutrition.py`). Dla przepisów z Kaggle `items` jest puste.

**Frontend:** `RecipeItem` i `RecipeItemInput` w `core/models.ts`. Formularz (`features/recipes/recipe-form/`) wyszukuje produkty, ma domyślną wagę dla nowej pozycji i pokazuje podgląd makr; przy edycji wartości na 100 g są odtwarzane z makr składnika, tylko na potrzeby podglądu.

## Rozbieżności

- Brak w Miro: encja istnieje tylko w kodzie.
- Przepisy z Kaggle nie mają składników w tej tabeli (tylko `ingredients_text`), zob. [recipes](recipes.md).
- Tabela nie ma `user_id`; właściciel wynika z przepisu, a ten ma `user_id` zawsze `NULL`. [Q-009](../questions.md#q-009)
