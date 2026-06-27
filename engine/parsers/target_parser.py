from enum import Enum
from dataclasses import dataclass
from engine.utils.enums import Alignment, Layer
from engine.utils.positions import Patterns, scale_pattern
from engine.parsers.filter_parser import parse_filters

class TargetType(str, Enum):
    SELF = "SELF"
    DEFENDER = "DEFENDER"   # The unit receiving the damage/kill
    LAYER = "LAYER"
    NONE = ""


@dataclass
class TargetStep:
    target_type: TargetType
    params: dict[str, str | int | dict]  # Can hold sub-filters or limits


def parse_target_line(line: str) -> TargetStep:
    parts = line.upper().strip().split()
    if not parts:
        return TargetStep(target_type=TargetType.NONE, params={})

    match parts:
        case ["SELF"]:
            return TargetStep(target_type=TargetType.SELF, params={})

        case ["DEFENDER"]:
            return TargetStep(target_type=TargetType.DEFENDER, params={})

        case [alignment, layer_parts, count, *filter_parts]:
            if count == "ALL": count = 99
            layer = parse_layer(layer_parts)
                
            return TargetStep(
                target_type=TargetType.LAYER,
                params={
                    "alignment": Alignment(alignment),
                    "layer":layer,
                    "count": int(count),
                    "filters": parse_filters(" ".join(filter_parts))
                }
            )

        case _:
            raise ValueError(f"Unparseable target instruction sequence: {line}")


def parse_layer(layer_dsl: str) -> dict:
    match layer_dsl.split(":"):
        case ["BAG", "SEE", see_count]:
            return {"layer": Layer.BAG,
                    "see": 99 if see_count == "ALL" else int(see_count)}
        case ["BOARD", "PATTERN", pattern_type, pattern_size]:
            return {"layer": Layer.BOARD,
                    "positions": scale_pattern(Patterns[pattern_type].value, int(pattern_size))}
        case ["SHELF"]:
            return {"layer": Layer.SHELF}
        case _:
            raise ValueError(f"Unparseable layer spec: {layer_dsl}")