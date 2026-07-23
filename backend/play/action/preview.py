from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from play.auth import GameAuthContext, require_game_access
from play.orm.game import Game
from play.tools import dispatch_input, replay_game
from utils.databases import DatabaseConnection, read_resource
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "unparseable_input": "Raw input could not be parsed into a game action.",
}


class PreviewActionRequest(BaseModel):
    raw_input: str


class PreviewActionResponse(BaseModel):
    valid: bool
    outcome: str


@router.post("/{room}/preview", response_model=PreviewActionResponse)
@read_resource
def preview_action(
    room: UUID,
    request: PreviewActionRequest,
    auth: GameAuthContext = Depends(require_game_access),
) -> PreviewActionResponse:
    game_row = DatabaseConnection.get(Game, auth.game_id)

    engine_game, _ = replay_game(DatabaseConnection.session(), game_row)
    outcome = dispatch_input(engine_game, request.raw_input, auth.seat_index)
    assert_preconditions([(outcome is None, 422, "unparseable_input")], ERRORS)

    return PreviewActionResponse(valid=outcome.valid, outcome=outcome.outcome)
