# Plan: play_game_auth

Feature: seat-level auth (+turn enforcement) on `play/game`/`play/action`, replacing the spoofable seat model, and wiring `Bag`/`Piece` into actual game-start via a deterministic per-game snapshot.

Locked 2026-07-19.

## Scope

**In:**
- `create_game`: gated by `require_player_access`, now requires `bag_id` in the body (ownership-checked), seats the creator immediately (`GamePlayer.player_id = auth.player_id`, seat 0), and snapshots that bag's resolved pieces onto the new seat. Seat 1 is created unclaimed (`player_id = NULL`, no snapshot yet).
- `claim_game_invite`: extended to accept `bag_id` for the joining player, same ownership + snapshot resolution as above.
- New ORM: `GamePlayerPiece` junction (`game_player_id`, `piece_id`, `quantity`) — shares `game_player.py` per the "junction shares parent's file" rule, mirrors `BagPiece`'s exact shape. `Piece` gets the reverse relationship.
- New auth resolvers in `play/auth.py`: `require_game_access` (path `room` → caller is a seated player, adds `game_id`/`seat_index`) and `require_game_active_player_access` (extends it — caller's seat must also match the game's *current* active player).
- `read_game_state` gains `require_auth` (currently has none) — any authenticated player, spectator-open.
- `create_action` gains `require_game_active_player_access` — must be seated **and** it must be their turn. Internally persists `Game.is_completed` from the engine's existing `is_game_over` computation after dispatching — no separate call/route.
- `update_game_completed` — removed entirely.
- `engine/loader.py`'s `load_players()` — new signature, takes each seat's resolved piece-name list instead of reading hardcoded `"goblin"`/`"dragon"` `.txt` files. `engine/loop.py`'s `start_game()` forwards them. `play/tools.py`'s `replay_game` reads the `GamePlayerPiece` snapshot per seat and passes it through.

**Out (explicit):**
- Frontend — untouched, strictly deferred to a separate session.
- `require_friend_access` — separate future idea, not this plan.
- `GamePlayer.bag_id` provenance FK — declined, snapshot only.
- `GameStateResponse.is_game_over` rename — stays as-is.

**Migration impact:** yes — new `game_player_piece` table.

## Decisions (locked)

1. `create_game` seats the creator immediately; seat 1 is fillable *only* via `claim_game_invite` — no more raw URL-based joining (frontend catch-up is a separate session).
2. `require_game_access` gates seat-membership only; `require_game_active_player_access` (built on top of it) additionally enforces turn order. `read_game_state` uses neither — plain `require_auth`, spectator-open.
3. `create_game` requires `bag_id`, ownership-checked inline in the route body (it's a body param, not a path param — can't cleanly `Depends()` it the way `require_bag_access` works for path-scoped `bag_id`).
4. Resolved-piece snapshot stored as `GamePlayerPiece` (junction table, matches `BagPiece`'s shape) — not a JSON column, not a live `bag_id` reference. This is what makes replay deterministic even if the source `Bag` changes later.
5. `claim_game_invite` extended to accept `bag_id` and run the same snapshot resolution as `create_game`.
6. Frontend fully out of scope this plan.
7. `is_completed` is engine-derived inside `create_action`'s own body (using the same computation already backing `GameStateResponse.is_game_over`) — no separate route, no rename.
8. `update_game_completed` removed.
9. `engine/loader.py`/`engine/loop.py` signature changes are in scope — required for the snapshot to actually reach the engine.
10. `require_game_active_player_access` layers turn-enforcement on top of `require_game_access`.

## Backend structure

```
backend/play/
├── auth.py                    [edit]  + GameAuthContext/require_game_access, GameActivePlayerAuthContext/require_game_active_player_access
├── orm/
│   ├── game_player.py         [edit]  + GamePlayerPiece junction, GamePlayer.resolved_pieces relationship
│   ├── piece.py               [edit]  + game_player_pieces back_populates
├── game/
│   └── crud.py                [edit]  create_game (bag_id, seat+snapshot), read_game_state (+auth), remove update_game_completed
├── action/
│   └── crud.py                [edit]  create_action (+require_game_active_player_access, persists is_completed)
├── game_invite/
│   └── crud.py                [edit]  claim_game_invite (+bag_id, snapshot)
├── tools.py                   [edit]  replay_game reads snapshot, passes to start_game

backend/engine/
├── loader.py                  [edit]  load_players() takes per-seat piece-name lists, not hardcoded files
├── loop.py                    [edit]  start_game() forwards piece lists; __main__ CLI entrypoint needs a fallback
```

## Route inventory

| File | Route fn | Method/path | Auth | Key preconditions |
|---|---|---|---|---|
| `game/crud.py` | `create_game` | `POST /games/` | `require_player_access` | bag ownership (404/403), snapshots pieces onto seat 0 |
| `game/crud.py` | `read_game_state` | `GET /games/{room}/state` | `require_auth` | 404 game not found |
| `action/crud.py` | `create_action` | `POST /actions/{room}` | `require_game_active_player_access` | 404 game, 422 unparseable input; persists `is_completed` |
| `game_invite/crud.py` | `claim_game_invite` | `PUT /game_invites/{id}/claim` | `require_player_access` | + bag ownership, 422 no open seat, snapshots pieces |

Removed: `update_game_completed` (`PUT /games/{room}/completed`).

## Slice sequence

1. `GamePlayerPiece` ORM + `Piece` reverse relationship
2. `play/auth.py` — `require_game_access`, `require_game_active_player_access`
3. `engine/loader.py` + `engine/loop.py` signature changes
4. `play/tools.py` — `replay_game` reads snapshot, passes through
5. `game/crud.py` — `create_game`, `read_game_state`, remove `update_game_completed`
6. `action/crud.py` — `create_action`
7. `game_invite/crud.py` — `claim_game_invite`

## Dependency chain

`GamePlayerPiece` is the root (needs `GamePlayer` + `Piece`, both already exist) → engine signature changes are independent of it but both are needed before `play/tools.py` can wire them together → `require_game_access`/`require_game_active_player_access` need nothing new ORM-wise → `game/crud.py`, `action/crud.py`, `game_invite/crud.py` all need the snapshot mechanism and the engine wiring done first.

## Risk flags

- `require_game_active_player_access` needs the game's *current* active-player index, which only exists by replaying the full input log. Auth resolvers can't use `DatabaseConnection` (the ContextVar isn't set yet during `Depends()` resolution), so this resolver duplicates a slice of `replay_game`'s logic with its own session, and `create_action`'s body then replays *again* to actually dispatch the move — real double-replay cost per action call, acceptable for a prototype.
- `engine/loop.py`'s `if __name__ == "__main__":` CLI entrypoint calls `start_game()` with no args — once the signature requires piece lists, that standalone debug entrypoint needs its own fallback/default lists or it breaks.
- Removing `update_game_completed` is a breaking API change with the frontend explicitly out of scope this plan — nothing updates the caller.
- `engine/.data/default_bags/*.txt` becomes dead/unused once this lands — not deleting as part of this plan, flagged for later cleanup.

## Safe cuts (last → first)

1. `require_game_active_player_access` (turn enforcement) — could ship `require_game_access` alone first. Not recommended, explicitly asked back in.
2. `read_game_state`'s `require_auth` — already minimal.
3. Do-not-cut: `bag_id` requirement + snapshot mechanism on `create_game` — everything else depends on it.
