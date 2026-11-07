#!/usr/bin/env python3
"""PreToolUse hook: przed `gh pr create` wymaga aktualnej wiki dla kodu z brancha.

Samo sprawdzenie robi `scripts/wiki_check.py`, ten sam skrypt co job `wiki` w CI.
Przy błędzie hooka albo skryptu przepuszcza (fail-open); twarde wymuszenie jest w CI.
"""

import json
import re
import subprocess
import sys
from pathlib import Path


def main() -> int:
    data = json.load(sys.stdin)
    command = data.get("tool_input", {}).get("command", "")
    if not re.search(r"\bgh\s+pr\s+create\b", command):
        return 0

    root = Path(data.get("cwd") or ".")
    top = subprocess.run(["git", "-C", str(root), "rev-parse", "--show-toplevel"], capture_output=True, text=True)
    if top.returncode != 0:
        return 0
    root = Path(top.stdout.strip())

    result = subprocess.run(
        [sys.executable, str(root / "scripts" / "wiki_check.py"), "--root", str(root)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 1:
        if result.returncode != 0:
            print(f"wiki-before-pr: {result.stderr.strip()}, pomijam sprawdzenie wiki", file=sys.stderr)
        return 0

    # Ostatnia linia skryptu to ogólna wskazówka; zastępuje ją dokładniejsza instrukcja dla Claude.
    findings = result.stdout.strip().splitlines()[:-1]
    reason = " ".join(
        [
            "Wiki nie jest aktualna względem kodu z tego brancha, więc PR nie zostanie utworzony.",
            *findings,
            "Uruchom `/wiki ingest code` w trybie PR (sekcja „Tryb PR” w .claude/skills/wiki/SKILL.md): "
            "na tym samym branchu, niejasności wyjaśnij z użytkownikiem przez AskUserQuestion, "
            "a te, których nie rozstrzygnie, dodaj jako pytania Q-NNN. "
            "Zacommituj zmiany wiki na ten branch i dopiero wtedy ponów `gh pr create`.",
        ]
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # fail-open
        print(f"wiki-before-pr: błąd hooka ({exc}), pomijam sprawdzenie wiki", file=sys.stderr)
        sys.exit(0)
