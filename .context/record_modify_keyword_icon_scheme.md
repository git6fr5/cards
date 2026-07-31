## Contents

1. [KILL renders as BOMB pill when targeting a board pattern](#kill-renders-as-bomb-pill-when-targeting-a-board-pattern)
2. [AMP/STUN generalized to N, pencil icon dropped on keyword match](#ampstun-generalized-to-n-pencil-icon-dropped-on-keyword-match)

---

## KILL renders as BOMB pill when targeting a board pattern

### Context

Icons2 (`abilityHalfIconTranslator.ts`, feeding `PieceIconCard2`) rendered every `KILL` effect
line as a bare Axe icon, regardless of target. The ask was to relabel `KILL` as "Bomb" — but only
when the kill's target is an area-of-effect board pattern (e.g. `ANY BOARD:PATTERN:SQUARE:1 ALL`),
not a single-target or non-board kill (`SELF`, `DEFENDER`, `SHELF`, `BAG`).

### Discussion points

- First pass asked to add a `BOMB` label pill next to the Axe icon; user then walked it back to a
  full icon swap — `BOMB` pill replaces the Axe entirely, doesn't sit alongside it.
- Effect and target are parsed by two independent functions (`translateEffectHalfIcon`,
  `translateTargetHalfIcon`), operating on separate DSL lines with no shared state — the
  board-pattern check needed a small cross-line signal threaded from the caller
  (`translateAbilityHalfIcon`) into the effect function, rather than restructuring either parser.
- Rename only: the underlying DSL keyword stays `KILL` — this is purely an Icons2 render-label
  change, no engine/parser/catalog impact.

### Decision

- `translateEffectHalfIcon` takes a new `isBoardPatternTarget: boolean` param; `KILL` renders
  `[{ label: 'BOMB', pill: true }]` when true, `[{ Icon: Axe }]` otherwise.
- `translateAbilityHalfIcon` derives `isBoardPatternTarget` by checking the target line's zone
  token (`targetParts[1]`, same index `translateTargetHalfIcon` uses) equals `'BOARD'` before the
  `:` segments — covers `SELF`/`DEFENDER` (single-token target lines) as `undefined` → falsy.
- Verified with `tsc --noEmit` on the file.

---

## AMP/STUN generalized to N, pencil icon dropped on keyword match

### Context

`AMP` and `STUN` were exact-string entries in `MODIFY_KEYWORDS` (`ACTION_COUNT +1 TURNS 1` →
`AMP`, `ACTION_COUNT -99 TURNS 1` → `STUN`), same shape `SLOW` had before it was generalized to
`SLOW N` off `SPEED_INCREMENT` (see `record_slow_keyword_speed_increment.md`). Asked to bring
`AMP`/`STUN` to the same `N`-parameterized shape, and separately, to drop the pencil
(`EFFECT_LEAD_ICON.MODIFY`) lead icon whenever a keyword match renders (matching the KILL/BOMB
icon-swap-not-append treatment above) — pencil only shows for the raw-DSL fallback case now.

`STUN`'s `-99` was a sentinel for "wipe the whole turn's actions" (mirrors `formatNumber`'s
`PERMANENT_TURNS=99` → `∞` special-case elsewhere in the file), not a real N. Confirmed intent was
to actually rewrite the catalog data `-99` → `-1`, changing `STUN` from a full-turn action wipe to
a single-action drain — a real balance change, not just a keyword-scheme cleanup.

### Discussion points

- Confirmed no collision between `STUN`'s `ACTION_COUNT -N` pattern and `SLOW`'s: `SLOW` moved off
  `ACTION_COUNT` onto `SPEED_INCREMENT` in the prior build, so every negative `ACTION_COUNT` modify
  now unambiguously means `STUN N`.
- Scope of the `-99` → `-1` rewrite: included the disabled `.turret/stun-turret.json` (dot-prefixed,
  excluded from the catalog glob per `b93f51d`, not currently loaded by the engine) alongside the
  5 live pieces, for data consistency even though it isn't live.
- `AMP` pieces (`nomad-priest`, `nomad-king`, `good-news-nomad`, `berserker-witch`,
  `adrenaline-turret`) needed no catalog value change — already `+1`, only the label logic
  generalized.

### Decision

- `frontend/utils/abilityHalfIconTranslator.ts`: replaced the `MODIFY_KEYWORDS` exact-match map
  with three regexes (`AMP_PATTERN`, `STUN_PATTERN`, `SLOW_PATTERN`) and a `resolveModifyKeyword`
  helper trying each in order, returning `` `AMP ${N}` ``/`` `STUN ${N}` ``/`` `SLOW ${N}` ``. The
  `MODIFY` case now renders label-only (`[{ label: keyword, pill: true }]`) on any match, and
  `[{ Icon: EFFECT_LEAD_ICON.MODIFY }, { label: rest }]` only on the unmatched fallback.
- Rewrote `MODIFY ACTION_COUNT -99 TURNS 1` → `MODIFY ACTION_COUNT -1 TURNS 1` in 6 catalog files:
  `trap/golem-trap.json`, `trap/colossal-trap.json`, `trap/giant-trap.json`,
  `timekeeper/salt-timekeeper.json`, `berserker/oldman-berserker.json`,
  `.turret/stun-turret.json`.
- Verified without touching the DB: `python -m json.tool` on all 6 rewritten files, `Piece.create()`
  on each confirming `{'attribute': 'action_count', 'delta': -1, 'turns': 1}`, and `tsc --noEmit`
  clean on the translator file.
