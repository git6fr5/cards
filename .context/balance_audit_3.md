# Balance Audit 3 — v0.5 new cards

Fork of [[balance_audit_2]]. Scoped to the 6 new cards and keyword renames introduced in
[[v0.5]] — SLOW→speed_increment, STUN -99→-1, AMP→SURGE, plus QUICKEN/HASTE/ENCUMBER/
DISCOUNT/INFLATE additions. Cross-reference formula: [[summoning_cost_decision_matrix]].

## NOMAD

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC |
|---|---|---|---|---|---|---|
| Sprinting Nomad | 3 (Diagonal) | -1 | 2 | ON MOVE≥1 → MODIFY ACTION_COST -1 (1 turn) → SELF | 5 | 5 |
| Weary Nomad | 3 (Diagonal) | -1 | 2 | ON MOVE≥1 → MODIFY ACTION_COST +1 (1 turn) → ENEMY BOARD:PATTERN:SQUARE:1 ALL | 5 | 5 |
| Caravan Nomad | 5 (Cross) | -1 | 2 | ON MOVE≥3 → MODIFY ACTION_COST -1 (1 turn) → FRIENDLY BOARD:PATTERN:SQUARE:1 ALL | 7 | 7 |

## BERSERKER

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC |
|---|---|---|---|---|---|---|
| Grandpa Berserker | 1 (Forward) | 0 | 0 | ON KILL≥1 → MODIFY ACTION_COST +1 (1 turn) → SELF | 1 | 1 |

## TRAP

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC |
|---|---|---|---|---|---|---|
| Inflate Trap | 1 (NONE/pawn-bucket) | -1 | 2 | ON DEATH≥1 → MODIFY SUMMON_COST +2 (99 turns) → ENEMY SHELF 1 | 2 | 2 |
| Inflate Colossus | 1 (NONE/pawn-bucket) | -1 | 3 | ON DEATH≥1 → MODIFY SUMMON_COST +1 (99 turns) → ENEMY SHELF ALL | 3 | 3 |

## Notes

- Ability strength ratings are suggested (per methodology in balance_audit_2), not
  formula-derived — flagged for correction.
- Grandpa Berserker's ability_strength=0 follows the self-harm/drawback convention
  (Dying Timekeeper precedent) — the formula has no negative-ability_strength slot.
- Caravan Nomad's SC exactly matches Good News Nomad's (7) — same shape, sanity-check passed.
- None of the 6 are wired into any `default_bags/*.txt` yet — catalog-only, matching the
  Colossal Trap precedent (see balance_audit_2's pending change #19) until a starting-bag
  inclusion decision is made.

## Pending Changes Log (implemented this pass)

1. **AMP → SURGE**: `abilityHalfIconTranslator.ts` keyword rename, regex-generalized to N. No
   catalog changes (existing `ACTION_COUNT +1 TURNS 1` pieces unaffected in value).
2. **STUN -99 → -1**: catalog rewrite in `trap/golem-trap.json`, `trap/colossal-trap.json`,
   `trap/giant-trap.json`, `timekeeper/salt-timekeeper.json`, `berserker/oldman-berserker.json`,
   `.turret/stun-turret.json`.
3. **New keywords**: `QUICKEN`, `HASTE`, `ENCUMBER`, `DISCOUNT`, `INFLATE` added to
   `abilityHalfIconTranslator.ts` as regex patterns.
4. **6 new catalog files**: `nomad/sprinting-nomad.json`, `nomad/weary-nomad.json`,
   `nomad/caravan-nomad.json`, `berserker/grandpa-berserker.json`, `trap/inflate-trap.json`,
   `trap/inflate-colossus.json`.
5. **MORPH — deferred**, pending decision on the archetype/trigger house-rule mismatch flagged
   this session (see [[v0.5]]).
