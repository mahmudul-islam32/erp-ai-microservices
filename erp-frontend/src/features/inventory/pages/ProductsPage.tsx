import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProducts, deleteProduct } from '../store/productsSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { formatCurrency } from '../../../shared/utils/format';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const productsState = useAppSelector((state) => state.products);
  const { products, isLoading } = productsState;
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Debug: log products to see what we're getting
  useEffect(() => {
    console.log('Products from state:', products, 'Type:', typeof products, 'Is Array:', Array.isArray(products));
  }, [products]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await dispatch(deleteProduct(id));
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
      header: 'Stock',
      render: (product) => {
        const qty = product.totalQuantity || 0;
        const reorder = product.reorderPoint || 0;
        return (
          <Badge variant={qty > reorder ? 'success' : qty > 0 ? 'warning' : 'danger'}>
            {qty} {product.unit || 'pcs'}
          </Badge>
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
      width: '200px',
      render: (product) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Edit className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/inventory/products/${product._id}/edit`);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(product._id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Ensure products is always an array
  const productsList = Array.isArray(products) ? products : [];
  
  const filteredProducts = productsList.filter(
    (product) =>
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/dashboard/inventory/products/create')}
          >
            Add Product
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search by name, SKU, or description..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredProducts}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(product) => navigate(`/dashboard/inventory/products/${product._id}`)}
          emptyMessage="No products found. Create your first product!"
        />
      </Card>
    </div>
  );
};
