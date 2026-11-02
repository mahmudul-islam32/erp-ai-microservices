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

Every `/api/v1/notifications` endpoint needs an `Authorization: Bearer <JWT>` header signed with the same `SECRET_KEY` as the auth service. Reading, marking and deleting only work on the caller's own notifications (others return 403), while `POST` can create a notification for any `user_id`. Interactive docs are at `/docs` and `/redoc`.

- `GET /health` - Health check
- `POST /api/v1/notifications/` - Create a notification
- `GET /api/v1/notifications/` - Get user notifications, newest first. Query parameters: `skip` (default 0), `limit` (1 to 100, default 50) and `unread_only` (default `false`)
- `GET /api/v1/notifications/unread-count` - Get unread notification count, returned as `{"unread_count": n}`
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

| Variable | Default | Notes |
|---|---|---|
| `MONGODB_URL` | none | Required; the service will not start without it |
| `DATABASE_NAME` | `erp_notifications` | |
| `SECRET_KEY` | placeholder value | Must match the auth service so its JWTs verify; change it in production |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `SERVICE_HOST` | `0.0.0.0` | Used by `python main.py` |
| `SERVICE_PORT` | `8004` | Used by `python main.py`; the Docker image always listens on 8004 |
| `WEBSOCKET_HEARTBEAT_INTERVAL` | `30` | Seconds of client silence before the server sends a heartbeat |
| `ENVIRONMENT` | `development` | `development` turns on auto-reload with `python main.py` |
| `LOG_LEVEL` | `INFO` | |

`AUTH_SERVICE_URL` and `REDIS_URL` are read into the settings but not used by the current code.

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
docker run -p 8004:8004 \
  -e MONGODB_URL=mongodb://host.docker.internal:27017 \
  -e SECRET_KEY=<same-as-auth-service> \
  notification-service
```

