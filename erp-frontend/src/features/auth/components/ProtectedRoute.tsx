import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { getCurrentUser } from '../store/authSlice';
import { settingsApi, SettingsCategory } from '../../settings/services/settingsApi';
import { Spinner } from '../../../shared/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading, requires2FASetup } = useAppSelector((state) => state.auth);
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

  // Check permission if required
  if (requiredPermission && user.permissions) {
    const hasPermission = user.permissions.includes(requiredPermission) || user.is_superuser;
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
            <p className="text-slate-600 mt-2">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

