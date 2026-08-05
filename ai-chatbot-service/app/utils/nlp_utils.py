import re
from typing import Dict, List
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class QueryType(str, Enum):
    SALES = "sales"
    INVENTORY = "inventory"
    FINANCE = "finance"
    HRM = "hrm"
    GENERAL = "general"
    CALCULATION = "calculation"
    REPORT = "report"


class Intent(str, Enum):
    QUERY = "query"
    COMMAND = "command"
    QUESTION = "question"
    GREETING = "greeting"
    GOODBYE = "goodbye"
    HELP = "help"


def extract_intent(text: str) -> Intent:
    """Extract user intent from text using pattern matching"""
    text_lower = text.lower().strip()
    
    # Greeting patterns
    greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"]
    if any(greeting in text_lower for greeting in greetings):
        return Intent.GREETING
    
    # Goodbye patterns
    goodbyes = ["bye", "goodbye", "see you", "farewell", "exit", "quit"]
    if any(goodbye in text_lower for goodbye in goodbyes):
        return Intent.GOODBYE
    
    # Help patterns
    help_patterns = ["help", "what can you do", "how can you help", "commands", "features"]
    if any(pattern in text_lower for pattern in help_patterns):
        return Intent.HELP
    
    # Command patterns (imperative verbs)
    command_patterns = ["show", "list", "get", "create", "add", "update", "delete", "generate", "send"]
    if any(text_lower.startswith(pattern) for pattern in command_patterns):
        return Intent.COMMAND
    
    # Question patterns
    question_words = ["what", "when", "where", "who", "why", "how", "which", "can", "could", "would"]
    if any(text_lower.startswith(word) for word in question_words) or "?" in text:
        return Intent.QUESTION
    
    return Intent.QUERY


def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extract entities from text (dates, numbers, keywords)"""
    entities = {
        "dates": [],
        "numbers": [],
        "keywords": []
    }
    
    # Extract dates (basic patterns)
    date_patterns = [
        r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
        r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY
        r'(today|yesterday|tomorrow|last week|next week|last month|next month|this month|this year)',
        r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}',
        r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\b'  # Month name alone
    ]
    
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        entities["dates"].extend(matches)
    
    # Extract order numbers (e.g., SO-00001, ORDER-123, SO12345)
    order_patterns = [
        r'\bSO-\d+\b',  # SO-00001, SO-12345
        r'\bORDER-?\d+\b',  # ORDER-123, ORDER123
        r'\bSO\d+\b',  # SO00001, SO12345
    ]
    order_numbers = []
    for pattern in order_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        order_numbers.extend(matches)
    entities["order_numbers"] = order_numbers if order_numbers else []
    
    # Extract numbers
    number_pattern = r'\b\d+(?:\.\d+)?\b'
    numbers = re.findall(number_pattern, text)
    entities["numbers"] = numbers
    
    # Extract customer names (improved patterns)
    customer_patterns = [
        r'(?:customer|for|by|does)\s+([A-Za-z][A-Za-z\s]{1,}?)(?:\s+order|\s+orders|\.|,|\?|$|has|have)',  # "customer John Doe", "for test test", "does test test have"
        r'([A-Za-z][A-Za-z\s]{2,}?)(?:\'s\s+orders?)',  # "John Doe's orders"
        r'(?:show|tell|what|which).*?(?:order|orders).*?(?:for|by|customer)\s+([A-Za-z][A-Za-z\s]{1,}?)(?:\?|\.|,|$)',  # "show orders for test test"
    ]
    customer_names = []
    for pattern in customer_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            name = match.strip() if isinstance(match, str) else match[0].strip() if match else ""
            # Clean up common words that might be captured
            name = re.sub(r'\b(order|orders|detail|details|information)\b', '', name, flags=re.IGNORECASE).strip()
            if name and len(name) > 1 and name.lower() not in ['for', 'by', 'the', 'a', 'an']:
                customer_names.append(name)
    
    # Also try to extract quoted names or names after common phrases
    quoted_pattern = r'["\']([^"\']+)["\']'
    quoted_matches = re.findall(quoted_pattern, text)
    customer_names.extend([m.strip() for m in quoted_matches if len(m.strip()) > 1])
    
    # Remove duplicates and filter out common stop words
    stop_words = {'order', 'orders', 'detail', 'details', 'information', 'show', 'tell', 'what', 'which', 'for', 'by', 'customer'}
    customer_names = list(set([n for n in customer_names if n.lower() not in stop_words and len(n) > 1]))
    entities["customer_names"] = customer_names if customer_names else []
    
    # Extract important keywords (domain-specific)
    keywords = []
    domain_terms = [
        "sales", "order", "invoice", "customer", "product", "inventory", "stock",
        "revenue", "profit", "expense", "payment", "employee", "payroll", "attendance",
        "details", "information", "show", "tell", "find"
    ]
    
    for term in domain_terms:
        if term in text.lower():
            keywords.append(term)
    
    entities["keywords"] = keywords
    
    return entities


def classify_query_type(text: str) -> QueryType:
    """Classify the query type based on keywords and context"""
    text_lower = text.lower()
    
    # Sales keywords
    sales_keywords = ["sales", "order", "invoice", "customer", "quote", "payment", "revenue"]
    if any(keyword in text_lower for keyword in sales_keywords):
        return QueryType.SALES
    
    # Inventory keywords
    inventory_keywords = ["inventory", "stock", "product", "warehouse", "supply", "quantity"]
    if any(keyword in text_lower for keyword in inventory_keywords):
        return QueryType.INVENTORY
    
    # Finance keywords
    finance_keywords = ["finance", "accounting", "balance", "expense", "profit", "loss", "budget", "cash flow"]
    if any(keyword in text_lower for keyword in finance_keywords):
        return QueryType.FINANCE
    
    # HRM keywords
    hrm_keywords = ["employee", "payroll", "attendance", "leave", "hr", "recruitment", "performance"]
    if any(keyword in text_lower for keyword in hrm_keywords):
        return QueryType.HRM
    
    # Calculation keywords
    calc_keywords = ["calculate", "compute", "total", "sum", "average", "percentage"]
    if any(keyword in text_lower for keyword in calc_keywords):
        return QueryType.CALCULATION
    
    # Report keywords - but check if it's a sales report first
    report_keywords = ["report", "dashboard", "analytics", "statistics", "summary", "overview"]
    if any(keyword in text_lower for keyword in report_keywords):
        # If report mentions sales-related terms, classify as SALES instead
        if any(sales_kw in text_lower for sales_kw in sales_keywords):
            return QueryType.SALES
        return QueryType.REPORT
    
    return QueryType.GENERAL


def build_context_prompt(user_query: str, query_type: QueryType, entities: Dict, conversation_history: List[Dict], erp_context: str = "", rag_context: str = "") -> str:
    """Build a context-aware prompt for the LLM"""
    
    base_context = """You are an intelligent AI assistant for an Enterprise Resource Planning (ERP) system. 
You help users with various tasks including sales, inventory, finance, and HR management.

Key capabilities:
- Answer questions about business data using the provided ERP data
- Generate reports and analytics based on actual data
- Help with calculations using real numbers
- Provide insights and recommendations based on data
- Assist with data queries

CRITICAL: When ERP data is provided to you in a system message, you MUST use that actual data to answer questions. 
DO NOT ask for permissions, access, or credentials - the data will be provided directly to you.
Always present the actual numbers, metrics, and information from the provided data.
Be concise, helpful, and professional.

KNOWLEDGE BASE / RAG: When using knowledge base information, SYNTHESIZE and REWRITE - do NOT copy-paste verbatim.
Use it as source material: extract key points, rephrase in your own words, and present in a clear, organized way.
Add logical structure with plain section headings (e.g. "Refund process:" on its own line, then the content below).
Use short paragraphs and line breaks between sections. The user should feel they are reading a helpful summary, not raw documentation.

FORMATTING: Use plain text only. No markdown (no **, ##, -, or 1. lists). Use simple headings like "Refund process:" or "Next steps:" on their own line, then your content. Use line breaks between ideas. Write in clear, conversational prose.
"""
    
    # Add domain-specific context
    domain_context = {
        QueryType.SALES: "Focus on sales orders, customers, invoices, and revenue data. Use the provided sales data to answer questions.",
        QueryType.INVENTORY: "Focus on products, stock levels, warehouses, and inventory management.",
        QueryType.FINANCE: "Focus on financial reports, accounting, expenses, and cash flow.",
        QueryType.HRM: "Focus on employees, payroll, attendance, and HR management.",
        QueryType.CALCULATION: "Help with mathematical calculations and data analysis.",
        QueryType.REPORT: "Help generate reports, summaries, and analytics based on the provided data."
    }
    
    context = base_context + "\n" + domain_context.get(query_type, "")
    
    # Add RAG context (knowledge base) if available
    if rag_context:
        context += f"\n\nRELEVANT KNOWLEDGE BASE INFORMATION (use as source; synthesize and present with clear headings/structure - do not copy verbatim):\n{rag_context}"
    
    # Add ERP context if available
    if erp_context:
        context += f"\n\nIMPORTANT: You have access to the following ERP data. Use this data to answer the user's question:\n{erp_context}\n\nAlways use this actual data in your response. Do not ask for access or permissions - you already have the data above."
    
    # Add conversation history context
    if conversation_history:
        context += "\n\nPrevious conversation:\n"
        for msg in conversation_history[-5:]:  # Last 5 messages
            role = msg.get("role", "user")
            content = msg.get("content", "")
            context += f"{role.capitalize()}: {content}\n"
    
    context += f"\n\nUser query: {user_query}\n"
    
    return context

