---
title: Encja users
sources: [raw/miro/2026-11-07-board.md, backend/models.py, backend/schemas.py, backend/migrations/versions/, raw/github/prs/PR-0017.md, frontend/src/app/core/data/http-user-repository.ts, frontend/src/app/features/profile/profile.component.ts]
code_sha: 81d47cf
updated: 2026-11-07
---

# Encja users

## Plan (Miro)

`users` (lub `profile`): `id`, `email/username`, `daily_kcal_target`, `daily_protein_target`, `daily_fat_target`, `daily_carb_target`. Relacja: User 1 → N [meals](meals.md). Cele zasilają progress bary na Dashboardzie.

## Stan w kodzie

Model `User` (`backend/models.py:40`), tabela `users` z migracji `61ac7f2698e4` + `80b93a51e10e`:

| Pole | Typ | Uwagi |
|---|---|---|
| `id` | UUID | `gen_random_uuid()` |
| `name`, `surname` | varchar(100) | |
| `email` | varchar(255) | unikalny bez względu na wielkość liter (`users_email_key` na `lower(email)`) |
| `birth_date` | date | |
| `weight_kg` | numeric(5,2) | check 0–500 |
| `height_cm` | numeric(5,1) | check 0–300 |
| `activity` | enum `activity_level` | sedentary / light / moderate / active / very_active, domyślnie moderate |
| `sex` | enum `sex` | male / female / other, domyślnie male (dodane w #11 jako test CD) |
| `bmi` | numeric(4,1) | kolumna wyliczana w bazie: `weight_kg / (height_cm/100)^2` |
| `created_at`, `updated_at` | timestamptz | `now()` |

API: `GET /users`, `POST /users` (409 przy zajętym emailu), schematy `UserCreate`/`UserOut` w `backend/schemas.py`. Front korzysta z nich od #20: `HttpUserRepository` i widok Profil (lista profili, wybór aktywnego, zakładanie nowego). Walidacja formularza odwzorowuje `UserCreate`, w tym e-mail z kropką w domenie jak `EmailStr`. Cele dzienne front bierze nadal z `MealRepository.getTargets()`, zob. [architecture/frontend](../architecture/frontend.md).

## Rozbieżności

- Miro: cele dzienne (`daily_*_target`). Kod: dane antropometryczne, bez celów. [Q-001](../questions.md#q-001)
- Brak `username`. Jest `name` + `surname`.
- Nie ma logowania. Front wybiera „bieżącego” użytkownika na stronie Profil i zapamiętuje go w przeglądarce, a `GET /users` pokazuje wszystkim pełne dane profili. [Q-009](../questions.md#q-009)
