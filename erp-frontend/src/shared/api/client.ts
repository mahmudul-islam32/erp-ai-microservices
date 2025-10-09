import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

// API Base URLs - Updated for Docker setup
const API_URLS = {
  auth: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8001',
  inventory: import.meta.env.VITE_INVENTORY_SERVICE_URL || 'http://localhost:8002',
  sales: import.meta.env.VITE_SALES_SERVICE_URL || 'http://localhost:8003',
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If sending FormData, remove Content-Type header so Axios can set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URLS.auth}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        
        localStorage.setItem('access_token', access_token);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    let message = 'An error occurred';
    
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        // FastAPI validation errors - array of error objects
        message = detail.map((err: any) => err.msg || err.message || 'Validation error').join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      } else if (typeof detail === 'object') {
        message = detail.msg || detail.message || JSON.stringify(detail);
      }
    } else if (error.message) {
      message = error.message;
    }
    
    toast.error(message);

    return Promise.reject(error);
  }
);

// Helper function to create service-specific client
export const createServiceClient = (service: keyof typeof API_URLS) => {
  return {
    get: (url: string, config?: any) => apiClient.get(`${API_URLS[service]}${url}`, config),
    post: (url: string, data?: any, config?: any) => apiClient.post(`${API_URLS[service]}${url}`, data, config),
    put: (url: string, data?: any, config?: any) => apiClient.put(`${API_URLS[service]}${url}`, data, config),
    patch: (url: string, data?: any, config?: any) => apiClient.patch(`${API_URLS[service]}${url}`, data, config),
    delete: (url: string, config?: any) => apiClient.delete(`${API_URLS[service]}${url}`, config),
  };
};

export const authApi = createServiceClient('auth');
export const inventoryApi = createServiceClient('inventory');
export const salesApi = createServiceClient('sales');
