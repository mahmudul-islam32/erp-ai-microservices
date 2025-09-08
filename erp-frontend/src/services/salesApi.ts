import axios from 'axios';
import {
  Customer,
  CustomerCreate,
  Product,
  SalesOrder,
  SalesOrderCreate,
  Quote,
  QuoteCreate,
  Invoice,
  InvoiceCreate,
  SalesAnalytics,
  PaginationParams,
  PaginatedResponse
} from '../types/sales';
import { AuthService } from './api';

// Resolve sales API base URL; default to direct backend URL
const SALES_API_BASE = (import.meta as any)?.env?.VITE_SALES_API_URL || 'http://localhost:8003';

// Create sales API client
const salesApiClient = axios.create({
  baseURL: SALES_API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  // Include credentials (cookies) with every request for authentication
  withCredentials: true
});

// Add interceptor for request (no need to manually add Authorization header with cookies)
salesApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle authentication errors
salesApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using the auth service
        await AuthService.refreshToken();
        
        // Retry the original request (cookies will be automatically included)
        return salesApiClient.request(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Customer API
export const customerApi = {
  // Get all customers with pagination
  getCustomers: async (params?: PaginationParams): Promise<PaginatedResponse<Customer>> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params?.page && params?.limit) {
      queryParams.skip = (params.page - 1) * params.limit;
      queryParams.limit = params.limit;
    } else if (params?.limit) {
      queryParams.limit = params.limit;
    }
    
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;
    
    const response = await salesApiClient.get('/api/v1/customers/', { 
      params: queryParams 
    });
    return response.data;
  },

  // Get customer by ID
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await salesApiClient.get(`/api/v1/customers/${id}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customer: CustomerCreate): Promise<Customer> => {
    const response = await salesApiClient.post('/api/v1/customers/', customer);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id: string, customer: Partial<CustomerCreate>): Promise<Customer> => {
    const response = await salesApiClient.put(`/api/v1/customers/${id}`, customer);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await salesApiClient.delete(`/api/v1/customers/${id}`);
  },

  // Search customers
  searchCustomers: async (query: string): Promise<Customer[]> => {
    const response = await salesApiClient.get(`/api/v1/customers/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

// Products API (from inventory service)
export const productsApi = {
  // Get all products
  getProducts: async (params?: PaginationParams): Promise<PaginatedResponse<Product>> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params?.page && params?.limit) {
      queryParams.skip = (params.page - 1) * params.limit;
      queryParams.limit = params.limit;
    } else if (params?.limit) {
      queryParams.limit = params.limit;
    }
    
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;
    
    const response = await salesApiClient.get('/api/v1/products/', { 
      params: queryParams 
    });
    return response.data;
  },

  // Get product by ID
  getProduct: async (id: string): Promise<Product> => {
    const response = await salesApiClient.get(`/api/v1/products/${id}`);
    return response.data;
  },

  // Search products
  searchProducts: async (query: string): Promise<Product[]> => {
    const response = await salesApiClient.get(`/api/v1/products/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

// Sales Orders API
export const salesOrdersApi = {
  // Get all sales orders
  getOrders: async (params?: PaginationParams): Promise<PaginatedResponse<SalesOrder>> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params?.page && params?.limit) {
      queryParams.skip = (params.page - 1) * params.limit;
      queryParams.limit = params.limit;
    } else if (params?.limit) {
      queryParams.limit = params.limit;
    }
    
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;
    
    const response = await salesApiClient.get('/api/v1/sales-orders/', { 
      params: queryParams 
    });
    return response.data;
  },

  // Get order by ID
  getOrder: async (id: string): Promise<SalesOrder> => {
    const response = await salesApiClient.get(`/api/v1/sales-orders/${id}`);
    return response.data;
  },

  // Create new order
  createOrder: async (order: SalesOrderCreate): Promise<SalesOrder> => {
    const response = await salesApiClient.post('/api/v1/sales-orders/', order);
    return response.data;
  },

  // Update order
  updateOrder: async (id: string, order: Partial<SalesOrderCreate>): Promise<SalesOrder> => {
    const response = await salesApiClient.put(`/api/v1/sales-orders/${id}`, order);
    return response.data;
  },

  // Delete order
  deleteOrder: async (id: string): Promise<void> => {
    await salesApiClient.delete(`/api/v1/sales-orders/${id}`);
  },

  // Update order status
  updateOrderStatus: async (id: string, status: string): Promise<SalesOrder> => {
    const response = await salesApiClient.patch(`/api/v1/sales-orders/${id}/status`, { status });
    return response.data;
  },

  // Convert quote to order
  convertQuoteToOrder: async (quoteId: string): Promise<SalesOrder> => {
    const response = await salesApiClient.post(`/api/v1/sales-orders/from-quote/${quoteId}`);
    return response.data;
  }
};

// Quotes API
export const quotesApi = {
  // Get all quotes
  getQuotes: async (params?: PaginationParams): Promise<PaginatedResponse<Quote>> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params?.page && params?.limit) {
      queryParams.skip = (params.page - 1) * params.limit;
      queryParams.limit = params.limit;
    } else if (params?.limit) {
      queryParams.limit = params.limit;
    }
    
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;
    
    const response = await salesApiClient.get('/api/v1/quotes/', { 
      params: queryParams 
    });
    return response.data;
  },

  // Get quote by ID
  getQuote: async (id: string): Promise<Quote> => {
    const response = await salesApiClient.get(`/api/v1/quotes/${id}`);
    return response.data;
  },

  // Create new quote
  createQuote: async (quote: QuoteCreate): Promise<Quote> => {
    const response = await salesApiClient.post('/api/v1/quotes/', quote);
    return response.data;
  },

  // Update quote
  updateQuote: async (id: string, quote: Partial<QuoteCreate>): Promise<Quote> => {
    const response = await salesApiClient.put(`/api/v1/quotes/${id}`, quote);
    return response.data;
  },

  // Delete quote
  deleteQuote: async (id: string): Promise<void> => {
    await salesApiClient.delete(`/api/v1/quotes/${id}`);
  },

  // Update quote status
  updateQuoteStatus: async (id: string, status: string): Promise<Quote> => {
    const response = await salesApiClient.patch(`/api/v1/quotes/${id}/status`, { status });
    return response.data;
  },

  // Send quote to customer
  sendQuote: async (id: string): Promise<Quote> => {
    const response = await salesApiClient.post(`/api/v1/quotes/${id}/send`);
    return response.data;
  }
};

// Invoices API
export const invoicesApi = {
  // Get all invoices
  getInvoices: async (params?: PaginationParams): Promise<PaginatedResponse<Invoice>> => {
    const queryParams: Record<string, string | number> = {};
    
    if (params?.page && params?.limit) {
      queryParams.skip = (params.page - 1) * params.limit;
      queryParams.limit = params.limit;
    } else if (params?.limit) {
      queryParams.limit = params.limit;
    }
    
    if (params?.search) queryParams.search = params.search;
    if (params?.sort_by) queryParams.sort_by = params.sort_by;
    if (params?.sort_order) queryParams.sort_order = params.sort_order;
    
    const response = await salesApiClient.get('/api/v1/invoices/', { 
      params: queryParams 
    });
    return response.data;
  },

  // Get invoice by ID
  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await salesApiClient.get(`/api/v1/invoices/${id}`);
    return response.data;
  },

  // Create new invoice
  createInvoice: async (invoice: InvoiceCreate): Promise<Invoice> => {
    const response = await salesApiClient.post('/api/v1/invoices/', invoice);
    return response.data;
  },

  // Update invoice
  updateInvoice: async (id: string, invoice: Partial<InvoiceCreate>): Promise<Invoice> => {
    const response = await salesApiClient.put(`/api/v1/invoices/${id}`, invoice);
    return response.data;
  },

  // Delete invoice
  deleteInvoice: async (id: string): Promise<void> => {
    await salesApiClient.delete(`/api/v1/invoices/${id}`);
  },

  // Update invoice status
  updateInvoiceStatus: async (id: string, status: string): Promise<Invoice> => {
    const response = await salesApiClient.patch(`/api/v1/invoices/${id}/status`, { status });
    return response.data;
  },

  // Record payment
  recordPayment: async (id: string, amount: number, paymentDate?: string): Promise<Invoice> => {
    const response = await salesApiClient.post(`/api/v1/invoices/${id}/payments`, {
      amount,
      payment_date: paymentDate || new Date().toISOString()
    });
    return response.data;
  },

  // Send invoice to customer
  sendInvoice: async (id: string): Promise<Invoice> => {
    const response = await salesApiClient.post(`/api/v1/invoices/${id}/send`);
    return response.data;
  },

  // Generate invoice from order
  generateFromOrder: async (orderId: string): Promise<Invoice> => {
    const response = await salesApiClient.post(`/api/v1/invoices/from-order/${orderId}`);
    return response.data;
  }
};

// Analytics API
export const analyticsApi = {
  // Get sales analytics dashboard
  getSalesAnalytics: async (startDate?: string, endDate?: string): Promise<SalesAnalytics> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await salesApiClient.get('/api/v1/analytics/dashboard', { params });
    return response.data;
  },

  // Get revenue analytics
  getRevenueAnalytics: async (period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<Record<string, unknown>> => {
    const response = await salesApiClient.get(`/api/v1/analytics/revenue?period=${period}`);
    return response.data;
  },

  // Get customer analytics
  getCustomerAnalytics: async (): Promise<Record<string, unknown>> => {
    const response = await salesApiClient.get('/api/v1/analytics/customer-analytics');
    return response.data;
  },

  // Get product analytics
  getProductAnalytics: async (): Promise<Record<string, unknown>> => {
    const response = await salesApiClient.get('/api/v1/analytics/product-analytics');
    return response.data;
  }
};

export default {
  customers: customerApi,
  products: productsApi,
  orders: salesOrdersApi,
  quotes: quotesApi,
  invoices: invoicesApi,
  analytics: analyticsApi
};
