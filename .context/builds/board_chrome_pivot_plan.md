---
name: Board/Chrome Palette Pivot — Feature Plan
description: Two-domain palette rethink — dark wood/metal "core game" (board, pieces, mana) vs light lavender-grey "chrome" (everything else), plus design_brief.md rewrite
type: project
---

## Scope

**In:**
- Full palette rethink, ground-up, for two separate domains:
  - **Game domain** — components relevant to playing the game (`Board`, `BoardSquare`, `Piece/*`, `ManaToken`, `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `ActionInput`, `TurnStatus`) — dark, wood/stone/metal, tactile. Applies wherever these components render, not scoped to a route (e.g. piece previews inside `token-builder`/`card-builder` stay game-styled even though the page around them is chrome).
  - **Chrome domain** — everything else (page backgrounds, nav/header/footer, forms, buttons, marketing/lobby pages, builder-tool page shells) — light, cool lavender-grey, one orange action color.
- `design_brief.md` full rewrite reflecting the two-domain system.
- Scoped code-impact inventory for a later `/build` (token edits, component class-ref swaps).

**Out (deferred):**
- Actual code edits — this plan only; execution via explicit `/build`.
- Wood board texture (grain/flat/photographic) — separate follow-up prompt after this lands.
- Typography — unchanged, not reopened.
- `metalThemes.ts` piece values — unchanged, explicitly the one thing kept from the old palette ("game colors were good as-is").

---

## Decisions (locked)

1. Piece metal themes (`metalThemes.ts` — steel & gold gradient/rim/diffuse values) are the only colors carried over unchanged from the old palette. Everything else is rebuilt from scratch.
2. Two visual domains, split by **component identity, not route**: "core game" = the set of components used to actually play (board, pieces, mana, shelf, panels, log, action input, turn status). "Chrome" = everything surrounding them (page shell, nav, forms, buttons, marketing/lobby/builder-tool pages). A page can contain both (e.g. `token-builder` is chrome-styled but renders game-styled `PieceToken` previews).
3. Game domain keeps a dark, matte, tactile material language (charcoal/slate background, wood board, warm parchment text) specifically so the metal pieces read as the only reflective/saturated object in the scene.
4. Chrome domain is a full repaint: light cool lavender-grey scale (user-supplied Coolors palette) + exactly one saturated orange for actions/links/focus — deliberately the only bright color in the non-game UI.
5. Gameplay-semantic colors (attack/error, resource-cost/warning, magic-effect/info, mana track) stay part of the game domain, not chrome — they're mechanics, not site UI. Reduced from 4 semantic pairs to 3: `arcane` (mystical purple) renamed and re-hued to `raja-ink` (muted slate-blue, fantasy framing dropped); `raja-blue`/`blue-light` (mana track) merged into `raja-ink`/`raja-ink-light` rather than kept as a 4th separate pair.
6. Accent color branches by domain: `raja-gold` (trim/focus ring) inside the game; `raja-chrome-action` (orange) inside chrome. No shared accent across the two domains — reinforces the split rather than blurring it.

---

## Final palette

### Game domain

| Token | Old value | New value | Role |
|---|---|---|---|
| `raja-black` | `#1A1225` (purple) | `#171512` | dark bg/panel base, behind & around board |
| `raja-obsidian` | `#2A1F3D` | `#24211C` | panel/sidebar interior |
| `raja-stone` | `#4A3F5C` | `#43403A` | borders/dividers on dark |
| `raja-white` | `#F0EAD8` | unchanged | parchment — card faces, text on dark |
| `raja-hover` | `#E4DCC8` | unchanged | parchment hover |
| `raja-grey` / `grey-muted` / `grey-light` | — | unchanged | already warm/neutral, fits as-is |
| `raja-wood` | — (was `raja-emerald` `#2D6A4F`) | `#B79868` | board light square — renamed from emerald |
| `raja-wood-dark` | — (was `raja-emerald-dark` `#1F4D38`) | `#6B4A2C` | board dark square — renamed from emerald |
| `raja-steel` | `#B8C2CC` | unchanged | player 0 piece body (= metal steel diffuse) |
| `raja-gold-deep` | `#8C6D2F` | unchanged | player 1 piece body (= metal gold gradientTo) |
| `raja-gold` | `#C9A84C` | unchanged | in-game accent/trim/focus ring (= metal gold diffuse) |
| `raja-gold-light` | `#F0D880` | `#F5DFA0` | hover shimmer — realigned to metal gold's own `rimHighlight` |
| `raja-crimson` / `-light` | `#A32030` / `#F0D4D4` | `#8C2E22` / `#E8CFC7` | attack/error/destructive — oxidized rust, not bright blood |
| `raja-amber` / `-light` | `#C8901C` / `#F5E8C0` | `#A8752A` / `#EDDCB8` | warning/resource-cost — earthy ochre, distinct from accent gold |
| `raja-ink` / `-light` (renamed from `arcane`, merged with `blue`) | `#5A3085` / `#D0C0E8` (arcane) + `#3E6B99` / `#B8CFE0` (blue, dropped) | `#3E5266` / `#C7CDD4` | magic-effect/info/link **and** mana track — one pair instead of two |

Piece metal values (`metalThemes.ts`) — **unchanged**, reference only:

| | gradientFrom | gradientTo | rimHighlight | rimShadow | diffuse |
|---|---|---|---|---|---|
| Steel | `#E2E8F0` | `#8C96A0` | `#F4F7FA` | `#5A6470` | `#B8C2CC` |
| Gold | `#E8C874` | `#8C6D2F` | `#F5DFA0` | `#5C4720` | `#C9A84C` |

### Chrome domain (new)

| Token | Value | Role |
|---|---|---|
| `raja-chrome-bg` | `#BBBDF6` | page background |
| `raja-chrome-panel` | `#9893DA` | card/panel surface |
| `raja-chrome-border` | `#797A9E` | dividers |
| `raja-chrome-muted` | `#72727E` | secondary/muted text |
| `raja-chrome-text` | `#625F63` | primary text on light chrome |
| `raja-chrome-action` | `#E8622C` | buttons, links, focus ring — the one saturated color outside the game |

---

## Code impact inventory (for a later `/build`, not executed here)

- `frontend/app/globals.css` — rewrite `@theme inline` token block: recolor game-domain surfaces, rename `emerald`→`wood`, recolor semantic triad, drop `blue`/`blue-light`, add 6 new `chrome-*` tokens.
- `.context/design_brief.md` — full rewrite (this plan's next step).
- `frontend/app/_components/BoardSquare.tsx` — `raja-emerald`/`emerald-dark` → `raja-wood`/`wood-dark`.
- Chrome repaint — every component NOT in the game-component set needs its surface/text/button classes swapped to `chrome-*` tokens + orange action color: `RajaHeader`, `RajaFooter`, `RajaButton` (default/chrome variant), `RajaModal`, `RajaSection`, `RajaLoader`, all `components/forms/*`, `Home.tsx`, `DesignShowcase.tsx`, `PlayLanding.tsx` (lobby chrome, board preview inside it stays game-styled), `card-builder`/`token-builder` page shells (their `PieceToken`/`ManaToken` previews stay game-styled).
- Semantic color consumers — grep for `raja-arcane` and `raja-blue` usage; repoint to `raja-ink`.
- No change: `metalThemes.ts`, `PieceFilterDefs.tsx`, `RingBorder.tsx`.

---

## Slice sequence

1. Rewrite `design_brief.md` — doc only, next step after this save.
2. `/build`: `globals.css` token rewrite (game-domain recolor + rename, semantic re-hue/merge, new chrome tokens).
3. `/build`: `BoardSquare.tsx` wood token swap.
4. `/build`: chrome component sweep — grep-driven, one pass per component listed above.
5. Grep verification: zero remaining `raja-emerald`, `raja-arcane`, `raja-blue` references.
6. Visual check in browser — deferred, user's own pass (no dev server per standing constraint).
7. Follow-up: wood texture prompt (grain/flat/photographic) — separate, after this lands.

---

## Dependency chain

`globals.css` token rewrite unblocks both `BoardSquare.tsx` and the chrome sweep — they can proceed in either order once tokens exist. Design brief rewrite has no code dependency and can happen first or in parallel.

---

## Risk flags

- `emerald`→`wood`, `arcane`→`ink`, `blue`→dropped are renames, not just recolors — any missed reference becomes a silently unstyled element (no build error). Grep sweep is a hard gate.
- Chrome sweep touches every shared `components/forms/*` and `components/layout/*` atom — largest blast radius in this plan. Worth doing as its own isolated `/build` pass, verified with `tsc --noEmit` before moving on, rather than combined with the game-domain token edits.
- Domain boundary is component-based, not file/folder-based in every case — page components that mix both (e.g. `token-builder` page shell around a game-styled `PieceToken` preview) need care to only repaint the shell, not the piece.

## Safe cuts (last to first)

1. Skip mana-track merge into `raja-ink` — keep `raja-blue` as its own pair. Loses the "3 semantic pairs" simplification, not recommended but low-cost to revert.
2. Skip chrome sweep for now, ship game-domain repaint only — leaves chrome on old purple tokens, inconsistent but non-breaking.
3. Skip `design_brief.md` rewrite, ship code-only — not recommended, doc would be stale immediately.
