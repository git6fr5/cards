from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Optional


class ConnectionManager:

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Opaque per-connection identity presence: connection_id → {identity: open socket count}.
        # A single identity may hold several sockets (multiple tabs/devices); it counts as present
        # while at least one remains open.
        self.identity_counts: Dict[str, Dict[str, int]] = {}
        # Per-socket identity so disconnect can decrement without the caller re-supplying it.
        self.socket_identity: Dict[WebSocket, str] = {}

    @staticmethod
    def get_websocket_connection_id(websocket_type: str, websocket_id: int):
        return f"{websocket_type}_{websocket_id}"

    async def connect(self, websocket: WebSocket, connection_id: str, identity: Optional[str] = None):
        await websocket.accept()
        self.active_connections.setdefault(connection_id, []).append(websocket)
        if identity is not None:
            self.socket_identity[websocket] = identity
            counts = self.identity_counts.setdefault(connection_id, {})
            counts[identity] = counts.get(identity, 0) + 1

    def disconnect(self, websocket: WebSocket, connection_id: str):
        if connection_id in self.active_connections:
            if websocket in self.active_connections[connection_id]:
                self.active_connections[connection_id].remove(websocket)
            if not self.active_connections[connection_id]:
                del self.active_connections[connection_id]

        identity = self.socket_identity.pop(websocket, None)
        if identity is not None and connection_id in self.identity_counts:
            counts = self.identity_counts[connection_id]
            if identity in counts:
                counts[identity] -= 1
                if counts[identity] <= 0:
                    del counts[identity]
            if not counts:
                del self.identity_counts[connection_id]

    def get_connected_identities(self, websocket_type: str, websocket_id: int) -> List[str]:
        connection_id = self.get_websocket_connection_id(websocket_type, websocket_id)
        return list(self.identity_counts.get(connection_id, {}).keys())

    async def broadcast(
        self,
        websocket_type: str,
        websocket_id: int,
        message: dict
    ):
        connection_id: str = ConnectionManager.get_websocket_connection_id(websocket_type, websocket_id)
        if connection_id in self.active_connections:
            disconnected = []

            for connection in self.active_connections[connection_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            for connection in disconnected:
                self.disconnect(connection, connection_id)


manager = ConnectionManager()


async def _broadcast_presence(websocket_type: str, websocket_id: int):
    await manager.broadcast(websocket_type, websocket_id, {
        "type": "presence",
        "connected": manager.get_connected_identities(websocket_type, websocket_id),
    })


async def connect_websocket(
    websocket: WebSocket,
    websocket_type: str,
    websocket_id: int,
    identity: Optional[str] = None,
):
    connection_id = ConnectionManager.get_websocket_connection_id(websocket_type, websocket_id)
    try:
        await manager.connect(websocket, connection_id, identity)
        if identity is not None:
            await _broadcast_presence(websocket_type, websocket_id)
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, connection_id)
    except Exception:
        manager.disconnect(websocket, connection_id)
    finally:
        if identity is not None:
            await _broadcast_presence(websocket_type, websocket_id)
