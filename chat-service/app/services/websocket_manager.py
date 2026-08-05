from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # user_id -> list of WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Connect a user's WebSocket"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user: {user_id}")
        logger.info(f"Total connections for user {user_id}: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect a user's WebSocket"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # Clean up if no more connections
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        logger.info(f"WebSocket disconnected for user: {user_id}")
    
    async def send_personal_message(self, user_id: str, message: dict):
        """Send message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            logger.info(f"📧 User {user_id} has {len(self.active_connections[user_id])} active connection(s)")
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    logger.info(f"✅ Message sent to user {user_id} successfully")
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.disconnect(conn, user_id)
        else:
            logger.warning(f"⚠️ User {user_id} is not connected - cannot send message")
    
    async def broadcast_to_conversation(self, user_ids: List[str], message: dict):
        """Broadcast message to all participants in a conversation"""
        logger.info(f"📢 Broadcasting message to {len(user_ids)} participants: {user_ids}")
        logger.info(f"📢 Message type: {message.get('type')}, action: {message.get('action')}")
        for user_id in user_ids:
            logger.info(f"📤 Sending to user: {user_id}")
            await self.send_personal_message(user_id, message)
        logger.info("✅ Broadcast complete")
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_online_users(self) -> List[str]:
        """Get list of online user IDs"""
        return list(self.active_connections.keys())


# Global WebSocket manager instance
ws_manager = ConnectionManager()

