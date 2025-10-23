from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
import httpx

from app.models.message import (
    MessageCreate,
    MessageInDB,
    MessageResponse,
    ConversationCreate,
    ConversationInDB,
    ConversationResponse,
    MessageType
)
from app.config import settings

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing chat messages and conversations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.messages_collection = database.messages
        self.conversations_collection = database.conversations
    
    async def get_user_info(self, user_id: str, token: str) -> Optional[Dict]:
        """Get user information from auth service"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{settings.auth_service_url}/api/v1/users/{user_id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Error fetching user info: {e}")
        return None
    
    async def create_conversation(
        self,
        conversation_data: ConversationCreate,
        creator_id: str,
        token: str
    ) -> ConversationInDB:
        """Create a new conversation"""
        try:
            now = datetime.utcnow()
            
            # Check if conversation between these users already exists (for direct messages)
            if not conversation_data.is_group and len(conversation_data.participant_ids) == 2:
                existing = await self.conversations_collection.find_one({
                    "is_group": False,
                    "participant_ids": {"$all": conversation_data.participant_ids}
                })
                if existing:
                    existing["_id"] = str(existing["_id"])
                    return ConversationInDB(**existing)
            
            # Get participant details
            participant_details = []
            for user_id in conversation_data.participant_ids:
                user_info = await self.get_user_info(user_id, token)
                if user_info:
                    name = f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()
                    # Fall back to email if name is empty
                    if not name:
                        name = user_info.get('email', 'Unknown User')
                    participant_details.append({
                        "user_id": user_id,
                        "name": name,
                        "email": user_info.get('email', ''),
                        "role": user_info.get('role', '')
                    })
            
            conversation_dict = conversation_data.model_dump()
            conversation_dict.update({
                "created_by": creator_id,
                "participant_details": participant_details,
                "created_at": now,
                "updated_at": now,
                "last_message": None,
                "last_message_at": None,
                "unread_count": {user_id: 0 for user_id in conversation_data.participant_ids}
            })
            
            result = await self.conversations_collection.insert_one(conversation_dict)
            conversation_dict["_id"] = str(result.inserted_id)
            
            logger.info(f"Created conversation: {result.inserted_id}")
            
            return ConversationInDB(**conversation_dict)
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise
    
    async def get_user_conversations(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[ConversationInDB]:
        """Get all conversations for a user"""
        try:
            cursor = self.conversations_collection.find({
                "participant_ids": user_id
            }).sort("last_message_at", -1).skip(skip).limit(limit)
            
            conversations = []
            async for conv in cursor:
                conv["_id"] = str(conv["_id"])
                conversations.append(ConversationInDB(**conv))
            
            return conversations
        except Exception as e:
            logger.error(f"Error getting user conversations: {e}")
            return []
    
    async def get_conversation(self, conversation_id: str) -> Optional[ConversationInDB]:
        """Get a conversation by ID"""
        try:
            conversation = await self.conversations_collection.find_one({"_id": ObjectId(conversation_id)})
            if conversation:
                conversation["_id"] = str(conversation["_id"])
                return ConversationInDB(**conversation)
            return None
        except Exception as e:
            logger.error(f"Error getting conversation: {e}")
            return None
    
    async def send_message(
        self,
        message_data: MessageCreate,
        token: str
    ) -> MessageInDB:
        """Send a message in a conversation"""
        try:
            now = datetime.utcnow()
            
            # Get sender info
            sender_info = await self.get_user_info(message_data.sender_id, token)
            sender_name = "Unknown"
            sender_email = ""
            if sender_info:
                sender_name = f"{sender_info.get('first_name', '')} {sender_info.get('last_name', '')}".strip()
                sender_email = sender_info.get('email', '')
                # Fall back to email if name is empty
                if not sender_name:
                    sender_name = sender_email or "Unknown"
            
            message_dict = message_data.model_dump()
            message_dict.update({
                "sender_name": sender_name,
                "sender_email": sender_email,
                "is_read": False,
                "is_edited": False,
                "is_deleted": False,
                "read_by": [message_data.sender_id],  # Sender has "read" their own message
                "created_at": now,
                "updated_at": now
            })
            
            result = await self.messages_collection.insert_one(message_dict)
            message_dict["_id"] = str(result.inserted_id)
            
            # Update conversation's last message
            await self.conversations_collection.update_one(
                {"_id": ObjectId(message_data.conversation_id)},
                {
                    "$set": {
                        "last_message": {
                            "content": message_data.content,
                            "sender_id": message_data.sender_id,
                            "sender_name": sender_name,
                            "created_at": now
                        },
                        "last_message_at": now,
                        "updated_at": now
                    },
                    "$inc": {
                        # Increment unread count for all participants except sender
                        f"unread_count.{participant_id}": 1
                        for participant_id in await self._get_conversation_participants(message_data.conversation_id)
                        if participant_id != message_data.sender_id
                    }
                }
            )
            
            logger.info(f"Message sent: {result.inserted_id} in conversation {message_data.conversation_id}")
            
            return MessageInDB(**message_dict)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise
    
    async def get_conversation_messages(
        self,
        conversation_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[MessageInDB]:
        """Get messages in a conversation"""
        try:
            cursor = self.messages_collection.find({
                "conversation_id": conversation_id,
                "is_deleted": False
            }).sort("created_at", 1).skip(skip).limit(limit)
            
            messages = []
            async for msg in cursor:
                msg["_id"] = str(msg["_id"])
                messages.append(MessageInDB(**msg))
            
            return messages
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return []
    
    async def mark_messages_as_read(
        self,
        conversation_id: str,
        user_id: str
    ) -> int:
        """Mark all messages in a conversation as read for a user"""
        try:
            result = await self.messages_collection.update_many(
                {
                    "conversation_id": conversation_id,
                    "sender_id": {"$ne": user_id},  # Don't update own messages
                    "read_by": {"$ne": user_id}  # Only if not already read
                },
                {
                    "$addToSet": {"read_by": user_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            # Reset unread count for this user in conversation
            await self.conversations_collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {f"unread_count.{user_id}": 0}}
            )
            
            return result.modified_count
        except Exception as e:
            logger.error(f"Error marking messages as read: {e}")
            return 0
    
    async def delete_message(self, message_id: str, user_id: str) -> bool:
        """Soft delete a message (only if sender)"""
        try:
            result = await self.messages_collection.update_one(
                {
                    "_id": ObjectId(message_id),
                    "sender_id": user_id  # Only sender can delete
                },
                {
                    "$set": {
                        "is_deleted": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error deleting message: {e}")
            return False
    
    async def _get_conversation_participants(self, conversation_id: str) -> List[str]:
        """Get participant IDs for a conversation"""
        try:
            conversation = await self.conversations_collection.find_one(
                {"_id": ObjectId(conversation_id)},
                {"participant_ids": 1}
            )
            return conversation.get("participant_ids", []) if conversation else []
        except Exception as e:
            logger.error(f"Error getting participants: {e}")
            return []
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get total unread message count for a user across all conversations"""
        try:
            conversations = await self.conversations_collection.find({
                "participant_ids": user_id
            }).to_list(length=1000)
            
            total_unread = sum(
                conv.get("unread_count", {}).get(user_id, 0)
                for conv in conversations
            )
            
            return total_unread
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return 0

