import apiClient from './api';
import { User, UserRole } from '../types/auth';

export const UserService = {
  async getUsers(page = 1, limit = 10, role?: UserRole, status?: string): Promise<{ users: User[], total: number }> {
    const params = {
      skip: (page - 1) * limit,
      limit,
      role,
      status
    };
    
    const response = await apiClient.get('/api/v1/users', { params });
    
    // Assuming the backend returns an array of users
    // If it returns an object with pagination info, adjust accordingly
    return {
      users: response.data,
      total: response.headers['x-total-count'] ? parseInt(response.headers['x-total-count']) : response.data.length
    };
  },
  
  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/api/v1/users/${id}`);
    return response.data;
  },
  
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login' | 'permissions'> & { password: string }): Promise<User> {
    const response = await apiClient.post('/api/v1/users', userData);
    return response.data;
  },
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/api/v1/users/${id}`, userData);
    return response.data;
  },
  
  async deleteUser(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/api/v1/users/${id}`);
    return { success: true };
  },
  
  async updateUserPermissions(id: string, permissions: string[]): Promise<User> {
    const response = await apiClient.put(`/api/v1/users/${id}/permissions`, { permissions });
    return response.data;
  }
};
