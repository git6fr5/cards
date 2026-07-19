from sqlalchemy import select
from sqlalchemy.orm import Session

from engine.entities.player import InputOutcome
from engine.game import Game as EngineGame
from engine.loop import start_game
from engine.utils.input_parser import format_square, read_raw_input
from play.orm.bag import BagPiece
from play.orm.game import Game
from play.orm.game_log import GameLog
from play.orm.game_player import GamePlayer, GamePlayerPiece
from play.orm.piece import Piece
from utils.databases import DatabaseConnection


def pack_game_state(engine_game: EngineGame, log: list[str]) -> dict:
    board = {
        format_square(position): {
            "name": piece.name,
            "archetype": piece.piecetype.get("archetype").value,
            "owner": piece.player.player_id,
            "is_building": piece.is_building,
        }
        for position, piece in engine_game.board.pieces.items()
    }

    players = [
        {
            "player_id": player.player_id,
            "current_mana": player.current_mana,
            "total_mana": player.total_mana,
            "shelf": [
                {
                    "name": piece.name,
                    "archetype": piece.piecetype.get("archetype").value,
                    "summon_cost": piece.attributes.get("summon_cost"),
                }
                for piece in player.shelf
            ],
            "bag_count": len(player.bag),
        }
        for player in engine_game.players
    ]

    return {
        "board": board,
        "players": players,
        "active_player_index": engine_game.active_player_index,
        "turn_count": engine_game.turn_count,
        "is_game_over": any(not player.king.alive for player in engine_game.players),
        "log": log,
    }


def dispatch_input(engine_game: EngineGame, raw_input: str) -> InputOutcome | None:
    action, params = read_raw_input(raw_input, engine_game)
    if action is None:
        return None

    result = action(**params)
    if result is None:
        # EOT/next_turn doesn't produce an InputOutcome — ending a turn always succeeds.
        return InputOutcome(True, "Turn ended")
    return result


def snapshot_bag_pieces(game_player_id: int, bag_id: int) -> None:
    bag_pieces = DatabaseConnection.execute(select(BagPiece).where(BagPiece.bag_id == bag_id)).scalars().all()
    for bag_piece in bag_pieces:
        DatabaseConnection.add(GamePlayerPiece(game_player_id=game_player_id, piece_id=bag_piece.piece_id, quantity=bag_piece.quantity))


def game_is_full(session: Session, game_id: int) -> bool:
    seats = session.execute(select(GamePlayer).where(GamePlayer.game_id == game_id)).scalars().all()
    return all(seat.player_id is not None for seat in seats)


def _load_seat_pieces(session: Session, game_player_id: int) -> list[str]:
    entries = session.execute(
        select(GamePlayerPiece, Piece.name)
        .join(Piece, GamePlayerPiece.piece_id == Piece.id)
        .where(GamePlayerPiece.game_player_id == game_player_id)
    ).all()
    names = []
    for entry, name in entries:
        names.extend([name] * entry.quantity)
    return names


def replay_game(session: Session, game_row: Game) -> tuple[EngineGame, list[str]]:
    seats = session.execute(
        select(GamePlayer).where(GamePlayer.game_id == game_row.id).order_by(GamePlayer.player_index)
    ).scalars().all()
    player_pieces = [_load_seat_pieces(session, seat.id) for seat in seats]

    engine_game = start_game(seed=game_row.seed, player_pieces=player_pieces)

    logs = session.execute(
        select(GameLog).where(GameLog.game_id == game_row.id).order_by(GameLog.move_number)
    ).scalars().all()

    log = [dispatch_input(engine_game, entry.input).outcome for entry in logs]

    return engine_game, log
