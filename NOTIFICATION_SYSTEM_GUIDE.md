# ERP Notification System - Complete Guide

## Overview

The ERP Notification System is a comprehensive real-time notification solution built with microservices architecture. It provides instant notifications for various events across the system including orders, invoices, user management, inventory alerts, and more.

## Architecture

### Components

1. **Notification Service** (Python/FastAPI)
   - REST API for CRUD operations
   - WebSocket server for real-time communication
   - MongoDB for persistent storage
   - Redis for pub/sub (optional)

2. **Frontend Integration** (React/TypeScript)
   - Redux state management
   - WebSocket client with auto-reconnect
   - Notification bell with dropdown
   - Browser notifications support

3. **Service Integration**
   - Auth Service: User creation notifications
   - Sales Service: Order creation notifications
   - Inventory Service: Stock alerts (ready for integration)

## Features

✅ **Real-time Notifications** - Instant delivery via WebSocket
✅ **Multiple Notification Types** - Orders, Invoices, Users, Inventory, Payments, System
✅ **Priority Levels** - Low, Medium, High, Urgent
✅ **Read/Unread Status** - Track notification states
✅ **Bulk Operations** - Mark all as read, delete multiple
✅ **Browser Notifications** - Native desktop notifications
✅ **Auto-Reconnect** - Resilient WebSocket connection
✅ **Metadata Support** - Rich notification context
✅ **Action URLs** - Deep linking to related resources

## Notification Types

| Type | Description | Priority |
|------|-------------|----------|
| `order_created` | New order created | Medium |
| `order_updated` | Order status changed | Medium |
| `order_cancelled` | Order cancelled | High |
| `invoice_created` | Invoice generated | Medium |
| `invoice_paid` | Payment received | Medium |
| `invoice_overdue` | Payment overdue | High |
| `user_created` | New user account | Medium |
| `user_updated` | User info changed | Low |
| `user_deleted` | User removed | High |
| `inventory_low_stock` | Stock below threshold | High |
| `inventory_out_of_stock` | Product out of stock | Urgent |
| `inventory_restocked` | Stock replenished | Low |
| `payment_received` | Payment successful | Medium |
| `payment_failed` | Payment error | Urgent |
| `system_alert` | System notification | High |
| `system_update` | System maintenance | Medium |

## Getting Started

### 1. Start the Services

```bash
# Start all services including notification-service
docker-compose up -d

# Check service health
curl http://localhost:8004/health
```

### 2. Access the Notification Service

- **API Documentation**: http://localhost:8004/docs
- **Health Check**: http://localhost:8004/health
- **WebSocket**: ws://localhost:8004/api/v1/ws?token=YOUR_JWT_TOKEN

### 3. Frontend Integration

The notification bell is automatically integrated into the main header. It will:
- Connect to WebSocket on login
- Show unread count badge
- Display notifications dropdown
- Request browser notification permission

## API Endpoints

### REST API

#### Get User Notifications
```http
GET /api/v1/notifications/
Authorization: Bearer <token>
Query Parameters:
  - skip: int (default: 0)
  - limit: int (default: 50)
  - unread_only: bool (default: false)
```

#### Get Unread Count
```http
GET /api/v1/notifications/unread-count
Authorization: Bearer <token>
```

#### Create Notification
```http
POST /api/v1/notifications/
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "string",
  "title": "string",
  "message": "string",
  "type": "order_created",
  "priority": "medium",
  "metadata": {},
  "action_url": "/orders/123",
  "action_label": "View Order"
}
```

#### Mark as Read
```http
PATCH /api/v1/notifications/{id}/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
POST /api/v1/notifications/mark-all-read
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/v1/notifications/{id}
Authorization: Bearer <token>
```

### WebSocket API

#### Connection
```javascript
const ws = new WebSocket('ws://localhost:8004/api/v1/ws?token=YOUR_JWT_TOKEN');
```

#### Message Types

**From Server:**

```json
// New notification
{
  "type": "notification",
  "action": "created",
  "data": {
    "_id": "...",
    "title": "New Order Created",
    "message": "Order #12345 has been created",
    ...
  }
}

// Notification marked as read
{
  "type": "notification",
  "action": "read",
  "notification_id": "..."
}

// Heartbeat
{
  "type": "heartbeat"
}

// Connection confirmation
{
  "type": "connection",
  "message": "Connected to notification service"
}
```

**From Client:**

```json
// Heartbeat response
"ping"
```

## Integration Examples

### Backend Integration (Python)

#### 1. Create Notification Client

```python
# app/services/notification_client.py
import httpx
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class NotificationClient:
    def __init__(self, base_url: str = "http://notification-service:8004"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api/v1/notifications"
    
    async def send_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "custom",
        priority: str = "medium",
        metadata: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        auth_token: Optional[str] = None
    ) -> bool:
        try:
            headers = {}
            if auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            
            payload = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "priority": priority,
                "metadata": metadata,
                "action_url": action_url,
                "action_label": action_label
            }
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers=headers
                )
                
                return response.status_code == 201
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return False
```

#### 2. Use in Your Service

```python
# In your service initialization
notification_url = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8004")
self.notification_client = NotificationClient(notification_url)

# Send notification
await self.notification_client.send_notification(
    user_id=user_id,
    title="New Order Created",
    message=f"Order #{order_number} has been created successfully",
    notification_type="order_created",
    priority="medium",
    metadata={
        "order_id": order_id,
        "order_number": order_number,
        "total_amount": total
    },
    action_url=f"/orders/{order_id}",
    action_label="View Order"
)
```

### Frontend Integration (React)

#### 1. Use the Hook

```typescript
import { useNotifications } from '@/features/notifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      {notifications.map(notification => (
        <div key={notification._id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification._id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Configuration

### Environment Variables

**Notification Service:**
```bash
ENVIRONMENT=development
MONGODB_URL=mongodb://admin:password123@mongodb:27017/erp_notifications?authSource=admin
DATABASE_NAME=erp_notifications
AUTH_SERVICE_URL=http://auth-service:8001
SECRET_KEY=your-secret-key
SERVICE_PORT=8004
REDIS_URL=redis://redis:6379
WEBSOCKET_HEARTBEAT_INTERVAL=30
```

**Docker Compose:**
```yaml
notification-service:
  build: ./notification-service
  ports:
    - "8004:8004"
  environment:
    - NOTIFICATION_SERVICE_URL=http://notification-service:8004
  depends_on:
    - mongodb
    - auth-service
    - redis
```

**Frontend:**
```bash
VITE_NOTIFICATION_SERVICE_URL=http://localhost:8004
```

## Database Schema

### Notifications Collection

```javascript
{
  _id: ObjectId,
  user_id: String,
  title: String,
  message: String,
  type: String,  // NotificationType enum
  priority: String,  // NotificationPriority enum
  metadata: Object,
  action_url: String,
  action_label: String,
  is_read: Boolean,
  read_at: Date,
  created_at: Date,
  updated_at: Date
}
```

### Indexes

- `user_id` (ascending)
- `created_at` (descending)
- `user_id` + `is_read` (compound)
- `user_id` + `created_at` (compound)

## Testing

### 1. Test Backend API

```bash
# Get token
TOKEN=$(curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.access_token')

# Create notification
curl -X POST http://localhost:8004/api/v1/notifications/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "custom",
    "priority": "medium"
  }'

# Get notifications
curl http://localhost:8004/api/v1/notifications/ \
  -H "Authorization: Bearer $TOKEN"

# Get unread count
curl http://localhost:8004/api/v1/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test WebSocket

```javascript
// In browser console
const token = localStorage.getItem('token');
const ws = new WebSocket(`ws://localhost:8004/api/v1/ws?token=${token}`);

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('Error:', error);
ws.onclose = () => console.log('Disconnected');

// Send ping
ws.send('ping');
```

### 3. Test Frontend

1. Login to the application
2. Click the notification bell icon
3. Create a user or order
4. Verify notification appears in real-time
5. Check browser console for WebSocket connection status

## Troubleshooting

### WebSocket Connection Issues

**Problem:** WebSocket fails to connect

**Solutions:**
1. Verify JWT token is valid
2. Check notification service is running: `docker ps | grep notification`
3. Check logs: `docker logs erp-notification-service`
4. Verify CORS settings allow WebSocket connections
5. Check browser console for errors

### Notifications Not Appearing

**Problem:** Created events don't trigger notifications

**Solutions:**
1. Verify NOTIFICATION_SERVICE_URL environment variable is set
2. Check notification client is initialized in service
3. Verify notification sending logic is called
4. Check notification service logs for incoming requests
5. Verify user_id matches authenticated user

### High Memory Usage

**Problem:** Notification service using too much memory

**Solutions:**
1. Implement notification pruning (delete old read notifications)
2. Add pagination limits
3. Use Redis for caching instead of in-memory storage
4. Implement notification expiry

## Best Practices

1. **Always include metadata** - Add relevant context for debugging
2. **Use appropriate priority levels** - Don't overuse urgent/high
3. **Include action URLs** - Enable quick navigation
4. **Implement error handling** - Don't let notification failures break main flow
5. **Use async/await** - Don't block on notification sending
6. **Clean up old notifications** - Implement archival strategy
7. **Monitor WebSocket connections** - Track connection health
8. **Rate limit notifications** - Prevent spam

## Roadmap

- [ ] Email notifications for important events
- [ ] SMS notifications via Twilio
- [ ] Notification preferences per user
- [ ] Notification templates
- [ ] Notification categories and filtering
- [ ] Push notifications for mobile apps
- [ ] Notification scheduling
- [ ] Notification analytics

## Support

For issues or questions:
- Check logs: `docker logs erp-notification-service`
- Review API documentation: http://localhost:8004/docs
- Check MongoDB: http://localhost:8081 (mongo-express)

## License

Part of the ERP AI Microservices project.

