---
name: Play Frontend Design
description: Design discussion for the /play and /play/room frontend pages — component reuse audit, layout choice, and the small backend addition it required
type: project
---

## Table of contents

1. [Component reuse audit](#1-component-reuse-audit)
2. [Room page layout](#2-room-page-layout)
3. [Shelf/mana slot count (5 vs 7)](#3-shelfmana-slot-count-5-vs-7)
4. [Game log — client-only vs backend-provided history](#4-game-log--client-only-vs-backend-provided-history)
5. [Shared component/registry promotion](#5-shared-componentregistry-promotion)
6. [Body color inference (open assumption)](#6-body-color-inference-open-assumption)

---

## 1. Component reuse audit

### Context
Before planning `/play` and `/play/room`, the frontend was audited for reusable pieces: `app/(protected)/play/_components/` (`GameBoard`, `BoardCell`, `PieceToken`, `PlayerShelf`), `token-builder/_components/` (`TokenCircle`, `TokenGrid`, `TokenDisplay`), and `card-builder/_components/CardMana.tsx`.

### Discussion points
- The existing `play/` page turned out to be wired to the *same abandoned backend architecture* already cleaned up on the backend side (`/game/room/{id}/start`, WebSocket sync, board keyed by `"row,col"`, `Piece.piece_id`/`owner_id`/`body_color`/`move_cost`). Same vintage as the deleted `routes.py`/`sets_routes.py`/`seed.py` — component shapes were still useful as a reference, but the API calls and types needed a full rewrite, not a patch.
- Two competing piece-rendering implementations existed: `play/`'s `PieceToken` (crude, first-letter-of-name) vs `token-builder/`'s `TokenCircle` (real Lucide icon per archetype, matches the notes.md token spec exactly). `TokenCircle` was chosen as the one to standardize on.
- `CardMana.tsx` (card-builder) turned out to be a single numeric badge, not the filled/empty pip track described for mana — confirmed as a gap, not a reuse candidate.
- Checked `globals.css` fresh (per this project's own tailwind-audit rule) rather than trusting `design_brief.md` from memory — found `--color-kingkiller-blue` actually exists, correcting an initial assumption that no blue token was available.

### Decision
Reuse: `BoardCell`'s alternating-shade logic, `TokenCircle` for all piece rendering, `utils/api.ts`'s `get`/`post`, `KingkillerButton`/`KingkillerLoader`/`KingkillerSection`/`KingkillerModal`. Build fresh: a mana pip-track component (didn't exist anywhere). Old `play/_components/` and its `types.ts` marked for full replacement, not extension.

---

## 2. Room page layout

### Context
Per this project's page-creation workflow, four layout directions were proposed for `/play/room`, all built from the audited components:
1. Faithful 3-column mirror (opponent shelf | board | own shelf, matching `engine/loop.py`'s `print_layout` exactly).
2. Board-dominant vertical stack (opponent top, board center, self bottom — chess-app convention).
3. Board-dominant with a fixed right-hand rail stacking both shelves.
4. Vertical print-mirror — board centered, opponent's shelf stacked vertically on the left, own shelf stacked vertically on the right, mana track above each shelf.

### Discussion points
Chose (4), with one addition: a right-hand game log panel, visible only on wide screens (`hidden lg:block`). Confirmed this responsive hide/show doesn't conflict with the project's fixed-layout preference — that rule targets collapsible/toggle patterns, not breakpoint-based responsive visibility.

### Decision
Vertical print-mirror (option 4) plus a wide-screen-only game log panel. Board dead center, opponent shelf left / own shelf right (each vertically stacked, mana track at top), log panel on the far right.

---

## 3. Shelf/mana slot count (5 vs 7)

### Context
While sizing `PlayerPanel`'s shelf and the new mana track, the current engine code was checked directly: `engine/loop.py`'s `next_turn()` draws while `shelf_size < 5` (cap of 5, not 7), and `total_mana` has no ceiling anywhere in the code (grows indefinitely). The user had asked for both to be treated as capped at 7 for sizing purposes.

### Discussion points
Flagged the mismatch explicitly rather than silently building against either the code's actual values or an assumed "7" — three options were laid out: build against what's actually in the code (5 shelf, uncapped mana), have the engine changed to 7 now, or something else. 

### Decision
User will bump both caps to 7 in the engine separately (not part of this frontend work). Frontend components (`PlayerPanel`'s shelf, `ManaTrack`) are sized against 7 now, anticipating that change.

---

## 4. Game log — client-only vs backend-provided history

### Context
The chosen layout added a game log panel, but `GameStateResponse` only returns a snapshot — no history of past move outcomes. The replay loop in `play/tools.py` already produces an `InputOutcome` per replayed move and was discarding it.

### Discussion points
Two options: (1) accumulate outcomes client-side only, resetting on every page refresh since a fresh `read_game_state` has nothing to give it; (2) capture the outcome during replay and add a `log: list[str]` field to `GameStateResponse`, persisting across refresh at near-zero extra cost since the data is already produced during replay.

### Decision
Option 2 — small backend addition. `replay_game` now returns `(EngineGame, list[str])`; `pack_game_state` takes and includes the log; both `read_game_state` and `create_action` thread it through (the latter appending the newly-dispatched outcome before packing).

---

## 5. Shared component/registry promotion

### Context
Implementing the chosen layout required `ARCHETYPES` (archetype → color/icon map, previously in `token-builder/registry.ts`) and `TokenCircle` (previously in `token-builder/_components/`) from a second, unrelated page (`play/room`).

### Discussion points
Per this project's own floating-component rule (page-local components in `_components/` shouldn't be imported by other pages — if genuinely shared across unrelated pages, they belong in a shared location), both were promoted rather than imported cross-page:
- `ARCHETYPES`/`Archetype`/`Effect`/`PieceType`/`BodyColor` → `frontend/utils/archetypes.ts`.
- `TokenCircle` → `components/ui/KingkillerTokenCircle.tsx` (renamed with the required `Kingkiller` prefix for shared design-system components).

An initial attempt to keep a re-export shim in `token-builder/registry.ts` (`export { ARCHETYPES, ... }`) was caught and removed — nothing outside `registry.ts` actually consumed those exports directly, so the re-export was a needless backwards-compat shim rather than a real compatibility need.

### Decision
Both promoted to shared locations; all consumers (`token-builder`'s `TokenCircle`/`TokenGrid`/`TokenDisplay`/`TokenBuilder`, and the new `play/room` components) updated to import directly from the new shared paths, no shims.

---

## 6. Body color inference (open assumption)

### Context
`notes.md` describes token body color (white/black) as a player/faction distinction. The backend's `BoardPiece`/`ShelfPiece` response shapes don't include a `body_color` field at all — only `owner`/no owner field on shelf pieces (shelf pieces belong to the panel's own player implicitly).

### Discussion points
Not explicitly discussed with the user as a decision point — flagged only as a call made during implementation: `BoardSquare`/`PlayerPanel` infer body color directly from `owner`/`player_id` (0 → white, 1 → black), reasonable given the current fixed 2-player, one-archetype-per-side setup, but not backed by an explicit backend field.

### Decision
None reached — flagged as an open assumption worth confirming once seen rendered, not yet validated against actual intent.
