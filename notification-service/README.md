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

Send the plain text `ping` (not JSON) to keep the connection alive. The server answers with the plain text `pong`. Any other text from the client is ignored.

### Server → Client

Right after connecting, the server sends a confirmation:

```json
{
  "type": "connection",
  "message": "Connected to notification service",
  "timestamp": "2024-01-15T10:30:00"
}
```

If the client sends nothing for `WEBSOCKET_HEARTBEAT_INTERVAL` seconds (default 30), the server sends `{"type": "heartbeat"}`.

When a notification is created for the user:

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

The `data` object is the full notification, including `user_id`, `metadata`, `action_url`, `action_label`, `is_read` and `updated_at`.

Other changes made through the REST API are pushed to all of the user's open connections:

```json
{ "type": "notification", "action": "read", "notification_id": "notification_id" }
{ "type": "notification", "action": "mark_all_read", "count": 3 }
{ "type": "notification", "action": "deleted", "notification_id": "notification_id" }
```

## Notification Types

- `order_created`, `order_updated`, `order_cancelled`
- `invoice_created`, `invoice_paid`, `invoice_overdue`
- `user_created`, `user_updated`, `user_deleted`
- `product_created`, `product_updated`, `product_deleted`
- `inventory_low_stock`, `inventory_out_of_stock`, `inventory_restocked`
- `stock_adjusted`, `stock_movement`
- `payment_received`, `payment_failed`
- `system_alert`, `system_update`
- `custom` (the default when `type` is omitted)

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

