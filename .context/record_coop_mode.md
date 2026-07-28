# Record: Coop Mode

## Contents

1. [Motivating question — same-tab two-seat play](#1-motivating-question--same-tab-two-seat-play)
2. [Why the naive fix was rejected — bypassing viewer_index](#2-why-the-naive-fix-was-rejected--bypassing-viewer_index)
3. [How the engine attributes an action to a player](#3-how-the-engine-attributes-an-action-to-a-player)
4. [Pre-existing broken WIP found in auth.py / game_player.py](#4-pre-existing-broken-wip-found-in-authpy--game_playerpy)
5. [Locked plan — seat_index rename + explicit ownership check](#5-locked-plan--seat_index-rename--explicit-ownership-check)
6. [Shared-sync pull mid-build](#6-shared-sync-pull-mid-build)
7. [Build execution and verification](#7-build-execution-and-verification)

---

## 1. Motivating question — same-tab two-seat play

### Context
User asked for a "lan" / coop mode: `?coop=true` on `/play/room`, where one logged-in person
plays both seats in the same browser tab, with the view swapping to the other seat automatically
after End Turn.

### Discussion points
Investigation found the `?player=` URL param was already known to be purely a frontend display
value — real seat authorization is derived server-side from the session cookie (`auth.player_id`)
via `_load_game_and_seat`, which resolves a seat by `GamePlayer.player_id` match alone. With the
same `player_id` seated in both seats (the coop case), that lookup is ambiguous — it can't tell
which seat the caller means. Fog-of-war (`pack_game_state`'s `viewer_index`) has the identical
problem. Seat-fill was also a blocker: the only path to fill a second seat is the friend-invite
flow, which requires an accepted friend relationship — self-invite isn't supported.

### Decision
Feasible, but requires backend changes beyond a frontend view toggle: the caller needs to tell
the backend which seat it's acting as on each request, and the backend needs to validate that
claim rather than trust it blindly.

---

## 2. Why the naive fix was rejected — bypassing viewer_index

### Context
First proposed fix: let coop requests bypass the `viewer_index`-derived fog-of-war check
entirely.

### Discussion points
User pushed back — bypassing viewer_index removes fog-of-war protection for that request outright,
which is a real security regression, not just a coop convenience. Reconsidered: instead of
weakening the auth-derived model, give each seat a real, ownership-verified identity and keep the
existing viewer_index mechanism completely intact.

### Decision
No bypass anywhere. The fog-of-war and turn-gate mechanisms stay exactly as they are; only the
*seat resolution* step changes, and only by becoming more explicit and more strictly validated
(not less).

---

## 3. How the engine attributes an action to a player

### Context
Before designing the fix, traced how a mutating action actually gets attributed to a player, to
confirm no engine-level change was needed.

### Discussion points
`dispatch_input` defaults `viewer_index` to `game.active_player_index` and executes as whoever is
currently active — the engine itself performs no identity check at all. The entire "is this
really your turn" gate lives in `play/auth.py`'s `require_game_active_player_access`, applied
*before* dispatch. Preview/read paths already thread an explicit `viewer_index` (`auth.seat_index`)
for off-turn, seat-scoped reads, established in an earlier session
([record_board_inspect_off_turn.md](record_board_inspect_off_turn.md)).

### Decision
No engine changes needed for coop. The entire fix is scoped to `play/auth.py`'s seat-resolution
layer and the query-param transport that feeds it.

---

## 4. Pre-existing broken WIP found in auth.py / game_player.py

### Context
Mid-discussion, the user's own in-progress IDE edits surfaced: a `seat_id` param added to
`require_game_access` but never used, a dead `game.is_coop` branch (query computed and
discarded), a reference to a `Game.is_coop` ORM column that doesn't exist, and a `game_player.py`
edit adding a duplicate `seat_index` column with a Python syntax error (missing comma) — the
module wouldn't even import.

### Discussion points
User initially thought `GamePlayer` had no seat-index-shaped column at all; corrected — it already
had `player_index` (0/1), the WIP edit was an accidental duplicate of an existing concept, not a
missing one.

### Decision
Discard the broken WIP (confirmed via `git status`/`git diff` it was uncommitted); resolved by a
`shared-sync.sh pull` + stash the user ran independently, which reset both files to their clean
pre-WIP state. Verified via `ast.parse` before continuing.

---

## 5. Locked plan — seat_index rename + explicit ownership check

### Context
Full plan built via `/plan`, saved to `.context/builds/coop_mode_plan.md`.

### Discussion points
- Rename scope: user chose the full rename (DB column, engine-internal `Player.player_id`, API
  response field, frontend types) over a DB-only rename — `player_index`/engine `player_id` were
  both confusingly overloaded with the *real* DB `player.id` concept.
- Transport: user first proposed a request-body field; corrected during planning — `GET` state
  reads and the WebSocket handshake have no body, so a uniform query param (`seat_index`) was used
  everywhere instead.
- Coop seat-fill: dedicated `POST /games/coop` route bypassing the friend-invite system, rather
  than reusing/relaxing the invite flow.
- No `Game.is_coop` column — coop-ness is emergent (both seats share a `player_id`), never queried
  as a flag.
- Scope: both backend rework and the frontend end-turn view-swap landed in the same pass (no
  cuts taken).

### Decision
Plan locked as drafted; see the plan file for the full decision list, route inventory, and slice
sequence.

---

## 6. Shared-sync pull mid-build

### Context
`frontend/hooks/useWebSocket.ts` is on this project's `.shared-paths` list (project has
`copy.bara.sky`), and the plan required extending it to accept query params for the WS
connection. Pre-build check found the shared tree BEHIND canonical.

### Discussion points
Flagged before editing per the shared-sync convention; user ran `./scripts/shared-sync.sh pull`
with `--stash` themselves and confirmed. Re-checked status (up to date), git status (clean, no
leftover stash), and re-verified `game_player.py`/`auth.py` syntax before resuming — this pull is
also what reset the broken WIP from §4.

### Decision
Proceeded once verified clean. `useWebSocket.ts` extended with a backward-compatible optional
`params` argument (existing callers unaffected).

---

## 7. Build execution and verification

### Context
Implemented the full locked plan: `GamePlayer.player_index` → `seat_index`; `auth.py`'s
`_load_game_and_seat` now takes an explicit `seat_index` and validates
`game_id` ∧ `seat_index` ∧ `player_id` together (preserving the existing-guide "check existence
before permission" 404-then-403 ordering, which the first draft of the fix had accidentally
collapsed into a single 403); same treatment applied to `require_game_access_ws`; new
`play/game/coop.py` (`create_game_coop`) wired into `play/__init__.py`; rename propagated through
`game/crud.py`, `game/active.py`, `action/crud.py`, `game_invite/crud.py` (`invitee_seat_index`),
`tools.py`, the engine (`entities/player.py`, `resolver.py`, `loader.py`, `loop.py` incl. the
`__main__` CLI entrypoint), and `fixtures/seed_game.py`. Frontend: `PlayRoom.tsx` now holds
`activeSeat` state (replacing the spoofable `player` prop), flips it on a successful coop End
Turn, sends `seat_index` on every request and the WS connection, and only shows the full-page
loader on true first load (not on the seat-swap refetch) so the board doesn't flash to a spinner
every turn; `page.tsx`, `types.ts` files, and every game-launch site (`StartGamePanel.tsx` — which
also gained the "Play Coop" entry point, `ActiveGames.tsx`, `InviteLink.tsx`,
`IncomingInvites.tsx`, `GameLobby.tsx`) updated to match.

### Discussion points
No pushback during execution — verification was proactive: `python -m py_compile` on every edited
backend file, a DB-free `app.openapi()` build (confirms all routes/dependencies/response models
resolve, and that `seat_index` surfaces as a required query param on every game-scoped route,
without ever creating a DB engine), and `tsc --noEmit -p tsconfig.json` on the frontend (clean
aside from one pre-existing stale `.next` artifact unrelated to this change, confirmed by its
mtime predating the session).

### Decision
Build complete as planned, no cuts taken. Outstanding: the `game_player` column-rename migration
(user writes it), and the fixtures reminder is already satisfied (`seed_game.py` updated inline
since it was a pure rename, not a new required column).

---

## 8. Follow-up — dedicated coop start UI, per-seat bags

### Context
After the initial build, user checked the account page: the "Play Coop" button was crammed into
`StartGamePanel`'s row (sharing the friend-invite bag dropdown), and `create_game_coop` only
accepted one `bag_id`, reused for both seats. User wanted a dedicated "Start a Coop Game" section
with two independent bag selectors — one per seat — and no friend requirement.

### Discussion points
None — straightforward follow-up, scope was already implicitly right-sized by the original design
(single-bag coop was a placeholder, not a locked decision).

### Decision
`play/game/coop.py`'s `CreateCoopGameRequest` changed from `bag_id: int` to `bag_id_seat_0: int` /
`bag_id_seat_1: int`; `create_game_coop` validates and snapshots each seat from its own bag.
`StartGamePanel.tsx` reverted to just the friend-invite flow (the coop button/handler removed).
New `StartCoopGamePanel.tsx` — its own section on the account page, two bag dropdowns, no friend
dropdown, wired into `Account.tsx` alongside `StartGamePanel`.

Also checked (read-only, no DB touched): the dev seed chain (`dev.py` → `seed_dev.py` →
`seed_game.py`) — `py_compile` and a DB-free import check confirm it's consistent with the
`seat_index` rename from §5–7.
