#!/usr/bin/env bash
set -uo pipefail

root="$(git rev-parse --show-toplevel)"
conf="$root/.shared-sync.conf"
state="$root/.shared-sync-state"
config="$root/copy.bara.sky"

[ -f "$conf" ] || { echo "missing .shared-sync.conf"; exit 1; }
. "$conf"

warn_token_expiry() {
  [ -n "${TOKEN_EXPIRY:-}" ] || return 0
  local now exp days
  now=$(date +%s)
  exp=$(date -j -f %Y-%m-%d "$TOKEN_EXPIRY" +%s 2>/dev/null) || return 0
  if [ "$now" -ge "$exp" ]; then
    echo "GitHub token expired $TOKEN_EXPIRY — regenerate PAT (scope: repo) and update your git credential."
    exit 1
  fi
  days=$(( (exp - now) / 86400 ))
  [ "$days" -le 14 ] && echo "GitHub token expires in $days days ($TOKEN_EXPIRY) — rotate soon."
}

record_state() {
  local sha
  sha=$(git ls-remote "$CANONICAL_URL" "$CANONICAL_BRANCH" | cut -f1)
  [ -n "$sha" ] && printf '%s\n' "$sha" > "$state"
}

do_publish() {
  warn_token_expiry
  local tmp specs f rc
  tmp=$(mktemp -d)
  if ! git clone -q -b "$CANONICAL_BRANCH" "$CANONICAL_URL" "$tmp"; then
    echo "publish: clone of canonical failed (auth? network?)"; rm -rf "$tmp"; exit 1
  fi
  specs=()
  while IFS= read -r line; do
    case "$line" in ''|\#*) continue ;; esac
    specs+=("$line")
  done < "$root/.shared-paths"

  ( cd "$tmp" && git ls-files -- "${specs[@]}" ) | while IFS= read -r f; do
    rm -f "$tmp/$f"
  done
  ( cd "$root" && git ls-files -- "${specs[@]}" ) | while IFS= read -r f; do
    mkdir -p "$tmp/$(dirname "$f")"
    cp "$root/$f" "$tmp/$f"
  done

  ( cd "$tmp"
    git add -A
    if git diff --cached --quiet; then
      echo "publish: no shared changes"
      exit 0
    fi
    git -c user.name="Shared Sync Bot" -c user.email="bot@git6fr5.dev" \
      commit -q -m "sync: publish shared from $PROJECT_NAME"
    if ! git push -q origin "$CANONICAL_BRANCH"; then
      echo "publish: push to canonical rejected — canonical moved; pull + retry"
      exit 1
    fi
    echo "publish: shared code pushed to canonical $CANONICAL_BRANCH"
  )
  rc=$?
  rm -rf "$tmp"
  [ "$rc" -eq 0 ] && record_state
  return "$rc"
}

case "${1:-}" in
  pull)    warn_token_expiry; copybara "$config" "push_$PROJECT_NAME";   record_state ;;
  publish) do_publish ;;
  record)  record_state ;;
  status)
    remote=$(git ls-remote "$CANONICAL_URL" "$CANONICAL_BRANCH" | cut -f1)
    recorded=$(cat "$state" 2>/dev/null || echo "")
    if [ -z "$remote" ]; then
      echo "shared: cannot reach canonical"
    elif [ "$remote" = "$recorded" ]; then
      echo "shared: up to date"
    else
      echo "shared: BEHIND canonical (${recorded:0:8} -> ${remote:0:8}) — run: ./scripts/shared-sync.sh pull"
    fi ;;
  *) echo "usage: shared-sync.sh {pull|publish|record|status}"; exit 1 ;;
esac
