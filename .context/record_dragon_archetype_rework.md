# Dragon Archetype Rework

## Contents
1. [Archetype-implied trigger + action-cost-matches-movement rules](#1-archetype-implied-trigger--action-cost-matches-movement-rules)
2. [Archetype split & Dragon → Soldier batch rename](#2-archetype-split--dragon--soldier-batch-rename)

---

## 1. Archetype-implied trigger + action-cost-matches-movement rules

### Context
User introduced two new house rules for piece design, to be applied retroactively across the
catalog, starting with the `dragon/` folder:

1. A piece's archetype implies its ability trigger (e.g. Dragon archetype → `ON KILL`).
2. `action_cost` must equal the piece's max move distance parsed from its `movement` pattern
   (e.g. `CROSS 9` → `action_cost 9`).

The immediate goal was auditing and fixing all 13 pieces in `backend/engine/.data/catalog/dragon/`
against these two rules.

### Discussion points
- Initial audit flagged 6 of 13 pieces as violating rule 1 (wrong trigger) and/or rule 2 (cost/dist
  mismatch): Ancient Dragon, Baby Dragon, Dragon Egg, Dragon Priest, Dragon Prince, Dragon's Den.
- Two edge cases were flagged up front: Dragon Egg (movement `NONE`, can't ever kill — `ON KILL`
  doesn't fit) and Dragon's Den (`BUILDING` roleType — movement/kill semantics unclear for
  buildings). Both were initially left as open questions rather than force-fit to rule 1.
- Dragon's Den `action_cost` was first left at 0 (assumed buildings exempt from rule 2), then
  reversed later in the session — set to 1 to match its `SQUARE 1` pattern, treated as an
  "activation area" distance rather than a movement distance.
- Dragon Prince's movement was bumped `FORWARD 1` → `FORWARD 2` mid-session to fix the rule 2
  mismatch, then reverted back to `FORWARD 1` (with `action_cost` following back down to 1)
  once the user reconsidered.
- Dragon Egg was briefly queued for deletion from the game, then that decision was reversed —
  kept, and resolved differently (see part 2).

### Decision
- Rule 1 and rule 2 both stand, but rule 1 generalized once archetypes were split (see part 2):
  trigger is a function of archetype, not a blanket "Dragon → ON KILL".
- Rule 2 (`action_cost` = max move distance) applies to non-building units directly. Buildings are
  keyed to their activation-pattern distance instead of a movement distance (precedent: Adrenaline
  Turret, `action_cost` synced to its `SQUARE 1` pattern).

---

## 2. Archetype split & Dragon → Soldier batch rename

### Context
Partway through the per-piece walkthrough, the user decided the single `DRAGON` archetype was
overloaded — pieces within it had legitimately different trigger semantics (on-kill soldiers,
on-turnend timers, on-move messengers, on-activate buildings). Rather than force every dragon piece
into `ON KILL`, the user introduced a small set of function-based archetypes, each with its own
implied trigger, and renamed the `Dragon` archetype line to `Soldier`:

| Archetype | Trigger |
|---|---|
| Soldier (was Dragon) | ON KILL |
| Timer | ON TURNEND |
| Messenger (was Goblin, not yet migrated) | ON MOVE |
| Turret (buildings) | ON ACTIVATE |
| Trap (planned, unused yet) | ON DEATH |
| Demon (was Warlock, not yet migrated) | ON SUMMON |

### Discussion points
- Once Messenger/Timer existed, two pieces that looked like rule-1 violations under the old
  single-archetype scheme turned out to be correctly triggered under the new scheme — the fix was
  reclassifying their archetype, not changing their trigger:
  - Dragon Priest → archetype `MESSENGER`, trigger reverts to `ON MOVE` (the earlier `ON KILL`
    edit queued for it was dropped).
  - Dragon Egg → archetype `TIMER`, trigger stays `ON TURNEND` (deletion plan reversed in favor
    of this reclassification).
- Dragon's Den → archetype `TURRET` (the Building↔Turret mapping), resolving its earlier edge-case
  flag.
- Ability DSL filters referencing the old `ARCHETYPE:DRAGON` string were updated to
  `ARCHETYPE:SOLDIER` on pieces that still filter by archetype (Foot Soldier, Royal Soldier,
  Soldier King, Queen Soldier). Egg's filter had its archetype clause dropped entirely per explicit
  instruction (`WHERE ATT:SUMMON_COST<=2`, no archetype restriction).
- Backing enum `backend/engine/enums/archetype.py` needed updating for this to be internally
  consistent — `DRAGON` renamed to `SOLDIER`, `TIMER`/`MESSENGER`/`TURRET` added (with placeholder
  colors chosen by the assistant, flagged for the user to adjust). `GOBLIN`/`WARLOCK` left
  untouched — their Messenger/Demon migration is a separate, not-yet-started pass.
- Filename/folder rename (e.g. `ancient-dragon.json`, the `dragon/` folder itself) was raised as an
  open question and never answered — defaulted to leaving filenames and folder structure alone,
  editing only JSON contents. `backend/engine/.data/default_bags/dragon.txt` was updated to match
  the new piece `name` values (bag entries reference pieces by name, not filename).

### Decision
Final per-piece state, all in `backend/engine/.data/catalog/dragon/`:

| File | New name | Archetype | Key changes |
|---|---|---|---|
| ancient-dragon.json | Ancient Soldier | SOLDIER | movement CROSS9→6, trigger ON TURNEND1→ON KILL3 |
| baby-dragon.json | Foot Soldier | SOLDIER | trigger ON PROMOTION1→ON KILL1, filter→SOLDIER |
| black-dragon.json | Reincarnation Soldier | SOLDIER | ON KILL1→2, summon_cost 7→5 |
| divine-dragon.json | Divine Soldier | SOLDIER | rename only |
| dragon-egg.json | Egg | TIMER | archetype reclass, ability filter drops archetype clause |
| dragon-king.json | Soldier King | SOLDIER | rename, filter→SOLDIER |
| dragon-knight.json | Night Soldier | SOLDIER | rename only |
| dragon-priest.json | Messenger Priest | MESSENGER | archetype reclass, action_cost 4→2 |
| dragon-prince.json | Royal Soldier | SOLDIER | trigger ON PROMOTION1→ON KILL1, filter→SOLDIER (movement/cost left at FORWARD 1 / 1, unchanged after revert) |
| dragon-queen.json | Queen Soldier | SOLDIER | movement SQUARE4→3, action_cost 4→3, filter→SOLDIER |
| dragons-den.json | Adrenaline Turret | TURRET | archetype reclass, action_cost 0→1 |
| storm-dragon.json | Storm Soldier | SOLDIER | rename only |
| three-headed-dragon.json | Triplet Soldier | SOLDIER | rename only |

Plus `backend/engine/enums/archetype.py` (enum + color map) and
`backend/engine/.data/default_bags/dragon.txt` (bag entries renamed to match).

**Open questions carried forward:**
- Rename catalog filenames and the `dragon/` folder to match the new archetype-based naming, or
  leave the legacy folder grouping as-is?
- Run the same trigger-rule + rename pass on the Goblin (→ Messenger) and Warlock (→ Demon) catalog
  lines?
- `frontend/app/(open)/rules/_components/AbilitiesPanel.tsx:74` still has an illustrative "Dragon
  King" example (`FRIENDLY SHELF:1 WHERE DRAGON`) using the old archetype name — update to match?
- Placeholder hex colors chosen for the three new archetypes (Timer `#CA8A04`, Messenger
  `#0EA5E9`, Turret `#7C3AED`) — confirm or replace.
