---
name: Redesign Plan
description: UI/UX reference notes from a chess.com comparison audit, plus the color palette restructure (player identity colors, purple background, emerald board) that came out of it
type: project
---

## Table of contents

1. [Chess.com UI reference — 30 audit points](#1-chesscom-ui-reference--30-audit-points)
2. [Color palette restructure](#2-color-palette-restructure)

---

## 1. Chess.com UI reference — 30 audit points

### Context

Two chess.com screenshots (in-game and pre-game lobby) were reviewed against Kingkiller's own
design system and the current `/play/room` implementation, to see what a mature, dense
game-interface pattern gets right that could be adopted. Each point is tagged:

- **[adopt]** — a new pattern worth taking
- **[confirms]** — validates something we already do
- **[future]** — a good idea, not urgent for a prototype

### Points

**Layout & navigation**
1. [adopt] Persistent icon+label left rail for top-level nav (Play/Puzzles/Learn/More) — we currently have no shared nav across pages at all; each page is an island.
2. [adopt] Auth state lives at the bottom of that same rail — Sign Up/Log In stacked when logged out, avatar+account row when logged in. Maps directly onto our `(open)` vs `(protected)` split.
3. [future] Segmented tabs for switching context within one screen (Play/New Game/Games/Players) rather than separate routes — could apply to a future "lobby" surface.

**Board presentation**
4. [adopt] Rank/file coordinates baked into the board's own edge (numbers left, letters bottom) — our `Board.tsx` has zero coordinate labels right now; cheap, high-value addition.
5. [adopt] Coordinates flip with viewer orientation, not just piece colors — worth double-checking our board also renumbers for player 1's perspective, not only re-coloring pieces.
6. [confirms] Alternating squares use two close, muted tones rather than high contrast — our obsidian/stone pairing already followed this (now superseded by the emerald board — see §2).
7. [adopt] Pieces get a subtle drop-shadow/bevel to lift them off the board — our `PieceToken` is currently flat; a soft shadow or ring would add depth.
8. [confirms] Selected/legal-move squares get a highlight ring — matches the `ring-2 ring-kingkiller-gold` built for board highlighting.

**Game info & controls**
9. [future] Clock renders as a boxed, high-contrast element (white chip, icon+time), not inline text — relevant once we add real per-player timers.
10. [adopt] Identity rows (avatar, name, rating, connection bars) sit directly above/below the board edge rather than beside it — more space-efficient than our current side-by-side `PlayerPanel` layout, especially on narrower screens.
11. [adopt] A slim icon-button rail (flip board, fullscreen, share, settings) sits between board and side panel — we have no board-utility controls at all; "flip view" and "copy invite" (currently buried as a text link) are good first candidates.
12. [confirms] Move list entries are compact, numbered, single-line — matches our `GameLogPanel`.
13. [adopt] Each move-list entry gets a small type icon (a flag/marker for "starting position") — we could do the same per outcome type (move/summon/activate/read) for scannability.
14. [future] Playback transport controls (⏮ ◀ ▶ ⏭) fixed at the panel bottom — relevant if we ever want to let a viewer scrub back through game history.
15. [future] Draw/Abort/flip anchored as a distinct "game-level actions" footer, separate from the move list — a template for resign/forfeit controls later.

**Lobby / pre-game**
16. [future] A single collapsed dropdown for game setup (time control) instead of a wall of options — relevant if we add pre-match choices like archetype/deck selection.
17. [adopt] Exactly one unmistakable primary CTA ("Start Game," solid saturated green, full-width) above demoted secondary options — worth auditing `PlayLanding.tsx` for whether it has one clear primary action or competing buttons.
18. [adopt] Secondary actions carry a small leading icon for fast scanning — `KingkillerButton` has no icon slot today; worth adding one.
19. [adopt] The board renders live (idle, placeholder pieces) behind the lobby screen instead of a blank page — gives instant visual context. Our `PlayLanding` could show a static board preview instead of plain text.
20. [confirms] Placeholder labels ("Player"/"Opponent") occupy the exact slots real names will later fill — matches how we already always render `PlayerPanel` structurally.
21. [future] A live social-proof counter ("120,092 playing") — low priority for a prototype, but notable if we ever want a "games in progress" stat.

**Iconography & density**
22. [adopt] Nav/utility icons always pair with a text label at rest, not icon-only — improves discoverability without relying on tooltips.
23. [adopt] Rating shows as a small inline chip next to the username — we could reuse this pattern for an archetype/deck badge next to `PlayerPanel`'s label.
24. [adopt] Connection-quality bars sit inline with identity as a live-status glance — we could add a small "your turn" dot next to the active `PlayerPanel` instead of relying only on the `TurnStatus` text line.
25. [future] A small settings gear tucked top-right, out of the main flow — a home for board display toggles (coordinates, animations) if we add any.

**Layout discipline**
26. [confirms] Three-column layout (nav | board+controls | panel) holds fixed across both lobby and in-game states, nothing reflows — this directly validates the project's existing fixed-layout preference from `AUDIT.md`.
27. [future] Side panel uses tabs to swap fundamentally different content (Moves/Chat/Info) instead of stacking everything — worth considering for `GameLogPanel` once/if chat gets added, so it doesn't need more page real estate.
28. [confirms] Board container has a subtle border separating it from the page background — matches our `border-kingkiller-gold/40`.
29. [confirms] Dark background is near-black, not pure black, with the board as the brightest/most saturated element on the page — matches `kingkiller-black`; worth a visual check that the board squares actually pop against it rather than blending in (relevant again now that the background has shifted further purple — see §2).
30. [adopt] Everything fits one viewport with zero scrolling on both screens — worth auditing `/play/room` for the same once coordinate labels and an icon rail get added, since those add width/height we haven't accounted for yet.

### Status

Not yet implemented. Suggested starting trio (highest-value, lowest-effort): board coordinates
(#4) + a board icon-button rail (#11) + a shared left nav (#1).

---

## 2. Color palette restructure

### Context

Following the chess.com review, the user asked to restructure player-piece and background
colors: player 0 → steel (was white), player 1 → gold (was black), background → purple. Scoping
this surfaced two pre-existing issues:

- `body_color` has no backend field at all yet — `/sets/tokens` (the route `TokenBuilder.tsx`
  calls) doesn't exist, and the catalog JSON (e.g. `goblin-king.json`) has no color field. In
  `/play`, body color was entirely inferred client-side from `piece.owner`. This made the rename
  a contained, zero-data-risk, frontend-only change.
- `globals.css`'s live token values never actually matched `design_brief.md`'s documented "fantasy
  dark velvet" palette — the file still had generic Tailwind-default placeholders (`#111111`
  black, `#D97706` gold, `#7C3AED` arcane, etc.) that were apparently never applied.

### Discussion points

- Whether "steel"/"gold" should replace the core `kingkiller-white`/`black` pair or get new
  dedicated tokens — resolved in favor of new dedicated tokens (`kingkiller-steel`,
  `kingkiller-gold-deep`), since `kingkiller-white`/`black` are structurally load-bearing for
  text/cards/buttons app-wide, not just piece color.
- Gold collision with the existing accent/highlight color — resolved by giving player 1 a
  distinct, deeper `kingkiller-gold-deep` (`#8C6D2F`), separate from the accent `kingkiller-gold`
  (`#C9A84C`) used for trim/focus ring/legal-move highlight, so a highlighted gold piece doesn't
  visually disappear into its own highlight ring.
- How far "background is purple" should reach — resolved as global (`kingkiller-black` itself),
  shifted further into visible purple rather than a subtle undertone.
- Also surfaced: `design_brief.md` already documented `kingkiller-emerald` as "the board/arena
  table colour," but `BoardSquare.tsx` never actually used it — board squares reused the dark
  purple obsidian/stone tokens instead. Decided to finally wire the board to its intended emerald
  identity, so it reads as a distinct table surface rather than blending into the now-more-purple
  page chrome.

### Decision

Implemented. Final values:

| Token | Hex | Role | Status |
|---|---|---|---|
| `kingkiller-black` | `#1A1225` | Global background, dark surfaces, modal backdrops | changed |
| `kingkiller-obsidian` | `#2A1F3D` | Panel/sidebar interiors | changed |
| `kingkiller-stone` | `#4A3F5C` | Borders/dividers on dark | changed |
| `kingkiller-white` | `#F0EAD8` | Card faces, light panels, primary text on dark | synced to brief (was `#FFFFFF` placeholder) |
| `kingkiller-gold` | `#C9A84C` | Accent/trim/borders/focus ring/legal-move highlight | synced to brief (was `#D97706` placeholder) |
| `kingkiller-emerald` | `#2D6A4F` | Board square, light alternate | synced to brief + newly wired into the board |
| `kingkiller-emerald-dark` | `#1F4D38` | Board square, dark alternate | new |
| `kingkiller-steel` | `#B8C2CC` | Player 0 piece body | new |
| `kingkiller-gold-deep` | `#8C6D2F` | Player 1 piece body | new |
| `kingkiller-blue` / `blue-light` | `#3E6B99` / `#B8CFE0` | Mana track | newly documented (was live and used, but undocumented) |

Files touched: `globals.css`, `design_brief.md`, `utils/archetypes.ts` (`BodyColor` type:
`'white' | 'black'` → `'steel' | 'gold'`), `app/_components/PieceToken.tsx`,
`app/_components/BoardSquare.tsx`, `play/room/_components/PlayerPanel.tsx`.

Verified with `tsc --noEmit` and `next build` (no dev server run, no DB touched) — both clean.
Actual visual review in a browser is still outstanding.
