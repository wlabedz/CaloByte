# LLM Wiki dla CaloByte — projekt

Data: 2026-11-07 · Status: do akceptacji

## Cel

Wiki projektu CaloByte utrzymywana przez LLM według wzorca Karpathy'ego („LLM Wiki”): surowe źródła → strony markdown pisane i aktualizowane przez Claude → zasady w pliku schematu. Czytelnicy to **zespół (4 osoby) i Claude**, więc strony muszą być czytelne dla ludzi i dawać się przeszukiwać przez LLM.

Wiki ma dawać:

1. Aktualny obraz projektu: co planujemy (Miro) i co już jest w kodzie.
2. Log zmian z commitów i PR-ów.
3. Listę pytań do analityka o niewiadome w projekcie, zsynchronizowaną z tablicą w Miro.
4. Powtarzalny sposób ingestowania nowych danych.

## Poza zakresem

- Automatyzacja w CI (GitHub Action). Można ją dodać później jako lekki zrzut surowych danych PR-ów do `raw/`, a skill zostaje bez zmian.
- Osobna usługa, baza wektorowa czy wyszukiwarka. Do wyszukiwania wystarczają `index.md` i grep.
- Hostowanie wiki poza repo (GitHub Wiki, Notion).

## Źródła

| Źródło | Jak pobierane | Gdzie trafia surowy zrzut |
|---|---|---|
| Tablica Miro `CaloByte` (`https://miro.com/app/board/uXjVEWYP5RY=/`) | Connector Miro w Claude Code (`canvas_search`, `canvas_read_as_svg`) | `raw/miro/YYYY-MM-DD-board.md` |
| PR-y i commity (`wlabedz/CaloByte`) | `gh pr list/view --json ...`, `git log` | `raw/github/prs/PR-NNNN.md` |
| Kod w repo | czytany bezpośrednio, bez kopiowania | — (strony zapisują ścieżki i commit SHA) |

`raw/` jest niezmienne: kolejne ingesty dopisują nowe pliki i nie nadpisują starych. Wyjątek: plik PR-a może zostać nadpisany, jeśli PR był edytowany po merge'u.

## Struktura

```
raw/
  miro/YYYY-MM-DD-board.md     # tekst tablicy: ID widgetu, typ, pozycja, treść
  github/prs/PR-NNNN.md        # tytuł, autor, daty, opis, commity, pliki, review
wiki/
  CLAUDE.md                    # schemat: konwencje, operacje, zasady
  index.md                     # każda strona + jedno zdanie opisu
  log.md                       # dziennik operacji + stan ingestu
  overview.md                  # czym jest CaloByte, stos, linki prod
  team.md                      # role i odpowiedzialności (z Miro)
  milestones.md                # 5 spotkań: plan kontra stan
  entities/
    users.md · meals.md · meal_items.md
  architecture/
    backend.md · frontend.md · database.md · ci-cd.md
  decisions/
    NNNN-<slug>.md             # np. 0001-neon-postgres.md
  changelog.md                 # jeden wpis na PR, od najnowszych
  questions.md                 # pytania do analityka
.claude/skills/wiki/SKILL.md   # skill /wiki, wersjonowany w repo
```

### Konwencje stron

- Język: polski. Nazwy plików, kod i identyfikatory zostają w oryginale.
- Każda strona zaczyna się frontmatterem:
  ```yaml
  ---
  title: Encja users
  sources: [raw/miro/2026-11-07-board.md, backend/models.py]
  code_sha: 933b1a7      # commit, przy którym strona była zgodna z kodem (gdy dotyczy kodu)
  updated: 2026-11-07
  ---
  ```
- Linki między stronami jako zwykłe względne linki markdown, żeby działały na GitHubie.
- Strony z encjami i architekturą mają sekcje **Plan (Miro)**, **Stan w kodzie** i **Rozbieżności**. Każda rozbieżność linkuje do pytania `Q-NNN`, jeśli takie istnieje.
- Kod jest linkowany (`backend/models.py:35`), nie kopiowany. Wyjątek: krótkie fragmenty, do 10 linii, gdy są niezbędne.

### `changelog.md`

Wpis na każdy zmergowany PR:

```markdown
## 2026-10-28 · #13 Add simple form to test db connection
- Autor: … · Branch: feat/enable-form · Kamień milowy: Spotkanie 2
- Co: <1–3 zdania, co zmieniło się w działaniu aplikacji>
- Pliki: frontend/src/app/users.service.ts, …
- Strony wiki: [entities/users](entities/users.md)
```

Kamień milowy jest przypisywany według dat spotkań z `milestones.md`. Gdy daty nie są znane, pole przyjmuje wartość `?` i powstaje pytanie do analityka.

### `log.md`

Dziennik w formacie, który łatwo przeszukać grepem:

```markdown
## [2026-11-07] ingest | prs #1–#13
- Nowe: changelog (13 wpisów), architecture/ci-cd.md
- Zmienione: entities/users.md
- Pytania: +Q-004
```

Na końcu pliku jest blok stanu, który skill czyta przed każdym ingestem:

```markdown
<!-- ingest-state
last_pr: 13
last_miro_snapshot: 2026-11-07
last_code_sha: 933b1a7
next_question_id: 6
-->
```

### `questions.md`

```markdown
## Q-001 · model danych · otwarte
Użytkownik ma mieć cele dzienne (kcal, białko, tłuszcze, węgle), jak w Miro, czy liczymy je z wagi, wzrostu i aktywności, jak sugeruje kod?
- Kontekst: Miro opisuje `daily_*_target`, a `backend/models.py` ma `weight_kg`, `height_cm`, `activity`, `sex`, `bmi` i nie ma celów.
- Źródła: raw/miro/2026-11-07-board.md, backend/models.py
- Dotyczy: [entities/users](entities/users.md)
- Miro: <ID karteczki>
- Odpowiedź: —
```

Statusy: `otwarte` → `odpowiedziane` (jest odpowiedź, nie wpisano jej jeszcze do wiki) → `zamknięte` (odpowiedź wpisana do stron, link do strony lub decyzji).

## Synchronizacja pytań z Miro

- Na tablicy CaloByte jest jedna ramka „Pytania do analityka” z trzema kolumnami: **Otwarte** (żółte karteczki), **Odpowiedziane** (zielone) i **Zamknięte w wiki** (szare). Skill tworzy ramkę przy pierwszym użyciu, jeśli jej nie ma.
- Każda karteczka zaczyna się od `Q-NNN · <tag>`. Skill dopasowuje karteczki do pytań po ID, a nie po pozycji czy treści.
- Analityk dopisuje odpowiedź na karteczce (po linii `Odp.:`) albo w komentarzu i przesuwa ją do kolumny „Odpowiedziane”.
- `ingest miro` czyta ramkę. Nowa odpowiedź trafia do `questions.md` (status `odpowiedziane`), a następnie do właściwych stron lub nowej decyzji (status `zamknięte`). Karteczka zostaje przeniesiona do kolumny „Zamknięte w wiki”, zmienia kolor na szary i dostaje ścieżkę strony.
- **Źródło prawdy:** `questions.md`. Miro jest widokiem i kanałem odpowiedzi. Przy konflikcie statusu wygrywa nowsza odpowiedź analityka, a `log.md` zapisuje, skąd ją wzięto.
- Ramka z pytaniami nie jest ingestowana jako treść projektu. Skill pomija ją przy budowaniu stron z opisu tablicy.

## Operacje skilla `/wiki`

Skill w `.claude/skills/wiki/SKILL.md`, wywoływany jako `/wiki <operacja> [źródło]`. Każda operacja pracuje na nowym branchu `wiki/<data>-<operacja>` i kończy się commitem. Push i PR robi się tylko po potwierdzeniu użytkownika.

### `ingest prs`
1. Czyta `last_pr` z `log.md`.
2. `gh pr list --state merged --json number,title,author,mergedAt,body,headRefName,files,commits,reviews` dla PR-ów o numerze > `last_pr`.
3. Zapisuje każdy PR do `raw/github/prs/PR-NNNN.md`.
4. Dopisuje wpisy do `changelog.md` i aktualizuje strony, których dotyczą zmienione pliki, łącznie z `code_sha`.
5. Dopisuje wpis do `log.md` i aktualizuje stan.

### `ingest miro`
1. Czyta całą tablicę (`canvas_search` overview → `canvas_read_as_svg`) i zapisuje tekst do `raw/miro/YYYY-MM-DD-board.md`.
2. Porównuje z poprzednim zrzutem i aktualizuje strony tylko tam, gdzie treść się zmieniła.
3. Synchronizuje ramkę pytań (patrz wyżej).
4. Dopisuje wpis do `log.md`.

### `ingest code`
1. Dla stron z `code_sha` ≠ HEAD sprawdza `git diff <code_sha>..HEAD -- <pliki ze sources>`.
2. Aktualizuje sekcje „Stan w kodzie” i „Rozbieżności”, a potem `code_sha`.

### `ingest all`
Kolejno: `prs`, `miro`, `code`, potem `lint`.

### `lint`
Szuka:
- rozbieżności Miro ↔ kod ↔ wiki,
- stron, do których nie prowadzi żaden link, i stron brakujących w `index.md`,
- nieaktualnych `code_sha`,
- pytań `odpowiedziane` niewpisanych do stron.

Każda nowa niewiadoma staje się pytaniem `Q-NNN` w `questions.md` i karteczką w Miro. Przed utworzeniem skill sprawdza, czy podobne pytanie już nie istnieje.

### Query
Bez osobnej komendy. `wiki/CLAUDE.md` mówi Claude: przy pytaniach o projekt zacznij od `wiki/index.md`, a potem sprawdź w kodzie, jeśli strona ma nieaktualny `code_sha`. Wartościowe odpowiedzi można zapisać jako nową stronę.

## Obsługa błędów

- **Connector Miro niedostępny lub brak uprawnień:** `ingest miro` przerywa się bez zapisywania czegokolwiek i mówi, jak ponownie połączyć connector. Pozostałe ingesty działają.
- **`gh` niezalogowany lub brak dostępu do repo:** `ingest prs` przerywa się z instrukcją `gh auth login`.
- **Brak lub uszkodzony blok `ingest-state`:** skill odtwarza stan z `raw/` (najwyższy numer PR-a, najnowszy zrzut Miro) i zapisuje to w `log.md`.
- **Brudne drzewo robocze:** skill nie zaczyna, dopóki użytkownik nie zdecyduje, co zrobić ze zmianami.

## Pierwszy ingest (bootstrap)

`/wiki ingest all` na czystym repo: tablica Miro + PR-y #1–#13 + obecny kod. Spodziewane pytania startowe:

1. Cele dzienne w `users` (Miro) kontra pola antropometryczne w kodzie.
2. Wybór LLM: Gemini czy OpenAI, budżet i limity.
3. Pusta karteczka „UI”: czy są makiety widoków?
4. Które repo jest główne: `pwjtd/CaloByte` (link w Miro) czy `wlabedz/CaloByte` (PR-y)?
5. Docelowa struktura backendu (`backend/app/api/...` w Miro) kontra obecna płaska.
6. Daty spotkań 1–5 oraz brakujący plan Spotkań 4–5 w Miro.

## Weryfikacja

- Po bootstrapie: każda strona jest w `index.md`, każdy PR #1–#13 ma wpis w `changelog.md`, `lint` nie zgłasza osieroconych stron.
- Ramka w Miro zawiera tyle karteczek, ile pytań jest w `questions.md`, z tymi samymi ID.
- Test idempotencji: drugi `/wiki ingest prs` bez nowych PR-ów nie zmienia żadnego pliku poza wpisem w `log.md`.
- Test pętli odpowiedzi: ręczna odpowiedź na karteczce testowej + `ingest miro` → pytanie ma status `zamknięte`, a strona zawiera odpowiedź.
