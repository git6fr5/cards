from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from game.enums import (
    Archetype, PieceType, Layer, Trigger,
    EffectOp, FilterKey, CompareOp, Selection,
)


@dataclass
class EffectFilter:
    key:   FilterKey
    op:    CompareOp
    value: str


@dataclass
class TargetSpec:
    selection: Selection
    n:         Optional[int]          = None
    filters:   list[EffectFilter]     = field(default_factory=list)
    layers:    list[Layer]            = field(default_factory=list)
    matrix:    Optional[list[list[Optional[int]]]] = None   # 3x3; 1=included, 0/None=excluded


@dataclass
class EffectStep:
    op:     EffectOp
    params: dict[str, str | int]


@dataclass
class Modifier:
    """
    A temporary, self-reversing change to a Piece attribute.

    Applying the modifier mutates `piece.<attr>` by `delta` directly; the
    modifier records what it did so it can undo itself when `turns_left`
    reaches 0. Stored as data (not a callable) so the snapshot serialiser
    can dump it to JSON; the reverse logic lives in engine._reverse_modifier.
    """
    attr:       str          # Piece attribute affected, e.g. "summon_cost"
    delta:      int          # amount applied; reversal subtracts this
    turns_left: int
    source:     str = ""     # what applied it (effect/piece label), for logs


@dataclass
class ParsedEffect:
    trigger:   Trigger
    trigger_n: Optional[int]        = None   # for ON TURN END N
    target:    Optional[TargetSpec] = None
    steps:     list[EffectStep]     = field(default_factory=list)


@dataclass
class Piece:
    piece_id:       int
    name:           str
    archetype:      Archetype
    piece_type:     PieceType
    body_color:     str
    movement:       list[list[int]]            # 3x3 movement matrix
    effect_grid:    list[list[Optional[str]]]  # 3x3 spatial effect keys (frontend display system)
    card_effects:   list[ParsedEffect]         # parsed DSL card abilities
    raw_effect_dsl: str                        # original DSL for serialisation round-trips

    # Runtime state
    layer:         Layer                      = Layer.SHELF
    position:      Optional[tuple[int, int]] = None
    owner_id:      int                        = 0
    summon_cost:   int                        = 1
    move_cost:     int                        = 1
    move_count:    int                        = 1
    is_alive:      bool                       = True
    turns_on_board: int                       = 0
    kill_count:    int                        = 0

    # Active temporary modifiers — each self-describes its own reversal.
    # Stacks freely; each entry ticks down and reverses independently.
    modifiers: list[Modifier] = field(default_factory=list)


@dataclass
class PlayerState:
    player_id: int
    board:     dict[tuple[int, int], Piece] = field(default_factory=dict)
    shelf:     list[Piece]                  = field(default_factory=list)
    bag:       list[Piece]                  = field(default_factory=list)


@dataclass
class GameState:
    room_id:       int
    turn:          int                    = 0
    active_player: int                    = 0
    players:       dict[int, PlayerState] = field(default_factory=dict)
    log:           list[str]              = field(default_factory=list)
    _next_id:      int                    = field(default=0, repr=False)

    def next_piece_id(self) -> int:
        pid = self._next_id
        self._next_id += 1
        return pid
