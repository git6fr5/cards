# Engine restructure plan (COMPLETE)

## Context

`engine/` is the pure-Python, runnable core of the card game (no HTTP, no DB). It
grew organically and was mid-refactor and not import-clean: step dataclasses lived in
`entities/pieces/trigger.py` but were imported from `engine.abilities.ability`;
`Piece.create(x)` was called against a `create(player, data)` signature;
`engine/__init__.py` and `entities/room.py` were HTTP concerns.

Goal: flatter, intention-revealing layout — each game concept owns one file holding
its enum/dataclasses and its DSL parser; pieces own their definition + ability parsing;
game loop / data loading split out of monolithic `engine.py`; data → one-file-per-piece.

## Result (implemented & verified)

```
engine/
  __init__.py            # emptied of HTTP
  loop.py                # start_game, is_game_over, turn loop
  loader.py              # load_pieces, load_decks (reads .data/)
  resolver.py            # is_triggered/resolve_targets/... (mostly commented)
  entities/{piece,player,board}.py
  enums/{alignment,archetype,roletype,zone,triggers,targets,effects,patterns}.py
  utils/{positions,filters}.py
  .data/piece_defns/<archetype>/<name>.json   (one piece per file)
  .data/deck_defns/<archetype>.txt
```

Removed: `abilities/`, `entities/pieces/`, `entities/room.py`, `parsers/`,
`utils/enums.py`, `data/`, `default_bags/`.

Renames: `PieceType`→`RoleType`, `Layer`→`Zone`, JSON `pieceType`→`roleType`, piece
field `piece_type`→`role`.

Decisions: (A) resolution logic in `engine/resolver.py`, kept commented; (B)
`parse_filters` in `engine/utils/filters.py`, `satisfies_filters` a `Piece` method;
(C) kebab-case piece JSON filenames + `roleType` key; (D) repoint/align imports so the
package imports cleanly, leave gameplay stubs as-is.

Import-cleanliness fixes made during the move: `piece.py` imports `Player` under
`TYPE_CHECKING` (breaks `piece↔player` cycle); `Piece.create(data, player=None)`
reordered so the loader builds catalog pieces; `board.py` `pieces` given
`field(default_factory=dict)` (was a non-default-after-default dataclass error);
`resolver.py` commented out `from engine.effects.apply import apply_effect` (module
deleted).

Verified: all modules `py_compile`; package imports cleanly; `load_ability`/parse
checks pass; `load_pieces()` returns 4 pieces.

## Follow-up

Superseded in part by the DSL parser consolidation: all parsing was subsequently
pulled out of the per-concept enum files into a single `engine/utils/parsers.py`, the
`enums/*` modules became pure types, `utils/filters.py` was removed, and
`entities/piece.py` gained a thin `load_ability` wrapper. See the active plan.
