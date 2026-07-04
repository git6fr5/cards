from enum import Enum
from dataclasses import dataclass


class TargetType(str, Enum):
    SELF = "SELF"
    DEFENDER = "DEFENDER"   # The unit receiving the damage/kill
    ZONE = "ZONE"
    NONE = ""


@dataclass
class TargetStep:
    target_type: TargetType
    params: dict[str, str | int | dict]  # Can hold sub-filters or limits
