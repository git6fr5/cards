import re
import operator

from engine.enums.alignment import Alignment
from engine.enums.zone import Zone
from engine.enums.roletype import RoleType
from engine.enums.archetype import Archetype
from engine.enums.patterns import Patterns
from engine.enums.triggers import TriggerCondition, TriggerStep, TRIGGER_ATTRIBUTE
from engine.enums.effects import EffectOperation, EffectStep
from engine.enums.targets import TargetType, TargetStep
from engine.utils.positions import Position, scale_pattern
from engine.entities.piece import PieceAbility


COMPARATORS = {
    "<": operator.lt, "<=": operator.le,
    ">": operator.gt, ">=": operator.ge,
    "=": operator.eq,
}

# Convertible PieceType fields -> the enum their values resolve to.
CONVERTIBLE_TYPES = {
    "roletype": RoleType,
    "archetype": Archetype,
}


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


def parse_trigger_line(line: str, separator: str = " ") -> TriggerStep:
    parts = line.upper().strip().split(separator)
    if not parts:
        return TriggerStep(condition=TriggerCondition.NONE, params={})

    match parts:

        case ["ON", "ACTIVATE"]:
            return TriggerStep(condition=TriggerCondition.ACTIVATE, params={})

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


def parse_effect_line(line: str, separator: str = " ") -> EffectStep:
    parts = line.upper().strip().split(separator)
    if not parts:
        return EffectStep(operation=EffectOperation.NONE, params={})

    match parts:

        case ["KILL"]:
            return EffectStep(operation=EffectOperation.KILL, params={})

        case ["SUMMON", alignment]:
            return EffectStep(
                operation=EffectOperation.SUMMON,
                params={"alignment": Alignment[alignment]}
            )

        case ["PUT", zone]:
            return EffectStep(
                operation=EffectOperation.PUT,
                params={"zone": zone.upper()}
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

        case ["CONVERT", type_field, converted_type]:
            type_field = type_field.lower()
            enum_cls = CONVERTIBLE_TYPES[type_field]
            return EffectStep(
                operation=EffectOperation.CONVERT,
                params={
                    "type_field": type_field,
                    "convertedtype": enum_cls[converted_type],
                }
            )

        case ["CONVERT", type_field, converted_type, "TURNS", turns]:
            type_field = type_field.lower()
            enum_cls = CONVERTIBLE_TYPES[type_field]
            return EffectStep(
                operation=EffectOperation.CONVERT,
                params={
                    "type_field": type_field,
                    "convertedtype": enum_cls[converted_type],
                    "turns": int(turns),
                }
            )

        case _:
            raise ValueError(f"Unparseable effect instruction sequence: {line}")


def parse_target_line(line: str, separator: str = " ") -> TargetStep:
    parts = line.upper().strip().split(separator)
    if not parts:
        return TargetStep(target_type=TargetType.NONE, params={})

    match parts:
        case ["SELF"]:
            return TargetStep(target_type=TargetType.SELF, params={})

        case ["DEFENDER"]:
            return TargetStep(target_type=TargetType.DEFENDER, params={})

        case [alignment, zone_parts, count, *filter_parts]:
            if count == "ALL": count = 99
            zone = parse_zone(zone_parts, ":")

            return TargetStep(
                target_type=TargetType.ZONE,
                params={
                    "alignment": Alignment(alignment),
                    "zone": zone,
                    "count": int(count),
                    "filters": parse_filters(" ".join(filter_parts))
                }
            )

        case _:
            raise ValueError(f"Unparseable target instruction sequence: {line}")


def parse_zone(zone_dsl: str, separator: str = " ") -> dict:
    match zone_dsl.split(separator):
        case ["BAG", "SEE", see_count]:
            return {
                "zone": Zone.BAG,
                "see": 99 if see_count == "ALL" else int(see_count)
            }
        case ["BOARD", "PATTERN", pattern_type, pattern_size]:
            raw_pattern_dsl = f"{pattern_type} {pattern_size}"
            return {
                "zone": Zone.BOARD,
                "positions": parse_pattern(raw_pattern_dsl)
            }
        case ["SHELF"]:
            return {"zone": Zone.SHELF}
        case _:
            raise ValueError(f"Unparseable zone spec: {zone_dsl}")


def parse_pattern(raw_pattern_dsl: str, separator: str = " ") -> set[Position]:
    parts = raw_pattern_dsl.strip().upper().split(separator)

    match parts:
        case ["NONE"]:
            return set()
        case [pattern_type, pattern_size]:
            return scale_pattern(Patterns[pattern_type].value, int(pattern_size))
        case _:
            raise ValueError(f"Unparseable movement_dsl spec: {raw_pattern_dsl}")


def parse_filters(line: str) -> dict[str, dict | list]:
    filters = {
        "structure": {},
        "attributes": {}
    }

    parts = line.upper().strip().split()
    if not parts or parts[0] != "WHERE" or parts[1] == "ANY":
        return filters

    attr_pattern = re.compile(r"ATT:([A-Z_]+)(<=|>=|<|>|=)(\d+)")

    for criterion in parts[1:]:
        if match := attr_pattern.match(criterion):
            attr_name, comparator, value = match.groups()
            filters["attributes"][attr_name.lower()] = (COMPARATORS[comparator], int(value))
        elif ":" in criterion:
            key, raw_values = criterion.split(":", 1)
            filters["structure"][key.lower()] = raw_values.upper().split("|")

    return filters
