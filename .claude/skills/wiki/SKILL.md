---
name: wiki
description: Utrzymanie wiki projektu CaloByte (wiki/ + raw/) — ingest tablicy Miro, zmergowanych PR-ów i kodu, lint wiki oraz synchronizacja pytań do analityka z ramką w Miro. Używaj przy /wiki, prośbach o aktualizację wiki, changelogu albo pytań do analityka.
---

# /wiki — wiki CaloByte

Schemat i konwencje stron są w `wiki/CLAUDE.md`. Przeczytaj go przed każdą operacją, bo tam są wzorce wpisów `changelog.md`, `log.md` i `questions.md`.

## Użycie

```
/wiki ingest prs    # nowe zmergowane PR-y → raw/github/prs/, changelog, strony
/wiki ingest miro   # zrzut tablicy → raw/miro/, strony, synchronizacja pytań
/wiki ingest code   # aktualizacja stron, których kod w sources zmienił się od code_sha
/wiki ingest all    # prs → miro → code → lint (przy błędzie Miro: kontynuuj bez miro, a lint bez zapisu w Miro)
/wiki lint          # sprzeczności, sieroty, nieaktualne SHA → pytania Q-NNN
```

Bez argumentu albo z nieznanym argumentem: wypisz tę listę i zakończ. Nie twórz brancha i nie zmieniaj plików.

## Stałe

- Repo PR-ów: `wlabedz/CaloByte`
- Tablica: `https://miro.com/app/board/uXjVEWYP5RY=/`
- Ramka pytań: tytuł `Pytania do analityka`; jej `data-miro-id` jest w sekcji „Miro” w `wiki/CLAUDE.md`

## Każda operacja: początek

1. `git status --porcelain` (pomiń `.DS_Store`). Jeśli drzewo jest brudne, zatrzymaj się i zapytaj użytkownika, co zrobić ze zmianami.
2. Sprawdź dostęp do źródeł operacji (`gh auth status` dla prs, `canvas_search` overview dla miro) **przed** utworzeniem brancha.
3. Branch: jeśli bieżący branch zaczyna się od `wiki/`, zostań na nim. W przeciwnym razie `git switch -c wiki/<YYYY-MM-DD>-<operacja>` (np. `wiki/2026-11-07-ingest-prs`).
4. Wczytaj blok `<!-- ingest-state ... -->` z końca `wiki/log.md`. Jeśli go nie ma albo nie da się go sparsować, odtwórz stan (patrz „Odtwarzanie stanu”).

## Każda operacja: koniec

5. Dopisz wpis do `wiki/log.md` nad blokiem stanu (format `## [YYYY-MM-DD] <operacja> | <zakres>` + listy Nowe/Zmienione/Pytania/Ostrzeżenia) i zaktualizuj blok stanu.
6. Każdą nową stronę dopisz do `wiki/index.md` we właściwej sekcji, jako link z jednym zdaniem opisu.
7. Pokaż podsumowanie zmian (`git status`, lista stron) i zapytaj, czy zacommitować. Commituj (`git add wiki raw && git commit -m "docs(wiki): <operacja> <zakres>"`) dopiero po wyraźnej prośbie.
8. Push i PR tylko na wyraźną prośbę użytkownika.

Jeśli operacja nic nie zmieniła poza `log.md`, wpis w logu brzmi `bez zmian`.

## ingest prs

1. `gh auth status`. Jeśli nie jesteś zalogowany, zatrzymaj się i podaj instrukcję `gh auth login`. Nic nie zapisuj.
2. `gh pr list --repo wlabedz/CaloByte --state merged --limit 30 --json number,title,author,mergedAt,body,headRefName,files,commits,reviews,mergeCommit`. Weź PR-y z `number > last_pr`, rosnąco. Jeśli wszystkie 30 zwróconych mają `number > last_pr`, pobierz kolejne strony przez `gh api` / `--search "merged:<data>"`, aż trafisz na `last_pr`; nie pomijaj PR-ów po cichu.
3. Każdy PR zapisz do `raw/github/prs/PR-NNNN.md` (numer dopełniony do 4 cyfr): nagłówek z tytułem, potem autor, `mergedAt`, branch, opis (body), lista commitów (`oid` 7 znaków + nagłówek), lista plików z `+/-`, review (autor, stan, treść).
4. W `wiki/changelog.md` dodaj wpis na górze, według wzorca. Pole „Co” opisuje zmianę w działaniu aplikacji, nie listę plików. Kamień milowy przypisz według `wiki/milestones.md`; jeśli brak dat, wpisz `?`. Jeśli wpis z tym numerem `#N` już istnieje, nie dodawaj go ponownie.
5. Zaktualizuj albo utwórz strony, których dotyczą zmienione pliki: `backend/*` → `architecture/backend.md`, `backend/migrations/*`, `db.py`, `models.py` → `architecture/database.md` i `entities/*`, `frontend/*` → `architecture/frontend.md`, `.github/workflows/*` → `architecture/ci-cd.md`. Ustaw `code_sha` na merge commit najnowszego PR-a (`git rev-parse --short` dla `mergeCommit`, a gdy go brak, `git rev-parse --short HEAD`).
6. Stan: `last_pr` = najwyższy przetworzony numer.

## ingest miro

1. `canvas_search` (`result_mode: overview`) na tablicy. Jeśli narzędzie nie działa lub zwraca błąd uprawnień, zatrzymaj się bez zapisu (w `ingest all` pomiń tylko ten krok, zapisz ostrzeżenie w log.md i przejdź do `ingest code`). Napisz użytkownikowi, że connector Miro trzeba połączyć ponownie w ustawieniach connectorów aplikacji.
2. `canvas_read_as_svg` na zakresie z overview (cały region). Zapisz do `raw/miro/<YYYY-MM-DD>-board.md`: jedna sekcja `### <typ> <data-miro-id> (x, y)` na widget, treść bez tagów HTML. Widgety leżące w ramce „Pytania do analityka” zapisz w osobnej sekcji `## Ramka pytań` na końcu pliku.
   - W plik wpisuj tylko fakty z tablicy (ID, typ, pozycja, treść), bez własnych domysłów i bez liczników overview.
   - Porównanie z istniejącym plikiem z dzisiejszą datą robisz na poziomie par (ID widgetu, treść) w sekcjach projektu; sekcja `## Ramka pytań` nie wchodzi do porównania. Jeśli pary są te same, części projektowej nie nadpisuj.
   - Sekcję `## Ramka pytań` zawsze odśwież do aktualnego stanu ramki (ID, kolumna, pierwsza linia karteczki). Jej zmiana nie oznacza zmiany treści projektu.
3. Porównaj z poprzednim zrzutem, czyli najnowszym innym plikiem w `raw/miro/`. Aktualizuj tylko strony, których dotyczy zmieniona treść: opis i stos → `overview.md`, podział ról → `team.md`, plan spotkań → `milestones.md`, model danych → `entities/*` (sekcja „Plan (Miro)”), architektura i stos → `architecture/*`, linki i datasety → `overview.md` (sekcja „Zasoby”). Sekcji `## Ramka pytań` nigdy nie używaj jako treści projektu.
4. Synchronizacja pytań (patrz niżej).
5. Stan: `last_miro_snapshot` = dzisiejsza data.

## ingest code

1. `HEAD=$(git rev-parse --short HEAD)`. Strona jest nieaktualna, gdy `git diff --quiet <code_sha> HEAD -- <pliki z sources spoza raw/ i wiki/>` zwraca kod ≠ 0. Same commity wiki nie czynią strony nieaktualną. Strona, której `sources` po odfiltrowaniu nie zawierają plików kodu, nie powinna mieć `code_sha`; usuń go i zapisz w log.md.
2. Dla każdej: `git diff <code_sha>..HEAD -- <pliki z sources, które nie są w raw/>`. Jeśli diff jest pusty, niczego nie zmieniaj (także `code_sha`). W przeciwnym razie przeczytaj zmienione pliki, zaktualizuj „Stan w kodzie” oraz „Rozbieżności” i ustaw `code_sha` na `git log -1 --format=%h -- <pliki kodu z sources>`. Przed `ingest code` zapytaj, czy zaktualizować lokalny `main` (`git fetch`), jeśli branch jest za nim.
3. Strony encji muszą odzwierciedlać `backend/models.py` i migracje w `backend/migrations/versions/`. Jeśli encja z Miro nie ma tabeli, napisz to wprost w „Stan w kodzie”.
4. Stan: `last_code_sha` = `git log -1 --format=%h -- backend frontend .github` (ostatni commit z kodem, nie commit wiki).

## lint

Sprawdź i zgłoś w `log.md`:

1. **Rozbieżności** Miro ↔ kod ↔ wiki: porównaj „Plan (Miro)” ze „Stanem w kodzie” na każdej stronie encji i architektury.
2. **Sieroty**: strony bez linku przychodzącego i strony nieobecne w `index.md`. Napraw je, dodając wpisy do indeksu.
3. **Nieaktualne SHA**: kod w `sources` zmienił się od `code_sha` (test jak w `ingest code`). Zaproponuj `ingest code`.
4. **Niewpisane odpowiedzi**: pytania o statusie `odpowiedziane`. Wpisz odpowiedź do stron i zmień status na `zamknięte`.

Każda niewiadoma z punktu 1, której nie rozstrzyga ani kod, ani wiki, staje się pytaniem:

- **Deduplikacja:** zanim dodasz pytanie, przeszukaj `questions.md` pod kątem tego samego pliku, pola lub tematu w „Kontekście”. Jeśli takie pytanie istnieje (w dowolnym statusie), nie dodawaj nowego; ewentualnie uzupełnij kontekst istniejącego.
- Nowe pytanie ma ID `Q-<next_question_id dopełnione do 3 cyfr>` i trafia na koniec `questions.md` według wzorca. Dopisz link do niego w sekcji „Rozbieżności” strony, której dotyczy. Zwiększ `next_question_id`.
- Utwórz dla niego karteczkę w Miro (patrz niżej). Jeśli Miro jest niedostępne, zostaw `Miro: —` i zapisz ostrzeżenie; karteczkę utworzy rekoncyliacja przy następnym `ingest miro` lub `lint`.

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

### Rekoncyliacja (każdy `ingest miro` i `lint` z dostępnym Miro)

1. Odczytaj karteczki ramki i dopasuj je do `questions.md` po ID.
2. Pytanie bez karteczki (puste `Miro:` lub brak `Q-NNN` w ramce) → utwórz karteczkę w kolumnie odpowiadającej statusowi i wpisz jej ID w `Miro:`.
3. Karteczka z `Q-NNN`, którego nie ma w `questions.md` → nie twórz pytania automatycznie; zapisz ostrzeżenie w log.md i zapytaj użytkownika (ktoś mógł dodać pytanie ręcznie albo to pozostałość).
4. Liczba karteczek z ID w ramce ma się równać liczbie pytań; wynik zapisz w log.md.

### Karteczki

- **Zagnieżdżenie:** karteczki twórz i przenoś w `<g data-miro-id="<ID ramki>" transform="translate(<x ramki>,<y ramki>)" data-frame="Pytania do analityka">` z dzieckiem `<rect data-type="frame" x="0" y="0" width="2400" height="1800" />`. Zwykły `<g data-miro-id>` bez `data-frame` jest ignorowany i karteczki lądują na współrzędnych bezwzględnych. Po zapisie sprawdź `canvas_search` (matches `re:Q-\d{3}`), czy każda ma `parent` = ID ramki.
- **Treść:** `<b>Q-NNN · tag</b><br>pytanie skrócone do 1–2 zdań<br>Odp.:`. Kolory: `light_yellow` w kolumnie Otwarte, `light_green` w Odpowiedzianych, `gray` w Zamkniętych w wiki. Rozmiar 199x228; układ w kolumnie po 3 w rzędzie (x = kolumna + 32 + i·231, y = 280 + rząd·260, współrzędne względem ramki).
- **Dopasowanie:** po regexie `^Q-\d{3}` na początku tekstu karteczki **po usunięciu tagów HTML i białych znaków z początku** (treść zaczyna się od `<b>Q-…`), nigdy po pozycji ani treści. ID karteczki zapisz w polu `Miro:` pytania.
- **Karteczka bez ID w ramce:** nie zmieniaj jej, a w `log.md` zapisz ostrzeżenie `karteczka bez ID: <data-miro-id> „<pierwsze słowa>”`.
- **Odpowiedź:** tekst po `Odp.:` na karteczce (jeśli niepusty) albo komentarze na tej karteczce (`comment_list_comments` z `miro_url` zawierającym `?moveToWidget=<id karteczki>`). Gdy jest nowa odpowiedź, a pytanie jest `otwarte`, ustaw `odpowiedziane`, wpisz odpowiedź w pole `Odpowiedź` i zaznacz źródło (karteczka / komentarz + autor).
- **Linki do pytań:** zawsze w formie `questions.md#q-nnn` (kotwica `<a id="q-nnn"></a>` nad nagłówkiem pytania), nigdy przez kotwicę z nagłówka, bo ta zawiera status.
- **Zamknięcie:** wpisz odpowiedź do stron albo do nowej decyzji `wiki/decisions/NNNN-<slug>.md` i ustaw `zamknięte`, z linkiem do strony w polu `Odpowiedź`. Potem przez `canvas_update_from_svg` przenieś karteczkę do kolumny „Zamknięte w wiki”, nadaj kolor `gray` i dopisz w treści ścieżkę strony.
- **Konflikt:** gdy status w Miro różni się od `questions.md`, wygrywa nowsza odpowiedź analityka. W `log.md` zapisz, skąd ją wzięto.
- **Nigdy nie usuwaj karteczek** bez wyraźnej zgody użytkownika.

## Odtwarzanie stanu

Gdy brak bloku `ingest-state` albo nie da się go sparsować (najpierw usuń uszkodzony blok, żeby nie powstały dwa):

- `last_pr` = najwyższe `NNNN` w `raw/github/prs/PR-*.md` (0, gdy brak plików),
- `last_miro_snapshot` = najnowsza data w `raw/miro/*-board.md` (`none`, gdy brak),
- `last_code_sha` = najstarszy `code_sha` ze stron (`none`, gdy brak),
- `next_question_id` = najwyższe `Q-NNN` w `questions.md` + 1.

Wpisz go na końcu `log.md` i dodaj wpis `stan odtworzony z raw/`.
