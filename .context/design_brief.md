---
name: Design Brief
description: Colour palette, feel, and design style for this project
type: project
---

## Aesthetic

Two deliberately separate visual domains, split by **what a component does**, not by which page it sits on.

**Core game** — the components used to actually play (board, pieces, mana, shelf, panels, log, action input, turn status). Dark, matte, tactile: charcoal-slate surfaces, a plain wood board, warm parchment text. Everything in this domain stays quiet and desaturated on purpose, so the metal piece tokens — antique steel and gold, rendered as embossed physical coins — read as the only reflective, precious object in the scene. These components carry the game's identity wherever they render, including as previews inside builder tools.

**Chrome** — everything else: page backgrounds, nav, forms, buttons, marketing and lobby pages, and the shell around builder tools. Light, clean, cool lavender-grey. Deliberately plain — one saturated orange is the only accent, reserved for actions and links. Chrome should recede; it is not trying to look like the game.

A single page can contain both — e.g. `token-builder`'s page shell is chrome, but the `PieceToken` preview it renders stays game-styled.

---

## Typography

**Primary:** EB Garamond — the project font. Serif, classical, slightly condensed at large sizes. Use `font-garamond` across the UI. Loaded via Google Fonts in `globals.css`.

---

## Colour Palette — Core game domain

Applies to: `Board`, `BoardSquare`, `Piece/*`, `ManaToken`, `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `ActionInput`, `TurnStatus`, and any container built specifically around the live board or pieces.

### Core surfaces

| Token | Hex | Role |
|---|---|---|
| `raja-black` | `#171512` | Primary dark — warm near-black slate. Behind and around the board, dark panels, modal backdrops |
| `raja-obsidian` | `#24211C` | Secondary dark surface — panel interiors, sidebar backgrounds |
| `raja-white` | `#F0EAD8` | Warm parchment — card faces, light panels, primary text on dark |
| `raja-hover` | `#E4DCC8` | Parchment hover — subtle hover background on light surfaces |
| `raja-stone` | `#43403A` | Muted warm grey — borders and dividers on dark surfaces |

### Text & muted tones

| Token | Hex | Role |
|---|---|---|
| `raja-grey` | `#7A7060` | Primary muted text on light surfaces; captions, labels |
| `raja-grey-muted` | `#9A9080` | Very muted; timestamps, metadata |
| `raja-grey-light` | `#D8D0C0` | Subtle divider or ghost background on parchment |

### Board

| Token | Hex | Role |
|---|---|---|
| `raja-wood` | `#B79868` | Light wood square — the board's light alternate |
| `raja-wood-dark` | `#6B4A2C` | Dark wood square — the board's dark alternate |

Board keeps the alternating light/dark square pattern (not a flattened single-tone Go board), recolored to wood. Texture treatment (grain, flat vs. photographic) is an open follow-up, not yet decided.

### Piece metals

Source of truth lives in code (`frontend/app/_components/Piece/metalThemes.ts`) — not duplicated here in full. Each metal defines a gradient, rim highlight/shadow, and diffuse tint used by the coin's emboss/bevel rendering:

| Metal | gradientFrom | gradientTo | rimHighlight | rimShadow | diffuse |
|---|---|---|---|---|---|
| Steel | `#E2E8F0` | `#8C96A0` | `#F4F7FA` | `#5A6470` | `#B8C2CC` |
| Gold | `#E8C874` | `#8C6D2F` | `#F5DFA0` | `#5C4720` | `#C9A84C` |

### Player identity

| Token | Hex | Role |
|---|---|---|
| `raja-steel` | `#B8C2CC` | Player 0 piece body — cool steel. Equals the steel metal's `diffuse`. Paired with `raja-black` text/icon |
| `raja-gold-deep` | `#8C6D2F` | Player 1 piece body — deep bronzed gold. Equals the gold metal's `gradientTo`. Paired with `raja-white` text/icon |

### Accent

| Token | Hex | Role |
|---|---|---|
| `raja-gold` | `#C9A84C` | In-game accent — trim, active highlights, focus ring. Equals the gold metal's `diffuse` — the accent is drawn from the piece metal itself, not invented separately |
| `raja-gold-light` | `#F5DFA0` | Shimmer gold — hover on gold elements. Equals the gold metal's `rimHighlight` |

### Status & game semantics

| Token | Hex | Role |
|---|---|---|
| `raja-crimson` | `#8C2E22` | Oxidized rust-red — attack, destructive actions, errors |
| `raja-crimson-light` | `#E8CFC7` | Pale crimson — error backgrounds |
| `raja-amber` | `#A8752A` | Earthy ochre — warning states, mana cost, resource cost. Kept distinct from accent gold |
| `raja-amber-light` | `#EDDCB8` | Pale amber — warning backgrounds |
| `raja-ink` | `#3E5266` | Muted slate-blue — magic/mystical effects, link colour, **and** the mana track (filled/available pips). Replaces the old fantasy-purple `arcane` and absorbs the old separate `blue` mana token — one pair instead of two |
| `raja-ink-light` | `#C7CDD4` | Pale ink — mystical/info/mana-adjacent backgrounds |

These are gameplay semantics (attack, resource cost, effects, mana), not site UI — they belong to the game domain regardless of which page a game component renders on.

---

## Colour Palette — Chrome domain

Applies to: everything that is not a core-game component — page backgrounds, `RajaHeader`/`RajaFooter`, `RajaModal`/`RajaSection`/`RajaLoader`, all `components/forms/*`, marketing and lobby pages (`Home`, `DesignShowcase`, `PlayLanding`), and the page shell around `token-builder` (not the piece/mana previews that tool renders, which stay game-styled).

**Atoms are chrome by definition.** Domain is decided by component *location*, not by where it's used: anything living in `components/forms/*` or `components/layout/*` (the shared, `Raja`-prefixed atom layer) is chrome — always, with no variant prop and no forking, even when a game screen composes it. A shared `RajaButton` rendered inside `ActionInput` (submitting a move) is still chrome-styled. The game domain is reserved for bespoke, page-local components that are never promoted to the shared atom layer (`Board`, `BoardSquare`, `Piece/*`, `ManaToken`, `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `TurnStatus`). The moment a component is promoted to `components/forms/*` or `components/layout/*` for reuse, it becomes chrome by that act alone.

| Token | Hex | Role |
|---|---|---|
| `raja-chrome-bg` | `#BBBDF6` | Page background |
| `raja-chrome-panel` | `#9893DA` | Card/panel surface |
| `raja-chrome-border` | `#797A9E` | Borders/dividers |
| `raja-chrome-muted` | `#72727E` | Secondary/muted text |
| `raja-chrome-text` | `#625F63` | Primary text on light chrome |
| `raja-chrome-action` | `#E8622C` | Buttons, links, focus ring — the single saturated color in the entire chrome domain |
| `raja-chrome-error` | `#C23B3B` | Inline validation error (text fields, dropdowns, etc.) |
| `raja-chrome-error-light` | `#F5D9D9` | Pale error background |

Chrome is deliberately plain: one light neutral scale, one accent. It should never borrow game tokens (gold, wood, the dark surfaces) and the game domain should never borrow chrome's orange or lavender-grey — the contrast between the two is the point.

---

## Functional token mapping

- **Domain selection is component-location-based.** Shared atoms (`components/forms/*`, `components/layout/*`) are always chrome. Bespoke, page-local game components (board, piece, mana, shelf, panel, log, turn status) always use game-domain tokens, even when composed inside a chrome-styled wrapper.
- **Focus ring:** `ring-2 ring-raja-gold` inside the game domain; `ring-2 ring-raja-chrome-action` inside chrome. Never shared across domains.
- **Primary accent:** `raja-gold` (game) / `raja-chrome-action` (chrome).
- **Error colour:** `raja-crimson` (game) / `raja-chrome-error` (chrome — form-atom inline validation).
- **Warning colour:** `raja-amber` (game-only, resource cost).
- **Info/link/mana colour:** `raja-ink` (game-only).
- **Board surface:** `raja-wood` / `raja-wood-dark`, alternating squares.
- **Piece material:** driven entirely by `metalThemes.ts` (steel/gold), with `raja-steel`/`raja-gold-deep` as the flat Tailwind-token equivalents for non-SVG UI (e.g. a player-turn indicator dot).

---

## Status

Palette rewritten as of the board/chrome domain pivot — see `.context/builds/board_chrome_pivot_plan.md` (design direction) and `.context/builds/chrome_game_domain_repaint_plan.md` (code execution plan) for the full decision record and code-impact inventory. Code build in progress.
