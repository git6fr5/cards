from enum import Enum
from dataclasses import dataclass

from engine.entities.pieces.parsers.filter_parser import parse_filters
from engine.entities.pieces.trigger import TriggerCondition, TriggerStep

def parse_trigger_line(line: str) -> TriggerStep:
    parts = line.upper().strip().split()
    if not parts:
        return TriggerStep(condition=TriggerCondition.NONE, params={})

    match parts:

        case ["ON", condition, value, *filter_parts]:
            filter_line = " ".join(filter_parts)

            return TriggerStep(
                condition=TriggerCondition(condition),
                params={"value": int(value), "filters": parse_filters(filter_line)}
            )
        
        # case ["ON", "TURNEND", turns, *filter_parts]:
        #     filter_line = " ".join(filter_parts)

        #     return TriggerStep(
        #         condition=TriggerCondition.TURNEND,
        #         params={"turns": int(turns), "filters": parse_filters(filter_line)}
        #     )

        # case ["ON", "MOVE", distance, *filter_parts]:
        #     filter_line = " ".join(filter_parts)

        #     return TriggerStep(
        #         condition=TriggerCondition.MOVE,
        #         params={"distance": int(distance), "filters": parse_filters(filter_line)}
        #     )

        # case ["ON", "KILL", kills, *filter_parts]:
        #     filter_line = " ".join(filter_parts)

        #     return TriggerStep(
        #         condition=TriggerCondition.KILL,
        #         params={kills: int(kills), "filters": parse_filters(filter_line)}
        #     )

        # case ["ON", "DEATH", deaths, *filter_parts]:
        #     filter_line = " ".join(filter_parts)

        #     return TriggerStep(
        #         condition=TriggerCondition.DEATH,
        #         params={"deaths": int(deaths), "filters": parse_filters(filter_line)}
        #     )

        # case ["ON", "SUMMON", summons, *filter_parts]:
        #     filter_line = " ".join(filter_parts)

        #     return TriggerStep(
        #         condition=TriggerCondition.SUMMON,
        #         params={"summons": int(summons), "filters": parse_filters(filter_line)}
        #     )

        # case ["ON", "PROMOTION", promotions, *filter_parts]:
        #     filter_line = " ".join(filter_parts)

        #     return TriggerStep(
        #         condition=TriggerCondition.PROMOTION,
        #         params={"promotions": int(promotions), "filters": parse_filters(filter_line)}
        #     )

        case _:
            raise ValueError(f"Unparseable trigger instruction sequence: {line}")
