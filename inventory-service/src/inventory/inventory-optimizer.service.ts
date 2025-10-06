// Inventory Optimizer Service - Two Sum Implementation
// This service finds inventory combinations to fulfill orders using Two Sum algorithm

import { Injectable } from '@nestjs/common';
import { Inventory } from './schemas/inventory.schema';

export interface InventoryMatchResult {
  found: boolean;
  items: Inventory[];
  totalQuantity: number;
  totalValue: number;
  difference: number;
  warehouses: string[];
}

export interface OrderFulfillmentResult {
  canFulfill: boolean;
  strategy: 'exact_match' | 'closest_match' | 'no_match';
  result: InventoryMatchResult | null;
  efficiency: number;
  alternativeOptions: InventoryMatchResult[];
}

@Injectable()
export class InventoryOptimizerService {
  /**
   * Find inventory items that sum to target quantity using Two Sum algorithm
   * Time Complexity: O(n)
   * Space Complexity: O(n)
   */
  findItemsByTargetQuantity(
    inventoryItems: Inventory[],
    targetQuantity: number
  ): InventoryMatchResult {
    const quantityMap = new Map<number, Inventory>();
    
    for (const item of inventoryItems) {
      if (item.quantity <= 0) {
        continue;
      }
      
      const complement = targetQuantity - item.quantity;
      if (quantityMap.has(complement)) {
        const complementItem = quantityMap.get(complement)!;
        const totalQuantity = complementItem.quantity + item.quantity;
        const totalValue = (complementItem.averageCost * complementItem.quantity) + 
                          (item.averageCost * item.quantity);
        const warehouses = [
          complementItem.warehouseId.toString(),
          item.warehouseId.toString()
        ];
        
        return {
          found: true,
          items: [complementItem, item],
          totalQuantity,
          totalValue,
          difference: 0,
          warehouses
        };
      }
      quantityMap.set(item.quantity, item);
    }

    return {
      found: false,
      items: [],
      totalQuantity: 0,
      totalValue: 0,
      difference: targetQuantity,
      warehouses: []
    };
  }

  /**
   * Find inventory items that sum to target value using Two Sum algorithm
   */
  findItemsByTargetValue(
    inventoryItems: Inventory[],
    targetValue: number
  ): InventoryMatchResult {
    const valueMap = new Map<number, Inventory>();
    
    for (const item of inventoryItems) {
      if (item.quantity <= 0) {
        continue;
      }
      
      const itemValue = item.quantity * item.averageCost;
      const complement = targetValue - itemValue;
      
      if (valueMap.has(complement)) {
        const complementItem = valueMap.get(complement)!;
        const totalQuantity = complementItem.quantity + item.quantity;
        const totalValue = (complementItem.averageCost * complementItem.quantity) + 
                          (item.averageCost * item.quantity);
        const warehouses = [
          complementItem.warehouseId.toString(),
          item.warehouseId.toString()
        ];
        
        return {
          found: true,
          items: [complementItem, item],
          totalQuantity,
          totalValue,
          difference: 0,
          warehouses
        };
      }
      valueMap.set(itemValue, item);
    }

    return {
      found: false,
      items: [],
      totalQuantity: 0,
      totalValue: 0,
      difference: targetValue,
      warehouses: []
    };
  }

  /**
   * Find the closest inventory combination to target quantity
   */
  findClosestQuantityMatch(
    inventoryItems: Inventory[],
    targetQuantity: number
  ): InventoryMatchResult {
    let closestMatch: InventoryMatchResult = {
      found: false,
      items: [],
      totalQuantity: 0,
      totalValue: 0,
      difference: Infinity,
      warehouses: []
    };

    for (let i = 0; i < inventoryItems.length; i++) {
      if (inventoryItems[i].quantity <= 0) {
        continue;
      }
      
      for (let j = i + 1; j < inventoryItems.length; j++) {
        if (inventoryItems[j].quantity <= 0) {
          continue;
        }
        
        const item1 = inventoryItems[i];
        const item2 = inventoryItems[j];
        const totalQuantity = item1.quantity + item2.quantity;
        const totalValue = (item1.averageCost * item1.quantity) + (item2.averageCost * item2.quantity);
        const difference = Math.abs(targetQuantity - totalQuantity);
        
        if (difference < closestMatch.difference) {
          closestMatch = {
            found: true,
            items: [item1, item2],
            totalQuantity,
            totalValue,
            difference,
            warehouses: [item1.warehouseId.toString(), item2.warehouseId.toString()]
          };
        }
      }
    }

    return closestMatch;
  }

  /**
   * Optimize order fulfillment using Two Sum concept
   */
  optimizeOrderFulfillment(
    inventoryItems: Inventory[],
    requiredQuantity: number
  ): OrderFulfillmentResult {
    // First try to find exact match
    const exactMatch = this.findItemsByTargetQuantity(inventoryItems, requiredQuantity);
    if (exactMatch.found) {
      return {
        canFulfill: true,
        strategy: 'exact_match',
        result: exactMatch,
        efficiency: 1.0,
        alternativeOptions: []
      };
    }

    // If no exact match, find closest
    const closestMatch = this.findClosestQuantityMatch(inventoryItems, requiredQuantity);
    if (closestMatch.found) {
      const efficiency = 1 - (closestMatch.difference / requiredQuantity);
      return {
        canFulfill: efficiency > 0.8, // Consider it fulfillable if within 20%
        strategy: 'closest_match',
        result: closestMatch,
        efficiency,
        alternativeOptions: []
      };
    }

    return {
      canFulfill: false,
      strategy: 'no_match',
      result: null,
      efficiency: 0.0,
      alternativeOptions: []
    };
  }

  /**
   * Find inventory combinations within a quantity range
   */
  findItemsInQuantityRange(
    inventoryItems: Inventory[],
    minQuantity: number,
    maxQuantity: number
  ): InventoryMatchResult[] {
    const results: InventoryMatchResult[] = [];
    
    for (let target = minQuantity; target <= maxQuantity; target += 10) {
      const result = this.findItemsByTargetQuantity(inventoryItems, target);
      if (result.found) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Get inventory optimization recommendations
   */
  getOptimizationRecommendations(
    inventoryItems: Inventory[],
    targetQuantity: number
  ): {
    exactMatches: InventoryMatchResult[];
    closestMatches: InventoryMatchResult[];
    alternativeOptions: InventoryMatchResult[];
    efficiency: number;
  } {
    const exactMatches = this.findItemsByTargetQuantity(inventoryItems, targetQuantity);
    const closestMatches = this.findClosestQuantityMatch(inventoryItems, targetQuantity);
    
    // Find alternative options within 20% of target
    const alternativeOptions = this.findItemsInQuantityRange(
      inventoryItems,
      Math.floor(targetQuantity * 0.8),
      Math.ceil(targetQuantity * 1.2)
    );
    
    const efficiency = exactMatches.found ? 1.0 : 
                     (closestMatches.found ? 1 - (closestMatches.difference / targetQuantity) : 0);
    
    return {
      exactMatches: exactMatches.found ? [exactMatches] : [],
      closestMatches: closestMatches.found ? [closestMatches] : [],
      alternativeOptions,
      efficiency
    };
  }

  /**
   * Analyze warehouse distribution for optimal fulfillment
   */
  analyzeWarehouseDistribution(
    inventoryItems: Inventory[],
    targetQuantity: number
  ): {
    warehouseOptions: Map<string, InventoryMatchResult[]>;
    bestWarehouse: string | null;
    crossWarehouseOptions: InventoryMatchResult[];
  } {
    const warehouseOptions = new Map<string, InventoryMatchResult[]>();
    const crossWarehouseOptions: InventoryMatchResult[] = [];
    
    // Group items by warehouse
    const warehouseGroups = new Map<string, Inventory[]>();
    for (const item of inventoryItems) {
      if (item.quantity <= 0) continue;
      
      const warehouseId = item.warehouseId.toString();
      if (!warehouseGroups.has(warehouseId)) {
        warehouseGroups.set(warehouseId, []);
      }
      warehouseGroups.get(warehouseId)!.push(item);
    }
    
    // Find options within each warehouse
    for (const [warehouseId, items] of warehouseGroups) {
      const options = this.findItemsInQuantityRange(items, targetQuantity * 0.8, targetQuantity * 1.2);
      if (options.length > 0) {
        warehouseOptions.set(warehouseId, options);
      }
    }
    
    // Find cross-warehouse options
    const allItems = Array.from(inventoryItems).filter(item => item.quantity > 0);
    const crossWarehouseResults = this.findItemsInQuantityRange(allItems, targetQuantity * 0.8, targetQuantity * 1.2);
    crossWarehouseOptions.push(...crossWarehouseResults.filter(result => 
      result.warehouses.length > 1
    ));
    
    // Find best warehouse (most options)
    let bestWarehouse: string | null = null;
    let maxOptions = 0;
    for (const [warehouseId, options] of warehouseOptions) {
      if (options.length > maxOptions) {
        maxOptions = options.length;
        bestWarehouse = warehouseId;
      }
    }
    
    return {
      warehouseOptions,
      bestWarehouse,
      crossWarehouseOptions
    };
  }
}
