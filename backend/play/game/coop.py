import random
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from play.auth import PlayerAuthContext, require_player_access
from play.game.crud import GameResponse
from play.orm.bag import Bag
from play.orm.game import Game
from play.orm.game_player import GamePlayer
from play.tools import snapshot_bag_pieces
from utils.databases import DatabaseConnection, create_resource
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "bag_not_found": "The requested bag does not exist.",
    "forbidden":      "You are not authorised to perform this action.",
}


class CreateCoopGameRequest(BaseModel):
    bag_id_seat_0: int
    bag_id_seat_1: int


@router.post("/coop", status_code=201, response_model=GameResponse)
@create_resource
def create_game_coop(body: CreateCoopGameRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> Game:
    bag_seat_0 = DatabaseConnection.get(Bag, body.bag_id_seat_0)
    bag_seat_1 = DatabaseConnection.get(Bag, body.bag_id_seat_1)
    assert_preconditions([(bag_seat_0 is None, 404, "bag_not_found"), (bag_seat_1 is None, 404, "bag_not_found")], ERRORS)
    assert_preconditions([
        (bag_seat_0.player_id != auth.player_id, 403, "forbidden"),
        (bag_seat_1.player_id != auth.player_id, 403, "forbidden"),
    ], ERRORS)

    seed = random.randint(0, 2**31 - 1)
    game = Game(seed=seed, room=uuid4(), is_game_over=False)
    seat_0 = GamePlayer(seat_index=0, player_id=auth.player_id)
    seat_1 = GamePlayer(seat_index=1, player_id=auth.player_id)
    game.players = [seat_0, seat_1]

    DatabaseConnection.add(game)
    DatabaseConnection.flush()
    snapshot_bag_pieces(seat_0.id, body.bag_id_seat_0)
    snapshot_bag_pieces(seat_1.id, body.bag_id_seat_1)

    return game
