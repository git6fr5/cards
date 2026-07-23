from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, WebSocket
from sqlalchemy import select
from sqlalchemy.orm import Session

from play.orm.bag import Bag
from play.orm.game import Game
from play.orm.game_player import GamePlayer
from play.orm.player import Player
from play.tools import game_is_full, replay_game
from utils.auth import AuthContext, SESSION_COOKIE_NAME, require_auth, resolve_access_token, resolve_session_token
from utils.errors import assert_preconditions


ERRORS = {
    "player_not_found":  "No player record exists for this account.",
    "bag_not_found":     "The requested bag does not exist.",
    "forbidden":         "You are not authorised to perform this action.",
    "game_not_found":    "The requested game does not exist.",
    "not_seated":        "You are not a seated player in this game.",
    "game_not_full":     "This game does not have both seats filled yet.",
    "not_your_turn":     "It is not your turn.",
    "unauthenticated":   "Valid authentication credentials were not provided.",
}


@dataclass(kw_only=True)
class PlayerAuthContext(AuthContext):
    player_id: int


@dataclass(kw_only=True)
class BagAuthContext(PlayerAuthContext):
    bag_id: int


@dataclass(kw_only=True)
class GameAuthContext(PlayerAuthContext):
    game_id: int
    seat_index: int


@dataclass(kw_only=True)
class GameActivePlayerAuthContext(GameAuthContext):
    pass


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


def _load_game_and_seat(room: UUID, player_id: int) -> tuple[int | None, int | None]:
    from utils.databases import init_engine

    with Session(init_engine()) as session:
        game = session.execute(select(Game).where(Game.room == room)).scalar_one_or_none()
        if game is None:
            return None, None
        seat = session.execute(
            select(GamePlayer).where(GamePlayer.game_id == game.id, GamePlayer.player_id == player_id)
        ).scalar_one_or_none()
        return game.id, (seat.player_index if seat is not None else None)


def require_game_access(
    room: UUID,
    auth: PlayerAuthContext = Depends(require_player_access),
) -> GameAuthContext:
    game_id, seat_index = _load_game_and_seat(room, auth.player_id)
    assert_preconditions([(game_id is None, 404, "game_not_found")], ERRORS)
    assert_preconditions([(seat_index is None, 403, "not_seated")], ERRORS)
    return GameAuthContext(**vars(auth), game_id=game_id, seat_index=seat_index)


def require_game_active_player_access(
    room: UUID,
    auth: GameAuthContext = Depends(require_game_access),
) -> GameActivePlayerAuthContext:
    from utils.databases import init_engine

    with Session(init_engine()) as session:
        assert_preconditions([(not game_is_full(session, auth.game_id), 422, "game_not_full")], ERRORS)
        game_row = session.get(Game, auth.game_id)
        engine_game, _ = replay_game(session, game_row)

    assert_preconditions([(engine_game.active_player_index != auth.seat_index, 403, "not_your_turn")], ERRORS)
    return GameActivePlayerAuthContext(**vars(auth))


def _resolve_websocket_auth(websocket: WebSocket) -> AuthContext | None:
    # WebSocket-typed sibling of require_auth's bearer-then-cookie resolution: Request and
    # WebSocket are both HTTPConnection subclasses with identical .cookies access, but FastAPI
    # injects the concrete type per route kind, so require_auth (typed for Request) can't serve a
    # websocket route directly. Delegates to the same resolve_access_token/resolve_session_token
    # resolvers require_auth uses — no parallel auth logic, only a different transport front door.
    from utils.databases import init_engine

    authorization = websocket.headers.get("authorization")
    with Session(init_engine()) as session:
        if authorization is not None:
            context = resolve_access_token(session, authorization.removeprefix("Bearer "))
            if context is not None:
                return context
        raw_session_token = websocket.cookies.get(SESSION_COOKIE_NAME)
        if raw_session_token is not None:
            return resolve_session_token(session, raw_session_token)
    return None


def require_game_access_ws(room: UUID, websocket: WebSocket) -> GameAuthContext:
    auth = _resolve_websocket_auth(websocket)
    assert_preconditions([(auth is None, 401, "unauthenticated")], ERRORS)
    player_id = _load_player_id(auth.user_id)
    assert_preconditions([(player_id is None, 404, "player_not_found")], ERRORS)
    game_id, seat_index = _load_game_and_seat(room, player_id)
    assert_preconditions([(game_id is None, 404, "game_not_found")], ERRORS)
    assert_preconditions([(seat_index is None, 403, "not_seated")], ERRORS)
    return GameAuthContext(**vars(auth), player_id=player_id, game_id=game_id, seat_index=seat_index)
