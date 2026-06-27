import json
from game.enums import Trigger, Selection, Layer, EffectOp, FilterKey, CompareOp
from game.models import ParsedEffect, TargetSpec, EffectStep, EffectFilter


def parse_dsl(dsl_text: str | None) -> list[ParsedEffect]:
    if not dsl_text or not dsl_text.strip():
        return []

    lines = [
        line.strip()
        for line in dsl_text.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

    # Split into blocks on lines that start with "ON "
    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if line.upper().startswith("ON "):
            if current:
                blocks.append(current)
            current = [line]
        else:
            current.append(line)
    if current:
        blocks.append(current)

    result = []
    for block in blocks:
        if not block:
            continue
        trigger, trigger_n = _parse_trigger_line(block[0])
        target = None
        effect_lines = block[1:]
        if effect_lines and effect_lines[0].upper().startswith("TARGET "):
            target = _parse_target_line(effect_lines[0])
            effect_lines = effect_lines[1:]
        steps = [_parse_effect_line(line) for line in effect_lines if line]
        result.append(ParsedEffect(
            trigger=trigger,
            trigger_n=trigger_n,
            target=target,
            steps=steps,
        ))

    return result


def _parse_trigger_line(line: str) -> tuple[Trigger, int | None]:
    upper = line.upper().strip()
    # Strip leading "ON "
    rest = upper[3:].strip()

    if rest.startswith("TURN END"):
        parts = rest.split()
        n = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else None
        return Trigger.TURN_END, n

    mapping = {
        "KILL":      Trigger.KILL,
        "DEATH":     Trigger.DEATH,
        "MOVE":      Trigger.MOVE,
        "SUMMON":    Trigger.SUMMON,
        "ACTIVATE":  Trigger.ACTIVATE,
        "PROMOTION": Trigger.PROMOTION,
    }
    first_word = rest.split()[0] if rest else ""
    trigger = mapping.get(first_word)
    if trigger is None:
        raise ValueError(f"Unknown trigger: {line!r}")
    return trigger, None


def _parse_target_line(line: str) -> TargetSpec:
    # Strip leading "TARGET "
    rest = line[7:].strip()

    clauses = _split_clauses(rest)

    selection: Selection | None = None
    n: int | None = None
    matrix: list[list[int | None]] | None = None
    filters: list[EffectFilter] = []
    layers: list[Layer] = []

    for clause in clauses:
        clause = clause.strip()
        upper = clause.upper()

        # LAYER clause
        if upper.startswith("LAYER "):
            layer_str = upper[6:].strip()
            for part in layer_str.split("|"):
                part = part.strip()
                try:
                    layers.append(Layer(part))
                except ValueError:
                    pass
            continue

        # FILTER clause
        if upper.startswith("FILTER "):
            f = _parse_filter(clause[7:].strip())
            if f:
                filters.append(f)
            continue

        # MATRIX clause
        if upper.startswith("MATRIX"):
            bracket_start = clause.index("[")
            matrix = json.loads(clause[bracket_start:].strip())
            selection = Selection.MATRIX
            continue

        # Bare LAYER keyword (e.g. "BOARD", "SHELF", "BAG")
        try:
            layers.append(Layer(upper.split()[0]))
            continue
        except ValueError:
            pass

        # Selection keywords
        parts = upper.split()
        if not parts:
            continue

        sel_map: dict[str, Selection] = {
            "SELF":     Selection.SELF,
            "ALL":      Selection.ALL,
            "SPECIFIC": Selection.SPECIFIC,
            "RANDOM":   Selection.RANDOM,
            "MOST":     Selection.MOST_EXPENSIVE,   # "MOST EXPENSIVE N"
            "LEAST":    Selection.LEAST_EXPENSIVE,  # "LEAST EXPENSIVE N"
        }
        first = parts[0]
        if first in sel_map:
            selection = sel_map[first]
            # Try to parse a trailing integer as N
            if parts[-1].lstrip("-").isdigit():
                n = int(parts[-1])
            continue

    if selection is None:
        selection = Selection.SELF
    if not layers:
        layers = [Layer.BOARD]

    return TargetSpec(
        selection=selection,
        n=n,
        filters=filters,
        layers=layers,
        matrix=matrix,
    )


def _split_clauses(text: str) -> list[str]:
    """Comma-split but respect nested brackets (for MATRIX JSON arrays)."""
    clauses: list[str] = []
    depth = 0
    current: list[str] = []
    for ch in text:
        if ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        if ch == "," and depth == 0:
            clauses.append("".join(current).strip())
            current = []
        else:
            current.append(ch)
    if current:
        clauses.append("".join(current).strip())
    return clauses


def _parse_effect_line(line: str) -> EffectStep:
    upper = line.upper().strip()

    if upper.startswith("KILL TARGET"):
        return EffectStep(op=EffectOp.KILL, params={})

    if upper.startswith("PUT"):
        # "PUT BOARD" | "PUT SHELF" | "PUT BAG"  (bare "PUT" defaults to SHELF)
        parts = upper.split()
        layer_str = parts[1] if len(parts) > 1 else "SHELF"
        try:
            layer = Layer(layer_str)
        except ValueError:
            raise ValueError(f"PUT: unknown layer {layer_str!r} in {line!r}")
        return EffectStep(op=EffectOp.PUT, params={"layer": layer.value})

    if upper.startswith("SUMMON COST TARGET"):
        # "SUMMON COST TARGET -1 TURNS 99"
        parts = upper.split()
        delta = int(parts[3]) if len(parts) > 3 else 0
        turns = int(parts[5]) if len(parts) > 5 else -1
        return EffectStep(op=EffectOp.SUMMON_COST_MOD, params={"delta": delta, "turns": turns})

    if upper.startswith("MOVEMENT COUNT"):
        # "MOVEMENT COUNT -99 TURNS 1"
        parts = upper.split()
        delta = int(parts[2]) if len(parts) > 2 else 0
        turns = int(parts[4]) if len(parts) > 4 else -1
        return EffectStep(op=EffectOp.MOVE_COUNT_MOD, params={"delta": delta, "turns": turns})

    if upper.startswith("SUMMON "):
        # Preserve original casing for the token name
        name = line[7:].strip()
        return EffectStep(op=EffectOp.SUMMON, params={"name": name})

    raise ValueError(f"Unknown effect line: {line!r}")


def _parse_filter(text: str) -> EffectFilter | None:
    upper = text.upper().strip()

    if upper.startswith("ARCHETYPE "):
        value = text[10:].strip().upper()
        return EffectFilter(key=FilterKey.ARCHETYPE, op=CompareOp.EQ, value=value)

    if upper.startswith("SUMMON COST "):
        return _parse_numeric_filter(upper[12:], FilterKey.SUMMON_COST)

    if upper.startswith("MOVEMENT COST "):
        return _parse_numeric_filter(upper[14:], FilterKey.MOVEMENT_COST)

    if upper.startswith("MOVEMENT COUNT "):
        return _parse_numeric_filter(upper[15:], FilterKey.MOVEMENT_COUNT)

    return None


def _parse_numeric_filter(text: str, key: FilterKey) -> EffectFilter | None:
    op_map = {
        "<=": CompareOp.LTE,
        ">=": CompareOp.GTE,
        "<":  CompareOp.LT,
        ">":  CompareOp.GT,
        "=":  CompareOp.EQ,
    }
    text = text.strip()
    # Check longest operators first to avoid "<" matching "<="
    for op_str, op_enum in sorted(op_map.items(), key=lambda x: -len(x[0])):
        if text.startswith(op_str):
            value = text[len(op_str):].strip()
            return EffectFilter(key=key, op=op_enum, value=value)
    return None
