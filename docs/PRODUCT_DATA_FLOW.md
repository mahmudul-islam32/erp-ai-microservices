# Product Data Flow in ERP System

## Data Flow Example:

1. **New Product Creation** (Sales Service):
   ```
   POST /api/v1/products
   {
     "name": "New Laptop Model X",
     "sku": "LAP-X-001",
     "category": "Electronics",
     "unit_price": 1299.99,
     "cost_price": 800.00,
     "description": "High-performance laptop..."
   }
   ```

2. **Inventory Setup** (Inventory Service):
   ```
   POST /api/v1/inventory/items
   {
     "product_sku": "LAP-X-001",
     "warehouse_id": "WH-001",
     "initial_quantity": 50,
     "reorder_point": 10,
     "max_stock_level": 100
   }
   ```

3. **Stock Check During Sale** (Sales → Inventory):
   ```
   GET /api/v1/inventory/availability/LAP-X-001
   Response: { "available_quantity": 45, "reserved": 5 }
   ```

4. **Stock Reservation** (Sales → Inventory):
   ```
   POST /api/v1/inventory/reserve
   {
     "product_sku": "LAP-X-001",
     "quantity": 2,
     "sales_order_id": "SO-2024-001"
   }
   ```

## Integration Patterns:

### Pattern 1: Event-Driven (Recommended)
- Sales Service publishes "ProductCreated" event
- Inventory Service listens and creates stock record
- Loose coupling, better scalability

### Pattern 2: API Calls
- Sales Service calls Inventory Service API directly
- Tighter coupling but simpler implementation

### Pattern 3: Shared Database
- Both services access same product table
- Not recommended for microservices
