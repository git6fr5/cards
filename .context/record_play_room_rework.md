---
name: Record — /play/room Page Rework
description: Layout split into main/sidebar panels, End Turn button, server-side hidden-hand redaction, raw-input removal, and a narrower chrome/game palette boundary
type: record
---

## Contents

1. [Initial scope — six requests, one deferred](#1-initial-scope--six-requests-one-deferred)
2. [Websocket/webhook check — investigated, real-time sync deferred](#2-websocketwebhook-check--investigated-real-time-sync-deferred)
3. [Palette conflict — narrowing the game domain](#3-palette-conflict--narrowing-the-game-domain)
4. [Board flip and hand-left ordering](#4-board-flip-and-hand-left-ordering)
5. [Server-side hand redaction and the auth gap it surfaced](#5-server-side-hand-redaction-and-the-auth-gap-it-surfaced)
6. [Raw input removal — confirming drag/drop covers the full grammar](#6-raw-input-removal--confirming-dragdrop-covers-the-full-grammar)
7. [Piece detail sidebar — reusing the catalog card](#7-piece-detail-sidebar--reusing-the-catalog-card)

---

## 1. Initial scope — six requests, one deferred

### Context

The `/play/room` page was flat and unstructured (screenshot showed hands flanking the board with no sidebar), and the user listed seven asks: layout split into main/sidebar panels, a webhook/game-state check, an End Turn button, hiding enemy hand piece details, hiding the raw-input box now that drag/drop exists, and (added later) applying the site's chrome palette to non-board/piece/mana UI.

### Discussion points

An investigator subagent surveyed the whole area first (`PlayRoom.tsx`, room `_components/`, `Board`/`BoardSquare`, catalog's `PieceCard`, backend `pack_game_state`, the unused `useWebSocket` hook) before any planning, per this project's "read before build" convention. User then split the work: websockets deferred to "a separate pass," the rest (1, 3, 4, 5, 6/7) scoped via `/plan`.

### Decision

Build everything except websocket/live-sync in this pass. Plan locked and saved to `.context/builds/play_room_rework_plan.md`.

---

## 2. Websocket/webhook check — investigated, real-time sync deferred

### Context

User asked to "check if webhooks for getting game state is working."

### Discussion points

Investigation found `useWebSocket.ts` exists but is imported nowhere — `PlayRoom.tsx` does a single REST fetch on mount with no polling, so an opponent's move never appears without a manual reload. A websocket route does exist server-side (`backend/routes.py`) but is dead code: never registered in `main.py`, and it imports from `engine.engine`/`engine.context` modules that look like an earlier, superseded engine implementation, not the one `play/` actually uses.

### Decision

No fix applied this pass — user explicitly said "let's do webhooks in a separate pass." Recorded here as a known gap: real-time sync needs either resurrecting `routes.py`'s route (after verifying it still matches the live engine) or a fresh websocket endpoint under `play/` paired with the already-unused frontend hook.

---

## 3. Palette conflict — narrowing the game domain

### Context

`.context/design_brief.md` (from a prior session's board/chrome domain pivot) classified `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `TurnStatus`, and `ActionInput` as **game domain** (dark/wood palette). The user's new ask 6/7 — "main panel and sidebar and everything uses chrome colours... only board squares, mana and piece tokens dip into game colours" — was narrower, meaning those four components would flip game→chrome.

### Discussion points

Flagged explicitly rather than silently overridden, since it reversed a previously locked design decision. User confirmed: "yes" to the reversal, and "yes" to updating `design_brief.md` to match.

### Decision

Game domain narrowed to exactly `Board`, `BoardSquare`, `Piece/*`, `ManaToken`. Everything else in the room (`PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `TurnStatus`, plus the new `Sidebar`/`EndTurnButton`) is chrome. `design_brief.md` updated in four places (domain lists + a new Status line) to record the narrowing and point at this build.

---

## 4. Board flip and hand-left ordering

### Context

Original ask: own hand always renders on the left; for player 1, the board should render flipped so their own back rank sits at the bottom, "like it would in a chess game."

### Discussion points

Investigation found the existing `Board.tsx` already had a fixed row order (`row = BOARD_HEIGHT - 1 - i`) applied identically regardless of player — not a per-player flip. User confirmed the flip should be a full mirror (rows *and* columns) and explicitly required that any coordinate labels stay legible — which ruled out a CSS `transform: rotate` approach (that would flip text upside-down too) in favor of reordering the row/column iteration itself.

### Decision

`Board` gained a `flipped` boolean prop (`player === 1`); row and column iteration order both reverse when flipped, square IDs unaffected. Own-hand-left was simpler than expected: the old layout always rendered `self` second (right); the fix was just rendering `self` first in the new `MainPanel`.

---

## 5. Server-side hand redaction and the auth gap it surfaced

### Context

Investigation found zero redaction anywhere — `pack_game_state` sent full opponent shelf data (name, archetype, cost) to both seats, and the frontend rendered it identically regardless of ownership. User confirmed: real fix, server-side, in `pack_game_state`.

### Discussion points

Implementing this required knowing which seat was asking, which surfaced a separate, real gap: `read_game_state` used the generic `require_auth` dependency — not even scoped to a seated player, so any authenticated user could read any game's full state. User asked directly whether the needed auth context was new or already existed; it already existed (`require_game_access` in `backend/play/auth.py`, already used elsewhere) — just never wired into this one route.

### Decision

`pack_game_state(engine_game, log, viewer_index)` now redacts shelf entries where `player.player_id != viewer_index` to `{name: null, archetype: null, summon_cost: null, hidden: true}`. `read_game_state` switched from `require_auth` to `require_game_access`, closing the scoping gap and supplying `seat_index` for redaction in the same move. `create_action` threads its existing `auth.seat_index` through. Frontend `ShelfPiece` became a discriminated union (`VisibleShelfPiece | HiddenShelfPiece`) rather than optional fields, so hidden-vs-visible narrows cleanly in `PlayerShelf` without assertions.

---

## 6. Raw input removal — confirming drag/drop covers the full grammar

### Context

User wanted the raw-input box hidden now that drag/drop exists, but investigation flagged a risk: `ActionInput` was the only path for any move type drag/drop didn't cover.

### Discussion points

Checked the backend grammar directly (`engine/utils/input_parser.py`): the only mutating verbs are `EOT`, `Sn@target` (summon), and `origin@target` (move/act) — no separate "activate ability" verb. Checked the frontend drag handlers (`PlayerShelf`'s `handleDragStart` sets `S{index}`, `BoardSquare`'s `handleDrop` calls `onDrop(source, square)`): both summon and move/act were already fully reachable via drag/drop. `EOT` was the only gap, and that's exactly what the new End Turn button fills.

### Decision

`ActionInput.tsx` deleted outright (not just hidden) once the End Turn button existed to cover `EOT` — no remaining gap, and the project convention is not to leave known-dead component files around.

---

## 7. Piece detail sidebar — reusing the catalog card

### Context

User wanted clicking a piece (own hand or any board piece) to show full details in the sidebar, reusing the bag-builder's card. Investigation found the catalog's `PieceCard.tsx` was hard-wired to `dnd-kit`'s `useDraggable` and to the richer `PieceFull` type (movement grid, ability text, costs) that in-game `ShelfPiece`/`BoardPiece` don't carry.

### Discussion points

Two options: extend the game-state payload to carry full piece detail inline, or join the clicked piece by name against `/pieces/full` client-side (the same pattern `Catalog.tsx` already uses). User chose the join — no backend payload change needed.

### Decision

Extracted `PieceCard`'s inner markup into a new, non-draggable `frontend/app/_components/PieceDetailCard.tsx`; catalog's `PieceCard.tsx` is now a thin `useDraggable` wrapper around it; the room's `PieceDetailPanel` renders it directly against a piece looked up from a `/pieces/full` fetch done once in `PlayRoom.tsx`. Sidebar detail-view clicks were also deliberately decoupled from the existing turn-gated move-preview clicks (read-only, no mutation, so no reason to gate it to the active player's turn) — a default applied without being asked, flagged as such at plan time.
