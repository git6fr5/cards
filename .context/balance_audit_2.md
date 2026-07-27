# Balance Audit 2 — Redesign Draft (BUILT)

Fork of [[balance_audit_1]]. This file tracked proposed card redesigns (rename/reclass/movement/ability changes) as the user called them out. **All 26 entries in the Pending Changes Log have been implemented** against the actual catalog JSON files and default bag `.txt` files, and every card's `summon_cost` has been aligned to its formula-computed expected total from this file.

## ⚠️ Build-time finding: default bags now fail composition validation

Reclassing several cards' movement types (Windwalker Soldier/Whiplash Soldier onto SQUARE/DIAGONAL; Reaper Statue Demon, Giant Trap, Golem Trap, and all 4 turrets onto NONE/FORWARD — the "pawn" bucket in `backend/play/bag/tools.py`) pushes bucket totals in all three default bags past `BUCKET_CAPS` from `validate_bag_composition`:

- **bag_0.txt**: square 4/2 (over — Windwalker Soldier ×2 also exceeds the 1-per-name cap), diagonal 6/4 (over)
- **bag_1.txt**: pawn 22/16 (over)
- **bag_2.txt**: pawn 19/16 (over) — also now 26 pieces instead of 27 (Sacrificial Turret removed, not backfilled)

This wasn't caught during the SC-formula audit since bucket caps are a separate rule from summoning cost. **Not fixed here** — rebalancing bag quantities to satisfy the caps is a composition/design decision beyond "align cost to formula," and guessing at new quantities would be inventing scope. Bags will need their quantities revisited (or the caps themselves reconsidered) before they're playable again.

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
- **Update**: all remaining turrets (Adrenaline, Graveyard, Stun, Summoning) reassigned movement to FORWARD 3, moving them off the SQUARE/CROSS building-analog base cost onto the Pawn base cost. This mostly resolves the earlier "turret base-cost model questionable" flag — 3 of 4 now match or undercost instead of overcosting by 3-6. Sacrificial Turret removed from the game entirely, so its drawback-not-modeled flag no longer applies.
- **Correction applied**: Forward/Pawn baseline distance is 1, not 3 — Pawn's base SC of 1 is calibrated at its natural reach of 1 square. All FORWARD (and NONE/pawn-bucket) rows below recomputed against this corrected baseline.
- **New rule applied**: ON SUMMON triggers get +3 SC surcharge, ON MOVE triggers get +1 SC surcharge — both separate from ability_strength, since these triggers are trivially/near-guaranteed to fire. King rows stay exempt.
- **DSL confirmation**: "STUN" = `MODIFY ACTION_COUNT -99 TURNS 1`, confirmed via `frontend/utils/abilityHalfIconTranslator.ts:31` (`'ACTION_COUNT -99 TURNS 1': 'STUN'`).
- **DSL correction discovered this pass**: numeric attribute filters (e.g. `SUMMON_COST<7`) require an `ATT:` prefix per `parse_filters` in `backend/engine/utils/parsers.py` (regex `ATT:([A-Z_]+)(<=|>=|<|>|=)(\d+)`) — e.g. `WHERE ATT:SUMMON_COST<7`, not bare `SUMMON_COST<7`. Earlier-logged abilities in this file (Chieftess Berserker, Royal Berserker, Mr Berserker/Bob Bob Berserker, Egg, original Giant/Golem Snare) documented SUMMON_COST filters without the `ATT:` prefix — that was inherited from the initial inventory report's display formatting, not verified raw DSL. New/edited abilities from this point on use the correct `ATT:` prefix. Flagged for correction at build time if the catalog JSON turns out to use the old (incorrect) format.

---

## BERSERKER

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Berserker King | 0 | 0 | 0 | ON KILL≥1 → MODIFY SUMMON_COST -1 (99 turns) → FRIENDLY SHELF 1 WHERE ARCHETYPE:BERSERKER | 0 | 0 | King, exempt |
| ~~Berserker of the Eastern Winds~~ → moved to SOLDIER as **Windwalker Soldier** | — | — | — | — | — | — | RECLASSED — see SOLDIER table |
| ~~Berserker of the Western Winds~~ → moved to SOLDIER as **Whiplash Soldier** | — | — | — | — | — | — | RECLASSED — see SOLDIER table |
| Berserker Witch | 9 | -1 | 2 | ON KILL≥2 → MODIFY ACTION_COUNT +1 (1 turn) → SELF | 10 | IMPLEMENTED | threshold KILL≥1→≥2, ability_strength unchanged, movement unchanged |
| Chieftess Berserker | 9 | -1 | 2 | ON KILL≥1 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST<=1 | 10 | IMPLEMENTED | movement SQUARE 3→2 |
| Divine Berserker | 5 | 2 | 3 | ON KILL≥4 → KILL → ANY BOARD:PATTERN:SQUARE:2 ALL | 10 | IMPLEMENTED | ability replaced — AOE kill (was self action_cost buff), strength re-rated 2→3 |
| **Bob Bob Berserker** (was Mr Berserker) | 1 | 0 | 0 | ON KILL≥2 → MODIFY ACTION_COUNT -1 (1 turn) → ENEMY BOARD:PATTERN:DIAGONAL:1 ALL | 1 | IMPLEMENTED | renamed, ability replaced (SLOW = MODIFY ACTION_COUNT -1 TURNS 1, per `abilityHalfIconTranslator.ts`), baseline fix applied |
| Oldman Berserker | 5 | -1 | 3 | ON KILL≥3 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL | 7 | IMPLEMENTED | movement dist 6→2 |
| Royal Berserker | 1 | 0 | 3 | ON KILL≥3 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST>8 | 4 | IMPLEMENTED | trigger KILL≥1→≥3, filter SUMMON_COST>2→>8, ability_strength 2→3 |
| Storm Berserker | 3 | 2 | 1 | ON KILL≥1 → PUT SHELF → SELF | 6 | 3 | |
| Warden Berserker | 5 | 0 | 1 | ON KILL≥2 → PUT SHELF → DEFENDER | 6 | 5 | close |

## DEMON

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| **Reaper Statue Demon** (was Reaper Demon) | 1 (NONE/pawn-bucket) | -1 | 3 | ON SUMMON≥1 → KILL → ANY BOARD:PATTERN:CROSS:4 ALL | 6 | IMPLEMENTED | movement CROSS 8 → NONE; pattern range 6→4; ON SUMMON +3 surcharge folded in |

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
| Impish Soldier | 1 | 0 | 0 | none | 1 | 1 | rename reverted (was briefly "Shy Soldier") — no stat/ability change; exact match after Pawn baseline fix |
| **Suave Soldier** (was Night Soldier) | 5 | 2 | 0 | none | 7 | 3 | renamed only (was briefly "Cool Soldier"); still undercosted on pure movement |
| **Triplet Soldier** | 1 (FORWARD) | 0 | 0 | none (ability is the 3 actions/turn itself) | 7 | 7 | movement CROSS 3 → FORWARD 1 — now exact match |
| **Windwalker Soldier** (was Berserker of the Eastern Winds) | 9 (SQUARE) | -1 | 0 | none (removed) | 11 | IMPLEMENTED | action_count unchanged (2) → +3 folded in; SC to be set at build time |
| **Whiplash Soldier** (was Berserker of the Western Winds) | 3 (DIAGONAL) | -1 | 0 | none (removed) | 5 | IMPLEMENTED | action_count unchanged (2) → +3 folded in; SC to be set at build time |

## TIMEKEEPER

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Dying Timekeeper | 5 | -2 | 0 | ON TURNEND≥2 → KILL → SELF | 3 | 0 | self-kill after 2 turns is a drawback, not power — formula gap |
| Egg | 1 | -1 | 2 | ON TURNEND≥3 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE SUMMON_COST<=2 | 2 | 1 | undercosted after Pawn baseline fix (NONE treated as pawn-bucket, baseline 1) |
| **Salt Timekeeper** | 1 | 0 | 3 | ON TURNEND≥2 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL | 10 | IMPLEMENTED | ability replaced — self-kill drawback swapped for board-wide STUN (same effect as Oldman Berserker); ability_strength re-rated 0→3 to match, action_count 3 → +6 folded in |

## TRAP

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| Trapped King | 0 | 0 | 0 | ON DEATH≥1 → MODIFY SUMMON_COST -1 (1 turn) → FRIENDLY SHELF ALL | 0 | 0 | King, exempt |
| **Giant Trap** (was Giant Snare) | 1 (NONE/pawn-bucket) | -1 | 1 | ON DEATH≥1 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL WHERE ATT:SUMMON_COST<7 | 1 | IMPLEMENTED | movement DIAGONAL 4 → NONE; ability replaced with STUN (see translator note below) |
| **Golem Trap** (was Golem Snare) | 1 (NONE/pawn-bucket) | -1 | 0 | ON DEATH≥1 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL WHERE ATT:SUMMON_COST<4 | 0 (floor, raw -2) | IMPLEMENTED | movement DIAGONAL 2 → NONE; ability replaced with STUN |
| **Colossal Trap** (new) | 1 (NONE/pawn-bucket) | -1 | 3 | ON DEATH≥1 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL WHERE ATT:SUMMON_COST<10 | 3 | IMPLEMENTED | new card; ability_strength clarified as 3 |

## TURRET

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| **Adrenaline Turret** | 1 (FORWARD) | 2 | 2 | ON ACTIVATE → MODIFY ACTION_COUNT +1 (1 turn) → DEFENDER | 5 | 5 | movement SQUARE 1 → FORWARD 3, ability_strength 1→2 — exact match |
| **Graveyard Turret** | 1 (FORWARD) | 2 | 3 | ON ACTIVATE → KILL → ANY BOARD:PATTERN:SQUARE:2 ALL | 6 | 10 | movement SQUARE 1 → FORWARD 3; pattern range 8→2 (no formula impact, ability_strength unchanged at 3) — now overcosted, flip from prior exact match |
| ~~Sacrificial Turret~~ | — | — | — | — | — | — | **REMOVED FROM GAME** |
| **Stun Turret** | 1 (FORWARD) | 2 | 2 | ON ACTIVATE → MODIFY ACTION_COUNT -99 (1 turn) → DEFENDER | 5 | 3 | movement CROSS 2 → FORWARD 3 |
| **Summoning Turret** | 1 (FORWARD) | 2 | 1 | ON ACTIVATE → PUT SHELF → FRIENDLY BAG:SEE:0 1 | 4 | 2 | movement SQUARE 1 → FORWARD 3; WHERE ARCHETYPE:TURRET filter removed |

## VANGUARD

| name | movement type base cost | distance value | ability strength | full ability | expected total | actual SC | notes |
|---|---|---|---|---|---|---|---|
| **Goblin Vanguard** | 1 | 0 | 2 | ON PROMOTION≥1 → MODIFY ACTION_COUNT -1 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL | 3 | 3 | ability replaced with SLOW; ability_strength held at 2 (unchanged, same tier as Wandering Ghost's identical effect) — still exact match |
| **Hobgoblin Vanguard** (was Hob Vanguard) | 1 | 0 | 2 | ON PROMOTION≥1 → KILL → ANY BOARD:PATTERN:SQUARE:1 ALL | 3 | 1 | renamed only; undercosted after Pawn baseline fix |

---

## Flagged: biggest undercosts (actual well below formula — potential power outliers)

*(Recomputed after Pawn baseline fix and ON SUMMON/ON MOVE trigger surcharge — several gaps widened. Several rows also show IMPLEMENTED since redesigned SC hasn't been set yet.)*

1. **Salt Timekeeper** (-10 vs old actual 0) — no longer a drawback-offset case: ability replaced with a real board-wide STUN, same power tier as Oldman Berserker's, so this is now a genuine outlier pending a new SC
2. **Sacrificial Turret** (-6), **Summoning Turret** (-6) — turret base-cost model likely wrong; needs its own baseline, not Queen/Castle/Bishop/Pawn analog
3. **Wandering Ghost** (-6) — ON MOVE +1 surcharge folded in; still partly justified by pacifist restriction not in formula
4. **Good News Nomad** (-4), **Suave Soldier** (-4)
5. **Royal Berserker** (-1 vs old actual, but now IMPLEMENTED pending new SC), **Egg** (-1)
6. **Reaper Statue Demon note**: redesign (movement CROSS 8 → NONE) dropped expected total 13 → 6, while old actual SC was 8 — if SC isn't revisited at build time, this card flips from a big undercost to a mild **overcost** (+2). Worth deciding the new SC explicitly rather than carrying the old value forward.
7. Redesigned/renamed cards (Windwalker Soldier, Whiplash Soldier, Berserker Witch, Chieftess Berserker, Divine Berserker, Bob Bob Berserker, Oldman Berserker, Royal Berserker, Reaper Statue Demon, Salt Timekeeper, Triplet Soldier) carry IMPLEMENTED or fresh expected totals — final gap depends on SC assigned at build time

## Flagged: overcosts (actual above formula)

None remaining after the Pawn baseline fix — Goblin Vanguard, Royal Berserker, Impish Soldier, and Egg all previously read as overcosted purely because the old baseline-3 assumption penalized short-reach Forward/NONE pieces too harshly. All four now read as exact-match or undercosted instead.

## Formula gaps surfaced by this pass

1. **No negative/drawback ability handling** — self-kill (Dying/Salt Timekeeper — though Salt Timekeeper's is now resolved by an ability swap), no-capture (Wandering Ghost) reduce actual SC below formula prediction in a way that looks *correct by design*, but the formula has no mechanism to justify it. Consider a negative ability_strength range for drawback effects. (Sacrificial Turret's case is moot — card removed from the game this pass.)
2. **Turret/building base-cost mismatch (resolved this pass)** — all remaining turrets reassigned from SQUARE/CROSS base costs to FORWARD 3, which mostly closed the gap (Adrenaline and Stun now match or close; only Graveyard flipped to overcosted after its own pattern-range edit). Confirms the building base-cost model really was wrong, and FORWARD is a better fit than a bespoke building baseline.
3. **Ability strength is currently subjective** — no rating field in the catalog JSON. If this formula is adopted, recommend adding an explicit `ability_rating: 0-3` field per card so audits like this stop requiring manual judgment.
4. **Pawn baseline correction (resolved this pass)** — Forward/Pawn baseline was wrongly set to 3 like Queen/Castle/Bishop; corrected to 1, matching Pawn's actual base SC of 1. This flipped every Forward/NONE-pawn-bucket card from "overcosted or matched" to "matched or undercosted."
5. **ON SUMMON / ON MOVE trigger surcharge (added this pass)** — these triggers fire near-unconditionally, so they now add +3/+1 SC on top of ability_strength.
6. **DSL filter syntax correction (found this pass)** — numeric SUMMON_COST-style filters require an `ATT:` prefix per `parse_filters` in `backend/engine/utils/parsers.py`; several earlier-logged abilities in this file predate that discovery and may need re-checking against the actual catalog JSON at build time.

---

## Pending Changes Log (source of truth for the eventual single `/build`)

Each entry: old card → new spec. Nothing here touches actual files yet — logged only, implemented in one pass later.

1. **Berserker of the Eastern Winds → Windwalker Soldier**
   - archetype: BERSERKER → SOLDIER
   - movement: CROSS 3 → SQUARE 2
   - ability: removed (was `ON KILL≥1 → PUT BAG → FRIENDLY SHELF 1`)
   - action_count: unchanged (2)
   - file move implied: `catalog/berserker/berserker-of-the-eastern-winds.json` → `catalog/soldier/windwalker-soldier.json`
   - SC: IMPLEMENTED (formula expects 11, current actual 5)

2. **Berserker of the Western Winds → Whiplash Soldier**
   - archetype: BERSERKER → SOLDIER
   - movement: CROSS 3 → DIAGONAL 2
   - ability: removed (was `ON KILL≥1 → KILL → FRIENDLY BOARD:PATTERN:SQUARE:6 1`)
   - action_count: unchanged (2)
   - file move implied: `catalog/berserker/berserker-of-the-western-winds.json` → `catalog/soldier/whiplash-soldier.json`
   - SC: IMPLEMENTED (formula expects 5, current actual 5)

3. **Berserker Witch**
   - trigger: `ON KILL≥1` → `ON KILL≥2` (effect/target unchanged: `MODIFY ACTION_COUNT +1 (1 turn) → SELF`)
   - ability_strength: unchanged (2)
   - movement: unchanged
   - SC: IMPLEMENTED (formula expects 10, current actual 7)

4. **Chieftess Berserker**
   - movement: SQUARE 3 → SQUARE 2
   - ability: unchanged (`ON KILL≥1 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST<=1`)
   - SC: IMPLEMENTED (formula expects 10, current actual 7)

5. **Divine Berserker**
   - movement: unchanged (CROSS 5)
   - ability replaced: was `ON KILL≥4 → MODIFY ACTION_COST -5 (99 turns) → SELF` → now `ON KILL≥4 → KILL → ANY BOARD:PATTERN:SQUARE:2 ALL`
     - trigger threshold unchanged (KILL≥4)
     - effect: MODIFY ACTION_COST → KILL
     - target: SELF → ANY BOARD:PATTERN:SQUARE:2 ALL (per `parse_target_line`/`parse_zone` grammar in `backend/engine/utils/parsers.py`: `<ALIGNMENT> <ZONE:PATTERN:TYPE:SIZE> <count|ALL>`)
   - ability_strength: re-rated 2 → 3 (board-wide AOE kill vs. prior single self-buff)
   - SC: IMPLEMENTED (formula expects 10, current actual 8)

6. **Mr Berserker → Bob Bob Berserker**
   - archetype/movement: unchanged (BERSERKER, FORWARD 1, action_count 1)
   - ability replaced: was `ON KILL≥1 → SUMMON FRIENDLY → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:BERSERKER, SUMMON_COST<=2` → now `ON KILL≥2 → MODIFY ACTION_COUNT -1 (1 turn) → ENEMY BOARD:PATTERN:DIAGONAL:1 ALL`
     - "SLOW" = `MODIFY ACTION_COUNT -1 TURNS 1`, confirmed via `frontend/utils/abilityHalfIconTranslator.ts:32` (`'ACTION_COUNT -1 TURNS 1': 'SLOW'`)
     - target: `ENEMY BOARD:PATTERN:DIAGONAL:1 ALL` per `parse_target_line`/`parse_zone` grammar
   - ability_strength: 2 → 0 (per user)
   - file rename implied: `catalog/berserker/mr-berserker.json` → `catalog/berserker/bob-bob-berserker.json` (name field + filename)
   - SC: IMPLEMENTED (formula expects 1, current actual 1)

7. **Global formula correction: Pawn/Forward baseline distance**
   - `summoning_cost_decision_matrix.md` amended: Forward (Pawn) baseline distance changed 3 → 1, matching Pawn's base SC of 1 being calibrated at reach 1, not reach 3
   - This is a spec/documentation correction, not a catalog JSON change — no file edits implied by itself, but it re-contextualizes "expected total" for every FORWARD and NONE/pawn-bucket card (Bob Bob Berserker, Royal Berserker, Impish Soldier, Egg, Salt Timekeeper, Goblin Vanguard, Hob Vanguard) in this audit
   - No SC changes implied by this correction alone — flagged only as updated context for future SC decisions

8. **Oldman Berserker**
   - movement: CROSS 6 → CROSS 2
   - ability: unchanged (`ON KILL≥3 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL`)
   - SC: IMPLEMENTED (formula expects 7, current actual 8)

9. **Royal Berserker**
   - trigger: `ON KILL≥1` → `ON KILL≥3`
   - filter: `SUMMON_COST>2` → `SUMMON_COST>8`
   - ability_strength: 2 → 3 (per user)
   - movement: unchanged (FORWARD 1)
   - SC: IMPLEMENTED (formula expects 4, current actual 2)

10. **Reaper Demon → Reaper Statue Demon**
    - movement: CROSS 8 → NONE (dist 0, pawn-bucket base cost per `MOVEMENT_BUCKETS` in `backend/play/bag/tools.py`)
    - ability: unchanged (`ON SUMMON≥1 → KILL → ANY BOARD:PATTERN:CROSS:6 ALL`)
    - file rename implied: `catalog/demon/reaper-demon.json` → `catalog/demon/reaper-statue-demon.json` (name field + filename)
    - SC: IMPLEMENTED (formula expects 6, current actual 8 — redesign flips this from undercost to mild overcost if SC is carried over unchanged; recommend deciding fresh)

11. **Global formula addition: ON SUMMON / ON MOVE trigger surcharge**
    - `summoning_cost_decision_matrix.md` amended: ON SUMMON triggers now add +3 SC, ON MOVE triggers now add +1 SC, both separate from ability_strength
    - Spec/documentation addition, not a catalog JSON change by itself — re-contextualizes expected totals for Reaper Statue Demon (ON SUMMON) and Exploding Nomad / Good News Nomad / Nomad Priest / Wandering Ghost (ON MOVE) in this audit
    - No SC changes implied by this correction alone — flagged only as updated context for future SC decisions

12. **Reaper Statue Demon — pattern range**
    - target zone: `BOARD:PATTERN:CROSS:6` → `BOARD:PATTERN:CROSS:4`
    - full ability now: `ON SUMMON≥1 → KILL → ANY BOARD:PATTERN:CROSS:4 ALL`
    - no SC-formula impact (pattern size isn't a distance/movement input); ability_strength stays 3
    - SC: IMPLEMENTED (formula still expects 6, current actual 8)

13. ~~Impish Soldier → Shy Soldier~~ — **REVERTED**. Rename undone, stays **Impish Soldier**. No stat/ability/file change; no build action needed.

14. **Night Soldier → Suave Soldier** (corrected — previously logged as "Cool Soldier")
    - rename only — no stat/ability change
    - file rename implied: `catalog/soldier/night-soldier.json` → `catalog/soldier/suave-soldier.json`
    - SC: unchanged expectation (formula 7, actual 3 — still undercosted, unaffected by rename)

15. **Triplet Soldier**
    - movement: CROSS 3 → FORWARD 1
    - ability: unchanged (none — its ability is the 3 actions/turn itself)
    - SC: IMPLEMENTED (formula now expects 7, current actual 7 — exact match after movement change)

16. **Salt Timekeeper**
    - ability replaced: was `ON TURNEND≥2 → KILL → SELF` → now `ON TURNEND≥2 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL`
      - "STUN" = `MODIFY ACTION_COUNT -99 TURNS 1`, confirmed via `frontend/utils/abilityHalfIconTranslator.ts:31` (`'ACTION_COUNT -99 TURNS 1': 'STUN'`)
      - identical effect+target to Oldman Berserker's ability
      - trigger threshold unchanged (TURNEND≥2)
    - ability_strength: re-rated 0 → 3 (was rated 0 as a self-kill drawback; now a genuine board-wide stun, same tier as Oldman Berserker)
    - movement/action_count: unchanged (FORWARD 1, action_count 3)
    - SC: IMPLEMENTED (formula expects 10, current actual 0)

17. **Giant Snare → Giant Trap**
    - movement: DIAGONAL 4 → NONE
    - ability replaced: was `ON DEATH≥1 → PUT SHELF → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:SOLDIER, SUMMON_COST=6` → now `ON DEATH≥1 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL WHERE ATT:SUMMON_COST<7`
    - ability_strength: 1 (per user, unchanged value but now describes a different effect)
    - file rename implied: `catalog/trap/giant-snare.json` → `catalog/trap/giant-trap.json`
    - SC: IMPLEMENTED (formula expects 1, current actual 4)

18. **Golem Snare → Golem Trap**
    - movement: DIAGONAL 2 → NONE
    - ability replaced: was `ON DEATH≥1 → PUT SHELF → FRIENDLY BAG:SEE:0 1 WHERE ARCHETYPE:TRAP, SUMMON_COST=4` → now `ON DEATH≥1 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL WHERE ATT:SUMMON_COST<4` (trigger carried over unchanged, not respecified)
    - ability_strength: 0 (per user)
    - file rename implied: `catalog/trap/golem-snare.json` → `catalog/trap/golem-trap.json`
    - SC: IMPLEMENTED (formula expects 0/floor, current actual 2)

19. **Colossal Trap (new card)**
    - archetype: TRAP, movement: NONE, action_count: 1 (assumed default, not specified)
    - ability: `ON DEATH≥1 → MODIFY ACTION_COUNT -99 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL WHERE ATT:SUMMON_COST<10`
    - ability_strength: 3 (clarified — original "ability strength23" was a typo)
    - file implied: `catalog/trap/colossal-trap.json` (new)
    - SC: IMPLEMENTED (formula expects 3)

20. **Hob Vanguard → Hobgoblin Vanguard**
    - rename only — no stat/ability change
    - file rename implied: `catalog/vanguard/hob-vanguard.json` → `catalog/vanguard/hobgoblin-vanguard.json`
    - SC: unchanged expectation (formula 3, actual 1)

21. **Adrenaline Turret**
    - movement: SQUARE 1 → FORWARD 3
    - ability_strength: 1 → 2 (per user)
    - ability: unchanged (`ON ACTIVATE → MODIFY ACTION_COUNT +1 (1 turn) → DEFENDER`)
    - SC: IMPLEMENTED (formula now expects 5, current actual 5 — exact match)

22. **Graveyard Turret**
    - movement: SQUARE 1 → FORWARD 3
    - target pattern: `BOARD:PATTERN:SQUARE:8` → `BOARD:PATTERN:SQUARE:2`
    - ability_strength: unchanged (3, per user)
    - full ability now: `ON ACTIVATE → KILL → ANY BOARD:PATTERN:SQUARE:2 ALL`
    - SC: IMPLEMENTED (formula now expects 6, current actual 10 — flips from exact match to overcosted; worth revisiting SC downward at build time)

23. **Sacrificial Turret — REMOVED FROM GAME**
    - delete `catalog/turret/sacrificial-turret.json`
    - remove from `bag_2.txt` (currently ×1) — note this drops bag_2 from 27 to 26 pieces; `MAX_BAG_SIZE=27` in `backend/play/bag/tools.py` doesn't require hitting exactly 27, but flag in case bag_2 was meant to stay full — may need a replacement piece or quantity bump elsewhere to keep it at 27

24. **Stun Turret**
    - movement: CROSS 2 → FORWARD 3
    - ability: unchanged (`ON ACTIVATE → MODIFY ACTION_COUNT -99 (1 turn) → DEFENDER`)
    - not present in any default bag currently (catalog-only card) — no bag file changes needed
    - SC: IMPLEMENTED (formula now expects 5, current actual 3)

25. **Summoning Turret**
    - movement: SQUARE 1 → FORWARD 3
    - filter removed: `WHERE ARCHETYPE:TURRET` dropped from target
    - full ability now: `ON ACTIVATE → PUT SHELF → FRIENDLY BAG:SEE:0 1`
    - ability_strength: unchanged (1)
    - SC: IMPLEMENTED (formula now expects 4, current actual 2)

26. **Goblin Vanguard**
    - ability replaced: was `ON PROMOTION≥1 → KILL → ENEMY BOARD:PATTERN:CROSS:1 1 WHERE ANY` → now `ON PROMOTION≥1 → MODIFY ACTION_COUNT -1 (1 turn) → ANY BOARD:PATTERN:SQUARE:1 ALL`
      - "SLOW" = `MODIFY ACTION_COUNT -1 TURNS 1`, confirmed via `frontend/utils/abilityHalfIconTranslator.ts:32` (`'ACTION_COUNT -1 TURNS 1': 'SLOW'`)
      - trigger threshold unchanged (PROMOTION≥1)
    - ability_strength: held at 2 — not respecified by user, inferred unchanged since the new effect (board-wide slow) is the same tier as Wandering Ghost's identical effect+target, which is also rated 2
    - movement: unchanged (FORWARD 1)
    - SC: IMPLEMENTED (formula still expects 3, current actual 3 — still exact match)

Also implied: `bag_0.txt` currently references "Berserker of the Eastern Winds" ×2, "Berserker of the Western Winds" ×2, and "Mr Berserker" ×8 — these lines need updating to the new names at build time. `bag_1.txt` references "Reaper Demon" ×2 — also needs updating to "Reaper Statue Demon"; `bag_1.txt` also has "Golem Snare" ×2 → "Golem Trap", and "Adrenaline Turret" ×1 / "Graveyard Turret" ×1 stay same name (stats only). `bag_2.txt` references "Night Soldier" ×2 — needs updating to "Suave Soldier"; "Impish Soldier" ×8 stays unchanged (rename reverted); "Giant Snare" ×2 → "Giant Trap"; "Hob Vanguard" ×8 → "Hobgoblin Vanguard"; "Sacrificial Turret" ×1 removed entirely (see #23); "Summoning Turret" ×1 stays same name (stats only). Colossal Trap (new) will need to be added to a bag if it's meant to ship in the default set — not yet specified.
