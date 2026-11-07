# Schemat wiki CaloByte

Ta wiki jest utrzymywana przez Claude według wzorca LLM Wiki (Karpathy): surowe źródła w `raw/` → strony w `wiki/` → zasady w tym pliku. Czytają ją zespół i Claude. Operacje uruchamia skill `/wiki` (`.claude/skills/wiki/SKILL.md`). Projekt: `docs/superpowers/specs/2026-11-07-llm-wiki-design.md`.

## Query — jak odpowiadać na pytania o projekt

1. Zacznij od [index.md](index.md) i przeczytaj pasujące strony.
2. Jeśli `git diff --quiet <code_sha> HEAD -- <pliki z sources>` pokazuje zmiany, sprawdź wskazane w `sources` pliki w kodzie, zanim na niej polegniesz.
3. Odpowiedź, która syntetyzuje kilka stron i warto ją zachować, zaproponuj jako nową stronę.
4. Niewiadomą, której nie rozstrzygają ani wiki, ani kod, zgłoś jako pytanie do analityka (`/wiki lint`).

## Struktura

```
raw/                          # niezmienne źródła, tylko dopisujemy
  miro/YYYY-MM-DD-board.md    # zrzut tekstu tablicy Miro
  github/prs/PR-NNNN.md       # PR: tytuł, autor, daty, opis, commity, pliki, review
wiki/
  CLAUDE.md                   # ten plik
  index.md                    # spis stron (każda + jedno zdanie)
  log.md                      # dziennik operacji + blok ingest-state
  overview.md · team.md · milestones.md
  entities/                   # users, meals, meal_items
  architecture/               # backend, frontend, database, ci-cd
  decisions/NNNN-<slug>.md    # decyzje
  changelog.md                # jeden wpis na zmergowany PR
  questions.md                # pytania do analityka
```

## Konwencje stron

- Język polski. Nazwy plików, kod i identyfikatory zostają w oryginale.
- Każda strona poza `index.md`, `log.md`, `changelog.md`, `questions.md` i tym plikiem zaczyna się frontmatterem:
  ```yaml
  ---
  title: Encja users
  sources: [raw/miro/2026-11-07-board.md, backend/models.py]
  code_sha: 933b1a7      # tylko strony o kodzie: commit, przy którym strona była zgodna z kodem
  updated: 2026-11-07
  ---
  ```
- Strony encji i architektury mają sekcje `## Plan (Miro)`, `## Stan w kodzie`, `## Rozbieżności`. Każda rozbieżność linkuje pytanie, np. [Q-001](questions.md#q-001), jeśli takie istnieje.
- Kod linkujemy (`backend/models.py:35`), a nie kopiujemy. Krótki fragment, do 10 linii, wolno wkleić tylko wtedy, gdy jest niezbędny.
- Linki między stronami są względne, w formacie markdown.
- Pytań (`Q-NNN`) nie traktujemy jako wymagań projektu. Na stronach pojawiają się tylko jako linki w „Rozbieżnościach” albo jako źródło zamkniętej odpowiedzi.

## Wzorce wpisów

### changelog.md

```markdown
## 2026-10-28 · #13 Add simple form to test db connection
- Autor: … · Branch: feat/enable-form · Kamień milowy: Spotkanie 2
- Co: <1–3 zdania, co zmieniło się w działaniu aplikacji>
- Pliki: frontend/src/app/users.service.ts, …
- Strony wiki: [entities/users](entities/users.md)
```

Najnowsze wpisy na górze. Kamień milowy jest przypisywany według dat w [milestones.md](milestones.md). Gdy daty nie są znane, wpisz `?`.

### log.md

```markdown
## [2026-11-07] ingest | prs #1–#13
- Nowe: changelog (13 wpisów), architecture/ci-cd.md
- Zmienione: entities/users.md
- Pytania: +Q-004
```

Najnowsze wpisy na dole, nad blokiem `ingest-state`, który zawsze kończy plik:

```
<!-- ingest-state
last_pr: 13
last_miro_snapshot: 2026-11-07
last_code_sha: 933b1a7
next_question_id: 6
-->
```

### questions.md

```markdown
<a id="q-001"></a>
## Q-001 · model danych · otwarte
<pytanie w jednym–dwóch zdaniach>
- Kontekst: <co się nie zgadza / czego brakuje>
- Źródła: raw/miro/2026-11-07-board.md, backend/models.py
- Dotyczy: [entities/users](entities/users.md)
- Miro: <ID karteczki>
- Odpowiedź: —
```

Statusy: `otwarte` → `odpowiedziane` (jest odpowiedź, jeszcze nie wpisana do stron) → `zamknięte` (wpisana; w polu `Odpowiedź` link do strony lub decyzji). Źródłem prawdy jest `questions.md`.

## Miro

- Tablica: https://miro.com/app/board/uXjVEWYP5RY=/
- Ramka pytań: „Pytania do analityka”, kolumny „Otwarte” (żółte), „Odpowiedziane” (zielone), „Zamknięte w wiki” (szare). ID ramki: `3458764689732114821` (x 7600, y −65, 2400×1800); kolumny: Otwarte `3458764689732114849` (x 64), Odpowiedziane `3458764689732114851` (x 832), Zamknięte w wiki `3458764689732114852` (x 1600), wszystkie y 200, 736×1536 (współrzędne względem ramki); instrukcja `3458764689732114848`.
- Karteczka zaczyna się od `Q-NNN · <tag>`, odpowiedź analityka jest po linii `Odp.:` albo w komentarzu.

## Operacje

`/wiki ingest prs|miro|code|all` oraz `/wiki lint`. Szczegóły są w skillu.
