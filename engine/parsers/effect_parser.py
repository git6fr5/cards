from enum import Enum
from engine.utils.enums import Alignment
from dataclasses import dataclass


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
            return EffectStep(operation=EffectOperation.KILL, params={})

        case ["SUMMON", alignment]:
            return EffectStep(
                operation=EffectOperation.SUMMON,
                params={"alignment": Alignment[alignment]}
            )

        case ["PUT", layer]:
            return EffectStep(
                operation=EffectOperation.PUT,
                params={"layer": layer.upper()}
            )

        case ["MODIFY", attribute, delta, "TURNS", turns]:
            return EffectStep(
                operation=EffectOperation.MODIFY,
                params={
                    "attribute": attribute.lower(),
                    "delta": int(delta),
                    "turns": int(turns)
                }
            )

        case _:
            raise ValueError(f"Unparseable effect instruction sequence: {line}")
