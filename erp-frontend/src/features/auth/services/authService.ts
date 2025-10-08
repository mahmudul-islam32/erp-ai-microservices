import { authApi } from '../../../shared/api/client';
import { LoginCredentials, LoginResponse, User } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await authApi.post('/api/v1/auth/login/oauth', formData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await authApi.get('/api/v1/auth/me');
    return response.data;
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

