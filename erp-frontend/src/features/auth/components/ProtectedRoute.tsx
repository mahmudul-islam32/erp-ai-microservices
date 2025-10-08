import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { getCurrentUser } from '../store/authSlice';
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
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
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

