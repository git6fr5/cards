import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from utils.websockets import manager
from utils.errors import assert_preconditions
from game.context import get_room, set_current_game, reset_current_game
from game.engine import process_action, save_snapshot_async, _serialize_state, initialize_room

router = APIRouter(prefix="/game", tags=["Game"])

ERRORS = {
    "room_not_found": "Game room not found.",
}


@router.websocket("/ws/{room_id}")
async def game_websocket(websocket: WebSocket, room_id: int):
    """
    Main game WebSocket. Clients send JSON action frames; server broadcasts
    the full resolved game state to all clients in the room after each action.

    Frame in:  { "type": "SUMMON"|"MOVE"|"ACTIVATE"|"END_TURN",
                  "player_id": int, "piece_id": int|null, "payload": {...} }
    Frame out: { "event": "STATE_UPDATE", "state": <GameState dict> }
               { "event": "ERROR",        "message": str }
    """
    connection_id = f"room_{room_id}"
    await manager.connect(websocket, connection_id)
    try:
        while True:
            data = await websocket.receive_json()
            state = get_room(room_id)
            if state is None:
                await websocket.send_json({
                    "event": "ERROR",
                    "message": ERRORS["room_not_found"],
                })
                continue

            token = set_current_game(state)
            try:
                new_state = process_action(data)
            except RuntimeError as e:
                await websocket.send_json({"event": "ERROR", "message": str(e)})
                continue
            finally:
                reset_current_game(token)

            await manager.broadcast("room", room_id, {
                "event": "STATE_UPDATE",
                "state": json.loads(_serialize_state(new_state)),
            })
            asyncio.create_task(save_snapshot_async(new_state))

    except WebSocketDisconnect:
        manager.disconnect(websocket, connection_id)
    except Exception as e:
        print(f"[ws] unexpected error in room {room_id}: {e}")
        manager.disconnect(websocket, connection_id)


@router.post("/room/{room_id}/start")
def start_room(room_id: int, body: dict) -> dict:
    """
    Initialise (or re-initialise) a game room with the supplied token sets.

    Body: { "player_0_tokens": [str, ...], "player_1_tokens": [str, ...] }
    Returns the full serialised GameState after setup.
    """
    assert_preconditions([(get_room(room_id) is None, 404, "room_not_found")], ERRORS)
    p0 = body.get("player_0_tokens", [])
    p1 = body.get("player_1_tokens", [])
    state = initialize_room(room_id, p0, p1)
    return json.loads(_serialize_state(state))


@router.get("/room/{room_id}/state")
def get_room_state(room_id: int) -> dict:
    """HTTP fallback — returns the current in-memory state as JSON."""
    state = get_room(room_id)
    assert_preconditions([(state is None, 404, "room_not_found")], ERRORS)
    return json.loads(_serialize_state(state))
