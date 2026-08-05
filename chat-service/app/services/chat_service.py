from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
import httpx

from app.models.message import (
    MessageCreate,
    MessageInDB,
    ConversationCreate,
    ConversationInDB
)
from app.config import settings

logger = logging.getLogger(__name__)

# Customer support roles that customers can always message
CUSTOMER_SUPPORT_ROLES = ['super_admin', 'admin', 'manager', 'employee']


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
                    user_data = response.json()
                    logger.info(f"Successfully fetched user info for {user_id}: {user_data.get('email', 'N/A')}")
                    return user_data
                else:
                    logger.warning(f"Failed to fetch user info for {user_id}: HTTP {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Error fetching user info for {user_id}: {e}", exc_info=True)
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
                    email = user_info.get('email', '')
                    # Fall back to email if name is empty
                    if not name:
                        name = email or f"User {user_id[:8]}"
                    participant_details.append({
                        "user_id": user_id,
                        "name": name,
                        "email": email,
                        "role": user_info.get('role', '')
                    })
                else:
                    # If user info lookup failed, still add participant with minimal info
                    logger.warning(f"Failed to fetch user info for participant {user_id}, adding with minimal details")
                    participant_details.append({
                        "user_id": user_id,
                        "name": f"User {user_id[:8]}",  # Show partial ID as fallback
                        "email": "",
                        "role": ""
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
    
    async def refresh_participant_details(self, conversation: ConversationInDB, token: str) -> ConversationInDB:
        """Refresh participant details for a conversation"""
        try:
            updated_participant_details = []
            needs_update = False
            
            for user_id in conversation.participant_ids:
                # Check if participant details exist and have name
                existing_detail = next(
                    (p for p in conversation.participant_details if p.get("user_id") == user_id),
                    None
                )
                
                # If detail exists and has a proper name, use it
                if existing_detail and existing_detail.get("name") and existing_detail.get("name") not in ["Unknown User", f"User {user_id[:8]}"]:
                    updated_participant_details.append(existing_detail)
                    continue
                
                # Otherwise, try to fetch fresh user info
                user_info = await self.get_user_info(user_id, token)
                if user_info:
                    name = f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()
                    email = user_info.get('email', '')
                    if not name:
                        name = email or f"User {user_id[:8]}"
                    
                    updated_participant_details.append({
                        "user_id": user_id,
                        "name": name,
                        "email": email,
                        "role": user_info.get('role', '')
                    })
                    needs_update = True
                else:
                    # If fetch fails, keep existing detail or use minimal info
                    if existing_detail:
                        updated_participant_details.append(existing_detail)
                    else:
                        updated_participant_details.append({
                            "user_id": user_id,
                            "name": f"User {user_id[:8]}",
                            "email": "",
                            "role": ""
                        })
                        needs_update = True
            
            # Update conversation if participant details changed
            if needs_update:
                conversation_dict = conversation.model_dump()
                conversation_dict["participant_details"] = updated_participant_details
                conversation_dict["updated_at"] = datetime.utcnow()
                
                # Update in database
                await self.conversations_collection.update_one(
                    {"_id": ObjectId(conversation.id)},
                    {"$set": {"participant_details": updated_participant_details, "updated_at": conversation_dict["updated_at"]}}
                )
                
                # Return updated conversation
                conversation_dict["_id"] = conversation.id
                return ConversationInDB(**conversation_dict)
            
            return conversation
        except Exception as e:
            logger.error(f"Error refreshing participant details: {e}", exc_info=True)
            return conversation  # Return original conversation on error
    
    async def get_user_conversations(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
        token: Optional[str] = None
    ) -> List[ConversationInDB]:
        """Get all conversations for a user"""
        try:
            cursor = self.conversations_collection.find({
                "participant_ids": user_id
            }).sort("last_message_at", -1).skip(skip).limit(limit)
            
            conversations = []
            async for conv in cursor:
                conv["_id"] = str(conv["_id"])
                conversation = ConversationInDB(**conv)
                
                # Refresh participant details if token is provided
                if token:
                    conversation = await self.refresh_participant_details(conversation, token)
                
                conversations.append(conversation)
            
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
    
    async def get_chat_eligible_users(
        self,
        current_user_id: str,
        current_user_email: str,
        current_user_role: str,
        token: str
    ) -> List[Dict[str, Any]]:
        """Get users that the current user can message"""
        try:
            allowed_user_ids: set = set()
            
            # If customer, get users who created their orders
            if current_user_role and current_user_role.lower() == "customer":
                try:
                    # Get customer's orders from sales service
                    sales_service_url = settings.sales_service_url if hasattr(settings, 'sales_service_url') else "http://sales-service:8003"
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        # Get orders for this customer
                        orders_response = await client.get(
                            f"{sales_service_url}/api/v1/sales-orders/",
                            headers={"Authorization": f"Bearer {token}"},
                            params={"limit": 100}
                        )
                        
                        if orders_response.status_code == 200:
                            orders_data = orders_response.json()
                            orders = orders_data.get("items", [])
                            
                            # Collect user IDs from orders
                            for order in orders:
                                if order.get("sales_rep_id"):
                                    allowed_user_ids.add(order["sales_rep_id"])
                                if order.get("created_by"):
                                    allowed_user_ids.add(order["created_by"])
                            
                            logger.info(f"Found {len(allowed_user_ids)} user IDs from customer orders")
                except Exception as e:
                    logger.warning(f"Could not fetch customer orders: {e}")
                    # Continue to show customer support users
            
            # Get all users from auth service (requires admin/super_admin access)
            # Since customers can't access this directly, we'll need a different approach
            # Let's use the auth service's internal endpoint or create a special endpoint
            
            # For now, let's fetch users who can be messaged
            # This will work for customer support roles
            users_to_return = []
            
            # If customer, we need to get specific users
            if current_user_role and current_user_role.lower() == "customer":
                # Get customer support users and users from orders
                try:
                    auth_service_url = settings.auth_service_url
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        # Try to get users by role (customer support roles)
                        for role in CUSTOMER_SUPPORT_ROLES:
                            try:
                                response = await client.get(
                                    f"{auth_service_url}/api/v1/users/",
                                    headers={"Authorization": f"Bearer {token}"},
                                    params={"role": role, "limit": 100}
                                )
                                if response.status_code == 200:
                                    role_users = response.data if isinstance(response.data, list) else []
                                    for user in role_users:
                                        user_id = user.get("id") or user.get("_id")
                                        if user_id and user_id != current_user_id:
                                            users_to_return.append({
                                                "id": user_id,
                                                "email": user.get("email"),
                                                "first_name": user.get("first_name"),
                                                "last_name": user.get("last_name"),
                                                "role": user.get("role"),
                                                "department": user.get("department")
                                            })
                            except Exception as e:
                                logger.warning(f"Could not fetch users with role {role}: {e}")
                        
                        # Get users who created orders
                        for user_id in allowed_user_ids:
                            try:
                                user_response = await client.get(
                                    f"{auth_service_url}/api/v1/users/{user_id}",
                                    headers={"Authorization": f"Bearer {token}"}
                                )
                                if user_response.status_code == 200:
                                    user = user_response.json()
                                    user_id_str = user.get("id") or user.get("_id")
                                    if user_id_str and user_id_str != current_user_id:
                                        # Check if not already added
                                        if not any(u["id"] == user_id_str for u in users_to_return):
                                            users_to_return.append({
                                                "id": user_id_str,
                                                "email": user.get("email"),
                                                "first_name": user.get("first_name"),
                                                "last_name": user.get("last_name"),
                                                "role": user.get("role"),
                                                "department": user.get("department")
                                            })
                            except Exception as e:
                                logger.warning(f"Could not fetch user {user_id}: {e}")
                                
                except Exception as e:
                    logger.error(f"Error fetching chat-eligible users: {e}")
            else:
                # For non-customers, get all users
                try:
                    auth_service_url = settings.auth_service_url
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(
                            f"{auth_service_url}/api/v1/users/",
                            headers={"Authorization": f"Bearer {token}"},
                            params={"limit": 1000}
                        )
                        if response.status_code == 200:
                            all_users = response.data if isinstance(response.data, list) else []
                            for user in all_users:
                                user_id = user.get("id") or user.get("_id")
                                if user_id and user_id != current_user_id:
                                    users_to_return.append({
                                        "id": user_id,
                                        "email": user.get("email"),
                                        "first_name": user.get("first_name"),
                                        "last_name": user.get("last_name"),
                                        "role": user.get("role"),
                                        "department": user.get("department")
                                    })
                except Exception as e:
                    logger.error(f"Error fetching all users: {e}")
            
            return users_to_return
            
        except Exception as e:
            logger.error(f"Error getting chat-eligible users: {e}")
            return []

