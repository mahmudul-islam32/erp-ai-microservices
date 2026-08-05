import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProducts, deleteProduct } from '../store/productsSlice';
import { fetchCategories } from '../store/categoriesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { formatCurrency } from '../../../shared/utils/format';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { Permission } from '../../users/types';
import { ProductFilters as ProductFiltersComponent, type ProductFilters } from '../components/ProductFilters';
import { DeleteProductModal } from '../components/DeleteProductModal';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const productsState = useAppSelector((state) => state.products);
  const categoriesState = useAppSelector((state) => state.categories);
  const { products, isLoading } = productsState;
  const { categories } = categoriesState;
  const { hasPermission } = usePermissions();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [productToDelete, setProductToDelete] = useState<any>(null);
  
  const canCreate = hasPermission(Permission.INVENTORY_CREATE);
  const canUpdate = hasPermission(Permission.INVENTORY_UPDATE);
  const canDelete = hasPermission(Permission.INVENTORY_DELETE);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Debug: log products to see what we're getting
  useEffect(() => {
    console.log('Products from state:', products, 'Type:', typeof products, 'Is Array:', Array.isArray(products));
  }, [products]);

  const handleDelete = (product: any) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await dispatch(deleteProduct(productToDelete._id));
      setProductToDelete(null);
    }
  };

  const columns: Column<any>[] = [
    { key: 'sku', header: 'SKU', width: '120px' },
    { key: 'name', header: 'Product Name' },
    {
      key: 'price',
      header: 'Price',
      render: (product) => formatCurrency(product.price),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (product) => formatCurrency(product.cost),
    },
    {
      key: 'totalQuantity',
      header: 'On Hand',
      render: (product) => (
        <div className="text-sm">
          <span className="font-semibold text-slate-900">
            {product.totalQuantity || 0}
          </span>
          <span className="text-xs text-slate-500 ml-1">
            {product.unit || 'pcs'}
          </span>
        </div>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available',
      render: (product) => {
        const available = product.availableQuantity || 0;
        const total = product.totalQuantity || 0;
        const reorder = product.reorderPoint || 0;
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant={available > reorder ? 'success' : available > 0 ? 'warning' : 'danger'}>
              {available} {product.unit || 'pcs'}
            </Badge>
            {product.reservedQuantity > 0 && (
              <span className="text-xs text-slate-500">
                ({product.reservedQuantity} reserved)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (product) => (
        <Badge variant={product.isActive ? 'success' : 'danger'}>
          {product.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (product) => (
        <div className="flex items-center gap-2">
          {canUpdate && (
            <IconButton
              icon={Edit}
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/inventory/products/${product._id}/edit`);
              }}
              title="Edit Product"
            />
          )}
          {canDelete && (
            <IconButton
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(product);
              }}
              title="Delete Product"
            />
          )}
        </div>
      ),
    },
  ];

  // Ensure products is always an array
  const productsList = Array.isArray(products) ? products : [];
  
  const filteredProducts = productsList.filter((product) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        product.name?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.isActive !== undefined) {
      if (product.isActive !== filters.isActive) return false;
    }

    // Category filter
    if (filters.category) {
      // `typeof null === 'object'`, so the null check has to come first or a product
      // whose category was deleted throws on the property access.
      const productCategoryId = product.categoryId && typeof product.categoryId === 'object'
        ? product.categoryId._id
        : product.categoryId;
      if (productCategoryId !== filters.category) return false;
    }

    return true;
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Products' },
        ]}
        actions={
          canCreate ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/dashboard/inventory/products/create')}
            >
              Add Product
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <ProductFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories || []}
        />
        <Card>
          <Table
            data={filteredProducts}
            columns={columns}
            isLoading={isLoading}
            onRowClick={(product) => navigate(`/dashboard/inventory/products/${product._id}`)}
            emptyMessage="No products found. Create your first product!"
          />
        </Card>
      </div>

      {productToDelete && (
        <DeleteProductModal
          product={productToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setProductToDelete(null)}
          loading={isLoading}
        />
      )}
    </div>
  );
};
