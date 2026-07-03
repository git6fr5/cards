from collections import Counter
from engine.loader import load_catalog, load_players, load_board, load_shelves
from engine.entities.player import Player
from engine.entities.board import Board
from engine.utils.positions import Position
from engine.game import game

def print_bag(player: Player) -> None:
    counts = Counter(piece.name for piece in player.bag)
    print(f"Player {player.player_id} bag ({len(player.bag)}):")
    for name, count in counts.items():
        print(f"  {name} x{count}")

def print_shelf(player: Player) -> None:
    print(f"Player {player.player_id} shelf ({len(player.shelf)}):")
    for piece in player.shelf:
        print(f"  {piece.name}")

def print_board(board: Board) -> None:
    cell_width = 6
    row_height = 2
    print("Board:")
    for y in range(Board.BOARD_HEIGHT - 1, -1, -1):
        cells = []
        for x in range(Board.BOARD_WIDTH):
            piece = board.pieces.get(Position(x, y))
            code = "".join(word[0] for word in piece.name.split())[:2].upper() if piece else "·"
            cells.append(f"{code:^{cell_width}}")
        for _ in range(row_height - 1):
            print("   | ")
        print(f"{y:>2} | " + "".join(cells))
    print("   +" + "-" * (cell_width * Board.BOARD_WIDTH))
    print("     " + "".join(f"{x:^{cell_width}}" for x in range(Board.BOARD_WIDTH)))

def start_game():
    catalog = load_catalog()
    game.players = load_players(catalog)
    for player in game.players:
        print_bag(player)
    game.board = load_board(game.players)
    print_board(game.board)

    load_shelves(game.players)
    for player in game.players:
        print_shelf(player)

def is_game_over() -> bool:
    for player in game.players:
        if not player.king.alive:
            return True
    return False
    
    


if __name__ == "__main__":
    start_game()

    while not is_game_over():
        player_input = input("Input Move: ")
        # game.active_player_index

        # check_game_state
        # wait for active player input
        # accept player input, update board state, turn state etc
        # hand to next player and repeat
        pass