# Summoning Cost (SC) Decision Matrix

SC is main balance lever for cards. Formula-driven, not gut-feel.

## 1. Base cost by movement type

Movement type set base cost, calibrated at expected distance 3.

| Movement | Piece analog | Base SC |
|---|---|---|
| Square | Queen | 9 |
| Cross | Castle | 5 |
| Diagonal | Bishop | 3 |
| Forward | Pawn | 1 |
| Square, dist fixed 1 | King | 0 (fixed, exempt from scaling) |

## 2. Distance adjustment

Expected distance baseline is calibrated **per movement type**, not one flat number:

| Movement | Baseline distance |
|---|---|
| Square, Cross, Diagonal | 3 |
| Forward (Pawn) | 1 |
| King | fixed, exempt from scaling |

```
distance_adjustment = max_distance - baseline(movement_type)
```

- Max distance above baseline → +1 SC per step over
- Max distance below baseline → -1 SC per step under
- King exempt — stays 0 regardless of distance
- Forward/Pawn baseline is 1 (not 3) — Pawn's base SC of 1 is calibrated at its natural reach of 1 square, unlike Queen/Castle/Bishop which are calibrated at reach 3

## 3. Ability cost

Each ability rated 0-3 by power level.

```
ability_cost = sum(ability_ratings)
```

Multiple abilities on one unit → sum all ratings.

## 4. Multi-action penalty

Action count = times unit can move per turn.

- Action count 1 → no penalty
- Action count > 1 → rare by design, costly

```
multi_action_penalty = 3 * max(0, action_count - 1)
```

## 5. Trigger surcharge

Some ability triggers are cheap to activate — easy uptime deserves its own surcharge, separate from ability_strength (which rates the effect's power, not how easily it fires).

| Trigger | Surcharge | Why |
|---|---|---|
| ON SUMMON | +3 | Fires unconditionally the instant the piece enters play — no setup cost to the player |
| ON MOVE | +1 | Fires on the piece's own normal movement — near-guaranteed uptime, but not free like SUMMON |
| all other triggers (KILL, DEATH, TURNEND, ACTIVATE, PROMOTION) | +0 | Already gated by a real cost or rare event |

King rows stay exempt from this surcharge along with the rest of the scaling.

```
trigger_surcharge = 3 if trigger == ON_SUMMON
                   = 1 if trigger == ON_MOVE
                   = 0 otherwise
```

## Full formula

```
SC = base_cost(movement_type)
   + (max_distance - baseline(movement_type))   [0 for King, exempt]
   + sum(ability_ratings)
   + 3 * max(0, action_count - 1)
   + trigger_surcharge(trigger_type)             [0 for King, exempt]
```

## Reference table

| Movement | Base | Baseline dist | Dist 1 | Dist 2 | Dist 3 | Dist 4 | Dist 5 |
|---|---|---|---|---|---|---|---|
| Square (Queen) | 9 | 3 | 7 | 8 | 9 | 10 | 11 |
| Cross (Castle) | 5 | 3 | 3 | 4 | 5 | 6 | 7 |
| Diagonal (Bishop) | 3 | 3 | 1 | 2 | 3 | 4 | 5 |
| Forward (Pawn) | 1 | 1 | 1 | 2 | 3 | 4 | 5 |
| Square dist 1 (King) | 0 | exempt | 0 | — | — | — | — |

Forward/Pawn now scales 1:1 with distance (SC = distance) before ability/multi-action — floor-at-0 note no longer applies to Pawn since dist 1 already gives SC 1, not negative.
