from typing import List, Dict, Optional, Tuple
import time
import logging
from app.config import settings
from app.utils.nlp_utils import extract_intent, extract_entities, classify_query_type, build_context_prompt, QueryType
from app.services.llm_provider_factory import LLMProviderFactory

logger = logging.getLogger(__name__)


class NLPService:
    """Service for NLP processing and LLM interactions"""
    
    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize NLP Service
        
        Args:
            provider: LLM provider name (openai, ollama, huggingface, fallback)
            model: Model name to use
        """
        self.provider_name = provider or settings.default_llm_provider
        self.model_name = model
        self.llm_provider = None
        
        # Create the LLM provider
        if self.provider_name != "fallback":
            self.llm_provider = LLMProviderFactory.create_provider(
                provider_name=self.provider_name,
                model=self.model_name
            )
        
        if self.llm_provider:
            logger.info(f"Initialized NLP Service with provider: {self.provider_name}, model: {self.model_name or 'default'}")
        else:
            logger.info(f"Using fallback mode (provider: {self.provider_name})")
    
    async def generate_response(
        self,
        user_query: str,
        conversation_history: List[Dict],
        user_context: Optional[Dict] = None
    ) -> Tuple[str, Dict]:
        """
        Generate AI response using OpenAI API or fallback
        
        Returns:
            Tuple of (response_text, metadata)
        """
        start_time = time.time()
        
        try:
            # Extract NLP features
            intent = extract_intent(user_query)
            entities = extract_entities(user_query)
            query_type = classify_query_type(user_query)
            
            # Get ERP context from user_context if available
            erp_context = user_context.get("erp_context", "") if user_context else ""
            rag_context = user_context.get("rag_context", "") if user_context else ""
            
            # Log context status for debugging
            if erp_context:
                logger.info(f"ERP context available: {len(erp_context)} characters. Preview: {erp_context[:200]}...")
            else:
                logger.warning(f"No ERP context available for query type: {query_type.value}")
            
            if rag_context:
                logger.info(f"RAG context available: {len(rag_context)} characters. Preview: {rag_context[:200]}...")
            
            # Build context-aware prompt (include ERP context and RAG context)
            context_prompt = build_context_prompt(user_query, query_type, entities, conversation_history, erp_context, rag_context)
            
            # Prepare messages for OpenAI
            messages = [
                {"role": "system", "content": context_prompt}
            ]
            
            # Add RAG context (knowledge base) as a separate system message if available - makes it more explicit
            if rag_context and rag_context.strip():
                logger.info(f"Including RAG context in OpenAI prompt ({len(rag_context)} chars)")
                messages.append({
                    "role": "system",
                    "content": f"""YOU HAVE KNOWLEDGE BASE INFORMATION BELOW. USE IT TO ANSWER THE USER'S QUESTION.

RULES:
- You HAVE this information - do not say you don't have access or ask the user to check documentation.
- SYNTHESIZE and REWRITE: use it as source material, not verbatim copy. Extract key points, rephrase clearly.
- STRUCTURE your response: use plain section headings (e.g. "Refund process:" or "Next steps:" on their own line), then short paragraphs. Use line breaks between sections.
- Present like a helpful summary with clear organization, not raw pasted text. No markdown (no **, ##, -).

KNOWLEDGE BASE INFORMATION:
{rag_context}

Answer the user's question using the above. Rewrite and organize the content; do not copy-paste."""
                })
            else:
                logger.info("No RAG context available - knowledge base may not have relevant information for this query")
            
            # Add ERP context as a separate system message if available - makes it more explicit
            if erp_context and erp_context.strip():
                logger.info(f"Including ERP context in OpenAI prompt ({len(erp_context)} chars)")
                messages.append({
                    "role": "system",
                    "content": f"""YOU HAVE REAL ERP DATA BELOW. USE IT TO ANSWER THE USER'S QUESTION.

RULES:
- You HAVE this data - do not say you need access or permissions.
- USE the exact numbers, metrics, and facts from the data below.
- PRESENT clearly: use short paragraphs, logical structure, and plain headings (e.g. "Summary:" or "Orders:") where helpful. No markdown (no **, ##, -).
- If the data shows zeros, say "No sales data found for this period" instead of asking for access.

ERP DATA:
{erp_context}

Answer using the data above. Keep numbers exact; organize and present them clearly."""
                })
            else:
                logger.warning(f"No ERP context available (empty: {not erp_context or not erp_context.strip()}). OpenAI will not have data to use.")
            
            # Add conversation history
            for msg in conversation_history[-settings.max_conversation_history:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            # Add current user query
            messages.append({"role": "user", "content": user_query})
            
            # Try to use LLM provider if available
            if self.llm_provider and self.llm_provider.is_available():
                try:
                    logger.info(f"Using {self.llm_provider.get_provider_name()} provider for response generation")
                    response_text, provider_metadata = await self.llm_provider.generate_response(messages)
                    
                    processing_time = (time.time() - start_time) * 1000
                    metadata = {
                        "intent": intent.value,
                        "query_type": query_type.value,
                        "entities": entities,
                        "processing_time_ms": processing_time,
                        "provider": provider_metadata.get("provider", self.provider_name),
                        "model": provider_metadata.get("model", self.model_name or "unknown"),
                        "tokens_used": provider_metadata.get("tokens_used"),
                        **provider_metadata
                    }
                    
                    return response_text, metadata
                    
                except Exception as llm_error:
                    # LLM provider failed - automatically fallback to rule-based system
                    error_msg = str(llm_error).lower()
                    provider_name = self.llm_provider.get_provider_name()
                    
                    logger.warning(f"{provider_name} provider failed: {llm_error}. Automatically using fallback system.")
                    
                    # Check if it's a missing model error and provide helpful message
                    missing_model = False
                    if provider_name == "ollama" and "not found" in error_msg:
                        missing_model = True
                        logger.info("Ollama model missing. User needs to pull the model first.")
                    
                    # Use fallback response
                    response = self._generate_fallback_response(
                        user_query, 
                        intent, 
                        query_type, 
                        erp_context, 
                        entities,
                        missing_model_info=missing_model and self.model_name or None
                    )
            else:
                # No provider available - use fallback
                logger.info("No LLM provider available, using fallback mode")
                response = self._generate_fallback_response(user_query, intent, query_type, erp_context, entities)
            
            processing_time = (time.time() - start_time) * 1000
            metadata = {
                "intent": intent.value,
                "query_type": query_type.value,
                "entities": entities,
                "processing_time_ms": processing_time,
                "provider": "fallback",
                "model": "fallback",
                "tokens_used": None
            }
            
            return response if isinstance(response, str) else "", metadata
            
        except Exception as e:
            logger.error(f"Error generating response: {e}", exc_info=True)
            processing_time = (time.time() - start_time) * 1000
            
            # Try fallback as last resort
            try:
                intent = extract_intent(user_query)
                query_type = classify_query_type(user_query)
                fallback_response = self._generate_fallback_response(user_query, intent, query_type, "", {})
                return fallback_response, {
                    "error": str(e),
                    "processing_time_ms": processing_time,
                    "model": "fallback"
                }
            except Exception:
                return (
                    "I apologize, but I encountered an error processing your request. The system is currently using fallback mode. Please try rephrasing your question.",
                    {
                        "error": str(e),
                        "processing_time_ms": processing_time
                    }
                )
    
    def _generate_fallback_response(
        self, 
        user_query: str, 
        intent, 
        query_type: QueryType, 
        erp_context: str = "",
        entities: Dict = None,
        missing_model_info: Optional[str] = None
    ) -> str:
        """Generate a fallback response when OpenAI is not available, using ERP data if available"""
        entities = entities or {}
        
        # Add model missing warning prefix if applicable
        model_warning_prefix = ""
        if missing_model_info:
            model_warning_prefix = f"⚠️ **Ollama Model Missing**: The model '{missing_model_info}' is not installed.\n\nTo fix this, pull the model:\n```bash\ndocker exec -it erp-ollama ollama pull {missing_model_info}\n```\nOr use the setup script: `./scripts/setup-ollama.sh`\n\nCurrently using fallback mode:\n\n"
        
        # Handle special intents
        intent_responses = {
            "greeting": "Hello! I'm your ERP AI assistant. I can help you with sales, inventory, finance, and HR data. How can I help you today?",
            "goodbye": "Goodbye! Have a great day!",
            "help": """I can help you with:
- Sales data and orders (revenue, orders, customers)
- Inventory and stock levels
- Financial reports
- HR and employee information

Try asking me:
- "Show me sales for last month"
- "What's my current inventory?"
- "Generate a revenue report"
- "What were my sales this month?"
- "How many orders do I have?"
- "Show me top customers"

Note: I'm currently using fallback mode (no OpenAI required). I can still provide helpful information from your ERP data. To enable more advanced AI responses, configure an OpenAI API key with available credits.
""",
        }
        
        if intent.value in intent_responses:
            return model_warning_prefix + intent_responses[intent.value]
        
        # If we have ERP data, use it to generate a more informative response
        if erp_context:
            # Format the response with actual data
            response_parts = []
            
            if query_type == QueryType.SALES or query_type == QueryType.REPORT:
                # Check if it's a report request
                query_lower = user_query.lower()
                is_report = "report" in query_lower or "dashboard" in query_lower or "summary" in query_lower
                
                if is_report:
                    response_parts.append("📊 Sales Report")
                    response_parts.append("=" * 50)
                else:
                    response_parts.append("Here's your sales information:")
                
                response_parts.append("")
                response_parts.append(erp_context.strip())
                
                # Add suggestions based on the query
                if "revenue" in query_lower or "total" in query_lower:
                    response_parts.append("\n💡 You can also ask about:")
                    response_parts.append("- Revenue breakdown by period")
                    response_parts.append("- Top customers or products")
                    response_parts.append("- Sales trends and growth")
                elif "order" in query_lower:
                    response_parts.append("\n💡 You can also ask about:")
                    response_parts.append("- Order details and status")
                    response_parts.append("- Recent orders")
                    response_parts.append("- Order history")
                elif "customer" in query_lower:
                    response_parts.append("\n💡 You can also ask about:")
                    response_parts.append("- Customer details")
                    response_parts.append("- Customer purchase history")
                    response_parts.append("- Top customers")
                elif is_report:
                    response_parts.append("\n💡 You can also ask for:")
                    response_parts.append("- Detailed sales breakdown")
                    response_parts.append("- Top products and customers")
                    response_parts.append("- Sales trends over time")
                
                return model_warning_prefix + "\n".join(response_parts)
            
            elif query_type == QueryType.INVENTORY:
                response_parts.append("Here's your inventory information:")
                response_parts.append("")
                response_parts.append(erp_context.strip())
                return model_warning_prefix + "\n".join(response_parts)
            
            elif query_type == QueryType.FINANCE:
                response_parts.append("Here's your financial information:")
                response_parts.append("")
                response_parts.append(erp_context.strip())
                return model_warning_prefix + "\n".join(response_parts)
            
            elif query_type == QueryType.HRM:
                response_parts.append("Here's your HR information:")
                response_parts.append("")
                response_parts.append(erp_context.strip())
                return model_warning_prefix + "\n".join(response_parts)
        
        # Default responses when no ERP data is available
        query_type_responses = {
            QueryType.SALES: """I can help you with sales data. Here's what I can show you:
- Total revenue and sales metrics
- Order information
- Customer data

Try asking:
- "Show me sales summary"
- "What were my sales last month?"
- "How many orders do I have?"
- "Show me top customers"

Note: I'm currently using fallback mode (no OpenAI required). I can still access and display your ERP sales data. To enable more advanced AI features, configure an OpenAI API key with available credits.""",
            QueryType.REPORT: """I can help you generate reports. Here's what I can show you:
- Sales reports and analytics
- Revenue summaries
- Order statistics
- Customer insights

Try asking:
- "Generate a sales report"
- "Show me sales summary"
- "Sales dashboard"
- "Revenue report"

Note: I'm currently using fallback mode (no OpenAI required). I can still access and display your ERP data. To enable more advanced AI features, configure an OpenAI API key with available credits.""",
            QueryType.INVENTORY: "I can help you with inventory. What would you like to know about your products or stock levels?",
            QueryType.FINANCE: "I can help you with financial data. What would you like to know about your finances or accounting?",
            QueryType.HRM: "I can help you with HR data. What would you like to know about employees or payroll?",
            QueryType.GENERAL: "I understand you're asking about something in the ERP system. Could you provide more details so I can assist you better?",
        }
        
        default_response = query_type_responses.get(query_type, "I'm here to help! Could you provide more details about what you need?")
        return model_warning_prefix + default_response

