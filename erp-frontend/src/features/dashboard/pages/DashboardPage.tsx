import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Users, Package, ShoppingCart, DollarSign, 
  AlertCircle, TrendingDown, Activity 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchOrders } from '../../sales/store/ordersSlice';
import { fetchCustomers } from '../../sales/store/customersSlice';
import { fetchProducts } from '../../inventory/store/productsSlice';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'success' | 'primary' | 'warning' | 'danger';
}> = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorClasses = {
    success: 'bg-success-100 text-success-600',
    primary: 'bg-primary-100 text-primary-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
            <p className="text-sm mt-2 text-slate-500">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orders, isLoading: ordersLoading } = useAppSelector((state) => state.orders);
  const { customers, isLoading: customersLoading } = useAppSelector((state) => state.customers);
  const { products, isLoading: productsLoading } = useAppSelector((state) => state.products);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });

  const [chartData, setChartData] = useState({
    dailySales: [] as any[],
    ordersByStatus: [] as any[],
  });

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchCustomers());
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (orders && customers && products) {
      const ordersList = Array.isArray(orders) ? orders : [];
      const customersList = Array.isArray(customers) ? customers : [];
      const productsList = Array.isArray(products) ? products : [];

      // Calculate revenue from paid orders
      let totalRevenue = 0;
      ordersList.forEach(order => {
        if (order.payment_status?.toLowerCase() === 'paid') {
          if (order.line_items && Array.isArray(order.line_items)) {
            order.line_items.forEach((item: any) => {
              const sales = (item.quantity || 0) * (item.unit_price || 0);
              const cost = (item.quantity || 0) * (item.product_cost || 0);
              totalRevenue += (sales - cost);
            });
          }
        }
      });

      // Low stock products
      const lowStock = productsList.filter(p => 
        (p.availableQuantity || 0) <= (p.reorderPoint || 0) && (p.reorderPoint || 0) > 0
      ).length;

      setStats({
        totalRevenue,
        totalOrders: ordersList.length,
        totalCustomers: customersList.length,
        totalProducts: productsList.length,
        lowStockProducts: lowStock,
      });

      // Prepare daily sales data (last 7 days)
      const today = new Date();
      const dailySalesMap: Record<string, { date: string, sales: number, orders: number }> = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        dailySalesMap[dateStr] = { date: dayLabel, sales: 0, orders: 0 };
      }

      // Aggregate orders by date
      ordersList.forEach(order => {
        if (order.payment_status?.toLowerCase() === 'paid') {
          const orderDate = new Date(order.order_date || order.created_at);
          const dateStr = orderDate.toISOString().split('T')[0];
          
          if (dailySalesMap[dateStr]) {
            dailySalesMap[dateStr].orders += 1;
            
            if (order.line_items && Array.isArray(order.line_items)) {
              order.line_items.forEach((item: any) => {
                dailySalesMap[dateStr].sales += (item.quantity || 0) * (item.unit_price || 0);
              });
            } else {
              dailySalesMap[dateStr].sales += (order.subtotal || 0);
            }
          }
        }
      });

      const dailySales = Object.values(dailySalesMap);

      // Order status distribution
      const statusCounts: Record<string, number> = {};
      ordersList.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const ordersByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      setChartData({
        dailySales,
        ordersByStatus,
      });
    }
  }, [orders, customers, products]);

  const isLoading = ordersLoading || customersLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your business."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`From ${(Array.isArray(orders) ? orders : []).filter(o => o.payment_status === 'paid').length} paid orders`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          subtitle={`${(Array.isArray(orders) ? orders : []).filter(o => o.payment_status === 'paid').length} paid, ${(Array.isArray(orders) ? orders : []).filter(o => o.payment_status === 'pending').length} pending`}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          subtitle="Active customers"
          icon={Users}
          color="warning"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts.toString()}
          subtitle={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : 'All in stock'}
          icon={Package}
          color={stats.lowStockProducts > 0 ? 'danger' : 'primary'}
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStockProducts > 0 && (
        <div className="mb-6 p-4 bg-warning-50 border border-warning-300 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-warning-900">Low Stock Alert</h4>
            <p className="text-sm text-warning-800 mt-1">
              {stats.lowStockProducts} product(s) are at or below their reorder point.{' '}
              <button 
                onClick={() => navigate('/dashboard/inventory/stock')}
                className="font-medium underline hover:text-warning-900"
              >
                View Stock Management →
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader 
            title="Sales Trend (Last 7 Days)" 
            subtitle="Daily sales from paid orders"
          />
          <CardContent>
            {chartData.dailySales.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No sales data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#10b981" name="Sales ($)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Orders by Status" 
            subtitle="Current order distribution"
          />
          <CardContent>
            {chartData.ordersByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No orders yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader 
            title="Recent Orders" 
            subtitle="Latest 5 orders"
            action={
              <button
                onClick={() => navigate('/dashboard/sales/orders')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            }
          />
          <CardContent>
            {(Array.isArray(orders) ? orders : []).slice(0, 5).map((order) => (
              <div 
                key={order.id} 
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer rounded px-2"
                onClick={() => navigate(`/dashboard/sales/orders/${order.id}`)}
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-500">{order.customer_name || order.customer_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</p>
                  <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'} size="sm">
                    {order.payment_status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
            {(Array.isArray(orders) ? orders : []).length === 0 && (
              <p className="text-center text-slate-500 py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Low Stock Products" 
            subtitle="Products at or below reorder point"
            action={
              <button
                onClick={() => navigate('/dashboard/inventory/stock')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Manage Stock →
              </button>
            }
          />
          <CardContent>
            {(() => {
              const productsList = Array.isArray(products) ? products : [];
              
              // Debug: Log products to see their structure
              if (productsList.length > 0) {
                console.log('🔍 Total products:', productsList.length);
                console.log('🔍 Sample product:', productsList[0]);
                console.log('🔍 Products with reorder points:', 
                  productsList.filter(p => (p.reorderPoint || 0) > 0).length
                );
              }
              
              const lowStockProducts = productsList.filter(p => {
                const available = p.availableQuantity || 0;
                const total = p.totalQuantity || 0;
                const reorder = p.reorderPoint || 0;
                
                // Show if out of stock OR below reorder point (if set)
                const isOutOfStock = available === 0;
                const isBelowReorder = reorder > 0 && available <= reorder;
                const isLowStock = isOutOfStock || isBelowReorder;
                
                console.log('🔍 Checking product:', {
                  name: p.name,
                  available,
                  total,
                  reorder,
                  isOutOfStock,
                  isBelowReorder,
                  isLowStock,
                });
                
                return isLowStock;
              });

              console.log('⚠️ Total low stock products:', lowStockProducts.length);

              if (lowStockProducts.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-success-500 mx-auto mb-2" />
                    <p className="text-sm text-success-600 font-medium">All products in stock!</p>
                    <p className="text-xs text-slate-500 mt-1">No items below reorder point</p>
                    <div className="mt-4 p-3 bg-slate-50 rounded-md text-left">
                      <p className="text-xs text-slate-600">
                        <strong>Debug Info:</strong><br />
                        Total products: {productsList.length}<br />
                        Products with reorder points: {productsList.filter(p => (p.reorderPoint || 0) > 0).length}<br />
                        Out of stock: {productsList.filter(p => (p.availableQuantity || 0) === 0).length}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div 
                      key={product._id} 
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer rounded px-2 transition-colors"
                      onClick={() => navigate(`/dashboard/inventory/products/${product._id}`)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={(product.availableQuantity || 0) === 0 ? 'danger' : 'warning'}>
                          {product.availableQuantity || 0} {product.unit || 'pcs'}
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          Reorder at: {product.reorderPoint || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      +{lowStockProducts.length - 5} more products need restocking
                    </p>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
