from datetime import datetime

from sqlalchemy.orm import Session

from play.orm.friend import Friend, FriendStatus
from play.orm.player import Player


def seed_friend(session: Session, players: list[Player]) -> Friend:
    friend = Friend(
        requester_player_id=players[0].id,
        recipient_player_id=players[1].id,
        status=FriendStatus.accepted,
        responded_at=datetime.utcnow(),
    )
    session.add(friend)
    session.flush()
    return friend
