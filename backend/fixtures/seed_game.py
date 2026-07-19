from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from play.orm.bag import Bag
from play.orm.game import Game
from play.orm.game_player import GamePlayer, GamePlayerPiece
from play.orm.player import Player


SEAT_BAG_NAME = "Goblin"  # bag used to resolve each seat's pieces — must include a KingPiece for the engine to load the board


def seed_game(session: Session, players: list[Player], bags: list[Bag]) -> list[Game]:
    now = datetime.utcnow()
    seat_bag_by_player_id = {bag.player_id: bag for bag in bags if bag.name == SEAT_BAG_NAME}

    games = [
        Game(seed=1, is_game_over=True, winner_player_id=players[0].id, created_at=now - timedelta(days=2)),
        Game(seed=2, is_game_over=True, winner_player_id=players[1].id, created_at=now - timedelta(days=1)),
        Game(seed=3, is_game_over=False, created_at=now),  # active — both seats claimed, no logs, no turns made
    ]
    for game in games:
        game.players = [
            GamePlayer(
                player_index=index,
                player_id=player.id,
                resolved_pieces=[
                    GamePlayerPiece(piece_id=bag_piece.piece_id, quantity=bag_piece.quantity)
                    for bag_piece in seat_bag_by_player_id[player.id].bag_pieces
                ],
            )
            for index, player in enumerate(players)
        ]
    session.add_all(games)
    session.flush()
    return games
