from enum import Enum
from dataclasses import dataclass


class TriggerCondition(str, Enum):
    TURNEND = "TURNEND"
    MOVE = "MOVE"
    KILL = "KILL"
    DEATH = "DEATH"
    SUMMON = "SUMMON"
    PROMOTION = "PROMOTION"
    ACTIVATE = "ACTIVATE"
    NONE = ""


@dataclass
class TriggerStep:
    condition: TriggerCondition
    params: dict[str, str | int]


TRIGGER_ATTRIBUTE: dict[TriggerCondition, str] = {
    TriggerCondition.TURNEND: "turns_on_board",
    TriggerCondition.MOVE: "distance_moved_count",
    TriggerCondition.KILL: "kill_count",
    TriggerCondition.DEATH: "death_count",
    TriggerCondition.SUMMON: "summon_count",
    TriggerCondition.PROMOTION: "promotion_count",
}
