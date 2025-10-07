// Product Bundle Service - Two Sum Implementation
// This service finds products that can be combined to match target prices

import { Product } from './inventory';

export interface BundleResult {
  found: boolean;
  products: Product[];
  totalPrice: number;
  difference: number;
  savings?: number;
}

export interface BundleOptions {
  targetPrice: number;
  maxProducts?: number;
  categories?: string[];
  excludeOutOfStock?: boolean;
}

export class BundleService {
  /**
   * Find products that sum to target price using Two Sum algorithm
   * Time Complexity: O(n)
   * Space Complexity: O(n)
   */
  static findProductsByTargetPrice(
    products: Product[], 
    options: BundleOptions
  ): BundleResult {
    const { targetPrice, excludeOutOfStock = true } = options;
    
    // Filter products based on options
    let filteredProducts = products;
    if (excludeOutOfStock) {
      filteredProducts = products.filter(p => p.totalQuantity && p.totalQuantity > 0);
    }
    if (options.categories && options.categories.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        options.categories!.includes(p.categoryId)
      );
    }

    const priceMap = new Map<number, Product>();
    
    for (const product of filteredProducts) {
      const complement = targetPrice - product.price;
      if (priceMap.has(complement)) {
        const complementProduct = priceMap.get(complement)!;
        const totalPrice = complementProduct.price + product.price;
        const difference = Math.abs(targetPrice - totalPrice);
        const savings = targetPrice - totalPrice;
        
        return {
          found: true,
          products: [complementProduct, product],
          totalPrice,
          difference,
          savings: savings > 0 ? savings : 0
        };
      }
      priceMap.set(product.price, product);
    }

    return {
      found: false,
      products: [],
      totalPrice: 0,
      difference: targetPrice
    };
  }

  /**
   * Find all possible product combinations for a target price
   * Extended version of Two Sum that finds all pairs
   */
  static findAllBundles(
    products: Product[], 
    options: BundleOptions
  ): BundleResult[] {
    const { targetPrice, excludeOutOfStock = true } = options;
    
    let filteredProducts = products;
    if (excludeOutOfStock) {
      filteredProducts = products.filter(p => p.totalQuantity && p.totalQuantity > 0);
    }
    if (options.categories && options.categories.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        options.categories!.includes(p.categoryId)
      );
    }

    const results: BundleResult[] = [];
    const usedProducts = new Set<string>();
    
    for (let i = 0; i < filteredProducts.length; i++) {
      if (usedProducts.has(filteredProducts[i]._id)) continue;
      
      for (let j = i + 1; j < filteredProducts.length; j++) {
        if (usedProducts.has(filteredProducts[j]._id)) continue;
        
        const totalPrice = filteredProducts[i].price + filteredProducts[j].price;
        if (Math.abs(totalPrice - targetPrice) < 0.01) {
          const savings = targetPrice - totalPrice;
          results.push({
            found: true,
            products: [filteredProducts[i], filteredProducts[j]],
            totalPrice,
            difference: 0,
            savings: savings > 0 ? savings : 0
          });
          usedProducts.add(filteredProducts[i]._id);
          usedProducts.add(filteredProducts[j]._id);
        }
      }
    }
    
    return results;
  }

  /**
   * Find the closest product combination to target price
   * Uses Two Sum as base and extends to find closest match
   */
  static findClosestBundle(
    products: Product[], 
    options: BundleOptions
  ): BundleResult {
    const { targetPrice, excludeOutOfStock = true } = options;
    
    let filteredProducts = products;
    if (excludeOutOfStock) {
      filteredProducts = products.filter(p => p.totalQuantity && p.totalQuantity > 0);
    }
    if (options.categories && options.categories.length > 0) {
      filteredProducts = filteredProducts.filter(p => 
        options.categories!.includes(p.categoryId)
      );
    }

    let closestMatch: BundleResult = {
      found: false,
      products: [],
      totalPrice: 0,
      difference: Infinity
    };

    for (let i = 0; i < filteredProducts.length; i++) {
      for (let j = i + 1; j < filteredProducts.length; j++) {
        const totalPrice = filteredProducts[i].price + filteredProducts[j].price;
        const difference = Math.abs(targetPrice - totalPrice);
        
        if (difference < closestMatch.difference) {
          const savings = targetPrice - totalPrice;
          closestMatch = {
            found: true,
            products: [filteredProducts[i], filteredProducts[j]],
            totalPrice,
            difference,
            savings: savings > 0 ? savings : 0
          };
        }
      }
    }

    return closestMatch;
  }

  /**
   * Find bundles within a price range
   */
  static findBundlesInRange(
    products: Product[], 
    minPrice: number, 
    maxPrice: number,
    options: Omit<BundleOptions, 'targetPrice'> = {}
  ): BundleResult[] {
    const results: BundleResult[] = [];
    
    for (let target = minPrice; target <= maxPrice; target += 10) {
      const result = this.findProductsByTargetPrice(products, { ...options, targetPrice: target });
      if (result.found) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Get bundle recommendations based on popular combinations
   */
  static getBundleRecommendations(
    products: Product[], 
    targetPrice: number,
    limit: number = 5
  ): BundleResult[] {
    const allBundles = this.findAllBundles(products, { targetPrice });
    
    // Sort by savings (best deals first)
    return allBundles
      .sort((a, b) => (b.savings || 0) - (a.savings || 0))
      .slice(0, limit);
  }
}

export default BundleService;

