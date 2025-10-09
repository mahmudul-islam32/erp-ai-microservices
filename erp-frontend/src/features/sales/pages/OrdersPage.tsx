import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchOrders, deleteOrder } from '../store/ordersSlice';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { toast } from 'sonner';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orders, isLoading } = useAppSelector((state) => state.orders);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const getStatusVariant = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      completed: 'success',
      confirmed: 'success',
      pending: 'warning',
      processing: 'warning',
      cancelled: 'danger',
      draft: 'default',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  const getPaymentStatusVariant = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
      paid: 'success',
      partially_paid: 'warning',
      pending: 'warning',
      failed: 'danger',
      refunded: 'danger',
    };
    return statusMap[status.toLowerCase()] || 'default';
  };

  const handleDelete = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await dispatch(deleteOrder(orderId));
      if (deleteOrder.fulfilled.match(result)) {
        toast.success('Order deleted successfully');
        dispatch(fetchOrders());
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error('Failed to delete order');
    }
  };

  const columns: Column<any>[] = [
    { key: 'order_number', header: 'Order #', width: '120px' },
    {
      key: 'customer',
      header: 'Customer',
      render: (order) => {
        // Use customer_name if available (backend provides this)
        if (order.customer_name) {
          return order.customer_name;
        }
        // Fallback to nested customer object if populated
        if (order.customer) {
          return `${order.customer.first_name} ${order.customer.last_name}${order.customer.company_name ? ` (${order.customer.company_name})` : ''}`;
        }
        // Fallback to email if available
        if (order.customer_email) {
          return order.customer_email;
        }
        // Last resort: show customer ID
        return order.customer_id;
      },
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (order) => formatCurrency(order.total_amount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => (
        <Badge variant={getStatusVariant(order.status)}>
          {order.status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'payment_status',
      header: 'Payment',
      render: (order) => (
        <Badge variant={getPaymentStatusVariant(order.payment_status)}>
          {order.payment_status.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'payment_method',
      header: 'Method',
      width: '100px',
      render: (order) => (
        <span className="text-xs text-slate-600 uppercase">
          {order.payment_method || 'N/A'}
        </span>
      ),
    },
    {
      key: 'order_date',
      header: 'Date',
      render: (order) => formatDate(order.order_date, 'PP'),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      render: (order) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/sales/orders/${order.id}`);
            }}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="danger"
            leftIcon={<Trash2 className="h-3 w-3" />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(order.id, order.order_number);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const ordersList = Array.isArray(orders) ? orders : [];
  const filteredOrders = ordersList.filter(
    (order) =>
      order.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        subtitle="Manage customer orders"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Sales', href: '/dashboard/sales' },
          { label: 'Orders' },
        ]}
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/dashboard/sales/orders/create')}
          >
            Create Order
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-slate-200">
          <Input
            placeholder="Search orders by number or customer..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table
          data={filteredOrders}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(order) => navigate(`/dashboard/sales/orders/${order.id}`)}
          emptyMessage="No orders found. Create your first order!"
        />
      </Card>
    </div>
  );
};
