# Pytania do analityka

Niewiadome w projekcie, zsynchronizowane z ramką „Pytania do analityka” na tablicy Miro. Statusy: otwarte → odpowiedziane → zamknięte.

<a id="q-001"></a>
## Q-001 · model danych · otwarte
Czy użytkownik ma mieć cele dzienne (kcal, białko, tłuszcze, węglowodany) jak w Miro, czy liczymy je z wagi, wzrostu i aktywności? Jeśli liczymy, to którym wzorem?
- Kontekst: Miro opisuje `daily_kcal_target`, `daily_protein_target`, `daily_fat_target`, `daily_carb_target`. `backend/models.py` ma `weight_kg`, `height_cm`, `activity`, `sex`, `bmi` i nie ma celów. Dashboard ma pokazywać progress bary celów.
- Źródła: raw/miro/2026-11-07-board.md, backend/models.py
- Dotyczy: [entities/users](entities/users.md)
- Miro: 3458764689732163742
- Odpowiedź: —

<a id="q-002"></a>
## Q-002 · AI · otwarte
Którego LLM używamy: Gemini czy OpenAI? Jest budżet albo limit zapytań, i czy klucz jest już w sekretach Vercela?
- Kontekst: Miro wymienia oba („Gemini API / OpenAI API”), wymaga wywołań tylko z backendu i odpowiedzi w JSON. W kodzie nie ma jeszcze integracji.
- Źródła: raw/miro/2026-11-07-board.md, backend/requirements.txt
- Dotyczy: [architecture/backend](architecture/backend.md)
- Miro: 3458764689732163743
- Odpowiedź: —

<a id="q-003"></a>
## Q-003 · UI · otwarte
Karteczka „UI” na tablicy jest pusta. Czy są makiety lub wytyczne dla trzech widoków (Dashboard, AddMeal, History/Planner)?
- Kontekst: Miro opisuje funkcje widoków, ale nie ich wygląd. Front ma dziś tylko formularz users.
- Źródła: raw/miro/2026-11-07-board.md, frontend/src/app/app.html
- Dotyczy: [architecture/frontend](architecture/frontend.md)
- Miro: 3458764689732163744
- Odpowiedź: —

<a id="q-004"></a>
## Q-004 · repo · otwarte
Które repozytorium jest główne: `pwjtd/CaloByte` (link na tablicy) czy `wlabedz/CaloByte` (tam są PR-y i CORS w backendzie)?
- Kontekst: karteczka GitHub w Miro linkuje `pwjtd/CaloByte`. Wszystkie 13 PR-ów jest w `wlabedz/CaloByte`, a `backend/app.py` dopuszcza origin `https://wlabedz.github.io`.
- Źródła: raw/miro/2026-11-07-board.md, raw/github/prs/, backend/app.py
- Dotyczy: [overview](overview.md)
- Miro: 3458764689732163745
- Odpowiedź: —

<a id="q-005"></a>
## Q-005 · architektura · otwarte
Czy przechodzimy na strukturę backendu z Miro (`backend/app/api/`, `services/`, `main.py`, `tests/`), czy zostaje obecna płaska (`app.py`, `db.py`, `models.py`)?
- Kontekst: przykładowa struktura w Miro różni się od repo. Zmiana wpływa na importy, `pytest --cov=app` w CI i entrypoint Vercela.
- Źródła: raw/miro/2026-11-07-board.md, backend/, .github/workflows/ci.yml
- Dotyczy: [architecture/backend](architecture/backend.md)
- Miro: 3458764689732163746
- Odpowiedź: —

<a id="q-006"></a>
## Q-006 · harmonogram · otwarte
Jakie są daty Spotkań 1–5 i co jest wymagane na Spotkaniach 4 i 5?
- Kontekst: Miro ma oś pięciu spotkań bez dat. Opis kończy się na Spotkaniu 3 (dwa puste punkty). Bez dat changelog nie przypisze PR-ów do kamieni milowych.
- Źródła: raw/miro/2026-11-07-board.md
- Dotyczy: [milestones](milestones.md)
- Miro: 3458764689732163747
- Odpowiedź: —

<a id="q-007"></a>
## Q-007 · model danych · otwarte
Czy `meal_type` ma tylko trzy wartości (śniadanie, obiad, kolacja), czy także przekąski albo inne posiłki?
- Kontekst: Miro wymienia trzy typy. To decyduje o enumie w bazie i o filtrach w twiście z wyszukiwarką.
- Źródła: raw/miro/2026-11-07-board.md
- Dotyczy: [entities/meals](entities/meals.md)
- Miro: 3458764689732163748
- Odpowiedź: —

<a id="q-008"></a>
## Q-008 · model danych · otwarte
Czy sumy `total_*` w `meals` liczymy z `meal_items` (w bazie lub w API), czy zapisujemy je osobno, np. gdy posiłek nie ma rozbicia na składniki?
- Kontekst: Miro ma oba poziomy (sumy w `meals`, wartości w `meal_items`), ale nie mówi, które jest źródłem prawdy. Ręczna korekta gramatur w AddMeal musi przeliczać sumy.
- Źródła: raw/miro/2026-11-07-board.md
- Dotyczy: [entities/meals](entities/meals.md), [entities/meal_items](entities/meal_items.md)
- Miro: 3458764689732163749
- Odpowiedź: —
