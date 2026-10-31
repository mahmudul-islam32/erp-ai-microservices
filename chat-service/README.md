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
- `POST /api/v1/chat/conversations/{id}/mark-read` - Mark all messages in a conversation as read for the current user

All REST endpoints need an `Authorization: Bearer <token>` header. The list endpoints are paginated with `skip` and `limit` query parameters: conversations default to 50 (max 100) and messages default to 100 (max 200).

The service also exposes `GET /` (service name, version and status) and `GET /health`, which the Docker health check calls.

### WebSocket

- `WS /api/v1/chat/ws?token=JWT_TOKEN` - Real-time chat connection

After connecting, the server sends `{"type": "connection", "user_id": ...}`. Send the text `ping` to keep the connection alive; the server answers `pong`. When a message is sent through the REST API, every participant who is connected receives `{"type": "message", "action": "created", "conversation_id": ..., "data": {...}}`. An invalid token closes the socket with code 1008 (policy violation).

## Environment Variables

Settings are read from the environment or a `.env` file (names are case-insensitive).

- `MONGODB_URL` - MongoDB connection string (required, the service will not start without it)
- `DATABASE_NAME` - Database name (default: erp_chat)
- `AUTH_SERVICE_URL` - URL of auth service for user verification (default: http://auth-service:8001)
- `JWT_SECRET_KEY` - Secret key for JWT validation; must match the auth service
- `JWT_ALGORITHM` - JWT signing algorithm (default: HS256)
- `SERVICE_PORT` - Port used when running `python main.py` (default: 8005)
- `ENVIRONMENT` - Environment name (default: development)

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
docker run -p 8005:8005 -e MONGODB_URL="mongodb://host.docker.internal:27017" chat-service
```

The image always listens on port 8005, regardless of `SERVICE_PORT`. In the full stack, `docker compose up -d chat-service` sets these variables for you and builds `MONGODB_URL` from the `MONGODB_ATLAS_*` values in the root `.env` file.

