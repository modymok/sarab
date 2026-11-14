#!/bin/sh
# Point core.hooksPath at <root>/.githooks (secret-scan pre-commit) in the
# repo and every initialised submodule.
# Run after cloning and after adding or initialising a submodule.
# Git worktrees share their repo's config, so they are covered too.
#   tools/install-git-hooks.sh           wire every repo
#   tools/install-git-hooks.sh --force   also overwrite a different hooksPath
#   tools/install-git-hooks.sh --check   report only; exit 1 if any repo is not wired
#                                        or gitleaks is missing
# The pre-commit hook blocks every commit while gitleaks is not installed.
set -eu

MODE=install
case "${1:-}" in
  '') ;;
  --check) MODE=check ;;
  --force) MODE=force ;;
  *) echo "usage: $0 [--check|--force]" >&2; exit 2 ;;
esac

ROOT=$(cd "$(dirname "$0")/.." && pwd)
HOOKS="$ROOT/.githooks"
if [ ! -x "$HOOKS/pre-commit" ]; then
  echo "error: $HOOKS/pre-commit is missing or not executable" >&2
  exit 1
fi

wired=0 skipped=0 bad=0

# $1 = absolute repo dir, $2 = path shown in output
handle() {
  cur=$(git -C "$1" config --local --get core.hooksPath || true)
  if [ "$cur" = "$HOOKS" ]; then
    [ "$MODE" = check ] && echo "WIRED $2"
    wired=$((wired + 1))
    return
  fi
  if [ "$MODE" = check ]; then
    echo "NOT WIRED $2 (core.hooksPath = ${cur:-unset})"
    bad=$((bad + 1))
    return
  fi
  if [ -n "$cur" ] && [ "$MODE" != force ]; then
    echo "warning: $2 already has core.hooksPath = $cur; not changed (use --force)" >&2
    bad=$((bad + 1))
    return
  fi
  git -C "$1" config --local core.hooksPath "$HOOKS"
  echo "wired $2"
  wired=$((wired + 1))
}

handle "$ROOT" .

paths=$(git config -f "$ROOT/.gitmodules" --get-regexp '^submodule\..*\.path$' 2>/dev/null | cut -d' ' -f2- || true)
for p in $paths; do
  if [ -e "$ROOT/$p/.git" ]; then
    handle "$ROOT/$p" "$p"
  else
    echo "skip $p (not initialised)"
    skipped=$((skipped + 1))
  fi
done

if command -v gitleaks >/dev/null 2>&1; then
  have_gitleaks=1
  gl_version=$(gitleaks version 2>/dev/null | head -n 1)
else
  have_gitleaks=0
fi

if [ "$MODE" = check ]; then
  if [ "$have_gitleaks" = 1 ]; then
    echo "gitleaks: found ${gl_version:-unknown version}"
  else
    echo "gitleaks: MISSING (brew install gitleaks)"
  fi
elif [ "$have_gitleaks" = 0 ]; then
  {
    echo "################################################################"
    echo "WARNING: gitleaks is not installed. The pre-commit hook will"
    echo "block every commit until it is: brew install gitleaks"
    echo "(other systems: https://github.com/gitleaks/gitleaks#installing)"
    echo "################################################################"
  } >&2
fi

if [ "$bad" -gt 0 ]; then
  echo "$wired wired, $skipped skipped, $bad not wired"
  exit 1
fi
echo "$wired wired, $skipped skipped"
if [ "$MODE" = check ] && [ "$have_gitleaks" = 0 ]; then
  exit 1
fi
