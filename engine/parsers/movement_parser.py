from engine.utils.positions import Position, Patterns, scale_pattern

def parse_movement(raw_movement_dsl: str) -> set[Position]:
    parts = raw_movement_dsl.strip().upper().split()
    
    match parts:
        case [pattern_type, pattern_size]:
            return scale_pattern(Patterns[pattern_type].value, int(pattern_size))
        case _:
            raise ValueError(f"Unparseable movement_dsl spec: {raw_movement_dsl}")
    