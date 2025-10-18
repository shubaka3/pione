from fastapi import WebSocket
from typing import Dict, Set
from enum import Enum

class ConnectionType(Enum):
    CAMERA = "camera"
    VIEWER = "viewer"

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[ConnectionType, Set[WebSocket]] = {
            ConnectionType.CAMERA: set(),
            ConnectionType.VIEWER: set()
        }
    
    async def connect(self, websocket: WebSocket, connection_type: ConnectionType):
        await websocket.accept()
        self.active_connections[connection_type].add(websocket)
    
    def disconnect(self, websocket: WebSocket, connection_type: ConnectionType):
        self.active_connections[connection_type].remove(websocket)
    
    async def broadcast_to_viewers(self, message: str):
        for connection in self.active_connections[ConnectionType.VIEWER]:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle failed connections later
                pass
    
    async def broadcast_to_viewers_bytes(self, message: bytes):
        for connection in self.active_connections[ConnectionType.VIEWER]:
            try:
                await connection.send_bytes(message)
            except Exception:
                # Handle failed connections later
                pass
    
    def get_viewers_count(self) -> int:
        return len(self.active_connections[ConnectionType.VIEWER])
    
    def get_cameras_count(self) -> int:
        return len(self.active_connections[ConnectionType.CAMERA])