import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Grid,
  Card,
  Text,
  Pagination,
  Loader,
  Alert,
  Stack,
  Menu
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSearch,
  IconDotsVertical,
  IconFileInvoice,
  IconTruck,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { salesOrdersApi } from '../services/salesApi';
import { SalesOrder, OrderStatus, PaymentStatus, PaginationParams } from '../types/sales';

const SalesOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; order: SalesOrder | null }>({
    open: false,
    order: null
  });
  
  // Enhanced pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');

  const loadOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: PaginationParams = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await salesOrdersApi.getOrders(params);
      
      // Handle the new pagination response format
      setOrders(response.items || []);
      setTotalCount(response.total || 0);
      setTotalPages(response.pages || 1);
      
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
      setOrders([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleDeleteOrder = async () => {
    if (!deleteModal.order) return;

    try {
      const orderId = deleteModal.order.id || deleteModal.order._id;
      if (!orderId) return;
      
      await salesOrdersApi.deleteOrder(orderId);
      setDeleteModal({ open: false, order: null });
      loadOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await salesOrdersApi.updateOrderStatus(orderId, newStatus);
      loadOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.DRAFT]: 'gray',
      [OrderStatus.PENDING]: 'yellow',
      [OrderStatus.CONFIRMED]: 'blue',
      [OrderStatus.PROCESSING]: 'orange',
      [OrderStatus.SHIPPED]: 'cyan',
      [OrderStatus.DELIVERED]: 'green',
      [OrderStatus.CANCELLED]: 'red',
      [OrderStatus.RETURNED]: 'pink'
    };
    return colors[status] || 'gray';
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'yellow',
      [PaymentStatus.PARTIAL]: 'orange',
      [PaymentStatus.PAID]: 'green',
      [PaymentStatus.OVERDUE]: 'red',
      [PaymentStatus.CANCELLED]: 'gray'
    };
    return colors[status] || 'gray';
  };

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group position="apart" mb="xl">
        <Title order={1}>Sales Orders</Title>
        <Button
          leftIcon={<IconPlus size={16} />}
          onClick={() => navigate('/dashboard/sales/orders/create')}
        >
          New Order
        </Button>
      </Group>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Title order={4} mb="md">Filters</Title>
        <Grid>
          <Grid.Col span={4}>
            <TextInput
              placeholder="Search orders..."
              icon={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              placeholder="Filter by status"
              data={[
                { value: '', label: 'All Statuses' },
                { value: OrderStatus.DRAFT, label: 'Draft' },
                { value: OrderStatus.PENDING, label: 'Pending' },
                { value: OrderStatus.CONFIRMED, label: 'Confirmed' },
                { value: OrderStatus.PROCESSING, label: 'Processing' },
                { value: OrderStatus.SHIPPED, label: 'Shipped' },
                { value: OrderStatus.DELIVERED, label: 'Delivered' },
                { value: OrderStatus.CANCELLED, label: 'Cancelled' }
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              placeholder="Filter by payment status"
              data={[
                { value: '', label: 'All Payment Statuses' },
                { value: PaymentStatus.PENDING, label: 'Pending' },
                { value: PaymentStatus.PARTIAL, label: 'Partial' },
                { value: PaymentStatus.PAID, label: 'Paid' },
                { value: PaymentStatus.OVERDUE, label: 'Overdue' },
                { value: PaymentStatus.CANCELLED, label: 'Cancelled' }
              ]}
              value={paymentStatusFilter}
              onChange={(value) => setPaymentStatusFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Orders Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {loading ? (
          <Group position="center" p="xl">
            <Loader />
          </Group>
        ) : !orders || orders.length === 0 ? (
          <Text align="center" py="xl" color="dimmed">
            No orders found
          </Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id || order._id || order.order_number || `order-${index}`}>
                    <td>
                      <Text weight={500}>{order.order_number}</Text>
                    </td>
                    <td>
                      {order.customer ? 
                        `${order.customer.first_name} ${order.customer.last_name}` :
                        'Unknown Customer'
                      }
                    </td>
                    <td>{formatDate(order.order_date)}</td>
                    <td>{order.line_items?.length || 0} items</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>
                      <Badge color={getStatusColor(order.status)} variant="light">
                        {order.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge color={getPaymentStatusColor(order.payment_status)} variant="light">
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td>
                      <Group spacing={4}>
                        <ActionIcon
                          variant="light"
                          onClick={() => navigate(`/dashboard/sales/orders/${order.id || order._id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => navigate(`/dashboard/sales/orders/${order.id || order._id}/edit`)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="light">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Quick Actions</Menu.Label>
                            <Menu.Item
                              icon={<IconCheck size={14} />}
                              onClick={() => handleStatusChange(order.id || order._id!, OrderStatus.CONFIRMED)}
                              disabled={order.status === OrderStatus.CONFIRMED}
                            >
                              Confirm Order
                            </Menu.Item>
                            <Menu.Item
                              icon={<IconTruck size={14} />}
                              onClick={() => handleStatusChange(order.id || order._id!, OrderStatus.SHIPPED)}
                              disabled={order.status !== OrderStatus.PROCESSING}
                            >
                              Mark as Shipped
                            </Menu.Item>
                            <Menu.Item
                              icon={<IconFileInvoice size={14} />}
                              onClick={() => navigate(`/dashboard/sales/invoices/create?orderId=${order.id || order._id}`)}
                            >
                              Create Invoice
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              icon={<IconX size={14} />}
                              color="red"
                              onClick={() => handleStatusChange(order.id || order._id!, OrderStatus.CANCELLED)}
                            >
                              Cancel Order
                            </Menu.Item>
                            <Menu.Item
                              icon={<IconTrash size={14} />}
                              color="red"
                              onClick={() => setDeleteModal({ open: true, order })}
                            >
                              Delete Order
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <Group position="apart" mt="xl">
                <Group>
                  <Text size="sm" color="dimmed">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} orders
                  </Text>
                  <Select
                    data={[
                      { value: '10', label: '10 per page' },
                      { value: '20', label: '20 per page' },
                      { value: '50', label: '50 per page' },
                      { value: '100', label: '100 per page' }
                    ]}
                    value={pageSize.toString()}
                    onChange={(value) => {
                      if (value) {
                        setPageSize(parseInt(value));
                        setCurrentPage(1); // Reset to first page when changing page size
                      }
                    }}
                    size="sm"
                    style={{ width: 120 }}
                  />
                </Group>
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                />
              </Group>
            )}
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, order: null })}
        title="Delete Order"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete order "
            {deleteModal.order?.order_number}"?
            This action cannot be undone.
          </Text>
          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, order: null })}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteOrder}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default SalesOrdersPage;
