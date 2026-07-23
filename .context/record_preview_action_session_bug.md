# Record: Preview Action `replay_game` Session Bug

## Contents
1. [Bug: missing session arg in preview_action](#1-bug-missing-session-arg-in-preview_action)
2. [Discussion: should replay_game use Context instead?](#2-discussion-should-replay_game-use-context-instead)

---

## 1. Bug: missing session arg in preview_action

### Context
`POST /actions/{room}/preview` was throwing `TypeError: replay_game() missing 1 required
positional argument: 'game_row'` on every call, surfaced via a websocket-adjacent HTTP 500 in the
play room. `replay_game`'s signature is `replay_game(session: Session, game_row: Game)`
(`backend/play/tools.py:96`); `preview_action` in `backend/play/action/preview.py:37` was calling
it with only `game_row`, a stale call site left behind when the signature picked up the `session`
parameter (three other call sites — `play/auth.py:114`, `play/game/crud.py:117`,
`play/action/crud.py:44` — already pass it correctly).

### Discussion points
None — straightforward stale call site once the current signature was located.

### Decision
Pass `DatabaseConnection.session()` as the first argument in `preview_action`, matching the
pattern already used in `game/crud.py` and `action/crud.py`. No signature change needed.

---

## 2. Discussion: should replay_game use Context instead?

### Context
Before fixing the call site, raised whether `replay_game`/`game_is_full` taking an explicit
`session: Session` param at all was itself the bug — `standard_utils.md` says DB access should go
through the `DatabaseConnection` wrapper / `current_session` ContextVar, not raw `Session`
instances passed around.

### Discussion points
Initial read: this looked like an artefact — `game/crud.py` and `action/crud.py` already just
pass `DatabaseConnection.session()` through, so dropping the param and having `replay_game` call
`DatabaseConnection.execute(...)` internally seemed like the cleaner fix.

Checked `play/auth.py` before acting on that: `require_game_active_player_access` (a FastAPI
`Depends`) calls `game_is_full(session, ...)` and `replay_game(session, game_row)` at
lines 111-114, inside a manually-opened `with Session(init_engine()) as session:` block. FastAPI
resolves `Depends` functions *before* the endpoint's own `@read_resource`/`@write_resource`
decorator runs, so `current_session` isn't set yet at that point — `auth.py` has no choice but to
open and pass a raw session. This pattern is consistent across the whole file (`_load_player_id`,
`_load_bag_player_id`, `_load_game_and_seat`, `_resolve_websocket_auth` all do the same).

So the explicit-session param on `replay_game`/`game_is_full` is required by a real dual-context
need (pre-decorator auth dependency vs. inside-decorator route body), not leftover cruft.
Refactoring it to `DatabaseConnection`-only would break `auth.py`.

### Decision
Leave `replay_game`/`game_is_full`/`_load_seat_pieces` signatures as-is (explicit `session`
param). Only fix the one stale call site in `preview.py`. No broader refactor.
