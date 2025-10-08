import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Trash2, Package } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProductById, deleteProduct } from '../store/productsSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProduct, isLoading } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      if (id) {
        const result = await dispatch(deleteProduct(id));
        if (deleteProduct.fulfilled.match(result)) {
          navigate('/dashboard/inventory/products');
        }
      }
    }
  };

  if (isLoading || !selectedProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const product = selectedProduct;

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`SKU: ${product.sku}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventory', href: '/dashboard/inventory' },
          { label: 'Products', href: '/dashboard/inventory/products' },
          { label: product.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => navigate(`/dashboard/inventory/products/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Product Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">SKU</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.sku}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Name</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.name}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Description</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.description || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Unit</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Barcode</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.barcode || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Pricing" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Price</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(product.price)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Cost</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(product.cost)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Profit Margin</dt>
                  <dd className="mt-1 text-sm text-slate-900">
                    {product.price > 0 ? `${(((product.price - product.cost) / product.price) * 100).toFixed(2)}%` : '-'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Stock Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Total Quantity</dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">
                    {product.totalQuantity || 0} {product.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Available</dt>
                  <dd className="mt-1 text-lg font-semibold text-success-600">
                    {product.availableQuantity || 0} {product.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Reserved</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.reservedQuantity || 0} {product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Reorder Point</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.reorderPoint || 0} {product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Min Stock Level</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.minStockLevel || 0} {product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Max Stock Level</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.maxStockLevel || 0} {product.unit}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Active</span>
                <Badge variant={product.isActive ? 'success' : 'danger'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Trackable</span>
                <Badge variant={product.isTrackable ? 'primary' : 'default'}>
                  {product.isTrackable ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Timestamps" />
            <CardContent>
              <div className="space-y-2">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Created</dt>
                  <dd className="text-sm text-slate-900">{product.createdAt ? formatDate(product.createdAt) : '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Updated</dt>
                  <dd className="text-sm text-slate-900">{product.updatedAt ? formatDate(product.updatedAt) : '-'}</dd>
                </div>
              </div>
            </CardContent>
          </Card>

          {product.images && product.images.length > 0 && (
            <Card>
              <CardHeader title="Images" />
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {product.images.map((img, idx) => (
                    <img key={idx} src={img} alt={product.name} className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
