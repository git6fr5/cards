from uuid import UUID

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from engine.game import Game as EngineGame
from play.auth import GameAuthContext, require_game_access_ws
from play.tools import pack_game_state
from utils.websockets import manager


router = APIRouter()

_seat_by_socket: dict[WebSocket, int] = {}


def _connection_id(room: UUID) -> str:
    return manager.get_websocket_connection_id("game", str(room))


async def push_state(room: UUID, engine_game: EngineGame, log: list[str]) -> None:
    connection_id = _connection_id(room)
    for websocket in manager.active_connections.get(connection_id, []):
        seat_index = _seat_by_socket.get(websocket)
        if seat_index is None:
            continue
        state = pack_game_state(engine_game, log, seat_index)
        await websocket.send_json({"event": "STATE_UPDATE", "state": state})


@router.websocket("/{room}/ws")
async def game_websocket(
    room: UUID,
    websocket: WebSocket,
    access: GameAuthContext = Depends(require_game_access_ws),
) -> None:
    connection_id = _connection_id(room)
    await manager.connect(websocket, connection_id)
    _seat_by_socket[websocket] = access.seat_index
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, connection_id)
        _seat_by_socket.pop(websocket, None)
