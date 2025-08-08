import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Grid,
  Card,
  Text,
  Badge,
  Breadcrumbs,
  Anchor,
  Alert,
  Stack,
  Loader,
  Center,
  Tabs,
  Table,
  ActionIcon,
  Menu,
  Modal
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconPhone,
  IconMail,
  IconMapPin,
  IconCreditCard,
  IconShoppingCart,
  IconFileInvoice,
  IconDots,
  IconEye,
  IconPlus,
  IconAlertCircle
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerApi, salesOrdersApi } from '../services/salesApi';
import { Customer, CustomerStatus, CustomerType, SalesOrder } from '../types/sales';

const CustomerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);

  // Load customer data
  const loadCustomer = useCallback(async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError(null);
      const customerData = await customerApi.getCustomer(customerId);
      setCustomer(customerData);
    } catch (err) {
      console.error('Error loading customer:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Load customer orders
  const loadOrders = useCallback(async () => {
    if (!customerId) return;

    try {
      setOrdersLoading(true);
      const response = await salesOrdersApi.getOrders({
        page: 1,
        limit: 50,
        search: customerId // This should be filtered by customer_id in backend
      });
      setOrders(response.items || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomer();
    loadOrders();
  }, [loadCustomer, loadOrders]);

  const handleDeleteCustomer = async () => {
    if (!customer) return;

    try {
      await customerApi.deleteCustomer(customer.id!);
      navigate('/dashboard/sales/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer');
    }
  };

  const getStatusColor = (status: CustomerStatus) => {
    const colors: Record<CustomerStatus, string> = {
      [CustomerStatus.ACTIVE]: 'green',
      [CustomerStatus.INACTIVE]: 'gray',
      [CustomerStatus.SUSPENDED]: 'red',
      [CustomerStatus.PROSPECT]: 'blue'
    };
    return colors[status] || 'gray';
  };

  const getTypeColor = (type: CustomerType) => {
    const colors: Record<CustomerType, string> = {
      [CustomerType.INDIVIDUAL]: 'blue',
      [CustomerType.BUSINESS]: 'green',
      [CustomerType.GOVERNMENT]: 'purple'
    };
    return colors[type] || 'gray';
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

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales', href: '/dashboard/sales' },
    { title: 'Customers', href: '/dashboard/sales/customers' },
    { title: customer ? `${customer.first_name} ${customer.last_name}` : 'Customer Details', href: '#' }
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

  if (error || !customer) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error || 'Customer not found'}
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
                {customer.first_name} {customer.last_name}
                <Badge color={getStatusColor(customer.status)} variant="light">
                  {customer.status}
                </Badge>
                <Badge color={getTypeColor(customer.customer_type)} variant="outline">
                  {customer.customer_type}
                </Badge>
              </Group>
            </Title>
            {customer.company_name && (
              <Text color="dimmed" size="lg">
                {customer.company_name}
              </Text>
            )}
          </div>
          <Group>
            <Button
              variant="outline"
              leftIcon={<IconArrowLeft size={16} />}
              onClick={() => navigate('/dashboard/sales/customers')}
            >
              Back to Customers
            </Button>
            <Button
              leftIcon={<IconPlus size={16} />}
              onClick={() => navigate(`/dashboard/sales/orders/create?customerId=${customer.id}`)}
            >
              New Order
            </Button>
            <Button
              variant="outline"
              leftIcon={<IconEdit size={16} />}
              onClick={() => navigate(`/dashboard/sales/customers/${customer.id}/edit`)}
            >
              Edit Customer
            </Button>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="outline">
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  icon={<IconFileInvoice size={14} />}
                  onClick={() => navigate(`/dashboard/sales/quotes/create?customerId=${customer.id}`)}
                >
                  Create Quote
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  icon={<IconTrash size={14} />}
                  color="red"
                  onClick={() => setDeleteModal(true)}
                >
                  Delete Customer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Grid>
          {/* Customer Overview */}
          <Grid.Col md={4}>
            {/* Contact Information */}
            <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
              <Title order={4} mb="md">Contact Information</Title>
              <Stack spacing="sm">
                <Group spacing="sm">
                  <IconMail size={16} color="blue" />
                  <Text size="sm">{customer.email}</Text>
                </Group>
                <Group spacing="sm">
                  <IconPhone size={16} color="green" />
                  <Text size="sm">{customer.phone}</Text>
                </Group>
                {customer.billing_address && (
                  <Group spacing="sm" align="flex-start">
                    <IconMapPin size={16} color="red" />
                    <div>
                      <Text size="sm" weight={500}>Billing Address</Text>
                      <Text size="sm" color="dimmed">
                        {customer.billing_address.street}<br />
                        {customer.billing_address.city}, {customer.billing_address.state} {customer.billing_address.postal_code}<br />
                        {customer.billing_address.country}
                      </Text>
                    </div>
                  </Group>
                )}
                {customer.shipping_address && (
                  <Group spacing="sm" align="flex-start">
                    <IconMapPin size={16} color="orange" />
                    <div>
                      <Text size="sm" weight={500}>Shipping Address</Text>
                      <Text size="sm" color="dimmed">
                        {customer.shipping_address.street}<br />
                        {customer.shipping_address.city}, {customer.shipping_address.state} {customer.shipping_address.postal_code}<br />
                        {customer.shipping_address.country}
                      </Text>
                    </div>
                  </Group>
                )}
              </Stack>
            </Card>

            {/* Financial Information */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                <Group spacing="sm">
                  <IconCreditCard size={20} />
                  Financial Information
                </Group>
              </Title>
              <Stack spacing="sm">
                <Group position="apart">
                  <Text size="sm">Payment Terms</Text>
                  <Text size="sm" weight={500}>{customer.payment_terms.replace('_', ' ').toUpperCase()}</Text>
                </Group>
                <Group position="apart">
                  <Text size="sm">Credit Limit</Text>
                  <Text size="sm" weight={500}>
                    {customer.credit_limit ? formatCurrency(customer.credit_limit) : 'No limit'}
                  </Text>
                </Group>
                <Group position="apart">
                  <Text size="sm">Current Balance</Text>
                  <Text 
                    size="sm" 
                    weight={500}
                    color={customer.current_balance && customer.current_balance > 0 ? 'red' : 'green'}
                  >
                    {customer.current_balance ? formatCurrency(customer.current_balance) : '$0.00'}
                  </Text>
                </Group>
                <Group position="apart">
                  <Text size="sm">Total Orders</Text>
                  <Text size="sm" weight={500}>{customer.total_orders || 0}</Text>
                </Group>
                {customer.last_order_date && (
                  <Group position="apart">
                    <Text size="sm">Last Order</Text>
                    <Text size="sm" weight={500}>{formatDate(customer.last_order_date)}</Text>
                  </Group>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Main Content */}
          <Grid.Col md={8}>
            <Tabs defaultValue="orders">
              <Tabs.List>
                <Tabs.Tab value="orders" icon={<IconShoppingCart size={14} />}>
                  Orders ({orders.length})
                </Tabs.Tab>
                <Tabs.Tab value="quotes" icon={<IconFileInvoice size={14} />}>
                  Quotes
                </Tabs.Tab>
                <Tabs.Tab value="invoices" icon={<IconFileInvoice size={14} />}>
                  Invoices
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="orders" pt="lg">
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  {ordersLoading ? (
                    <Center h={200}>
                      <Loader />
                    </Center>
                  ) : orders.length === 0 ? (
                    <Center h={200}>
                      <Stack align="center" spacing="sm">
                        <IconShoppingCart size={48} stroke={1} color="gray" />
                        <Text color="dimmed">No orders found</Text>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/dashboard/sales/orders/create?customerId=${customer.id}`)}
                        >
                          Create First Order
                        </Button>
                      </Stack>
                    </Center>
                  ) : (
                    <Table striped highlightOnHover>
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Total</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <Text weight={500}>{order.order_number}</Text>
                            </td>
                            <td>{formatDate(order.order_date)}</td>
                            <td>
                              <Badge color="blue" variant="light">
                                {order.status}
                              </Badge>
                            </td>
                            <td>{formatCurrency(order.total_amount)}</td>
                            <td>
                              <Group spacing={4}>
                                <ActionIcon
                                  variant="light"
                                  onClick={() => navigate(`/dashboard/sales/orders/${order.id}`)}
                                >
                                  <IconEye size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => navigate(`/dashboard/sales/orders/${order.id}/edit`)}
                                >
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </Group>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card>
              </Tabs.Panel>

              <Tabs.Panel value="quotes" pt="lg">
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Center h={200}>
                    <Stack align="center" spacing="sm">
                      <IconFileInvoice size={48} stroke={1} color="gray" />
                      <Text color="dimmed">Quotes feature coming soon</Text>
                    </Stack>
                  </Center>
                </Card>
              </Tabs.Panel>

              <Tabs.Panel value="invoices" pt="lg">
                <Card shadow="sm" p="lg" radius="md" withBorder>
                  <Center h={200}>
                    <Stack align="center" spacing="sm">
                      <IconFileInvoice size={48} stroke={1} color="gray" />
                      <Text color="dimmed">Invoices feature coming soon</Text>
                    </Stack>
                  </Center>
                </Card>
              </Tabs.Panel>
            </Tabs>
          </Grid.Col>
        </Grid>

        {/* Notes */}
        {customer.notes && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Title order={4} mb="md">Notes</Title>
            <Text>{customer.notes}</Text>
          </Card>
        )}
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Customer"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete customer "{customer.first_name} {customer.last_name}"?
            This action cannot be undone and will also delete all associated orders and data.
          </Text>
          <Group position="right" mt="md">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteCustomer}>
              Delete Customer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default CustomerDetailPage;
