import { inventoryApi } from '../../../shared/api/client';

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  cost: number;
  unit: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  isActive: boolean;
  isTrackable?: boolean;
  barcode?: string;
  images?: string[];
  weight?: number;
  dimensions?: string;
  supplierIds?: string[];
  tags?: string;
  totalQuantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  cost: number;
  unit: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  isActive?: boolean;
  isTrackable?: boolean;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  tags?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface UpdateStockData {
  quantity: number;
  warehouseId?: string;
}

export const productsApi = {
  getAll: async (params?: any): Promise<Product[]> => {
    const response = await inventoryApi.get('/products', { params });
    // API returns { products: [...] }, extract the array
    return response.data.products || [];
  },

  getById: async (id: string): Promise<Product> => {
    const response = await inventoryApi.get(`/products/${id}`);
    return response.data;
  },

  getBySku: async (sku: string): Promise<Product> => {
    const response = await inventoryApi.get(`/products/sku/${sku}`);
    return response.data;
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await inventoryApi.get('/products/low-stock');
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await inventoryApi.get('/products/stats');
    return response.data;
  },

  create: async (data: CreateProductData): Promise<Product> => {
    const response = await inventoryApi.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductData): Promise<Product> => {
    const response = await inventoryApi.put(`/products/${id}`, data);
    return response.data;
  },

  updateStock: async (id: string, data: UpdateStockData): Promise<Product> => {
    const response = await inventoryApi.put(`/products/${id}/stock`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await inventoryApi.delete(`/products/${id}`);
  },

  uploadImage: async (id: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await inventoryApi.post(`/upload/product/${id}`, formData);
    return response.data;
  },
};
