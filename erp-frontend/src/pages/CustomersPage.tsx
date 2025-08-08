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
  IconFileText,
  IconShoppingCart
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../services/salesApi';
import { Customer, CustomerStatus, CustomerType, PaginationParams } from '../types/sales';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null
  });
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Increased from 10
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const loadCustomers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: PaginationParams = {
        page: currentPage,
        limit: pageSize, // Use dynamic page size
        search: searchQuery || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await customerApi.getCustomers(params);
      
      // Handle both paginated response and direct array response
      let customersData: Customer[];
      let totalPagesData: number;
      let totalCountData: number;
      
      if (Array.isArray(response)) {
        // Direct array response (fallback)
        customersData = response;
        totalPagesData = 1;
        totalCountData = response.length;
      } else {
        // Paginated response
        customersData = response.items || [];
        totalPagesData = response.pages || 1;
        totalCountData = response.total || 0;
      }
      
      // Apply client-side filtering for status and type (if not handled by backend)
      if (statusFilter) {
        customersData = customersData.filter(customer => customer.status === statusFilter);
      }
      if (typeFilter) {
        customersData = customersData.filter(customer => customer.customer_type === typeFilter);
      }
      
      setCustomers(customersData);
      setTotalPages(totalPagesData);
      setTotalCount(totalCountData);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers');
      setCustomers([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleDeleteCustomer = async () => {
    if (!deleteModal.customer?.id) return;

    try {
      await customerApi.deleteCustomer(deleteModal.customer.id);
      setDeleteModal({ open: false, customer: null });
      loadCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
        <Title order={1}>Customers</Title>
        <Button
          leftIcon={<IconPlus size={16} />}
          onClick={() => navigate('/dashboard/sales/customers/create')}
        >
          Add Customer
        </Button>
      </Group>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
        <Title order={4} mb="md">Filters</Title>
        <Grid>
          <Grid.Col span={4}>
            <TextInput
              placeholder="Search customers..."
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
                { value: CustomerStatus.ACTIVE, label: 'Active' },
                { value: CustomerStatus.INACTIVE, label: 'Inactive' },
                { value: CustomerStatus.SUSPENDED, label: 'Suspended' },
                { value: CustomerStatus.PROSPECT, label: 'Prospect' }
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <Select
              placeholder="Filter by type"
              data={[
                { value: '', label: 'All Types' },
                { value: CustomerType.INDIVIDUAL, label: 'Individual' },
                { value: CustomerType.BUSINESS, label: 'Business' },
                { value: CustomerType.GOVERNMENT, label: 'Government' }
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
            />
          </Grid.Col>
        </Grid>
      </Card>

      {/* Customers Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {loading ? (
          <Group position="center" p="xl">
            <Loader />
          </Group>
        ) : !customers || customers.length === 0 ? (
          <Text align="center" py="xl" color="dimmed">
            No customers found
          </Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Credit Limit</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Text weight={500}>
                        {`${customer.first_name} ${customer.last_name}`}
                      </Text>
                    </td>
                    <td>{customer.company_name || '-'}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>
                      <Badge color={getTypeColor(customer.customer_type)} variant="light">
                        {customer.customer_type}
                      </Badge>
                    </td>
                    <td>
                      <Badge color={getStatusColor(customer.status)} variant="light">
                        {customer.status}
                      </Badge>
                    </td>
                    <td>
                      {customer.credit_limit ? formatCurrency(customer.credit_limit) : '-'}
                    </td>
                    <td>
                      {customer.current_balance ? formatCurrency(customer.current_balance) : '$0.00'}
                    </td>
                    <td>
                      <Group spacing={4}>
                        <ActionIcon
                          variant="light"
                          onClick={() => navigate(`/dashboard/sales/customers/${customer.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => navigate(`/dashboard/sales/customers/${customer.id}/edit`)}
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
                            <Menu.Label>Customer Actions</Menu.Label>
                            <Menu.Item
                              icon={<IconShoppingCart size={14} />}
                              onClick={() => navigate(`/dashboard/sales/orders/create?customerId=${customer.id}`)}
                            >
                              Create Order
                            </Menu.Item>
                            <Menu.Item
                              icon={<IconFileText size={14} />}
                              onClick={() => navigate(`/dashboard/sales/quotes/create?customerId=${customer.id}`)}
                            >
                              Create Quote
                            </Menu.Item>
                            <Menu.Item
                              icon={<IconFileInvoice size={14} />}
                              onClick={() => navigate(`/dashboard/sales/invoices/create?customerId=${customer.id}`)}
                            >
                              Create Invoice
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              icon={<IconTrash size={14} />}
                              color="red"
                              onClick={() => setDeleteModal({ open: true, customer })}
                            >
                              Delete Customer
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            <Group position="apart" mt="xl">
              <Group>
                <Text size="sm" color="dimmed">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} customers
                </Text>
                <Select
                  label="Items per page"
                  value={pageSize.toString()}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                  data={[
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' }
                  ]}
                  size="sm"
                  style={{ width: 100 }}
                />
              </Group>
              {totalPages > 1 && (
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  siblings={1}
                  boundaries={1}
                />
              )}
            </Group>
          </>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, customer: null })}
        title="Delete Customer"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete customer "
            {deleteModal.customer && `${deleteModal.customer.first_name} ${deleteModal.customer.last_name}`}"?
            This action cannot be undone.
          </Text>
          <Group position="right" mt="md">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, customer: null })}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteCustomer}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default CustomersPage;
