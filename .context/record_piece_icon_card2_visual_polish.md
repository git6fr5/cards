## Contents

1. [action_cost dots instead of a number, wrapped in rows of 3](#action_cost-dots-instead-of-a-number-wrapped-in-rows-of-3)
2. [Card shadow, thicker border, rounded corners](#card-shadow-thicker-border-rounded-corners)
3. [Second border via ring](#second-border-via-ring)
4. [Icon/text sizes extracted to consts, pill size given a real token](#icontext-sizes-extracted-to-consts-pill-size-given-a-real-token)
5. [Border/ring/ability-strip switched to archetype color](#borderringability-strip-switched-to-archetype-color)

---

## action_cost dots instead of a number, wrapped in rows of 3

### Context

`PieceIconCard2.tsx:135-146` rendered `action_cost` as a plain number stacked above the movement
pattern icon(s). Asked to represent it visually instead — N filled dots — and to swap the stacking
order (pattern icon(s) first, dots below).

### Discussion points

- Confirmed `lucide-react`'s icons accept a `fill` prop via existing precedent
  (`ManaToken.tsx:14`, `fill={state === 'filled' ? 'currentColor' : 'none'}`) before proposing
  `Circle` with `fill`/`color` both set to `archetype.color` (avoids a default black/gray stroke
  ring around a differently-colored fill).
- Follow-up: wrap dots into rows of 3 rather than a single unbounded row — implemented as a nested
  `Array.from` (outer = row count via `Math.ceil(action_cost / 3)`, inner = dots per row via
  `Math.min(3, action_cost - row * 3)`).

### Decision

- Added `Circle` to the `lucide-react` import.
- Swapped stacking order: `PieceMovementIcon` row first, dots row second (was number-then-icon).
- Dots: `size={6}`, `fill`/`color` both `archetype.color`, wrapped into rows of 3 (`flex-col` of
  `flex` rows), count driven by `piece.attributes.action_cost` (0 → empty, matches NONE-movement
  pieces like Traps with no crash).
- Verified with `tsc --noEmit` clean on the file.

---

## Card shadow, thicker border, rounded corners

### Context

Asked to add a slight drop shadow, slightly thicker border, and slightly rounded corners to the
`PieceIconCard2` token itself (the outer `4.5cm` card div, `PieceIconCard2.tsx:110`).

### Discussion points

- Per `guides/tailwind_rules.md`, `border-radius` must be tokenized even for single use — checked
  `frontend/app/globals.css` first and found `--radius-sm: 2px` already defined in `@theme inline`,
  so Tailwind's `rounded-sm` utility is token-backed here, not a raw value; used as-is.
- `border-[4px]` was flagged by the IDE's Tailwind linter as expressible via the canonical `border-4`
  utility — switched to match (same 4px value, shorter class, no bracket syntax needed since 4 is a
  standard Tailwind border-width step).
- Shadow has no project token (`globals.css` has no `--shadow-*` definitions) and isn't in
  `tailwind_rules.md`'s mandatory-tokenize list (opacity, z-index, border-radius, font-size,
  line-height, width, max-width) — used Tailwind's built-in `shadow-sm` preset directly.

### Decision

`PieceIconCard2.tsx:110`'s outer div: `border-[3px]` → `border-4`, added `rounded-sm shadow-sm`.
Verified with `tsc --noEmit` clean.

Note: `rounded-sm` was later changed to `rounded-md` directly by the user/linter, outside this
build — left as-is per instruction not to revert intentional out-of-band edits.

---

## Second border via ring

### Context

Asked how to add a second border to the card. `border` is a single CSS layer — can't stack two
border declarations on one element without either a wrapper div (changes the box model, invasive
given this component's absolutely-positioned children) or a second, independent box-model layer.

### Discussion points

- Proposed three options: Tailwind `ring-*` (box-shadow-based, no layout impact), a nested wrapper
  div with its own `border-*` (true concentric border, but resizes/repads the inner card), or
  `outline`/`outline-offset` (similar non-layout-affecting behavior to `ring`, less idiomatic in
  this Tailwind codebase). `ring` picked as the natural fit given the card's existing
  `absolute`/`inset-0` children.
- "No gap, black ring" — no `ring-offset-*` class needed (Tailwind's default ring offset is
  already `0`). Checked `globals.css` for a black token per `tailwind_rules.md`'s
  tokens-over-raw-values rule before using a raw `ring-black` — found `--color-raja-black:
  #171512`, used `ring-raja-black` instead.

### Decision

`PieceIconCard2.tsx:110`: added `ring-2 ring-raja-black` to the outer div's class string.
Verified with `tsc --noEmit` clean.

---

## Icon/text sizes extracted to consts, pill size given a real token

### Context

Asked what controlled icon sizes, then text sizes, in the card — answered by listing every raw
`size={N}`/`text-*` value in the file, then asked to pull all of them into named consts.

### Discussion points

- Icon sizes: `CORNER_ICON_SIZE`, `CHIP_ICON_SIZE`, `DOT_SIZE`, `KING_MPS_BASE_SIZE`,
  `UNIT_MPS_BASE_SIZE`. Values were being live-tuned in the editor concurrently with this edit —
  re-read the file mid-edit each time a stale-content error surfaced, and matched the const values
  to whatever was currently on disk rather than overwriting the user's in-progress tuning.
- Text sizes: found `text-xs` (5 sites) already token-backed (`globals.css`'s
  `--font-size-xs: 0.75rem`), but the pill label's `text-[0.6rem]` (1 site) had no matching token
  in the scale (`xs`/`sm`/`base`/`lg`/`xl` = `0.75`/`0.875`/`1`/`1.125`/`1.25rem`) — flagged per
  `tailwind_rules.md`'s mandatory font-size tokenization rule before deciding whether to add a real
  token or just extract the raw value as-is. User chose to add the token.

### Decision

- `globals.css`: added `--font-size-pill: 0.6rem` to the `@theme inline` font-size scale, next to
  `--font-size-xs`.
- `PieceIconCard2.tsx`: added `PILL_TEXT_SIZE = 'text-pill'` and `BODY_TEXT_SIZE = 'text-xs'`
  consts; converted all 6 `className` strings carrying a text-size class from string literals to
  template literals interpolating the relevant const.
- Icon-size consts (`CORNER_ICON_SIZE=24`, `CHIP_ICON_SIZE=14`, `DOT_SIZE=8`,
  `KING_MPS_BASE_SIZE=56`, `UNIT_MPS_BASE_SIZE=52` as of this record) wired into all 5 `size={N}`
  props that previously had inline numbers.
- Verified with `tsc --noEmit` clean after each edit.

---

## Border/ring/ability-strip switched to archetype color

### Context

Asked to switch the card border from the existing `ownerIndex`-based color
(`border-raja-chrome-text` / `border-raja-orange`) to `archetype.color` at 0.5 alpha, then the
ring (added earlier this session as a second border, see section 3) to a darkened/near-black
version of the same archetype color, then the bottom ability strip (previously static
`bg-raja-orange`) to match the border color and gain rounded top corners.

### Discussion points

- `archetype.color` is a runtime JS hex string, not a static Tailwind class — Tailwind's compiler
  can't pick up a dynamic `border-[${archetype.color}]/50` className since it only scans literal
  source text. Followed the codebase's existing pattern for this (`Chip`'s pill background,
  `style={{ backgroundColor: `${chip.color}B3` }}`): inline `style` with a hex-suffix alpha
  (`80` ≈ 0.5), not a Tailwind class.
- Dropping the `ownerIndex`-based border removes the only visual signal distinguishing which
  player owns a piece — flagged explicitly before building. User confirmed proceeding anyway
  ("I will figure what picks it up later"); `ownerIndex` stays in the props interface, unused for
  now.
- "Archetype color, saturation 0.5, value 0.5" (HSV terms) for the ring was the original ask —
  investigated what a full hex→HSV→hex round-trip would take (no color-conversion utility existed
  in the codebase yet). User simplified to "just a near-black version" instead, which doesn't need
  a full HSV conversion: uniformly scaling RGB channels by a factor preserves hue/saturation ratios
  while lowering value, since V = max(r,g,b) in HSV and H/S depend only on ratios between channels.
- Initial concern about overriding Tailwind's `ring` color dynamically (thought it would require
  hardcoding `shadow-sm`'s box-shadow value to combine with a raw `boxShadow` override) turned out
  overcomplicated — `ring` reads its color from the `--tw-ring-color` CSS custom property, which
  can be overridden via inline `style` without touching `boxShadow` directly, so it composes with
  `shadow-sm`'s separate box-shadow layer with no conflict.

### Decision

- Added `darken(hex, factor)` helper (RGB channel scaling, no HSV round-trip) and
  `RING_DARKEN_FACTOR = 0.15` const.
- Outer div: removed `borderCls`/`ring-raja-black`; added `archetypeBorderColor =
  `${archetype.color}80`` and `ringColor = darken(archetype.color, RING_DARKEN_FACTOR)`, applied
  via `style={{ borderColor: archetypeBorderColor, '--tw-ring-color': ringColor }}` (cast through
  `React.CSSProperties` for the custom-property key).
- Ability strip: `bg-raja-orange` → `style={{ backgroundColor: archetypeBorderColor }}` (same value
  as the border, kept in sync via the shared const), added `rounded-t-md` to match the card's own
  `rounded-md`.
- Verified with `tsc --noEmit` clean.
