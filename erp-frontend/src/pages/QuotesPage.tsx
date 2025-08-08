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
  Menu,
  NumberInput,
  Textarea,
  Breadcrumbs,
  Anchor,
  Paper,
  SimpleGrid
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
  IconFileText,
  IconCalendar,
  IconCurrencyDollar
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { quotesApi, customerApi, salesOrdersApi } from '../services/salesApi';
import { Quote, QuoteStatus, Customer, PaginationParams, QuoteCreate } from '../types/sales';

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; quote: Quote | null }>({
    open: false,
    quote: null
  });
  const [createModal, setCreateModal] = useState(false);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('');

  // Form data for creating/editing quotes
  const [formData, setFormData] = useState<Partial<QuoteCreate>>({
    customer_id: '',
    line_items: [],
    tax_rate: 0.08,
    discount_amount: 0,
    expiry_date: '',
    notes: ''
  });

  const loadQuotes = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: PaginationParams = {
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      };
      
      const response = await quotesApi.getQuotes(params);
      
      // Handle both paginated response and direct array response
      if (Array.isArray(response)) {
        setQuotes(response);
        setTotalPages(1);
      } else {
        setQuotes(response.items || []);
        setTotalPages(response.pages || 1);
      }
    } catch (err) {
      setError('Failed to load quotes');
      setQuotes([]); // Set to empty array on error
      console.error('Error loading quotes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

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

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateQuote = async () => {
    try {
      if (!formData.customer_id || !formData.line_items?.length) {
        alert('Please fill in all required fields');
        return;
      }
      
      await quotesApi.createQuote(formData as QuoteCreate);
      setCreateModal(false);
      setFormData({
        customer_id: '',
        line_items: [],
        tax_rate: 0.08,
        discount_amount: 0,
        expiry_date: '',
        notes: ''
      });
      loadQuotes();
    } catch (err) {
      console.error('Error creating quote:', err);
      alert('Failed to create quote');
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, status: QuoteStatus) => {
    try {
      await quotesApi.updateQuoteStatus(quoteId, status);
      loadQuotes();
    } catch (err) {
      console.error('Error updating quote status:', err);
      alert('Failed to update quote status');
    }
  };

  const handleDeleteQuote = async () => {
    if (!deleteModal.quote?.id) return;
    
    try {
      await quotesApi.deleteQuote(deleteModal.quote.id);
      setDeleteModal({ open: false, quote: null });
      loadQuotes();
    } catch (err) {
      console.error('Error deleting quote:', err);
      alert('Failed to delete quote');
    }
  };

  const handleConvertToOrder = async (quoteId: string) => {
    try {
      await salesOrdersApi.convertQuoteToOrder(quoteId);
      loadQuotes();
      alert('Quote converted to sales order successfully!');
    } catch (err) {
      console.error('Error converting quote to order:', err);
      alert('Failed to convert quote to order');
    }
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.DRAFT: return 'gray';
      case QuoteStatus.SENT: return 'blue';
      case QuoteStatus.VIEWED: return 'cyan';
      case QuoteStatus.ACCEPTED: return 'green';
      case QuoteStatus.REJECTED: return 'red';
      case QuoteStatus.EXPIRED: return 'orange';
      case QuoteStatus.CONVERTED: return 'violet';
      default: return 'gray';
    }
  };

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales', href: '/dashboard/sales' },
    { title: 'Quotes', href: '/dashboard/sales/quotes' },
  ].map((item, index) => (
    <Anchor key={index} component="button" onClick={() => navigate(item.href)}>
      {item.title}
    </Anchor>
  ));

  const statsCards = [
    {
      title: 'Total Quotes',
      value: quotes?.length || 0,
      icon: <IconFileText size={24} />,
      color: 'blue'
    },
    {
      title: 'Pending Quotes',
      value: quotes?.filter(q => [QuoteStatus.SENT, QuoteStatus.VIEWED].includes(q.status)).length || 0,
      icon: <IconCalendar size={24} />,
      color: 'orange'
    },
    {
      title: 'Accepted Quotes',
      value: quotes?.filter(q => q.status === QuoteStatus.ACCEPTED).length || 0,
      icon: <IconCheck size={24} />,
      color: 'green'
    },
    {
      title: 'Total Value',
      value: `$${(quotes || []).reduce((sum, quote) => sum + (quote.total_amount || 0), 0).toFixed(2)}`,
      icon: <IconCurrencyDollar size={24} />,
      color: 'teal'
    }
  ];

  if (loading && (!quotes || quotes.length === 0)) {
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
                  <IconFileText size={28} />
                  Quotes
                </Group>
              </Title>
              <Text color="dimmed" size="sm">
                Manage sales quotes and proposals
              </Text>
            </div>
            <Button leftIcon={<IconPlus size={16} />} onClick={() => setCreateModal(true)}>
              Create Quote
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
                placeholder="Search quotes..."
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
                  { value: QuoteStatus.DRAFT, label: 'Draft' },
                  { value: QuoteStatus.SENT, label: 'Sent' },
                  { value: QuoteStatus.VIEWED, label: 'Viewed' },
                  { value: QuoteStatus.ACCEPTED, label: 'Accepted' },
                  { value: QuoteStatus.REJECTED, label: 'Rejected' },
                  { value: QuoteStatus.EXPIRED, label: 'Expired' },
                  { value: QuoteStatus.CONVERTED, label: 'Converted' },
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
              <Button onClick={loadQuotes} variant="light">
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

        {/* Quotes Table */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          {!quotes || quotes.length === 0 ? (
            <Text align="center" color="dimmed" py="xl">
              No quotes found
            </Text>
          ) : (
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Valid Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <Text weight={500}>{quote.quote_number}</Text>
                    </td>
                    <td>
                      <div>
                        <Text size="sm" weight={500}>
                          {quote.customer?.first_name} {quote.customer?.last_name}
                        </Text>
                        {quote.customer?.company_name && (
                          <Text size="xs" color="dimmed">
                            {quote.customer.company_name}
                          </Text>
                        )}
                      </div>
                    </td>
                    <td>
                      <Text weight={500}>${quote.total_amount?.toFixed(2)}</Text>
                    </td>
                    <td>
                      <Badge color={getStatusColor(quote.status)} variant="light">
                        {quote.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      <Text size="sm">
                        {new Date(quote.created_at || '').toLocaleDateString()}
                      </Text>
                    </td>
                    <td>
                      <Text size="sm">
                        {quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString() : 'N/A'}
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
                          <Menu.Item 
                            icon={<IconEdit size={14} />}
                            onClick={() => console.log('Edit quote:', quote.id)}
                          >
                            Edit Quote
                          </Menu.Item>
                          <Menu.Divider />
                          {quote.status === QuoteStatus.DRAFT && (
                            <Menu.Item 
                              icon={<IconSend size={14} />}
                              onClick={() => handleUpdateQuoteStatus(quote.id!, QuoteStatus.SENT)}
                            >
                              Send Quote
                            </Menu.Item>
                          )}
                          {quote.status === QuoteStatus.ACCEPTED && (
                            <Menu.Item 
                              icon={<IconFileInvoice size={14} />}
                              onClick={() => handleConvertToOrder(quote.id!)}
                            >
                              Convert to Order
                            </Menu.Item>
                          )}
                          <Menu.Divider />
                          <Menu.Item 
                            icon={<IconTrash size={14} />}
                            color="red"
                            onClick={() => setDeleteModal({ open: true, quote })}
                          >
                            Delete Quote
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
        {totalPages > 1 && (
          <Group position="center">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
            />
          </Group>
        )}
      </Stack>

      {/* Create Quote Modal */}
      <Modal
        opened={createModal}
        onClose={() => setCreateModal(false)}
        title="Create New Quote"
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
            label="Expiry Date"
            placeholder="YYYY-MM-DD"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
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
            <Button onClick={handleCreateQuote}>
              Create Quote
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quote: null })}
        title="Delete Quote"
      >
        <Text mb="md">
          Are you sure you want to delete quote #{deleteModal.quote?.quote_number}? 
          This action cannot be undone.
        </Text>
        <Group position="right">
          <Button 
            variant="light" 
            onClick={() => setDeleteModal({ open: false, quote: null })}
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteQuote}>
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default QuotesPage;
