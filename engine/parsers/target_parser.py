from enum import Enum
from dataclasses import dataclass

from enums import Patterns
from engine.entities.pieces.parsers.filter_parser import parse_filters

from engine.entities.pieces.trigger import TargetType, TargetStep

def parse_target_line(line: str) -> TargetStep:
    parts = line.upper().strip().split()
    if not parts:
        return TargetStep(target_type=TargetType.NONE, params={})

    match parts:
        case ["SELF"]:
            return TargetStep(target_type=TargetType.SELF, params={})

        case ["DEFENDER"]:
            return TargetStep(target_type=TargetType.TARGET, params={})

        case ["RANDOM", alignment, count, layer, *filter_parts]:
            return TargetStep(
                target_type=TargetType.RANDOM,
                params={
                    "alignment": alignment.lower(),
                    "count": int(count),
                    "layer": layer.upper(),  # e.g., "BOARD", "BAG", "SHELF"
                    "filters": parse_filters(" ".join(filter_parts))
                }
            )

        case ["ALL", alignment, layer, *filter_parts]:
            filter_line = " ".join(filter_parts)
            return TargetStep(
                target_type=TargetType.ALL,
                params={
                    "alignment": alignment.lower(),
                    "filters": parse_filters(filter_line)
                }
            )

        case ["PATTERN", pattern, alignment, *filter_parts]:
            filter_line = " ".join(filter_parts)
            return TargetStep(
                target_type=TargetType.ALL,
                params={
                    "pattern": Patterns(pattern),
                    "alignment": alignment.lower(),
                    "filters": parse_filters(filter_line)
                }
            )

        case _:
            raise ValueError(f"Unparseable target instruction sequence: {line}")
