from dataclasses import dataclass

from engine.entities.pieces.parsers.trigger_parser import parse_trigger_line, TriggerStep
from engine.entities.pieces.parsers.effect_parser import parse_effect_line, EffectStep
from engine.entities.pieces.parsers.target_parser import parse_target_line, TargetStep

@dataclass
class PieceAbility:
    trigger_step: TriggerStep
    effect_step: EffectStep
    target_step: TargetStep

def parse_ability(raw_ability_dsl: str) -> PieceAbility:
    lines = [line.strip() for line in raw_ability_dsl.strip().splitlines() if line.strip()]
    
    if len(lines) != 3:
        raise ValueError(
            f"An ability block must contain exactly 3 lines (Trigger, Effect, Target). "
            f"Found {len(lines)} valid lines instead."
        )
        
    return PieceAbility(
        trigger_step=parse_trigger_line(lines[0]),
        effect_step=parse_effect_line(lines[1]),
        target_step=parse_target_line(lines[2])
    )