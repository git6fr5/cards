from enum import Enum
from dataclasses import dataclass

from engine.parsers.filter_parser import parse_filters

class TriggerCondition(str, Enum):
    TURNEND = "TURNEND"
    MOVE = "MOVE"
    KILL = "KILL"
    DEATH = "DEATH"
    SUMMON = "SUMMON"
    PROMOTION = "PROMOTION"
    NONE = ""


@dataclass
class TriggerStep:
    condition: TriggerCondition
    params: dict[str, str | int]


TRIGGER_ATTRIBUTE: dict[TriggerCondition, str] = {
    TriggerCondition.TURNEND: "turns_on_board",
    TriggerCondition.MOVE: "distance_total",
    TriggerCondition.KILL: "kill_count",
    TriggerCondition.DEATH: "death_count",
    TriggerCondition.SUMMON: "summon_count",
    TriggerCondition.PROMOTION: "promotion_count",
}

def parse_trigger_line(line: str) -> TriggerStep:
    parts = line.upper().strip().split()
    if not parts:
        return TriggerStep(condition=TriggerCondition.NONE, params={})

    match parts:

        case ["ON", condition, value, *filter_parts]:
            filter_line = " ".join(filter_parts)

            return TriggerStep(
                condition=TriggerCondition(condition),
                params={
                    "attribute": TRIGGER_ATTRIBUTE[TriggerCondition(condition)],
                    "value": int(value), 
                    "filters": parse_filters(filter_line)
                }
            )
        
        case _:
            raise ValueError(f"Unparseable trigger instruction sequence: {line}")
