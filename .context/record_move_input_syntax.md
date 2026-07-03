---
name: Move Input Syntax Record
description: Recovered design discussion for the terminal move-input notation used to progress the game
type: project
---

## Table of contents

1. [Terminal move input syntax](#1-terminal-move-input-syntax)

---

## 1. Terminal move input syntax

### Context

Work picked up on [engine/loop.py](../engine/loop.py), whose game loop currently just calls a bare
`input("Input Move: ")` with no parsing behind it (see the trailing comments sketching the intended
flow: wait for active player input → accept input, update board/turn state → hand to next player).
The user recalled having designed an input syntax for this in a prior session, but no dedicated spec
existed in `.context/notes.md`, `.context/engine_dsl_reference.md`, or `.context/MEMORY.md` — only a
single fragment survived, a reference to `@target` in notes.md's open design questions. The user
confirmed that session had been archived. Because `search_session_transcripts` was blocked in this
session's permission mode, the session was located by filesystem: `list_sessions` found the archived
session ("engine/loop.py review", 2026-06-30) by title, its app-level metadata file was found under
`~/Library/Application Support/Claude/claude-code-sessions/.../local_94c304cc-....json` (metadata
only — no message content), and the real transcript was recovered via that file's `cliSessionId`
field, pointing to `~/.claude/projects/-Users-Development-Web-cards/4bb09d6b-....jsonl`.

### Discussion points

- Initial read of the code (`player.py`'s `act()` branching on `is_building`) suggested that for
  buildings, `@target` was "dead input" — the `ON ACTIVATE` effect resolves its targets
  deterministically from the DSL, seemingly ignoring the player-supplied square. This led to a
  proposed dedicated activate-in-place operator, `D4!`, to avoid asking the player for a target that
  would go unused.
- The user corrected this: buildings do use the target — the `ON ACTIVATE` effect is *seeded* from
  the player-chosen square (e.g. a `MATRIX` pattern centered on the target rather than on the
  building itself), not resolved independently of it. This retracted the `D4!` proposal and
  collapsed the grammar back to a single `@` operator covering both units and buildings.
- Considered whether melee vs. ranged attacks needed distinct notation. Resolved that notation stays
  identical (`D4@E5` either way); whether the piece relocates onto the target (melee) or stays and
  hits from range is decided by the piece's own attributes at execution time, not by the input
  syntax.
- Considered whether an ability selector was needed for pieces with multiple activated abilities
  (`D4:1@E5`). Resolved as unnecessary: per notes.md, a piece has at most one `ON ACTIVATE` trigger,
  so there is never more than one activated ability to disambiguate.

### Decision

Adopted grammar:

```
<source> @ <target>
```

- **Source** — `S<i>` (shelf slot `i`, a piece not yet on the board) or `<sq>` (a board square holding
  a piece already in play, e.g. `D4`).
- **Target** — always a board square, e.g. `A3`, `E5`.
- **`@`** is a single overloaded operator; the parser does not need to know the intent ahead of time.
  Meaning is resolved at execution time from *(source kind × target-square occupancy)*:

  | source | target empty | target = enemy | target = ally |
  |---|---|---|---|
  | shelf (`S<i>`) | summon | — | — |
  | board (`<sq>`) | move | attack | support/ability |

- **Buildings vs. units** — the deciding switch is `is_building` (already the branch in
  [player.py](../engine/entities/player.py)'s `act()`):
  - *Building* (`ON ACTIVATE`): does not relocate; `@target` is the explicit player-picked square the
    activation effect is seeded from.
  - *Unit* (move/attack): relocates onto `@target`; the target square **is** the destination, with no
    separate target pick.

Examples: `S0@A3` → shelf slot 0 summoned to A3. `D4@E5` → D4 moves to / attacks / activates on E5,
depending on what D4 and E5 are.

**Open questions, unresolved at the end of that session:**
- Coordinate convention: letter = column confirmed; whether row numbering is 0-based or 1-based was
  never pinned down (the board currently prints rows 0–6).
- Multi-target actions (line attacks, area summons placing more than one piece) were not addressed.
- Whether a turn permits exactly one action, or chained actions (e.g. move then attack) requiring
  compound input, was not addressed.
