from collections import Counter

from sqlalchemy.orm import Session

from engine.loader import load_default_bag
from play.orm.bag import Bag, BagPiece
from play.orm.piece import Piece
from play.orm.player import Player


DEFAULT_BAG_NAMES = ["goblin", "dragon", "warlock"]


def seed_bag(session: Session, players: list[Player], pieces: list[Piece]) -> list[Bag]:
    piece_by_name = {piece.name: piece for piece in pieces}
    bags = []
    for player in players:
        for bag_name in DEFAULT_BAG_NAMES:
            bag = Bag(name=bag_name.capitalize(), player_id=player.id)
            counts = Counter(load_default_bag(bag_name))
            bag.bag_pieces = [
                BagPiece(piece_id=piece_by_name[name].id, quantity=quantity)
                for name, quantity in counts.items()
            ]
            bags.append(bag)
    session.add_all(bags)
    session.flush()
    return bags
