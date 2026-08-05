import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { AuthState, LoginCredentials, User, isTwoFactorRequired } from '../types';
import { toast } from 'sonner';

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,
  requires2FASetup: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      
      // Check if 2FA is required
      if (isTwoFactorRequired(response)) {
        // Return the 2FA requirement response without error
        return response;
      }
      
      // Normal login success
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      // Check if 2FA setup is recommended
      if (response && typeof response === 'object' && 'requires_2fa_setup' in response && response.requires_2fa_setup) {
        toast.warning('Please set up two-factor authentication in your security settings for enhanced security.');
      } else {
        toast.success('Login successful!');
      }
      
      return response;
    } catch (error: any) {
      let message = 'Login failed';
      
      // Handle FastAPI validation errors (array of error objects)
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Extract messages from validation error array
          message = detail.map((err: any) => err.msg || err.message).join(', ');
        } else if (typeof detail === 'string') {
          message = detail;
        } else if (typeof detail === 'object') {
          message = detail.msg || detail.message || JSON.stringify(detail);
        }
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error: any) {
      let message = 'Failed to fetch user';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          message = detail.map((err: any) => err.msg || err.message).join(', ');
        } else if (typeof detail === 'string') {
          message = detail;
        }
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      toast.success('Logged out successfully');
    } catch (error: any) {
      // Still logout on client even if server request fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.requires2FASetup = false;
    },
    clear2FASetupFlag: (state) => {
      state.requires2FASetup = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      
      // Check if 2FA is required (response has requires_2fa field)
      if (isTwoFactorRequired(action.payload)) {
        // Don't set authenticated state, just return the 2FA requirement
        state.error = null;
        return;
      }
      
      // Normal login success
      // The login endpoint returns tokens, not user object
      // User will be fetched separately by ProtectedRoute or App component
      state.accessToken = action.payload.access_token;
      state.refreshToken = action.payload.refresh_token;
      state.isAuthenticated = true;
      
      // Check if 2FA setup is required
      if (action.payload && typeof action.payload === 'object' && 'requires_2fa_setup' in action.payload) {
        state.requires2FASetup = action.payload.requires_2fa_setup === true;
      } else {
        state.requires2FASetup = false;
      }
      
      // User will be loaded by getCurrentUser thunk or ProtectedRoute
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get current user
    builder.addCase(getCurrentUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(getCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      const user = action.payload;
      // Compute full_name if not present
      if (user && !user.full_name) {
        user.full_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';
      }
      state.user = user;
      
      // If user has 2FA enabled, clear the requires2FASetup flag
      if (user && user.two_factor_enabled === true) {
        state.requires2FASetup = false;
      }
    });
    builder.addCase(getCurrentUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { setUser, clearAuth, clearError, clear2FASetupFlag } = authSlice.actions;
export default authSlice.reducer;

