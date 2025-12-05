# AI Chatbot Service

An intelligent AI chatbot service with NLP, sequence modeling, and deep learning capabilities for the ERP system.

## Features

- **Natural Language Processing (NLP)**: Intent extraction, entity recognition, query classification
- **Deep Learning Integration**: OpenAI GPT-4/GPT-3.5-turbo for intelligent responses
- **Context-Aware Conversations**: Maintains conversation history and context
- **ERP Data Integration**: Fetches real-time data from Sales, Inventory, Finance, and HRM services
- **Multi-turn Conversations**: Supports ongoing conversations with memory
- **Query Understanding**: Classifies queries (sales, inventory, finance, HRM, etc.)
- **Intent Recognition**: Understands user intent (query, command, question, greeting)

## Architecture

### Technology Stack

- **FastAPI**: Modern Python web framework
- **OpenAI API**: GPT-4/GPT-3.5-turbo for LLM capabilities
- **MongoDB**: Conversation and message storage
- **Motor**: Async MongoDB driver
- **scikit-learn**: For NLP utilities (optional)

### Service Structure

```
ai-chatbot-service/
├── app/
│   ├── api/              # API routes
│   │   ├── dependencies.py
│   │   └── v1/
│   │       └── chatbot.py
│   ├── models/           # Data models
│   │   ├── conversation.py
│   │   └── message.py
│   ├── services/         # Business logic
│   │   ├── chatbot_service.py
│   │   ├── nlp_service.py
│   │   └── erp_data_service.py
│   ├── utils/            # Utilities
│   │   └── nlp_utils.py
│   ├── database/         # Database connection
│   └── config.py
├── main.py
├── requirements.txt
└── Dockerfile
```

## API Endpoints

### Conversations

- `POST /api/v1/ai-chatbot/conversations` - Create a new conversation
- `GET /api/v1/ai-chatbot/conversations` - Get user's conversations
- `GET /api/v1/ai-chatbot/conversations/{id}` - Get specific conversation
- `DELETE /api/v1/ai-chatbot/conversations/{id}` - Delete conversation

### Messages

- `GET /api/v1/ai-chatbot/conversations/{id}/messages` - Get conversation messages
- `POST /api/v1/ai-chatbot/conversations/{id}/messages` - Send message and get AI response

### Quick Chat

- `POST /api/v1/ai-chatbot/chat?message={text}&conversation_id={id}` - Quick chat endpoint

## Environment Variables

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

# AI Configuration - Provider Selection
DEFAULT_LLM_PROVIDER=openai  # Options: openai, ollama, huggingface, fallback
DEFAULT_LLM_MODEL=  # Uses provider default if empty

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key  # Optional - leave empty for fallback
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo-preview
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Ollama Configuration (Local Open-Source Models)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2  # Options: llama2, mistral, codellama, phi, etc.

# Hugging Face Configuration
HUGGINGFACE_API_KEY=your-hf-api-key  # Optional
HUGGINGFACE_MODEL=microsoft/DialoGPT-medium
HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co
```

## LLM Provider Configuration

The chatbot supports **multiple LLM providers**, including open-source models! You can choose which provider and model to use.

### Supported Providers

1. **OpenAI** - Commercial, most capable (GPT-3.5, GPT-4)
2. **Ollama** - Local open-source models (Llama 2, Mistral, etc.) - **Free!**
3. **Hugging Face** - Open-source models via Inference API
4. **Fallback** - Rule-based system (no API required)

### Provider Setup

#### 1. OpenAI (Commercial)

```bash
# Required
OPENAI_API_KEY=your-openai-api-key
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo-preview

# Optional
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
```

**Models Available:**
- `gpt-3.5-turbo` - Fast, cost-effective
- `gpt-4` - Most capable, slower, more expensive
- `gpt-4-turbo-preview` - Latest GPT-4 variant
- `gpt-4o` - Optimized GPT-4

#### 2. Hugging Face (Open-Source, API)

```bash
# Required
HUGGINGFACE_API_KEY=your-hf-api-key
DEFAULT_LLM_PROVIDER=huggingface
DEFAULT_LLM_MODEL=microsoft/DialoGPT-medium

# Optional
HUGGINGFACE_BASE_URL=https://api-inference.huggingface.co
```

**Available Models:**
- `microsoft/DialoGPT-medium` - Conversational AI
- `microsoft/DialoGPT-large` - Larger variant
- `facebook/blenderbot-400M-distill` - Facebook's BlenderBot
- `google/flan-t5-large` - Google's FLAN-T5

**To get Hugging Face API key:**
1. Sign up at [Hugging Face](https://huggingface.co)
2. Go to Settings → Access Tokens
3. Create a new token

#### 4. Fallback (Rule-Based) - **No Setup Required**

```bash
DEFAULT_LLM_PROVIDER=fallback
```

Works immediately without any API keys or setup. Uses rule-based responses with ERP data integration.

### Model Selection at Runtime

You can also choose the provider/model per request:

**Via API:**
```bash
curl -X POST "http://localhost:8008/api/v1/ai-chatbot/conversations/{id}/messages?provider=ollama&model=llama2" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What were my sales?", "role": "user"}'
```

**Get Available Providers:**
```bash
curl -X GET "http://localhost:8008/api/v1/ai-chatbot/providers" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Model Configuration

- `OPENAI_TEMPERATURE`: Controls randomness (0.0-2.0)
  - Lower = more deterministic
  - Higher = more creative
- `OPENAI_MAX_TOKENS`: Maximum response length
- `MAX_CONVERSATION_HISTORY`: Number of previous messages to include in context

## Usage Examples

### Create Conversation

```bash
curl -X POST http://localhost:8008/api/v1/ai-chatbot/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Send Message

```bash
curl -X POST http://localhost:8008/api/v1/ai-chatbot/conversations/{id}/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What were my sales last month?",
    "role": "user"
  }'
```

### Quick Chat

```bash
curl -X POST "http://localhost:8008/api/v1/ai-chatbot/chat?message=Show%20me%20inventory%20levels" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## NLP Capabilities

### Intent Recognition

- **Greeting**: "Hello", "Hi", "Good morning"
- **Query**: General information requests
- **Command**: "Show me...", "List...", "Get..."
- **Question**: Questions starting with what/when/where/who/why/how
- **Goodbye**: "Bye", "Goodbye", "See you"

### Query Classification

- **Sales**: Orders, customers, invoices, revenue
- **Inventory**: Products, stock, warehouses
- **Finance**: Accounting, expenses, reports
- **HRM**: Employees, payroll, attendance
- **Calculation**: Mathematical operations
- **Report**: Analytics and reports

### Entity Extraction

- Dates: "last month", "2024-01-01", "January 15"
- Numbers: Quantities, amounts, percentages
- Keywords: Domain-specific terms

## ERP Data Integration

The chatbot can fetch real-time data from:

- **Sales Service**: Revenue, orders, customers
- **Inventory Service**: Stock levels, products
- **Finance Service**: Financial reports, accounting data
- **HRM Service**: Employee data, payroll

## Running

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=your-key-here
export MONGODB_URL=mongodb://localhost:27017/erp_ai_chatbot

# Run service
uvicorn main:app --host 0.0.0.0 --port 8008 --reload
```

### Docker

```bash
# Build image
docker build -t ai-chatbot-service .

# Run container
docker run -d \
  -p 8008:8008 \
  -e OPENAI_API_KEY=your-key \
  -e MONGODB_URL=mongodb://mongodb:27017/erp_ai_chatbot \
  ai-chatbot-service
```

## Fallback System (No OpenAI Required)

The chatbot includes a **robust fallback system** that works **without OpenAI tokens or credits**. This means you can use the chatbot even if:

- You don't have an OpenAI API key
- Your OpenAI account has no credits/quota remaining
- You want to avoid OpenAI costs
- You prefer a rule-based approach

### How It Works

1. **Automatic Fallback**: If OpenAI fails or is unavailable, the system automatically switches to the fallback mode
2. **ERP Data Integration**: The fallback system still fetches real-time data from your ERP services (Sales, Inventory, Finance, HRM)
3. **Rule-Based Responses**: Uses pattern matching and query classification to provide helpful responses
4. **Data-Driven**: When ERP data is available, it formats and presents it in a readable format

### When Fallback Activates

The fallback system automatically activates when:
- `OPENAI_API_KEY` is not set or empty
- OpenAI API returns an error (insufficient quota, authentication failure, rate limits, etc.)
- Any OpenAI API call fails for any reason

### Fallback Capabilities

Even without OpenAI, the chatbot can:
- ✅ Fetch and display ERP data (sales, inventory, finance, HRM)
- ✅ Classify queries (sales, inventory, finance, HRM)
- ✅ Extract intent (greeting, query, command, question)
- ✅ Provide structured responses with actual ERP data
- ✅ Handle conversations and maintain context

### Example Fallback Responses

**User**: "What were my sales last month?"

**Fallback Response**:
```
Here's your sales information:

📊 Sales Summary
- Total Revenue: $50,000
- Total Orders: 125
- Total Customers: 45
- Growth Rate: +15%

💡 You can also ask about:
- Revenue breakdown by period
- Top customers or products
```

### Configuring Fallback Mode

To explicitly use fallback mode (optional):

```bash
# Leave OPENAI_API_KEY empty or unset
OPENAI_API_KEY=

# Or remove it from environment variables
```

The chatbot will automatically use fallback mode and display a message like:
> "I'm currently using fallback mode (no OpenAI required). I can still provide helpful information from your ERP data."

### Limitations

Without OpenAI, the chatbot:
- ❌ Cannot generate creative or conversational responses
- ❌ Cannot answer complex questions requiring reasoning
- ❌ Cannot provide natural language explanations
- ✅ Still provides structured data and helpful information from your ERP

### Enabling OpenAI Later

When you're ready to use OpenAI:
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add credits to your OpenAI account
3. Set `OPENAI_API_KEY` in your `.env` file
4. Restart the service
5. The chatbot will automatically use OpenAI for more intelligent responses

## Testing

### Without OpenAI API Key

The service will use fallback responses when no API key is configured, allowing basic testing without OpenAI costs.

### Example Queries

- "What were my sales last month?"
- "Show me low stock items"
- "Generate a revenue report"
- "How many employees do we have?"
- "Calculate total revenue for Q1"

## Performance

- Average response time: 1-3 seconds (depends on OpenAI API)
- Context window: Configurable (default: 4096 tokens)
- Conversation history: Last 20 messages included
- Concurrent requests: Handled asynchronously

## Security

- JWT authentication required
- Token validation via Auth Service
- User isolation (users can only access their conversations)
- Secure API key storage (environment variables)

## Future Enhancements

- [ ] WebSocket support for real-time streaming
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Custom fine-tuned models
- [ ] Advanced analytics on conversations
- [ ] Integration with more ERP modules
- [ ] RAG (Retrieval-Augmented Generation) for knowledge base

## License

Part of the ERP AI Microservices system.

