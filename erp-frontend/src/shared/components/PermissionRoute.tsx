import React from 'react';
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute';
import { Permission, UserRole } from '../../features/users/types';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission | string;
  requiredPermissions?: (Permission | string)[];
  requiredService?: 'user' | 'inventory' | 'sales' | 'finance' | 'hr' | 'ai';
  requiredRole?: UserRole | string;
  requiredRoles?: (UserRole | string)[];
  excludedRole?: UserRole | string;
  excludedRoles?: (UserRole | string)[];
}

/**
 * Wrapper component for routes that require specific permissions
 * Use this to wrap route components that need permission checks
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requiredService,
  requiredRole,
  requiredRoles,
  excludedRole,
  excludedRoles,
}) => {
  return (
    <ProtectedRoute
      requiredPermission={requiredPermission}
      requiredPermissions={requiredPermissions}
      requiredService={requiredService}
      requiredRole={requiredRole}
      requiredRoles={requiredRoles}
      excludedRole={excludedRole}
      excludedRoles={excludedRoles}
    >
      {children}
    </ProtectedRoute>
  );
};

