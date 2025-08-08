import React, { useState, useEffect, useCallback } from 'react';
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
  Menu,
  NumberInput,
  Textarea,
  Breadcrumbs,
  Anchor,
  Paper,
  SimpleGrid,
  Progress
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSearch,
  IconDotsVertical,
  IconFileInvoice,
  IconSend,
  IconCheck,
  IconCurrencyDollar,
  IconPrinter,
  IconDownload,
  IconClock
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { invoicesApi, customerApi } from '../services/salesApi';
import { Invoice, InvoiceStatus, Customer, PaginationParams, InvoiceCreate } from '../types/sales';

const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; invoice: Invoice | null }>({
    open: false,
    invoice: null
  });
  const [createModal, setCreateModal] = useState(false);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Increased from 10
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');

  // Form data for creating invoices
  const [formData, setFormData] = useState<Partial<InvoiceCreate>>({
    customer_id: '',
    items: [],
    tax_rate: 0.08,
    discount_amount: 0,
    due_date: '',
    notes: ''
  });

    const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: PaginationParams = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      const response = await invoicesApi.getInvoices(params);
      
      // Handle both paginated response and direct array response
      let invoicesData: Invoice[];
      let totalPagesData: number;
      let totalCountData: number;
      
      if (Array.isArray(response)) {
        // Direct array response (fallback)
        invoicesData = response;
        totalPagesData = 1;
        totalCountData = response.length;
      } else {
        // Paginated response
        invoicesData = response.items || [];
        totalPagesData = response.pages || 1;
        totalCountData = response.total || 0;
      }
      
      // Apply client-side filtering for status and customer (if not handled by backend)
      if (statusFilter) {
        invoicesData = invoicesData.filter(invoice => invoice.status === statusFilter);
      }
      if (customerFilter) {
        invoicesData = invoicesData.filter(invoice => invoice.customer_id === customerFilter);
      }
      
      setInvoices(invoicesData);
      setTotalPages(totalPagesData);
      setTotalCount(totalCountData);
      setError(null);
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, customerFilter]);

  const loadCustomers = React.useCallback(async () => {
    try {
      const response = await customerApi.getCustomers({ limit: 100 });
      
      // Handle both paginated response and direct array response
      if (Array.isArray(response)) {
        setCustomers(response);
      } else {
        setCustomers(response.items || []);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setCustomers([]); // Set to empty array on error
    }
  }, []);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string | null) => {
    if (newPageSize) {
      setPageSize(parseInt(newPageSize));
      setCurrentPage(1); // Reset to first page
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateInvoice = async () => {
    try {
      if (!formData.customer_id || !formData.items?.length) {
        alert('Please fill in all required fields');
        return;
      }
      
      await invoicesApi.createInvoice(formData as InvoiceCreate);
      setCreateModal(false);
      setFormData({
        customer_id: '',
        items: [],
        tax_rate: 0.08,
        discount_amount: 0,
        due_date: '',
        notes: ''
      });
      loadInvoices();
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('Failed to create invoice');
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
      await invoicesApi.updateInvoiceStatus(invoiceId, status);
      loadInvoices();
    } catch (err) {
      console.error('Error updating invoice status:', err);
      alert('Failed to update invoice status');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteModal.invoice?.id) return;
    
    try {
      await invoicesApi.deleteInvoice(deleteModal.invoice.id);
      setDeleteModal({ open: false, invoice: null });
      loadInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      alert('Failed to delete invoice');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string, amount: number) => {
    try {
      await invoicesApi.recordPayment(invoiceId, amount);
      loadInvoices();
      alert('Payment recorded successfully!');
    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment');
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.DRAFT: return 'gray';
      case InvoiceStatus.SENT: return 'blue';
      case InvoiceStatus.VIEWED: return 'cyan';
      case InvoiceStatus.PAID: return 'green';
      case InvoiceStatus.OVERDUE: return 'red';
      case InvoiceStatus.CANCELLED: return 'orange';
      default: return 'gray';
    }
  };

  const calculatePaymentProgress = (invoice: Invoice) => {
    if (invoice.total_amount === 0) return 0;
    return (invoice.paid_amount / invoice.total_amount) * 100;
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales', href: '/dashboard/sales' },
    { title: 'Invoices', href: '/dashboard/sales/invoices' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  const statsCards = [
    {
      title: 'Total Invoices',
      value: invoices?.length || 0,
      icon: <IconFileInvoice size={24} />,
      color: 'blue'
    },
    {
      title: 'Overdue Invoices',
      value: invoices?.filter(i => i.status === InvoiceStatus.OVERDUE).length || 0,
      icon: <IconClock size={24} />,
      color: 'red'
    },
    {
      title: 'Paid Invoices',
      value: invoices?.filter(i => i.status === InvoiceStatus.PAID).length || 0,
      icon: <IconCheck size={24} />,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: `$${(invoices || []).reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0).toFixed(2)}`,
      icon: <IconCurrencyDollar size={24} />,
      color: 'teal'
    }
  ];

  if (loading && (!invoices || invoices.length === 0)) {
    return (
      <Container size="xl" py="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        {/* Header */}
        <div>
          <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
          <Group position="apart" align="center" mt="sm">
            <div>
              <Title order={2}>
                <Group spacing="sm">
                  <IconFileInvoice size={28} />
                  Invoices
                </Group>
              </Title>
              <Text color="dimmed" size="sm">
                Manage sales invoices and payments
              </Text>
            </div>
            <Button leftIcon={<IconPlus size={16} />} onClick={() => setCreateModal(true)}>
              Create Invoice
            </Button>
          </Group>
        </div>

        {/* Stats Cards */}
        <SimpleGrid cols={4} spacing="lg" breakpoints={[
          { maxWidth: 'lg', cols: 2 },
          { maxWidth: 'sm', cols: 1 }
        ]}>
          {statsCards.map((stat) => (
            <Card key={stat.title} shadow="sm" p="lg" radius="md" withBorder>
              <Group position="apart" mb="xs">
                <Text weight={500} size="sm" color="dimmed" transform="uppercase">
                  {stat.title}
                </Text>
                <div style={{ color: `var(--mantine-color-${stat.color}-6)` }}>
                  {stat.icon}
                </div>
              </Group>
              <Text size="xl" weight={700}>
                {stat.value}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        {/* Filters */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Grid>
            <Grid.Col xs={12} sm={6} md={3}>
              <TextInput
                placeholder="Search invoices..."
                icon={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={3}>
              <Select
                placeholder="Filter by status"
                data={[
                  { value: '', label: 'All Status' },
                  { value: InvoiceStatus.DRAFT, label: 'Draft' },
                  { value: InvoiceStatus.SENT, label: 'Sent' },
                  { value: InvoiceStatus.VIEWED, label: 'Viewed' },
                  { value: InvoiceStatus.PAID, label: 'Paid' },
                  { value: InvoiceStatus.OVERDUE, label: 'Overdue' },
                  { value: InvoiceStatus.CANCELLED, label: 'Cancelled' },
                ]}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value || '')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={3}>
              <Select
                placeholder="Filter by customer"
                searchable
                data={[
                  { value: '', label: 'All Customers' },
                  ...customers.map(customer => ({
                    value: customer.id || '',
                    label: `${customer.first_name} ${customer.last_name} ${customer.company_name ? `(${customer.company_name})` : ''}`.trim()
                  }))
                ]}
                value={customerFilter}
                onChange={(value) => setCustomerFilter(value || '')}
              />
            </Grid.Col>
            <Grid.Col xs={12} sm={6} md={3}>
              <Button onClick={loadInvoices} variant="light">
                Refresh
              </Button>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Invoices Table */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {!invoices || invoices.length === 0 ? (
            <Text align="center" color="dimmed" py="xl">
              No invoices found
            </Text>
          ) : (
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment Progress</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Text weight={500}>{invoice.invoice_number}</Text>
                    </td>
                    <td>
                      <div>
                        <Text size="sm" weight={500}>
                          {invoice.customer?.first_name} {invoice.customer?.last_name}
                        </Text>
                        {invoice.customer?.company_name && (
                          <Text size="xs" color="dimmed">
                            {invoice.customer.company_name}
                          </Text>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <Text weight={500}>${invoice.total_amount?.toFixed(2)}</Text>
                        <Text size="xs" color="dimmed">
                          Balance: ${invoice.balance_due?.toFixed(2)}
                        </Text>
                      </div>
                    </td>
                    <td>
                      <div>
                        <Progress 
                          value={calculatePaymentProgress(invoice)} 
                          size="sm" 
                          color={invoice.status === InvoiceStatus.PAID ? 'green' : 'blue'}
                          mb={4}
                        />
                        <Text size="xs" color="dimmed">
                          ${invoice.paid_amount?.toFixed(2)} / ${invoice.total_amount?.toFixed(2)}
                        </Text>
                      </div>
                    </td>
                    <td>
                      <Badge color={getStatusColor(invoice.status)} variant="light">
                        {invoice.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Text size="sm">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </Text>
                    </td>
                    <td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon>
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item icon={<IconEye size={14} />}>
                            View Details
                          </Menu.Item>
                          <Menu.Item icon={<IconEdit size={14} />}>
                            Edit Invoice
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item icon={<IconPrinter size={14} />}>
                            Print Invoice
                          </Menu.Item>
                          <Menu.Item icon={<IconDownload size={14} />}>
                            Download PDF
                          </Menu.Item>
                          <Menu.Divider />
                          {invoice.status === InvoiceStatus.DRAFT && (
                            <Menu.Item 
                              icon={<IconSend size={14} />}
                              onClick={() => handleUpdateInvoiceStatus(invoice.id!, InvoiceStatus.SENT)}
                            >
                              Send Invoice
                            </Menu.Item>
                          )}
                          {invoice.balance_due > 0 && (
                            <Menu.Item 
                              icon={<IconCurrencyDollar size={14} />}
                              onClick={() => handleMarkAsPaid(invoice.id!, invoice.balance_due)}
                            >
                              Mark as Paid
                            </Menu.Item>
                          )}
                          <Menu.Divider />
                          <Menu.Item 
                            icon={<IconTrash size={14} />}
                            color="red"
                            onClick={() => setDeleteModal({ open: true, invoice })}
                          >
                            Delete Invoice
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Paper>

        {/* Pagination */}
        <Group position="apart" mt="xl">
          <Group>
            <Text size="sm" color="dimmed">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} invoices
            </Text>
            <Select
              label="Items per page"
              value={pageSize.toString()}
              onChange={handlePageSizeChange}
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
      </Stack>

      {/* Create Invoice Modal */}
      <Modal
        opened={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Invoice"
        size="lg"
      >
        <Stack spacing="md">
          <Select
            label="Customer"
            placeholder="Select a customer"
            data={customers.map(customer => ({
              value: customer.id || '',
              label: `${customer.first_name} ${customer.last_name} ${customer.company_name ? `(${customer.company_name})` : ''}`.trim()
            }))}
            value={formData.customer_id}
            onChange={(value) => setFormData({ ...formData, customer_id: value || '' })}
            searchable
            required
          />
          
          <Grid>
            <Grid.Col sm={6}>
              <NumberInput
                label="Tax Rate (%)"
                value={(formData.tax_rate || 0) * 100}
                onChange={(value) => setFormData({ ...formData, tax_rate: (value || 0) / 100 })}
                min={0}
                max={100}
                precision={2}
              />
            </Grid.Col>
            <Grid.Col sm={6}>
              <NumberInput
                label="Discount Amount"
                value={formData.discount_amount}
                onChange={(value) => setFormData({ ...formData, discount_amount: value || 0 })}
                min={0}
                precision={2}
                parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                formatter={(value) =>
                  !Number.isNaN(parseFloat(value || ''))
                    ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    : '$ '
                }
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Due Date"
            placeholder="YYYY-MM-DD"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <Group position="right" mt="md">
            <Button variant="light" onClick={() => setCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              Create Invoice
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, invoice: null })}
        title="Delete Invoice"
      >
        <Text mb="md">
          Are you sure you want to delete invoice #{deleteModal.invoice?.invoice_number}? 
          This action cannot be undone.
        </Text>
        <Group position="right">
          <Button 
            variant="light" 
            onClick={() => setDeleteModal({ open: false, invoice: null })}
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteInvoice}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default InvoicesPage;
