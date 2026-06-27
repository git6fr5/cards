from __future__ import annotations
from dataclasses import dataclass, field

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
    action_count_per_turn: int

    # Trackers
    turns_on_board: int = 0
    kill_count: int = 0
    death_count: int = 0
    promotion_count: int = 0
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
