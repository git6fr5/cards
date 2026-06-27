from enum import Enum
from dataclasses import dataclass

from triggers import TriggerStep
from targets import TargetStep


class EffectOperation(str, Enum):
    KILL = "KILL"
    SUMMON = "SUMMON"
    PUT = "PUT"
    MODIFY = "MODIFY"
    NONE = ""


@dataclass
class EffectStep:
    operation: EffectOperation
    params: dict[str, str | int]


@dataclass
class ParsedEffect:
    trigger: TriggerStep
    target: TargetStep
    steps: EffectStep


def parse_effect_line(line: str) -> EffectStep:
    parts = line.upper().strip().split()
    if not parts:
        return EffectStep(operation=EffectOperation.NONE, params={})

    try:
        operation = EffectOperation(parts[0])
    except ValueError:
        raise ValueError(f"Unparseable effect instruction sequence: {line}")

    match parts:

        case ["KILL"]:
            # e.g., "KILL"
            return EffectStep(operation=operation, params={})

        case ["SUMMON", identity]:
            # e.g., "SUMMON SKELETON"
            return EffectStep(
                operation=operation,
                params={"identity": identity.lower()}
            )

        case ["PUT", layer]:
            # e.g., "PUT BOARD" or "PUT BAG"
            return EffectStep(
                operation=operation,
                params={"layer": layer.upper()}
            )

        case ["MODIFY", attribute, delta, "TURNS", turns]:
            # e.g., "MODIFY ACTION_COUNT -1 TURNS 1"
            return EffectStep(
                operation=operation,
                params={
                    "attribute": attribute.lower(),
                    "delta": int(delta),
                    "turns": int(turns)
                }
            )

        case _:
            raise ValueError(f"Unparseable effect instruction sequence: {line}")
