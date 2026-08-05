# AI Chatbot Service - Complete Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [File Structure & Components](#file-structure--components)
4. [Core Components Deep Dive](#core-components-deep-dive)
5. [Data Flow](#data-flow)
6. [Key Features & Implementation](#key-features--implementation)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Configuration](#configuration)

---

## Overview

The AI Chatbot Service is a sophisticated microservice that provides intelligent conversational AI capabilities for the ERP system. It combines:

- **Natural Language Processing (NLP)**: Intent extraction, entity recognition, query classification
- **Large Language Models (LLMs)**: Support for multiple providers (OpenAI, Hugging Face, Fallback)
- **Retrieval-Augmented Generation (RAG)**: Knowledge base with semantic search
- **ERP Data Integration**: Real-time data fetching from Sales, Inventory, Finance, and HRM services
- **Context-Aware Conversations**: Multi-turn conversations with memory

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                       │
│                      (main.py)                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐
│   API Layer  │ │  Services  │ │  Models   │
│  (chatbot.py)│ │   Layer    │ │   Layer   │
└───────┬──────┘ └─────┬──────┘ └────┬──────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌────▼──────┐
│   MongoDB    │ │  LLM APIs  │ │  ERP APIs │
│  (Storage)  │ │ (OpenAI,   │ │ (Sales,   │
│             │ │  Hugging   │ │  Finance) │
│             │ │  Face)     │ │           │
└─────────────┘ └────────────┘ └───────────┘
```

### Component Interaction Flow

```
User Request
    │
    ▼
┌─────────────────┐
│  API Endpoint   │ (chatbot.py)
│  Authentication │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ChatbotService  │ (chatbot_service.py)
│  - Save message │
│  - Get history  │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌──────────────┐
│  NLPService     │ │ ERPDataService│
│  - Extract      │ │  - Fetch     │
│    intent       │ │    sales     │
│  - Classify     │ │    data      │
│  - Generate     │ └──────────────┘
│    response     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌──────────────┐
│ RAGService      │ │ LLM Provider │
│  - Search       │ │  - OpenAI     │
│    knowledge    │ │  - HuggingFace│
│  - Retrieve     │ │  - Fallback  │
│    chunks       │ └──────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  AI Response    │
│  - Save to DB   │
│  - Return to    │
│    user         │
└─────────────────┘
```

---

## File Structure & Components

### Directory Structure

```
ai-chatbot-service/
├── main.py                          # Application entry point
├── app/
│   ├── __init__.py
│   ├── config.py                     # Configuration management
│   │
│   ├── api/                          # API layer
│   │   ├── __init__.py
│   │   ├── dependencies.py           # Auth dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── chatbot.py            # API endpoints
│   │
│   ├── models/                       # Data models
│   │   ├── __init__.py
│   │   ├── conversation.py           # Conversation models
│   │   ├── message.py                # Message models
│   │   └── knowledge_base.py         # Knowledge base models
│   │
│   ├── services/                     # Business logic
│   │   ├── __init__.py
│   │   ├── chatbot_service.py        # Main chatbot orchestration
│   │   ├── nlp_service.py            # NLP & LLM integration
│   │   ├── rag_service.py            # RAG operations
│   │   ├── embedding_service.py      # Text embeddings
│   │   ├── erp_data_service.py       # ERP data fetching
│   │   ├── date_extractor.py         # Date parsing
│   │   ├── llm_provider_factory.py   # LLM provider factory
│   │   └── llm_providers/
│   │       ├── __init__.py
│   │       ├── base.py               # Base provider interface
│   │       ├── openai_provider.py    # OpenAI implementation
│   │       └── huggingface_provider.py # Hugging Face implementation
│   │
│   ├── database/                     # Database layer
│   │   ├── __init__.py
│   │   └── connection.py             # MongoDB connection
│   │
│   └── utils/                        # Utilities
│       ├── __init__.py
│       └── nlp_utils.py               # NLP helper functions
│
├── scripts/                          # Utility scripts
│   ├── ingest_erp_documents.py      # Document ingestion
│   ├── ingest_sample_data.py        # Sample data ingestion
│   └── test_rag.py                   # RAG testing
│
└── requirements.txt                  # Dependencies
```

---

## Core Components Deep Dive

### 1. Application Entry Point (`main.py`)

**Purpose**: FastAPI application initialization and lifecycle management

**Key Features**:
- FastAPI app creation with metadata
- CORS middleware configuration
- Database connection lifecycle management
- Router registration

**Code Flow**:
```python
1. Create FastAPI app with lifespan manager
2. Configure CORS
3. Include chatbot router
4. Define root and health endpoints
```

**Lifespan Management**:
- **Startup**: Connect to MongoDB, create indexes
- **Shutdown**: Close MongoDB connection gracefully

---

### 2. Configuration (`app/config.py`)

**Purpose**: Centralized configuration management using Pydantic Settings

**Configuration Categories**:

1. **Service Configuration**:
   - Service name, version, port
   - Environment (development/production)

2. **Database Configuration**:
   - MongoDB URL
   - Database name

3. **Auth Service Configuration**:
   - Auth service URL
   - JWT secret key and algorithm

4. **External Services**:
   - Sales, Inventory, Finance, HRM service URLs

5. **LLM Configuration**:
   - Default provider (openai, huggingface, fallback)
   - Provider-specific settings (API keys, models, temperature)

6. **RAG Configuration**:
   - Enable/disable RAG
   - Embedding provider (openai, sentence_transformer)
   - Embedding model
   - Chunk size, overlap, similarity threshold
   - Top-K retrieval count

**Environment Variables**: All settings can be overridden via `.env` file

---

### 3. Database Layer (`app/database/connection.py`)

**Purpose**: MongoDB connection management and index creation

**Key Functions**:

- `connect_to_mongo()`: Establish MongoDB connection
- `close_mongo_connection()`: Graceful shutdown
- `get_database()`: Get database instance
- `_create_indexes()`: Create performance indexes

**Indexes Created**:

1. **Conversations Collection**:
   - `user_id` (single field)
   - `created_at` (single field)
   - `(user_id, created_at)` (compound, for user's conversations sorted by date)

2. **Messages Collection**:
   - `conversation_id` (single field)
   - `created_at` (single field)
   - `(conversation_id, created_at)` (compound, for conversation messages in order)

3. **Knowledge Base Collection**:
   - `source_id` (single field)
   - `source` (single field)
   - `user_id` (single field)
   - `tags` (single field)
   - `(source_id, chunk_index)` (compound, for document chunks in order)

**Connection Pattern**: Uses Motor (async MongoDB driver) with global connection state

---

### 4. Data Models

#### 4.1 Conversation Model (`app/models/conversation.py`)

**Purpose**: Define conversation data structures

**Models**:
- `ConversationBase`: Base fields (title, context)
- `ConversationCreate`: For creating conversations
- `ConversationInDB`: Database representation with MongoDB `_id`
- `ConversationResponse`: API response format

**Fields**:
- `id`: MongoDB ObjectId (string)
- `user_id`: Owner of conversation
- `title`: Conversation title (auto-generated from first message)
- `context`: Additional context dictionary
- `created_at`, `updated_at`: Timestamps
- `message_count`: Number of messages
- `last_message_at`: Timestamp of last message

#### 4.2 Message Model (`app/models/message.py`)

**Purpose**: Define message data structures

**Models**:
- `MessageBase`: Base fields (content, role, metadata)
- `MessageCreate`: For creating messages
- `MessageSendRequest`: Request format for sending messages
- `MessageInDB`: Database representation
- `MessageResponse`: API response format

**Message Roles** (Enum):
- `USER`: User messages
- `ASSISTANT`: AI responses
- `SYSTEM`: System messages

**Fields**:
- `id`: MongoDB ObjectId
- `conversation_id`: Parent conversation
- `user_id`: Message author
- `content`: Message text
- `role`: Message role
- `metadata`: Additional data (intent, query_type, tokens_used, etc.)
- `created_at`: Timestamp
- `tokens_used`: Token count (for LLM responses)
- `processing_time_ms`: Response generation time

#### 4.3 Knowledge Base Model (`app/models/knowledge_base.py`)

**Purpose**: Define knowledge base chunk structures

**Models**:
- `KnowledgeChunkBase`: Base fields
- `KnowledgeChunkCreate`: For creating chunks
- `KnowledgeChunkInDB`: Database representation with embeddings
- `KnowledgeChunkResponse`: API response with similarity scores
- `DocumentIngestRequest`: Request for ingesting documents
- `DocumentIngestResponse`: Response after ingestion

**Fields**:
- `id`: MongoDB ObjectId
- `content`: Chunk text content
- `embedding`: Vector embedding (List[float])
- `source`: Source identifier (e.g., "erp_manual", "user_upload")
- `source_id`: Document ID in source system
- `chunk_index`: Position in document
- `metadata`: Additional metadata dictionary
- `tags`: List of tags
- `user_id`: Owner of chunk
- `score`: Similarity score (for search results)
- `created_at`, `updated_at`: Timestamps

---

### 5. API Layer

#### 5.1 Dependencies (`app/api/dependencies.py`)

**Purpose**: Authentication and authorization

**Functions**:

1. `get_current_user_token()`:
   - Extracts JWT token from:
     - Authorization header (Bearer token)
     - Cookie (`access_token`)
   - Returns token string or None

2. `get_current_user()`:
   - Validates token with Auth Service
   - Returns user data (id, email, role, token)
   - Raises 401 if invalid, 503 if auth service unavailable

**Security**: Uses HTTPBearer for header-based auth, supports cookie fallback

#### 5.2 Chatbot API (`app/api/v1/chatbot.py`)

**Purpose**: REST API endpoints for chatbot functionality

**Endpoints**:

1. **Conversation Management**:
   - `POST /conversations`: Create new conversation
   - `GET /conversations`: List user's conversations (paginated)
   - `GET /conversations/{id}`: Get specific conversation
   - `DELETE /conversations/{id}`: Delete conversation

2. **Message Management**:
   - `GET /conversations/{id}/messages`: Get conversation messages (paginated)
   - `POST /conversations/{id}/messages`: Send message and get AI response

3. **Quick Chat**:
   - `POST /chat`: Quick chat endpoint (creates conversation if needed)

4. **Provider Management**:
   - `GET /providers`: Get available LLM providers and models

5. **Knowledge Base (RAG)**:
   - `POST /knowledge-base/ingest`: Ingest document
   - `GET /knowledge-base/search`: Search knowledge base
   - `GET /knowledge-base/document/{source_id}`: Get document chunks
   - `DELETE /knowledge-base/document/{source_id}`: Delete document
   - `GET /knowledge-base/stats`: Get knowledge base statistics

**Dependency Injection**:
- `get_chatbot_service()`: Provides ChatbotService instance
- `get_rag_service()`: Provides RAGService instance (if enabled)
- `get_current_user()`: Provides authenticated user

**Error Handling**: All endpoints have try-catch with appropriate HTTP status codes

---

### 6. Service Layer

#### 6.1 Chatbot Service (`app/services/chatbot_service.py`)

**Purpose**: Main orchestration service for chatbot operations

**Key Responsibilities**:

1. **Conversation Management**:
   - Create, retrieve, delete conversations
   - Update conversation metadata (title, message count, last message time)

2. **Message Processing**:
   - Save user messages
   - Process user queries with NLP
   - Fetch ERP data based on query type
   - Retrieve RAG context
   - Generate AI responses
   - Save AI responses

**Key Method: `process_user_message()`**

This is the core method that orchestrates the entire message processing flow:

```python
1. Verify conversation ownership
2. Save user message to database
3. Get conversation history (last 20 messages)
4. Classify query type (sales, inventory, finance, hrm)
5. Fetch ERP data if needed:
   - Priority 1: Order number → fetch order details
   - Priority 2: Date range → fetch sales data for period
   - Priority 3: Customer name → fetch customer orders
   - Priority 4: Fallback → try multiple date ranges
6. Retrieve RAG context (if enabled)
7. Generate AI response using NLPService
8. Save AI response
9. Update conversation metadata
```

**ERP Data Fetching Logic**:

The service has sophisticated logic for fetching sales data:

- **Order Number Detection**: Regex patterns detect order numbers (SO-00001, ORDER-123)
- **Date Range Extraction**: Parses natural language dates ("november", "last month")
- **Customer Name Extraction**: Regex patterns extract customer names from queries
- **Fallback Strategy**: Tries multiple date ranges if initial fetch returns no data

**RAG Integration**:
- Automatically retrieves relevant knowledge base chunks
- Includes RAG context in LLM prompt
- Falls back gracefully if RAG fails

#### 6.2 NLP Service (`app/services/nlp_service.py`)

**Purpose**: NLP processing and LLM response generation

**Key Responsibilities**:

1. **NLP Feature Extraction**:
   - Intent extraction (greeting, query, command, question)
   - Entity extraction (dates, numbers, order numbers, customer names)
   - Query type classification (sales, inventory, finance, hrm)

2. **LLM Response Generation**:
   - Build context-aware prompts
   - Include ERP data context
   - Include RAG context
   - Include conversation history
   - Call LLM provider (OpenAI, Hugging Face, or Fallback)

3. **Fallback System**:
   - Automatic fallback if LLM provider fails
   - Rule-based responses using ERP data
   - Helpful error messages

**Key Method: `generate_response()`**

```python
1. Extract NLP features (intent, entities, query_type)
2. Get ERP context and RAG context from user_context
3. Build context prompt with:
   - System instructions
   - ERP data (if available)
   - RAG knowledge base (if available)
   - Conversation history
   - Current user query
4. Try LLM provider:
   - If available: Call provider API
   - If fails: Fallback to rule-based
5. Return response text and metadata
```

**Prompt Engineering**:

The service uses sophisticated prompt engineering:

1. **System Instructions**: Clear role definition and capabilities
2. **ERP Data Context**: Explicit instructions to use provided data
3. **RAG Context**: Mandatory instructions to use knowledge base
4. **Conversation History**: Last N messages for context
5. **User Query**: Current question/command

**Fallback Response Generation**:

If LLM is unavailable, generates structured responses:
- Intent-based responses (greeting, goodbye, help)
- Query-type-based responses with ERP data
- Formatted data presentation
- Helpful suggestions

#### 6.3 RAG Service (`app/services/rag_service.py`)

**Purpose**: Retrieval-Augmented Generation operations

**Key Responsibilities**:

1. **Document Ingestion**:
   - Chunk documents with overlap
   - Generate embeddings for chunks
   - Store chunks with embeddings in MongoDB

2. **Semantic Search**:
   - Generate query embedding
   - Calculate cosine similarity with all chunks
   - Filter by threshold and return top-K results

3. **Document Management**:
   - Get all chunks for a document
   - Delete document and all chunks
   - Get knowledge base statistics

**Chunking Algorithm**:

```python
1. Split text into chunks of size `chunk_size`
2. Try to break at sentence boundaries (period, newline)
3. Overlap chunks by `chunk_overlap` characters
4. Preserve context across chunk boundaries
```

**Similarity Search**:

```python
1. Generate embedding for query using EmbeddingService
2. Fetch all chunks (or filtered by source/tags/user_id)
3. Calculate cosine similarity for each chunk:
   similarity = dot(query_embedding, chunk_embedding) / 
                (norm(query_embedding) * norm(chunk_embedding))
4. Filter by threshold (default: 0.5)
5. Sort by similarity (descending)
6. Return top-K results
```

**Performance Considerations**:
- For production, consider MongoDB Atlas Vector Search
- Or use dedicated vector database (Pinecone, Weaviate, Qdrant)
- Current implementation scans all chunks (works for small-medium datasets)

#### 6.4 Embedding Service (`app/services/embedding_service.py`)

**Purpose**: Generate text embeddings for RAG

**Supported Providers**:

1. **OpenAI Embeddings**:
   - Models: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`
   - Requires API key
   - High quality, fast, cost-effective

2. **Sentence Transformers** (Open-Source):
   - Model: `all-MiniLM-L6-v2` (default)
   - No API key required
   - Runs locally
   - Good performance for most use cases

**Methods**:
- `generate_embedding(text)`: Single text embedding
- `generate_embeddings_batch(texts)`: Batch embeddings (more efficient)

**Implementation Details**:
- OpenAI: Async API calls
- Sentence Transformers: Runs in executor to avoid blocking event loop

#### 6.5 ERP Data Service (`app/services/erp_data_service.py`)

**Purpose**: Fetch and format data from ERP microservices

**Supported Services**:
- Sales Service
- Inventory Service
- Finance Service
- HRM Service

**Key Methods**:

1. **Sales Data**:
   - `get_sales_summary()`: Analytics dashboard data
   - `get_sales_orders()`: Actual orders list
   - `get_order_by_number()`: Single order details
   - `format_order_details()`: Format single order
   - `format_orders_for_context()`: Format orders list
   - `format_data_for_context()`: Format sales summary

2. **Data Formatting**:
   - Converts JSON data to readable text format
   - Includes emojis and formatting for better readability
   - Handles edge cases (empty data, zeros, missing fields)

**Error Handling**:
- Timeout handling (10 seconds)
- Request error handling
- Graceful degradation (returns None on error)

**Data Formatting Strategy**:
- Structured text format with emojis
- Clear section headers
- Formatted numbers (currency, percentages)
- Top products/customers lists
- Period information

#### 6.6 LLM Provider Factory (`app/services/llm_provider_factory.py`)

**Purpose**: Factory pattern for creating LLM providers

**Supported Providers**:

1. **OpenAI**:
   - Models: gpt-4o-mini, gpt-4o, gpt-3.5-turbo, gpt-4, gpt-4-turbo-preview
   - Requires API key
   - Most capable, commercial

2. **Hugging Face**:
   - Models: microsoft/DialoGPT-medium, facebook/blenderbot-400M-distill, etc.
   - Requires API key
   - Open-source models via Inference API

3. **Fallback**:
   - Rule-based system
   - No API required
   - Uses ERP data for responses

**Factory Methods**:
- `create_provider()`: Create provider instance based on name
- `get_available_providers()`: List available providers and models

**Provider Selection**:
- Can be specified per request (query parameter)
- Falls back to default provider from config
- Automatically falls back if provider fails

#### 6.7 LLM Providers

**Base Provider** (`app/services/llm_providers/base.py`):
- Abstract base class
- Defines interface: `generate_response()`, `is_available()`, `get_provider_name()`

**OpenAI Provider** (`app/services/llm_providers/openai_provider.py`):
- Uses OpenAI Async API
- Returns response text and metadata (tokens used, model, etc.)
- Handles errors gracefully

**Hugging Face Provider** (`app/services/llm_providers/huggingface_provider.py`):
- Uses Hugging Face Inference API
- Formats messages for HF models
- Handles model loading states (503 errors)
- Converts different response formats

---

### 7. Utilities

#### 7.1 NLP Utils (`app/utils/nlp_utils.py`)

**Purpose**: NLP helper functions

**Functions**:

1. **`extract_intent(text)`**:
   - Pattern matching for intents
   - Returns: GREETING, GOODBYE, HELP, COMMAND, QUESTION, QUERY

2. **`extract_entities(text)`**:
   - Extracts: dates, numbers, order numbers, customer names, keywords
   - Uses regex patterns
   - Returns dictionary of entity lists

3. **`classify_query_type(text)`**:
   - Keyword-based classification
   - Returns: SALES, INVENTORY, FINANCE, HRM, CALCULATION, REPORT, GENERAL

4. **`build_context_prompt(...)`**:
   - Builds comprehensive prompt for LLM
   - Includes: system instructions, domain context, ERP data, RAG context, conversation history

**Entity Extraction Patterns**:
- **Dates**: YYYY-MM-DD, MM/DD/YYYY, relative dates, month names
- **Order Numbers**: SO-00001, ORDER-123, SO12345
- **Customer Names**: Complex regex patterns for various formats
- **Numbers**: Decimal and integer numbers

#### 7.2 Date Extractor (`app/services/date_extractor.py`)

**Purpose**: Extract and parse date ranges from natural language

**Functions**:

1. **`extract_month_from_query(query)`**:
   - Finds month names in query
   - Returns month name or None

2. **`extract_date_range_from_query(query)`**:
   - Parses natural language dates
   - Returns: (start_date, end_date, description) or None
   - Supports: "november", "last month", "this month", "november 2025"

3. **`get_month_date_range(month_name, year)`**:
   - Calculates start and end dates for a month
   - Handles leap years
   - Returns tuple with description

**Supported Patterns**:
- Month names: "november", "december", etc.
- Relative dates: "last month", "this month"
- Month with year: "november 2025"
- "for [month]" pattern: "for november"

---

## Data Flow

### Message Processing Flow

```
1. User sends message via API
   ↓
2. API validates authentication
   ↓
3. ChatbotService.process_user_message()
   ↓
4. Save user message to database
   ↓
5. Get conversation history
   ↓
6. Classify query type (NLP utils)
   ↓
7. Extract entities (dates, order numbers, customer names)
   ↓
8. Fetch ERP data (if query type matches):
   - Sales: Fetch orders/summary
   - Inventory: Fetch products
   - Finance: Fetch financial data
   - HRM: Fetch employee data
   ↓
9. Retrieve RAG context (if enabled):
   - Generate query embedding
   - Search similar chunks
   - Retrieve top-K chunks
   ↓
10. NLPService.generate_response():
    - Build context prompt
    - Include ERP data
    - Include RAG context
    - Include conversation history
    ↓
11. LLM Provider generates response:
    - OpenAI API call
    - OR Hugging Face API call
    - OR Fallback rule-based
    ↓
12. Save AI response to database
   ↓
13. Update conversation metadata
   ↓
14. Return response to user
```

### RAG Document Ingestion Flow

```
1. User uploads document via API
   ↓
2. RAGService.ingest_document()
   ↓
3. Chunk document:
   - Split into chunks of size `chunk_size`
   - Overlap chunks by `chunk_overlap`
   - Try to break at sentence boundaries
   ↓
4. Generate embeddings:
   - Batch process all chunks
   - Use EmbeddingService (OpenAI or Sentence Transformer)
   ↓
5. Store chunks in MongoDB:
   - Content, embedding, metadata, source, tags
   ↓
6. Return document_id and chunk count
```

### RAG Search Flow

```
1. User query comes in
   ↓
2. RAGService.search_similar_chunks()
   ↓
3. Generate query embedding
   ↓
4. Fetch all chunks (or filtered)
   ↓
5. Calculate cosine similarity for each chunk
   ↓
6. Filter by threshold (default: 0.5)
   ↓
7. Sort by similarity (descending)
   ↓
8. Return top-K chunks with scores
   ↓
9. Include in LLM prompt as context
```

---

## Key Features & Implementation

### 1. Multi-Provider LLM Support

**Implementation**:
- Factory pattern for provider creation
- Abstract base class for providers
- Automatic fallback if provider fails
- Per-request provider selection

**Benefits**:
- Flexibility to switch providers
- Cost optimization (use cheaper models)
- Resilience (fallback if API fails)

### 2. RAG (Retrieval-Augmented Generation)

**Implementation**:
- Document chunking with overlap
- Vector embeddings (OpenAI or Sentence Transformers)
- Cosine similarity search
- User-isolated knowledge bases

**Benefits**:
- Context-aware responses
- Company-specific knowledge
- Reduced hallucinations
- Better accuracy

### 3. ERP Data Integration

**Implementation**:
- Service-to-service HTTP calls
- JWT token forwarding
- Data formatting for LLM context
- Priority-based data fetching

**Benefits**:
- Real-time data access
- Accurate responses with actual data
- No need to train on company data

### 4. Intelligent Query Processing

**Implementation**:
- Intent extraction
- Entity recognition (dates, order numbers, customer names)
- Query type classification
- Date range extraction from natural language

**Benefits**:
- Understands user intent
- Extracts relevant information
- Fetches appropriate data
- Handles complex queries

### 5. Conversation Management

**Implementation**:
- Multi-turn conversations
- Conversation history (last 20 messages)
- Auto-generated titles
- Message count tracking

**Benefits**:
- Context-aware responses
- Better user experience
- Conversation continuity

### 6. Fallback System

**Implementation**:
- Automatic fallback if LLM fails
- Rule-based responses
- ERP data formatting
- Helpful error messages

**Benefits**:
- Works without API keys
- No cost for basic functionality
- Graceful degradation

---

## Database Schema

### Collections

#### 1. `conversations`

```javascript
{
  _id: ObjectId,
  user_id: String,
  title: String,
  context: Object,
  created_at: DateTime,
  updated_at: DateTime,
  message_count: Number,
  last_message_at: DateTime
}
```

**Indexes**:
- `user_id`
- `created_at`
- `(user_id, created_at)` compound

#### 2. `messages`

```javascript
{
  _id: ObjectId,
  conversation_id: String,
  user_id: String,
  content: String,
  role: String, // "user", "assistant", "system"
  metadata: Object, // { intent, query_type, tokens_used, etc. }
  created_at: DateTime,
  tokens_used: Number,
  processing_time_ms: Number
}
```

**Indexes**:
- `conversation_id`
- `created_at`
- `(conversation_id, created_at)` compound

#### 3. `knowledge_base`

```javascript
{
  _id: ObjectId,
  content: String,
  embedding: Array[Float], // Vector embedding
  source: String, // "erp_manual", "user_upload", etc.
  source_id: String, // Document ID
  chunk_index: Number,
  metadata: Object,
  tags: Array[String],
  user_id: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

**Indexes**:
- `source_id`
- `source`
- `user_id`
- `tags`
- `(source_id, chunk_index)` compound

---

## API Endpoints

### Base URL: `/api/v1/ai-chatbot`

### Conversation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations` | Create new conversation |
| GET | `/conversations` | List user's conversations |
| GET | `/conversations/{id}` | Get specific conversation |
| DELETE | `/conversations/{id}` | Delete conversation |

### Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations/{id}/messages` | Get conversation messages |
| POST | `/conversations/{id}/messages` | Send message and get AI response |

### Quick Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Quick chat (creates conversation if needed) |

### Provider Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/providers` | Get available LLM providers |

### Knowledge Base (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/knowledge-base/ingest` | Ingest document |
| GET | `/knowledge-base/search` | Search knowledge base |
| GET | `/knowledge-base/document/{source_id}` | Get document chunks |
| DELETE | `/knowledge-base/document/{source_id}` | Delete document |
| GET | `/knowledge-base/stats` | Get knowledge base statistics |

---

## Configuration

### Environment Variables

```bash
# Service
SERVICE_PORT=8008
ENVIRONMENT=development

# Database
MONGODB_URL=mongodb://admin:password123@mongodb:27017/erp_ai_chatbot?authSource=admin
DATABASE_NAME=erp_ai_chatbot

# Auth Service
AUTH_SERVICE_URL=http://auth-service:8001
JWT_SECRET_KEY=your-secret-key

# External Services
SALES_SERVICE_URL=http://sales-service:8003
INVENTORY_SERVICE_URL=http://inventory-service:8002
FINANCE_SERVICE_URL=http://finance-service:8006
HRM_SERVICE_URL=http://hrm-service:8007

# LLM Configuration
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=
OPENAI_API_KEY=REDACTED
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Hugging Face
HUGGINGFACE_API_KEY=your-hf-api-key
HUGGINGFACE_MODEL=microsoft/DialoGPT-medium
HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co

# RAG Configuration
ENABLE_RAG=true
RAG_EMBEDDING_PROVIDER=openai
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.5
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
```

---

## Summary

The AI Chatbot Service is a comprehensive microservice that provides:

1. **Intelligent Conversations**: NLP-powered, context-aware responses
2. **Multi-Provider LLM Support**: OpenAI, Hugging Face, or Fallback
3. **RAG Capabilities**: Knowledge base with semantic search
4. **ERP Integration**: Real-time data from all ERP services
5. **Robust Architecture**: Clean separation of concerns, error handling, fallback systems
6. **Scalable Design**: Async operations, efficient database queries, batch processing

The service is production-ready with proper error handling, logging, authentication, and graceful degradation.
