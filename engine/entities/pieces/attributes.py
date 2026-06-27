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
    summon_cost: int     # tribute
    action_cost: int       # tribute
    action_count: int      # adrenaline
    turns_on_board: int  # age
    kill_count: int      # bloodthirst
    distance_total: int       # explorer

    # SAFE: Ensures every single piece gets its own unique tracking list
    modifiers: list[PieceAttributeModifier] = field(default_factory=list)

    def set(self, name: str, value: int) -> None:
        if not hasattr(self, name) or name == "modifiers":
            raise AttributeError(f"Invalid attribute: {name}")
        setattr(self, name, value)

    def get(self, name: str) -> int:
        if name == "modifiers":
            raise AttributeError("Cannot fetch modifiers array as an integer attribute.")
            
        base_val = getattr(self, name)
        active_modifiers = [
            mod for mod in self.modifiers 
            if mod.attribute == name and mod.turns_left > 0
        ]
        total_delta = sum(mod.delta for mod in active_modifiers)
        return base_val + total_delta
    
    def modify(self, name: str, delta: int, turns: int, source: str = "") -> None:
        # Fixed keyword argument from name=name to attribute=name
        self.modifiers.append(
            PieceAttributeModifier(
                attribute=name, 
                delta=delta, 
                turns_left=turns, 
                source=source
            )
        )
