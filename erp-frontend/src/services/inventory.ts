import axios from 'axios';

// Resolve inventory API base URL; default to direct backend URL
const INVENTORY_API_BASE = (import.meta as any)?.env?.VITE_INVENTORY_API_URL || 'http://localhost:8002';

// Create axios instance for inventory service
const inventoryApiClient = axios.create({
  baseURL: INVENTORY_API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add authentication interceptors (same as main API client)
inventoryApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle 401 responses (token expired)
inventoryApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token using the auth service
        await axios.post('http://localhost:8001/api/v1/auth/refresh', {}, {
          withCredentials: true
        });
        
        // If successful, the backend has already set new cookies
        // Just retry the original request
        return inventoryApiClient(originalRequest);
      } catch (err) {
        // If refresh token fails, redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types for inventory service
export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  cost: number;
  unit: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  isActive: boolean;
  isTrackable: boolean;
  images?: string[];
  tags?: string;
  dimensions?: string;
  weight?: number;
  barcode?: string;
  supplierIds?: string[];
  createdAt: string;
  updatedAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  taxId?: string;
  isActive: boolean;
  paymentTerms?: string;
  creditLimit?: number;
  leadTime?: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  capacity?: number;
  isActive: boolean;
  isMainWarehouse?: boolean;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  _id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
  batchNumber?: string;
  serialNumber?: string;
  expiryDate?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  _id: string;
  productId: string;
  warehouseId: string;
  type: string;
  reason: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceAfter: number;
  reference?: string;
  notes?: string;
  batchNumber?: string;
  serialNumber?: string;
  performedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  products?: T[];
  categories?: T[];
  suppliers?: T[];
  warehouses?: T[];
  inventory?: T[];
  transactions?: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  averageValue: number;
}

export interface CategoryTreeNode {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  children?: CategoryTreeNode[];
}

// Product Service
export const ProductService = {
  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    minPrice?: number;
    maxPrice?: number;
    lowStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Product>> {
    const response = await inventoryApiClient.get('/products', { params });
    return response.data;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await inventoryApiClient.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await inventoryApiClient.post('/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await inventoryApiClient.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const response = await inventoryApiClient.delete(`/products/${id}`);
    return response.data;
  },

  async updateProductStock(id: string, data: { quantity: number; operation: 'set' | 'add' | 'subtract' }): Promise<Product> {
    const response = await inventoryApiClient.put(`/products/${id}/stock`, data);
    return response.data;
  },

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const response = await inventoryApiClient.get('/products/low-stock', { params: { threshold } });
    return response.data;
  },

  async getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    averagePrice: number;
    categoriesCount: number;
  }> {
    const response = await inventoryApiClient.get('/products/stats');
    return response.data;
  }
};

// Category Service
export const CategoryService = {
  async getCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Category>> {
    const response = await inventoryApiClient.get('/categories', { params });
    return response.data;
  },

  async getCategoryById(id: string): Promise<Category> {
    const response = await inventoryApiClient.get(`/categories/${id}`);
    return response.data;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await inventoryApiClient.post('/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await inventoryApiClient.put(`/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await inventoryApiClient.delete(`/categories/${id}`);
    return response.data;
  },

  async getRootCategories(): Promise<Category[]> {
    const response = await inventoryApiClient.get('/categories/root');
    return response.data;
  },

  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const response = await inventoryApiClient.get('/categories/tree');
    return response.data;
  },

  async getCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    rootCategories: number;
    maxDepth: number;
    avgProductsPerCategory: number;
  }> {
    const response = await inventoryApiClient.get('/categories/stats');
    return response.data;
  }
};

// Supplier Service
export const SupplierService = {
  async getSuppliers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    city?: string;
    country?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Supplier>> {
    const response = await inventoryApiClient.get('/suppliers', { params });
    return response.data;
  },

  async getSupplierById(id: string): Promise<Supplier> {
    const response = await inventoryApiClient.get(`/suppliers/${id}`);
    return response.data;
  },

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    const response = await inventoryApiClient.post('/suppliers', data);
    return response.data;
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    const response = await inventoryApiClient.put(`/suppliers/${id}`, data);
    return response.data;
  },

  async deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
    const response = await inventoryApiClient.delete(`/suppliers/${id}`);
    return response.data;
  },

  async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    const response = await inventoryApiClient.get('/suppliers/search', { params: { searchTerm } });
    return response.data;
  },

  async getSupplierStats(): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    averageLeadTime: number;
    suppliersWithCreditLimit: number;
    topCountries: string[];
  }> {
    const response = await inventoryApiClient.get('/suppliers/stats');
    return response.data;
  }
};

// Warehouse Service
export const WarehouseService = {
  async getWarehouses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    type?: string;
    city?: string;
    country?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Warehouse>> {
    const response = await inventoryApiClient.get('/warehouses', { params });
    return response.data;
  },

  async getWarehouseById(id: string): Promise<Warehouse> {
    const response = await inventoryApiClient.get(`/warehouses/${id}`);
    return response.data;
  },

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await inventoryApiClient.post('/warehouses', data);
    return response.data;
  },

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await inventoryApiClient.put(`/warehouses/${id}`, data);
    return response.data;
  },

  async deleteWarehouse(id: string): Promise<{ success: boolean; message: string }> {
    const response = await inventoryApiClient.delete(`/warehouses/${id}`);
    return response.data;
  },

  async getActiveWarehouses(): Promise<Warehouse[]> {
    const response = await inventoryApiClient.get('/warehouses/active');
    return response.data;
  },

  async searchWarehouses(searchTerm: string): Promise<Warehouse[]> {
    const response = await inventoryApiClient.get('/warehouses/search', { params: { searchTerm } });
    return response.data;
  },

  async getWarehouseStats(): Promise<{
    totalWarehouses: number;
    activeWarehouses: number;
    inactiveWarehouses: number;
    mainWarehouses: number;
    totalCapacity: number;
    avgCapacity: number;
    topCities: string[];
  }> {
    const response = await inventoryApiClient.get('/warehouses/stats');
    return response.data;
  }
};

// Inventory Service
export const InventoryService = {
  async getInventory(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    warehouseId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Inventory>> {
    const response = await inventoryApiClient.get('/inventory', { params });
    return response.data;
  },

  async getInventoryById(id: string): Promise<Inventory> {
    const response = await inventoryApiClient.get(`/inventory/${id}`);
    return response.data;
  },

  async createInventory(data: {
    productId: string;
    warehouseId: string;
    currentStock: number;
    reservedStock?: number;
    availableStock?: number;
  }): Promise<Inventory> {
    const response = await inventoryApiClient.post('/inventory', data);
    return response.data;
  },

  async updateInventory(id: string, data: Partial<Inventory>): Promise<Inventory> {
    const response = await inventoryApiClient.put(`/inventory/${id}`, data);
    return response.data;
  },

  async deleteInventory(id: string): Promise<{ success: boolean; message: string }> {
    const response = await inventoryApiClient.delete(`/inventory/${id}`);
    return response.data;
  },

  async getLowStockItems(): Promise<Inventory[]> {
    const response = await inventoryApiClient.get('/inventory/low-stock');
    return response.data;
  },

  async getOutOfStockItems(): Promise<Inventory[]> {
    const response = await inventoryApiClient.get('/inventory/out-of-stock');
    return response.data;
  },

  async getInventoryStats(): Promise<InventoryStats> {
    const response = await inventoryApiClient.get('/inventory/stats');
    return response.data;
  },

  async getInventoryByProduct(productId: string): Promise<Inventory[]> {
    const response = await inventoryApiClient.get(`/inventory/product/${productId}`);
    return response.data;
  },

  async getInventoryByWarehouse(warehouseId: string): Promise<Inventory[]> {
    const response = await inventoryApiClient.get(`/inventory/warehouse/${warehouseId}`);
    return response.data;
  },

  async createTransaction(data: {
    productId: string;
    warehouseId: string;
    type: string;
    reason: string;
    quantity: number;
    unitCost: number;
    performedBy: string;
    reference?: string;
    notes?: string;
    batchNumber?: string;
    serialNumber?: string;
  }): Promise<InventoryTransaction> {
    const response = await inventoryApiClient.post('/inventory/transactions', data);
    return response.data;
  },

  async getTransactionHistory(inventoryId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InventoryTransaction>> {
    const response = await inventoryApiClient.get(`/inventory/transactions/history/${inventoryId}`, { params });
    return response.data;
  },

  async adjustStock(data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reason: string;
    notes?: string;
    performedBy: string;
  }): Promise<{ inventory: Inventory; transaction: InventoryTransaction }> {
    const response = await inventoryApiClient.post('/inventory/adjust', data);
    return response.data;
  },

  async transferStock(data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
    performedBy: string;
  }): Promise<{ fromInventory: Inventory; toInventory: Inventory; outTransaction: InventoryTransaction; inTransaction: InventoryTransaction }> {
    const response = await inventoryApiClient.post('/inventory/transfer', data);
    return response.data;
  }
};

export default inventoryApiClient;
