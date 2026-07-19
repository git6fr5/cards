# Record: Game Invite Flow

## Contents
1. [Trace — creator has no path to /play/room](#1-trace)
2. [Scoping the fix](#2-scoping)
3. [Build](#3-build)
4. [Runtime fix — DetachedInstanceError on GET /games/{room}](#4-runtime-fix)

---

## 1. Trace

### Context
Traced the flow from clicking "Invite" on `/account` through to playing on `/play/room`. Followed
the invitee side end-to-end (`StartGamePanel` → `POST /games` → `POST /game_invites` →
`IncomingInvites` accept → `PUT /game_invites/{id}/claim` → `router.push` → `PlayRoom` →
`GET /games/{room}/state`) and found it fully wired. The creator side was not: `StartGamePanel`
posted the invite and only showed a toast — no navigation anywhere. `GET /games/history` only
returns finished games (`is_game_over == True`), so there was also no way to find an in-progress
game again from the account page once created.

### Discussion points
None — the trace was grounded directly in code (`StartGamePanel.tsx`, `IncomingInvites.tsx`,
`game/history.py`, `game/crud.py`, `game_invite/crud.py`) and the gap was unambiguous.

### Decision
Confirmed three concrete gaps: (1) creator never navigates after sending an invite, (2) no lobby
state for a room with an unfilled seat — `GET /games/{room}/state` 422s until both seats are
filled, (3) `/games/history` has no "active" or "pending" bucket, only finished games.

---

## 2. Scoping

### Context
Scoped an atomic plan to close the three gaps via `/plan`.

### Discussion points
- Seat assignment: agreed to randomize at game-creation time (`random.choice`), not at claim time.
- Lobby: same `/play/room` route branches to a lobby render when not full, rather than a new route.
- History split: three separate reads (existing finished history, new active-games endpoint, new
  sent-pending-invites endpoint) rather than one combined endpoint.
- "Active" defined as both seats filled and `is_game_over == False`.
- While drafting the route inventory, found that `IncomingInvites.tsx` hardcodes `player=1` for the
  invitee's seat — this becomes wrong once seat assignment is randomized. Surfaced as a risk flag
  first; folded into the plan's scope on the next turn as a required correctness fix (decision 7 in
  the saved plan) rather than deferred, since shipping seat randomization without it would ship a
  live bug.
- Also flagged that `play/types.ts::Game` didn't match the backend `GameResponse` shape at all
  (`is_completed`/`player_user_id` vs `is_game_over`/`player_id`) — silently wrong because nothing
  read those fields. Fixed the type only; `PlayLanding.tsx` (its one consumer) was left untouched
  per scope and verified to still typecheck cleanly afterward.

### Decision
Plan saved to `.context/builds/game_invite_flow_plan.md`, then built in the same session. Full
decision list and route inventory live in that file — not duplicated here.

---

## 3. Build

### Context
Implemented the plan's 10-step slice sequence, backend then frontend.

### Discussion points
While registering the new static routes (`GET /games/{room}`, `GET /game_invites/sent`), caught a
self-introduced route-collision risk: FastAPI/Starlette match paths structurally in registration
order before type-converting captured params, so a dynamic `GET /games/{room}` registered before
the static `GET /games/history` / `GET /games/active` would swallow those requests first (attempting
`UUID("history")` and failing). Fixed by reordering `play/__init__.py` so the static routers
register before the dynamic one. `GET /game_invites/sent` was placed above `GET /{game_invite_id}`
in the same file for the same reason.

Also chose not to detect the lobby state via parsing the `game_not_full` error string from
`/games/{room}/state` — `frontend/utils/api.ts`'s `get`/`post` helpers only throw a generic
`Error` with the HTTP status in the message, no structured error body. Instead, `PlayRoom.tsx` now
always fetches the new lightweight `GET /games/{room}` first to check seat fullness, and only calls
`/state` when both seats are filled — avoids string-matching a status code.

### Decision
Built as planned, with two additions beyond the original three items (both already tracked as
locked decisions 6/7 in the plan): the claim-response seat-index fix and the frontend `Game` type
correction. Verified with `python -m py_compile` on all edited/new backend files and `npx tsc
--noEmit` on the frontend (clean, zero errors). No ORM changes, so no migration or fixture reminder
applies.

---

## 4. Runtime fix

### Context
User ran the dev server and exercised the built flow live. `GET /games/{room}` 500'd with
`fastapi.exceptions.ResponseValidationError` wrapping a `DetachedInstanceError` on the `players`
attribute.

### Discussion points
Root cause: `read_game` fetched `Game` via a bare `select(Game).where(Game.room == room)` with no
eager-load. `players` is a lazy relationship. `read_resource`'s session
(`utils/databases.py::_read_session`) closes the instant the route function returns, before
FastAPI serializes the `response_model` — so the lazy load on `.players` hit a session that no
longer existed. `create_game` doesn't hit this because it assigns `game.players = [...]` directly
in-memory before returning, so no lazy load is ever triggered. `read_active_games` and
`_pack_game_invite` were unaffected — both build their response fields manually rather than
returning a raw ORM object with an untouched relationship.

### Decision
Added `.options(selectinload(Game.players))` to `read_game`'s query in `game/crud.py` — one-line
fix, single file. Verified with `python -m py_compile`.
