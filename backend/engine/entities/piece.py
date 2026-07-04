from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from uuid import uuid4
from typing import TYPE_CHECKING

from engine.utils.positions import Position
from engine.enums.archetype import Archetype
from engine.enums.roletype import RoleType
from engine.enums.triggers import TriggerStep
from engine.enums.effects import EffectStep
from engine.enums.targets import TargetStep

if TYPE_CHECKING:
    from engine.entities.player import Player


@dataclass
class PieceAttributeModifier:
    attribute: str # Piece attribute affected, e.g. "summon_cost"
    delta: int
    turns_left: int
    source: str = ""


@dataclass
class PieceAttributes:

    summon_cost: int
    action_cost: int
    action_count: int

    # Trackers
    turns_on_board: int = 0
    kill_count: int = 0
    death_count: int = 0
    promotion_count: int = 0
    summon_count: int = 0
    actions_performed_count: int = 0
    distance_moved_count: int = 0

    modifiers: list[PieceAttributeModifier] = field(default_factory=list)

    def set(self, name: str, value: int) -> None:
        if not hasattr(self, name) or name == "modifiers":
            raise AttributeError(f"Invalid attribute: {name}")
        setattr(self, name, value)

    def get(self, name: str) -> int:
        if name == "modifiers":
            raise AttributeError("Cannot fetch modifiers array as an integer attribute.")

        base_value = getattr(self, name)
        active_modifiers = [
            mod for mod in self.modifiers
            if mod.attribute == name and mod.turns_left > 0
        ]
        total_delta = sum(mod.delta for mod in active_modifiers)
        return base_value + total_delta

    def modify(self, name: str, delta: int, turns: int, source: str = "") -> None:
        self.modifiers.append(
            PieceAttributeModifier(
                attribute=name,
                delta=delta,
                turns_left=turns,
                source=source
            )
        )

@dataclass
class PieceTypeConverter:
    convertedEnum: Enum
    turns_left: int
    source: str = ""

@dataclass
class PieceType:
    archetype: Archetype
    roletype: RoleType

    conversions: dict[str, PieceTypeConverter] = field(default_factory=dict)

    def get(self, name: str) -> Enum:
        if name == "conversions":
            raise AttributeError("Cannot fetch conversions array as a type directly.")

        converter = self.conversions.get(name)
        if converter and converter.turns_left > 0:
            return converter.convertedEnum
        return getattr(self, name)

    def convert(self, name: str, convertedEnum: Enum, turns: int, source: str = "") -> None:
        self.conversions[name] = PieceTypeConverter(
            convertedEnum=convertedEnum,
            turns_left=turns,
            source=source
        )


@dataclass
class PieceAbility:
    trigger_step: TriggerStep
    effect_step: EffectStep
    target_step: TargetStep


@dataclass
class Piece:

    piece_id: uuid4
    name: str
    player: Player

    movement: set[Position]
    ability: PieceAbility
    ability_dsl: str

    piecetype: PieceType
    attributes: PieceAttributes

    @property
    def is_building(self):
        return self.piecetype.get("roletype") == RoleType.BUILDING

    @property
    def can_capture_allies(self):
        return self.piecetype.get("roletype") == RoleType.CANNIBAL

    @property
    def can_capture_enemies(self):
        return self.piecetype.get("roletype") != RoleType.PACIFIST
    
    @property
    def position(self) -> Position | None:
        from engine.game import game
        if game.board is None:
            return None
        return game.board.position_of(self)
    
    @property
    def alive(self) -> bool:
        return self.position is not None

    def satisfies_filters(self, filters: dict[str, dict | list]) -> bool:
        # Structure: enum-backed type fields (archetype, roletype). get() honors
        # active conversions and returns the enum; .value matches the uppercase
        # DSL values, e.g. {"archetype": ["DRAGON"]}.
        for key, allowed in filters["structure"].items():
            if self.piecetype.get(key).value not in allowed:
                return False

        # Attributes: modifier-aware numeric comparisons, where each value is a
        # (comparator, int) pair, e.g. {"summon_cost": (operator.le, 2)}.
        for attr, (comparator, value) in filters["attributes"].items():
            if not comparator(self.attributes.get(attr), value):
                return False

        return True

    def describe_ability(self) -> str:
        return self.ability_dsl

    @staticmethod
    def load_ability(raw_ability_dsl: str) -> PieceAbility:
        from engine.utils.parsers import parse_ability
        return parse_ability(raw_ability_dsl)

    @staticmethod
    def load_movement(raw_movement_dsl: str) -> set[Position]:
        from engine.utils.parsers import parse_pattern
        return parse_pattern(raw_movement_dsl)

    @staticmethod
    def create(data: dict, player: Player | None = None) -> "Piece":
        roletype = RoleType[data.get("roleType")]
        fields = dict(
            player=player,
            piece_id=uuid4(),
            name=data.get("name"),
            movement=Piece.load_movement(data.get("movement")),
            ability=Piece.load_ability(data.get("ability")),
            ability_dsl=data.get("ability"),
            piecetype=PieceType(
                archetype=Archetype[data.get("archetype")],
                roletype=roletype,
            ),
            attributes=PieceAttributes(
                summon_cost=data.get("attributes").get("summon_cost"),
                action_cost=data.get("attributes").get("action_cost"),
                action_count=data.get("attributes").get("action_count"),
            ),
        )

        if roletype == RoleType.KING:
            return KingPiece(**fields, summoning=Piece.load_movement(data.get("summoning")))

        return Piece(**fields)


@dataclass
class KingPiece(Piece):
    summoning: set[Position]
