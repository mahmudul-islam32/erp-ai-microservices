import { salesApi } from '../../../shared/api/client';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string;
  customer_id: string;
  customer?: any;
  line_items: any[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  due_date?: string;
  paid_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInvoiceData {
  order_id?: string;
  customer_id: string;
  line_items: any[];
  due_date?: string;
  notes?: string;
}

export const invoicesApi = {
  getAll: async (params?: any): Promise<{ items: Invoice[]; total: number }> => {
    const response = await salesApi.get('/api/v1/invoices/', { params });
    return {
      items: response.data.items || [],
      total: response.data.total || 0,
    };
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await salesApi.get(`/api/v1/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await salesApi.post('/api/v1/invoices/', data);
    return response.data;
  },

  generateFromOrder: async (orderId: string): Promise<Invoice> => {
    const response = await salesApi.post(`/api/v1/invoices/from-order/${orderId}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Invoice> => {
    const response = await salesApi.patch(`/api/v1/invoices/${id}/status`, { status });
    return response.data;
  },
};

