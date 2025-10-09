import { inventoryApi } from '../../../shared/api/client';

export interface InventoryTransaction {
  _id: string;
  productId: string;
  warehouseId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  reason: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceAfter: number;
  reference?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export const inventoryTransactionsApi = {
  // Get transactions for a specific product
  getByProduct: async (productId: string, page: number = 1, limit: number = 50): Promise<{
    transactions: InventoryTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response = await inventoryApi.get(`/inventory/transactions/product/${productId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Get transactions by filters
  getByFilters: async (filters: {
    productId?: string;
    warehouseId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    transactions: InventoryTransaction[];
    total: number;
  }> => {
    const response = await inventoryApi.get('/inventory/transactions', { params: filters });
    return response.data;
  },
};

