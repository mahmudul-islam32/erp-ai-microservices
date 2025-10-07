import axios from 'axios';
import {
  Payment,
  PaymentCreate,
  PaymentFilters,
  PaymentSummary,
  Refund,
  RefundCreate,
  CashPaymentCreate
} from '../types/payment';
import { PaginationParams, PaginatedResponse } from '../types/sales';
import { AuthService } from './api';

// Create payment API client - using same base URL as sales service
const paymentApiClient = axios.create({
  baseURL: 'http://localhost:8003', // Same as sales service
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor
paymentApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for authentication errors
paymentApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await AuthService.refreshToken();
        return paymentApiClient.request(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Payment API
export const paymentsApi = {
  // Create generic payment
  createPayment: async (payment: PaymentCreate): Promise<Payment> => {
    const response = await paymentApiClient.post('/api/v1/payments/', payment);
    return response.data;
  },

  // Create cash payment (simplified)
  createCashPayment: async (payment: CashPaymentCreate): Promise<Payment> => {
    const response = await paymentApiClient.post('/api/v1/payments/cash', payment);
    return response.data;
  },

  // Create card payment
  createCardPayment: async (payment: PaymentCreate): Promise<Payment> => {
    const response = await paymentApiClient.post('/api/v1/payments/card', payment);
    return response.data;
  },

  // POS transaction removed

  // Get payments with pagination and filters
  getPayments: async (
    params?: PaginationParams & PaymentFilters
  ): Promise<PaginatedResponse<Payment>> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params?.page && params?.limit) {
      queryParams.skip = (params.page - 1) * params.limit;
      queryParams.limit = params.limit;
    } else if (params?.limit) {
      queryParams.limit = params.limit;
    }
    
    // Add filter parameters
    if (params?.payment_method) queryParams.payment_method = params.payment_method;
    if (params?.status) queryParams.status = params.status;
    if (params?.customer_id) queryParams.customer_id = params.customer_id;
    if (params?.order_id) queryParams.order_id = params.order_id;
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    if (params?.search) queryParams.search = params.search;
    
    const response = await paymentApiClient.get('/api/v1/payments/', { 
      params: queryParams 
    });
    return response.data;
  },

  // Get payment by ID
  getPayment: async (id: string): Promise<Payment> => {
    const response = await paymentApiClient.get(`/api/v1/payments/${id}`);
    return response.data;
  },

  // Get payments by order
  getPaymentsByOrder: async (orderId: string): Promise<Payment[]> => {
    const response = await paymentApiClient.get(`/api/v1/payments/order/${orderId}/payments`);
    return response.data;
  },

  // Get payments by customer
  getPaymentsByCustomer: async (
    customerId: string, 
    params?: { skip?: number; limit?: number }
  ): Promise<Payment[]> => {
    const queryParams: Record<string, number> = {};
    if (params?.skip) queryParams.skip = params.skip;
    if (params?.limit) queryParams.limit = params.limit;
    
    const response = await paymentApiClient.get(
      `/api/v1/payments/customer/${customerId}/payments`,
      { params: queryParams }
    );
    return response.data;
  },

  // Create refund
  createRefund: async (paymentId: string, refund: Omit<RefundCreate, 'payment_id'>): Promise<Refund> => {
    const response = await paymentApiClient.post(`/api/v1/payments/${paymentId}/refund`, refund);
    return response.data;
  },

  // Get daily summary
  getDailySummary: async (date?: string): Promise<PaymentSummary> => {
    const params = date ? { date_filter: date } : {};
    const response = await paymentApiClient.get('/api/v1/payments/daily-summary', { params });
    return response.data;
  },

  // Get payment methods summary
  getPaymentMethodsSummary: async (startDate?: string, endDate?: string): Promise<any> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await paymentApiClient.get('/api/v1/payments/methods/summary', { params });
    return response.data;
  },

  // POS endpoints removed
  
  // ==================== STRIPE PAYMENT ENDPOINTS ====================
  
  // Get Stripe configuration (publishable key)
  getStripeConfig: async (): Promise<{ publishable_key: string }> => {
    const response = await paymentApiClient.get('/api/v1/payments/stripe/config');
    return response.data;
  },

  // Create Stripe payment intent
  createStripePaymentIntent: async (data: {
    order_id: string;
    customer_id?: string;
    amount: number;
    currency?: string;
    description?: string;
    receipt_email?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    client_secret: string;
    payment_intent_id: string;
    publishable_key: string;
    amount: number;
    currency: string;
  }> => {
    const response = await paymentApiClient.post('/api/v1/payments/stripe/create-intent', data);
    return response.data;
  },

  // Confirm Stripe payment after client-side authorization
  confirmStripePayment: async (data: {
    payment_intent_id: string;
    order_id: string;
  }): Promise<Payment> => {
    const response = await paymentApiClient.post('/api/v1/payments/stripe/confirm', data);
    return response.data;
  },

  // Create Stripe refund
  createStripeRefund: async (paymentId: string, refund: Omit<RefundCreate, 'payment_id'>): Promise<Refund> => {
    const response = await paymentApiClient.post(`/api/v1/payments/stripe/refund/${paymentId}`, refund);
    return response.data;
  },
};

export default paymentsApi;
