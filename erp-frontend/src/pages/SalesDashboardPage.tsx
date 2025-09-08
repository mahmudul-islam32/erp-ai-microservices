import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Table,
  Button,
  Skeleton,
  Alert
} from '@mantine/core';
import {
  IconUsers,
  IconShoppingCart,
  IconFileInvoice,
  IconCurrencyDollar,
  IconTrendingUp,
  IconTrendingDown,
  IconEye,
  IconEdit,
  IconPlus
} from '@tabler/icons-react';
import { analyticsApi, salesOrdersApi, customerApi } from '../services/salesApi';
import { SalesAnalytics, SalesOrder, Customer } from '../types/sales';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, color = 'blue' }) => (
  <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Group position="apart">
      <Stack spacing={0}>
        <Text size="sm" color="dimmed" weight={500}>
          {title}
        </Text>
        <Text size="xl" weight={700}>
          {value}
        </Text>
        {trend !== undefined && (
          <Group spacing={4}>
            {trend >= 0 ? (
              <IconTrendingUp size={16} color="green" />
            ) : (
              <IconTrendingDown size={16} color="red" />
            )}
            <Text size="sm" color={trend >= 0 ? 'green' : 'red'}>
              {Math.abs(trend)}%
            </Text>
          </Group>
        )}
      </Stack>
      <ActionIcon size="xl" color={color} variant="light">
        {icon}
      </ActionIcon>
    </Group>
  </Card>
);

const SalesDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<SalesOrder[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load analytics data
      const [analyticsData, ordersData, customersData] = await Promise.all([
        analyticsApi.getSalesAnalytics(),
        salesOrdersApi.getOrders({ page: 1, limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
        customerApi.getCustomers({ page: 1, limit: 5, sort_by: 'created_at', sort_order: 'desc' })
      ]);

      setAnalytics(analyticsData);
      setRecentOrders(ordersData.items);
      setRecentCustomers(customersData.items);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'draft': 'gray',
      'pending': 'yellow',
      'confirmed': 'blue',
      'processing': 'orange',
      'shipped': 'cyan',
      'delivered': 'green',
      'cancelled': 'red',
      'paid': 'green',
      'overdue': 'red',
      'sent': 'blue'
    };
    return statusColors[status] || 'gray';
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
        <Title order={1}>Sales Dashboard</Title>
        <Group>
          <Button 
            leftIcon={<IconPlus size={16} />}
            onClick={() => navigate('/dashboard/sales/quotes/create')}
          >
            New Quote
          </Button>
          <Button 
            leftIcon={<IconPlus size={16} />}
            onClick={() => navigate('/dashboard/sales/orders/create')}
          >
            New Order
          </Button>
        </Group>
      </Group>

      {/* Stats Cards */}
      <Grid mb="xl">
        <Grid.Col span={3}>
          {loading ? (
            <Skeleton height={120} />
          ) : (
            <StatsCard
              title="Total Revenue"
              value={analytics ? formatCurrency(analytics.total_revenue) : '$0'}
              icon={<IconCurrencyDollar size={24} />}
              trend={analytics?.revenue_growth}
              color="green"
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          {loading ? (
            <Skeleton height={120} />
          ) : (
            <StatsCard
              title="Total Orders"
              value={analytics?.total_orders || 0}
              icon={<IconShoppingCart size={24} />}
              trend={analytics?.orders_growth}
              color="blue"
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          {loading ? (
            <Skeleton height={120} />
          ) : (
            <StatsCard
              title="Total Customers"
              value={analytics?.total_customers || 0}
              icon={<IconUsers size={24} />}
              color="violet"
            />
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          {loading ? (
            <Skeleton height={120} />
          ) : (
            <StatsCard
              title="Average Order Value"
              value={analytics ? formatCurrency(analytics.average_order_value) : '$0'}
              icon={<IconFileInvoice size={24} />}
              color="orange"
            />
          )}
        </Grid.Col>
      </Grid>

      <Grid>
        {/* Recent Orders */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group position="apart" mb="md">
              <Title order={3}>Recent Orders</Title>
              <Button 
                variant="subtle" 
                size="sm"
                onClick={() => navigate('/dashboard/sales/orders')}
              >
                View All
              </Button>
            </Group>
            {loading ? (
              <Stack>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height={50} />
                ))}
              </Stack>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>
                        {order.customer ? 
                          `${order.customer.first_name} ${order.customer.last_name}` :
                          'Unknown Customer'
                        }
                      </td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <Badge color={getStatusColor(order.status)} variant="light">
                          {order.status}
                        </Badge>
                      </td>
                      <td>
                        <Group spacing={4}>
                          <ActionIcon
                            size="sm"
                            onClick={() => navigate(`/dashboard/sales/orders/${order.id}`)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
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
        </Grid.Col>

        {/* Recent Customers */}
        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group position="apart" mb="md">
              <Title order={3}>Recent Customers</Title>
              <Button 
                variant="subtle" 
                size="sm"
                onClick={() => navigate('/dashboard/sales/customers')}
              >
                View All
              </Button>
            </Group>
            {loading ? (
              <Stack>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} height={50} />
                ))}
              </Stack>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{`${customer.first_name} ${customer.last_name}`}</td>
                      <td>{customer.email}</td>
                      <td>
                        <Badge variant="light">
                          {customer.customer_type}
                        </Badge>
                      </td>
                      <td>
                        <Badge color={getStatusColor(customer.status)} variant="light">
                          {customer.status}
                        </Badge>
                      </td>
                      <td>
                        <Group spacing={4}>
                          <ActionIcon
                            size="sm"
                            onClick={() => navigate(`/dashboard/sales/customers/${customer.id}`)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            onClick={() => navigate(`/dashboard/sales/customers/${customer.id}/edit`)}
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
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default SalesDashboardPage;
