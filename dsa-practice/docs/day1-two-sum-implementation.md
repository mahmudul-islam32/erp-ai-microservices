# Day 1: Two Sum Implementation in ERP Project

## Problem Overview
The Two Sum problem teaches us about hash maps and time complexity optimization. We'll implement this concept in our ERP system for efficient data lookups and calculations.

## ERP Use Cases

### 1. Product Price Matching
**Feature**: Find products that can be combined to match a target price
**Location**: `erp-frontend/src/services/inventory.ts`
**Use Case**: When creating bundles or finding complementary products

```typescript
// Find products that sum to a target price
export const findProductsByTargetPrice = (products: Product[], targetPrice: number) => {
  const priceMap = new Map<number, string>();
  
  for (let i = 0; i < products.length; i++) {
    const complement = targetPrice - products[i].price;
    if (priceMap.has(complement)) {
      return [priceMap.get(complement)!, products[i].id];
    }
    priceMap.set(products[i].price, products[i].id);
  }
  return [];
};
```

### 2. Inventory Level Optimization
**Feature**: Find inventory items that can be combined to meet demand
**Location**: `inventory-service/src/inventory/inventory.service.ts`
**Use Case**: When checking if we can fulfill an order with multiple products

```typescript
// Check if we can fulfill order with available inventory
export const canFulfillOrder = (inventory: InventoryItem[], requiredQuantity: number) => {
  const quantityMap = new Map<number, string>();
  
  for (let i = 0; i < inventory.length; i++) {
    const complement = requiredQuantity - inventory[i].quantity;
    if (quantityMap.has(complement)) {
      return {
        canFulfill: true,
        items: [quantityMap.get(complement)!, inventory[i].id]
      };
    }
    quantityMap.set(inventory[i].quantity, inventory[i].id);
  }
  return { canFulfill: false, items: [] };
};
```

### 3. Sales Target Achievement
**Feature**: Find sales combinations that meet monthly targets
**Location**: `sales-service/app/services/sales_analytics.py`
**Use Case**: When analyzing which product combinations contribute to sales goals

```python
def find_sales_combinations(sales_data, target_amount):
    """
    Find two sales that sum to target amount using hash map approach
    """
    sales_map = {}
    for i, sale in enumerate(sales_data):
        complement = target_amount - sale['amount']
        if complement in sales_map:
            return [sales_map[complement], i]
        sales_map[sale['amount']] = i
    return []
```

### 4. User Role Permission Validation
**Feature**: Check if two user roles can be combined for specific permissions
**Location**: `auth-service/app/services/user_service.py`
**Use Case**: When validating if a user has sufficient permissions through role combinations

```python
def validate_role_combination(user_roles, required_permission_level):
    """
    Check if any two roles can be combined to meet permission requirements
    """
    role_map = {}
    for i, role in enumerate(user_roles):
        complement = required_permission_level - role['permission_level']
        if complement in role_map:
            return True, [role_map[complement], i]
        role_map[role['permission_level']] = i
    return False, []
```

## Implementation Benefits

### Performance Improvements
- **Time Complexity**: Reduced from O(n²) to O(n) for lookups
- **Space Trade-off**: Using hash maps for faster access
- **Scalability**: Better performance with large datasets

### Real-world Applications
1. **Product Recommendations**: Find complementary products
2. **Inventory Management**: Optimize stock levels
3. **Sales Analytics**: Analyze sales patterns
4. **User Management**: Validate permissions efficiently

## Testing Strategy

### Unit Tests
```typescript
describe('TwoSumSolver', () => {
  test('should find correct indices for valid input', () => {
    const nums = [2, 7, 11, 15];
    const target = 9;
    expect(TwoSumSolver.hashMap(nums, target)).toEqual([0, 1]);
  });

  test('should return empty array for no solution', () => {
    const nums = [1, 2, 3];
    const target = 7;
    expect(TwoSumSolver.hashMap(nums, target)).toEqual([]);
  });
});
```

### Integration Tests
- Test product price matching with real product data
- Test inventory fulfillment with actual inventory levels
- Test sales analytics with historical sales data

## Next Steps
1. Implement the product price matching feature
2. Add inventory optimization logic
3. Create sales analytics dashboard
4. Add comprehensive test coverage
5. Document performance benchmarks

## Learning Outcomes
- Understanding of hash map data structure
- Time complexity analysis (O(n) vs O(n²))
- Real-world application of DSA concepts
- Performance optimization techniques
