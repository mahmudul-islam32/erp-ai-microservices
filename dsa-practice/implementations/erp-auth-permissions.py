# ERP Auth Permissions - Real Implementation
# This file demonstrates how Two Sum concept is used in our ERP system

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class PermissionLevel(Enum):
    READ = 1
    WRITE = 2
    DELETE = 3
    ADMIN = 4
    SUPER_ADMIN = 5

@dataclass
class UserRole:
    id: str
    name: str
    permission_level: int
    permissions: List[str]
    description: str

@dataclass
class PermissionMatchResult:
    found: bool
    roles: List[UserRole]
    total_permission_level: int
    combined_permissions: List[str]
    difference: int

class AuthPermissionValidator:
    def __init__(self, user_roles: List[UserRole]):
        self.user_roles = user_roles

    def find_roles_by_target_permission_level(self, target_level: int) -> PermissionMatchResult:
        """
        Find two roles that sum to target permission level using Two Sum algorithm
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        level_map = {}
        
        for role in self.user_roles:
            complement = target_level - role.permission_level
            if complement in level_map:
                complement_role = level_map[complement]
                total_level = complement_role.permission_level + role.permission_level
                combined_permissions = list(set(complement_role.permissions + role.permissions))
                
                return PermissionMatchResult(
                    found=True,
                    roles=[complement_role, role],
                    total_permission_level=total_level,
                    combined_permissions=combined_permissions,
                    difference=0
                )
            level_map[role.permission_level] = role

        return PermissionMatchResult(
            found=False,
            roles=[],
            total_permission_level=0,
            combined_permissions=[],
            difference=target_level
        )

    def validate_user_permissions(self, user_roles: List[UserRole], required_permission_level: int) -> Dict[str, any]:
        """
        Validate if user has sufficient permissions through role combinations
        """
        # First check if any single role meets the requirement
        for role in user_roles:
            if role.permission_level >= required_permission_level:
                return {
                    'has_permission': True,
                    'method': 'single_role',
                    'roles': [role],
                    'permission_level': role.permission_level
                }
        
        # Check if any two roles can be combined to meet the requirement
        for i in range(len(user_roles)):
            for j in range(i + 1, len(user_roles)):
                combined_level = user_roles[i].permission_level + user_roles[j].permission_level
                if combined_level >= required_permission_level:
                    combined_permissions = list(set(user_roles[i].permissions + user_roles[j].permissions))
                    return {
                        'has_permission': True,
                        'method': 'role_combination',
                        'roles': [user_roles[i], user_roles[j]],
                        'permission_level': combined_level,
                        'combined_permissions': combined_permissions
                    }
        
        return {
            'has_permission': False,
            'method': 'insufficient',
            'roles': [],
            'permission_level': 0
        }

    def find_minimum_role_combination(self, required_permission_level: int) -> PermissionMatchResult:
        """
        Find the minimum role combination that meets the permission requirement
        """
        best_match = PermissionMatchResult(
            found=False,
            roles=[],
            total_permission_level=0,
            combined_permissions=[],
            difference=float('inf')
        )

        for i in range(len(self.user_roles)):
            for j in range(i + 1, len(self.user_roles)):
                role1 = self.user_roles[i]
                role2 = self.user_roles[j]
                total_level = role1.permission_level + role2.permission_level
                
                if total_level >= required_permission_level:
                    difference = total_level - required_permission_level
                    if difference < best_match.difference:
                        combined_permissions = list(set(role1.permissions + role2.permissions))
                        best_match = PermissionMatchResult(
                            found=True,
                            roles=[role1, role2],
                            total_permission_level=total_level,
                            combined_permissions=combined_permissions,
                            difference=difference
                        )

        return best_match

    def analyze_permission_gaps(self, user_roles: List[UserRole], required_permissions: List[str]) -> Dict[str, any]:
        """
        Analyze what permissions are missing and suggest role combinations
        """
        user_permissions = set()
        for role in user_roles:
            user_permissions.update(role.permissions)
        
        missing_permissions = set(required_permissions) - user_permissions
        
        if not missing_permissions:
            return {
                'has_all_permissions': True,
                'missing_permissions': [],
                'suggested_roles': []
            }
        
        # Find roles that could provide missing permissions
        suggested_roles = []
        for role in self.user_roles:
            if role.id not in [r.id for r in user_roles]:
                role_permissions = set(role.permissions)
                if role_permissions.intersection(missing_permissions):
                    suggested_roles.append(role)
        
        return {
            'has_all_permissions': False,
            'missing_permissions': list(missing_permissions),
            'suggested_roles': suggested_roles
        }

    def optimize_role_assignments(self, users: List[Dict], required_permission_level: int) -> Dict[str, any]:
        """
        Optimize role assignments to meet permission requirements efficiently
        """
        results = {}
        
        for user in users:
            user_roles = [role for role in self.user_roles if role.id in user.get('role_ids', [])]
            
            # Check current permission status
            current_status = self.validate_user_permissions(user_roles, required_permission_level)
            
            if not current_status['has_permission']:
                # Find minimum role combination
                min_combination = self.find_minimum_role_combination(required_permission_level)
                
                results[user['id']] = {
                    'current_status': current_status,
                    'recommendation': min_combination,
                    'action_required': True
                }
            else:
                results[user['id']] = {
                    'current_status': current_status,
                    'recommendation': None,
                    'action_required': False
                }
        
        return results

# Example usage and testing
def example_usage():
    # Sample roles
    sample_roles = [
        UserRole('1', 'Viewer', 1, ['read'], 'Can only view data'),
        UserRole('2', 'Editor', 2, ['read', 'write'], 'Can view and edit data'),
        UserRole('3', 'Manager', 3, ['read', 'write', 'approve'], 'Can manage and approve'),
        UserRole('4', 'Admin', 4, ['read', 'write', 'delete', 'manage_users'], 'Full administrative access'),
        UserRole('5', 'Super Admin', 5, ['read', 'write', 'delete', 'manage_users', 'system_config'], 'System-wide access'),
    ]

    validator = AuthPermissionValidator(sample_roles)
    
    # Test 1: Find roles that sum to permission level 5
    result1 = validator.find_roles_by_target_permission_level(5)
    print(f"Roles for permission level 5: {result1}")
    
    # Test 2: Validate user permissions
    user_roles = [sample_roles[0], sample_roles[1]]  # Viewer + Editor
    result2 = validator.validate_user_permissions(user_roles, 4)  # Need Admin level
    print(f"User permission validation: {result2}")
    
    # Test 3: Find minimum role combination for level 4
    result3 = validator.find_minimum_role_combination(4)
    print(f"Minimum combination for level 4: {result3}")
    
    # Test 4: Analyze permission gaps
    user_roles = [sample_roles[0]]  # Only Viewer
    required_permissions = ['read', 'write', 'delete']
    result4 = validator.analyze_permission_gaps(user_roles, required_permissions)
    print(f"Permission gap analysis: {result4}")
    
    # Test 5: Optimize role assignments
    users = [
        {'id': 'U1', 'role_ids': ['1', '2']},  # Viewer + Editor
        {'id': 'U2', 'role_ids': ['1']},       # Only Viewer
        {'id': 'U3', 'role_ids': ['4']},       # Admin
    ]
    result5 = validator.optimize_role_assignments(users, 4)
    print(f"Role optimization: {result5}")

if __name__ == "__main__":
    example_usage()
