---
name: Record — /play/room WebSocket Game-State Push
description: Real-time push replacing the dead legacy websocket route, built on a verified sibling-project auth pattern
type: record
---

## Contents

1. [Scoping — dead code confirmed unsalvageable](#1-scoping--dead-code-confirmed-unsalvageable)
2. [Sibling-project precedent — verified, not just cited](#2-sibling-project-precedent--verified-not-just-cited)
3. [The async gap `require_game_access_ws` surfaced](#3-the-async-gap-require_game_access_ws-surfaced)

---

## 1. Scoping — dead code confirmed unsalvageable

### Context

This was the item deferred in [[record_play_room_rework]] section 2 — the user asked to `/plan` it once the layout rework shipped. Investigation confirmed `backend/routes.py`'s websocket route isn't just unregistered, it's broken: it imports `engine.engine`/`engine.context`, neither of which exists anywhere in the current `engine/` package (`entities/`, `enums/`, `game.py`, `loader.py`, `loop.py`, `resolver.py`, `utils/` only).

### Discussion points

No salvage-vs-rebuild fork remained once that was confirmed — had to rebuild fresh. Also found the shared `ConnectionManager` (`backend/utils/websockets.py`) has zero live consumers today (only the dead file imported it), and the frontend `useWebSocket` hook is already generic/receive-only, which fit a cleaner design than the dead code's client-sends-action-frames approach: keep REST as the only mutation path, socket purely pushes state after.

### Decision

Push-only architecture; `backend/routes.py` deleted outright; seat-index bookkeeping kept local to the new `play/game/socket.py` module rather than extending the shared `ConnectionManager` — user's explicit call, since `backend/utils` is copybara-shared.

---

## 2. Sibling-project precedent — verified, not just cited

### Context

User pointed at `/Users/Development/Web/wills/.context` and asked to search it for prior websocket-auth discussion before locking the auth approach here.

### Discussion points

Found `record_testament_ws_and_owner_access.md` and its build plan — a prior fix in that project for the exact same class of problem (WS auth via `Depends()`, same-origin transport). Rather than taking the record's prose at face value, user explicitly asked "is this how it is done in wills?" after the plan draft repeated the record's claims — prompting a direct read of the actual code (`backend/testaments/auth.py:267-283`, `testament/crud.py:234-238`) rather than trusting the summary. Confirmed exact match: `Depends()` does work on `@router.websocket()` routes; the pattern is a WS-typed sibling dependency reading `websocket.headers`/`websocket.cookies` instead of `request.cookies`/`Header()`, delegating to the same underlying resolver — no parallel auth logic. Also confirmed cards' `useWebSocket.ts` (a shared path) is already in that project's post-migration "fixed" shape (`resourceType`/`resourceId` pair, same-origin URL via `window.location`) — no transport work needed here, only a type widen (`resourceId: number` → `string | number`, since our room id is a UUID string and nothing else uses the hook).

### Decision

`require_game_access_ws(room: UUID, websocket: WebSocket) -> GameAuthContext` added to `play/auth.py`, mirroring the verified wills pattern exactly — reuses the same plain resolvers `require_game_access` already calls (`_load_player_id`, `_load_game_and_seat`), no new `AuthContext` subclass needed since `GameAuthContext` already carries `seat_index`.

---

## 3. The async gap `require_game_access_ws` surfaced

### Context

Implementing the push meant `action/crud.py`'s `create_action` needed to `await push_state(...)` after a successful move — but `create_action` was a plain `def`, decorated with the sync `@update_resource` wrapper.

### Discussion points

Checked `backend/utils/databases.py` for an async counterpart before hand-rolling a threadpool bridge (`asyncio.run_coroutine_threadsafe` or similar) — found `update_resource_async` (`_write_session_async`) already existed, unused, built for exactly this shape (mirrors the sync version, just wraps an `async def`). No new capability needed, just a decorator swap plus making the route function `async def`.

### Decision

`create_action` converted to `async def` under `@update_resource_async`; calls `await push_state(room, engine_game, log)` right before returning. `play/game/socket.py` new file: `router`, module-local `_seat_by_socket: dict[WebSocket, int]`, `push_state()` helper that packs a per-viewer `pack_game_state(..., seat_index)` for each connected socket in the room (not a single shared broadcast payload, since hidden-hand redaction means no two viewers get the same JSON). Registered in `play/__init__.py` under the existing `/games` prefix. `backend/routes.py` deleted. Frontend: `useWebSocket` widened, `PlayRoom.tsx` wires `useWebSocket('games', room, handleSocketMessage, !!gameState)` with a `useCallback`-wrapped handler that trusts the pushed `GameState` wholesale.

Verified DB-free: `py_compile` across every touched backend file, `tsc --noEmit` across the frontend — both clean. Could not verify the actual live websocket connection (no dev server run, per standing rule; same limitation the wills precedent hit) — **outstanding: user needs to test the live connection after deploying**, including FastAPI's `Depends()` failure behavior on a websocket route before `.accept()`, which neither this build nor the wills precedent independently verified beyond compile-cleanliness.
