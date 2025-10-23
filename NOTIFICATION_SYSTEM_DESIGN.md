# 🔔 Notification System - Design & User Targeting

## 📐 **System Architecture**

### **Core Design Principle**
The notification system is **user-targeted** - each notification is sent to a **specific user_id**. This ensures:
- ✅ Privacy - Users only see their own notifications
- ✅ Security - JWT authentication required
- ✅ Scalability - Notifications stored per user
- ✅ Real-time - WebSocket delivers only to relevant users

---

## 👥 **Current User Targeting Logic**

### **1. Order Created** 
**File:** `sales-service/app/services/sales_order_service.py` (Lines 190-207)

**Current Logic:**
```python
# WHO RECEIVES: Sales rep OR order creator
notification_user_id = order_data.sales_rep_id if order_data.sales_rep_id else user_id

await self.notification_client.send_notification(
    user_id=notification_user_id,  # ONLY ONE USER
    title="New Order Created",
    message=f"Order {order_number} has been created for {customer_name}. Total: ${total}",
    ...
)
```

**Current Behavior:**
- ✅ If order has a **sales_rep_id** → Sales rep gets notification
- ✅ If NO sales_rep_id → Order **creator** gets notification
- ❌ **Customer does NOT get notification** (not implemented)
- ❌ **Managers do NOT get notification** (not implemented)

---

### **2. Order Status Updated**
**File:** `sales-service/app/services/sales_order_service.py` (Lines 323-352)

**Current Logic:**
```python
# WHO RECEIVES: Order creator
created_by = existing_order.get("created_by")
if created_by:
    await self.notification_client.send_notification(
        user_id=created_by,  # ONLY order creator
        title="Order Status Updated",
        message=f"Order {order_number} status changed from {old_status} to {new_status}",
        ...
    )
```

**Current Behavior:**
- ✅ **Order creator** gets notification when status changes
- ❌ Sales rep does NOT get notified
- ❌ Customer does NOT get notified

---

### **3. Invoice Created**
**File:** `sales-service/app/services/invoice_service.py` (Lines 80-98)

**Current Logic:**
```python
# WHO RECEIVES: Invoice creator
await self.notification_client.send_notification(
    user_id=user_id,  # Creator only
    title="Invoice Created",
    ...
)
```

---

### **4. Payment Received**
**File:** `sales-service/app/services/payment_service.py` (Lines 145-164)

**Current Logic:**
```python
# WHO RECEIVES: Cashier/Payment processor
await self.notification_client.send_notification(
    user_id=user_id,  # Payment processor
    title="Payment Received",
    ...
)
```

---

### **5. User Created**
**File:** `auth-service/app/services/user_service.py` (Lines 63-76)

**Current Logic:**
```python
# WHO RECEIVES: The new user themselves
await self.notification_client.send_notification(
    user_id=user_id,  # THE NEW USER
    title="Welcome to the ERP System",
    message=f"Your account has been created...",
    ...
)
```

---

### **6. User Updated/Deleted**
**File:** `auth-service/app/services/user_service.py`

**Current Logic:**
- User gets notified about their OWN account changes

---

### **7. Stock Alerts**
**File:** `inventory-service/src/inventory/inventory.service.ts` (Lines 267-327)

**Current Logic:**
```typescript
// WHO RECEIVES: User who performed the stock transaction
await this.notificationClient.sendNotification({
    user_id: userId,  // Person who adjusted stock
    title: 'Low Stock Alert',
    ...
});
```

---

## 🎯 **Design Summary**

### **Current Design Pattern:**
```
Event happens → Notification sent to DIRECTLY INVOLVED USER
```

### **Who Gets Notifications:**

| Event | Current Recipients | NOT Notified |
|-------|-------------------|--------------|
| Order Created | Sales rep OR creator | Customer, managers, warehouse |
| Order Updated | Creator | Sales rep, customer, managers |
| Invoice Created | Creator | Customer, accounting team |
| Payment Received | Payment processor | Sales rep, customer, managers |
| User Created | New user | Admin who created them |
| User Updated | The user | Admin who updated them |
| Stock Alert | Stock adjuster | Warehouse managers, buyers |

---

## 🔄 **How to Customize User Targeting**

### **Option 1: Notify Multiple Users**

**Use the bulk notification method:**

```python
# Example: Notify ALL managers about new order
from app.services.notification_client import NotificationClient

notification_client = NotificationClient()

# Get all manager user IDs
manager_ids = await get_all_managers()  # You'd implement this

# Send to all
await notification_client.send_bulk_notification(
    user_ids=manager_ids,
    title="New Order Created",
    message=f"Order #{order_number} needs approval",
    notification_type="order_created",
    priority="medium"
)
```

### **Option 2: Notify Based on Roles**

**Add a helper function to get users by role:**

```python
# In auth-service or as a shared utility
async def get_users_by_role(role: str) -> List[str]:
    """Get all user IDs with a specific role"""
    db = get_database()
    users = await db.users.find({"role": role, "status": "active"}).to_list()
    return [str(user["_id"]) for user in users]

# Usage in sales service
manager_ids = await get_users_by_role("manager")
await notification_client.send_bulk_notification(
    user_ids=manager_ids,
    title="High Value Order",
    message=f"Order #{order_number} for ${total}",
    ...
)
```

### **Option 3: Notify Based on Business Rules**

```python
# Example: Notify different users based on order value
async def notify_order_created(order, user_id):
    notification_client = NotificationClient()
    
    recipients = []
    
    # Always notify creator
    recipients.append(user_id)
    
    # Notify sales rep if assigned
    if order.sales_rep_id:
        recipients.append(order.sales_rep_id)
    
    # Notify managers for high-value orders
    if order.total_amount > 10000:
        managers = await get_users_by_role("manager")
        recipients.extend(managers)
    
    # Send to all recipients
    for recipient_id in set(recipients):  # Remove duplicates
        await notification_client.send_notification(
            user_id=recipient_id,
            title="New Order Created",
            message=f"Order {order.order_number} - ${order.total_amount}",
            ...
        )
```

---

## 🎯 **Recommended Improvements**

### **For Order Created:**

```python
# File: sales-service/app/services/sales_order_service.py
# Line ~190

# Current (sends to ONE user):
notification_user_id = order_data.sales_rep_id if order_data.sales_rep_id else user_id

# IMPROVED (sends to multiple users):
recipients = []

# 1. Notify the creator
recipients.append(user_id)

# 2. Notify the sales rep if different from creator
if order_data.sales_rep_id and order_data.sales_rep_id != user_id:
    recipients.append(order_data.sales_rep_id)

# 3. Notify managers for orders above threshold
if order_total > 5000:  # High value threshold
    # Get managers from auth service
    managers = await get_users_by_role("manager")  # You'd need to implement this
    recipients.extend(managers)

# Send to all recipients
for recipient_id in set(recipients):
    await self.notification_client.send_notification(
        user_id=recipient_id,
        title="New Order Created",
        message=f"Order {order_number} for {customer_name}. Total: ${order_total:.2f}",
        notification_type="order_created",
        priority="high" if order_total > 5000 else "medium",
        ...
    )
```

---

## 📊 **Notification Targeting Patterns**

### **Pattern 1: Personal Actions** (Current Default)
```
User creates order → User gets notification
```
**Good for:** Confirmations, receipts, personal tracking

### **Pattern 2: Role-Based Broadcasting**
```
Order created → ALL sales managers get notification
Low stock → ALL warehouse managers get notification
```
**Good for:** Team alerts, department notifications

### **Pattern 3: Hierarchical Notifications**
```
Order < $1000 → Sales rep only
Order $1000-$10000 → Sales rep + manager
Order > $10000 → Sales rep + manager + director
```
**Good for:** Approval workflows, escalations

### **Pattern 4: Customer Notifications**
```
Order created → Customer gets confirmation
Order shipped → Customer gets tracking notification
Payment received → Customer gets receipt
```
**Good for:** Customer engagement, transparency

---

## 🛠️ **Implementation Example: Multi-User Notifications**

Let me show you how to modify the order notification to send to multiple users:

### **Step 1: Create a helper function**

Create: `sales-service/app/services/notification_helper.py`

```python
from typing import List
import httpx
import logging

logger = logging.getLogger(__name__)

async def get_users_by_role(role: str, auth_service_url: str, token: str) -> List[str]:
    """Get all active user IDs with a specific role"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{auth_service_url}/api/v1/users/",
                headers={"Authorization": f"Bearer {token}"},
                params={"role": role, "status": "active"}
            )
            
            if response.status_code == 200:
                users = response.json()
                return [user.get("id") or user.get("_id") for user in users]
    except Exception as e:
        logger.error(f"Error fetching users by role: {e}")
    
    return []

async def notify_order_stakeholders(
    notification_client,
    order_data,
    order_number: str,
    customer_name: str,
    order_total: float,
    creator_id: str,
    sales_rep_id: str = None,
    auth_service_url: str = "http://auth-service:8001",
    token: str = None
):
    """Send order notification to all relevant stakeholders"""
    recipients = set()  # Use set to avoid duplicates
    
    # 1. Always notify creator
    recipients.add(creator_id)
    
    # 2. Notify sales rep if assigned and different from creator
    if sales_rep_id and sales_rep_id != creator_id:
        recipients.add(sales_rep_id)
    
    # 3. Notify managers for high-value orders
    if order_total >= 5000 and token:
        managers = await get_users_by_role("manager", auth_service_url, token)
        recipients.update(managers)
    
    # Send to all recipients
    for user_id in recipients:
        priority = "high" if order_total >= 5000 else "medium"
        
        await notification_client.send_notification(
            user_id=user_id,
            title="New Order Created" if order_total < 5000 else "High-Value Order Created",
            message=f"Order {order_number} for {customer_name}. Total: ${order_total:.2f}",
            notification_type="order_created",
            priority=priority,
            metadata={
                "order_number": order_number,
                "customer_name": customer_name,
                "total_amount": order_total,
                "high_value": order_total >= 5000
            },
            action_url=f"/sales/orders/{order_data.id}",
            action_label="View Order"
        )
```

### **Step 2: Use it in sales_order_service.py**

```python
# Replace lines 188-207 with:
from app.services.notification_helper import notify_order_stakeholders
from app.config import settings

try:
    await notify_order_stakeholders(
        notification_client=self.notification_client,
        order_data=created_order,
        order_number=order_number,
        customer_name=created_order['customer_name'],
        order_total=order_total,
        creator_id=user_id,
        sales_rep_id=order_data.sales_rep_id,
        auth_service_url=settings.auth_service_url,
        token=token  # Pass the auth token
    )
except Exception as e:
    logger.warning(f"Failed to send order notifications: {e}")
```

---

## 🎯 **Current Implementation (As Built)**

### **When Order is Created:**

```python
# Current code in sales_order_service.py (line 190):
notification_user_id = order_data.sales_rep_id if order_data.sales_rep_id else user_id
```

**Scenario Examples:**

#### Scenario 1: Order with Sales Rep
```
User: John (ID: 123) creates order
Sales Rep: Sarah (ID: 456)

→ NOTIFICATION SENT TO: Sarah (456) ONLY
→ John does NOT get notification
```

#### Scenario 2: Order without Sales Rep
```
User: John (ID: 123) creates order
Sales Rep: None

→ NOTIFICATION SENT TO: John (123) ONLY
→ No one else gets notification
```

---

## 🔄 **How to Change Who Gets Notified**

### **Quick Fix: Notify BOTH Creator and Sales Rep**

**File:** `sales-service/app/services/sales_order_service.py`

**Find this code (around line 188-207):**
```python
# Send notification to sales rep or creator
try:
    notification_user_id = order_data.sales_rep_id if order_data.sales_rep_id else user_id
    await self.notification_client.send_notification(
        user_id=notification_user_id,
        ...
    )
```

**Replace with:**
```python
# Send notification to ALL relevant users
try:
    recipients = set()  # Use set to avoid duplicates
    
    # 1. Always notify the creator
    recipients.add(user_id)
    
    # 2. Notify sales rep if assigned
    if order_data.sales_rep_id:
        recipients.add(order_data.sales_rep_id)
    
    # Send to all recipients
    for recipient_id in recipients:
        await self.notification_client.send_notification(
            user_id=recipient_id,
            title="New Order Created",
            message=f"Order {order_number} has been created for {created_order['customer_name']}. Total: ${order_total:.2f}",
            notification_type="order_created",
            priority="medium",
            metadata={
                "order_id": str(created_order["_id"]),
                "order_number": order_number,
                "customer_name": created_order['customer_name'],
                "total_amount": order_total
            },
            action_url=f"/sales/orders/{created_order['_id']}",
            action_label="View Order"
        )
```

---

## 🎨 **Advanced Notification Scenarios**

### **Scenario 1: Notify Customers**

```python
# After creating order, notify customer
if customer.user_id:  # If customer has a user account
    await self.notification_client.send_notification(
        user_id=customer.user_id,
        title="Order Confirmation",
        message=f"Your order {order_number} has been placed. Total: ${order_total:.2f}",
        notification_type="order_created",
        priority="medium",
        action_url=f"/my-orders/{order_id}",
        action_label="Track Order"
    )
```

### **Scenario 2: Notify Department/Team**

```python
# Notify entire sales team for large orders
if order_total >= 10000:
    # Get all sales staff
    sales_team = await get_users_by_role("sales_rep")
    sales_managers = await get_users_by_role("manager")
    
    all_recipients = sales_team + sales_managers
    
    await notification_client.send_bulk_notification(
        user_ids=all_recipients,
        title="High-Value Order Alert",
        message=f"Large order {order_number} created: ${order_total:.2f}",
        notification_type="order_created",
        priority="high"
    )
```

### **Scenario 3: Conditional Notifications**

```python
# Notify based on conditions
if order.priority == "urgent":
    # Notify managers immediately
    managers = await get_users_by_role("manager")
    for manager_id in managers:
        await notification_client.send_notification(
            user_id=manager_id,
            title="Urgent Order Requires Attention",
            message=f"URGENT: Order {order_number} for {customer_name}",
            priority="urgent"
        )

if order.status == "cancelled":
    # Notify both creator and sales rep
    await notify_multiple([creator_id, sales_rep_id], ...)
```

---

## 📋 **Complete Notification Flow**

### **Current Flow:**
```
1. User creates order
   ↓
2. sales_order_service.create_order() executes
   ↓
3. Order saved to database
   ↓
4. notification_client.send_notification() called
   ↓
5. HTTP POST to notification-service
   ↓
6. Notification saved to MongoDB
   ↓
7. WebSocket sends to connected user
   ↓
8. Frontend receives and displays
   ↓
9. Bell icon updates with badge
```

---

## 🔧 **How to Add New Notification Types**

### **Example: Notify Customer When Order Ships**

**File:** `sales-service/app/services/sales_order_service.py`

**In the `update_order_status` function, add:**

```python
# After updating status to "shipped"
if new_status == "shipped" and existing_order:
    # Notify customer if they have a user account
    customer = await customer_service.get_customer_by_id(
        existing_order.get("customer_id")
    )
    
    if customer and customer.user_id:
        await self.notification_client.send_notification(
            user_id=customer.user_id,
            title="Your Order Has Shipped!",
            message=f"Order {order_number} is on its way. Track your shipment.",
            notification_type="order_updated",
            priority="medium",
            metadata={
                "order_number": order_number,
                "status": "shipped",
                "tracking_number": existing_order.get("tracking_number")
            },
            action_url=f"/track-order/{order_id}",
            action_label="Track Shipment"
        )
```

---

## 🎯 **Best Practices**

### **1. Avoid Notification Spam**
```python
# BAD: Notify everyone for everything
all_users = await get_all_users()
await send_to_all(all_users, ...)  # ❌ Spam!

# GOOD: Notify only relevant users
relevant_users = [creator, assigned_rep, manager_if_needed]
await send_to_relevant(relevant_users, ...)  # ✅ Targeted
```

### **2. Use Priority Appropriately**
```python
# urgent: Only for critical issues
priority="urgent"  # Out of stock, payment failed, system error

# high: Important but not critical  
priority="high"  # High-value orders, low stock, cancellations

# medium: Standard notifications
priority="medium"  # Order created, invoice created, status updates

# low: Informational
priority="low"  # Stock restocked, minor updates
```

### **3. Include Metadata**
```python
metadata={
    "order_id": order_id,
    "order_number": order_number,
    "customer_name": customer_name,
    "total_amount": total,
    "created_by": user_id,
    "sales_rep_id": sales_rep_id,
    # Anything useful for filtering/reporting later
}
```

---

## 🚀 **Quick Implementation Guide**

### **To Notify Multiple Users for Orders:**

1. **Open:** `sales-service/app/services/sales_order_service.py`

2. **Find:** Line ~190 (the notification code)

3. **Replace with:**
```python
# Send notification to creator AND sales rep
try:
    recipients = []
    
    # Always notify creator
    recipients.append(user_id)
    
    # Also notify sales rep if assigned
    if order_data.sales_rep_id and order_data.sales_rep_id != user_id:
        recipients.append(order_data.sales_rep_id)
    
    # Send to each recipient
    for recipient_id in recipients:
        await self.notification_client.send_notification(
            user_id=recipient_id,
            title="New Order Created",
            message=f"Order {order_number} has been created for {created_order['customer_name']}. Total: ${order_total:.2f}",
            notification_type="order_created",
            priority="medium",
            metadata={
                "order_id": str(created_order["_id"]),
                "order_number": order_number,
                "customer_name": created_order['customer_name'],
                "total_amount": order_total,
                "created_by": user_id,
                "sales_rep_id": order_data.sales_rep_id
            },
            action_url=f"/sales/orders/{created_order['_id']}",
            action_label="View Order"
        )
except Exception as e:
    logger.warning(f"Failed to send order notifications: {e}")
```

4. **Restart service:**
```bash
docker-compose restart sales-service
```

---

## 📊 **Summary Table**

| Feature | Current | Recommended |
|---------|---------|-------------|
| Order created | Sales rep OR creator | Creator AND sales rep |
| High-value order | Same as regular | + Managers |
| Order updated | Creator only | Creator AND sales rep |
| Order shipped | Creator only | Creator AND customer |
| Invoice created | Creator only | Creator AND accounting |
| Payment received | Cashier only | Cashier AND sales rep |
| Low stock | Stock adjuster | Warehouse team + buyers |

---

## 🎉 **Current Answer to Your Question**

### **"When I create an order, who will see the notification?"**

**Current behavior:**
- If you assigned a **sales rep** → **Sales rep gets notification** (you don't)
- If you did NOT assign a sales rep → **You get notification**

**To change this:**
Use the code example above to notify BOTH creator and sales rep (or more users).

---

## 💡 **Want Me to Implement Multi-User Notifications?**

I can update the code right now to:
- ✅ Notify both creator AND sales rep
- ✅ Notify managers for high-value orders
- ✅ Notify customers when orders ship
- ✅ Notify warehouse team for stock alerts

Just let me know which notifications you want to send to multiple users!

