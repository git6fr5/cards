---
name: Plan — /play/room WebSocket Game-State Push
description: Real-time push of game state after each action, replacing the dead/broken legacy websocket route
type: plan
---

## Scope

**In:** websocket push notification for `/play/room` game state — REST stays the only mutation path; socket broadcasts fresh per-viewer state after each successful action.

**Out:** ticket-based WS auth fallback (only needed if same-origin proxy fails in practice — a sibling project already validated this transport works, not expected to be needed here).

**Deliverable:** plan only. **Sequencing:** paired backend+frontend per slice.

**Migration impact:** none.

## Prior art referenced

`/Users/Development/Web/wills/.context/record_testament_ws_and_owner_access.md` and
`.../builds/testament_ws_and_owner_access_plan.md` — a sibling project's prior WS-auth build,
verified directly against `backend/testaments/auth.py:267-283` and
`backend/testaments/testament/crud.py:234-238`. Confirmed real (not just described): `Depends()`
works on `@router.websocket()` routes; the pattern is a WS-typed sibling dependency
(`require_testament_access_ws(testament_id, websocket: WebSocket)`) reading
`websocket.headers`/`websocket.cookies` instead of `request.cookies`/`Header()`, delegating to the
same underlying resolver as the HTTP dependency — no parallel business logic, only a different
transport front door. Also confirmed cards' `frontend/hooks/useWebSocket.ts` (a shared path) is
already in that project's "fixed" post-migration shape (`resourceType`/`resourceId` pair,
same-origin URL via `window.location`) — no transport work needed here, only a type widen.

## Decisions (locked)

1. Push-only architecture — REST (`POST /actions/{room}`) unchanged as sole mutation path; socket broadcasts result afterward. No client->server action frames (rejects the dead code's SUMMON/MOVE/ACTIVATE/END_TURN frame design).
2. `backend/routes.py` deleted outright — imports `engine.engine`/`engine.context`, neither module exists in current `engine/` package (`entities/`, `enums/`, `game.py`, `loader.py`, `loop.py`, `resolver.py`, `utils/` only). Broken, unregistered, zero live consumers of its `ConnectionManager` usage.
3. Seat-index bookkeeping lives locally in the new `play/game/socket.py` module (a plain `dict[WebSocket, int]`) — `backend/utils/websockets.py`'s shared `ConnectionManager`/`connect_websocket` stays untouched (already generic, no domain leak), reused for connect/track/disconnect only.
4. Auth: new `require_game_access_ws(room: UUID, websocket: WebSocket) -> GameAuthContext` in `play/auth.py` — WS-typed sibling of `require_game_access`, same return type (no new subclass needed, `GameAuthContext` already carries `seat_index`). Composes the same plain resolvers `require_game_access` already uses (`_load_player_id`, `_load_game_and_seat`) plus a websocket-side bearer-then-cookie resolution mirroring `require_auth` (reading `websocket.headers.get("authorization")` / `websocket.cookies.get(SESSION_COOKIE_NAME)` instead of `request`), opening its own DB session like every other `Depends()` resolver here. `Depends()` on the websocket route, per verified-working precedent.
5. `useWebSocket.ts`: widen `resourceId: number` -> `resourceId: string | number` (shared path, nothing else currently uses the hook).
6. Client trusts the pushed state wholesale — `setGameState(pushed)` directly, same `GameStateResponse` shape as the REST fetch.

## Backend structure

```
backend/play/
  auth.py              [edit] require_game_access_ws sibling dependency
  game/socket.py       [new] @router.websocket("/{room}/ws"), per-connection seat tracking, broadcasts pack_game_state(..., seat_index) per socket
  __init__.py          [edit] include_router(socket_router, prefix="/games")
  action/crud.py       [edit] after successful action, push updated state to any connected sockets in the room
backend/routes.py      [deleted]
```

## Route inventory

| File | Function | Path | Notes |
|---|---|---|---|
| `play/game/socket.py` | `game_websocket` | `WS /games/{room}/ws` | `Depends(require_game_access_ws)` |

## Frontend

| File | Change |
|---|---|
| `frontend/hooks/useWebSocket.ts` (shared) | `resourceId: string \| number` |
| `frontend/app/(protected)/play/room/PlayRoom.tsx` | `useWebSocket('games', room, onMessage)`; `onMessage` sets `gameState` directly |

## Slice sequence

1. Backend: `require_game_access_ws` + `play/game/socket.py` (route + local seat tracking + a `push_state(room, engine_game, log)` helper)
2. Backend: `action/crud.py` calls `push_state` after a successful action
3. Delete `backend/routes.py`
4. Frontend: hook widen + `PlayRoom.tsx` wiring

## Dependency chain

1->2 (route must exist before action route can push to it). 3 independent. 4 depends on 1 existing to test against.

## Risk flags

- FastAPI `Depends()` failure behavior on a websocket route before `.accept()` — flagged as needing build-time verification in the sibling project too, not independently re-verified beyond `py_compile`.
- Cannot run the dev server (standing rule) — the actual live connection can't be verified locally; needs testing after deploying.
- `action/crud.py` pushing to sockets creates a one-directional coupling to the socket module — `play/game/socket.py` exposes `push_state(...)`, `action/crud.py` calls it, never the reverse.

## Safe cuts (last -> first)

1. Deleting `routes.py` — cosmetic cleanup, no functional dependency
2. Nothing else should be cut — small, single-purpose slice; hidden-hand redaction already shipped without it (this pass only adds liveness)
