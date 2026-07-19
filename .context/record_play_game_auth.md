# Record: play_game_auth

## Contents

1. [Motivating gap — what was still broken after play_foundation](#1-motivating-gap--what-was-still-broken-after-play_foundation)
2. [Seat assignment + auth resolver chain](#2-seat-assignment--auth-resolver-chain)
3. [Bag-to-engine wiring and replay determinism](#3-bag-to-engine-wiring-and-replay-determinism)
4. [Engine-derived is_completed, removed update_game_completed](#4-engine-derived-is_completed-removed-update_game_completed)
5. [Bugs found and fixed along the way](#5-bugs-found-and-fixed-along-the-way)

---

## 1. Motivating gap — what was still broken after play_foundation

### Context
Ran `/bullet` on "anything discussed this session not built" after the `Friend`/`GameInvite` commit, which surfaced four open items. Three of them (seat-level auth, the spoofable `?player=` URL param, wiring `Bag` into game-start) became this plan; the fourth (migration/fixture execution) is a user-run step, not a code feature.

### Discussion points
Survey before scoping found the gap was bigger than the bullet summary implied: `create_game` still created two fully anonymous seats (`player_index` only, no identity at all) — none of the very-first-round decisions about seating the creator immediately had ever actually been built, across either of the two prior sessions. `play/game/crud.py` and `play/action/crud.py` still had zero `Depends()` anywhere. And `engine/loader.py` had no awareness the `Bag`/`Piece`/`BagPiece` resources existed — it hardcoded fixed `"goblin"`/`"dragon"` default bags from `.data/default_bags/*.txt` regardless of who was playing.

### Decision
Scoped as one combined plan (`play_game_auth`) rather than three separate ones, since seat auth and bag-wiring turned out to be entangled: you can't meaningfully gate access by seat without the seat actually being tied to an identity, and you can't wire a real `Bag` into a game without deciding when/how that resolution happens (which is exactly when a seat gets filled). Frontend was explicitly kept out — user is fixing that up separately once this backend lands.

---

## 2. Seat assignment + auth resolver chain

### Context
`create_game` now requires `bag_id` and seats the creator immediately (`GamePlayer.player_id = auth.player_id`, seat 0); seat 1 is fillable only through the already-built `claim_game_invite`. Two new resolvers in `play/auth.py`: `require_game_access` (caller must be a seated player) and `require_game_active_player_access` (built on top — caller's seat must also match the game's current active player).

### Discussion points
Original scoping only asked for seat-membership checks. Pushed back with a specific gap: `create_action`'s `dispatch_input` has no per-request caller identity at all — it just mutates whatever `game.active_player_index` the replayed state says is active, so seat-membership alone doesn't stop seat-0 from acting during seat-1's turn. User confirmed turn-enforcement should be back in scope and proposed the resolver name (`require_game_active_player_access`) directly.

Implementing the turn check exposed a real constraint: auth resolvers can't use `DatabaseConnection` (the ContextVar isn't set yet during `Depends()` resolution), but knowing "whose turn is it" requires a full replay of the game's input log — there's no cheap column to check. Solved by making `play/tools.py`'s `replay_game` take an explicit `session: Session` parameter instead of relying on `DatabaseConnection` internally, so both route bodies (`DatabaseConnection.session()`) and the auth resolver (its own raw `with Session(init_engine())`) can call the exact same function rather than duplicating replay logic. Accepted tradeoff: `create_action` now replays the game twice per call (once in the resolver for the turn check, once in the route body to actually dispatch) — noted as a known prototype-stage cost, not fixed further.

### Decision
`require_game_access`/`require_game_active_player_access` built as described, following the parent-child resolver delegation pattern already established for `require_player_access`→`require_bag_access`. `read_game_state` deliberately uses neither — just plain `require_auth`, spectator-open to any authenticated player, per explicit instruction.

---

## 3. Bag-to-engine wiring and replay determinism

### Context
A player's chosen `Bag` needed to actually reach the engine at game-start, but bags can be edited after a game begins — so the engine needs to use what was true *at seat-fill time*, not the bag's current live contents.

### Discussion points
Considered storing a live `bag_id` reference on `GamePlayer` (simpler) versus snapshotting the resolved pieces into their own table. User was explicit: since a bag can change independently of any game using it, only a real snapshot gives replay determinism — a live reference isn't enough. Landed on `GamePlayerPiece` (`game_player_id`, `piece_id`, `quantity`), deliberately mirroring `BagPiece`'s exact shape rather than a JSON column, for consistency with the rest of the codebase's normalized style. Declined keeping `bag_id` as provenance alongside it — snapshot only.

This forced signature changes down through the engine: `engine/loader.py`'s `load_players()` now takes `player_pieces: list[list[str]] | None` instead of always reading the hardcoded `.txt` files; `engine/loop.py`'s `start_game()` forwards it. The `None` fallback was kept specifically so the `if __name__ == "__main__":` CLI/debug entrypoint at the bottom of `loop.py` still works unchanged (calls `start_game()` with no args) — the old goblin/dragon default-bag files stay alive as that fallback rather than becoming dead code, which is a better outcome than the risk flagged in the plan draft.

### Decision
`play/tools.py` gained `snapshot_bag_pieces` (copies a `Bag`'s `BagPiece` rows into `GamePlayerPiece` for a given seat, called from both `create_game` and `claim_game_invite`), `game_is_full` (both seats have a claimed `player_id` — needed because `load_board` crashes looking for a king if a seat has no resolved pieces yet), and `_load_seat_pieces` (expands the snapshot into a flat piece-name list, quantity-repeated, for the engine). `read_game_state` and `create_action`'s resolver both guard on `game_is_full` before attempting a replay, returning 422 instead of crashing when the second seat hasn't been claimed yet.

---

## 4. Engine-derived is_completed, removed update_game_completed

### Context
`update_game_completed` was a client-settable PUT route with no auth at all — the original audit's other big finding on this file.

### Discussion points
`GameStateResponse` already computed `is_game_over` via the engine on every `read_game_state`/`create_action` call; it just never got persisted anywhere, and the separate PUT route let any caller set it directly regardless of actual game state. User confirmed: derive it inside `create_action` itself (write `Game.is_completed` from the same `is_game_over` computation already backing the response, right after dispatching each move) and remove the manual route entirely — no rename of the response field (`is_game_over` stays, even though the DB column it now writes to is named `is_completed`).

### Decision
`update_game_completed` and its request model deleted from `game/crud.py`. `create_action` sets `game_row.is_completed = True` inline when `pack_game_state(...)["is_game_over"]` is true — no separate call, no separate route.

**Follow-up correction:** the "stays `is_game_over`" decision meant the *response* field, but left the `Game.is_completed` DB column and `GameResponse.is_completed` field mismatched against `GameStateResponse.is_game_over` — same boolean, two different names depending on which response you were looking at. User asked to unify: `Game.is_completed` → `Game.is_game_over` (ORM column rename), `GameResponse.is_completed` → `is_game_over`, and the `create_action` write updated to match (`game_row.is_game_over = True`). `GameStateResponse.is_game_over` itself was already correct and untouched. This is now one name (`is_game_over`) end to end — DB column, both response models, and the internal write.

---

## 5. Bugs found and fixed along the way

### Context
Re-reading `play/game/crud.py` in full to rewrite it (not something touched in either prior session) surfaced two pre-existing bugs, fixed as part of this same edit since they were directly in the lines being changed anyway.

### Discussion points
- `create_game` was declared as `@router.post("/", ...)` instead of `@router.post("", ...)` — a direct violation of `creating_backend_routes.md`'s collection-path rule, which specifically warns this causes a `307` redirect through the frontend's `/api` proxy that drops the `SameSite=Lax` session cookie. This was latent and harmless while `create_game` had no auth to break; now that it requires a session cookie for the first time, leaving it unfixed would have silently broken login on this exact route.
- `GamePlayerResponse` still declared `player_user_id: int | None`, the field name from *before* the very first session's `GamePlayer.player_user_id` → `player_id` rename — never updated at the time, so `GameResponse` serialization was already broken (`from_attributes` would look for an attribute that no longer exists on the ORM object).

### Decision
Both fixed inline: route path corrected to `""`, response field renamed to `player_id` to match the actual column.
