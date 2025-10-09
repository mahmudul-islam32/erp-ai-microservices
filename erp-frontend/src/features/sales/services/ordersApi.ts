import { salesApi } from '../../../shared/api/client';

export interface LineItem {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
  tax_rate?: number;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer?: any;
  line_items: LineItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  order_date: string;
  delivery_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderData {
  customer_id: string;
  line_items: LineItem[];
  notes?: string;
  payment_method?: string;
  delivery_date?: string;
  discount_amount?: number;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  status?: string;
  payment_status?: string;
}

export const ordersApi = {
  getAll: async (params?: any): Promise<{ items: SalesOrder[]; total: number }> => {
    const response = await salesApi.get('/api/v1/sales-orders/', { params });
    
    // Normalize items to ensure they have id field
    const items = (response.data.items || []).map((item: any) => {
      if (!item.id && item._id) {
        item.id = item._id;
      }
      return item;
    });
    
    return {
      items,
      total: response.data.total || 0,
    };
  },

  getById: async (id: string): Promise<SalesOrder> => {
    const response = await salesApi.get(`/api/v1/sales-orders/${id}`);
    const orderData = response.data;
    
    // Handle both id and _id from backend
    if (!orderData.id && orderData._id) {
      orderData.id = orderData._id;
    }
    
    return orderData;
  },

  create: async (data: CreateOrderData): Promise<SalesOrder> => {
    const response = await salesApi.post('/api/v1/sales-orders/', data);
    console.log('Raw API response:', response.data);
    
    // Handle both id and _id from backend
    const orderData = response.data;
    if (!orderData.id && orderData._id) {
      orderData.id = orderData._id;
    }
    
    console.log('Normalized order data:', orderData);
    return orderData;
  },

  update: async (id: string, data: UpdateOrderData): Promise<SalesOrder> => {
    const response = await salesApi.put(`/api/v1/sales-orders/${id}`, data);
    const orderData = response.data;
    if (!orderData.id && orderData._id) {
      orderData.id = orderData._id;
    }
    return orderData;
  },

  delete: async (id: string): Promise<void> => {
    await salesApi.delete(`/api/v1/sales-orders/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<SalesOrder> => {
    const response = await salesApi.patch(`/api/v1/sales-orders/${id}/status`, { status });
    const orderData = response.data;
    if (!orderData.id && orderData._id) {
      orderData.id = orderData._id;
    }
    return orderData;
  },

  updatePaymentStatus: async (id: string, payment_status: string): Promise<SalesOrder> => {
    const response = await salesApi.patch(`/api/v1/sales-orders/${id}/payment-status`, { payment_status });
    const orderData = response.data;
    if (!orderData.id && orderData._id) {
      orderData.id = orderData._id;
    }
    return orderData;
  },
};

