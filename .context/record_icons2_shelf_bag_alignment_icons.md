## Contents

1. [SHELF/BAG target rendering: From→icon, pill dropped, alignment faces added](#shelfbag-target-rendering-fromicon-pill-dropped-alignment-faces-added)

---

## SHELF/BAG target rendering: From→icon, pill dropped, alignment faces added

### Context

Icons2's `translateTargetHalfIcon` (`abilityHalfIconTranslator.ts`) rendered `SHELF`/`BAG` target
zones as a `'From'` text label plus a pill-styled, alignment-colored zone-name chip (e.g. "From
SHELF"). Asked to replace `'From'` with an icon, and separately to drop the pill entirely in favor
of plain text plus an alignment-signaling face icon in front (happy for FRIENDLY, angry for ENEMY,
none for ANY).

### Discussion points

- `'From'`'s replacement icon was chosen as `CornerRightUp` — the vertical flip of `PUT`'s existing
  `CornerRightDown` icon (`EFFECT_LEAD_ICON.PUT`), reasoned as the natural opposite: `PUT` sends a
  piece *into* a zone (down/in), `SHELF`/`BAG` targets pull a piece *from* a zone (up/out).
  Confirmed `CornerRightUp` exists in the installed `lucide-react` via its `.d.ts`.
- Face icons: confirmed `lucide-react` ships `Smile`/`Angry` before proposing them.
- Face icons render uncolored (no `color` prop, defaults to `currentColor`/black) regardless of
  alignment, per correction mid-build — only their shape (happy/angry) carries the FRIENDLY/ENEMY
  signal now, not their color.
- Flagged before building: dropping `pill: true` also drops `alignmentColor` from the zone-name
  text itself — `PieceIconCard2.tsx`'s `Chip` renderer only applies `chip.color` to `label` text in
  pill mode; non-pill chips only tint the `Icon`, never the label (`PieceIconCard2.tsx:36-41`). So
  alignment now shows purely via the face icon's color, not the zone text color. No pushback, built
  as-is.

### Decision

- Added `ALIGNMENT_ICON: Record<string, LucideIcon | undefined>` (`FRIENDLY: Smile, ENEMY: Angry,
  ANY: undefined`), parallel to the existing `ALIGNMENT_COLORS` map.
- Both `SHELF` and `BAG` branches in `translateTargetHalfIcon` now push (optional) `{ Icon:
  faceIcon, color: alignmentColor }` then `{ Icon: CornerRightUp }, { label: zoneSegments[0] }` —
  no more `'From'` label, no more `pill: true` on the zone name.
- Added `Angry`, `CornerRightUp`, `Smile` to the `lucide-react` import list.
- Verified with `tsc --noEmit` clean on the file.
