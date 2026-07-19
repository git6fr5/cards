---
name: Card Translation Workflow
description: Auditing spreadsheet vs. engine catalog, designing a repeatable card-translation workflow, and using it to backfill the WARLOCK archetype into the catalog
type: project
---

## Table of contents

1. [Spreadsheet vs. catalog audit](#1-spreadsheet-vs-catalog-audit)
2. [Card Translation Workflow — design](#2-card-translation-workflow--design)
3. [WARLOCK cards translated](#3-warlock-cards-translated)
4. [`concept` field backfill](#4-concept-field-backfill)
5. [WARLOCK archetype registration](#5-warlock-archetype-registration)

---

## 1. Spreadsheet vs. catalog audit

### Context

Session opened with reading `All Cards.xlsx` (3 sheets: `csvWarcasters` = main source of truth,
`gearless`/`hamster` = WARLOCK/GOBLIN draft sheets that don't always agree with the main sheet on
stats for the same card name) and comparing it against `backend/engine/.data/catalog/**/*.json`.
Also did a full read-through of the engine (`loader.py`, `game.py`, `resolver.py`,
`entities/{piece,player,board}.py`, `utils/{parsers,input_parser}.py`, relevant `.context/`
records) to build a working model of the game before touching anything.

### Discussion points

None — this section was pure investigation, no disagreement.

### Decision

Findings, not changes:
- Catalog only had 9 pieces total (4 DRAGON, 5 GOBLIN) against a ~40-card spreadsheet across
  DRAGON/GOBLIN/WARLOCK. WARLOCK had **zero** catalog files.
- Several catalog pieces that did exist mismatched their own sheet row (Baby Dragon, Dragon
  Prince, Goblin Bomber, Goblin Cheerleader, "Pit"/"Goblin Pit" naming) — flagged but left as-is,
  out of scope for this session.
- `.context/engine_dsl_reference.md` and `.context/notes.md` disagree with each other — the
  reference doc reflects the live parser grammar; `notes.md` describes an older, superseded
  grammar (`TARGET MOST EXPENSIVE`, `MATRIX`, etc.) that the current parser doesn't implement.
  Treated `notes.md` as stale throughout.

---

## 2. Card Translation Workflow — design

### Context

Wanted a repeatable process for turning a card concept (spreadsheet row or freeform description)
into a catalog JSON, instead of doing it ad hoc each time.

### Discussion points

- First pass (`/bullet`) asked to just list the 13 WARLOCK cards from the sheet — no
  disagreement, just data pull.
- Asked to draft a `SKILL.md` for the process. I initially recommended a directory-scoped global
  skill (`~/.claude/skills/`, via `/make-skill`) with a spreadsheet-row-driven step order
  (orient → map fields → translate DSL → flag gaps → show → write). User instead wanted the
  workflow to live at `.context/workflows/` (project-local, not global) and specified a different
  argument shape and step order themselves: **args = a natural-language card concept** (not a
  spreadsheet row), steps = orient (list context files) → translate to DSL → fill unspecified
  details → present concept + JSON and confirm → output to destination. This was a real redirect,
  not a confirmation of my draft — I rewrote the workflow file around the user's structure.
- File-write timing: asked to "show me the full output here first" each time before writing —
  applied consistently per the project's `/build`/`/quick-edit` hard-stop rule (no file writes
  without an explicit trigger, even for an obvious one-file follow-up).

### Decision

Wrote `.context/workflows/card_translation_workflow.md` (5 steps: Orient / Translate to DSL /
Fill remaining details / Present and confirm / Output to destination path). Orient step's file
list: `.context/engine_dsl_reference.md`, `.context/notes.md`, `engine/enums/*.py`,
`engine/entities/piece.py`, `engine/entities/player.py`, `engine/resolver.py`,
`engine/utils/parsers.py`, plus 2-3 sibling catalog JSONs.

---

## 3. WARLOCK cards translated

### Context

Ran the new workflow against four WARLOCK cards in sequence: Witch King, Witch Queen, Grim
Reaper, Colossal Golem — the first four WARLOCK catalog entries to ever exist.

### Discussion points

- **Witch King** — original ability ("gain 1 temporary mana on any friendly unit captured,
  expires end of turn") is **unrepresentable**: `MODIFY` only mutates `Piece` attributes, and
  mana lives on `Player`, not any piece — no player-targeted effect exists in the engine at all.
  I first presented this as a hard gap. User pushed back with an alternate concept instead of
  accepting the gap: "maybe MODIFY SUMMON_COST -1 to all cards in your hand for 1 turn?" — fully
  expressible (`ON DEATH 1` / `MODIFY SUMMON_COST -1 TURNS 1` / `FRIENDLY SHELF ALL`), adopted
  as the actual translation instead of leaving the ability unwritten.
- **Colossal Golem** — sheet row has no EFFECT text at all (terminal form of the Golem→Giant
  Golem→Colossal Golem chain). Surfaced two real schema gaps: (1) sheet's `Token` card type has
  no matching `roleType` enum value — mapped to `UNIT`, consistent with existing
  `baby-dragon.json`/`dragon-prince.json` precedent; (2) `ability` is a mandatory 3-line field
  with no supported "inert" encoding anywhere in the catalog yet — used `ON ACTIVATE` on a
  non-`BUILDING` piece as a genuine (not fabricated) no-op, since `player.act()` only ever fires
  `ACTIVATE` when `piece.is_building` is true.
- **Witch Queen** and **Grim Reaper** translated cleanly, no gaps — both confirmed as-shown on
  first pass.
- File-write mechanics: each card was single-new-file-with-shown-snippet, so each went through
  `/quick-edit` individually rather than a batched `/build`.

### Decision

Four files created under `backend/engine/.data/catalog/warlock/`:
- `witch-king.json` — `ON DEATH 1 / MODIFY SUMMON_COST -1 TURNS 1 / FRIENDLY SHELF ALL`
- `witch-queen.json` — `roleType: CANNIBAL`, `ON KILL 1 / MODIFY ACTION_COUNT +1 TURNS 1 / SELF`
- `grim-reaper.json` — `ON SUMMON 1 / KILL / ANY BOARD:PATTERN:CROSS:6 ALL`
- `colossal-golem.json` — `roleType: UNIT` (Token-gap substitution), `ON ACTIVATE / KILL /
  DEFENDER` (inert no-op)

9 WARLOCK cards remain untranslated: Colossal Golem's siblings Giant Golem/Golem, Wizard of the
East/West, Sacrificial Circle, Summoning Circle, Ghost, Imp, Graveyard.

---

## 4. `concept` field backfill

### Context

Asked to add a `"concept"` field to all four WARLOCK catalog JSONs, backfilled with each card's
original spreadsheet EFFECT text — a human-readable reference field, not consumed by
`Piece.create` or the loader (user explicit: "this field is just for json... it isn't ported
upstream at all... Piece.create does not need to change").

### Discussion points

- This touches 4 files, over `/quick-edit`'s one-file limit, so I stopped and asked for `/build`.
- User initially pushed back that catalog JSON is "data, not code files" and shouldn't need the
  gate. I held the line: the global hard-stop rule explicitly names "config changes, fixture/seed
  script changes" as included, not just source code — the gate is about unreviewed writes, not a
  code/data distinction. User then invoked `/build` directly rather than continuing to contest it.
- Colossal Golem has no source EFFECT text to backfill. Rather than inventing flavor text, used
  `"concept": null` and said so explicitly.

### Decision

Added `"concept"` (positioned right after `"name"`) to all four files:
- `witch-king.json`, `witch-queen.json`, `grim-reaper.json` — verbatim original spreadsheet text.
- `colossal-golem.json` — `"no stated ability — top of the golem chain."` (no source text
  existed; user supplied this description directly rather than leaving it `null`).

No engine/schema code touched — purely a catalog-JSON documentation field, per explicit user
instruction.

---

## 5. WARLOCK archetype registration

### Context

With all 13 WARLOCK catalog files written, asked what else was needed to make the archetype
actually functional in-game. Investigation found `Archetype` (`engine/enums/archetype.py`) only
had `DRAGON`/`GOBLIN` — confirmed live: `Archetype["WARLOCK"]` raised `KeyError`, meaning every
WARLOCK catalog file written in section 3 would crash `Piece.create` the instant it was loaded
into a `Bag`. Also checked every frontend consumer of the archetype list
(`PieceFilterDefs.tsx`, `RajaArchetypePill.tsx`, `token-builder/registry.ts`) — all derive
dynamically off `frontend/utils/archetypes.ts`'s `ARCHETYPES` map, no other file hardcodes the
archetype list, so that one file was the only frontend edit needed. `backend/fixtures/seed_piece.py`
needed no code change at all — it already derives DB `Piece` rows by globbing every catalog
JSON's `"name"` field.

### Discussion points

No pushback — user answered each open item directly: icon = lucide-react `Skull`, color =
"something dark grey-ish" (picked `#4B5563`, Tailwind `gray-600`, matching the `-600` shade
`DRAGON`/`GOBLIN` already use), confirmed wanting a default bag file, and added a requirement I
hadn't scoped — `seed_bag.py`'s `DEFAULT_BAG_NAMES` also needed the new `"warlock"` bag added,
not just the raw `.txt` file. The default bag's *card composition* (which of the 13 WARLOCK
cards, at what quantities) was never specified by the user — I designed it myself, mirroring the
existing `dragon.txt`/`goblin.txt` shape exactly (10/10/4/1 = 25 cards, 3 unit types + king) and
picked cards so the Golem-chain ability (`Golem` → fetches `Giant Golem` by cost) has a live
target inside the deck; user did not object when `/build` ran it as proposed.

This was also the second time the project's `/build` hard-stop was asserted against user pushback
("these are not code files, this is data") — see section 4 — and held: this section's change,
by contrast, unambiguously touched real code (`archetype.py` enum, `archetypes.ts`, `seed_bag.py`
list), so `/build` was required and given without contest.

### Decision

Four files changed:
- `backend/engine/enums/archetype.py` — added `WARLOCK = "WARLOCK"` to `Archetype`, and
  `Archetype.WARLOCK: "#4B5563"` to `ArchetypeColorMap`.
- `frontend/utils/archetypes.ts` — imported `Skull` from `lucide-react`, added
  `WARLOCK: { name: 'Warlock', color: '#4B5563', Icon: Skull }` to `ARCHETYPES`.
- `backend/engine/.data/default_bags/warlock.txt` (new) — 25-card default bag: 10× Imp, 10×
  Golem, 4× Giant Golem, 1× Witch King.
- `backend/fixtures/seed_bag.py` — `DEFAULT_BAG_NAMES` gained `"warlock"`.

Verified DB-free per the project's standing DB rule: `py_compile` on both backend files; an
in-memory smoke script confirming `Archetype.WARLOCK` resolves, `load_default_bag("warlock")`
returns the expected 25 names, and `Piece.create` succeeds for all four card types in the new
bag; `ast.parse` on `seed_bag.py` (no ORM import, to avoid any DB-engine risk) confirming the
`DEFAULT_BAG_NAMES` edit is syntactically valid. No DB seed re-run performed — that stays the
user's own action per the project's DB rule.

`seed_piece.py` needed no change (auto-derives from catalog JSON). No ORM model was touched, so
no Alembic migration is needed. `backend/engine/**` and `frontend/utils/archetypes.ts` are not
listed in `.shared-paths` — no copybara publish step applies.
