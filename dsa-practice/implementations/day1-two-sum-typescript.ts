// Day 1: Two Sum - TypeScript Implementation for ERP Project

export class TwoSumSolver {
  /**
   * Brute force approach - O(n²) time, O(1) space
   */
  static bruteForce(nums: number[], target: number): number[] {
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) {
          return [i, j];
        }
      }
    }
    return [];
  }

  /**
   * Hash map approach - O(n) time, O(n) space
   */
  static hashMap(nums: number[], target: number): number[] {
    const hashMap = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (hashMap.has(complement)) {
        return [hashMap.get(complement)!, i];
      }
      hashMap.set(nums[i], i);
    }
    return [];
  }

  /**
   * Two-pointer approach for sorted array - O(n) time, O(1) space
   */
  static twoPointer(nums: number[], target: number): number[] {
    let left = 0;
    let right = nums.length - 1;
    
    while (left < right) {
      const currentSum = nums[left] + nums[right];
      if (currentSum === target) {
        return [left, right];
      } else if (currentSum < target) {
        left++;
      } else {
        right--;
      }
    }
    return [];
  }
}

// Test cases
if (typeof window === 'undefined') {
  // Node.js environment
  const solver = TwoSumSolver;
  
  // Test case 1
  const nums1 = [2, 7, 11, 15];
  const target1 = 9;
  console.log(`Test 1 - Brute Force: ${solver.bruteForce(nums1, target1)}`);
  console.log(`Test 1 - Hash Map: ${solver.hashMap(nums1, target1)}`);
  
  // Test case 2
  const nums2 = [3, 2, 4];
  const target2 = 6;
  console.log(`Test 2 - Brute Force: ${solver.bruteForce(nums2, target2)}`);
  console.log(`Test 2 - Hash Map: ${solver.hashMap(nums2, target2)}`);
  
  // Test case 3
  const nums3 = [3, 3];
  const target3 = 6;
  console.log(`Test 3 - Brute Force: ${solver.bruteForce(nums3, target3)}`);
  console.log(`Test 3 - Hash Map: ${solver.hashMap(nums3, target3)}`);
}
