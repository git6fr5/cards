---
name: Play Module Design
description: Design discussion for the thin backend `play/` module that wraps the engine for room-based games — schema, replay strategy, and the engine-side gaps it exposed
type: project
---

## Table of contents

1. [Play module scope & structure](#1-play-module-scope--structure)
2. [Data model — Game, GamePlayer, GameLog](#2-data-model--game-gameplayer-gamelog)
3. [Engine singleton removal & seeded RNG](#3-engine-singleton-removal--seeded-rng)
4. [EOT as a normal dispatched input](#4-eot-as-a-normal-dispatched-input)
5. [InputOutcome contract](#5-inputoutcome-contract)
6. [State serialization — pack_game_state](#6-state-serialization--pack_game_state)
7. [Headless engine via DEBUG flag](#7-headless-engine-via-debug-flag)
8. [Replay strategy](#8-replay-strategy)
9. [Frontend context (deferred, informational only)](#9-frontend-context-deferred-informational-only)

---

## 1. Play module scope & structure

### Context
The engine (`engine/`) is a working first pass — a CLI-driven, single-process, single-game simulator (`engine/loop.py`'s `__main__` loop). The goal now is a very thin backend module, `play/`, that lets a web frontend drive that same engine per-room over HTTP, with no accounts/auth yet. Proposed layout:

```
play/
    game/
        crud -> create_game(), update_game_completed(bool), read_game_state(room_id)
    action/
        crud -> create_action(game_id, raw_input_string)
```

`create_game` spins up `start_game()`-equivalent logic but with a deterministic seed instead of true randomness. `create_action` sends a raw DSL input string into the engine and returns the result + updated game state.

### Discussion points
None — this was the opening proposal and wasn't contested; the rest of the conversation was about the gaps it exposed in the engine and the exact contract of each backend piece.

### Decision
Build `play/` as described. Everything below resolves the gaps found while mapping this onto the actual engine code.

---

## 2. Data model — Game, GamePlayer, GameLog

### Context
Original sketch:
- `Game`: `room` (uuid4), `player` -> 2 `GamePlayer`s (structured for future >2-player support)
- `GamePlayer`: `player_user_id` (null for now, future FK to a real user), `game_id`
- `GameLog`: `move_number`, `input` (raw DSL string)

Intent: store only the seed, the players, and an ordered log of inputs — the entire game should be reconstructable by replaying the log through the engine from that seed.

### Discussion points
Reviewing the sketch against that intent surfaced three omissions:
- **No `seed` field on `Game`** — needed since the whole reconstruction plan depends on it.
- **No `game_id` FK on `GameLog`** — needed to know which game a log entry belongs to.
- **No ordering on `GamePlayer`** — the engine's `player_id` is positional (0 or 1), and both `game.active_player_index` and the frontend's `?player_id=` param depend on that ordering. An unordered pair of `GamePlayer` rows can't reliably map back to "which one is P0."

### Decision
- `Game` gets a `seed: int` column.
- `GameLog` gets a `game_id` FK.
- `GamePlayer` gets an explicit `player_index: int` (0/1) rather than relying on row/insertion order.

---

## 3. Engine singleton removal & seeded RNG

### Context
Two engine-level blockers came up while mapping `create_game`/`create_action` onto the real code:
- `engine/game.py` defines `game = Game()` as a **module-level singleton**, and `engine/loop.py`'s `start_game()`, `next_turn()`, `is_game_over()` all reach for that global rather than taking a `Game` instance. This works for one CLI session but breaks the moment the backend needs more than one concurrent room.
- Randomness (`Player.draw()`'s `random.randrange`, `resolver.py`'s `random.sample`) calls the bare global `random` module, not a per-instance seeded RNG. Since the whole reconstruction plan (§2) depends on determinism from a `Game.seed`, using the shared global module means two concurrent rooms (or any other incidental `random.*` call in the same process) would perturb each other's sequences and break replay.

### Discussion points
No disagreement — these were raised as blocking gaps and accepted as such. Not fully designed yet (e.g. exact mechanism for threading a `random.Random(seed)` instance through `draw()` and `resolver.select_target`), just confirmed as required before `play/` can work with more than one room.

### Decision
Both need to be fixed as part of this work:
- De-globalize `engine/game.py` — `Game` instances get created and passed explicitly, not read from a module-level singleton.
- Give each `Game` its own `random.Random(seed)` instance and thread it through `Player.draw()` and `resolver.py`'s target selection, replacing the bare `random.*` calls.

---

## 4. EOT as a normal dispatched input

### Context
In `engine/loop.py`'s CLI loop, ending a turn (`"EOT"`) is special-cased outside `read_raw_input` — the loop checks for it directly and calls `next_turn()` itself, rather than `read_raw_input` dispatching it like `summon`/`act`/`show`/`read`.

### Discussion points
Flagged because `create_action` only has one entry point (a raw input string) — if `EOT` isn't dispatchable through `read_raw_input`, the backend would need its own special-cased branch duplicating the CLI loop's logic. Also noted: once `next_turn()` no longer reads the global `game` singleton (§3), it needs a `Game` param — and the current dispatch convention (`action(**params, board=game.board)`) passes `board` alone, which doesn't fit `next_turn`'s needs (it operates on the whole `Game`, not just the board). This should be standardized as part of the same de-singleton pass — dispatched actions take `game`, not bare `board`.

### Decision
`EOT` moves into `read_raw_input` as a normal dispatch target, resolved via the same mechanism as `summon`/`act`/`show`/`read`.

---

## 5. InputOutcome contract

### Context
Engine action methods (`Player.summon`, `.act`, `.read`, `.show`) currently return a bare string for both success ("Player 0 summoned...") and rejection ("Not enough mana", "Not a valid move") — there's no boolean or exception to distinguish them. `create_action` needs that signal both to build a response and to decide what gets written to `GameLog`.

### Discussion points
Two mechanisms were considered:
1. Engine raises a specific exception on rejection paths, returns a plain string on success; `play/tools.py` catches it and builds the outcome.
2. Engine returns a structured value directly — no exceptions, no string-matching in the backend layer.

(2) was chosen as cleaner. Follow-up question raised: does the model need a generic payload field for cases like `show`, which currently returns `list[Position]` rather than a string? Resolved by re-confirming the original spec — the model is fixed at exactly two fields, so `show`'s destination positions get serialized into the string field (e.g. a formatted list of position codes) rather than adding a third field.

A related logging question was raised: should every dispatched input increment `GameLog.move_number`, including query-only actions (`show`/`read`, which don't mutate state or cost mana) and game-rule rejections (not just malformed/unparseable input)? Resolved as: log everything that reaches dispatch — only truly unparseable input (`read_raw_input` returning `(None, None)`) is skipped entirely.

### Decision
- `InputOutcome(valid: bool, outcome: str)` — a plain dataclass defined at the top of `engine/entities/player.py`.
- `summon`, `act`, `read`, `show` all return `InputOutcome` directly (not exceptions, not bare strings/lists).
- `create_action` logs every dispatched input (success, game-rule rejection, query-only) to `GameLog`, incrementing `move_number` each time. Only unparseable input (parse failure in `read_raw_input`) is skipped — not logged, no move number consumed.

---

## 6. State serialization — pack_game_state

### Context
`Board`, `Player`, and `Piece` have no JSON-friendly representation today. Both `read_game_state` and `create_action`'s response need to return the full game state to the frontend.

### Discussion points
None — agreed immediately as necessary, explicitly called out as real implementation work rather than simple wiring.

### Decision
A single `pack_game_state(game) -> dict` function in `play/tools.py`, used by both `read_game_state` and `create_action`.

---

## 7. Headless engine via DEBUG flag

### Context
`start_game()` in `engine/loop.py` calls `print_bag`/`print_layout` as part of setup — fine for the CLI, not wanted when driven from the backend.

### Discussion points
None — quick resolution.

### Decision
A module-level `DEBUG` constant resolved from an env var at import time (same pattern as the style guide's `GENERATION_MODE`), gating the print calls so the backend path runs headless while the CLI path (`DEBUG=True`) keeps its current behavior.

---

## 8. Replay strategy

### Context
Original open question: does reconstructing a game from `seed` + `GameLog` mean replaying the *entire* log on every `create_action`/`read_game_state` call (simple, stateless, but slower as a game grows), or does the backend keep a live in-memory `Game` per `room_id` (faster, but inconsistent across multiple worker processes / broken by restarts)?

### Discussion points
Resolved by clarifying the actual call pattern: `create_action` already returns the freshly updated `pack_game_state(game)` in its response, so the frontend never needs a separate `read_game_state` call right after acting. That means `read_game_state`'s full replay only ever gets invoked on room load/refresh — not after every action — which makes the "always fully replay from seed + log" approach cheap enough for this prototype without needing any cache.

### Decision
Both `create_action` and `read_game_state` do a full replay from `Game.seed` through `GameLog` (using the seeded RNG from §3) to reconstruct state — `create_action` then applies and logs the new input and returns the packed state; `read_game_state` just replays and returns. No in-memory cache, no live per-room `Game` store — avoids the multi-worker consistency problem entirely for this first pass.

---

## 9. Frontend context (deferred, informational only)

### Context
Provided only as context for where this is heading, not part of the current backend mapping:
- `/play` — a "start game" button that calls `create_game`, gets a `room_id`, navigates to the room as either player 0 or 1.
- `/play/room?room_id={room_id}&player_id={player_id}` — has an "invite other player" link (simple copy/share, no auth). On load, calls `read_game_state` once. Gives the active player input control; player actions get translated (translation details deferred) into a raw DSL string sent to `create_action`, which returns updated state used to refresh both ends (a webhook-triggered update was mentioned, mechanism TBD). Visual layout should mirror `engine/loop.py`'s print functions (board, shelves, bag), reusing/extending existing frontend components — e.g. small filled/empty circles for current/total mana instead of a bare number, a shelf of tokens instead of printed names.

### Discussion points / Decision
None — explicitly flagged as future work, not to be designed now.
