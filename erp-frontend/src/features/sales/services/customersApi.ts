import { salesApi } from '../../../shared/api/client';

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code?: string;
  zip_code?: string;
  country?: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  customer_type: string;
  email: string;
  phone: string;
  billing_address: Address;
  shipping_address?: Address;
  payment_terms: string;
  credit_limit?: number;
  credit_used?: number;
  tax_id?: string;
  notes?: string;
  status: string;
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerData {
  first_name: string;
  last_name: string;
  company_name?: string;
  customer_type?: string;
  email: string;
  phone: string;
  billing_address: Address;
  shipping_address?: Address;
  payment_terms?: string;
  credit_limit?: number;
  tax_id?: string;
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const response = await salesApi.get('/api/v1/customers/');
    // Sales API returns { items: [...], total: ... }
    return response.data.items || [];
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await salesApi.get(`/api/v1/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await salesApi.post('/api/v1/customers/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCustomerData): Promise<Customer> => {
    const response = await salesApi.put(`/api/v1/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await salesApi.delete(`/api/v1/customers/${id}`);
  },
};

