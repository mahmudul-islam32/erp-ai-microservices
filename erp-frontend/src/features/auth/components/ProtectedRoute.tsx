import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { getCurrentUser } from '../store/authSlice';
import { settingsApi, SettingsCategory } from '../../settings/services/settingsApi';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission, UserRole } from '../../users/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission | string;
  requiredPermissions?: (Permission | string)[];
  requiredService?: 'user' | 'inventory' | 'sales' | 'finance' | 'hr' | 'ai';
  requiredRole?: UserRole | string;
  requiredRoles?: (UserRole | string)[];
  excludedRole?: UserRole | string;
  excludedRoles?: (UserRole | string)[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  requiredService,
  requiredRole,
  requiredRoles,
  excludedRole,
  excludedRoles,
}) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading, requires2FASetup } = useAppSelector((state) => state.auth);
  const { hasPermission, hasAnyPermission, hasServiceAccess, hasRole, hasAnyRole } = usePermissions();
  const [checking2FA, setChecking2FA] = useState(false);
  const [systemRequires2FA, setSystemRequires2FA] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  // Check if system requires 2FA
  useEffect(() => {
    const checkSystem2FA = async () => {
      if (isAuthenticated && user) {
        setChecking2FA(true);
        try {
          const settings = await settingsApi.getByCategory(SettingsCategory.SECURITY);
          if (settings?.security) {
            const security = settings.security;
            const requires2FA = (security as any).require_two_factor_auth === true;
            setSystemRequires2FA(requires2FA);
          }
        } catch (error) {
          console.error('Error checking 2FA requirement:', error);
        } finally {
          setChecking2FA(false);
        }
      }
    };

    checkSystem2FA();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading || !user || checking2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Check if 2FA setup is required
  // Only redirect if system requires 2FA AND user doesn't have it enabled
  // Allow access to security page itself
  const isSecurityPage = location.pathname === '/dashboard/security';
  
  // Check if user needs 2FA setup
  // Only redirect if:
  // 1. System requires 2FA is true
  // 2. User's two_factor_enabled is explicitly false (not undefined/null)
  // 3. We're not already on the security page
  const userNeeds2FASetup = systemRequires2FA && user.two_factor_enabled === false;
  
  if (userNeeds2FASetup && !isSecurityPage) {
    console.log('Redirecting to security page - 2FA required but not set up:', {
      systemRequires2FA,
      two_factor_enabled: user.two_factor_enabled,
      pathname: location.pathname
    });
    return <Navigate to="/dashboard/security" replace />;
  }
  
  // Also check requires2FASetup flag (set during login)
  if (requires2FASetup && !isSecurityPage) {
    console.log('Redirecting to security page - requires2FASetup flag set:', {
      requires2FASetup,
      pathname: location.pathname
    });
    return <Navigate to="/dashboard/security" replace />;
  }

  // Check excluded roles first - if user has an excluded role, deny access
  if (excludedRole && hasRole(excludedRole)) {
    return <Navigate to="/dashboard/sales/orders" replace />;
  }

  if (excludedRoles && excludedRoles.length > 0 && hasAnyRole(excludedRoles)) {
    return <Navigate to="/dashboard/sales/orders" replace />;
  }

  // Check role requirements (most restrictive)
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check permission if required
  if (requiredService && !hasServiceAccess(requiredService)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check multiple permissions (user needs at least one)
  if (requiredPermissions && requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

