## Contents

1. [Piece_OnBoard visual fix](#1-piece_onboard-visual-fix)

---

## 1. Piece_OnBoard visual fix

### Context

`Piece_OnBoard.tsx` was split off from a shared Piece render component (commit `e948d69`,
"split Piece render into Card/Shelf/Board") but kept the old card-style layout: a solid card
panel background, a summon-cost badge, and a solid-color ability ribbon — plus leftover
`Piece_OnShelf` naming from the component it was copied from. The user wants pieces rendered
directly on the board to read as sitting on the board itself, not as a card floating over it,
with only the movement-pattern icon kept inside a bordered circle badge.

### Discussion points

- User specified three initial requirements: (1) drop the summon-cost display on the board,
  (2) shrink the bordered/ringed badge down to enclose only the movement-pattern icon, shaped
  as a circle, (3) strip the card background off every other element so they sit directly on
  the board square.
- Assistant ran a `/bullet` pass against a screenshot of the in-progress result and flagged 12
  issues; on review, several were speculative (name-label clipping, corner-element
  repositioning, target-filter-chip overlap) and turned out not to be real bugs once checked
  against the fixed 4.5cm board-square sizing in `BoardSquare.tsx` — only the confirmed ones
  were fixed, per the "don't fix what isn't broken" default.
- User explicitly overrode one flagged item: no archetype/team color distinction on the king's
  circle border — both sides should render the same fixed black-ish border regardless of
  archetype, correcting an over-broad initial read of "border should be a circle."

### Decision

Fixed in `Piece_OnBoard.tsx`:
- Removed the summon-cost badge (`Gem` icon + cost number) entirely.
- Removed the solid-color background from the ability ribbon (was `ringColor` via inline
  style) and dropped the `light` chip-text variant that depended on that dark background.
- Wired the `className` prop to the component's root element (it was previously applied to an
  inner div, a leftover from the shared-component split).
- Replaced the `rounded-[40px]` ellipse (broke on multi-icon rows since width != height) with a
  computed square diameter (`mpsRowWidth`/`mpsCircleDiameter`) so the movement-icon badge is a
  true circle at any `action_count`.
- Removed dead `archetypeBorderColor`/`ringColor` color-mix computations — no longer needed now
  that the badge border is a fixed token color (`border-raja-chrome-text`) rather than
  archetype-tinted, per the user's explicit call to drop team/archetype border distinction.
- Renamed `Piece_OnShelf`/`Piece_OnShelfProps` to `Piece_OnBoard`/`Piece_OnBoardProps` — pure
  copy-paste leftover; the real `Piece_OnShelf.tsx` is a separate sibling file.
- Left alone (checked, not actually broken): name-label fixed `left-8 right-8` inset (board
  square size is fixed at 4.5cm with no scaling, so no clipping risk) and the absolute-positioned
  corner/target-filter chip groups (contained within the piece's own bounding box, no overflow
  into neighboring squares).
