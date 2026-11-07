---
title: Encja meal_items
sources: [raw/miro/2026-11-07-board.md, backend/models.py, frontend/src/app/core/models.ts]
code_sha: 1ceb7d7
updated: 2026-11-07
---

# Encja meal_items

## Plan (Miro)

Pola: `id`, `meal_id` (FK → [meals](meals.md)), `ingredient_name`, `weight_g`, `kcal`, `protein`, `fat`, `carbs`, `fiber`. Rekordy powstają z odpowiedzi LLM (`POST /meals/parse-ai`). Użytkownik może poprawić gramatury przed zapisem.

## Stan w kodzie

**Backend:** tabeli jeszcze nie ma.

**Frontend** (od #17): interfejs `MealItem` w `frontend/src/app/core/models.ts` ma pola zgodne z planem. Zagnieżdża się go w `Meal.items`.

## Rozbieżności

- Nie wiadomo, czy `total_*` w `meals` mają być liczone z `meal_items` (w bazie albo w API), czy zapisywane osobno. [Q-008](../questions.md#q-008)
