# Record: Card Balance Rebalance (Summoning Cost Formula + Card Redesigns)

## Contents

1. [Summoning cost formula](#1-summoning-cost-formula)
2. [Balance audit methodology](#2-balance-audit-methodology)
3. [Card-by-card redesign decisions](#3-card-by-card-redesign-decisions)
4. [Build execution and the bag-composition break](#4-build-execution-and-the-bag-composition-break)

---

## 1. Summoning Cost formula

### Context

The user wanted to re-analyze all cards for balance using summoning cost (SC) as the main lever. They gave the initial shape: movement type maps to a piece analog (Square=Queen=9, Cross=Castle=5, Diagonal=Bishop=3, Forward=Pawn=1, King=0 fixed), each calibrated at an "expected" movement distance, with a per-square adjustment above/below that baseline, plus an ability-power term (0-3 rating) and a rare multi-action penalty (+3 per action above 1).

### Discussion points

- Initial baseline was one flat "expected distance = 3" for all movement types. The user corrected this: Pawn's base cost of 1 is calibrated at reach 1, not reach 3 — this was applied as a per-movement-type baseline (3 for Square/Cross/Diagonal, 1 for Forward), which flipped several previously "overcosted" Forward-movement cards to exact-match or undercosted instead.
- A second formula addition came mid-audit: ON SUMMON abilities are trivial to trigger (fire the instant the piece enters play) and deserved a flat surcharge; ON MOVE abilities are near-guaranteed but not quite free. The user specified +3 SC for ON SUMMON, +1 SC for ON MOVE, kept separate from the ability_strength rating.
- While researching how to build a specific ability's DSL correctly, discovered (via `backend/engine/utils/parsers.py`) that ability filters like `SUMMON_COST<7` actually require an `ATT:` prefix (`WHERE ATT:SUMMON_COST<7`) to parse — confirmed the live catalog JSON already used this correctly; only the audit's own documentation/display format had been dropping the prefix.
- Also discovered (while implementing) that a card's `attributes.action_cost` field in the catalog JSON always equals its movement's max distance number — not tracked by the SC formula, but had to be kept in sync whenever a card's movement changed during the build.

### Decision

Final formula, recorded at `.context/summoning_cost_decision_matrix.md`:

```
SC = base_cost(movement_type)
   + (max_distance - baseline(movement_type))   [0 for King, exempt]
   + sum(ability_ratings)
   + 3 * max(0, action_count - 1)
   + trigger_surcharge(trigger_type)             [+3 ON SUMMON, +1 ON MOVE, else 0; 0 for King]
```

---

## 2. Balance audit methodology

### Context

Before touching any card, every existing catalog piece (34 cards across 8 archetypes: Berserker, Demon, Nomad, Soldier, Timekeeper, Trap, Turret, Vanguard) was inventoried and scored against the formula in `.context/balance_audit_1.md` — a frozen baseline snapshot — then forked into `.context/balance_audit_2.md` as a live working draft where the user could call out redesigns card-by-card, logged as numbered entries in a "Pending Changes Log," without touching any real files until a single build pass at the end.

### Discussion points

- No `ability_rating` field exists anywhere in the catalog JSON — ability_strength (0-3) throughout both audits is a judgment call, explicitly flagged as such, open to correction. This was never resolved into a real field; flagged as a recommendation for future work (see audit's "Formula gaps" section).
- Several cards turned out to be undercosted specifically because their "weak" ability is actually a drawback (self-kill, self-sacrifice, "cannot capture") rather than a power add — the formula has no negative-ability-strength mechanism, so these were flagged as an accepted gap rather than force-fit into the rating scale.
- Turret pieces (`roleType: BUILDING`) were originally scored on SQUARE/CROSS base costs like mobile units, which produced a consistent pattern of undercosting across the whole archetype — this was later resolved (see section 3) by reassigning all turrets to FORWARD movement, which is a better fit for a stationary activate-only piece than a bespoke building baseline.

### Decision

Both audit files stay as durable design artifacts (not deleted after the build) — `balance_audit_1.md` as the frozen pre-redesign baseline, `balance_audit_2.md` as the executed redesign log with each entry now marked implemented.

---

## 3. Card-by-card redesign decisions

### Context

Across many turns, the user walked through nearly every card in the catalog, giving renames, reclassifications, movement changes, and full ability rewrites. Each was logged as a numbered Pending Changes Log entry in `balance_audit_2.md` with before/after values and the formula's expected SC, without touching files until the final `/build`.

### Discussion points

- Two renames were corrected mid-session: "Shy Soldier" was reverted back to **Impish Soldier**, and "Cool Soldier" was corrected to **Suave Soldier** (both initially misheard/mistyped in the log, caught by the user's follow-up correction).
- Colossal Trap's ability_strength was given as "23" (out of the 0-3 range) — flagged as blocked and held with a clarifying question rather than guessed; the user confirmed 3 in a later message.
- Salt Timekeeper's ability was completely re-conceived: from a self-kill drawback (rated 0) to a board-wide STUN identical to Oldman Berserker's ability (re-rated to 3) — the user explicitly asked to read `frontend/utils/abilityHalfIconTranslator.ts` to confirm "STUN" and "SLOW" map to specific DSL effect strings (`MODIFY ACTION_COUNT -99 TURNS 1` and `MODIFY ACTION_COUNT -1 TURNS 1` respectively) before building the ability line, rather than guessing the DSL shape.
- Sacrificial Turret was removed from the game entirely (not reworked).
- Reaper Demon was reclassified to `NONE` movement and renamed Reaper Statue Demon — flagged during the audit that if its SC wasn't revisited, this redesign alone would flip it from a big undercost to a mild overcost; the user's final SC (set at build time per the formula) resolved this by landing at 6, matching the new formula target.

### Decision

Final scope (26 logged entries): 4 renames-only, 2 reclassifications (Berserker→Soldier), ~15 movement/ability rewrites, 1 new card (Colossal Trap), 1 removal (Sacrificial Turret). Full before/after detail lives in `balance_audit_2.md`'s Pending Changes Log — not duplicated here.

---

## 4. Build execution and the bag-composition break

### Context

The user explicitly invoked `/build` to implement everything logged in `balance_audit_2.md` against the real catalog JSON files, and separately asked to align every card's stored `summon_cost` to its formula-computed expected total — including cards that had no redesign at all (e.g. Colossal Soldier, Storm Berserker, Dying Timekeeper), since the second ask was a blanket realignment, not scoped to only the edited cards.

### Discussion points

- Before writing any files, cross-checked the target ability DSL grammar against `backend/engine/utils/parsers.py` directly (rather than trusting the audit's own shorthand) to get `parse_target_line`/`parse_zone`'s exact `<ALIGNMENT> <ZONE:PATTERN:TYPE:SIZE> <count|ALL> [WHERE ATT:...]` grammar right.
- While implementing, discovered a consequence the SC-formula audit never tracked: `backend/play/bag/tools.py`'s `validate_bag_composition` enforces movement-bucket caps (square: 2 total/1 per name, cross: 4/2, diagonal: 4/2, pawn: 16/8) per bag. Reclassing Windwalker/Whiplash Soldier onto SQUARE/DIAGONAL, and Reaper Statue Demon + Giant Trap + Golem Trap + all 4 remaining turrets onto the pawn bucket (NONE/FORWARD), pushed all three default bags (`bag_0/1/2.txt`) over their bucket caps. This was not silently fixed — rebalancing bag quantities is a separate design decision from "align SC to formula," and inventing new quantities would have been unrequested scope. Flagged directly in `balance_audit_2.md` and reported to the user as an open item.
- Confirmed via `.shared-paths` that none of the touched files (`backend/engine/.data/catalog/**`, `backend/engine/.data/default_bags/**`) are shared-sync paths, despite the project having a `copy.bara.sky` file — no `shared-sync.sh` action was needed for this build.

### Decision

All 26 Pending Changes Log entries implemented directly in the catalog JSON (renames via `git mv` + content rewrite, one new file, one deletion) and the three default bag `.txt` files (name updates only, no quantity changes). Every card's `summon_cost` realigned to its formula-computed value from `balance_audit_2.md`. The bag-composition-cap violation is an explicitly open, unresolved item — not fixed as part of this build.
