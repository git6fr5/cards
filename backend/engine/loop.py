import os
import random
import re
from collections import Counter
from engine.loader import load_catalog, load_players, load_board, load_shelves
from engine.entities.player import Player
from engine.entities.board import Board
from engine.enums.archetype import Archetype
from engine.utils.positions import Position
from engine.game import Game, game, set_current_game
from engine.utils.input_parser import read_raw_input

ANSI_ESCAPE = re.compile(r"\033\[[0-9;]*m")
MANA_COLOR = "#7DD3FC"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

def colorize(text: str, hex_color: str) -> str:
    r, g, b = int(hex_color[1:3], 16), int(hex_color[3:5], 16), int(hex_color[5:7], 16)
    return f"\033[38;2;{r};{g};{b}m{text}\033[0m"

def visible_length(text: str) -> int:
    return len(ANSI_ESCAPE.sub("", text))

def pad_to_width(text: str, width: int) -> str:
    return text + " " * (width - visible_length(text))

def bag_lines(player: Player) -> list[str]:
    counts = Counter(piece.name for piece in player.bag)
    colors = {piece.name: Archetype.get_color(piece.piecetype.get("archetype")) for piece in player.bag}
    title = f"Player {player.player_id} Bag ({len(player.bag)})"
    lines = [title, "─" * len(title)]
    for name, count in sorted(counts.items()):
        lines.append(f"  {colorize(f'{name:<20}', colors[name])} x{count}")
    return lines

def print_bag(player: Player) -> None:
    for line in bag_lines(player):
        print(line)

def shelf_lines(player: Player) -> list[str]:
    title = f"Player {player.player_id} Shelf ({len(player.shelf)})"
    lines = [title, "─" * len(title)]
    for index, piece in enumerate(player.shelf):
        color = Archetype.get_color(piece.piecetype.get("archetype"))
        cost = colorize(str(piece.attributes.get("summon_cost")), MANA_COLOR)
        lines.append(f"  S{index}, {cost}  {colorize(piece.name, color)}")
    lines.append("")
    lines.append(f"Current Mana: {colorize(str(player.current_mana), MANA_COLOR)}")
    lines.append(f"Total Mana: {colorize(str(player.total_mana), MANA_COLOR)}")
    return lines

def print_shelf(player: Player) -> None:
    for line in shelf_lines(player):
        print(line)

def board_lines(board: Board, highlighted: frozenset[Position] = frozenset()) -> list[str]:
    cell_width = 6
    gutter = "   "
    top = gutter + "┌" + "┬".join("─" * cell_width for _ in range(Board.BOARD_WIDTH)) + "┐"
    mid = gutter + "├" + "┼".join("─" * cell_width for _ in range(Board.BOARD_WIDTH)) + "┤"
    bottom = gutter + "└" + "┴".join("─" * cell_width for _ in range(Board.BOARD_WIDTH)) + "┘"

    lines = ["Board", top]
    for y in range(Board.BOARD_HEIGHT - 1, -1, -1):
        cells = []
        for x in range(Board.BOARD_WIDTH):
            position = Position(x, y)
            piece = board.pieces.get(position)
            token_code = "".join(word[0] for word in piece.name.split())[:2].upper() if piece else None

            if position in highlighted:
                code = f"x{token_code}" if token_code else "x"
            else:
                code = token_code if token_code else "·"

            cell = f"{code:^{cell_width}}"
            if piece:
                cell = colorize(cell, Archetype.get_color(piece.piecetype.get("archetype")))
            cells.append(cell)
        lines.append(f"{y:>2} │" + "│".join(cells) + "│")
        if y > 0:
            lines.append(mid)
    lines.append(bottom)
    lines.append(gutter + " " + " ".join(f"{chr(ord('A') + x):^{cell_width}}" for x in range(Board.BOARD_WIDTH)))
    return lines

def print_board(board: Board, highlighted: frozenset[Position] = frozenset()) -> None:
    for line in board_lines(board, highlighted):
        print(line)

def pad_lines(lines: list[str], height: int) -> list[str]:
    top_pad = (height - len(lines)) // 2
    bottom_pad = height - len(lines) - top_pad
    return [""] * top_pad + lines + [""] * bottom_pad

def print_layout(board: Board, players: list[Player], highlighted: frozenset[Position] = frozenset()) -> None:
    left = shelf_lines(players[0])
    center = board_lines(board, highlighted)
    right = shelf_lines(players[1])

    height = max(len(left), len(center), len(right))
    left = pad_lines(left, height)
    center = pad_lines(center, height)
    right = pad_lines(right, height)

    left_width = max(visible_length(line) for line in left)
    center_width = max(visible_length(line) for line in center)

    for left_line, center_line, right_line in zip(left, center, right):
        print(f"{pad_to_width(left_line, left_width)} │ {pad_to_width(center_line, center_width)} │ {right_line}")

def start_game(seed: int | None = None, player_pieces: list[list[str]] | None = None) -> Game:
    new_game = Game(rng=random.Random(seed))
    set_current_game(new_game)

    catalog = load_catalog()
    new_game.players = load_players(catalog, player_pieces)
    if DEBUG:
        for player in new_game.players:
            print_bag(player)
    new_game.board = load_board(new_game.players)

    load_shelves(new_game.players)
    if DEBUG:
        print_layout(new_game.board, new_game.players)

    return new_game

def is_game_over() -> bool:
    for player in game.players:
        if not player.king.alive:
            return True
    return False
    
def next_turn():
    ending_player = game.active_player
    ending_player.end_turn()

    game.active_player_index = (game.active_player_index+1)%2

    if game.active_player.shelf_size < 5:
        game.active_player.draw(1)
    game.active_player.total_mana += 1
    game.active_player.current_mana = game.active_player.total_mana

if __name__ == "__main__":
    start_game()

    while not is_game_over():
        print_layout(game.board, game.players)

        current_mana = colorize(str(game.active_player.current_mana), MANA_COLOR)
        total_mana = colorize(str(game.active_player.total_mana), MANA_COLOR)
        print(f"Current Player Turn: {game.active_player_index} with Mana: {current_mana}/{total_mana}")
        player_input = input("Input Move: ")

        action, params = read_raw_input(player_input, game)
        print(f"{action.__name__}({params})" if action else "Invalid move")
        if action is not None:
            outcome = action(**params)
            if outcome is not None:
                print(outcome.outcome)