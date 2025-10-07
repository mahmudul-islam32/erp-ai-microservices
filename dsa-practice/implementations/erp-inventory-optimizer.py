# ERP Inventory Optimizer - Real Implementation
# This file demonstrates how Two Sum concept is used in our ERP system

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class InventoryItem:
    id: str
    name: str
    quantity: int
    unit_price: float
    category: str
    in_stock: bool

@dataclass
class InventoryMatchResult:
    found: bool
    items: List[InventoryItem]
    total_quantity: int
    total_value: float
    difference: int

class InventoryOptimizer:
    def __init__(self, inventory_items: List[InventoryItem]):
        self.inventory_items = inventory_items

    def find_items_by_target_quantity(self, target_quantity: int) -> InventoryMatchResult:
        """
        Find two inventory items that sum to target quantity using Two Sum algorithm
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        quantity_map = {}
        
        for item in self.inventory_items:
            if not item.in_stock:
                continue
                
            complement = target_quantity - item.quantity
            if complement in quantity_map:
                complement_item = quantity_map[complement]
                total_quantity = complement_item.quantity + item.quantity
                total_value = complement_item.unit_price * complement_item.quantity + item.unit_price * item.quantity
                
                return InventoryMatchResult(
                    found=True,
                    items=[complement_item, item],
                    total_quantity=total_quantity,
                    total_value=total_value,
                    difference=0
                )
            quantity_map[item.quantity] = item

        return InventoryMatchResult(
            found=False,
            items=[],
            total_quantity=0,
            total_value=0.0,
            difference=target_quantity
        )

    def find_items_by_target_value(self, target_value: float) -> InventoryMatchResult:
        """
        Find two inventory items that sum to target value using Two Sum algorithm
        """
        value_map = {}
        
        for item in self.inventory_items:
            if not item.in_stock:
                continue
                
            item_value = item.quantity * item.unit_price
            complement = target_value - item_value
            if complement in value_map:
                complement_item = value_map[complement]
                total_quantity = complement_item.quantity + item.quantity
                total_value = complement_item.unit_price * complement_item.quantity + item.unit_price * item.quantity
                
                return InventoryMatchResult(
                    found=True,
                    items=[complement_item, item],
                    total_quantity=total_quantity,
                    total_value=total_value,
                    difference=0
                )
            value_map[item_value] = item

        return InventoryMatchResult(
            found=False,
            items=[],
            total_quantity=0,
            total_value=0.0,
            difference=target_value
        )

    def find_closest_quantity_match(self, target_quantity: int) -> InventoryMatchResult:
        """
        Find the closest inventory combination to target quantity
        """
        closest_match = InventoryMatchResult(
            found=False,
            items=[],
            total_quantity=0,
            total_value=0.0,
            difference=float('inf')
        )

        for i in range(len(self.inventory_items)):
            if not self.inventory_items[i].in_stock:
                continue
                
            for j in range(i + 1, len(self.inventory_items)):
                if not self.inventory_items[j].in_stock:
                    continue
                    
                item1 = self.inventory_items[i]
                item2 = self.inventory_items[j]
                total_quantity = item1.quantity + item2.quantity
                total_value = item1.quantity * item1.unit_price + item2.quantity * item2.unit_price
                difference = abs(target_quantity - total_quantity)
                
                if difference < closest_match.difference:
                    closest_match = InventoryMatchResult(
                        found=True,
                        items=[item1, item2],
                        total_quantity=total_quantity,
                        total_value=total_value,
                        difference=difference
                    )

        return closest_match

    def find_items_in_quantity_range(self, min_quantity: int, max_quantity: int) -> List[InventoryMatchResult]:
        """
        Find inventory combinations within a quantity range
        """
        results = []
        
        for target in range(min_quantity, max_quantity + 1):
            result = self.find_items_by_target_quantity(target)
            if result.found:
                results.append(result)
        
        return results

    def optimize_order_fulfillment(self, required_quantity: int) -> Dict[str, any]:
        """
        Optimize order fulfillment using Two Sum concept
        """
        # First try to find exact match
        exact_match = self.find_items_by_target_quantity(required_quantity)
        if exact_match.found:
            return {
                'strategy': 'exact_match',
                'result': exact_match,
                'efficiency': 1.0
            }
        
        # If no exact match, find closest
        closest_match = self.find_closest_quantity_match(required_quantity)
        if closest_match.found:
            efficiency = 1 - (closest_match.difference / required_quantity)
            return {
                'strategy': 'closest_match',
                'result': closest_match,
                'efficiency': efficiency
            }
        
        return {
            'strategy': 'no_match',
            'result': None,
            'efficiency': 0.0
        }

# Example usage and testing
def example_usage():
    sample_inventory = [
        InventoryItem('1', 'Laptop', 50, 999.99, 'Electronics', True),
        InventoryItem('2', 'Mouse', 200, 25.99, 'Electronics', True),
        InventoryItem('3', 'Keyboard', 150, 75.99, 'Electronics', True),
        InventoryItem('4', 'Monitor', 75, 299.99, 'Electronics', True),
        InventoryItem('5', 'Headphones', 100, 149.99, 'Electronics', True),
        InventoryItem('6', 'Webcam', 80, 99.99, 'Electronics', True),
    ]

    optimizer = InventoryOptimizer(sample_inventory)
    
    # Test 1: Find items that sum to 100 units
    result1 = optimizer.find_items_by_target_quantity(100)
    print(f"Items for 100 units: {result1}")
    
    # Test 2: Find items that sum to $1000 value
    result2 = optimizer.find_items_by_target_value(1000.0)
    print(f"Items for $1000 value: {result2}")
    
    # Test 3: Find closest match to 120 units
    result3 = optimizer.find_closest_quantity_match(120)
    print(f"Closest match to 120 units: {result3}")
    
    # Test 4: Optimize order fulfillment for 80 units
    result4 = optimizer.optimize_order_fulfillment(80)
    print(f"Order fulfillment for 80 units: {result4}")

if __name__ == "__main__":
    example_usage()
