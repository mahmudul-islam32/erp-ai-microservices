import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Group,
  RingProgress,
  Stack,
  Badge,
  Loader,
  Center,
  Alert,
  Paper,
  Grid,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconPackage,
  IconCategory,
  IconBuilding,
  IconTruck,
  IconChartLine,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
} from '@tabler/icons-react';
import {
  ProductService,
  CategoryService,
  SupplierService,
  WarehouseService,
  InventoryService,
} from '../services/inventory';

interface DashboardStats {
  products: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalValue: number;
    averagePrice: number;
    categoriesCount: number;
  };
  categories: {
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    rootCategories: number;
    maxDepth: number;
    avgProductsPerCategory: number;
  };
  suppliers: {
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    averageLeadTime: number;
    suppliersWithCreditLimit: number;
    topCountries: string[];
  };
  warehouses: {
    totalWarehouses: number;
    activeWarehouses: number;
    inactiveWarehouses: number;
    mainWarehouses: number;
    totalCapacity: number;
    avgCapacity: number;
    topCities: string[];
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    averageValue: number;
  };
}

const InventoryDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productStats, categoryStats, supplierStats, warehouseStats, inventoryStats] = await Promise.all([
        ProductService.getProductStats(),
        CategoryService.getCategoryStats(),
        SupplierService.getSupplierStats(),
        WarehouseService.getWarehouseStats(),
        InventoryService.getInventoryStats(),
      ]);

      // Create safe stats object with default values for missing properties
      setStats({
        products: {
          totalProducts: productStats.totalProducts || 0,
          activeProducts: productStats.activeProducts || 0,
          inactiveProducts: productStats.inactiveProducts || 0,
          lowStockProducts: productStats.lowStockProducts || 0,
          outOfStockProducts: productStats.outOfStockProducts || 0,
          totalValue: productStats.totalValue || 0,
          averagePrice: productStats.averagePrice || 0,
          categoriesCount: productStats.categoriesCount || 0,
        },
        categories: {
          totalCategories: categoryStats.totalCategories || 0,
          activeCategories: categoryStats.activeCategories || 0,
          inactiveCategories: categoryStats.inactiveCategories || 0,
          rootCategories: categoryStats.rootCategories || 0,
          maxDepth: categoryStats.maxDepth || 0,
          avgProductsPerCategory: categoryStats.avgProductsPerCategory || 0,
        },
        suppliers: {
          totalSuppliers: supplierStats.totalSuppliers || 0,
          activeSuppliers: supplierStats.activeSuppliers || 0,
          inactiveSuppliers: supplierStats.inactiveSuppliers || 0,
          averageLeadTime: supplierStats.averageLeadTime || 0,
          suppliersWithCreditLimit: supplierStats.suppliersWithCreditLimit || 0,
          topCountries: supplierStats.topCountries || [],
        },
        warehouses: {
          totalWarehouses: warehouseStats.totalWarehouses || 0,
          activeWarehouses: warehouseStats.activeWarehouses || 0,
          inactiveWarehouses: warehouseStats.inactiveWarehouses || 0,
          mainWarehouses: warehouseStats.mainWarehouses || 0,
          totalCapacity: warehouseStats.totalCapacity || 0,
          avgCapacity: warehouseStats.avgCapacity || 0,
          topCities: warehouseStats.topCities || [],
        },
        inventory: {
          totalItems: inventoryStats.totalItems || 0,
          lowStockItems: inventoryStats.lowStockItems || 0,
          outOfStockItems: inventoryStats.outOfStockItems || 0,
          totalValue: inventoryStats.totalValue || 0,
          averageValue: inventoryStats.averageValue || 0,
        },
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert color="red" title="Error">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container size="xl" py="xl">
        <Text>No data available</Text>
      </Container>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card withBorder padding="lg" radius="md">
      <Group position="apart">
        <div>
          <Text color="dimmed" size="sm" weight={500} transform="uppercase">
            {title}
          </Text>
          <Text weight={700} size="xl">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          {subtitle && (
            <Text color="dimmed" size="xs">
              {subtitle}
            </Text>
          )}
        </div>
        <div style={{ color }}>{icon}</div>
      </Group>
    </Card>
  );

  const ProgressCard: React.FC<{
    title: string;
    value: number;
    total: number;
    color: string;
    icon: React.ReactNode;
  }> = ({ title, value, total, color, icon }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    
    return (
      <Card withBorder padding="lg" radius="md">
        <Group position="apart">
          <div>
            <Text color="dimmed" size="sm" weight={500} transform="uppercase">
              {title}
            </Text>
            <Text weight={700} size="xl">
              {value} / {total}
            </Text>
          </div>
          <RingProgress
            size={80}
            thickness={8}
            sections={[{ value: percentage, color }]}
            label={
              <Text color={color} weight={700} align="center" size="xs">
                {percentage}%
              </Text>
            }
          />
        </Group>
        <Group mt="xs">
          {icon}
        </Group>
      </Card>
    );
  };

  return (
    <Container size="xl" py="xl">
      <Group position="apart" mb="xl">
        <Title order={2}>Inventory Dashboard</Title>
        <Tooltip label="Refresh data">
          <ActionIcon onClick={fetchStats} variant="light" loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* Overview Cards */}
      <SimpleGrid cols={4} spacing="lg" mb="xl" breakpoints={[
        { maxWidth: 'lg', cols: 2 },
        { maxWidth: 'sm', cols: 1 },
      ]}>
        <StatCard
          title="Total Products"
          value={stats.products.totalProducts}
          icon={<IconPackage size={28} />}
          color="blue"
          subtitle={`${stats.products.activeProducts} active`}
        />
        <StatCard
          title="Categories"
          value={stats.categories.totalCategories}
          icon={<IconCategory size={28} />}
          color="green"
          subtitle={`${stats.categories.rootCategories} root categories`}
        />
        <StatCard
          title="Warehouses"
          value={stats.warehouses.totalWarehouses}
          icon={<IconBuilding size={28} />}
          color="violet"
          subtitle={`${stats.warehouses.activeWarehouses} active`}
        />
        <StatCard
          title="Suppliers"
          value={stats.suppliers.totalSuppliers}
          icon={<IconTruck size={28} />}
          color="orange"
          subtitle={`${stats.suppliers.activeSuppliers} active`}
        />
      </SimpleGrid>

      {/* Stock Status */}
      <Grid mb="xl">
        <Grid.Col md={6}>
          <Card withBorder padding="lg" radius="md" style={{ height: '100%' }}>
            <Title order={4} mb="md">Stock Status</Title>
            <Stack spacing="md">
              <Group position="apart">
                <Group spacing="xs">
                  <IconAlertTriangle size={16} color="red" />
                  <Text size="sm">Out of Stock</Text>
                </Group>
                <Badge color="red" variant="light">
                  {stats.inventory.outOfStockItems}
                </Badge>
              </Group>
              <Group position="apart">
                <Group spacing="xs">
                  <IconArrowDown size={16} color="orange" />
                  <Text size="sm">Low Stock</Text>
                </Group>
                <Badge color="orange" variant="light">
                  {stats.inventory.lowStockItems}
                </Badge>
              </Group>
              <Group position="apart">
                <Group spacing="xs">
                  <IconChartLine size={16} color="green" />
                  <Text size="sm">Total Inventory Value</Text>
                </Group>
                <Text weight={500}>
                  ${stats.inventory.totalValue.toLocaleString()}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
        
        <Grid.Col md={6}>
          <Card withBorder padding="lg" radius="md" style={{ height: '100%' }}>
            <Title order={4} mb="md">Product Distribution</Title>
            <Stack spacing="md">
              <ProgressCard
                title="Active Products"
                value={stats.products.activeProducts}
                total={stats.products.totalProducts}
                color="green"
                icon={<IconArrowUp size={16} color="green" />}
              />
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Detailed Stats */}
      <Grid>
        <Grid.Col lg={6}>
          <Paper withBorder p="lg" radius="md">
            <Title order={4} mb="md">Financial Overview</Title>
            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">Average Product Price</Text>
                <Text weight={500}>${(stats.products.averagePrice || 0).toFixed(2)}</Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Average Inventory Value</Text>
                <Text weight={500}>${(stats.inventory.averageValue || 0).toFixed(2)}</Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Total Inventory Items</Text>
                <Text weight={500}>{stats.inventory.totalItems.toLocaleString()}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col lg={6}>
          <Paper withBorder p="lg" radius="md">
            <Title order={4} mb="md">Operational Metrics</Title>
            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">Products per Category</Text>
                <Text weight={500}>{(stats.categories.avgProductsPerCategory || 0).toFixed(1)}</Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Average Supplier Lead Time</Text>
                <Text weight={500}>{stats.suppliers.averageLeadTime} days</Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Category Depth</Text>
                <Text weight={500}>{stats.categories.maxDepth} levels</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default InventoryDashboardPage;
