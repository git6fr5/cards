from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from play.auth import PlayerAuthContext, require_player_access
from play.orm.player import Player
from utils.auth import AuthContext, require_auth
from utils.databases import create_resource, read_resource, DatabaseConnection
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "player_not_found":      "The requested player does not exist.",
    "player_already_exists": "A player record already exists for this account.",
}


class PlayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:      int
    user_id: int


@router.post("", status_code=201, response_model=PlayerResponse)
@create_resource
def create_player(auth: AuthContext = Depends(require_auth)) -> Player:
    existing = DatabaseConnection.execute(
        select(Player).where(Player.user_id == auth.user_id)
    ).scalar_one_or_none()
    assert_preconditions([(existing is not None, 409, "player_already_exists")], ERRORS)
    return Player(user_id=auth.user_id)


@router.get("/me", response_model=PlayerResponse)
@read_resource
def read_current_player(auth: PlayerAuthContext = Depends(require_player_access)) -> PlayerResponse:
    player = DatabaseConnection.get(Player, auth.player_id)
    return PlayerResponse.model_validate(player)


@router.get("/{player_id}", response_model=PlayerResponse)
@read_resource
def read_player(player_id: int, auth: AuthContext = Depends(require_auth)) -> PlayerResponse:
    player = DatabaseConnection.get(Player, player_id)
    assert_preconditions([(player is None, 404, "player_not_found")], ERRORS)
    return PlayerResponse.model_validate(player)
