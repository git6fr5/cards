---
name: Card Update Workflow
description: Step-by-step process for auditing and batch-updating existing engine/.data/catalog/**/*.json entries against current house rules, one piece at a time with locked decisions, then a single batched write
---
When the user wants to audit an existing catalog scope (an archetype folder, a bag, a specific
piece list) against house rules, or batch-rename/rebalance cards already in the catalog, follow
this exact process.

**Why:** Unlike adding a brand-new card (`card_translation_workflow.md`), updating existing cards
touches several interrelated files at once — the JSON itself, the backing `Archetype` enum, ability
DSL filters elsewhere that reference the old archetype string, `default_bags/*.txt` rosters (keyed
by piece `name`, not filename), and sometimes the catalog folder/filename layout. Editing file by
file as decisions are made causes drift and half-applied state. This workflow locks every decision
conversationally first, then applies the whole batch in one `/build` pass.

**How to apply:** Any time the user wants to audit a catalog scope against a stated rule (e.g.
"archetype implies trigger", "action_cost = max move distance"), or batch-update/rename cards
that already exist in `backend/engine/.data/catalog/`.

**Arguments:** a scope — a catalog folder, an archetype line, a bag name, or an explicit piece
list — plus the rule(s) to audit against.

---

## Step 1 — Orient

(Re-)read, skipping anything already fresh in context from earlier in the session:

- Every JSON file in scope.
- `backend/engine/enums/archetype.py` — current archetype list + color map.
- `frontend/utils/archetypes.ts` — the frontend's own mirror of that enum (`ARCHETYPES` map);
  it does not import from the backend and must be kept in sync by hand.
- `.context/engine_dsl_reference.md` and `.context/notes.md` for standing conventions.
- Any `default_bags/*.txt` that reference pieces in scope (grep piece `name` values, not
  filenames).

## Step 2 — Build the audit table

For every piece in scope, check it against each stated rule (e.g. rule 1: does the ability
trigger match what the archetype implies; rule 2: does `action_cost` equal the max distance
parsed from `movement`). Mark each piece match/mismatch per rule.

Flag ambiguous cases explicitly instead of forcing a rule fit — roleTypes other than `UNIT`
(`KING`, `BUILDING`), `movement: NONE` pieces, and pieces with no `ability` at all commonly don't
map cleanly onto a unit-shaped rule. Surface these as open questions, not silent decisions.

## Step 3 — Walk the list one piece at a time

For each piece: show the **full current spec** (never truncate or summarize the JSON), state
which rule(s) it violates, propose a fix. Wait for the user's explicit edit or confirmation before
locking that piece's decision. Do not touch any file yet — track locked decisions in the
conversation only.

If a decision made earlier in the walk turns out to be wrong once more context arrives (e.g. a new
archetype gets introduced mid-list that changes what "correct" means for an earlier piece), revisit
and update the locked decision — don't leave it stale.

## Step 4 — Track cross-file consequences

Whenever a piece's archetype or name changes, check for and queue:

- Ability DSL filters on *other* pieces referencing the old archetype string
  (`WHERE ARCHETYPE:<OLD>`) — these need the same rename.
- The backing `Archetype` enum (`backend/engine/enums/archetype.py`) — new archetypes need a
  member + a color map entry (flag placeholder colors for the user to confirm); renamed
  archetypes need the member renamed everywhere it's referenced.
- **`frontend/utils/archetypes.ts`'s `ARCHETYPES` map — same additions/renames as the backend
  enum, plus a `lucide-react` icon pick for any new archetype.** Missing this is a silent-until-
  runtime break: the catalog page renders fine at build time and only throws
  (`Cannot destructure property 'Icon' of ... undefined`) when a piece with the new/renamed
  archetype is actually displayed. Always touch this file in the same pass as the backend enum,
  never as a follow-up.
- `default_bags/*.txt` rosters — entries are piece `name` strings, not filenames; any renamed
  piece needs its bag entries updated too.
- Non-catalog copy that hardcodes the old name/archetype (e.g. example content in frontend rules
  pages) — flag these, don't silently fix content outside the catalog's scope.

## Step 5 — Confirm filename/folder treatment

`engine/loader.py` globs the catalog recursively and keys entries by the JSON `name` field, not by
path — so filenames and folder structure are cosmetic, not functional. Ask explicitly whether to:

- Leave filenames/folders as-is (default if the question goes unanswered), or
- Rename filenames to match new piece names and/or reorganize folders to match new archetypes
  (e.g. splitting one archetype folder into several once it's been split into multiple
  archetypes).

Note separately if any *code* (not just data/filenames) hardcodes an old folder-derived name — e.g.
a bag name string used as a dict/list key elsewhere — since fixing that crosses from a data rename
into an actual code edit and deserves its own explicit confirmation.

## Step 6 — Batch write via `/build`

Once every piece in scope is locked, run the entire batch through `/build` in a single pass:
JSON content edits, both enum mirrors (backend `.py` + frontend `archetypes.ts`), `default_bags`
edits, and any confirmed filename/folder renames. Nothing gets written before this step.
`/build`'s own flow handles verification (JSON validity, `py_compile` on any touched `.py`, grep
for orphaned old-archetype-key references in both the backend enum and
`frontend/utils/archetypes.ts`), recording, and the commit offer.
