# 📦 Stock Management System Documentation

## Database Structure

### **1. Products Table** (`products` collection)

**Purpose**: Master product catalog with denormalized stock totals

**Stock Fields:**
```javascript
{
  _id: ObjectId,
  sku: String (unique),
  name: String,
  // ... other product fields ...
  
  // Denormalized stock totals (auto-calculated from inventory)
  totalQuantity: Number,      // Sum of all inventory.quantity
  reservedQuantity: Number,   // Sum of all inventory.reservedQuantity
  availableQuantity: Number,  // totalQuantity - reservedQuantity
}
```

### **2. Inventory Table** (`inventory` collection)

**Purpose**: Physical stock per warehouse

**Stock Fields:**
```javascript
{
  _id: ObjectId,
  productId: ObjectId (ref: Product),
  warehouseId: ObjectId (ref: Warehouse),
  
  // Warehouse-specific stock
  quantity: Number,              // Physical stock in this warehouse
  reservedQuantity: Number,      // Reserved for orders
  availableQuantity: Number,     // quantity - reservedQuantity
  averageCost: Number,
  
  // Optional tracking
  batchNumber: String,
  serialNumber: String,
  location: String,
}
```

**Unique Constraint:** `productId + warehouseId` (one record per product per warehouse)

### **3. Inventory Transactions Table** (`inventory_transactions` collection)

**Purpose**: Audit trail of all stock movements

```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  warehouseId: ObjectId,
  type: 'in' | 'out' | 'adjustment' | 'transfer',
  reason: 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | etc.,
  quantity: Number (positive for in, negative for out),
  balanceAfter: Number,
  performedBy: String (user ID),
  reference: String (order ID, PO number, etc.),
  notes: String,
  createdAt: Date
}
```

---

## Stock Update Flow

### **When an Order is Confirmed:**

```
┌─────────────────────────────────────────────────────────────────┐
│  USER CONFIRMS ORDER                                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Sales Service: confirm_order()                                  │
│  - For each product in order:                                    │
│    • Calls POST /inventory/fulfill                               │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Inventory Service: /inventory/fulfill                           │
│  - Calls adjustInventory() with negative quantity                │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Inventory Service: recordStockMovement()                        │
│                                                                   │
│  STEP 1: Update Inventory Table                                  │
│  ✓ inventory.quantity -= order_quantity                          │
│  ✓ inventory.availableQuantity = quantity - reservedQuantity     │
│  ✓ Save inventory record                                         │
│                                                                   │
│  STEP 2: Create Transaction Record                               │
│  ✓ Create inventory_transaction with:                            │
│    - type: 'adjustment'                                           │
│    - reason: 'sale'                                               │
│    - quantity: -X (negative)                                      │
│    - balanceAfter: new quantity                                   │
│                                                                   │
│  STEP 3: Update Products Table                                   │
│  ✓ Call recalculateProductTotals()                               │
│    - Aggregate all inventory records for product                 │
│    - Sum quantities across all warehouses                        │
│    - Update product.totalQuantity                                │
│    - Update product.reservedQuantity                             │
│    - Update product.availableQuantity                            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✅ BOTH TABLES UPDATED                                          │
│  - Inventory table: quantity reduced                             │
│  - Products table: totalQuantity updated                         │
│  - Transaction logged for audit                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### **Verify Product Stock**
```
GET /inventory/verify/{productId}
```

Returns:
```javascript
{
  "product": {
    "_id": "...",
    "name": "Product Name",
    "sku": "SKU123",
    "totalQuantity": 100,
    "reservedQuantity": 10,
    "availableQuantity": 90
  },
  "inventory": [
    {
      "warehouseId": "...",
      "quantity": 100,
      "reservedQuantity": 10,
      "availableQuantity": 90
    }
  ],
  "totalInventory": {
    "totalQuantity": 100,
    "reservedQuantity": 10,
    "availableQuantity": 90
  },
  "isConsistent": true,
  "message": "✅ Product and inventory data are consistent!"
}
```

### **Fulfill Stock (Reduce Inventory)**
```
POST /inventory/fulfill
```

Request:
```javascript
{
  "productId": "string",
  "warehouseId": "string (optional)",
  "quantity": 5,
  "orderId": "order_12345",
  "performedBy": "user_id",
  "notes": "Order fulfillment"
}
```

Response:
```javascript
{
  "inventory": { /* updated inventory record */ },
  "transaction": { /* transaction record */ },
  "success": true,
  "message": "Stock fulfilled successfully"
}
```

---

## Setup Instructions

### **1. Create Warehouse (if not exists)**

```bash
POST http://localhost:8002/warehouses
{
  "name": "Main Warehouse",
  "code": "MAIN",
  "address": "123 Main St",
  "isActive": true,
  "isDefault": true
}
```

### **2. Create Inventory Records for Products**

**For EACH product**, create an inventory record:

```bash
POST http://localhost:8002/inventory
{
  "productId": "your_product_id",
  "warehouseId": "your_warehouse_id",
  "quantity": 100,           # Initial stock
  "reservedQuantity": 0,
  "averageCost": 50.00,
  "reorderLevel": 10,
  "reorderQuantity": 50
}
```

**Important:** Without inventory records, stock cannot be reduced!

### **3. Verify Setup**

Check if product has inventory:
```bash
GET http://localhost:8002/inventory/verify/{productId}
```

---

## Testing the System

### **Test Flow:**

1. **Create an Order** with products that have inventory records
2. **Process Payment** (cash/card)
   - ✅ Verify payment status = "paid"
3. **Confirm the Order**
   - ✅ Watch logs for stock fulfillment messages
4. **Verify Stock Reduced**
   ```bash
   GET /inventory/verify/{productId}
   ```
   - Check inventory.quantity decreased
   - Check product.totalQuantity decreased

### **Watch Logs:**

```bash
docker-compose logs -f inventory-service
```

You'll see:
```
📦 Updating inventory table: {
  productId: '...',
  oldQuantity: 100,
  newQuantity: 95,
  change: -5,
  type: 'adjustment',
  reason: 'sale'
}
✅ Inventory table updated: Product ..., new quantity: 95
✅ Transaction recorded: ID ...
🔄 Now updating products table...
🔄 Recalculating product totals for product: ...
📊 Aggregated totals for product ...: {
  totalQuantity: 95,
  reservedQuantity: 0,
  availableQuantity: 95
}
✅ Product table updated successfully for Product Name (...)
   - Total Quantity: 95
   - Reserved: 0
   - Available: 95
```

---

## Troubleshooting

### **Stock Not Reducing?**

**Problem**: Inventory.quantity and product.totalQuantity not decreasing

**Most Common Causes:**

1. **No Inventory Records**
   - Solution: Create inventory records (see Setup #2 above)
   - Check: `GET /inventory/product/{productId}` - should return data

2. **Order Not Confirmed**
   - Stock only reduces when order status changes to "confirmed"
   - Solution: Click "Confirm Order" button after creating order

3. **Insufficient Stock**
   - Check error logs for "Insufficient available stock"
   - Solution: Add stock via adjustment endpoint

### **Check Consistency:**

```bash
GET /inventory/verify/{productId}
```

If `isConsistent: false`, the product totals don't match inventory totals.

---

## Database Queries (Direct MongoDB)

### Check Product Stock:
```javascript
db.products.find({ _id: ObjectId("...") }, {
  name: 1,
  sku: 1,
  totalQuantity: 1,
  reservedQuantity: 1,
  availableQuantity: 1
})
```

### Check Inventory Records:
```javascript
db.inventory.find({ productId: ObjectId("...") }, {
  warehouseId: 1,
  quantity: 1,
  reservedQuantity: 1,
  availableQuantity: 1
})
```

### Check Recent Transactions:
```javascript
db.inventory_transactions.find({ 
  productId: ObjectId("...") 
}).sort({ createdAt: -1 }).limit(10)
```

---

## Architecture Notes

### **Why Two Tables?**

1. **Inventory Table (Detailed)**
   - Tracks stock per warehouse
   - Source of truth for physical stock
   - Supports multi-warehouse operations

2. **Products Table (Summary)**
   - Denormalized totals for quick queries
   - Avoids joins in product listings
   - Updated automatically via `recalculateProductTotals()`

### **Transaction Type Flow:**

- **IN**: Add stock (purchases, returns)
- **OUT**: Remove stock (sales, damage)
- **ADJUSTMENT**: Manual corrections (positive or negative)
- **TRANSFER**: Move between warehouses

---

## API Documentation

Full API documentation available at:
- **Swagger UI**: http://localhost:8002/docs
- **GraphQL Playground**: http://localhost:8002/graphql

---

**Last Updated:** 2025-10-07
**Version:** 1.0.0

