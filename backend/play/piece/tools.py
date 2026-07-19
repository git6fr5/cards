from engine.entities.piece import Piece
from engine.loader import load_catalog
from engine.utils.positions import Position


def resolve_catalog_entries(names: list[str] | None) -> dict[str, dict]:
    catalog = load_catalog()
    if names is None:
        return catalog
    return {name: catalog[name] for name in names if name in catalog}


def compute_movement_grid(movement: str) -> list[list[int]]:
    # 3x3 grid (row 0 = up, col 0 = left) of how many squares a piece reaches in each
    # direction; the center is always 0 (self).
    positions = Piece.load_movement(movement)
    grid = [[0] * 3 for _ in range(3)]
    for row in range(3):
        for col in range(3):
            if row == 1 and col == 1:
                continue
            dx, dy = col - 1, 1 - row
            count = 0
            while Position(dx * (count + 1), dy * (count + 1)) in positions:
                count += 1
            grid[row][col] = count
    return grid


def parse_ability_types(ability: str) -> tuple[str, str]:
    parsed = Piece.load_ability(ability)
    return parsed.trigger_step.condition.value, parsed.effect_step.operation.value


def parse_movement(movement: str) -> tuple[str, int]:
    parts = movement.split()
    pattern = parts[0]
    distance = int(parts[1]) if len(parts) > 1 else 0
    return pattern, distance
