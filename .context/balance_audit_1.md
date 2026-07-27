# Balance Audit 1 — SC Formula vs Actual

Cross-reference every catalog card against [[summoning_cost_decision_matrix]] formula:

```
SC = base_cost(movement_type) + (max_distance - baseline(movement_type)) + ability_strength + 3*max(0, action_count-1) + trigger_surcharge
# baseline = 3 for Square/Cross/Diagonal, 1 for Forward (Pawn); trigger_surcharge = +3 ON SUMMON, +1 ON MOVE, else 0 — see [[summoning_cost_decision_matrix]]
```

Floor expected total at 0.

## Methodology notes / caveats

- No ability "rating" field exists in code (`backend/engine/.data/catalog/**/*.json`) — abilities are raw trigger/effect/target DSL, no numeric power score. **Ability strength column below is my judgment call (0-3), not read from data.** Treat as draft, open to correction.
- King rows are fixed at 0 per game rules — exempt from movement/distance/ability scaling (matches actual in all 3 cases).
- Action-count penalty (+3 per action above 1) is folded into "expected total" since the requested columns have no separate slot for it — flagged in Notes where it applies.
- Several abilities are self-harming (self-kill, self-sacrifice, "cannot capture") rather than power-adding. Formula only has positive ability_strength — flagged where this likely explains a large negative gap (actual much cheaper than formula predicts, correctly so).
- Turret pieces are `roleType: BUILDING` — they don't move on the board; their `movement` field may describe activation range/pattern, not motion. Base-cost-by-movement-type may be the wrong model for this archetype entirely — flagged.
- **Correction applied**: Forward/Pawn baseline distance is 1, not 3 — Pawn's base SC of 1 is calibrated at its natural reach of 1 square. All FORWARD (and NONE/pawn-bucket) rows below recomputed against this corrected baseline.
- **New rule applied**: ON SUMMON triggers get +3 SC surcharge, ON MOVE triggers get +1 SC surcharge — both separate from ability_strength, since these triggers are trivially/near-guaranteed to fire. King rows stay exempt.

---

## BERSERKER

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Berserker King | 0 | 0 | 0 | ON KILL≥1 → MODIFY SUMMON_COST -1 (99 turns) → FRIENDLY SHELF 1 WHERE ARCHETYPE:BERSERKER | 0 | 0 | King, exempt |
| Berserker of the Eastern Winds | 5 | 0 | 1 | ON KILL≥1 → PUT BAG → FRIENDLY SHELF 1 | 9 | 5 | action_count 2 → +3 folded in |
| Berserker of the Western Winds | 5 | 0 | 2 | ON KILL≥1 → KILL → FRIENDLY BOARD:PATTERN:SQUARE:6 1 | 10 | 5 | action_count 2 → +3 folded in |
| Berserker Witch | 9 | -1 | 2 | ON KILL≥1 → MODIFY ACTION_COUNT +1 (1 turn) → SELF | 10 | 7 | |
| Chieftess Berserker | 9 | 0 | 2 | ON KILL≥1 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST<=1 | 11 | 7 | |
| Divine Berserker | 5 | 2 | 2 | ON KILL≥4 → MODIFY ACTION_COST -5 (99 turns) → SELF | 9 | 8 | close |
| Mr Berserker | 1 | 0 | 2 | ON KILL≥1 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST<=2 | 3 | 1 | undercosted after Pawn baseline fix |
| Oldman Berserker | 5 | 3 | 3 | ON KILL≥3 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL | 11 | 8 | board-wide stun, undercosted |
| Royal Berserker | 1 | 0 | 2 | ON KILL≥1 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST>2 | 3 | 2 | undercosted after Pawn baseline fix |
| Storm Berserker | 3 | 2 | 1 | ON KILL≥1 → PUT SHELF → SELF | 6 | 3 | |
| Warden Berserker | 5 | 0 | 1 | ON KILL≥2 → PUT SHELF → DEFENDER | 6 | 5 | close |

## DEMON

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Reaper Demon | 5 | 5 | 3 | ON SUMMON≥1 → KILL → ANY BOARD:PATTERN:CROSS:6 ALL | 16 | 8 | ON SUMMON +3 surcharge folded in — biggest undercost in set |

## NOMAD

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Nomad King | 0 | 0 | 0 | ON MOVE≥5 → MODIFY ACTION_COUNT +1 (1 turn) → FRIENDLY BOARD:PATTERN:SQUARE:1 ALL | 0 | 0 | King, exempt |
| Exploding Nomad | 3 | -1 | 2 | ON MOVE≥3 → KILL → ANY BOARD:PATTERN:CROSS:1 1 WHERE ANY | 5 | 3 | ON MOVE +1 surcharge folded in |
| Good News Nomad | 5 | -1 | 2 | ON MOVE≥3 → MODIFY ACTION_COUNT +1 (1 turn) → FRIENDLY BOARD:PATTERN:SQUARE:1 ALL | 7 | 3 | ON MOVE +1 surcharge folded in; board-wide buff, undercosted |
| Nomad Priest | 3 | -1 | 2 | ON MOVE≥1 → MODIFY ACTION_COUNT +1 (1 turn) → FRIENDLY BOARD:PATTERN:SQUARE:1 ALL | 5 | 2 | ON MOVE +1 surcharge folded in |
| Wandering Ghost | 5 | 0 | 2 | ON MOVE≥1 → MODIFY ACTION_COUNT -1 (1 turn) → ENEMY BOARD:PATTERN:SQUARE:1 ALL | 8 | 2 | ON MOVE +1 surcharge folded in; pacifist/no-capture drawback not in formula — explains remaining gap |

## SOLDIER

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Colossal Soldier | 3 | 3 | 0 | none | 6 | 6 | exact match |
| Impish Soldier | 1 | 0 | 0 | none | 1 | 1 | exact match after Pawn baseline fix |
| Night Soldier | 5 | 2 | 0 | none | 7 | 3 | no ability, still undercosted on pure movement |
| Triplet Soldier | 5 | 0 | 0 | none (ability is the 3 actions/turn itself) | 11 | 7 | action_count 3 → +6 folded in |

## TIMEKEEPER

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Dying Timekeeper | 5 | -2 | 0 | ON TURNEND≥2 → KILL → SELF | 3 | 0 | self-kill after 2 turns is a drawback, not power — formula gap |
| Egg | 1 | -1 | 2 | ON TURNEND≥3 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE SUMMON_COST<=2 | 2 | 1 | undercosted after Pawn baseline fix (NONE treated as pawn-bucket, baseline 1) |
| Salt Timekeeper | 1 | 0 | 0 | ON TURNEND≥2 → KILL → SELF | 7 | 0 | action_count 3 → +6 folded in; gap widened after baseline fix, but self-kill drawback offsets — formula gap |

## TRAP

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Trapped King | 0 | 0 | 0 | ON DEATH≥1 → MODIFY SUMMON_COST -1 (1 turn) → FRIENDLY SHELF ALL | 0 | 0 | King, exempt |
| Giant Snare | 3 | 1 | 1 | ON DEATH≥1 → PUT SHELF → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:SOLDIER, SUMMON_COST=6 | 5 | 4 | close |
| Golem Snare | 3 | -1 | 1 | ON DEATH≥1 → PUT SHELF → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:TRAP, SUMMON_COST=4 | 3 | 2 | close |

## TURRET

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Adrenaline Turret | 9 | -2 | 1 | ON ACTIVATE → MODIFY ACTION_COUNT +1 (1 turn) → DEFENDER | 8 | 5 | building — base-cost-by-movement model questionable |
| Graveyard Turret | 9 | -2 | 3 | ON ACTIVATE → KILL → ANY BOARD:PATTERN:SQUARE:8 ALL | 10 | 10 | exact match |
| Sacrificial Turret | 9 | -2 | 1 | ON ACTIVATE → KILL → DEFENDER | 8 | 2 | self-sacrifice drawback not modeled + building model questionable |
| Stun Turret | 5 | -1 | 2 | ON ACTIVATE → MODIFY ACTION_COUNT -99 (1 turn) → DEFENDER | 6 | 3 | building model questionable |
| Summoning Turret | 9 | -2 | 1 | ON ACTIVATE → PUT SHELF → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:TURRET | 8 | 2 | building model questionable |

## VANGUARD

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Goblin Vanguard | 1 | 0 | 2 | ON PROMOTION≥1 → KILL → ENEMY BOARD:PATTERN:CROSS:1 1 WHERE ANY | 3 | 3 | exact match after Pawn baseline fix |
| Hob Vanguard | 1 | 0 | 2 | ON PROMOTION≥1 → KILL → ANY BOARD:PATTERN:SQUARE:1 ALL | 3 | 1 | undercosted after Pawn baseline fix |

---

## Flagged: biggest undercosts (actual well below formula — potential power outliers)

*(Recomputed after Pawn baseline fix and ON SUMMON/ON MOVE trigger surcharge — several gaps widened further.)*

1. **Reaper Demon** (-8) — ON SUMMON +3 surcharge pushed this from already-worst to far-worst; on-summon board wipe at SC 8 is badly undercosted
2. **Salt Timekeeper** (-7) — still largely explained by self-kill drawback not in formula
3. **Sacrificial Turret** (-6), **Summoning Turret** (-6) — turret base-cost model likely wrong; needs its own baseline, not Queen/Castle/Bishop/Pawn analog
4. **Wandering Ghost** (-6) — ON MOVE +1 surcharge folded in; still partly justified by pacifist restriction not in formula
5. **Berserker of the Western Winds** (-5)
6. **Good News Nomad** (-4), **Berserker of the Eastern Winds** (-4), **Night Soldier** (-4), **Chieftess Berserker** (-4), **Triplet Soldier** (-4)
7. **Nomad Priest** (-3), **Oldman Berserker** (-3), **Storm Berserker** (-3), **Stun Turret** (-3), **Adrenaline Turret** (-3), **Dying Timekeeper** (-3), **Berserker Witch** (-3)
8. **Exploding Nomad** (-2), **Mr Berserker** (-2), **Hob Vanguard** (-2)
9. **Royal Berserker** (-1), **Egg** (-1)

## Flagged: overcosts (actual above formula)

None remaining after the Pawn baseline fix — Goblin Vanguard, Royal Berserker, Impish Soldier, and Egg all previously read as overcosted purely because the old baseline-3 assumption penalized short-reach Forward/NONE pieces too harshly. All four now read as exact-match or undercosted instead.

## Formula gaps surfaced by this pass

1. **No negative/drawback ability handling** — self-kill (Dying/Salt Timekeeper), self-sacrifice (Sacrificial Turret), no-capture (Wandering Ghost) all reduce actual SC below formula prediction in a way that looks *correct by design*, but the formula has no mechanism to justify it. Consider a negative ability_strength range for drawback effects.
2. **Turret/building base-cost mismatch** — all 5 turrets undercost or exactly-match, never overcost, suggesting SQUARE/CROSS base costs (9/5) don't fit stationary activate-only pieces. Worth a separate building base cost, independent of the Queen/Castle/Bishop/Pawn ladder.
3. **Ability strength is currently subjective** — no rating field in the catalog JSON. If this formula is adopted, recommend adding an explicit `ability_rating: 0-3` field per card so audits like this stop requiring manual judgment.
4. **Pawn baseline correction (resolved this pass)** — Forward/Pawn baseline was wrongly set to 3 like Queen/Castle/Bishop; corrected to 1, matching Pawn's actual base SC of 1. This flipped every Forward/NONE-pawn-bucket card from "overcosted or matched" to "matched or undercosted," which reads as a more internally consistent result.
5. **ON SUMMON / ON MOVE trigger surcharge (added this pass)** — these triggers fire near-unconditionally, so they now add +3/+1 SC on top of ability_strength. Reaper Demon (ON SUMMON) is now the single worst undercost in the set at -8.
