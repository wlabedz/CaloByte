---
title: "0001: Neon Postgres + NullPool + Alembic"
sources: [raw/miro/2026-11-07-board.md, raw/github/prs/PR-0010.md, raw/github/prs/PR-0011.md, backend/db.py]
code_sha: 933b1a7
updated: 2026-11-07
---

# 0001: Neon Postgres + NullPool + Alembic

**Status:** przyjęta (Miro + PR #10, #11).

**Decyzja:** baza to Neon Postgres z Vercel Storage (plan Free: 1 GB, auto-suspend po 5 min). Aplikacja łączy się przez URL z poolerem (`DATABASE_URL`) i `NullPool`. Migracje Alembic idą przez URL bez poolera (`DATABASE_URL_UNPOOLED`) i są uruchamiane w CD przed deployem.

**Dlaczego:** backend działa jako funkcja serverless, więc każda instancja żyje krótko i własna pula połączeń by się nie sprawdziła. Pulą zarządza pooler Neona. DDL i migracje nie powinny iść przez pooler w trybie transakcyjnym.

**Konsekwencje:**
- Pierwszy request po 5 min bezczynności budzi bazę, więc trwa dłużej (cold start Neona).
- Migracje wchodzą przed nowym kodem, więc muszą być kompatybilne wstecz ze starą wersją API ([ci-cd](../architecture/ci-cd.md)).

Szczegóły: [architecture/database](../architecture/database.md).
