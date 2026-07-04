from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, select

from play.game.crud import GameStateResponse
from play.orm.game import Game
from play.orm.game_log import GameLog
from play.tools import dispatch_input, pack_game_state, replay_game
from utils.databases import DatabaseConnection, update_resource
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "game_not_found": "No game exists for the given room.",
    "unparseable_input": "Raw input could not be parsed into a game action.",
}


class CreateActionRequest(BaseModel):
    raw_input: str


class CreateActionResponse(BaseModel):
    valid: bool
    outcome: str
    state: GameStateResponse


@router.post("/{room}", response_model=CreateActionResponse)
@update_resource
def create_action(room: UUID, request: CreateActionRequest) -> CreateActionResponse:
    game_row = DatabaseConnection.execute(select(Game).where(Game.room == room)).scalar_one_or_none()
    assert_preconditions([(game_row is None, 404, "game_not_found")], ERRORS)

    engine_game = replay_game(game_row)
    outcome = dispatch_input(engine_game, request.raw_input)
    assert_preconditions([(outcome is None, 422, "unparseable_input")], ERRORS)

    move_number = DatabaseConnection.execute(
        select(func.count()).select_from(GameLog).where(GameLog.game_id == game_row.id)
    ).scalar_one() + 1

    DatabaseConnection.add(GameLog(game_id=game_row.id, move_number=move_number, input=request.raw_input))
    DatabaseConnection.flush()

    return CreateActionResponse(valid=outcome.valid, outcome=outcome.outcome, state=pack_game_state(engine_game))
