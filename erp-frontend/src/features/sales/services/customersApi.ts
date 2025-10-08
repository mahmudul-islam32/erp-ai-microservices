import { salesApi } from '../../../shared/api/client';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const response = await salesApi.get('/api/v1/customers/');
    return response.data;
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

