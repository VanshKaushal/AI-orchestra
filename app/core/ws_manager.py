import asyncio
import json
from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # We store connections grouped by a string identifier.
        # "global" for state/orchestrator-wide updates, or session_id for session-specific.
        self.active_connections: Dict[str, List[WebSocket]] = {"global": []}

    async def connect(self, websocket: WebSocket, client_id: str = "global"):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)

    def disconnect(self, websocket: WebSocket, client_id: str = "global"):
        if client_id in self.active_connections:
            try:
                self.active_connections[client_id].remove(websocket)
            except ValueError:
                pass

    async def broadcast(self, message: dict, client_id: str = "global"):
        """Broadcast a dict message to clients on a specified channel."""
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

ws_manager = ConnectionManager()
