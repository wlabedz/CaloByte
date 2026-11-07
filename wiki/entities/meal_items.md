---
title: Encja meal_items
sources: [raw/miro/2026-11-07-board.md, backend/models.py]
code_sha: 933b1a7
updated: 2026-11-07
---

# Encja meal_items

## Plan (Miro)

Pola: `id`, `meal_id` (FK → [meals](meals.md)), `ingredient_name`, `weight_g`, `kcal`, `protein`, `fat`, `carbs`, `fiber`. Rekordy powstają z odpowiedzi LLM (`POST /meals/parse-ai`). Użytkownik może poprawić gramatury przed zapisem.

## Stan w kodzie

**Tabeli jeszcze nie ma.**

## Rozbieżności

- Nie wiadomo, czy `total_*` w `meals` mają być liczone z `meal_items` (w bazie albo w API), czy zapisywane osobno. [Q-008](../questions.md#q-008--model-danych--otwarte)
