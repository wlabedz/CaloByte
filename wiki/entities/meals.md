---
title: Encja meals
sources: [raw/miro/2026-11-07-board.md, backend/models.py]
code_sha: 933b1a7
updated: 2026-11-07
---

# Encja meals

## Plan (Miro)

Pełny CRUD. Pola: `id`, `user_id` (FK → [users](users.md)), `name`, `meal_type` (śniadanie/obiad/kolacja), `eaten_at` (timestamp), `total_kcal`, `total_protein`, `total_fat`, `total_carbs`, `total_fiber`, `raw_prompt`. Relacja: Meal 1 → N [meal_items](meal_items.md), kasowanie kaskadowe.

Endpointy z planu: `GET /meals` (z filtrami i paginacją w wariancie twistu: `?page=&limit=&min_kcal=`), `DELETE /meals/:id`, `POST /meals/parse-ai` (parsowanie opisu przez LLM), `GET /meals/stats` (twist: wykres). Walidacja Pydantic zwraca 400/404/422.

## Stan w kodzie

**Tabeli jeszcze nie ma.** Nie ma też modelu, migracji ani endpointów. Według planu miał powstać na Spotkaniu 2 ([milestones](../milestones.md)).

## Rozbieżności

- `meal_type` ma w Miro trzy wartości (śniadanie/obiad/kolacja), bez przekąsek. Nie wiadomo, czy to celowe. [Q-007](../questions.md#q-007)
- Źródło prawdy dla sum `total_*`. [Q-008](../questions.md#q-008)
