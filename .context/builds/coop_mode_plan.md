# Plan: Coop Mode

## Scope

In: seat-identity rename (`player_index` → `seat_index`, DB → engine → API → frontend), explicit
`seat_index` query param on every game-scoped request with backend ownership validation, new coop
seat-fill route, frontend `coop=true` view-swap on End Turn.

Out: >2-seat games, any DB migration file (user writes it), non-coop invite flow logic (untouched,
just renamed field).

Migration impact: one column rename on `game_player` — user writes the Alembic revision.

Build order: backend rename+validation first (existing 2-account games keep working, just
tightened), then coop route, then frontend.

## Decisions (locked)

1. Rename `player_index` → `seat_index` end-to-end: DB column, engine-internal `Player.player_id`
   (entities/player.py etc — separate concept from the real DB `player.id`, name collision was
   itself a latent confusion), API response field, frontend types/params.
2. `seat_index` sent on every game-scoped request, coop or not — one code path, no
   special-casing by game type.
3. Coop seat-fill via new `POST /games/coop` route, bypassing the friend-invite system entirely.
4. No `Game.is_coop` column — coop-ness is just "both seats share a `player_id`," never queried
   as a flag. Kills the dead WIP branch in the pre-existing auth.py edits.
5. Transport is a query param, not request body — `GET /games/{room}/state` and the WS handshake
   have no body, so a single uniform mechanism (query param) beats splitting by verb.
6. Deliverable: plan only.
7. Both backend rework and frontend view-swap in this slice sequence.

## Backend structure

```
backend/play/orm/game_player.py     [edit] player_index -> seat_index; drop broken WIP dup column
backend/play/auth.py                [edit] _load_game_and_seat takes+validates explicit seat_index;
                                             require_game_access/_ws take seat_index query param;
                                             drop dead is_coop branch/unused seat_id param
backend/play/game/crud.py           [edit] rename propagation; create_game unchanged otherwise
backend/play/game/coop.py           [new]  create_game_coop -- both seats seeded with auth.player_id
backend/play/game/active.py         [edit] rename propagation
backend/play/action/crud.py         [edit] rename propagation
backend/play/action/preview.py      [edit] rename propagation (already seat-scoped correctly)
backend/play/game_invite/crud.py    [edit] invitee_player_index -> invitee_seat_index
backend/play/tools.py               [edit] pack_game_state, order_by, snapshot rename propagation
backend/engine/entities/player.py   [edit] player_id field -> seat_index, all refs
backend/engine/resolver.py          [edit] rename propagation
backend/engine/loader.py            [edit] rename propagation
backend/engine/loop.py              [edit] rename propagation incl. __main__ CLI entrypoint
```

## Route inventory

| File | Route fn | Method/Path | Key preconditions |
|---|---|---|---|
| game/crud.py | create_game | POST /games | bag ownership 403 |
| game/coop.py | create_game_coop | POST /games/coop | bag ownership 403 -- new |
| game/crud.py | read_game_state | GET /games/{room}/state?seat_index= | not_seated 403, game_not_full 422 |
| action/crud.py | create_action | POST /actions/{room}?seat_index= | not_seated 403, not_your_turn 403, unparseable_input 422 |
| action/preview.py | preview_action | POST /actions/{room}/preview?seat_index= | not_seated 403, unparseable_input 422 |
| auth.py | require_game_access_ws | WS /games/{room}/ws?seat_index= | unauthenticated 401, not_seated 403 |

## Frontend

- `PlayRoom.tsx` — `activeSeat` state replaces the old spoofable `player` prop as source of
  truth; `coop` derived from `searchParams.get('coop') === 'true'`; `handleEndTurn` flips
  `activeSeat` 0<->1 when coop; every `get`/`post` call and the WS connection append
  `seat_index=${activeSeat}`.
- `MainPanel.tsx`, `PlayerPanel.tsx`, `PlayerShelf.tsx` — prop rename only, no structural change.
- `types.ts` (play), `_components/types.ts` — `player_id`/`player_index` -> `seat_index`.
- `StartGamePanel.tsx`, `ActiveGames.tsx`, `InviteLink.tsx`, `IncomingInvites.tsx`,
  `GameLobby.tsx` — `?player=` route param -> `?seat_index=`.
- `useWebSocket.ts` — extend to accept query params, appended to the ws URL.
- New: a "Play Coop" entry point (button wired to `POST /games/coop`, redirects to
  `/play/room?room=...&coop=true&seat_index=0`) — landing spot picked during build.

## Slice sequence

1. Fix `game_player.py` (rename, delete broken WIP dup column).
2. `auth.py`: seat_index query param + real ownership check (`game_id` AND `seat_index` AND
   `player_id` all match) on `require_game_access`/`_ws`; drop dead `is_coop` code.
3. Propagate rename through `game/crud.py`, `action/crud.py`, `action/preview.py`,
   `game/active.py`, `game_invite/crud.py`, `tools.py`, engine files — existing 2-account flow
   keeps working, now with explicit+validated seat_index.
4. `game/coop.py` new route, wired in `game/__init__.py`.
5. Frontend rename slice — functionally identical to today, renamed + explicit query param
   everywhere.
6. Frontend coop slice — `coop=true`, `activeSeat` flip-on-end-turn, WS query param, coop entry
   point.

## Dependency chain

1 -> 2 -> 3 (backend must land before frontend can send anything meaningful) -> 4 (needs 2's
validation logic) -> 5 (needs 3) -> 6 (needs 4 and 5).

## Risk flags

- Rename ripple hits `engine/` (pure-logic, no tests) — a missed rename fails silently (wrong
  seat attribution), not a crash.
- `loop.py`'s `__main__` CLI entrypoint must be updated in the same pass or it silently breaks
  (this exact entrypoint was deliberately preserved during the last auth rework, see
  `record_play_game_auth.md`).
- The three-way ownership check (`game_id` AND `seat_index` AND `player_id`) in step 2 is the
  actual security fix — get it wrong (e.g. check only `player_id`) and the whole rework is void.
- Engine log strings (`f"Player {self.player_id} moved..."`) are user-visible outcome text —
  attribute rename must not change the printed "Player 0"/"Player 1" wording.
- `useWebSocket`'s effect deps key on `resourceId` — confirm during build whether the WS gate
  needs the *flipped* seat_index at all, or just *a* valid one (current shape suggests the
  latter) — a deliberate call, not an assumption.

## Safe cuts (last -> first)

- Frontend coop slice (6) — ship rename+hardening only, no user-facing coop yet.
- `create_game_coop` route (4) — seat-fill by hand for testing, defer the route.
- Engine-internal rename (`entities/player.py` etc.) — naming hygiene, not required for coop to
  function; DB/API rename alone unblocks the feature.
- API response field rename (`player_id` -> `seat_index` in `GameStateResponse`) — keep contract
  as-is, ship only the ownership-check fix + coop route.
- **Do not cut:** the three-way ownership check in step 2 — that's the security fix everything
  else sits on.
