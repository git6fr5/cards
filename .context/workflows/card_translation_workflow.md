---
name: Card Concept Translation Workflow
description: Step-by-step process for translating a natural-language card concept into an engine/.data/catalog/**/*.json entry
---
When the user describes a card concept in plain language and asks to add/translate it, follow this exact process.

**Why:** Freeform card ideas map onto a narrow DSL vocabulary (5 trigger conditions, 5 effect
ops, 3 target shapes) and a fixed schema — going straight to JSON from a vague concept risks
silently inventing engine capability that doesn't exist, or guessing at costs the user never
specified. This workflow forces orientation, honest gap-flagging, and explicit confirmation
before anything gets written.

**How to apply:** Any time the user describes a card idea in natural language and asks for it
to be added to the catalog, or asks to translate a concept into the engine's card format.

**Arguments:** a natural-language description of the card (name optional, effect described
loosely — not required to name specific DSL terms).

---

## Step 1 — Orient

Before translating anything, (re-)read the files needed to reason about the engine's card
vocabulary and conventions:

- `.context/engine_dsl_reference.md` — the DSL spec itself.
- `.context/notes.md` — open design questions/caveats that might affect the translation.
- `backend/engine/enums/triggers.py`, `effects.py`, `targets.py`, `patterns.py`, `roletype.py`,
  `archetype.py`, `zone.py`, `alignment.py` — the closed vocabulary; nothing outside these
  enums can be expressed.
- `backend/engine/entities/piece.py` — `PieceAttributes`/`PieceType`/`Piece.create` schema
  (what fields a catalog JSON must supply).
- `backend/engine/entities/player.py` — where each trigger actually fires from (`summon`/`act`),
  needed to judge whether a described effect is even reachable.
- `backend/engine/resolver.py` — what each effect op actually *does* at resolution time (e.g.
  `SUMMON`/`PUT` are still no-op stubs — a concept leaning on them won't functionally work yet
  even though it parses).
- `backend/engine/utils/parsers.py` — exact line grammar (`parse_trigger_line`/
  `parse_effect_line`/`parse_target_line`) to avoid guessing at syntax.
- 2-3 sibling catalog JSONs in `backend/engine/.data/catalog/{same or nearest archetype}/` —
  style/convention reference.

Skip re-reading files already fresh in context from earlier in the same session.

---

## Step 2 — Translate to DSL

Map the concept onto the 3-line ability grammar:

```
ON <TRIGGER> <n> [WHERE ...]
<EFFECT> ...
<ALIGNMENT> <ZONE> <count> [WHERE ...]
```

If any part of the concept has no representation in the current vocabulary (most commonly:
anything targeting the *player* rather than a `Piece` — e.g. granting mana directly), do not
invent a field to cover it. State the gap plainly and propose the closest in-schema
approximation, marked clearly as an approximation, not a faithful translation.

---

## Step 3 — Fill remaining details

For anything the concept didn't specify (`summon_cost`, `action_cost`, `action_count`,
`movement` type/distance, `roleType` if ambiguous), suggest values — anchored to sibling cards
of the same archetype/role for balance consistency — and fill out the rest of the JSON. Call
out explicitly which fields were suggested vs. given by the user.

---

## Step 4 — Present and confirm

Show both side by side:
- The natural-language concept as understood (one line, to confirm no misread).
- The full draft JSON.

Ask the user to confirm before proceeding — do not write anything yet.

---

## Step 5 — Output to destination path

Once confirmed: `backend/engine/.data/catalog/{archetype_lower}/{kebab-case-name}.json`. File
creation still goes through `/build` or `/quick-edit` per the project's hard-stop rule — Step 4's
shown snippet satisfies `/quick-edit`'s "already shown" condition for that one file.
