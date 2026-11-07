# Dziennik wiki

Wpisy operacji `/wiki` od najstarszych. Blok `ingest-state` na końcu czyta skill.

## [2026-11-07] ingest | prs #1–#13
- Nowe: raw/github/prs/PR-0001…PR-0013, changelog (13 wpisów), architecture/ci-cd.md, architecture/database.md
- Uwagi: `gh pr list --limit 200` przekracza limit GraphQL przy polach files/commits/reviews, używamy `--limit 30`. Daty spotkań nieznane, więc kamień milowy = `?`.

## [2026-11-07] ingest | prs (powtórka)
- bez zmian

## [2026-11-07] ingest | miro
- Nowe: raw/miro/2026-11-07-board.md, overview.md, team.md, milestones.md, entities/users.md, entities/meals.md, entities/meal_items.md, architecture/backend.md, architecture/frontend.md, decisions/0001-neon-postgres.md
- Zmienione: architecture/database.md, architecture/ci-cd.md (sekcje Plan (Miro)), CLAUDE.md (ID ramki)
- Miro: utworzona ramka „Pytania do analityka” (3458764689732114821)
- Ostrzeżenia: overview tablicy liczy 1 element typu document, którego `canvas_read_as_svg` nie zwrócił; obraz 3458764688290762075 bez opisu tekstowego.

## [2026-11-07] ingest | miro (powtórka)
- bez zmian w treści projektu; ramka pytań już istnieje (1 trafienie), zrzut uzupełniony o sekcję Ramka pytań

## [2026-11-07] ingest | code
- Wszystkie strony z `code_sha` zgodne z kodem (diff 933b1a7..7217418 w `sources` pusty), bez zmian w treści.
- Reguła nieaktualności zmieniona z „`code_sha` ≠ HEAD” na „diff w `sources` niepusty” (commity samej wiki nie liczą się).
- milestones.md: usunięty `code_sha`, bo `sources` nie zawierają plików kodu.

## [2026-11-07] lint
- Pytania: +Q-001…Q-008 (8 karteczek w ramce Miro, kolumna Otwarte)
- Sieroty: brak (wszystkie strony w index.md).
- Do zespołu (nie do analityka): `deploy-backend.yml` na Pythonie 3.12 przy 3.13 w CI i w Miro; zdublowane kroki checkout/setup-node; brak review w 13 PR-ach; SSR i hydracja przy statycznym hostingu; brak `withHashLocation()`; brak `AI.md`.
- Uwaga: kotwice linków `#q-nnn--tag--status` zawierają status, więc po zmianie statusu trzeba je zaktualizować.

## [2026-11-07] lint (powtórka)
- bez nowych pytań: każda rozbieżność ma już pytanie Q-001…Q-008; w Miro nadal 8 karteczek

## [2026-11-07] poprawki po review
- Skill: idempotentny ingest code, rekoncyliacja pytań i karteczek, ingest all przy niedostępnym Miro, dopasowanie ID po usunięciu HTML, porównanie zrzutów po (ID, treść), kotwice pytań bez statusu.
- Strony: changelog #10/#13 (NullPool), ci-cd, database, milestones, decyzja 0001 (uzasadnienie oznaczone jako wniosek), zrzut Miro (sekcja ramki z 8 karteczkami).

## [2026-11-07] ingest | miro (test pętli odpowiedzi)
- Rekoncyliacja: 8 karteczek z ID = 8 pytań.
- Pytania: Q-004 otwarte → odpowiedziane → zamknięte (odpowiedź testowa z karteczki: „wlabedz/CaloByte jest główne”), wpisane do overview.md (Zasoby); karteczka przeniesiona do kolumny Zamknięte w wiki, kolor gray.
- Ostrzeżenia: karteczka bez ID: 3458764689733277794 „test bez id” (karteczka testowa, usunięta po teście).
- Do zrobienia na tablicy: karteczka GitHub nadal linkuje pwjtd/CaloByte.

<!-- ingest-state
last_pr: 13
last_miro_snapshot: 2026-11-07
last_code_sha: 7217418
next_question_id: 9
-->
