# Audit: creating_backend_routes — 2026-07-12

**Guide:** `guides/creating_backend_routes.md`
**Scope:** whole project (none given)

**Files in scope:**
- `backend/routes.py`
- `backend/play/__init__.py`
- `backend/play/action/crud.py`
- `backend/play/action/preview.py`
- `backend/play/action/__init__.py` (empty)
- `backend/play/game/crud.py`
- `backend/play/game/preview.py`
- `backend/play/game/__init__.py` (empty)
- `backend/play/tools.py` (adjacent — referenced by routes, checked against tool-function constraints)

---

## Findings

### 1. `backend/play/game/crud.py:72` — collection-root path uses `"/"` instead of `""`
```python
@router.post("/", response_model=GameResponse)
```
**Rule:** "Collection routes use an empty path string, not `"/"`... must be `@router.post("")`." This resolves to `/games/` which the frontend `/api` proxy can only reach via a cross-origin `307` that drops the session cookie.
**Reason found:** none. **Rating: 0/5.**

---

### 2. `backend/routes.py:62` and `:77` — missing `response_model`
```python
@router.post("/room/{room_id}/start")
def start_room(room_id: int, body: dict) -> dict:
...
@router.get("/room/{room_id}/state")
def get_room_state(room_id: int) -> dict:
```
**Rule:** "Every route decorator... must include `response_model=` specifying a Pydantic `*Response` model. No decorator may omit `response_model`."
**Reason found:** in-memory game state shape is driven by the engine's `_serialize_state`, not a fixed schema — plausible motive for avoiding a Pydantic model, but not stated in code and doesn't satisfy the guide. **Rating: 1/5.**

---

### 3. `backend/routes.py:63` — request body untyped (`body: dict`)
```python
def start_room(room_id: int, body: dict) -> dict:
```
**Rule:** Route file order section expects two-tier Pydantic naming (`{Action}{Resource}Request`) for request bodies, not raw `dict`.
**Reason found:** none. **Rating: 0/5.**

---

### 4. `backend/play/game/crud.py:74` and `:93` — handlers return raw ORM object, not `*Response`
```python
def create_game() -> Game:
    ...
    return game

def update_game_completed(room: UUID, request: UpdateGameCompletedRequest) -> Game:
    ...
    return game
```
**Rule:** "Route handlers must return a Pydantic `*Response` model, never a raw SQLAlchemy ORM object or `dict`."
**Reason found:** `response_model=GameResponse` (with `from_attributes=True`) makes FastAPI coerce the ORM object at the boundary, so it works functionally — but the guide's stated risk (unmapped-field leakage, lazy-load crash) still applies since nothing in the handler body itself guards it. **Rating: 1/5.**

---

### 5. `backend/play/game/crud.py:83` — handler returns raw `dict`, not `*Response`
```python
def read_game_state(room: UUID) -> dict:
    ...
    return pack_game_state(engine_game, log)
```
**Rule:** same as above — no raw `dict` returns from handlers.
**Reason found:** same FastAPI-coercion mitigation as #4. **Rating: 1/5.**

---

### 6. `backend/routes.py:1-7` — import order violation
```python
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.websockets import manager
from utils.errors import assert_preconditions
from engine.context import get_room, set_current_game, reset_current_game
from engine.engine import process_action, save_snapshot_async, _serialize_state, initialize_room
```
**Rule:** "group as standard library → third-party → internal... Separate each group with a single blank line. Never mix groups or omit blank lines between them." No blank line between stdlib (`asyncio`, `json`) and third-party (`fastapi`), nor between third-party and internal (`utils.*`, `engine.*`).
**Reason found:** none. **Rating: 0/5.**

---

### 7. `backend/routes.py:58` — `print()` in route file
```python
print(f"[ws] unexpected error in room {room_id}: {e}")
```
**Rule:** "No logging unless explicitly asked. No `print(...)`, `logging.*`, or `logger.*` calls in route or service files."
**Reason found:** none. **Rating: 0/5.**

---

### 8. `backend/play/action/crud.py`, `preview.py`, `game/crud.py:read_game_state` — no try/except around non-trivial calls
`create_action`, `preview_action`, and `read_game_state` all call `replay_game(...)` (DB query + engine replay) and `dispatch_input(...)` with no surrounding try/except.
**Rule:** "Route handlers that call non-trivial external/I/O service functions must wrap them in try/except so a 500 stack trace does not reach the client."
**Reason found:** internal failures are already funneled through `assert_preconditions`/`RuntimeError` rather than raw exceptions, which narrows (but doesn't eliminate) the chance of an unguarded 500. **Rating: 1/5.**

---

### 9. `backend/play/tools.py:70` — unguarded `None` access on `dispatch_input`
```python
log = [dispatch_input(engine_game, entry.input).outcome for entry in logs]
```
`dispatch_input` is typed `InputOutcome | None` (confirmed at `tools.py:51`) and returns `None` when `read_raw_input` can't parse an action. Every call site in the route files guards this with `assert_preconditions` before touching `.outcome` — this one, inside `replay_game`, does not.
**Rule (adjacent):** "Service functions that can return `None` on a miss must have their return value None-checked in the calling route before use." Not literally a route file, but the same unguarded-None pattern the rule exists to prevent — a single unparseable historical log entry will crash `replay_game` with `AttributeError`.
**Reason found:** none. **Rating: 0/5.**

---

## Notes outside guide scope (flagged, not rule violations)

- `backend/routes.py:6-7` imports `engine.context` and `engine.engine` — **neither module exists** in `backend/engine/` (only `game.py`, `loader.py`, `loop.py`, `resolver.py`, `entities/`, `enums/`, `utils/` are present). `routes.py` cannot currently be imported without raising `ModuleNotFoundError`. Worth root-causing regardless of this guide.
- `backend/:memory` — stray file at backend root, doesn't match any known convention. Confirm whether intentional (e.g. sqlite artifact) or accidental.

## Compliant highlights (no violation, noted for completeness)
- `action/crud.py` importing `GameStateResponse` from `game/crud.py` rather than redefining it — matches the "reading a resource inside a route for another resource" rule exactly.
- `play/tools.py` extraction of `replay_game`/`dispatch_input`/`pack_game_state` meets the reuse threshold and keeps tool functions free of `HTTPException`/`Depends`/`Request`/`Response`, with non-CRUD-style verb names.
- `assert_preconditions` (not raw `HTTPException`) used consistently across all four CRUD/preview route files for `None`-checks before attribute access.
