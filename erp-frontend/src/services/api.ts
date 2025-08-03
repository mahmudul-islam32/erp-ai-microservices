import axios from 'axios';
import { AuthToken, LoginCredentials, RegisterData, User, ChangePasswordData } from '../types/auth';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json'
  },
  // Include credentials (cookies) with every request
  withCredentials: true
});

// We don't need to manually add Authorization header anymore
// as cookies are automatically sent with requests
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle 401 responses (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token - the backend will automatically use the refresh cookie
        const response = await apiClient.post('/api/v1/auth/refresh');
        
        // If successful, the backend has already set new cookies
        // Just retry the original request
        return apiClient(originalRequest);
      } catch (err) {
        // If refresh token fails, redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth Service
export const AuthService = {
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    const response = await apiClient.post<AuthToken>('/api/v1/auth/login', credentials);
    return response.data;
  },
  
  async register(userData: RegisterData): Promise<User> {
    const response = await apiClient.post<User>('/api/v1/auth/register', userData);
    return response.data;
  },
  
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },
  
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/v1/auth/change-password', data);
    return response.data;
  },
  
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/v1/auth/forgot-password', { email });
    return response.data;
  },
  
  async refreshToken(): Promise<AuthToken> {
    const response = await apiClient.post<AuthToken>('/api/v1/auth/refresh');
    return response.data;
  },
  
  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/api/v1/auth/logout');
    
    // Clear local storage (for user data only)
    localStorage.removeItem('user');
    
    return response.data;
  },
  
  isAuthenticated(): boolean {
    // Since we can't access HTTP-only cookies, we'll try to make a request to /me
    // and see if it succeeds. For better UX, we can store a flag in localStorage
    // that gets cleared on logout
    return !!localStorage.getItem('user');
  }
};

export default apiClient;
