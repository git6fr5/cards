# Account page — setup loading text

## Contents

1. [First-time-login message shown on every load](#1-first-time-login-message-shown-on-every-load)

---

## 1. First-time-login message shown on every load

### Context
User reported the Accounts page always shows "First time logging in — setting up." on load, not just for genuinely new players. Traced via `/trace`: `Account.tsx` renders that string whenever `useEnsurePlayer`'s `isReady` is `false`, which is the default state on every mount — not a signal that a player row was actually just created. `useEnsurePlayer` calls `GET /players/me`; only on a 404 does it fall into the create branch (`POST /players`). Both branches were confirmed committing correctly server-side (`create_resource`/`read_resource` session decorators in `utils/databases.py`), so the bug was purely the mislabeled loading text, not player persistence.

### Discussion points
User specified the desired behavior directly: show the loader with no text in the normal (returning-player) case, and only show "Setting up account" text when the 404-branch (no player yet) is actually confirmed and the create call is in flight.

### Decision
Added an `isCreating` state to `useEnsurePlayer` — set `true` only inside the 404 branch right before `POST /players`, cleared in a `finally`. Returned alongside `isReady`/`error`. `Account.tsx` now derives `setupText = playerError ?? (isCreating ? 'Setting up account' : null)` and only renders the `<p>` when `setupText` is non-null — plain loader otherwise. Files changed: `frontend/hooks/useEnsurePlayer.ts`, `frontend/app/(protected)/account/Account.tsx`.
