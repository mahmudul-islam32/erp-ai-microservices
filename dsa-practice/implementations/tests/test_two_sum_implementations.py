# Tests for Two Sum Implementations in ERP Project

import unittest
from datetime import datetime, timedelta
from erp_inventory_optimizer import InventoryOptimizer, InventoryItem
from erp_sales_analytics import SalesAnalytics, SalesTransaction
from erp_auth_permissions import AuthPermissionValidator, UserRole, PermissionLevel

class TestInventoryOptimizer(unittest.TestCase):
    def setUp(self):
        self.sample_inventory = [
            InventoryItem('1', 'Laptop', 50, 999.99, 'Electronics', True),
            InventoryItem('2', 'Mouse', 200, 25.99, 'Electronics', True),
            InventoryItem('3', 'Keyboard', 150, 75.99, 'Electronics', True),
            InventoryItem('4', 'Monitor', 75, 299.99, 'Electronics', True),
            InventoryItem('5', 'Headphones', 100, 149.99, 'Electronics', True),
        ]
        self.optimizer = InventoryOptimizer(self.sample_inventory)

    def test_find_items_by_target_quantity_exact_match(self):
        result = self.optimizer.find_items_by_target_quantity(100)
        self.assertTrue(result.found)
        self.assertEqual(result.total_quantity, 100)
        self.assertEqual(len(result.items), 2)

    def test_find_items_by_target_quantity_no_match(self):
        result = self.optimizer.find_items_by_target_quantity(1000)
        self.assertFalse(result.found)
        self.assertEqual(len(result.items), 0)

    def test_find_items_by_target_value(self):
        result = self.optimizer.find_items_by_target_value(1000.0)
        self.assertTrue(result.found)
        self.assertGreater(result.total_value, 0)

    def test_find_closest_quantity_match(self):
        result = self.optimizer.find_closest_quantity_match(120)
        self.assertTrue(result.found)
        self.assertLessEqual(result.difference, 50)  # Should be close to 120

    def test_optimize_order_fulfillment(self):
        result = self.optimizer.optimize_order_fulfillment(80)
        self.assertIn('strategy', result)
        self.assertIn('efficiency', result)

class TestSalesAnalytics(unittest.TestCase):
    def setUp(self):
        self.sample_sales = [
            SalesTransaction('1', 500.0, datetime.now() - timedelta(days=1), 'C001', ['P001'], 'S001'),
            SalesTransaction('2', 300.0, datetime.now() - timedelta(days=1), 'C002', ['P002'], 'S002'),
            SalesTransaction('3', 200.0, datetime.now() - timedelta(days=2), 'C001', ['P003'], 'S001'),
            SalesTransaction('4', 800.0, datetime.now() - timedelta(days=2), 'C003', ['P004'], 'S003'),
        ]
        self.analytics = SalesAnalytics(self.sample_sales)

    def test_find_transactions_by_target_amount_exact_match(self):
        result = self.analytics.find_transactions_by_target_amount(800.0)
        self.assertTrue(result.found)
        self.assertEqual(result.total_amount, 800.0)

    def test_find_transactions_by_target_amount_no_match(self):
        result = self.analytics.find_transactions_by_target_amount(1000.0)
        self.assertFalse(result.found)

    def test_find_daily_sales_combinations(self):
        today = datetime.now().date()
        result = self.analytics.find_daily_sales_combinations(800.0, datetime.now())
        self.assertIsInstance(result, list)

    def test_find_salesperson_performance_pairs(self):
        result = self.analytics.find_salesperson_performance_pairs(500.0)
        self.assertIsInstance(result, dict)

    def test_analyze_sales_target_achievement(self):
        result = self.analytics.analyze_sales_target_achievement(1000.0)
        self.assertIsInstance(result, dict)
        self.assertIn('total_sales', list(result.values())[0])

class TestAuthPermissionValidator(unittest.TestCase):
    def setUp(self):
        self.sample_roles = [
            UserRole('1', 'Viewer', 1, ['read'], 'Can only view data'),
            UserRole('2', 'Editor', 2, ['read', 'write'], 'Can view and edit data'),
            UserRole('3', 'Manager', 3, ['read', 'write', 'approve'], 'Can manage and approve'),
            UserRole('4', 'Admin', 4, ['read', 'write', 'delete', 'manage_users'], 'Full administrative access'),
        ]
        self.validator = AuthPermissionValidator(self.sample_roles)

    def test_find_roles_by_target_permission_level_exact_match(self):
        result = self.validator.find_roles_by_target_permission_level(3)
        self.assertTrue(result.found)
        self.assertEqual(result.total_permission_level, 3)

    def test_find_roles_by_target_permission_level_no_match(self):
        result = self.validator.find_roles_by_target_permission_level(10)
        self.assertFalse(result.found)

    def test_validate_user_permissions_single_role(self):
        user_roles = [self.sample_roles[3]]  # Admin role
        result = self.validator.validate_user_permissions(user_roles, 4)
        self.assertTrue(result['has_permission'])
        self.assertEqual(result['method'], 'single_role')

    def test_validate_user_permissions_role_combination(self):
        user_roles = [self.sample_roles[0], self.sample_roles[1]]  # Viewer + Editor
        result = self.validator.validate_user_permissions(user_roles, 3)
        self.assertTrue(result['has_permission'])
        self.assertEqual(result['method'], 'role_combination')

    def test_find_minimum_role_combination(self):
        result = self.validator.find_minimum_role_combination(4)
        self.assertTrue(result.found)
        self.assertGreaterEqual(result.total_permission_level, 4)

    def test_analyze_permission_gaps(self):
        user_roles = [self.sample_roles[0]]  # Only Viewer
        required_permissions = ['read', 'write', 'delete']
        result = self.validator.analyze_permission_gaps(user_roles, required_permissions)
        self.assertFalse(result['has_all_permissions'])
        self.assertGreater(len(result['missing_permissions']), 0)

class TestTwoSumAlgorithm(unittest.TestCase):
    def test_brute_force_approach(self):
        from day1_two_sum_python import two_sum_brute_force
        
        # Test case 1
        result = two_sum_brute_force([2, 7, 11, 15], 9)
        self.assertEqual(result, [0, 1])
        
        # Test case 2
        result = two_sum_brute_force([3, 2, 4], 6)
        self.assertEqual(result, [1, 2])
        
        # Test case 3
        result = two_sum_brute_force([3, 3], 6)
        self.assertEqual(result, [0, 1])

    def test_hashmap_approach(self):
        from day1_two_sum_python import two_sum_hashmap
        
        # Test case 1
        result = two_sum_hashmap([2, 7, 11, 15], 9)
        self.assertEqual(result, [0, 1])
        
        # Test case 2
        result = two_sum_hashmap([3, 2, 4], 6)
        self.assertEqual(result, [1, 2])
        
        # Test case 3
        result = two_sum_hashmap([3, 3], 6)
        self.assertEqual(result, [0, 1])

    def test_sorted_array_approach(self):
        from day1_two_sum_python import two_sum_sorted
        
        # Test case 1
        result = two_sum_sorted([2, 7, 11, 15], 9)
        self.assertEqual(result, [0, 1])
        
        # Test case 2
        result = two_sum_sorted([2, 3, 4], 6)
        self.assertEqual(result, [1, 2])

if __name__ == '__main__':
    # Run all tests
    unittest.main(verbosity=2)
