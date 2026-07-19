from dataclasses import dataclass

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from play.orm.bag import Bag
from play.orm.player import Player
from utils.auth import AuthContext, require_auth
from utils.errors import assert_preconditions


ERRORS = {
    "player_not_found": "No player record exists for this account.",
    "bag_not_found":    "The requested bag does not exist.",
    "forbidden":        "You are not authorised to perform this action.",
}


@dataclass(kw_only=True)
class PlayerAuthContext(AuthContext):
    player_id: int


@dataclass(kw_only=True)
class BagAuthContext(PlayerAuthContext):
    bag_id: int


def _load_player_id(user_id: int) -> int | None:
    from utils.databases import init_engine

    with Session(init_engine()) as session:
        player = session.execute(select(Player).where(Player.user_id == user_id)).scalar_one_or_none()
        return player.id if player is not None else None


def require_player_access(auth: AuthContext = Depends(require_auth)) -> PlayerAuthContext:
    player_id = _load_player_id(auth.user_id)
    assert_preconditions([(player_id is None, 404, "player_not_found")], ERRORS)
    return PlayerAuthContext(**vars(auth), player_id=player_id)


def _load_bag_player_id(bag_id: int) -> int | None:
    from utils.databases import init_engine

    with Session(init_engine()) as session:
        bag = session.get(Bag, bag_id)
        return bag.player_id if bag is not None else None


def require_bag_access(
    bag_id: int,
    auth: PlayerAuthContext = Depends(require_player_access),
) -> BagAuthContext:
    bag_player_id = _load_bag_player_id(bag_id)
    assert_preconditions([(bag_player_id is None, 404, "bag_not_found")], ERRORS)
    assert_preconditions([(bag_player_id != auth.player_id, 403, "forbidden")], ERRORS)
    return BagAuthContext(**vars(auth), bag_id=bag_id)
