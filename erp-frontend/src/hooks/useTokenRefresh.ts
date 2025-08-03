import { useEffect, useRef } from 'react';
import { AuthService } from '../services/api';

/**
 * Hook to automatically refresh access tokens in the background
 * This ensures the user stays logged in without interruption
 */
export const useTokenRefresh = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const refreshToken = async () => {
      try {
        // Call the refresh endpoint
        // If successful, the backend will automatically update the cookies
        await AuthService.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh token:', error);
        // If refresh fails, user will be redirected to login by the interceptor
      }
    };

    // Start periodic refresh - every 10 minutes (600000ms)
    // This is less than the 15-minute token expiry
    const startPeriodicRefresh = () => {
      intervalRef.current = setInterval(refreshToken, 10 * 60 * 1000);
    };

    // Check if user is likely authenticated (has user data in localStorage)
    if (localStorage.getItem('user')) {
      startPeriodicRefresh();
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Return cleanup function for manual use if needed
  const stopRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startRefresh = () => {
    if (!intervalRef.current && localStorage.getItem('user')) {
      intervalRef.current = setInterval(async () => {
        try {
          await AuthService.refreshToken();
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }, 10 * 60 * 1000);
    }
  };

  return { stopRefresh, startRefresh };
};
