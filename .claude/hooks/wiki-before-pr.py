#!/usr/bin/env python3
"""PreToolUse hook: przed `gh pr create` wymaga aktualnej wiki dla kodu z brancha.

Blokuje utworzenie PR-a, gdy branch zmienia kod, a:
- strona wiki, której `sources` obejmują zmieniony plik, ma nieaktualny `code_sha`,
- albo zmieniony plik kodu nie jest w `sources` żadnej strony.

Przy błędzie samego hooka przepuszcza (fail-open); twarde wymuszenie ma być w CI.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

CODE_PREFIXES = ("backend/", "frontend/src/", ".github/workflows/")
# Pliki kodu, które nie muszą mieć własnej strony w wiki.
IGNORED = re.compile(r"(\.spec\.ts$|\.(css|scss|html|svg|png|ico)$|/__init__\.py$|^backend/migrations/versions/)")
BASE_CANDIDATES = ("upstream/main", "origin/main", "main")


def git(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], capture_output=True, text=True)


def parse_frontmatter(text: str) -> tuple[list[str], str | None]:
    m = re.match(r"---\n(.*?)\n---", text, re.S)
    if not m:
        return [], None
    fm = m.group(1)
    src = re.search(r"^sources:\s*\[(.*?)\]", fm, re.M)
    sha = re.search(r"^code_sha:\s*(\S+)", fm, re.M)
    sources = [s.strip() for s in src.group(1).split(",")] if src else []
    return [s for s in sources if s], (sha.group(1) if sha else None)


def covers(source: str, path: str) -> bool:
    return path == source or (source.endswith("/") and path.startswith(source))


def main() -> int:
    data = json.load(sys.stdin)
    command = data.get("tool_input", {}).get("command", "")
    if not re.search(r"\bgh\s+pr\s+create\b", command):
        return 0

    root = Path(data.get("cwd") or ".")
    top = git("-C", str(root), "rev-parse", "--show-toplevel")
    if top.returncode != 0:
        return 0
    root = Path(top.stdout.strip())

    base = None
    for cand in BASE_CANDIDATES:
        mb = git("-C", str(root), "merge-base", "HEAD", cand)
        if mb.returncode == 0:
            base = mb.stdout.strip()
            break
    if base is None:
        print("wiki-before-pr: nie znalazłem main, pomijam sprawdzenie wiki", file=sys.stderr)
        return 0

    changed = git("-C", str(root), "diff", "--name-only", f"{base}..HEAD").stdout.split()
    code = [p for p in changed if p.startswith(CODE_PREFIXES)]
    if not code:
        return 0

    pages = []
    for page in sorted((root / "wiki").rglob("*.md")):
        sources, sha = parse_frontmatter(page.read_text(encoding="utf-8"))
        code_sources = [s for s in sources if not s.startswith(("raw/", "wiki/"))]
        if code_sources:
            pages.append((page.relative_to(root).as_posix(), code_sources, sha))

    stale, uncovered = [], []
    for path in code:
        hits = [p for p in pages if any(covers(s, path) for s in p[1])]
        if not hits and not IGNORED.search(path):
            uncovered.append(path)
    for name, code_sources, sha in pages:
        if not any(covers(s, p) for s in code_sources for p in code):
            continue
        if sha is None:
            stale.append(f"{name} (brak code_sha)")
            continue
        diff = git("-C", str(root), "diff", "--quiet", sha, "HEAD", "--", *code_sources)
        if diff.returncode != 0:
            stale.append(f"{name} (code_sha {sha})")

    if not stale and not uncovered:
        return 0

    lines = ["Wiki nie jest aktualna względem kodu z tego brancha, więc PR nie zostanie utworzony."]
    if stale:
        lines.append("Nieaktualne strony: " + ", ".join(stale) + ".")
    if uncovered:
        lines.append("Pliki kodu bez strony w wiki (dodaj je do `sources` właściwej strony): " + ", ".join(uncovered) + ".")
    lines.append(
        "Uruchom `/wiki ingest code` w trybie PR (sekcja „Tryb PR” w .claude/skills/wiki/SKILL.md): "
        "na tym samym branchu, niejasności wyjaśnij z użytkownikiem przez AskUserQuestion, "
        "a te, których nie rozstrzygnie, dodaj jako pytania Q-NNN. "
        "Zacommituj zmiany wiki na ten branch i dopiero wtedy ponów `gh pr create`."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": " ".join(lines),
        }
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # fail-open
        print(f"wiki-before-pr: błąd hooka ({exc}), pomijam sprawdzenie wiki", file=sys.stderr)
        sys.exit(0)
