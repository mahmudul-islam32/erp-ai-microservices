import { inventoryApi } from '../../../shared/api/client';

export interface Warehouse {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isMainWarehouse: boolean;
  capacity?: number;
  type?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseData {
  name: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  isMainWarehouse?: boolean;
  capacity?: number;
  type?: string;
  notes?: string;
}

export interface UpdateWarehouseData extends Partial<CreateWarehouseData> {}

export const warehousesApi = {
  getAll: async (params?: any): Promise<Warehouse[]> => {
    const response = await inventoryApi.get('/warehouses', { params });
    return response.data.warehouses || [];
  },

  getById: async (id: string): Promise<Warehouse> => {
    const response = await inventoryApi.get(`/warehouses/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<Warehouse> => {
    const response = await inventoryApi.get(`/warehouses/code/${code}`);
    return response.data;
  },

  getActive: async (): Promise<Warehouse[]> => {
    const response = await inventoryApi.get('/warehouses/active');
    return response.data;
  },

  getByType: async (type: string): Promise<Warehouse[]> => {
    const response = await inventoryApi.get(`/warehouses/type/${type}`);
    return response.data;
  },

  search: async (query: string): Promise<Warehouse[]> => {
    const response = await inventoryApi.get('/warehouses/search', { params: { q: query } });
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await inventoryApi.get('/warehouses/stats');
    return response.data;
  },

  create: async (data: CreateWarehouseData): Promise<Warehouse> => {
    const response = await inventoryApi.post('/warehouses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWarehouseData): Promise<Warehouse> => {
    const response = await inventoryApi.put(`/warehouses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await inventoryApi.delete(`/warehouses/${id}`);
  },
};

