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
import { salesOrdersApi, customerApi } from '../services/salesApi';
import { ProductService, Product as InventoryProduct } from '../services/inventory';
import { paymentsApi } from '../services/paymentApi';
import { SalesOrderCreate, OrderItem, OrderItemCreate, Customer, OrderStatus, PaymentStatus } from '../types/sales';
import { PaymentMethod, PaymentCreate, CashPaymentDetails, CardPaymentDetails, CashPaymentCreate } from '../types/payment';

interface OrderFormData extends Omit<SalesOrderCreate, 'line_items'> {
  line_items: (OrderItem & { id: string; notes?: string })[];
}

interface PaymentFormData {
  processPayment: boolean;
  paymentMethod: PaymentMethod | '';
  cashAmount: number;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
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
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [productSearchModal, setProductSearchModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: preselectedCustomerId || '',
    line_items: [],
    subtotal_discount_amount: 0,
    shipping_cost: 0,
    notes: ''
  });

  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    processPayment: false,
    paymentMethod: '',
    cashAmount: 0,
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
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
      console.log('Loading products from inventory service...');
      setError(null); // Clear any existing errors
      const response = await ProductService.getProducts({ limit: 100, isActive: true });
      console.log('Products response:', response);
      console.log('Response structure keys:', Object.keys(response));
      
      // Handle the inventory service response structure
      const productsData = response.products || response.data || [];
      console.log('Products data extracted:', productsData);
      console.log('Number of products:', productsData.length);
      
      setProducts(productsData);
      console.log('Products state updated successfully');
      
      if (productsData.length === 0) {
        console.warn('No products found! This might be why the product modal is empty.');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      console.error('Error details:', err instanceof Error ? err.message : 'Unknown error');
      if (err instanceof Error && err.message.includes('401')) {
        console.error('Authentication error - user may need to log in');
      }
      setProducts([]);
      setError(`Failed to load products: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        subtotal_discount_amount: order.subtotal_discount_amount || 0,
        shipping_cost: order.shipping_cost || 0,
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

  const addLineItem = (product: InventoryProduct) => {
    const newItem: OrderItem & { id: string; notes?: string } = {
      id: `item-${Date.now()}`,
      product_id: product._id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: product.price,
      discount_percentage: 0,
      total_price: product.price,
      notes: ""
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
  const discountAmount = formData.subtotal_discount_amount || 0;
  const shippingCost = formData.shipping_cost || 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = 0; // Tax will be calculated on the backend
  const totalAmount = taxableAmount + taxAmount + shippingCost;

  // Update cash amount when total changes
  React.useEffect(() => {
    if (paymentData.paymentMethod === PaymentMethod.CASH) {
      setPaymentData(prev => ({ ...prev, cashAmount: totalAmount }));
    }
  }, [totalAmount, paymentData.paymentMethod]);

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

      // Payment validation
      if (paymentData.processPayment) {
        if (!paymentData.paymentMethod) {
          throw new Error('Please select a payment method');
        }
        
        if (paymentData.paymentMethod === PaymentMethod.CASH) {
          if (paymentData.cashAmount < totalAmount) {
            throw new Error('Cash amount must be at least the total amount');
          }
        } else if (paymentData.paymentMethod === PaymentMethod.CREDIT_CARD || 
                   paymentData.paymentMethod === PaymentMethod.DEBIT_CARD) {
          if (!paymentData.cardNumber || !paymentData.expiryMonth || 
              !paymentData.expiryYear || !paymentData.cvv || !paymentData.cardholderName) {
            throw new Error('Please fill in all card details');
          }
        }
      }

      // Prepare order data
      const orderData: SalesOrderCreate = {
        customer_id: formData.customer_id,
        line_items: formData.line_items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percentage, // Convert field name
          discount_amount: 0, // Let backend calculate this
          notes: item.notes || ""
        })),
        subtotal_discount_percent: 0,
        subtotal_discount_amount: formData.subtotal_discount_amount || 0,
        shipping_cost: formData.shipping_cost || 0,
        notes: formData.notes || ""
      };

      let order;
      if (isEdit) {
        order = await salesOrdersApi.updateOrder(orderId!, orderData);
      } else {
        order = await salesOrdersApi.createOrder(orderData);
      }

      // Process payment if requested
      if (paymentData.processPayment && !isEdit) {
        try {
          const orderId = order.id || order._id;
          
          if (paymentData.paymentMethod === PaymentMethod.CASH) {
            const cashPayment: CashPaymentCreate = {
              order_id: orderId,
              customer_id: formData.customer_id,
              amount: totalAmount,
              amount_tendered: paymentData.cashAmount,
              currency: "USD",
              notes: "Cash payment for order"
            };

            await paymentsApi.createCashPayment(cashPayment);
          } else if (paymentData.paymentMethod === PaymentMethod.CREDIT_CARD || 
                     paymentData.paymentMethod === PaymentMethod.DEBIT_CARD) {
            const cardPayment: PaymentCreate = {
              order_id: orderId,
              customer_id: formData.customer_id,
              payment_method: paymentData.paymentMethod,
              amount: totalAmount,
              card_details: {
                last_four_digits: paymentData.cardNumber.slice(-4),
                expiry_month: parseInt(paymentData.expiryMonth),
                expiry_year: parseInt(paymentData.expiryYear),
                cardholder_name: paymentData.cardholderName
              },
              currency: "USD",
              notes: "Card payment for order"
            };

            await paymentsApi.createCardPayment(cardPayment);
          }
        } catch (paymentError) {
          console.error('Payment processing failed:', paymentError);
          // Order was created but payment failed
          setError(`Order created successfully but payment failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}. You can process payment later from the order details.`);
          navigate(`/dashboard/sales/orders/${order.id || order._id}`);
          return;
        }
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

  // Add debugging for filtered products
  console.log('Products state length:', products.length);
  console.log('Filtered products length:', filteredProducts.length);
  console.log('Product search term:', productSearch);

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
              {isEdit 
                ? 'Update Order' 
                : paymentData.processPayment 
                  ? `Create Order & Process Payment ($${totalAmount.toFixed(2)})` 
                  : 'Create Order'
              }
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
                  onClick={() => {
                    console.log('Add Product button clicked');
                    console.log('Current products in state:', products.length);
                    console.log('Sample products:', products.slice(0, 2));
                    setProductSearchModal(true);
                  }}
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
                  value={formData.subtotal_discount_amount}
                  onChange={(value) => setFormData(prev => ({ ...prev, subtotal_discount_amount: value || 0 }))}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  formatter={(value) =>
                    !Number.isNaN(parseFloat(value!))
                      ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : '$ '
                  }
                />
                
                <NumberInput
                  label="Shipping Cost"
                  placeholder="0.00"
                  precision={2}
                  min={0}
                  value={formData.shipping_cost}
                  onChange={(value) => setFormData(prev => ({ ...prev, shipping_cost: value || 0 }))}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  formatter={(value) =>
                    !Number.isNaN(parseFloat(value!))
                      ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : '$ '
                  }
                />
                
                <Text size="sm" color="dimmed" mt="md">
                  Tax will be calculated automatically based on product settings
                </Text>
                
                <Divider />
                
                <Group position="apart">
                  <Text>Discount</Text>
                  <Text>-${discountAmount.toFixed(2)}</Text>
                </Group>
                
                <Group position="apart">
                  <Text>Shipping</Text>
                  <Text>${shippingCost.toFixed(2)}</Text>
                </Group>
                
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

            {/* Payment Section - Only for new orders */}
            {!isEdit && (
              <Card shadow="sm" p="lg" radius="md" withBorder mt="lg">
                <Title order={5} mb="md">Payment Options</Title>
                
                <Stack spacing="md">
                  <div>
                    <input
                      type="checkbox"
                      id="processPayment"
                      checked={paymentData.processPayment}
                      onChange={(e) => setPaymentData(prev => ({ 
                        ...prev, 
                        processPayment: e.target.checked,
                        paymentMethod: e.target.checked ? prev.paymentMethod : ''
                      }))}
                      style={{ marginRight: '8px' }}
                    />
                    <label htmlFor="processPayment" style={{ fontWeight: 500 }}>
                      Process payment immediately
                    </label>
                  </div>
                  
                  {paymentData.processPayment && (
                    <>
                      <Select
                        label="Payment Method"
                        placeholder="Select payment method"
                        required
                        data={[
                          { value: PaymentMethod.CASH, label: 'Cash' },
                          { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card' },
                          { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card' }
                        ]}
                        value={paymentData.paymentMethod}
                        onChange={(value) => setPaymentData(prev => ({ 
                          ...prev, 
                          paymentMethod: value as PaymentMethod || '',
                          cashAmount: value === PaymentMethod.CASH ? totalAmount : 0
                        }))}
                      />
                      
                      {paymentData.paymentMethod === PaymentMethod.CASH && (
                        <div>
                          <NumberInput
                            label="Cash Amount Tendered"
                            placeholder="0.00"
                            precision={2}
                            min={totalAmount}
                            value={paymentData.cashAmount}
                            onChange={(value) => setPaymentData(prev => ({ ...prev, cashAmount: value || 0 }))}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                            formatter={(value) =>
                              !Number.isNaN(parseFloat(value!))
                                ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                : '$ '
                            }
                            required
                          />
                          {paymentData.cashAmount > totalAmount && (
                            <Text size="sm" color="blue" mt="xs">
                              Change: ${(paymentData.cashAmount - totalAmount).toFixed(2)}
                            </Text>
                          )}
                        </div>
                      )}
                      
                      {(paymentData.paymentMethod === PaymentMethod.CREDIT_CARD || 
                        paymentData.paymentMethod === PaymentMethod.DEBIT_CARD) && (
                        <Grid>
                          <Grid.Col span={12}>
                            <TextInput
                              label="Cardholder Name"
                              placeholder="John Doe"
                              value={paymentData.cardholderName}
                              onChange={(e) => setPaymentData(prev => ({ ...prev, cardholderName: e.target.value }))}
                              required
                            />
                          </Grid.Col>
                          <Grid.Col span={12}>
                            <TextInput
                              label="Card Number"
                              placeholder="1234 5678 9012 3456"
                              value={paymentData.cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                if (value.length <= 16 && /^\d*$/.test(value)) {
                                  setPaymentData(prev => ({ ...prev, cardNumber: value }));
                                }
                              }}
                              required
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <Select
                              label="Month"
                              placeholder="MM"
                              data={Array.from({ length: 12 }, (_, i) => ({
                                value: String(i + 1).padStart(2, '0'),
                                label: String(i + 1).padStart(2, '0')
                              }))}
                              value={paymentData.expiryMonth}
                              onChange={(value) => setPaymentData(prev => ({ ...prev, expiryMonth: value || '' }))}
                              required
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <Select
                              label="Year"
                              placeholder="YYYY"
                              data={Array.from({ length: 10 }, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return { value: String(year), label: String(year) };
                              })}
                              value={paymentData.expiryYear}
                              onChange={(value) => setPaymentData(prev => ({ ...prev, expiryYear: value || '' }))}
                              required
                            />
                          </Grid.Col>
                          <Grid.Col span={4}>
                            <TextInput
                              label="CVV"
                              placeholder="123"
                              value={paymentData.cvv}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value.length <= 4 && /^\d*$/.test(value)) {
                                  setPaymentData(prev => ({ ...prev, cvv: value }));
                                }
                              }}
                              required
                            />
                          </Grid.Col>
                        </Grid>
                      )}
                      
                      <Alert color="blue" variant="light">
                        <Text size="sm">
                          Payment will be processed immediately after the order is created.
                          {paymentData.paymentMethod === PaymentMethod.CASH && paymentData.cashAmount > totalAmount && 
                            ` Change of $${(paymentData.cashAmount - totalAmount).toFixed(2)} will be recorded.`
                          }
                        </Text>
                      </Alert>
                    </>
                  )}
                </Stack>
              </Card>
            )}
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
                <Text size="sm" color="dimmed">
                  Total products in state: {products.length} | Search: "{productSearch}"
                </Text>
                <Button size="sm" onClick={() => {
                  console.log('Retrying product load...');
                  loadProducts();
                }}>
                  Reload Products
                </Button>
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
