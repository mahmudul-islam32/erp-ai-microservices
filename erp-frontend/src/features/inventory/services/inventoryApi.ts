import { inventoryApi } from '../../../shared/api/client';

export interface InventoryItem {
  _id: string;
  productId: any; // Populated product object
  warehouseId: any; // Populated warehouse object
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdjustStockData {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
  notes?: string;
}

export interface TransferStockData {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  notes?: string;
}

export interface ReserveStockData {
  productId: string;
  warehouseId: string;
  quantity: number;
  reference?: string;
}

export const inventoryStockApi = {
  // Get all inventory entries
  getAll: async (params?: any): Promise<InventoryItem[]> => {
    const response = await inventoryApi.get('/inventory', { params });
    return response.data.inventory || [];
  },

  // Get inventory for a specific product
  getByProduct: async (productId: string): Promise<InventoryItem[]> => {
    const response = await inventoryApi.get(`/inventory/product/${productId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get inventory for a specific warehouse
  getByWarehouse: async (warehouseId: string): Promise<InventoryItem[]> => {
    const response = await inventoryApi.get(`/inventory/warehouse/${warehouseId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get low stock items
  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await inventoryApi.get('/inventory/low-stock');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get out of stock items
  getOutOfStock: async (): Promise<InventoryItem[]> => {
    const response = await inventoryApi.get('/inventory/out-of-stock');
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get inventory statistics
  getStats: async (): Promise<any> => {
    const response = await inventoryApi.get('/inventory/stats');
    return response.data;
  },

  // Adjust stock levels
  adjust: async (data: AdjustStockData): Promise<InventoryItem> => {
    const response = await inventoryApi.post('/inventory/adjust', data);
    return response.data;
  },

  // Transfer stock between warehouses
  transfer: async (data: TransferStockData): Promise<any> => {
    const response = await inventoryApi.post('/inventory/transfer', data);
    return response.data;
  },

  // Reserve stock
  reserve: async (data: ReserveStockData): Promise<any> => {
    const response = await inventoryApi.post('/inventory/reserve', data);
    return response.data;
  },

  // Release reserved stock
  release: async (data: ReserveStockData): Promise<any> => {
    const response = await inventoryApi.post('/inventory/release', data);
    return response.data;
  },
};

