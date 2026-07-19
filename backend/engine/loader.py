import json
from pathlib import Path
from engine.entities.piece import Piece, KingPiece
from engine.entities.board import Board
from engine.entities.player import Player
from engine.utils.positions import Position

DATA_DIR = Path(__file__).parent / ".data"
CATALOG_DIR = DATA_DIR / "catalog"
DEFAULT_BAGS_DIR = DATA_DIR / "default_bags"

KING_START = {
    0: Position(3, 0),
    1: Position(3, 6),
}


def load_catalog() -> dict[str, dict]:
    catalog: dict[str, dict] = {}
    for path in sorted(CATALOG_DIR.glob("**/*.json")):
        data = json.loads(path.read_text())
        catalog[data["name"]] = data

    return catalog


def load_default_bag(bag_name: str) -> list[str]:
    path = DEFAULT_BAGS_DIR / f"{bag_name}.txt"
    return [name.strip() for name in path.read_text().splitlines() if name.strip()]


def load_players(catalog: dict[str, dict], player_pieces: list[list[str]] | None = None) -> list[Player]:
    if player_pieces is None:
        # CLI/debug entrypoint only — the DB-backed web flow always supplies each seat's
        # resolved Bag snapshot explicitly.
        player_pieces = [load_default_bag("goblin"), load_default_bag("dragon")]

    def build_bag(names: list[str], player: Player) -> list[Piece]:
        return [Piece.create(catalog[name], player) for name in names]

    player_0 = Player(player_id=0)
    player_0.bag = build_bag(player_pieces[0], player_0)
    player_0.total_mana = 1
    player_0.current_mana = player_0.total_mana

    player_1 = Player(player_id=1)
    player_1.bag = build_bag(player_pieces[1], player_1)
    player_1.total_mana = 0
    player_1.current_mana = player_1.total_mana

    return [player_0, player_1]


def load_board(players: list[Player]) -> Board:
    board = Board()
    for player in players:
        king = next(piece for piece in player.bag if isinstance(piece, KingPiece))
        player.bag.remove(king)
        player.king = king
        board.pieces[KING_START[player.player_id]] = king
    return board


def load_shelves(players: list[Player]) -> None:
    for player in players:
        player.draw(3)
