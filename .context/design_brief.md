---
name: Design Brief
description: Colour palette, feel, and design style for this project
type: project
---

## Aesthetic

One visual domain: **chrome** — light, clean, cool lavender-grey, deliberately plain, one saturated orange as the primary accent. This now covers the entire play experience — board, pieces (`PieceIconCard2` "Icons 2" square cards), and mana — not just the surrounding shell.

The prior two-domain split (a separate dark/wood/metal-coin "core game" domain for `Board`/`BoardSquare`/`Piece/*`/`ManaToken`) is retired as of the play chrome/Icons2 repaint (`.context/builds/play_chrome_icons2_repaint_plan.md`). The embossed steel/gold coin (`Piece/*`) is **not deleted** — it's kept alive solely for `token-builder`, which was deferred out of this repaint (its `TokenData` shape doesn't carry the fields Icons2 needs, and it was already deferred once before, in the original board/chrome pivot). `token-builder`'s page shell was already chrome; its piece previews are now the one remaining place in the app using the old game-domain look. Expect it to look inconsistent next to the rest of the app until its own redesign lands.

---

## Typography

**Primary:** EB Garamond — the project font. Serif, classical, slightly condensed at large sizes. Use `font-garamond` across the UI. Loaded via Google Fonts in `globals.css`.

---

## Colour Palette — Legacy game domain (token-builder only)

This palette is legacy — see [Aesthetic](#aesthetic) above. Its only remaining consumer inside `/play` is `token-builder`'s piece preview (`Piece/*`, the embossed steel/gold coin), which was deferred out of the play chrome/Icons2 repaint. `Board`, `BoardSquare`, and `ManaToken` — the former other consumers of this table — now use the chrome tokens below instead. Several tokens below are also still consumed outside `/play` entirely (`PieceDetailCard`, `BagTableRow`, `MovementBoard`, the `/rules` page) — this table isn't play-specific dead code, just no longer used *by play*.

`raja-wood` / `raja-wood-dark` (the board's former square colors) are the one **fully orphaned** pair here — zero remaining consumers anywhere, only defined in `globals.css`. Left in place rather than deleted, per the play repaint's decision not to touch the legacy/coin system beyond what's needed.

### Core surfaces

| Token | Hex | Role |
|---|---|---|
| `raja-black` | `#171512` | Primary dark — warm near-black slate. Dark panels, modal backdrops, `token-builder`'s page background |
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
| `raja-ink` | `#3E5266` | Muted slate-blue — magic/mystical effects, link colour. No longer the mana track — mana moved to `raja-chrome-blue` (see Chrome domain table) as of the play repaint |
| `raja-ink-light` | `#C7CDD4` | Pale ink — mystical/info-adjacent backgrounds |

These are legacy gameplay semantics — still real, but their only remaining consumers are outside `/play` (`PieceDetailCard`, `BagTableRow`) or inside `token-builder`.

---

## Colour Palette — Chrome domain

Applies to: everything on the site now, except `token-builder`'s piece/mana previews (see Legacy domain above). This includes page backgrounds, `RajaHeader`/`RajaFooter`, `RajaModal`/`RajaSection`/`RajaLoader`, all `components/forms/*`, marketing and lobby pages (`Home`, `DesignShowcase`, `PlayLanding`), the page shell around `token-builder`, and — as of the play chrome/Icons2 repaint — `Board`, `BoardSquare`, `PieceIconCard2` (rendered as the board/shelf "Icons 2" token), and `ManaToken`, alongside the room's `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `TurnStatus`, `Sidebar`, and `EndTurnButton` (already chrome as of the `/play/room` rework).

**Atoms are chrome by definition.** Domain is decided by component *location*, not by where it's used: anything living in `components/forms/*` or `components/layout/*` (the shared, `Raja`-prefixed atom layer) is chrome — always, with no variant prop and no forking. A shared `RajaButton` rendered as the room's End Turn button is chrome-styled. The legacy domain is now reserved narrowly for `token-builder`'s `Piece/*` coin preview — the one place still rendering the embossed metal look.

| Token | Hex | Role |
|---|---|---|
| `raja-chrome-bg` | `#F1EFF2` | Page background |
| `raja-chrome-panel` | `#E1DCE4` | Card/panel surface — also the board's light square and Icons2's card face |
| `raja-chrome-border` | `#C4BFC8` | Borders/dividers — also the board's outer border and empty shelf slots |
| `raja-chrome-muted` | `#6B6772` | Secondary/muted text — also mana's locked-pip state |
| `raja-chrome-text` | `#3D3A42` | Primary text on light chrome — also player 0's Icons2 border color |
| `raja-chrome-action` | `#B8703F` | Buttons, links, focus ring — general chrome UI accent (distinct from `raja-orange`, see below) |
| `raja-chrome-error` | `#9C3D3D` | Inline validation error (text fields, dropdowns, etc.) |
| `raja-chrome-error-light` | `#F3E6E4` | Pale error background |
| `raja-chrome-blue` | `#5B6B8C` | Mana's filled-pip state (`Gem` icon, solid fill) — the one blue in the chrome palette |

**`raja-orange`** (`#E8792A`) is a special case: still defined under the `/* Game domain */` comment block in `globals.css` for historical reasons, but is now a de-facto chrome token — it's `PieceIconCard2`'s border/ability-band accent and the board's dark alternating square, both chrome-domain components. Not renamed/moved in `globals.css` as part of this pass; flagged here so it isn't mistaken for orphaned or confused with `raja-chrome-action` (a separate, similarly-warm accent used for chrome UI generally).

Chrome is deliberately plain: one light neutral scale, two warm accents (`raja-chrome-action` for general UI, `raja-orange` for Icons2/board specifically), one blue reserved for mana.

---

## Functional token mapping

- **Domain selection is component-location-based.** Shared atoms (`components/forms/*`, `components/layout/*`) are chrome. `token-builder`'s `Piece/*` preview is the sole legacy-domain exception; everything else, including all of `/play`, is chrome.
- **Focus ring:** `ring-2 ring-raja-chrome-action` everywhere in chrome/play. `ring-2 ring-raja-gold` only inside `token-builder`'s legacy preview.
- **Error colour:** `raja-chrome-error` everywhere in chrome/play. `raja-crimson` only where legacy-domain code still references it (`PieceDetailCard`, `BagTableRow`).
- **Board surface:** `raja-chrome-panel` (light square) / `raja-orange` (dark square, see the `raja-orange` special-case note above), alternating.
- **Board/shelf token:** `PieceIconCard2` ("Icons 2") — a fixed 4.5cm square chrome card, not the metal coin. `ownerIndex` prop sets border color: player 0 → `raja-chrome-text` (black), player 1 → `raja-orange`. Placeholder scheme pending a real player-identity pass.
- **Small single-token previews** (catalog drag overlay, and any future spot too small for a full Icons2 card): render just the movement-pattern symbol via `PieceMovementIcon`, not the full card.
- **Mana:** `Gem` icon per pip (`ManaToken`) — filled = `raja-chrome-blue` (solid fill), empty = `raja-chrome-border` (outline), locked = `raja-chrome-muted` + `opacity-disabled`.
- **Piece material (legacy only):** driven entirely by `metalThemes.ts` (steel/gold), with `raja-steel`/`raja-gold-deep` as the flat Tailwind-token equivalents for non-SVG UI. Only reachable via `token-builder` now.

---

## Status

Palette rewritten as of the board/chrome domain pivot — see `.context/builds/board_chrome_pivot_plan.md` (design direction) and `.context/builds/chrome_game_domain_repaint_plan.md` (code execution plan) for the full decision record and code-impact inventory.

Game-domain boundary narrowed further as of the `/play/room` layout rework (`.context/builds/play_room_rework_plan.md`) — `PlayerShelf`/`PlayerPanel`/`GameLogPanel`/`TurnStatus` reclassified game→chrome.

**The two-domain split is now retired for `/play` entirely**, as of the play chrome/Icons2 repaint (`.context/builds/play_chrome_icons2_repaint_plan.md`) — `Board`, `BoardSquare`, and `ManaToken` moved to chrome, board/shelf tokens render `PieceIconCard2` ("Icons 2") instead of the metal coin. The legacy domain now applies to exactly one place: `token-builder`'s `Piece/*` preview, deferred out of this pass. Known open issue from that build: `PlayerShelf` stacking 7 Icons2 cards (4.5cm each) vertically may overflow the room's `h-[85vh]` panel — not fixed, needs a look once seen live (no dev server was run to verify, per standing constraint).
