import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  CreditCard,
  Package,
  AlertCircle 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchOrders } from '../store/ordersSlice';
import { fetchCustomers } from '../store/customersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

export const SalesDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orders, isLoading: ordersLoading } = useAppSelector((state) => state.orders);
  const { customers, isLoading: customersLoading } = useAppSelector((state) => state.customers);
  
  const [stats, setStats] = useState({
    totalSales: 0,      // Total selling price (subtotal)
    totalCost: 0,       // Cost of goods sold
    totalTax: 0,        // Tax collected
    totalRevenue: 0,    // Profit (Sales - Cost)
    totalOrders: 0,
    totalCustomers: 0,
    paidOrders: 0,
    pendingPayments: 0,
    confirmedOrders: 0,
    averageOrderValue: 0,
    profitMargin: 0,
  });

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    if (orders && customers) {
      const ordersList = Array.isArray(orders) ? orders : [];
      const customersList = Array.isArray(customers) ? customers : [];

      // Calculate statistics
      let totalSales = 0;   // Subtotal (selling price before tax)
      let totalCost = 0;    // Cost of goods sold
      let totalTax = 0;     // Tax collected
      
      ordersList.forEach(order => {
        // Only count paid orders
        if (order.payment_status?.toLowerCase() === 'paid') {
          // Calculate from line items if available
          if (order.line_items && Array.isArray(order.line_items)) {
            order.line_items.forEach((item: any) => {
              totalSales += (item.quantity || 0) * (item.unit_price || 0);
              totalCost += (item.quantity || 0) * (item.product_cost || 0);
            });
          } else {
            // Fallback to order subtotal
            totalSales += (order.subtotal || 0);
          }
          
          // Add tax
          totalTax += (order.tax_amount || 0);
        }
      });

      // Revenue = Sales - Cost (profit before tax)
      const totalRevenue = totalSales - totalCost;
      const profitMargin = totalSales > 0 ? (totalRevenue / totalSales) * 100 : 0;
      
      const paidOrdersCount = ordersList.filter(o => o.payment_status?.toLowerCase() === 'paid').length;
      const pendingPaymentsCount = ordersList.filter(o => o.payment_status?.toLowerCase() === 'pending').length;
      const confirmedOrdersCount = ordersList.filter(o => o.status?.toLowerCase() === 'confirmed').length;

      const avgOrderValue = paidOrdersCount > 0 ? totalSales / paidOrdersCount : 0;

      setStats({
        totalSales,
        totalCost,
        totalTax,
        totalRevenue,
        totalOrders: ordersList.length,
        totalCustomers: customersList.length,
        paidOrders: paidOrdersCount,
        pendingPayments: pendingPaymentsCount,
        confirmedOrders: confirmedOrdersCount,
        averageOrderValue: avgOrderValue,
        profitMargin,
      });
    }
  }, [orders, customers]);

  const recentOrders = Array.isArray(orders) 
    ? [...orders].sort((a, b) => {
        const dateA = new Date(a.created_at || a.order_date).getTime();
        const dateB = new Date(b.created_at || b.order_date).getTime();
        return dateB - dateA;
      }).slice(0, 5)
    : [];

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      completed: 'success',
      confirmed: 'success',
      pending: 'warning',
      processing: 'warning',
      cancelled: 'danger',
      draft: 'default',
    };
    return statusMap[status?.toLowerCase()] || 'default';
  };

  const getPaymentStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      paid: 'success',
      partially_paid: 'warning',
      pending: 'warning',
      failed: 'danger',
    };
    return statusMap[status?.toLowerCase()] || 'default';
  };

  if (ordersLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Sales Dashboard" 
        subtitle="Overview of your sales performance" 
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Overview' },
        ]}
      />

      {/* Financial Summary Banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-slate-50 to-primary-50 border border-slate-200 rounded-lg shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">💰 Financial Summary (Paid Orders Only)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalSales)}</p>
            <p className="text-xs text-slate-500">Selling price</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">Tax Collected</p>
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalTax)}</p>
            <p className="text-xs text-slate-500">Sales tax</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">Cost of Goods</p>
            <p className="text-2xl font-bold text-danger-600">{formatCurrency(stats.totalCost)}</p>
            <p className="text-xs text-slate-500">Product costs</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-success-200 bg-success-50">
            <p className="text-xs text-success-700 mb-1">Revenue (Profit)</p>
            <p className="text-2xl font-bold text-success-700">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-success-600">{stats.profitMargin.toFixed(1)}% margin</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-center text-slate-600">
            <strong>Formula:</strong> Revenue = Sales - Cost | 
            {formatCurrency(stats.totalSales)} - {formatCurrency(stats.totalCost)} = {formatCurrency(stats.totalRevenue)} | 
            Tax is collected separately for remittance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Orders</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalOrders}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.paidOrders} paid, {stats.pendingPayments} pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning-100 rounded-lg">
                <Users className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Customers</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalCustomers}</h3>
                <p className="text-xs text-slate-500 mt-1">Active customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg Order Value</p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatCurrency(stats.averageOrderValue)}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Per paid order</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader 
            title="Order Status Breakdown"
            subtitle="Current order statuses"
          />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-success-600" />
                  <span className="text-sm font-medium text-slate-700">Confirmed Orders</span>
                </div>
                <span className="text-lg font-bold text-success-700">{stats.confirmedOrders}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning-600" />
                  <span className="text-sm font-medium text-slate-700">Pending Payments</span>
                </div>
                <span className="text-lg font-bold text-warning-700">{stats.pendingPayments}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary-600" />
                  <span className="text-sm font-medium text-slate-700">Paid Orders</span>
                </div>
                <span className="text-lg font-bold text-primary-700">{stats.paidOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="Profit & Loss Statement"
            subtitle="From paid orders"
          />
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <span className="text-sm font-medium text-slate-700">Total Sales</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(stats.totalSales)}
                </span>
              </div>

              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-slate-600">Less: Cost of Goods</span>
                <span className="text-lg font-semibold text-danger-600">
                  -{formatCurrency(stats.totalCost)}
                </span>
              </div>

              <div className="h-px bg-slate-300"></div>

              <div className="flex items-center justify-between p-3 bg-success-50 rounded-md">
                <span className="text-sm font-medium text-success-700">Revenue (Profit)</span>
                <span className="text-lg font-bold text-success-700">
                  {formatCurrency(stats.totalRevenue)}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 pt-2">
                <span className="text-sm text-slate-600">Profit Margin</span>
                <span className="text-lg font-semibold text-primary-600">
                  {stats.profitMargin.toFixed(1)}%
                </span>
              </div>

              <div className="h-px bg-slate-200 my-3"></div>

              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-slate-600">Tax Collected</span>
                <span className="text-lg font-semibold text-primary-600">
                  {formatCurrency(stats.totalTax)}
                </span>
              </div>

              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-slate-600">Avg Order Value</span>
                <span className="text-lg font-semibold text-slate-700">
                  {formatCurrency(stats.averageOrderValue)}
                </span>
              </div>

              <div className="h-px bg-slate-200 my-3"></div>

              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-slate-600">Pending Sales</span>
                <span className="text-lg font-semibold text-warning-600">
                  {formatCurrency(
                    (Array.isArray(orders) ? orders : [])
                      .filter(o => o.payment_status?.toLowerCase() === 'pending')
                      .reduce((sum, o) => sum + (o.subtotal || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
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
          {recentOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Order #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/dashboard/sales/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {order.customer_name || order.customer_email || order.customer_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(order.order_date, 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                          {order.payment_status?.replace('_', ' ').toUpperCase()}
                        </Badge>
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
  );
};
