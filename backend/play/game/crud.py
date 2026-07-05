import random
from uuid import UUID, uuid4

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from play.orm.game import Game
from play.orm.game_player import GamePlayer
from play.tools import pack_game_state, replay_game
from utils.databases import DatabaseConnection, create_resource, read_resource, update_resource
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "game_not_found": "No game exists for the given room.",
}


class GamePlayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    player_index: int
    player_user_id: int | None


class GameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    room: UUID
    is_completed: bool
    players: list[GamePlayerResponse]


class UpdateGameCompletedRequest(BaseModel):
    completed: bool


class BoardPieceResponse(BaseModel):
    name: str
    archetype: str
    owner: int
    is_building: bool


class ShelfPieceResponse(BaseModel):
    name: str
    archetype: str
    summon_cost: int


class GameStatePlayerResponse(BaseModel):
    player_id: int
    current_mana: int
    total_mana: int
    shelf: list[ShelfPieceResponse]
    bag_count: int


class GameStateResponse(BaseModel):
    board: dict[str, BoardPieceResponse]
    players: list[GameStatePlayerResponse]
    active_player_index: int
    turn_count: int
    is_game_over: bool
    log: list[str]


@router.post("/", response_model=GameResponse)
@create_resource
def create_game() -> Game:
    seed = random.randint(0, 2**31 - 1)
    game = Game(seed=seed, room=uuid4(), is_completed=False)
    game.players = [GamePlayer(player_index=0), GamePlayer(player_index=1)]
    return game


@router.get("/{room}/state", response_model=GameStateResponse)
@read_resource
def read_game_state(room: UUID) -> dict:
    game_row = DatabaseConnection.execute(select(Game).where(Game.room == room)).scalar_one_or_none()
    assert_preconditions([(game_row is None, 404, "game_not_found")], ERRORS)

    engine_game, log = replay_game(game_row)
    return pack_game_state(engine_game, log)


@router.put("/{room}/completed", response_model=GameResponse)
@update_resource
def update_game_completed(room: UUID, request: UpdateGameCompletedRequest) -> Game:
    game = DatabaseConnection.execute(select(Game).where(Game.room == room)).scalar_one_or_none()
    assert_preconditions([(game is None, 404, "game_not_found")], ERRORS)

    game.is_completed = request.completed
    return game
