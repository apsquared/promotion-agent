#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/commit-all-main.sh ["Commit message"]
# Includes tracked changes, deletions, and non-ignored untracked files.
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd -- "$script_dir/.."

if [[ $# -gt 1 ]]; then
  echo 'Usage: ./scripts/commit-all-main.sh ["Commit message"]' >&2
  exit 1
fi

if [[ "$(git symbolic-ref --quiet --short HEAD || true)" != "main" ]]; then
  echo 'Run this script from the main branch. No files were staged.' >&2
  exit 1
fi

git remote get-url --push origin >/dev/null
commit_message="${1:-Update promotion-agent}"
if [[ -z "${commit_message//[[:space:]]/}" ]]; then
  echo 'Commit message must not be empty.' >&2
  exit 1
fi

git add --all
if ! git diff --cached --quiet; then
  git commit -m "$commit_message"
else
  echo 'No changes to commit; pushing existing main commits.'
fi

git push origin main:main
