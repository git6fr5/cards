# Dragon Archetype Rework

## Contents
1. [Archetype-implied trigger + action-cost-matches-movement rules](#1-archetype-implied-trigger--action-cost-matches-movement-rules)
2. [Archetype split & Dragon → Soldier batch rename](#2-archetype-split--dragon--soldier-batch-rename)
3. [2026-07-24 — Frontend archetype-map break + workflow fix](#3-2026-07-24--frontend-archetype-map-break--workflow-fix)
4. [2026-07-26 — Goblin archetype split (in progress)](#4-2026-07-26--goblin-archetype-split-in-progress)

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

**Resolved after this entry was first written:**
- Catalog filenames + folders: renamed. `dragon/` split into `soldier/`, `timer/`, `messenger/`,
  `turret/` folders, files renamed to match new piece names (safe — `engine/loader.py` globs
  recursively and keys by JSON `name`, not path). Committed `ce8713f`.
- `default_bags/dragon.txt`: left as "dragon" — decided to be a player-facing deck/flavor name,
  not an archetype label, so it doesn't need to track the archetype rename. Its *contents* (piece
  name list) were still updated to match the renamed pieces.

**Open questions carried forward:**
- Run the same trigger-rule + rename pass on the Goblin (→ Messenger) and Warlock (→ Demon) catalog
  lines?
- `frontend/app/(open)/rules/_components/AbilitiesPanel.tsx:74` still has an illustrative "Dragon
  King" example (`FRIENDLY SHELF:1 WHERE DRAGON`) using the old archetype name — update to match?
- Placeholder hex colors chosen for the three new archetypes (Timer `#CA8A04`, Messenger
  `#0EA5E9`, Turret `#7C3AED`) — confirm or replace.

---

## 3. 2026-07-24 — Frontend archetype-map break + workflow fix

### Context
After part 2 was committed, the user ran the app and hit a runtime crash on `/catalog`:
`Cannot destructure property 'Icon' of ... ARCHETYPES[archetype] as it is undefined` in
`RajaArchetypeIcon`. Root cause: `frontend/utils/archetypes.ts` keeps its own `ARCHETYPES` map —
a hand-maintained mirror of the backend `Archetype` enum, not generated from it — and it still
only had `GOBLIN`/`DRAGON`/`WARLOCK`. Any piece now carrying `SOLDIER`/`TIMER`/`MESSENGER`/`TURRET`
had no entry, so the icon lookup returned `undefined`.

This was flagged under the project's hard-stop rule (no file edits outside `/build`) rather than
fixed immediately — reported as root cause + proposed diff, then applied once `/build` was invoked.

### Discussion points
- The user's `/build` invocation bundled two asks in one: fix the crash, and update
  `card_updater_workflow.md` (written earlier this session) so the same class of miss doesn't
  recur — the workflow's Step 4 (cross-file consequences) had listed the backend enum but not this
  frontend mirror.
- `salt_goblin.svg 404` in the same browser log was noted as unrelated/pre-existing and left alone.

### Decision
- `frontend/utils/archetypes.ts`: `DRAGON` entry replaced with `SOLDIER` (same red, `Sword` icon),
  added `TIMER` (`Timer` icon, `#CA8A04`), `MESSENGER` (`Send` icon, `#0EA5E9`), `TURRET` (`Castle`
  icon, `#7C3AED`) — colors matched to the backend enum's color map. `Flame` import dropped
  (no longer used).
- `card_updater_workflow.md` updated: Step 1 (orient) now lists `frontend/utils/archetypes.ts` as a
  file to read alongside the backend enum; Step 4 (cross-file consequences) now calls it out
  explicitly as a silent-until-runtime break, to be touched in the same pass as the backend enum,
  never as a follow-up; Step 6 (batch write) now names both mirrors explicitly.

---

## 4. 2026-07-26 — Goblin archetype split (partial, 5 of 8)

### Context
Picked up the open question carried forward from part 2: ran `card_updater_workflow.md`'s audit +
per-piece walk against `backend/engine/.data/catalog/goblin/` (8 pieces), reusing the same two
rules from the Soldier rework (archetype implies trigger; `action_cost` = max move distance /
activation-pattern distance for buildings) and reusing the existing SOLDIER/TIMER/MESSENGER/TURRET
archetypes rather than inventing goblin-specific ones — confirmed explicitly before the walk began.
Session paused mid-walk (piece 6 of 8) for the day, then resumed and ran `/build all locked
decisions` — batch-wrote the 5 pieces locked so far, leaving Goblin Warrior/Hobgoblin/Salt Goblin
for a follow-up pass.

### Discussion points
- Corrected assistant mid-session: audit should present mismatches only, not propose a fix
  alongside them — decisions are the user's to make per piece, not a confirm/reject of an assistant
  suggestion. Applies to any future workflow run of this kind.
- Ambiguous trigger cases (Goblin King's `ON SUMMON`; Goblin Warrior/Hobgoblin's `ON PROMOTION`,
  neither matching any of the 4 archetypes' implied triggers) were surfaced per workflow guidance
  rather than force-fit — King resolved this session (see Decision), Warrior/Hobgoblin still open.
- Ability-target filters reading `WHERE ARCHETYPE:GOBLIN` (on what became Good News Messenger and
  Messenger King) were **dropped entirely** rather than renamed to `ARCHETYPE:MESSENGER` — an
  explicit choice, not a mechanical rename-in-place.
- Goblin Knight's rename to Dying Timekeeper came with a broader decision: renaming the `TIMER`
  archetype itself to `TIMEKEEPER` (enum-wide), not just reclassifying this one piece into an
  existing archetype. Only one other current `TIMER` user found catalog-wide:
  `backend/engine/.data/catalog/timer/egg.json`. That piece's archetype field, plus
  `archetype.py`/`archetypes.ts`, plus a possible `timer/` folder rename, are flagged but not yet
  confirmed in scope.
- Goblin King's trigger was changed to `ON MOVE 5` under the MESSENGER archetype — an explicit
  user override rather than the assistant-proposed alternatives (ON KILL under SOLDIER, or
  introducing DEMON).

### Decision
Implemented, in `backend/engine/.data/catalog/goblin/`:

| File | New name | Archetype | Key changes |
|---|---|---|---|
| goblin-bomber.json | Exploding Messenger | MESSENGER | action_cost 3→2 |
| goblin-cheerleader.json | Good News Messenger | MESSENGER | action_cost 3→2; ability filter drops `WHERE ARCHETYPE:GOBLIN` |
| goblin-king.json | Messenger King | MESSENGER | trigger `ON SUMMON 1`→`ON MOVE 5`; ability filter drops `WHERE ARCHETYPE:GOBLIN` |
| goblin-knight.json | Dying Timekeeper | TIMEKEEPER (renamed from TIMER, enum-wide) | archetype reclass; triggers the TIMER→TIMEKEEPER rename |
| goblin-pit.json | Stun Turret | TURRET | ability `TURNS 3`→`TURNS 1`; movement `CROSS 1`→`CROSS 2`; action_cost 3→2 |

Plus cross-file consequences applied in the same pass:
- `TIMER`→`TIMEKEEPER`: `backend/engine/enums/archetype.py` (member + color map),
  `frontend/utils/archetypes.ts` (`ARCHETYPES` map entry, same `Timer` icon/color), and
  `backend/engine/.data/catalog/timer/egg.json`'s `archetype` field — all renamed, no orphaned
  `TIMER` references left (verified by grep).
- `backend/engine/.data/default_bags/goblin.txt`: entries renamed to match (Exploding Messenger ×10,
  Good News Messenger ×10, Stun Turret ×4, Messenger King ×1).
- Filenames/folders: left as-is (default per workflow Step 5, not asked this pass) —
  `goblin-bomber.json` etc. keep old filenames despite new piece names; `timer/` folder unrenamed.
- `GOBLIN` archetype enum member kept (still used by the 3 unimplemented pieces below).

Open / not yet reached:
- Goblin Warrior, Hobgoblin, Salt Goblin — still archetype `GOBLIN`, not yet walked/locked
  (Warrior's mismatches were presented but no decision locked before the pause).
- No `/build` run yet — Step 6 (batch write) still pending completion of the walk.
