import re
from typing import Callable

from engine.game import Game
from engine.utils.positions import Position


SQUARE_PATTERN = re.compile(r"^([A-Z])(\d+)$")
SHELF_PATTERN = re.compile(r"^S(\d+)$")


def parse_square(token: str) -> Position:
    match = SQUARE_PATTERN.match(token)
    if not match:
        raise ValueError(f"Unparseable square: {token}")

    letter, digits = match.groups()
    return Position(ord(letter) - ord("A"), int(digits))


def format_square(position: Position) -> str:
    return f"{chr(ord('A') + position.x)}{position.y}"


def read_raw_input(raw_input: str, game: Game) -> tuple[Callable | None, dict | None]:
    text = raw_input.strip().upper()
    player = game.players[game.active_player_index]

    if text == "EOT":
        # Deferred import — engine.loop imports read_raw_input from this module,
        # so importing next_turn at module level here would be circular.
        from engine.loop import next_turn
        return next_turn, {}

    if text.endswith("!"):
        try:
            origin = parse_square(text[:-1].strip())
        except ValueError:
            return None, None
        return player.show, {"origin": origin}

    if text.endswith("#"):
        source_token = text[:-1].strip()

        if shelf_match := SHELF_PATTERN.match(source_token):
            return player.read, {"shelf_index": int(shelf_match.group(1))}

        try:
            origin = parse_square(source_token)
        except ValueError:
            return None, None
        return player.read, {"origin": origin}

    tokens = text.split("@")
    if len(tokens) != 2:
        return None, None

    source_token, target_token = (token.strip() for token in tokens)

    try:
        target = parse_square(target_token)

        if shelf_match := SHELF_PATTERN.match(source_token):
            return player.summon, {"shelf_index": int(shelf_match.group(1)), "position": target}

        origin = parse_square(source_token)
    except ValueError:
        return None, None

    return player.act, {"origin": origin, "target": target}
