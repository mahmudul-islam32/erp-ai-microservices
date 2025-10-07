// ERP Product Price Matcher - Real Implementation
// This file demonstrates how Two Sum concept is used in our ERP system

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

export interface PriceMatchResult {
  found: boolean;
  products: Product[];
  totalPrice: number;
  difference: number;
}

export class ProductPriceMatcher {
  private products: Product[] = [];

  constructor(products: Product[]) {
    this.products = products;
  }

  /**
   * Find two products that sum to target price using Two Sum algorithm
   * Time Complexity: O(n)
   * Space Complexity: O(n)
   */
  findProductsByTargetPrice(targetPrice: number): PriceMatchResult {
    const priceMap = new Map<number, Product>();
    
    for (const product of this.products) {
      if (!product.inStock) continue;
      
      const complement = targetPrice - product.price;
      if (priceMap.has(complement)) {
        const complementProduct = priceMap.get(complement)!;
        return {
          found: true,
          products: [complementProduct, product],
          totalPrice: complementProduct.price + product.price,
          difference: Math.abs(targetPrice - (complementProduct.price + product.price))
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
   * Find products within a price range using Two Sum concept
   * This extends the Two Sum idea to find products that sum to a range
   */
  findProductsInPriceRange(minPrice: number, maxPrice: number): PriceMatchResult[] {
    const results: PriceMatchResult[] = [];
    
    for (let target = minPrice; target <= maxPrice; target++) {
      const result = this.findProductsByTargetPrice(target);
      if (result.found) {
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Find the closest product combination to target price
   * Uses Two Sum as base and extends to find closest match
   */
  findClosestPriceMatch(targetPrice: number): PriceMatchResult {
    let closestMatch: PriceMatchResult = {
      found: false,
      products: [],
      totalPrice: 0,
      difference: Infinity
    };

    const priceMap = new Map<number, Product>();
    
    for (const product of this.products) {
      if (!product.inStock) continue;
      
      const complement = targetPrice - product.price;
      if (priceMap.has(complement)) {
        const complementProduct = priceMap.get(complement)!;
        const totalPrice = complementProduct.price + product.price;
        const difference = Math.abs(targetPrice - totalPrice);
        
        if (difference < closestMatch.difference) {
          closestMatch = {
            found: true,
            products: [complementProduct, product],
            totalPrice,
            difference
          };
        }
      }
      priceMap.set(product.price, product);
    }

    return closestMatch;
  }

  /**
   * Get all possible product combinations for a target price
   * Extended version of Two Sum that finds all pairs
   */
  getAllProductCombinations(targetPrice: number): PriceMatchResult[] {
    const results: PriceMatchResult[] = [];
    const usedProducts = new Set<string>();
    
    for (let i = 0; i < this.products.length; i++) {
      if (!this.products[i].inStock || usedProducts.has(this.products[i].id)) continue;
      
      for (let j = i + 1; j < this.products.length; j++) {
        if (!this.products[j].inStock || usedProducts.has(this.products[j].id)) continue;
        
        const totalPrice = this.products[i].price + this.products[j].price;
        if (totalPrice === targetPrice) {
          results.push({
            found: true,
            products: [this.products[i], this.products[j]],
            totalPrice,
            difference: 0
          });
          usedProducts.add(this.products[i].id);
          usedProducts.add(this.products[j].id);
        }
      }
    }
    
    return results;
  }
}

// Example usage and testing
export const exampleUsage = () => {
  const sampleProducts: Product[] = [
    { id: '1', name: 'Laptop', price: 999, category: 'Electronics', inStock: true },
    { id: '2', name: 'Mouse', price: 25, category: 'Electronics', inStock: true },
    { id: '3', name: 'Keyboard', price: 75, category: 'Electronics', inStock: true },
    { id: '4', name: 'Monitor', price: 300, category: 'Electronics', inStock: true },
    { id: '5', name: 'Headphones', price: 150, category: 'Electronics', inStock: true },
    { id: '6', name: 'Webcam', price: 100, category: 'Electronics', inStock: true },
  ];

  const matcher = new ProductPriceMatcher(sampleProducts);
  
  // Test 1: Find products that sum to $1000
  const result1 = matcher.findProductsByTargetPrice(1000);
  console.log('Products for $1000:', result1);
  
  // Test 2: Find products in price range $200-$400
  const result2 = matcher.findProductsInPriceRange(200, 400);
  console.log('Products in range $200-$400:', result2);
  
  // Test 3: Find closest match to $500
  const result3 = matcher.findClosestPriceMatch(500);
  console.log('Closest match to $500:', result3);
  
  // Test 4: Find all combinations for $175
  const result4 = matcher.getAllProductCombinations(175);
  console.log('All combinations for $175:', result4);
};

// Export for use in other parts of the application
export default ProductPriceMatcher;
