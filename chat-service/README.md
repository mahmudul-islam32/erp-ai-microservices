# Chat Service

Real-time chat and messaging service for the ERP system.

## Features

- **Real-time messaging** via WebSocket
- **One-on-one conversations** between users
- **Group conversations** support
- **Message history** with pagination
- **Unread message tracking**
- **Online/offline status**
- **Message read receipts**

## API Endpoints

### REST API

- `POST /api/v1/chat/conversations` - Create a new conversation
- `GET /api/v1/chat/conversations` - Get all conversations for current user
- `GET /api/v1/chat/conversations/{id}` - Get specific conversation
- `GET /api/v1/chat/conversations/{id}/messages` - Get messages in conversation
- `POST /api/v1/chat/messages` - Send a message
- `DELETE /api/v1/chat/messages/{id}` - Delete a message
- `GET /api/v1/chat/unread-count` - Get total unread count

### WebSocket

- `WS /api/v1/chat/ws?token=JWT_TOKEN` - Real-time chat connection

## Environment Variables

- `MONGODB_URL` - MongoDB connection string
- `DATABASE_NAME` - Database name (default: erp_chat)
- `AUTH_SERVICE_URL` - URL of auth service for user verification
- `JWT_SECRET_KEY` - Secret key for JWT validation
- `SERVICE_PORT` - Port to run on (default: 8005)

## Tech Stack

- **FastAPI** - Modern Python web framework
- **Motor** - Async MongoDB driver
- **WebSockets** - Real-time bidirectional communication
- **Pydantic** - Data validation

## Running

```bash
uvicorn main:app --host 0.0.0.0 --port 8005 --reload
```

## Docker

```bash
docker build -t chat-service .
docker run -p 8005:8005 chat-service
```

