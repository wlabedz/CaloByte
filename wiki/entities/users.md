---
title: Encja users
sources: [raw/miro/2026-11-07-board.md, backend/models.py, backend/schemas.py, backend/migrations/versions/, raw/github/prs/PR-0017.md, backend/app.py, backend/auth.py, frontend/src/app/core/data/http-user-repository.ts, frontend/src/app/core/active-user.service.ts, frontend/src/app/features/profile/profile.component.ts]
code_sha: c7e0981
updated: 2026-11-11
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

API: `GET /users`, `POST /users` (409 przy zajętym emailu), schematy `UserCreate`/`UserOut` w `backend/schemas.py`. Od `feat/email-login` jest logowanie samym e-mailem: `POST /auth/login` (404 dla nieznanego adresu) i `GET /auth/me`, a zalogowanego backend rozpoznaje po nagłówku `X-User-Id` (`backend/auth.py`, zob. [backend](../architecture/backend.md)). Front: `HttpUserRepository` (`createUser`, `login`, `me`) i widok Profil, który bez logowania pokazuje logowanie i zakładanie konta, a po zalogowaniu opis profilu i „Wyloguj”. Listy profili do wyboru już nie ma. `users.id` jest właścicielem przepisów i produktów użytkownika (`recipes.user_id`, `products.user_id`). Walidacja formularza odwzorowuje `UserCreate`, w tym e-mail z kropką w domenie jak `EmailStr`. Cele dzienne front bierze nadal z `MealRepository.getTargets()`, zob. [architecture/frontend](../architecture/frontend.md).

## Rozbieżności

- Miro: cele dzienne (`daily_*_target`). Kod: dane antropometryczne, bez celów. [Q-001](../questions.md#q-001)
- Brak `username`. Jest `name` + `surname`.
- Logowanie jest bez hasła: wystarczy znać czyjś e-mail, żeby działać jako ta osoba, a `GET /users` dalej pokazuje wszystkim pełne dane kont (front go już nie używa). Decyzja zespołu na czas projektu (autor PR, 2026-11-11); czy potrzebne jest prawdziwe uwierzytelnianie, rozstrzyga analityk. [Q-009](../questions.md#q-009)
