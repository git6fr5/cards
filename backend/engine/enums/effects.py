from enum import Enum
from dataclasses import dataclass


PERMANENT_TURNS = 99  # "TURNS 99" convention for approximating a permanent effect


class EffectOperation(str, Enum):
    KILL = "KILL"
    SUMMON = "SUMMON"
    PUT = "PUT"
    MODIFY = "MODIFY"
    CONVERT = "CONVERT"
    NONE = ""


@dataclass
class EffectStep:
    operation: EffectOperation
    params: dict[str, str | int]
