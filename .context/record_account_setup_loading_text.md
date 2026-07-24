# Account page — setup loading text

## Contents

1. [First-time-login message shown on every load](#1-first-time-login-message-shown-on-every-load)
2. [Reusable player gates + strict /play guard](#2-reusable-player-gates--strict-play-guard)

---

## 1. First-time-login message shown on every load

### Context
User reported the Accounts page always shows "First time logging in — setting up." on load, not just for genuinely new players. Traced via `/trace`: `Account.tsx` renders that string whenever `useEnsurePlayer`'s `isReady` is `false`, which is the default state on every mount — not a signal that a player row was actually just created. `useEnsurePlayer` calls `GET /players/me`; only on a 404 does it fall into the create branch (`POST /players`). Both branches were confirmed committing correctly server-side (`create_resource`/`read_resource` session decorators in `utils/databases.py`), so the bug was purely the mislabeled loading text, not player persistence.

### Discussion points
User specified the desired behavior directly: show the loader with no text in the normal (returning-player) case, and only show "Setting up account" text when the 404-branch (no player yet) is actually confirmed and the create call is in flight.

### Decision
Added an `isCreating` state to `useEnsurePlayer` — set `true` only inside the 404 branch right before `POST /players`, cleared in a `finally`. Returned alongside `isReady`/`error`. `Account.tsx` now derives `setupText = playerError ?? (isCreating ? 'Setting up account' : null)` and only renders the `<p>` when `setupText` is non-null — plain loader otherwise. Files changed: `frontend/hooks/useEnsurePlayer.ts`, `frontend/app/(protected)/account/Account.tsx`.

---

## 2. Reusable player gates + strict /play guard

### Context
Same "First time logging in" duplicate block existed verbatim in `Catalog.tsx`, with none of the `isCreating` fix from section 1 — user flagged this as whack-a-mole and asked for extraction into one reusable function. Discussion then surfaced a third, more serious gap: `PlayRoom.tsx` never calls `useEnsurePlayer` at all, and `GameLobby`/`InviteLink` support claiming an open seat via a shareable room link — not just friend-scoped invites — so a brand-new user's first-ever action can be clicking a room link with no `Player` row yet. That currently 404s through `require_game_access` and surfaces as a generic "Game not found".

### Discussion points
Two designs were weighed for `/play`: silently auto-create the player inline (matching account/catalog), or reject outright. User pushed for the stricter option — a first-time player needs to actually set themselves up (bag, etc.) before playing, so direct nav into a game with no player yet should redirect to `/account`, not silently provision a bare player. Landed on two distinct gate components rather than one shared one: a permissive gate (creates) for the two setup pages, a strict check-and-redirect gate for `/play`. Named the strict one `RajaRequirePlayer`, mirroring the backend's existing `require_player_access` naming.

### Decision
- `components/layout/RajaPlayerGate.tsx` (new, permissive): wraps `children`, owns the `useEnsurePlayer` call and the loader/setup-text rendering. `Account.tsx` and `Catalog.tsx` were split into a thin default-export wrapper (`<RajaPlayerGate><AccountContent /></RajaPlayerGate>` / `CatalogContent`) plus the original body as a non-exported content component — removes the duplicated hook call, JSX block, and the `isReady` dependency from both pages' data-loading effects entirely.
- `components/layout/RajaRequirePlayer.tsx` (new, strict): checks `useCurrentUser()` first (`router.replace('/auth')` if no session), then `GET /players/me` directly (no `POST` fallback) — 404 redirects to `/account` instead of creating a player. Renders `children` only once a player is confirmed to exist.
- `app/(protected)/play/layout.tsx` (new): wraps the `/play` subtree in `RajaRequirePlayer`, closing the direct-room-link gap for brand-new users.
- `frontend/hooks/useEnsurePlayer.ts` unchanged from section 1 beyond that fix — still the only place that calls `POST /players`.
