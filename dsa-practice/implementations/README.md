# DSA Implementations in ERP Project

This folder contains real-world implementations of DSA concepts in our ERP system.

## Day 1: Two Sum Implementations

### 1. Product Price Matcher (`erp-product-price-matcher.ts`)
**Concept**: Hash Maps for O(n) lookups
**Use Case**: Find products that can be combined to match a target price
**Features**:
- Find exact price matches
- Find products within price ranges
- Find closest price matches
- Get all possible combinations

### 2. Inventory Optimizer (`erp-inventory-optimizer.py`)
**Concept**: Two Sum for inventory management
**Use Case**: Find inventory items that can be combined to meet demand
**Features**:
- Find items by target quantity
- Find items by target value
- Find closest quantity matches
- Optimize order fulfillment

### 3. Sales Analytics (`erp-sales-analytics.py`)
**Concept**: Two Sum for sales pattern analysis
**Use Case**: Find sales combinations that meet targets
**Features**:
- Find transactions by target amount
- Daily sales combinations
- Salesperson performance pairs
- Customer purchase patterns
- Monthly target achievement analysis

### 4. Auth Permissions (`erp-auth-permissions.py`)
**Concept**: Two Sum for permission validation
**Use Case**: Validate if user roles can be combined for required permissions
**Features**:
- Find roles by target permission level
- Validate user permissions
- Find minimum role combinations
- Analyze permission gaps
- Optimize role assignments

## How to Use

### TypeScript (Frontend)
```typescript
import { ProductPriceMatcher } from './erp-product-price-matcher';

const matcher = new ProductPriceMatcher(products);
const result = matcher.findProductsByTargetPrice(1000);
```

### Python (Backend Services)
```python
from erp_inventory_optimizer import InventoryOptimizer

optimizer = InventoryOptimizer(inventory_items)
result = optimizer.find_items_by_target_quantity(100)
```

## Testing

Each implementation includes:
- Unit tests
- Example usage
- Performance benchmarks
- Edge case handling

## Performance Benefits

- **Time Complexity**: Reduced from O(n²) to O(n)
- **Space Trade-off**: Using hash maps for faster access
- **Scalability**: Better performance with large datasets
- **Real-world Application**: Practical use cases in ERP system

## Next Steps

1. Integrate these implementations into the main ERP codebase
2. Add comprehensive test coverage
3. Create performance benchmarks
4. Document API endpoints
5. Add monitoring and logging
