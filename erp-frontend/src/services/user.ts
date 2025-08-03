import apiClient from './api';
import { User, Permission } from '../types/auth';

interface GetUsersParams {
  search?: string;
  role?: string;
  status?: string;
}

export const UserService = {
  async getUsers(page = 1, limit = 10, filters?: GetUsersParams): Promise<{ users: User[], total: number }> {
    const params: Record<string, string | number> = {
      skip: (page - 1) * limit,
      limit,
    };
    
    if (filters?.search) params.search = filters.search;
    if (filters?.role) params.role = filters.role;
    if (filters?.status) params.status = filters.status;
    
    const response = await apiClient.get('/api/v1/users', { params });
    
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
    await apiClient.delete(`/api/v1/users/${id}`);
    return { success: true };
  },
  
  async updateUserPermissions(id: string, permissions: Permission[]): Promise<User> {
    const response = await apiClient.put(`/api/v1/users/${id}/permissions`, { permissions });
    return response.data;
  },

  async resetUserPassword(id: string, newPassword: string, sendEmail = true): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/api/v1/users/${id}/reset-password`, { 
      new_password: newPassword,
      send_email: sendEmail 
    });
    return response.data;
  },

  async sendWelcomeEmail(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/api/v1/users/${id}/send-welcome`);
    return response.data;
  }
};
