from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
import logging
import asyncio

from app.config import settings
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


async def verify_websocket_token(token: str) -> dict:
    """Verify WebSocket connection token"""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role", "user")
        }
    except JWTError as e:
        logger.error(f"WebSocket JWT Error: {e}")
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """WebSocket endpoint for real-time notifications"""
    
    # Verify token
    user_data = await verify_websocket_token(token)
    
    if not user_data:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    user_id = user_data["user_id"]
    
    # Connect WebSocket
    await ws_manager.connect(websocket, user_id)
    
    try:
        # Keep connection alive
        while True:
            try:
                # Wait for messages from client (heartbeat, etc.)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=settings.websocket_heartbeat_interval
                )
                
                # Handle heartbeat
                if data == "ping":
                    await websocket.send_text("pong")
                
            except asyncio.TimeoutError:
                # Send heartbeat from server
                try:
                    await websocket.send_json({"type": "heartbeat"})
                except Exception as e:
                    logger.error(f"Error sending heartbeat: {e}")
                    break
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in WebSocket loop: {e}")
                break
    
    finally:
        # Disconnect WebSocket
        ws_manager.disconnect(websocket, user_id)

