---
name: Chrome/Game Domain Repaint — Feature Plan
description: Execute the board/chrome palette pivot in code — token rewrite, game-component fixes, card-builder deletion, chrome repaint of shared atoms and pages, DesignShowcase repurpose
type: project
---

## Scope

In: `globals.css` token rewrite (game recolor/rename + chrome tokens + `raja-chrome-error`), `BoardSquare.tsx`/`ManaToken.tsx` wood/ink wiring, `design_brief.md` amendment (atoms-are-chrome rule), `card-builder` deletion, `DesignShowcase.tsx` repurpose to chrome-only, chrome repaint of shared atoms + remaining chrome pages.

Out: `token-builder` redesign — deferred, separate future task, left on current tokens.

Supersedes/executes: `.context/builds/board_chrome_pivot_plan.md` (the design-direction plan) and the palette already written into `.context/design_brief.md`.

---

## Decisions (locked)

1. **Domain is determined by component location, not usage context.** Anything in `components/forms/*` or `components/layout/*` (the `Raja*`-prefixed shared atom layer) is chrome, full stop — no variant prop, no forking. Game-domain components are the bespoke, page-local ones never promoted to the shared layer: `Board`, `BoardSquare`, `Piece/*`, `ManaToken`, `PlayerShelf`, `PlayerPanel`, `GameLogPanel`, `TurnStatus`. `ActionInput`/`InviteLink` are page-local wrappers with no color tokens of their own — they compose chrome atoms (`RajaButton`, `RajaTextField`), so their rendered buttons are chrome-styled (orange) even inside the dark game panel. Intentional.
2. `card-builder` deleted entirely — route, page, all 10 files under it (confirmed zero external references — no nav links, no backend routes).
3. `token-builder` — out of scope for this build, left on current tokens, redesigned separately later.
4. New token: `raja-chrome-error` `#C23B3B` / `raja-chrome-error-light` `#F5D9D9` — for form-atom inline validation now that those atoms are confirmed chrome.
5. `DesignShowcase.tsx` repurposed to showcase web/chrome design system only — all game-token/game-component swatches removed.
6. `design_brief.md` gets one addition: the atoms-are-chrome rule (decision 1).

---

## Token changes (`globals.css`)

Game domain (recolor/rename, values from `design_brief.md`):
- `raja-black` `#1A1225`→`#171512`, `raja-obsidian` `#2A1F3D`→`#24211C`, `raja-stone` `#4A3F5C`→`#43403A`
- `raja-emerald`/`raja-emerald-dark` renamed → `raja-wood` `#B79868` / `raja-wood-dark` `#6B4A2C`
- `raja-arcane`/`raja-arcane-light` renamed+re-hued → `raja-ink` `#3E5266` / `raja-ink-light` `#C7CDD4`
- `raja-blue`/`raja-blue-light` dropped, merged into `raja-ink`/`raja-ink-light`
- `raja-crimson`/`-light` → `#8C2E22` / `#E8CFC7`; `raja-amber`/`-light` → `#A8752A` / `#EDDCB8`
- `raja-gold-light` → `#F5DFA0` (realigned to metal `rimHighlight`)
- Unchanged: `raja-white`, `raja-hover`, `raja-grey`/`grey-muted`/`grey-light`, `raja-gold`, `raja-steel`, `raja-gold-deep`

New chrome domain tokens:
- `raja-chrome-bg` `#BBBDF6`, `raja-chrome-panel` `#9893DA`, `raja-chrome-border` `#797A9E`, `raja-chrome-muted` `#72727E`, `raja-chrome-text` `#625F63`, `raja-chrome-action` `#E8622C`, `raja-chrome-error` `#C23B3B`, `raja-chrome-error-light` `#F5D9D9`

---

## File impact

| File | Change |
|---|---|
| `frontend/app/globals.css` | token rewrite per above |
| `.context/design_brief.md` | add atoms-are-chrome rule |
| `frontend/app/_components/BoardSquare.tsx` | `raja-emerald`/`emerald-dark` → `raja-wood`/`wood-dark` |
| `frontend/app/_components/ManaToken.tsx` | `raja-blue` → `raja-ink` |
| `components/layout/{Header,Footer,Modal,Section,Loader}.tsx` | repaint to chrome tokens |
| `components/forms/{Button,TextField,Dropdown,Checkbox,Radio,TextArea,FileUpload,DatePicker}.tsx` | repaint to chrome tokens; TextField/Dropdown/TextArea/FileUpload/DatePicker also get `raja-chrome-error` |
| `app/(open)/home/Home.tsx` | repaint to chrome |
| `app/(open)/design/DesignShowcase.tsx` | repurpose — chrome-only showcase |
| `app/(protected)/play/PlayLanding.tsx` | repaint to chrome |
| `app/(protected)/card-builder/` (10 files incl. `page.tsx`) | delete |
| `app/(protected)/token-builder/**` | untouched — deferred |

---

## Slice sequence

1. `design_brief.md` — atoms-are-chrome rule.
2. `globals.css` — token rewrite.
3. `BoardSquare.tsx` + `ManaToken.tsx` — game token fixes.
4. Delete `card-builder`.
5. Chrome repaint — 5 layout atoms + 8 form atoms.
6. Chrome repaint — `Home.tsx`, `PlayLanding.tsx`.
7. `DesignShowcase.tsx` repurpose.
8. Verification — grep for zero remaining `raja-emerald`/`raja-arcane`/`raja-blue`/`card-builder` references, `tsc --noEmit` clean.

---

## Dependency chain

`globals.css` unblocks every downstream slice. Card-builder deletion is independent (no shared dependency). Chrome repaint (5-7) depends only on the new chrome tokens existing.

---

## Risk flags

- `ActionInput`/`InviteLink` will show orange chrome buttons inside a dark game panel — direct, intentional consequence of decision 1, not a bug.
- `token-builder` will look inconsistent next to repainted `Home`/`PlayLanding` until its own redesign — accepted deferral.
- Rename-not-recolor tokens (`emerald`→`wood`, `arcane`/`blue`→`ink`) fail silently if a reference is missed (unstyled element, no build error) — grep sweep is a hard gate.

## Safe cuts (last to first)

1. Skip `DesignShowcase` repurpose.
2. Skip `Home`/`PlayLanding` chrome repaint.
3. Skip shared-atom chrome repaint — not recommended, this is the point of the build.
