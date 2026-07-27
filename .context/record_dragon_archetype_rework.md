# Dragon Archetype Rework

## Contents
1. [Archetype-implied trigger + action-cost-matches-movement rules](#1-archetype-implied-trigger--action-cost-matches-movement-rules)
2. [Archetype split & Dragon → Soldier batch rename](#2-archetype-split--dragon--soldier-batch-rename)
3. [2026-07-24 — Frontend archetype-map break + workflow fix](#3-2026-07-24--frontend-archetype-map-break--workflow-fix)
4. [2026-07-26 — Goblin archetype split (partial, 5 of 8)](#4-2026-07-26--goblin-archetype-split-partial-5-of-8)
5. [2026-07-26 — Berserker/Vanguard split, Messenger→Nomad, unified trigger icons](#5-2026-07-26--berserkervanguard-split-messengernomad-unified-trigger-icons)

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

---

## 5. 2026-07-26 — Berserker/Vanguard split, Messenger→Nomad, unified trigger icons

### Context
Resuming the goblin walk at Goblin Warrior (`ON PROMOTION`, effect `KILL` — fits no archetype's
implied trigger) surfaced that the archetype-implied-trigger scheme itself was still incomplete:
`SOLDIER` was overloaded the same way `DRAGON` originally was (its 8 live pieces are all `ON KILL`,
but "promotion-flavored" pieces like Goblin Warrior had nowhere to go). Rather than force Goblin
Warrior into `SOLDIER`, the archetype scheme was extended: `SOLDIER`'s trigger claim is dropped
entirely (redefined as the exception bucket for no-ability pieces), a new `BERSERKER` archetype
takes over `ON KILL` (absorbing all 8 current Soldier pieces), and a new `VANGUARD` archetype
claims `ON PROMOTION`. Separately, `MESSENGER` was renamed `NOMAD` (no functional trigger change —
still `ON MOVE` — pure rename). Alongside this, the archetype icon system was reworked: since each
archetype now implies exactly one trigger condition, the archetype's own icon and that trigger
condition's icon are unified into one shared icon rather than maintained as two independently-
chosen ones (`archetypes.ts` vs `abilityTranslatorIcons.ts`).

Goblin Warrior/Hobgoblin's own reclassification (to `VANGUARD`) was explicitly held back from this
pass — user called it out as forward-walk work, not part of the retroactive Soldier retrofit.

### Discussion points
- Warlock→`ON DEATH` (proposed to reuse Warlock's `Ghost` icon under the new unify-icon rule) was
  raised and then retracted by the user ("that was my mistake") — the original plan already on
  record stands: `Trap` (unused) owns `ON DEATH`, `Demon` (future Warlock migration) owns
  `ON SUMMON`. Warlock itself is untouched this pass.
- Turret's icon unification went the opposite direction from Berserker/Vanguard/Nomad: instead of
  Turret's archetype icon (`Castle`) changing to match the `ON ACTIVATE` trigger icon (`Play`), the
  *trigger* icon changed to match the archetype (`Play`→`Castle`) — user specified "backwards."
  `Castle` is now shared by both the `TURRET` archetype and the `ON ACTIVATE` trigger.
- `KILL` was the only word found to be both a trigger condition (`ON KILL`) and a distinct effect
  keyword (`KILL` effect line) in the DSL grammar — so Berserker's icon unification (`Swords`→`Axe`)
  applies to *both* the trigger icon and the effect icon. No other archetype/trigger pairing this
  session had a matching effect keyword to unify against.
- `ATTRIBUTE_ICON_CHIPS.KILL_COUNT` (a third, previously-separate `Swords` usage — the `ATT:
  KILL_COUNT` filter chip) was defaulted to the same `Axe` swap for consistency, since the user did
  not answer that specific sub-question directly before saying "lock all decisions."
- Exact hex values for Berserker ("a dark red") and Soldier ("grey") were never given — assistant
  picked placeholders (`#7F1D1D`, `#6B7280`) per standing authorization to choose placeholder
  colors (same precedent as the original Timer/Messenger/Turret colors), flagged for confirm.
- The 8 Soldier→Berserker piece renames were supplied piecemeal across several messages; one
  (Royal Soldier) was initially missing from a 7-name batch and had to be asked for explicitly
  before the batch could be locked — consistent with the session's established rule of never
  guessing a piece name.
- `MESSENGER`→`NOMAD` was found to hit 4 live pieces, not just the 3 goblin ones from part 4 —
  `messenger-priest.json` (already-committed, from the original Dragon rework) also carries the
  archetype and is referenced twice in `default_bags/dragon.txt`. Confirmed in scope before writing.

### Decision
Implemented across `backend/engine/enums/archetype.py`, `frontend/utils/archetypes.ts`,
`frontend/utils/abilityTranslatorIcons.ts`, and the catalog:

| Archetype | Trigger | Icon (unified) | Color |
|---|---|---|---|
| BERSERKER (new) | ON KILL | `Axe` (trigger, effect, and `KILL_COUNT` chip all swapped from `Swords`) | `#7F1D1D` (placeholder) |
| VANGUARD (new) | ON PROMOTION | `SquareArrowUp` | `#C026D3` |
| NOMAD (renamed from MESSENGER) | ON MOVE | `Footprints` (was `Send`) | `#0EA5E9` (unchanged) |
| TURRET | ON ACTIVATE | `Castle` (trigger icon changed `Play`→`Castle` to match, not the reverse) | `#7C3AED` (unchanged) |
| SOLDIER | none (no-ability exception bucket only) | blank `Square` (was `Sword`) | `#6B7280` (placeholder, was `#DC2626`) |
| TIMEKEEPER | ON TURNEND | `Timer` | `#CA8A04` (unchanged — already unified) |
| WARLOCK | — (unmigrated) | `Ghost` | `#38BDF8` (unchanged) |
| GOBLIN | — (transitional, being migrated out piece by piece) | `Cat` | `#16A34A` (unchanged) |

8 Soldier pieces reclassed to BERSERKER, in `backend/engine/.data/catalog/soldier/`:

| File | New name |
|---|---|
| ancient-soldier.json | Oldman Berserker |
| divine-soldier.json | Divine Berserker |
| foot-soldier.json | Mr Berserker |
| queen-soldier.json | Chieftess Berserker |
| reincarnation-soldier.json | Warden Berserker |
| royal-soldier.json | Royal Berserker |
| soldier-king.json | Berserker King |
| storm-soldier.json | Storm Berserker |

The 4 ability filters among those 8 that read `WHERE ARCHETYPE:SOLDIER` (Foot/Queen/Royal/Soldier
King) were updated to `ARCHETYPE:BERSERKER` in the same pass. `night-soldier.json` and
`triplet-soldier.json` (no `ability` field at all) were left as archetype `SOLDIER` unchanged —
the intended exception bucket.

MESSENGER→NOMAD rename applied to all 4 live pieces: `goblin-bomber.json` (Exploding
Messenger→**Exploding Nomad**), `goblin-king.json` (Messenger King→**Nomad King**),
`goblin-cheerleader.json` (Good News Messenger→**Good News Nomad**), and
`messenger/messenger-priest.json` (Messenger Priest→**Nomad Priest**) — simple word-swap per
explicit instruction, `messenger/` folder itself left unrenamed (same filename/folder default as
part 4).

`default_bags/goblin.txt` and `default_bags/dragon.txt` rosters updated to match every renamed
piece (quantities unchanged). `default_bags/dragon.txt` itself keeps its "dragon" filename per the
part-2 precedent (flavor name, not an archetype label).

Verified: all touched JSON parses, `archetype.py` `py_compile`s clean, no orphaned `TIMER`/
`MESSENGER`/stray-`SOLDIER` references outside the intended exceptions, no leftover `Swords`/`Play`
imports in `abilityTranslatorIcons.ts`, no leftover `Sword`/`Send` imports in `archetypes.ts`.
`tsc --noEmit` clean on both touched frontend files (one unrelated pre-existing `.next` cache error
ignored).

**Follow-up, same session:** user asked whether filenames/folders had been renamed to match (they
hadn't — left at the default per Step 5, same as part 4). Confirmed via `/build` immediately after.
`backend/engine/loader.py` globs the catalog recursively and keys by the JSON `name` field, not
path, so this was a pure filesystem reorg — verified safe by reading `loader.py` first, then
re-running `load_catalog()` afterward (pure in-memory dict build, no DB engine/session — respects
the standing DB ban) to confirm all 34 pieces, including every renamed one, resolve by name.

Moves: `messenger/` → `nomad/` (folder renamed), `timer/` → `timekeeper/` (folder renamed),
`soldier/` split (Berserker pieces move out to a new `berserker/` folder; Night/Triplet Soldier
stay in `soldier/`, the only two pieces that still are that archetype), `goblin/` pruned down to
just its 3 remaining live-GOBLIN pieces (Warrior/Hobgoblin/Salt Goblin) with the other 5 moving out
to their new archetype folders (`nomad/`, `timekeeper/`, `turret/`). `turret/` and `warlock/` were
already correctly named and untouched. Every moved file was also renamed to match its new piece
name (e.g. `goblin-bomber.json`→`nomad/exploding-nomad.json`,
`soldier-king.json`→`berserker/berserker-king.json`).

Open / not yet reached:
- Goblin Warrior, Hobgoblin, Salt Goblin — still archetype `GOBLIN`; now that `VANGUARD` (`ON
  PROMOTION`) exists, Warrior/Hobgoblin are expected to land there once the walk resumes.
- Berserker dark-red and Soldier grey hex values are still placeholders, not user-confirmed.
- `frontend/app/(open)/rules/_components/AbilitiesPanel.tsx`'s illustrative "Dragon King" example
  (flagged back in part 2) remains unaddressed.
