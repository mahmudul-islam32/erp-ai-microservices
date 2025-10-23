# Notification Service

Real-time notification microservice for the ERP system using FastAPI and WebSocket.

## Features

- 📨 Create and manage notifications
- 🔔 Real-time notification delivery via WebSocket
- 📊 Notification types (orders, invoices, users, inventory, payments, system)
- 🎯 Priority levels (low, medium, high, urgent)
- ✅ Mark notifications as read/unread
- 🗑️ Delete notifications
- 📈 Unread notification count
- 🔒 JWT authentication
- 📱 Support for multiple simultaneous connections per user

## API Endpoints

### REST API

- `GET /health` - Health check
- `POST /api/v1/notifications/` - Create a notification
- `GET /api/v1/notifications/` - Get user notifications (with pagination)
- `GET /api/v1/notifications/unread-count` - Get unread notification count
- `GET /api/v1/notifications/{id}` - Get specific notification
- `PATCH /api/v1/notifications/{id}/read` - Mark notification as read
- `POST /api/v1/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/v1/notifications/{id}` - Delete notification

### WebSocket

- `WS /api/v1/ws?token=<JWT_TOKEN>` - WebSocket connection for real-time notifications

## WebSocket Message Format

### Client → Server

```json
{
  "type": "ping"
}
```

### Server → Client

```json
{
  "type": "notification",
  "action": "created",
  "data": {
    "id": "notification_id",
    "title": "New Order",
    "message": "Order #12345 has been created",
    "type": "order_created",
    "priority": "medium",
    "created_at": "2024-01-15T10:30:00"
  }
}
```

## Notification Types

- `order_created`, `order_updated`, `order_cancelled`
- `invoice_created`, `invoice_paid`, `invoice_overdue`
- `user_created`, `user_updated`, `user_deleted`
- `inventory_low_stock`, `inventory_out_of_stock`, `inventory_restocked`
- `payment_received`, `payment_failed`
- `system_alert`, `system_update`
- `custom`

## Priority Levels

- `low` - Informational notifications
- `medium` - Standard notifications
- `high` - Important notifications
- `urgent` - Critical notifications requiring immediate attention

## Environment Variables

- `ENVIRONMENT` - Environment (development/production)
- `MONGODB_URL` - MongoDB connection URL
- `DATABASE_NAME` - Database name
- `SECRET_KEY` - JWT secret key
- `SERVICE_PORT` - Service port (default: 8004)
- `LOG_LEVEL` - Logging level

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

## Docker

```bash
# Build image
docker build -t notification-service .

# Run container
docker run -p 8004:8004 notification-service
```

