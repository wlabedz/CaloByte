---
name: wiki
description: Utrzymanie wiki projektu CaloByte (wiki/ + raw/) — ingest tablicy Miro, zmergowanych PR-ów i kodu, lint wiki oraz synchronizacja pytań do analityka z ramką w Miro. Używaj przy /wiki, prośbach o aktualizację wiki, changelogu albo pytań do analityka.
---

# /wiki — wiki CaloByte

Schemat i konwencje stron są w `wiki/CLAUDE.md`. Przeczytaj go przed każdą operacją, bo tam są wzorce wpisów `changelog.md`, `log.md` i `questions.md`. Projekt: `docs/superpowers/specs/2026-11-07-llm-wiki-design.md`.

## Użycie

```
/wiki ingest prs    # nowe zmergowane PR-y → raw/github/prs/, changelog, strony
/wiki ingest miro   # zrzut tablicy → raw/miro/, strony, synchronizacja pytań
/wiki ingest code   # aktualizacja stron, których code_sha ≠ HEAD
/wiki ingest all    # prs → miro → code → lint
/wiki lint          # sprzeczności, sieroty, nieaktualne SHA → pytania Q-NNN
```

Bez argumentu albo z nieznanym argumentem: wypisz tę listę i zakończ. Nie twórz brancha i nie zmieniaj plików.

## Stałe

- Repo PR-ów: `wlabedz/CaloByte`
- Tablica: `https://miro.com/app/board/uXjVEWYP5RY=/`
- Ramka pytań: tytuł `Pytania do analityka`; jej `data-miro-id` jest w sekcji „Miro” w `wiki/CLAUDE.md`

## Każda operacja: początek

1. `git status --porcelain` (pomiń `.DS_Store`). Jeśli drzewo jest brudne, zatrzymaj się i zapytaj użytkownika, co zrobić ze zmianami.
2. Branch: jeśli bieżący branch zaczyna się od `wiki/`, zostań na nim. W przeciwnym razie `git switch -c wiki/<YYYY-MM-DD>-<operacja>` (np. `wiki/2026-11-07-ingest-prs`).
3. Wczytaj blok `<!-- ingest-state ... -->` z końca `wiki/log.md`. Jeśli go nie ma albo nie da się go sparsować, odtwórz stan (patrz „Odtwarzanie stanu”).

## Każda operacja: koniec

4. Dopisz wpis do `wiki/log.md` nad blokiem stanu (format `## [YYYY-MM-DD] <operacja> | <zakres>` + listy Nowe/Zmienione/Pytania/Ostrzeżenia) i zaktualizuj blok stanu.
5. Każdą nową stronę dopisz do `wiki/index.md` we właściwej sekcji, jako link z jednym zdaniem opisu.
6. `git add wiki raw && git commit -m "docs(wiki): <operacja> <zakres>"`.
7. Zapytaj użytkownika, czy zrobić push i otworzyć PR. Bez zgody nie rób ani jednego, ani drugiego.

Jeśli operacja nic nie zmieniła poza `log.md`, wpis w logu brzmi `bez zmian`, a commit i tak powstaje.

## ingest prs

1. `gh auth status`. Jeśli nie jesteś zalogowany, zatrzymaj się i podaj instrukcję `gh auth login`. Nic nie zapisuj.
2. `gh pr list --repo wlabedz/CaloByte --state merged --limit 200 --json number,title,author,mergedAt,body,headRefName,files,commits,reviews`. Weź PR-y z `number > last_pr`, rosnąco.
3. Każdy PR zapisz do `raw/github/prs/PR-NNNN.md` (numer dopełniony do 4 cyfr): nagłówek z tytułem, potem autor, `mergedAt`, branch, opis (body), lista commitów (`oid` 7 znaków + nagłówek), lista plików z `+/-`, review (autor, stan, treść).
4. W `wiki/changelog.md` dodaj wpis na górze, według wzorca. Pole „Co” opisuje zmianę w działaniu aplikacji, nie listę plików. Kamień milowy przypisz według `wiki/milestones.md`; jeśli brak dat, wpisz `?`. Jeśli wpis z tym numerem `#N` już istnieje, nie dodawaj go ponownie.
5. Zaktualizuj albo utwórz strony, których dotyczą zmienione pliki: `backend/*` → `architecture/backend.md`, `backend/migrations/*`, `db.py`, `models.py` → `architecture/database.md` i `entities/*`, `frontend/*` → `architecture/frontend.md`, `.github/workflows/*` → `architecture/ci-cd.md`. Ustaw `code_sha` na merge commit najnowszego PR-a (`git rev-parse --short` dla `mergeCommit`, a gdy go brak, `git rev-parse --short HEAD`).
6. Stan: `last_pr` = najwyższy przetworzony numer.

## ingest miro

1. `canvas_search` (`result_mode: overview`) na tablicy. Jeśli narzędzie nie działa lub zwraca błąd uprawnień, zatrzymaj się bez zapisu. Napisz użytkownikowi, że connector Miro trzeba połączyć ponownie w ustawieniach connectorów aplikacji.
2. `canvas_read_as_svg` na zakresie z overview (cały region). Zapisz do `raw/miro/<YYYY-MM-DD>-board.md`: jedna sekcja `### <typ> <data-miro-id> (x, y)` na widget, treść bez tagów HTML. Widgety leżące w ramce „Pytania do analityka” zapisz w osobnej sekcji `## Ramka pytań` na końcu pliku.
   - Jeśli plik z dzisiejszą datą istnieje i treść jest identyczna, nie nadpisuj go.
   - Jeśli treść jest inna, nadpisz go: to nadal ten sam dzień.
3. Porównaj z poprzednim zrzutem, czyli najnowszym innym plikiem w `raw/miro/`. Aktualizuj tylko strony, których dotyczy zmieniona treść: opis i stos → `overview.md`, podział ról → `team.md`, plan spotkań → `milestones.md`, model danych → `entities/*` (sekcja „Plan (Miro)”), architektura i stos → `architecture/*`, linki i datasety → `overview.md` (sekcja „Zasoby”). Sekcji `## Ramka pytań` nigdy nie używaj jako treści projektu.
4. Synchronizacja pytań (patrz niżej).
5. Stan: `last_miro_snapshot` = dzisiejsza data.

## ingest code

1. `HEAD=$(git rev-parse --short HEAD)`. Znajdź strony z `code_sha` ≠ HEAD.
2. Dla każdej: `git diff <code_sha>..HEAD -- <pliki z sources, które nie są w raw/>`. Jeśli diff jest pusty, ustaw tylko `code_sha`. W przeciwnym razie przeczytaj zmienione pliki i zaktualizuj „Stan w kodzie” oraz „Rozbieżności”.
3. Strony encji muszą odzwierciedlać `backend/models.py` i migracje w `backend/migrations/versions/`. Jeśli encja z Miro nie ma tabeli, napisz to wprost w „Stan w kodzie”.
4. Stan: `last_code_sha` = HEAD.

## lint

Sprawdź i zgłoś w `log.md`:

1. **Rozbieżności** Miro ↔ kod ↔ wiki: porównaj „Plan (Miro)” ze „Stanem w kodzie” na każdej stronie encji i architektury.
2. **Sieroty**: strony bez linku przychodzącego i strony nieobecne w `index.md`. Napraw je, dodając wpisy do indeksu.
3. **Nieaktualne SHA**: `code_sha` ≠ HEAD. Zaproponuj `ingest code`.
4. **Niewpisane odpowiedzi**: pytania o statusie `odpowiedziane`. Wpisz odpowiedź do stron i zmień status na `zamknięte`.

Każda niewiadoma z punktu 1, której nie rozstrzyga ani kod, ani wiki, staje się pytaniem:

- **Deduplikacja:** zanim dodasz pytanie, przeszukaj `questions.md` pod kątem tego samego pliku, pola lub tematu w „Kontekście”. Jeśli takie pytanie istnieje (w dowolnym statusie), nie dodawaj nowego; ewentualnie uzupełnij kontekst istniejącego.
- Nowe pytanie ma ID `Q-<next_question_id dopełnione do 3 cyfr>` i trafia na koniec `questions.md` według wzorca. Dopisz link do niego w sekcji „Rozbieżności” strony, której dotyczy. Zwiększ `next_question_id`.
- Utwórz dla niego karteczkę w Miro (patrz niżej).

## Synchronizacja pytań z Miro

### Ramka

Jeśli w `wiki/CLAUDE.md` brakuje ID ramki, albo `canvas_search` (`matches`, wzorzec `Pytania do analityka`) jej nie znajduje, utwórz ją przez `canvas_create_from_svg`. Przedtem przeczytaj `canvas_get_canvas_composer_skill` (kroki `design`, potem `dsl`). Postaw ramkę na wolnym miejscu po prawej stronie istniejącej treści: sprawdź `canvas_search` overview i zostaw 320 px odstępu. Układ:

```xml
<svg>
<g id="qf" transform="translate(X,Y)" data-frame="Pytania do analityka">
  <rect data-type="frame" x="0" y="0" width="2400" height="1800" fill="#ffffff" data-title="Pytania do analityka" />
  <textArea x="64" y="64" width="2272" font-family="noto_sans" font-size="33" fill="#595959">Dopisz odpowiedź na karteczce po linii Odp.: albo w komentarzu i przesuń karteczkę do kolumny Odpowiedziane. Źródło prawdy: wiki/questions.md w repo.</textArea>
  <rect x="64"   y="200" width="736" height="1536" fill="#fffbed" stroke="none" data-content="&lt;b&gt;Otwarte&lt;/b&gt;" data-text-align="left" data-text-align-vertical="top" data-font-size="33" data-text-color="#1a1a1a" />
  <rect x="832"  y="200" width="736" height="1536" fill="#eaf9ef" stroke="none" data-content="&lt;b&gt;Odpowiedziane&lt;/b&gt;" data-text-align="left" data-text-align-vertical="top" data-font-size="33" data-text-color="#1a1a1a" />
  <rect x="1600" y="200" width="736" height="1536" fill="#f7f7f7" stroke="none" data-content="&lt;b&gt;Zamknięte w wiki&lt;/b&gt;" data-text-align="left" data-text-align-vertical="top" data-font-size="33" data-text-color="#1a1a1a" />
</g>
</svg>
```

Po utworzeniu zapisz w `wiki/CLAUDE.md` (sekcja „Miro”) `data-miro-id` ramki i trzech kolumn z `result_svg`.

### Karteczki

- **Treść:** `<b>Q-NNN · tag</b><br>pytanie skrócone do 1–2 zdań<br>Odp.:`. Kolory: `light_yellow` w kolumnie Otwarte, `light_green` w Odpowiedzianych, `gray` w Zamkniętych w wiki. Rozmiar 199x228; układ w kolumnie po 3 w rzędzie (x = kolumna + 32 + i·231, y = 280 + rząd·260, współrzędne względem ramki).
- **Dopasowanie:** po regexie `^Q-\d{3}` na początku tekstu karteczki, nigdy po pozycji ani treści. ID karteczki zapisz w polu `Miro:` pytania.
- **Karteczka bez ID w ramce:** nie zmieniaj jej, a w `log.md` zapisz ostrzeżenie `karteczka bez ID: <data-miro-id> „<pierwsze słowa>”`.
- **Odpowiedź:** tekst po `Odp.:` na karteczce (jeśli niepusty) albo komentarze na tej karteczce (`comment_list_comments` z `miro_url` zawierającym `?moveToWidget=<id karteczki>`). Gdy jest nowa odpowiedź, a pytanie jest `otwarte`, ustaw `odpowiedziane`, wpisz odpowiedź w pole `Odpowiedź` i zaznacz źródło (karteczka / komentarz + autor).
- **Zamknięcie:** wpisz odpowiedź do stron albo do nowej decyzji `wiki/decisions/NNNN-<slug>.md` i ustaw `zamknięte`, z linkiem do strony w polu `Odpowiedź`. Potem przez `canvas_update_from_svg` przenieś karteczkę do kolumny „Zamknięte w wiki”, nadaj kolor `gray` i dopisz w treści ścieżkę strony.
- **Konflikt:** gdy status w Miro różni się od `questions.md`, wygrywa nowsza odpowiedź analityka. W `log.md` zapisz, skąd ją wzięto.
- **Nigdy nie usuwaj karteczek** bez wyraźnej zgody użytkownika.

## Odtwarzanie stanu

Gdy brak bloku `ingest-state`:

- `last_pr` = najwyższe `NNNN` w `raw/github/prs/PR-*.md` (0, gdy brak plików),
- `last_miro_snapshot` = najnowsza data w `raw/miro/*-board.md` (`none`, gdy brak),
- `last_code_sha` = najstarszy `code_sha` ze stron (`none`, gdy brak),
- `next_question_id` = najwyższe `Q-NNN` w `questions.md` + 1.

Wpisz go na końcu `log.md` i dodaj wpis `stan odtworzony z raw/`.
