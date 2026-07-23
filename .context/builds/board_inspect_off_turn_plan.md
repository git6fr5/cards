# Board Inspect Off-Turn — Plan

## Scope
**In:** true-requester identity for read-only preview actions (board `#`/`!`, shelf `#`); frontend gates loosened to match (board square inspect, shelf inspect); highlight-overlay inset shrink; close the preview endpoint's missing-auth hole as a byproduct of adding identity.
**Out (deferred):** any change to mutating actions (`@` act/summon, `EOT`) — already correctly turn-gated via `require_game_active_player_access`, untouched.
**First-class:** correctness of `show()`'s ownership check once bound to true requester; auth dependency reuse (`require_game_access`, no new resolver needed).
**Migration impact:** none — no ORM change.
**Build order:** backend before frontend.

## Decisions (locked)
1. `read_raw_input(raw_input, game, viewer_index=None)` — defaults to `game.active_player_index` when omitted, so `loop.py` and replay-log paths (`tools.py` internal replay) are untouched.
2. `dispatch_input(engine_game, raw_input, viewer_index=None)` — same default-preserving threading, one param passthrough.
3. `preview.py` gains `auth: GameAuthContext = Depends(require_game_access)` (reused, not new) and passes `viewer_index=auth.seat_index` into `dispatch_input`. Also fixes preview's current total lack of auth.
4. `crud.py` (mutating endpoint) — no change; already resolves `auth.seat_index == active_player_index` via `require_game_active_player_access`.
5. `BoardSquare.tsx` `canInspect = !!piece` (was `isActivePlayer && !!piece`); `canDrag` unchanged.
6. `BoardSquare.tsx` overlay `inset-0` → `inset-1` (raw value — no project spacing tokens exist, colors only).
7. `PlayerShelf.tsx` — split `canInteract` into `canDrag = isOwn && isActivePlayer` (drag/summon) and gate the read-click (`onSelectShelf`) on `isOwn` alone.

## Backend structure
```
backend/engine/utils/input_parser.py   [edit] read_raw_input signature + player-resolution line
backend/play/tools.py                  [edit] dispatch_input signature + passthrough
backend/play/action/preview.py         [edit] add auth dep, pass viewer_index
```
No new files, no new package surface.

## Route inventory
| File | Route fn | Method/path | Preconditions |
|---|---|---|---|
| `preview.py` | `preview_action` | `POST /{room}/preview` | 404 `game_not_found` (existing); new: 404 `game_not_found` / 403 `not_seated` via `require_game_access` (existing dep, existing errors) |

## Frontend
| Component | Change | Data |
|---|---|---|
| `BoardSquare.tsx` | `canInspect` drop turn check; overlay inset | `piece`, unchanged props |
| `PlayerShelf.tsx` | split `canInteract` → `canDrag` + own-gated read | `shelf`, `isOwn`, `isActivePlayer` — no prop shape change |

No `utils/api.ts` change.

## Slice sequence
1. **Backend** — thread `viewer_index` through `input_parser.py` → `tools.py` → wire `preview.py` auth.
2. **Frontend** — `BoardSquare.tsx` gate + inset; `PlayerShelf.tsx` gate split.

## Dependency chain
Slice 2 behaviorally depends on Slice 1 — build backend first, frontend second.

## Risk flags
- `preview.py` currently has no auth at all — adding `require_game_access` tightens access (previously-reachable unauthenticated calls now 401/403).
- `show()`'s `self.owns(piece)` check, once bound to true requester, changes meaning for the enemy-piece-off-turn case: today it evaluates against active player (coincidentally passes since active player owns their own piece); after the fix it correctly returns "Not your piece!" for enemy pieces (no legal-move highlight), while `#` read still succeeds.
- None of the touched files are on `.shared-paths` — no copybara sync needed.

## Safe cuts (last to first)
1. Shelf gate fix (decision 7) — cuttable independently, board fix stands alone.
2. Highlight inset resize — pure cosmetic, cuttable independently.
3. Preview auth/viewer_index fix — core ask, not cuttable.
