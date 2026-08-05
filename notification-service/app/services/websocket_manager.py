from fastapi import WebSocket
from typing import Dict, Set
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections for real-time notifications"""
    
    def __init__(self):
        # Maps user_id to set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a new WebSocket client"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user: {user_id}")
        
        # Send connection confirmation
        await self.send_personal_message(
            user_id,
            {
                "type": "connection",
                "message": "Connected to notification service",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a WebSocket client"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user entry if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"WebSocket disconnected for user: {user_id}")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to all connections of a specific user"""
        if user_id in self.active_connections:
            # Create a copy of connections to avoid modification during iteration
            connections = list(self.active_connections[user_id])
            
            for connection in connections:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    # Remove failed connection
                    self.disconnect(connection, user_id)
    
    async def broadcast_to_users(self, user_ids: list, message: dict):
        """Send message to multiple users"""
        for user_id in user_ids:
            await self.send_personal_message(user_id, message)
    
    async def broadcast_all(self, message: dict):
        """Broadcast message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(user_id, message)
    
    def get_connected_users(self) -> list:
        """Get list of all connected user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user is connected"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


# Global WebSocket manager instance
ws_manager = WebSocketManager()

