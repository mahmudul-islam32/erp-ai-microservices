import { inventoryApi } from '../../../shared/api/client';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  image?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  code?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
  image?: string;
  tags?: string[];
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export const categoriesApi = {
  getAll: async (params?: any): Promise<Category[]> => {
    // Use a large limit to get all categories and avoid the parentId filter issue
    const response = await inventoryApi.get('/categories', { 
      params: { ...params, limit: 1000 } 
    });
    // Handle both wrapped {categories: []} and direct [] formats
    if (response.data.categories) {
      return response.data.categories;
    } else if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getById: async (id: string): Promise<Category> => {
    const response = await inventoryApi.get(`/categories/${id}`);
    return response.data;
  },

  getByCode: async (code: string): Promise<Category> => {
    const response = await inventoryApi.get(`/categories/code/${code}`);
    return response.data;
  },

  getRoot: async (): Promise<Category[]> => {
    const response = await inventoryApi.get('/categories/root');
    return response.data;
  },

  getTree: async (): Promise<Category[]> => {
    const response = await inventoryApi.get('/categories/tree');
    return response.data;
  },

  getChildren: async (id: string): Promise<Category[]> => {
    const response = await inventoryApi.get(`/categories/${id}/children`);
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await inventoryApi.get('/categories/stats');
    return response.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await inventoryApi.post('/categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    const response = await inventoryApi.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await inventoryApi.delete(`/categories/${id}`);
  },
};

