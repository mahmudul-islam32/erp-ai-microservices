import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Grid,
  Card,
  Text,
  Select,
  TextInput,
  NumberInput,
  Table,
  ActionIcon,
  Breadcrumbs,
  Anchor,
  Alert,
  Stack,
  Loader,
  Center,
  Badge,
  Divider,
  Modal,
  Textarea
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconShoppingCart,
  IconPlus,
  IconTrash,
  IconSearch,
  IconAlertCircle,
  IconCalculator
} from '@tabler/icons-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { salesOrdersApi, customerApi, productsApi } from '../services/salesApi';
import { SalesOrderCreate, OrderItem, Customer, Product, OrderStatus, PaymentStatus } from '../types/sales';

interface OrderFormData extends Omit<SalesOrderCreate, 'line_items'> {
  line_items: (OrderItem & { id: string })[];
}

const SalesOrderCreateEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(orderId);
  const preselectedCustomerId = searchParams.get('customerId');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [productSearchModal, setProductSearchModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: preselectedCustomerId || '',
    line_items: [],
    tax_rate: 0.0875, // 8.75% default tax rate
    discount_amount: 0,
    notes: ''
  });

  const loadCustomers = useCallback(async () => {
    try {
      console.log('Loading customers...');
      setLoadingCustomers(true);
      setError(null); // Clear any previous errors
      const response = await customerApi.getCustomers({ limit: 100 });
      console.log('Customers response:', response);
      
      if (response && response.items) {
        setCustomers(response.items);
        console.log('Customers loaded:', response.items.length);
        console.log('Customer sample:', response.items[0]); // Log first customer for debugging
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        setCustomers(response);
        console.log('Customers loaded (direct array):', response.length);
      } else {
        console.error('Invalid customers response structure:', response);
        setCustomers([]); // Set empty array to prevent errors
        setError('Failed to load customers: Invalid response structure');
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setCustomers([]); // Set empty array to prevent errors
      setError(`Failed to load customers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await productsApi.getProducts({ limit: 100 });
      setProducts(response.items || []);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }, []);

  const loadCustomer = useCallback(async (customerId: string) => {
    try {
      const customer = await customerApi.getCustomer(customerId);
      setSelectedCustomer(customer);
    } catch (err) {
      console.error('Error loading customer:', err);
    }
  }, []);

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const order = await salesOrdersApi.getOrder(orderId!);
      
      setFormData({
        customer_id: order.customer_id,
        line_items: order.line_items.map((item, index) => ({
          ...item,
          id: `item-${index}`
        })),
        tax_rate: order.tax_rate || 0.0875,
        discount_amount: order.discount_amount || 0,
        notes: order.notes || ''
      });

      if (order.customer) {
        setSelectedCustomer(order.customer);
      }
    } catch (err) {
      console.error('Error loading order:', err);
      setError('Failed to load order data');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await loadCustomers();
      await loadProducts();
      
      if (isEdit && orderId) {
        await loadOrder();
      } else if (preselectedCustomerId) {
        await loadCustomer(preselectedCustomerId);
      }
    };
    
    loadData();
  }, [isEdit, orderId, preselectedCustomerId, loadCustomers, loadProducts, loadOrder, loadCustomer]);

  const handleCustomerChange = (customerId: string) => {
    setFormData(prev => ({ ...prev, customer_id: customerId }));
    const customer = customers.find(c => (c.id || c._id) === customerId);
    setSelectedCustomer(customer || null);
    console.log('Selected customer:', customer);
  };

  const addLineItem = (product: Product) => {
    const newItem: OrderItem & { id: string } = {
      id: `item-${Date.now()}`,
      product_id: product._id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: product.price,
      discount_percentage: 0,
      total_price: product.price
    };

    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, newItem]
    }));
    setProductSearchModal(false);
    setProductSearch('');
  };

  const updateLineItem = (itemId: string, field: keyof OrderItem, value: number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate total
          const subtotal = updatedItem.quantity * updatedItem.unit_price;
          const discountAmount = subtotal * (updatedItem.discount_percentage / 100);
          updatedItem.total_price = subtotal - discountAmount;
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeLineItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter(item => item.id !== itemId)
    }));
  };

  // Calculate totals
  const subtotal = formData.line_items.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = formData.discount_amount || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (formData.tax_rate || 0);
  const totalAmount = taxableAmount + taxAmount;

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.customer_id) {
        throw new Error('Please select a customer');
      }
      if (formData.line_items.length === 0) {
        throw new Error('Please add at least one line item');
      }

      // Prepare data
      const orderData: SalesOrderCreate = {
        customer_id: formData.customer_id,
        line_items: formData.line_items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          total_price: item.total_price
        })),
        tax_rate: formData.tax_rate,
        discount_amount: formData.discount_amount,
        notes: formData.notes
      };

      if (isEdit) {
        await salesOrdersApi.updateOrder(orderId!, orderData);
      } else {
        await salesOrdersApi.createOrder(orderData);
      }

      navigate('/dashboard/sales/orders');
    } catch (err: unknown) {
      console.error('Error saving order:', err);
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales', href: '/dashboard/sales' },
    { title: 'Orders', href: '/dashboard/sales/orders' },
    { title: isEdit ? 'Edit Order' : 'New Order', href: '#' }
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

  return (
    <Container size="xl" py="xl">
      <Stack spacing="lg">
        {/* Header */}
        <Group position="apart">
          <div>
            <Breadcrumbs>{breadcrumbItems}</Breadcrumbs>
            <Title order={2} mt="sm">
              <Group spacing="sm">
                <IconShoppingCart size={28} />
                {isEdit ? 'Edit Sales Order' : 'New Sales Order'}
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
            <Button
              leftIcon={<IconDeviceFloppy size={16} />}
              onClick={handleSubmit}
              loading={saving}
              disabled={formData.line_items.length === 0}
            >
              {isEdit ? 'Update Order' : 'Create Order'}
            </Button>
          </Group>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        <Grid>
          {/* Order Form */}
          <Grid.Col md={8}>
            {/* Customer Selection */}
            <Card shadow="sm" p="lg" radius="md" withBorder mb="lg">
              <Title order={4} mb="md">Customer Information</Title>
              <Grid>
                <Grid.Col span={8}>
                  <Select
                    required
                    label="Customer"
                    placeholder={loadingCustomers ? "Loading customers..." : customers.length === 0 ? "No customers available" : "Select a customer"}
                    data={customers.map(c => {
                      const customerId = c.id || c._id || '';
                      const customerLabel = `${c.first_name || ''} ${c.last_name || ''}${c.company_name ? ` (${c.company_name})` : ''}`.trim();
                      
                      if (!customerId) {
                        console.warn('Customer missing ID:', c);
                      }
                      
                      return {
                        value: customerId,
                        label: customerLabel || 'Unnamed Customer'
                      };
                    }).filter(option => option.value)} // Filter out customers without IDs
                    value={formData.customer_id}
                    onChange={(value) => value && handleCustomerChange(value)}
                    searchable
                    disabled={loadingCustomers || customers.length === 0}
                    clearable
                    dropdownPosition="bottom"
                    maxDropdownHeight={300}
                    withinPortal={true}
                    nothingFound="No customers found"
                    error={!loadingCustomers && customers.length === 0 && error ? "Failed to load customers" : undefined}
                    styles={{
                      dropdown: {
                        zIndex: 1000,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button
                    variant="outline"
                    fullWidth
                    mt="lg"
                    onClick={() => navigate('/dashboard/sales/customers/create')}
                  >
                    New Customer
                  </Button>
                  {!loadingCustomers && customers.length === 0 && (
                    <Button
                      variant="subtle"
                      fullWidth
                      mt="xs"
                      size="sm"
                      onClick={loadCustomers}
                    >
                      Retry Loading
                    </Button>
                  )}
                </Grid.Col>
              </Grid>
              
              {selectedCustomer && (
                <Alert mt="md" color="blue">
                  <Text size="sm">
                    <strong>Email:</strong> {selectedCustomer.email}<br />
                    <strong>Phone:</strong> {selectedCustomer.phone}<br />
                    <strong>Payment Terms:</strong> {selectedCustomer.payment_terms.replace('_', ' ').toUpperCase()}
                  </Text>
                </Alert>
              )}
            </Card>

            {/* Line Items */}
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Group position="apart" mb="md">
                <Title order={4}>Order Items</Title>
                <Button
                  leftIcon={<IconPlus size={16} />}
                  onClick={() => setProductSearchModal(true)}
                  disabled={!formData.customer_id}
                >
                  Add Product
                </Button>
              </Group>

              {formData.line_items.length === 0 ? (
                <Center h={200}>
                  <Stack align="center" spacing="sm">
                    <IconShoppingCart size={48} stroke={1} color="gray" />
                    <Text color="dimmed">No items added yet</Text>
                    <Text size="sm" color="dimmed">Select a customer first, then add products to the order</Text>
                  </Stack>
                </Center>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Discount %</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.line_items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div>
                            <Text weight={500}>{item.product_name}</Text>
                            <Text size="sm" color="dimmed">SKU: {item.product_sku}</Text>
                          </div>
                        </td>
                        <td>
                          <NumberInput
                            value={item.quantity}
                            onChange={(value) => updateLineItem(item.id, 'quantity', value || 0)}
                            min={1}
                            style={{ width: 80 }}
                          />
                        </td>
                        <td>
                          <NumberInput
                            value={item.unit_price}
                            onChange={(value) => updateLineItem(item.id, 'unit_price', value || 0)}
                            precision={2}
                            min={0}
                            style={{ width: 100 }}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                            formatter={(value) =>
                              !Number.isNaN(parseFloat(value!))
                                ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                : '$ '
                            }
                          />
                        </td>
                        <td>
                          <NumberInput
                            value={item.discount_percentage}
                            onChange={(value) => updateLineItem(item.id, 'discount_percentage', value || 0)}
                            precision={2}
                            min={0}
                            max={100}
                            style={{ width: 80 }}
                          />
                        </td>
                        <td>
                          <Text weight={500}>${item.total_price.toFixed(2)}</Text>
                        </td>
                        <td>
                          <ActionIcon
                            color="red"
                            onClick={() => removeLineItem(item.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </Grid.Col>

          {/* Order Summary */}
          <Grid.Col md={4}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                <Group spacing="sm">
                  <IconCalculator size={20} />
                  Order Summary
                </Group>
              </Title>
              
              <Stack spacing="sm">
                <Group position="apart">
                  <Text>Subtotal</Text>
                  <Text weight={500}>${subtotal.toFixed(2)}</Text>
                </Group>
                
                <NumberInput
                  label="Order Discount"
                  placeholder="0.00"
                  precision={2}
                  min={0}
                  max={subtotal}
                  value={formData.discount_amount}
                  onChange={(value) => setFormData(prev => ({ ...prev, discount_amount: value || 0 }))}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  formatter={(value) =>
                    !Number.isNaN(parseFloat(value!))
                      ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : '$ '
                  }
                />
                
                <NumberInput
                  label="Tax Rate (%)"
                  placeholder="8.75"
                  precision={4}
                  min={0}
                  max={100}
                  value={(formData.tax_rate || 0) * 100}
                  onChange={(value) => setFormData(prev => ({ ...prev, tax_rate: (value || 0) / 100 }))}
                />
                
                <Divider />
                
                <Group position="apart">
                  <Text>Tax Amount</Text>
                  <Text>${taxAmount.toFixed(2)}</Text>
                </Group>
                
                <Group position="apart">
                  <Text size="lg" weight={700}>Total</Text>
                  <Text size="lg" weight={700}>${totalAmount.toFixed(2)}</Text>
                </Group>
              </Stack>
            </Card>

            {/* Order Notes */}
            <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
              <Title order={5} mb="md">Order Notes</Title>
              <Textarea
                placeholder="Add any special instructions or notes for this order"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                minRows={4}
              />
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* Product Search Modal */}
      <Modal
        opened={productSearchModal}
        onClose={() => setProductSearchModal(false)}
        title="Add Product"
        size="lg"
      >
        <Stack spacing="md">
          <TextInput
            placeholder="Search products by name or SKU..."
            icon={<IconSearch size={16} />}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredProducts.map((product) => (
              <Card
                key={product._id}
                shadow="sm"
                p="sm"
                radius="md"
                withBorder
                mb="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => addLineItem(product)}
              >
                <Group position="apart">
                  <div>
                    <Text weight={500}>{product.name}</Text>
                    <Text size="sm" color="dimmed">SKU: {product.sku}</Text>
                    {product.description && (
                      <Text size="sm" color="dimmed">{product.description}</Text>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text weight={500}>${product.price.toFixed(2)}</Text>
                    <Badge color={product.isActive ? 'green' : 'gray'} size="sm">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </Group>
              </Card>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <Center h={200}>
              <Stack align="center" spacing="sm">
                <Text color="dimmed">No products found</Text>
                <Button size="sm" onClick={() => navigate('/dashboard/inventory/products/create')}>
                  Create New Product
                </Button>
              </Stack>
            </Center>
          )}
        </Stack>
      </Modal>
    </Container>
  );
};

export default SalesOrderCreateEditPage;
