# Palette domain cleanup + archetype color tokens

## Contents
1. [Game vs chrome domain split in globals.css](#1-game-vs-chrome-domain-split-in-globalscss)
2. [Game-domain token audit — drop unused, keep function-named](#2-game-domain-token-audit--drop-unused-keep-function-named)
3. [Piece_Card border matches Piece_OnShelf ring](#3-piece_card-border-matches-piece_onshelf-ring)
4. [BoardSquare alternate tile — chrome-action instead of raja-orange](#4-boardsquare-alternate-tile--chrome-action-instead-of-raja-orange)
5. [Archetype colors moved into globals.css theme tokens](#5-archetype-colors-moved-into-globalscss-theme-tokens)

---

## 1. Game vs chrome domain split in globals.css

### Context
User recalled an early idea to split the color palette into two domains — one for game UI, one for chrome (app shell/admin UI). Checked `globals.css` to confirm.

### Discussion points
None — confirmed the split already exists (`/* Game domain */` and `/* Chrome domain */` comment blocks, `raja-*` vs `raja-chrome-*` prefixes).

### Decision
No action needed here; existing structure already matches the intended split. This grounded the rest of the session's token cleanup.

---

## 2. Game-domain token audit — drop unused, keep function-named

### Context
User wanted the game-domain token list in `globals.css` cut down: remove anything unused, and rename anything kept from a color name (`raja-gold`) to a functional name, except where the color name IS the function (game-identity colors).

### Discussion points
- Initial usage audit was skewed by shell `grep` alias (`ugrep` with broken `--include` flags) reporting inflated file counts; re-ran with `git grep -w` for accurate word-boundary matches.
- First pass found most usage concentrated in `token-builder` (dev-only page). User then said token-builder is being deleted — redone audit excluding it dropped survivors from ~11 tokens to 4 (`gold`, `steel`, `ink`, `orange`).
- `gold`/`steel` were flagged as game-identity names (`BodyColor` type in `archetypes.ts` already uses `'gold' | 'steel'` as literal side identifiers) — correctly left un-renamed rather than forced into a generic functional name.
- `raja-orange` usage moved twice during the session: first thought fully dead after Piece_Card stopped using it (wrong — BoardSquare.tsx still used it), then genuinely went unused after BoardSquare was moved to `chrome-action` (see §4).

### Decision
Dropped 18 of 21 original game-domain tokens (`black`, `obsidian`, `white`, `hover`, `stone`, `grey`, `grey-muted`, `grey-light`, `gold-light`, `gold-deep`, `wood`, `wood-dark`, `crimson`, `crimson-light`, `amber`, `amber-light`, `ink-light`, `orange`). Kept `raja-gold`, `raja-steel`, `raja-ink` unrenamed (game-identity / no better functional name found). `raja-ink`'s functional role (cost-badge background) and `raja-orange`'s (board-square/card-border highlight) were identified but not renamed before `orange` was dropped entirely.

---

## 3. Piece_Card border matches Piece_OnShelf ring

### Context
User wanted `Piece_Card`'s static `border-raja-orange` border replaced with the same dynamic, per-archetype ring color already used in `Piece_OnShelf` (`darken(archetype.color, 0.5)`).

### Discussion points
None — straightforward port via `/quick-edit`, single file, snippet already shown.

### Decision
`Piece_Card.tsx` border is now computed per-piece from `ARCHETYPES[piece.archetype].color`, matching `Piece_OnShelf`'s ring logic. This made `raja-orange` unused in `Piece_Card` (but not yet globally — see §4).

---

## 4. BoardSquare alternate tile — chrome-action instead of raja-orange

### Context
With `Piece_Card` no longer using `raja-orange`, user asked whether `BoardSquare`'s alternate-tile shade (the last remaining `raja-orange` usage) could use `raja-chrome-action` instead — noting the board already mixes in `raja-chrome-panel` for the other tile color.

### Discussion points
Flagged a semantic clash before applying: `chrome-action` is named for interactive/clickable elements (buttons), and reusing it for a passive tile shade ties an "actionable" meaning to non-interactive surface. Offered a dedicated neutral token as an alternative. User proceeded with reuse via `/quick-edit` without addressing the flag directly — treated as accepting the simpler reuse over adding a new token.

### Decision
`BoardSquare.tsx` alternate tile now uses `bg-raja-chrome-action`. `raja-orange` became fully unused across the codebase, confirmed and dropped from `globals.css` in §2's edit.

---

## 5. Archetype colors moved into globals.css theme tokens

### Context
`utils/archetypes.ts` hardcoded 8 archetype hex colors directly in the `ARCHETYPES` map, disconnected from the `globals.css` `@theme inline` token system. User wanted these baked into the theme as proper tokens, with `archetypes.ts` pointing at the tokens instead of raw hex.

### Discussion points
- Before building, user asked for a blast-radius check. Found `archetype.color` consumed at 9 call sites across 6 files, split into two risk classes:
  - **Breaking** (do hex arithmetic/string-concat on the raw hex, would silently produce `NaN` or invalid CSS if fed a `var(...)` string): `Piece_Card.tsx` (`darken()` for border, from §3), `Piece_OnShelf.tsx` (`darken()` for ring color, `${color}80` alpha concat for border), `RajaArchetypePill.tsx` (`${color}80` alpha concat).
  - **Pass-through** (opaque color string handed to `color`/`fill`/`lightingColor` props — expected to work with `var()` in modern browsers but unverified): lucide icon `color` props in `Piece_OnShelf.tsx`, `RajaArchetypeIcon.tsx`, `PieceMovementIcon.tsx`; and `lightingColor` on an SVG `<feSpecularLighting>` filter primitive in `PieceFilterDefs.tsx` (flagged as the riskiest of this group — filter-primitive attribute var() support is less consistent across browsers than plain fill/stroke).
- Proposed fix for the breaking sites: replace hex-based `darken()`/alpha-concat with CSS `color-mix()`, which accepts `var()` references directly. Justified by the project already targeting modern browsers only (Tailwind v4 baseline).
- User approved proceeding with the `color-mix()` rewrite; did not request the SVG filter site be manually verified in-browser (open item — global CLAUDE.md forbids starting the dev server, so this needs the user's own manual check).

### Decision
- Added a new `/* Archetype domain */` block to `globals.css` with 8 tokens (`--color-raja-archetype-soldier` through `-trap`), placed between the game and chrome domain blocks.
- `archetypes.ts` `ARCHETYPES` map now stores `color: 'var(--color-raja-archetype-*)'` instead of raw hex.
- `Piece_Card.tsx` and `Piece_OnShelf.tsx`: replaced local `darken()` hex-math helper with inline `color-mix(in srgb, ${color} 50%, black)`; replaced `${color}80` alpha concat with `color-mix(in srgb, ${color} 50%, transparent)`.
- `RajaArchetypePill.tsx`: same alpha-concat replacement.
- Pass-through consumers (icon `color` props, SVG `lightingColor`) left untouched — expected to resolve `var()` correctly, but not verified in-browser this session.
- Open item: user should manually verify `PieceFilterDefs.tsx`'s `lightingColor={archetype.color}` renders correctly now that it's a `var()` reference, since filter-primitive CSS custom property support is the least certain of the changed paths.
