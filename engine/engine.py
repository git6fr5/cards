import json
from pathlib import Path
from engine.entities.pieces.piece import Piece
# , Player, Board, Room

DATA_DIR = Path(__file__).parent / "data"

def is_game_over():
    # if a player does not have a king
    pass

def start_game():
    load_pieces()
    # load_room()
    # load_players()
    # load_board()
    
    while not is_game_over():
        # check_game_state
        # wait for active player input
        # accept player input, update board state, turn state etc
        # hand to next player and repeat
        pass


def load_pieces() -> list[dict]:
    pieces: list[Piece] = []
    for path in sorted(DATA_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        for x in data:
            pieces.append(Piece.create(x))
    
    return pieces