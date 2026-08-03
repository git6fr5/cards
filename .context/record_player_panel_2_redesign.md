# Record: Player Panel 2 redesign

## Table of contents

1. [Self-side player panel redesign](#1-self-side-player-panel-redesign)

---

## 1. Self-side player panel redesign

### Context

The user sketched a new layout for the self-side player panel directly on a screenshot of the play room: player name/label at the top, a vertical column of mana stars (filled/empty based on `current_mana`/`total_mana`), a fixed 4-row × 2-column shelf grid (max hand size is 7), and a full-width "End Turn" bar at the bottom, all inside one bounded card. The existing `PlayerPanel`/`PlayerShelf`/`ManaTrack`/`ManaToken` render a single-row mana track and an auto-fit shelf grid, with the end-turn button rendered as a separate sibling in `MainPanel` rather than embedded in the panel — too different from the sketch to reach via a prop flag, so new sibling components were built instead of branching the originals.

The sketch's red/blue coloring was confirmed to be annotation only (marking where things go), not a literal color spec — the new components use the project's existing `raja-*` theme tokens, not red/blue.

### Discussion points

- Initial ask was scoped as "create it and wire it in instead of the current PlayerPanel" — under this project's CLAUDE.md hard-stop rule (no file writes outside an explicit `/build` invocation), the assistant paused after producing a plan and waited for `/build` rather than implementing immediately.
- The user clarified that duplicate components were acceptable — explicitly naming `PlayerShelf2`, `ManaTrack2`, `ManaToken2` — which set the naming convention (`*2` suffix) used for every new file rather than trying to parameterize the existing ones.
- Scope check: the sketch showed only the self player's panel redesigned (big card layout); the opponent's side in the screenshot still matched the existing compact `PlayerPanel` layout, so the opponent slot in `MainPanel` was left on the original `PlayerPanel` — only the self slot was switched to `PlayerPanel2`.

### Decision

Built four new components instead of editing the originals in place:
- `frontend/app/_components/ManaToken2.tsx` — star icon (Lucide `Star`) version of `ManaToken`, same `filled`/`empty`/`locked` state contract.
- `frontend/app/_components/ManaTrack2.tsx` — vertical (`flex-col`) stack of `ManaToken2`, same `current`/`total` contract as `ManaTrack`.
- `frontend/app/(protected)/play/room/_components/PlayerShelf2.tsx` — same drag/click behavior as `PlayerShelf`, but `grid-cols-2` (fixed 2-column, 4-row layout) instead of `auto-fit`.
- `frontend/app/(protected)/play/room/_components/PlayerPanel2.tsx` — card container (`bg-raja-chrome-panel` + border) composing label, `ManaTrack2` + `PlayerShelf2` side by side, and a full-width `EndTurnButton` pinned to the bottom via `mt-auto`.

`EndTurnButton` got a non-breaking `fullWidth?: boolean` prop (default `false`, passed through to `RajaButton`) rather than a new `EndTurnButton2`, since it's a stateless one-line pass-through with no structural difference to duplicate.

`MainPanel.tsx` now renders `PlayerPanel2` (with `onEndTurn`/`isSubmitting` passed in) for the self slot and keeps `PlayerPanel` for the opponent slot; the standalone `EndTurnButton` that used to sit next to `PlayerPanel` in `MainPanel` was removed since it's now embedded in `PlayerPanel2`.

Verified via `npx tsc --noEmit` (no dev server, per this project's "never run the dev server" rule) — no errors in any of the touched/new files.
