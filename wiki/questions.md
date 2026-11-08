# Pytania do analityka

Niewiadome w projekcie, zsynchronizowane z ramką „Pytania do analityka” na tablicy Miro. Statusy: otwarte → odpowiedziane → zamknięte.

<a id="q-001"></a>
## Q-001 · model danych · otwarte
Czy użytkownik ma mieć cele dzienne (kcal, białko, tłuszcze, węglowodany) jak w Miro, czy liczymy je z wagi, wzrostu i aktywności? Jeśli liczymy, to którym wzorem?
- Kontekst: Miro opisuje `daily_kcal_target`, `daily_protein_target`, `daily_fat_target`, `daily_carb_target`. `backend/models.py` ma `weight_kg`, `height_cm`, `activity`, `sex`, `bmi` i nie ma celów. Dashboard ma pokazywać progress bary celów. Od #17 front oczekuje `DailyTargets = { kcal, protein, fat, carbs }` (bez błonnika) i na razie pokazuje cele przykładowe. Autor #17 zgłasza to samo pytanie w sekcji „Do ustalenia”.
- Źródła: raw/miro/2026-11-07-board.md, backend/models.py
- Dotyczy: [entities/users](entities/users.md)
- Miro: 3458764689732163742
- Odpowiedź: —

<a id="q-002"></a>
## Q-002 · AI · otwarte
Którego LLM używamy: Gemini czy OpenAI? Jest budżet albo limit zapytań, i czy klucz jest już w sekretach Vercela?
- Kontekst: Miro wymienia oba („Gemini API / OpenAI API”), wymaga wywołań tylko z backendu i odpowiedzi w JSON. Czat z przepisami (`POST /chat`, #35; od `feat/chat-db-recipes` przeszukuje przepisy z bazy) używa Gemini na darmowym planie, z kluczem `GEMINI_API_KEY` w sekretach Vercela, ale według autora PR (2026-11-07) nie rozstrzyga to wyboru dla parsowania posiłków (AddMeal).
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
## Q-004 · repo · zamknięte
Które repozytorium jest główne: `pwjtd/CaloByte` (link na tablicy) czy `wlabedz/CaloByte` (tam są PR-y i CORS w backendzie)?
- Kontekst: karteczka GitHub w Miro linkuje `pwjtd/CaloByte`. Wszystkie 13 PR-ów jest w `wlabedz/CaloByte`, a `backend/app.py` dopuszcza origin `https://wlabedz.github.io`.
- Źródła: raw/miro/2026-11-07-board.md, raw/github/prs/, backend/app.py
- Dotyczy: [overview](overview.md)
- Miro: 3458764689732163745
- Odpowiedź: Główne repo to `wlabedz/CaloByte` (karteczka w Miro, 2026-11-07; **odpowiedź testowa** wpisana w ramach testu pętli wiki). Wpisane do [overview](overview.md#zasoby).

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
- Kontekst: Miro wymienia trzy typy. To decyduje o enumie w bazie i o filtrach w twiście z wyszukiwarką. Front od #17 używa angielskich wartości `breakfast | lunch | dinner` z polskimi etykietami.
- Źródła: raw/miro/2026-11-07-board.md
- Dotyczy: [entities/meals](entities/meals.md)
- Miro: 3458764689732163748
- Odpowiedź: —

<a id="q-008"></a>
## Q-008 · model danych · otwarte
Czy sumy `total_*` w `meals` liczymy z `meal_items` (w bazie lub w API), czy zapisujemy je osobno, np. gdy posiłek nie ma rozbicia na składniki?
- Kontekst: Miro ma oba poziomy (sumy w `meals`, wartości w `meal_items`), ale nie mówi, które jest źródłem prawdy. Ręczna korekta gramatur w AddMeal musi przeliczać sumy. Front od #17 sumuje dzień z `total_*`, a nie z `items`.
- Źródła: raw/miro/2026-11-07-board.md
- Dotyczy: [entities/meals](entities/meals.md), [entities/meal_items](entities/meal_items.md)
- Miro: 3458764689732163749
- Odpowiedź: —

<a id="q-009"></a>
## Q-009 · użytkownik · otwarte
Czyje posiłki pokazuje aplikacja, skoro nie ma logowania? Czy uwierzytelnianie jest w zakresie projektu, czy wystarczy jeden użytkownik demo albo wybór użytkownika?
- Kontekst: Miro wymaga danych „powiązanych z konkretnym użytkownikiem” (`meals.user_id`), ale nie wspomina o logowaniu. #17 zgłasza to w sekcji „Do ustalenia”. Backend ma tylko `GET/POST /users` bez auth.
- Źródła: raw/miro/2026-11-07-board.md, raw/github/prs/PR-0017.md, backend/app.py
- Dotyczy: [entities/users](entities/users.md), [architecture/frontend](architecture/frontend.md)
- Miro: 3458764689734052356
- Odpowiedź: —
