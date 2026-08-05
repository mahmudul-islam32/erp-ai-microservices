import { useAppSelector } from '../../app/hooks';
import { Permission, UserRole } from '../../features/users/types';

/**
 * Hook to check user permissions and access control
 */
export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.auth);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission | string): boolean => {
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === UserRole.SUPER_ADMIN || user.is_superuser) {
      return true;
    }
    
    // Check if user has the permission (handle both Permission enum and string)
    // Permission is a string enum, so String() covers both enum members and
    // plain strings without a redundant typeof branch.
    const permissionStr = String(permission);
    return user.permissions?.some(p => {
      // Handle both Permission enum values and string permissions
      const userPermStr = String(p);
      return userPermStr === permissionStr;
    }) || false;
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
    if (!user) return false;
    
    if (user.role === UserRole.SUPER_ADMIN || user.is_superuser) {
      return true;
    }
    
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
    if (!user) return false;
    
    if (user.role === UserRole.SUPER_ADMIN || user.is_superuser) {
      return true;
    }
    
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user has access to a service/module (has any read permission for that service)
   */
  const hasServiceAccess = (service: 'user' | 'inventory' | 'sales' | 'finance' | 'hr' | 'ai'): boolean => {
    if (!user) return false;
    
    if (user.role === UserRole.SUPER_ADMIN || user.is_superuser) {
      return true;
    }
    
    const servicePermissions: Record<string, Permission[]> = {
      'user': [Permission.USER_READ, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.USER_DELETE],
      'inventory': [Permission.INVENTORY_READ, Permission.INVENTORY_CREATE, Permission.INVENTORY_UPDATE, Permission.INVENTORY_DELETE],
      'sales': [Permission.SALES_READ, Permission.SALES_CREATE, Permission.SALES_UPDATE, Permission.SALES_DELETE],
      'finance': [Permission.FINANCE_READ, Permission.FINANCE_CREATE, Permission.FINANCE_UPDATE, Permission.FINANCE_DELETE],
      'hr': [Permission.HR_READ, Permission.HR_CREATE, Permission.HR_UPDATE, Permission.HR_DELETE],
      'ai': [Permission.AI_ACCESS, Permission.AI_ADMIN],
    };
    
    const permissions = servicePermissions[service] || [];
    return hasAnyPermission(permissions);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole | string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: (UserRole | string)[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasServiceAccess,
    hasRole,
    hasAnyRole,
    isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
    isAdmin: user?.role === UserRole.ADMIN,
    isCustomer: user?.role === UserRole.CUSTOMER,
    isVendor: user?.role === UserRole.VENDOR,
  };
};

