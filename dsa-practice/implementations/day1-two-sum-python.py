# Day 1: Two Sum - Python Implementation

def two_sum_brute_force(nums, target):
    """
    Brute force approach - O(n²) time, O(1) space
    """
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []

def two_sum_hashmap(nums, target):
    """
    Hash map approach - O(n) time, O(n) space
    """
    hash_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hash_map:
            return [hash_map[complement], i]
        hash_map[num] = i
    return []

def two_sum_sorted(nums, target):
    """
    Two-pointer approach for sorted array - O(n) time, O(1) space
    """
    left, right = 0, len(nums) - 1
    while left < right:
        current_sum = nums[left] + nums[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1
    return []

# Test cases
if __name__ == "__main__":
    # Test case 1
    nums1 = [2, 7, 11, 15]
    target1 = 9
    print(f"Test 1 - Brute Force: {two_sum_brute_force(nums1, target1)}")
    print(f"Test 1 - Hash Map: {two_sum_hashmap(nums1, target1)}")
    
    # Test case 2
    nums2 = [3, 2, 4]
    target2 = 6
    print(f"Test 2 - Brute Force: {two_sum_brute_force(nums2, target2)}")
    print(f"Test 2 - Hash Map: {two_sum_hashmap(nums2, target2)}")
    
    # Test case 3
    nums3 = [3, 3]
    target3 = 6
    print(f"Test 3 - Brute Force: {two_sum_brute_force(nums3, target3)}")
    print(f"Test 3 - Hash Map: {two_sum_hashmap(nums3, target3)}")
    
    # Test case 4 - Sorted array
    nums4 = [2, 7, 11, 15]
    target4 = 9
    print(f"Test 4 - Sorted: {two_sum_sorted(nums4, target4)}")
