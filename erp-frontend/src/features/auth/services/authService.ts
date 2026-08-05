import { authApi } from '../../../shared/api/client';
import { LoginCredentials, LoginResult, User } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResult> => {
    const response = await authApi.post('/api/v1/auth/login', {
      email: credentials.username,
      password: credentials.password
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await authApi.get('/api/v1/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await authApi.put('/api/v1/auth/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await authApi.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  logout: async (): Promise<void> => {
    await authApi.post('/api/v1/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token?: string }> => {
    const response = await authApi.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

