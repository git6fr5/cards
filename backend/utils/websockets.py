from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict


class ConnectionManager:

    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    @staticmethod
    def get_websocket_connection_id(websocket_type: str, websocket_id: int):
        return f"{websocket_type}_{websocket_id}"

    async def connect(self, websocket: WebSocket, connection_id: int):
        await websocket.accept()
        if connection_id not in self.active_connections:
            self.active_connections[connection_id] = []
        self.active_connections[connection_id].append(websocket)

    def disconnect(self, websocket: WebSocket, connection_id: int):
        if connection_id in self.active_connections:
            self.active_connections[connection_id].remove(websocket)
            if not self.active_connections[connection_id]:
                del self.active_connections[connection_id]

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

async def connect_websocket(websocket: WebSocket, websocket_type: str, websocket_id: int):
    connection_id = ConnectionManager.get_websocket_connection_id(websocket_type, websocket_id)
    try:
        await manager.connect(websocket, connection_id)
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, connection_id)
    except Exception:
        manager.disconnect(websocket, connection_id)
