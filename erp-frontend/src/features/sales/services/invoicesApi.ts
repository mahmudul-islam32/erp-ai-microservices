import { salesApi } from '../../../shared/api/client';

export interface Invoice {
  id: string;
  /** Some endpoints serialise by alias and return `_id` rather than `id`. */
  _id?: string;
  invoice_number: string;
  order_number?: string;
  payment_terms?: string;
  order_id?: string;
  customer_id: string;
  customer?: any;
  customer_name?: string;
  customer_email?: string;
  billing_address?: any;
  line_items: any[];
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount?: number;
  balance_due?: number;
  late_fee_amount?: number;
  status: string;
  invoice_date?: string;
  due_date?: string;
  paid_date?: string;
  paid_at?: string;
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
    try {
      console.log('📞 Fetching invoices from API...', params);
      const response = await salesApi.get('/api/v1/invoices/', { params });
      console.log('✅ Invoice API Response received:', response);
      console.log('📦 Response data:', response.data);
      console.log('📋 Response data items:', response.data?.items);
      console.log('🔢 Response data total:', response.data?.total);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data keys:', Object.keys(response.data || {}));
      
      // Handle both direct response and nested data
      const items = response.data?.items || response.data || [];
      const total = response.data?.total || (Array.isArray(items) ? items.length : 0);
      
      console.log('🔍 Items before normalization:', items);
      console.log('🔍 Items is array:', Array.isArray(items));
      console.log('🔍 Items length:', items?.length);
      
      // Normalize invoice IDs - handle both _id and id
      const normalizedItems = Array.isArray(items) ? items.map((item: any, index: number) => {
        // Ensure id is always set - prioritize id, then _id, then invoice_number
        const normalizedId = item.id || item._id || item.invoice_number;
        if (!normalizedId) {
          console.warn(`⚠️ Invoice ${index} missing ID:`, item);
        }
        const normalized = {
          ...item,
          id: normalizedId, // Always set id field
          _id: item._id || item.id, // Keep _id for backward compatibility
        };
        console.log(`✅ Normalized invoice ${index}:`, { id: normalized.id, invoice_number: normalized.invoice_number });
        return normalized;
      }) : [];
      
      console.log('✅ Processed items:', normalizedItems);
      console.log('✅ Processed total:', total);
      console.log('✅ Final return:', { itemsCount: normalizedItems.length, total });
      
      return {
        items: normalizedItems,
        total: total,
      };
    } catch (error: any) {
      console.error('❌ Error in invoicesApi.getAll:', error);
      console.error('❌ Error response:', error?.response);
      console.error('❌ Error response data:', error?.response?.data);
      throw error;
    }
  },

  getById: async (id: string): Promise<Invoice> => {
    const response = await salesApi.get(`/api/v1/invoices/${id}`);
    const invoice = response.data;
    console.log('Raw invoice response:', invoice);
    // Normalize ID to ensure consistency - use the route param as final fallback
    if (invoice) {
      invoice.id = invoice.id || invoice._id || invoice.invoice_number || id;
      console.log('Normalized invoice ID in API:', invoice.id);
    }
    return invoice;
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

  downloadPdf: async (id: string): Promise<Blob> => {
    if (!id || id === 'undefined') {
      throw new Error('Invoice ID is required for PDF download');
    }
    console.log('Downloading PDF for invoice ID:', id);
    const response = await salesApi.get(`/api/v1/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

