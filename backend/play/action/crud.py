from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select

from play.auth import GameActivePlayerAuthContext, require_game_active_player_access
from play.game.crud import GameStateResponse
from play.game.socket import push_state
from play.orm.game import Game
from play.orm.game_log import GameLog
from play.tools import dispatch_input, pack_game_state, replay_game
from utils.databases import DatabaseConnection, update_resource_async
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "unparseable_input": "Raw input could not be parsed into a game action.",
}


class CreateActionRequest(BaseModel):
    raw_input: str


class CreateActionResponse(BaseModel):
    valid: bool
    outcome: str
    state: GameStateResponse


@router.post("/{room}", response_model=CreateActionResponse)
@update_resource_async
async def create_action(
    room: UUID,
    request: CreateActionRequest,
    auth: GameActivePlayerAuthContext = Depends(require_game_active_player_access),
) -> CreateActionResponse:
    game_row = DatabaseConnection.get(Game, auth.game_id)

    engine_game, log = replay_game(DatabaseConnection.session(), game_row)
    outcome = dispatch_input(engine_game, request.raw_input)
    assert_preconditions([(outcome is None, 422, "unparseable_input")], ERRORS)
    log.append(outcome.outcome)

    move_number = DatabaseConnection.execute(
        select(func.count()).select_from(GameLog).where(GameLog.game_id == game_row.id)
    ).scalar_one() + 1

    DatabaseConnection.add(GameLog(game_id=game_row.id, move_number=move_number, input=request.raw_input))
    DatabaseConnection.flush()

    state = pack_game_state(engine_game, log, auth.seat_index)
    if state["is_game_over"] and not game_row.is_game_over:
        game_row.is_game_over = True
        winning_index = next(index for index, player in enumerate(engine_game.players) if player.king.alive)
        winning_seat = next(seat for seat in game_row.players if seat.player_index == winning_index)
        game_row.winner_player_id = winning_seat.player_id

    await push_state(room, engine_game, log)

    return CreateActionResponse(valid=outcome.valid, outcome=outcome.outcome, state=state)
