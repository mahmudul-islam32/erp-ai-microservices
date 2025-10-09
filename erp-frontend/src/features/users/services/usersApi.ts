import { authApi } from '../../../shared/api/client';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  role?: string;
  permissions?: string[];
  created_at?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role?: string;
  is_active?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  full_name?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
}

export const usersApi = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    const response = await authApi.get('/api/v1/users/');
    return response.data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await authApi.get(`/api/v1/users/${id}`);
    return response.data;
  },

  // Create user
  create: async (data: CreateUserData): Promise<User> => {
    const response = await authApi.post('/api/v1/users/', data);
    return response.data;
  },

  // Update user
  update: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await authApi.put(`/api/v1/users/${id}`, data);
    return response.data;
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    await authApi.delete(`/api/v1/users/${id}`);
  },
};

