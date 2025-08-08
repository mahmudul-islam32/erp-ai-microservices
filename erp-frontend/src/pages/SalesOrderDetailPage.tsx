import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Badge,
  Grid,
  Card,
  Text,
  Table,
  Breadcrumbs,
  Anchor,
  Alert,
  Stack,
  Loader,
  Center,
  Modal,
  Divider,
  ActionIcon,
  Menu
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconFileInvoice,
  IconTruck,
  IconCheck,
  IconX,
  IconDotsVertical,
  IconUser,
  IconCalendar,
  IconMapPin,
  IconAlertCircle,
  IconCopy,
  IconDownload
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { salesOrdersApi, customerApi } from '../services/salesApi';
import { SalesOrder, OrderStatus, PaymentStatus, Customer } from '../types/sales';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const SalesOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load order details
  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      
      const orderData = await salesOrdersApi.getOrder(orderId);
      setOrder(orderData);

      // Load customer details
      if (orderData.customer_id) {
        try {
          const customerData = await customerApi.getCustomer(orderData.customer_id);
          setCustomer(customerData);
        } catch (customerError) {
          console.warn('Could not load customer details:', customerError);
        }
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    try {
      setActionLoading(newStatus);
      await salesOrdersApi.updateOrderStatus(order.id || order._id!, newStatus);
      await loadOrder(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    try {
      setActionLoading('delete');
      await salesOrdersApi.deleteOrder(order.id || order._id!);
      navigate('/dashboard/sales/orders');
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order');
      setActionLoading(null);
      setDeleteModalOpen(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DRAFT:
        return 'gray';
      case OrderStatus.PENDING:
        return 'blue';
      case OrderStatus.CONFIRMED:
        return 'cyan';
      case OrderStatus.PROCESSING:
        return 'yellow';
      case OrderStatus.SHIPPED:
        return 'orange';
      case OrderStatus.DELIVERED:
        return 'green';
      case OrderStatus.CANCELLED:
        return 'red';
      case OrderStatus.RETURNED:
        return 'red';
      default:
        return 'gray';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'yellow';
      case PaymentStatus.PARTIAL:
        return 'orange';
      case PaymentStatus.PAID:
        return 'green';
      case PaymentStatus.OVERDUE:
        return 'red';
      case PaymentStatus.CANCELLED:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales', href: '/dashboard/sales' },
    { title: 'Orders', href: '/dashboard/sales/orders' },
    { title: order?.order_number || 'Order Details', href: '#' }
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => item.href !== '#' && navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || 'Order not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group position="apart">
          <div>
            <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
            <Title order={2} mt="sm">
              <Group spacing="sm">
                <IconFileInvoice size={28} />
                {order.order_number || 'Sales Order'}
              </Group>
            </Title>
          </div>
          <Group>
            <Button
              variant="outline"
              leftIcon={<IconArrowLeft size={16} />}
              onClick={() => navigate('/dashboard/sales/orders')}
            >
              Back to Orders
            </Button>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="filled" color="blue">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  icon={<IconEdit size={14} />}
                  onClick={() => navigate(`/dashboard/sales/orders/${order.id || order._id}/edit`)}
                >
                  Edit Order
                </Menu.Item>
                <Menu.Item
                  icon={<IconCopy size={14} />}
                  onClick={() => {/* Handle duplicate */}}
                >
                  Duplicate Order
                </Menu.Item>
                <Menu.Item
                  icon={<IconFileInvoice size={14} />}
                  onClick={() => {/* Handle create invoice */}}
                >
                  Create Invoice
                </Menu.Item>
                <Menu.Item
                  icon={<IconDownload size={14} />}
                  onClick={() => {/* Handle export */}}
                >
                  Export PDF
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  icon={<IconTrash size={14} />}
                  color="red"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={order.status !== OrderStatus.DRAFT && order.status !== OrderStatus.PENDING}
                >
                  Delete Order
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid>
          {/* Order Information */}
          <Grid.Col md={8}>
            {/* Order Status and Actions */}
            <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
              <Group position="apart" mb="md">
                <Title order={4}>Order Status</Title>
                <Group spacing="xs">
                  <Badge color={getStatusColor(order.status)} size="lg">
                    {order.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge color={getPaymentStatusColor(order.payment_status)} size="lg">
                    {order.payment_status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Group>
              </Group>

              <Group spacing="sm">
                {order.status === OrderStatus.DRAFT && (
                  <Button
                    size="sm"
                    leftIcon={<IconCheck size={16} />}
                    onClick={() => handleStatusUpdate(OrderStatus.CONFIRMED)}
                    loading={actionLoading === OrderStatus.CONFIRMED}
                  >
                    Confirm Order
                  </Button>
                )}
                {order.status === OrderStatus.CONFIRMED && (
                  <Button
                    size="sm"
                    leftIcon={<IconTruck size={16} />}
                    onClick={() => handleStatusUpdate(OrderStatus.SHIPPED)}
                    loading={actionLoading === OrderStatus.SHIPPED}
                  >
                    Mark as Shipped
                  </Button>
                )}
                {order.status === OrderStatus.SHIPPED && (
                  <Button
                    size="sm"
                    leftIcon={<IconCheck size={16} />}
                    onClick={() => handleStatusUpdate(OrderStatus.DELIVERED)}
                    loading={actionLoading === OrderStatus.DELIVERED}
                  >
                    Mark as Delivered
                  </Button>
                )}
                {(order.status === OrderStatus.DRAFT || order.status === OrderStatus.PENDING) && (
                  <Button
                    size="sm"
                    variant="outline"
                    color="red"
                    leftIcon={<IconX size={16} />}
                    onClick={() => handleStatusUpdate(OrderStatus.CANCELLED)}
                    loading={actionLoading === OrderStatus.CANCELLED}
                  >
                    Cancel Order
                  </Button>
                )}
              </Group>
            </Card>

            {/* Order Items */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">Order Items</Title>
              <Table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.line_items?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <Text weight={500}>{item.product_name || 'Unknown Product'}</Text>
                      </td>
                      <td>
                        <Text size="sm" color="dimmed">{item.product_sku || '-'}</Text>
                      </td>
                      <td>{item.quantity}</td>
                      <td>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td>
                        {item.discount_percentage > 0 && (
                          <Text size="sm" color="red">
                            {item.discount_percentage}%
                          </Text>
                        )}
                      </td>
                      <td>
                        <Text weight={500}>
                          {formatCurrency(item.total_price)}
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Divider my="md" />

              {/* Order Totals */}
              <Grid>
                <Grid.Col span={8}></Grid.Col>
                <Grid.Col span={4}>
                  <Stack spacing="xs">
                    <Group position="apart">
                      <Text>Subtotal:</Text>
                      <Text>
                        {formatCurrency(order.subtotal)}
                      </Text>
                    </Group>
                    {order.subtotal_discount_amount > 0 && (
                      <Group position="apart">
                        <Text>Discount:</Text>
                        <Text color="red">
                          -{formatCurrency(order.subtotal_discount_amount)}
                        </Text>
                      </Group>
                    )}
                    {order.tax_amount > 0 && (
                      <Group position="apart">
                        <Text>Tax:</Text>
                        <Text>
                          {formatCurrency(order.tax_amount)}
                        </Text>
                      </Group>
                    )}
                    {order.shipping_cost > 0 && (
                      <Group position="apart">
                        <Text>Shipping:</Text>
                        <Text>
                          {formatCurrency(order.shipping_cost)}
                        </Text>
                      </Group>
                    )}
                    <Divider />
                    <Group position="apart">
                      <Text weight={700} size="lg">Total:</Text>
                      <Text weight={700} size="lg">
                        {formatCurrency(order.total_amount)}
                      </Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>

          {/* Customer and Order Details */}
          <Grid.Col md={4}>
            {/* Customer Information */}
            {customer && (
              <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
                <Title order={4} mb="md">
                  <Group spacing="sm">
                    <IconUser size={20} />
                    Customer Information
                  </Group>
                </Title>
                <Stack spacing="sm">
                  <div>
                    <Text size="sm" color="dimmed">Name</Text>
                    <Text weight={500}>
                      {customer.first_name} {customer.last_name}
                      {customer.company_name && (
                        <Text size="sm" color="dimmed">
                          {customer.company_name}
                        </Text>
                      )}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" color="dimmed">Email</Text>
                    <Text>{customer.email}</Text>
                  </div>
                  <div>
                    <Text size="sm" color="dimmed">Phone</Text>
                    <Text>{customer.phone}</Text>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/dashboard/sales/customers/${customer.id}`)}
                  >
                    View Customer Details
                  </Button>
                </Stack>
              </Card>
            )}

            {/* Order Details */}
            <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
              <Title order={4} mb="md">
                <Group spacing="sm">
                  <IconCalendar size={20} />
                  Order Details
                </Group>
              </Title>
              <Stack spacing="sm">
                <div>
                  <Text size="sm" color="dimmed">Order Number</Text>
                  <Text weight={500}>{order.order_number}</Text>
                </div>
                <div>
                  <Text size="sm" color="dimmed">Order Date</Text>
                  <Text>{new Date(order.order_date).toLocaleDateString()}</Text>
                </div>
                {order.expected_delivery_date && (
                  <div>
                    <Text size="sm" color="dimmed">Expected Delivery</Text>
                    <Text>{new Date(order.expected_delivery_date).toLocaleDateString()}</Text>
                  </div>
                )}
                {order.shipping_date && (
                  <div>
                    <Text size="sm" color="dimmed">Shipping Date</Text>
                    <Text>{new Date(order.shipping_date).toLocaleDateString()}</Text>
                  </div>
                )}
                {order.delivery_date && (
                  <div>
                    <Text size="sm" color="dimmed">Delivery Date</Text>
                    <Text>{new Date(order.delivery_date).toLocaleDateString()}</Text>
                  </div>
                )}
                {order.created_at && (
                  <div>
                    <Text size="sm" color="dimmed">Created</Text>
                    <Text>{new Date(order.created_at).toLocaleString()}</Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Shipping Address */}
            {customer?.shipping_address && (
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={4} mb="md">
                  <Group spacing="sm">
                    <IconMapPin size={20} />
                    Shipping Address
                  </Group>
                </Title>
                <Text size="sm">
                  {customer.shipping_address.street}<br />
                  {customer.shipping_address.city}, {customer.shipping_address.state} {customer.shipping_address.postal_code}<br />
                  {customer.shipping_address.country}
                </Text>
              </Card>
            )}

            {/* Notes */}
            {order.notes && (
              <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
                <Title order={4} mb="md">Notes</Title>
                <Text size="sm">{order.notes}</Text>
              </Card>
            )}
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Sales Order"
        size="sm"
      >
        <Stack spacing="md">
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Are you sure you want to delete this sales order? This action cannot be undone.
          </Alert>
          <Group position="right">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDelete}
              loading={actionLoading === 'delete'}
            >
              Delete Order
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default SalesOrderDetailPage;
