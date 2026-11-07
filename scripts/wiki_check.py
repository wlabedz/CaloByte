#!/usr/bin/env python3
"""Sprawdza, czy wiki jest aktualna względem kodu zmienionego na branchu.

Błąd, gdy branch zmienia kod, a:
- strona wiki, której `sources` obejmują zmieniony plik, ma nieaktualny `code_sha`,
- albo zmieniony plik kodu nie jest w `sources` żadnej strony.

Kody wyjścia: 0 wiki aktualna (albo brak zmian w kodzie), 1 wiki nieaktualna,
2 nie da się sprawdzić (np. brak brancha bazowego). Używają go job `wiki` w CI
i hook `.claude/hooks/wiki-before-pr.py`.

    python3 scripts/wiki_check.py [--base origin/main] [--root .] [--github]
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

CODE_PREFIXES = ("backend/", "frontend/src/", ".github/workflows/")
# Pliki kodu, które nie muszą mieć własnej strony w wiki.
IGNORED = re.compile(r"(\.spec\.ts$|\.(css|scss|html|svg|png|ico)$|/__init__\.py$|^backend/migrations/versions/)")
BASE_CANDIDATES = ("upstream/main", "origin/main", "main")


class CheckError(Exception):
    pass


def git(root: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True)


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


def merge_base(root: Path, base: str | None) -> str:
    for cand in (base,) if base else BASE_CANDIDATES:
        mb = git(root, "merge-base", "HEAD", cand)
        if mb.returncode == 0:
            return mb.stdout.strip()
    raise CheckError(f"nie znalazłem brancha bazowego ({base or ', '.join(BASE_CANDIDATES)})")


def check(root: Path, base: str | None) -> tuple[list[str], list[str]]:
    """Zwraca (nieaktualne strony, pliki kodu bez strony)."""
    start = merge_base(root, base)
    changed = git(root, "diff", "--name-only", f"{start}..HEAD").stdout.split()
    code = [p for p in changed if p.startswith(CODE_PREFIXES)]
    if not code:
        return [], []

    pages = []
    for page in sorted((root / "wiki").rglob("*.md")):
        sources, sha = parse_frontmatter(page.read_text(encoding="utf-8"))
        code_sources = [s for s in sources if not s.startswith(("raw/", "wiki/"))]
        if code_sources:
            pages.append((page.relative_to(root).as_posix(), code_sources, sha))

    uncovered = [
        path
        for path in code
        if not IGNORED.search(path) and not any(covers(s, path) for _, srcs, _ in pages for s in srcs)
    ]
    stale = []
    for name, code_sources, sha in pages:
        if not any(covers(s, p) for s in code_sources for p in code):
            continue
        if sha is None:
            stale.append(f"{name} (brak code_sha)")
            continue
        diff = git(root, "diff", "--quiet", sha, "HEAD", "--", *code_sources)
        # 1: są różnice; >1: np. code_sha nie istnieje w historii, też traktujemy jako nieaktualne.
        if diff.returncode != 0:
            stale.append(f"{name} (code_sha {sha})")
    return stale, uncovered


def report(stale: list[str], uncovered: list[str]) -> list[str]:
    lines = []
    if stale:
        lines.append("Nieaktualne strony: " + ", ".join(stale) + ".")
    if uncovered:
        lines.append(
            "Pliki kodu bez strony w wiki (dodaj je do `sources` właściwej strony): "
            + ", ".join(uncovered)
            + "."
        )
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base", help="branch bazowy, np. origin/main (domyślnie pierwszy z upstream/main, origin/main, main)")
    parser.add_argument("--root", default=".", help="katalog w repozytorium (domyślnie bieżący)")
    parser.add_argument("--github", action="store_true", help="wypisz błędy jako adnotacje GitHub Actions (::error::)")
    args = parser.parse_args()

    error = "::error::" if args.github else ""
    try:
        top = git(Path(args.root), "rev-parse", "--show-toplevel")
        if top.returncode != 0:
            raise CheckError(f"{args.root} nie jest repozytorium git")
        stale, uncovered = check(Path(top.stdout.strip()), args.base)
    except CheckError as exc:
        print(f"{error}wiki-check: {exc}", file=sys.stderr)
        return 2

    if not stale and not uncovered:
        print("wiki-check: wiki aktualna względem kodu z tego brancha.")
        return 0
    for line in report(stale, uncovered):
        print(f"{error}{line}")
    print(
        f"{error}Uruchom `/wiki ingest code` w trybie PR (sekcja „Tryb PR” w .claude/skills/wiki/SKILL.md) "
        "i zacommituj zmiany wiki na ten branch."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
