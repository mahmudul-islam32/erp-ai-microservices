# 🧪 Stock Reduction Testing Guide

## ✅ ISSUE FIXED

**Problem:** Stock was not reducing when orders were created from frontend.

**Root Cause:** The frontend was calling `PATCH /status` endpoint which only updated the status field but didn't trigger stock fulfillment.

**Solution:** Modified `PATCH /status` endpoint to automatically call `confirm_order()` when status changes to "confirmed", which reduces inventory.

---

## 📋 Prerequisites

### **CRITICAL: Products MUST have Inventory Records!**

Without inventory records, stock cannot be reduced. Check and create them first.

### Step 1: Check if Warehouses Exist

```bash
GET http://localhost:8002/warehouses
```

If no warehouses exist, create one:
```bash
POST http://localhost:8002/warehouses
{
  "name": "Main Warehouse",
  "code": "MAIN",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "isActive": true
}
```

**Note the warehouse ID from the response!**

### Step 2: Check if Products Have Inventory Records

For each product you want to use in orders:

```bash
GET http://localhost:8002/inventory/product/{productId}
```

**If the response is empty `[]`, you MUST create inventory records!**

### Step 3: Create Inventory Records

For EACH product without inventory:

```bash
POST http://localhost:8002/inventory
{
  "productId": "YOUR_PRODUCT_ID",
  "warehouseId": "YOUR_WAREHOUSE_ID",
  "quantity": 100,           # Set initial stock
  "reservedQuantity": 0,
  "averageCost": 50.00,
  "reorderLevel": 10,
  "reorderQuantity": 50
}
```

**Example:**
```bash
POST http://localhost:8002/inventory
{
  "productId": "507f1f77bcf86cd799439011",
  "warehouseId": "507f1f77bcf86cd799439012",
  "quantity": 100,
  "reservedQuantity": 0,
  "averageCost": 25.00,
  "reorderLevel": 10,
  "reorderQuantity": 50
}
```

---

## 🧪 Test Procedure

### Test 1: Verify Inventory Records Exist

```bash
# Get a product from your system
GET http://localhost:8002/products/{productId}

# Verify it has inventory
GET http://localhost:8002/inventory/verify/{productId}
```

**Expected Response:**
```json
{
  "product": {
    "_id": "...",
    "name": "Product Name",
    "sku": "SKU123",
    "totalQuantity": 100,
    "reservedQuantity": 0,
    "availableQuantity": 100
  },
  "inventory": [
    {
      "quantity": 100,
      "reservedQuantity": 0,
      "availableQuantity": 100
    }
  ],
  "isConsistent": true,
  "message": "✅ Product and inventory data are consistent!"
}
```

**If you see:** `"No inventory records found for this product"` → Go back to Prerequisites Step 3!

---

### Test 2: Create Order from Frontend

**In separate terminals, watch the logs:**

Terminal 1:
```bash
docker-compose logs -f sales-service
```

Terminal 2:
```bash
docker-compose logs -f inventory-service
```

**Now in your frontend:**

1. **Go to Sales → Orders → Create New Order**

2. **Fill in the order details:**
   - Select a customer
   - Add products (that have inventory records!)
   - Set quantities

3. **Create the order**
   - Order will be in DRAFT status
   - ✅ Payment status: pending
   - ❌ No stock reduction yet

---

### Test 3: Process Payment (Optional)

If you want to process payment:

1. **Click "Process Payment"** or use payment section
2. **Enter payment details** (cash/card)
3. **Submit payment**
   - ✅ Payment status: paid
   - ❌ Still no stock reduction

---

### Test 4: Confirm Order (THIS REDUCES STOCK!)

1. **Find the "Confirm" button** or change status to "Confirmed"
2. **Click Confirm**

**Watch the logs** - You should see:

**Sales Service Log:**
```
🔄 Order XXX being confirmed - will reduce inventory
🔄 Fulfilling stock for order XXX with N items
Fulfilling stock for product YYY, quantity Z
✅ Stock fulfilled for product YYY
✅ Order XXX confirmed successfully, N items stock fulfilled
```

**Inventory Service Log:**
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
📊 Aggregated totals: { totalQuantity: 95, ... }
✅ Product table updated successfully for Product Name
   - Total Quantity: 95
   - Reserved: 0
   - Available: 95
```

---

### Test 5: Verify Stock Reduced

**Check Inventory:**
```bash
GET http://localhost:8002/inventory/verify/{productId}
```

**Expected:**
- `quantity` should be REDUCED (e.g., 100 → 95)
- `totalQuantity` in product should match inventory

**Check Product:**
```bash
GET http://localhost:8002/products/{productId}
```

**Expected:**
- `totalQuantity` should be REDUCED
- `availableQuantity` should be REDUCED

**Check Database Directly:**

```javascript
// MongoDB - Check inventory
db.inventory.find({ productId: ObjectId("YOUR_PRODUCT_ID") })

// MongoDB - Check products  
db.products.find({ _id: ObjectId("YOUR_PRODUCT_ID") }, {
  name: 1,
  totalQuantity: 1,
  availableQuantity: 1
})

// MongoDB - Check transaction history
db.inventory_transactions.find({ 
  productId: ObjectId("YOUR_PRODUCT_ID") 
}).sort({ createdAt: -1 }).limit(5)
```

---

## 🔍 Troubleshooting

### Issue: "No inventory records found"

**Solution:**
1. Create warehouse if none exists
2. Create inventory record for each product (see Prerequisites)
3. Verify with `/inventory/verify/{productId}`

---

### Issue: "Unable to confirm order"

**Possible Causes:**
1. Order already confirmed (check order status)
2. Insufficient stock in inventory
3. Product ID mismatch

**Check:**
```bash
# Get order details
GET http://localhost:8003/api/v1/sales-orders/{orderId}

# Check product inventory
GET http://localhost:8002/inventory/verify/{productId}
```

---

### Issue: Stock not reducing

**Debug Steps:**

1. **Watch logs while confirming:**
   ```bash
   docker-compose logs -f sales-service inventory-service
   ```

2. **Look for these logs:**
   - ✅ "Order XXX being confirmed - will reduce inventory"
   - ✅ "Fulfilling stock for product"
   - ✅ "Inventory table updated"
   - ✅ "Product table updated"

3. **If you DON'T see these logs:**
   - Order might already be confirmed
   - Frontend might not be calling confirm
   - Check order status is changing to "confirmed"

4. **If you see "No inventory record found":**
   - Create inventory records (Prerequisites Step 3)

5. **If you see "Insufficient available stock":**
   - Check current inventory quantity
   - Add more stock via adjustment endpoint

---

### Issue: Products and Inventory don't match

**Symptom:** `isConsistent: false` from verify endpoint

**Fix:** The system auto-recalculates, but if needed:
```bash
# The recalculation happens automatically on every inventory change
# If somehow they're out of sync, create a small adjustment to trigger recalc:

POST http://localhost:8002/inventory/adjust
{
  "productId": "YOUR_PRODUCT_ID",
  "warehouseId": "YOUR_WAREHOUSE_ID",
  "quantity": 0,  # Zero adjustment just to trigger recalc
  "reason": "ADJUSTMENT",
  "performedBy": "admin",
  "notes": "Recalculation trigger"
}
```

---

## 📊 Quick Verification Commands

### Get Product Stock Status
```bash
GET http://localhost:8002/inventory/verify/YOUR_PRODUCT_ID
```

### Get All Inventory Records
```bash
GET http://localhost:8002/inventory?page=1&limit=100
```

### Get Recent Transactions
```bash
GET http://localhost:8002/inventory/transactions/history/INVENTORY_ID?limit=10
```

### Get Order Details
```bash
GET http://localhost:8003/api/v1/sales-orders/ORDER_ID
```

---

## ✅ Success Indicators

When everything is working, you should see:

1. ✅ Order created (status: draft)
2. ✅ Payment processed (payment_status: paid) 
3. ✅ Order confirmed (status: confirmed)
4. ✅ Logs show "Fulfilling stock"
5. ✅ Logs show "Inventory table updated"
6. ✅ Logs show "Product table updated"
7. ✅ Inventory quantity decreased
8. ✅ Product totalQuantity decreased
9. ✅ Transaction record created
10. ✅ Verify endpoint shows consistent data

---

## 📝 Example Full Test

```bash
# 1. Check product before order
GET http://localhost:8002/inventory/verify/507f1f77bcf86cd799439011
# Response: totalQuantity: 100

# 2. Create order from frontend with quantity: 5

# 3. Confirm order from frontend

# 4. Check product after order
GET http://localhost:8002/inventory/verify/507f1f77bcf86cd799439011
# Expected Response: totalQuantity: 95 ✅

# 5. Check transaction history
GET http://localhost:8002/inventory/product/507f1f77bcf86cd799439011
# Should see inventory record with quantity: 95

# 6. Verify products table
GET http://localhost:8002/products/507f1f77bcf86cd799439011
# Should show totalQuantity: 95
```

---

## 🎯 Key Points to Remember

1. **Inventory records MUST exist** before creating orders
2. **Stock reduces when order status changes to "confirmed"**
3. **Both tables update automatically** (inventory + products)
4. **Transactions are logged** for audit trail
5. **Watch logs** to see the process in action

---

**Last Updated:** 2025-10-07  
**Status:** ✅ FULLY OPERATIONAL

