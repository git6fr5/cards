# Plan: Play page — chrome repaint + Icons2 tokens

## Scope

**In:** `Board`/`BoardSquare` (squares + border + select/highlight overlay), `PieceIconCard2` (owner-color border), `ManaToken`/`ManaTrack`, `PlayerShelf` (slots), `PlayRoom`→`MainPanel`→`Board`/`PlayerPanel` prop threading for catalog lookup, Catalog's `DragOverlay` (movement-symbol-only), `design_brief.md` rewrite.

**Out (deferred):** `token-builder` (`TokenBuilder`/`TokenDisplay`/`TokenGrid`) — different data shape (`TokenData` has no `movement_type`/`role_type`), previously explicitly deferred from the original chrome pivot ([[record_board_chrome_domain_pivot]]), stays on the metal-coin `PieceToken` untouched. `Piece/*` coin-emboss system stays in place (still has 3 live importers there) — not orphaned, not deleted.

**Migration impact:** none, frontend-only, no ORM touched.

## Decisions (locked)

1. Game domain retires for play — board, tokens, mana all move to `raja-chrome-*`. This reverses the two-domain split locked in `design_brief.md` / `record_board_chrome_domain_pivot.md`; those docs are stale as of this plan.
2. Board/shelf tokens render full-detail `PieceIconCard2` (Icons2) at its native fixed 4.5cm, not a shrunk variant.
3. Board square container resizes to match Icons2 (4.5cm), not the reverse.
4. Player identity on Icons2: new optional `ownerIndex?: 0 | 1` prop — `0` → `border-raja-chrome-text` (black), `1` → `border-raja-orange`. Placeholder scheme, explicitly revisit-later per user.
5. Mana: new token `raja-chrome-blue` (`#5B6B8C`) for filled state (rendered `fill="currentColor"` for a solid look), `raja-chrome-border` for empty (outline only), `raja-chrome-muted` + `opacity-disabled` for locked. `ManaToken` swaps its circle `div` for a `Gem` icon (project's existing cost icon, from `abilityTranslatorIcons.ts`'s `SUMMON_COST` chip).
6. Board squares alternate `raja-chrome-panel` (grey) / `raja-orange` (existing accent, already Icons2's own border/band color) — no new board token needed.
7. Catalog `DragOverlay` (56px) and any other tiny single-token preview swap from full `PieceToken` to **just the movement-pattern symbol** (`PatternIcon`/`Crown`-for-King, archetype-colored) — extracted from `PieceIconCard2`'s center block into a shared `PieceMovementIcon` component so both consumers use one source, not duplicated logic.
8. `token-builder` excluded from this pass (see Scope/Out).
9. Coin-emboss system (`metalThemes.ts`, `lightSource.ts`, `coinTextures.ts`, `PieceFilterDefs.tsx`, `RingBorder.tsx`) left in place, unused by play but still live for token-builder.

## Frontend structure

```
frontend/app/globals.css                                          [edit] add --color-raja-chrome-blue
frontend/app/_components/
  PieceIconCard2.tsx                                               [edit] ownerIndex prop, border color logic
  PieceMovementIcon.tsx                                            [new]  extracted MpsIcon (pattern/Crown + archetype color), used by PieceIconCard2 + DragOverlay
  Board.tsx                                                        [edit] border recolor, thread catalogByName
  BoardSquare.tsx                                                  [edit] swap to PieceIconCard2, resize to 4.5cm, recolor squares/overlay
  ManaToken.tsx                                                    [edit] Gem icon swap
  ManaTrack.tsx                                                    [unchanged]
frontend/app/(protected)/play/room/
  PlayRoom.tsx                                                     [edit] catalogByName useMemo, pass down
  _components/MainPanel.tsx                                        [edit] thread catalogByName
  _components/PlayerPanel.tsx                                      [edit] thread catalogByName
  _components/PlayerShelf.tsx                                      [edit] swap to PieceIconCard2, resize slots, thread catalogByName
frontend/app/(protected)/catalog/Catalog.tsx                       [edit] DragOverlay uses PieceMovementIcon instead of PieceToken
.context/design_brief.md                                           [edit] domain doc rewrite
```

## Route inventory

N/A — no backend routes touched.

## Frontend — data/consumption

No new API calls. `catalogByName` is a client-side `Map` built once in `PlayRoom` from the already-fetched `/pieces/full` result (`useMemo`), threaded as a prop through `MainPanel`→`Board`/`PlayerPanel`→`BoardSquare`/`PlayerShelf`, used to resolve a `BoardPiece`/`ShelfPiece`'s `name` into the full `PieceFull` object `PieceIconCard2` needs. No mutation helpers involved.

## Slice sequence

1. `globals.css` — add `raja-chrome-blue`.
2. `PieceIconCard2.tsx` — add `ownerIndex` prop/border logic. `PieceMovementIcon.tsx` — extract, wire back into `PieceIconCard2`.
3. `ManaToken.tsx` — Gem swap (independent, no dependencies).
4. `PlayRoom.tsx` → `MainPanel.tsx` → `Board.tsx`/`BoardSquare.tsx` — thread `catalogByName`, swap board tokens, recolor squares/border/overlay.
5. `PlayRoom.tsx`(shared) → `MainPanel.tsx`(shared) → `PlayerPanel.tsx` → `PlayerShelf.tsx` — thread `catalogByName`, swap shelf slots.
6. `Catalog.tsx` — `DragOverlay` swap to `PieceMovementIcon`.
7. `design_brief.md` — rewrite domain doc to match.

## Dependency chain

1→2 unblocks 4/5/6 (need the prop + shared icon first). 3 independent. 4 and 5 share the `catalogByName` plumbing added at the `PlayRoom`/`MainPanel` level — do 4 first, 5 reuses the same threaded prop. 7 last, after everything else is real.

## Risk flags

- **Shelf height**: `PlayerShelf` stacks 7 slots vertically (`flex-col`). At Icons2's fixed 4.5cm each, that's a ~31cm-tall column (vs current 96px coins) — likely blows past the room's `h-[85vh]` panel. Not addressed by the locked decisions above (those only fixed board-square sizing). Surface a shrink/scroll/horizontal-wrap fix during build once it's visibly broken, rather than guessing a layout now.
- `PieceFull` lookup miss: if a board/shelf piece name isn't found in `catalogByName` (shouldn't happen, but no runtime guarantee), needs a fallback render — no-op render nothing rather than crash.
- `BoardPiece.is_building` field exists but appears unused anywhere in current rendering — out of scope, not addressed.
- Domain doc (`design_brief.md`) going stale mid-build if slice 7 is skipped — low risk, hygiene only.

## Safe cuts (last → first)

1. `design_brief.md` rewrite — doc hygiene only, skippable without breaking anything.
2. `DragOverlay` movement-symbol swap (`Catalog.tsx` + `PieceMovementIcon`) — leave that one spot on the old coin temporarily.
3. Owner-color border on Icons2 — ship all-orange border, add player color later (matches user's "revisit soon").
4. `raja-chrome-blue` token — fall back to reusing `raja-chrome-border`/`raja-chrome-muted` for mana states, losing the blue distinction.
