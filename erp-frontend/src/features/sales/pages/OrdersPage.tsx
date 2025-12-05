import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2, Receipt } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchOrders, deleteOrder } from '../store/ordersSlice';
import { invoicesApi } from '../services/invoicesApi';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Table, Column } from '../../../shared/components/ui/Table';
import { Badge } from '../../../shared/components/ui/Badge';
import { IconButton } from '../../../shared/components/ui/IconButton';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { toast } from 'sonner';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { UserRole } from '../../users/types';
import { OrderFilters as OrderFiltersComponent, type OrderFilters } from '../components/OrderFilters';
import { DeleteOrderModal } from '../components/DeleteOrderModal';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orders, isLoading } = useAppSelector((state) => state.orders);
  const { user, hasPermission } = usePermissions();
  const [filters, setFilters] = useState<OrderFilters>({});
  const [creatingInvoiceIds, setCreatingInvoiceIds] = useState<Set<string>>(new Set());
  const [orderToDelete, setOrderToDelete] = useState<any>(null);


  const isCustomer = user?.role === UserRole.CUSTOMER;
  const canCreate = hasPermission('sales:create') && !isCustomer;
  const canDelete = hasPermission('sales:delete') && !isCustomer;

  useEffect(() => {
    // Backend will automatically filter by customer_id if user is a customer
    dispatch(fetchOrders({}));
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

  const handleDelete = (order: any) => {
    setOrderToDelete(order);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      const result = await dispatch(deleteOrder(orderToDelete.id));
      if (deleteOrder.fulfilled.match(result)) {
        toast.success('Order deleted successfully');
        dispatch(fetchOrders({}));
        setOrderToDelete(null);
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error('Failed to delete order');
    }
  };

  const handleCreateInvoice = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    
    setCreatingInvoiceIds((prev) => new Set(prev).add(orderId));
    try {
      const invoice = await invoicesApi.generateFromOrder(orderId);
      toast.success('Invoice created successfully!');
      // Navigate to the invoice detail page
      navigate(`/dashboard/sales/invoices/${invoice.id}`);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to create invoice';
      toast.error(errorMessage);
    } finally {
      setCreatingInvoiceIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
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
        <div className="flex items-center gap-2">
          {!isCustomer && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Receipt className="h-3 w-3" />}
              onClick={(e) => handleCreateInvoice(order.id, e)}
              disabled={creatingInvoiceIds.has(order.id)}
              isLoading={creatingInvoiceIds.has(order.id)}
            >
              Invoice
            </Button>
          )}
          <IconButton
            icon={Eye}
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/sales/orders/${order.id}`);
            }}
            title="View Order"
          />
          {!isCustomer && canDelete && (
            <IconButton
              icon={Trash2}
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(order);
              }}
              title="Delete Order"
            />
          )}
        </div>
      ),
    },
  ];

  const ordersList = Array.isArray(orders) ? orders : [];
  
  // Filter orders: customers only see their own orders
  let customerOrders = ordersList;
  if (isCustomer && user?.id) {
    customerOrders = ordersList.filter(
      (order) => order.customer_id === user.id || order.customer_id === user._id
    );
  }
  
  const filteredOrders = customerOrders.filter((order) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        order.order_number?.toLowerCase().includes(searchLower) ||
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_email?.toLowerCase().includes(searchLower) ||
        order.customer?.first_name?.toLowerCase().includes(searchLower) ||
        order.customer?.last_name?.toLowerCase().includes(searchLower) ||
        order.customer?.company_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status) {
      if (order.status?.toLowerCase() !== filters.status.toLowerCase()) return false;
    }

    // Payment status filter
    if (filters.paymentStatus) {
      if (order.payment_status?.toLowerCase() !== filters.paymentStatus.toLowerCase()) return false;
    }

    return true;
  });

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
          canCreate ? (
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/dashboard/sales/orders/create')}
            >
              Create Order
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-4">
        <OrderFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />
        <Card>
          <Table
            data={filteredOrders}
            columns={columns}
            isLoading={isLoading}
            onRowClick={(order) => navigate(`/dashboard/sales/orders/${order.id}`)}
            emptyMessage="No orders found. Create your first order!"
          />
        </Card>
      </div>

      {orderToDelete && (
        <DeleteOrderModal
          order={orderToDelete}
          onConfirm={confirmDelete}
          onCancel={() => setOrderToDelete(null)}
          loading={isLoading}
        />
      )}
    </div>
  );
};
