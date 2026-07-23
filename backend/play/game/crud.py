import random
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from play.auth import GameAuthContext, PlayerAuthContext, require_game_access, require_player_access
from play.orm.bag import Bag
from play.orm.game import Game
from play.orm.game_player import GamePlayer
from play.tools import game_is_full, pack_game_state, replay_game, snapshot_bag_pieces
from utils.auth import AuthContext, require_auth
from utils.databases import DatabaseConnection, create_resource, read_resource
from utils.errors import assert_preconditions


router = APIRouter()


ERRORS = {
    "game_not_found": "No game exists for the given room.",
    "bag_not_found":  "The requested bag does not exist.",
    "forbidden":      "You are not authorised to perform this action.",
    "game_not_full":  "This game does not have both seats filled yet.",
}


class CreateGameRequest(BaseModel):
    bag_id: int


class GamePlayerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    player_index: int
    player_id: int | None


class GameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room: UUID
    is_game_over: bool
    players: list[GamePlayerResponse]


class BoardPieceResponse(BaseModel):
    name: str
    archetype: str
    owner: int
    is_building: bool


class ShelfPieceResponse(BaseModel):
    name: str | None
    archetype: str | None
    summon_cost: int | None
    hidden: bool


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


@router.post("", status_code=201, response_model=GameResponse)
@create_resource
def create_game(body: CreateGameRequest, auth: PlayerAuthContext = Depends(require_player_access)) -> Game:
    bag = DatabaseConnection.get(Bag, body.bag_id)
    assert_preconditions([(bag is None, 404, "bag_not_found")], ERRORS)
    assert_preconditions([(bag.player_id != auth.player_id, 403, "forbidden")], ERRORS)

    seed = random.randint(0, 2**31 - 1)
    game = Game(seed=seed, room=uuid4(), is_game_over=False)
    creator_index = random.choice([0, 1])
    creator_seat = GamePlayer(player_index=creator_index, player_id=auth.player_id)
    game.players = [creator_seat, GamePlayer(player_index=1 - creator_index)]

    DatabaseConnection.add(game)
    DatabaseConnection.flush()
    snapshot_bag_pieces(creator_seat.id, body.bag_id)

    return game


@router.get("/{room}", response_model=GameResponse)
@read_resource
def read_game(room: UUID, auth: AuthContext = Depends(require_auth)) -> Game:
    game = DatabaseConnection.execute(
        select(Game).options(selectinload(Game.players)).where(Game.room == room)
    ).scalar_one_or_none()
    assert_preconditions([(game is None, 404, "game_not_found")], ERRORS)
    return game


@router.get("/{room}/state", response_model=GameStateResponse)
@read_resource
def read_game_state(room: UUID, auth: GameAuthContext = Depends(require_game_access)) -> dict:
    game_row = DatabaseConnection.get(Game, auth.game_id)
    assert_preconditions([(not game_is_full(DatabaseConnection.session(), game_row.id), 422, "game_not_full")], ERRORS)

    engine_game, log = replay_game(DatabaseConnection.session(), game_row)
    return pack_game_state(engine_game, log, auth.seat_index)
