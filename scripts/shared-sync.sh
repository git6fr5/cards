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
  local tmp specs addspecs s f rc msg have_include
  msg="${1:-sync: publish shared from $PROJECT_NAME}"

  specs=()
  while IFS= read -r line; do
    case "$line" in ''|\#*) continue ;; esac
    specs+=("$line")
  done < "$root/.shared-paths"

  # 1. commit local shared changes (pre-commit guard runs here) and push your remote.
  # Keep only include pathspecs that exist here (a repo may lack some shared dirs);
  # git add errors and stages nothing if any pathspec matches no files.
  addspecs=()
  have_include=0
  for s in "${specs[@]}"; do
    case "$s" in
      :*) addspecs+=("$s"); continue ;;
    esac
    if [ -e "$root/$s" ] || git -C "$root" ls-files --error-unmatch -- "$s" >/dev/null 2>&1; then
      addspecs+=("$s"); have_include=1
    fi
  done
  if [ "$have_include" -eq 1 ]; then
    git -C "$root" add -A -- "${addspecs[@]}"
    if ! git -C "$root" diff --cached --quiet; then
      if ! git -C "$root" commit -q -m "$msg"; then
        echo "publish: local commit blocked (guard: stale base?) — pull + accept, then retry"; exit 1
      fi
      git -C "$root" push -q || { echo "publish: push to your remote failed"; exit 1; }
    fi
  fi

  # 2. copy this repo's shared set onto canonical, commit, push
  tmp=$(mktemp -d)
  if ! git clone -q -b "$CANONICAL_BRANCH" "$CANONICAL_URL" "$tmp"; then
    echo "publish: clone of canonical failed (auth? network?)"; rm -rf "$tmp"; exit 1
  fi

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
      commit -q -m "$msg"
    if ! git push -q origin "$CANONICAL_BRANCH"; then
      echo "publish: push to canonical rejected — canonical moved; pull + accept, then retry"
      exit 1
    fi
    echo "publish: shared code pushed to canonical $CANONICAL_BRANCH"
  )
  rc=$?
  rm -rf "$tmp"
  [ "$rc" -eq 0 ] && record_state
  return "$rc"
}

do_accept() {
  local branch="copybara/shared-sync" stashed=0 autostash="${1:-}"
  if [ -n "$(git -C "$root" status --porcelain)" ]; then
    if [ "$autostash" = "--stash" ]; then
      git -C "$root" stash push -u -m "shared-sync accept autostash" || { echo "accept: stash failed"; exit 1; }
      stashed=1
    else
      echo "accept: working tree not clean — commit/stash, or rerun with --stash"; exit 1
    fi
  fi
  if ! git -C "$root" fetch -q origin "$branch"; then
    [ "$stashed" = 1 ] && git -C "$root" stash pop
    echo "accept: no $branch on origin — run pull first"; exit 1
  fi
  if ! git -C "$root" merge --no-edit "origin/$branch"; then
    git -C "$root" merge --abort
    [ "$stashed" = 1 ] && git -C "$root" stash pop
    echo "accept: merge conflict — resolve manually; $branch left intact"; exit 1
  fi
  if ! git -C "$root" push -q origin HEAD; then
    [ "$stashed" = 1 ] && git -C "$root" stash pop
    echo "accept: push of merge failed"; exit 1
  fi
  git -C "$root" push -q origin --delete "$branch" || true
  git -C "$root" branch -qD "$branch" 2>/dev/null || true
  record_state
  if [ "$stashed" = 1 ]; then
    if git -C "$root" stash pop; then
      echo "accept: merged, deleted $branch, restored your WIP"
    else
      echo "accept: merged and deleted $branch; restoring WIP hit conflicts — resolve them (stash preserved)"
    fi
  else
    echo "accept: merged and deleted $branch"
  fi
}

case "${1:-}" in
  pull)
    warn_token_expiry
    git push origin --delete copybara/shared-sync 2>/dev/null || true
    copybara "$config" "push_$PROJECT_NAME"
    record_state ;;
  accept)  do_accept "${2:-}" ;;
  publish) do_publish "${2:-}" ;;
  fanout)
    target="${2:-}"
    [ -n "$target" ] || { echo "usage: shared-sync.sh fanout <name>"; exit 1; }
    git push "https://github.com/${GITHUB_USER:-git6fr5}/$target.git" --delete copybara/shared-sync 2>/dev/null || true
    copybara "$config" "push_$target" ;;
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
  *) echo "usage: shared-sync.sh {pull|accept [--stash]|publish [msg]|fanout <name>|record|status}"; exit 1 ;;
esac
