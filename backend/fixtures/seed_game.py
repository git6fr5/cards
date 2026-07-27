import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from play.orm.bag import Bag
from play.orm.game import Game
from play.orm.game_player import GamePlayer, GamePlayerPiece
from play.orm.player import Player


SEAT_BAG_RANDOM_SEED = 0  # fixed seed — deterministic across seeding runs, still random per default bag


def seed_game(session: Session, players: list[Player], bags: list[Bag]) -> list[Game]:
    now = datetime.utcnow()
    bags_by_player_id: dict[int, list[Bag]] = {}
    for bag in bags:
        bags_by_player_id.setdefault(bag.player_id, []).append(bag)
    rng = random.Random(SEAT_BAG_RANDOM_SEED)
    # every default bag must include a King for the engine to load the board — true for all current ones
    seat_bag_by_player_id = {
        player_id: rng.choice(player_bags)
        for player_id, player_bags in bags_by_player_id.items()
    }

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
