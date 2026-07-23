from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from play.orm.game import Game
from play.tools import dispatch_input, replay_game
from utils.databases import DatabaseConnection, read_resource
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "game_not_found": "No game exists for the given room.",
    "unparseable_input": "Raw input could not be parsed into a game action.",
}


class PreviewActionRequest(BaseModel):
    raw_input: str


class PreviewActionResponse(BaseModel):
    valid: bool
    outcome: str


@router.post("/{room}/preview", response_model=PreviewActionResponse)
@read_resource
def preview_action(room: UUID, request: PreviewActionRequest) -> PreviewActionResponse:
    game_row = DatabaseConnection.execute(select(Game).where(Game.room == room)).scalar_one_or_none()
    assert_preconditions([(game_row is None, 404, "game_not_found")], ERRORS)

    engine_game, _ = replay_game(DatabaseConnection.session(), game_row)
    outcome = dispatch_input(engine_game, request.raw_input)
    assert_preconditions([(outcome is None, 422, "unparseable_input")], ERRORS)

    return PreviewActionResponse(valid=outcome.valid, outcome=outcome.outcome)
