from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict
import logging

from app.models.message import MessageCreate, MessageInDB, MessageResponse, MessageRole
from app.models.conversation import ConversationCreate, ConversationInDB, ConversationResponse
from app.services.nlp_service import NLPService
from app.services.erp_data_service import ERPDataService
from app.utils.nlp_utils import classify_query_type, extract_entities
from app.services.date_extractor import extract_date_range_from_query

logger = logging.getLogger(__name__)


class ChatbotService:
    """Main service for chatbot operations"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.messages_collection = database.messages
        self.conversations_collection = database.conversations
        self.nlp_service = NLPService()
        self.erp_data_service = ERPDataService()
    
    async def create_conversation(
        self,
        user_id: str,
        conversation_data: Optional[ConversationCreate] = None
    ) -> ConversationInDB:
        """Create a new conversation"""
        try:
            now = datetime.utcnow()
            
            conv_data = conversation_data.model_dump() if conversation_data else {}
            conversation_dict = {
                "user_id": user_id,
                "title": conv_data.get("title") or "New Conversation",
                "context": conv_data.get("context", {}),
                "created_at": now,
                "updated_at": now,
                "message_count": 0,
                "last_message_at": None
            }
            
            result = await self.conversations_collection.insert_one(conversation_dict)
            conversation_dict["_id"] = str(result.inserted_id)
            
            logger.info(f"Created conversation {result.inserted_id} for user {user_id}")
            return ConversationInDB(**conversation_dict)
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise
    
    async def get_conversations(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> List[ConversationInDB]:
        """Get user's conversations"""
        try:
            cursor = self.conversations_collection.find(
                {"user_id": user_id}
            ).sort("updated_at", -1).skip(skip).limit(limit)
            
            conversations = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                conversations.append(ConversationInDB(**doc))
            
            return conversations
        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []
    
    async def get_conversation(
        self,
        conversation_id: str,
        user_id: str
    ) -> Optional[ConversationInDB]:
        """Get a specific conversation"""
        try:
            doc = await self.conversations_collection.find_one({
                "_id": ObjectId(conversation_id),
                "user_id": user_id
            })
            
            if doc:
                doc["_id"] = str(doc["_id"])
                return ConversationInDB(**doc)
            return None
        except Exception as e:
            logger.error(f"Error getting conversation: {e}")
            return None
    
    async def get_conversation_messages(
        self,
        conversation_id: str,
        limit: int = 50,
        skip: int = 0
    ) -> List[MessageInDB]:
        """Get messages for a conversation"""
        try:
            cursor = self.messages_collection.find(
                {"conversation_id": conversation_id}
            ).sort("created_at", 1).skip(skip).limit(limit)
            
            messages = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                messages.append(MessageInDB(**doc))
            
            return messages
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return []
    
    async def process_user_message(
        self,
        user_id: str,
        conversation_id: str,
        message_content: str,
        token: str,
        provider: Optional[str] = None,
        model: Optional[str] = None
    ) -> MessageInDB:
        """Process a user message and generate AI response"""
        try:
            # Verify conversation belongs to user
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                raise ValueError("Conversation not found or access denied")
            
            # Save user message
            user_message = await self._save_message(
                conversation_id=conversation_id,
                user_id=user_id,
                content=message_content,
                role=MessageRole.USER
            )
            
            # Get conversation history
            history_messages = await self.get_conversation_messages(conversation_id)
            conversation_history = [
                {
                    "role": msg.role.value,
                    "content": msg.content
                }
                for msg in history_messages[-20:]  # Last 20 messages
            ]
            
            # Fetch relevant ERP data if needed
            query_type = classify_query_type(message_content)
            erp_context = ""
            
            # Handle REPORT type - check if it's a sales report
            if query_type.value == "report":
                # Check if the query mentions sales-related terms
                query_lower = message_content.lower()
                sales_terms = ["sales", "revenue", "order", "customer", "invoice"]
                if any(term in query_lower for term in sales_terms):
                    query_type = QueryType.SALES
            
            if query_type.value in ["sales", "inventory", "finance", "hrm"]:
                try:
                    if query_type.value == "sales":
                        query_lower = message_content.lower()
                        
                        # FIRST: Check for date range extraction (e.g., "november", "last month")
                        # This must come FIRST to avoid treating month names as customer names
                        extracted_range = extract_date_range_from_query(message_content)
                        
                        # Extract entities to check for order number or customer name
                        entities = extract_entities(message_content)
                        order_numbers = entities.get("order_numbers", [])
                        customer_names = entities.get("customer_names", [])
                        
                        # Filter out month names from customer names (they should be dates, not customers)
                        month_names = ['january', 'february', 'march', 'april', 'may', 'june', 
                                      'july', 'august', 'september', 'october', 'november', 'december']
                        customer_names = [cn for cn in customer_names if cn.lower() not in month_names]
                        
                        # Check if user is asking for specific order details
                        detail_keywords = ["detail", "details", "information", "show", "tell", "what", "about", "tell me about"]
                        is_order_detail_query = any(keyword in query_lower for keyword in detail_keywords)
                        
                        # PRIORITY 1: If order number is mentioned, fetch order details
                        if order_numbers:
                            order_number = order_numbers[0]  # Use first order number found
                            logger.info(f"Order number detected: {order_number}, fetching order details")
                            order_data = await self.erp_data_service.get_order_by_number(token, order_number)
                            if order_data:
                                erp_context = await self.erp_data_service.format_order_details(order_data)
                            else:
                                erp_context = f"Order {order_number} not found."
                        
                        # PRIORITY 2: If date range was extracted (e.g., "november", "last month"), use it for sales data
                        # This MUST come before customer name check to avoid treating months as customer names
                        elif extracted_range:
                            start, end, description = extracted_range
                            logger.info(f"Date range extracted: {description} ({start} to {end}) - fetching sales data")
                            
                            # Try analytics first
                            sales_data = await self.erp_data_service.get_sales_summary(
                                token,
                                start_date=start.isoformat(),
                                end_date=end.isoformat()
                            )
                            
                            if sales_data:
                                total_revenue = sales_data.get("summary", {}).get("total_revenue", 0) or 0
                                total_orders = sales_data.get("summary", {}).get("total_orders", 0) or 0
                                
                                if total_revenue > 0 or total_orders > 0:
                                    logger.info(f"Found sales data for {description}: {total_orders} orders, ${total_revenue} revenue")
                                    erp_context = await self.erp_data_service.format_data_for_context(sales_data, "sales")
                                else:
                                    # Analytics returned zeros, try fetching actual orders
                                    logger.info(f"Analytics returned zeros for {description}, fetching actual orders")
                                    orders_data = await self.erp_data_service.get_sales_orders(
                                        token,
                                        start_date=start.isoformat(),
                                        end_date=end.isoformat(),
                                        limit=50
                                    )
                                    if orders_data and orders_data.get("items") and len(orders_data.get("items", [])) > 0:
                                        logger.info(f"Found {len(orders_data.get('items', []))} actual orders for {description}")
                                        erp_context = await self.erp_data_service.format_orders_for_context(orders_data)
                                    else:
                                        erp_context = await self.erp_data_service.format_data_for_context(sales_data, "sales")
                            else:
                                # Try fetching orders directly
                                orders_data = await self.erp_data_service.get_sales_orders(
                                    token,
                                    start_date=start.isoformat(),
                                    end_date=end.isoformat(),
                                    limit=50
                                )
                                if orders_data and orders_data.get("items") and len(orders_data.get("items", [])) > 0:
                                    logger.info(f"Found {len(orders_data.get('items', []))} orders for {description}")
                                    erp_context = await self.erp_data_service.format_orders_for_context(orders_data)
                                else:
                                    erp_context = f"No sales data found for {description}."
                        
                        # PRIORITY 3: If customer name is mentioned and asking about orders, fetch orders for that customer
                        # Only check this if we didn't extract a date range (months are dates, not customers)
                        elif customer_names and (is_order_detail_query or any(kw in query_lower for kw in ["order", "orders"])):
                            customer_name = customer_names[0]  # Use first customer name found
                            logger.info(f"Customer name detected: '{customer_name}', fetching orders")
                            orders_data = await self.erp_data_service.get_sales_orders(token, search=customer_name, limit=50)
                            if orders_data and orders_data.get("items") and len(orders_data.get("items", [])) > 0:
                                logger.info(f"Found {len(orders_data.get('items', []))} orders for customer '{customer_name}'")
                                erp_context = await self.erp_data_service.format_orders_for_context(orders_data)
                            else:
                                erp_context = f"No orders found for customer '{customer_name}'."
                        
                        # PRIORITY 4: Otherwise, proceed with normal sales data fetching (multiple date ranges as fallback)
                        else:
                            # Try to fetch sales data - try multiple date ranges
                            from datetime import date, timedelta
                            today = date.today()
                            sales_data = None
                            
                            # First, check if user specified a specific date range (e.g., "november", "last month")
                            extracted_range = extract_date_range_from_query(message_content)
                            date_ranges = []
                            
                            if extracted_range:
                                # User specified a date range - use it first
                                start, end, description = extracted_range
                                date_ranges.append((description, start, end))
                                logger.info(f"Extracted date range from query: {description} ({start} to {end})")
                            
                            # Add fallback date ranges
                            date_ranges.extend([
                                ("current month", today.replace(day=1), today),
                                ("last 90 days", today - timedelta(days=90), today),
                                ("last year", today.replace(year=today.year - 1, month=1, day=1), today),
                            ])
                            
                            for range_name, start, end in date_ranges:
                                logger.info(f"Fetching sales data for {range_name}: {start} to {end}")
                                sales_data = await self.erp_data_service.get_sales_summary(
                                    token,
                                    start_date=start.isoformat(),
                                    end_date=end.isoformat()
                                )
                                
                                if sales_data:
                                    total_revenue = sales_data.get("summary", {}).get("total_revenue", 0) or 0
                                    total_orders = sales_data.get("summary", {}).get("total_orders", 0) or 0
                                    
                                    # If we found data, use it
                                    if total_revenue > 0 or total_orders > 0:
                                        logger.info(f"Found sales data for {range_name}: {total_orders} orders, ${total_revenue} revenue")
                                        break
                                    else:
                                        logger.info(f"No data found for {range_name}, trying next range")
                            
                            # If still no data, try fetching actual orders for the requested date range
                            if not sales_data or (sales_data.get("summary", {}).get("total_revenue", 0) == 0 and sales_data.get("summary", {}).get("total_orders", 0) == 0):
                                logger.info("Analytics returned zeros - trying to fetch actual orders list")
                                # Try fetching actual orders instead of just analytics
                                try:
                                    # Use extracted date range if available for orders query
                                    if extracted_range:
                                        start, end, desc = extracted_range
                                        logger.info(f"Fetching orders for extracted date range: {desc} ({start} to {end})")
                                        orders_data = await self.erp_data_service.get_sales_orders(
                                            token, 
                                            start_date=start.isoformat(),
                                            end_date=end.isoformat(),
                                            limit=50
                                        )
                                    else:
                                        orders_data = await self.erp_data_service.get_sales_orders(token, limit=50)
                                    
                                    if orders_data and orders_data.get("items") and len(orders_data.get("items", [])) > 0:
                                        logger.info(f"Found {len(orders_data.get('items', []))} actual orders - formatting them")
                                        erp_context = await self.erp_data_service.format_orders_for_context(orders_data)
                                    else:
                                        logger.info("No orders found for date range, trying sales data without date restrictions")
                                        sales_data = await self.erp_data_service.get_sales_summary(token)
                                        if sales_data:
                                            erp_context = await self.erp_data_service.format_data_for_context(sales_data, "sales")
                                        else:
                                            erp_context = ""
                                except Exception as e:
                                    logger.warning(f"Error fetching orders list: {e}, trying analytics without dates")
                                    sales_data = await self.erp_data_service.get_sales_summary(token)
                                    if sales_data:
                                        erp_context = await self.erp_data_service.format_data_for_context(sales_data, "sales")
                                    else:
                                        erp_context = ""
                            else:
                                if sales_data:
                                    logger.info(f"Sales data fetched: {sales_data.get('summary', {})}")
                                    erp_context = await self.erp_data_service.format_data_for_context(
                                        sales_data, "sales"
                                    )
                                    logger.info(f"ERP context formatted. Length: {len(erp_context) if erp_context else 0} characters")
                                else:
                                    erp_context = ""
                            
                            if not erp_context or not erp_context.strip():
                                logger.warning("No sales data or orders found - ERP context will be empty")
                    # Add other data types as needed
                except Exception as e:
                    logger.error(f"Error fetching ERP data: {e}", exc_info=True)
                    erp_context = f"Unable to fetch sales data: {str(e)}"
            
            # Create NLP service with specified provider/model if provided
            nlp_service = self.nlp_service
            if provider or model:
                from app.services.nlp_service import NLPService
                nlp_service = NLPService(provider=provider, model=model)
            
            # Generate AI response
            user_context = {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "erp_context": erp_context
            }
            
            ai_response_text, metadata = await nlp_service.generate_response(
                user_query=message_content,
                conversation_history=conversation_history,
                user_context=user_context
            )
            
            # Save AI response
            ai_message = await self._save_message(
                conversation_id=conversation_id,
                user_id="system",  # AI assistant
                content=ai_response_text,
                role=MessageRole.ASSISTANT,
                metadata=metadata
            )
            
            # Update conversation
            await self._update_conversation(conversation_id)
            
            return ai_message
            
        except Exception as e:
            logger.error(f"Error processing user message: {e}")
            raise
    
    async def _save_message(
        self,
        conversation_id: str,
        user_id: str,
        content: str,
        role: MessageRole,
        metadata: Optional[Dict] = None
    ) -> MessageInDB:
        """Save a message to the database"""
        try:
            now = datetime.utcnow()
            
            message_dict = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "content": content,
                "role": role,
                "metadata": metadata or {},
                "created_at": now,
                "tokens_used": metadata.get("tokens_used") if metadata else None,
                "processing_time_ms": metadata.get("processing_time_ms") if metadata else None
            }
            
            result = await self.messages_collection.insert_one(message_dict)
            message_dict["_id"] = str(result.inserted_id)
            
            return MessageInDB(**message_dict)
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            raise
    
    async def _update_conversation(self, conversation_id: str):
        """Update conversation metadata"""
        try:
            now = datetime.utcnow()
            
            # Get message count
            message_count = await self.messages_collection.count_documents(
                {"conversation_id": conversation_id}
            )
            
            # Get last message time
            last_message = await self.messages_collection.find_one(
                {"conversation_id": conversation_id},
                sort=[("created_at", -1)]
            )
            
            update_data = {
                "updated_at": now,
                "message_count": message_count,
                "last_message_at": last_message.get("created_at") if last_message else None
            }
            
            # Generate title from first user message if not set
            conversation = await self.conversations_collection.find_one(
                {"_id": ObjectId(conversation_id)}
            )
            
            if conversation and (not conversation.get("title") or conversation.get("title") == "New Conversation"):
                first_user_message = await self.messages_collection.find_one(
                    {
                        "conversation_id": conversation_id,
                        "role": MessageRole.USER.value
                    },
                    sort=[("created_at", 1)]
                )
                
                if first_user_message:
                    title = first_user_message.get("content", "New Conversation")[:50]
                    update_data["title"] = title
            
            await self.conversations_collection.update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": update_data}
            )
        except Exception as e:
            logger.error(f"Error updating conversation: {e}")
    
    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete a conversation and all its messages"""
        try:
            # Verify ownership
            conversation = await self.get_conversation(conversation_id, user_id)
            if not conversation:
                return False
            
            # Delete messages
            await self.messages_collection.delete_many({"conversation_id": conversation_id})
            
            # Delete conversation
            await self.conversations_collection.delete_one({"_id": ObjectId(conversation_id)})
            
            logger.info(f"Deleted conversation {conversation_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False

