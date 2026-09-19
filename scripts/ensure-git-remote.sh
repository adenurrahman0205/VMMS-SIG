#!/usr/bin/env bash
# Snapshot sandbox menghapus .git/config. Jalankan skrip ini agar remote + identitas git terpasang lagi.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git config --local user.name "VMMS-SIG"
git config --local user.email "vmms-sig@local"
git config --local init.defaultBranch main

URL="https://github.com/adenurrahman0205/VMMS-SIG.git"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$URL"
else
  git remote add origin "$URL"
fi

# PAT opsional: GH_TOKEN / GITHUB_TOKEN / file .git-push-token (jangan di-commit)
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "$TOKEN" && -f "$ROOT/.git-push-token" ]]; then
  TOKEN="$(tr -d '[:space:]' < "$ROOT/.git-push-token")"
fi
if [[ -n "$TOKEN" ]]; then
  git remote set-url origin "https://x-access-token:${TOKEN}@github.com/adenurrahman0205/VMMS-SIG.git"
fi

echo "origin: $(git remote get-url origin | sed -E 's#://[^@]+@#://***@#')"
echo "user: $(git config --local user.name) <$(git config --local user.email)>"
