# Day 1: Arrays, Big-O & HashMaps - Two Sum

## Problem Statement
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

## Examples
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Input: nums = [3,2,4], target = 6
Output: [1,2]

Input: nums = [3,3], target = 6
Output: [0,1]
```

## Constraints
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.

## Solutions

### Approach 1: Brute Force
**Time Complexity:** O(n²)  
**Space Complexity:** O(1)

```python
def two_sum_brute_force(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
```

### Approach 2: Hash Map (Optimal)
**Time Complexity:** O(n)  
**Space Complexity:** O(n)

```python
def two_sum_hashmap(nums, target):
    hash_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hash_map:
            return [hash_map[complement], i]
        hash_map[num] = i
    return []
```

## Key Learning Points
1. **Big-O Analysis**: Understanding time vs space trade-offs
2. **Hash Maps**: Using hash maps to reduce time complexity from O(n²) to O(n)
3. **One-pass solution**: Solving in a single iteration
4. **Edge cases**: Handling duplicate values and negative numbers

## Follow-up Questions
1. What if the array is sorted? (Two-pointer approach)
2. What if we need to return all pairs? (Not just indices)
3. What if we need to return the actual values instead of indices?
