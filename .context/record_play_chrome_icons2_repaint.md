# Record: Play Chrome / Icons2 Repaint

## Contents

1. [Ditching raja-game colors — identifying "Icons 2"](#1-ditching-raja-game-colors--identifying-icons-2)
2. [Scoping the domain reversal](#2-scoping-the-domain-reversal)
3. [Small-preview sizing conflict — drags vs token-builder](#3-small-preview-sizing-conflict--drags-vs-token-builder)
4. [Code execution](#4-code-execution)

---

## 1. Ditching raja-game colors — identifying "Icons 2"

### Context
User wanted to drop the dark wood/metal "raja-game" look from `/play` entirely and go purely chrome: tokens rendered as the square "Icons 2" component, the mana crystal panel using blue/grey cost symbols, and the board as alternating grey/orange squares sized to the Icons2 token. Before scoping anything, needed to confirm "Icons 2" actually referred to a real component.

### Discussion points
None — investigation confirmed "Icons 2" = `PieceIconCard2.tsx`, the square 4.5cm chrome card already live in `/catalog` (`abilityViewMode: 'icons2'`), distinct from the round embossed-coin `PieceToken` used on the board/shelf today. Also surfaced: chrome already has an accent (`raja-orange`) and greys, but no blue.

### Decision
Confirmed understanding before scoping further — no code changes this section.

---

## 2. Scoping the domain reversal

### Context
The ask directly reverses a locked project decision: `design_brief.md` and `record_board_chrome_domain_pivot.md` establish a two-domain split (dark "game" domain for `Board`/`BoardSquare`/`Piece/*`/`ManaToken`, light "chrome" for everything else) with an explicit rule that neither domain borrows the other's tokens, and a prior record stating the metal coin was "the one thing liked" and deliberately kept. This ask undoes both.

### Discussion points
Given the scale of the reversal (deletes/orphans a whole coin-emboss subsystem, contradicts a written rule), surfaced as locked numbered questions rather than assumed:
- Full reversal confirmed — game domain retires for play, board/tokens/mana all move to chrome.
- Icons2 on board/shelf: full detail (not a stripped-down variant), at native fixed size — pushed a follow-up mid-turn that board squares resize to match the token, not the other way around.
- Player identity on Icons2 (no material distinction once steel/gold is gone): orange and black, explicitly a placeholder — "will revisit soon."
- Mana blue: no blue exists in chrome today: delegated the exact hex to me — picked `raja-chrome-blue` (`#5B6B8C`), muted to match the desaturated chrome scale rather than a bright saturated blue.
- Board square colors: delegated to me — `raja-chrome-panel` (grey, matches Icons2's own card face) alternating `raja-orange` (existing accent, already Icons2's border/band color).
- Scope: "anywhere it is used" — pulled in `token-builder` and Catalog's `DragOverlay`, not just the three originally-named elements.
- Fallout: orphaned game-domain code (coin-emboss system, `raja-wood`/`raja-wood-dark`/`raja-ink`-as-mana) left in place unused, not deleted — token-builder still depends on the coin system.

### Decision
Locked into `.context/builds/play_chrome_icons2_repaint_plan.md` via `/plan`. Full domain reversal for `/play`, `token-builder` explicitly carved out as the one remaining legacy-domain consumer.

---

## 3. Small-preview sizing conflict — drags vs token-builder

### Context
Surveying every `PieceToken` call site (`BoardSquare`, `PlayerShelf`, `TokenBuilder`, `TokenDisplay`, `TokenGrid`, Catalog's `DragOverlay`) surfaced a real conflict: "anywhere it's used" plus "full detail" collide at three tiny spots (56px drag-overlay thumb, 48px token-builder selector, 56px `TokenGrid` center cell) where a full-detail 4.5cm Icons2 card would be illegible.

### Discussion points
Surfaced as a follow-up question rather than guessed. User's answer ("for drags — should use just the {movement pattern symbol}") named drags specifically. Cross-checked `token-builder`'s data model (`TokenData` in `token-builder/types.ts`) and found it has no `movement_type`/`role_type` at all — a structurally different shape from `PieceFull`, confirming those spots can't cleanly take either treatment without a separate rework. Concluded "for drags" should be read narrowly (the actual `DragOverlay` drag preview) rather than generalized to `token-builder`'s internal preview grid, which was already explicitly deferred once before.

### Decision
Extracted a shared `PieceMovementIcon` component (archetype-colored pattern icon, `Crown` for King) reused by both `PieceIconCard2`'s repeat-count block and the Catalog `DragOverlay`. `token-builder` stays untouched, out of scope for this pass, flagged plainly in the plan rather than silently included.

---

## 4. Code execution

### Context
Plan saved to `.context/builds/play_chrome_icons2_repaint_plan.md`, then built in full ("save /build, be thorough") — all 7 slices, no cuts taken.

### Discussion points
None during execution — one structural finding worth noting: `BoardPiece`/`ShelfPiece` (the live game-state types) only carry `name`/`archetype`/`owner`, not the full `ability`/`attributes`/`movement_type` Icons2 needs. `PlayRoom.tsx` already fetches the full catalog (`/pieces/full`) for the detail panel, so a `catalogByName` Map (built once via `useMemo`) was threaded `PlayRoom` → `MainPanel` → `Board`/`PlayerPanel` → `BoardSquare`/`PlayerShelf`, resolving each board/shelf piece's name into its full `PieceFull` record.

### Decision
Implemented in full:
- `globals.css` — added `--color-raja-chrome-blue: #5B6B8C`.
- `PieceIconCard2.tsx` — new `ownerIndex?: 0 | 1` prop (`0` → `border-raja-chrome-text`, `1`/undefined → `border-raja-orange`); repeat-icon block now uses the new `PieceMovementIcon` instead of a locally-derived `MpsIcon`.
- `PieceMovementIcon.tsx` (new) — single archetype-colored pattern/Crown icon, shared by `PieceIconCard2` and Catalog's `DragOverlay`.
- `ManaToken.tsx` — circle `div` replaced with a `Gem` icon; filled = `raja-chrome-blue` (`fill="currentColor"`), empty = `raja-chrome-border` (outline), locked = `raja-chrome-muted` + `opacity-disabled`.
- `Board.tsx` — border `raja-gold/40` → `raja-chrome-border`; threads `catalogByName`, resolves each square's `fullPiece` before handing off to `BoardSquare`.
- `BoardSquare.tsx` — squares recolored `raja-chrome-panel`/`raja-orange` alternating (was `raja-wood`/`raja-wood-dark`), select/highlight overlay `raja-ink/*` → `raja-chrome-text/*`, resized `w-28 h-28` → `w-[4.5cm] h-[4.5cm]`, renders `PieceIconCard2` instead of `PieceToken`.
- `PlayRoom.tsx` → `MainPanel.tsx` → `PlayerPanel.tsx` → `PlayerShelf.tsx` — same `catalogByName` threading; `PlayerShelf` slots resized to `4.5cm` square (dropped `rounded-full`), renders `PieceIconCard2` with `ownerIndex` derived from `player.player_id`.
- `Catalog.tsx` — `DragOverlay` swapped from `PieceToken` to `PieceMovementIcon`; removed now-unused `ARCHETYPES`/`PIECE_TYPES` imports.
- `.context/design_brief.md` — rewritten: single chrome domain for the whole site except `token-builder`'s `Piece/*` preview (renamed "Legacy game domain (token-builder only)"); chrome token table corrected to match actual `globals.css` hexes (doc had drifted stale) and gained `raja-chrome-blue`; flagged `raja-orange` as a de-facto chrome token despite living under the `/* Game domain */` CSS comment; flagged `raja-wood`/`raja-wood-dark` as the only fully orphaned tokens (verified via grep — zero remaining consumers); `raja-black`/`raja-stone`/`raja-ink`/etc. explicitly *not* called orphaned since `token-builder` and other untouched surfaces (`PieceDetailCard`, `BagTableRow`, `/rules`) still consume them.

Verified: `tsc --noEmit` clean (same pre-existing unrelated `.next` cache error on `(protected)/play/page.js` every prior session in this project has also ignored). Grep-verified no stale `PieceToken`/`ARCHETYPES`/`PIECE_TYPES` imports left in touched files. No dev server started, no DB access — respects both standing bans.

**Outstanding, not fixed this pass:** `PlayerShelf` stacks 7 Icons2 cards vertically at 4.5cm each (~31cm/~1200px column) — likely overflows the room's `h-[85vh]` panel. Flagged in both the plan and `design_brief.md`'s Status section as a known open issue needing a look once seen live, since visual layout correctness can't be confirmed without a browser (standing no-dev-server constraint).
