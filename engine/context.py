from contextvars import ContextVar
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from game.models import GameState

_game_registry: dict[int, "GameState"] = {}


def get_room(room_id: int) -> Optional["GameState"]:
    return _game_registry.get(room_id)


def set_room(state: "GameState") -> None:
    _game_registry[state.room_id] = state


def init_room_0() -> "GameState":
    from game.models import GameState, PlayerState
    state = GameState(
        room_id=0,
        players={0: PlayerState(player_id=0), 1: PlayerState(player_id=1)},
    )
    _game_registry[0] = state
    return state


current_game: ContextVar[Optional["GameState"]] = ContextVar("current_game", default=None)


def set_current_game(state: "GameState") -> object:
    return current_game.set(state)


def reset_current_game(token: object) -> None:
    current_game.reset(token)  # type: ignore[arg-type]


def get_current_game() -> "GameState":
    state = current_game.get()
    if state is None:
        raise RuntimeError("current_game ContextVar is not set for this request")
    return state
