---
name: Record — Board/Chrome Domain Pivot
description: Full palette rethink into two visual domains (dark wood/metal game, light lavender-grey chrome) and its code execution
type: record
---

## Contents

1. [Design direction — from "Go-like stones" to a two-domain split](#1-design-direction--from-go-like-stones-to-a-two-domain-split)
2. [Palette rethink — Coolors import and the orange accent](#2-palette-rethink--coolors-import-and-the-orange-accent)
3. [Code execution — tokens, shared atoms, card-builder deletion](#3-code-execution--tokens-shared-atoms-card-builder-deletion)

---

## 1. Design direction — from "Go-like stones" to a two-domain split

### Context

Starting ask was to rewrite `design_brief.md` toward a "simple traditional Go-like/ancient chess" feel — stone/pebble pieces on a plain board. Survey of existing `.context/` docs found this conflicted hard with prior, already-implemented work: `PieceToken` had just been rebuilt as an embossed metal "challenge coin" (steel/gold, SVG emboss filters — `piece_coin_redesign_plan.md`, status Implemented), and the board/background had been wired to emerald squares + purple background + steel/gold player identity (`redesign_plan.md`, status Implemented).

### Discussion points

- First correction: the metal-coin `PieceToken` is the one thing liked — pivot is everything *else* moving to match its style, not pieces becoming stone.
- Re-scoped: board surface becomes wood-toned (kept alternating squares, not flattened to a true Go board — texture deferred as a separate follow-up), core chrome drops the purple-fantasy family for something "very simple."
- User then asked for the palette to be rethought fully from the ground up, keeping only the piece metal values (`metalThemes.ts` steel/gold).
- A ground-up warm-neutral proposal (charcoal/slate/wood, matte environment so metal pieces read as the only reflective object) was drafted and accepted for the *game* side.
- User then pasted a Coolors screenshot (5-stop periwinkle→dim-grey scale) and asked for the *non-game* UI (background, panels, everything outside actual play) to use that scale plus one orange action color — explicitly separating "core game" visual language from "rest of the website." This surfaced the two-domain concept as the actual organizing principle, not just a palette swap.
- Boundary question ("is core game a route?") was answered directly: no — domain is defined by *component identity* (board, pieces, mana, shelf, panels, log, turn status), not by which page hosts them.

### Decision

Two domains: **game** (dark, matte, wood + the untouched piece metals) applies to bespoke play-relevant components wherever they render; **chrome** (light lavender-grey + one orange accent) applies to everything else. Written into `.context/design_brief.md` and locked in `.context/builds/board_chrome_pivot_plan.md`.

---

## 2. Palette rethink — Coolors import and the orange accent

### Context

Concrete hex values needed for both domains before code execution could be planned.

### Discussion points

- Game domain: core surfaces de-purpled to warm charcoal/slate (`#171512`/`#24211C`/`#43403A`), board recolored to wood (`#B79868`/`#6B4A2C`, replacing `emerald`/`emerald-dark`), semantic triad re-hued to natural pigments and reduced from 4 pairs to 3 (`arcane`→`ink`, `blue` merged into `ink` rather than kept separate) — accepted without pushback.
- Chrome domain: exact hex values taken directly from the user's Coolors screenshot (`#BBBDF6`/`#9893DA`/`#797A9E`/`#72727E`/`#625F63`), plus one proposed orange (`#E8622C`) for the single chrome accent — accepted.
- No pushback on any specific hex in either domain; the design conversation was about domain boundaries, not individual color choices.

### Decision

Full palette as documented in `.context/design_brief.md` — game domain (surfaces, wood, metals, gold accent, semantic triad) and chrome domain (6 tokens + later `raja-chrome-error`) both finalized.

---

## 3. Code execution — tokens, shared atoms, card-builder deletion

### Context

Once the palette was locked, a second `/plan` scoped the actual code changes. Survey of current token usage surfaced a real architectural fork: shared design-system atoms (`RajaButton`, `RajaTextField`, `RajaLoader`, etc.) are consumed by *both* domains today — e.g. `ActionInput`/`InviteLink` (game-relevant, page-local) render `RajaButton`/`RajaTextField` directly.

### Discussion points

- Three options laid out for the fork: a `domain` variant prop on every shared atom, leave atoms as-is and only repaint page-level chrome, or fork small game-local replacements for the ~2 game call sites.
- Resolved definitionally, not with a prop: **any component living in `components/forms/*` or `components/layout/*` is chrome, full stop**, regardless of where it's rendered. A `RajaButton` inside `ActionInput` (submitting a move) is chrome-styled (orange) even sitting inside a dark game panel — accepted as intentional, not a bug, and folded into `design_brief.md` as an explicit rule ("atoms are chrome by definition").
- `card-builder`: asked to be deleted outright rather than repainted — confirmed zero external references (no nav links, no backend routes) before deletion.
- `token-builder`: explicitly deferred — user wants to hand its redesign back as a separate future task rather than have it swept into this chrome repaint.
- `DesignShowcase.tsx` (a kitchen-sink token/component showcase) was repurposed to demonstrate the chrome domain only, per instruction that it should represent "web design," not the game aesthetic — game-token swatches and fantasy-flavored example copy (card names, "Iron Fist," etc.) were replaced with generic web-app copy.
- New token needed and added: `raja-chrome-error` (`#C23B3B`) / `-light` (`#F5D9D9`), since 5 of the form atoms use an error color for inline validation and chrome had none yet.

### Decision

Implemented in full: `globals.css` token rewrite (game recolor/rename + 8 new chrome tokens), `BoardSquare.tsx`/`ManaToken.tsx` wood/ink wiring, `design_brief.md` atoms-are-chrome addition, `card-builder` deleted (10 files via `git rm`), all 13 shared atoms (`components/forms/*`, `components/layout/*`) repainted to chrome, `Home.tsx`/`PlayLanding.tsx` repainted, `DesignShowcase.tsx` repurposed. Verified: grep sweep for zero remaining `raja-emerald`/`raja-arcane`/`raja-blue`/`card-builder` references, `tsc --noEmit` clean (after clearing a stale `.next` route-type cache from the deletion).

`token-builder` intentionally left untouched — will look inconsistent next to the repainted chrome pages until its own redesign lands, per explicit deferral.
