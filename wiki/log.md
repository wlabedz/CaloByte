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

<!-- ingest-state
last_pr: 13
last_miro_snapshot: 2026-11-07
last_code_sha: 933b1a7
next_question_id: 1
-->
