---
title: Zespół i role
sources: [raw/miro/2026-11-07-board.md]
updated: 2026-11-07
---

# Zespół i role

Zasady z Miro: każdy koduje i ma min. **1 własny PR i 1 review na spotkanie**. Rola **Release Managera rotuje** co spotkanie. Każdy zna aplikację od bazy po UI, bo na obronie jest 20-minutowy live coding.

| Osoba | Rola | Główne obszary |
|---|---|---|
| Konrad Niziński | Frontend Lead & UI Architecture | init Angulara, routing `withHashLocation()`, Dashboard i History, eslint, min. 2 testy Vitest, review frontu |
| Wojtek Łabędź | DevOps & Data / Persistence Lead | 3 workflow CI/CD, Neon w Vercel Storage, tabele `users`/`meals`/`meal_items` + migracje, sekrety, `/health` + smoke test |
| Piotr Walczak | Full Stack Integrator & API Lead | CRUD `meals` z walidacją Pydantic (400/404/422), serwis Angular + CORS, testy pytest z mockowaną bazą (min. 8), integracja front–back (Spotkanie 3) |
| Adam Kwiatkowski | AI Feature Engineer & Product Logic | LLM (Gemini/OpenAI) ze structured output, AddMealComponent, `AI.md`, logika twistu (Spotkanie 4) |

Stan na 2026-11-07: wszystkie 13 PR-ów pochodzi z konta `wlabedz` i żaden nie ma review ([changelog](changelog.md)).
