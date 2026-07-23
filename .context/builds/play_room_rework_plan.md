---
name: Plan — /play/room Page Rework
description: Layout split (main/sidebar, hand-left, board flip), End Turn button, hidden enemy hand, raw-input removal, chrome/game palette reclassification
type: plan
---

## Scope

**In:** layout split (main 4/5 + sidebar 1/5, hand/board/hand 1/5|3/5|1/5, own hand always left, board flip for player1), End Turn button, hide enemy hand piece details (server-side), remove raw-input box, apply chrome palette to non-board/piece/mana chrome.

**Out (deferred):** websocket/live game-state sync — separate pass.

**Deliverable:** plan only, no timeline. **Sequencing:** paired backend+frontend per vertical slice.

**Migration impact:** none — no ORM model changes.

## Decisions (locked)

1. **Palette reversal.** `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `TurnStatus`, new `Sidebar`/`EndTurnButton` move game→chrome domain. Only `Board`, `BoardSquare`, `Piece/*`, `ManaToken` stay game-domain. `design_brief.md` updated to match (narrows "applies to" lists both directions, lines 11/27/96/98/117 as currently written).
2. **Board flip** — reorder row/col iteration in `Board.tsx` (not CSS `transform`) so player1 sees row0 top / row6 bottom, columns mirrored, "like chess." Reorder-not-transform keeps any future coordinate labels/piece art upright.
3. **Hidden hand — server-side.** `pack_game_state` gains `viewer_index: int`; shelf entries where `player.player_id != viewer_index` return redacted placeholders (`name`/`archetype`/`summon_cost` → `null`, `hidden: true`). `ShelfPieceResponse` fields become optional + `hidden: bool`.
   - Auth fix: `read_game_state` switches from generic `require_auth` to the already-existing `require_game_access` (`backend/play/auth.py:94-101`) to get `seat_index` for redaction — also closes a real gap (any authed user could read any game's full state).
   - `create_action` already has `seat_index` via `GameActivePlayerAuthContext` — thread it through.
4. **Raw input removal** — confirmed safe. Grammar is exactly `{EOT, Sn@target, origin@target}`; drag/drop already covers the latter two. Delete `ActionInput.tsx` entirely once End Turn button ships (no dead files).
5. **Piece detail join** — extract `PieceCard.tsx`'s inner markup into non-draggable `frontend/app/_components/PieceDetailCard.tsx`; catalog's `PieceCard.tsx` becomes a thin `useDraggable` wrapper around it; room sidebar renders it directly. Room fetches `GET /pieces/full` once, joins by `name`.
6. **Reveal scope** — hidden applies to opponent's hand only; board pieces stay fully visible to both (already true).
7. **End Turn button placement** — under the own hand column in the Main panel (not sidebar) — "own hand always left" makes that the stable reference point.
8. Sidebar detail-view click is decoupled from turn/active-player gating (read-only, no mutation) — unlike the existing move-preview click which stays gated to `isActivePlayer`.

## Backend structure

```
backend/play/
  tools.py            [edit] pack_game_state(engine_game, log, viewer_index) — redact opponent shelf
  game/crud.py         [edit] read_game_state: require_auth -> require_game_access; ShelfPieceResponse fields optional + hidden:bool
  action/crud.py       [edit] pass auth.seat_index into pack_game_state
```

## Route inventory

| File | Route fn | Method/Path | Preconditions |
|---|---|---|---|
| `game/crud.py` | `read_game_state` | `GET /games/{room}/state` | 404 game_not_found, 403 not_seated (new), 422 game_not_full |
| `action/crud.py` | `create_action` | `POST /actions/{room}` | unchanged (already seat-scoped) |

## Frontend

```
frontend/app/(protected)/play/room/
  PlayRoom.tsx                    [edit] panel/sidebar layout, own/opponent left-ordering, selected-piece state, /pieces/full fetch, delete ActionInput render
  _components/
    MainPanel.tsx                 [new] Hand(1/5)|Board(3/5)|Hand(1/5), own hand always left
    Sidebar.tsx                   [new] PieceDetailPanel (top) + GameLogPanel (bottom), chrome
    PieceDetailPanel.tsx          [new] renders PieceDetailCard for selected piece, idle placeholder
    EndTurnButton.tsx             [new] chrome button, calls existing handleSubmitAction('EOT')
    PlayerPanel.tsx               [edit] chrome repaint, onSelectPiece wiring
    PlayerShelf.tsx               [edit] chrome repaint, blank-token render when piece.hidden
    GameLogPanel.tsx              [edit] chrome repaint
    TurnStatus.tsx                [edit] chrome repaint
    ActionInput.tsx               [deleted]
frontend/app/_components/
  Board.tsx                       [edit] flipped prop, row/col reorder
  PieceDetailCard.tsx             [new] extracted non-draggable detail body
frontend/app/(protected)/catalog/_components/PieceCard.tsx  [edit] thin wrapper around PieceDetailCard
frontend/app/(protected)/play/types.ts                      [edit] ShelfPiece: hidden:boolean, name/archetype/summon_cost -> optional
.context/design_brief.md                                    [edit] narrow game-domain lists
```

## Slice sequence

1. Backend redaction + auth fix (`tools.py`, `game/crud.py`, `action/crud.py`) + `types.ts` update
2. Frontend layout restructure (Main/Sidebar split, hand-left ordering, `Board` flip prop)
3. `PlayerShelf` hidden-piece rendering (depends on 1)
4. `PieceDetailCard` extraction + Sidebar detail view (depends on 2)
5. `EndTurnButton` (independent, under own-hand column)
6. Delete `ActionInput` (depends on 5 landing first)
7. Chrome repaint pass + `design_brief.md` update (last)

**Dependency chain:** 1->3, 2->4, 5->6, all->7.

## Risk flags

- Auth swap on `read_game_state` changes response for any caller relying on unscoped access — none found, but sanity-check.
- `pack_game_state` signature change — both call sites must update together.
- Deleting `ActionInput.tsx` removes the only raw-input escape hatch — low risk (grammar fully covered) but irreversible without a git revert.
- `design_brief.md` edit touches a doc whose Status line says a prior repaint is "in progress" — confirm not still mid-flight elsewhere.

## Safe cuts (last->first)

1. Chrome repaint (slice 7) — cosmetic only
2. Sidebar detail view (slice 4) — page works without it
3. Board flip (part of slice 2) — playable either way
4. Hidden-hand redaction (slices 1+3) — real integrity fix, recommend not cutting
5. End Turn + ActionInput removal (5+6) — explicitly requested, cheapest, keep
