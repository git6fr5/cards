## Contents

1. [SLOW keyword repointed from action_count to speed_increment](#slow-keyword-repointed-from-action_count-to-speed_increment)

---

## SLOW keyword repointed from action_count to speed_increment

### Context

`SLOW` was a fixed-value ability keyword in `frontend/utils/abilityHalfIconTranslator.ts`
(`MODIFY_KEYWORDS`), mapped 1:1 to the exact DSL string `ACTION_COUNT -1 TURNS 1` — same lever as
`STUN` (`ACTION_COUNT -99 TURNS 1`), just weaker. Three catalog pieces carried it: Goblin Vanguard
(`ON PROMOTION`, square:1, ANY), Wandering Ghost (`ON MOVE`, square:1, ENEMY), Bob Bob Berserker
(`ON KILL`, diagonal:1, ENEMY).

Separately, `backend/engine/entities/piece.py` had gained a `PieceAttributes.speed_increment`
field and a `Piece.movement_range` property (`self.movement.get_positions(speed_increment)`) from
the `PieceMovement` migration (see `record_piece_movement_migration.md`) — a real movement-penalty
lever that `ACTION_COUNT`-based SLOW never used; `ACTION_COUNT -1` just drains one action (a
lighter STUN), it doesn't touch movement distance at all.

### Discussion points

- Considered leaving `SLOW` as an action-drain keyword and adding a separate keyword for a
  movement-penalty effect, vs. repointing `SLOW` itself to `speed_increment` semantics. Decided on
  repointing — `SLOW` reads as "moves less", which `speed_increment` delivers directly, whereas
  `action_count` drain reads more like a stun variant.
- Generalized from a fixed `SLOW` (implicit N=1) to a parameterized `SLOW N`, so the DSL supports
  `MODIFY SPEED_INCREMENT -N TURNS 1` for any N, not just -1.
- Noted but did not act on: Wandering Ghost's `concept` text ("that unit cannot move on its next
  turn") was accurate under the old `ACTION_COUNT -1` (full action block), but under
  `SPEED_INCREMENT -1` a piece with `movement_distance` > 1 would still be able to move (just
  shorter), so the flavor text is now only fully accurate for distance-1 movers. Left as-is —
  copy update is the user's call, not flagged as blocking.

### Decision

- `backend/engine/.data/catalog/vanguard/goblin-vanguard.json`,
  `backend/engine/.data/catalog/nomad/wandering-ghost.json`,
  `backend/engine/.data/catalog/berserker/bob-bob-berserker.json` — ability DSL line changed from
  `MODIFY ACTION_COUNT -1 TURNS 1` to `MODIFY SPEED_INCREMENT -1 TURNS 1`.
- `frontend/utils/abilityHalfIconTranslator.ts` — removed the fixed `'ACTION_COUNT -1 TURNS 1':
  'SLOW'` entry from `MODIFY_KEYWORDS`; added a `SLOW_PATTERN` regex
  (`/^SPEED_INCREMENT -(\d+) TURNS 1$/`) matched in the `MODIFY` case to render `SLOW N` for any
  N, alongside the still-exact-match `AMP`/`STUN` entries.
- Verified end-to-end without touching the DB: `python -m json.tool` on all three catalog files,
  `Piece.create()` on fabricated in-memory dicts confirming each resolves to
  `{'attribute': 'speed_increment', 'delta': -1, 'turns': 1}`, `grep` confirming no leftover
  `ACTION_COUNT -1 TURNS 1` or hardcoded `'SLOW'` string anywhere, and `tsc --noEmit` clean on the
  translator file.
