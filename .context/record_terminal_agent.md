# Terminal Agent (AI-controlled moves)

## Contents
1. [Context](#context)
2. [Discussion points](#discussion-points)
3. [Decision](#decision)

## Context

The user wants a non-AI "agent" (traditional sense: an automated player, not an LLM) able to play
the game at the terminal level. Typing `AI0` (or `AI1`) at the existing `input("Input Move: ")`
prompt in `engine/loop.py` should resolve to a move that a registered agent computes for that
player index, feeding into the same move grammar already parsed by
`engine/utils/input_parser.py` (e.g. `B3@B4`, `S0@C2`, `EOT`).

Hard constraint from the user: no rewrites to anything else — `loop.py` stays untouched, only the
minimum touch point should change.

`engine/agent/` already existed as an empty stub (`dumb.py`) before this session, signaling the
intended location for agent implementations.

## Discussion points

- Considered whether the engine needed a new board-wide legal-move enumerator. `Player._legal_moves`
  only computes legal targets for one already-selected origin; there's no existing "all legal moves
  for this player" method. Decided against adding one to `entities/player.py` to honor the "no
  rewrites elsewhere" constraint — the agent computes its own candidate list by iterating
  `board.pieces` and `player.shelf` itself, calling the existing (underscore-prefixed but
  accessible) `_legal_moves` per piece.
- Confirmed `engine` is a documented pure-logic package (`backend_package_structure.md` "Package
  archetypes") with no HTTP surface — adding `agent/` under it (alongside `entities/`, `enums/`,
  `utils/`) fits the existing shape, not a new pattern.
- Confirmed via `.shared-paths` that `backend/engine` is not a shared/copybara-tracked path, so no
  shared-sync check was needed before editing.

## Decision

Implemented with exactly one touch point outside the new `agent/` package:

- `backend/engine/agent/dumb.py` — `DumbAgent.decide(game, viewer_index) -> str`: builds every
  legal `origin@target` move and legal `S{shelf_index}@target` summon for that player (respecting
  mana, action_count/fatigue, and king summoning range), then picks uniformly via `game.rng.choice`
  (the game's seeded RNG, not the stdlib `random` module, so agent play stays reproducible under a
  seeded game). Returns `"EOT"` if no legal action exists.
- `backend/engine/agent/__init__.py` — `AGENTS: dict[int, DumbAgent]` registry mapping an agent
  index (not necessarily the player index) to an agent instance. Currently `{0: DumbAgent(), 1:
  DumbAgent()}`.
- `backend/engine/utils/input_parser.py` — added `AGENT_PATTERN = re.compile(r"^AI(\d+)$")` and a
  branch in `read_raw_input`: on a match, looks up the agent in `AGENTS` by lazy import (mirrors
  the existing deferred `next_turn` import pattern to avoid circular imports), calls
  `agent.decide(game, resolved_viewer_index)`, then recurses `read_raw_input` on the resulting move
  string so it flows through the normal parsing/dispatch path unchanged.

`loop.py` was not touched — it already just forwards whatever string `input()` returns into
`read_raw_input`, so typing `AI0` at the existing prompt works with no loop changes.

Verified without touching the DB: `py_compile` + `ast.parse` on all three files, then an actual
import-and-run smoke test (`engine.loop` / `engine.utils.input_parser` import cleanly with no DB
dependency in the chain) — ran a seeded game end-to-end (`AI0` move → `EOT` → `AI1` move) and
confirmed both agents produced valid, applied moves.
