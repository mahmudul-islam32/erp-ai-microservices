import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Trash2, Package, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchProductById, deleteProduct } from '../store/productsSlice';
import { inventoryTransactionsApi, InventoryTransaction } from '../services/inventoryTransactionsApi';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Badge } from '../../../shared/components/ui/Badge';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedProduct, isLoading } = useAppSelector((state) => state.products);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [stockMetrics, setStockMetrics] = useState({
    totalIn: 0,
    totalOut: 0,
    currentOnHand: 0,
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      loadTransactions(id);
    }
  }, [dispatch, id]);

  const loadTransactions = async (productId: string) => {
    setTransactionsLoading(true);
    try {
      const result = await inventoryTransactionsApi.getByProduct(productId, 1, 50);
      setTransactions(result.transactions || []);
      
      // Calculate cumulative metrics
      let totalIn = 0;
      let totalOut = 0;
      
      result.transactions.forEach((tx: InventoryTransaction) => {
        if (tx.quantity > 0) {
          totalIn += tx.quantity;
        } else {
          totalOut += Math.abs(tx.quantity);
        }
      });
      
      setStockMetrics({
        totalIn,
        totalOut,
        currentOnHand: totalIn - totalOut,
      });
    } catch (error: any) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setTransactionsLoading(false);
    }
  };

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
              <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">On Hand</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {product.totalQuantity || 0}
                    </div>
                    <div className="text-xs text-slate-500">{product.unit || 'pcs'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Available</div>
                    <div className="text-2xl font-bold text-success-600">
                      {product.availableQuantity || 0}
                    </div>
                    <div className="text-xs text-slate-500">{product.unit || 'pcs'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Reserved</div>
                    <div className="text-2xl font-bold text-warning-600">
                      {product.reservedQuantity || 0}
                    </div>
                    <div className="text-xs text-slate-500">{product.unit || 'pcs'}</div>
                  </div>
                </div>
              </div>
              
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Reorder Point</dt>
                  <dd className="mt-1 text-sm text-slate-900">{product.reorderPoint || 0} {product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Stock Status</dt>
                  <dd className="mt-1">
                    {(product.availableQuantity || 0) === 0 ? (
                      <Badge variant="danger">Out of Stock</Badge>
                    ) : (product.availableQuantity || 0) <= (product.reorderPoint || 0) ? (
                      <Badge variant="warning">Low Stock</Badge>
                    ) : (
                      <Badge variant="success">In Stock</Badge>
                    )}
                  </dd>
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

          {/* Stock Movement Summary */}
          <Card>
            <CardHeader 
              title="Stock Movement Summary" 
              subtitle="Cumulative stock received and sold"
            />
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-success-600" />
                    <span className="text-xs font-medium text-success-700">Total Received</span>
                  </div>
                  <div className="text-2xl font-bold text-success-700">
                    {stockMetrics.totalIn}
                  </div>
                  <div className="text-xs text-success-600">{product.unit || 'pcs'}</div>
                </div>

                <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-danger-600" />
                    <span className="text-xs font-medium text-danger-700">Total Sold</span>
                  </div>
                  <div className="text-2xl font-bold text-danger-700">
                    {stockMetrics.totalOut}
                  </div>
                  <div className="text-xs text-danger-600">{product.unit || 'pcs'}</div>
                </div>

                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-medium text-primary-700">Current</span>
                  </div>
                  <div className="text-2xl font-bold text-primary-700">
                    {product.totalQuantity || 0}
                  </div>
                  <div className="text-xs text-primary-600">{product.unit || 'pcs'}</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-md text-xs text-slate-600">
                <strong>Formula:</strong> Current On Hand = Total Received - Total Sold
                <br />
                <strong>Verification:</strong> {stockMetrics.totalIn} - {stockMetrics.totalOut} = {stockMetrics.totalIn - stockMetrics.totalOut}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader 
              title="Recent Stock Transactions" 
              subtitle="Last 50 movements"
            />
            <CardContent>
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No transactions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-medium text-slate-500 uppercase">Balance</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.slice(0, 20).map((tx) => (
                        <tr key={tx._id} className="hover:bg-slate-50">
                          <td className="px-2 py-2 text-slate-600">
                            {formatDate(tx.createdAt, 'MMM d, HH:mm')}
                          </td>
                          <td className="px-2 py-2">
                            <Badge 
                              variant={tx.quantity > 0 ? 'success' : 'danger'}
                              size="sm"
                            >
                              {tx.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className={`px-2 py-2 text-right font-semibold ${tx.quantity > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                            {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-900 font-medium">
                            {tx.balanceAfter}
                          </td>
                          <td className="px-2 py-2 text-slate-600 text-xs">
                            {tx.reason.replace('_', ' ')}
                            {tx.notes && <div className="text-xs text-slate-400 mt-0.5">{tx.notes}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
