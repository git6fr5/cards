from sqlalchemy.orm import Session

from accounts.orm.user import User
from play.orm.player import Player


def seed_player(session: Session, users: list[User]) -> list[Player]:
    players = [Player(user_id=user.id) for user in users]
    session.add_all(players)
    session.flush()
    return players
