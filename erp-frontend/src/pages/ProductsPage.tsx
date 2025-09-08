import React, { useState, useEffect, useCallback } from 'react';
import { SAPPageLayout } from '../components/Layout/SAPPageLayout';
import { SAPCard } from '../components/UI/SAPCard';
import { SAPButton } from '../components/UI/SAPButton';
import { SAPTable } from '../components/UI/SAPTable';
import ProductImage from '../components/UI/ProductImage';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { ProductService, CategoryService, InventoryService, WarehouseService, Product, Category, Inventory, Warehouse } from '../services/inventory';

const ProductsPage = () => {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProductService.getProducts();
      console.log('Products API response:', response);
      console.log('First product categoryId:', response.products?.[0]?.categoryId);
      setProducts(response.products || []);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await CategoryService.getCategories();
      console.log('Categories API response:', response);
      setCategories(response.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await InventoryService.getInventory({ limit: 1000 });
      setInventory(response.inventory || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await WarehouseService.getWarehouses({ limit: 1000 });
      setWarehouses(response.warehouses || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchInventory();
    fetchWarehouses();
  }, [fetchProducts, fetchCategories, fetchInventory, fetchWarehouses]);

  const handleDelete = useCallback(async (product: Product) => {
    const confirmed = window.confirm(`Delete product "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(product._id);
      await ProductService.deleteProduct(product._id);
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  }, [fetchProducts]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (categoryFilter !== 'ALL') {
      if (typeof product.categoryId === 'object' && product.categoryId?._id) {
        matchesCategory = product.categoryId._id === categoryFilter;
      } else if (typeof product.categoryId === 'string') {
        matchesCategory = product.categoryId === categoryFilter;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  const getTotalAvailableForProduct = useCallback((productId: string) => {
    const items = inventory.filter(inv => inv.productId === productId);
    if (items.length === 0) return 0;
    return items.reduce((sum, inv) => {
      const available = typeof inv.availableQuantity === 'number'
        ? inv.availableQuantity
        : Math.max(0, (inv.quantity || 0) - (inv.reservedQuantity || 0));
      return sum + available;
    }, 0);
  }, [inventory]);

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span 
        style={{ 
          backgroundColor: isActive ? '#10B98120' : '#EF444420',
          color: isActive ? '#10B981' : '#EF4444',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase'
        }}
      >
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    );
  };

  const columns = [
    {
      key: 'product',
      title: 'PRODUCT',
      dataIndex: 'name',
      render: (value: string, record: Product) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Product Image */}
          <ProductImage
            src={record.images && record.images.length > 0 ? record.images[0] : undefined}
            alt={record.name}
            width={48}
            height={48}
          />
          
          {/* Product Info */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: '600', color: 'var(--sap-text-primary)', marginBottom: '2px' }}>
              {record.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--sap-text-secondary)' }}>
              SKU: {record.sku || 'N/A'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'CATEGORY',
      dataIndex: 'categoryId',
      render: (value: any, record: Product) => {
        // Handle both populated category object and category ID
        let categoryName = 'Uncategorized';
        
        if (typeof value === 'object' && value?.name) {
          // If categoryId is populated as an object
          categoryName = value.name;
        } else if (typeof value === 'string') {
          // If categoryId is just an ID string, find in categories array
          const category = categories.find(c => c._id === value);
          categoryName = category?.name || 'Uncategorized';
        }
        
        return (
          <span style={{ color: 'var(--sap-text-primary)' }}>
            {categoryName}
          </span>
        );
      }
    },
    {
      key: 'price',
      title: 'PRICE',
      dataIndex: 'price',
      render: (value: number) => (
        <span style={{ fontWeight: '600', color: 'var(--sap-text-primary)' }}>
          ${value?.toFixed(2) || '0.00'}
        </span>
      )
    },
    {
      key: 'unit',
      title: 'UNIT',
      dataIndex: 'unit',
      render: (value: string) => (
        <span style={{ fontWeight: '600', color: 'var(--sap-text-primary)' }}>
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'available',
      title: 'AVAILABLE',
      dataIndex: '_id',
      render: (value: string) => {
        const total = getTotalAvailableForProduct(value);
        return (
          <span style={{ fontWeight: '600', color: total > 0 ? 'var(--sap-text-primary)' : '#EF4444' }}>
            {total}
          </span>
        );
      }
    },
    {
      key: 'warehouses',
      title: 'WAREHOUSES',
      dataIndex: '_id',
      render: (value: string, record: Product) => {
        // Find inventory records for this product
        const productInventory = inventory.filter(inv => inv.productId === value);
        
        if (productInventory.length === 0) {
          return (
            <span style={{ color: 'var(--sap-text-secondary)', fontSize: '12px' }}>
              No stock
            </span>
          );
        }
        
        // Group by warehouse and show total quantity
        const warehouseGroups = productInventory.reduce((acc, inv) => {
          const warehouseId = inv.warehouseId;
          if (!acc[warehouseId]) {
            acc[warehouseId] = 0;
          }
          acc[warehouseId] += inv.quantity;
          return acc;
        }, {} as Record<string, number>);
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {Object.entries(warehouseGroups).map(([warehouseId, quantity]) => {
              const warehouse = warehouses.find(w => w._id === warehouseId);
              const warehouseName = warehouse?.name || `Warehouse ${warehouseId.slice(-4)}`;
              
              return (
                <span key={warehouseId} style={{ 
                  fontSize: '12px', 
                  color: 'var(--sap-text-primary)',
                  backgroundColor: quantity > 0 ? '#10B98120' : '#EF444420',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  width: 'fit-content'
                }}>
                  {warehouseName}: {quantity > 0 ? `${quantity} units` : 'Out of stock'}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'STATUS',
      dataIndex: 'isActive',
      render: (value: boolean) => getStatusBadge(value)
    },
    {
      key: 'actions',
      title: 'ACTIONS',
      dataIndex: '_id',
      render: (value: string, record: Product) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <SAPButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/inventory/products/${record._id}`)}
          >
            <IconEye size={16} />
          </SAPButton>
          <SAPButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/inventory/products/${record._id}/edit`)}
          >
            <IconEdit size={16} />
          </SAPButton>
          <SAPButton
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record)}
            loading={deletingId === record._id}
          >
            <IconTrash size={16} />
          </SAPButton>
        </div>
      )
    }
  ];

  const pageActions = (
    <div style={{ display: 'flex', gap: '12px' }}>
      <SAPButton
        variant="outline"
        onClick={fetchProducts}
        loading={loading}
      >
        Refresh
      </SAPButton>
      <SAPButton
        variant="primary"
        onClick={() => navigate('/dashboard/inventory/products/create')}
      >
        <IconPlus size={16} />
            Add Product
      </SAPButton>
    </div>
  );

  return (
    <SAPPageLayout
      title="Products"
      subtitle="Manage your product catalog and inventory"
      actions={pageActions}
    >
          <SAPCard>
        <div style={{ padding: '24px' }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#F0F9FF',
            border: '1px solid #BAE6FD',
            borderRadius: '8px',
            color: '#0369A1',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            <strong>Note:</strong> Stock quantities are managed separately through the inventory system. 
            Use the "Stock Management" page to view and manage actual stock levels.
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            alignItems: 'center'
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <IconSearch 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: 'var(--sap-text-secondary)'
                }} 
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid var(--sap-neutral-300)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--sap-bg-primary)',
                  color: 'var(--sap-text-primary)'
                }}
              />
                        </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '12px',
                border: '1px solid var(--sap-neutral-300)',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'var(--sap-bg-primary)',
                color: 'var(--sap-text-primary)',
                minWidth: '150px'
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--sap-bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--sap-neutral-200)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--sap-text-primary)' }}>
                {products.length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--sap-text-secondary)' }}>
                Total Products
              </div>
            </div>
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--sap-bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--sap-neutral-200)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>
                {products.filter(p => p.isActive).length}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--sap-text-secondary)' }}>
                Active Products
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <SAPTable
            columns={columns}
            data={filteredProducts}
            loading={loading}
            emptyText="No products found"
          />
        </div>
      </SAPCard>
    </SAPPageLayout>
  );
};

export default ProductsPage;
