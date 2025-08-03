import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthService } from '../services/api';
import { User, LoginCredentials } from '../types/auth';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set up automatic token refresh
  const { stopRefresh, startRefresh } = useTokenRefresh();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get user data - if cookies exist and are valid, this will work
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
        
        // Store user data in localStorage for quick access (UI purposes only)
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Start automatic token refresh since user is authenticated
        startRefresh();
      } catch (err) {
        // If token is invalid, clear storage
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [startRefresh]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);

      // Get token from login endpoint (cookies are set automatically by backend)
      await AuthService.login(credentials);
      
      // Get user data
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      
      // Save user data to local storage for quick access (UI purposes only)
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Start automatic token refresh
      startRefresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await AuthService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Stop automatic token refresh
      stopRefresh();
      
      // Clear user data (cookies are cleared by backend)
      setUser(null);
      localStorage.removeItem('user');
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
