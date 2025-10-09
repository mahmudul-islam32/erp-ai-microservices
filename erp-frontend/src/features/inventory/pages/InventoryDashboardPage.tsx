import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProducts } from '../store/productsSlice';
import { fetchCategories } from '../store/categoriesSlice';
import { fetchWarehouses } from '../store/warehousesSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Package, Box, Warehouse, Tag, AlertTriangle } from 'lucide-react';
import { Badge } from '../../../shared/components/ui/Badge';
import { Table, Column } from '../../../shared/components/ui/Table';

export const InventoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.products);
  const { categories } = useAppSelector((state) => state.categories);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCategories());
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const productsList = products || [];
  const categoriesList = categories || [];
  const warehousesList = warehouses || [];
  
  const totalStock = productsList.reduce((sum, p) => sum + (p.totalQuantity || 0), 0);
  const lowStockProducts = productsList.filter((p) => (p.totalQuantity || 0) <= (p.reorderPoint || 0));
  const activeProducts = productsList.filter((p) => p.isActive).length;

  const lowStockColumns: Column<any>[] = [
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    {
      key: 'totalQuantity',
      header: 'Stock',
      render: (p) => (
        <Badge variant="warning">
          {p.totalQuantity || 0} / {p.reorderPoint || 0}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Inventory Dashboard" subtitle="Overview of your inventory" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Products</p>
                <h3 className="text-2xl font-bold text-slate-900">{productsList.length}</h3>
                <p className="text-xs text-slate-500">{activeProducts} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-100 rounded-lg">
                <Box className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Stock</p>
                <h3 className="text-2xl font-bold text-slate-900">{totalStock.toLocaleString()}</h3>
                <p className="text-xs text-slate-500">units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning-100 rounded-lg">
                <Tag className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Categories</p>
                <h3 className="text-2xl font-bold text-slate-900">{categoriesList.length}</h3>
                <p className="text-xs text-slate-500">total categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Warehouse className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Warehouses</p>
                <h3 className="text-2xl font-bold text-slate-900">{warehousesList.length}</h3>
                <p className="text-xs text-slate-500">locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Low Stock Alert</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {lowStockProducts.length} product(s) are running low on stock
                </p>
                <div className="mt-4">
                  <Table
                    data={lowStockProducts.slice(0, 5)}
                    columns={lowStockColumns}
                    onRowClick={(p) => navigate(`/dashboard/inventory/products/${p._id}`)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/inventory/products/create')}
              >
                Add New Product
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/inventory/stock')}
              >
                Manage Stock
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/inventory/categories')}
              >
                Manage Categories
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Products</h3>
            <div className="space-y-3">
              {productsList.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer"
                  onClick={() => navigate(`/dashboard/inventory/products/${product._id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>
                  <Badge variant="success">{product.totalQuantity || 0}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Warehouses</h3>
            <div className="space-y-3">
              {warehousesList.slice(0, 5).map((warehouse) => (
                <div key={warehouse._id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{warehouse.name}</p>
                    <p className="text-xs text-slate-500">{warehouse.city || '-'}</p>
                  </div>
                  <Badge variant={warehouse.isMainWarehouse ? 'primary' : 'default'}>
                    {warehouse.isMainWarehouse ? 'Main' : 'Branch'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
